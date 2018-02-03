var fs = require("fs");
var crypto_s = require("crypto");
var request = require("request");
var extract = require("extract-zip");
var cg;
var APPDATA = (process.env.APPDATA || (process.platform == "darwin" ? process.env.HOME + "/Library/Application Support" : "/var/local")) + "/mediaplayer";
var SSTATE = 0;

class Cryptographer {
  encrypt(text,key) {
    key = " ".repeat(32 - key.length) + key;
    var iv = crypto_s.randomBytes(16);
    var cipher = crypto_s.createCipheriv("aes-256-cbc",new Buffer(key),iv);
    var encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted,cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  }
  decrypt(text,key) {
    if ( text == "invalid_id" ) throw new Error("Failed to authenticate (using: token)");
    if ( text == "server_error" ) throw new Error("Arbitrary server error");
    if ( text == "timeout_disconnected" ) throw new Error("Gracefully disconnected (timeout)");
    key = " ".repeat(32 - key.length) + key;
    text = text.toString().split(":");
    var iv = new Buffer(text.shift(),"hex");
    var encrypted = new Buffer(text.join(":"),"hex");
    var decipher = crypto_s.createDecipheriv("aes-256-cbc",new Buffer(key),iv);
    var decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted,decipher.final()]);
    return decrypted;
  }
}

cg = new Cryptographer();

class OnlineModeManager {
  constructor() {
    this.usingStream = false;
    this.streamGetInterval = null;
    this.loginData = {
      url: null,
      key: null,
      id: null,
      token: null,
      streaming: {
        url: null,
        token: null
      }
    };
  }
  attachToken(callback) {
    var t = this;
    request(t.loginData.url + "/connect",function(err,meh,body) {
      if ( err ) throw err;
      var data = body.split(" ");
      data[1] = cg.decrypt(data[1],t.loginData.key).toString();
      [t.loginData.id,t.loginData.token] = data;
      callback();
    });
  }
  retrieveFile(fpath,callback) {
    var t = this;
    if ( fs.existsSync(APPDATA + "/LocalMedia/" + fpath) ) {
      callback(APPDATA + "/LocalMedia/" + fpath);
    } else {
      request(t.loginData.url + "/retrieve" + fpath + "?" + t.loginData.id,function(err,meh,body) {
        if ( err ) throw err;
        var fname = APPDATA + "/TempData/" + fpath.split("/")[fpath.split("/").length - 1];
        fs.writeFile(fname,cg.decrypt(body,t.loginData.token),function(err) {
          if ( err ) throw err;
          callback(fname);
        });
      });
    }
  }
  retrieveList(fpath,callback) {
    var t = this;
    fs.readdir(APPDATA + "/LocalMedia/" + fpath,function(err,files) {
      var offlineList = [];
      if ( err ) {
        if ( err.code == "ENOENT" ) merge();
        else throw err;
        return;
      }
      offlineList = files.filter(item => ["png","jpg","gif","mp4","m4a","wav"].map(j => item.endsWith(j) ? "1" : "0").indexOf("1") > -1);
      offlineList = offlineList.concat(files.filter(item => item.indexOf(".") <= -1));
      merge();
      function merge() {
        request(t.loginData.url + "/list" + fpath + "?" + t.loginData.id,function(err,meh,body) {
          if ( err ) throw err;
          var onlineList = [];
          if ( ! body.startsWith("err") ) onlineList = cg.decrypt(body,t.loginData.token).toString().split(",");
          onlineList = onlineList.filter(item => offlineList.indexOf(item) <= -1);
          var list = offlineList.concat(onlineList).sort();
          callback(list,list.map(item => onlineList.indexOf(item) > -1));
        });
      }
    });
  }
  clearFile(type,callback) {
    fs.readdir(APPDATA + "/TempData",function(err,files) {
      if ( err ) throw err;
      var extensions = {
        "photo": ["png","jpg",".gif"],
        "music": ["mp4","m4a",".wav"]
      };
      files = files.filter(item => extensions[type].map(j => item.toLowerCase().endsWith(j) ? "1" : "0").indexOf("1") > -1);
      if ( files.length < 1 ) {
        callback();
      } else {
        fs.unlink(APPDATA + "/TempData/" + files[0],function(err) {
          if ( err ) throw err;
          callback();
        });
      }
    });
  }
  downloadAlbum(album,callback) {
    var t = this;
    request(t.loginData.url + "/zip/photos/" + album + "?" + t.loginData.id,function(err,meh,body) {
      if ( err ) throw err;
      if ( body == "err_too_large" ) {
        alert("This album is too large and cannot be downloaded.");
        callback(true);
        return;
      }
      fs.writeFile(APPDATA + "/TempData/" + album + ".zip",cg.decrypt(body,t.loginData.token),function(err) {
        if ( err ) throw err;
        fs.mkdir(APPDATA + "/LocalMedia/photos/" + album,function(err) {
          if ( err ) throw err;
          extract(APPDATA + "/TempData/" + album + ".zip",{dir:APPDATA + "/LocalMedia/photos/" + album},function(err) {
            if ( err ) throw err;
            callback();
          });
        });
      });
    });
  }
  streamToServer(message,callback) {
    console.log(message);
    request(this.loginData.streaming.url + "/scall?" + cg.encrypt(message,this.loginData.streaming.key),function(err,meh,body) {
      if ( err ) throw err;
      callback();
    });
  }
  changeStreamState(customValue) {
    var t = this;
    if ( customValue === undefined ) {
      if ( SSTATE == 0 ) {
        open(__dirname + "/connect/index.html","Connect to streaming");
        localStorage.removeItem("stream_url");
        localStorage.removeItem("stream_key");
        this.streamGetInterval = setInterval(function() {
          if ( localStorage.getItem("stream_url") ) {
            t.usingStream = true;
            t.loginData.streaming.url = localStorage.getItem("stream_url");
            request(t.loginData.streaming.url + "/connect",function(err,meh,body) {
              if ( err ) throw err;
              t.loginData.streaming.token = cg.decrypt(body.toString(),localStorage.getItem("stream_key")).toString();
              clearInterval(t.streamGetInterval);
            });
          }
        },250);
      } else {
        request(this.loginData.streaming.url + "/end",function(err,meh,body) {
          if ( err ) throw err;
        });
      }
    }
    SSTATE = customValue != undefined ? customValue : (SSTATE < 1 ? 1 : SSTATE - 1);
    var text = [
      ["Not currently controlling device","Start streaming"],
      ["Currently controlling device","Stop streaming"]
    ];
    document.getElementById("stream_text").innerText = text[SSTATE][0];
    document.getElementById("stream_link").innerText = text[SSTATE][1];
  }
}

