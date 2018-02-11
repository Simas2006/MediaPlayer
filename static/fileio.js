var fs = require("fs");
var crypto_s = require("crypto");
var request = require("request");
var extract = require("extract-zip");
var {spawn} = require("child_process");
var cg,proc;
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
  constructor(lang) {
    this.lang = lang;
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
        "music": ["mp3","m4a",".wav"]
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
        alert(t.lang.sizeTooLarge);
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
  toggleAllowConnections() {
    fs.readFile(__dirname + "/connection_status.txt",function(err,data) {
      if ( err ) throw err;
      data = data.toString() == "yes" ? "no" : "yes";
      fs.writeFile(__dirname + "/connection_status.txt",data,function(err) {
        if ( err ) throw err;
      });
    });
  }
  streamToServer(message,callback) {
    var t = this;
    console.log(message);
    request(this.loginData.streaming.url + "/scall?" + cg.encrypt(message,this.loginData.streaming.token),function(err,meh,body) {
      if ( body == "err_no_allow_connect" ) {
        alert(t.lang.disconnected);
        t.usingStream = false;
        t.changeStreamState(0);
      }
      else callback();
    });
  }
  changeStreamState(customValue) {
    var t = this;
    if ( customValue === undefined ) {
      if ( SSTATE == 0 ) {
        var connectWindow = open(__dirname + "/connect/index.html",this.lang.stream_client.title);
        localStorage.removeItem("stream_url");
        localStorage.removeItem("stream_key");
        localStorage.removeItem("stream_close");
        this.streamGetInterval = setInterval(function() {
          if ( localStorage.getItem("stream_url") ) {
            connectWindow.close();
            t.usingStream = true;
            t.loginData.streaming.url = localStorage.getItem("stream_url");
            request(t.loginData.streaming.url + "/connect",function(err,meh,body) {
              if ( err ) throw err;
              if ( body == "err_no_allow_connect" ) {
                alert(t.lang.no_allow_connect);
                t.changeStreamState(0);
              } else {
                t.loginData.streaming.token = cg.decrypt(body.toString(),localStorage.getItem("stream_key")).toString();
              }
              clearInterval(t.streamGetInterval);
            });
          } else if ( connectWindow.closed || localStorage.getItem("stream_close") ) {
            connectWindow.close();
            clearInterval(t.streamGetInterval);
            t.changeStreamState(0);
          }
        },250);
      } else {
        request(this.loginData.streaming.url + "/end",function(err,meh,body) {
          if ( err ) throw err;
          t.usingStream = false;
        });
      }
    }
    SSTATE = customValue != undefined ? customValue : (SSTATE < 1 ? 1 : SSTATE - 1);
    var text = this.lang.stream_client.matrix;
    document.getElementById("stream_text").innerText = text[SSTATE][0];
    document.getElementById("stream_link").innerText = text[SSTATE][1];
  }
}

class OfflineModeManager {
  constructor(lang) {
    var t = this;
    this.lang = lang;
    this.usingStream = false;
    this.streamPort = null;
    setInterval(function() {
      if ( t.streamPort ) {
        fs.readFile(__dirname + "/../interactions.json",function(err,data) {
          if ( err ) throw err;
          data = JSON.parse(data.toString());
          data.keepAlive = Math.floor(Math.random() * 1e10);
          fs.writeFile(__dirname + "/../interactions.json",JSON.stringify(data,null,2),Function.prototype);
        });
      }
    },1999);
  }
  attachToken(callback) { callback(); }
  retrieveFile(fpath,callback) { callback(APPDATA + "/LocalMedia/" + fpath); }
  retrieveList(fpath,callback) {
    fs.readdir(APPDATA + "/LocalMedia/" + fpath,function(err,files) {
      if ( err ) throw err;
      var list = files.filter(item => ["png","jpg","gif","mp3","m4a","wav"].map(j => item.endsWith(j) ? "1" : "0").indexOf("1") > -1);
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
      if ( SSTATE == 0 && ! proc ) this.createStreamProcess();
      if ( SSTATE == 2 ) {
        request("http://localhost:" + this.streamPort + "/end",function(err,meh,body) {
          if ( err ) throw err;
        });
      } else {
        this.toggleAllowConnections();
      }
    }
    SSTATE = customValue != undefined ? customValue : (SSTATE < 1 ? 1 : SSTATE - 1);
    var text = this.lang.stream_server.matrix;
    document.getElementById("stream_text").innerText = text[SSTATE][0];
    document.getElementById("stream_link").innerText = text[SSTATE][1];
  }
  createStreamProcess() {
    var t = this;
<<<<<<< HEAD
    var connectWindow = open(__dirname + "/connect/index.html?server","Start Streaming");
=======
    var connectWindow = open(__dirname + "/connect/index.html?server",this.lang.stream_server.title);
>>>>>>> 4424b745632ea37f4056ce0a21dff0c0997ebc81
    localStorage.removeItem("stream_url");
    localStorage.removeItem("stream_key");
    localStorage.removeItem("stream_close");
    this.streamGetInterval = setInterval(function() {
      if ( localStorage.getItem("stream_url") ) {
        connectWindow.close();
<<<<<<< HEAD
        t.usingStream = true;
=======
>>>>>>> 4424b745632ea37f4056ce0a21dff0c0997ebc81
        t.streamPort = localStorage.getItem("stream_url");
        proc = spawn("node",[__dirname + "/../internalServer.js",localStorage.getItem("stream_key"),localStorage.getItem("stream_url")]);
        proc.stdout.pipe(fs.createWriteStream(__dirname + "/stream.log"));
        proc.stderr.on("data",function(data) {
          console.log("STREAM_ERR " + data);
        });
        proc.on("close",function(code) {
<<<<<<< HEAD
          alert("The streaming server stopped with code " + (code || 0));
=======
          alert(t.lang.stream_server.stopped + (code || 0));
>>>>>>> 4424b745632ea37f4056ce0a21dff0c0997ebc81
        });
        clearInterval(t.streamGetInterval);
      } else if ( connectWindow.closed || localStorage.getItem("stream_close") ) {
        connectWindow.close();
<<<<<<< HEAD
=======
        t.changeStreamState();
>>>>>>> 4424b745632ea37f4056ce0a21dff0c0997ebc81
        clearInterval(t.streamGetInterval);
      }
    },250);
  }
}

function dataManagerInit(lang) {
  if ( localStorage.getItem("type") == "online" ) {
    dataManager = new OnlineModeManager(lang);
    dataManager.loginData.url = localStorage.getItem("address");
    if ( ! dataManager.loginData.url.startsWith("http") ) {
      dataManager.loginData.url = "http://" + dataManager.loginData.url;
    }
    dataManager.loginData.key = localStorage.getItem("password");
  } else if ( localStorage.getItem("type") == "offline" ) {
<<<<<<< HEAD
    dataManager = new OfflineModeManager();
=======
    dataManager = new OfflineModeManager(lang);
>>>>>>> 4424b745632ea37f4056ce0a21dff0c0997ebc81
  }
}
