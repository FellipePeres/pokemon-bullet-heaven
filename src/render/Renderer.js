import { CONFIG } from '../core/config.js';
import { clamp } from '../core/utils.js';
import { drawPokemon, drawPokeball } from './sprites.js';
import { typeColor } from '../data/types.js';
import { FloatingText, Beam, SlashArc, SpriteFx } from '../entities/effects.js';
import { maxHpFor } from '../systems/stats.js';
import { getSheet, drawFrame } from './assets.js';
import { trainerFrame } from './trainer.js';
import { getTrainerLook } from '../data/trainers.js';

import { drawFx } from './fx.js';
import { SceneryCache } from './scenery.js';
import { stageScenes } from '../data/scenery.js';
import { abilityFx, zoneFx, STATUS_FX } from '../data/fx.js';
import { getAbility } from '../data/abilities.js';

const STATUS_ORDER = ['burn', 'poison', 'slow'];
const STATUS_COLORS = { burn: '#ff7a3d', poison: '#c060d0', slow: '#63b3ff' };

/** Golpe com melhoria de tamanho fica maior na tela, em degraus de meio. */
function sizeScale(abilityId, size) {
  const base = getAbility(abilityId)?.base?.size;
  if (!base || size <= base) return 1;
  return Math.min(2, Math.round((size / base) * 2) / 2);
}

/**
 * Itens no chão: o sprite do item (pixel art em 1x), o brilho em volta e a
 * escala. A Poké Ball vai na escala do cenário para chamar atenção; o Ímã e a
 * Poção ficam menores.
 */
const ITEM_LOOKS = {
  ball:   { sheet: 'item/poke-ball', glow: '#ffcb05', ring: 24, scale: CONFIG.render.pixelScale, wobble: true },
  magnet: { sheet: 'item/magnet', glow: '#63b3ff', ring: 14, scale: 1 },
  heal:   { sheet: 'item/potion', glow: '#57d18a', ring: 14, scale: 1 }
};

/** Onde ficam os pés do treinador em relação ao centro dele (o raio de colisão). */
const TRAINER_FEET = 14;

/** As fontes da interface (css/style.css), também no canvas. */
const PIXEL_FONT = '"Pixelify Sans", "Trebuchet MS", sans-serif';
const ARCADE_FONT = '"Press Start 2P", monospace';

/** Quanto dura a troca de cenário entre trechos da fase (segundos). */
const SCENE_FADE = 0.8;

/** Cores do chão provisório, enquanto as metatiles do cenário carregam. */
const THEMES = {
  grass:  { base: '#2f6d3a', alt: '#357a41', detail: '#4c9350' },
  forest: { base: '#1f4f31', alt: '#245a37', detail: '#37734a' },
  gym:    { base: '#4a4238', alt: '#544b40', detail: '#6b6052' },
  cave:   { base: '#2b2b3a', alt: '#333345', detail: '#454560' }
};

