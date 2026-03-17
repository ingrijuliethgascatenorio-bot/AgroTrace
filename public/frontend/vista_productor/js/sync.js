// ═══════════════════════════════════════
// AGROTRACE SYNC MANAGER
// Sincroniza datos cuando vuelve internet
// ═══════════════════════════════════════

async function sincronizarDatos() {

    if (!navigator.onLine) return;

    const datosPendientes = await obtenerPendientes();

    if (!datosPendientes.length) return;

    console.log("Sincronizando datos...");

    for (let item of datosPendientes) {

        try {

            await fetch(item.url, {
                method: item.method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(item.body)
            });

            await eliminarPendiente(item.id);

        } catch (err) {

            console.warn("No se pudo sincronizar", err);
            return;

        }

    }

    console.log("Datos sincronizados");

}

window.addEventListener("online", sincronizarDatos);