var fs = require("fs");
var crypto = require("crypto");
var request = require("request");
var cg,id,token;
var URL = "http://localhost:8000";
var KEY = "password";

class Cryptographer {
  encrypt(text,key) {
    key = " ".repeat(32 - key.length) + key;
    var iv = crypto.randomBytes(16);
    var cipher = crypto.createCipheriv("aes-256-cbc",new Buffer(key),iv);
    var encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted,cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  }
  decrypt(text,key) {
    key = " ".repeat(32 - key.length) + key;
    text = text.toString().split(":");
    var iv = new Buffer(text.shift(),"hex");
    var encrypted = new Buffer(text.join(":"),"hex");
    var decipher = crypto.createDecipheriv("aes-256-cbc",new Buffer(key),iv);
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
        callback();
      });
    });
  }
  retrieveList(fpath,callback) {
    request(URL + "/list" + fpath + "?" + id,function(err,meh,body) {
      if ( err ) throw err;
      callback(cg.decrypt(body,token).toString().split(","));
    });
  }
}
