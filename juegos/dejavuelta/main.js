import { crearJuego } from '@motor/motor.js';
import plataforma from '@plataforma';
import { el, texto, clase, toast, modal, modalOffline, panelAjustes } from '@motor/ui/dom.js';
import { crearPartida } from './sistemas/partida.js';
import { RECUERDOS, vista } from './sistemas/recuerdos.js';
import { CAMINOS, PIEZA } from './sistemas/bucle.js';
import { LOGROS, ENCARGOS } from './sistemas/secretos.js';
import { ERAS, nombreEra, RECURSOS, GEN_TXT, MEJ_TXT, CAMINOS_TXT, FINALES } from './textos.js';
import { crearEscena, acentoEra } from './ui/escena.js';
import { TEMAS, temaValido } from './ui/temas.js';

const j = crearPartida(crearJuego, { plataforma, i18n: { es: Object.fromEntries(Object.entries(RECURSOS).map(([k, v]) => [`recurso.${k}`, v.nombre])) } });
window.juego = j;
const { fmt } = j;
const V = j.vuelta;
const num = (x) => fmt.num(x);
const sinNulos = (...xs) => xs.filter((x) => x !== null && x !== undefined && x !== false);
const sonido = {
  compra: () => j.audio.tono({ f: 520, f2: 780, dur: 0.07, tipo: 'triangle', vol: 0.12 }),
  avivar: () => j.audio.tono({ f: 180 + Math.random() * 60, dur: 0.05, tipo: 'sine', vol: 0.08 }),
  secreto: () => { j.audio.tono({ f: 660, dur: 0.12, tipo: 'sine', vol: 0.15 }); j.audio.tono({ f: 990, dur: 0.2, tipo: 'sine', vol: 0.12, retraso: 0.12 }); },
  salto: () => { j.audio.tono({ f: 80, f2: 1400, dur: 1.2, tipo: 'sawtooth', vol: 0.1 }); j.audio.ruido?.({ dur: 0.8, vol: 0.08 }); },
};

// ---------- estructura ----------
const lienzo = el('canvas', { 'aria-label': 'La escena. Toca para avivar el fuego.' });
const hEra = el('b'), hBucle = el('span'), hParadoja = el('i'), hParTxt = el('span');
const hRiq = el('div.riqueza'), hRiqTasa = el('small');
const hOtros = el('div.otros');
const escenaEl = el('section#escena', {},
  lienzo,
  el('div.hud.arriba', {},
    el('div.hud-izq', {},
      el('span.chip', {}, hEra, hBucle),
      el('span.chip', { title: 'Paradoja: lo que traes del futuro. Los mitos dan producción; demasiada calienta la máquina.' }, el('small', {}, 'Paradoja'), el('div.paradoja', {}, hParadoja), hParTxt)),
    el('button.chip.chip-boton', { onclick: () => abrirAjustes(), 'aria-label': 'Ajustes' }, '⚙')),
  el('div.hud.abajo', {}, el('div', {}, hRiq, hRiqTasa), hOtros));
const PESTANAS = [['construir', 'Construir'], ['saber', 'Saber'], ['cronica', 'Crónica'], ['logros', 'Logros'], ['maquina', 'Máquina']];
const botonesP = {};
const nav = el('nav.pestanas', {}, PESTANAS.map(([id, txt]) => (botonesP[id] = el('button', { onclick: () => abrirPestana(id) }, txt))));
const panel = el('main.panel');
document.body.append(el('div#app', {}, escenaEl, nav, panel), el('div#destello'));

