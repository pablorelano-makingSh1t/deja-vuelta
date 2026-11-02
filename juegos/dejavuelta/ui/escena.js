// La escena: horizonte con el asentamiento, ciclo de día y noche y objetos que se pueden tocar.
// Canvas 2D sin sombras ni blur (va bien en la HD 520 y en móviles modestos). ~30 fps.

const DIA = 240; // s reales por día completo
const PALETAS = {
  1: { cieloD: ['#f3b670', '#7fb2c9'], cieloN: ['#141024', '#06050c'], tierra: '#3a2a1c', colinas: ['#5b4632', '#47372a'], casa: '#2a1d14', luz: '#ffb15c', acento: '#f0923a' },
  2: { cieloD: ['#f0c27f', '#86b9c4'], cieloN: ['#141327', '#06060d'], tierra: '#4a3420', colinas: ['#6a5634', '#4f4029'], casa: '#3b2716', luz: '#ffbf6a', acento: '#e7a14a' },
  3: { cieloD: ['#efc890', '#8fbcc8'], cieloN: ['#151529', '#07070e'], tierra: '#4b3a26', colinas: ['#6c5b3e', '#51442f'], casa: '#3c2b1c', luz: '#ffc878', acento: '#d9ab5a' },
  4: { cieloD: ['#f2cf9b', '#93bfd0'], cieloN: ['#16172c', '#070810'], tierra: '#4a3d2b', colinas: ['#6b6146', '#4f4834'], casa: '#3a2e22', luz: '#ffd08a', acento: '#d8b464' },
  5: { cieloD: ['#efcf9f', '#98c0d4'], cieloN: ['#17182e', '#080912'], tierra: '#463d2e', colinas: ['#666049', '#4d4936'], casa: '#352c22', luz: '#ffd896', acento: '#c9b270' },
  6: { cieloD: ['#e9d5b0', '#9fc4d9'], cieloN: ['#121a33', '#060914'], tierra: '#3b3a33', colinas: ['#5c5e52', '#45473f'], casa: '#2b2c2c', luz: '#fff1b8', acento: '#e9d77a' },
  7: { cieloD: ['#dfd9c7', '#a6c7dc'], cieloN: ['#101a36', '#050916'], tierra: '#33363a', colinas: ['#55595c', '#3f4346'], casa: '#25282d', luz: '#c8f3ff', acento: '#8fd8e8' },
  8: { cieloD: ['#d9cbe8', '#a7b4e6'], cieloN: ['#1a1238', '#08061a'], tierra: '#2d2838', colinas: ['#4d4560', '#3a344a'], casa: '#221d2d', luz: '#d8c6ff', acento: '#a98bff' },
};
import { TEMAS, temaValido } from './temas.js';

// Paleta de una era con el estilo visual aplicado.
export function paleta(era, tema) {
  const t = TEMAS[temaValido(tema)];
  return t.paleta ? t.paleta(era, PALETAS[era]) : PALETAS[era];
}
export const acentoEra = (era, tema) => TEMAS[temaValido(tema)].acento?.(era) ?? paleta(era, tema).acento;

import { crearPoblado, mezcla, hash } from './poblado.js';

