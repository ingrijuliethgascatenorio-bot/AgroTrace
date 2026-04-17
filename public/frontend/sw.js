/* =========================================
   AgroTrace - Service Worker ENTERPRISE PRO
   FIX v9: ruta absoluta + offline.html + scope correcto
   ========================================= */

const VERSION = 'v9-enterprise';

const CACHE_STATIC = `agro-static-${VERSION}`;
const CACHE_API    = `agro-api-${VERSION}`;
const CACHE_FONTS  = `agro-fonts-${VERSION}`;
const CACHE_PAGES  = `agro-pages-${VERSION}`;

// ARCHIVOS CRÍTICOS (OFFLINE TOTAL)
// FIX: rutas absolutas — el SW vive en /frontend/sw.js
const PRECACHE = [
  '/frontend/vista_productor/productor.html',
  '/frontend/vistaOperario/vendedor.html',

  '/frontend/js/agro-db.js',
  '/frontend/js/agro-sync.js',

  '/frontend/iconos/icon-192.png',
  '/frontend/iconos/icon-512.png',
  '/frontend/manifest.json',

  // FIX: offline.html ahora existe en /frontend/
  '/frontend/offline.html'
];

// APIs cacheables
const API_CACHEABLES = [
  '/api/productos',
  '/api/productores',
  '/api/rutas',
  '/api/me',
  '/api/compras',
  '/api/ventas'
];

// ─────────────────────────────
// INSTALL (precarga crítica)
// ─────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(async (cache) => {
      try {
        await cache.addAll(PRECACHE);
        console.log('[SW v9] Precaching completo');
      } catch (e) {
        // FIX: loguear qué archivo falló exactamente
        console.error('[SW v9] Error precache — verifica que todos los archivos existan:', e);
      }
    }).then(() => self.skipWaiting())
  );
});

// ─────────────────────────────
// ACTIVATE (limpieza segura)
// ─────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (!key.includes(VERSION)) {
            console.log('[SW v9] Eliminando cache viejo:', key);
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

  // Solo interceptar GET
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // QR / CDN LIB
  if (
    url.href.includes('html5-qrcode') ||
    url.href.includes('cdn.jsdelivr.net')
  ) {
    event.respondWith(cacheFirst(req, CACHE_STATIC));
    return;
  }

  // FONTS
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(cacheFirst(req, CACHE_FONTS));
    return;
  }

  // Solo mismo origen
  if (url.origin !== self.location.origin) return;

  const isAPI    = API_CACHEABLES.some(p => url.pathname.startsWith(p));
  const isPage   = req.headers.get('accept')?.includes('text/html');
  const isStatic =
    url.pathname.endsWith('.js')  ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.html');

  if (isAPI) {
    event.respondWith(networkFirst(req, CACHE_API));
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
// STRATEGY 1: NETWORK FIRST (API)
// ─────────────────────────────
async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(req);
    return cached || fallbackJSON();
  }
}

// ─────────────────────────────
// STRATEGY 2: CACHE FIRST (assets)
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
// STRATEGY 3: PAGES (OFFLINE SAFE)
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
    // FIX: ruta absoluta correcta
    return caches.match('/frontend/offline.html');
  }
}

// ─────────────────────────────
// FALLBACK JSON
// ─────────────────────────────
function fallbackJSON() {
  return new Response(JSON.stringify({
    status: 'offline',
    message: 'Sin conexión. Datos no disponibles.'
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 503
  });
}