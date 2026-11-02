import { CONFIG } from './core/config.js';
import { TRAINER_LOOKS } from './data/trainers.js';
import { ASSET_MANIFEST } from './data/assetManifest.js';
import { getSheet, drawFrame, preloadAssets } from './render/assets.js';
import { trainerFrame } from './render/trainer.js';
import { drawPokemon, preload } from './render/sprites.js';
import { Renderer } from './render/Renderer.js';
import { facingDir } from './entities/Player.js';

/**
 * VITRINE — conferência visual (vitrine.html).
 *
 * Desenha os assets com o mesmo código da partida, numa cena fixa: é o que o
 * tools/screenshot.mjs fotografa antes de cada entrega. Cresce a cada etapa
 * (golpes, Pokémon animados, cenário).
 */
const canvas = document.getElementById('vitrine');
const ctx = canvas.getContext('2d');
const grass = new Renderer(canvas)._pattern('grass');
const SCALE = CONFIG.render.pixelScale;
const LOOKS = Object.values(TRAINER_LOOKS);
const PORTRAITS = Object.keys(ASSET_MANIFEST).filter((key) => key.startsWith('portrait/'));

preloadAssets(Object.keys(ASSET_MANIFEST));
preload([1, 4, 7, 19, 25]);

const WALK_SPEED = CONFIG.trainer.animation.runAt - 60;   // abaixo do limite: anda
const RUN_SPEED = CONFIG.trainer.speed;                   // a velocidade do jogo

function text(value, x, y, { size = 13, color = '#fff', align = 'left' } = {}) {
  ctx.font = `bold ${size}px Trebuchet MS, sans-serif`;
  ctx.textAlign = align;
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,.7)';
  ctx.strokeText(value, x, y);
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = 'rgba(6, 10, 24, .35)';
  ctx.fillRect(x, y, w, h);
  text(title, x + 10, y + 20, { size: 14, color: '#ffcb05' });
}

/** Desenha o treinador com os pés em (x, y), no estado informado. */
function trainer(look, state, x, y, scale = SCALE) {
  const sheet = getSheet(look.sheet);
  if (!sheet) return;
  const { frame, flip } = trainerFrame(state, look);
  drawFrame(ctx, sheet, frame, x, y, { scale, flipX: flip });
}

const DIRS = ['down', 'up', 'left', 'right'];
const ARROWS = [
  { label: '↑', x: 0, y: -1 }, { label: '↗', x: 1, y: -1 }, { label: '→', x: 1, y: 0 }, { label: '↘', x: 1, y: 1 },
  { label: '↓', x: 0, y: 1 }, { label: '↙', x: -1, y: 1 }, { label: '←', x: -1, y: 0 }, { label: '↖', x: -1, y: -1 }
];

function draw(now) {
  const t = now / 1000;
  ctx.fillStyle = grass;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ---- poses e animações de cada modelo ----
  panel(10, 10, 760, 330, 'Treinadores — parado (4x), andando e correndo (2x, a escala do jogo)');
  LOOKS.forEach((look, row) => {
    const base = 150 + row * 160;
    text(`${look.label} (${look.name})`, 24, base - 98, { size: 13 });
    DIRS.forEach((dir, i) => {
      trainer(look, { dir, moving: false }, 60 + i * 70, base, 4);
      text(dir, 60 + i * 70, base + 16, { size: 11, align: 'center', color: '#cfe' });
    });
    DIRS.forEach((dir, i) => {
      const walking = { dir, moving: true, speed: WALK_SPEED, stride: t * WALK_SPEED };
      const running = { dir, moving: true, speed: RUN_SPEED, stride: t * RUN_SPEED };
      trainer(look, walking, 350 + i * 50, base - 10);
      trainer(look, running, 580 + i * 50, base - 10);
    });
    text('andando', 425, base + 16, { size: 11, align: 'center', color: '#cfe' });
    text('correndo', 655, base + 16, { size: 11, align: 'center', color: '#cfe' });
  });

  // ---- 8 direções: o movimento é livre, a pose é uma das 4 do FireRed ----
  panel(780, 10, 490, 330, 'Movimento nas 8 direções');
  const look = LOOKS[0];
  ARROWS.forEach((arrow, i) => {
    const x = 815 + i * 58;
    text(arrow.label, x, 58, { size: 20, align: 'center' });
    // vindo de lado (ou já de lado) e vindo de frente/costas
    const fromSide = facingDir(arrow, arrow.x > 0 ? 'right' : arrow.x < 0 ? 'left' : 'down');
    const fromVertical = facingDir(arrow, arrow.y > 0 ? 'down' : arrow.y < 0 ? 'up' : 'left');
    const stride = t * RUN_SPEED;
    trainer(look, { dir: fromSide, moving: true, speed: RUN_SPEED, stride }, x, 160);
    trainer(look, { dir: fromVertical, moving: true, speed: RUN_SPEED, stride }, x, 290);
  });
  text('vindo de lado', 790, 182, { size: 11, color: '#cfe' });
  text('vindo de frente ou de costas', 790, 312, { size: 11, color: '#cfe' });

  // ---- proporção: treinador no tamanho do jogo com a equipe em volta ----
  panel(10, 350, 760, 200, 'Proporção na partida (treinador andando em círculo, Pokémon como hoje)');
  const angle = t * 1.2;
  const move = { x: -Math.sin(angle), y: Math.cos(angle) };
  circle.dir = facingDir(move, circle.dir);
  const cx = 250 + Math.cos(angle) * 70;
  const cy = 455 + Math.sin(angle) * 40;
  [[1, -60, -10], [4, 60, -10], [7, 0, 45]].forEach(([dex, dx, dy]) => {
    drawPokemon(ctx, dex, cx + dx, cy + dy, 46, { facing: move.x >= 0 ? 1 : -1 });
  });
  trainer(LOOKS[1], { dir: circle.dir, moving: true, speed: RUN_SPEED, stride: t * RUN_SPEED }, cx, cy + 14);
  drawPokemon(ctx, 19, 560, 450, 42, { facing: -1 });
  drawPokemon(ctx, 25, 640, 450, 46, { facing: -1 });
  text('inimigo', 560, 490, { size: 11, align: 'center', color: '#cfe' });
  text('Pikachu', 640, 490, { size: 11, align: 'center', color: '#cfe' });

  // ---- retratos do FireRed (1x) ----
  panel(10, 560, 1260, 150, 'Retratos (1x)');
  PORTRAITS.forEach((key, i) => {
    const sheet = getSheet(key);
    if (sheet) drawFrame(ctx, sheet, 0, 50 + i * 76, 690, { scale: 1 });
    text(key.replace('portrait/', ''), 50 + i * 76, 702, { size: 10, align: 'center', color: '#cfe' });
  });

  requestAnimationFrame(draw);
}

const circle = { dir: 'down' };
requestAnimationFrame(draw);
