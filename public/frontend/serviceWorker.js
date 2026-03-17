const CACHE_NAME = "agrotrace-v1";

const archivosCache = [

    "/public/frontend/vista_productor/productor.html",
    "/public/frontend/vista_productor/js/productor.js",
    "/public/frontend/vista_productor/js/offline.js",
    "/public/frontend/vista_productor/css/productor.css"

];

// instalar
self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME)
        .then(cache => cache.addAll(archivosCache))

    );

});

// interceptar peticiones
self.addEventListener("fetch", event => {

    event.respondWith(

        caches.match(event.request)
        .then(response => response || fetch(event.request))

    );

});