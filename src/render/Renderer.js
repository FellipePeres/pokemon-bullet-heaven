import { CONFIG } from '../core/config.js';
import { clamp } from '../core/utils.js';
import { drawPokemon, drawPokeball } from './sprites.js';
import { typeColor } from '../data/types.js';
import { FloatingText, Beam, SlashArc } from '../entities/effects.js';
import { maxHpFor } from '../systems/stats.js';

/** Cores de fundo por tema de fase. */
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
    this.camera.x = clamp(run.player.x - halfW, 0, Math.max(0, run.world.width - this.width));
    this.camera.y = clamp(run.player.y - halfH, 0, Math.max(0, run.world.height - this.height));
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
    ctx.fillStyle = this._pattern(run.world.theme);
    ctx.fillRect(0, 0, run.world.width, run.world.height);

    // limite da arena
    ctx.strokeStyle = 'rgba(0,0,0,.45)';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, run.world.width, run.world.height);

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

  _drawZones(ctx, run) {
    for (const zone of run.zones) {
      if (zone.dead) continue;
      const color = zone.color ?? '#fff';
      if (zone.kind === 'nova') {
        const progress = zone.radius / zone.maxRadius;
        ctx.strokeStyle = color;
        ctx.globalAlpha = Math.max(0, 1 - progress) * 0.9;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        continue;
      }
      const pulse = 0.14 + Math.sin(zone.age * 5) * 0.03;
      ctx.globalAlpha = pulse + (zone.kind === 'aura' ? 0.06 : 0.1);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  _drawPickups(ctx, run) {
    for (const p of run.pickups) {
      if (p.dead) continue;
      const bob = Math.sin(p.bob) * 2;
      if (p.kind === 'ball') {
        drawPokeball(ctx, p.x, p.y + bob, 22, Math.sin(p.age * 2) * 0.25);
        ctx.globalAlpha = 0.35 + Math.sin(p.age * 6) * 0.15;
        ctx.strokeStyle = '#ffcb05';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y + bob, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (p.kind === 'heal') {
        ctx.fillStyle = '#57d18a';
        ctx.fillRect(p.x - 6, p.y + bob - 2, 12, 4);
        ctx.fillRect(p.x - 2, p.y + bob - 6, 4, 12);
      } else {
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
        drawPokemon(ctx, actor.data.dex, actor.x, actor.y, size, {
          facing: -actor.facing, types: actor.types, flash: actor.hitFlash
        });
        this._drawStatusMarks(ctx, actor, size);
        if (actor.elite || actor.boss) this._drawEnemyHp(ctx, actor, size);
      } else {
        // Pokémon da equipe
        const bob = Math.sin(actor.bob) * 2.5;
        const spawning = actor.spawnTime < 0.35;
        const blinking = actor.invulnTimer > 0 && Math.floor(actor.invulnTimer * 20) % 2 === 0;
        drawPokemon(ctx, actor.data.dex, actor.x, actor.y + bob, 46, {
          facing: actor.facing, types: actor.data.types, flash: actor.hitFlash,
          alpha: spawning ? actor.spawnTime / 0.35 : blinking ? 0.55 : 1
        });
        this._drawCompanionBar(ctx, actor, run);
      }
    }
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

    ctx.font = 'bold 9px Trebuchet MS, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0,0,0,.65)';
    ctx.fillRect(x + w - 15, y - 11, 17, 10);
    ctx.fillStyle = '#ffcb05';
    ctx.fillText(`${companion.member.level}`, x + w - 12, y - 3);
  }

  _drawStatusMarks(ctx, enemy, size) {
    const marks = [];
    if (enemy.status.burn) marks.push('#ff7a3d');
    if (enemy.status.poison) marks.push('#c060d0');
    if (enemy.status.slow) marks.push('#63b3ff');
    marks.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(enemy.x - 8 + i * 8, enemy.y - size * 0.4, 3, 0, Math.PI * 2);
      ctx.fill();
    });
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

  /** Treinador desenhado proceduralmente (sem depender de arte externa). */
  /**
   * Treinador desenhado à mão no canvas (os repositórios de sprites não têm
   * treinadores). Ele não luta, então o desenho prioriza legibilidade:
   * silhueta escura por baixo, boné vermelho virado para onde você anda e o
   * anel do raio de coleta, que mostra até onde os orbes de XP são puxados.
   */
  _drawTrainer(ctx, player, run) {
    const { x, y } = player;
    const moving = Math.abs(player.vx) + Math.abs(player.vy) > 1;
    const step = Math.sin(player.walkTime * 11);
    const bounce = moving ? Math.abs(step) * 1.6 : Math.sin(player.walkTime * 2) * 0.6;
    const f = player.facing;
    const top = y - bounce;

    ctx.save();

    // anel do raio de coleta
    const pickup = run?.playerStats?.pickupRadius ?? 0;
    if (pickup > 0) {
      ctx.strokeStyle = 'rgba(99, 179, 255, .16)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.arc(x, y, pickup, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // sombra
    ctx.fillStyle = 'rgba(0,0,0,.34)';
    ctx.beginPath();
    ctx.ellipse(x, y + 15, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

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
      // rastro
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size * 0.9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.globalAlpha = 1;

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

  _drawEffects(ctx, run) {
    for (const fx of run.effects) {
      if (fx.dead) continue;
      const t = fx.life / fx.maxLife;

      if (fx instanceof Beam) {
        ctx.globalAlpha = t;
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = fx.width;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        fx.points.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
        ctx.stroke();
        ctx.globalAlpha = t * 0.6;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = fx.width * 0.4;
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (fx instanceof SlashArc) {
        ctx.globalAlpha = t * 0.8;
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.range * (1.1 - t * 0.25), fx.angle - fx.arc / 2, fx.angle + fx.arc / 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (fx instanceof FloatingText) {
        ctx.globalAlpha = Math.min(1, t * 1.6);
        ctx.font = `bold ${fx.size}px Trebuchet MS, sans-serif`;
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

    ctx.font = 'bold 13px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText(boss.data.name.toUpperCase(), this.width / 2, y - 8);
    ctx.restore();
  }
}
