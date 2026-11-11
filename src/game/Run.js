import { CONFIG } from '../core/config.js';
import { getStage, segmentAt } from '../data/stages.js';
import { sceneOf } from '../data/scenery.js';
import { Player, FEET_BOX } from '../entities/Player.js';
import { Terrain } from '../systems/terrain.js';
import { Zone } from '../entities/zones.js';
import { Companion } from '../entities/Companion.js';
import { SpatialGrid } from '../systems/SpatialGrid.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { AbilitySystem } from '../systems/AbilitySystem.js';
import { ProgressionSystem } from '../systems/ProgressionSystem.js';
import { TeamSystem } from '../systems/TeamSystem.js';
import { CaptureSystem } from '../systems/CaptureSystem.js';
import { damageEnemy, damageArea, bonusHeal } from '../systems/combat.js';
import { burst, FloatingText, SpriteFx } from '../entities/effects.js';
import { updateSignatures } from '../systems/signatureMoves.js';
import { abilityFx, zoneFx } from '../data/fx.js';
import { bus, EVENTS } from '../core/events.js';
import { typeColor, defenseMultiplier } from '../data/types.js';
import { getPokemon } from '../data/pokemon.js';
import { maxHpFor } from '../systems/stats.js';
import { KyogreFight } from '../systems/kyogreFight.js';
import { weatherMultiplier } from '../systems/combat.js';

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
    this.state = 'running';   // running | levelup | capture | paused | victory | defeat | intro
    this.objective = 'SOBREVIVA';

    // ---- entidades ----
    this.player = new Player(this.world.width / 2, this.world.height / 2);
    this.trainerLook = options.trainer ?? null;   // modelo do sprite (data/trainers.js)
    this.campaignStarter = options.campaignStarter ?? options.starter ?? null;   // o rival monta o time por ele
    this.companions = [];
    this.enemies = [];
    this.projectiles = [];
    this.orbs = [];
    this.zones = [];
    this.pickups = [];
    this.effects = [];
    this.particles = [];
    this.signatures = [];      // golpes exclusivos dos lendários (systems/signatureMoves.js)

    // ---- progressão ----
    // Melhorias de habilidade ficam em cada Pokémon. (As melhorias do treinador,
    // compradas com Shards, saíram na 0.21.)
    this.upgrades = {};                        // mantido para compatibilidade de save
    this.segment = segmentAt(this.stage, 0);
    this.world.scene = sceneOf(this.segment, this.world);
    // árvores, pedras e paredes do cenário bloqueiam o treinador e os inimigos
    this.terrain = new Terrain(this.stage, this.world);
    this.world.terrain = this.terrain;
    this._settleTerrain();
    this.evolutionQueue = [];
    this.stats = { kills: 0, captures: 0, damageDealt: 0, faints: 0, ballsDropped: 0, shards: 0 };
    // Pokémon mandados para o PC nesta partida (vão para o PC da jornada se a fase for vencida)
    this.pc = [...(options.pc ?? [])];
    // espécies que a jornada já tem fora da equipe (o PC do lobby): um lendário
    // que está lá não volta na Poké Ball (0.18, um de cada)
    this.ownedElsewhere = new Set(options.ownedElsewhere ?? []);
    this.legendariesOffered = new Set();   // os que já apareceram nesta tentativa
    // buffs dos 2º golpes na equipe: Tailwind (treinador mais rápido) e Reflect (menos dano)
    this.buffs = { tailwind: 0, reflect: 0 };

    // ---- sistemas ----
    this.grid = new SpatialGrid(100);
    this.progression = new ProgressionSystem(this);
    this.playerStats = this.progression.computePlayerStats();
    this.team = new TeamSystem(this);
    this.captureSystem = new CaptureSystem(this);
    this.abilitySystem = new AbilitySystem(this);

    // ---- equipe inicial ----
    if (options.team) this.team.restore(options.team, { healAll: options.healTeam !== false });
    else if (options.starter) this.team.add(options.starter, 1, { shiny: !!options.starterShiny });
    this.syncCompanions();

    this.spawner = new SpawnSystem(this);
    this.refreshStats();
    // a luta do Kyogre (0.37): o que só ela tem, por cima da fase de sempre
    this.fight = this.stage.legendaryFight ? new KyogreFight(this) : null;

    this.pendingBall = false;
    this.pendingGift = null;     // presente da fase esperando a escolha (ver stage.gifts)
    this.pendingIntro = null;    // líder que acabou de chegar e se apresenta
    this.levelUpMember = null;   // Pokémon que está com a tela de melhoria aberta
    this.unlockQueue = [];       // Golpes Despertos esperando o anúncio ({ member, moveId })

    // ---- efeitos ----
    this.shakeTime = 0;
    this.shakeDuration = 1;
    this.shakePower = 0;
    this.fxBudget = 0;           // sprites de acerto que ainda cabem neste quadro
  }

  /** Tremor de tela (o Renderer aplica). Desligável em Opções. */
  shake(power, duration = 0.25) {
    if (!CONFIG.fx.screenShake) return;
    if (this.shakeTime <= 0 || power >= this.shakePower) {
      this.shakePower = power;
      this.shakeDuration = duration;
      this.shakeTime = duration;
    }
  }

  /**
   * Sprite de golpe que toca uma vez (acertos, explosões). Tem teto por quadro
   * e no total: com a horda grande, o excesso é só ruído e pesa no navegador.
   * Devolve false quando não coube (quem chamou pode usar partículas).
   */
  spawnFx(x, y, fxId, opts) {
    if (!fxId || this.fxBudget <= 0 || this.effects.length >= CONFIG.fx.maxEffects) return false;
    this.fxBudget--;
    this.effects.push(new SpriteFx(x, y, fxId, opts));
    return true;
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

  /**
   * Aplica dano a um Pokémon e trata o desmaio. `type` é o tipo do golpe (o 1º tipo
   * do inimigo, no contato e nos golpes do líder): desde a 0.32 ele passa pela
   * tabela contra os tipos do Pokémon, suavizada (CONFIG.types.defense).
   */
  damageCompanion(companion, amount, type = null, { weather = true } = {}) {
    if (!companion) return;
    if (this.buffs?.reflect > 0) amount *= 0.6;   // a barreira do Reflect
    const mult = type ? defenseMultiplier(type, getPokemon(companion.member.pokemonId)?.types ?? [], CONFIG.types.defense) : 1;
    // a chuva do Kyogre (0.37) vale para os golpes, não para a trombada
    amount *= mult * (weather ? weatherMultiplier(this, type) : 1);
    const result = companion.takeDamage(amount);
    if (!result) return;

    // o golpe que pega na fraqueza aparece maior; o resistido, menor e mais claro
    const look = mult > 1 ? ['#ff3b30', 16] : mult < 1 ? ['#ffb4ad', 12] : ['#ff6b6b', 13];
    this.effects.push(new FloatingText(companion.x, companion.y - 26, `-${Math.round(amount)}`, look[0], look[1]));

    if (result === 'fainted') {
      this.stats.faints++;
      companion.dead = true;
      burst(this.particles, companion.x, companion.y, '#ffffff', 18, 200, 3, 0.7);
      this.team.handleFaint(companion.member);
    }
  }

  /* ========================= loop ========================= */

  update(dt, move) {
    // a Dive Ball balançando (0.37): tudo para, menos a bola e os efeitos
    if (this.state === 'legendary') {
      this.fight?.updateThrow(dt);
      this._updateEffects(dt);
      this._cleanup();
      return;
    }
    if (this.state !== 'running') return;

    this.time += dt;
    this.fxBudget = CONFIG.fx.impactsPerFrame;
    if (this.shakeTime > 0) this.shakeTime = Math.max(0, this.shakeTime - dt);
    this.grid.rebuild(this.enemies);

    const stats = this.buffs.tailwind > 0 ? { ...this.playerStats, speed: this.playerStats.speed * 1.25 } : this.playerStats;
    this.player.update(dt, move, stats, this.world);
    this.team.update(dt);

    for (const companion of this.companions) {
      companion.update(dt, this.player, this.team.active.length, this.playerStats);
    }

    this.abilitySystem.update(dt);
    this.spawner.update(dt);
    this.fight?.update(dt);

    // trecho atual da jornada (muda o cenário e o texto do HUD)
    const segment = segmentAt(this.stage, this.time);
    if (segment !== this.segment) {
      this.segment = segment;
      this.world.theme = segment.theme ?? this.world.theme;
      this.world.scene = sceneOf(segment, this.world);
      this._settleTerrain();
      bus.emit(EVENTS.TOAST, { text: `Você chegou em ${segment.name}`, icon: 'stages' });
    }

    this._updateEnemies(dt);
    this._updateProjectiles(dt);
    this._updateOrbs(dt);
    this._updateZones(dt);
    updateSignatures(this, dt);
    this._updatePickups(dt);
    this._updateEffects(dt);
    this._cleanup();
    this._checkState();
  }

  /** Troca o terreno para o cenário do trecho e tira quem ficou dentro de um obstáculo. */
  _settleTerrain() {
    this.terrain.setScene(this.world.scene);
    this.terrain.place(this.player, FEET_BOX);
    for (const enemy of this.enemies) if (!enemy.dead) this.terrain.place(enemy, enemy.box);
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
      // o empurrão respeita o cenário: na multidão, ele jogava inimigos para
      // dentro das árvores (o "inimigo preso" da 0.11.5)
      if (count) this.terrain.move(enemy, pushX * 6 * dt, pushY * 6 * dt, enemy.box);

      this._unstick(enemy, dt);
      this._enemyAttack(enemy);
    }
  }

  /**
   * Rede de segurança contra inimigo preso (ideia do Fellipe, 0.11.5): quem está
   * dentro de um obstáculo, ou quem fica alguns segundos sem sair do lugar longe
   * do treinador (encurralado atrás de uma árvore), é teleportado para um ponto
   * livre aleatório.
   */
  _unstick(enemy, dt) {
    const rule = CONFIG.enemies.unstick;
    if (this.terrain.overlaps(enemy, enemy.box)) {
      enemy.insideFor = (enemy.insideFor ?? 0) + dt;
      if (enemy.insideFor >= rule.insideFor) this._teleportEnemy(enemy);
      return;
    }
    enemy.insideFor = 0;

    const watch = enemy.stuckWatch ??= { t: 0, x: enemy.x, y: enemy.y, strikes: 0 };
    watch.t += dt;
    if (watch.t < rule.window) return;
    const moved = Math.hypot(enemy.x - watch.x, enemy.y - watch.y);
    const far = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y) > rule.nearPlayer;
    watch.strikes = far && moved < enemy.speed * watch.t * rule.minMove ? watch.strikes + 1 : 0;
    watch.t = 0;
    watch.x = enemy.x;
    watch.y = enemy.y;
    if (watch.strikes >= rule.strikes) this._teleportEnemy(enemy);
  }

  /** Leva o inimigo para um ponto livre ao acaso: o chefe volta para perto da luta, os outros, para fora da tela. */
  _teleportEnemy(enemy) {
    const { player, world, terrain } = this;
    const view = Math.hypot(CONFIG.canvas.width, CONFIG.canvas.height) / 2;
    const [near, far] = enemy.boss ? [260, 380] : [view + 40, view + 160];
    burst(this.particles, enemy.x, enemy.y, '#c8c8d8', 8, 120, 3, 0.4);
    let spot = null;
    for (let i = 0; i < 16 && !spot; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = near + Math.random() * (far - near);
      const x = Math.max(30, Math.min(world.width - 30, player.x + Math.cos(a) * d));
      const y = Math.max(30, Math.min(world.height - 30, player.y + Math.sin(a) * d));
      spot = terrain.freeSpot(x, y, enemy.box, 3);
    }
    if (spot) {
      enemy.x = spot.x;
      enemy.y = spot.y;
    } else {
      terrain.place(enemy, enemy.box);
    }
    enemy.kvx = 0;
    enemy.kvy = 0;
    enemy.insideFor = 0;
    enemy.stuckWatch = null;
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

    this.damageCompanion(victim, enemy.damage, enemy.types[0], { weather: false });
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
      if (p.hostile) { this._hostileHit(p); continue; }

      for (const enemy of this.grid.query(p.x, p.y, p.size + 30)) {
        if (enemy.dead || p.hits.has(enemy)) continue;
        const dx = enemy.x - p.x, dy = enemy.y - p.y;
        const r = enemy.radius + p.size;
        if (dx * dx + dy * dy > r * r) continue;

        p.hits.add(enemy);
        damageEnemy(this, enemy, p.damage, {
          type: p.type, effects: p.effects, knockback: p.knockback,
          from: { x: p.x - p.vx * 0.01, y: p.y - p.vy * 0.01 },
          owner: p.owner, lifesteal: p.lifesteal
        });
        // Magnet Bomb: gruda no inimigo e explode logo depois
        if (p.delayedBlast) {
          const { area, ratio, delay } = p.delayedBlast;
          this.zones.push(new Zone({
            kind: 'nova', x: enemy.x, y: enemy.y, radius: 8, maxRadius: area, growSpeed: area * 6,
            damage: p.damage * ratio, delay, delayTotal: delay, type: p.type, color: p.color, abilityId: p.abilityId,
            knockback: 120, strike: 'explosion'
          }));
        }
        // o acerto do golpe (sprite do FireRed); sem espaço, umas faíscas
        if (!this.spawnFx(p.x, p.y, abilityFx(p.abilityId)?.hit, { life: 0.28, scale: 0.75 })) {
          burst(this.particles, p.x, p.y, p.color, 3, 90, 2, 0.25);
        }

        if (p.pierce > 0) p.pierce--;
        else { p.dead = true; break; }
      }

      // explosão ao acabar (Rock Throw e afins)
      if (p.dead && p.explode && (expired || p.hits.size)) {
        damageArea(this, p.x, p.y, p.explode.area, p.damage * p.explode.ratio, {
          type: p.type, effects: p.effects, knockback: 120
        });
        this.spawnFx(p.x, p.y, 'explosion', { life: 0.35, scale: 1.5 });
        burst(this.particles, p.x, p.y, p.color, 10, 220, 4, 0.5);
        p.explode = null;
      }
    }
  }

  /**
   * Projétil de líder: acerta o Pokémon em campo em que encostar; se chegar no
   * treinador, o Pokémon mais perto o defende (como no contato dos inimigos).
   */
  _hostileHit(p) {
    if (p.dead) return;
    let victim = null;
    for (const companion of this.companions) {
      if (companion.dead || companion.member.fainted) continue;
      const r = companion.radius + p.size;
      if ((companion.x - p.x) ** 2 + (companion.y - p.y) ** 2 < r * r) { victim = companion; break; }
    }
    if (!victim) {
      const r = this.player.radius + p.size;
      if ((this.player.x - p.x) ** 2 + (this.player.y - p.y) ** 2 < r * r) victim = this.nearestCompanion(p.x, p.y);
    }
    if (!victim) return;
    p.dead = true;
    this.damageCompanion(victim, p.damage, p.type);
    burst(this.particles, p.x, p.y, p.color, 6, 140, 3, 0.35);
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
          from: { x: orb.owner.x, y: orb.owner.y }, owner: orb.owner, lifesteal: orb.lifesteal
        });
      }
    }
  }

  _updateZones(dt) {
    for (const zone of this.zones) {
      if (zone.dead) continue;
      zone.update(dt);

      if (zone.kind === 'nova') {
        if (zone.delay > 0) continue;   // ainda é só o aviso no chão
        if (zone.hostile) {
          if (!zone.started) {
            zone.started = true;
            this.shake(zoneFx(zone)?.shake ?? 4, 0.3);
          }
          // a onda do chefe atinge os Pokémon em campo, não o treinador
          for (const companion of this.companions) {
            if (companion.dead || zone.hits.has(companion)) continue;
            const d = Math.hypot(companion.x - zone.x, companion.y - zone.y);
            if (d > zone.radius) continue;
            zone.hits.add(companion);
            this.damageCompanion(companion, zone.damage, zone.visualType ?? zone.type);
          }
          continue;
        }
        // o golpe que cai do céu (2º golpe) aparece quando o aviso acaba
        if (!zone.started) {
          zone.started = true;
          if (zone.strike) this.spawnFx(zone.x, zone.y, zone.strike, { life: 0.4, scale: 1.3 });
        }
        if (zone.damage <= 0) continue;   // só o visual (Dragon Dance)
        for (const enemy of this.grid.query(zone.x, zone.y, zone.radius)) {
          if (enemy.dead || zone.hits.has(enemy)) continue;
          const d = Math.hypot(enemy.x - zone.x, enemy.y - zone.y);
          if (d > zone.radius) continue;
          zone.hits.add(enemy);
          damageEnemy(this, enemy, zone.damage, {
            type: zone.type, effects: zone.effects,
            knockback: zone.knockback, from: { x: zone.x, y: zone.y },
            owner: zone.owner, lifesteal: zone.lifesteal
          });
        }
        continue;
      }

      // auras e zonas de chão causam dano em intervalos
      // Whirlpool: puxa quem está dentro para o centro, todo quadro
      if (zone.pull) {
        for (const enemy of this.grid.query(zone.x, zone.y, zone.radius)) {
          if (enemy.dead || enemy.boss) continue;
          const dx = zone.x - enemy.x, dy = zone.y - enemy.y;
          const d = Math.hypot(dx, dy);
          if (d > zone.radius || d < 6) continue;
          enemy.knockback(dx / d, dy / d, zone.pull * dt * 8);
        }
      }
      if (!zone.readyToTick(dt)) continue;
      // campos que curam a equipe (Grassy e Misty Terrain), com o teto do 2º golpe
      if (zone.healTeam) {
        for (const companion of this.companions) {
          if (companion.dead || Math.hypot(companion.x - zone.x, companion.y - zone.y) > zone.radius) continue;
          bonusHeal(this, companion, companion.maxHp(this.playerStats.pokemonHpBonus) * zone.healTeam);
        }
      }
      if (zone.damage <= 0) continue;   // só o visual (a barreira do Reflect)
      for (const enemy of this.grid.query(zone.x, zone.y, zone.radius)) {
        if (enemy.dead) continue;
        const dx = enemy.x - zone.x, dy = enemy.y - zone.y;
        if (dx * dx + dy * dy > zone.radius * zone.radius) continue;
        damageEnemy(this, enemy, zone.damage, {
          type: zone.type, effects: zone.effects, silent: Math.random() > 0.35,
          knockback: zone.knockback, from: { x: zone.x, y: zone.y },
          owner: zone.owner, lifesteal: zone.lifesteal
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
      } else if (pickup.kind === 'magnet') {
        // todo o XP do mapa vem até o treinador
        for (const orb of this.pickups) {
          if (orb.kind === 'xp' && !orb.dead) { orb.magnetized = true; orb.age = 0; }
        }
        bus.emit(EVENTS.MAGNET_PICKED, {});
        burst(this.particles, this.player.x, this.player.y, '#63b3ff', 18, 260, 3, 0.6);
        bus.emit(EVENTS.TOAST, { text: 'Ímã! Toda a experiência do mapa vem até você.', icon: 'magnet' });
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
    alive(this.signatures);
  }

  _checkState() {
    if (this.team.allFainted) {
      this.state = 'defeat';
      bus.emit(EVENTS.STAGE_FAILED, { stage: this.stage });
      return;
    }
    // capturou o Kyogre: a vitória espera a maré final (0.37)
    if (this.spawner.leaderDefeated && !this.endless && !this.fight?.holding) {
      this.state = 'victory';
      bus.emit(EVENTS.STAGE_CLEARED, { stage: this.stage });
      return;
    }
    if (this.pendingIntro) { this.state = 'intro'; return; }
    if (this.evolutionQueue.length) { this.state = 'evolution'; return; }
    if (this.pendingBall || this.pendingGift) { this.state = 'capture'; return; }

    // o Golpe Desperto (2º golpe) abre a tela de anúncio, de quem for
    if (this.unlockQueue.length) { this.state = 'unlock'; return; }

    // quem tem níveis guardados mas já tem todas as melhorias: cura, sem tela
    for (const member of this.team.members) {
      if (member.pendingLevels > 0) this.progression.resolveMaxedLevels(member);
    }

    // Pokémon ativo que subiu de nível pausa o jogo na hora.
    // Os da reserva acumulam e sobem quando o jogador quiser (botão ↑).
    const ready = this.team.activeMembers.find((m) => m.pendingLevels > 0 && !m.fainted);
    if (ready) {
      this.levelUpMember = ready;
      this.state = 'levelup';
    }
  }

  /**
   * Entra no Modo Livre (0.20) depois da vitória: a equipe volta curada e a fase
   * continua sem fim (SpawnSystem.startEndless). O que a equipe ganhar fica.
   */
  startEndless() {
    const bonus = this.playerStats.pokemonHpBonus;
    for (const member of this.team.members) {
      member.fainted = false;
      member.hp = maxHpFor(member, bonus);
    }
    for (const p of this.projectiles) if (p.hostile) p.dead = true;
    // quem desmaiou saiu de campo: as vagas vazias voltam a ser ocupadas
    const active = this.team.active;
    for (let i = 0; i < active.length; i++) {
      if (active[i]) continue;
      active[i] = this.team.members.find((m) => !active.includes(m)) ?? null;
    }
    this.syncCompanions();
    this.endless = true;
    this.objective = 'MODO LIVRE';
    this.spawner.startEndless();
    this.state = 'running';
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
      team: this.team.serialize(),
      pc: this.pc,
      stats: { ...this.stats }
    };
  }
}
