console.log("COMMON HEADER JS LOADED");

document.addEventListener("DOMContentLoaded", function () {

    console.log("COMMON HEADER DOM READY");

    const page = window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();

    console.log("CURRENT PAGE:", page);

    const userName = document.querySelector(".user-name");
    const userAvatar = document.querySelector(".user-avatar");

    if (page === "qr-generator.html" || page === "store.html") {
        userName.textContent = "Store";
        userAvatar.textContent = "ST";
    }

    else if (
        page === "igqc-testing.html" ||
        page === "igqc-testing-records.html"
    ) {
        userName.textContent = "IGQC";
        userAvatar.textContent = "IG";
    }

    else if (
        page === "chemical-testing.html" ||
        page === "chemical-lab-result.html"
    ) {
        userName.textContent = "Chemical";
        userAvatar.textContent = "CH";
    }

    else if (
        page === "mechanical-testing.html" ||
        page === "mechanical-lab-result.html"
    ) {
        userName.textContent = "Mechanical";
        userAvatar.textContent = "ME";
    }
});