// El bucle: era, camino, Paradoja, maleta, avería, piezas de la máquina y finales. Sin DOM.
import { N } from '../../../motor/numeros/num.js';
import { RECUERDOS, vista } from './recuerdos.js';
import { ESCALA, escalaDeBucle } from '../datos.js';

export const CAMINOS = ['hierro', 'rio', 'estrellas'];
export const PIEZA = { hierro: 'engranaje', rio: 'pendulo', estrellas: 'lente' };
const PERIODO_RIO = 120; // s: una «estación» completa del río

function inicial() {
  return {
    era: 1, camino: null, tBucle: 0, paradoja: 0,
    activos: [],           // recuerdos en efecto este bucle: {id, mutado, extra}
    piezas: {},            // engranaje/pendulo/lente: para siempre
    caminosHechos: {},
    averiasVistas: {},
    historial: [],         // un registro por bucle terminado
    finales: {},           // cerrar / romper
    saltosDia: [],         // fechas (día) de los saltos, para la marmota
    extraMaleta: 0,        // huecos ganados con encargos
    estabilidadExtra: 0,   // probabilidad extra de que no haya avería
    sinAverias: false,     // tras cerrar el bucle
    ecosExtra: 1,          // tras romperla otra vez
    ultimaAveria: null,    // para enseñarla al llegar
    picoParadoja: 0,
  };
}

