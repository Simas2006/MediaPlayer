var fs = require("fs");
var RATIO_ACCURACY = 0.05;

class PhotoAlbumPage {
  constructor(params,streamer,render) {
    var t = this;
    this.lang = core.retrieveLanguage();
    this.currentDownload = null;
    this.render = function() {
      this.renderAll(render);
    }
    this.render();
  }
  renderAll(render) {
    var t = this;
    dataManager.retrieveList("/photos",function(files,ftypes) {
      t.static = `
<button onclick="core.openPage('MainPage','')" class="big">${t.lang.title} &larr;</button>
<hr />
${files.map((item,index) => `
<button onclick='core.openPage("PhotoViewerPage","${item},0")' class="inline">${item}</button>
${ftypes[index] ? `<button onclick='page.downloadAlbum("${item}")' class="inline">&#10515;</button>` : ""}
`).join("<br />")}
<br />
${t.currentDownload ? `<p>Downloading pictures from album ${t.currentDownload}...</p>` : ""}
`;
      render();
    });
  }
  downloadAlbum(album) {
    var t = this;
    this.currentDownload = album;
    this.render();
    dataManager.downloadAlbum(album,function() {
      t.currentDownload = null;
      t.render();
    });
  }
}

class PhotoViewerPage {
  constructor(params,streamer,render) {
    var t = this;
    this.lang = core.retrieveLanguage();
    this.streamer = streamer;
    this.albumName = params.split(",")[0];
    this.index = parseInt(params.split(",")[1]);
    this.slideshow = false;
    this.addedRotation = 0;
    window.onkeyup = function(event) {
      if ( event.key == "ArrowRight" ) this.moveImage(1);
      else if ( event.key == "ArrowLeft" ) this.moveImage(-1);
    }
    this.interval = setInterval(function() {
      if ( t.slideshow ) t.moveImage(1);
    },5000);
    dataManager.retrieveList("/photos/" + this.albumName,function(files) {
      t.files = files.filter(item => item.toLowerCase().endsWith(".jpg") || item.toLowerCase().endsWith(".jpeg") || item.toLowerCase().endsWith(".png") || item.toLowerCase().endsWith(".mp4") || item.toLowerCase().endsWith(".mov"));
      t.render = function() {
        t.renderAll(render);
      }
      t.render();
    });
  }
  renderAll(render) {
    var t = this;
    var text;
    if ( this.files[this.index].toLowerCase().endsWith(".jpg") || this.files[this.index].toLowerCase().endsWith(".jpeg") || this.files[this.index].toLowerCase().endsWith(".png") ) {
      var img = new Image();
      dataManager.clearFile("photo",function() {
        dataManager.retrieveFile("/photos/" + t.albumName + "/" + t.files[t.index],function(address) {
          img.src = address;
          img.onload = function() {
            var ratio = t.calculateAccurateRatio(img);
            EXIF.getData(img,function() {
              var ovalue = EXIF.getTag(this,"Orientation");
              var rvalue = ([0,-1,180,-1,-1,90,-1,270][ovalue - 1] || 0) + t.addedRotation;
              text = `<img src="${address}" style="transform: rotate(${rvalue}deg)" onclick="page.moveImage(1)" width=${img.width * ratio} height=${img.height * ratio} />`;
              mergePath();
            });
          }
        });
      });
    } else {
      text = `
<video width="100%" controls>
  <source src="${__dirname}/../media/photos/${this.albumName}/${this.files[this.index]}" />
</video>
`;
      mergePath();
    }
    function mergePath() {
      t.static = `
<button onclick="core.openPage('PhotoAlbumPage','${t.albumName}')" class="big">${t.albumName}/${t.files[t.index]} &larr;</button>
<div class="big">
  <button onclick="page.moveImage(-1)" class="inline">&larr;</button>
  <button onclick="page.moveImage(1)" class="inline">&rarr;</button>
  <button onclick="page.slideshow = ! page.slideshow" class="inline">&#9193;</button>
  <button onclick="page.rotate()" class="inline">&#10559;</button>
</div>
<div class="center" style="overflow: hidden">
  ${text}
</div>
`;
      render();
    }
  }
  moveImage(modifier) {
    this.streamer("move_image_" + modifier);
    this.index += modifier;
    if ( this.index < 0 ) this.index = this.files.length - 1;
    if ( this.index >= this.files.length ) this.index = 0;
    this.addedRotation = 0;
    this.render();
  }
  calculateAccurateRatio(img) {
    if ( img.width > screen.width || img.height > screen.height ) {
      for ( var r = 1; r > 0; r -= RATIO_ACCURACY ) {
        if ( img.width * r <= screen.width && img.height * r <= screen.height ) return r;
      }
    } else {
      for ( var r = 1; true; r += RATIO_ACCURACY ) {
        if ( img.width * r > screen.width && img.height * r > screen.height ) return r - RATIO_ACCURACY;
      }
    }
    throw "wat (ratio calculator)";
  }
  rotate() {
    this.streamer("rotate_image");
    this.addedRotation += 90;
    this.render();
  }
  recieveClientStream(instruction,data) {
    if ( instruction == "move_image" ) this.moveImage(parseInt(data[0]));
    else if ( instruction == "rotate_image" ) this.rotate();
  }
}
