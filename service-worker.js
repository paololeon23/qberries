// service-worker.js - Cache Estratégico
const CACHE_NAME = "tiempos-agro-v1";
const assets = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./network.js",
  "./manifest.json",
  "./librerias/lucide.min.js",
  "./librerias/sweetalert2.all.min.js",
  "./librerias/sweetalert2.min.css",
  "./logo.png",
  "./logo2.png",
  "./icono.png"
];

// Instalación y guardado de archivos en caché
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(assets))
  );
});

// Recuperación: red primero, caché como respaldo (evita errores en dev)
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || !e.request.url.startsWith("http")) return;
  e.respondWith(
    fetch(e.request)
      .catch(() => caches.match(e.request))
      .then(res => res || new Response("", { status: 404, statusText: "Not Found" }))
  );
});