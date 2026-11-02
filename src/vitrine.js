import { CONFIG } from './core/config.js';
import { TRAINER_LOOKS } from './data/trainers.js';
import { ASSET_MANIFEST } from './data/assetManifest.js';
import { getSheet, drawFrame, preloadAssets } from './render/assets.js';
import { trainerFrame } from './render/trainer.js';
import { drawPokemon, preload } from './render/sprites.js';
import { Renderer } from './render/Renderer.js';
import { facingDir } from './entities/Player.js';
import { Run } from './game/Run.js';
import { ABILITIES } from './data/abilities.js';
import { typeColor } from './data/types.js';

/**
 * VITRINE — conferência visual (vitrine.html).
 *
 * Desenha os assets com o mesmo código da partida: é o que o
 * tools/screenshot.mjs fotografa antes de cada entrega. Três modos:
 *   vitrine.html              treinadores, 8 direções, proporção e retratos
 *   vitrine.html?golpes=N     laboratório: uma partida de verdade com 6 golpes
 *                             do grupo N (0 a 8) acertando inimigos em volta
 *   vitrine.html?estresse     ~250 inimigos e golpes pesados, medindo o FPS
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

/* ======================= laboratório de golpes ======================= */

const TYPE_ORDER = ['fire', 'water', 'grass', 'normal', 'flying', 'poison', 'bug', 'electric',
  'rock', 'ground', 'fighting', 'psychic', 'ice', 'ghost', 'dragon', 'fairy'];
const PLAYABLE = Object.values(ABILITIES)
  .filter((a) => !a.hostile)
  .sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type));
/** Os golpes em grupos de 6, um grupo por foto. */
export const GROUPS = Array.from({ length: Math.ceil(PLAYABLE.length / 6) },
  (_, i) => PLAYABLE.slice(i * 6, i * 6 + 6).map((a) => a.id));
const STRESS = ['thunder', 'fire_blast', 'hurricane', 'razor_leaf', 'toxic', 'fire_spin'];
const TYPE_SPECIES = {
  fire: 'charmander', water: 'squirtle', grass: 'bulbasaur', electric: 'pikachu', flying: 'pidgey',
  poison: 'ekans', bug: 'caterpie', rock: 'geodude', fighting: 'machop', psychic: 'abra'
};

/**
 * Uma partida de verdade (mesmo Run e mesmo Renderer do jogo) com a equipe
 * invencível e os inimigos repostos em volta. Sem ondas, sem chefe.
 */
function lab(abilities, { enemies, durable }) {
  CONFIG.team.activeSlots = 6;
  CONFIG.debug.godMode = true;
  const run = new Run('gym_1_pewter', { starter: 'charmander', trainer: 'red' });
  run.spawner.update = () => {};
  abilities.forEach((abilityId, i) => {
    const species = TYPE_SPECIES[ABILITIES[abilityId].type] ?? 'rattata';
    const member = i === 0 ? run.team.members[0] : run.team.add(species);
    member.level = 20;
    member.abilities = [abilityId];
  });
  run.rebuildCompanionAbilities();
  run.refreshStats();

  const renderer = new Renderer(canvas);
  const keepEnemies = () => {
    while (run.enemies.length < enemies) {
      const a = Math.random() * Math.PI * 2;
      const d = 150 + Math.random() * 380;
      const enemy = run.spawner.spawnAt(Math.random() < 0.5 ? 'rattata' : 'spearow',
        run.player.x + Math.cos(a) * d, run.player.y + Math.sin(a) * d * 0.7);
      if (durable) { enemy.maxHp = enemy.hp = 600; }
      enemy.speed *= 0.4;
    }
  };

  const samples = [];
  let last = 0;
  const frame = (now) => {
    const t0 = performance.now();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    keepEnemies();
    run.update(dt, { x: 0, y: 0 });
    // a vitrine não pausa: subir de nível, capturar e evoluir ficam de fora
    run.state = 'running';
    run.levelUpMember = null;
    run.pendingBall = false;
    run.evolutionQueue.length = 0;
    run.team.members.forEach((m) => { m.pendingLevels = 0; });
    renderer.render(run);

    // legenda: os golpes em cena, na cor do tipo
    abilities.forEach((id, i) => text(ABILITIES[id].name, 16, 26 + i * 18, { size: 14, color: typeColor(ABILITIES[id].type) }));

    samples.push({ ms: performance.now() - t0, dt });
    if (samples.length > 120) samples.shift();
    const ms = samples.reduce((n, s) => n + s.ms, 0) / samples.length;
    const fps = samples.length / samples.reduce((n, s) => n + s.dt, 0);
    window.vitrineStats = {
      fps: Math.round(fps), msPorQuadro: Number(ms.toFixed(2)), inimigos: run.enemies.length,
      projeteis: run.projectiles.length, efeitos: run.effects.length, particulas: run.particles.length, zonas: run.zones.length
    };
    if (!durable) {
      text(`${window.vitrineStats.fps} FPS · ${window.vitrineStats.msPorQuadro} ms por quadro · ${run.enemies.length} inimigos`,
        1264, 26, { size: 15, align: 'right', color: '#ffcb05' });
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

const params = new URLSearchParams(location.search);
if (params.has('golpes')) lab(GROUPS[Number(params.get('golpes')) || 0] ?? GROUPS[0], { enemies: 40, durable: true });
else if (params.has('estresse')) lab(STRESS, { enemies: 250, durable: false });
else requestAnimationFrame(draw);
