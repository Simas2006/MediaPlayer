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
      core.openPage("MusicAlbumPage","/" + command.slice(2).join(" "));
      writeResult("ok");
    } else if ( command[1] == "photos" ) {
      if ( command[2] ) core.openPage("PhotoViewerPage",command.slice(2).join(" ") + ",0");
      else core.openPage("PhotoAlbumPage","");
      writeResult("ok");
    } else {
      writeResult("Invalid command");
    }
  } else if ( command[0] == "home" ) {
    core.openPage("MainPage","");
    writeResult("ok");
  } else if ( command[0] == "list" ) {
    if ( activePage == "PhotoAlbumPage" ) {
      dataManager.retrieveList("/photos",function(list) {
        writeResult(`${list.length} entries\n${"```"}\n${list.join("\n")}${"```"}`);
      });
    } else if ( activePage == "PhotoViewerPage" ) {
      dataManager.retrieveList(`/photos/${page.albumName}`,function(list) {
        writeResult(`${list.length} entries\n${"```"}\n${list.map((item,index) => item + (index == page.index ? " √" : "")).join("\n")}${"```"}`);
      });
    } else if ( activePage == "MusicAlbumPage" || activePage == "MusicListPage" ) {
      dataManager.retrieveList(`/music/${params}`,function(list) {
        writeResult(`${list.length} entries\n${"```"}\n${list.map((item,index) => item + (index == page.index ? " √" : "")).join("\n")}${"```"}`);
      });
    }
  }
  if ( activePage == "MusicListPage" ) {
    if ( command[0] == "select" ) {
      var files = page.files.map(item => {
        var songName = decodeURIComponent(decodeURIComponent(item));
        songName = songName.split("/")[songName.split("/").length - 1].split(".").slice(0,-1).join(".");
        if ( ! isNaN(parseInt(songName.slice(0,2))) ) songName = songName.slice(3);
        return songName;
      });
      var indices = command.slice(1).join(" ").split(",").map(item => files.indexOf(item));
      for ( var i = 0; i < indices.length; i++ ) {
        page.toggleItem(encodeURIComponent(page.files[indices[i]]),1);
      }
      writeResult("ok");
    }
  }
}

function writeResult(message) {
  fs.writeFile(__dirname + "/../discord/response",message,function(err) {
    if ( err ) throw err;
  });
}
