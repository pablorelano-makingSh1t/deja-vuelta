// Envoltorio de números grandes. Todo el motor pasa por aquí.
import Decimal from '../vendor/break_infinity.esm.js';

export { Decimal };
export const N = (x) => (x instanceof Decimal ? x : new Decimal(x ?? 0));
export const CERO = () => new Decimal(0);
export const UNO = () => new Decimal(1);
export const esN = (x) => x instanceof Decimal;
export const max = (a, b) => (N(a).gte(b) ? N(a) : N(b));
export const min = (a, b) => (N(a).lte(b) ? N(a) : N(b));
