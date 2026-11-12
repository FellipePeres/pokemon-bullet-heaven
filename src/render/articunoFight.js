import { getSheet } from './assets.js';
import { drawPokemon } from './sprites.js';
import { glowCircle, banner, hash } from './legendaryFight.js';
import { anchors, chain, chainSnap } from './zapdosFight.js';
import { CONFIG } from '../core/config.js';
import { getEnemy } from '../data/enemies.js';

const TAU = Math.PI * 2;
const SCALE = CONFIG.render.pixelScale;
const clamp01 = (t) => Math.max(0, Math.min(1, t));
const easeOut = (t) => 1 - Math.pow(1 - clamp01(t), 3);

/**
 * O DESENHO DA LUTA DO ARTICUNO (H-7, systems/articunoFight.js), por cima do molde
 * (render/legendaryFight.js), com o desenho da maquete aprovada ("Seafoam: as ondas"):
 * - embaixo de todos: o gelo no chão (os rastros do Raio de Gelo e as placas da Nevasca), a
 *   máquina do emblema vermelho coberta de gelo, o Articuno acorrentado nela nos primeiros 45 s,
 *   a energia sugada em azul e, depois, a máquina destruída;
 * - por cima dos Pokémon e embaixo dos avisos: a névoa (só se vê perto do treinador; lá fora, a
 *   horda vira sombra) e a geada do Frio Absoluto, com o olho da nevasca e o caminho dele (mais
 *   rala em volta do treinador, para ele se ver fora do olho);
 * - por cima: a mira e o raio do Raio de Gelo, o cone e a rajada da Nevasca, o gelo estilhaçando;
 * - na tela: a neve caindo e os letreiros.
 * Só lê o estado.
 */

/* ------------------------------------------------------------------ embaixo de todos */

export function drawArticunoGround(ctx, run, fight) {
  const now = run.time;
  // o gelo no chão: a faixa do Raio de Gelo e as placas da Nevasca, sumindo no fim
  for (const i of fight.ice) {
    const fade = Math.min(1, (i.life - i.t) / 1.2) * Math.min(1, i.t / 0.15);
    if (i.x0 != null) iceLine(ctx, i, fade);
    else icePatch(ctx, i, fade, now);
  }

  const m = fight.machine;
  const sheet = getSheet(m.broken ? 'npc/maquina_articuno_quebrada' : 'npc/maquina_articuno');
  const perch = fight.perch;
  const boss = run.spawner.boss;
  const chained = !fight.snapped;

  // o frio que sai das bobinas (mais forte na sobrecarga)
  if (!m.broken) glowCircle(ctx, m.x, m.y, 150 + 60 * m.overload, `rgba(150,215,255,${0.16 + 0.3 * m.overload})`);
  if (sheet) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet.img, Math.round(m.x - 32 * SCALE), Math.round(m.y - 24 * SCALE), 64 * SCALE, 48 * SCALE);
    ctx.restore();
  } else {
    ctx.fillStyle = '#7d8aa0';
    ctx.fillRect(m.x - 64, m.y - 48, 128, 96);
  }
  if (!m.broken && m.overload > 0) glowCircle(ctx, m.x, m.y + 10, 40, `rgba(255,40,30,${0.5 * m.overload * (0.6 + 0.4 * Math.sin(now * 20))})`);

  if (chained) {
    const struggle = Math.sin(now * 2.1) * 3 + (m.overload > 0 ? Math.sin(now * 31) * 3 * m.overload : 0);
    if (!boss) {
      const data = getEnemy('articuno_boss');
      drawPokemon(ctx, 144, perch.x + struggle * 0.4, perch.y + struggle, 42 * data.scale, { facing: 1, types: data.types, time: now });
    }
    const bx = boss ? boss.x : perch.x + struggle * 0.4, by = boss ? boss.y : perch.y + struggle;
    for (const a of anchors(m)) chain(ctx, a.x, a.y, bx + a.to[0], by + a.to[1], m.overload, now);
    drain(ctx, m, bx, by, now);
    return;
  }
  // a máquina destruída: os pedaços de corrente no chão e a névoa fria subindo
  const [l] = anchors(m);
  chain(ctx, l.x, l.y, l.x + 6, l.y + 60, 0, now);
  chain(ctx, m.x - 30, m.y + 60, m.x + 20, m.y + 70, 0, now);
  chain(ctx, m.x + 50, m.y + 50, m.x + 90, m.y + 80, 0, now);
  for (let i = 0; i < 3; i++) {
    const ph = (now * 0.3 + i / 3) % 1;
    ctx.fillStyle = `rgba(220,238,255,${0.3 * (1 - ph)})`;
    ctx.beginPath(); ctx.arc(m.x - 30 + i * 30 + Math.sin(i * 3 + now) * 8, m.y - 10 - ph * 110, 12 + ph * 22, 0, TAU); ctx.fill();
  }
}

