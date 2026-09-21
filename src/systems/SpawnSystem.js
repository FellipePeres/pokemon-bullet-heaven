import { Enemy } from '../entities/Enemy.js';
import { Pickup } from '../entities/Pickup.js';
import { getEnemy } from '../data/enemies.js';
import { CONFIG } from '../core/config.js';
import { weightedPick, rand, clamp } from '../core/utils.js';
import { bus, EVENTS } from '../core/events.js';
import { getAbility } from '../data/abilities.js';

/**
 * Cria inimigos seguindo as ondas descritas nos dados da fase.
 * Nenhuma regra de fase específica mora aqui — tudo vem de stages.js.
 */
export class SpawnSystem {
  constructor(run) {
    this.run = run;
    this.stage = run.stage;
    this.waveTimers = this.stage.waves.map((w) => w.interval * Math.random());
    this.elitesSpawned = new Set();
    this.scriptedBalls = new Set();

    // Time do líder: enfrentado em sequência, um Pokémon por vez.
    this.bossQueue = [...(this.stage.bossTeam ?? [])];
    this.bossSpawned = false;
    this.bossesDefeated = 0;
    this.nextBossDelay = 0;
    this.boss = null;
  }

  /** Dificuldade cresce conforme a fase avança. */
  get scaling() {
    const s = this.stage.scaling ?? { hp: 1, speed: 0.2, damage: 0.5 };
    const p = clamp(this.run.time / this.stage.duration, 0, 1);
    return {
      hp: 1 + (s.hp ?? 1) * p,
      speed: 1 + (s.speed ?? 0) * p,
      damage: 1 + (s.damage ?? 0) * p
    };
  }

  update(dt) {
    const run = this.run;
    const t = run.time;

    // ---- ondas normais ----
    this.stage.waves.forEach((wave, i) => {
      if (t < wave.from || t > wave.to) return;
      this.waveTimers[i] -= dt;
      if (this.waveTimers[i] > 0) return;
      this.waveTimers[i] = wave.interval;
      if (run.enemies.length >= wave.maxAlive) return;

      for (let n = 0; n < wave.batch; n++) {
        this.spawn(weightedPick(wave.enemies).id);
      }
    });

    // ---- elites pontuais ----
    (this.stage.elites ?? []).forEach((elite, i) => {
      if (this.elitesSpawned.has(i) || t < elite.at) return;
      this.elitesSpawned.add(i);
      for (let n = 0; n < (elite.count ?? 1); n++) this.spawn(elite.id);
      bus.emit(EVENTS.TOAST, { text: 'Um Pokémon poderoso apareceu!', icon: 'boss' });
    });

    // ---- Poké Balls garantidas ----
    (this.stage.scriptedBalls ?? []).forEach((at, i) => {
      if (this.scriptedBalls.has(i) || t < at) return;
      this.scriptedBalls.add(i);
      this.dropBall();
    });

    // ---- líder do ginásio ----
    if (!this.bossSpawned && t >= this.stage.duration) {
      this.bossSpawned = true;
      const leader = this.stage.leader;
      if (leader) {
        bus.emit(EVENTS.TOAST, { text: `${leader.name}: "${leader.quote}"`, icon: 'badge' });
      }
      this.sendNextBoss();
      return;
    }

    // próximo Pokémon do líder entra depois que o anterior cai
    if (this.bossSpawned && this.boss?.dead && this.bossQueue.length) {
      this.nextBossDelay -= dt;
      if (this.nextBossDelay <= 0) this.sendNextBoss();
    }
  }

  /** Coloca em campo o próximo Pokémon do time do líder. */
  sendNextBoss() {
    const id = this.bossQueue.shift();
    if (!id) return null;
    if (this.boss?.dead) this.bossesDefeated++;

    this.boss = this.spawn(id, 460);
    this.nextBossDelay = 2.5;

    const remaining = this.bossQueue.length;
    this.run.objective = this.boss.data.ace
      ? 'DERROTE O ACE DO LÍDER!'
      : `DERROTE O LÍDER! (${remaining + 1} restante${remaining ? 's' : ''})`;

    bus.emit(EVENTS.BOSS_SPAWNED, { enemy: this.boss });
    bus.emit(EVENTS.TOAST, { text: `${this.boss.data.name} entrou em campo!`, icon: 'boss' });
    return this.boss;
  }

  /** O líder só é derrotado quando todo o time dele cai. */
  get leaderDefeated() {
    return this.bossSpawned && !this.bossQueue.length && !!this.boss?.dead;
  }

  /** Deixa uma Poké Ball perto do jogador (evento roteirizado da fase). */
  dropBall() {
    const { player, world } = this.run;
    const a = Math.random() * Math.PI * 2;
    const d = rand(130, 240);
    const x = clamp(player.x + Math.cos(a) * d, 40, world.width - 40);
    const y = clamp(player.y + Math.sin(a) * d, 40, world.height - 40);
    this.run.stats.ballsDropped++;
    this.run.pickups.push(new Pickup('ball', x, y));
    bus.emit(EVENTS.TOAST, { text: 'Uma Poké Ball apareceu por perto!', icon: 'ball' });
  }

  /** Comportamento especial de chefes: invocações e habilidades. */
  updateBoss(enemy, dt) {
    if (!enemy.boss) return;

    for (const inst of enemy.abilities) {
      inst.timer -= dt;
      if (inst.timer <= 0) {
        inst.timer = getAbility(inst.abilityId)?.base.cooldown ?? 5;
        this.run.abilitySystem.fireHostile(enemy, inst.abilityId);
      }
    }

    const summons = enemy.data.summons;
    if (summons) {
      enemy.summonTimer -= dt;
      if (enemy.summonTimer <= 0) {
        enemy.summonTimer = summons.interval;
        for (let i = 0; i < summons.count; i++) {
          const a = Math.random() * Math.PI * 2;
          const d = enemy.radius + rand(30, 90);
          this.spawnAt(summons.enemy, enemy.x + Math.cos(a) * d, enemy.y + Math.sin(a) * d);
        }
      }
    }
  }

  /** Spawna fora da tela, ao redor do jogador. */
  spawn(enemyId, distance = null) {
    const { player, world } = this.run;
    const viewRadius = Math.hypot(CONFIG.canvas.width, CONFIG.canvas.height) / 2;
    const d = distance ?? viewRadius + rand(40, 160);
    const a = Math.random() * Math.PI * 2;
    const x = clamp(player.x + Math.cos(a) * d, 30, world.width - 30);
    const y = clamp(player.y + Math.sin(a) * d, 30, world.height - 30);
    return this.spawnAt(enemyId, x, y);
  }

  spawnAt(enemyId, x, y) {
    // Chefes têm vida definida direto nos dados: aplicar também a escala da fase
    // dobraria a dificuldade e tornaria o balanceamento impossível de prever.
    const isBoss = !!getEnemy(enemyId)?.boss;
    const scaling = isBoss ? { hp: 1, speed: 1, damage: 1 } : this.scaling;
    const enemy = new Enemy(enemyId, x, y, scaling);
    this.run.enemies.push(enemy);
    return enemy;
  }
}