// ---------- estilo visual ----------
const temaActual = () => temaValido(j.ajustes().tema);
function aplicarTema() {
  const t = temaActual();
  document.documentElement.dataset.tema = t;
  lienzo.style.filter = TEMAS[t].filtro ?? '';
  document.documentElement.style.setProperty('--acento', acentoEra(V.era, t));
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--tinta').trim() || '#16110d');
}
function selectorTema(alElegir) {
  const caja = el('div.temas');
  const pintar = () => caja.replaceChildren(...Object.entries(TEMAS).map(([id, t]) => el(`button.tema${id === temaActual() ? '.sel' : ''}`, {
    onclick: () => { j.ajustar('tema', id); aplicarTema(); pintar(); alElegir?.(id); },
  }, el('span.muestra', { style: { background: `linear-gradient(180deg, ${t.muestra[0]} 0 38%, ${t.muestra[1]} 38% 62%, ${t.muestra[2]} 62% 86%, ${t.muestra[3]} 86%)` } }),
  el('b', {}, t.nombre), el('span', {}, t.desc))));
  pintar();
  return caja;
}

const escena = crearEscena(lienzo, j, {
  tema: temaActual,
  alTocar(que, info) {
    if (que === 'avivar' || que === 'hoguera') {
      const x = j.avivar();
      sonido.avivar();
      escena.flotante(escenaEl, info.x, info.y, `+${num(x)}`);
      return;
    }
    const r = j.secretos.tocar(j, que, info);
    if (que === 'sol' && !info.amanecer) { j.avivar(); }
    if (r && que !== 'sol') sonido.secreto();
  },
});

// ---------- pestañas ----------
let pestana = 'construir';
let cantidad = 1;
const vistas = {};
function abrirPestana(id) {
  pestana = id;
  for (const [k, b] of Object.entries(botonesP)) clase(b, 'activa', k === id);
  if (id === 'cronica') { cronicaNueva = false; }
  panel.replaceChildren(vistas[id].raiz);
  vistas[id].reconstruir?.();
  panel.scrollTop = 0;
}

// Tarjeta de compra genérica (generador, hito, saber, máquina o taller)
function carta(id, { clase: c = '', nombre, desc, tasa } = {}) {
  const [n0, d0] = GEN_TXT[id] ?? MEJ_TXT[id] ?? [id, ''];
  const eNom = el('span.nombre', {}, nombre ?? n0, el('em'));
  const eDesc = el('span.desc', {}, desc ?? d0);
  const eCoste = el('span.coste');
  const eBarra = el('i');
  const b = el(`button.carta${c ? '.' + c : ''}`, {
    onclick: () => {
      const k = j.datos.generadores[id] ? (cantidad === 'max' ? 'max' : cantidad) : 1;
      if (j.comprar(id, k)) sonido.compra();
    },
  }, eNom, eDesc, eCoste, el('span.barra', {}, eBarra));
  const gen = !!j.datos.generadores[id];
  b.actualizar = () => {
    const max = j.maxNivel(id), n = j.comprados(id);
    const hecha = !gen && n >= max;
    clase(b, 'hecha', hecha);
    texto(eNom.lastChild, gen ? (j.cuantos(id) ? `×${num(j.cuantos(id))}` : '') : (max > 1 ? `${n}/${max}` : ''));
    if (gen && tasa !== false) {
      const prod = Object.entries(j.datos.generadores[id].produce)[0];
      const porUnidad = j.valor(id, prod[1]).mul(j.mult(`prod:${prod[0]}`)).mul(j.mult('produccion'));
      texto(eDesc, `${d0} · ${num(porUnidad)} ${RECURSOS[prod[0]].simbolo}/s c/u`);
    }
    if (hecha) { eCoste.replaceChildren('✓'); b.disabled = true; eBarra.style.width = '100%'; return; }
    const k = gen ? (cantidad === 'max' ? Math.max(1, j.cuantosAsequibles(id)) : cantidad) : 1;
    const coste = j.coste(id, k);
    const partes = Object.entries(coste).map(([r, x]) => `${num(x)} ${RECURSOS[r].simbolo}`);
    const sig = partes.join(' · ') + (gen && k > 1 ? ` (×${k})` : '');
    if (eCoste.dataset.v !== sig) { eCoste.dataset.v = sig; eCoste.replaceChildren(...partes.map((p) => el('span', {}, p)), gen && k > 1 ? el('span.falta', {}, `×${k}`) : ''); }
    b.disabled = !j.puedeComprar(id, k);
    // barra: cuánto falta del recurso más lejano
    let frac = 1;
    for (const [r, x] of Object.entries(coste)) frac = Math.min(frac, j.cantidad(r).div(x.max(1e-9)).toNumber());
    eBarra.style.width = `${Math.min(100, frac * 100).toFixed(1)}%`;
  };
  return b;
}

