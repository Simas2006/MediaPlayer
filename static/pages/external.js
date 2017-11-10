class MainPage {
  constructor(params,render) {
    this.static = `
<p class="big">MediaPlayer</p>
<hr />
<br />
<button class="big" onclick='core.openPage("PhotoAlbumPage","")'>Open Photos</button>
<br />
<button class="big" onclick='core.openPage("MusicAlbumPage","")'>Open Music</button>
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
<hr />
${mcore.queue.length > 0 ? mcore.queue.map((item,index) => `
<p>
  ${decodeURIComponent(decodeURIComponent(item))}
  <button class="inline" onclick="page.removeItem(${index})">X</button>
  <button class="inline" onclick="page.moveItem(${index},-1)">&uarr;</button>
  <button class="inline" onclick="page.moveItem(${index},1)">&darr;</button>
`).join("<br />") : `<p>Nothing!</p>`}
`;
    render();
  }
  removeItem(index) {
    mcore.queue = mcore.queue.slice(0,index).concat(mcore.queue.slice(index + 1));
    this.render();
  }
  moveItem(index,modifier) {
    var item = mcore.queue[index];
    mcore.queue = mcore.queue.slice(0,index).concat(mcore.queue.slice(index + 1));
    mcore.queue.splice(index + modifier,0,item);
    this.render();
  }
}