/** A faixa de gelo do Raio de Gelo: branca, com a borda azul e brilhos. */
function iceLine(ctx, i, fade) {
  ctx.save();
  ctx.globalAlpha = 0.85 * fade;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#e8f6ff';
  ctx.lineWidth = i.w;
  ctx.beginPath(); ctx.moveTo(i.x0, i.y0); ctx.lineTo(i.x1, i.y1); ctx.stroke();
  ctx.strokeStyle = 'rgba(150,205,240,.9)';
  ctx.lineWidth = 3;
  const nx = -(i.y1 - i.y0), ny = i.x1 - i.x0, nl = Math.hypot(nx, ny) || 1;
  for (const side of [-1, 1]) {
    const ox = (nx / nl) * side * i.w * 0.42, oy = (ny / nl) * side * i.w * 0.42;
    ctx.beginPath(); ctx.moveTo(i.x0 + ox, i.y0 + oy); ctx.lineTo(i.x1 + ox, i.y1 + oy); ctx.stroke();
  }
  ctx.restore();
}

/** A placa de gelo da Nevasca: uma elipse branca com a borda azul e umas rachaduras. */
function icePatch(ctx, i, fade, now) {
  ctx.save();
  ctx.globalAlpha = 0.8 * fade;
  ctx.fillStyle = '#e4f3ff';
  ctx.beginPath(); ctx.ellipse(i.x, i.y, i.r, i.r * 0.6, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(140,200,240,.95)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.lineWidth = 1.5;
  for (let k = 0; k < 4; k++) {
    const a = hash(i.x, k) * TAU;
    ctx.beginPath(); ctx.moveTo(i.x, i.y); ctx.lineTo(i.x + Math.cos(a) * i.r * 0.7, i.y + Math.sin(a) * i.r * 0.42); ctx.stroke();
  }
  const tw = 0.5 + 0.5 * Math.sin(now * 5 + i.x);
  ctx.fillStyle = `rgba(255,255,255,${0.8 * tw})`;
  ctx.fillRect(i.x - i.r * 0.4, i.y - i.r * 0.2, 4, 4);
  ctx.restore();
}

/** A energia sugada: bolhas azuis descem pelas correntes, e as ondas sobem das bobinas, para longe. */
function drain(ctx, m, bx, by, now) {
  for (const [i, a] of anchors(m).entries()) {
    const sx = bx + a.to[0], sy = by + a.to[1];
    const len = Math.hypot(a.x - sx, a.y - sy);
    const sag = Math.min(26, len * 0.12);
    for (let j = 0; j < 3; j++) {
      const k = (now * 0.9 + j / 3 + i * 0.17) % 1;
      const x = sx + (a.x - sx) * k;
      const y = sy + (a.y - sy) * k + Math.sin(k * Math.PI) * sag;
      glowCircle(ctx, x, y, 12, 'rgba(150,220,255,.75)');
      ctx.fillStyle = '#f2fbff';
      ctx.beginPath(); ctx.arc(x, y, 2.5, 0, TAU); ctx.fill();
    }
  }
  const [l, r] = anchors(m);
  for (const top of [l, r]) {
    for (let j = 0; j < 3; j++) {
      const k = (now * 0.6 + j / 3) % 1;
      ctx.strokeStyle = `rgba(140,215,255,${0.7 * (1 - k)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(top.x, top.y - 6 - 150 * k, 14 + 46 * k, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
  }
}

/* ------------------------------------------------------------------ o véu (névoa e geada) */

/**
 * Por cima dos Pokémon, embaixo dos avisos: a névoa (o círculo da vista em volta do treinador,
 * com as sombras da horda lá fora) e a geada do Frio Absoluto (tudo branco, menos o olho).
 */
export function drawArticunoVeil(ctx, run, fight) {
  const p = run.player;
  const R = 3200;
  // a névoa: a vista vai até `sight`; o resto fica coberto (some com ele derrotado)
  if (!fight.downed) {
    const r = fight.sight;
    const g = ctx.createRadialGradient(p.x, p.y - 10, r * 0.55, p.x, p.y - 10, r);
    g.addColorStop(0, 'rgba(226,238,248,0)');
    g.addColorStop(1, 'rgba(226,238,248,.93)');
    ctx.fillStyle = g;
    ctx.fillRect(p.x - R, p.y - R, 2 * R, 2 * R);
    // lá fora, a horda vira sombra: dá para ver que vem alguém, mas não quem
    for (const e of run.enemies) {
      if (e.dead || e.hidden || Math.hypot(e.x - p.x, e.y - p.y) < r * 0.85) continue;
      ctx.fillStyle = e.boss ? 'rgba(70,90,120,.45)' : 'rgba(80,100,128,.32)';
      ctx.beginPath(); ctx.ellipse(e.x, e.y, e.radius * 0.9, e.radius * 0.6, 0, 0, TAU); ctx.fill();
    }
  }
  // a geada do Frio Absoluto: só o olho da nevasca fica livre, com o caminho dele marcado
  const c = fight.cold;
  if (c?.eye && c.frost > 0) {
    const e = c.eye;
    ctx.save();
    // a geada fica mais rala em volta do treinador: fora do olho, o jogador ainda se vê
    const a = (0.86 * c.frost).toFixed(3);
    const lamp = ctx.createRadialGradient(p.x, p.y - 12, 34, p.x, p.y - 12, 90);
    lamp.addColorStop(0, `rgba(238,247,255,${(0.3 * c.frost).toFixed(3)})`);
    lamp.addColorStop(1, `rgba(238,247,255,${a})`);
    ctx.fillStyle = lamp;
    ctx.beginPath();
    ctx.rect(p.x - R, p.y - R, 2 * R, 2 * R);
    ctx.arc(e.x, e.y, e.r, 0, TAU, true);
    ctx.fill('evenodd');
    ctx.restore();
    if (c.phase === 'frost') {
      // o caminho à frente do olho, tracejado
      const s = fight.t - c.from;
      ctx.save();
      ctx.setLineDash([12, 14]);
      ctx.lineDashOffset = -run.time * 40;
      ctx.strokeStyle = `rgba(31,106,168,${0.75 * c.frost})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      for (let k = 0; k <= 30; k++) {
        const q = fight.eyeAt(s + k * 0.12);
        if (k) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y);
      }
      ctx.stroke();
      ctx.restore();
    }
    ctx.strokeStyle = `rgba(31,106,168,${c.frost.toFixed(3)})`;
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, TAU); ctx.stroke();
    // fora do olho, o "frio!" em cima do treinador
    if (c.phase === 'frost' && c.frost > 0.9 && !fight.inEye(p.x, p.y)) banner(ctx, p.x, p.y - 70, 'frio!', '#1f6aa8', 22);
  }
}

