import { CONFIG } from '../core/config.js';
import { getStage, segmentAt } from '../data/stages.js';
import { Player } from '../entities/Player.js';
import { Companion } from '../entities/Companion.js';
import { SpatialGrid } from '../systems/SpatialGrid.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { AbilitySystem } from '../systems/AbilitySystem.js';
import { ProgressionSystem } from '../systems/ProgressionSystem.js';
import { TeamSystem } from '../systems/TeamSystem.js';
import { CaptureSystem } from '../systems/CaptureSystem.js';
import { damageEnemy, damageArea } from '../systems/combat.js';
import { burst, FloatingText } from '../entities/effects.js';
import { bus, EVENTS } from '../core/events.js';
import { typeColor } from '../data/types.js';
import { maxHpFor } from '../systems/stats.js';

/**
 * RUN — uma partida em uma fase.
 *
 * Concentra o estado do combate e chama os sistemas na ordem certa.
 * Regras de conteúdo vêm de /data; comportamento genérico vem de /systems.
 *
 * Quem tem vida e nível são os Pokémon: o treinador apenas guia a equipe.
 * A fase é perdida quando os 6 Pokémon desmaiam.
 */
export class Run {
  constructor(stageId, options = {}) {
    this.stage = getStage(stageId);
    if (!this.stage) throw new Error(`Fase desconhecida: ${stageId}`);

    this.world = { ...this.stage.world };
    this.time = 0;
    this.state = 'running';   // running | levelup | capture | paused | victory | defeat
    this.objective = 'SOBREVIVA';

    // ---- entidades ----
    this.player = new Player(this.world.width / 2, this.world.height / 2);
    this.companions = [];
    this.enemies = [];
    this.projectiles = [];
    this.orbs = [];
    this.zones = [];
    this.pickups = [];
    this.effects = [];
    this.particles = [];

    // ---- progressão ----
    // Melhorias de habilidade ficam em cada Pokémon; os bônus globais vêm das
    // melhorias do treinador compradas com moedas (progresso permanente).
    this.trainerUpgrades = { ...(options.trainerUpgrades ?? {}) };
    this.upgrades = {};                        // mantido para compatibilidade de save
    this.segment = segmentAt(this.stage, 0);
    this.evolutionQueue = [];
    this.stats = { kills: 0, captures: 0, damageDealt: 0, faints: 0, ballsDropped: 0 };

    // ---- sistemas ----
    this.grid = new SpatialGrid(100);
    this.progression = new ProgressionSystem(this);
    this.playerStats = this.progression.computePlayerStats();
    this.team = new TeamSystem(this);
    this.captureSystem = new CaptureSystem(this);
    this.abilitySystem = new AbilitySystem(this);

    // ---- equipe inicial ----
    if (options.team) this.team.restore(options.team, { healAll: options.healTeam !== false });
    else if (options.starter) this.team.add(options.starter);
    this.syncCompanions();

    this.spawner = new SpawnSystem(this);
    this.refreshStats();

    this.pendingBall = false;
    this.levelUpMember = null;   // Pokémon que está com a tela de melhoria aberta
  }

  /* ================= equipe e companheiros ================= */

  /** Mantém a lista de Pokémon em campo alinhada com os slots ativos da equipe. */
  syncCompanions() {
    const active = this.team.active;
    const next = [];

    active.forEach((member, slot) => {
      if (!member || member.fainted) return;
      const existing = this.companions.find((c) => c.member.uid === member.uid && !c.dead);
      if (existing) {
        existing.slotIndex = slot;
        next.push(existing);
      } else {
        const c = new Companion(member, this.player.x, this.player.y, slot);
        burst(this.particles, this.player.x, this.player.y, typeColor(c.data.types[0]), 14, 180, 3, 0.5);
        next.push(c);
      }
    });

    // quem saiu de campo "morre": auras e orbes ligados a ele somem junto
    for (const c of this.companions) {
      if (!next.includes(c)) c.dead = true;
    }

    this.companions = next;
    this.rebuildCompanionAbilities();
  }

