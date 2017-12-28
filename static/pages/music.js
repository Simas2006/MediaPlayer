var fs = require("fs");

class MusicAlbumPage {
  constructor(params,render) {
    var t = this;
    this.lang = core.retrieveLanguage();
    dataManager.retrieveList("/music" + params,function(files) {
      files = files.filter(item => item != ".DS_Store");
      var limits = files.filter(item => item.toLowerCase().endsWith(".mp3") || item.toLowerCase().endsWith(".m4a") || item.toLowerCase().endsWith(".wav"));
      if ( limits.length > 0 ) {
        core.openPage("MusicListPage",params);
      }
      t.static = `
<button onclick="core.openPage('MainPage','')" class="big">${params.slice(1) || t.lang.title} &larr;</button>
<hr />
${files.map(item => "<button onclick='core.openPage(\"MusicAlbumPage\",\"" + params + "/" + item + "\")'>" + item + "</button>").join("<br />")}
`;
      render();
    });
  }
}

class MusicListPage {
  constructor(params,render) {
    var t = this;
    this.lang = core.retrieveLanguage();
    this.albumName = params.slice(1);
    this.selected = [];
    this.selectionText = this.lang.select_all; // inverted from actual case
    dataManager.retrieveList("/music/" + params,function(files) {
      t.files = files.filter(item => item.toLowerCase().endsWith(".mp3") || item.toLowerCase().endsWith(".m4a") || item.toLowerCase().endsWith(".wav"));
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
<button onclick='page.addToQueue()'>${this.lang.queue_add}</button>
<button onclick='page.toggleSelects()'>${this.selectionText}</button>
<hr />
${this.files.map(item => {
  var songName = decodeURIComponent(decodeURIComponent(item));
  songName = songName.split("/")[songName.split("/").length - 1].split(".").slice(0,-1).join(".");
  if ( ! isNaN(parseInt(songName.slice(0,2))) ) songName = songName.slice(3);
  return "<button onclick='page.toggleItem(\"" + escape(item) + "\")'>" + songName + (this.selected.indexOf(escape(item)) > -1 ? "&nbsp;".repeat(10) + "&#10004;" : "") + "</button>"
}).join("<br />")}
`;
    render();
  }
  toggleItem(item) {
    var index = this.selected.indexOf(item);
    if ( index > -1 ) {
      this.selected = this.selected.slice(0,index).concat(this.selected.slice(index + 1));
      this.selectionText = this.lang.select_all;
    } else {
      this.selected.push(item);
    }
    this.render();
  }
  toggleSelects() {
    if ( this.selectionText == this.lang.deselect_all ) {
      this.selected = [];
      this.selectionText = this.lang.select_all;
    } else {
      this.selected = this.files.map(item => escape(item));
      this.selectionText = this.lang.deselect_all;
    }
    this.render();
  }
  addToQueue() {
    mcore.addToQueue(page.selected.map(item => params + "/" + escape(item)));
    core.openPage("MainPage","");
  }
}