function selectorCantidad() {
  const ops = [[1, '×1'], [10, '×10'], ['max', 'Máx']];
  const s = el('span.cantidad-sel', {}, ops.map(([v, t]) => el('button', { onclick: () => { cantidad = v; for (const x of s.children) clase(x, 'activa', x.textContent === t); } }, t)));
  for (const x of s.children) clase(x, 'activa', x.textContent === ops.find(([v]) => v === cantidad)[1]);
  return s;
}

vistas.construir = (() => {
  const raiz = el('div');
  let cartas = [];
  return {
    raiz,
    reconstruir() {
      cartas = [];
      const hitos = Object.keys(j.datos.mejoras).filter((id) => j.datos.mejoras[id].tipo === 'hito' && j.desbloqueado(id) && !j.nivel(id));
      const sigHito = hitos[0];
      const secHito = el('section.seccion', {}, el('h3', {}, 'Siguiente era'));
      if (V.puedeElegirCamino()) {
        secHito.append(el('button.carta.hito', { onclick: elegirCamino }, el('span.nombre', {}, 'Elegir camino'), el('span.desc', {}, 'Hierro, Río o Estrellas. Cada camino trae su pieza de la máquina.'), el('span.coste', {}, '—')));
      } else if (sigHito) {
        const c = carta(sigHito, { clase: 'hito' }); cartas.push(c); secHito.append(c);
      } else if (V.era >= 8) {
        secHito.append(el('p.vacio', {}, 'No hay más eras. Solo queda la máquina.'));
      }
      const gens = Object.keys(j.datos.generadores).filter((id) => j.desbloqueado(id) && (!j.datos.generadores[id].camino || j.datos.generadores[id].camino === V.camino))
        .sort((a, b) => j.datos.generadores[b].era - j.datos.generadores[a].era);
      const lista = el('div.lista', {}, gens.map((id) => { const c = carta(id); cartas.push(c); return c; }));
      raiz.replaceChildren(...sinNulos(secHito, el('section.seccion', {}, el('h3', {}, 'Construir', selectorCantidad()), lista)));
    },
    actualizar() { for (const c of cartas) c.actualizar(); },
  };
})();

vistas.saber = (() => {
  const raiz = el('div');
  let cartas = [];
  return {
    raiz,
    reconstruir() {
      const ids = Object.keys(j.datos.mejoras).filter((id) => j.datos.mejoras[id].tipo === 'saber' && j.desbloqueado(id));
      const pend = ids.filter((id) => !j.nivel(id)).sort((a, b) => j.coste(a).ideas.cmp(j.coste(b).ideas));
      const hechos = ids.filter((id) => j.nivel(id));
      cartas = pend.map((id) => carta(id));
      raiz.replaceChildren(...sinNulos(
        el('section.seccion', {}, el('h3', {}, 'Saberes'),
          j.total('ideas').lte(0) && V.era < 2 ? el('p.vacio', {}, 'Todavía nadie tiene ideas. Hace falta barro: vasijas, dibujos, cuentas.') : null,
          el('div.lista', {}, cartas, pend.length || V.era < 2 ? null : el('p.vacio', {}, 'Nada nuevo que aprender por ahora.'))),
        hechos.length ? el('section.seccion', {}, el('h3', {}, `Sabido (${hechos.length})`), el('p.nota', {}, hechos.map((id) => MEJ_TXT[id][0]).join(' · '))) : null));
    },
    actualizar() { for (const c of cartas) c.actualizar(); },
  };
})();