  /**
   * Sincroniza as instâncias de habilidade com a lista do Pokémon.
   * Adiciona as novas (evolução de habilidade) e remove as que saíram
   * (troca por TM), derrubando auras e orbes que pertenciam a elas.
   */
  rebuildCompanionAbilities() {
    for (const companion of this.companions) {
      const wanted = companion.member.abilities;

      for (let i = companion.abilities.length - 1; i >= 0; i--) {
        const inst = companion.abilities[i];
        if (wanted.includes(inst.abilityId)) continue;
        if (inst.runtime.zone) inst.runtime.zone.dead = true;
        if (inst.runtime.orbs) inst.runtime.orbs.forEach((orb) => { orb.dead = true; });
        companion.abilities.splice(i, 1);
      }

      for (const abilityId of wanted) {
        if (companion.abilities.some((a) => a.abilityId === abilityId)) continue;
        companion.abilities.push({ abilityId, timer: 0, stats: null, effects: null, runtime: {} });
      }
    }
    if (this.abilitySystem) this.abilitySystem.refresh();
  }

  /** Guarda uma evolução para a interface mostrar (a partida pausa nela). */
  queueEvolution(payload) {
    this.evolutionQueue.push(payload);
    // o companheiro em campo precisa refletir a espécie nova
    const companion = this.companions.find((c) => c.member.uid === payload.member.uid);
    if (companion) {
      companion.pokemonId = payload.member.pokemonId;
      companion.data = payload.to;
    }
    this.refreshStats();
  }

  /** Recalcula stats da equipe e de todas as habilidades. */
  refreshStats() {
    this.playerStats = this.progression.computePlayerStats();
    this.abilitySystem.refresh();
    // o bônus de vida de upgrades aumenta o teto sem curar de graça
    for (const member of this.team.members) {
      member.hp = Math.min(member.hp, maxHpFor(member, this.playerStats.pokemonHpBonus));
    }
  }

  /** Pokémon ativo mais próximo de um ponto (quem "leva" o golpe). */
  nearestCompanion(x, y) {
    let best = null;
    let bestD = Infinity;
    for (const c of this.companions) {
      if (c.dead || c.member.fainted) continue;
      const d = (c.x - x) ** 2 + (c.y - y) ** 2;
      if (d < bestD) { bestD = d; best = c; }
    }
    return best;
  }

  /** Aplica dano a um Pokémon e trata o desmaio. */
  damageCompanion(companion, amount) {
    if (!companion) return;
    const result = companion.takeDamage(amount);
    if (!result) return;

    this.effects.push(new FloatingText(companion.x, companion.y - 26, `-${Math.round(amount)}`, '#ff6b6b', 13));

    if (result === 'fainted') {
      this.stats.faints++;
      companion.dead = true;
      burst(this.particles, companion.x, companion.y, '#ffffff', 18, 200, 3, 0.7);
      this.team.handleFaint(companion.member);
    }
  }

  /* ========================= loop ========================= */

  update(dt, move) {
    if (this.state !== 'running') return;

    this.time += dt;
    this.grid.rebuild(this.enemies);

    this.player.update(dt, move, this.playerStats, this.world);
    this.team.update(dt);

    for (const companion of this.companions) {
      companion.update(dt, this.player, this.team.active.length, this.playerStats);
    }

    this.abilitySystem.update(dt);
    this.spawner.update(dt);

    // trecho atual da jornada (muda o cenário e o texto do HUD)
    const segment = segmentAt(this.stage, this.time);
    if (segment !== this.segment) {
      this.segment = segment;
      this.world.theme = segment.theme ?? this.world.theme;
      bus.emit(EVENTS.TOAST, { text: `Você chegou em ${segment.name}`, icon: 'stages' });
    }

    this._updateEnemies(dt);
    this._updateProjectiles(dt);
    this._updateOrbs(dt);
    this._updateZones(dt);
    this._updatePickups(dt);
    this._updateEffects(dt);
    this._cleanup();
    this._checkState();
  }

  _updateEnemies(dt) {
    const player = this.player;
    const neighbors = [];

    for (const enemy of this.enemies) {
      if (enemy.dead) continue;

      const dot = enemy.update(dt, player, this.world);
      if (dot > 0) damageEnemy(this, enemy, dot, { silent: true });
      if (enemy.dead) continue;

      if (enemy.boss) this.spawner.updateBoss(enemy, dt);

      // separação simples para os inimigos não empilharem no mesmo ponto
      this.grid.query(enemy.x, enemy.y, enemy.radius * 2.2, neighbors);
      let pushX = 0, pushY = 0, count = 0;
      for (const other of neighbors) {
        if (other === enemy || other.dead) continue;
        const dx = enemy.x - other.x;
        const dy = enemy.y - other.y;
        const d = Math.hypot(dx, dy);
        const min = enemy.radius + other.radius;
        if (d > 0 && d < min) {
          pushX += (dx / d) * (min - d);
          pushY += (dy / d) * (min - d);
          if (++count >= 6) break;
        }
      }
      if (count) {
        enemy.x += pushX * 6 * dt;
        enemy.y += pushY * 6 * dt;
      }

      this._enemyAttack(enemy);
    }
  }

