var fs = require("fs");
var crypto_s = require("crypto");
var request = require("request");
var cg,id,token;
var APPDATA = (process.env.APPDATA || (process.platform == "darwin" ? process.env.HOME + "/Library/Application Support" : "/var/local")) + "/mediaplayer";
var URL,KEY;

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
  attachToken(callback) {
    request(URL + "/connect",function(err,meh,body) {
      if ( err ) throw err;
      var data = body.split(" ");
      data[1] = cg.decrypt(data[1],KEY).toString();
      [id,token] = data;
      callback();
    });
  }
  retrieveFile(fpath,callback) {
    if ( fs.existsSync(APPDATA + "/LocalMedia/" + fpath) ) {
<<<<<<< HEAD
      callback(APPDATA + "/LocalMedia/" + fpath);
=======
      callback(__dirname + "/../media" + fpath);
>>>>>>> 55c1c3f6f098d0cbe78139eec01ebc11ca0a1c4d
    } else {
      request(URL + "/retrieve" + fpath + "?" + id,function(err,meh,body) {
        if ( err ) throw err;
        var fname = APPDATA + "/TempData/" + fpath.split("/")[fpath.split("/").length - 1];
        fs.writeFile(fname,cg.decrypt(body,token),function(err) {
          if ( err ) throw err;
          callback(fname);
        });
      });
    }
  }
  retrieveList(fpath,callback) {
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
        request(URL + "/list" + fpath + "?" + id,function(err,meh,body) {
          if ( err ) throw err;
          var onlineList = [];
          if ( ! body.startsWith("err") ) onlineList = cg.decrypt(body,token).toString().split(",");
          callback(offlineList.concat(onlineList));
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
}

class OfflineModeManager {
  attachToken(callback) { callback(); }
  retrieveFile(fpath,callback) { callback(APPDATA + "/LocalMedia/" + fpath); }
  retrieveList(fpath,callback) {
    fs.readdir(APPDATA + "/LocalMedia/" + fpath,function(err,files) {
      if ( err ) throw err;
      var list = files.filter(item => ["png","jpg","gif","mp4","m4a","wav"].map(j => item.endsWith(j) ? "1" : "0").indexOf("1") > -1);
      list = list.concat(files.filter(item => item.indexOf(".") <= -1));
      callback(list);
    });
  }
  clearFile(address,callback) { callback(); }
}

function dataManagerInit() {
  if ( localStorage.getItem("type") == "online" ) {
    dataManager = new OnlineModeManager();
    URL = localStorage.getItem("address");
    if ( ! URL.startsWith("http") ) {
      URL = "http://" + URL;
    }
    KEY = localStorage.getItem("password");
  }
  else if ( localStorage.getItem("type") == "offline" ) {
    dataManager = new OfflineModeManager();
  }
}