// ---------- crónica ----------
let cronicaNueva = false;
const reves = () => V.estado.activos.some((l) => l.id === 'alfabeto' && l.mutado);
const voltear = (s) => [...s].reverse().join('');
vistas.cronica = (() => {
  const raiz = el('div');
  const respuestas = [];
  const linea = (l) => {
    const t = reves() ? voltear(l.texto) : l.texto;
    const cuerpo = l.pista ? el('span.pista', { onclick: () => {
      const r = j.secretos.tocarPista(j, l.pista);
      if (r) { respuestas.push({ tras: l, texto: r }); sonido.secreto(); }
      vistas.cronica.reconstruir();
    } }, t) : t;
    return el(`p${l.importante ? '.importante' : ''}`, {}, el('time', {}, `${nombreEra(l.era, V.camino)} · ${fmt.tiempo(l.t)}`), cuerpo);
  };
  return {
    raiz,
    reconstruir() {
      const ls = j.cronica.lineas;
      const nodos = [];
      for (let i = ls.length - 1; i >= 0; i--) {
        for (const r of respuestas.filter((x) => x.tras === ls[i]).reverse()) nodos.push(el('p.respuesta', {}, r.texto));
        nodos.push(linea(ls[i]));
      }
      const arch = j.cronica.archivo.slice().reverse();
      raiz.replaceChildren(...sinNulos(
        el('section.seccion.cronica', {}, el('h3', {}, `Bucle ${V.bucleN + 1}`), nodos),
        arch.length ? el('details.archivo', {}, el('summary', {}, `Bucles anteriores (${arch.length})`),
          arch.map((a) => el('div.cronica.viejo', {}, el('h3', {}, `Bucle ${a.n} · ${a.camino ? CAMINOS_TXT[a.camino].nombre : '—'}`), a.lineas.map((t) => el('p', {}, t))))) : null));
    },
  };
})();

// ---------- logros ----------
vistas.logros = (() => {
  const raiz = el('div');
  return {
    raiz,
    reconstruir() {
      const lg = j.estado.logros;
      const n = Object.keys(LOGROS).filter((id) => lg[id]).length;
      const encs = j.secretos.encargosVistos();
      raiz.replaceChildren(...sinNulos(
        encs.length ? el('section.seccion', {}, el('h3', {}, 'Encargos'), encs.map((id) => {
          const e = ENCARGOS[id], hecho = j.secretos.estado.enc[id]?.hecho;
          return el(`div.encargo${hecho ? '.hecho' : ''}`, {}, el('b', {}, (hecho ? '✓ ' : '') + e.nombre), el('p', {}, hecho ? e.premio : e.paso));
        })) : null,
        el('section.seccion', {}, el('h3', {}, `Logros · ${n}/${Object.keys(LOGROS).length}`, el('span', {}, `producción +${n * 4} %`)),
          el('div.logros', {}, Object.entries(LOGROS).map(([id, l]) => {
            const si = !!lg[id];
            if (l.secreto && !si) return el('div.logro.no.secreto', {}, el('b', {}, '???'), el('span', {}, 'Secreto'));
            return el(`div.logro${si ? '.si' : '.no'}${l.secreto ? '.secreto' : ''}`, {}, el('b', {}, l.nombre), el('span', {}, l.desc));
          })))));
    },
  };
})();