/* ------------------------------------------------------------------ por cima */

export function drawArticunoWorld(ctx, run, fight) {
  const now = run.time;
  const boss = fight.boss;

  // o Raio de Gelo: a mira tracejada piscando, e o raio passando
  const bm = fight.beam;
  if (bm) {
    if (bm.phase === 'aim') {
      const k = clamp01(fight.t / bm.warn);
      ctx.save();
      ctx.fillStyle = `rgba(90,170,240,${0.08 + 0.14 * k})`;
      ctx.lineWidth = bm.w;
      ctx.lineCap = 'round';
      ctx.strokeStyle = `rgba(90,170,240,${0.1 + 0.16 * k})`;
      ctx.beginPath(); ctx.moveTo(bm.x0, bm.y0); ctx.lineTo(bm.x1, bm.y1); ctx.stroke();
      if (Math.floor(fight.t * 8) % 2 === 0) {
        ctx.setLineDash([16, 12]);
        ctx.lineDashOffset = -now * 90;
        ctx.strokeStyle = '#1f6aa8';
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(bm.x0, bm.y0); ctx.lineTo(bm.x1, bm.y1); ctx.stroke();
      }
      ctx.restore();
      if (boss) glowCircle(ctx, boss.x, boss.y - 10, 50 + 70 * k, `rgba(190,235,255,${0.3 + 0.4 * k})`);
    } else {
      const k = clamp01((fight.t - bm.from) / 0.35);
      ctx.save();
      ctx.globalAlpha = 1 - k * 0.7;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(190,235,255,.55)';
      ctx.lineWidth = bm.w * 1.3;
      ctx.beginPath(); ctx.moveTo(bm.x0, bm.y0); ctx.lineTo(bm.x1, bm.y1); ctx.stroke();
      ctx.strokeStyle = '#e8fbff';
      ctx.lineWidth = bm.w * 0.55;
      ctx.stroke();
      ctx.strokeStyle = '#6cc8ff';
      ctx.lineWidth = bm.w * 0.2;
      ctx.stroke();
      ctx.restore();
    }
  }

  // a Nevasca: o cone acende no chão (piscando), e a rajada passa por ele
  const c = fight.cone;
  if (c) {
    const aim = c.phase === 'aim';
    const k = aim ? clamp01(fight.t / c.warn) : clamp01((fight.t - c.from) / 0.6);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.arc(c.x, c.y, c.len, c.a - c.spread, c.a + c.spread);
    ctx.closePath();
    ctx.fillStyle = aim ? (Math.floor(fight.t * 6) % 2 ? `rgba(31,106,168,${0.14 + 0.1 * k})` : `rgba(31,106,168,${0.22 + 0.12 * k})`) : `rgba(255,255,255,${0.45 * (1 - k)})`;
    ctx.fill();
    ctx.setLineDash(aim ? [14, 10] : []);
    ctx.strokeStyle = aim ? '#1f6aa8' : `rgba(150,210,250,${1 - k})`;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
    if (!aim) {
      ctx.strokeStyle = `rgba(255,255,255,${0.95 * (1 - k)})`;
      ctx.lineWidth = 4;
      for (let i = 0; i < 40; i++) {
        const a = c.a + ((((i * 37) % 21) / 10) - 1) * c.spread * 0.9;
        const r = (i * 53 + k * 0.6 * 900) % c.len;
        ctx.beginPath();
        ctx.moveTo(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r);
        ctx.lineTo(c.x + Math.cos(a) * (r + 30), c.y + Math.sin(a) * (r + 30));
        ctx.stroke();
      }
    }
  }

  for (const f of fight.fx) {
    if (f.kind === 'shatter') shatter(ctx, f);
    else if (f.kind === 'chainsnap') chainSnap(ctx, f, now);
  }
}

