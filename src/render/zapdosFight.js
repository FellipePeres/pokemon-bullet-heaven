import { getSheet } from './assets.js';
import { drawPokemon } from './sprites.js';
import { glowCircle, banner, hash } from './legendaryFight.js';
import { CONFIG } from '../core/config.js';
import { getEnemy } from '../data/enemies.js';

const TAU = Math.PI * 2;
const SCALE = CONFIG.render.pixelScale;
const clamp01 = (t) => Math.max(0, Math.min(1, t));
const easeOut = (t) => 1 - Math.pow(1 - clamp01(t), 3);

/**
 * O DESENHO DA LUTA DO ZAPDOS (H-6, systems/zapdosFight.js), por cima do molde
 * (render/legendaryFight.js):
 * - embaixo de todos: a máquina do emblema vermelho (o desenho em pixel do
 *   tools/assets/hub.py), o Zapdos acorrentado nela nos primeiros 45 s, as correntes,
 *   a sobrecarga e, depois, a máquina destruída com as correntes partidas;
 * - a energia sugada (o refino do Fellipe): enquanto ele está preso, as bolhas de luz descem
 *   pelas correntes até a máquina, e ondas saem das bobinas para o alto, para longe;
 * - por cima: a carga e a esfera do Zap Cannon, os choques dela, a faixa da Investida
 *   e o rastro, as explosões e os elos voando;
 * - na tela: o letreiro da tempestade total.
 * Só lê o estado.
 */

/** Onde as correntes se prendem: os anéis das bobinas e os lados do console (px do mundo). */
export function anchors(m) {
  return [
    { x: m.x - 64 + 8 * SCALE, y: m.y - 48 + 2 * SCALE, to: [-26, 4] },
    { x: m.x - 64 + 55 * SCALE, y: m.y - 48 + 2 * SCALE, to: [26, 4] },
    { x: m.x - 64 + 20 * SCALE, y: m.y - 48 + 20 * SCALE, to: [-12, 30] },
    { x: m.x - 64 + 43 * SCALE, y: m.y - 48 + 20 * SCALE, to: [12, 30] }
  ];
}

