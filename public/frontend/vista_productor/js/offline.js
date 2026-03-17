// ═══════════════════════════════════════════════
// AGROTRACE OFFLINE MANAGER
// Detecta conexión a internet
// ═══════════════════════════════════════════════

let estadoConexion = navigator.onLine;

// Crear aviso visual

function crearAvisoOffline() {
    const aviso = document.createElement("div");

    aviso.id = "offline_banner";

    aviso.innerHTML = `
        <span> Sin conexión a internet</span>
    `;

    aviso.style.position = "fixed";
    aviso.style.top = "20px";
    aviso.style.left = "50%";
    aviso.style.transform = "translateX(-50%)";
    aviso.style.background = "#dc2626";
    aviso.style.color = "white";
    aviso.style.padding = "10px 18px";
    aviso.style.borderRadius = "8px";
    aviso.style.fontSize = "14px";
    aviso.style.fontWeight = "600";
    aviso.style.zIndex = "9999";
    aviso.style.boxShadow = "0 6px 18px rgba(0,0,0,.2)";
    aviso.style.display = "none";

    document.body.appendChild(aviso);
}

function mostrarOffline() {

    const banner = document.getElementById("offline_banner");

    if (banner) banner.style.display = "block";

}

function ocultarOffline() {

    const banner = document.getElementById("offline_banner");

    if (banner) banner.style.display = "none";

}

window.addEventListener("offline", () => {

    estadoConexion = false;

    console.warn("AgroTrace → sin internet");

    mostrarOffline();

});


window.addEventListener("online", () => {

    estadoConexion = true;

    console.warn("AgroTrace → conexión restaurada");

    ocultarOffline();

});

// Inicializar
document.addEventListener("DOMContentLoaded", () => {

    crearAvisoOffline();

    if (!navigator.onLine) {

        mostrarOffline();

    }

});