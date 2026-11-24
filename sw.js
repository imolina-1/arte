// Funciona sin conexión: guarda la página, los datos y las imágenes.
// Cambia VERSION cada vez que se actualicen los datos (data/*.js) o la web.
const VERSION = "historia-arte-v17";
const CORE = ["./", "index.html", "css/style.css", "css/juego.css", "js/core.js", "js/semblanzas.js", "js/glosario.js", "js/extra.js", "js/mas.js", "js/juego.js", "data/mapa.js", "js/start.js", "data/semblanzas.js", "data/glosario.js", "data/obras.js", "fonts/fraunces-latin-wght-normal.woff2", "fonts/fraunces-latin-wght-italic.woff2", "fonts/inter-latin-standard-normal.woff2", "fonts/spectral-latin-400-normal.woff2", "fonts/spectral-latin-600-normal.woff2", "fonts/spectral-latin-400-italic.woff2", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // recursos externos (estadísticas): sin caché propia
  const isPage = req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith(".json") || url.pathname.endsWith(".js") || url.pathname.endsWith(".css");
  if (isPage) {
    // Página y datos: primero la red (para recibir actualizaciones), si falla, la copia guardada.
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match("index.html")))
    );
  } else {
    // Imágenes e iconos: primero la copia guardada.
    e.respondWith(
      caches.match(req).then((r) => r || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      }))
    );
  }
});