// ---------- máquina ----------
vistas.maquina = (() => {
  const raiz = el('div');
  let cartas = [], palanca, notaEcos;
  return {
    raiz,
    reconstruir() {
      cartas = [];
      const p = V.estado.piezas;
      const piezas = el('div.maquina-estado', {}, CAMINOS.map((c) => el(`div.pieza${p[PIEZA[c]] ? '.si' : ''}`, {},
        el('span.ico', {}, { hierro: '⚙', rio: '◷', estrellas: '◎' }[c]), CAMINOS_TXT[c].pieza, el('br'), el('small', {}, p[PIEZA[c]] ? 'conseguida' : `camino ${CAMINOS_TXT[c].nombre}`))));
      const comps = ['bastidor', 'bobina', 'nucleo'].map((id) => { const c = carta(id); cartas.push(c); return c; });
      palanca = el('button.boton-grande', { onclick: abrirMaleta }, 'Tirar de la palanca');
      notaEcos = el('p.nota');
      const taller = Object.keys(j.datos.mejoras).filter((id) => j.datos.mejoras[id].tipo === 'taller').map((id) => { const c = carta(id); cartas.push(c); return c; });
      const hist = V.estado.historial;
      raiz.replaceChildren(...sinNulos(
        el('section.seccion', {}, el('h3', {}, 'Piezas de latón'), piezas,
          el('p.nota', {}, V.reparada() ? 'La máquina está entera. El próximo salto puede ser el último.' : 'Cada camino esconde una pieza en su monumento. Con las tres, la máquina dejaría de estar rota.')),
        el('section.seccion', {}, el('h3', {}, 'La máquina'),
          V.era < 8 ? el('p.vacio', {}, `Se construye en la era de Cronos. Ahora estás en: ${nombreEra(V.era, V.camino)}.`) : el('div.lista', {}, comps),
          j.secretos.puedeCompararTornillos(j) ? el('button.carta', { onclick: () => { j.secretos.compararTornillos(j); sonido.secreto(); vistas.maquina.reconstruir(); } },
            el('span.nombre', {}, 'Comparar los tornillos'), el('span.desc', {}, 'Los doce tornillos de la cueva. Una marca grabada a mano.'), el('span.coste', {}, '?')) : null,
          el('div', { style: { marginTop: '10px' } }, palanca), notaEcos),
        V.estado.historial.length || j.cantidad('ecos').gt(0) ? el('section.seccion', {}, el('h3', {}, 'Taller', el('span', {}, `${num(j.cantidad('ecos'))} ◌`)),
          el('p.nota', {}, 'Los Ecos que no gastas multiplican la producción (+12 % cada uno). Los que gastas aquí no vuelven.'), el('div.lista', {}, taller)) : null,
        hist.length ? el('section.seccion', {}, el('h3', {}, 'Líneas temporales'), el('table.historial', {},
          el('tr', {}, el('th', {}, '#'), el('th', {}, 'Camino'), el('th', {}, 'Duración'), el('th', {}, 'Ecos')),
          hist.slice(-12).reverse().map((h) => el('tr', {}, el('td', {}, h.n), el('td', {}, h.camino ? CAMINOS_TXT[h.camino].nombre : '—'), el('td', {}, fmt.tiempo(h.duracion)), el('td', {}, `+${num(h.ecos)}`))))) : null));
    },
    actualizar() {
      for (const c of cartas) c.actualizar();
      if (!palanca) return;
      const puede = j.prestigio.salto.puede();
      palanca.disabled = !puede;
      texto(notaEcos, puede ? `Al saltar ganarías ${num(j.prestigio.salto.ganancia())} Ecos (tienes ${num(j.cantidad('ecos'))}).`
        : V.maquinaLista(j) ? 'La máquina está lista, pero esta línea aún no ha dejado eco suficiente.' : 'La palanca no hace nada mientras la máquina esté incompleta.');
    },
  };
})();