export function crearSistemaBucle({ azar = Math.random } = {}) {
  let s = inicial();
  let acum = 0;

  const api = {
    id: 'bucle',
    get estado() { return s; },
    get era() { return s.era; },
    get camino() { return s.camino; },
    get paradoja() { return s.paradoja; },
    get bucleN() { return s.historial.length; }, // 0 en el primer bucle
    cargar(d) { s = { ...inicial(), ...(d ?? {}) }; ESCALA.v = escalaDeBucle(s.historial.length); },
    serializar() { return s; },

    fijarEra(n) { s.era = Math.max(s.era, n); },
    avanzarEra(n, j) {
      if (n <= s.era) return;
      s.era = n;
      if (n === 5 && s.camino) { // el monumento del camino trae su pieza
        const p = PIEZA[s.camino];
        const nueva = !s.piezas[p];
        s.piezas[p] = true;
        s.caminosHechos[s.camino] = true;
        j.emit('pieza', { pieza: p, nueva });
      }
      if (n === 8 && s.activos.some((a) => !a.mutado && RECUERDOS[a.id]?.planos)) {
        for (const id of ['bastidor', 'bobina', 'nucleo']) j.estado.mej[id] = 1;
      }
      j.invalidar();
      j.revisarDesbloqueos();
      j.emit('era', { era: n });
    },
    puedeElegirCamino() { return s.era === 3 && !s.camino; },
    caminoForzado() { return s.activos.some((a) => a.mutado && RECUERDOS[a.id]?.mut.azarCamino); },
    elegirCamino(c, j) {
      if (!api.puedeElegirCamino()) return false;
      if (api.caminoForzado()) c = CAMINOS[Math.floor(azar() * 3)];
      s.camino = c;
      s.era = 4;
      j.invalidar();
      j.revisarDesbloqueos();
      j.emit('camino', { camino: c });
      j.emit('era', { era: 4 });
      return c;
    },

    maquinaLista(j) { return s.era >= 8 && ['bastidor', 'bobina', 'nucleo'].every((id) => j.nivel(id) > 0); },
    reparada() { return !!(s.piezas.engranaje && s.piezas.pendulo && s.piezas.lente); },

    // ---------- maleta ----------
    capacidad(j) { return 2 + j.nivel('maleta') + s.extraMaleta; },
    disponibles(j) { return Object.keys(RECUERDOS).filter((id) => RECUERDOS[id].req(j)); },
    probSinAveria(j) {
      if (s.sinAverias) return 1;
      return Math.min(0.9, [0, 0.3, 0.55][j.nivel('estabilizador')] + s.estabilidadExtra);
    },
    averiasPorSalto() { return s.paradoja >= 70 ? 2 : 1; },
    // Decide qué llega cambiado. Devuelve la lista final [{id, mutado, extra}].
    tirarAveria(ids, j) {
      const lista = ids.map((id) => ({ id, mutado: false, extra: RECUERDOS[id].guarda?.(j) ?? null }));
      if (!lista.length || azar() < api.probSinAveria(j)) return lista;
      const n = Math.min(lista.length, api.averiasPorSalto());
      const libres = [...lista.keys()];
      for (let k = 0; k < n; k++) {
        const i = libres.splice(Math.floor(azar() * libres.length), 1)[0];
        lista[i].mutado = true;
      }
      return lista;
    },
    // Lo llama la UI (o el bot) antes de ejecutar el prestigio.
    saltar(j, ids, { final = null } = {}) {
      if (!j.prestigio.salto.puede()) return false;
      ids = ids.slice(0, api.capacidad(j));
      const llegan = api.tirarAveria(ids, j);
      const ecos = j.prestigio.salto.ganancia();
      s.historial.push({
        n: s.historial.length + 1, camino: s.camino, era: s.era, ecos: ecos.toString(),
        riqueza: j.totalCapa('riqueza').toString(), duracion: Math.round(s.tBucle), maleta: ids,
      });
      if (final === 'cerrar') { s.finales.cerrar = true; s.sinAverias = true; for (const l of llegan) l.mutado = false; }
      if (final === 'romper') { s.finales.romper = true; s.ecosExtra = 2; }
      const dia = Math.floor(j.ahoraMs() / 86400000);
      s.saltosDia = [...s.saltosDia.filter((d) => d === dia), dia];
      s.pendiente = llegan;
      j.prestigio.salto.ejecutar();
      j.emit('llegada', { llegan, final });
      return llegan;
    },

    reiniciar(capa, j) {
      if (capa !== 'salto') return;
      const llegan = s.pendiente ?? [];
      delete s.pendiente;
      s.era = 1; s.camino = null; s.tBucle = 0;
      ESCALA.v = escalaDeBucle(s.historial.length);
      s.activos = llegan;
      s.paradoja = Math.min(100, llegan.reduce((a, l) => a + (vista(l).par ?? 0), 0));
      s.picoParadoja = s.paradoja;
      s.ultimaAveria = llegan.filter((l) => l.mutado).map((l) => l.id);
      for (const l of llegan) if (l.mutado) s.averiasVistas[l.id] = true;
      if (j.nivel('arranque')) j.estado.gen.recolectora.n += 25;
      for (const l of llegan) vista(l).llega?.(j);
      j.invalidar();
    },

    tick(dt, j, { offline }) {
      s.tBucle += dt;
      const disipa = s.activos.reduce((a, l) => a * (vista(l).disipa ?? 1), 1) * (j.secretos?.flag('pasaporte') ? 2 : 1);
      const antes = Math.floor(s.paradoja);
      s.paradoja = Math.max(0, s.paradoja - (dt / 60) * disipa);
      if (!offline && Math.floor(s.paradoja) !== antes) j.invalidar();
      // El río (estaciones) y las estrellas (curva con las ideas) cambian solos: refresca cada segundo.
      if (s.camino === 'rio' || s.camino === 'estrellas') { acum += dt; if (acum > 1) { acum = 0; j.invalidar(); } }
    },
    subirParadoja(x, j) { s.paradoja = Math.min(100, s.paradoja + x); s.picoParadoja = Math.max(s.picoParadoja, s.paradoja); j.invalidar(); },

    estacion() { return 1.1 + 0.35 * Math.sin((s.tBucle / PERIODO_RIO) * Math.PI * 2); },
    // Modificadores propios: recuerdos, Paradoja (mitos), camino y logros.
    efectos(j) {
      const out = [];
      for (const l of s.activos) {
        const v = vista(l);
        const ef = typeof v.efectos === 'function' ? v.efectos(j, l.extra) : v.efectos ?? [];
        for (const e of ef) out.push({ ...e, fuente: `recuerdo:${l.id}` });
      }
      if (s.paradoja > 0) out.push({ objetivo: 'produccion', mult: 1 + s.paradoja / 100, fuente: 'mitos' });
      if (s.camino === 'hierro') out.push({ objetivo: 'prod:riqueza', mult: 1.5, fuente: 'camino' }, { objetivo: 'prod:ideas', mult: 0.7, fuente: 'camino' });
      if (s.camino === 'rio') out.push({ objetivo: 'produccion', mult: api.estacion(), fuente: 'camino' });
      if (s.camino === 'estrellas') {
        const curva = 1 + Math.log10(1 + j.cantidad('ideas').toNumber()) * 0.12;
        out.push({ objetivo: 'prod:riqueza', mult: 0.75 * curva, fuente: 'camino' }, { objetivo: 'prod:ideas', mult: 1.6, fuente: 'camino' });
      }
      const nl = Object.keys(j.estado.logros).length;
      if (nl) out.push({ objetivo: 'produccion', mult: 1 + 0.04 * nl, fuente: 'logros' });
      if (s.ecosExtra !== 1) out.push({ objetivo: 'prestigio:salto', mult: s.ecosExtra, fuente: 'final' });
      return out;
    },
    // Producción que no sale de generadores (el dinamo que gira al revés).
    extra() {
      const c = s.activos.reduce((a, l) => a + (vista(l).cronos ?? 0), 0);
      return c ? { cronos: N(c) } : null;
    },
  };
  return api;
}
