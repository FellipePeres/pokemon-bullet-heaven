import { getSheet } from './assets.js';

const TAU = Math.PI * 2;
const ARCADE = '"Press Start 2P", monospace';
const PIXEL = '"Pixelify Sans", sans-serif';

/**
 * O DESENHO DA LUTA DO KYOGRE (0.37, systems/kyogreFight.js): os avisos no chão
 * e os golpes que caem, o lago fervendo e a poça que borbulha antes de ele voltar,
 * a Dive Ball no campo, o arremesso e os balanços. Por cima da tela: a chuva, o
 * clarão do trovão, a seta até a bola e o relógio da maré final. Só lê o estado.
 */
export function drawKyogreWorld(ctx, run) {
  const fight = run.fight;
  if (!fight) return;
  const now = run.time;

  // o lago fervendo antes de ele sair, e a poça escolhida antes de ele voltar
  if (fight.boiling > 0) bubbles(ctx, fight.lake.x, fight.lake.y, 150, 70, fight.boiling, now);
  if (fight.state === 'dive' && fight.t > 0.6 && fight.pool) bubbles(ctx, fight.pool.x, fight.pool.y, 60, 30, 1, now * 1.6);

  // os avisos e os golpes
  for (const h of fight.hazards) {
    if (!h.fired) {
      const k = Math.min(1, h.t / h.warn);
      const thunder = h.kind === 'thunder';
      ctx.fillStyle = thunder ? `rgba(255,230,90,${0.12 + 0.22 * k})` : `rgba(90,170,255,${0.14 + 0.24 * k})`;
      ctx.strokeStyle = thunder ? 'rgba(255,230,90,.9)' : 'rgba(170,220,255,.9)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r, h.r * 0.55, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r * k, h.r * 0.55 * k, 0, 0, TAU); ctx.stroke();
    } else if (h.kind === 'spout') {
      const a = 1 - (h.t - h.warn) / h.life;
      ctx.fillStyle = `rgba(110,190,255,${0.8 * a})`;
      ctx.fillRect(h.x - 20, h.y - 240, 40, 240);
      ctx.fillStyle = `rgba(232,250,255,${0.85 * a})`;
      ctx.fillRect(h.x - 8, h.y - 240, 16, 240);
      ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r, h.r * 0.5, 0, 0, TAU); ctx.fill();
    } else {
      const a = 1 - (h.t - h.warn) / h.life;
      ctx.strokeStyle = `rgba(40,30,0,${a})`;
      ctx.lineWidth = 9;
      zigzag(ctx, h.x, h.y, h.seedX ??= Math.random());
      ctx.strokeStyle = `rgba(255,245,150,${a})`;
      ctx.lineWidth = 5;
      zigzag(ctx, h.x, h.y, h.seedX);
    }
  }

  // a Dive Ball no campo: cai do alto e fica brilhando
  const ball = fight.ball;
  const sheet = getSheet('item/dive-ball');
  if (ball) {
    const drop = Math.max(0, 1 - ball.t * 2.5) * -260;
    const pulse = 30 + 5 * Math.sin(ball.t * 6);
    ctx.fillStyle = 'rgba(143,227,255,.28)';
    ctx.beginPath(); ctx.arc(ball.x, ball.y, pulse, 0, TAU); ctx.fill();
    if (sheet) ctx.drawImage(sheet.img, ball.x - 18, ball.y - 18 + drop + Math.sin(ball.t * 5) * 3, 36, 36);
  }

  // o arremesso e os balanços
  const th = fight.throwing;
  if (th && sheet) {
    let x, y, rot = 0;
    if (th.stage === 'fly') {
      const u = Math.min(1, th.t / 0.7);
      x = th.from.x + (th.to.x - th.from.x) * u;
      y = th.from.y + (th.to.y - th.from.y) * u - Math.sin(u * Math.PI) * 180;
      rot = u * 12;
    } else {
      x = th.to.x; y = th.to.y + 70;
      if (th.stage === 'shake') rot = Math.sin(Math.min(1, th.t / 0.5) * TAU) * 0.5;
    }
    if (th.stage === 'absorb' || th.stage === 'burst') {
      const k = th.stage === 'absorb' ? th.t / 0.8 : th.t / 0.5;
      ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - k)})`;
      ctx.beginPath(); ctx.arc(th.to.x, th.to.y, 40 + 140 * k, 0, TAU); ctx.fill();
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.drawImage(sheet.img, -18, -18, 36, 36);
    ctx.restore();
    if (th.stage === 'click') {
      ctx.font = `700 26px ${PIXEL}`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#0a1222';
      ctx.strokeText('Gotcha!', x, y - 36);
      ctx.fillStyle = '#fff';
      ctx.fillText('Gotcha!', x, y - 36);
    }
  }
}

/** Por cima da tela: a chuva, o clarão, a seta até a Dive Ball e o relógio da maré final. */
export function drawKyogreScreen(ctx, run, renderer) {
  if (run.stage.weather === 'rain') rain(ctx, renderer, run.time);
  const fight = run.fight;
  if (!fight) return;
  const W = renderer.width, H = renderer.height;
  if (fight.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${fight.flash})`; ctx.fillRect(0, 0, W, H); }

  // a seta na borda, apontando para a Dive Ball fora da tela
  const ball = fight.ball;
  if (ball) {
    const sx = ball.x - renderer.camera.x, sy = ball.y - renderer.camera.y;
    if (sx < 0 || sy < 0 || sx > W || sy > H) {
      const a = Math.atan2(sy - H / 2, sx - W / 2);
      const ex = Math.max(34, Math.min(W - 34, sx)), ey = Math.max(130, Math.min(H - 34, sy));
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(a);
      ctx.fillStyle = '#8fe3ff';
      ctx.strokeStyle = '#0a1222';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(-12, -15); ctx.lineTo(-12, 15); ctx.closePath();
      ctx.stroke(); ctx.fill();
      ctx.restore();
    }
    ctx.font = `700 20px ${PIXEL}`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0a1222';
    const left = Math.max(0, Math.ceil(fight.cfg.exhaust - fight.t));
    const text = `O Kyogre está exausto! Pegue a Dive Ball (${left})`;
    ctx.strokeText(text, W / 2, 140);
    ctx.fillStyle = '#8fe3ff';
    ctx.fillText(text, W / 2, 140);
  }

  // a maré final: o relógio no topo
  if (fight.final && !run.pendingGift) {
    ctx.font = `700 30px ${PIXEL}`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#0a1222';
    const text = `MARÉ FINAL  ${Math.ceil(fight.final.t)} s`;
    ctx.strokeText(text, W / 2, 112);
    ctx.fillStyle = '#8fe3ff';
    ctx.fillText(text, W / 2, 112);
  }
}

