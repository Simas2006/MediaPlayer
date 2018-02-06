var activePage = "MainPage";
var params = "";
var pageDict,page,queue;
var core,mcore,dcore;

class CoreAgent {
  constructor() {
    var t = this;
    this.queueOpen = false;
    fs.readFile(__dirname + "/lang/" + localStorage.getItem("language"),function(err,data) {
      if ( err ) throw err;
      t.langFile = JSON.parse(data.toString());
    });
  }
  renderPage() {
    page = new pageDict[activePage](params,this.streamToServer,function() {
      setTimeout(function() {
        document.getElementById("content").innerHTML = page.static;
      },10);
    });
  }
  openPage(id,newparams) {
    clearInterval(page.interval || 0);
    document.getElementById("content").innerHTML = "";
    activePage = id;
    params = newparams;
    this.streamToServer("change_page");
    this.renderPage();
  }
  toggleQueue() {
    this.streamToServer("toggle_queue","mcore");
    this.queueOpen = ! this.queueOpen;
    if ( this.queueOpen ) {
      document.getElementById("queue").style.display = "";
      queue = new MusicQueuePage("",this.streamToServer,function() {
        setTimeout(function() {
          document.getElementById("queue").innerHTML = queue.static;
        },10);
      });
    } else {
      document.getElementById("queue").style.display = "none";
      queue = null;
    }
  }
  streamToServer(data,selectPage) {
    if ( dataManager.usingStream ) dataManager.streamToServer((selectPage || activePage) + " " + (selectPage ? "" : params) + " " + data,Function.prototype);
  }
  recieveClientStream(instruction) {
    instruction = instruction.split(" ");
    if ( instruction[2] == "change_page" ) {
      this.openPage(instruction[0],instruction[1]);
    } else {
      var data = instruction[2].split("_");
      if ( instruction[0] == "mcore" ) mcore.recieveClientStream(data[0] + "_" + data[1],data.slice(2));
      else page.recieveClientStream(data[0] + "_" + data[1],data.slice(2));
    }
  }
  retrieveLanguage(type) {
    if ( type == "queue" ) return this.langFile["MusicQueuePage"];
    else if ( type == "musicbar" ) return this.langFile["MusicBar"];
    return this.langFile[activePage];
  }
}

class MusicCoreAgent {
  constructor() {
    var t = this;
    this.queue = [];
    this.firstTrigger = true;
    this.playing = false;
    this.waiting = false;
    this.hasSong = false;
    this.volume = 50;
    this.audio = document.getElementById("musicaudio");
    this.audio.addEventListener("ended",function() {
      mcore.waiting = false;
      mcore.playNextSong();
    });
    setInterval(function() {
      mcore.waiting = false;
    },2000);
    setTimeout(function() {
      t.lang = core.retrieveLanguage("musicbar");
      document.getElementById("queuebutton").innerText = t.lang.queue_button;
      document.getElementById("musicname").innerText = t.lang.not_playing;
    },500);
  }
  playNextSong() {
    if ( this.waiting ) return;
    this.waiting = true;
    core.streamToServer("play_nsong","mcore");
    dataManager.clearFile("music",function() {
      if ( mcore.queue.length <= 0 ) {
        mcore.hasSong = false;
        mcore.playing = false;
        mcore.firstTrigger = true;
        mcore.audio.currentTime = 0;
        mcore.audio.pause();
        document.getElementById("musicname").innerText = mcore.lang.not_playing;
        document.getElementById("playpause").innerHTML = "&#9654;";
        document.getElementById("timespent").innerText = "--:--";
        document.getElementById("timeleft").innerText = "--:--";
        return;
      }
      var songName = decodeURIComponent(decodeURIComponent(mcore.queue[0]));
      var visualSongName = songName.split("/")[songName.split("/").length - 1].split(".").slice(0,-1).join(".");
      if ( ! isNaN(parseInt(visualSongName.slice(0,2))) ) visualSongName = visualSongName.slice(3);
      var source = document.getElementById("musicsrc");
      dataManager.retrieveFile("/music/" + songName,function(address) {
        source.src = address;
        mcore.audio.load();
        setTimeout(function() {
          mcore.audio.play();
          mcore.waiting = false;
          document.getElementById("musicname").innerText = visualSongName;
          mcore.queue = mcore.queue.slice(1,mcore.audio.length);
          mcore.playing = true;
          document.getElementById("playpause").innerHTML = mcore.playing ? "||" : "&#9654;";
          if ( core.queueOpen ) queue.render();
        },1000);
      });
    });
  }
  addToQueue(names) {
    this.hasSong = true;
    this.queue = this.queue.concat(names);
    if ( this.firstTrigger ) this.playNextSong();
    this.firstTrigger = false;
    if ( core.queueOpen ) queue.render();
  }
  togglePlay() {
    if ( ! this.hasSong ) return;
    core.streamToServer("toggle_play","mcore");
    this.playing = ! this.playing;
    document.getElementById("playpause").innerHTML = this.playing ? "||" : "&#9654;";
    if ( this.playing ) this.audio.play();
    else this.audio.pause();
  }
  setTime(nt) {
    if ( ! this.playing ) return;
    core.streamToServer("set_time_" + nt,"mcore");
    this.audio.currentTime = nt;
  }
  mute() {
    this.volume = 0;
    this.audio.volume = 0;
    core.streamToServer("set_volume_0","mcore");
    dcore.drawVolumeSlider();
  }
  recieveClientStream(instruction,data) {
    data[0] = parseInt(data[0]) || data[0];
    if ( instruction == "play_nsong" ) this.playNextSong();
    else if ( instruction == "toggle_play" ) this.togglePlay();
    else if ( instruction == "toggle_queue" ) core.toggleQueue();
    else if ( instruction == "set_time" ) this.setTime(data[0]);
    else if ( instruction == "set_volume" ) {
      mcore.volume = parseInt(data);
      mcore.audio.volume = mcore.volume / 100;
      dcore.drawVolumeSlider();
    }
    else if ( instruction == "clear_queue" ) {
      mcore.queue = [];
      mcore.playNextSong();
      if ( queue ) queue.render();
    }
    else if ( instruction == "shuffle_queue" ) {
      data = data.map(item => parseInt(item));
      var result = [];
      for ( var i = 0; i < data.length; i++ ) {
        result.push(mcore.queue[data[i]]);
      }
      mcore.queue = result;
      if ( queue ) queue.render();
    }
    else if ( instruction == "move_item" ) {
      var item = mcore.queue[data[0]];
      mcore.queue = mcore.queue.slice(0,data[0]).concat(mcore.queue.slice(data[0] + 1));
      mcore.queue.splice(data[0] + data[1],0,item);
      if ( queue ) queue.render();
    }
    else if ( instruction == "move_top" ) {
      var item = mcore.queue[data[0]];
      mcore.queue = mcore.queue.slice(0,data[0]).concat(mcore.queue.slice(data[0] + 1));
      mcore.queue.splice(0,0,item);
      if ( queue ) queue.render();
    }
    else if ( instruction == "remove_item" ) {
      mcore.queue = mcore.queue.slice(0,data[0]).concat(mcore.queue.slice(data[0] + 1));
      if ( queue ) queue.render();
    }
    else if ( instruction == "remove_album" ) {
      var albumName = mcore.queue[index].split("/");
      albumName = albumName.slice(0,albumName.length - 1);
      mcore.queue = mcore.queue.filter(item => ! item.startsWith(albumName.join("/")));
      if ( queue ) queue.render();
    }
  }
}

