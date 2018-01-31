var fs = require("fs");
var crypto = require("crypto");
var zipFolder = require("zip-folder");
var express = require("express");
var app = express();
var KEY = process.argv[2];
var PORT = process.argv[3] || 8000;
var TIMEOUT = 72 * 60 * 60 * 1000;
var APPDATA = (process.env.APPDATA || (process.platform == "darwin" ? process.env.HOME + "/Library/Application Support" : "/var/local")) + "/mediaplayer";
var cg;
var tokens = {};
var disconnected = [];
var standardLoc = __dirname + "/media";

if ( ! KEY ) throw "No key supplied";

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
    return decrypted.toString();
  }
}

cg = new Cryptographer();

function randomString(length) {
  var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var result = "";
  for ( var i = 0; i < length; i++ ) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

app.get("/connect",function(request,response,next) {
  var id = randomString(5);
  var key = randomString(32);
  tokens[id] = {
    key: key,
    timestamp: new Date().getTime()
  };
  console.log("CONNECT " + id + " " + key);
  response.send(id + " " + cg.encrypt(key,KEY));
});

app.use("/retrieve",function(request,response,next) {
  var qs = request.url.split("?").slice(1).join("?");
  var url = decodeURIComponent(request.url.split("?")[0]);
  if ( (! qs) || (! tokens[qs]) ) {
    if ( disconnected.indexOf(qs) > -1 ) {
      var index = disconnected.indexOf(qs);
      disconnected = disconnected.slice(0,index).concat(disconnected.slice(index + 1));
      console.log("GDISCONNCECT " + qs);
      response.send("timeout_disconnected");
    } else {
      console.log("INVALID_ID " + qs);
      response.send("invalid_id");
    }
  } else {
    tokens[qs].timestamp = new Date().getTime();
    fs.readFile(standardLoc + url,function(err,data) {
      if ( err ) {
        next(err);
        return;
      }
      console.log("GET " + url + " " + qs);
      response.send(cg.encrypt(data,tokens[qs].key));
    });
  }
});

app.use("/list",function(request,response,next) {
  var qs = request.url.split("?").slice(1).join("?");
  var url = decodeURIComponent(request.url.split("?")[0]);
  if ( (! qs) || (! tokens[qs]) ) {
    if ( disconnected.indexOf(qs) > -1 ) {
      var index = disconnected.indexOf(qs);
      disconnected = disconnected.slice(0,index).concat(disconnected.slice(index + 1));
      console.log("GDISCONNCECT " + qs);
      response.send("timeout_disconnected");
    } else {
      console.log("INVALID_ID " + qs);
      response.send("invalid_id");
    }
  } else {
    tokens[qs].timestamp = new Date().getTime();
    fs.readdir(standardLoc + url,function(err,files) {
      if ( err ) {
        if ( err.code != "ENOENT" ) next(err);
        else response.send("err_not_found");
        return;
      }
      console.log("LIST " + url + " " + qs);
      var list = files.filter(item => ["png","jpg","gif","mp4","m4a","wav"].map(j => item.toLowerCase().endsWith(j) ? "1" : "0").indexOf("1") > -1);
      list = list.concat(files.filter(item => item.indexOf(".") <= -1));
      response.send(cg.encrypt(list.join(","),tokens[qs].key));
    });
  }
});

app.use("/zip",function(request,response,next) {
  var qs = request.url.split("?").slice(1).join("?");
  var url = decodeURIComponent(request.url.split("?")[0]);
  if ( (! qs) || (! tokens[qs]) ) {
    if ( disconnected.indexOf(qs) > -1 ) {
      var index = disconnected.indexOf(qs);
      disconnected = disconnected.slice(0,index).concat(disconnected.slice(index + 1));
      console.log("GDISCONNCECT " + qs);
      response.send("timeout_disconnected");
    } else {
      console.log("INVALID_ID " + qs);
      response.send("invalid_id");
    }
  } else {
    tokens[qs].timestamp = new Date().getTime();
    zipFolder(standardLoc + url,__dirname + "/temp_zip.zip",function(err) {
      if ( err ) {
        next(err);
        return;
      }
      fs.readFile(__dirname + "/temp_zip.zip",function(err,data) {
        if ( err ) {
          next(err);
          return;
        }
        response.send(cg.encrypt(data,tokens[qs].key));
      });
    });
  }
});

app.use(function(err,request,response,next) {
  console.log("ERROR " + err);
  response.send("server_error");
  console.log("Saving tokens to file (encrypted).");
  fs.writeFile(__dirname + "/tokens.json",cg.encrypt(JSON.stringify(tokens),KEY),function(err) {
    console.log("Restarting.");
    process.exit(1);
  });
});

function attemptLoadTokens(callback) {
  fs.readFile(__dirname + "/tokens.json",function(err,data) {
    if ( err && err.code == "ENOENT" ) {
      console.log("Failed to load previous tokens (if there were any).");
      callback();
      return;
    }
    var text = cg.decrypt(data,KEY);
    tokens = JSON.parse(text);
    console.log("Sucessfully loaded tokens: " + text);
    fs.unlink(__dirname + "/tokens.json",callback);
  });
}

setInterval(function() {
  var keys = Object.keys(tokens);
  for ( var i = 0; i < keys.length; i++ ) {
    if ( ! tokens[keys[i]] ) continue;
    if ( new Date().getTime() - tokens[keys[i]].timestamp >= TIMEOUT ) {
      tokens[keys[i]] = null;
      disconnected.push(keys[i]);
      console.log("TIMEOUT " + keys[i]);
    }
  }
},1000);

attemptLoadTokens(function() {
  if ( fs.existsSync(APPDATA + "/LocalData") ) standardLoc = APPDATA + "/LocalMedia";
  app.listen(PORT,function() {
    console.log("Listening on port " + PORT + ", using media folder " + standardLoc);
  });
});
