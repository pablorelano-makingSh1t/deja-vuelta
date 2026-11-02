// Utilidades de UI. No es un framework: helpers pequeños que cada juego usa a su gusto.

const PROPS = new Set(['className', 'innerHTML', 'textContent', 'value', 'checked', 'selected', 'disabled', 'hidden', 'htmlFor', 'title']);

// el('button.clase#id', {onclick, title, ...}, ...hijos)
export function el(sel, attrs = {}, ...hijos) {
  const [, tag = 'div', resto = ''] = sel.match(/^([a-z0-9-]*)(.*)$/i);
  const e = document.createElement(tag || 'div');
  for (const m of resto.matchAll(/([.#])([\w-]+)/g)) m[1] === '.' ? e.classList.add(m[2]) : (e.id = m[2]);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k === 'dataset') Object.assign(e.dataset, v);
    else if (PROPS.has(k) || (k in e && typeof v !== 'string')) e[k] = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const h of hijos.flat()) if (h !== null && h !== undefined && h !== false) e.append(h instanceof Node ? h : String(h));
  return e;
}

// Actualiza textContent solo si cambió (llamar desde alRender).
export function texto(e, v) { v = String(v); if (e.textContent !== v) e.textContent = v; }
export function clase(e, c, on) { if (e.classList.contains(c) !== !!on) e.classList.toggle(c, !!on); }

// Por defecto los avisos y modales van a <body>. Un juego puede mandarlos a otra zona
// (p. ej. para que nunca tapen la simulación) con configurarUI({ contenedor }).
let contenedorUI = null;
export function configurarUI({ contenedor } = {}) { contenedorUI = contenedor ?? null; contToasts?.remove(); contToasts = null; }

let contToasts = null;
export function toast(msg, { ms = 2600, tipo = '' } = {}) {
  contToasts ??= (contenedorUI ?? document.body).appendChild(el('div.inc-toasts'));
  const t = contToasts.appendChild(el(`div.inc-toast${tipo ? '.' + tipo : ''}`, {}, msg));
  while (contToasts.children.length > 3) contToasts.firstChild.remove(); // que no tapen el juego
  setTimeout(() => { t.classList.add('fuera'); setTimeout(() => t.remove(), 400); }, ms);
}

export function modal(titulo, contenido, { botones = [], alCerrar } = {}) {
  const fondo = el('div.inc-modal-fondo');
  const cerrar = () => { fondo.remove(); alCerrar?.(); };
  const caja = el('div.inc-modal', { role: 'dialog' },
    el('h2', {}, titulo),
    el('div.inc-modal-cuerpo', {}, contenido),
    el('div.inc-modal-botones', {}, botones.map((b) => el('button', {
      onclick: async () => { if ((await b.accion?.()) !== false) cerrar(); },
      className: b.clase ?? '',
    }, b.texto))));
  fondo.append(caja);
  fondo.addEventListener('click', (e) => { if (e.target === fondo) cerrar(); });
  (contenedorUI ?? document.body).append(fondo);
  if (contenedorUI) fondo.classList.add('inc-en-contenedor');
  return { cerrar, caja };
}

// Modal de "mientras no estabas" con la oferta x2 si la hay.
export function modalOffline(juego, res, { oferta = 'offline_x2', nombres = {} } = {}) {
  const { t, fmt } = juego;
  const lista = el('ul.inc-lista', {}, Object.entries(res.ganado).map(([r, x]) =>
    el('li', {}, `+${fmt.num(x)} ${nombres[r] ?? t(`recurso.${r}`)}`)));
  const botones = [];
  if (juego.datos.recompensas[oferta] && juego.recompensas.disponible(oferta)) {
    const anuncio = juego.recompensas.modo(oferta) === 'anuncio';
    botones.push({
      texto: t(anuncio ? 'motor.offline.x2' : 'motor.offline.x2gratis'),
      clase: anuncio ? 'inc-video' : '',
      accion: () => juego.recompensas.ofrecer(oferta),
    });
  }
  botones.push({ texto: t('motor.cerrar') });
  return modal(t('motor.offline.titulo'), [el('p', {}, t('motor.offline.tiempo', { t: fmt.tiempo(res.segundos) })), lista], { botones });
}

export function panelAjustes(juego, { extra } = {}) {
  const { t } = juego;
  const a = juego.ajustes();
  const sel = el('select', { onchange: (e) => juego.ajustar('notacion', e.target.value) },
    ['estandar', 'cientifica', 'ingenieria'].map((n) => el('option', { value: n, selected: a.notacion === n }, t(`motor.notacion.${n}`))));
  const idi = el('select', { onchange: (e) => { juego.ajustar('idioma', e.target.value); location.reload(); } },
    juego.idiomas().map((l) => el('option', { value: l, selected: a.idioma === l }, l.toUpperCase())));
  const vol = el('input', { type: 'range', min: 0, max: 1, step: 0.05, value: a.volumen, oninput: (e) => juego.ajustar('volumen', +e.target.value) });
  const sil = el('input', { type: 'checkbox', checked: a.silencio, onchange: (e) => juego.ajustar('silencio', e.target.checked) });
  const cuerpo = el('div.inc-ajustes', {},
    el('label', {}, t('motor.notacion'), sel),
    el('label', {}, t('motor.idioma'), idi),
    el('label', {}, t('motor.volumen'), vol),
    el('label', {}, t('motor.silencio'), sil),
    extra ?? null,
    el('div.inc-fila', {},
      el('button', { onclick: () => { juego.guardar(); toast(t('motor.guardado')); } }, t('motor.guardar')),
      el('button', { onclick: async () => {
        const s = juego.exportar();
        try { await navigator.clipboard.writeText(s); toast(t('motor.exportar.copiado')); } catch { prompt(t('motor.exportar'), s); }
      } }, t('motor.exportar')),
      el('button', { onclick: () => {
        const s = prompt(t('motor.importar.pegar'));
        if (s) toast(t(juego.importar(s) ? 'motor.importar.ok' : 'motor.importar.mal'));
      } }, t('motor.importar')),
      el('button.peligro', { onclick: () => { if (confirm(t('motor.borrar.seguro'))) { juego.borrarPartida(); location.reload(); } } }, t('motor.borrar'))));
  return modal(t('motor.ajustes'), cuerpo, { botones: [{ texto: t('motor.cerrar') }] });
}

// Botón de recompensa opcional: se oculta solo si no hay modo disponible.
export function botonRecompensa(juego, id, etiqueta) {
  const b = el('button.inc-recompensa', { onclick: () => juego.recompensas.ofrecer(id) });
  juego.alRender(() => {
    const modo = juego.recompensas.modo(id);
    b.hidden = !modo;
    if (!modo) return;
    const resta = juego.recompensas.restante(id);
    b.disabled = !juego.recompensas.disponible(id);
    clase(b, 'inc-video', modo === 'anuncio');
    texto(b, resta > 0 ? `${etiqueta} · ${juego.fmt.tiempo(resta)}` : (modo === 'anuncio' ? `▶ ${etiqueta}` : etiqueta));
  });
  return b;
}
