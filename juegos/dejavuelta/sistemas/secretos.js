// Logros (visibles y secretos) y encargos ocultos. Sin DOM: la escena y la Crónica le pasan
// los toques con tocar(objeto) y tocarPista(id).
import { N } from '../../../motor/numeros/num.js';
import { vista } from './recuerdos.js';

const GEN_ERA5 = ['fundicion', 'estadomayor', 'gremio', 'puente', 'lentes', 'universidad'];

// cond(j, s): s = estado de este sistema. Los secretos salen como «???» hasta conseguirlos.
export const LOGROS = {
  era2: { nombre: 'Manos en el barro', desc: 'Llega a la era del Barro.', cond: (j) => j.vuelta.era >= 2 },
  era3: { nombre: 'Encrucijada', desc: 'Inventa la escritura.', cond: (j) => j.vuelta.era >= 3 },
  era4: { nombre: 'Elegir es renunciar', desc: 'Elige un camino.', cond: (j) => j.vuelta.era >= 4 },
  era5: { nombre: 'Monumental', desc: 'Levanta el monumento de tu camino.', cond: (j) => j.vuelta.era >= 5 },
  era6: { nombre: 'Hágase la luz', desc: 'Llega a la Chispa.', cond: (j) => j.vuelta.era >= 6 },
  era7: { nombre: 'Pequeño gran átomo', desc: 'Llega al Átomo.', cond: (j) => j.vuelta.era >= 7 },
  era8: { nombre: 'Relojería', desc: 'Llega a Cronos.', cond: (j) => j.vuelta.era >= 8 },
  volvere: { nombre: 'Volveré', desc: 'Salta por primera vez.', cond: (j) => j.prestigio.salto.veces >= 1 },
  millon: { nombre: 'Un millón de algo', desc: 'Acumula 1 M de riqueza en un bucle.', cond: (j) => j.totalCapa('riqueza').gte(1e6) },
  billon: { nombre: 'Doce ceros', desc: 'Acumula 1 B de riqueza en un bucle.', cond: (j) => j.totalCapa('riqueza').gte(1e12) },
  trotamundos: { nombre: 'Trotamundos', desc: 'Recorre los tres caminos.', cond: (j) => Object.keys(j.vuelta.estado.caminosHechos).length >= 3 },
  maleta4: { nombre: 'Equipaje de mano', desc: 'Salta con cuatro recuerdos o más.', cond: (j, s) => s.flags.maleta4 },
  // ---------- secretos ----------
  mano_quieta: { secreto: true, nombre: 'Mano quieta', desc: 'Cinco minutos sin comprar nada en la Hoguera. La tribu se las apaña.', cond: (j, s) => s.flags.mano_quieta },
  maleta_vacia: { secreto: true, nombre: 'Ligero de equipaje', desc: 'Salta sin llevarte ningún recuerdo.', cond: (j, s) => s.flags.maleta_vacia },
  polvo: { secreto: true, nombre: 'Polvo de estrellas', desc: 'La pólvora llegó cambiada. Brilla y no explota.', cond: (j, s) => s.flags.polvo },
  al_reves: { secreto: true, nombre: '.séver lA', desc: 'El alfabeto llegó del revés.', cond: (j, s) => s.flags.al_reves },
  noctambulo: { secreto: true, nombre: 'La hora de las brujas', desc: 'Juega entre las 3 y las 4 de la madrugada.', cond: (j, s) => s.flags.noctambulo },
  siete_soles: { secreto: true, nombre: 'Siete soles', desc: 'Toca el sol siete veces seguidas.', cond: (j, s) => s.flags.siete_soles },
  mariposa: { secreto: true, nombre: 'El ruido de un trueno', desc: 'Pisaste una mariposa. Algo ha cambiado en el futuro.', cond: (j, s) => s.flags.mariposa },
  fluzo: { secreto: true, nombre: '1,21 gigavatios', desc: 'Toca el coche plateado que pasa a 142 km/h.', cond: (j, s) => s.flags.fluzo },
  cabina: { secreto: true, nombre: '¿Doctor qué?', desc: 'Una cabina azul. Más grande por dentro.', cond: (j, s) => s.flags.cabina },
  marmota: { secreto: true, nombre: 'Atrapado en el tiempo', desc: 'Salta tres veces el mismo día. Otra vez. Otra vez.', cond: (j) => j.vuelta.estado.saltosDia.length >= 3 },
  coleccionista: { secreto: true, nombre: 'Coleccionista de averías', desc: 'Descubre cinco averías distintas.', cond: (j) => Object.keys(j.vuelta.estado.averiasVistas).length >= 5 },
  abuelo: { secreto: true, nombre: 'La paradoja del abuelo', desc: 'Lleva la Paradoja al 100 %.', cond: (j) => j.vuelta.estado.picoParadoja >= 100 },
  ludita: { secreto: true, nombre: 'Ludita', desc: 'Llega a la Chispa sin construir nada de la quinta era.', cond: (j, s) => s.flags.ludita },
  desconocido: { secreto: true, nombre: 'El desconocido', desc: 'Hay alguien junto a la hoguera que no debería estar.', cond: (j, s) => s.flags.desconocido },
  venda: { secreto: true, nombre: 'Los cronocrímenes', desc: 'El hombre de la venda rosa eras tú.', cond: (j, s) => s.flags.venda },
  piedra: { secreto: true, nombre: 'La piedra que canta', desc: 'Encargo: tres toques al sol del amanecer.', cond: (j, s) => s.flags.piedra },
  tornillos: { secreto: true, nombre: 'Quién rompió la máquina', desc: 'Encargo: los tornillos de la cueva.', cond: (j, s) => s.flags.tornillos },
  ministerio: { secreto: true, nombre: 'El Ministerio', desc: 'Encargo: la puerta del archivo. Y la cola.', cond: (j, s) => s.flags.pasaporte },
  barca: { secreto: true, nombre: 'La barca sin nombre', desc: 'Encargo: nadie cruzó el río.', cond: (j, s) => s.flags.barca },
  libros: { secreto: true, nombre: 'Al otro lado de la estantería', desc: 'Encargo: los libros que caen solos.', cond: (j, s) => s.flags.libros },
  cerrar: { secreto: true, nombre: 'Fin', desc: 'Cierra el bucle.', cond: (j) => !!j.vuelta.estado.finales.cerrar },
  romper: { secreto: true, nombre: 'Otra vez', desc: 'Repara la máquina... y vuelve a romperla.', cond: (j) => !!j.vuelta.estado.finales.romper },
};

