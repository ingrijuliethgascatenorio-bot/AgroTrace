// ═══════════════════════════════════════
// CACHE MANAGER
// Guarda y obtiene datos offline
// ═══════════════════════════════════════

function guardarCache(clave, datos) {

    localStorage.setItem(clave, JSON.stringify(datos));

}

function obtenerCache(clave) {

    const data = localStorage.getItem(clave);

    if (!data) return null;

    return JSON.parse(data);

}

function eliminarCache(clave) {

    localStorage.removeItem(clave);

}