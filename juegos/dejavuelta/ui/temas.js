// Estilos visuales. Cada uno cambia la paleta de la escena (o le pone un filtro CSS, que es barato
// porque lo hace la GPU) y las variables de la interfaz ([data-tema] en estilos.css).

const NEON = {
  cieloD: ['#3a1450', '#120d33'], cieloN: ['#16061f', '#040208'], tierra: '#140b1f',
  colinas: ['#2c1446', '#1d0f30'], casa: '#0c0614',
};
const NEON_LUZ = ['#00f0ff', '#ff2bd6', '#f6ff00'];

export const TEMAS = {
  atardecer: {
    nombre: 'Atardecer', desc: 'Ocre, brasa y cielo abierto.',
    muestra: ['#f3b670', '#7fb2c9', '#3a2a1c', '#f0923a'],
  },
  neon: {
    nombre: 'Neón', desc: 'Night City en el Año Uno.',
    muestra: ['#3a1450', '#120d33', '#ff2bd6', '#00f0ff'],
    paleta: (era, base) => ({ ...base, ...NEON, luz: NEON_LUZ[era % 3], acento: era % 2 ? '#ff2bd6' : '#00e5f2' }),
  },
  pergamino: {
    nombre: 'Pergamino', desc: 'Claro y en sepia, de códice.',
    muestra: ['#efe4cf', '#c9a978', '#6b4a2b', '#9c3d22'],
    filtro: 'sepia(.75) saturate(.9) contrast(.95) brightness(1.06)',
    acento: () => '#9c3d22',
  },
  tinta: {
    nombre: 'Tinta', desc: 'Blanco, negro y un rojo.',
    muestra: ['#e9e6df', '#8a8780', '#121212', '#e0442f'],
    filtro: 'grayscale(1) contrast(1.15)',
    acento: () => '#e0442f',
  },
};

export const temaValido = (id) => (TEMAS[id] ? id : 'atardecer');