  /**
   * O inimigo golpeia o Pokémon em que encostar.
   * Se alcançar o treinador, o Pokémon ativo mais próximo o defende e leva o dano —
   * o treinador nunca perde vida porque ele não tem vida.
   */
  _enemyAttack(enemy) {
    let victim = null;

    for (const companion of this.companions) {
      if (companion.dead || companion.member.fainted) continue;
      const dx = companion.x - enemy.x;
      const dy = companion.y - enemy.y;
      if (dx * dx + dy * dy < (companion.radius + enemy.radius) ** 2) { victim = companion; break; }
    }

    if (!victim) {
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      if (dx * dx + dy * dy < (this.player.radius + enemy.radius) ** 2) {
        victim = this.nearestCompanion(enemy.x, enemy.y);
      }
    }

    if (!victim || !enemy.tryAttack()) return;

    this.damageCompanion(victim, enemy.damage);
    const dx = victim.x - enemy.x;
    const dy = victim.y - enemy.y;
    const d = Math.hypot(dx, dy) || 1;
    enemy.knockback(-dx / d, -dy / d, 130);
  }

  _updateProjectiles(dt) {
    const findTarget = (x, y, range) => {
      let best = null, bestD = range * range;
      for (const e of this.grid.query(x, y, range)) {
        if (e.dead) continue;
        const dx = e.x - x, dy = e.y - y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD) { bestD = d2; best = e; }
      }
      return best;
    };

