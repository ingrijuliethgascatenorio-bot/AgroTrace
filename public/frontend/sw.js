/* AgroTrace - Service Worker v5
   CAMBIO PRINCIPAL: HTML, CSS y JS usan Network-First (siempre intenta
   la red antes que la caché). Solo fallback offline usa caché.
   Esto elimina el problema de iconos/estilos desactualizados. */

const CACHE_VERSION  = 'v5';
const CACHE_STATIC   = 'agrotrace-static-' + CACHE_VERSION;
const CACHE_API      = 'agrotrace-api-'    + CACHE_VERSION;
const CACHE_FONTS    = 'agrotrace-fonts-'  + CACHE_VERSION;

// Archivos que se pre-cachean al instalar (solo iconos y manifest — no CSS/JS)
const ARCHIVOS_PRECACHE = [
  '/public/frontend/iconos/icon-192.png',
  '/public/frontend/iconos/icon-512.png',
  '/public/frontend/manifest.json',
];

// Archivos locales que usan Network-First (CSS, JS, HTML)
const PATRON_LOCAL_ESTATICO = [
  '.html',
  '.css',
  '.js',
];

// APIs que usan Network-First con fallback a caché
const API_CACHEABLES = [
  '/api/productos',
  '/api/productores',
  '/api/compras',
  '/api/ventas',
  '/api/me',
  '/api/comerciantes',
  '/api/operario/historial',
  '/api/productor-dashboard/perfil',
  '/api/productor-dashboard/historial',
  '/api/productor-dashboard/resumen',
  '/api/productor-dashboard/qr',
  '/api/entregas',
  '/api/precios/actual',
  '/api/rutas',
];

// ── INSTALL ────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(c => c.addAll(ARCHIVOS_PRECACHE))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW v5] Pre-cache error:', err))
  );
});

// ── ACTIVATE — limpiar cachés viejos ──────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_STATIC && k !== CACHE_API && k !== CACHE_FONTS)
          .map(k => {
            console.log('[SW v5] Eliminando caché viejo:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar peticiones HTTP/HTTPS
  if (!url.protocol.startsWith('http')) return;
  // Solo GET
  if (request.method !== 'GET') return;

  // Fuentes externas (CDN Font Awesome, uicons, Google Fonts) — Cache-First
  // para mejorar rendimiento, pero con fallback a red
  if (
    url.hostname.includes('flaticon.com') ||
    url.hostname.includes('fontawesome.com') ||
    url.hostname.includes('cdnjs.cloudflare.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(cacheFirstFonts(request));
    return;
  }

  // Solo procesar peticiones del mismo dominio a partir de aquí
  if (url.hostname !== self.location.hostname) return;

  const esApi = API_CACHEABLES.some(r => url.pathname.startsWith(r));
  const esEstatico = PATRON_LOCAL_ESTATICO.some(ext => url.pathname.endsWith(ext));

  if (esApi) {
    event.respondWith(networkFirstApi(request));
  } else if (esEstatico) {
    // HTML, CSS, JS — SIEMPRE Network-First para evitar versiones desactualizadas
    event.respondWith(networkFirstEstatico(request));
  }
  // Resto (imágenes locales, etc.) — no interceptar, dejar al navegador
});

// ── ESTRATEGIAS ───────────────────────────────────────────────────────────

/**
 * Network-First para HTML/CSS/JS locales.
 * Intenta siempre la red. Solo usa caché si hay error de red (offline).
 * Esto garantiza que siempre se cargue la versión más reciente del CSS/JS.
 */
async function networkFirstEstatico(request) {
  const cache = await caches.open(CACHE_STATIC);
  try {
    const res = await fetch(request, { cache: 'no-store' });
    if (res.ok) {
      // Actualizar caché con la versión nueva
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    // Sin red — usar caché como fallback
    const cached = await cache.match(request);
    if (cached) {
      console.warn('[SW v5] Offline — sirviendo desde caché:', request.url);
      return cached;
    }
    return new Response('<h2>AgroTrace — sin conexión</h2>', {
      status: 503,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

/**
 * Network-First para APIs.
 * Intenta la red; si falla usa caché.
 */
async function networkFirstApi(request) {
  const cache = await caches.open(CACHE_API);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: 'offline', message: 'Sin conexion y sin cache' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Cache-First para fuentes y recursos CDN externos.
 * Son inmutables (versión fija en la URL) — seguro cachearlos permanentemente.
 */
async function cacheFirstFonts(request) {
  const cache  = await caches.open(CACHE_FONTS);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    // Sin red y sin caché de fuentes — devolver respuesta vacía
    // (el navegador mostrará el fallback font)
    return new Response('', { status: 503 });
  }
}