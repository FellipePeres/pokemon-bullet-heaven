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
 * O DESENHO DA LUTA DO MOLTRES (H-8, systems/moltresFight.js), por cima do molde
 * (render/legendaryFight.js), com o desenho da maquete aprovada ("Monte Brasa: o cume"):
 * - embaixo de todos: o chão em brasa (o rastro do Lança-chamas, o redemoinho fechado, o
 *   mergulho), a máquina do emblema vermelho em brasa, o Moltres acorrentado nela nos primeiros
 *   45 s, a energia sugada em laranja e, depois, a máquina destruída;
 * - por cima dos Pokémon e embaixo dos avisos: o Fogo Sagrado (a arena inteira em chamas, as
 *   rochas e a sombra delas girando com ele no céu);
 * - por cima: o leque e a chama do Lança-chamas, o anel do Redemoinho de Fogo com a saída
 *   marcada, as explosões e as rochas desmoronando;
 * - na tela: o calor do sol forte, as brasas subindo, onde ele está no céu e os letreiros.
 * Só lê o estado.
 */

/* ------------------------------------------------------------------ embaixo de todos */

export function drawMoltresGround(ctx, run, fight) {
  const now = run.time;
  // o chão em brasa, sumindo no fim
  for (const b of fight.burn) {
    const fade = Math.min(1, (b.life - b.t) / 1.2) * Math.min(1, b.t / 0.15);
    burnPatch(ctx, b, fade, now);
  }

  const m = fight.machine;
  const sheet = getSheet(m.broken ? 'npc/maquina_moltres_quebrada' : 'npc/maquina_moltres');
  const perch = fight.perch;
  const boss = run.spawner.boss;
  const chained = !fight.snapped;

  // o calor que sai das bobinas (mais forte na sobrecarga)
  if (!m.broken) glowCircle(ctx, m.x, m.y, 150 + 60 * m.overload, `rgba(255,140,50,${0.18 + 0.3 * m.overload})`);
  if (sheet) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet.img, Math.round(m.x - 32 * SCALE), Math.round(m.y - 24 * SCALE), 64 * SCALE, 48 * SCALE);
    ctx.restore();
  } else {
    ctx.fillStyle = '#7a5a4a';
    ctx.fillRect(m.x - 64, m.y - 48, 128, 96);
  }
  if (!m.broken && m.overload > 0) glowCircle(ctx, m.x, m.y + 10, 40, `rgba(255,40,30,${0.5 * m.overload * (0.6 + 0.4 * Math.sin(now * 20))})`);

  if (chained) {
    const struggle = Math.sin(now * 2.3) * 3 + (m.overload > 0 ? Math.sin(now * 31) * 3 * m.overload : 0);
    if (!boss) {
      const data = getEnemy('moltres_boss');
      drawPokemon(ctx, 146, perch.x + struggle * 0.4, perch.y + struggle, 42 * data.scale, { facing: 1, types: data.types, time: now });
    }
    const bx = boss ? boss.x : perch.x + struggle * 0.4, by = boss ? boss.y : perch.y + struggle;
    for (const a of anchors(m)) chain(ctx, a.x, a.y, bx + a.to[0], by + a.to[1], 0.6 + 0.4 * m.overload, now);
    drain(ctx, m, bx, by, now);
    return;
  }
  // a máquina destruída: os pedaços de corrente no chão e a fumaça subindo
  const [l] = anchors(m);
  chain(ctx, l.x, l.y, l.x + 6, l.y + 60, 0, now);
  chain(ctx, m.x - 30, m.y + 60, m.x + 20, m.y + 70, 0, now);
  chain(ctx, m.x + 50, m.y + 50, m.x + 90, m.y + 80, 0, now);
  for (let i = 0; i < 3; i++) {
    const ph = (now * 0.3 + i / 3) % 1;
    ctx.fillStyle = `rgba(70,60,60,${0.35 * (1 - ph)})`;
    ctx.beginPath(); ctx.arc(m.x - 30 + i * 30 + Math.sin(i * 3 + now) * 8, m.y - 10 - ph * 110, 12 + ph * 22, 0, TAU); ctx.fill();
  }
}

