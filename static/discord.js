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
  if ( command[0] == "goto" ) {
    if ( command[1] == "music" ) {
      function checkPath(fpath,callback,index) {
        if ( ! index ) index = 0;
        dataManager.retrieveList("/music/" + fpath.slice(0,index).join("/"),function(list) {
          if ( list.map(item => item.toLowerCase()).indexOf(fpath[index].toLowerCase()) > -1 ) {
            if ( index + 1 >= fpath.length ) callback(true);
            else checkPath(fpath,callback,index + 1);
          } else {
            callback(false);
          }
        });
      }
      if ( command[2] && command[2].startsWith("/") ) command[2] = command[2].slice(1);
      checkPath(command.slice(2).join(" ").split("/"),function(valid) {
        if ( valid || ! command[2] ) {
          core.openPage("MusicAlbumPage","/" + command.slice(2).join(" "));
          writeResult("Moved to music/" + command.slice(2).join(" "));
        } else {
          writeResult("Couldn't find that album");
        }
      });
    } else if ( command[1] == "photos" ) {
      dataManager.retrieveList("/photos",function(list) {
        if ( list.indexOf(command.slice(2).join(" ")) > -1 || ! command[2] ) {
          if ( command[2] ) core.openPage("PhotoViewerPage",command.slice(2).join(" ") + ",0");
          else core.openPage("PhotoAlbumPage","");
          writeResult("Moved to photos/" + command.slice(2).join(" "));
        } else {
          writeResult("Couldn't find that album");
        }
      });
    } else {
      writeResult("Invalid subcommand");
    }
  } else if ( command[0] == "home" ) {
    core.openPage("MainPage","");
    writeResult("Moved to home");
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
    } else {
      writeResult("Invalid command");
    }
  } else if ( command[0] == "listqueue" || command[0] == "lq" ) {
    writeResult(`${mcore.queue.length} entries\n${"```"}\n${mcore.queue.map((item,index) => {
      var split = item.split("/");
      return `${split[split.length - 2]}: ${decodeURIComponent(split[split.length - 1])} ${index == 0 ? " √" : ""}`;
    }).join("\n")}${"```"}`);
  } else if ( command[0] == "pause" || command[0] == "pp" ) { // TODO: stop if ! mcore.playing
    if ( mcore.hasSong ) {
      mcore.togglePlay();
      writeResult("Music is " + (mcore.playing ? "playing" : "paused"));
    } else {
      writeResult("No song is playing");
    }
  } else if ( command[0] == "playnext" || command[0] == "pn" ) {
    if ( mcore.hasSong ) {
      mcore.playNextSong();
      writeResult("Now playing next song");
    } else {
      writeResult("No song is playing");
    }
  } else if ( command[0] == "openqueue" || command[0] == "oq" ) {
    core.toggleQueue();
    writeResult((queue ? "Opened" : "Closed") + " the queue");
  } else if ( command[0] == "rewind" ) {
    if ( mcore.hasSong ) {
      mcore.setTime(0);
      writeResult("Rewinded song");
    } else {
      writeResult("No song is playing");
    }
  } else if ( command[0] == "volume" ) {
    var value = parseInt(command[1]);
    if ( command[1].toLowerCase() == "up" ) value = Math.min(mcore.volume + 25,100);
    else if ( command[1].toLowerCase() == "down" ) value = Math.max(mcore.volume - 25,0);
    else if ( command[1].toLowerCase() == "mute" ) value = 0;
    if ( isNaN(value) ) {
      writeResult("Invalid value");
      return;
    }
    mcore.volume = value;
    mcore.audio.volume = mcore.volume / 100;
    dcore.drawVolumeSlider();
    writeResult("Set volume to " + value);
  } else if ( command[0] == "remove" ) {
    if ( command[1] != "all" ) {
      var names = mcore.queue.map(item => {
        var songName = decodeURIComponent(decodeURIComponent(item));
        songName = songName.split("/")[songName.split("/").length - 1].split(".").slice(0,-1).join(".");
        if ( ! isNaN(parseInt(songName.slice(0,2))) ) songName = songName.slice(3);
        return decodeURIComponent(songName).toLowerCase();
      });
      var indices = command.slice(1).join(" ").split(",").map(item => names.indexOf(item.toLowerCase().trim()));
      if ( indices.filter(item => item <= -1).length > 0 ) {
        writeResult("Couldn't find that song");
        return;
      }
      for ( var i = 0; i < indices.length; i++ ) {
        if ( indices[i] <= -1 ) continue;
        mcore.queue = mcore.queue.slice(0,indices[i]).concat(mcore.queue.slice(indices[i] + 1));
        indices = indices.map(item => item >= indices[i] ? item - 1 : item);
      }
    } else {
      mcore.queue = [];
    }
    if ( queue ) queue.render();
    writeResult("Removed" + (command[1] != "all" ? "" : " all") + " songs from the queue");
  } else if ( command[0] == "shuffle" ) {
    for ( var i = mcore.queue.length - 1; i > 0; i-- ) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = mcore.queue[i];
      mcore.queue[i] = mcore.queue[j];
      mcore.queue[j] = temp;
    }
    if ( queue ) queue.render();
    writeResult("Shuffled the queue");
  } else if ( command[0] == "move" ) {
    var names = mcore.queue.map(item => {
      var songName = decodeURIComponent(decodeURIComponent(item));
      songName = songName.split("/")[songName.split("/").length - 1].split(".").slice(0,-1).join(".");
      if ( ! isNaN(parseInt(songName.slice(0,2))) ) songName = songName.slice(3);
      return decodeURIComponent(songName).toLowerCase();
    });
    var index = names.indexOf(command.slice(1,-1).join(" ").toLowerCase().trim());
    if ( index <= -1 ) {
      writeResult("Couldn't find that song");
      return;
    }
    if ( ["top","up","down"].indexOf(command[command.length - 1]) <= -1 ) {
      writeResult("Invalid subcommand");
      return;
    }
    var position = [0,index - 1,index + 1][["top","up","down"].indexOf(command[command.length - 1])];
    var item = mcore.queue[index];
    mcore.queue = mcore.queue.slice(0,index).concat(mcore.queue.slice(index + 1));
    mcore.queue.splice(position,0,item);
    if ( queue ) queue.render();
    writeResult("ok");
  }
  if ( activePage == "MusicListPage" ) {
    if ( command[0] == "select" || command[0] == "deselect" ) {
      if ( command[1] != "all" ) {
        var files = page.files.map(item => {
          var songName = decodeURIComponent(decodeURIComponent(item));
          songName = songName.split("/")[songName.split("/").length - 1].split(".").slice(0,-1).join(".");
          if ( ! isNaN(parseInt(songName.slice(0,2))) ) songName = songName.slice(3);
          return songName.toLowerCase();
        });
        var indices = command.slice(1).join(" ").split(",").map(item => files.indexOf(item.trim()));
        if ( indices.filter(item => item <= -1).length > 0 ) {
          writeResult("Couldn't find that song");
          return;
        }
        for ( var i = 0; i < indices.length; i++ ) {
          page.toggleItem(encodeURIComponent(page.files[indices[i]]),["","select","deselect"].indexOf(command[0]));
        }
        writeResult((command[0] == "select" ? "Selected" : "Deselected") + " songs");
      } else {
        if ( command[0] == "select" ) {
          page.selected = page.files.map(item => escape(item));
          page.selectionText = page.lang.deselect_all;
        } else {
          page.selected = [];
          page.selectionText = page.lang.select_all;
        }
        page.render();
        writeResult((command[0] == "select" ? "Selected" : "Deselected") + " all songs");
      }
    } else if ( command[0] == "add" ) {
      page.addToQueue();
      writeResult("Added songs to the queue");
    }
  } else if ( activePage == "PhotoViewerPage" ) {
    if ( command[0] == "forward" || command[0] == "backward" ) {
      var value = parseInt(command[1]) ? parseInt(command[1]) : 1;
      page.moveImage(command[0] == "forward" ? value : -value);
      writeResult("Moved " + command[0] + " " + value + " image(s)");
    } else if ( command[0] == "rotate" ) {
      page.rotate();
      writeResult("Rotated image 90 degrees");
    } else if ( command[0] == "count" ) {
      writeResult(`${page.files[page.index]} is photo #${page.index + 1}/${page.files.length}`);
    }
  }
  if ( ["goto","home","list","select","deselect","add","forward","backward","rotate","count","listqueue","lq","pause","pp","playnext","pn","openqueue","oq","rewind","volume","remove","shuffle","move"].indexOf(command[0]) <= -1 ) writeResult("Invalid command");
}

function writeResult(message) {
  fs.writeFile(__dirname + "/../discord/response",message,function(err) {
    if ( err ) throw err;
  });
}