/** Na barra do chefe: a marca dos 15% (enquanto houver bola) e as Dive Balls que restam. */
export function drawKyogreBossBar(ctx, run, x, y, w) {
  const fight = run.fight;
  if (!fight) return;
  if (fight.balls > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + w * fight.cfg.floor - 1, y - 4, 3, 22);
  }
  const sheet = getSheet('item/dive-ball');
  if (!sheet) return;
  for (let i = 0; i < fight.cfg.balls; i++) {
    ctx.globalAlpha = i < fight.balls ? 1 : 0.25;
    ctx.drawImage(sheet.img, x + w + 10 + i * 24, y - 3, 20, 20);
  }
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ apoio */

function bubbles(ctx, x, y, rx, ry, strength, t) {
  ctx.strokeStyle = `rgba(200,240,255,${0.55 * strength})`;
  ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    const ph = (t * 1.7 + i * 0.37) % 1;
    const bx = x + Math.sin(i * 12.9) * rx, by = y + Math.cos(i * 7.3) * ry;
    ctx.beginPath(); ctx.ellipse(bx, by, 4 + ph * 14, 2 + ph * 7, 0, 0, TAU); ctx.stroke();
  }
}

function zigzag(ctx, x, y, seed) {
  ctx.beginPath();
  let px = x, py = y - 320;
  ctx.moveTo(px, py);
  for (let i = 1; i <= 6; i++) {
    px = x + Math.sin(seed * 40 + i * 2.1) * 26;
    py = y - 320 + i * 50;
    ctx.lineTo(px, py);
  }
  ctx.lineTo(x, y);
  ctx.stroke();
}

/** A chuva do Kyogre: traços inclinados caindo por cima de tudo, a tela um pouco mais escura. */
function rain(ctx, renderer, t) {
  const W = renderer.width, H = renderer.height;
  ctx.fillStyle = 'rgba(8,12,40,.22)';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(190,215,255,.42)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 140; i++) {
    const speed = 640 + (i % 7) * 40;
    const x = ((i * 97.13 + 40) % (W + 200)) - ((t * speed * 0.18) % (W + 200)) + 100;
    const y = ((i * 53.71) + t * speed) % (H + 40) - 20;
    const xx = ((x % (W + 200)) + W + 200) % (W + 200) - 100;
    ctx.moveTo(xx, y);
    ctx.lineTo(xx - 6, y + 24);
  }
  ctx.stroke();
}