/** O chão em brasa: a mancha escura, a borda vermelha e as chamas baixas tremendo. */
function burnPatch(ctx, b, fade, now) {
  ctx.save();
  ctx.globalAlpha = 0.85 * fade;
  const g = ctx.createRadialGradient(b.x, b.y, b.r * 0.1, b.x, b.y, b.r);
  g.addColorStop(0, 'rgba(255,190,70,.75)');
  g.addColorStop(0.55, 'rgba(230,80,30,.55)');
  g.addColorStop(1, 'rgba(90,20,10,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r, b.r * 0.62, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(200,50,20,.8)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.lineDashOffset = -now * 30;
  ctx.stroke();
  ctx.setLineDash([]);
  // as chamas baixas
  const n = Math.max(3, Math.round(b.r / 14));
  for (let k = 0; k < n; k++) {
    const a = hash(b.x + b.y, k) * TAU;
    const d = b.r * 0.7 * hash(b.y, k + 3);
    const x = b.x + Math.cos(a) * d, y = b.y + Math.sin(a) * d * 0.6;
    const h = 10 + 8 * Math.sin(now * 9 + k * 1.7);
    flame(ctx, x, y, 6, h, 0.9);
  }
  ctx.restore();
}

/** Uma chama pequena: a gota laranja com o miolo amarelo. */
function flame(ctx, x, y, w, h, alpha) {
  ctx.fillStyle = `rgba(255,110,30,${alpha})`;
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.quadraticCurveTo(x - w * 0.6, y - h * 0.6, x, y - h);
  ctx.quadraticCurveTo(x + w * 0.6, y - h * 0.6, x + w, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `rgba(255,230,120,${alpha})`;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.45, y);
  ctx.quadraticCurveTo(x, y - h * 0.55, x + w * 0.45, y);
  ctx.closePath();
  ctx.fill();
}

/** A energia sugada: bolhas laranja descem pelas correntes, e o calor sobe das bobinas, para longe. */
function drain(ctx, m, bx, by, now) {
  for (const [i, a] of anchors(m).entries()) {
    const sx = bx + a.to[0], sy = by + a.to[1];
    const len = Math.hypot(a.x - sx, a.y - sy);
    const sag = Math.min(26, len * 0.12);
    for (let j = 0; j < 3; j++) {
      const k = (now * 0.9 + j / 3 + i * 0.17) % 1;
      const x = sx + (a.x - sx) * k;
      const y = sy + (a.y - sy) * k + Math.sin(k * Math.PI) * sag;
      glowCircle(ctx, x, y, 12, 'rgba(255,150,60,.75)');
      ctx.fillStyle = '#fff2c0';
      ctx.beginPath(); ctx.arc(x, y, 2.5, 0, TAU); ctx.fill();
    }
  }
  const [l, r] = anchors(m);
  for (const top of [l, r]) {
    for (let j = 0; j < 3; j++) {
      const k = (now * 0.6 + j / 3) % 1;
      ctx.strokeStyle = `rgba(255,150,60,${0.7 * (1 - k)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(top.x, top.y - 6 - 150 * k, 14 + 46 * k, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
  }
}

/* ------------------------------------------------------------------ o véu (o Fogo Sagrado) */

/**
 * Por cima dos Pokémon, embaixo dos avisos: o Fogo Sagrado cobre a arena; as rochas sobem do
 * chão, e a sombra de cada uma (o lado oposto a ele, lá no céu) fica escura e marcada.
 */
export function drawMoltresVeil(ctx, run, fight) {
  const s = fight.sacred;
  if (!s?.rocks) return;
  const p = run.player;
  const now = run.time;
  const R = 3200;
  const fire = s.phase === 'fire' ? 1 : s.rise;
  // o fogo na arena inteira
  if (fire > 0) {
    ctx.save();
    const flick = 0.04 * Math.sin(now * 13) + 0.03 * Math.sin(now * 7.3);
    ctx.fillStyle = `rgba(255,96,24,${((0.34 + flick) * fire).toFixed(3)})`;
    ctx.fillRect(p.x - R, p.y - R, 2 * R, 2 * R);
    // as línguas de fogo caindo pelo campo à volta do treinador
    for (let i = 0; i < 46; i++) {
      const x = p.x + (hash(i, 1) - 0.5) * 1500;
      const y = p.y + (hash(i, 2) - 0.5) * 900;
      if (fight.inShadow(x, y)) continue;
      const h = 14 + 12 * Math.sin(now * 8 + i);
      flame(ctx, x, y, 8, h, 0.75 * fire);
    }
    ctx.restore();
  }
  // as sombras das rochas: escuras, com a borda clara (o lugar seguro)
  for (const r of s.rocks) {
    const poly = shadowPolygon(fight, r);
    ctx.save();
    ctx.globalAlpha = Math.min(1, fire * 1.2);
    ctx.fillStyle = 'rgba(30,14,24,.55)';
    ctx.beginPath();
    poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
    ctx.setLineDash([10, 8]);
    ctx.lineDashOffset = -now * 30;
    ctx.strokeStyle = 'rgba(255,240,200,.85)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }
  // as rochas, subindo do chão
  const sheet = getSheet('npc/rocha');
  const up = easeOut(s.phase === 'up' ? s.rise : 1);
  for (const r of s.rocks) {
    const size = 24 * SCALE;
    const h = size * up;
    if (h <= 1) continue;
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(r.x, r.y + 4, size * 0.55, size * 0.22, 0, 0, TAU); ctx.fill();
    if (sheet) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sheet.img, 0, 0, 16, 16 * up, Math.round(r.x - size / 2), Math.round(r.y - h + 6), size, h);
      ctx.restore();
    } else {
      ctx.fillStyle = '#7a6656';
      ctx.beginPath(); ctx.ellipse(r.x, r.y - h / 2, size / 2, h / 2, 0, 0, TAU); ctx.fill();
    }
  }
  // fora da sombra, o "queima!" em cima do treinador
  if (s.phase === 'fire' && !fight.inShadow(p.x, p.y)) banner(ctx, p.x, p.y - 70, 'queima!', '#ffcf70', 22);
}

/** A sombra de uma rocha: o trapézio para o lado oposto ao Moltres (o mesmo de inShadow). */
function shadowPolygon(fight, r) {
  const L = fight.sunAt();
  let dx = r.x - L.x, dy = r.y - L.y;
  const dl = Math.hypot(dx, dy) || 1;
  dx /= dl; dy /= dl;
  const len = fight.cfg.shadowLength;
  const nx = -dy, ny = dx;
  const w0 = 34, w1 = 56;
  const bx = r.x - dx * 20, by = r.y - dy * 20;
  const ex = r.x + dx * len, ey = r.y + dy * len;
  return [[bx + nx * w0, by + ny * w0], [ex + nx * w1, ey + ny * w1], [ex - nx * w1, ey - ny * w1], [bx - nx * w0, by - ny * w0]];
}

/* ------------------------------------------------------------------ por cima */

export function drawMoltresWorld(ctx, run, fight) {
  const now = run.time;
  const boss = fight.boss;

  // o Lança-chamas: o leque acende com o lado da varredura, e a chama varre
  const sw = fight.sweep;
  if (sw) {
    const mid = (sw.from + sw.to) / 2;
    const half = Math.abs(sw.to - sw.from) / 2;
    const aim = sw.phase === 'aim';
    const k = aim ? clamp01(fight.t / sw.warn) : 1;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sw.x, sw.y);
    ctx.arc(sw.x, sw.y, sw.range, mid - half, mid + half);
    ctx.closePath();
    ctx.fillStyle = aim ? (Math.floor(fight.t * 6) % 2 ? `rgba(220,60,20,${0.12 + 0.1 * k})` : `rgba(220,60,20,${0.2 + 0.12 * k})`) : 'rgba(220,60,20,.08)';
    ctx.fill();
    ctx.setLineDash(aim ? [14, 10] : []);
    ctx.strokeStyle = aim ? '#c43a10' : 'rgba(255,140,60,.5)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
    if (aim) {
      // a seta curva mostrando para onde a chama vai
      const dir = Math.sign(sw.to - sw.from);
      const ar = sw.range * 0.75;
      ctx.save();
      ctx.strokeStyle = '#ffe2a0';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      const a0 = sw.from + dir * 0.08, a1 = sw.to - dir * 0.12;
      ctx.beginPath(); ctx.arc(sw.x, sw.y, ar, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke();
      const hx = sw.x + Math.cos(a1) * ar, hy = sw.y + Math.sin(a1) * ar;
      const ta = a1 + dir * Math.PI / 2;
      ctx.translate(hx, hy);
      ctx.rotate(ta);
      ctx.fillStyle = '#ffe2a0';
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -11); ctx.lineTo(-8, 11); ctx.closePath(); ctx.fill();
      ctx.restore();
      if (boss) glowCircle(ctx, boss.x, boss.y - 10, 50 + 70 * k, `rgba(255,170,80,${0.3 + 0.4 * k})`);
    } else {
      const a = fight.sweepAngle ?? sw.to;
      // o rastro da chama, logo atrás
      for (let j = 4; j >= 0; j--) {
        const back = a - Math.sign(sw.to - sw.from) * j * 0.05;
        flameJet(ctx, sw.x, sw.y, back, sw.range, j === 0 ? 1 : 0.35 - j * 0.06, now + j);
      }
    }
  }

  // o Redemoinho de Fogo: o anel fechando, com a saída marcada
  const sp = fight.spin;
  if (sp) fireWhirl(ctx, sp, fight.cfg.spinGap, now);

  for (const f of fight.fx) {
    if (f.kind === 'flare') flare(ctx, f);
    else if (f.kind === 'crumble') crumble(ctx, f);
    else if (f.kind === 'chainsnap') chainSnap(ctx, f, now);
  }
}

/** A chama do Lança-chamas: um jato do Moltres até o fim do alcance, mais largo na ponta. */
function flameJet(ctx, x, y, a, range, alpha, now) {
  const ex = x + Math.cos(a) * range, ey = y + Math.sin(a) * range;
  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.lineCap = 'round';
  const g = ctx.createLinearGradient(x, y, ex, ey);
  g.addColorStop(0, 'rgba(255,250,210,1)');
  g.addColorStop(0.4, 'rgba(255,170,60,.95)');
  g.addColorStop(1, 'rgba(220,50,20,.7)');
  ctx.strokeStyle = g;
  ctx.lineWidth = 46;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,240,180,.9)';
  ctx.lineWidth = 14;
  ctx.stroke();
  // as labaredas ao longo do jato
  for (let i = 1; i < 9; i++) {
    const k = i / 9;
    const wob = Math.sin(now * 20 + i * 2.1) * 10;
    const px = x + Math.cos(a) * range * k - Math.sin(a) * wob;
    const py = y + Math.sin(a) * range * k + Math.cos(a) * wob;
    glowCircle(ctx, px, py, 18 + 26 * k, 'rgba(255,140,40,.55)');
  }
  ctx.restore();
}

/** O anel do Redemoinho de Fogo: a parede de chamas girando e a abertura com a seta para fora. */
function fireWhirl(ctx, s, gap, now) {
  const half = gap / 2;
  const a0 = s.gap + half, a1 = s.gap - half + TAU;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(120,20,10,.55)';
  ctx.lineWidth = 46;
  ctx.beginPath(); ctx.arc(s.x, s.y, s.r, a0, a1); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,110,30,.9)';
  ctx.lineWidth = 34;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,230,140,.85)';
  ctx.lineWidth = 10;
  ctx.setLineDash([18, 14]);
  ctx.lineDashOffset = -now * 120;
  ctx.stroke();
  ctx.setLineDash([]);
  // as labaredas em pé pela parede, girando
  const n = Math.max(10, Math.round(s.r / 9));
  for (let i = 0; i < n; i++) {
    const a = a0 + ((i / n) + now * 0.25) % 1 * (a1 - a0);
    const x = s.x + Math.cos(a) * s.r, y = s.y + Math.sin(a) * s.r;
    flame(ctx, x, y + 8, 9, 22 + 10 * Math.sin(now * 11 + i), 0.9);
  }
  // a saída: as duas pontas claras e a seta para fora
  const ex = s.x + Math.cos(s.gap) * s.r, ey = s.y + Math.sin(s.gap) * s.r;
  const pulse = 1 + 0.15 * Math.sin(now * 10);
  ctx.translate(ex, ey);
  ctx.rotate(s.gap);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#fff6d0';
  ctx.strokeStyle = '#3a1a10';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(4, -18); ctx.lineTo(4, 18); ctx.closePath();
  ctx.stroke(); ctx.fill();
  ctx.restore();
}

/** A explosão de fogo: o clarão quente, o anel que se abre e as faíscas voando. */
function flare(ctx, f) {
  const k = f.t / f.life;
  glowCircle(ctx, f.x, f.y, f.r * (0.6 + 0.8 * k), `rgba(255,190,90,${0.7 * (1 - k)})`);
  ctx.strokeStyle = `rgba(255,110,40,${1 - k})`;
  ctx.lineWidth = 10 * (1 - k) + 2;
  ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * easeOut(k * 1.2), f.r * 0.55 * easeOut(k * 1.2), 0, 0, TAU); ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + hash(f.seed, i);
    const d = f.r * (0.3 + 0.8 * k) * (0.6 + 0.4 * hash(f.seed, i + 9));
    const x = f.x + Math.cos(a) * d, y = f.y + Math.sin(a) * d * 0.6;
    ctx.save();
    ctx.globalAlpha = 1 - k;
    flame(ctx, x, y, 6, 16 * (1 - k) + 6, 1);
    ctx.restore();
  }
}

/** A rocha do Fogo Sagrado desmoronando: os pedaços rolando e a poeira. */
function crumble(ctx, f) {
  const k = f.t / f.life;
  ctx.save();
  ctx.globalAlpha = 1 - k;
  glowCircle(ctx, f.x, f.y - 10, 50 + 40 * k, 'rgba(120,100,90,.4)');
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + hash(f.seed, i);
    const d = 10 + 60 * easeOut(k) * (0.5 + hash(f.seed, i + 4));
    const x = f.x + Math.cos(a) * d, y = f.y - 20 + Math.sin(a) * d * 0.5 + 30 * k * k;
    ctx.fillStyle = i % 2 ? '#7a6656' : '#5c4a3e';
    ctx.fillRect(Math.round(x - 5), Math.round(y - 5), 10, 10);
  }
  ctx.restore();
}

/** A Onda de Calor: o contorno escuro, o corpo laranja e o ar tremendo por dentro. */
export function heatRing(ctx, ring, now) {
  const k = ring.r / ring.max;
  const w = ring.width * (1 - 0.35 * k);
  ctx.save();
  ctx.globalAlpha = 1 - k * 0.55;
  ctx.lineWidth = w + 8;
  ctx.strokeStyle = 'rgba(90,20,10,.55)';
  ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r, 0, TAU); ctx.stroke();
  ctx.lineWidth = w;
  ctx.strokeStyle = '#ff8a3a';
  ctx.stroke();
  ctx.lineWidth = w * 0.3;
  ctx.strokeStyle = '#ffe0a0';
  ctx.stroke();
  const n = 22;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + now * 0.6;
    flame(ctx, ring.x + Math.cos(a) * ring.r, ring.y + Math.sin(a) * ring.r + 6, 7, 16 + 6 * Math.sin(now * 12 + i), 0.9);
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ na tela */

export function drawMoltresScreen(ctx, run, renderer, fight) {
  const W = renderer.width, H = renderer.height;
  const now = run.time;
  // o sol forte: a borda da tela quente e o ar tremendo
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(255,170,60,0)');
  g.addColorStop(1, 'rgba(255,120,30,.22)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // as brasas subindo
  for (let i = 0; i < 46; i++) {
    const sp = 30 + hash(i, 1) * 50;
    const x = ((hash(i, 2) * W + Math.sin(now * 0.9 + i) * 24) % W + W) % W;
    const y = H - (((hash(i, 3) * H + now * sp) % H + H) % H);
    const s = 2 + Math.floor(hash(i, 4) * 3);
    ctx.fillStyle = i % 3 ? 'rgba(255,170,60,.8)' : 'rgba(255,240,170,.85)';
    ctx.fillRect(Math.round(x), Math.round(y), s, s);
  }
  const s = fight.sacred;
  if (s?.phase === 'fire') {
    // ele lá no alto: o sol na borda da tela, do lado de onde vem a luz
    const L = fight.sunAt();
    const cx = renderer.camera.x + W / 2, cy = renderer.camera.y + H / 2;
    const a = Math.atan2(L.y - cy, L.x - cx);
    const ex = W / 2 + Math.cos(a) * (W / 2 - 50), ey = H / 2 + Math.sin(a) * (H / 2 - 50);
    glowCircle(ctx, ex, ey, 90, 'rgba(255,220,140,.8)');
    ctx.fillStyle = '#fff4c8';
    ctx.beginPath(); ctx.arc(ex, ey, 22 + 3 * Math.sin(now * 9), 0, TAU); ctx.fill();
  }
  if (s && s.phase !== 'up') {
    banner(ctx, W / 2, 150, s.phase === 'down' ? 'Ele vai mergulhar! Saia do círculo!' : 'FOGO SAGRADO!  Fique na sombra das rochas', '#ffcf70', 26);
  } else if (fight.spin) {
    banner(ctx, W / 2, 150, 'REDEMOINHO DE FOGO!  Saia pela abertura', '#ffcf70', 24);
  } else if (!fight.snapped && fight.machine.overload > 0) {
    banner(ctx, W / 2, 150, 'A máquina está sobrecarregando!', '#ffb46a', 24);
  }
}
