var activePage = "main_page";
var pageDict,page,core;

class CoreAgent {
  renderPage() {
    page = new pageDict[activePage]();
    document.getElementById("content").innerHTML = page.static;
  }
  openPage(id) {
    document.getElementById("content").innerHTML = "";
    activePage = id;
    this.renderPage();
  }
}

window.onload = function() {
  pageDict = {
   "main_page": MainPage
  };
  core = new CoreAgent();
  core.renderPage();
}