// ---------- modales de la historia ----------
function elegirCamino() {
  if (!V.puedeElegirCamino()) return;
  const forzado = V.caminoForzado();
  const m = modal('La Encrucijada', [
    el('p', {}, forzado ? 'El mapa de un sitio que no existe ya ha decidido por ti. Toca cualquiera: da igual.' : 'El pueblo te mira. Hay tres caminos y solo se puede andar uno.'),
    el('div.opciones', {}, CAMINOS.map((c) => el('button.opcion', { onclick: () => { const r = V.elegirCamino(c, j); m.cerrar(); if (forzado) toast(`El mapa elige: ${CAMINOS_TXT[r].nombre}`); } },
      el('b', {}, CAMINOS_TXT[c].nombre), el('span', {}, CAMINOS_TXT[c].lema),
      el('small', {}, V.estado.piezas[PIEZA[c]] ? `Ya tienes su pieza (${CAMINOS_TXT[c].pieza}).` : `Pieza: ${CAMINOS_TXT[c].pieza}`)))),
  ], { botones: [{ texto: 'Luego' }] });
}

function abrirMaleta() {
  if (!j.prestigio.salto.puede()) return;
  const cap = V.capacidad(j);
  const disp = V.disponibles(j);
  const sel = new Set();
  const vistas_ = V.estado.averiasVistas;
  const cuenta = el('span');
  const ops = disp.map((id) => {
    const r = RECUERDOS[id];
    const b = el('button.opcion', { onclick: () => {
      if (sel.has(id)) sel.delete(id); else if (sel.size < cap) sel.add(id);
      for (const o of ops) clase(o.b, 'sel', sel.has(o.id));
      texto(cuenta, `${sel.size}/${cap}`);
    } }, el('b', {}, r.nombre), el('span', {}, r.desc),
    el('small', {}, `Paradoja +${r.par} · Si se avería: ${vistas_[id] ? r.mut.nombre : '???'}`));
    return { id, b };
  });
  texto(cuenta, `0/${cap}`);
  const pSin = V.probSinAveria(j);
  const nAv = V.averiasPorSalto();
  const avisoAveria = pSin >= 1 ? 'La máquina ya no se avería.'
    : `${pSin > 0 ? `${Math.round(pSin * 100)} % de que todo llegue bien; si no, ` : ''}${nAv === 2 ? 'dos recuerdos' : 'uno de los recuerdos'} (al azar, con la misma probabilidad) llegará cambiado.`;
  const m = modal('La maleta', [
    el('p', {}, 'La máquina solo deja pasar unos pocos recuerdos. Elige qué te llevas al Año Uno.'),
    el('p.nota', {}, el('b', {}, 'Huecos: '), cuenta, ` · ${avisoAveria}`),
    el('div.opciones', {}, ops.map((o) => o.b), disp.length ? null : el('p.vacio', {}, 'No hay nada que llevarse de esta línea.')),
    el('p.nota', {}, `Ganarás ${num(j.prestigio.salto.ganancia())} Ecos. Se pierde todo lo demás.`),
  ], { botones: [
    { texto: 'Me quedo' },
    { texto: 'Saltar', clase: 'violeta', accion: () => { m.cerrar(); if (V.reparada()) decidirFinal([...sel]); else saltar([...sel]); return false; } },
  ] });
}

function decidirFinal(ids) {
  const m = modal('La máquina, entera', [
    el('p.cita', {}, FINALES.intro),
    el('div.opciones', {},
      el('button.opcion', { onclick: () => { m.cerrar(); saltar(ids, 'cerrar'); } }, el('b', {}, FINALES.cerrar.boton), el('span', {}, FINALES.cerrar.desc)),
      el('button.opcion', { onclick: () => { m.cerrar(); saltar(ids, 'romper'); } }, el('b', {}, FINALES.romper.boton), el('span', {}, FINALES.romper.desc)),
      el('button.opcion', { onclick: () => { m.cerrar(); saltar(ids); } }, el('b', {}, 'Saltar sin pensarlo'), el('span', {}, 'Como siempre. Ya decidirás en otra vida.'))),
  ], { botones: [{ texto: 'Todavía no' }] });
}

