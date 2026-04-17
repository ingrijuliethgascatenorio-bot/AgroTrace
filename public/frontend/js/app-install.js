// ─────────────────────────────
// SERVICE WORKER GLOBAL
// ─────────────────────────────
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js")
            .then(() => console.log("SW OK"))
            .catch(err => console.error("SW ERROR:", err));
    });
}

// ─────────────────────────────
// INSTALACIÓN PWA GLOBAL
// ─────────────────────────────
let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;

    const btn = document.getElementById("btnInstalarApp");
    if (btn) btn.style.display = "block";
});

async function instalarApp() {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    console.log("Resultado instalación:", outcome);

    deferredPrompt = null;
}