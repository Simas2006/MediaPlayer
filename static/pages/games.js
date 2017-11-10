var fs = require("fs");

class GameListPage {
  constructor(params,render) {
    var t = this;
    fs.readdir(__dirname + "/../media/games",function(err,files) {
      if ( err ) throw err;
      t.static = `
<button class="big" onclick="core.openPage('MainPage','')">Games</button>
<hr>
${files.map(item => `<button onclick="core.openPage('GamePlayPage','${item}')">${item}</button>`).join("<br />")}
`;
      render();
    });
  }
}
