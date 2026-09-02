document.addEventListener("DOMContentLoaded", function () {
    loadComponent("header-container", "/components/header.html");
    loadComponent("sidebar-container", "/components/sidebar.html");
    loadComponent("footer-container", "/components/footer.html");
});

async function loadComponent(id, url) {
    const container = document.getElementById(id);
    if (!container) return;

    try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error("HTTP " + response.status);
        container.innerHTML = await response.text();

        if (id === "header-container") initializeHeader();
        if (id === "sidebar-container") initializeSidebar();
        if (id === "footer-container") initializeFooter();
    } catch (error) {
        console.error("Component load failed:", url, error);
    }
}

function getCurrentPage() {
    return (window.location.pathname.split("/").pop() || "index.html")
        .replace(/\.html$/i, "")
        .toLowerCase();
}

function getPageTitle() {
    const explicit = document.body.getAttribute("data-page-title");
    if (explicit) return explicit;

    const map = {
        "receive-goods": "Receive Goods",
        "consumption": "Material Consumption",
        "consumption-data": "Material Consumption Data",
        "inbound-history": "Inbound History",
        "qr-generator": "QR Generator"
    };

    return map[getCurrentPage()] || document.title || "MES";
}

function initializeHeader() {
    const title = getPageTitle();

    const titleEl = document.getElementById("headerPageTitle");
    if (titleEl) {
        titleEl.textContent = title;
    }

    // ------------------------------------
    // Hardcoded module user
    // ------------------------------------
    const page = getCurrentPage();

    let username = "Demo User";
    let avatar = "DU";

    // STORE
    if (
        page === "store" ||
        page === "qr-generator"
    ) {
        username = "Store";
        avatar = "ST";
    }

    // IGQC
    else if (
        page === "consumption" ||
        page === "igqc-testing-records"
    ) {
        username = "IGQC";
        avatar = "IG";
    }

    // CHEMICAL
    else if (
        page === "chemical-testing" ||
        page === "chemical-lab-result"
    ) {
        username = "Chemical";
        avatar = "CH";
    }

    // MECHANICAL
    else if (
        page === "mechanical-testing" ||
        page === "mechanical-lab-result"
    ) {
        username = "Mechanical";
        avatar = "ME";
    }

    const userName = document.querySelector(
        "#header-container .user-name"
    );

    const userAvatar = document.querySelector(
        "#header-container .user-avatar"
    );

    if (userName) {
        userName.textContent = username;
    }

    if (userAvatar) {
        userAvatar.textContent = avatar;
    }

    // Clock
    updateClock();

    if (!window.__mesClockStarted) {
        window.__mesClockStarted = true;
        setInterval(updateClock, 1000);
    }
}

function updateClock() {
    const clock = document.getElementById("clock");
    if (!clock) return;

    clock.textContent = new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

function initializeSidebar() {
    const current = getCurrentPage();

    document.querySelectorAll("#sidebar-container .nav-item").forEach(function (item) {
        item.classList.toggle("active", item.dataset.page === current);
    });
}

function initializeFooter() {
    const title = getPageTitle();
    const footerTitle = document.getElementById("footerPageTitle");
    if (footerTitle) footerTitle.textContent = title;
}
