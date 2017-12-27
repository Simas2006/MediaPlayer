var fs = require("fs");
var crypto_s = require("crypto");
var request = require("request");
var cg,id,token;
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
    request(URL + "/retrieve" + fpath + "?" + id,function(err,meh,body) {
      if ( err ) throw err;
      var fname = __dirname + "/../loadedData/" + fpath.split("/")[fpath.split("/").length - 1];
      fs.writeFile(fname,cg.decrypt(body,token),function(err) {
        if ( err ) throw err;
        callback(fname);
      });
    });
  }
  retrieveList(fpath,callback) {
    request(URL + "/list" + fpath + "?" + id,function(err,meh,body) {
      if ( err ) throw err;
      callback(cg.decrypt(body,token).toString().split(","));
    });
  }
  clearFile(type,callback) {
    fs.readdir(__dirname + "/../loadedData",function(err,files) {
      if ( err ) throw err;
      var extensions = {
        "photo": ["png","jpg",".gif"],
        "music": ["mp4","m4a",".wav"]
      };
      files = files.filter(item => extensions[type].map(j => item.toLowerCase().endsWith(j) ? "1" : "0").indexOf("1") > -1);
      if ( files.length < 1 ) {
        callback();
      } else {
        fs.unlink(__dirname + "/../loadedData/" + files[0],function(err) {
          if ( err ) throw err;
          callback();
        });
      }
    });
  }
}

class OfflineModeManager {
  attachToken(callback) { callback(); }
  retrieveFile(fpath,callback) { callback(__dirname + "/../media" + fpath); }
  retrieveList(fpath,callback) {
    fs.readdir(__dirname + "/../media" + fpath,function(err,files) {
      if ( err ) throw err;
      var list = files.filter(item => ["png","jpg","gif","mp4","m4a","wav"].map(j => item.endsWith(j) ? "1" : "0").indexOf("1") > -1);
      list = list.concat(files.filter(item => item.indexOf(".") <= -1));
      callback(list);
    });
  }
  clearFile(address,callback) { callback(); }
}

function dataManagerInit() {
  if ( localStorage.getItem("type") == "online" ) dataManager = new OnlineModeManager();
  else if ( localStorage.getItem("type") == "offline" ) dataManager = new OfflineModeManager();
  URL = localStorage.getItem("address");
  if ( ! URL.startsWith("http") ) {
    URL = "http://" + URL;
  }
  KEY = localStorage.getItem("password");
}
