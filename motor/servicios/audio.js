// Sonido sintetizado con WebAudio. Sin archivos.
export function crearAudio() {
  let ctx = null, maestro = null, volumen = 0.5, silencio = false;
  const asegurar = () => {
    if (ctx) return ctx.state === 'suspended' ? (ctx.resume(), ctx) : ctx;
    // Sin gesto previo del usuario el navegador avisa y no suena: esperamos al primer clic/tecla.
    if (globalThis.navigator?.userActivation && !navigator.userActivation.hasBeenActive) return null;
    const AC = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    maestro = ctx.createGain();
    maestro.gain.value = silencio ? 0 : volumen;
    maestro.connect(ctx.destination);
    return ctx;
  };

  // tono({f, dur, tipo, vol, f2 (glissando), ataque})
  function tono({ f = 440, dur = 0.1, tipo = 'square', vol = 0.3, f2, ataque = 0.005, retraso = 0 } = {}) {
    const c = asegurar(); if (!c || silencio) return;
    const t = c.currentTime + retraso;
    const o = c.createOscillator(), g = c.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(maestro);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function ruido({ dur = 0.05, vol = 0.2, filtro = 2000, retraso = 0 } = {}) {
    const c = asegurar(); if (!c || silencio) return;
    const t = c.currentTime + retraso;
    const n = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(), g = c.createGain(), fl = c.createBiquadFilter();
    s.buffer = buf; fl.type = 'lowpass'; fl.frequency.value = filtro; g.gain.value = vol;
    s.connect(fl).connect(g).connect(maestro); s.start(t);
  }

  return {
    tono, ruido,
    get contexto() { return asegurar(); },
    get salida() { asegurar(); return maestro; },
    set volumen(v) { volumen = v; if (maestro) maestro.gain.value = silencio ? 0 : v; },
    get volumen() { return volumen; },
    set silencio(v) { silencio = v; if (maestro) maestro.gain.value = v ? 0 : volumen; },
    get silencio() { return silencio; },
  };
}
