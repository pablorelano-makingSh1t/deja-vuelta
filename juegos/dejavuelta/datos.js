// Déjà Vuelta: economía en datos. Los sistemas propios (bucle, secretos, crónica) están en sistemas/.
import { N } from '../../motor/numeros/num.js';

const era = (n) => (j) => (j.vuelta?.era ?? 1) >= n;
const camino = (c, n) => (j) => j.vuelta?.camino === c && (j.vuelta?.era ?? 1) >= n;
const r = (base, ratio = 1.15) => ({ base, ratio });

// Cada línea temporal pesa más que la anterior: hitos y máquina cuestan ×2,5 por bucle (hasta ×100).
// La fija el sistema del bucle (no se guarda: se calcula de bucleN).
export const ESCALA = { v: 1 };
export const escalaDeBucle = (n) => Math.min(100, 2.5 ** n);
const escalado = (coste) => Object.fromEntries(Object.entries(coste).map(([k, x]) => [k, () => N(x).mul(ESCALA.v)]));

// Generadores. `era` y `camino` los usa la UI para agruparlos; `desbloqueo` manda.
export const GENERADORES = {
  // Era 1 · Hoguera
  recolectora: { era: 1, produce: { riqueza: 0.5 }, coste: { riqueza: r(10, 1.13) } },
  cazadores:   { era: 1, produce: { riqueza: 4 }, coste: { riqueza: r(110, 1.14) }, desbloqueo: { tiene: 'recolectora', min: 3 } },
  // Era 2 · Barro
  campo:       { era: 2, produce: { riqueza: 32 }, coste: { riqueza: r(1300) }, desbloqueo: era(2) },
  alfar:       { era: 2, produce: { ideas: 0.6 }, coste: { riqueza: r(3500) }, desbloqueo: era(2) },
  // Era 3 · Encrucijada
  aldea:       { era: 3, produce: { riqueza: 260 }, coste: { riqueza: r(1.6e4) }, desbloqueo: era(3) },
  escriba:     { era: 3, produce: { ideas: 4 }, coste: { riqueza: r(5e4), ideas: r(150, 1.16) }, desbloqueo: era(3) },
  // Era 4 y 5 · un par por camino
  forja:       { era: 4, camino: 'hierro', produce: { riqueza: 3200 }, coste: { riqueza: r(2.4e5) }, desbloqueo: camino('hierro', 4) },
  academia:    { era: 4, camino: 'hierro', produce: { ideas: 30 }, coste: { riqueza: r(7e5), ideas: r(2500) }, desbloqueo: camino('hierro', 4) },
  fundicion:   { era: 5, camino: 'hierro', produce: { riqueza: 3.5e4 }, coste: { riqueza: r(4e6) }, desbloqueo: camino('hierro', 5) },
  estadomayor: { era: 5, camino: 'hierro', produce: { ideas: 260 }, coste: { riqueza: r(1.2e7), ideas: r(4e4) }, desbloqueo: camino('hierro', 5) },
  mercado:     { era: 4, camino: 'rio', produce: { riqueza: 2200 }, coste: { riqueza: r(2.2e5) }, desbloqueo: camino('rio', 4) },
  templo:      { era: 4, camino: 'rio', produce: { ideas: 50 }, coste: { riqueza: r(6e5), ideas: r(2000) }, desbloqueo: camino('rio', 4) },
  gremio:      { era: 5, camino: 'rio', produce: { riqueza: 2.6e4 }, coste: { riqueza: r(3.6e6) }, desbloqueo: camino('rio', 5) },
  puente:      { era: 5, camino: 'rio', produce: { ideas: 400 }, coste: { riqueza: r(1e7), ideas: r(3.5e4) }, desbloqueo: camino('rio', 5) },
  observatorio:{ era: 4, camino: 'estrellas', produce: { riqueza: 1500 }, coste: { riqueza: r(2e5) }, desbloqueo: camino('estrellas', 4) },
  biblioteca:  { era: 4, camino: 'estrellas', produce: { ideas: 80 }, coste: { riqueza: r(5e5), ideas: r(1500) }, desbloqueo: camino('estrellas', 4) },
  lentes:      { era: 5, camino: 'estrellas', produce: { riqueza: 1.8e4 }, coste: { riqueza: r(3e6) }, desbloqueo: camino('estrellas', 5) },
  universidad: { era: 5, camino: 'estrellas', produce: { ideas: 700 }, coste: { riqueza: r(8e6), ideas: r(3e4) }, desbloqueo: camino('estrellas', 5) },
  // Era 6 · Chispa
  dinamo:      { era: 6, produce: { energia: 6 }, coste: { riqueza: r(6e7) }, desbloqueo: era(6) },
  ciudad:      { era: 6, produce: { riqueza: 4e5 }, coste: { riqueza: r(1.5e8), energia: r(200) }, desbloqueo: era(6) },
  // Era 7 · Átomo
  reactor:     { era: 7, produce: { energia: 150 }, coste: { riqueza: r(4e9), ideas: r(5e6) }, desbloqueo: era(7) },
  laboratorio: { era: 7, produce: { ideas: 2.4e4 }, coste: { riqueza: r(9e9), energia: r(2e4) }, desbloqueo: era(7) },
  // Era 8 · Cronos
  acelerador:  { era: 8, produce: { cronos: 0.5 }, coste: { energia: r(3e5, 1.18) }, desbloqueo: era(8) },
  relojeros:   { era: 8, produce: { cronos: 6 }, coste: { energia: r(5e6, 1.2), riqueza: r(5e11, 1.2) }, desbloqueo: { tiene: 'acelerador', min: 5 } },
};

