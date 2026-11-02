// El poblado: casas con detalle por era, campos, talleres, humo y gente que camina.
// Todo con rellenos planos (sin sombras ni blur). La luz del sol da un canto claro a cada
// volumen por el lado del que viene, y de noche las ventanas y las antorchas se encienden.

export const mezcla = (a, b, t) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  t = Math.max(0, Math.min(1, t));
  const c = (s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1)}`;
};
export const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const PIEL = ['#c99a6e', '#8d5a3b', '#e0b48a', '#5e3b26', '#a8744c'];
const ROPA = {
  1: ['#7a5636', '#6b4a2c', '#8b6a44', '#5c4330'],
  2: ['#9b7a4c', '#7d6a52', '#a0643a', '#6f5a3c'],
  hierro: ['#7a2e26', '#4a4f58', '#8a6a3a', '#3b3f46'],
  rio: ['#2f6a78', '#c08a3a', '#7a4a6a', '#e0d2b0'],
  estrellas: ['#34477a', '#d8d0bc', '#5a4a7a', '#2c5f6a'],
  6: ['#3b4a63', '#5b5f66', '#7a3d3d', '#2f5b4f', '#c8b48a'],
  8: ['#4d3f7a', '#d8d0f0', '#2f2a44', '#8a6fd0'],
};
const TECHO = { 1: '#8a6a48', 2: '#b08e55', hierro: '#4a4f58', rio: '#9c4a2f', estrellas: '#3f5670', ninguno: '#7a5a3a', 6: '#6b6a66', 8: '#4b4466' };

export function crearPoblado() {
  const gente = [];
  const humo = [];
  let ultimaEra = 0;

  return {
    // fase 'fondo': casas, campos y la gente que está detrás de la hoguera; 'frente': el resto.
    dibujar(ctx, e, fase) {
      const { W, H, horizonte, pal, sol, j, dt, reloj } = e;
      const era = j.vuelta.era, camino = j.vuelta.camino;
      const luz = sol.luz, noche = 1 - luz;
      const sombra = (c, k = 1) => mezcla('#000000', c, Math.min(1, (0.32 + 0.68 * luz) * k));
      const lado = sol.dia ? (sol.p < 0.5 ? -1 : 1) : 0; // de qué lado viene el sol
      const canto = (c) => mezcla(c, pal.cieloD[0], 0.35 * luz);
      const tono = (c) => mezcla(c, pal.casa, 0.3); // armoniza con el estilo visual
      const yFuego = horizonte + H * 0.15;

      let pob = 0;
      for (const id of Object.keys(j.datos.generadores)) pob += j.cuantos(id);

      if (fase === 'fondo') {
        if (era !== ultimaEra) { ultimaEra = era; gente.length = 0; }
        campos(ctx, e, era, sombra, j);
        const casas = casasDe(e, era, pob);
        for (const c of casas) casa(ctx, e, c, { era, camino, sombra, lado, canto, tono, noche, humo, j });
        // humo
        for (const h of humo) { h.y -= h.vy * dt; h.x += h.vx * dt; h.r += dt * 2.2; h.v -= dt * 0.28; }
        for (let i = humo.length - 1; i >= 0; i--) if (humo[i].v <= 0) humo.splice(i, 1);
        for (const h of humo) {
          ctx.globalAlpha = Math.max(0, h.v) * (noche > 0.5 ? 0.14 : 0.32);
          ctx.fillStyle = noche > 0.5 ? '#3a3640' : '#d9d2c4';
          ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, 7); ctx.fill();
        }
        ctx.globalAlpha = 1;
        moverGente(e, era, pob, dt);
      }
      // gente caminando, por profundidad
      const ropa = ROPA[era <= 1 ? 1 : era <= 3 ? 2 : era <= 5 ? camino ?? 2 : era >= 8 ? 8 : 6];
      for (const p of gente) {
        const y = horizonte + H * p.yf;
        if ((fase === 'fondo') !== (y < yFuego)) continue;
        persona(ctx, e, p, p.x * W, y, { era, ropa, sombra, tono, noche, reloj });
      }
      if (fase === 'frente') sentados(ctx, e, era, pob, ropa, sombra, tono);
    },
  };

  // ---------- casas ----------
  function casasDe({ W, H, horizonte }, era, pob) {
    const n = Math.min(34, Math.round(Math.log2(1 + pob) * 3.2));
    const fila = [];
    for (let i = 0; i < n; i++) {
      const izq = i % 2 === 0;
      const d = 0.08 + (Math.floor(i / 2) / 17) * 0.36 + hash(i) * 0.03;
      const x = W * (0.5 + (izq ? -1 : 1) * d);
      if (era >= 2 && x > W * 0.74) continue; // el río
      if (x < W * 0.04) continue;
      const prof = hash(i + 50);
      fila.push({ i, x, y: horizonte + 3 + prof * H * 0.065, s: 0.72 + prof * 0.5 });
    }
    return fila.sort((a, b) => a.y - b.y);
  }

  function casa(ctx, e, { i, x, y, s }, o) {
    const { H, pal, dt, reloj } = e;
    const { era, camino, sombra, lado, canto, tono, noche, j } = o;
    const u = Math.max(7, H * 0.032) * s;
    const muro = sombra(tono(mezcla(pal.colinas[0], '#c8b08a', era <= 3 ? 0.25 : 0.4)));
    const techoBase = TECHO[era === 1 ? 1 : era <= 3 ? 2 : era <= 5 ? camino ?? 'ninguno' : era >= 8 ? 8 : 6];
    const techo = sombra(tono(techoBase));
    const oscuro = sombra(pal.casa, 0.7);
    const ventana = (vx, vy, w, h, k = i) => {
      if (noche > 0.35 && hash(k * 1.7) < 0.8) ctx.fillStyle = pal.luz;
      else ctx.fillStyle = mezcla(oscuro, e.pal.cieloD[1], 0.25 * e.sol.luz);
      ctx.fillRect(Math.round(vx), Math.round(vy), Math.max(2, Math.round(w)), Math.max(2, Math.round(h)));
    };
    const echarHumo = (hx, hy) => {
      if (humo.length < 60 && Math.random() < dt * 0.9) humo.push({ x: hx, y: hy, vx: 3 + Math.random() * 4, vy: 9 + Math.random() * 6, r: u * 0.18, v: 1 });
    };

    if (era === 1) { // tienda de pieles con dos palos cruzados
      ctx.fillStyle = techo;
      ctx.beginPath(); ctx.moveTo(x - u, y); ctx.lineTo(x, y - u * 1.45); ctx.lineTo(x + u, y); ctx.fill();
      if (lado) { ctx.fillStyle = canto(techo); ctx.beginPath(); ctx.moveTo(x, y - u * 1.45); ctx.lineTo(x + lado * u, y); ctx.lineTo(x + lado * u * 0.35, y); ctx.fill(); }
      ctx.strokeStyle = oscuro; ctx.lineWidth = Math.max(1, u * 0.1);
      ctx.beginPath(); ctx.moveTo(x - u * 0.25, y - u * 1.75); ctx.lineTo(x + u * 0.12, y - u * 1.2); ctx.moveTo(x + u * 0.25, y - u * 1.75); ctx.lineTo(x - u * 0.12, y - u * 1.2); ctx.stroke();
      ctx.fillStyle = noche > 0.4 && i % 3 === 0 ? mezcla(oscuro, pal.luz, 0.55) : oscuro;
      ctx.beginPath(); ctx.moveTo(x - u * 0.28, y); ctx.lineTo(x, y - u * 0.62); ctx.lineTo(x + u * 0.28, y); ctx.fill();
      if (i % 4 === 1) echarHumo(x, y - u * 1.6);
    } else if (era <= 3) { // choza de adobe con techo de paja
      const w = u * 0.95, h = u * 0.85;
      ctx.fillStyle = muro; ctx.fillRect(x - w, y - h, w * 2, h);
      if (lado) { ctx.fillStyle = canto(muro); ctx.fillRect(lado < 0 ? x - w : x + w * 0.6, y - h, w * 0.4, h); }
      ctx.fillStyle = techo;
      ctx.beginPath(); ctx.moveTo(x - w * 1.3, y - h + 1); ctx.quadraticCurveTo(x - w * 0.3, y - h - u * 0.6, x, y - h - u * 1.15);
      ctx.quadraticCurveTo(x + w * 0.3, y - h - u * 0.6, x + w * 1.3, y - h + 1); ctx.fill();
      ctx.strokeStyle = sombra(mezcla(techoBase, '#000000', 0.35)); ctx.lineWidth = 1;
      ctx.beginPath();
      for (const k of [-0.6, 0, 0.6]) { ctx.moveTo(x + k * w * 1.1, y - h + 1); ctx.lineTo(x + k * w * 0.35, y - h - u * 0.75); }
      ctx.stroke();
      ctx.fillStyle = oscuro; ctx.fillRect(Math.round(x - u * 0.2), Math.round(y - h * 0.62), Math.round(u * 0.4), Math.round(h * 0.62));
      if (i % 2) ventana(x + w * 0.45, y - h * 0.7, u * 0.28, u * 0.24);
      if (i % 5 === 2) echarHumo(x + w * 0.2, y - h - u * 1.1);
    } else if (era <= 5) { // casa con tejado a dos aguas y chimenea
      const w = u * (1 + hash(i + 4) * 0.3), h = u * (1 + (i % 3) * 0.32);
      const cx = x + (i % 2 ? w * 0.5 : -w * 0.5);
      ctx.fillStyle = techo; ctx.fillRect(cx - u * 0.15, y - h - u * 0.95, u * 0.3, u * 0.6);
      ctx.fillStyle = muro; ctx.fillRect(x - w, y - h, w * 2, h);
      if (lado) { ctx.fillStyle = canto(muro); ctx.fillRect(lado < 0 ? x - w : x + w * 0.65, y - h, w * 0.35, h); }
      ctx.fillStyle = techo;
      ctx.beginPath(); ctx.moveTo(x - w * 1.18, y - h + 1); ctx.lineTo(x, y - h - u * 0.85); ctx.lineTo(x + w * 1.18, y - h + 1); ctx.fill();
      if (lado) { ctx.fillStyle = canto(techo); ctx.beginPath(); ctx.moveTo(x, y - h - u * 0.85); ctx.lineTo(x + lado * w * 1.18, y - h + 1); ctx.lineTo(x + lado * w * 0.55, y - h + 1); ctx.fill(); }
      ctx.fillStyle = oscuro; ctx.fillRect(Math.round(x - u * 0.18), Math.round(y - u * 0.62), Math.round(u * 0.36), Math.round(u * 0.62));
      ventana(x - w * 0.7, y - h * 0.72, u * 0.3, u * 0.28, i);
      ventana(x + w * 0.42, y - h * 0.72, u * 0.3, u * 0.28, i + 9);
      if (h > u * 1.4) { ventana(x - w * 0.7, y - h + u * 0.25, u * 0.3, u * 0.28, i + 3); ventana(x + w * 0.42, y - h + u * 0.25, u * 0.3, u * 0.28, i + 5); }
      if (i % 3 === 0) echarHumo(cx, y - h - u * 1);
      // tenderete de mercado delante de alguna casa (río) o yunque con chispas (hierro)
      if (camino === 'rio' && i % 4 === 1) {
        const tx = x + w * 1.4;
        ctx.fillStyle = sombra(tono('#d8c9a0')); ctx.fillRect(tx - u * 0.6, y - u * 0.9, u * 1.2, u * 0.18);
        ctx.fillStyle = sombra(tono('#a8432f'));
        for (let k = 0; k < 3; k++) ctx.fillRect(tx - u * 0.6 + k * u * 0.4, y - u * 0.9, u * 0.2, u * 0.18);
        ctx.fillStyle = oscuro; ctx.fillRect(tx - u * 0.55, y - u * 0.72, u * 0.08, u * 0.72); ctx.fillRect(tx + u * 0.47, y - u * 0.72, u * 0.08, u * 0.72);
        ctx.fillStyle = sombra(tono('#c79a4a')); ctx.fillRect(tx - u * 0.45, y - u * 0.35, u * 0.9, u * 0.12);
      }
      if (camino === 'hierro' && i % 4 === 3 && Math.sin(reloj * 6 + i) > 0.6) {
        ctx.fillStyle = '#ffcf6a';
        for (let k = 0; k < 4; k++) ctx.fillRect(Math.round(x + w * 1.3 + hash(reloj * 10 + k) * u * 0.6), Math.round(y - u * 0.3 - hash(reloj * 7 + k) * u * 0.6), 2, 2);
      }
      if (camino === 'estrellas' && i % 5 === 4) { // telescopio en la azotea
        ctx.strokeStyle = oscuro; ctx.lineWidth = Math.max(1.5, u * 0.14);
        ctx.beginPath(); ctx.moveTo(x - u * 0.2, y - h - u * 0.5); ctx.lineTo(x + u * 0.5, y - h - u * 1.2); ctx.stroke();
      }
    } else { // edificios
      const alto = u * (1.6 + hash(i + 3) * 2.2 * (era >= 7 ? 1.5 : 1));
      const ancho = u * (1.1 + hash(i + 9) * 0.6);
      if (era === 7 && i % 7 === 3) { // torre de refrigeración con vapor
        ctx.fillStyle = sombra(tono('#8b8f94'));
        ctx.beginPath(); ctx.moveTo(x - u * 1.5, y); ctx.quadraticCurveTo(x - u * 0.6, y - u * 2, x - u, y - u * 3.4);
        ctx.lineTo(x + u, y - u * 3.4); ctx.quadraticCurveTo(x + u * 0.6, y - u * 2, x + u * 1.5, y); ctx.fill();
        if (humo.length < 60 && Math.random() < dt * 3) humo.push({ x: x + (Math.random() - 0.5) * u, y: y - u * 3.4, vx: 4, vy: 14, r: u * 0.5, v: 1 });
        return;
      }
      ctx.fillStyle = muro; ctx.fillRect(Math.round(x - ancho), Math.round(y - alto), Math.round(ancho * 2), Math.round(alto));
      if (lado) { ctx.fillStyle = canto(muro); ctx.fillRect(Math.round(lado < 0 ? x - ancho : x + ancho * 0.7), Math.round(y - alto), Math.round(ancho * 0.3), Math.round(alto)); }
      ctx.fillStyle = techo; ctx.fillRect(Math.round(x - ancho - 1), Math.round(y - alto - 2), Math.round(ancho * 2 + 2), 3);
      // azotea: antena o depósito
      ctx.fillStyle = techo;
      if (hash(i + 21) < 0.35) { ctx.fillRect(Math.round(x + ancho * 0.3), Math.round(y - alto - u * 0.9), 1.5, u * 0.9); if (noche > 0.4 && Math.sin(reloj * 3 + i) > 0) { ctx.fillStyle = '#ff5a4a'; ctx.fillRect(Math.round(x + ancho * 0.3) - 1, Math.round(y - alto - u * 0.95), 3, 3); } }
      else if (hash(i + 21) < 0.6) { ctx.fillRect(Math.round(x - ancho * 0.6), Math.round(y - alto - u * 0.5), u * 0.6, u * 0.5); }
      const paso = Math.max(4, Math.round(u * 0.42));
      for (let wy = y - alto + paso * 0.7; wy < y - paso * 0.8; wy += paso) {
        for (let wx = x - ancho + paso * 0.5; wx < x + ancho - paso * 0.6; wx += paso) {
          const k = Math.round(wx * 3.1 + wy * 7.7);
          if (noche > 0.3 ? hash(k) < 0.55 * noche : hash(k) < 0.7) {
            ctx.fillStyle = noche > 0.3 ? (era >= 8 && hash(k + 1) < 0.3 ? '#b49cff' : pal.luz) : mezcla(oscuro, pal.cieloD[1], 0.3 * e.sol.luz);
            ctx.fillRect(Math.round(wx), Math.round(wy), 2, 2);
          }
        }
      }
      ctx.fillStyle = oscuro; ctx.fillRect(Math.round(x - u * 0.2), Math.round(y - u * 0.5), Math.round(u * 0.4), Math.round(u * 0.5));
      if (era >= 8 && i % 3 === 0) { ctx.fillStyle = `rgba(180,156,255,${0.5 + Math.sin(reloj * 2 + i) * 0.3})`; ctx.fillRect(Math.round(x - ancho), Math.round(y - alto * 0.5), Math.round(ancho * 2), 2); }
    }
  }

  // ---------- campos de trigo y talleres ----------
  function campos(ctx, e, era, sombra, j) {
    const { W, H, horizonte, reloj } = e;
    const n = era >= 2 ? Math.min(5, Math.ceil(Math.log2(1 + j.cuantos('campo')))) : 0;
    if (!n) return;
    // trigo verde que madura y vuelve a brotar (al ritmo del río si estás en ese camino)
    const madurez = 0.5 + 0.5 * Math.sin(reloj / 30);
    const trigo = sombra(mezcla('#6f8a3a', '#d6b25a', madurez));
    const surco = sombra(mezcla('#4a3a22', '#7a6038', madurez));
    const sitios = [[0.6, 0.012], [0.68, 0.03], [0.07, 0.03], [0.6, 0.05], [0.16, 0.012]];
    for (let k = 0; k < n; k++) {
      const [fx, fy] = sitios[k];
      const x = W * fx, y = horizonte + H * fy, w = W * 0.085, h = H * 0.022;
      ctx.fillStyle = trigo;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w + h, y + h); ctx.lineTo(x + h, y + h); ctx.fill();
      ctx.strokeStyle = surco; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let r = 1; r < 4; r++) { const yy = y + (h * r) / 4; ctx.moveTo(x + (h * r) / 4, yy); ctx.lineTo(x + w + (h * r) / 4, yy); }
      ctx.stroke();
    }
    // horno de alfarero con la boca encendida
    if (era >= 2 && era <= 5 && j.cuantos('alfar') > 0) {
      const x = W * 0.27, y = horizonte + H * 0.075, u = Math.max(7, H * 0.03);
      ctx.fillStyle = sombra(mezcla('#8a5a3a', '#b07a50', 0.4));
      ctx.beginPath(); ctx.arc(x, y, u * 1.1, Math.PI, 0); ctx.fill();
      ctx.fillStyle = `rgba(255,${120 + Math.round(Math.sin(reloj * 5) * 30)},50,0.95)`;
      ctx.beginPath(); ctx.arc(x, y, u * 0.38, Math.PI, 0); ctx.fill();
    }
  }

  // ---------- gente ----------
  function moverGente({ W, sol }, era, pob, dt) {
    const quiere = Math.min(30, Math.round(Math.log2(1 + pob) * 3));
    while (gente.length < quiere) {
      const k = gente.length;
      gente.push({ k, x: 0.1 + hash(k + 3) * 0.6, yf: 0.045 + hash(k + 8) * 0.19, objetivo: 0.1 + hash(k + 13) * 0.6, pausa: hash(k) * 3,
        v: 0.025 + hash(k + 5) * 0.03, fase: hash(k + 1) * 6, carga: hash(k + 2) });
    }
    if (gente.length > quiere) gente.length = quiere;
    const lento = sol.luz < 0.25 ? 0.5 : 1;
    for (const p of gente) {
      if (p.pausa > 0) { p.pausa -= dt; p.anda = false; continue; }
      const d = p.objetivo - p.x;
      if (Math.abs(d) < 0.006) {
        p.pausa = 0.8 + Math.random() * 3.5;
        // de noche, la mitad se arrima a la hoguera
        p.objetivo = sol.luz < 0.25 && p.k % 2 ? 0.44 + Math.random() * 0.12 : 0.06 + Math.random() * 0.66;
        continue;
      }
      p.anda = true;
      p.dir = Math.sign(d);
      p.x += p.dir * Math.min(Math.abs(d), p.v * lento * dt);
      p.fase += dt * 9 * lento;
    }
    gente.sort((a, b) => a.yf - b.yf);
  }

  function persona(ctx, e, p, x, y, { era, ropa, sombra, tono, noche }) {
    const { H } = e;
    const k = 0.75 + (p.yf - 0.045) * 2.6;
    const u = Math.max(5, H * 0.024) * k;
    const piel = sombra(PIEL[p.k % PIEL.length]);
    const tela = sombra(tono(ropa[p.k % ropa.length]));
    const paso = p.anda ? Math.sin(p.fase) * u * 0.28 : 0;
    ctx.strokeStyle = sombra(tono(ropa[(p.k + 1) % ropa.length]), 0.7);
    ctx.lineWidth = Math.max(1.2, u * 0.16); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y - u * 0.55); ctx.lineTo(x - paso, y); ctx.moveTo(x, y - u * 0.55); ctx.lineTo(x + paso, y); ctx.stroke();
    ctx.fillStyle = tela;
    ctx.beginPath(); ctx.roundRect(x - u * 0.24, y - u * 1.28, u * 0.48, u * 0.8, u * 0.14); ctx.fill();
    // brazo que se balancea
    ctx.strokeStyle = tela;
    ctx.beginPath(); ctx.moveTo(x, y - u * 1.15); ctx.lineTo(x + (p.anda ? -paso * 0.8 : 0) + (p.dir ?? 1) * u * 0.08, y - u * 0.62); ctx.stroke();
    ctx.fillStyle = piel;
    ctx.beginPath(); ctx.arc(x, y - u * 1.47, u * 0.21, 0, 7); ctx.fill();
    // lo que llevan encima, según la era
    const d = p.dir ?? 1;
    if (era <= 3) {
      if (p.carga < 0.35) { ctx.fillStyle = sombra('#9a7a4a'); ctx.beginPath(); ctx.arc(x - d * u * 0.3, y - u * 0.85, u * 0.22, 0, Math.PI); ctx.fill(); ctx.fillStyle = sombra('#8a2d4a'); ctx.fillRect(x - d * u * 0.3 - u * 0.12, y - u * 0.9, u * 0.24, u * 0.08); }
      else if (p.carga < 0.55) { ctx.strokeStyle = sombra('#6b5236'); ctx.lineWidth = Math.max(1, u * 0.08); ctx.beginPath(); ctx.moveTo(x + d * u * 0.25, y - u * 0.3); ctx.lineTo(x + d * u * 0.45, y - u * 2); ctx.stroke(); }
    } else if (era <= 5) {
      if (p.carga < 0.3) { ctx.fillStyle = sombra(tono('#b08e55')); ctx.fillRect(x - d * u * 0.45 - u * 0.15, y - u * 1.65, u * 0.3, u * 0.3); }
      if (p.carga > 0.8) { ctx.fillStyle = sombra(tono('#3b3028')); ctx.fillRect(x - u * 0.24, y - u * 1.72, u * 0.48, u * 0.1); ctx.fillRect(x - u * 0.15, y - u * 1.85, u * 0.3, u * 0.15); }
    } else if (p.carga < 0.3) {
      ctx.fillStyle = sombra(tono('#3a2a20')); ctx.fillRect(x + d * u * 0.15, y - u * 0.6, u * 0.32, u * 0.24);
    }
    // antorchas de noche (antes de la electricidad)
    if (era < 6 && noche > 0.5 && p.k % 3 === 0) {
      const tx = x + d * u * 0.35, ty = y - u * 1.7;
      ctx.fillStyle = 'rgba(255,170,80,0.09)'; ctx.beginPath(); ctx.arc(tx, ty, u * 0.75, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,190,100,0.14)'; ctx.beginPath(); ctx.arc(tx, ty, u * 0.38, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffd98a'; ctx.beginPath(); ctx.ellipse(tx, ty - u * 0.05, u * 0.09, u * 0.17, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#4a3020'; ctx.lineWidth = Math.max(1, u * 0.08); ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx - d * u * 0.1, ty + u * 0.6); ctx.stroke();
    }
  }

  // Alrededor de la hoguera: más gente sentada cuanto más grande es la tribu. La cara que mira al
  // fuego se ilumina de noche.
  function sentados(ctx, e, era, pob, ropa, sombra, tono) {
    const { W, H, horizonte, sol, reloj } = e;
    const x0 = W / 2, y0 = horizonte + H * 0.15, u = Math.max(6, H * 0.026);
    const n = Math.min(8, 2 + Math.floor(Math.log2(1 + pob)));
    const noche = 1 - sol.luz;
    const sitios = [-2.6, 2.6, -3.5, 3.5, -1.8, 1.9, -4.3, 4.3];
    for (let k = 0; k < n; k++) {
      const dx = sitios[k], x = x0 + dx * u, y = y0 + (Math.abs(dx) > 3 ? -u * 0.35 : u * 0.15);
      const hacia = -Math.sign(dx);
      const tela = sombra(tono(ropa[k % ropa.length]));
      const bob = Math.sin(reloj * 1.3 + k) * u * 0.04;
      ctx.fillStyle = tela;
      ctx.beginPath(); ctx.roundRect(x - u * 0.28, y - u * 0.95 + bob, u * 0.56, u * 0.75, u * 0.18); ctx.fill();
      ctx.fillRect(x - u * 0.1 + hacia * u * 0.1, y - u * 0.3, u * 0.55 * hacia, u * 0.22); // piernas dobladas hacia el fuego
      const piel = PIEL[(k + 2) % PIEL.length];
      ctx.fillStyle = sombra(piel);
      ctx.beginPath(); ctx.arc(x, y - u * 1.15 + bob, u * 0.22, 0, 7); ctx.fill();
      if (noche > 0.3) { // reflejo del fuego
        ctx.fillStyle = `rgba(255,170,90,${0.6 * noche})`;
        ctx.beginPath(); ctx.arc(x, y - u * 1.15 + bob, u * 0.22, hacia > 0 ? -Math.PI / 2 : Math.PI / 2, hacia > 0 ? Math.PI / 2 : Math.PI * 1.5); ctx.fill();
        ctx.fillRect(hacia > 0 ? x + u * 0.1 : x - u * 0.27, y - u * 0.9 + bob, u * 0.17, u * 0.6);
      }
    }
  }
}
