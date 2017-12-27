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
  setInterval(function() {
    if ( document.forms.login.type.value == "online" ) {
      document.getElementById("creddata").style.display = "block";
    } else {
      document.getElementById("creddata").style.display = "none";
    }
  },100);
}