// Hitos: cada uno abre la era siguiente. El de la era 3 no tiene precio: es elegir camino (UI).
export const HITOS = {
  sembrar:      { a: 2, coste: { riqueza: 700 } },
  escritura:    { a: 3, coste: { riqueza: 6e3, ideas: 50 } },
  monumento:    { a: 5, coste: { riqueza: 2.5e6, ideas: 2.5e4 }, desbloqueo: era(4) },
  electricidad: { a: 6, coste: { riqueza: 8e7, ideas: 6e5 }, desbloqueo: era(5) },
  fision:       { a: 7, coste: { riqueza: 6e9, ideas: 8e6, energia: 6e4 }, desbloqueo: era(6) },
  cronologia:   { a: 8, coste: { riqueza: 4e10, ideas: 3e7, energia: 2e5 }, desbloqueo: era(7) },
};

// Piezas de la máquina (mejoras del bucle). La del camino la da el sistema al cruzar el monumento.
export const MAQUINA = {
  bastidor: { coste: { riqueza: 4e10 } },
  bobina:   { coste: { energia: 1e6 } },
  nucleo:   { coste: { cronos: 150 } },
};

// Saberes: cuestan ideas (y a veces riqueza). [id, coste ideas, objetivo, mult, desbloqueo]
const SABERES = [
  ['pedernal', 30, 'recolectora', 3, era(2)],
  ['lanzas', 90, 'cazadores', 3, era(2)],
  ['arado', 400, 'campo', 3, era(2)],
  ['torno', 800, 'alfar', 3, era(2)],
  ['calendario', 2500, 'produccion', 2, era(3)],
  ['tinta', 6000, 'escriba', 3, era(3)],
  ['ley', 1.5e4, 'aldea', 3, era(3)],
  ['acero', 3e4, 'forja', 3, camino('hierro', 4)],
  ['estrategia', 2e5, 'fundicion', 3, camino('hierro', 5)],
  ['moneda', 3e4, 'mercado', 3, camino('rio', 4)],
  ['rito', 2e5, 'gremio', 3, camino('rio', 5)],
  ['astrolabio', 3e4, 'observatorio', 4, camino('estrellas', 4)],
  ['optica', 2e5, 'lentes', 4, camino('estrellas', 5)],
  ['imprenta', 8e4, 'prod:ideas', 3, era(4)],
  ['banca', 6e5, 'produccion', 3, era(5)],
  ['bombilla', 3e6, 'ciudad', 3, era(6)],
  ['turbina', 6e6, 'dinamo', 4, era(6)],
  ['moderador', 4e7, 'reactor', 3, era(7)],
  ['superconductor', 1.5e8, 'produccion', 4, era(7)],
  ['relatividad', 6e8, 'prod:cronos', 3, era(8)],
  ['cuerdas', 4e9, 'relojeros', 3, (j) => j.cuantos('relojeros') >= 5],
];