/** Uma corrente de elos de (ax, ay) a (bx, by), caindo um pouco no meio; `heat` acende os elos. */
export function chain(ctx, ax, ay, bx, by, heat, now) {
  const len = Math.hypot(bx - ax, by - ay);
  const n = Math.max(3, Math.round(len / 11));
  const sag = Math.min(26, len * 0.12);
  ctx.lineWidth = 3;
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const x = ax + (bx - ax) * k;
    const y = ay + (by - ay) * k + Math.sin(k * Math.PI) * sag;
    const a = Math.atan2(by - ay, bx - ax) + (i % 2 ? Math.PI / 2 : 0);
    const glow = heat > 0 ? 0.5 + 0.5 * Math.sin(now * 14 + i) : 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.strokeStyle = '#1a1a24';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(0, 0, 6, 3.5, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = heat > 0 ? `rgb(${170 + 85 * heat * glow},${170 + 40 * heat},${180 - 120 * heat})` : '#aab0c2';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(0, 0, 6, 3.5, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  }
}

/** Um choque curto e torto de (x, y) a (tx, ty). */
function arc(ctx, x, y, tx, ty, seed, width, alpha) {
  const pts = [[x, y]];
  const n = 6;
  for (let i = 1; i < n; i++) {
    const k = i / n;
    const nx = -(ty - y), ny = tx - x, nl = Math.hypot(nx, ny) || 1;
    const off = (hash(seed, i) - 0.5) * 34;
    pts.push([x + (tx - x) * k + (nx / nl) * off, y + (ty - y) * k + (ny / nl) * off]);
  }
  pts.push([tx, ty]);
  const path = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const [px, py] of pts.slice(1)) ctx.lineTo(px, py); ctx.stroke(); };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = `rgba(255,214,60,${0.5 * alpha})`; ctx.lineWidth = width * 3; path();
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`; ctx.lineWidth = width; path();
}

/* ------------------------------------------------------------------ embaixo de todos */

export function drawZapdosGround(ctx, run, fight) {
  const m = fight.machine;
  const now = run.time;
  const sheet = getSheet(m.broken ? 'npc/maquina_zapdos_quebrada' : 'npc/maquina_zapdos');
  const perch = fight.perch;
  const boss = run.spawner.boss;
  const chained = !fight.snapped;

  // a luz das bobinas no chão (mais forte na sobrecarga); na quebrada, a fumaça
  if (!m.broken) glowCircle(ctx, m.x, m.y, 150 + 60 * m.overload, `rgba(255,${220 - 120 * m.overload},90,${0.18 + 0.3 * m.overload})`);
  if (sheet) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet.img, Math.round(m.x - 32 * SCALE), Math.round(m.y - 24 * SCALE), 64 * SCALE, 48 * SCALE);
    ctx.restore();
  } else {
    ctx.fillStyle = '#5c6070';
    ctx.fillRect(m.x - 64, m.y - 48, 128, 96);
  }
  // o emblema acendendo na sobrecarga
  if (!m.broken && m.overload > 0) glowCircle(ctx, m.x, m.y + 10, 40, `rgba(255,40,30,${0.5 * m.overload * (0.6 + 0.4 * Math.sin(now * 20))})`);

  if (chained) {
    // preso: antes de ele entrar em campo, o desenho dele aqui; depois, o do chefe (o Renderer)
    const struggle = Math.sin(now * 2.3) * 3 + (m.overload > 0 ? Math.sin(now * 31) * 3 * m.overload : 0);
    if (!boss) {
      const data = getEnemy('zapdos_boss');
      drawPokemon(ctx, 145, perch.x + struggle * 0.4, perch.y + struggle, 42 * data.scale, { facing: 1, types: data.types, time: now });
    }
    const bx = boss ? boss.x : perch.x + struggle * 0.4, by = boss ? boss.y : perch.y + struggle;
    for (const a of anchors(m)) chain(ctx, a.x, a.y, bx + a.to[0], by + a.to[1], m.overload, now);
    drain(ctx, m, bx, by, now);
    // os choques presos: faíscas saindo dele de tempos em tempos
    const tick = Math.floor(now * 6);
    if (hash(tick, 1) < 0.5 + 0.5 * m.overload) {
      const a = hash(tick, 2) * TAU;
      arc(ctx, bx, by, bx + Math.cos(a) * 70, by + Math.sin(a) * 50, tick, 2, 0.8);
    }
    if (m.overload > 0 && hash(tick, 3) < m.overload) {
      // a sobrecarga: o arco entre as duas bobinas
      const [l, r] = anchors(m);
      arc(ctx, l.x, l.y, r.x, r.y, tick + 7, 3, 0.9);
    }
    return;
  }
  // a máquina destruída: os pedaços de corrente no chão e as faíscas que sobraram
  const [l] = anchors(m);
  chain(ctx, l.x, l.y, l.x + 6, l.y + 60, 0, now);
  chain(ctx, m.x - 30, m.y + 60, m.x + 20, m.y + 70, 0, now);
  chain(ctx, m.x + 50, m.y + 50, m.x + 90, m.y + 80, 0, now);
  const tick = Math.floor(now * 4);
  if (hash(tick, 5) < 0.35) {
    const x = m.x + (hash(tick, 6) - 0.5) * 100, y = m.y + (hash(tick, 7) - 0.5) * 60;
    arc(ctx, x, y, x + 18, y - 14, tick, 1.5, 0.9);
  }
  for (let i = 0; i < 3; i++) {
    const ph = (now * 0.35 + i / 3) % 1;
    ctx.fillStyle = `rgba(60,60,70,${0.35 * (1 - ph)})`;
    ctx.beginPath(); ctx.arc(m.x + 40 + Math.sin(i * 3 + now) * 8, m.y - 10 - ph * 120, 10 + ph * 22, 0, TAU); ctx.fill();
  }
}

/**
 * A energia sugada: bolhas de luz amarela descem pelas correntes, do Zapdos até a máquina, e
 * das duas bobinas sobem ondas em arco, para o alto, mandando a energia para longe.
 */
function drain(ctx, m, bx, by, now) {
  for (const [i, a] of anchors(m).entries()) {
    const sx = bx + a.to[0], sy = by + a.to[1];
    const len = Math.hypot(a.x - sx, a.y - sy);
    const sag = Math.min(26, len * 0.12);
    for (let j = 0; j < 3; j++) {
      const k = (now * 0.9 + j / 3 + i * 0.17) % 1;
      const x = sx + (a.x - sx) * k;
      const y = sy + (a.y - sy) * k + Math.sin(k * Math.PI) * sag;
      glowCircle(ctx, x, y, 12, 'rgba(255,236,120,.75)');
      ctx.fillStyle = '#fffbe0';
      ctx.beginPath(); ctx.arc(x, y, 2.5, 0, TAU); ctx.fill();
    }
  }
  const [l, r] = anchors(m);
  for (const top of [l, r]) {
    for (let j = 0; j < 3; j++) {
      const k = (now * 0.6 + j / 3) % 1;
      ctx.strokeStyle = `rgba(255,${200 - 120 * k},90,${0.7 * (1 - k)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(top.x, top.y - 6 - 150 * k, 14 + 46 * k, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
  }
}

/* ------------------------------------------------------------------ por cima */

export function drawZapdosWorld(ctx, run, fight) {
  const now = run.time;
  const boss = fight.boss;

  // a carga do Zap Cannon: a esfera crescendo nele e a mira até o treinador
  if (fight.state === 'cannon' && boss) {
    const k = clamp01(fight.t / fight.cfg.cannonCharge);
    const p = run.player;
    ctx.save();
    ctx.setLineDash([14, 10]);
    ctx.lineDashOffset = -now * 120;
    ctx.strokeStyle = `rgba(255,220,80,${0.3 + 0.5 * k})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(boss.x, boss.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    ctx.restore();
    glowCircle(ctx, boss.x, boss.y - 10, 60 + 90 * k, `rgba(255,236,120,${0.3 + 0.4 * k})`);
    for (let i = 0; i < 4; i++) {
      const a = now * 9 + (i * TAU) / 4;
      arc(ctx, boss.x, boss.y - 10, boss.x + Math.cos(a) * (40 + 40 * k), boss.y - 10 + Math.sin(a) * (30 + 30 * k), Math.floor(now * 30) + i, 2, 0.9);
    }
  }

  // a faixa da Investida (acendendo) e o rastro dele cruzando
  const pk = fight.peck;
  if (pk) {
    const ang = Math.atan2(pk.y1 - pk.y0, pk.x1 - pk.x0);
    const len = Math.hypot(pk.x1 - pk.x0, pk.y1 - pk.y0);
    ctx.save();
    ctx.translate(pk.x0, pk.y0);
    ctx.rotate(ang);
    if (pk.phase === 'aim') {
      const k = clamp01(fight.t / pk.warn);
      const pulse = 0.5 + 0.5 * Math.sin(now * 18);
      ctx.fillStyle = `rgba(255,${190 - 80 * k},60,${0.12 + 0.22 * k})`;
      ctx.fillRect(0, -pk.w / 2, len, pk.w);
      ctx.strokeStyle = `rgba(255,236,140,${0.55 + 0.45 * pulse})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(0, -pk.w / 2, len, pk.w);
      // as setas correndo pela faixa
      ctx.strokeStyle = `rgba(255,250,210,${0.5 + 0.4 * k})`;
      ctx.lineWidth = 5;
      for (let x = (now * 420) % 90; x < len; x += 90) {
        ctx.beginPath(); ctx.moveTo(x - 16, -22); ctx.lineTo(x + 8, 0); ctx.lineTo(x - 16, 22); ctx.stroke();
      }
      // o quanto falta: a faixa enche do Zapdos para a frente
      ctx.fillStyle = 'rgba(255,240,150,.18)';
      ctx.fillRect(0, -pk.w / 2, len * k, pk.w);
    } else if (boss) {
      const done = Math.hypot(boss.x - pk.x0, boss.y - pk.y0);
      const g = ctx.createLinearGradient(0, 0, done, 0);
      g.addColorStop(0, 'rgba(255,230,90,0)');
      g.addColorStop(1, 'rgba(255,250,200,.75)');
      ctx.fillStyle = g;
      ctx.fillRect(0, -pk.w * 0.35, done, pk.w * 0.7);
    }
    ctx.restore();
  }

  // a esfera do Zap Cannon atravessando a arena
  const o = fight.orb;
  if (o) {
    glowCircle(ctx, o.x, o.y, 110, 'rgba(255,230,110,.45)');
    ctx.fillStyle = '#1c1830';
    ctx.beginPath(); ctx.arc(o.x, o.y, 36, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffe066';
    ctx.beginPath(); ctx.arc(o.x, o.y, 32, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff8d8';
    ctx.beginPath(); ctx.arc(o.x - 6, o.y - 6, 18, 0, TAU); ctx.fill();
    const tick = Math.floor(now * 24);
    for (let i = 0; i < 5; i++) {
      const a = hash(tick, i) * TAU;
      arc(ctx, o.x, o.y, o.x + Math.cos(a) * 64, o.y + Math.sin(a) * 64, tick * 7 + i, 2, 0.9);
    }
    // a trilha atrás dela
    for (let i = 1; i <= 5; i++) {
      ctx.fillStyle = `rgba(255,230,110,${0.25 - i * 0.04})`;
      ctx.beginPath(); ctx.arc(o.x - o.vx * i * 0.05, o.y - o.vy * i * 0.05, 30 - i * 4, 0, TAU); ctx.fill();
    }
  }

  for (const f of fight.fx) {
    if (f.kind === 'zap') arc(ctx, f.x, f.y, f.tx, f.ty, f.seed, 2.5, 1 - f.t / f.life);
    else if (f.kind === 'blast') blast(ctx, f);
    else if (f.kind === 'chainsnap') chainSnap(ctx, f, now);
  }
}

/** A explosão elétrica: o clarão, o anel que se abre e os raios curtos em volta. */
function blast(ctx, f) {
  const k = f.t / f.life;
  glowCircle(ctx, f.x, f.y, f.r * (0.6 + 0.8 * k), `rgba(255,240,170,${0.7 * (1 - k)})`);
  ctx.strokeStyle = `rgba(255,224,90,${1 - k})`;
  ctx.lineWidth = 10 * (1 - k) + 2;
  ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * easeOut(k * 1.2), f.r * 0.55 * easeOut(k * 1.2), 0, 0, TAU); ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + f.x;
    const d = f.r * (0.4 + 0.7 * k);
    arc(ctx, f.x, f.y, f.x + Math.cos(a) * d, f.y + Math.sin(a) * d * 0.6, i * 13 + Math.floor(f.t * 20), 2, 1 - k);
  }
}

