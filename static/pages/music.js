var fs = require("fs");

class MusicAlbumPage {
  constructor(params,render) {
    var t = this;
    fs.readdir(__dirname + "/../media/music",function(err,files) {
      if ( err ) throw err;
      files = files.filter(item => item != ".DS_Store");
      t.static = `
<button onclick="core.openPage('MainPage','')" class="big">Albums &larr;</button>
<hr />
${files.map(item => "<button onclick='core.openPage(\"MusicListPage\",\"" + item + "\")'>" + item + "</button>").join("<br />")}
`;
      render();
    });
  }
}

class MusicListPage {
  constructor(params,render) {
    var t = this;
    t.albumName = params;
    t.selected = [];
    t.selectionText = "S";
    fs.readdir(__dirname + "/../media/music/" + params,function(err,files) {
      if ( err ) throw err;
      t.files = files.filter(item => item != ".DS_Store");
      t.render = function() {
        t.renderAll(render);
      }
      t.render();
    });
  }
  renderAll(render) {
    this.static = `
<button onclick="core.openPage('MainPage','')" class="big">${this.albumName} &larr;</button>
<hr />
<button onclick='page.addToQueue()'>Add to Queue</button>
<button onclick='page.toggleSelects()'>${this.selectionText}elect All</button>
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
  addToQueue() {
    mcore.addToQueue(page.selected.map(item => params + "/" + escape(item)));
    core.openPage("MainPage","");
  }
}
