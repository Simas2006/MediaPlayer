var fs = require("fs");
var BIG_PHOTO_DIRS = true;
var RATIO_ACCURACY = 0.05;

class PhotoAlbumPage {
  constructor(params,render) {
    var t = this;
    fs.readdir(__dirname + "/../media/photos",function(err,files) {
      if ( err ) throw err;
      files = files.filter(item => item != ".DS_Store");
      t.static = `
<button onclick="core.openPage('MainPage','')" class="big">Albums &larr;</button>
<hr />
${files.map(item => "<button onclick='core.openPage(\"" + (BIG_PHOTO_DIRS ? "PhotoViewerPage" : "PhotoListPage") + "\",\"" + item + (BIG_PHOTO_DIRS ? ",0" : "") + "\")'>" + item + "</button>").join("<br />")}
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
      t.files = files.filter(item => item.toLowerCase().endsWith(".jpg") || item.toLowerCase().endsWith(".jpeg") || item.toLowerCase().endsWith(".png") || item.toLowerCase().endsWith(".mp4") || item.toLowerCase().endsWith(".mov"));
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
<img src="${item.toLowerCase().endsWith(".jpg") || item.toLowerCase().endsWith(".jpeg") || item.toLowerCase().endsWith(".png") ? `${__dirname}/../media/photos/${this.albumName}/${item}` : `${__dirname}/video.png`}" class="inline" onclick="core.openPage('PhotoViewerPage','${this.albumName},${index}')" width="200" height="200" />
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
    this.slideshow = false;
    setInterval(function() {
      if ( t.slideshow ) t.moveImage(1);
    },5000);
    fs.readdir(__dirname + "/../media/photos/" + this.albumName,function(err,files) {
      if ( err ) throw err;
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
      img.src = __dirname + "/../media/photos/" + this.albumName + "/" + this.files[this.index];
      img.onload = function() {
        var ratio = t.calculateAccurateRatio(img);
        EXIF.getData(img,function() {
          var ovalue = EXIF.getTag(this,"Orientation");
          var rvalue = [0,-1,180,-1,-1,90,-1,270][ovalue - 1];
          text = `<img src="${__dirname}/../media/photos/${t.albumName}/${t.files[t.index]}" style="transform: rotate(${rvalue}deg)" onclick="page.moveImage(1)" width=${img.width * ratio} height=${img.height * ratio} />`;
          mergePath();
        });
      }
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
<button onclick="core.openPage('${BIG_PHOTO_DIRS ? "PhotoAlbumPage" : "PhotoListPage"}','${t.albumName}')" class="big">${t.albumName}/${t.files[t.index]} &larr;</button>
<div class="big">
  <button onclick="page.moveImage(-1)" class="inline">&larr;</button>
  <button onclick="page.moveImage(1)" class="inline">&rarr;</button>
  <button onclick="page.slideshow = ! page.slideshow" class="inline">&#9193;</button>
</div>
<div class="center">
  ${text}
</div>
`;
      render();
    }
  }
  moveImage(modifier) {
    this.index += modifier;
    if ( this.index < 0 ) this.index = this.files.length - 1;
    if ( this.index >= this.files.length ) this.index = 0;
    this.render();
  }
  calculateAccurateRatio(img) {
    for ( var r = 1; r > 0; r -= RATIO_ACCURACY ) {
      if ( img.width * r <= screen.width && img.height * r <= screen.height ) return r;
    }
    throw "Ratio went under 0";
  }
}
