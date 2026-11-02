// Traducciones: t('clave', {n}) con plural simple (_one/_other) e interpolación {var}.
export function crearI18n({ idioma, diccionarios }) {
  let actual = idioma;
  const dic = () => diccionarios[actual] ?? diccionarios.es ?? {};
  function t(clave, vars = {}) {
    const d = dic();
    let s = d[clave];
    if (vars.n !== undefined) s = d[`${clave}_${Number(vars.n) === 1 ? 'one' : 'other'}`] ?? s;
    s ??= diccionarios.es?.[clave] ?? clave;
    return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
  }
  return {
    t,
    get idioma() { return actual; },
    set idioma(v) { actual = v; },
    idiomas: () => Object.keys(diccionarios),
  };
}

export function idiomaNavegador(disponibles) {
  const n = (globalThis.navigator?.language ?? 'es').slice(0, 2);
  return disponibles.includes(n) ? n : 'es';
}
