/**
 * O DESENHO DOS GOLPES EXCLUSIVOS DOS LENDÁRIOS (systems/signatureMoves.js).
 *
 * Diferente dos outros golpes, que usam os sprites do FireRed, estes são
 * desenhados em código, com gradientes, partículas e várias fases: o golpe tem
 * de parecer um evento. Sem luz somada ('lighter'): no gramado claro do FireRed
 * ela lavava tudo para branco. As cores são saturadas e cada traço claro tem um
 * contorno escuro por baixo, como na pixel art. Nada aqui muda a lógica: só lê
 * os campos que o sistema atualiza.
 */

const TAU = Math.PI * 2;
const easeOut = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const clamp01 = (t) => Math.min(1, Math.max(0, t));

export function drawSignatures(ctx, run) {
  for (const sig of run.signatures) {
    if (sig.dead) continue;
    const draw = DRAW[sig.kind];
    if (!draw) continue;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    draw(ctx, sig);
    ctx.restore();
  }
}

/* ------------------------------------------------------------------ apoio */

function glow(ctx, x, y, r, stops) {
  if (r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

/** Traço com contorno: escuro e largo por baixo, a cor por cima, o brilho no meio. */
function outlined(ctx, width, dark, color, core = null) {
  ctx.lineWidth = width + 3;
  ctx.strokeStyle = dark;
  ctx.stroke();
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
  if (core) {
    ctx.lineWidth = Math.max(1, width * 0.35);
    ctx.strokeStyle = core;
    ctx.stroke();
  }
}

function outlinedRing(ctx, x, y, r, width, dark, color, core = null) {
  if (r <= 0 || width <= 0) return;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  outlined(ctx, width, dark, color, core);
}

/** Linha em zigue-zague (raio), diferente a cada quadro. */
function bolt(ctx, x1, y1, x2, y2, jitter, segments) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let k = 1; k < segments; k++) {
    const j = (Math.random() - 0.5) * jitter;
    ctx.lineTo(x1 + (dx * k) / segments - (dy / len) * j, y1 + (dy * k) / segments + (dx / len) * j);
  }
  ctx.lineTo(x2, y2);
}

/** Losango (cristal de gelo), com contorno. */
function diamond(ctx, x, y, size, angle) {
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(angle) * size * 1.8, y + Math.sin(angle) * size * 1.8);
  ctx.lineTo(x + Math.cos(angle + Math.PI / 2) * size * 0.7, y + Math.sin(angle + Math.PI / 2) * size * 0.7);
  ctx.lineTo(x - Math.cos(angle) * size * 1.8, y - Math.sin(angle) * size * 1.8);
  ctx.lineTo(x - Math.cos(angle + Math.PI / 2) * size * 0.7, y - Math.sin(angle + Math.PI / 2) * size * 0.7);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
}

/** Estrela de quatro pontas (brilho), com contorno. */
function sparkle(ctx, x, y, size, angle) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = angle + (Math.PI / 4) * i;
    const r = i % 2 ? size * 0.3 : size;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
}

/** O floco de neve de seis braços, com galhos e a ponta em losango. */
function snowflake(ctx, x, y, R, rotation, alpha) {
  if (alpha <= 0 || R <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (TAU * i) / 6;
    const ca = Math.cos(a), sa = Math.sin(a);
    ctx.moveTo(0, 0);
    ctx.lineTo(ca * R, sa * R);
    for (const [at, len] of [[0.42, 0.3], [0.68, 0.22], [0.86, 0.12]]) {
      const bx = ca * R * at, by = sa * R * at;
      for (const side of [-1, 1]) {
        const b = a + side * (Math.PI / 3);
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + Math.cos(b) * R * len, by + Math.sin(b) * R * len);
      }
    }
  }
  outlined(ctx, Math.max(2.5, R * 0.05), '#1f5fa8', '#8fe2ff', '#ffffff');
  // pontas de cristal
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1f5fa8';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    const a = (TAU * i) / 6;
    diamond(ctx, Math.cos(a) * R, Math.sin(a) * R, Math.max(2.5, R * 0.06), a);
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ os golpes */

