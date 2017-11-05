var fs = require("fs");

class MusicAlbumPage {
  constructor(params,render) {
    var t = this;
    fs.readdir(__dirname + "/../media/music",function(err,files) {
      if ( err ) throw err;
      t.static = `
<p class="big">Albums</p>
<hr />
${files.map(item => "<button onclick='core.openPage(\"MusicListPage\",\"" + item + "\")'>" + item + "</button>")}
`;
      render();
    });
  }
}

class MusicListPage {
  constructor(params,render) {
    var t = this;
    t.selected = [];
    t.selectionText = "S";
    fs.readdir(__dirname + "/../media/music/" + params,function(err,files) {
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
<button class="big" onclick="mcore.addToQueue(page.selected);">Add to Queue</button>
<button class="big" onclick="page.toggleSelects()">${this.selectionText}elect All</button>
<hr />
${this.files.map(item => "<button onclick='page.toggleItem(\"" + escape(item) + "\")'>" + item + (this.selected.indexOf(escape(item)) > -1 ? "&nbsp;".repeat(10) + "&#10004;" : "") + "</button>").join("<br />")}
`;
    render();
  }
  toggleItem(item) {
    var index = this.selected.indexOf(item);
    if ( index > -1 ) {
      this.selected = this.selected.slice(0,index).concat(this.selected.slice(index + 1));
      this.selectionText = "S";
    } else {
      this.selected.push(item);
    }
    this.render();
  }
  toggleSelects() {
    if ( this.selectionText == "Des" ) {
      this.selected = [];
      this.selectionText = "S";
    } else {
      this.selected = this.files.map(item => escape(item));
      this.selectionText = "Des";
    }
    this.render();
  }
}