    for (const p of this.projectiles) {
      if (p.dead) continue;
      p.update(dt, findTarget, this.world);
      const expired = p.dead;

      for (const enemy of this.grid.query(p.x, p.y, p.size + 30)) {
        if (enemy.dead || p.hits.has(enemy)) continue;
        const dx = enemy.x - p.x, dy = enemy.y - p.y;
        const r = enemy.radius + p.size;
        if (dx * dx + dy * dy > r * r) continue;

        p.hits.add(enemy);
        damageEnemy(this, enemy, p.damage, {
          type: p.type, effects: p.effects, knockback: p.knockback,
          from: { x: p.x - p.vx * 0.01, y: p.y - p.vy * 0.01 }
        });
        burst(this.particles, p.x, p.y, p.color, 3, 90, 2, 0.25);

        if (p.pierce > 0) p.pierce--;
        else { p.dead = true; break; }
      }

      // explosão ao acabar (Rock Throw e afins)
      if (p.dead && p.explode && (expired || p.hits.size)) {
        damageArea(this, p.x, p.y, p.explode.area, p.damage * p.explode.ratio, {
          type: p.type, effects: p.effects, knockback: 120
        });
        burst(this.particles, p.x, p.y, p.color, 16, 220, 4, 0.5);
        p.explode = null;
      }
    }
  }

  _updateOrbs(dt) {
    for (const orb of this.orbs) {
      if (orb.dead) continue;
      orb.update(dt);
      if (orb.dead) continue;

      for (const enemy of this.grid.query(orb.x, orb.y, orb.size + 30)) {
        if (enemy.dead || orb.cooldowns.has(enemy)) continue;
        const dx = enemy.x - orb.x, dy = enemy.y - orb.y;
        const r = enemy.radius + orb.size;
        if (dx * dx + dy * dy > r * r) continue;

        orb.cooldowns.set(enemy, orb.tickRate);
        damageEnemy(this, enemy, orb.damage, {
          type: orb.type, effects: orb.effects, knockback: orb.knockback,
          from: { x: orb.owner.x, y: orb.owner.y }
        });
      }
    }
  }

  _updateZones(dt) {
    for (const zone of this.zones) {
      if (zone.dead) continue;
      zone.update(dt);

      if (zone.kind === 'nova') {
        if (zone.hostile) {
          // a onda do chefe atinge os Pokémon em campo, não o treinador
          for (const companion of this.companions) {
            if (companion.dead || zone.hits.has(companion)) continue;
            const d = Math.hypot(companion.x - zone.x, companion.y - zone.y);
            if (d > zone.radius) continue;
            zone.hits.add(companion);
            this.damageCompanion(companion, zone.damage);
          }
          continue;
        }
        for (const enemy of this.grid.query(zone.x, zone.y, zone.radius)) {
          if (enemy.dead || zone.hits.has(enemy)) continue;
          const d = Math.hypot(enemy.x - zone.x, enemy.y - zone.y);
          if (d > zone.radius) continue;
          zone.hits.add(enemy);
          damageEnemy(this, enemy, zone.damage, {
            type: zone.type, effects: zone.effects,
            knockback: zone.knockback, from: { x: zone.x, y: zone.y }
          });
        }
        continue;
      }

      // auras e zonas de chão causam dano em intervalos
      if (!zone.readyToTick(dt)) continue;
      for (const enemy of this.grid.query(zone.x, zone.y, zone.radius)) {
        if (enemy.dead) continue;
        const dx = enemy.x - zone.x, dy = enemy.y - zone.y;
        if (dx * dx + dy * dy > zone.radius * zone.radius) continue;
        damageEnemy(this, enemy, zone.damage, {
          type: zone.type, effects: zone.effects, silent: Math.random() > 0.35,
          knockback: zone.knockback, from: { x: zone.x, y: zone.y }
        });
      }
    }
  }

  _updatePickups(dt) {
    const stats = this.playerStats;
    for (const pickup of this.pickups) {
      if (pickup.dead) continue;
      const collected = pickup.update(dt, this.player, stats.pickupRadius, CONFIG.trainer.magnetSpeed);
      if (!collected) continue;

      pickup.dead = true;
      if (pickup.kind === 'xp') {
        this.progression.addXp(pickup.value);
      } else if (pickup.kind === 'heal') {
        // a poção cura todos os Pokémon em campo
        for (const companion of this.companions) {
          if (!companion.dead) companion.heal(pickup.value, stats.pokemonHpBonus);
        }
        burst(this.particles, this.player.x, this.player.y, '#57d18a', 10, 120, 3, 0.5);
      } else if (pickup.kind === 'ball') {
        this.pendingBall = true;
        bus.emit(EVENTS.BALL_PICKED, {});
      }
    }
  }

  _updateEffects(dt) {
    for (const e of this.effects) e.update(dt);
    for (const p of this.particles) p.update(dt);
  }

  _cleanup() {
    const alive = (arr) => {
      let w = 0;
      for (let i = 0; i < arr.length; i++) if (!arr[i].dead) arr[w++] = arr[i];
      arr.length = w;
    };
    alive(this.enemies);
    alive(this.projectiles);
    alive(this.orbs);
    alive(this.zones);
    alive(this.pickups);
    alive(this.effects);
    alive(this.particles);
  }

  _checkState() {
    if (this.team.allFainted) {
      this.state = 'defeat';
      bus.emit(EVENTS.STAGE_FAILED, { stage: this.stage });
      return;
    }
    if (this.spawner.leaderDefeated) {
      this.state = 'victory';
      bus.emit(EVENTS.STAGE_CLEARED, { stage: this.stage });
      return;
    }
    if (this.evolutionQueue.length) { this.state = 'evolution'; return; }
    if (this.pendingBall) { this.state = 'capture'; return; }

    // Pokémon ativo que subiu de nível pausa o jogo na hora.
    // Os da reserva acumulam e sobem quando o jogador quiser (botão ↑).
    const ready = this.team.activeMembers.find((m) => m.pendingLevels > 0 && !m.fainted);
    if (ready) {
      this.levelUpMember = ready;
      this.state = 'levelup';
    }
  }

  /** Nome do trecho atual da jornada. */
  get segmentName() {
    return this.segment?.name ?? this.stage.name;
  }

  /** Tempo restante até o líder aparecer. */
  get timeToBoss() {
    return Math.max(0, this.stage.duration - this.time);
  }

  get boss() {
    return this.spawner.boss && !this.spawner.boss.dead ? this.spawner.boss : null;
  }

  /* ======================= save ======================= */

  /** Fotografia da partida para o arquivo de save. */
  serialize() {
    return {
      stageId: this.stage.id,
      time: Math.round(this.time),
      trainerUpgrades: { ...this.trainerUpgrades },
      team: this.team.serialize(),
      stats: { ...this.stats }
    };
  }
}
