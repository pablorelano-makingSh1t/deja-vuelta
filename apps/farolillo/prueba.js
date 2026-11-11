// Prueba de extremo a extremo de Farolillo con pantalla táctil emulada (Pixel 7).
// Uso: node apps/farolillo/prueba.js
// Las capturas van a la carpeta de la variable CAPTURAS o, si no existe, a una temporal.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { servir } = require('../../herramientas/esqueleto.js');

let DIRECCION = '';
const CAPTURAS = process.env.CAPTURAS || fs.mkdtempSync(path.join(os.tmpdir(), 'farolillo-'));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const resultados = [];
function comprobar(nombre, condicion, detalle = '') {
  resultados.push({ nombre, ok: !!condicion });
  console.log((condicion ? 'OK     ' : 'FALLO  ') + nombre + (detalle ? '  [' + detalle + ']' : ''));
}

// Azar con semilla para que las partidas de prueba sean repetibles.
const SEMILLA = (n) => `(() => { let s = ${n}; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })()`;

async function abrir(browser, opciones = {}) {
  const ctx = await browser.newContext({ ...devices['Pixel 7'], ...(opciones.contexto || {}) });
  await ctx.addInitScript(SEMILLA(opciones.semilla || 12345));
  for (const guion of opciones.guiones || []) await ctx.addInitScript(guion);
  const page = await ctx.newPage();
  const errores = [];
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  page.on('pageerror', (e) => errores.push(String(e)));
  await page.goto(DIRECCION);
  await page.waitForFunction(() => window.farolillo && window.farolillo.estado().ancho > 0, null, { timeout: 5000 });
  const cdp = await ctx.newCDPSession(page);
  const E = () => page.evaluate(() => window.farolillo.estado());
  const dedo = { x: 0, y: 0, abajo: false };
  const tocar = async (tipo, x, y) => {
    await cdp.send('Input.dispatchTouchEvent', { type: tipo, touchPoints: tipo === 'touchEnd' ? [] : [{ x: Math.round(x), y: Math.round(y), id: 1 }] });
  };
  const bajar = async (x, y) => { dedo.x = x; dedo.y = y; dedo.abajo = true; await tocar('touchStart', x, y); };
  const mover = async (x) => { dedo.x = x; await tocar('touchMove', x, dedo.y); };
  const subir = async () => { if (dedo.abajo) { dedo.abajo = false; await tocar('touchEnd'); } };
  const pulsar = async (selector) => {
    const caja = await page.locator(selector).boundingBox();
    await page.touchscreen.tap(caja.x + caja.width / 2, caja.y + caja.height / 2);
  };
  const visible = (selector) => page.locator(selector).isVisible();
  const esperarEstado = (estado, ms = 8000) => page.waitForFunction((e) => window.farolillo.estado().estado === e, estado, { timeout: ms });
  return { ctx, page, errores, E, bajar, mover, subir, pulsar, visible, esperarEstado, dedo };
}

// Jugador automático: mueve el dedo de verdad para esquivar lo que viene.
async function jugarSolo(j, { segundos = 10, hastaPuntos = Infinity } = {}) {
  const inicio = Date.now();
  let s = await j.E();
  const W = s.ancho, u = Math.min(1.35, Math.max(0.8, W / 400));
  const margen = 16 + 20 * u;
  if (!j.dedo.abajo) await j.bajar(W / 2, s.alto * 0.85);
  let dedoX = j.dedo.x;
  let objetivo = s.farol.objetivo;
  while (Date.now() - inicio < segundos * 1000) {
    s = await j.E();
    if (s.estado !== 'jugando' || s.puntos >= hastaPuntos) break;
    const peligros = s.murcielagos
      .filter((b) => b.y < s.farol.y + 60 && b.y > s.farol.y - s.alto * 0.62)
      .map((b) => {
        const t = Math.max(0, (s.farol.y - b.y) / b.vy);
        let x = b.x + b.vx * t;
        const lim = b.r * 1.7;
        if (x < lim) x = lim + (lim - x);
        if (x > W - lim) x = (W - lim) - (x - (W - lim));
        return { x, ancho: b.r * 1.2 + 12 * u + 26 * u + Math.abs(b.vx) * 0.25 };
      });
    const seguro = (x) => peligros.every((p) => Math.abs(x - p.x) > p.ancho);
    const luci = s.luciernagas.filter((l) => l.y < s.farol.y && l.y > s.farol.y - s.alto * 0.5).sort((a, b) => b.y - a.y)[0];
    const deseado = luci ? luci.x : W / 2;
    let mejor = null;
    for (let x = margen; x <= W - margen; x += 6) {
      if (!seguro(x)) continue;
      const coste = Math.abs(x - s.farol.x) * 1.0 + Math.abs(x - deseado) * 0.35;
      if (!mejor || coste < mejor.coste) mejor = { x, coste };
    }
    if (mejor && Math.abs(mejor.x - objetivo) > 2) {
      dedoX += (mejor.x - s.farol.objetivo) / 1.3;
      dedoX = Math.min(W - 2, Math.max(2, dedoX));
      objetivo = mejor.x;
      await j.mover(dedoX);
    }
    await espera(25);
  }
  return j.E();
}

