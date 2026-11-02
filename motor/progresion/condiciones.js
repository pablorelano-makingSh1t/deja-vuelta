// Condiciones declarativas para desbloqueos y logros.
// {recurso, min} cantidad actual | {total: recurso, min} total histórico | {totalCapa: recurso, min}
// {tiene: generador, min} | {mejora: id, nivel} | {logro: id} | {capa: id, veces}
// {todas: [...]} | {alguna: [...]} | función(juego) -> bool
export function evaluar(c, j) {
  if (!c) return true;
  if (typeof c === 'function') return !!c(j);
  if (c.todas) return c.todas.every((x) => evaluar(x, j));
  if (c.alguna) return c.alguna.some((x) => evaluar(x, j));
  const e = j.estado;
  if (c.recurso) return j.cantidad(c.recurso).gte(c.min ?? 0);
  if (c.total) return j.total(c.total).gte(c.min ?? 0);
  if (c.totalCapa) return j.totalCapa(c.totalCapa).gte(c.min ?? 0);
  if (c.tiene) return j.cuantos(c.tiene) >= (c.min ?? 1);
  if (c.mejora) return (e.mej[c.mejora] ?? 0) >= (c.nivel ?? 1);
  if (c.logro) return !!e.logros[c.logro];
  if (c.capa) return (e.capas[c.capa]?.veces ?? 0) >= (c.veces ?? 1);
  console.warn('condición desconocida', c);
  return false;
}
