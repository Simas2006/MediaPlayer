var fs = require("fs");

function doLogin() {
  var url = document.getElementById("address").value;
  if ( ! url.startsWith("http") ) url = "http://" + url;
  localStorage.setItem("stream_key",document.getElementById("password").value);
  localStorage.setItem("stream_url",url);
}

window.onkeypress = function(event) {
  if ( event.keyCode == 13 ) {
    doLogin();
  }
}

window.onload = function() {
  if ( ! localStorage.getItem("language") ) localStorage.setItem("language","en_us.json");
  fs.readFile(__dirname + "/../lang/" + localStorage.getItem("language"),function(err,data) {
    if ( err ) throw err;
    var lang = JSON.parse(data.toString())["LoginPage"];
    document.getElementById("title").innerText = lang.stream_title;
    document.getElementById("ip_text").innerText = lang.ip_address;
    document.getElementById("password_text").innerText = lang.password;
    document.getElementById("login_text").innerText = lang.login_button;
    errorHandling(lang);
    initLanguages();
    document.forms.login.address.value = localStorage.getItem("address");
    setInterval(function() {
      if ( document.forms.login.type.value == "online" ) {
        document.getElementById("creddata").style.display = "block";
      } else {
        document.getElementById("creddata").style.display = "none";
      }
    },100);
  });
}
