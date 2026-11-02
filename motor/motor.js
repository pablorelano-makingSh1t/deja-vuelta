// Fachada del motor: crearJuego(config) -> juego.
// La lógica no toca el DOM (salvo iniciar(), que arranca el bucle y escucha visibilidad),
// así que se puede probar en node con juego.avanzar(segundos).
import { N, Decimal } from './numeros/num.js';
import { crearFormato } from './numeros/formato.js';
import { crearBus } from './nucleo/eventos.js';
import { crearBucle } from './nucleo/bucle.js';
import { normalizar, costeK, maxAsequible } from './economia/costes.js';
import { evaluar } from './progresion/condiciones.js';
import { crearAlmacen } from './persistencia/almacen.js';
import { crearGuardado } from './persistencia/guardado.js';
import { crearI18n, idiomaNavegador } from './servicios/i18n.js';
import { crearAnalitica } from './servicios/analitica.js';
import { crearAudio } from './servicios/audio.js';
import plataformaNone from './plataforma/adaptadores/none.js';
import { textosMotor } from './i18n.js';

export { N, Decimal };

const VERSION_MOTOR = 1;

export function crearJuego({
  datos,
  sistemas = [],
  migraciones = {},
  i18n: textosJuego = {},
  plataforma = plataformaNone,
  almacen = crearAlmacen(),
  ahora = () => Date.now(),
}) {
  const D = {
    recursos: {}, generadores: {}, mejoras: {}, prestigio: [], logros: {}, recompensas: {},
    desbloqueos: {}, click: {}, offline: { topeHoras: 8, eficiencia: 0.5 }, ...datos,
  };
  const bus = crearBus();
  const guardado = crearGuardado({ almacen, juegoId: D.id, version: D.version ?? 1, migraciones, ahora });
  const analitica = crearAnalitica({ almacen, juegoId: D.id, ahora });
  const audio = crearAudio();

  // ---------- ajustes (sobreviven a borrar partida) ----------
  const claveAjustes = `inc.${D.id}.ajustes`;
  const diccionarios = {};
  for (const l of new Set([...Object.keys(textosMotor), ...Object.keys(textosJuego)])) {
    diccionarios[l] = { ...textosMotor[l], ...textosJuego[l] };
  }
  let ajustes = { notacion: 'estandar', idioma: idiomaNavegador(Object.keys(diccionarios)), volumen: 0.5, silencio: false };
  try { ajustes = { ...ajustes, ...JSON.parse(almacen.get(claveAjustes) ?? '{}') }; } catch { /* nada */ }
  const i18n = crearI18n({ idioma: ajustes.idioma, diccionarios });
  const fmt = crearFormato({ idioma: ajustes.idioma, notacion: ajustes.notacion });
  audio.volumen = ajustes.volumen; audio.silencio = ajustes.silencio;

  // ---------- estado ----------
  const costes = {}; // id -> {recurso: def normalizada}
  for (const [id, g] of [...Object.entries(D.generadores), ...Object.entries(D.mejoras)]) {
    costes[id] = Object.fromEntries(Object.entries(g.coste ?? {}).map(([r, d]) => [r, normalizar(d)]));
  }

  function estadoInicial() {
    const e = {
      recursos: {}, gen: {}, mej: {}, desbloq: {}, logros: {}, capas: {}, buffs: [],
      enfriamientos: {}, limites: {}, tiempo: 0, sis: {},
    };
    for (const [id, r] of Object.entries(D.recursos)) {
      e.recursos[id] = { c: N(r.inicial ?? 0), capa: N(0), hist: N(0) };
    }
    for (const id of Object.keys(D.generadores)) e.gen[id] = { n: 0, x: N(0) };
    for (const id of Object.keys(D.mejoras)) e.mej[id] = 0;
    for (const p of D.prestigio) e.capas[p.id] = { veces: 0 };
    return e;
  }
  let estado = estadoInicial();

  // ---------- modificadores ----------
  const fuentes = [];
  let cache = new Map();
  const invalidar = () => { cache = new Map(); };

  const valorEfecto = (v, ...args) => (typeof v === 'function' ? N(v(...args)) : N(v));

  function efectosActivos() {
    const out = [];
    for (const [id, m] of Object.entries(D.mejoras)) {
      const nivel = estado.mej[id];
      if (!nivel) continue;
      for (const ef of [].concat(m.efecto ?? [])) {
        const o = { objetivo: ef.objetivo, fuente: id };
        if (ef.mult !== undefined) o.mult = typeof ef.mult === 'function' ? N(ef.mult(nivel, juego)) : N(ef.mult).pow(nivel);
        if (ef.suma !== undefined) o.suma = typeof ef.suma === 'function' ? N(ef.suma(nivel, juego)) : N(ef.suma).mul(nivel);
        if (ef.pot !== undefined) o.pot = valorEfecto(ef.pot, nivel, juego);
        out.push(o);
      }
    }
    for (const [id, l] of Object.entries(D.logros)) {
      if (!estado.logros[id] || !l.efecto) continue;
      for (const ef of [].concat(l.efecto)) out.push(efectoFijo(ef, id));
    }
    for (const p of D.prestigio) {
      if (!p.efectoMoneda) continue;
      const c = cantidad(p.moneda);
      for (const ef of [].concat(p.efectoMoneda)) {
        const o = { objetivo: ef.objetivo, fuente: p.moneda };
        if (ef.mult) o.mult = valorEfecto(ef.mult, c, juego);
        if (ef.suma) o.suma = valorEfecto(ef.suma, c, juego);
        out.push(o);
      }
    }
    for (const b of estado.buffs) out.push({ objetivo: b.objetivo, mult: N(b.mult), fuente: b.id });
    for (const f of fuentes) for (const ef of f(juego) ?? []) out.push(efectoFijo(ef, ef.fuente ?? 'sistema'));
    return out;
  }
  function efectoFijo(ef, fuente) {
    const o = { objetivo: ef.objetivo, fuente };
    if (ef.mult !== undefined) o.mult = valorEfecto(ef.mult, juego);
    if (ef.suma !== undefined) o.suma = valorEfecto(ef.suma, juego);
    if (ef.pot !== undefined) o.pot = valorEfecto(ef.pot, juego);
    return o;
  }
  function agregados() {
    if (cache.has('__agg')) return cache.get('__agg');
    const agg = new Map();
    for (const ef of efectosActivos()) {
      const a = agg.get(ef.objetivo) ?? { suma: N(0), mult: N(1), pot: N(1), lista: [] };
      if (ef.suma) a.suma = a.suma.add(ef.suma);
      if (ef.mult) a.mult = a.mult.mul(ef.mult);
      if (ef.pot) a.pot = a.pot.mul(ef.pot);
      a.lista.push(ef);
      agg.set(ef.objetivo, a);
    }
    cache.set('__agg', agg);
    return agg;
  }
  // (base + Σsuma) · Πmult ^ Πpot
  function valor(objetivo, base = 1) {
    const a = agregados().get(objetivo);
    if (!a) return N(base);
    let v = N(base).add(a.suma).mul(a.mult);
    if (!a.pot.eq(1)) v = v.pow(a.pot.toNumber());
    return v;
  }
  const mult = (objetivo) => valor(objetivo, 1);
  const desglose = (objetivo) => agregados().get(objetivo)?.lista ?? [];

  // ---------- recursos ----------
  const r$ = (id) => estado.recursos[id] ?? (estado.recursos[id] = { c: N(0), capa: N(0), hist: N(0) });
  const cantidad = (id) => r$(id).c;
  const total = (id) => r$(id).hist;
  const totalCapa = (id) => r$(id).capa;
  function tope(id) {
    const t = D.recursos[id]?.tope;
    if (t === undefined) return null;
    return typeof t === 'function' ? N(t(juego)) : valor(`tope:${id}`, t);
  }
  function anadir(id, x) {
    x = N(x);
    const r = r$(id);
    r.c = r.c.add(x);
    if (x.gt(0)) { r.capa = r.capa.add(x); r.hist = r.hist.add(x); }
    const t = tope(id);
    if (t && r.c.gt(t)) r.c = t;
    if (r.c.lt(0)) r.c = N(0);
  }
  function puedePagar(coste) {
    return Object.entries(coste).every(([r, x]) => cantidad(r).gte(x));
  }
  function pagar(coste) {
    if (!puedePagar(coste)) return false;
    for (const [r, x] of Object.entries(coste)) r$(r).c = cantidad(r).sub(x);
    return true;
  }

  // ---------- generadores y mejoras ----------
  const cuantos = (id) => (estado.gen[id] ? estado.gen[id].n + estado.gen[id].x.toNumber() : 0);
  const comprados = (id) => estado.gen[id]?.n ?? estado.mej[id] ?? 0;
  const nivel = (id) => estado.mej[id] ?? 0;
  const defDe = (id) => D.generadores[id] ?? D.mejoras[id];
  const maxNivel = (id) => (D.mejoras[id] ? (D.mejoras[id].max ?? 1) : Infinity);

  function coste(id, k = 1) {
    const n = comprados(id);
    return Object.fromEntries(Object.entries(costes[id] ?? {}).map(([r, d]) => [r, costeK(d, n, k)]));
  }
  function cuantosAsequibles(id) {
    const n = comprados(id);
    let k = Infinity;
    for (const [r, d] of Object.entries(costes[id] ?? {})) k = Math.min(k, maxAsequible(d, n, cantidad(r)));
    return Math.max(0, Math.min(k, maxNivel(id) - n));
  }
  function comprar(id, k = 1) {
    if (!desbloqueado(id)) return 0;
    if (k === 'max') k = cuantosAsequibles(id);
    k = Math.min(k, maxNivel(id) - comprados(id));
    if (k <= 0 || !pagar(coste(id, k))) return 0;
    if (estado.gen[id]) estado.gen[id].n += k; else estado.mej[id] += k;
    invalidar();
    bus.emit('compra', { id, k });
    defDe(id)?.alComprar?.(juego, k);
    revisarDesbloqueos();
    return k;
  }

  // Producción por segundo de cada recurso (y de generadores que producen generadores).
  function produccionBase() {
    if (cache.has('__prod')) return cache.get('__prod');
    const p = {};
    for (const [id, g] of Object.entries(D.generadores)) {
      const n = cuantos(id);
      if (!n) continue;
      for (const [r, base] of Object.entries(g.produce ?? {})) {
        let x = valor(id, base).mul(n);
        if (!D.generadores[r]) x = x.mul(mult(`prod:${r}`)).mul(mult('produccion'));
        p[r] = (p[r] ?? N(0)).add(x);
      }
    }
    cache.set('__prod', p);
    return p;
  }
  // produccionExtra no se cachea: los sistemas propios cambian a cada tick. Llega en bruto
  // (el sistema aplica sus propios multiplicadores).
  function produccion() {
    const extra = D.produccionExtra?.(juego);
    if (!extra) return produccionBase();
    const p = { ...produccionBase() };
    for (const [r, x] of Object.entries(extra)) p[r] = (p[r] ?? N(0)).add(x);
    return p;
  }
  const tasa = (r) => produccion()[r] ?? N(0);

  function click(r = D.clickRecurso ?? Object.keys(D.recursos)[0]) {
    const x = valor(`click:${r}`, D.click[r] ?? 1);
    anadir(r, x);
    bus.emit('click', { recurso: r, cantidad: x });
    return x;
  }

  // ---------- desbloqueos y logros ----------
  const desbloqueado = (id) => {
    const d = defDe(id) ?? (D.desbloqueos[id] !== undefined ? { desbloqueo: D.desbloqueos[id] } : null);
    return !d?.desbloqueo || !!estado.desbloq[id];
  };
  function revisarDesbloqueos() {
    const todos = [
      ...Object.entries(D.generadores).map(([id, g]) => [id, g.desbloqueo]),
      ...Object.entries(D.mejoras).map(([id, m]) => [id, m.desbloqueo]),
      ...Object.entries(D.desbloqueos),
    ];
    for (const [id, cond] of todos) {
      if (!cond || estado.desbloq[id]) continue;
      if (evaluar(cond, juego)) { estado.desbloq[id] = true; bus.emit('desbloqueo', { id }); }
    }
    for (const [id, l] of Object.entries(D.logros)) {
      if (estado.logros[id] || !evaluar(l.cond, juego)) continue;
      estado.logros[id] = true;
      invalidar();
      analitica.hito(`logro:${id}`);
      bus.emit('logro', { id, def: l });
    }
  }

  // ---------- prestigio ----------
  function baseDe(p) {
    if (typeof p.basadoEn === 'function') return N(p.basadoEn(juego));
    const [r, campo = 'capa'] = p.basadoEn.split('.');
    const rr = r$(r);
    return campo === 'totalCapa' || campo === 'capa' ? rr.capa : campo === 'hist' ? rr.hist : rr.c;
  }
  function gananciaDe(p) {
    const x = baseDe(p);
    const f = p.formula;
    let g;
    if (typeof f === 'function') g = N(f(x, juego));
    else if (f.tipo === 'pot') g = x.lt(f.umbral) ? N(0) : x.div(f.umbral).pow(f.exp ?? 0.5).mul(f.mult ?? 1).floor();
    else if (f.tipo === 'log') g = x.lt(f.umbral) ? N(0) : N(Decimal.log10(x.div(f.umbral)) + 1).mul(f.mult ?? 1).floor();
    else throw new Error(`fórmula de prestigio desconocida: ${f.tipo}`);
    return g.mul(mult(`prestigio:${p.id}`)).floor();
  }
  function reiniciarPor(p) {
    const mantiene = new Set(p.mantiene ?? []);
    for (const tag of p.reinicia ?? []) {
      const [tipo, cual] = tag.split(':');
      if (tipo === 'recursos') {
        for (const id of Object.keys(estado.recursos)) {
          if (mantiene.has(id) || id === p.moneda) continue;
          if (cual && cual !== '*' && cual !== id) continue;
          estado.recursos[id].c = N(D.recursos[id]?.inicial ?? 0);
          estado.recursos[id].capa = N(0);
        }
      } else if (tipo === 'generadores') {
        for (const id of Object.keys(estado.gen)) if (!mantiene.has(id) && (!cual || cual === id)) estado.gen[id] = { n: 0, x: N(0) };
      } else if (tipo === 'mejoras') {
        for (const [id, m] of Object.entries(D.mejoras)) {
          if (mantiene.has(id) || (cual && m.tag !== cual && id !== cual)) continue;
          estado.mej[id] = 0;
        }
      } else if (tipo === 'desbloqueos') {
        for (const id of Object.keys(estado.desbloq)) if (!mantiene.has(id)) delete estado.desbloq[id];
      } else if (tipo === 'capa') {
        if (estado.capas[cual]) estado.capas[cual].veces = 0;
      }
    }
  }
  const prestigio = {};
  for (const p of D.prestigio) {
    prestigio[p.id] = {
      def: p,
      ganancia: () => gananciaDe(p),
      puede: () => gananciaDe(p).gt(0) && (!p.requiere || evaluar(p.requiere, juego)),
      get veces() { return estado.capas[p.id].veces; },
      ejecutar() {
        if (!this.puede()) return false;
        const g = gananciaDe(p);
        anadir(p.moneda, g);
        reiniciarPor(p);
        estado.capas[p.id].veces++;
        estado.buffs = estado.buffs.filter((b) => !b.reiniciable);
        for (const s of sistemas) s.reiniciar?.(p.id, juego);
        invalidar();
        analitica.hito(`prestigio:${p.id}`);
        bus.emit('prestigio', { id: p.id, ganancia: g });
        revisarDesbloqueos();
        guardar();
        return true;
      },
    };
  }

  // ---------- recompensas (vídeos opcionales o gratis con enfriamiento) ----------
  let ultimoOffline = null;
  const hoy = () => Math.floor(ahora() / 86400000);
  const recompensas = {
    modo(id) {
      const r = D.recompensas[id];
      if (!r) return null;
      if (plataforma.anunciosDisponibles()) return 'anuncio';
      return r.sinAnuncios === 'gratis' ? 'gratis' : null;
    },
    restante(id) { // segundos de enfriamiento que quedan
      const fin = estado.enfriamientos[id] ?? 0;
      return Math.max(0, (fin - ahora()) / 1000);
    },
    disponible(id) {
      const r = D.recompensas[id];
      const m = this.modo(id);
      if (!m || this.restante(id) > 0) return false;
      const l = estado.limites[id];
      if (r.limiteDia && l?.dia === hoy() && l.n >= r.limiteDia) return false;
      if (r.tipo === 'multiplicarOffline' && (!ultimoOffline || ultimoOffline.usado)) return false;
      return r.disponible ? !!r.disponible(juego) : true;
    },
    async ofrecer(id) {
      if (!this.disponible(id)) return false;
      const r = D.recompensas[id];
      const m = this.modo(id);
      let ok = true;
      if (m === 'anuncio') {
        analitica.video(id, 'ofrecido');
        const silencioPrevio = audio.silencio;
        bucle?.parar();
        ok = await plataforma.recompensa({ alEmpezar: () => { audio.silencio = true; }, alTerminar: () => { audio.silencio = silencioPrevio; } });
        bucle?.iniciar();
        analitica.video(id, ok ? 'visto' : 'fallido');
      }
      if (!ok) return false;
      aplicarRecompensa(r, id);
      const enf = m === 'gratis' ? (r.enfriamientoGratis ?? r.enfriamiento ?? 0) : (r.enfriamiento ?? 0);
      estado.enfriamientos[id] = ahora() + enf * 1000;
      const l = estado.limites[id];
      estado.limites[id] = l?.dia === hoy() ? { dia: l.dia, n: l.n + 1 } : { dia: hoy(), n: 1 };
      bus.emit('recompensa', { id, modo: m });
      guardar();
      return true;
    },
  };
  function aplicarRecompensa(r, id) {
    if (r.tipo === 'impulso') {
      estado.buffs.push({ id, objetivo: r.objetivo ?? 'produccion', mult: r.mult ?? 2, fin: estado.tiempo + (r.duracion ?? 600) });
      invalidar();
    } else if (r.tipo === 'multiplicarOffline') {
      for (const [rec, x] of Object.entries(ultimoOffline.ganado)) anadir(rec, N(x).mul((r.mult ?? 2) - 1));
      ultimoOffline.usado = true;
    } else r.aplicar?.(juego);
  }

  // ---------- tick ----------
  let acumRevisar = 0, acumGuardar = 0;
  function tick(dt, ctx = { offline: false }) {
    estado.tiempo += dt;
    const p = produccion();
    for (const [r, x] of Object.entries(p)) {
      if (estado.gen[r]) estado.gen[r].x = estado.gen[r].x.add(x.mul(dt));
      else anadir(r, x.mul(dt));
    }
    if (Object.keys(p).some((r) => estado.gen[r])) invalidar();
    for (const s of sistemas) if (s.tick && !(ctx.offline && s.offline === false)) s.tick(dt, juego, ctx);
    if (estado.buffs.length && estado.buffs.some((b) => b.fin <= estado.tiempo)) {
      estado.buffs = estado.buffs.filter((b) => b.fin > estado.tiempo);
      invalidar();
    }
    if (ctx.offline) return;
    analitica.sumarTiempo(dt);
    acumRevisar += dt;
    if (acumRevisar >= 0.5) { acumRevisar = 0; revisarDesbloqueos(); }
    acumGuardar += dt;
    if (acumGuardar >= 30) { acumGuardar = 0; guardar(); }
    bus.emit('tick', dt);
  }

  // Avanza `seg` segundos a mano (tests, simulador). Con offline:true usa como mucho `pasos` pasos.
  function avanzar(seg, { paso = 0.1, offline = false, pasos = 1000 } = {}) {
    if (offline) {
      const n = Math.max(1, Math.min(pasos, Math.ceil(seg / paso)));
      for (let i = 0; i < n; i++) tick(seg / n, { offline: true });
      revisarDesbloqueos();
    } else {
      let t = seg;
      while (t > 1e-9) { const d = Math.min(paso, t); tick(d); t -= d; }
    }
  }

  function aplicarOffline(segundosReales) {
    const s = Math.max(0, segundosReales);
    if (s < 10) return null;
    const topeH = valor('offline:tope', D.offline.topeHoras).toNumber();
    const ef = valor('offline:eficiencia', D.offline.eficiencia).toNumber();
    const efectivo = Math.min(s, topeH * 3600) * ef;
    const antes = Object.fromEntries(Object.entries(estado.recursos).map(([id, r]) => [id, r.c]));
    avanzar(efectivo, { offline: true });
    const ganado = {};
    for (const [id, r] of Object.entries(estado.recursos)) {
      const d = r.c.sub(antes[id] ?? 0);
      if (d.gt(0)) ganado[id] = d;
    }
    ultimoOffline = { segundos: s, efectivo, ganado, usado: false };
    bus.emit('offline', ultimoOffline);
    return ultimoOffline;
  }

  // ---------- guardado ----------
  function serializar() {
    const s = structuredClone({ ...estado, recursos: {}, gen: {}, sis: {} });
    for (const [id, r] of Object.entries(estado.recursos)) s.recursos[id] = { c: r.c.toString(), capa: r.capa.toString(), hist: r.hist.toString() };
    for (const [id, g] of Object.entries(estado.gen)) s.gen[id] = { n: g.n, x: g.x.toString() };
    for (const sis of sistemas) if (sis.serializar) s.sis[sis.id] = sis.serializar(juego);
    s.motor = VERSION_MOTOR;
    return s;
  }
  function deserializar(s) {
    const e = estadoInicial();
    for (const [id, r] of Object.entries(s.recursos ?? {})) e.recursos[id] = { c: N(r.c), capa: N(r.capa), hist: N(r.hist) };
    for (const [id, g] of Object.entries(s.gen ?? {})) if (e.gen[id]) e.gen[id] = { n: g.n, x: N(g.x) };
    for (const [id, n] of Object.entries(s.mej ?? {})) if (id in e.mej) e.mej[id] = n;
    for (const [id, c] of Object.entries(s.capas ?? {})) if (e.capas[id]) e.capas[id] = c;
    Object.assign(e, {
      desbloq: s.desbloq ?? {}, logros: s.logros ?? {}, buffs: s.buffs ?? [],
      enfriamientos: s.enfriamientos ?? {}, limites: s.limites ?? {}, tiempo: s.tiempo ?? 0, sis: s.sis ?? {},
    });
    estado = e;
    for (const sis of sistemas) sis.cargar?.(estado.sis[sis.id], juego);
    invalidar();
  }
  function guardar() {
    try { guardado.guardar(serializar()); analitica.guardar(); bus.emit('guardado'); } catch (e) { console.error('No se pudo guardar', e); }
  }
  function importar(texto) {
    const r = guardado.importar(texto);
    if (!r) return false;
    guardar(); // copia de seguridad en .bak
    deserializar(r.datos);
    guardar();
    bus.emit('cargado', { importado: true });
    return true;
  }
  function borrarPartida() {
    guardado.borrar();
    estado = estadoInicial();
    for (const sis of sistemas) sis.cargar?.(undefined, juego);
    invalidar();
    bus.emit('cargado', { borrado: true });
  }

  // ---------- ajustes ----------
  function ajustar(k, v) {
    ajustes[k] = v;
    if (k === 'idioma') { i18n.idioma = v; fmt.set('idioma', v); }
    if (k === 'notacion') fmt.set('notacion', v);
    if (k === 'volumen') audio.volumen = v;
    if (k === 'silencio') audio.silencio = v;
    almacen.set(claveAjustes, JSON.stringify(ajustes));
    bus.emit('ajustes', { k, v });
  }

  // ---------- ciclo de vida (navegador) ----------
  let bucle = null;
  const renders = new Set();
  // Carga la partida (o empieza de cero), inicia sistemas y aplica el offline. Sin DOM.
  function preparar({ cargarPartida = true } = {}) {
    let offline = null;
    const g = cargarPartida ? guardado.cargar() : null;
    if (g) { deserializar(g.datos); offline = (ahora() - g.ts) / 1000; }
    else for (const sis of sistemas) sis.cargar?.(undefined, juego);
    for (const s of sistemas) s.iniciar?.(juego);
    revisarDesbloqueos();
    if (offline) aplicarOffline(offline);
  }

  async function iniciar({ cargarPartida = true } = {}) {
    await plataforma.iniciar();
    preparar({ cargarPartida });
    analitica.sesion();
    if (typeof requestAnimationFrame !== 'undefined') {
      bucle = crearBucle({
        tick,
        render: () => { for (const f of renders) f(juego); },
        sobrante: (seg) => avanzar(seg, { offline: true }),
      });
      bucle.iniciar();
      let oculto = 0;
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) { oculto = ahora(); guardar(); bucle.parar(); plataforma.pausa(); }
        else { bucle.iniciar(); plataforma.jugando(); if (oculto) aplicarOffline((ahora() - oculto) / 1000); oculto = 0; }
      });
      addEventListener('pagehide', guardar);
    }
    plataforma.cargaTerminada();
    plataforma.jugando();
    bus.emit('listo');
  }

  const juego = {
    datos: D, plataforma, audio, analitica, fmt, prestigio, recompensas,
    get estado() { return estado; },
    get sis() { return estado.sis; },
    t: (...a) => i18n.t(...a),
    get idioma() { return i18n.idioma; },
    idiomas: () => i18n.idiomas(),
    on: bus.on, off: bus.off, emit: bus.emit,
    cantidad, total, totalCapa, anadir, pagar, puedePagar, tope,
    cuantos, comprados, nivel, coste, comprar, cuantosAsequibles, maxNivel,
    puedeComprar: (id, k = 1) => desbloqueado(id) && comprados(id) + k <= maxNivel(id) && puedePagar(coste(id, k)),
    tasa, produccion, click, valor, mult, desglose, invalidar,
    fuente: (f) => { fuentes.push(f); invalidar(); },
    desbloqueado, revisarDesbloqueos, evaluar: (c) => evaluar(c, juego),
    tick, avanzar, aplicarOffline, get ultimoOffline() { return ultimoOffline; },
    guardar, exportar: () => guardado.exportar(serializar()), importar, borrarPartida,
    serializar, deserializar,
    ajustes: () => ({ ...ajustes }), ajustar,
    alRender: (f) => { renders.add(f); return () => renders.delete(f); },
    preparar, iniciar,
    get bucle() { return bucle; },
  };
  return juego;
}
