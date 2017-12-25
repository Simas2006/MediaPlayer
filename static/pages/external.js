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
<p class="big">Queue</p>
<p class="pointer" onclick="queue.clearQueue()">Clear Queue</p>
<p class="pointer" onclick="queue.shuffleSongs()">Shuffle</p>
<hr />
${mcore.queue.length > 0 ? mcore.queue.map((item,index) => `
<p>
  ${decodeURIComponent(decodeURIComponent(item))}
  <button class="inline" onclick="queue.moveItem(${index},-1)">&uarr;</button>
  <button class="inline" onclick="queue.moveItem(${index},1)">&darr;</button>
  <button class="inline" onclick="queue.removeItem(${index})">X</button>
  <button class="inline" onclick="queue.removeAlbum(${index})">AX</button>
`).join("<br />") : `<p>Nothing!</p>`}
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
