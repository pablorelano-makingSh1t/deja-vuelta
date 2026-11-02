// Monta la partida completa (motor + sistemas propios) sin DOM: la usan main.js, sim.js y los tests.
import { N } from '../../../motor/numeros/num.js';
import base from '../datos.js';
import { crearSistemaBucle } from './bucle.js';
import { crearSistemaSecretos, logrosParaMotor } from './secretos.js';
import { crearSistemaCronica } from './cronica.js';

export function crearPartida(crearJuego, { azar, ...opciones } = {}) {
  const bucle = crearSistemaBucle({ azar });
  const secretos = crearSistemaSecretos();
  const cronica = crearSistemaCronica();
  const datos = { ...base, logros: logrosParaMotor(), produccionExtra: (j) => j.vuelta?.extra() };
  // El orden importa: el bucle se reinicia antes que la Crónica (que lee lo que ha llegado).
  const j = crearJuego({ datos, sistemas: [bucle, secretos, cronica], ...opciones });
  j.vuelta = bucle;
  j.secretos = secretos;
  j.cronica = cronica;
  j.ahoraMs = opciones.ahora ?? (() => Date.now());
  j.fuente((jj) => bucle.efectos(jj));
  j.fuente(() => secretos.efectos());

  // Avivar (el toque en la escena): valor fijo + un 5 % de lo que produce la riqueza por segundo.
  j.valorAvivar = () => j.valor('click:riqueza', 1).add(j.tasa('riqueza').mul(0.05).mul(j.mult('click:riqueza')));
  j.avivar = () => {
    const x = j.valorAvivar();
    j.anadir('riqueza', x);
    j.emit('click', { recurso: 'riqueza', cantidad: x });
    return x;
  };
  return j;
}

export { N };