// Taller: se paga con Ecos y no se pierde al saltar.
export const TALLER = {
  maleta:       { max: 4, coste: (n) => [3, 20, 90, 400][n] },
  estabilizador:{ max: 2, coste: (n) => [12, 150][n] },
  callos:       { max: 3, coste: (n) => 2 * 6 ** n },
  arranque:     { max: 1, coste: () => 6 },
  bolsillo:     { max: 2, coste: (n) => [10, 80][n] },
  intuicion:    { max: 5, coste: (n) => 5 * 4 ** n },
};

function construir() {
  const generadores = {};
  for (const [id, g] of Object.entries(GENERADORES)) generadores[id] = { ...g, desbloqueo: g.desbloqueo ?? era(g.era) };
  const mejoras = {};
  for (const [id, h] of Object.entries(HITOS)) {
    mejoras[id] = { tag: 'run', tipo: 'hito', coste: escalado(h.coste), max: 1, desbloqueo: h.desbloqueo ?? era(h.a - 1),
      alComprar: (j) => j.vuelta.avanzarEra(h.a, j) };
  }
  for (const [id, m] of Object.entries(MAQUINA)) {
    mejoras[id] = { tag: 'run', tipo: 'maquina', coste: escalado(m.coste), max: 1, desbloqueo: era(8) };
  }
  for (const [id, ideas, objetivo, mult, desbloqueo] of SABERES) {
    mejoras[id] = { tag: 'run', tipo: 'saber', coste: { ideas }, max: 1, desbloqueo, efecto: { objetivo, mult } };
  }
  for (const [id, t] of Object.entries(TALLER)) {
    mejoras[id] = { tag: 'taller', tipo: 'taller', max: t.max, coste: { ecos: (n) => N(n < t.max ? t.coste(n) : 1e300) } };
  }
  // efectos del taller
  mejoras.callos.efecto = { objetivo: 'click:riqueza', mult: 3 };
  mejoras.bolsillo.efecto = { objetivo: 'offline:tope', suma: 4 };
  mejoras.intuicion.efecto = { objetivo: 'prestigio:salto', mult: 1.35 };
  return { generadores, mejoras };
}
const { generadores, mejoras } = construir();

export default {
  id: 'dejavuelta', version: 1,
  clickRecurso: 'riqueza', click: { riqueza: 1 },
  recursos: { riqueza: {}, ideas: {}, energia: {}, cronos: {}, ecos: {} },
  generadores, mejoras,
  prestigio: [{
    id: 'salto', moneda: 'ecos', basadoEn: 'riqueza.totalCapa',
    // ~6-10 Ecos en el primer salto; crece despacio para que cada bucle cuente.
    formula: (x) => (x.lt(2e10) ? N(0) : x.div(2e10).pow(0.3).mul(5).floor()),
    reinicia: ['recursos:*', 'generadores', 'mejoras:run', 'desbloqueos'],
    requiere: (j) => j.vuelta.maquinaLista(j),
    efectoMoneda: { objetivo: 'produccion', mult: (c) => N(1).add(c.mul(0.12)) },
  }],
  logros: {}, // los rellena sistemas/secretos.js
  offline: { topeHoras: 8, eficiencia: 0.5 },
};
