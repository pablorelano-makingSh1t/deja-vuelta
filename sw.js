// Service worker generado por herramientas/pwa.py (2026-11-03 00:15).
const CACHE = 'dejavuelta-89fb3aa720';
const ARCHIVOS = ["./", "index.html", "juegos/dejavuelta/assets/fuentes/OFL-BricolageGrotesque.txt", "juegos/dejavuelta/assets/fuentes/OFL-Fraunces.txt", "juegos/dejavuelta/assets/fuentes/bricolage-grotesque-latin-400-normal.woff2", "juegos/dejavuelta/assets/fuentes/bricolage-grotesque-latin-600-normal.woff2", "juegos/dejavuelta/assets/fuentes/bricolage-grotesque-latin-800-normal.woff2", "juegos/dejavuelta/assets/fuentes/fraunces-latin-400-italic.woff2", "juegos/dejavuelta/assets/fuentes/fraunces-latin-400-normal.woff2", "juegos/dejavuelta/assets/fuentes/fraunces-latin-600-normal.woff2", "juegos/dejavuelta/assets/icono-192.png", "juegos/dejavuelta/assets/icono-512.png", "juegos/dejavuelta/assets/icono-apple-180.png", "juegos/dejavuelta/assets/icono-mascara-512.png", "juegos/dejavuelta/datos.js", "juegos/dejavuelta/main.js", "juegos/dejavuelta/sistemas/bucle.js", "juegos/dejavuelta/sistemas/cronica.js", "juegos/dejavuelta/sistemas/partida.js", "juegos/dejavuelta/sistemas/recuerdos.js", "juegos/dejavuelta/sistemas/secretos.js", "juegos/dejavuelta/textos.js", "juegos/dejavuelta/ui/escena.js", "juegos/dejavuelta/ui/estilos.css", "juegos/dejavuelta/ui/fuentes.css", "juegos/dejavuelta/ui/poblado.js", "juegos/dejavuelta/ui/temas.js", "manifest.webmanifest", "motor/economia/costes.js", "motor/i18n.js", "motor/motor.js", "motor/nucleo/bucle.js", "motor/nucleo/eventos.js", "motor/numeros/formato.js", "motor/numeros/num.js", "motor/persistencia/almacen.js", "motor/persistencia/guardado.js", "motor/plataforma/adaptadores/none.js", "motor/progresion/condiciones.js", "motor/servicios/analitica.js", "motor/servicios/audio.js", "motor/servicios/i18n.js", "motor/ui/base.css", "motor/ui/dom.js", "motor/vendor/LICENSE-break_infinity", "motor/vendor/break_infinity.esm.js"];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Primero la caché (funciona sin conexión); lo que no esté, a la red.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request)));
});
