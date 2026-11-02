// Formato de números, tiempos y tasas.
import { N } from './num.js';

const SUFIJOS = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc',
  'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc', 'NoDc', 'Vg'];

function letras(i) { // 0 -> aa, 1 -> ab ...
  const a = 'abcdefghijklmnopqrstuvwxyz';
  return a[Math.floor(i / 26) % 26] + a[i % 26];
}

export function crearFormato({ idioma = 'es', notacion = 'estandar' } = {}) {
  const cfg = { idioma, notacion };
  let intl0, intl2;
  const reIntl = () => {
    intl0 = new Intl.NumberFormat(cfg.idioma, { maximumFractionDigits: 0 });
    intl2 = new Intl.NumberFormat(cfg.idioma, { maximumFractionDigits: 2 });
  };
  reIntl();

  function num(x, { decimales = 2, entero = false } = {}) {
    const d = N(x);
    if (!isFinite(d.mantissa) || Number.isNaN(d.mantissa)) return '∞';
    const neg = d.lt(0);
    const a = d.abs();
    if (a.lt(1e6)) {
      const v = a.toNumber();
      const s = entero || v >= 1000 ? intl0.format(Math.floor(v)) :
        v >= 100 ? intl0.format(Math.floor(v)) :
          v >= 10 ? new Intl.NumberFormat(cfg.idioma, { maximumFractionDigits: 1 }).format(Math.floor(v * 10) / 10) :
            intl2.format(Math.floor(v * 100) / 100);
      return (neg ? '-' : '') + s;
    }
    const e = a.exponent;
    const m = a.mantissa;
    let s;
    if (cfg.notacion === 'cientifica' || (cfg.notacion === 'estandar' && e >= 3 * (SUFIJOS.length + 26 * 26))) {
      s = `${m.toFixed(decimales)}e${e}`;
    } else if (cfg.notacion === 'ingenieria') {
      const e3 = e - (e % 3);
      s = `${(m * 10 ** (e - e3)).toFixed(decimales)}e${e3}`;
    } else {
      let g = Math.floor(e / 3);
      let v = m * 10 ** (e - g * 3);
      const dec = (x) => (x >= 100 ? 0 : x >= 10 ? 1 : decimales);
      if (Number(v.toFixed(dec(v))) >= 1000) { g++; v /= 1000; } // 999.996B → 1.00T, no "1000B"
      const suf = g < SUFIJOS.length ? SUFIJOS[g] : letras(g - SUFIJOS.length);
      s = `${v.toFixed(dec(v))}${suf}`;
    }
    if (cfg.idioma.startsWith('es')) s = s.replace('.', ',');
    return (neg ? '-' : '') + s;
  }

  function tiempo(seg) {
    seg = Math.max(0, Math.floor(seg));
    const d = Math.floor(seg / 86400), h = Math.floor(seg / 3600) % 24,
      m = Math.floor(seg / 60) % 60, s = seg % 60;
    if (d) return `${d} d ${h} h`;
    if (h) return `${h} h ${m} min`;
    if (m) return `${m} min ${s} s`;
    return `${s} s`;
  }

  return {
    num, tiempo,
    tasa: (x) => `${num(x)}/s`,
    pct: (x) => `${intl0.format(Math.round(x * 100))} %`,
    set(k, v) { cfg[k] = v; reIntl(); },
    get cfg() { return { ...cfg }; },
  };
}
