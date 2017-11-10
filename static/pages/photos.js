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
${this.files.map((item,index) => `
<img src="${__dirname}/../media/photos/${this.albumName}/${item}" class="inline" onclick="core.openPage('PhotoViewerPage','${this.albumName},${index}')" width="200" height="200" />
`).join("")}
`;
    render();
  }
}

class PhotoViewerPage {
  constructor(params,render) {
    var t = this;
    this.albumName = params.split(",")[0];
    this.index = parseInt(params.split(",")[1]);
    fs.readdir(__dirname + "/../media/photos/" + this.albumName,function(err,files) {
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
<button onclick="core.openPage('PhotoListPage','${this.albumName}')" class="big">${this.albumName}/${this.files[this.index]}</button>
<img src="${__dirname}/../media/photos/${this.albumName}/${this.files[this.index]}" onclick="page.moveImage(1)" />
<div style="text-align: center" class="big">
  <button onclick="page.moveImage(-1)" class="inline">&larr;</button>
  <button onclick="page.moveImage(1)" class="inline">&rarr;</button>
</div>
`;
    render();
  }
  moveImage(modifier) {
    this.index += modifier;
    if ( this.index < 0 ) this.index = this.files.length - 1;
    if ( this.index >= this.files.length ) this.index = 0;
    this.render();
  }
}
