var fs = require("fs");
var crypto = require("crypto");
var express = require("express");
var app = express();
var KEY = process.argv[2];
var PORT = process.argv[3] || 8000;
var cg;
var tokens = {};

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

app.get("/connect",function(request,response) {
  var id = randomString(5);
  var key = randomString(30);
  tokens[id] = key;
  console.log("CONNECT " + id + " " + key);
  response.send(id + " " + cg.encrypt(key,KEY));
});

app.use("/retrieve",function(request,response) {
  var qs = request.url.split("?").slice(1).join("?");
  var url = request.url.split("?")[0];
  if ( ! qs ) {
    console.log("INVALID_ID " + qs);
    response.send("invalid_id");
  } else {
    fs.readFile(__dirname + "/media" + decodeURIComponent(url),function(err,data) {
      if ( err ) {
        console.log("ERROR " + err.code);
        response.send("Server error. See log for details.");
        return;
      }
      console.log("GET " + url + " " + qs);
      response.send(cg.encrypt(data,tokens[qs]));
    });
  }
});

app.use("/list",function(request,response) {
  var qs = request.url.split("?").slice(1).join("?");
  var url = request.url.split("?")[0];
  if ( ! qs ) {
    console.log("INVALID_ID " + qs);
    response.send("invalid_id");
  } else {
    fs.readdir(__dirname + "/media" + url,function(err,files) {
      if ( err ) {
        console.log("ERROR " + err.code);
        response.send("Server error. See log for details.");
        return;
      }
      console.log("LIST " + url + " " + qs);
      response.send(cg.encrypt(files.join(","),tokens[qs]));
    });
  }
});

app.listen(PORT,function() {
  console.log("Listening on port " + PORT);
});
