var fs = require("fs");

function doLogin() {
  var form = document.forms.login;
  localStorage.setItem("type",form.type.value);
  if ( form.type.value == "online" ) {
    localStorage.setItem("address",form.address.value);
    localStorage.setItem("password",form.password.value);
  }
  location.href = __dirname + "/../index.html";
}

function errorHandling(lang) {
  if ( localStorage.getItem("error") ) {
    var possibleCause = "";
    if ( localStorage.getItem("error").indexOf("bad decrypt") > -1 ) possibleCause = lang.possible_cause.invalid_password;
    else if ( localStorage.getItem("error").indexOf("ECONNREFUSED") > -1 ) possibleCause = lang.possible_cause.refused_connection;
    else if ( localStorage.getItem("error").indexOf("register token") > -1 ) possibleCause = lang.possible_cause.invalid_id;
    else if ( localStorage.getItem("error").indexOf("Arbitrary server") > -1 ) possibleCause = lang.possible_cause.server_error;
    document.getElementById("error").innerText = lang.error_occurred + ":\n" + localStorage.getItem("error") + (possibleCause ? "\n" + lang.cause_message + ": " + possibleCause : "");
    localStorage.removeItem("error");
  }
}

function initLanguages() {
  fs.readdir(__dirname + "/../lang",function(err,files) {
    if ( err ) throw err;
    var select = document.getElementById("language");
    for ( var i = 0; i < files.length; i++ ) {
      var option = document.createElement("option");
      option.value = files[i];
      option.innerText = files[i].replace(".json","");
      select.appendChild(option);
    }
    select.value = localStorage.getItem("language") || "en_us";
  });
}

function changeLanguage() {
  localStorage.setItem("language",document.getElementById("language").value);
  location.reload();
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
    document.getElementById("title").innerText = lang.title;
    document.getElementById("offline_text").innerText = lang.offline;
    document.getElementById("online_text").innerText = lang.online;
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
