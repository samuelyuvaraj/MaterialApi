// Use this script after your existing header HTML.
// It replaces "Demo User" with the username saved by login.js.

(function () {
    const username = localStorage.getItem("mesUsername");
    const userNameElement = document.querySelector(".user-name");
    const avatarElement = document.querySelector(".user-avatar");

    if (username && userNameElement) {
        userNameElement.textContent = username;
    }

    if (username && avatarElement) {
        avatarElement.textContent = username
            .substring(0, 2)
            .toUpperCase();
    }
})();
