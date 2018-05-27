var discordActive = true;

function handleDiscordMessages() {
  fs.readFile(__dirname + "/../discord/active",function(err) {
    if ( err ) {
      if ( err.code == "ENOENT" ) return;
      else throw err;
    }
    fs.readFile(__dirname + "/../discord/instructions",function(err,data) {
      if ( err ) {
        if ( err.code == "ENOENT" ) return;
        else throw err;
      }
      var command = data.toString().trim().split(" ");
      handleCommand(command);
    });
  });
}

function handleCommand(command) {
  if ( command[0] == "move" ) {
    if ( command[1] == "music" ) {
      core.openPage("MusicAlbumPage","/" + command.slice(2).join(""));
      writeResult("ok");
    } else if ( command[1] == "photos" ) {

    }
  }
}

function writeResult(message) {
  fs.writeFile(__dirname + "/../discord/response",message,function(err) {
    if ( err ) throw err;
  });
}