const DRAW = {
  /* Articuno — Sheer Cold: o domínio do frio, o floco que cresce e o anel de gelo. */
  sheer_cold(ctx, sig) {
    const { x, y, maxRadius: max, seed } = sig;
    const t = sig.age;

    if (t < sig.charge) {
      const p = t / sig.charge;
      // o domínio: o círculo do alcance, girando, avisa onde o gelo vai chegar
      ctx.globalAlpha = 0.25 + 0.5 * p;
      ctx.setLineDash([12, 9]);
      ctx.lineDashOffset = -t * 80;
      ctx.beginPath();
      ctx.arc(x, y, max, 0, TAU);
      outlined(ctx, 2, 'rgba(20,70,150,0.6)', '#9fe6ff');
      ctx.setLineDash([]);
      // o frio entrando: cristais correndo para o centro
      ctx.fillStyle = '#eefbff';
      ctx.strokeStyle = '#2a78c8';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 20; i++) {
        const a = seed + (TAU * i) / 20 + p * 0.6;
        const d = max * (1 - p) * (0.55 + 0.45 * ((i * 7) % 10) / 10) + 18;
        ctx.globalAlpha = 0.4 + 0.6 * p;
        diamond(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, 3 + p * 2, a);
      }
      ctx.globalAlpha = 1;
      glow(ctx, x, y, 30 + 60 * p, [[0, `rgba(255,255,255,${0.8 * p})`], [0.45, `rgba(90,190,255,${0.45 * p})`], [1, 'rgba(40,120,220,0)']]);
      snowflake(ctx, x, y, 16 + 58 * easeOut(p), seed + t * 2.4, 0.5 + 0.5 * p);
      return;
    }

    const bt = t - sig.charge;
    const r = sig.radius;
    const fade = sig.endAge != null ? clamp01(1 - (t - sig.endAge) / sig.fade) : 1;

    // a geada no chão, dentro do anel
    const frost = ctx.createRadialGradient(x, y, 0, x, y, Math.max(1, r));
    frost.addColorStop(0, 'rgba(200,245,255,0)');
    frost.addColorStop(0.7, `rgba(140,215,255,${0.22 * fade})`);
    frost.addColorStop(1, `rgba(215,245,255,${0.55 * fade})`);
    ctx.fillStyle = frost;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();

    // o anel: banda azul com contorno escuro e o fio branco
    ctx.globalAlpha = fade;
    outlinedRing(ctx, x, y, r, 11, 'rgba(25,80,160,0.9)', '#6fcaff', '#ffffff');
    // espinhos de gelo saindo do anel
    ctx.fillStyle = '#eefbff';
    ctx.strokeStyle = '#1f5fa8';
    ctx.lineWidth = 2;
    for (let i = 0; i < 30; i++) {
      const a = seed + (TAU * i) / 30;
      const len = (14 + (i % 3) * 9) * (0.6 + 0.4 * fade);
      const w = 0.045;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a - w) * (r - 4), y + Math.sin(a - w) * (r - 4));
      ctx.lineTo(x + Math.cos(a) * (r + len), y + Math.sin(a) * (r + len));
      ctx.lineTo(x + Math.cos(a + w) * (r - 4), y + Math.sin(a + w) * (r - 4));
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    }
    // estilhaços voando à frente do anel
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#2a78c8';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 16; i++) {
      const a = seed * 1.7 + (TAU * i) / 16;
      const d = r * 1.06 + (i % 4) * 6;
      diamond(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, 3, a + bt * 9);
    }
    ctx.globalAlpha = 1;
    // o floco do centro se abre e some
    const open = clamp01(1 - bt * 4);
    glow(ctx, x, y, 90, [[0, `rgba(255,255,255,${0.85 * open})`], [0.5, `rgba(90,190,255,${0.4 * open})`], [1, 'rgba(40,120,220,0)']]);
    snowflake(ctx, x, y, 74 + bt * 300, seed + t * 2.4 + bt * 2, clamp01(1 - bt * 2.4));
  },

  /* Zapdos — Zap Cannon: a esfera com órbitas, faíscas, os raios e a explosão. */
  zap_cannon(ctx, sig) {
    // os raios da descarga, da esfera até cada alvo
    for (const arc of sig.arcs) {
      ctx.globalAlpha = arc.life / arc.maxLife;
      bolt(ctx, arc.x1, arc.y1, arc.x2, arc.y2, 22, 7);
      outlined(ctx, 4, '#7a4a00', '#ffd21a', '#ffffff');
      glow(ctx, arc.x2, arc.y2, 20, [[0, '#fffbe0'], [0.4, 'rgba(255,210,30,0.8)'], [1, 'rgba(255,170,0,0)']]);
    }
    ctx.globalAlpha = 1;

    if (sig.explodeAt != null) {
      const e = clamp01((sig.age - sig.explodeAt) / 0.5);
      const R = sig.area * 0.8 * easeOut(e);
      glow(ctx, sig.x, sig.y, sig.size * 3.4 * (1 - e) + 14,
           [[0, `rgba(255,255,255,${1 - e})`], [0.4, `rgba(255,214,30,${0.85 * (1 - e)})`], [1, 'rgba(255,160,0,0)']]);
      ctx.globalAlpha = 1 - e;
      ctx.fillStyle = 'rgba(255,220,60,0.18)';
      ctx.beginPath();
      ctx.arc(sig.x, sig.y, R, 0, TAU);
      ctx.fill();
      outlinedRing(ctx, sig.x, sig.y, R, 10 * (1 - e) + 3, '#7a4a00', '#ffd21a', '#ffffff');
      for (let i = 0; i < 9; i++) {
        const a = sig.seed + (TAU * i) / 9;
        bolt(ctx, sig.x, sig.y, sig.x + Math.cos(a) * R, sig.y + Math.sin(a) * R, 26, 6);
        outlined(ctx, 3 * (1 - e) + 1.5, '#7a4a00', '#ffe14a');
      }
      return;
    }

    // rastro
    sig.trail.forEach((p, i) => {
      const k = (i + 1) / sig.trail.length;
      glow(ctx, p.x, p.y, sig.size * (0.5 + 0.9 * k), [[0, `rgba(255,214,30,${0.35 * k})`], [1, 'rgba(255,170,0,0)']]);
    });

    const pulse = 1 + Math.sin(sig.age * 32) * 0.12;
    const S = sig.size * pulse;
    // o halo e a esfera: contorno escuro, amarelo e o núcleo branco
    glow(ctx, sig.x, sig.y, S * 2.4, [[0, 'rgba(255,214,30,0.55)'], [0.5, 'rgba(255,190,0,0.3)'], [1, 'rgba(255,150,0,0)']]);
    ctx.fillStyle = '#7a4a00';
    ctx.beginPath();
    ctx.arc(sig.x, sig.y, S + 2, 0, TAU);
    ctx.fill();
    glow(ctx, sig.x, sig.y, S, [[0, '#ffffff'], [0.35, '#fff7b0'], [0.75, '#ffd21a'], [1, '#f0a000']]);
    // órbitas, como um átomo de trovão
    for (let k = 0; k < 3; k++) {
      ctx.save();
      ctx.translate(sig.x, sig.y);
      ctx.rotate(sig.age * (3 + k) + (k * Math.PI) / 3);
      ctx.beginPath();
      ctx.ellipse(0, 0, S * 1.75, S * 0.55, 0, 0, TAU);
      outlined(ctx, 2, 'rgba(122,74,0,0.8)', k % 2 ? '#ffffff' : '#ffe14a');
      ctx.restore();
    }
    // faíscas soltas em volta
    for (let i = 0; i < 4; i++) {
      const a = Math.random() * TAU;
      bolt(ctx, sig.x + Math.cos(a) * S * 0.6, sig.y + Math.sin(a) * S * 0.6,
           sig.x + Math.cos(a) * S * 2.3, sig.y + Math.sin(a) * S * 2.3, 10, 3);
      outlined(ctx, 1.5, 'rgba(122,74,0,0.8)', '#fff3a0');
    }
  },

  /* Moltres — Sacred Fire: as asas, as penas com rastro de fogo e as colunas de chamas. */
  sacred_fire(ctx, sig) {
    // as asas de fogo se abrindo no Moltres
    if (sig.age < 0.55) {
      const w = sig.age / 0.55;
      const ox = sig.owner?.x ?? sig.x, oy = sig.owner?.y ?? sig.y;
      glow(ctx, ox, oy, 60 + 50 * w, [[0, `rgba(255,220,120,${0.75 * (1 - w)})`], [0.5, `rgba(255,110,20,${0.4 * (1 - w)})`], [1, 'rgba(220,40,0,0)']]);
      ctx.globalAlpha = 1 - w;
      for (const side of [-1, 1]) {
        for (let k = 0; k < 7; k++) {
          const a = -Math.PI / 2 + side * (0.45 + k * 0.2 + w * 0.25);
          const len = 34 + k * 7 + w * 40;
          const mx = ox + Math.cos(a - side * 0.25) * len * 0.55, my = oy + Math.sin(a - side * 0.25) * len * 0.55 - 6;
          ctx.beginPath();
          ctx.moveTo(ox, oy - 4);
          ctx.quadraticCurveTo(mx, my, ox + Math.cos(a) * len, oy + Math.sin(a) * len);
          outlined(ctx, 6 - k * 0.5, '#8a1a00', k % 2 ? '#ffb020' : '#ff5a10', k % 2 ? '#fff0a0' : null);
        }
      }
      ctx.globalAlpha = 1;
    }

    // as penas, com o rastro de fogo
    for (const f of sig.feathers) {
      if (f.done) continue;
      const tr = f.trail;
      for (let i = 1; i < tr.length; i++) {
        const k = i / tr.length;
        ctx.beginPath();
        ctx.moveTo(tr[i - 1].x, tr[i - 1].y);
        ctx.lineTo(tr[i].x, tr[i].y);
        ctx.strokeStyle = `rgba(150,20,0,${0.4 * k})`;
        ctx.lineWidth = sig.size * 1.5 * k + 3;
        ctx.stroke();
        ctx.strokeStyle = `rgba(255,${Math.round(60 + 140 * k)},${Math.round(10 + 40 * k)},${0.35 + 0.65 * k})`;
        ctx.lineWidth = sig.size * 1.5 * k;
        ctx.stroke();
      }
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.angle + Math.PI / 2);   // a espiral curva: a pena aponta para onde vai
      const z = sig.size;
      for (const [rx, ry, dx, color] of [[1.8 * z + 2, 0.75 * z + 2, 0, '#8a1a00'], [1.8 * z, 0.75 * z, 0, '#ff5a10'],
                                         [1.25 * z, 0.5 * z, 0.2 * z, '#ffb020'], [0.8 * z, 0.3 * z, 0.4 * z, '#fff3b0']]) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(dx, 0, rx, ry, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    // as colunas de fogo
    for (const p of sig.pillars) {
      const e = (sig.age - p.born) / p.life;
      if (e < 0 || e > 1) continue;
      const h = 120 * easeOut(e * 3);
      const w = sig.area * 0.42 * (1 - e * 0.5);
      const fade = 1 - e * e * e;   // fica forte até perto do fim (esmaecer cedo deixava marrom)
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(1, 0.42);
      glow(ctx, 0, 0, sig.area * 0.95, [[0, `rgba(255,200,80,${0.75 * fade})`], [0.45, `rgba(240,80,10,${0.5 * fade})`], [1, 'rgba(160,20,0,0)']]);
      ctx.restore();
      const col = ctx.createLinearGradient(p.x, p.y, p.x, p.y - h);
      col.addColorStop(0, `rgba(255,245,190,${0.95 * fade})`);
      col.addColorStop(0.25, `rgba(255,170,30,${0.92 * fade})`);
      col.addColorStop(0.65, `rgba(240,70,10,${0.75 * fade})`);
      col.addColorStop(1, 'rgba(150,20,0,0)');
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(p.x - w, p.y);
      for (let k = 0; k <= 8; k++) {
        const ww = w * (1 - k / 9) + Math.sin(sig.age * 26 + k * 1.3 + p.x) * 4;
        ctx.lineTo(p.x - ww, p.y - (h * k) / 8);
      }
      for (let k = 8; k >= 0; k--) {
        const ww = w * (1 - k / 9) + Math.sin(sig.age * 23 + k * 1.7 + p.y) * 4;
        ctx.lineTo(p.x + ww, p.y - (h * k) / 8);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = `rgba(200,40,0,${0.6 * fade})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      // brasas subindo
      ctx.fillStyle = `rgba(255,190,40,${fade})`;
      for (let i = 0; i < 6; i++) {
        const yy = p.y - ((e * 160 + i * 23) % (h + 20));
        const xx = p.x + Math.sin(i * 2.1 + sig.age * 5) * w * 0.8;
        ctx.fillRect(xx - 1.5, yy - 1.5, 3, 3);
      }
    }
  },

  /* Mewtwo — Psystrike: o feixe, a singularidade com anéis girando e a implosão. */
  psystrike(ctx, sig) {
    const { x, y, area, seed } = sig;

    if (sig.implodeAt == null) {
      const p = clamp01(sig.age / sig.duration);
      // o feixe do Mewtwo até o ponto, no começo
      if (sig.age < 0.28) {
        const b = 1 - sig.age / 0.28;
        ctx.globalAlpha = b;
        ctx.beginPath();
        ctx.moveTo(sig.fromX, sig.fromY);
        ctx.lineTo(x, y);
        outlined(ctx, 8 * b + 3, '#3a0060', '#b050ff', '#ffe0ff');
        ctx.globalAlpha = 1;
      }
      // o campo
      ctx.fillStyle = `rgba(170,70,240,${0.1 + 0.12 * p})`;
      ctx.beginPath();
      ctx.arc(x, y, area, 0, TAU);
      ctx.fill();
      // o núcleo escuro
      const core = 16 + 26 * p;
      glow(ctx, x, y, core * 1.6, [[0, 'rgba(8,0,20,0.95)'], [0.6, 'rgba(50,0,80,0.85)'], [1, 'rgba(60,0,90,0)']]);
      // anéis girando em sentidos opostos, fechando
      const colors = ['#b040ff', '#ff40c0', '#7a5cff'];
      [1, 0.7, 0.44].forEach((k, i) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((i % 2 ? -1 : 1) * sig.age * (2.4 + i));
        ctx.setLineDash([22 - i * 4, 12]);
        ctx.globalAlpha = 0.7 + 0.3 * p;
        outlinedRing(ctx, 0, 0, area * k * (1 - p * 0.45), 3.5, 'rgba(40,0,70,0.8)', colors[i], '#ffe0ff');
        ctx.restore();
      });
      // riscos correndo para o centro
      ctx.strokeStyle = '#c050ff';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 24; i++) {
        const a = seed + i * 2.39996;
        const d = area * (1 - ((p * 1.8 + i * 0.137) % 1)) + core;
        ctx.globalAlpha = clamp01(d / area);
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
        ctx.lineTo(x + Math.cos(a) * (d - 26), y + Math.sin(a) * (d - 26));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // a borda do núcleo brilha
      outlinedRing(ctx, x, y, core, 3, 'rgba(40,0,70,0.9)',
                   `rgba(255,110,240,${0.6 + 0.4 * Math.sin(sig.age * 30) ** 2})`, '#ffffff');
      return;
    }

    // a implosão
    const e = clamp01((sig.age - sig.implodeAt) / 0.6);
    glow(ctx, x, y, 30 + area * 0.6 * e,
         [[0, `rgba(255,255,255,${clamp01(1 - e * 2)})`], [0.4, `rgba(190,80,255,${0.6 * (1 - e)})`], [1, 'rgba(120,20,200,0)']]);
    const R = area * 1.15 * easeOut(e);
    ctx.globalAlpha = 1 - e;
    ctx.fillStyle = 'rgba(170,70,240,0.14)';
    ctx.beginPath();
    ctx.arc(x, y, R, 0, TAU);
    ctx.fill();
    outlinedRing(ctx, x, y, R, 14 * (1 - e) + 3, 'rgba(50,0,90,0.85)', '#b040ff', '#ffe6ff');
    outlinedRing(ctx, x, y, R * 0.72, 6 * (1 - e) + 2, 'rgba(70,0,60,0.8)', '#ff40c0');
    for (let i = 0; i < 18; i++) {
      const a = seed + (TAU * i) / 18;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * R * 0.55, y + Math.sin(a) * R * 0.55);
      ctx.lineTo(x + Math.cos(a) * R * 0.95, y + Math.sin(a) * R * 0.95);
      outlined(ctx, 2.5, 'rgba(50,0,90,0.7)', '#e090ff');
    }
  },

  /* Mew — Metronome: bolhas iridescentes e o estouro em arco-íris. */
  metronome(ctx, sig) {
    for (const [i, b] of sig.bubbles.entries()) {
      if (b.popped) continue;
      const r = sig.size * (1 + 0.07 * Math.sin(sig.age * 9 + i));
      // o corpo: claro no meio, a borda forte na cor do golpe sorteado
      const body = ctx.createRadialGradient(b.x - r * 0.3, b.y - r * 0.3, r * 0.1, b.x, b.y, r);
      body.addColorStop(0, 'rgba(255,255,255,0.3)');
      body.addColorStop(0.65, `hsla(${b.hue},95%,65%,0.4)`);
      body.addColorStop(0.9, `hsla(${b.hue},100%,55%,0.95)`);
      body.addColorStop(1, `hsla(${b.hue},90%,45%,0.95)`);
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = `hsla(${b.hue},80%,22%,0.9)`;
      ctx.lineWidth = 2;
      ctx.stroke();
      // o brilho de arco-íris girando por dentro da borda
      ctx.lineWidth = 3;
      for (let k = 0; k < 3; k++) {
        const start = sig.age * 3 + i + (TAU * k) / 3;
        ctx.strokeStyle = `hsl(${(b.hue + 120 * k + sig.age * 160) % 360},100%,62%)`;
        ctx.beginPath();
        ctx.arc(b.x, b.y, r * 0.8, start, start + 1.1);
        ctx.stroke();
      }
      // o reflexo
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.ellipse(b.x - r * 0.38, b.y - r * 0.42, r * 0.26, r * 0.14, -0.7, 0, TAU);
      ctx.fill();
    }

    for (const pop of sig.pops) {
      const e = clamp01(pop.age / 0.55);
      const R = sig.area * easeOut(e);
      glow(ctx, pop.x, pop.y, 20 + 34 * (1 - e),
           [[0, `rgba(255,255,255,${1 - e})`], [0.4, `hsla(${pop.hue},100%,60%,${0.7 * (1 - e)})`], [1, `hsla(${pop.hue},100%,50%,0)`]]);
      // o anel de arco-íris: seis faixas de cor, com contorno escuro
      ctx.globalAlpha = 1 - e;
      const width = 8 * (1 - e) + 2;
      ctx.beginPath();
      ctx.arc(pop.x, pop.y, R, 0, TAU);
      ctx.lineWidth = width + 3;
      ctx.strokeStyle = 'rgba(40,20,60,0.7)';
      ctx.stroke();
      ctx.lineWidth = width;
      for (let k = 0; k < 6; k++) {
        ctx.strokeStyle = `hsl(${(pop.hue + k * 60) % 360},100%,58%)`;
        ctx.beginPath();
        ctx.arc(pop.x, pop.y, R, (TAU * k) / 6 + e, (TAU * (k + 1)) / 6 + e);
        ctx.stroke();
      }
      ctx.lineWidth = 1.5;
      for (let k = 0; k < 8; k++) {
        const a = (TAU * k) / 8 + pop.hue;
        ctx.fillStyle = `hsl(${(pop.hue + k * 45) % 360},100%,85%)`;
        ctx.strokeStyle = `hsla(${(pop.hue + k * 45) % 360},90%,28%,0.9)`;
        sparkle(ctx, pop.x + Math.cos(a) * R * 1.12, pop.y + Math.sin(a) * R * 1.12, 8 * (1 - e) + 3, e * 4);
      }
      ctx.globalAlpha = 1;
    }
  }
};
