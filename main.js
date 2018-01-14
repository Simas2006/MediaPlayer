const {app,BrowserWindow,globalShortcut,Menu} = require("electron");
const fs = require("fs");
let win

function createWindow() {
  var size = require("electron").screen.getPrimaryDisplay().size;
  win = new BrowserWindow({
    width: size.width,
    height: size.height,
    "nodeIntegration": "iframe",
    webPreferences: {
      webSecurity: false
    }
  });
  win.setMenu(null);
  win.loadURL("file://" + __dirname + "/static/login/index.html");
  //win.webContents.openDevTools();
  win.on("closed", function() {
    win = null;
  });
}

app.on("ready",createWindow);

app.on("window-all-closed",function() {
  if ( process.platform == "darwin" ) {
    app.quit();
  }
});

app.on("activate",function() {
  if ( ! win ) {
    createWindow();
  }
});
