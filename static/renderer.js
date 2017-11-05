var activePage = "MainPage";
var params = "";
var pageDict,page,core;

class CoreAgent {
  renderPage() {
    page = new pageDict[activePage](params,function() {
      setTimeout(function() {
        document.getElementById("content").innerHTML = page.static;
      },10);
    });
  }
  openPage(id,newparams) {
    document.getElementById("content").innerHTML = "";
    activePage = id;
    params = newparams;
    this.renderPage();
  }
}

window.onload = function() {
  pageDict = {
    MainPage,
    MusicAlbumPage,
    MusicListPage
  };
  core = new CoreAgent();
  core.renderPage();
}