/** Desenha o mundo do jogo no canvas. */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = CONFIG.canvas.width;
    this.height = CONFIG.canvas.height;
    this.camera = { x: 0, y: 0 };
    this.patterns = new Map();
    this.scenery = new SceneryCache();
    this.ground = { run: null, scene: null, scenes: [], canvas: null, fadeFrom: null, fadeStart: 0 };
  }

  /** Textura de chão gerada uma vez por tema. */
  _pattern(theme) {
    if (this.patterns.has(theme)) return this.patterns.get(theme);
    const colors = THEMES[theme] ?? THEMES.grass;
    const size = 128;
    const tile = document.createElement('canvas');
    tile.width = tile.height = size;
    const c = tile.getContext('2d');

    c.fillStyle = colors.base;
    c.fillRect(0, 0, size, size);

    // manchas
    c.fillStyle = colors.alt;
    for (let i = 0; i < 18; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const r = 6 + Math.random() * 16;
      c.beginPath();
      c.ellipse(x, y, r, r * 0.65, Math.random() * Math.PI, 0, Math.PI * 2);
      c.fill();
    }
    // tufos
    c.strokeStyle = colors.detail;
    c.lineWidth = 2;
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + (Math.random() - 0.5) * 6, y - 4 - Math.random() * 5);
      c.stroke();
    }

    const pattern = this.ctx.createPattern(tile, 'repeat');
    this.patterns.set(theme, pattern);
    return pattern;
  }

  updateCamera(run) {
    const halfW = this.width / 2;
    const halfH = this.height / 2;
    // câmera em pixel inteiro: com ela quebrada, a pixel art "treme" ao andar
    this.camera.x = Math.round(clamp(run.player.x - halfW, 0, Math.max(0, run.world.width - this.width)));
    this.camera.y = Math.round(clamp(run.player.y - halfH, 0, Math.max(0, run.world.height - this.height)));
  }

  render(run) {
    const ctx = this.ctx;
    this.updateCamera(run);
    const cam = this.camera;

    ctx.clearRect(0, 0, this.width, this.height);

    // ---- chão ----
    ctx.save();
    ctx.fillStyle = '#05070e';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.translate(-cam.x, -cam.y);
    if (run.shakeTime > 0) {
      // tremor de tela (explosões, Earthquake, chefes), desligável em Opções
      const power = run.shakePower * (run.shakeTime / run.shakeDuration);
      ctx.translate(Math.round((Math.random() - 0.5) * 2 * power), Math.round((Math.random() - 0.5) * 2 * power));
    }
    this._drawGround(ctx, run);

    this._drawZones(ctx, run);
    this._drawPickups(ctx, run);
    this._drawActors(ctx, run);
    this._drawOrbs(ctx, run);
    this._drawProjectiles(ctx, run);
    this._drawEffects(ctx, run);
    this._drawParticles(ctx, run);
    ctx.restore();

    this._drawBossBar(ctx, run);
  }

  /* ----------------------------- camadas ----------------------------- */

  /**
   * Chão da fase: o cenário de metatiles do FireRed (render/scenery.js). Ao
   * mudar de trecho, o cenário anterior some aos poucos por cima do novo.
   * Enquanto a tira não carrega, fica o chão provisório do tema.
   */
  _drawGround(ctx, run) {
    const ground = this.ground;
    if (ground.run !== run) {
      Object.assign(ground, { run, scene: null, canvas: null, fadeFrom: null });
      ground.scenes = stageScenes(run.stage);
    }
    const canvas = this.scenery.get(run, run.world.scene);
    if (run.world.scene !== ground.scene && canvas) {
      ground.fadeFrom = ground.canvas;
      ground.fadeStart = performance.now();
      ground.scene = run.world.scene;
      ground.canvas = canvas;
    }
    this.scenery.warm(run, ground.scenes);

    if (!ground.canvas) {
      ctx.fillStyle = this._pattern(run.world.theme);
      ctx.fillRect(0, 0, run.world.width, run.world.height);
      ctx.strokeStyle = 'rgba(0,0,0,.45)';
      ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, run.world.width, run.world.height);
      return;
    }
    this._blitGround(ctx, ground.canvas, 1);
    if (ground.fadeFrom) {
      const t = (performance.now() - ground.fadeStart) / 1000 / SCENE_FADE;
      if (t >= 1) ground.fadeFrom = null;
      else this._blitGround(ctx, ground.fadeFrom, 1 - t);
    }
  }

  /** Copia do canvas do cenário só a parte que a câmera vê (com folga para o tremor). */
  _blitGround(ctx, canvas, alpha) {
    const scale = CONFIG.render.pixelScale;
    const margin = 48;
    const sx = Math.max(0, Math.floor((this.camera.x - margin) / scale));
    const sy = Math.max(0, Math.floor((this.camera.y - margin) / scale));
    const sw = Math.min(canvas.width - sx, Math.ceil((this.width + margin * 2) / scale) + 1);
    const sh = Math.min(canvas.height - sy, Math.ceil((this.height + margin * 2) / scale) + 1);
    if (sw <= 0 || sh <= 0) return;
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = alpha;
    ctx.drawImage(canvas, sx, sy, sw, sh, sx * scale, sy * scale, sw * scale, sh * scale);
    ctx.globalAlpha = 1;
  }

  /**
   * Áreas: aura (acompanha o Pokémon), zona no chão e onda (nova).
   * Com o sprite do golpe carregado, a cor do tipo vira só um fundo leve e os
   * sprites fazem o efeito; sem ele, fica o desenho de antes.
   */
  _drawZones(ctx, run) {
    for (const zone of run.zones) {
      if (zone.dead) continue;
      const color = zone.color ?? '#fff';
      const fx = zoneFx(zone);

      if (zone.kind === 'nova') {
        if (zone.delay > 0) { this._drawTelegraph(ctx, zone); continue; }
        const fade = Math.max(0, 1 - zone.radius / zone.maxRadius);
        ctx.strokeStyle = color;
        ctx.globalAlpha = fade * (fx ? 0.45 : 0.9);
        ctx.lineWidth = fx ? 4 : 8;
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        if (fx?.ring) {
          this._ringSprites(ctx, fx.ring, zone, zone.radius, fx.count ?? 10,
                            { alpha: Math.min(1, fade * 1.6), radial: true, turn: 0.4 });
        }
        continue;
      }

      const fadeIn = Math.min(1, zone.age / 0.2);
      const fadeOut = zone.life === Infinity ? 1 : Math.min(1, zone.life / 0.4);
      const fade = fadeIn * fadeOut;
      const pulse = 0.14 + Math.sin(zone.age * 5) * 0.03;
      ctx.globalAlpha = (pulse + (zone.kind === 'aura' ? 0.06 : 0.1)) * (fx ? 0.55 : 1) * fade;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.55 * fade * (fx ? 0.6 : 1);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;
      if (!fx) continue;

      if (fx.ring) {
        // aura: sprites ao longo da borda, girando devagar
        const count = Math.max(6, Math.min(16, Math.round((Math.PI * 2 * zone.radius) / 52)));
        this._ringSprites(ctx, fx.ring, zone, zone.radius, count, { alpha: fade, turn: 0.6 });
      }
      if (fx.center) drawFx(ctx, fx.center, zone.x, zone.y, { t: zone.age, alpha: fade });
      if (fx.scatter) {
        // zona: sprites espalhados pela área, em posições fixas por zona
        const count = Math.max(4, Math.min(12, Math.round((zone.radius * zone.radius) / 1100)));
        for (let i = 0; i < count; i++) {
          const a = zone.seed + i * 2.39996;   // ângulo de ouro: espalha sem amontoar
          const d = zone.radius * 0.82 * Math.sqrt((i + 0.5) / count);
          drawFx(ctx, fx.scatter, zone.x + Math.cos(a) * d, zone.y + Math.sin(a) * d,
                 { t: zone.age + i * 0.17, alpha: fade });
        }
      }
    }
  }

  /** Sprites distribuídos num círculo (bordas de aura, frente da onda). */
  _ringSprites(ctx, fxId, zone, radius, count, { alpha = 1, radial = false, turn = 0 } = {}) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + zone.age * turn;
      drawFx(ctx, fxId, zone.x + Math.cos(a) * radius, zone.y + Math.sin(a) * radius,
             { t: zone.age + i * 0.11, angle: radial ? a : 0, alpha });
    }
  }

  /**
   * Aviso no chão antes do golpe do líder: a área que a onda vai cobrir, com
   * um anel que cresce até a hora do golpe e o "X" do Rock Tomb no centro.
   */
  _drawTelegraph(ctx, zone) {
    const progress = 1 - zone.delay / (zone.delayTotal ?? CONFIG.fx.bossTelegraph);
    if (!zone.hostile) {
      // do jogador (2º golpe): o círculo na cor do tipo se fechando, sem o X
      ctx.save();
      ctx.strokeStyle = zone.color;
      ctx.globalAlpha = 0.35 + progress * 0.4;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.maxRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, Math.max(1, zone.maxRadius * (1 - progress)), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.fillStyle = '#ff3b30';
    ctx.globalAlpha = 0.1 + progress * 0.18;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.maxRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff6b5e';
    ctx.globalAlpha = 0.75;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, Math.max(1, zone.maxRadius * progress), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    drawFx(ctx, 'x_sign', zone.x, zone.y, { alpha: 0.45 + 0.45 * Math.abs(Math.sin(zone.age * 9)) });
  }

  _drawPickups(ctx, run) {
    for (const p of run.pickups) {
      if (p.dead) continue;
      const bob = Math.sin(p.bob) * 2;
      const item = ITEM_LOOKS[p.kind];
      if (item) {
        // brilho pulsando em volta e o sprite do item
        ctx.globalAlpha = 0.18 + Math.sin(p.age * 6) * 0.08;
        ctx.fillStyle = item.glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y + bob, item.ring, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.5 + Math.sin(p.age * 6) * 0.2;
        ctx.strokeStyle = item.glow;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
        const sheet = getSheet(item.sheet);
        if (sheet) {
          drawFrame(ctx, sheet, 0, p.x, p.y + bob, {
            scale: item.scale, anchorY: 0.5, rotation: item.wobble ? Math.sin(p.age * 2) * 0.3 : 0
          });
        } else if (p.kind === 'ball') {
          drawPokeball(ctx, p.x, p.y + bob, 22, Math.sin(p.age * 2) * 0.25);
        } else if (p.kind === 'heal') {
          ctx.fillStyle = '#57d18a';
          ctx.fillRect(p.x - 6, p.y + bob - 2, 12, 4);
          ctx.fillRect(p.x - 2, p.y + bob - 6, 4, 12);
        }
      } else {
        if (p.magnetized) {
          // rastro do XP voando até o treinador
          const dx = run.player.x - p.x;
          const dy = run.player.y - p.y;
          const d = Math.hypot(dx, dy) || 1;
          const tail = Math.min(26, 6 + p.pull * 0.012);
          ctx.globalAlpha = 0.45;
          ctx.strokeStyle = '#9fd4ff';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - (dx / d) * tail, p.y - (dy / d) * tail);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = '#63b3ff';
        ctx.beginPath();
        ctx.arc(p.x, p.y + bob, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(p.x, p.y + bob, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  /** Inimigos, Pokémon e treinador — desenhados de cima para baixo. */
  _drawActors(ctx, run) {
    const actors = [];
    for (const e of run.enemies) if (!e.dead) actors.push(e);
    for (const c of run.companions) if (!c.dead) actors.push(c);
    actors.push(run.player);
    actors.sort((a, b) => a.y - b.y);

    for (const actor of actors) {
      if (actor === run.player) { this._drawTrainer(ctx, run.player, run); continue; }

      if (actor.kind === 'enemy') {
        // inimigo
        const size = 42 * (actor.scale ?? 1);
        if (actor.enraged) {
          // fúria do líder: brilho vermelho pulsando embaixo dele
          ctx.globalAlpha = 0.25 + Math.sin(run.time * 8) * 0.1;
          ctx.fillStyle = '#ff3b30';
          ctx.beginPath();
          ctx.ellipse(actor.x, actor.y + size * 0.32, size * 0.8, size * 0.42, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        drawPokemon(ctx, actor.data.dex, actor.x, actor.y, size, {
          facing: actor.facing, types: actor.types, flash: actor.hitFlash, time: run.time + actor.animPhase
        });
        this._drawStatusMarks(ctx, actor, size);
        if (actor.elite || actor.boss) this._drawEnemyHp(ctx, actor, size);
      } else {
        // Pokémon da equipe
        const bob = Math.sin(actor.bob) * 2.5;
        const spawning = actor.spawnTime < 0.35;
        const blinking = actor.invulnTimer > 0 && Math.floor(actor.invulnTimer * 20) % 2 === 0;
        drawPokemon(ctx, actor.data.dex, actor.x, actor.y + bob, 46, {
          facing: actor.facing, types: actor.data.types, flash: actor.hitFlash, time: run.time + actor.animPhase,
          shiny: !!actor.member?.shiny,
          alpha: spawning ? actor.spawnTime / 0.35 : blinking ? 0.55 : 1
        });
        if (spawning) this._drawSendOut(ctx, actor);
        this._drawCompanionBar(ctx, actor, run);
      }
    }
  }

  /** Entrada em campo: a Poké Ball abre num clarão e o Pokémon aparece. */
  _drawSendOut(ctx, companion) {
    const k = companion.spawnTime / 0.35;
    ctx.save();
    ctx.globalAlpha = 1 - k;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(companion.x, companion.y, 8 + k * 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawPokeball(ctx, companion.x, companion.y + 14 - k * 18, 14, k * 7);
  }

  /** Barra de vida e nível do Pokémon em campo. */
  _drawCompanionBar(ctx, companion, run) {
    const max = maxHpFor(companion.member, run.playerStats.pokemonHpBonus);
    const ratio = Math.max(0, companion.member.hp / max);
    const w = 40;
    const x = companion.x - w / 2;
    const y = companion.y - 34;

    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillRect(x - 1, y - 1, w + 2, 6);
    ctx.fillStyle = ratio > 0.5 ? '#57d18a' : ratio > 0.25 ? '#f8d030' : '#e2574c';
    ctx.fillRect(x, y, w * ratio, 4);

    // o selo do nível cresce com o número (o nível não tem teto: 100, 150...)
    const label = `${companion.member.level}`;
    ctx.font = `8px ${ARCADE_FONT}`;
    ctx.textAlign = 'left';
    const bw = Math.max(17, ctx.measureText(label).width + 6);
    ctx.fillStyle = 'rgba(0,0,0,.65)';
    ctx.fillRect(x + w + 2 - bw, y - 11, bw, 10);
    ctx.fillStyle = '#ffcb05';
    ctx.fillText(label, x + w + 5 - bw, y - 3);
  }

  /** Status em cima do inimigo: queimadura, veneno e lentidão (sprite, ou bolinha). */
  _drawStatusMarks(ctx, enemy, size) {
    let i = 0;
    for (const status of STATUS_ORDER) {
      if (!enemy.status[status]) continue;
      const x = enemy.x - 8 + i * 12;
      const y = enemy.y - size * 0.45;
      if (!drawFx(ctx, STATUS_FX[status], x, y, { frame: 0, scale: 0.5 })) {
        ctx.fillStyle = STATUS_COLORS[status];
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      i++;
    }
  }

  _drawEnemyHp(ctx, enemy, size) {
    const w = size * 0.8;
    const ratio = Math.max(0, enemy.hp / enemy.maxHp);
    const y = enemy.y - size * 0.55;
    ctx.fillStyle = 'rgba(0,0,0,.6)';
    ctx.fillRect(enemy.x - w / 2, y, w, 4);
    ctx.fillStyle = enemy.boss ? '#ff5c5c' : '#ffcb05';
    ctx.fillRect(enemy.x - w / 2, y, w * ratio, 4);
  }

  /**
   * Treinador: o sprite do FireRed do modelo escolhido (Red ou Leaf) e o anel
   * do raio de coleta, que mostra até onde os orbes de XP são puxados.
   * Enquanto o sprite não carrega (ou offline), vale o desenho à mão.
   */
  _drawTrainer(ctx, player, run) {
    const { x, y } = player;

    // anel do raio de coleta
    const pickup = run?.playerStats?.pickupRadius ?? 0;
    if (pickup > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(99, 179, 255, .16)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.arc(x, y, pickup, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // sombra nos pés
    ctx.fillStyle = 'rgba(0,0,0,.34)';
    ctx.beginPath();
    ctx.ellipse(x, y + TRAINER_FEET - 1, 11, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const look = getTrainerLook(run?.trainerLook);
    const sheet = getSheet(look.sheet);
    if (!sheet) { this._drawTrainerFallback(ctx, player); return; }

    const { frame, flip } = trainerFrame(player, look);
    drawFrame(ctx, sheet, frame, x, y + TRAINER_FEET, { scale: CONFIG.render.pixelScale, flipX: flip });
  }

  /**
   * O treinador desenhado à mão, de antes dos sprites do FireRed. Fica para
   * quando a folha ainda não carregou: silhueta escura por baixo e boné
   * virado para onde você anda.
   */
  _drawTrainerFallback(ctx, player) {
    const { x, y } = player;
    const step = Math.sin(player.walkTime * 11);
    const bounce = player.moving ? Math.abs(step) * 1.6 : Math.sin(player.walkTime * 2) * 0.6;
    const f = player.facing;
    const top = y - bounce;
    const moving = player.moving;

    ctx.save();

    // contorno escuro (destaca o treinador em qualquer cenário)
    ctx.fillStyle = 'rgba(8, 12, 26, .85)';
    ctx.beginPath();
    ctx.roundRect?.(x - 9, top - 20, 18, 34, 6);
    if (!ctx.roundRect) ctx.rect(x - 9, top - 20, 18, 34);
    ctx.fill();

    // pernas
    ctx.fillStyle = '#20304f';
    const legSwing = moving ? step * 2.2 : 0;
    ctx.fillRect(x - 5, top + 7 + Math.max(0, legSwing), 4, 6 - Math.max(0, legSwing) * 0.4);
    ctx.fillRect(x + 1, top + 7 + Math.max(0, -legSwing), 4, 6 - Math.max(0, -legSwing) * 0.4);

    // mochila (fica do lado oposto ao que ele olha)
    ctx.fillStyle = '#1f7a4c';
    ctx.fillRect(x - f * 8, top - 3, 4, 9);

    // corpo: jaqueta azul com faixa branca
    ctx.fillStyle = '#2f62d9';
    ctx.fillRect(x - 7, top - 4, 14, 12);
    ctx.fillStyle = '#eef3ff';
    ctx.fillRect(x - 7, top + 1, 14, 3);

    // braços
    ctx.fillStyle = '#f2cfa6';
    const armSwing = moving ? step * 1.6 : 0;
    ctx.fillRect(x - 9, top - 2 + armSwing, 3, 7);
    ctx.fillRect(x + 6, top - 2 - armSwing, 3, 7);

    // cabeça
    ctx.fillStyle = '#f2cfa6';
    ctx.beginPath();
    ctx.arc(x, top - 10, 7, 0, Math.PI * 2);
    ctx.fill();

    // cabelo saindo do boné
    ctx.fillStyle = '#2b2118';
    ctx.fillRect(x - 7, top - 9, 14, 2);

    // boné vermelho com aba na direção do movimento
    ctx.fillStyle = '#e8342c';
    ctx.beginPath();
    ctx.arc(x, top - 11, 7.5, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x - 7.5, top - 12, 15, 3);
    ctx.fillRect(f >= 0 ? x + 2 : x - 11, top - 12, 9, 2.5);
    // frente branca do boné
    ctx.fillStyle = '#f6f8ff';
    ctx.beginPath();
    ctx.arc(x + f * 1.5, top - 13.5, 2.6, 0, Math.PI * 2);
    ctx.fill();

    // olhos
    ctx.fillStyle = '#131a2e';
    ctx.fillRect(x + f * 1 - 1, top - 9.5, 2, 2.5);
    ctx.fillRect(x + f * 4 - 1, top - 9.5, 2, 2.5);

    ctx.restore();
  }

  _drawOrbs(ctx, run) {
    for (const orb of run.orbs) {
      if (orb.dead) continue;
      const fx = abilityFx(orb.abilityId);
      if (fx?.body && drawFx(ctx, fx.body, orb.x, orb.y,
          { t: run.time + orb.angle, scale: sizeScale(orb.abilityId, orb.size) })) continue;
      const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.size);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.45, orb.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawProjectiles(ctx, run) {
    for (const p of run.projectiles) {
      if (p.dead) continue;
      if (p.hostile) { this._drawHostileShot(ctx, p); continue; }
      const fx = abilityFx(p.abilityId);
      // rastro curto na cor do tipo
      ctx.globalAlpha = fx ? 0.22 : 0.35;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size * 0.9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.globalAlpha = 1;

      if (fx?.body && drawFx(ctx, fx.body, p.x, p.y,
          { t: p.age, angle: Math.atan2(p.vy, p.vx), scale: sizeScale(p.abilityId, p.size) })) continue;

      // reserva: bola de luz na cor do tipo
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, p.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** Projétil de líder: um halo vermelho por baixo diz "isso machuca você". */
  _drawHostileShot(ctx, p) {
    ctx.globalAlpha = 0.35 + Math.sin(p.age * 18) * 0.12;
    ctx.fillStyle = '#ff3b30';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 1.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    if (p.sprite && drawFx(ctx, p.sprite, p.x, p.y, { t: p.age, angle: Math.atan2(p.vy, p.vx) })) return;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawEffects(ctx, run) {
    for (const fx of run.effects) {
      if (fx.dead) continue;
      const t = fx.life / fx.maxLife;

      if (fx instanceof SpriteFx) {
        drawFx(ctx, fx.fxId, fx.x, fx.y, { progress: 1 - t, scale: fx.scale, angle: fx.angle });
      } else if (fx instanceof Beam) {
        this._drawBeam(ctx, fx, t);
      } else if (fx instanceof SlashArc) {
        const vfx = abilityFx(fx.abilityId);
        ctx.globalAlpha = t * (vfx ? 0.35 : 0.8);
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = vfx ? 5 : 9;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.range * (1.1 - t * 0.25), fx.angle - fx.arc / 2, fx.angle + fx.arc / 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        if (vfx?.slash) {
          const reach = fx.range * 0.72;
          drawFx(ctx, vfx.slash, fx.x + Math.cos(fx.angle) * reach, fx.y + Math.sin(fx.angle) * reach,
                 { progress: 1 - t, angle: fx.angle });
        }
      } else if (fx instanceof FloatingText) {
        ctx.globalAlpha = Math.min(1, t * 1.6);
        ctx.font = `700 ${Math.round(fx.size * 1.15)}px ${PIXEL_FONT}`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0,0,0,.75)';
        ctx.strokeText(fx.text, fx.x, fx.y);
        ctx.fillStyle = fx.color;
        ctx.fillText(fx.text, fx.x, fx.y);
        ctx.globalAlpha = 1;
      }
    }
  }

  /**
   * Raio entre os alvos: zigue-zague que muda a cada quadro, como faísca, com
   * o sprite do golpe em cada alvo e, no Thunder, o raio caindo do céu.
   */
  _drawBeam(ctx, beam, t) {
    const pts = beam.points;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const steps = Math.max(2, Math.round(len / 26));
      for (let k = 1; k < steps; k++) {
        const jitter = (Math.random() - 0.5) * 18;
        ctx.lineTo(a.x + (dx * k) / steps - (dy / len) * jitter, a.y + (dy * k) / steps + (dx / len) * jitter);
      }
      ctx.lineTo(b.x, b.y);
    }
    ctx.globalAlpha = t;
    ctx.strokeStyle = beam.color;
    ctx.lineWidth = beam.width + 2;
    ctx.stroke();
    ctx.globalAlpha = t * 0.85;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.5, beam.width * 0.4);
    ctx.stroke();
    ctx.restore();

    const vfx = abilityFx(beam.abilityId);
    if (!vfx) return;
    for (let i = 1; i < pts.length; i++) drawFx(ctx, vfx.node, pts[i].x, pts[i].y, { progress: 1 - t });
    if (vfx.strike && pts[1]) drawFx(ctx, vfx.strike, pts[1].x, pts[1].y + 10, { alpha: t });
  }

  _drawParticles(ctx, run) {
    for (const p of run.particles) {
      if (p.dead) continue;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  /** Barra de vida do chefe, fixa no topo da tela. */
  _drawBossBar(ctx, run) {
    const boss = run.boss;
    if (!boss) return;
    const w = this.width * 0.5;
    const x = (this.width - w) / 2;
    const y = 96;

    ctx.save();
    ctx.fillStyle = 'rgba(8,12,24,.8)';
    ctx.fillRect(x - 3, y - 3, w + 6, 20);
    ctx.fillStyle = '#3a1111';
    ctx.fillRect(x, y, w, 14);
    ctx.fillStyle = '#ff5c5c';
    ctx.fillRect(x, y, w * Math.max(0, boss.hp / boss.maxHp), 14);
    ctx.strokeStyle = typeColor(boss.types[0]);
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, 14);
    // marca da fúria (metade da vida)
    const rageX = x + w * CONFIG.enemies.boss.enrageAt;
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.fillRect(rageX - 1, y - 2, 2, 18);

    ctx.font = `11px ${ARCADE_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText(boss.data.name + (boss.enraged ? ' — furioso!' : ''), this.width / 2, y - 8);
    ctx.restore();
  }
}
