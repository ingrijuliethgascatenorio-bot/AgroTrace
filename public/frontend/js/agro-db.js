/* AgroTrace - IndexedDB Global
   /public/frontend/js/agro-db.js
   Reemplaza: vista_productor/js/db.js y cache.js */

const AgroDB = (() => {
  const DB_NAME = 'agrotrace_db';
  const DB_VER  = 3;
  let _db = null;

  function abrir() {
    if (_db) return Promise.resolve(_db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('pendientes_compra'))
          db.createObjectStore('pendientes_compra', { keyPath: 'id', autoIncrement: true });
        if (!db.objectStoreNames.contains('pendientes_venta'))
          db.createObjectStore('pendientes_venta',  { keyPath: 'id', autoIncrement: true });
        if (!db.objectStoreNames.contains('cache_api')) {
          const s = db.createObjectStore('cache_api', { keyPath: 'url' });
          s.createIndex('timestamp', 'timestamp');
        }
      };
      req.onsuccess = () => { _db = req.result; resolve(_db); };
      req.onerror   = () => reject(req.error);
    });
  }

  async function _tx(store, mode, fn) {
    const db  = await abrir();
    return new Promise((res, rej) => {
      const tx  = db.transaction(store, mode);
      const obj = tx.objectStore(store);
      const r   = fn(obj);
      if (r) { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }
      else   { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }
    });
  }

  async function todos(store) {
    const db = await abrir();
    return new Promise((res, rej) => {
      const r = db.transaction(store, 'readonly').objectStore(store).getAll();
      r.onsuccess = () => res(r.result);
      r.onerror   = () => rej(r.error);
    });
  }

  const CACHE_TTL = 5 * 60 * 1000;

  async function cacheGuardar(url, data) {
    return _tx('cache_api', 'readwrite', s => s.put({ url, data, timestamp: Date.now() }));
  }

  async function cacheObtener(url) {
    const db = await abrir();
    return new Promise(res => {
      const r = db.transaction('cache_api', 'readonly').objectStore('cache_api').get(url);
      r.onsuccess = () => {
        const e = r.result;
        res(!e || Date.now() - e.timestamp > CACHE_TTL ? null : e.data);
      };
      r.onerror = () => res(null);
    });
  }

  const guardarCompraOffline = d =>
    _tx('pendientes_compra', 'readwrite', s =>
      s.add({ ...d, timestamp: new Date().toISOString() }));

  const guardarVentaOffline = d =>
    _tx('pendientes_venta', 'readwrite', s =>
      s.add({ ...d, timestamp: new Date().toISOString() }));

  const obtenerComprasPendientes = () => todos('pendientes_compra');
  const obtenerVentasPendientes  = () => todos('pendientes_venta');

  const eliminarCompraPendiente = id =>
    _tx('pendientes_compra', 'readwrite', s => s.delete(id));
  const eliminarVentaPendiente = id =>
    _tx('pendientes_venta', 'readwrite', s => s.delete(id));

  async function contarPendientes() {
    const [c, v] = await Promise.all([
      obtenerComprasPendientes(), obtenerVentasPendientes()
    ]);
    return c.length + v.length;
  }

  abrir().catch(e => console.error('[AgroDB]', e));

  return {
    cacheGuardar, cacheObtener,
    guardarCompraOffline, guardarVentaOffline,
    obtenerComprasPendientes, obtenerVentasPendientes,
    eliminarCompraPendiente, eliminarVentaPendiente,
    contarPendientes,
  };
})();

window.AgroDB = AgroDB;