export function crearEscena(lienzo, j, { alTocar, tema = () => 'atardecer' }) {
  const ctx = lienzo.getContext('2d');
  let W = 0, H = 0, dpr = 1, horizonte = 0;
  const zonas = []; // {que, x, y, r}
  const chispas = [];
  let mariposa = { x: 0.3, y: 0.5, vx: 0.04, vy: 0, viva: true, aplastada: null };
  let coche = { t: -1, prox: 70 }, cabina = { hasta: 0, prox: 90, x: 0.7 };
  let reloj = 0, ultimo = performance.now(), acum = 0;
  let destello = 0;

  function medir() {
    dpr = Math.min(2, devicePixelRatio || 1);
    const r = lienzo.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    lienzo.width = Math.round(W * dpr); lienzo.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    horizonte = Math.round(H * 0.6);
  }
  new ResizeObserver(medir).observe(lienzo);
  medir();

  lienzo.addEventListener('pointerdown', (e) => {
    const r = lienzo.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    let que = 'avivar';
    for (const z of zonas) if ((x - z.x) ** 2 + (y - z.y) ** 2 <= z.r ** 2) { que = z.que; break; }
    if (que === 'mariposa') { mariposa.viva = false; mariposa.aplastada = { x: mariposa.x, y: mariposa.y }; }
    if (que === 'avivar') for (let i = 0; i < 6; i++) chispas.push({ x: W / 2 + (Math.random() - 0.5) * 10, y: horizonte + H * 0.13, vx: (Math.random() - 0.5) * 60, vy: -60 - Math.random() * 80, v: 1 });
    alTocar(que, { x, y, amanecer: faseSol().amanecer });
  });

  function faseSol() {
    const f = ((j.vuelta.estado.tBucle + 50) % DIA) / DIA; // 0..1; empieza de mañana
    const dia = f < 0.6; // 60 % del ciclo es de día
    const p = dia ? f / 0.6 : (f - 0.6) / 0.4; // progreso en el arco
    return { f, dia, p, amanecer: dia && p < 0.18, luz: dia ? Math.min(1, Math.sin(p * Math.PI) * 2.2) : 0 };
  }

  // ---------- dibujo ----------
  function cielo(pal, sol) {
    const g = ctx.createLinearGradient(0, 0, 0, horizonte);
    const t = sol.luz;
    g.addColorStop(0, mezcla(pal.cieloN[1], pal.cieloD[1], t));
    g.addColorStop(1, mezcla(pal.cieloN[0], pal.cieloD[0], t));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, horizonte + 1);
    if (t < 0.6) { // estrellas
      ctx.fillStyle = `rgba(255,248,230,${(0.6 - t) * 1.2})`;
      for (let i = 0; i < 60; i++) {
        const x = hash(i) * W, y = hash(i + 99) * horizonte * 0.8;
        const s = hash(i + 7) < 0.15 ? 2 : 1;
        ctx.fillRect(Math.round(x), Math.round(y), s, s);
      }
    }
    // sol o luna en arco
    const ax = W * (0.08 + 0.84 * sol.p), ay = horizonte - Math.sin(sol.p * Math.PI) * horizonte * 0.78;
    const rr = Math.max(11, Math.min(W, H) * 0.045);
    if (sol.dia) {
      ctx.fillStyle = 'rgba(255,230,170,.18)';
      ctx.beginPath(); ctx.arc(ax, ay, rr * 2, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff1c9';
      ctx.beginPath(); ctx.arc(ax, ay, rr, 0, 7); ctx.fill();
      zonas.push({ que: 'sol', x: ax, y: ay, r: rr * 2.2 });
    } else {
      ctx.fillStyle = '#ece6f5';
      ctx.beginPath(); ctx.arc(ax, ay, rr * 0.8, 0, 7); ctx.fill();
      ctx.fillStyle = mezcla(pal.cieloN[1], pal.cieloN[0], 0.5);
      ctx.beginPath(); ctx.arc(ax + rr * 0.35, ay - rr * 0.2, rr * 0.7, 0, 7); ctx.fill();
    }
  }

  function colinas(pal, sol) {
    const osc = 1 - sol.luz * 0.0;
    const capa = (color, alto, fase, paso) => {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(0, horizonte);
      for (let x = 0; x <= W + paso; x += paso) ctx.lineTo(x, horizonte - alto * (0.55 + 0.45 * Math.sin(x / W * 5 + fase) * Math.cos(x / W * 2.3 + fase)));
      ctx.lineTo(W, horizonte); ctx.closePath(); ctx.fill();
    };
    capa(mezcla('#000000', pal.colinas[0], 0.35 + sol.luz * 0.65 * osc), H * 0.16, 1.3, 12);
    capa(mezcla('#000000', pal.colinas[1], 0.35 + sol.luz * 0.65), H * 0.09, 4.1, 10);
    // cueva en la colina izquierda
    const cx = W * 0.11, cy = horizonte - H * 0.035, cr = Math.max(9, H * 0.04);
    ctx.fillStyle = mezcla('#000000', pal.colinas[0], 0.3 + sol.luz * 0.5);
    ctx.beginPath(); ctx.ellipse(cx, cy, cr * 2.4, cr * 1.6, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#0b0807';
    ctx.beginPath(); ctx.ellipse(cx, cy + 1, cr, cr * 0.9, 0, Math.PI, 0); ctx.fill();
    ctx.fillRect(cx - cr, cy, cr * 2, 2);
    zonas.push({ que: 'cueva', x: cx, y: cy - cr * 0.3, r: cr * 1.5 });
  }

  function suelo(pal, sol) {
    const g = ctx.createLinearGradient(0, horizonte, 0, H);
    g.addColorStop(0, mezcla('#000000', pal.tierra, 0.45 + sol.luz * 0.55));
    g.addColorStop(1, mezcla('#000000', pal.tierra, 0.25 + sol.luz * 0.35));
    ctx.fillStyle = g;
    ctx.fillRect(0, horizonte, W, H - horizonte);
    // el río (desde el Barro): una franja que baja a la derecha
    if (j.vuelta.era >= 2) {
      ctx.fillStyle = mezcla('#0a1420', '#5d8fa6', 0.25 + sol.luz * 0.55);
      ctx.beginPath();
      ctx.moveTo(W * 0.78, horizonte); ctx.lineTo(W * 0.82, horizonte);
      ctx.quadraticCurveTo(W * 0.86, H * 0.86, W * 0.97, H); ctx.lineTo(W * 0.86, H);
      ctx.quadraticCurveTo(W * 0.8, H * 0.86, W * 0.78, horizonte); ctx.fill();
      if (j.secretos.barcaVisible(j)) {
        const bx = W * 0.86 + Math.sin(reloj) * 3, by = H * 0.86;
        ctx.fillStyle = '#2b1c10';
        ctx.beginPath(); ctx.moveTo(bx - 16, by); ctx.lineTo(bx + 16, by); ctx.lineTo(bx + 10, by + 7); ctx.lineTo(bx - 10, by + 7); ctx.fill();
        ctx.fillStyle = '#e7c66d'; ctx.fillRect(bx - 1, by - 12, 2, 12);
        ctx.beginPath(); ctx.arc(bx + Math.sin(reloj * 3) * 5, by - 2, 2.5, 0, 7); ctx.fill();
        zonas.push({ que: 'barca', x: bx, y: by, r: 26 });
      }
    }
  }

  const pueblo = crearPoblado();
  let pasoActual = 0;
  const datosPueblo = (pal, sol) => ({ W, H, horizonte, pal, sol, j, dt: pasoActual, reloj });
  function poblado(pal, sol) {
    pueblo.dibujar(ctx, datosPueblo(pal, sol), 'fondo');
    if (j.vuelta.era >= 5) monumento(pal, 1 - sol.luz);
    if (j.vuelta.era >= 8) maquina(pal);
  }

  function monumento(pal, noche) {
    const c = j.vuelta.camino, x = W * 0.33, y = horizonte + 2, u = Math.max(8, H * 0.035);
    const piedra = mezcla('#000000', mezcla(pal.colinas[0], '#e2d4b6', 0.5), 0.3 + 0.7 * (1 - noche));
    ctx.fillStyle = piedra;
    if (c === 'hierro') {
      ctx.fillRect(x - u * 0.6, y - u * 4.2, u * 1.2, u * 4.2);
      ctx.fillRect(x - u * 0.9, y - u * 4.6, u * 1.8, u * 0.5);
      ctx.fillStyle = '#b8473a'; ctx.beginPath(); ctx.moveTo(x, y - u * 5.6); ctx.lineTo(x + u * 1.2, y - u * 5.3); ctx.lineTo(x, y - u * 5); ctx.fill();
      ctx.fillStyle = piedra; ctx.fillRect(x - 1, y - u * 5.6, 2, u);
    } else if (c === 'rio') {
      ctx.fillRect(x - u * 2, y - u * 0.4, u * 4, u * 0.4);
      for (let k = -1.6; k <= 1.61; k += 0.8) ctx.fillRect(x + k * u - u * 0.15, y - u * 2.4, u * 0.3, u * 2);
      ctx.beginPath(); ctx.moveTo(x - u * 2.2, y - u * 2.4); ctx.lineTo(x, y - u * 3.4); ctx.lineTo(x + u * 2.2, y - u * 2.4); ctx.fill();
    } else if (c === 'estrellas') {
      ctx.fillRect(x - u * 1.5, y - u * 1.8, u * 3, u * 1.8);
      ctx.beginPath(); ctx.arc(x, y - u * 1.8, u * 1.5, Math.PI, 0); ctx.fill();
      ctx.fillStyle = noche > 0.3 ? pal.luz : '#0d0a08';
      ctx.fillRect(x - u * 0.15, y - u * 3.2, u * 0.3, u * 0.9);
    }
  }

  function maquina(pal) {
    const x = W * 0.66, y = horizonte - H * 0.02, R = Math.max(14, H * 0.07);
    const piezas = ['bastidor', 'bobina', 'nucleo'].filter((id) => j.nivel(id) > 0).length;
    ctx.strokeStyle = '#3b3350'; ctx.lineWidth = Math.max(3, R * 0.18);
    ctx.beginPath(); ctx.arc(x, y - R, R, 0, 7); ctx.stroke();
    if (piezas >= 1) { ctx.fillStyle = '#3b3350'; ctx.fillRect(x - R * 1.1, y - 2, R * 2.2, 4); }
    if (piezas >= 2) { ctx.strokeStyle = pal.luz; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - R, R * 0.72, reloj, reloj + 4.4); ctx.stroke(); }
    if (piezas >= 3) {
      const p = 0.5 + Math.sin(reloj * 3) * 0.2;
      ctx.fillStyle = `rgba(169,139,255,${p})`;
      ctx.beginPath(); ctx.arc(x, y - R, R * 0.55, 0, 7); ctx.fill();
    }
  }

  function hoguera(pal, sol) {
    const x = W / 2, y = horizonte + H * 0.15, u = Math.max(7, H * 0.035);
    const noche = 1 - sol.luz;
    ctx.fillStyle = `rgba(255,150,60,${0.08 + noche * 0.12})`;
    ctx.beginPath(); ctx.ellipse(x, y, u * 4.5, u * 1.6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#2b1a10';
    ctx.fillRect(x - u * 1.2, y - 2, u * 2.4, 4);
    const t = reloj * 9;
    for (let k = 0; k < 3; k++) {
      const h = u * (1.7 - k * 0.42) * (1 + Math.sin(t + k * 2) * 0.12);
      ctx.fillStyle = ['#e2512b', '#f59a35', '#ffe08a'][k];
      ctx.beginPath(); ctx.moveTo(x - u * (0.8 - k * 0.22), y - 1);
      ctx.quadraticCurveTo(x + Math.sin(t * 0.7 + k) * u * 0.3, y - h * 1.3, x + u * (0.8 - k * 0.22), y - 1); ctx.fill();
    }
    zonas.push({ que: 'hoguera', x, y: y - u, r: u * 1.8 });
    // el desconocido, con su venda rosa
    if (j.secretos.desconocidoVisible(j)) {
      const px = x + u * 4.2, py = y + 2;
      ctx.fillStyle = '#0f0b09';
      ctx.fillRect(px - u * 0.25, py - u * 1.3, u * 0.5, u * 1.3);
      ctx.beginPath(); ctx.arc(px, py - u * 1.55, u * 0.28, 0, 7); ctx.fill();
      ctx.fillStyle = '#ff8fb1';
      ctx.fillRect(px - u * 0.3, py - u * 1.65, u * 0.6, u * 0.18);
      zonas.unshift({ que: 'desconocido', x: px, y: py - u, r: u * 1.6 });
    }
  }

  function bichos(dt, sol) {
    const era = j.vuelta.era;
    // mariposa (eras 1-3)
    if (era <= 3 && mariposa.viva && sol.dia) {
      mariposa.vx += (Math.random() - 0.5) * dt * 0.2; mariposa.vy += (Math.random() - 0.5) * dt * 0.3;
      mariposa.vx = Math.max(-0.06, Math.min(0.06, mariposa.vx)); mariposa.vy = Math.max(-0.05, Math.min(0.05, mariposa.vy));
      mariposa.x += mariposa.vx * dt; mariposa.y += mariposa.vy * dt;
      if (mariposa.x < 0.2 || mariposa.x > 0.8) mariposa.vx *= -1;
      if (mariposa.y < 0.45 || mariposa.y > 0.88) mariposa.vy *= -1;
      mariposa.x = Math.max(0.2, Math.min(0.8, mariposa.x)); mariposa.y = Math.max(0.45, Math.min(0.88, mariposa.y));
      const x = mariposa.x * W, y = mariposa.y * H, a = Math.abs(Math.sin(reloj * 12)) * 5 + 1.5;
      ctx.fillStyle = '#5bc3e8';
      ctx.beginPath(); ctx.ellipse(x - a * 0.7, y, a, 3.2, -0.4, 0, 7); ctx.ellipse(x + a * 0.7, y, a, 3.2, 0.4, 0, 7); ctx.fill();
      ctx.fillStyle = '#10202a'; ctx.fillRect(x - 0.5, y - 3, 1, 6);
      zonas.unshift({ que: 'mariposa', x, y, r: 16 });
    }
    if (mariposa.aplastada && era <= 3) {
      ctx.fillStyle = '#5bc3e8aa';
      ctx.fillRect(mariposa.aplastada.x * W - 4, mariposa.aplastada.y * H, 8, 2);
    }
    if (!mariposa.viva && j.vuelta.estado.tBucle < 5) { mariposa = { x: 0.3, y: 0.55, vx: 0.04, vy: 0, viva: true, aplastada: null }; }
    // coche plateado a 142 km/h (era 7+)
    if (era >= 7) {
      if (coche.t < 0 && reloj > coche.prox) coche.t = 0;
      if (coche.t >= 0) {
        coche.t += dt;
        const x = -60 + coche.t * W * 0.55, y = horizonte + H * 0.05;
        ctx.fillStyle = '#ff7a2e';
        ctx.fillRect(x - 200, y - 1, 170, 2); ctx.fillRect(x - 200, y + 6, 170, 2);
        ctx.fillStyle = '#c9ccd2';
        ctx.fillRect(x - 28, y - 9, 56, 12);
        ctx.fillRect(x - 14, y - 16, 26, 8);
        ctx.fillStyle = '#5c6067'; ctx.fillRect(x - 20, y + 2, 8, 6); ctx.fillRect(x + 12, y + 2, 8, 6);
        zonas.unshift({ que: 'coche', x, y: y - 5, r: 34 });
        if (x > W + 240) { coche.t = -1; coche.prox = reloj + 140 + Math.random() * 120; }
      }
    }
    // cabina azul (era 6+): aparece de vez en cuando unos segundos
    if (era >= 6) {
      if (reloj > cabina.prox && reloj > cabina.hasta) {
        if (Math.random() < 0.4) { cabina.hasta = reloj + 18; cabina.x = 0.18 + Math.random() * 0.2; }
        cabina.prox = reloj + 200;
      }
      if (reloj < cabina.hasta) {
        const x = cabina.x * W, y = horizonte + H * 0.1, u = Math.max(6, H * 0.025);
        const a = Math.min(1, (cabina.hasta - reloj) / 2, (reloj - (cabina.hasta - 18)) / 2);
        ctx.globalAlpha = Math.max(0, a) * (0.75 + Math.sin(reloj * 4) * 0.25);
        ctx.fillStyle = '#1f3f8f'; ctx.fillRect(x - u, y - u * 3.2, u * 2, u * 3.2);
        ctx.fillRect(x - u * 1.15, y - u * 3.4, u * 2.3, u * 0.35);
        ctx.fillStyle = '#d8e4ff'; ctx.fillRect(x - u * 0.6, y - u * 2.7, u * 0.5, u * 0.5); ctx.fillRect(x + u * 0.1, y - u * 2.7, u * 0.5, u * 0.5);
        ctx.fillStyle = '#fff6c8'; ctx.fillRect(x - 1.5, y - u * 3.9, 3, u * 0.5);
        ctx.globalAlpha = 1;
        zonas.unshift({ que: 'cabina', x, y: y - u * 1.6, r: u * 2.6 });
      }
    }
    // chispas de avivar
    for (const c of chispas) { c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 120 * dt; c.v -= dt * 1.4; }
    for (let i = chispas.length - 1; i >= 0; i--) if (chispas[i].v <= 0) chispas.splice(i, 1);
    ctx.fillStyle = '#ffd27a';
    for (const c of chispas) { ctx.globalAlpha = Math.max(0, c.v); ctx.fillRect(Math.round(c.x), Math.round(c.y), 2, 2); }
    ctx.globalAlpha = 1;
  }

  function cuadro(ahora) {
    requestAnimationFrame(cuadro);
    const dt = Math.min(0.1, (ahora - ultimo) / 1000);
    ultimo = ahora;
    acum += dt;
    if (acum < 1 / 30) return; // ~30 fps
    const paso = acum; acum = 0;
    reloj += paso;
    pasoActual = paso;
    if (document.hidden || !W) return;
    zonas.length = 0;
    const era = j.vuelta.era, pal = paleta(era, tema()), sol = faseSol();
    cielo(pal, sol);
    colinas(pal, sol);
    suelo(pal, sol);
    poblado(pal, sol);
    hoguera(pal, sol);
    pueblo.dibujar(ctx, datosPueblo(pal, sol), 'frente');
    bichos(paso, sol);
    if (destello > 0) { ctx.fillStyle = `rgba(246,238,255,${destello})`; ctx.fillRect(0, 0, W, H); destello -= paso * 0.8; }
    // la Paradoja alta hace temblar un poco el horizonte
    if (j.vuelta.paradoja >= 70 && Math.random() < 0.04) {
      const y = Math.random() * H;
      ctx.drawImage(lienzo, 0, y * dpr, W * dpr, 6 * dpr, 4, y, W, 6);
    }
  }
  requestAnimationFrame(cuadro);

  return {
    destellar() { destello = 1; },
    flotante(contenedor, x, y, texto) {
      const e = document.createElement('div');
      e.className = 'flotante';
      e.textContent = texto;
      e.style.left = `${x - 10}px`; e.style.top = `${y - 24}px`;
      contenedor.append(e);
      setTimeout(() => e.remove(), 1000);
    },
  };
}
