// Catálogo de recuerdos: lo que cabe en la maleta. Cada uno tiene su versión «averiada».
// req(j): si se puede meter en la maleta al final de este bucle.
// efectos: modificadores durante el bucle siguiente. llega(j): lo que aparece hecho al llegar.
// par: Paradoja que suma al llegar (cuanto más futuro, más chirría en el Año Uno).

const gen = (j, id, n) => { j.estado.gen[id].n += n; };
const hito = (j, ...ids) => { for (const id of ids) j.estado.mej[id] = 1; };

export const RECUERDOS = {
  fuego: {
    nombre: 'Fuego eterno', desc: 'Llegas con 10 recolectoras y 5 partidas de caza.',
    req: (j) => j.cuantos('cazadores') >= 10, par: 3,
    llega: (j) => { gen(j, 'recolectora', 10); gen(j, 'cazadores', 5); },
    mut: { nombre: 'Fuego frío', desc: 'Una llama azul que no quema. 40 recolectoras, pero avivar rinde la mitad.', par: 6,
      llega: (j) => gen(j, 'recolectora', 40), efectos: [{ objetivo: 'click:riqueza', mult: 0.5 }] },
  },
  semillas: {
    nombre: 'Semillas', desc: 'La agricultura ya está inventada: empiezas en la era del Barro.',
    req: (j) => j.nivel('sembrar') > 0, par: 6,
    llega: (j) => { hito(j, 'sembrar'); j.vuelta.fijarEra(2); },
    mut: { nombre: 'Semillas de otro planeta', desc: 'Empiezas en el Barro. Los campos rinden ×4; las recolectoras, ×0,25.', par: 15,
      llega: (j) => { hito(j, 'sembrar'); j.vuelta.fijarEra(2); },
      efectos: [{ objetivo: 'campo', mult: 4 }, { objetivo: 'recolectora', mult: 0.25 }] },
  },
  alfabeto: {
    nombre: 'Alfabeto', desc: 'Llegas sabiendo escribir: empiezas en la Encrucijada.',
    req: (j) => j.nivel('escritura') > 0, par: 10,
    llega: (j) => { hito(j, 'sembrar', 'escritura'); j.vuelta.fijarEra(3); },
    mut: { nombre: 'Alfabeto al revés', desc: 'Empiezas en la Encrucijada con ideas ×1,5. La Crónica se escribe al revés.', par: 12,
      llega: (j) => { hito(j, 'sembrar', 'escritura'); j.vuelta.fijarEra(3); },
      efectos: [{ objetivo: 'prod:ideas', mult: 1.5 }] },
  },
  recetario: {
    nombre: 'Recetario', desc: 'Riqueza ×2 durante todo el bucle.',
    req: (j) => j.cuantos('campo') >= 25, par: 5,
    efectos: [{ objetivo: 'prod:riqueza', mult: 2 }],
    mut: { nombre: 'Recetario quemado', desc: 'Solo se lee la mitad: riqueza ×1,4 e ideas ×1,6.', par: 5,
      efectos: [{ objetivo: 'prod:riqueza', mult: 1.4 }, { objetivo: 'prod:ideas', mult: 1.6 }] },
  },
  mapa: {
    nombre: 'Mapa', desc: 'Si en la Encrucijada eliges un camino distinto al de este bucle, producción ×2.',
    req: (j) => !!j.vuelta.camino, par: 8,
    guarda: (j) => ({ camino: j.vuelta.camino }),
    efectos: (j, extra) => (j.vuelta.camino && j.vuelta.camino !== extra?.camino ? [{ objetivo: 'produccion', mult: 2 }] : []),
    mut: { nombre: 'Mapa de un sitio que no existe', desc: 'Producción ×3, pero el camino lo elige el mapa (al azar).', par: 14,
      azarCamino: true, efectos: [{ objetivo: 'produccion', mult: 3 }] },
  },
  polvora: {
    nombre: 'Pólvora', desc: 'Riqueza ×3.',
    req: (j) => j.vuelta.camino === 'hierro' && j.vuelta.era >= 5, par: 15,
    efectos: [{ objetivo: 'prod:riqueza', mult: 3 }],
    mut: { nombre: 'Polvo de estrellas', desc: 'Brilla y no explota. Ideas ×4.', par: 20, secreto: 'polvo',
      efectos: [{ objetivo: 'prod:ideas', mult: 4 }] },
  },
  molino: {
    nombre: 'Molino de agua', desc: 'Producción ×2 y el tiempo fuera rinde un 25 % más.',
    req: (j) => j.vuelta.camino === 'rio' && j.vuelta.era >= 5, par: 12,
    efectos: [{ objetivo: 'produccion', mult: 2 }, { objetivo: 'offline:eficiencia', suma: 0.25 }],
    mut: { nombre: 'Molino que gira hacia atrás', desc: 'No produce nada, pero el próximo salto da Ecos ×1,5.', par: 18,
      efectos: [{ objetivo: 'prestigio:salto', mult: 1.5 }] },
  },
  telescopio: {
    nombre: 'Telescopio', desc: 'Ideas ×3.',
    req: (j) => j.vuelta.camino === 'estrellas' && j.vuelta.era >= 5, par: 12,
    efectos: [{ objetivo: 'prod:ideas', mult: 3 }],
    mut: { nombre: 'Telescopio que mira atrás', desc: 'Ideas ×2 y la Paradoja se disipa el triple de rápido.', par: 4,
      disipa: 3, efectos: [{ objetivo: 'prod:ideas', mult: 2 }] },
  },
  dinamo: {
    nombre: 'Dinamo de bolsillo', desc: 'Energía ×3.',
    req: (j) => j.cuantos('dinamo') >= 10, par: 25,
    efectos: [{ objetivo: 'prod:energia', mult: 3 }],
    mut: { nombre: 'Dinamo que gira al revés', desc: 'Energía ×1,5 y desde el primer día gotea tiempo ⧗.', par: 40,
      cronos: 0.05, efectos: [{ objetivo: 'prod:energia', mult: 1.5 }] },
  },
  planos: {
    nombre: 'Planos de la máquina', desc: 'Al llegar a Cronos, el bastidor, la bobina y el núcleo ya están montados.',
    req: (j) => j.vuelta.maquinaLista(j), par: 30, planos: true,
    mut: { nombre: 'Planos de una tostadora', desc: 'No sirven para la máquina. Bien tostados, eso sí: Ecos ×1,5 en el próximo salto.', par: 10,
      efectos: [{ objetivo: 'prestigio:salto', mult: 1.5 }] },
  },
  cronista: {
    nombre: 'La cronista', desc: 'Una persona que lo apunta todo. Producción ×1,25.',
    req: (j) => j.prestigio.salto.veces >= 1, par: 0,
    efectos: [{ objetivo: 'produccion', mult: 1.25 }],
    mut: { nombre: 'Otra cronista', desc: 'No es ella. Lleva una venda rosa en la cara. Producción ×1,25.', par: 20,
      venda: true, efectos: [{ objetivo: 'produccion', mult: 1.25 }] },
  },
};

// Datos de un recuerdo activo ({id, mutado, extra}) con su variante aplicada.
export function vista(a) {
  const base = RECUERDOS[a.id];
  if (!base) return null;
  return a.mutado ? { ...base.mut, id: a.id, mutado: true } : { ...base, id: a.id, mutado: false };
}
