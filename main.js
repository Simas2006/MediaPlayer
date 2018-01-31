var {app,BrowserWindow,globalShortcut,Menu} = require("electron");
var fs = require("fs");
var APPDATA = (process.env.APPDATA || (process.platform == "darwin" ? process.env.HOME + "/Library/Application Support" : "/var/local")) + "/mediaplayer";
var window;

function createWindow() {
  var size = require("electron").screen.getPrimaryDisplay().size;
  window = new BrowserWindow({
    width: size.width,
    height: size.height,
    "nodeIntegration": "iframe",
    webPreferences: {
      webSecurity: false
    }
  });
  window.setMenu(null);
  window.loadURL("file://" + __dirname + "/static/login/index.html");
  //window.webContents.openDevTools();
  window.on("closed", function() {
    window = null;
  });
}

app.on("ready",function() {
  if ( ! fs.existsSync(APPDATA + "/LocalMedia") ) {
    fs.mkdirSync(APPDATA + "/LocalMedia");
    fs.mkdirSync(APPDATA + "/LocalMedia/photos");
    fs.mkdirSync(APPDATA + "/LocalMedia/music");
    fs.writeFileSync(APPDATA + "/LocalMedia/games.txt");
    fs.mkdirSync(APPDATA + "/TempData");
    createWindow();
  } else {
    createWindow();
  }
});

app.on("window-all-closed",function() {
  if ( process.platform == "darwin" ) {
    app.quit();
  }
});

app.on("activate",function() {
  if ( ! window ) {
    createWindow();
  }
});
