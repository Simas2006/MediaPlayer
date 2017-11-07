class MainPage {
  constructor(params,render) {
    this.static = `
<p class="big">Welcome!</p>
<hr />
<br />
<button class="big" onclick='core.openPage("PhotoAlbumPage","")'>Open Photos</button>
<br />
<button class="big" onclick='core.openPage("MusicAlbumPage","")'>Open Music</button>
`;
    render();
  }
}