(async () => {
  const sitio = await servir(path.join(__dirname, 'index.html'));
  DIRECCION = sitio.url;
  fs.mkdirSync(CAPTURAS, { recursive: true });
  const browser = await chromium.launch();

  // ------------------------------------------------------------ 1. Partida completa
  console.log('\n— Partida completa en móvil (Pixel 7, táctil) —');
  const j = await abrir(browser);
  let s = await j.E();
  comprobar('Arranca en la pantalla de inicio', s.estado === 'inicio' && (await j.visible('#panelInicio')) && !(await j.visible('#hud')));
  const medidas = await j.page.evaluate(() => {
    const caja = (id) => { const r = document.getElementById(id).getBoundingClientRect(); return { w: r.width, h: r.height, top: r.top, bottom: r.bottom }; };
    const c = document.getElementById('lienzo');
    return {
      desbordaX: document.documentElement.scrollWidth > window.innerWidth,
      desbordaY: document.documentElement.scrollHeight > window.innerHeight,
      alto: window.innerHeight, ancho: window.innerWidth,
      lienzo: { w: c.width, h: c.height },
      jugar: caja('btnJugar'), titulo: caja('titulo'),
      fuenteTexto: parseFloat(getComputedStyle(document.querySelector('.entrada')).fontSize),
      version: document.getElementById('version').textContent,
    };
  });
  comprobar('La página no se desplaza ni a lo ancho ni a lo alto', !medidas.desbordaX && !medidas.desbordaY, `${medidas.ancho}×${medidas.alto}`);
  comprobar('El lienzo ocupa la pantalla', medidas.lienzo.w >= medidas.ancho && medidas.lienzo.h >= medidas.alto, `${medidas.lienzo.w}×${medidas.lienzo.h} px`);
  comprobar('Botón Jugar cómodo para el dedo (≥ 48 px de alto)', medidas.jugar.h >= 48 && medidas.jugar.w >= 200, `${Math.round(medidas.jugar.w)}×${Math.round(medidas.jugar.h)}`);
  comprobar('Texto legible (≥ 16 px)', medidas.fuenteTexto >= 16, medidas.fuenteTexto + ' px');
  comprobar('Muestra el número de versión', /versión \d+/.test(medidas.version), medidas.version);
  await j.page.screenshot({ path: path.join(CAPTURAS, '1-inicio.png') });

  await j.pulsar('#btnJugar');
  s = await j.E();
  comprobar('Tocar «Jugar» empieza la partida', s.estado === 'jugando' && (await j.visible('#hud')) && !(await j.visible('#panelInicio')));

  // Controles: arrastrar el dedo mueve el farolillo
  await espera(300);
  const x0 = (await j.E()).farol.x;
  await j.bajar(200, 760);
  await j.mover(240); await espera(60); await j.mover(270); await espera(250);
  const x1 = (await j.E()).farol.x;
  comprobar('Arrastrar a la derecha mueve el farolillo a la derecha', x1 - x0 > 70, `${x0.toFixed(0)} → ${x1.toFixed(0)}`);
  await j.mover(200); await espera(60); await j.mover(120); await espera(250);
  const x2 = (await j.E()).farol.x;
  comprobar('Arrastrar a la izquierda lo mueve a la izquierda', x1 - x2 > 150, `${x1.toFixed(0)} → ${x2.toFixed(0)}`);
  await j.mover(2); await espera(300);
  const x3 = (await j.E()).farol.x;
  comprobar('El farolillo no sale de la pantalla', x3 >= 16, `x mínima ${x3.toFixed(0)}`);
  comprobar('La pista de control se oculta tras el primer arrastre', !(await j.visible('#pista')));
  await j.mover(206 - (206 - 36) / 1.3); // recolocar la referencia del dedo
  await j.subir();

  // Puntuación: jugador automático durante unos segundos
  s = await jugarSolo(j, { segundos: 14 });
  await j.page.screenshot({ path: path.join(CAPTURAS, '2-jugando.png') });
  const hud = await j.page.locator('#puntos').textContent();
  comprobar('Esquivando se suman puntos', s.puntos >= 5, `${s.puntos} puntos en ${s.tiempo.toFixed(1)} s, estado ${s.estado}`);
  comprobar('El marcador en pantalla coincide con los puntos', Math.abs(Number(hud) - s.puntos) <= 6, `marcador ${hud}`);

  // Pausa
  if (s.estado === 'jugando') {
    await j.subir();
    await j.pulsar('#btnPausa');
    const p1 = await j.E();
    await espera(700);
    const p2 = await j.E();
    comprobar('Tocar pausa detiene la partida', p1.estado === 'pausa' && p2.tiempo === p1.tiempo && p2.puntos === p1.puntos && (await j.visible('#panelPausa')));
    await j.page.screenshot({ path: path.join(CAPTURAS, '3-pausa.png') });
    await j.pulsar('#btnSeguir');
    await espera(400);
    const p3 = await j.E();
    comprobar('«Seguir» reanuda la partida con sus puntos', p3.estado !== 'pausa' && p3.tiempo > p2.tiempo && p3.puntos >= p2.puntos);
  } else {
    comprobar('Tocar pausa detiene la partida', false, 'la partida terminó antes de poder pausar');
  }

  // Sin tocar nada: choque → fin de partida
  await j.subir();
  await j.esperarEstado('fin', 30000);
  s = await j.E();
  await j.page.waitForFunction(() => window.farolillo.estado().panelFin, null, { timeout: 3000 });
  const fin = await j.page.evaluate(() => ({
    puntos: document.getElementById('puntosFin').textContent,
    insignia: !document.getElementById('insignia').hidden,
    guardado: document.querySelector('#panelFin [data-guardado]').textContent,
    record: document.querySelector('#panelFin [data-record]').textContent,
    local: localStorage.getItem('farolillo:v1'),
    otra: (() => { const r = document.getElementById('btnOtra').getBoundingClientRect(); return { h: r.height, bottom: r.bottom }; })(),
  }));
  comprobar('Un choque termina la partida y muestra el resultado', (await j.visible('#panelFin')) && Number(fin.puntos) === s.puntos, `${fin.puntos} puntos`);
  comprobar('Primer resultado: se marca como nuevo récord', fin.insignia && Number(fin.record) === s.puntos && s.record === s.puntos);
  comprobar('El récord queda escrito en el almacenamiento del navegador', fin.local && JSON.parse(fin.local).record === s.puntos, fin.local);
  comprobar('Dice dónde se ha guardado', /solo en este navegador/.test(fin.guardado), fin.guardado);
  comprobar('Botón «Jugar otra vez» dentro de la pantalla', fin.otra.h >= 48 && fin.otra.bottom <= medidas.alto);
  await j.page.screenshot({ path: path.join(CAPTURAS, '4-fin.png') });
  const recordA = s.record;

  // Reinicio
  await j.pulsar('#btnOtra');
  await espera(150);
  s = await j.E();
  comprobar('«Jugar otra vez» reinicia a 0 puntos', s.estado === 'jugando' && s.puntos === 0 && s.tiempo < 0.6 && s.murcielagos.length === 0 && !(await j.visible('#panelFin')));
  await espera(1500);
  await j.pulsar('#btnPausa');
  await j.pulsar('#btnReiniciar');
  await espera(150);
  s = await j.E();
  comprobar('«Reiniciar» desde la pausa empieza de cero', s.estado === 'jugando' && s.puntos === 0 && s.tiempo < 0.6);

  // Pausa automática al perder el foco
  await j.page.evaluate(() => window.dispatchEvent(new Event('blur')));
  s = await j.E();
  comprobar('Se pausa sola al salir de la pantalla', s.estado === 'pausa');
  await j.pulsar('#btnSeguir');

  // Partida peor que el récord: no lo pisa
  await j.esperarEstado('fin', 30000);
  await j.page.waitForFunction(() => window.farolillo.estado().panelFin, null, { timeout: 3000 });
  s = await j.E();
  const insignia2 = await j.page.evaluate(() => !document.getElementById('insignia').hidden);
  comprobar('Una partida peor no cambia el récord', s.puntos <= recordA ? (s.record === recordA && !insignia2) : s.record === s.puntos, `puntos ${s.puntos}, récord ${s.record}`);
  const recordFinal = s.record;

  // Persistencia: recargar
  await j.page.reload();
  await j.page.waitForFunction(() => window.farolillo && window.farolillo.estado().ancho > 0);
  s = await j.E();
  const recInicio = await j.page.locator('#panelInicio [data-record]').textContent();
  comprobar('El récord sigue ahí tras recargar la página', s.record === recordFinal && Number(recInicio) === recordFinal, `récord ${recInicio}`);
  comprobar('Sin errores de consola en toda la partida', j.errores.length === 0, j.errores.join(' | '));
  await j.ctx.close();

  // ------------------------------------------------------- 2. Almacenamiento bloqueado
  console.log('\n— Navegador que no deja guardar —');
  const b = await abrir(browser, { guiones: [`Storage.prototype.setItem = function () { throw new DOMException('bloqueado', 'SecurityError'); };`] });
  s = await b.E();
  const textoB = await b.page.locator('#panelInicio [data-guardado]').textContent();
  comprobar('Avisa de que no puede guardar (no finge)', s.guardado === 'memoria' && /no se puede guardar/i.test(textoB), textoB);
  await b.pulsar('#btnJugar');
  await jugarSolo(b, { segundos: 20, hastaPuntos: 3 });
  await b.subir();
  await b.esperarEstado('fin', 30000);
  await b.page.waitForFunction(() => window.farolillo.estado().panelFin, null, { timeout: 3000 });
  s = await b.E();
  const textoB2 = await b.page.locator('#panelFin [data-guardado]').textContent();
  comprobar('El juego funciona igual sin almacenamiento', s.puntos > 0 && s.record === s.puntos && /no se pudo guardar|no se puede guardar/i.test(textoB2), `${s.puntos} puntos · ${textoB2}`);
  comprobar('Sin errores de consola', b.errores.length === 0, b.errores.join(' | '));
  await b.ctx.close();

  // ------------------------------------------------- 3. Cuenta de Claude (simulada)
  console.log('\n— Guardado en la cuenta (API de Claude simulada, no la real) —');
  const nubeFalsa = (recordRemoto, fallaEscritura) => `
    window.__escrituras = [];
    (() => {
      let remoto = ${recordRemoto === null ? 'null' : `{ record: ${recordRemoto} }`};
      const db = { doc: (ruta) => ({
        get: async () => ({ exists: remoto !== null, data: () => remoto }),
        set: async (d) => { window.__escrituras.push({ ruta, d }); if (${fallaEscritura}) throw { code: 'quota_exceeded' }; remoto = d; },
      }) };
      const user = { id: async () => 'u_prueba0000000000000000' };
      window.claude = { use: async (n) => (n === 'db' ? db : n === 'user' ? user : null) };
    })();`;
  const c = await abrir(browser, { guiones: [nubeFalsa(42, false)] });
  await espera(300);
  s = await c.E();
  const textoC = await c.page.locator('#panelInicio [data-guardado]').textContent();
  comprobar('Lee el récord de la cuenta y lo muestra', s.record === 42 && s.guardado === 'cuenta' && /tu cuenta de Claude/.test(textoC), `récord ${s.record} · ${textoC}`);
  comprobar('Lo copia también al navegador', (await c.page.evaluate(() => JSON.parse(localStorage.getItem('farolillo:v1')).record)) === 42);
  await c.ctx.close();

  const d = await abrir(browser, { guiones: [nubeFalsa(1, false)] });
  await d.pulsar('#btnJugar');
  await jugarSolo(d, { segundos: 25, hastaPuntos: 4 });
  await d.subir();
  await d.esperarEstado('fin', 30000);
  await espera(300);
  s = await d.E();
  const escrD = await d.page.evaluate(() => window.__escrituras);
  comprobar('Un récord nuevo se escribe en la ruta privada del usuario', s.puntos > 1 && escrD.length === 1 && escrD[0].d.record === s.puntos && escrD[0].ruta === 'data/users/u_prueba0000000000000000/farolillo', JSON.stringify(escrD));
  await d.ctx.close();

  const e2 = await abrir(browser, { guiones: [nubeFalsa(1, true)] });
  await e2.pulsar('#btnJugar');
  await jugarSolo(e2, { segundos: 25, hastaPuntos: 4 });
  await e2.subir();
  await e2.esperarEstado('fin', 30000);
  await e2.page.waitForFunction(() => window.farolillo.estado().panelFin, null, { timeout: 3000 });
  await espera(300);
  const textoE = await e2.page.locator('#panelFin [data-guardado]').textContent();
  comprobar('Si la cuenta rechaza la escritura, lo dice', /No se pudo guardar en tu cuenta/.test(textoE), textoE);
  await e2.ctx.close();

  const f = await abrir(browser, { guiones: [nubeFalsa(1, false), `try { localStorage.setItem('farolillo:v1', JSON.stringify({ record: 9 })); } catch (e) {}`] });
  await espera(300);
  s = await f.E();
  const escrF = await f.page.evaluate(() => window.__escrituras);
  comprobar('Si el navegador tiene un récord mayor, lo sube a la cuenta', s.record === 9 && escrF.length === 1 && escrF[0].d.record === 9, JSON.stringify(escrF));
  await f.ctx.close();

  // ------------------------------------------- 4. Actualización con la partida abierta
  console.log('\n— Actualización en vivo (gancho del visor simulado) —');
  const g = await abrir(browser, { guiones: [`window.claude = { use: async () => null, hot: { snapshot: (fn) => { window.__foto = fn; }, ready: (cb) => setTimeout(() => cb({ estado: 'jugando', puntos: 17, tiempo: 20, fx: 0.3 }), 40) } };`] });
  await espera(200);
  s = await g.E();
  comprobar('Retoma la partida en pausa tras una actualización', s.estado === 'pausa' && s.puntos === 17 && (await g.visible('#notaActualizado')));
  const foto = await g.page.evaluate(() => window.__foto());
  comprobar('Entrega al visor la partida en curso', foto.estado === 'pausa' && foto.puntos === 17, JSON.stringify(foto));
  await g.pulsar('#btnSeguir');
  await espera(300);
  comprobar('Y se puede seguir jugando', (await g.E()).estado === 'jugando');
  await g.ctx.close();

  const h = await abrir(browser, { guiones: [`window.claude = { use: async () => null, hot: { snapshot: () => {}, ready: () => {} } };`] });
  await espera(1700);
  comprobar('Si el visor no responde, el juego arranca igualmente', (await h.E()).estado === 'inicio' && (await h.visible('#panelInicio')));
  await h.ctx.close();

  // -------------------------------------------------------------- 5. Otros tamaños
  console.log('\n— Otros tamaños de pantalla —');
  for (const [nombre, vp] of [['pequeña 320×480', { width: 320, height: 480 }], ['horizontal 740×360', { width: 740, height: 360 }], ['grande 1280×800', { width: 1280, height: 800 }]]) {
    const k = await abrir(browser, { contexto: { viewport: vp, screen: vp } });
    const m = await k.page.evaluate(() => {
      const r = (el) => el.getBoundingClientRect();
      const raiz = r(document.getElementById('juego'));
      const hijos = [...document.querySelectorAll('#panelInicio > *')].filter((el) => getComputedStyle(el).display !== 'none').map((el) => r(el));
      return {
        dentro: hijos.every((c) => c.top >= raiz.top - 0.5 && c.bottom <= raiz.bottom + 0.5 && c.left >= raiz.left && c.right <= raiz.right + 0.5),
        desborda: document.documentElement.scrollWidth > window.innerWidth,
        boton: r(document.getElementById('btnJugar')).height,
      };
    });
    comprobar(`Pantalla ${nombre}: el menú cabe entero`, m.dentro && !m.desborda && m.boton >= 48, `botón ${Math.round(m.boton)} px`);
    await k.page.screenshot({ path: path.join(CAPTURAS, `5-${vp.width}x${vp.height}.png`) });
    await k.pulsar('#btnJugar');
    await espera(2600);
    await k.page.screenshot({ path: path.join(CAPTURAS, `5-${vp.width}x${vp.height}-juego.png`) });
    await k.ctx.close();
  }

  await browser.close();
  sitio.cerrar();
  console.log('\nCapturas en ' + CAPTURAS);
  const fallos = resultados.filter((r) => !r.ok);
  console.log(`\n${resultados.length - fallos.length} de ${resultados.length} comprobaciones correctas`);
  process.exit(fallos.length ? 1 : 0);
})().catch((e) => { console.error('ERROR DE LA PRUEBA:', e); process.exit(2); });
