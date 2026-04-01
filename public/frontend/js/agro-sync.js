/* AgroTrace - Sincronizacion Global
   /public/frontend/js/agro-sync.js
   Reemplaza: vista_productor/js/sync.js y offline.js
   Requiere: agro-db.js cargado antes */

const AgroSync = (() => {
  const API = 'http://localhost:3000/api';
  const POLL = 30_000;

  // ── Banner visual ──────────────────────────────────────
  function _banner(texto, color) {
    let el = document.getElementById('agro_offline_banner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'agro_offline_banner';
      Object.assign(el.style, {
        position:'fixed', top:'14px', left:'50%',
        transform:'translateX(-50%)', padding:'9px 20px',
        borderRadius:'10px', fontSize:'13px', fontWeight:'700',
        zIndex:'99999', boxShadow:'0 4px 18px rgba(0,0,0,.18)',
        display:'none', alignItems:'center', gap:'8px',
        fontFamily:'Inter,sans-serif', whiteSpace:'nowrap',
      });
      document.body.appendChild(el);
    }
    if (!texto) { el.style.display = 'none'; return; }
    el.innerHTML        = texto;
    el.style.background = color || '#dc2626';
    el.style.color      = '#fff';
    el.style.display    = 'flex';
  }

  // ── Badge contador ─────────────────────────────────────
  async function _badge() {
    let n = 0;
    try { n = await AgroDB.contarPendientes(); } catch {}
    document.querySelectorAll('[data-agro-badge="pendientes"]').forEach(el => {
      el.textContent   = n;
      el.style.display = n > 0 ? 'inline-flex' : 'none';
    });
    return n;
  }

  // ── Token ──────────────────────────────────────────────
  function _headers() {
    const t = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    return { 'Content-Type':'application/json', ...(t ? { Authorization:`Bearer ${t}` } : {}) };
  }

  // ── Colas offline ──────────────────────────────────────
  async function encolarCompra(payload) {
    await AgroDB.guardarCompraOffline(payload);
    await _badge();
    _banner('\ Sin internet — compra guardada para sincronizar', '#d97706');
  }

  async function encolarVenta(payload) {
    await AgroDB.guardarVentaOffline(payload);
    await _badge();
    _banner('\ Sin internet — venta guardada para sincronizar', '#d97706');
  }

  // ── Sincronizar ────────────────────────────────────────
  async function _sincCompras() {
    const lista = await AgroDB.obtenerComprasPendientes();
    let ok = 0;
    for (const item of lista) {
      try {
        const r = await fetch(`${API}/operario/registrar-entrega`, {
          method: 'POST', headers: _headers(), body: JSON.stringify(item),
        });
        if (r.ok) { await AgroDB.eliminarCompraPendiente(item.id); ok++; }
      } catch { if (!navigator.onLine) break; }
    }
    return ok;
  }

  async function _sincVentas() {
    const lista = await AgroDB.obtenerVentasPendientes();
    let ok = 0;
    for (const item of lista) {
      try {
        const r = await fetch(`${API}/operario/registrar-venta`, {
          method: 'POST', headers: _headers(), body: JSON.stringify(item),
        });
        if (r.ok) { await AgroDB.eliminarVentaPendiente(item.id); ok++; }
      } catch { if (!navigator.onLine) break; }
    }
    return ok;
  }

  async function sincronizar() {
    if (!navigator.onLine) return;
    if (await AgroDB.contarPendientes() === 0) return;

    _banner('🔄 Sincronizando datos...', '#2563eb');
    try {
      const [c, v] = await Promise.all([_sincCompras(), _sincVentas()]);
      await _badge();
      const total = c + v;
      if (total > 0) {
        _banner(`✅ ${total} registro(s) sincronizado(s)`, '#16a34a');
        setTimeout(() => _banner(''), 4000);
        window.dispatchEvent(new CustomEvent('agrotrace:sincronizado', {
          detail: { compras: c, ventas: v }
        }));
      } else {
        _banner('');
      }
    } catch (e) {
      console.error('[AgroSync]', e);
      _banner('');
    }
  }

  // ── Eventos de conexion ────────────────────────────────
  window.addEventListener('online',  () => { _banner(''); setTimeout(sincronizar, 1500); });
  window.addEventListener('offline', () => _banner('📴 Sin conexion — modo offline activo'));

  setInterval(() => { if (navigator.onLine) sincronizar(); }, POLL);

  document.addEventListener('DOMContentLoaded', async () => {
    await _badge();
    if (!navigator.onLine) _banner('📴 Sin conexion — modo offline activo');
  });

  return { sincronizar, encolarCompra, encolarVenta, actualizarBadge: _badge };
})();

window.AgroSync = AgroSync;