function saltar(ids, final = null) {
  const dest = document.getElementById('destello');
  dest.classList.add('on');
  sonido.salto();
  setTimeout(() => {
    const llegan = V.saltar(j, ids, { final });
    escena.destellar();
    dest.classList.remove('on');
    if (!llegan) return;
    reconstruirTodo();
    abrirPestana('construir');
    if (final) creditos(final);
    else llegada(llegan);
  }, 900);
}

function llegada(llegan) {
  const cuerpo = [el('p.cita', {}, V.bucleN === 1 ? 'Año Uno. La hoguera está donde siempre. Tú no deberías.' : 'Año Uno. Otra vez. Huele igual.')];
  if (!llegan.length) cuerpo.push(el('p', {}, 'No has traído nada. Solo el eco de lo que fuiste.'));
  else cuerpo.push(el('div.opciones', {}, llegan.map((l) => { const v = vista(l); return el(`div.opcion${l.mutado ? '.mutado' : ''}`, {}, el('b', {}, (l.mutado ? '⚠ ' : '') + v.nombre), el('span', {}, v.desc)); })));
  if (llegan.some((l) => l.mutado)) cuerpo.push(el('p.nota', {}, 'La máquina sigue rota: algo ha llegado cambiado.'));
  cuerpo.push(el('p.nota', {}, `Ecos: ${num(j.cantidad('ecos'))} (producción ×${num(j.mult('produccion'))} en total). Paradoja: ${Math.round(V.paradoja)} %.`));
  modal(`Bucle ${V.bucleN + 1}`, cuerpo, { botones: [{ texto: 'A trabajar', clase: 'principal' }] });
}

function creditos(final) {
  const hist = V.estado.historial;
  const txt = FINALES[final].texto;
  modal(final === 'cerrar' ? 'Fin' : 'Otra vez', [
    el('p.cita', {}, txt),
    el('div.creditos', {},
      el('h4', {}, 'Civilizaciones'), hist.map((h) => el('div', {}, `Línea ${h.n}: ${h.camino ? CAMINOS_TXT[h.camino].nombre : 'sin camino'}, ${fmt.tiempo(h.duracion)}`)),
      el('h4', {}, 'Con la participación de'), el('div', {}, 'Una tribu pequeña · Una hoguera · Doce tornillos de latón'), el('div', {}, 'Un hombre con una venda rosa · Una mariposa (in memoriam)'),
      el('h4', {}, 'Escrito por'), el('div', {}, 'Ti. Varias veces.'),
      el('h4', {}, ''), el('div', {}, final === 'cerrar' ? 'La partida sigue: puedes seguir saltando, pero la máquina ya no se avería.' : 'La partida sigue. Los Ecos valen el doble para siempre.')),
  ], { botones: [{ texto: 'Seguir', clase: 'violeta' }] });
}

function abrirAjustes() {
  panelAjustes(j, { extra: el('div', {},
    el('p.nota', {}, el('b', {}, 'Estilo')), selectorTema(),
    el('p.nota', {}, el('b', {}, 'Cómo se juega. '), 'Toca la escena para avivar el fuego. Construye, aprende y avanza eras. En la Encrucijada eliges camino. En Cronos se monta la máquina: al tirar de la palanca vuelves al Año Uno con unos pocos recuerdos... y alguno llegará cambiado.'),
    el('p.nota', {}, 'La escena esconde cosas. La Crónica, también.')) });
}

