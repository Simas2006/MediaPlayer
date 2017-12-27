var activePage = "MainPage";
var params = "";
var pageDict,page,queue;
var core,mcore,dcore;

class CoreAgent {
  constructor() {
    this.queueOpen = false;
  }
  renderPage() {
    page = new pageDict[activePage](params,function() {
      setTimeout(function() {
        document.getElementById("content").innerHTML = page.static;
      },10);
    });
  }
  openPage(id,newparams) {
    document.getElementById("content").innerHTML = "";
    activePage = id;
    params = newparams;
    this.renderPage();
  }
  toggleQueue() {
    this.queueOpen = ! this.queueOpen;
    if ( this.queueOpen ) {
      document.getElementById("queue").style.display = "";
      queue = new MusicQueuePage("",function() {
        setTimeout(function() {
          document.getElementById("queue").innerHTML = queue.static;
        },10);
      });
    } else {
      document.getElementById("queue").style.display = "none";
      queue = null;
    }
  }
}

class MusicCoreAgent {
  constructor() {
    this.queue = [];
    this.firstTrigger = true;
    this.playing = false;
    this.hasSong = false;
    this.volume = 50;
    this.audio = document.getElementById("musicaudio");
    this.audio.addEventListener("ended",this.playNextSong);
  }
  playNextSong() {
    dataManager.clearFile("music",function() {
      if ( mcore.queue.length <= 0 ) {
        mcore.hasSong = false;
        mcore.playing = false;
        mcore.firstTrigger = true;
        mcore.audio.currentTime = 0;
        mcore.audio.pause();
        document.getElementById("musicname").innerText = "Not Playing";
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
        source.src = encodeURI(address);
        mcore.audio.load();
        mcore.audio.play();
        document.getElementById("musicname").innerText = visualSongName;
        mcore.queue = mcore.queue.slice(1,mcore.audio.length);
        mcore.playing = true;
        document.getElementById("playpause").innerHTML = mcore.playing ? "||" : "&#9654;";
        if ( core.queueOpen ) queue.render();
      });
    });
  }
  addToQueue(names) {
    this.hasSong = true;
    this.queue = this.queue.concat(names);
    if ( this.firstTrigger ) this.playNextSong();
    this.firstTrigger = false;
  }
  togglePlay() {
    if ( ! this.hasSong ) return;
    this.playing = ! this.playing;
    document.getElementById("playpause").innerHTML = this.playing ? "||" : "&#9654;";
    if ( this.playing ) this.audio.play();
    else this.audio.pause();
  }
  setTime(nt) {
    if ( ! this.playing ) return;
    this.audio.currentTime = nt;
  }
  mute() {
    this.volume = 0;
    this.audio.volume = 0;
    dcore.drawVolumeSlider();
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
  }
}

window.onerror = function(message,url,line) {
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
  core.renderPage();
  dataManagerInit();
  dataManager.attachToken(Function.prototype);
}
