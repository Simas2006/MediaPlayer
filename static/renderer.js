var activePage = "MainPage";
var params = "";
var pageDict,page;
var core,mcore,dcore;

class CoreAgent {
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
    function decodeItAllTheWay(s) {
      for ( var i = 0; i < 10; i++ ) {
        s = decodeURIComponent(s);
      }
      return s;
    }
    if ( mcore.queue.length <= 0 ) {
      mcore.hasSong = false;
      mcore.playing = false;
      mcore.audio.currentTime = 1e6;
      document.getElementById("musicname").innerText = "Not Playing";
      document.getElementById("playpause").innerHTML = "&#9654;";
      document.getElementById("timespent").innerText = "--:--";
      document.getElementById("timeleft").innerText = "--:--";
      if ( activePage == "MusicQueuePage" ) core.openPage("MainPage","");
      return;
    }
    var songName = decodeItAllTheWay(mcore.queue[0]);
    var source = document.getElementById("musicsrc");
    source.src = __dirname + "/../media/music/" + songName;
    mcore.audio.load();
    mcore.audio.play();
    document.getElementById("musicname").innerText = songName.split("/")[songName.split("/").length - 1].split(".").slice(0,-1).join(".");
    mcore.queue = mcore.queue.slice(1,mcore.audio.length);
    mcore.playing = true;
    document.getElementById("playpause").innerHTML = mcore.playing ? "||" : "&#9654;";
    if ( activePage == "MusicQueuePage" ) page.render();
  }
  addToQueue(names) {
    this.hasSong = true;
    this.queue = this.queue.concat(names);
    if ( document.getElementById("musicaudio").ended || this.firstTrigger ) this.playNextSong();
    this.firstTrigger = false;
  }
  togglePlay() {
    if ( ! this.hasSong ) return;
    this.playing = ! this.playing;
    document.getElementById("playpause").innerHTML = this.playing ? "||" : "&#9654;";
    if ( this.playing ) this.audio.play();
    else this.audio.pause();
  }
  toggleQueuePage() {
    if ( activePage == "MusicQueuePage" ) core.openPage("MainPage","");
    else core.openPage("MusicQueuePage","");
  }
  setTime(nt) {
    if ( ! this.playing ) return;
    this.audio.currentTime = nt;
  }
  mute() {
    this.volume = 0;
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
    ctx.font = "30px Arial";
    ctx.fillText(mcore.volume + "%",canvas.width * .375,canvas.height * .825);
  }
  registerVolumeClick(event) {
    var rect = this.getBoundingClientRect();
    var x = event.clientX - rect.left;
    mcore.volume = Math.round(x / this.width * 100);
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
    document.getElementById("timespent").innerText = padNumbers(Math.floor(mcore.audio.currentTime / 60)) + ":" + padNumbers(Math.floor((mcore.audio.currentTime % 60)));
    document.getElementById("timeleft").innerText = "-" + padNumbers(Math.floor((mcore.audio.duration - mcore.audio.currentTime) / 60)) + ":" + padNumbers(Math.floor(((mcore.audio.duration - mcore.audio.currentTime) % 60)));
  }
  registerTimeClick(event) {
    var rect = this.getBoundingClientRect();
    var x = event.clientX - rect.left;
    mcore.audio.currentTime = x / this.width * mcore.audio.duration;
  }
}

window.onload = function() {
  pageDict = {
    MainPage,
    MusicAlbumPage,
    MusicListPage,
    MusicQueuePage,
    PhotoAlbumPage,
    PhotoListPage,
    PhotoViewerPage,
    GameListPage,
    GamePlayPage
  };
  core = new CoreAgent();
  mcore = new MusicCoreAgent();
  dcore = new DrawingCoreAgent();
  core.renderPage();
}
