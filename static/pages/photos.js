var fs = require("fs");

class PhotoAlbumPage {
  constructor(params,render) {
    var t = this;
    fs.readdir(__dirname + "/../media/photos",function(err,files) {
      if ( err ) throw err;
      t.static = `
<p class="big">Albums</p>
<hr />
${files.map(item => "<button onclick='core.openPage(\"PhotoListPage\",\"" + item + "\")'>" + item + "</button>")}
`;
      render();
    });
  }
}

class PhotoListPage {
  constructor(params,render) {
    var t = this;
    t.albumName = params;
    fs.readdir(__dirname + "/../media/photos/" + params,function(err,files) {
      if ( err ) throw err;
      t.files = files;
      t.render = function() {
        t.renderAll(render);
      }
      t.render();
    });
  }
  renderAll(render) {
    this.static = `
<button onclick="core.openPage('PhotoAlbumPage','') class="big">${params} &larr;</button>
<hr />
${this.files.map(item => `

`)}
`;
    render();
  }
}
