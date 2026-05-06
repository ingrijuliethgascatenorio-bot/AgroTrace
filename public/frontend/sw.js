/* =========================================
   AgroTrace - Service Worker ENTERPRISE PRO
   FIX v10:
   - Todos los assets JS críticos en PRECACHE
   - agro-ux.js, auth-guard.js, vendedor.js añadidos
   - POST requests ignorados correctamente (no interceptar)
   - Stale-While-Revalidate para APIs cacheables
   - PRECACHE robusto: si un archivo falla no rompe todo
========================================= */

const VERSION     = 'v10-enterprise';
const CACHE_STATIC = `agro-static-${VERSION}`;
const CACHE_API    = `agro-api-${VERSION}`;
const CACHE_FONTS  = `agro-fonts-${VERSION}`;
const CACHE_PAGES  = `agro-pages-${VERSION}`;

// ARCHIVOS CRÍTICOS OFFLINE
// FIX: se agregaron los JS que estaban en el HTML pero no en el precache
const PRECACHE = [
  '/frontend/offline.html',
  '/frontend/manifest.json',
  '/frontend/iconos/icon-192.png',
  '/frontend/iconos/icon-512.png',

  // JS globales
  '/frontend/js/agro-db.js',
  '/frontend/js/agro-sync.js',
  '/frontend/js/agro-ux.js',
  '/frontend/js/auth-guard.js',
  '/frontend/js/app-install.js',

  // Vistas HTML
  '/frontend/vistaOperario/vendedor.html',
  '/frontend/vista_productor/productor.html',

  // FIX: CSS críticos — sin esto la app se ve rota offline
  '/frontend/vistaOperario/vendedor.css',
  '/frontend/vista_productor/css/productor.css',
  '/frontend/vista_productor/css/ingresos.css',

  // FIX: JS de las vistas — sin esto la app no funciona offline
  '/frontend/vistaOperario/vendedor.js',
  '/frontend/vista_productor/js/productor.js',
  '/frontend/vista_productor/js/ingresos.js',

  // Logo (para que no aparezca roto)
  '/frontend/img/logo (1).png',
];

// API cacheable con Stale-While-Revalidate
const API_CACHEABLES = [
  '/api/productos',
  '/api/productores',
  '/api/rutas',
  '/api/me',
  '/api/compras',
  '/api/ventas',
  '/api/precios',
  '/api/comerciantes',
];

// ─────────────────────────────
// INSTALL
// ─────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(async (cache) => {
      // FIX: precachear uno a uno para que un fallo no bloquee todo
      const resultados = await Promise.allSettled(
        PRECACHE.map(url => cache.add(url))
      );
      resultados.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error('[SW v10] No se pudo cachear:', PRECACHE[i], r.reason?.message);
        }
      });
      console.log('[SW v10] Precaching completo');
    }).then(() => self.skipWaiting())
  );
});

// ─────────────────────────────
// ACTIVATE
// ─────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (!key.includes(VERSION)) {
            console.log('[SW v10] Eliminando cache viejo:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ─────────────────────────────
// FETCH CONTROLLER
// ─────────────────────────────
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // FIX: No interceptar POST, PUT, PATCH, DELETE
  // (el sync de compras/ventas va directo al servidor)
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // QR / CDN
  if (url.href.includes('html5-qrcode') || url.href.includes('cdn.jsdelivr.net') || url.href.includes('cdnjs.cloudflare.com')) {
    event.respondWith(cacheFirst(req, CACHE_STATIC));
    return;
  }

  // Fonts
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com') || url.hostname.includes('cdn-uicons')) {
    event.respondWith(cacheFirst(req, CACHE_FONTS));
    return;
  }

  // Solo mismo origen
  if (url.origin !== self.location.origin) return;

  const isAPI    = API_CACHEABLES.some(p => url.pathname.startsWith(p));
  const isPage   = req.headers.get('accept')?.includes('text/html');
  const isStatic = url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.html') || url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.jpeg');

  if (isAPI) {
    // Stale-While-Revalidate: responde del caché rápido y actualiza en background
    event.respondWith(staleWhileRevalidate(req, CACHE_API));
    return;
  }

  if (isPage) {
    event.respondWith(pageStrategy(req));
    return;
  }

  if (isStatic) {
    event.respondWith(cacheFirst(req, CACHE_STATIC));
    return;
  }
});

// ─────────────────────────────
// STRATEGY 1: NETWORK FIRST (fallback a caché)
// ─────────────────────────────
async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const cached = await cache.match(req);
    return cached || fallbackJSON();
  }
}

// ─────────────────────────────
// STRATEGY 2: STALE-WHILE-REVALIDATE (APIs)
// Responde del caché inmediatamente, actualiza en background
// ─────────────────────────────
async function staleWhileRevalidate(req, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(req);

  // Actualizar en background siempre
  const fetchPromise = fetch(req).then(res => {
    if (res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => null);

  return cached || fetchPromise || fallbackJSON();
}

// ─────────────────────────────
// STRATEGY 3: CACHE FIRST (assets estáticos)
// ─────────────────────────────
async function cacheFirst(req, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return new Response('', { status: 503 });
  }
}

// ─────────────────────────────
// STRATEGY 4: PAGES (offline.html como fallback)
// ─────────────────────────────
async function pageStrategy(req) {
  const cache = await caches.open(CACHE_PAGES);
  try {
    const res = await fetch(req);
    cache.put(req, res.clone());
    return res;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    return caches.match('/frontend/offline.html');
  }
}

// ─────────────────────────────
// FALLBACK JSON — respuesta vacía pero válida para que el JS no rompa
// ─────────────────────────────
function fallbackJSON() {
  return new Response(JSON.stringify({
    status: 'offline',
    message: 'Sin conexión. Datos no disponibles.',
    // Arrays vacíos para que Array.isArray(data) funcione sin errores
    data: [],
    items: []
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 503
  });
}

// ─────────────────────────────
// BACKGROUND SYNC — cuando recupera señal, notificar a los clientes
// ─────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'agrotrace-sync') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SYNC_NOW' });
        });
      })
    );
  }
});

// ─────────────────────────────
// MENSAJE DESDE EL CLIENTE
// ─────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});