// Encargos ocultos: no salen en ninguna lista hasta que aparece su pista.
export const ENCARGOS = {
  piedra: { nombre: 'La piedra que canta', pista: 'Los ancianos hablan de una piedra que canta al amanecer.',
    paso: 'Toca el sol tres veces mientras amanece.', premio: 'Avivar rinde ×5 para siempre.' },
  tornillos: { nombre: 'Tornillos en la cueva', pista: 'Alguien ha dejado tornillos en la cueva. Tornillos. En la Edad de Piedra.',
    paso: 'Busca en la cueva. Luego compáralos con la máquina.', premio: '+1 hueco en la maleta.' },
  ministerio: { nombre: 'La puerta del archivo', pista: 'Hay una puerta en el archivo que ayer no estaba.',
    paso: 'Llama a la puerta. Ten paciencia.', premio: 'Pasaporte: la Paradoja se disipa el doble de rápido.' },
  barca: { nombre: 'La barca sin nombre', pista: 'Dicen que si nadie cruza el río, el río acaba trayendo algo.',
    paso: 'No construyas ningún puente durante 8 minutos.', premio: 'Una pieza de la máquina.' },
  libros: { nombre: 'Los libros que caen', pista: 'En la biblioteca los libros caen solos de la estantería.',
    paso: 'Algo intenta decir una palabra.', premio: 'Ideas ×2 para siempre.' },
  venda: { nombre: 'El desconocido', pista: null,
    paso: 'Síguele cada vez que aparezca.', premio: 'Las averías son menos probables.' },
};