/** O gelo estilhaçando: o clarão frio, o anel que se abre e os cacos voando. */
function shatter(ctx, f) {
  const k = f.t / f.life;
  glowCircle(ctx, f.x, f.y, f.r * (0.6 + 0.8 * k), `rgba(220,244,255,${0.7 * (1 - k)})`);
  ctx.strokeStyle = `rgba(160,220,255,${1 - k})`;
  ctx.lineWidth = 10 * (1 - k) + 2;
  ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * easeOut(k * 1.2), f.r * 0.55 * easeOut(k * 1.2), 0, 0, TAU); ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + hash(f.seed, i);
    const d = f.r * (0.3 + 0.8 * k) * (0.6 + 0.4 * hash(f.seed, i + 9));
    const x = f.x + Math.cos(a) * d, y = f.y + Math.sin(a) * d * 0.6;
    ctx.save();
    ctx.globalAlpha = 1 - k;
    ctx.translate(x, y);
    ctx.rotate(a + k * 6);
    ctx.fillStyle = '#eaf7ff';
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 0); ctx.lineTo(0, 7); ctx.lineTo(-5, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#6cb6e8';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}

/** O anel de gelo: o contorno escuro, o corpo azul-claro e os cristais por dentro. */
export function iceRing(ctx, ring, now) {
  const k = ring.r / ring.max;
  const w = ring.width * (1 - 0.35 * k);
  ctx.save();
  ctx.globalAlpha = 1 - k * 0.55;
  ctx.lineWidth = w + 8;
  ctx.strokeStyle = 'rgba(20,50,90,.55)';
  ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r, 0, TAU); ctx.stroke();
  ctx.lineWidth = w;
  ctx.strokeStyle = '#bfe6ff';
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  const n = 28, tick = Math.floor(now * 10);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + hash(tick, i) * 0.05;
    const x = ring.x + Math.cos(a) * ring.r, y = ring.y + Math.sin(a) * ring.r;
    ctx.fillRect(x - 3, y - 3, 6, 6);
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ na tela */

export function drawArticunoScreen(ctx, run, renderer, fight) {
  const W = renderer.width, H = renderer.height;
  // a neve caindo, devagar e de lado (a nevasca o tempo todo)
  const now = run.time;
  ctx.fillStyle = 'rgba(255,255,255,.8)';
  for (let i = 0; i < 70; i++) {
    const sp = 40 + hash(i, 1) * 50;
    const x = ((hash(i, 2) * W + now * 30 + Math.sin(now * 0.8 + i) * 20) % W + W) % W;
    const y = ((hash(i, 3) * H + now * sp) % H + H) % H;
    const s = 2 + Math.floor(hash(i, 4) * 3);
    ctx.fillRect(Math.round(x), Math.round(y), s, s);
  }
  const c = fight.cold;
  if (c && c.phase !== 'up') {
    banner(ctx, W / 2, 150, c.phase === 'down' ? 'Ele vai mergulhar! Saia do círculo!' : 'FRIO ABSOLUTO!  Fique no olho da nevasca', '#bfe9ff', 26);
  } else if (!fight.snapped && fight.machine.overload > 0) {
    banner(ctx, W / 2, 150, 'A máquina está sobrecarregando!', '#ffb46a', 24);
  }
}
