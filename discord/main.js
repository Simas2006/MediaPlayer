var fs = require("fs");
var Discord = require("discord.js");
var client = new Discord.Client();

client.on("ready",function() {
  console.log("Bot active");
});

client.on("message",function(message) {
  if ( message.content == "!exit" ) {
    fs.unlink(__dirname + "/active",function(err) {
      process.exit();
    });
  } else if ( message.content.startsWith("!") ) {
    fs.unlink(__dirname + "/response",function(err) {
      fs.writeFile(__dirname + "/instructions",message.content.slice(1),function(err) {
        var interval = setInterval(function() {
          fs.readFile(__dirname + "/response",function(err,data) {
            if ( err ) {
              if ( err.code == "ENOENT" ) return;
              else throw err;
            }
            fs.unlink(__dirname + "/instructions",function(err) {
              if ( err ) throw err;
              message.reply(data.toString().trim());
              clearInterval(interval);
            });
          });
        },100);
      });
    });
  }
});

fs.readFile(__dirname + "/token.txt",function(err,data) {
  if ( err ) throw err;
  fs.writeFile(__dirname + "/active","",function(err) {
    client.login(data.toString().trim());
  })
});