class DrawingCoreAgent {
  constructor() {
    this.volume = document.getElementById("volume");
    this.volume.onclick = this.registerVolumeClick;
    this.time = document.getElementById("time");
    this.time.onclick = this.registerTimeClick;
    this.drawVolumeSlider();
    setInterval(this.drawTimeSlider,10);
  }
  drawVolumeSlider() {
    var canvas = this.volume;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#999";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#f00";
    var x = mcore.volume / 100 * canvas.width;
    ctx.fillRect(x - 5,0,10,canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "30px Copperplate";
    ctx.fillText(mcore.volume + "%",canvas.width * .375,canvas.height * .825);
  }
  registerVolumeClick(event) {
    var rect = this.getBoundingClientRect();
    var x = event.clientX - rect.left;
    mcore.volume = Math.round(x / this.width * 100);
    mcore.audio.volume = mcore.volume / 100;
    core.streamToServer("set_volume_" + mcore.volume,"mcore");
    dcore.drawVolumeSlider();
  }
  drawTimeSlider() {
    var padNumbers = n => n >= 10 ? n.toString() : "0" + n;
    var canvas = this.time;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#999";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#f00";
    if ( ! mcore.hasSong ) return;
    var x = mcore.audio.currentTime / mcore.audio.duration * canvas.width;
    ctx.fillRect(0,0,x,canvas.height);
    if ( ! mcore.audio.duration ) return;
    document.getElementById("timespent").innerText = padNumbers(Math.floor(mcore.audio.currentTime / 60)) + ":" + padNumbers(Math.floor((mcore.audio.currentTime % 60)));
    document.getElementById("timeleft").innerText = "-" + padNumbers(Math.floor((mcore.audio.duration - mcore.audio.currentTime) / 60)) + ":" + padNumbers(Math.floor(((mcore.audio.duration - mcore.audio.currentTime) % 60)));
  }
  registerTimeClick(event) {
    if ( ! mcore.hasSong ) return;
    var rect = this.getBoundingClientRect();
    var x = event.clientX - rect.left;
    mcore.audio.currentTime = x / this.width * mcore.audio.duration;
    core.streamToServer("set_time_" + Math.round(mcore.audio.currentTime),"mcore");
  }
}

window.onerror = function(message,url,line) {
  return;
  localStorage.setItem("error",message + " (" + url + ":" + line + ")");
  location.href = __dirname + "/login/index.html";
}

window.onload = function() {
  pageDict = {
    MainPage,
    MusicAlbumPage,
    MusicListPage,
    PhotoAlbumPage,
    PhotoViewerPage,
    GameListPage,
    GamePlayPage
  };
  core = new CoreAgent();
  mcore = new MusicCoreAgent();
  dcore = new DrawingCoreAgent();
  setTimeout(core.renderPage,500);
  dataManagerInit();
  dataManager.attachToken(Function.prototype);
  dataManager.changeStreamState(0);
  fs.readFile(__dirname + "/../interactions.json",function(err,data) {
    if ( err ) throw err;
    data = JSON.parse(data.toString());
    data.allowConnections = false;
    fs.writeFile(__dirname + "/../interactions.json",JSON.stringify(data,null,2),Function.prototype);
  });
  if ( localStorage.getItem("type") == "offline" ) {
    setInterval(function() {
      fs.readFile(__dirname + "/../interactions.json",function(err,data) {
        if ( err ) throw err;
        data = JSON.parse(data.toString());
        var rewrite = _ => fs.writeFile(__dirname + "/../interactions.json",JSON.stringify(data,null,2),Function.prototype);
        if ( data.scall ) {
          core.recieveClientStream(data.scall);
          data.scall = null;
          rewrite();
        }
        if ( data.sessionEnd || data.sessionStart ) {
          dataManager.changeStreamState(data.sessionEnd ? 1 : 2);
          data.sessionEnd = false;
          data.sessionStart = false;
          rewrite();
        }
      });
    },250);
  }
}
