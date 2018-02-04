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
  fs.readFile(__dirname + "/interactions.json",function(err,data) {
    if ( err ) throw err;
    data = JSON.parse(data.toString());
    if ( ! data.allowConnections || userKey ) {
      response.send("err_no_allow_connect");
      return;
    }
    data.sessionStart = true;
    fs.writeFile(__dirname + "/interactions.json",JSON.stringify(data,null,2),function(err) {
      userKey = randomString(32);
      console.log("CONNECT " + userKey);
      response.send(cg.encrypt(userKey,KEY));
    });
  });
});

app.use("/scall",function(request,response) {
  var qs = request.url.split("?").slice(1).join("?");
  fs.readFile(__dirname + "/interactions.json",function(err,data) {
    if ( err ) throw err;
    data = JSON.parse(data.toString());
    if ( ! userKey || ! data.allowConnections ) {
      response.send("err_no_allow_connect");
      userKey = null;
      return;
    }
    qs = cg.decrypt(qs,userKey);
    data.scall = qs;
    fs.writeFile(__dirname + "/interactions.json",JSON.stringify(data,null,2),function(err) {
      response.send("ok");
      console.log("SCALL " + qs);
    });
  });
});

app.get("/end",function(request,response) {
  fs.readFile(__dirname + "/interactions.json",function(err,data) {
    if ( err ) throw err;
    data = JSON.parse(data.toString());
    data.sessionEnd = true;
    fs.writeFile(__dirname + "/interactions.json",JSON.stringify(data,null,2),function(err) {
      userKey = null;
      console.log("END");
      response.send("ok");
    });
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
