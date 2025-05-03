function changeTheme() {
    const darkmode = localStorage.getItem("darkmode");
    if(darkmode == "true") {
        localStorage.setItem("darkmode", "false");
    } else {
        localStorage.setItem("darkmode", "true");
    }
    loadTheme()
}

function loadTheme() {
    const darkmode = localStorage.getItem("darkmode");

    if (darkmode == "true") {
        document.getElementsByTagName("body")[0].style.backgroundColor = "#222";
    } else {
        document.getElementsByTagName("body")[0].style.backgroundColor = "#f2f3f4";
    }
}