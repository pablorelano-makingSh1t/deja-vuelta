// Bus de eventos mínimo.
export function crearBus() {
  const h = new Map();
  return {
    on(ev, fn) { (h.get(ev) ?? h.set(ev, new Set()).get(ev)).add(fn); return () => h.get(ev)?.delete(fn); },
    off(ev, fn) { h.get(ev)?.delete(fn); },
    emit(ev, datos) {
      for (const fn of h.get(ev) ?? []) {
        try { fn(datos); } catch (e) { console.error(`[evento ${ev}]`, e); }
      }
    },
  };
}
