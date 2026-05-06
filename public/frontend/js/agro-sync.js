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
  // UI — Toast usando AgroUX si está disponible,
  //      o banner fijo legacy como fallback
  // ─────────────────────────────
  const _COLOR_TYPE = {
    '#16a34a': 'ok',
    '#2563eb': 'info',
    '#d97706': 'warn',
    '#dc2626': 'error',
    '#7c3aed': 'warn',
  };

  function msg(text, color = '#111', duracion = 4000) {
    if (!text) return;
    if (window.Toast) {
      const tipo   = _COLOR_TYPE[color] || 'info';
      const metodo = { ok: 'ok', warn: 'warn', error: 'error', info: 'info' }[tipo] || 'info';
      window.Toast[metodo](text, 'Sincronización', duracion);
      return;
    }
    // Fallback banner fijo
    let el = document.getElementById('agro_sync_msg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'agro_sync_msg';
      Object.assign(el.style, {
        position: 'fixed', top: '14px', left: '50%',
        transform: 'translateX(-50%)', padding: '10px 16px',
        borderRadius: '10px', fontSize: '13px', fontWeight: '700',
        zIndex: 99999, color: '#fff', display: 'none', fontFamily: 'sans-serif'
      });
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.background = color;
    el.style.display = 'block';
    if (duracion > 0) setTimeout(() => { el.style.display = 'none'; }, duracion);
  }

  // ─────────────────────────────
  // TOKEN
  // ─────────────────────────────
  function headers() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
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
    msg('Compra guardada sin conexión — se enviará al reconectarte', '#d97706', 4000);
  }

  async function encolarVenta(data) {
    await AgroDB.guardarVentaOffline({ ...data, estado: 'pendiente_sync' });
    msg('Venta guardada sin conexión — se enviará al reconectarte', '#d97706', 4000);
  }

  // ─────────────────────────────
  // SESIÓN EXPIRADA
  // ─────────────────────────────
  function _dispararSesionExpirada() {
    msg('Sesión expirada. Inicia sesión para sincronizar.', '#7c3aed', 6000);
    window.dispatchEvent(new CustomEvent('agrotrace:session-expired'));
  }

  // ─────────────────────────────
  // SYNC PRINCIPAL
  // Conteo preciso de éxitos/fallos.
  // Vincula entregas a ruta automáticamente.
  // Emite evento enriquecido al terminar.
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

      // ── Mensaje de inicio con detalle ──────────────────────────────────
      const lblC = compras.length ? `${compras.length} compra${compras.length > 1 ? 's' : ''}` : '';
      const lblV = ventas.length  ? `${ventas.length} venta${ventas.length   > 1 ? 's' : ''}` : '';
      msg(`Sincronizando ${[lblC, lblV].filter(Boolean).join(' y ')}...`, '#2563eb', 0);

      let comprasOk  = 0;
      let ventasOk   = 0;
      let errores    = 0;
      const rutasAVincular = new Set(); // ruta_ids con compras exitosas

      // ── COMPRAS ──────────────────────────────────────────────────────
      for (const item of compras) {
        if (!navigator.onLine) break;
        try {
          const res = await fetch(`${API}/operario/registrar-entrega`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify(item)
          });

          if (res.ok) {
            await AgroDB.eliminarCompraPendiente(item.id);
            comprasOk++;
            if (item.ruta_id) rutasAVincular.add(item.ruta_id);

          } else if (res.status === 401 || res.status === 403) {
            _dispararSesionExpirada();
            syncing = false;
            return;

          } else if (res.status === 409) {
            // Duplicado detectado por backend: quitar de cola, contar como ok
            await AgroDB.eliminarCompraPendiente(item.id);
            comprasOk++;
            if (item.ruta_id) rutasAVincular.add(item.ruta_id);
            console.warn('[SYNC] Compra duplicada (409), eliminada de cola:', item.offlineId);

          } else {
            errores++;
            console.warn('[SYNC] Compra rechazada:', res.status, item);
          }

        } catch (e) {
          errores++;
          console.warn('[SYNC COMPRA ERROR]', e);
          if (!navigator.onLine) break;
        }
      }

      // ── VENTAS ───────────────────────────────────────────────────────
      for (const item of ventas) {
        if (!navigator.onLine) break;
        try {
          const res = await fetch(`${API}/operario/registrar-venta`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify(item)
          });

          if (res.ok) {
            await AgroDB.eliminarVentaPendiente(item.id);
            ventasOk++;

          } else if (res.status === 401 || res.status === 403) {
            _dispararSesionExpirada();
            syncing = false;
            return;

          } else if (res.status === 409) {
            await AgroDB.eliminarVentaPendiente(item.id);
            ventasOk++;
            console.warn('[SYNC] Venta duplicada (409), eliminada de cola:', item.offlineId);

          } else {
            errores++;
            console.warn('[SYNC] Venta rechazada:', res.status, item);
          }

        } catch (e) {
          errores++;
          console.warn('[SYNC VENTA ERROR]', e);
          if (!navigator.onLine) break;
        }
      }

      // ── VINCULAR ENTREGAS A RUTA ──────────────────────────────────────
      // Por cada ruta que recibió compras offline, pedimos al backend
      // que vincule automáticamente las entregas pendientes sin ruta.
      for (const rutaId of rutasAVincular) {
        try {
          await fetch(`${API}/rutas/${rutaId}/vincular-pendientes`, {
            method: 'POST',
            headers: headers(),
          });
          console.info('[SYNC] Entregas vinculadas a ruta', rutaId);
        } catch (e) {
          console.warn('[SYNC] No se pudo vincular ruta', rutaId, e);
        }
      }

      // ── MENSAJE FINAL DETALLADO ───────────────────────────────────────
      const partes = [];
      if (comprasOk > 0) partes.push(`${comprasOk} compra${comprasOk > 1 ? 's' : ''} sincronizada${comprasOk > 1 ? 's' : ''}`);
      if (ventasOk  > 0) partes.push(`${ventasOk} venta${ventasOk   > 1 ? 's' : ''} sincronizada${ventasOk   > 1 ? 's' : ''}`);
      if (errores   > 0) partes.push(`${errores} sin enviar`);

      if (comprasOk + ventasOk > 0) {
        msg(`✓ ${partes.join(' · ')}`, '#16a34a', 6000);
      } else if (errores > 0) {
        msg(`No se pudo sincronizar (${errores} error${errores > 1 ? 'es' : ''})`, '#dc2626', 6000);
      }

      // ── EVENTO PARA QUE vendedor.js REFRESQUE LA RUTA SIN RECARGAR ───
      window.dispatchEvent(new CustomEvent('agrotrace:synced', {
        detail: {
          ok:        comprasOk + ventasOk > 0,
          comprasOk,
          ventasOk,
          errores,
          rutasVinculadas: [...rutasAVincular],
        }
      }));

    } catch (err) {
      console.error('[AGRO SYNC]', err);
      // Solo mostrar toast si hay red — errores de red sin conexión son esperados
      // y ya los muestra el listener 'offline'. Evita toast falso en productor/admin.
      const esErrorRed = /failed to fetch|network/i.test(String(err));
      if (!esErrorRed || navigator.onLine) {
        msg('Error al sincronizar', '#dc2626', 5000);
      }

    } finally {
      syncing = false;
    }
  }

  // ─────────────────────────────
  // AUTO SYNC cada 30 s
  // ─────────────────────────────
  function iniciarAutoSync() {
    setInterval(() => { if (navigator.onLine) sincronizar(); }, 30000);
  }

  // ─────────────────────────────
  // EVENTOS DE RED
  // ─────────────────────────────
  window.addEventListener('online', () => {
    msg('Conexión restaurada — sincronizando...', '#2563eb', 3000);
    setTimeout(sincronizar, 1200);
  });

  window.addEventListener('offline', () => {
    msg('Sin conexión — los datos se guardarán localmente', '#dc2626', 5000);
  });

  // ─────────────────────────────
  // INIT
  // ─────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    if (!navigator.onLine) msg('Sin conexión — modo offline activo', '#dc2626', 5000);
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