class OfflineModeManager {
  constructor() {
    this.usingStream = false;
    this.streamData = {
      url: "http://localhost:8001"
    }
  }
  attachToken(callback) { callback(); }
  retrieveFile(fpath,callback) { callback(APPDATA + "/LocalMedia/" + fpath); }
  retrieveList(fpath,callback) {
    fs.readdir(APPDATA + "/LocalMedia/" + fpath,function(err,files) {
      if ( err ) throw err;
      var list = files.filter(item => ["png","jpg","gif","mp4","m4a","wav"].map(j => item.endsWith(j) ? "1" : "0").indexOf("1") > -1);
      list = list.concat(files.filter(item => item.indexOf(".") <= -1));
      callback(list,"0".repeat(list.length).split("").map(item => false));
    });
  }
  clearFile(address,callback) { callback(); }
  toggleAllowConnections() {
    fs.readFile(__dirname + "/../interactions.json",function(err,data) {
      if ( err ) throw err;
      data = JSON.parse(data.toString());
      data.allowConnections = ! data.allowConnections;
      fs.writeFile(__dirname + "/../interactions.json",JSON.stringify(data,null,2),Function.prototype);
    });
  }
  changeStreamState(customValue) {
    if ( customValue === undefined ) {
      if ( SSTATE == 2 ) {
        request(this.streamData.url + "/end",function(err,meh,body) {
          if ( err ) throw err;
        });
      } else {
        this.toggleAllowConnections();
      }
    }
    SSTATE = customValue != undefined ? customValue : (SSTATE < 1 ? 1 : SSTATE - 1);
    var text = [
      ["Not currently listening for connections","Start listening"],
      ["Now listening for connections","Stop listening"],
      ["Person currently controlling computer","End session"]
    ];
    document.getElementById("stream_text").innerText = text[SSTATE][0];
    document.getElementById("stream_link").innerText = text[SSTATE][1];
  }
}

function dataManagerInit() {
  if ( localStorage.getItem("type") == "online" ) {
    dataManager = new OnlineModeManager();
    dataManager.loginData.url = localStorage.getItem("address");
    if ( ! dataManager.loginData.url.startsWith("http") ) {
      dataManager.loginData.url = "http://" + dataManager.loginData.url;
    }
    dataManager.loginData.key = localStorage.getItem("password");
  }
  else if ( localStorage.getItem("type") == "offline" ) {
    dataManager = new OfflineModeManager();
  }
}
