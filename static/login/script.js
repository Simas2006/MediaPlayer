function doLogin() {
  var form = document.forms.login;
  localStorage.setItem("type",form.type.value);
  if ( form.type.value == "online" ) {
    localStorage.setItem("address",form.address.value);
    localStorage.setItem("password",form.password.value);
  }
  location.href = __dirname + "/../index.html";
}

window.onload = function() {
  if ( localStorage.getItem("error") ) {
    var possibleCause = "";
    if ( localStorage.getItem("error").indexOf("bad decrypt") > -1 ) possibleCause = "Invalid password";
    else if ( localStorage.getItem("error").indexOf("ECONNREFUSED") > -1 ) possibleCause = "Could not connect to server";
    else if ( localStorage.getItem("error").indexOf("register token") > -1 ) possibleCause = "Server did not recognize computer/Server was reset";
    else if ( localStorage.getItem("error").indexOf("Arbitrary server") > -1 ) possibleCause = "An error occurred with the server/Try reconnecting/Check server log for details";
    document.getElementById("error").innerText = "An error occurred:\n" + localStorage.getItem("error") + (possibleCause ? "\nPossible cause: " + possibleCause : "");
    localStorage.clear();
  }
  setInterval(function() {
    if ( document.forms.login.type.value == "online" ) {
      document.getElementById("creddata").style.display = "block";
    } else {
      document.getElementById("creddata").style.display = "none";
    }
  },100);
}
