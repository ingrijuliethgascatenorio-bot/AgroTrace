/* =========================================
   AgroTrace - IndexedDB Global FIXED
   Compatible con SW v9-enterprise
========================================= */

const AgroDB = (() => {
  const DB_NAME = 'agrotrace_db';
  const DB_VER  = 5; // subimos versión para incluir store productores
  let _db = null;

  // ─────────────────────────────
  // OPEN DB
  // ─────────────────────────────
  function abrir() {
    if (_db) return Promise.resolve(_db);

    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VER);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;

        // ── OFFLINE COMPRA ──
        if (!db.objectStoreNames.contains('pendientes_compra')) {
          db.createObjectStore('pendientes_compra', {
            keyPath: 'id',
            autoIncrement: true
          });
        }

        // ── OFFLINE VENTA ──
        if (!db.objectStoreNames.contains('pendientes_venta')) {
          db.createObjectStore('pendientes_venta', {
            keyPath: 'id',
            autoIncrement: true
          });
        }

        // ── CACHE API ──
        if (!db.objectStoreNames.contains('cache_api')) {
          const s = db.createObjectStore('cache_api', {
            keyPath: 'url'
          });
          s.createIndex('timestamp', 'timestamp');
        }

        // 🔥 RUTAS OFFLINE
        if (!db.objectStoreNames.contains('rutas')) {
          db.createObjectStore('rutas', {
            keyPath: 'id'
          });
        }

        // 🔥 QR CACHE
        if (!db.objectStoreNames.contains('qr_cache')) {
          db.createObjectStore('qr_cache', {
            keyPath: 'rutaId'
          });
        }

        // 🔥 PRODUCTORES OFFLINE — clave = cédula como string
        if (!db.objectStoreNames.contains('productores')) {
          db.createObjectStore('productores', {
            keyPath: 'cedula'
          });
        }
      };

      req.onsuccess = () => {
        _db = req.result;
        resolve(_db);
      };

      req.onerror = () => reject(req.error);
    });
  }

  // ─────────────────────────────
  // TX HELPER
  // ─────────────────────────────
  async function _tx(store, mode, fn) {
    const db = await abrir();

    return new Promise((resolve, reject) => {
      const tx  = db.transaction(store, mode);
      const obj = tx.objectStore(store);

      let req;

      try {
        req = fn(obj);
      } catch (e) {
        reject(e);
        return;
      }

      if (req && req.onsuccess !== undefined) {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } else {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }
    });
  }

  // ─────────────────────────────
  // GET ALL
  // ─────────────────────────────
  async function todos(store) {
    const db = await abrir();

    return new Promise((resolve, reject) => {
      const req = db.transaction(store, 'readonly')
        .objectStore(store)
        .getAll();

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // ─────────────────────────────
  // CACHE API (SMART TTL)
  // ─────────────────────────────
  const CACHE_TTL = 5 * 60 * 1000;

  async function cacheGuardar(url, data) {
    return _tx('cache_api', 'readwrite', s =>
      s.put({ url, data, timestamp: Date.now() })
    );
  }

  async function cacheObtener(url) {
    const db = await abrir();

    return new Promise((resolve) => {
      const req = db.transaction('cache_api', 'readonly')
        .objectStore('cache_api')
        .get(url);

      req.onsuccess = () => {
        const e = req.result;

        if (!e) return resolve(null);

        const ok = Date.now() - e.timestamp < CACHE_TTL;
        resolve(ok ? e.data : null);
      };

      req.onerror = () => resolve(null);
    });
  }

  // ─────────────────────────────
  // OFFLINE QUEUE FIXED
  // ─────────────────────────────
  function baseOffline(d) {
    return {
      ...d,
      estado: 'pendiente_sync',
      offlineId: 'OFF-' + Date.now() + '-' + Math.random().toString(16).slice(2),
      timestamp: Date.now()
    };
  }

  const guardarCompraOffline = (d) =>
    _tx('pendientes_compra', 'readwrite', s =>
      s.add(baseOffline(d))
    );

  const guardarVentaOffline = (d) =>
    _tx('pendientes_venta', 'readwrite', s =>
      s.add(baseOffline(d))
    );

  const obtenerComprasPendientes = () => todos('pendientes_compra');
  const obtenerVentasPendientes  = () => todos('pendientes_venta');

  const eliminarCompraPendiente = (id) =>
    _tx('pendientes_compra', 'readwrite', s => s.delete(id));

  const eliminarVentaPendiente = (id) =>
    _tx('pendientes_venta', 'readwrite', s => s.delete(id));

  async function contarPendientes() {
    const [c, v] = await Promise.all([
      obtenerComprasPendientes(),
      obtenerVentasPendientes()
    ]);

    return c.length + v.length;
  }

  // ─────────────────────────────
  // PRODUCTORES OFFLINE
  // Clave: cédula (string). Guarda el objeto completo del productor
  // para que buscarProductorPorCedula funcione sin red.
  // ─────────────────────────────
  async function guardarProductorOffline(productor) {
    // Normalizar la clave: siempre string, extraer de las dos rutas posibles
    const cedula = String(
      productor.cedula || productor.usuario?.cedula || productor.id_productor || ''
    ).trim();
    if (!cedula) return; // no guardamos sin clave
    return _tx('productores', 'readwrite', s =>
      s.put({ ...productor, cedula, _ts: Date.now() })
    );
  }

  async function obtenerProductorOffline(cedula) {
    const db = await abrir();
    return new Promise(resolve => {
      const req = db.transaction('productores', 'readonly')
        .objectStore('productores')
        .get(String(cedula).trim());
      req.onsuccess = () => resolve(req.result || null);
      req.onerror   = () => resolve(null);
    });
  }

  // ─────────────────────────────
  // RUTAS OFFLINE (CRÍTICO PRODUCTOR)
  // ─────────────────────────────
  const guardarRutaOffline = (ruta) =>
    _tx('rutas', 'readwrite', s =>
      s.put({ ...ruta, timestamp: Date.now() })
    );

  const obtenerRutasOffline = () => todos('rutas');

  // ─────────────────────────────
  // QR CACHE (FIX OFFLINE QR)
  // ─────────────────────────────
  const guardarQRCache = (rutaId, data) =>
    _tx('qr_cache', 'readwrite', s =>
      s.put({ rutaId, data })
    );

  const obtenerQRCache = (rutaId) =>
    abrir().then(db =>
      new Promise(res => {
        const req = db.transaction('qr_cache', 'readonly')
          .objectStore('qr_cache')
          .get(rutaId);

        req.onsuccess = () => res(req.result || null);
        req.onerror = () => res(null);
      })
    );

  // ─────────────────────────────
  // INIT
  // ─────────────────────────────
  abrir().catch(e => console.error('[AgroDB]', e));

  return {
    cacheGuardar,
    cacheObtener,

    guardarCompraOffline,
    guardarVentaOffline,

    obtenerComprasPendientes,
    obtenerVentasPendientes,

    eliminarCompraPendiente,
    eliminarVentaPendiente,

    contarPendientes,

    guardarRutaOffline,
    obtenerRutasOffline,

    guardarQRCache,
    obtenerQRCache,

    guardarProductorOffline,
    obtenerProductorOffline,
  };
})();

window.AgroDB = AgroDB;