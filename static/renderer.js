var activePage = "MainPage";
var params = "";
var pageDict,page,core;

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
    this.volume = 100;
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
    if ( mcore.queue.length < 1 ) {
      mcore.audio.currentTime = 1e6;
      document.getElementById("musicname").innerText = "Playing: Nothing";
      document.getElementById("controls").style.display = "none";
      if ( activePage == "MusicQueuePage" ) core.openPage("MainPage","");
      return;
    }
    document.getElementById("controls").style.display = "block";
    var source = document.getElementById("musicsrc");
    source.src = __dirname + "/../media/music/" + decodeItAllTheWay(mcore.queue[0]);
    mcore.audio.load();
    mcore.audio.play();
    document.getElementById("musicname").innerText = "Playing: " + decodeItAllTheWay(mcore.queue[0]);
    mcore.queue = mcore.queue.slice(1,mcore.audio.length);
    mcore.playing = true;
    document.getElementById("playpause").innerHTML = mcore.playing ? "||" : "&#9654;";
    if ( activePage == "MusicQueuePage" ) page.render();
  }
  addToQueue(names) {
    this.queue = this.queue.concat(names);
    if ( document.getElementById("musicaudio").ended || this.firstTrigger ) this.playNextSong();
    this.firstTrigger = false;
  }
  togglePlay() {
    this.playing = ! this.playing;
    document.getElementById("playpause").innerHTML = this.playing ? "||" : "&#9654;";
    if ( this.playing ) this.audio.play();
    else this.audio.pause();
  }
  toggleQueuePage() {
    if ( activePage == "MusicQueuePage" ) core.openPage("MainPage","");
    else core.openPage("MusicQueuePage","");
  }
  changeVolume(dv) {
    if ( this.volume + dv < 0 || this.volume + dv > 100 ) return;
    this.volume += dv;
    document.getElementById("volume").innerText = this.volume + "%";
    this.audio.volume = this.volume / 100;
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
  core.renderPage();
  document.getElementById("controls").style.display = "none";
}
