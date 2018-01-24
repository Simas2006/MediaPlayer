var fs = require("fs");

class GameListPage {
  constructor(params,streamer,render) {
    var t = this;
    this.lang = core.retrieveLanguage();
    dataManager.retrieveFile("/games.txt",function(address) {
      fs.readFile(address,function(err,data) {
        if ( err ) throw err;
        var links = data.toString().trim().split("\n").map(item => item.split(","));
        links.push(["Other","http://www.google.com"]);
        t.static = `
<button class="big" onclick="core.openPage('MainPage','')">${t.lang.title} &larr;</button>
<hr>
${links.map(item => `<button onclick="core.openPage('GamePlayPage','${item.join(",")}')">${item[0]}</button>`).join("<br />")}
`;
        render();
      });
    });
  }
}

class GamePlayPage {
  constructor(params,streamer,render) {
    this.params = params.split(",");
    this.lang = core.retrieveLanguage();
    this.focused = false;
    if ( this.params[1].startsWith("www") ) this.params[1] = "http://" + this.params[1];
    if ( ! this.params[1].startsWith("http") ) this.params[1] = "http://www." + this.params[1];
    if ( mcore.playing ) mcore.togglePlay();
    this.interval = setInterval(function() {
      if ( ! t.focused ) document.getElementById("url").value = document.getElementById("webpage").src;
    },250);
    setTimeout(function() {
      document.getElementById("url").onkeyup = page.onKeyPress;
    },500);
    this.static = `
<button class="big" onclick="page.exitPage()">${this.params[0]} &larr;</button>
<hr />
${dataManager.usingStream() ? `<p>Sorry, streaming game control is not available.</p>` : `
<input type="text" id="url" onfocus="page.focused = true;" onblur="page.focused = false;" />
<webview disablewebsecurity id="webpage" src="${this.params[1]}" style="display:inline-flex; width:${window.screen.width}px; height:${window.screen.height}px"></webview>
`}
`;
    render();
  }
  exitPage() {
    if ( ! mcore.playing ) mcore.togglePlay();
    clearInterval(this.interval);
    core.openPage(this.params[1] == "www.youtube.com" ? "MainPage" : "GameListPage","");
  }
  onKeyPress(event) {
    if ( event.keyCode == 13 ) {
      var url = document.getElementById("url").value;
      if ( url.startsWith("www") ) url = "http://" + url;
      if ( ! url.startsWith("http") ) url = "http://www." + url;
      document.getElementById("webpage").src = url;
      this.focused = false;
    }
  }
}
