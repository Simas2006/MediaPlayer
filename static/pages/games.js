var fs = require("fs");

class GameListPage {
  constructor(params,streamer,render) {
    var t = this;
    this.lang = core.retrieveLanguage();
    dataManager.retrieveFile("/games.txt",function(address) {
      fs.readFile(address,function(err,data) {
        if ( err ) throw err;
        var links = data.toString().trim().split("\n").map(item => item.split(","));
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
    if ( mcore.playing ) mcore.togglePlay();
    this.static = `
<button class="big" onclick="page.exitPage()">${this.params[0]} &larr;</button>
<hr />
${dataManager.usingStream ? `<p>Sorry, streaming game control is not available.</p>` : `<webview disablewebsecurity src="http://${this.params[1]}" style="display:inline-flex; width:${window.screen.width}px; height:${window.screen.height}px"></webview>`}
`;
    render();
  }
  exitPage() {
    if ( ! mcore.playing ) mcore.togglePlay();
    core.openPage(this.params[1] == "www.youtube.com" ? "MainPage" : "GameListPage","");
  }
}
