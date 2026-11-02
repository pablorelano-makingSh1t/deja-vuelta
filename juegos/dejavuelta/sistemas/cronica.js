// La Crónica: un narrador que apunta los hitos del bucle. Su voz cambia de un bucle a otro:
// 0 = historiador normal, 1 = déjà vu, 2+ = sabe que es él quien viaja.
import { vista } from './recuerdos.js';
import { ERAS, CAMINO_TXT, PRIMERA_COMPRA, INICIO, ERA_TXT, PARADOJA_TXT, PIEZA_TXT, MITO_TXT } from '../textos.js';

const MAX = 120;
const voz = (n) => Math.min(2, n);
const elegir = (v, n) => (Array.isArray(v) ? v[Math.min(v.length - 1, voz(n))] : v);

export function crearSistemaCronica() {
  let s = { lineas: [], archivo: [], visto: {}, umbral: 0 };

  const api = {
    id: 'cronica',
    get lineas() { return s.lineas; },
    get archivo() { return s.archivo; },
    cargar(d) { s = { lineas: [], archivo: [], visto: {}, umbral: 0, ...(d ?? {}) }; },
    serializar() { return s; },

    anotar(j, texto, extra = {}) {
      if (!texto) return;
      s.lineas.push({ t: Math.round(j.vuelta.estado.tBucle), era: j.vuelta.era, texto, ...extra });
      if (s.lineas.length > MAX) s.lineas.splice(0, s.lineas.length - MAX);
      j.emit('cronica', s.lineas[s.lineas.length - 1]);
    },
    // Una vez por bucle y clave.
    unaVez(j, k, texto, extra) { if (s.visto[k]) return; s.visto[k] = true; api.anotar(j, texto, extra); },

    iniciar(j) {
      if (!s.lineas.length) api.anotar(j, elegir(INICIO, j.vuelta.bucleN));
      j.on('compra', ({ id }) => {
        const n = j.vuelta.bucleN;
        if (PRIMERA_COMPRA[id]) api.unaVez(j, `c:${id}`, elegir(PRIMERA_COMPRA[id], n));
      });
      j.on('era', ({ era }) => api.unaVez(j, `e:${era}`, elegir(ERA_TXT[era], j.vuelta.bucleN), { importante: true }));
      j.on('camino', ({ camino }) => api.unaVez(j, `k:${camino}`, elegir(CAMINO_TXT[camino], j.vuelta.bucleN), { importante: true }));
      j.on('pieza', ({ pieza, nueva }) => api.unaVez(j, `p:${pieza}`, nueva ? PIEZA_TXT[pieza] : PIEZA_TXT.repetida, { importante: true }));
      j.on('logro', ({ id, def }) => { if (def.secreto) api.unaVez(j, `l:${id}`, `✦ ${def.nombre}. ${def.desc}`); });
    },

    tick(dt, j, { offline }) {
      if (offline) return;
      const p = j.vuelta.paradoja;
      for (const [u, txt] of PARADOJA_TXT) if (p >= u && s.umbral < u) { s.umbral = u; api.anotar(j, txt); }
      if (p < 20) s.umbral = 0;
      if (j.vuelta.maquinaLista(j)) api.unaVez(j, 'maquina', elegir(['La máquina está montada. Zumba. Nadie se atreve a tocar la palanca.', 'La máquina está montada. Zumba igual que la otra vez. ¿Qué otra vez?', 'La máquina está lista. Ya sé lo que pasa cuando se tira de la palanca. La voy a tirar igual.'], j.vuelta.bucleN), { importante: true });
    },

    reiniciar(capa, j) {
      if (capa !== 'salto') return;
      const h = j.vuelta.estado.historial.at(-1);
      if (h) s.archivo.push({ n: h.n, camino: h.camino, lineas: s.lineas.slice(-6).map((l) => l.texto) });
      if (s.archivo.length > 30) s.archivo.shift();
      s.lineas = []; s.visto = {}; s.umbral = 0;
      api.anotar(j, elegir(INICIO, j.vuelta.bucleN));
      for (const l of j.vuelta.estado.activos) {
        const v = vista(l);
        api.anotar(j, (l.mutado ? MITO_TXT.mutado : MITO_TXT.normal).replace('{r}', v.nombre), { importante: l.mutado });
      }
    },
  };
  return api;
}

export { ERAS };
