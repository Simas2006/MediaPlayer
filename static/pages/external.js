var fs = require("fs");

class MainPage {
  constructor(params,render) {
    this.static = `
<p class="big">MediaPlayer</p>
<hr />
<br />
<button class="big" onclick='core.openPage("PhotoAlbumPage","")'>Open Photos</button>
<br />
<button class="big" onclick='core.openPage("MusicAlbumPage","")'>Open Music</button>
<br />
<button class="big" onclick='core.openPage("GamePlayPage","YouTube,www.youtube.com")'>Open YouTube</button>
<br />
<button class="big" onclick='core.openPage("GameListPage","")'>Open Games</button>
`;
    render();
  }
}

class MusicQueuePage {
  constructor(params,render) {
    this.render = function() {
      this.renderAll(render);
    }
    this.render();
  }
  renderAll(render) {
    this.static = `
<span class="big">Queue</span>
<button class="musicbutton box red" onclick="queue.clearQueue()">X</button>
<button class="musicbutton" onclick="queue.shuffleSongs()">&#128256;</button>
<hr />
${mcore.queue.length > 0 ? mcore.queue.map((item,index) => {
var songName = decodeURIComponent(decodeURIComponent(item));
songName = songName.split("/")[songName.split("/").length - 1].split(".").slice(0,-1).join(".");
if ( ! isNaN(parseInt(songName.slice(0,2))) ) songName = songName.slice(3);
return `
<p>
  ${songName}
  <br />
  <button class="musicbuttonsmall box" onclick="queue.moveToTop(${index})">&#8673;</button>
  <button class="musicbuttonsmall box" onclick="queue.moveItem(${index},-1)">&uarr;</button>
  <button class="musicbuttonsmall box" onclick="queue.moveItem(${index},1)">&darr;</button>
  <button class="musicbuttonsmall box" onclick="queue.removeItem(${index})">X</button>
  <button class="musicbuttonsmall box" onclick="queue.removeAlbum(${index})">AX</button>
</p>
`}).join("") : `<p>Nothing!</p>`}
`;
    render();
  }
  removeItem(index) {
    mcore.queue = mcore.queue.slice(0,index).concat(mcore.queue.slice(index + 1));
    this.render();
  }
  removeAlbum(index) {
    var albumName = mcore.queue[index].split("/");
    albumName = albumName.slice(0,albumName.length - 1);
    mcore.queue = mcore.queue.filter(item => ! item.startsWith(albumName.join("/")));
    this.render();
  }
  moveItem(index,modifier) {
    var item = mcore.queue[index];
    mcore.queue = mcore.queue.slice(0,index).concat(mcore.queue.slice(index + 1));
    mcore.queue.splice(index + modifier,0,item);
    this.render();
  }
  moveToTop(index) {
    var item = mcore.queue[index];
    mcore.queue = mcore.queue.slice(0,index).concat(mcore.queue.slice(index + 1));
    mcore.queue.splice(0,0,item);
    this.render();
  }
  clearQueue() {
    mcore.queue = [];
    mcore.playNextSong();
    this.render();
  }
  shuffleSongs() {
    for ( var i = mcore.queue.length - 1; i > 0; i-- ) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = mcore.queue[i];
      mcore.queue[i] = mcore.queue[j];
      mcore.queue[j] = temp;
    }
    this.render();
  }
}
