/* =========================================
   AgroTrace - SYNC ENGINE ENTERPRISE
   FIX v9:
   - API relativa (sin localhost hardcodeado)
   - Manejo de 401/403 (token expirado offline)
   - Sin duplicados: aborta item si backend rechaza con 4xx no-401
   ========================================= */

const AgroSync = (() => {
  // FIX: ruta relativa — funciona en cualquier entorno (local, producción, móvil)
  const API = '/api';

  let syncing = false;

  // ─────────────────────────────
  // UI MESSAGES
  // ─────────────────────────────
  function msg(text, color = '#111') {
    let el = document.getElementById('agro_sync_msg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'agro_sync_msg';
      Object.assign(el.style, {
        position: 'fixed',
        top: '14px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '10px 16px',
        borderRadius: '10px',
        fontSize: '13px',
        fontWeight: '700',
        zIndex: 99999,
        color: '#fff',
        display: 'none',
        fontFamily: 'sans-serif'
      });
      document.body.appendChild(el);
    }
    if (!text) { el.style.display = 'none'; return; }
    el.textContent = text;
    el.style.background = color;
    el.style.display = 'block';
  }

  // ─────────────────────────────
  // TOKEN
  // ─────────────────────────────
  function headers() {
    const token =
      localStorage.getItem('token') ||
      sessionStorage.getItem('token') ||
      '';
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  // ─────────────────────────────
  // ENQUEUE SAFE
  // ─────────────────────────────
  async function encolarCompra(data) {
    await AgroDB.guardarCompraOffline({ ...data, estado: 'pendiente_sync' });
    msg('Compra guardada sin conexión', '#d97706');
  }

  async function encolarVenta(data) {
    await AgroDB.guardarVentaOffline({ ...data, estado: 'pendiente_sync' });
    msg('Venta guardada sin conexión', '#d97706');
  }

  // ─────────────────────────────
  // FIX: manejo de sesión expirada
  // ─────────────────────────────
  function _dispararSesionExpirada() {
    msg('Sesión expirada. Inicia sesión para sincronizar.', '#7c3aed');
    window.dispatchEvent(new CustomEvent('agrotrace:session-expired'));
  }

  // ─────────────────────────────
  // SYNC SAFE (ANTI DUPLICADOS + 401)
  // ─────────────────────────────
  async function sincronizar() {
    if (!navigator.onLine) return;
    if (syncing) return;

    syncing = true;

    try {
      const compras = await AgroDB.obtenerComprasPendientes();
      const ventas  = await AgroDB.obtenerVentasPendientes();
      const total   = compras.length + ventas.length;

      if (!total) { syncing = false; return; }

      msg(`Sincronizando ${total} registros...`, '#2563eb');

      // ── COMPRAS ──
      for (const item of compras) {
        try {
          if (!navigator.onLine) break;

          const res = await fetch(`${API}/operario/registrar-entrega`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify(item)
          });

          if (res.ok) {
            // Éxito: eliminar de la cola
            await AgroDB.eliminarCompraPendiente(item.id);

          } else if (res.status === 401 || res.status === 403) {
            // FIX: token expirado — detener sync, notificar al usuario
            _dispararSesionExpirada();
            syncing = false;
            return;

          } else {
            // Otro error del servidor (400, 500…): loguear pero NO eliminar
            // el item para que se reintente. Si es un 409 (duplicado detectado
            // por el backend con offline_id), sí eliminarlo.
            if (res.status === 409) {
              console.warn('[SYNC] Compra ya existía en servidor (409), eliminando de cola:', item.offlineId);
              await AgroDB.eliminarCompraPendiente(item.id);
            } else {
              console.warn('[SYNC] Compra rechazada por servidor:', res.status, item);
            }
          }

        } catch (e) {
          console.warn('[SYNC COMPRA ERROR]', e);
          break;
        }
      }

      // ── VENTAS ──
      for (const item of ventas) {
        try {
          if (!navigator.onLine) break;

          const res = await fetch(`${API}/operario/registrar-venta`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify(item)
          });

          if (res.ok) {
            await AgroDB.eliminarVentaPendiente(item.id);

          } else if (res.status === 401 || res.status === 403) {
            _dispararSesionExpirada();
            syncing = false;
            return;

          } else {
            if (res.status === 409) {
              console.warn('[SYNC] Venta ya existía en servidor (409), eliminando de cola:', item.offlineId);
              await AgroDB.eliminarVentaPendiente(item.id);
            } else {
              console.warn('[SYNC] Venta rechazada por servidor:', res.status, item);
            }
          }

        } catch (e) {
          console.warn('[SYNC VENTA ERROR]', e);
          break;
        }
      }

      msg('Sincronización completa', '#16a34a');
      setTimeout(() => msg(''), 2500);

      window.dispatchEvent(new CustomEvent('agrotrace:synced', { detail: { ok: true } }));

    } catch (err) {
      console.error('[AGRO SYNC]', err);
      msg('Error al sincronizar', '#dc2626');

    } finally {
      syncing = false;
    }
  }

  // ─────────────────────────────
  // AUTO SYNC
  // ─────────────────────────────
  function iniciarAutoSync() {
    setInterval(() => {
      if (navigator.onLine) sincronizar();
    }, 30000);
  }

  // ─────────────────────────────
  // NETWORK EVENTS
  // ─────────────────────────────
  window.addEventListener('online', () => {
    msg('Conexión restaurada', '#16a34a');
    setTimeout(sincronizar, 1200);
  });

  window.addEventListener('offline', () => {
    msg('Sin conexión', '#dc2626');
  });

  // ─────────────────────────────
  // INIT
  // ─────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    if (!navigator.onLine) msg('Sin conexión', '#dc2626');
    iniciarAutoSync();
  });

  return {
    sincronizar,
    encolarCompra,
    encolarVenta,
    iniciarAutoSync
  };
})();

window.AgroSync = AgroSync;