// ---------- HUD y bucle de render ----------
function nombreRiqueza() { return ERAS[V.era].riqueza; }
let eraPintada = 0;
j.alRender(() => {
  if (V.era !== eraPintada) { eraPintada = V.era; document.documentElement.style.setProperty('--acento', acentoEra(V.era, temaActual())); }
  texto(hEra, nombreEra(V.era, V.camino));
  texto(hBucle, `· bucle ${V.bucleN + 1}`);
  hParadoja.style.width = `${Math.min(100, V.paradoja)}%`;
  texto(hParTxt, `${Math.round(V.paradoja)} %`);
  texto(hRiq, `${num(j.cantidad('riqueza'))} ◈`);
  texto(hRiqTasa, `${nombreRiqueza()} · ${fmt.tasa(j.tasa('riqueza'))}`);
  const otros = ['ideas', 'energia', 'cronos', 'ecos'].filter((r) => j.totalCapa(r).gt(0) || (r === 'ecos' && j.cantidad(r).gt(0)));
  const sig = otros.join();
  if (hOtros.dataset.sig !== sig) { hOtros.dataset.sig = sig; hOtros.replaceChildren(...otros.map((r) => el('span', { dataset: { r } }, el('b'), ` ${RECURSOS[r].simbolo} `, el('small')))); }
  for (const s of hOtros.children) {
    const r = s.dataset.r;
    texto(s.firstChild, num(j.cantidad(r)));
    texto(s.lastChild, r === 'ecos' ? '' : `+${num(j.tasa(r))}/s`);
  }
  botonesP.maquina.hidden = V.era < 6 && !V.estado.historial.length;
  clase(botonesP.cronica, 'aviso', cronicaNueva);
  botonesP.cronica.replaceChildren('Crónica', cronicaNueva ? el('span.punto') : '');
  vistas[pestana].actualizar?.();
});

function reconstruirTodo() { vistas[pestana].reconstruir?.(); }
let pendienteRe = false;
const reconstruirPronto = () => { if (pendienteRe) return; pendienteRe = true; requestAnimationFrame(() => { pendienteRe = false; reconstruirTodo(); }); };
j.on('desbloqueo', reconstruirPronto);
j.on('era', () => { reconstruirPronto(); if (V.puedeElegirCamino()) setTimeout(elegirCamino, 600); });
j.on('camino', reconstruirPronto);
j.on('compra', ({ id }) => { if (!j.datos.generadores[id]) reconstruirPronto(); });
j.on('cronica', () => { if (pestana === 'cronica') reconstruirPronto(); else cronicaNueva = true; });
j.on('encargo', ({ fase }) => { if (fase === 'hecho') { toast('✦ Encargo cumplido'); sonido.secreto(); } if (pestana === 'logros') reconstruirPronto(); });
j.on('pieza', ({ pieza, nueva }) => { if (nueva) toast(`Pieza de latón: ${CAMINOS_TXT[Object.keys(PIEZA).find((c) => PIEZA[c] === pieza)].pieza}`); });
j.on('logro', ({ def }) => {
  toast(def.secreto ? `✦ Logro secreto: ${def.nombre}` : `Logro: ${def.nombre}`);
  if (def.secreto) sonido.secreto();
  if (pestana === 'logros') reconstruirPronto();
});
j.on('offline', (r) => { if (r.segundos > 60) modalOffline(j, r, { nombres: Object.fromEntries(Object.entries(RECURSOS).map(([k, v]) => [k, `${v.simbolo} ${v.nombre}`])) }); });
j.on('cargado', () => location.reload());

aplicarTema();
await j.iniciar();
aplicarTema();
abrirPestana('construir');
if (!j.estado.tiempo || j.estado.tiempo < 2) {
  modal('Déjà Vuelta', [
    el('p.cita', {}, 'Año Uno. Una tribu pequeña alrededor de una hoguera pequeña.'),
    el('p', {}, 'Toca la escena para avivar el fuego y conseguir bayas. Con ellas, la tribu crece. Con el tiempo, mucho tiempo, construirá una máquina para volver aquí.'),
    el('p.nota', {}, 'Ya ha pasado otras veces. Pero eso todavía no lo sabes.'),
    el('p.nota', {}, el('b', {}, 'Elige un estilo'), ' (se puede cambiar en ⚙):'), selectorTema(),
  ], { botones: [{ texto: 'Empezar', clase: 'principal' }] });
}
if (V.puedeElegirCamino()) setTimeout(elegirCamino, 800);
