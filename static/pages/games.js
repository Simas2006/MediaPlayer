var fs = require("fs");

class GameListPage {
  constructor(params,render) {
    var t = this;
    fs.readFile(__dirname + "/../media/games.txt",function(err,data) {
      if ( err ) throw err;
      var links = data.toString().trim().split("\n").map(item => item.split(","));
      t.static = `
<button class="big" onclick="core.openPage('MainPage','')">Games &larr;</button>
<hr>
${links.map(item => `<button onclick="core.openPage('GamePlayPage','${item.join(",")}')">${item[0]}</button>`).join("<br />")}
`;
      render();
    });
  }
}

class GamePlayPage {
  constructor(params,render) {
    params = params.split(",");
    mcore.togglePlay();
    this.static = `
<button class="big" onclick="mcore.togglePlay(); core.openPage('${params[1] == "www.youtube.com" ? "MainPage" : "GameListPage"}','')">${params[0]} &larr;</button>
<hr />
<webview disablewebsecurity src="http://${params[1]}" style="display:inline-flex; width:${window.screen.width}px; height:${window.screen.height}px"></webview>
`;
    render();
  }
}
