var fs = require("fs");

class PhotoAlbumPage {
  constructor(params,render) {
    var t = this;
    fs.readdir(__dirname + "/../media/photos",function(err,files) {
      if ( err ) throw err;
      t.static = `
<button onclick="core.openPage('MainPage','')" class="big">Albums</button>
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
    this.albumName = params;
    fs.readdir(__dirname + "/../media/photos/" + params,function(err,files) {
      if ( err ) throw err;
      t.files = files.filter(item => item.toLowerCase().endsWith(".jpg") || item.toLowerCase().endsWith(".png"));
      t.render = function() {
        t.renderAll(render);
      }
      t.render();
    });
  }
  renderAll(render) {
    this.static = `
<button onclick="core.openPage('PhotoAlbumPage','')" class="big">${params} &larr;</button>
<hr />
${this.files.map(item => `
<img src="${__dirname}/../media/photos/${this.albumName}/${item}" class="inline" onclick="core.openPage('PhotoViewerPage','${item}')" width="200" height="200" />
`).join("")}
`;
    render();
  }
}

class PhotoViewerPage {
  constructor(params,render) {

  }
}
