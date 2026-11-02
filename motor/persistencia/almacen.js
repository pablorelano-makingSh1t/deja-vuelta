// Almacenamiento clave-valor intercambiable. localStorage si existe; si no, memoria.
export function crearAlmacen() {
  try {
    const ls = globalThis.localStorage;
    const k = '__inc_prueba__';
    ls.setItem(k, '1'); ls.removeItem(k);
    return {
      tipo: 'local',
      get: (c) => ls.getItem(c),
      set: (c, v) => ls.setItem(c, v),
      del: (c) => ls.removeItem(c),
    };
  } catch {
    const m = new Map();
    return { tipo: 'memoria', get: (c) => m.get(c) ?? null, set: (c, v) => m.set(c, String(v)), del: (c) => m.delete(c) };
  }
}