const PALABRA = ['Q', 'U', 'É', 'DATE'];

function inicial() {
  return { flags: {}, enc: {}, pistasBucle: {}, toquesSol: [], ultimaCompra: 0, desconocidoHasta: 0, desconocidoProx: 60, desconocidoVisto: false, sinPuente: 0, rioVacio: 0 };
}

export function crearSistemaSecretos() {
  let s = inicial();
  const enc = (id) => (s.enc[id] ??= { fase: 0 });
  const nota = (j, texto, extra) => j.cronica?.anotar(j, texto, extra);

  const api = {
    id: 'secretos',
    get estado() { return s; },
    cargar(d) { s = { ...inicial(), ...(d ?? {}) }; },
    serializar() { return s; },
    flag: (k) => !!s.flags[k],
    activo: (id) => !!s.enc[id] && !s.enc[id].hecho,
    encargosVistos: () => Object.keys(s.enc).filter((id) => ENCARGOS[id]),

    // Efectos permanentes de los encargos.
    efectos() {
      const out = [];
      if (s.flags.piedra) out.push({ objetivo: 'click:riqueza', mult: 5, fuente: 'piedra' });
      if (s.flags.libros) out.push({ objetivo: 'prod:ideas', mult: 2, fuente: 'libros' });
      return out;
    },

    iniciar(j) {
      j.on('compra', () => { s.ultimaCompra = j.vuelta.estado.tBucle; });
      j.on('llegada', ({ llegan }) => {
        if (!llegan.length) s.flags.maleta_vacia = true;
        if (llegan.length >= 4) s.flags.maleta4 = true;
        for (const l of llegan) if (l.mutado && vista(l).secreto) s.flags[vista(l).secreto] = true;
        if (llegan.some((l) => l.id === 'alfabeto' && l.mutado)) s.flags.al_reves = true;
      });
      j.on('era', ({ era }) => {
        if (era === 6 && GEN_ERA5.every((g) => j.cuantos(g) === 0)) s.flags.ludita = true;
        if (era === 5 && j.vuelta.camino === 'rio' && !s.flags.barca) api.pista(j, 'barca');
        if (era === 5 && j.vuelta.camino === 'estrellas' && !s.flags.libros) api.pista(j, 'libros');
      });
    },

    pista(j, id) {
      if (s.pistasBucle[id]) return;
      s.pistasBucle[id] = true;
      const e = enc(id);
      if (e.hecho) return;
      if (ENCARGOS[id].pista) nota(j, ENCARGOS[id].pista, { pista: id });
      j.emit('encargo', { id, fase: 'pista' });
    },
    completar(j, id, texto) {
      const e = enc(id);
      if (e.hecho) return;
      e.hecho = true;
      nota(j, texto, { importante: true });
      j.invalidar();
      j.emit('encargo', { id, fase: 'hecho' });
    },

    reiniciar(capa) {
      if (capa !== 'salto') return;
      s.pistasBucle = {};
      s.ultimaCompra = 0; s.sinPuente = 0;
      s.desconocidoHasta = 0; s.desconocidoProx = 60;
      if (s.enc.ministerio && !s.enc.ministerio.hecho) s.enc.ministerio.fase = 0;
      if (s.enc.piedra && !s.enc.piedra.hecho) s.enc.piedra.cuenta = 0;
    },

    tick(dt, j, { offline }) {
      if (offline) return;
      const b = j.vuelta, t = b.estado.tBucle;
      if (b.era === 1 && t > 300 && t - s.ultimaCompra >= 300) s.flags.mano_quieta = true;
      const h = new Date(j.ahoraMs()).getHours();
      if (h === 3) s.flags.noctambulo = true;
      // pistas que dependen del momento del bucle
      if (b.era <= 2 && t > 75 && !s.flags.piedra) api.pista(j, 'piedra');
      if (b.bucleN >= 2 && b.era === 1 && t > 45 && !s.flags.tornillos) api.pista(j, 'tornillos');
      if (b.era >= 4 && t > 30 && !s.flags.pasaporte) api.pista(j, 'ministerio');
      // la barca: 8 min en la era 5 del río sin ningún puente
      if (b.camino === 'rio' && b.era >= 5 && api.activo('barca')) {
        if (j.cuantos('puente') === 0) s.sinPuente += dt; else s.sinPuente = 0;
      }
      // el desconocido: con Paradoja alta (o si la cronista llegó cambiada) aparece a ratos
      const venda = b.estado.activos.some((l) => l.id === 'cronista' && l.mutado);
      if ((b.paradoja >= 40 || venda) && !s.flags.venda) {
        if (t >= s.desconocidoProx) { s.desconocidoHasta = t + 25; s.desconocidoProx = t + 110; s.desconocidoVisto = false; }
      }
    },

    // ---------- visibles en la escena ----------
    desconocidoVisible(j) { return j.vuelta.estado.tBucle < s.desconocidoHasta; },
    barcaVisible(j) { return api.activo('barca') && s.sinPuente >= 480; },

    // ---------- toques ----------
    tocar(j, que, info = {}) {
      const b = j.vuelta;
      const t = b.estado.tBucle;
      if (que === 'sol') {
        s.toquesSol = [...s.toquesSol.filter((x) => t - x < 6), t];
        if (s.toquesSol.length >= 7) s.flags.siete_soles = true;
        if (api.activo('piedra')) {
          const e = enc('piedra');
          e.cuenta = info.amanecer ? (e.cuenta ?? 0) + 1 : 0;
          if (e.cuenta === 1 && info.amanecer) nota(j, 'Al tocar el sol que nace, una piedra junto al río zumba muy bajito.');
          if (e.cuenta >= 3) { s.flags.piedra = true; api.completar(j, 'piedra', 'La piedra canta. Nadie sabe qué dice, pero todos trabajan a su ritmo. (Avivar ×5, para siempre.)'); }
        }
        return 'sol';
      }
      if (que === 'mariposa') {
        if (!s.flags.mariposa) {
          s.flags.mariposa = true;
          b.subirParadoja(15, j);
          nota(j, 'Alguien pisó una mariposa. Muy lejos, en el futuro, el nombre del rey ha cambiado. Nadie se acuerda del anterior.', { importante: true });
        }
        return 'mariposa';
      }
      if (que === 'coche') {
        if (!s.flags.fluzo) {
          s.flags.fluzo = true;
          j.anadir('energia', N(121).add(j.tasa('energia').mul(121)));
          nota(j, 'Un coche plateado aparece entre chispas y deja dos surcos de fuego en el suelo. Alguien grita: «¡1,21 gigavatios!». Nadie sabe qué es un gigavatio.', { importante: true });
        }
        return 'coche';
      }
      if (que === 'cabina') {
        if (!s.flags.cabina) {
          s.flags.cabina = true;
          j.anadir('ideas', N(300).add(j.tasa('ideas').mul(300)));
          nota(j, 'Una cabina azul. Por dentro es más grande que el Senado. Cuando vuelven a mirar, ya no está. Las ideas, sí.', { importante: true });
        }
        return 'cabina';
      }
      if (que === 'cueva') {
        if (api.activo('tornillos') && !enc('tornillos').encontrados) {
          enc('tornillos').encontrados = true;
          nota(j, 'En la cueva hay doce tornillos de latón, ordenados en fila. Uno tiene una marca grabada a mano.', { importante: true });
        }
        return 'cueva';
      }
      if (que === 'desconocido') {
        if (!api.desconocidoVisible(j) || s.desconocidoVisto) return null;
        s.desconocidoVisto = true;
        s.desconocidoHasta = t + 1.2;
        const e = enc('venda');
        e.fase = (e.fase ?? 0) + 1;
        s.flags.desconocido = true;
        if (e.fase === 1) nota(j, 'El desconocido lleva la cara envuelta en una venda rosa. Al verte, echa a correr hacia el bosque.', { importante: true });
        if (e.fase === 2) nota(j, 'Le sigues entre los árboles. Desde una colina, alguien observa la hoguera con unos prismáticos. Prismáticos.');
        if (e.fase >= 3) {
          s.flags.venda = true;
          b.estado.estabilidadExtra += 0.25;
          api.completar(j, 'venda', 'Le alcanzas. Se quita la venda. Tiene tu cara y una cicatriz que tú todavía no tienes. «No vuelvas a tocar la máquina», dice. Las averías serán menos probables.');
        }
        return 'desconocido';
      }
      if (que === 'barca') {
        if (!api.barcaVisible(j)) return null;
        s.flags.barca = true;
        const p = b.estado.piezas;
        const nueva = !p.pendulo;
        p.pendulo = true;
        api.completar(j, 'barca', nueva
          ? 'Una barca sin nombre baja por el río, vacía. Dentro hay un péndulo de latón que oscila sin que nadie lo empuje. (Pieza: Péndulo.)'
          : 'Una barca sin nombre baja por el río con un péndulo dentro. Ya tienes uno. Lo dejáis en el templo y la gente reza al ritmo que marca.');
        if (!nueva) j.anadir('ecos', 5);
        return 'barca';
      }
      return null;
    },

    tocarPista(j, id) {
      if (!api.activo(id)) return null;
      const e = enc(id);
      if (id === 'ministerio') {
        const ahora = j.estado.tiempo;
        if (!e.fase) { e.fase = 1; e.desde = ahora; return 'Llamas. Una funcionaria con gafas abre una rendija: «Su cita es dentro de tres minutos. Coja número». Cierra.'; }
        if (ahora - e.desde < 180) return `«Todavía no. Le quedan ${Math.ceil(180 - (ahora - e.desde))} segundos». Detrás de la puerta suenan teclas de máquina de escribir.`;
        s.flags.pasaporte = true;
        api.completar(j, 'ministerio', 'Te reciben en un despacho que huele a 1890. Te sellan un pasaporte temporal sin preguntar de qué siglo vienes. «Y no hable con nadie de esto». (La Paradoja se disipa el doble de rápido.)');
        return null;
      }
      if (id === 'libros') {
        e.fase = (e.fase ?? 0) + 1;
        if (e.fase < PALABRA.length) return `Otro libro cae al suelo. En el lomo, una letra marcada: «${PALABRA.slice(0, e.fase).join('')}…».`;
        s.flags.libros = true;
        api.completar(j, 'libros', '«QUÉDATE». Alguien, al otro lado de la estantería y del tiempo, te pedía que no saltaras. (Ideas ×2, para siempre.)');
        return null;
      }
      if (id === 'tornillos' && !e.encontrados) return 'Habría que mirar en la cueva.';
      if (id === 'piedra') return 'Al amanecer. El sol todavía bajo, a la izquierda.';
      if (id === 'barca') return 'El río no tiene prisa. Tú tampoco deberías tenerla.';
      return null;
    },

    // Última fase de los tornillos: en Cronos, con la máquina delante.
    puedeCompararTornillos(j) { return api.activo('tornillos') && enc('tornillos').encontrados && j.vuelta.era >= 8; },
    compararTornillos(j) {
      if (!api.puedeCompararTornillos(j)) return;
      s.flags.tornillos = true;
      j.vuelta.estado.extraMaleta += 1;
      api.completar(j, 'tornillos', 'Los tornillos encajan en la máquina. Son los que faltan. La marca grabada es tu letra. No se rompió: la desmontaste tú, para tener que volver. (+1 hueco en la maleta.)');
    },
  };
  return api;
}

export function logrosParaMotor(j) {
  const out = {};
  for (const [id, l] of Object.entries(LOGROS)) out[id] = { ...l, cond: (jj) => !!jj.secretos && !!jj.vuelta && l.cond(jj, jj.secretos.estado) };
  return out;
}
