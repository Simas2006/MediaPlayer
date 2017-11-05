var activePage = "MainPage";
var params = "";
var pageDict,page,core;

class CoreAgent {
  renderPage() {
    page = new pageDict[activePage](params);
    var intervalId = setInterval(function() {
      if ( page.static ) {
        document.getElementById("content").innerHTML = page.static;
        clearInterval(intervalId);
      }
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
    MusicAlbumPage
  };
  core = new CoreAgent();
  core.renderPage();
}
