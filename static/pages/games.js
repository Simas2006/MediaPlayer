var fs = require("fs");

class GameListPage {
  constructor(params,render) {
    var t = this;
    fs.readFile(__dirname + "/../media/games.txt",function(err,data) {
      if ( err ) throw err;
      var links = data.toString().trim().split("\n").map(item => item.split(","));
      t.static = `
<button class="big" onclick="core.openPage('MainPage','')">Games</button>
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
    this.static = `
<button class="big" onclick="core.openPage('GameListPage','')">${params[0]}</button>
<hr />
<iframe src="http://${params[1]}" width="100%" height="${window.screen.height}"></iframe>
`;
    render();
  }
}
