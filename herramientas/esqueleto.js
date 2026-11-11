// Envuelve una página de `apps/<nombre>/index.html` con el mismo esqueleto que
// añade Claude al publicarla como Artifact, y la sirve en local para probarla.
// Así las pruebas ven la página igual que la verá el móvil.
const fs = require('fs');
const http = require('http');

const CABEZA = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>\n';
const PIE = '\n</body></html>';

function envolver(rutaPagina) {
  return CABEZA + fs.readFileSync(rutaPagina, 'utf8') + PIE;
}

// Devuelve { url, cerrar }. Lee el archivo en cada petición: recargar basta para ver cambios.
function servir(rutaPagina) {
  return new Promise((ok, ko) => {
    const servidor = http.createServer((peticion, respuesta) => {
      respuesta.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      respuesta.end(envolver(rutaPagina));
    });
    servidor.on('error', ko);
    servidor.listen(0, '127.0.0.1', () => {
      ok({ url: `http://127.0.0.1:${servidor.address().port}/`, cerrar: () => servidor.close() });
    });
  });
}

module.exports = { envolver, servir };