/** As correntes arrebentando: os elos voando para os lados e caindo. */
export function chainSnap(ctx, f) {
  const k = f.t / f.life;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + hash(f.seed, i);
    const sp = 180 + hash(f.seed, i + 20) * 260;
    const x = f.x + Math.cos(a) * sp * f.t;
    const y = f.y + Math.sin(a) * sp * f.t * 0.7 + 420 * f.t * f.t;
    ctx.save();
    ctx.globalAlpha = 1 - k;
    ctx.translate(x, y);
    ctx.rotate(f.t * 12 + i);
    ctx.strokeStyle = '#1a1a24'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(0, 0, 7, 4, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#ffe9a0'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(0, 0, 7, 4, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  }
}

/** O aviso da explosão (a esfera do Zap Cannon, o mergulho de volta): o círculo laranja que se fecha. */
export function blastWarning(ctx, h) {
  const k = clamp01(h.t / h.warn);
  const pulse = 0.5 + 0.5 * Math.sin(h.t * 16);
  ctx.fillStyle = `rgba(255,170,50,${0.1 + 0.2 * k})`;
  ctx.strokeStyle = `rgba(255,220,110,${0.55 + 0.45 * pulse})`;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r, h.r * 0.55, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.setLineDash([10, 8]);
  ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r * (1 - k * 0.85), h.r * 0.55 * (1 - k * 0.85), 0, 0, TAU); ctx.stroke();
  ctx.setLineDash([]);
}

