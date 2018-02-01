var fs = require("fs");
var crypto = require("crypto");
var express = require("express");
var app = express();
var KEY = process.argv[2];
var PORT = process.argv[3] || 8000;
var TIMEOUT = 72 * 60 * 60 * 1000;
var cg;
var userKey;
var disconnected = [];

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

app.get("/connect",function(request,response) {
<<<<<<< HEAD
  fs.readFile(__dirname + "/static/connection_status.txt",function(err,data) {
    if ( err ) throw err;
    if ( data.toString().trim() == "no" || userKey ) {
      response.send("err_no_allow_connect");
      return;
    }
    userKey = randomString(32);
    console.log("CONNECT " + userKey);
    response.send(cg.encrypt(userKey,KEY));
  });
});

app.use("/scall",function(request,response) {
  var qs = request.url.split("?").slice(1).join("?");
  fs.readFile(__dirname + "/static/connection_status.txt",function(err,data) {
    if ( ! userKey || data.toString().trim() == "no" ) {
      response.send("err_no_allow_connect");
      userKey = null;
      return;
    }
    fs.writeFile(__dirname + "/static/scall.txt",cg.decrypt(qs,userKey),function(err,data) {
      if ( err ) throw err;
      console.log("SCALL " + qs);
      response.send("ok");
    });
=======
  var id = randomString(5);
  var key = randomString(32);
  tokens[id] = key;
  console.log("CONNECT " + id + " " + key);
  response.send(id + " " + cg.encrypt(key,KEY));
});

app.use("/scall",function(request,response) {
  var qs = request.url.split("?").slice(1).join("?").split(",");
  fs.writeFile(__dirname + "/static/scall.txt",cg.decrypt(qs[1],tokens[qs[0]]),function(err,data) {
    if ( err ) throw err;
    console.log("SCALL " + qs[0] + " " + qs[1]);
    response.send("ok");
>>>>>>> Merge branch master onto stream-develop
  });
});

app.use(function(err,request,response,next) {
  console.log("ERROR " + err);
  response.send("server_error");
  console.log("Shutting down...");
  process.exit(1);
});

app.listen(PORT,function() {
  console.log("Listening on port " + PORT + ".");
});
