// Costes en fórmula cerrada.
// Definición de coste de un recurso: número (fijo) | {base, ratio} (exponencial) | función(n) -> N
import { N } from '../numeros/num.js';
import Decimal from '../vendor/break_infinity.esm.js';

export function normalizar(def) {
  if (typeof def === 'function') return { tipo: 'fn', fn: def };
  if (typeof def === 'number' || typeof def === 'string' || def instanceof Decimal) return { tipo: 'fijo', base: N(def) };
  return { tipo: 'exp', base: N(def.base), ratio: def.ratio ?? 1 };
}

// Coste de comprar k unidades teniendo ya n.
export function costeK(d, n, k = 1) {
  if (k <= 0) return N(0);
  if (d.tipo === 'fijo') return d.base.mul(k);
  if (d.tipo === 'fn') { let s = N(0); for (let i = 0; i < k; i++) s = s.add(d.fn(n + i)); return s; }
  if (d.ratio === 1) return d.base.mul(k);
  return Decimal.sumGeometricSeries(k, d.base, d.ratio, n);
}

// Máximo k asequible con `dinero` teniendo n.
export function maxAsequible(d, n, dinero) {
  dinero = N(dinero);
  if (d.tipo === 'fijo' || (d.tipo === 'exp' && d.ratio === 1)) return dinero.div(d.base).floor().toNumber();
  if (d.tipo === 'fn') { let k = 0, s = N(0); while (k < 10000) { s = s.add(d.fn(n + k)); if (s.gt(dinero)) break; k++; } return k; }
  return Decimal.affordGeometricSeries(dinero, d.base, d.ratio, n).toNumber();
}