/** O anel do Discharge: o contorno escuro, o corpo amarelo e o raio branco torto por dentro. */
export function dischargeRing(ctx, ring, now) {
  const k = ring.r / ring.max;
  const w = ring.width * (1 - 0.35 * k);
  ctx.save();
  ctx.globalAlpha = 1 - k * 0.55;
  ctx.lineWidth = w + 8;
  ctx.strokeStyle = 'rgba(40,30,10,.7)';
  ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r, 0, TAU); ctx.stroke();
  ctx.lineWidth = w;
  ctx.strokeStyle = '#ffd23f';
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffffff';
  ctx.beginPath();
  const n = 56, tick = Math.floor(now * 24);
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    const r = ring.r + (hash(tick, i % n) - 0.5) * w * 0.8;
    const x = ring.x + Math.cos(a) * r, y = ring.y + Math.sin(a) * r;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

/* ------------------------------------------------------------------ na tela */

export function drawZapdosScreen(ctx, run, renderer, fight) {
  const W = renderer.width;
  if (fight.sky && fight.sky.phase !== 'up') {
    banner(ctx, W / 2, 150, fight.sky.phase === 'down' ? 'Ele vai mergulhar! Saia do círculo!' : 'TEMPESTADE!  Fique onde o raio acabou de cair', '#ffe066', 26);
  } else if (!fight.snapped && fight.machine.overload > 0) {
    banner(ctx, W / 2, 150, 'A máquina está sobrecarregando!', '#ffb46a', 24);
  }
}

