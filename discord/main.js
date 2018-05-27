var fs = require("fs");
var Discord = require("discord.js");
var client = new Discord.Client();

client.on("ready",function() {
  console.log("Bot active");
});

client.on("message",function(message) {
  if ( message.content.startsWith("ping") ) {
    message.channel.send("pong!");
  }
});

fs.readFile(__dirname + "/token.txt",function(err,data) {
  if ( err ) throw err;
  client.login(data.toString().trim());
});
