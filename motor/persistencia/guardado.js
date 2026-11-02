// Sobres de guardado con hash, copia .bak, export/import base64 y migraciones.

export function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16);
}

const b64enc = (s) => {
  const bytes = new TextEncoder().encode(s);
  let bin = ''; for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};
const b64dec = (s) => {
  const bin = atob(s.trim());
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

export function crearGuardado({ almacen, juegoId, version, migraciones = {}, ahora = () => Date.now() }) {
  const clave = `inc.${juegoId}.0`;

  const sobre = (datos) => {
    const json = JSON.stringify(datos);
    return JSON.stringify({ juego: juegoId, v: version, ts: ahora(), sum: fnv1a(json), datos: json });
  };

  // Devuelve {datos, v, ts} o null si no es válido.
  function abrir(texto) {
    try {
      const s = JSON.parse(texto);
      if (s.juego !== juegoId || fnv1a(s.datos) !== s.sum || s.v > version) return null;
      let datos = JSON.parse(s.datos);
      for (let v = s.v + 1; v <= version; v++) if (migraciones[v]) datos = migraciones[v](datos) ?? datos;
      return { datos, v: s.v, ts: s.ts };
    } catch { return null; }
  }

  return {
    guardar(datos) {
      const prev = almacen.get(clave);
      if (prev) almacen.set(clave + '.bak', prev);
      almacen.set(clave, sobre(datos));
    },
    cargar() {
      const p = almacen.get(clave);
      const r = p && abrir(p);
      if (r) return r;
      const b = almacen.get(clave + '.bak');
      return (b && abrir(b)) || null;
    },
    exportar(datos) { return b64enc(sobre(datos)); },
    importar(texto) { try { return abrir(b64dec(texto)); } catch { return null; } },
    borrar() { almacen.del(clave); almacen.del(clave + '.bak'); },
  };
}
