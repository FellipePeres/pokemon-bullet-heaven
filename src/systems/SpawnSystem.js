import { Enemy } from '../entities/Enemy.js';
import { Pickup } from '../entities/Pickup.js';
import { getEnemy } from '../data/enemies.js';
import { CONFIG } from '../core/config.js';
import { weightedPick, rand, clamp } from '../core/utils.js';
import { bus, EVENTS } from '../core/events.js';
import { getAbility } from '../data/abilities.js';
import { levelDamageMultiplier } from './stats.js';

/** Nível sorteado dentro da faixa da onda ([mínimo, máximo]), ou null. */
const pickLevel = (range) => (range ? range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1)) : null);

/**
 * Força do selvagem pelo nível dele (ver CONFIG.enemies). Sem nível, nada muda:
 * é como as fases 1 e 2 foram calibradas.
 */
export function levelScaling(level) {
  if (!level) return { hp: 1, damage: 1, xp: 1 };
  const { referenceLevel, hpGrowth, damageGrowth, xpPerLevel } = CONFIG.enemies;
  const d = level - referenceLevel;
  return {
    hp: Math.pow(hpGrowth, d),
    damage: Math.pow(damageGrowth, d),
    xp: Math.max(0.5, 1 + xpPerLevel * d)
  };
}

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
    this.giftsGiven = new Set();

    // Time do líder: enfrentado em sequência, um Pokémon por vez.
    // o rival do Campeão monta o time pelo inicial que você escolheu
    this.bossQueue = [...(this.stage.bossTeamByStarter?.[run.campaignStarter] ?? this.stage.bossTeam ?? [])];
    // as invocações dos líderes vêm no nível mais alto das ondas da fase
    this.summonLevel = Math.max(0, ...this.stage.waves.map((w) => w.level?.[1] ?? 0)) || null;
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
      this.waveTimers[i] = wave.interval / CONFIG.enemies.spawnMult;
      if (run.enemies.length >= wave.maxAlive * CONFIG.enemies.spawnMult) return;

      for (let n = 0; n < wave.batch; n++) {
        this.spawn(weightedPick(wave.enemies).id, null, pickLevel(wave.level));
      }
    });

    // ---- elites pontuais ----
    (this.stage.elites ?? []).forEach((elite, i) => {
      if (this.elitesSpawned.has(i) || t < elite.at) return;
      this.elitesSpawned.add(i);
      for (let n = 0; n < (elite.count ?? 1); n++) this.spawn(elite.id, null, elite.level ?? null);
      bus.emit(EVENTS.TOAST, { text: 'Um Pokémon poderoso apareceu!', icon: 'boss' });
    });

    // ---- Poké Balls garantidas ----
    (this.stage.scriptedBalls ?? []).forEach((at, i) => {
      if (this.scriptedBalls.has(i) || t < at) return;
      this.scriptedBalls.add(i);
      this.dropBall();
    });

    // ---- presentes da fase (as trocas e o Dojo do FireRed) ----
    (this.stage.gifts ?? []).forEach((gift, i) => {
      if (this.giftsGiven.has(i) || t < gift.at || run.pendingGift) return;
      this.giftsGiven.add(i);
      run.pendingGift = gift;
    });

    // ---- líder do ginásio ----
    if (!this.bossSpawned && t >= this.stage.duration) {
      this.bossSpawned = true;
      // o líder se apresenta antes (a partida pausa na tela dele)
      if (this.stage.leader) run.pendingIntro = this.stage.leader;
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
    let x = clamp(player.x + Math.cos(a) * d, 40, world.width - 40);
    let y = clamp(player.y + Math.sin(a) * d, 40, world.height - 40);
    // nunca dentro de uma árvore ou pedra, onde o treinador não alcança
    ({ x, y } = this.run.terrain?.freeSpot(x, y, { oy: 0, hw: 10, hh: 10 }) ?? { x, y });
    this.run.stats.ballsDropped++;
    this.run.pickups.push(new Pickup('ball', x, y));
    bus.emit(EVENTS.TOAST, { text: 'Uma Poké Ball apareceu por perto!', icon: 'ball' });
  }

  /** Comportamento especial de chefes: invocações e habilidades. */
  updateBoss(enemy, dt) {
    if (!enemy.boss) return;
    const tuning = CONFIG.enemies.boss;

    // fúria: abaixo da metade da vida, o líder acelera e ataca mais seguido
    if (!enemy.enraged && enemy.hp <= enemy.maxHp * tuning.enrageAt) {
      enemy.enraged = true;
      enemy.speed *= tuning.enrage.speed;
      bus.emit(EVENTS.TOAST, { text: `${enemy.data.name} ficou furioso!`, icon: 'boss' });
    }
    const rage = enemy.enraged ? tuning.enrage : null;

    for (const inst of enemy.abilities) {
      inst.timer -= dt;
      if (inst.timer <= 0) {
        inst.timer = (getAbility(inst.abilityId)?.base.cooldown ?? 5) * tuning.cooldownMult
                     * (enemy.data.cooldownMult ?? 1) * (rage?.cooldown ?? 1);
        this.run.abilitySystem.fireHostile(enemy, inst.abilityId);
      }
    }

    const summons = enemy.data.summons;
    if (summons) {
      enemy.summonTimer -= dt;
      if (enemy.summonTimer <= 0) {
        enemy.summonTimer = summons.interval * tuning.summonIntervalMult * (rage?.summonInterval ?? 1);
        for (let i = 0; i < summons.count + tuning.summonBonus; i++) {
          const a = Math.random() * Math.PI * 2;
          const d = enemy.radius + rand(30, 90);
          this.spawnAt(summons.enemy, enemy.x + Math.cos(a) * d, enemy.y + Math.sin(a) * d, this.summonLevel);
        }
      }
    }
  }

  /**
   * O líder acompanha a equipe (0.14): com a média de nível da equipe acima do
   * nível com que ela costuma chegar a ele (`stage.leaderLevel`, medido com o
   * bot), a vida e o dano dele crescem no mesmo passo do dano da equipe — sem
   * isso, quem passa do nível 100 (o nível não tem teto) vence qualquer líder
   * sem esforço. Chegando no nível de sempre (ou abaixo), nada muda.
   */
  bossLift() {
    const members = this.run.team.members;
    const expected = this.stage.leaderLevel;
    if (!members.length || !expected) return 1;
    const team = members.reduce((sum, m) => sum + m.level, 0) / members.length;
    return team > expected ? levelDamageMultiplier(team) / levelDamageMultiplier(expected) : 1;
  }

  /** Spawna fora da tela, ao redor do jogador. */
  spawn(enemyId, distance = null, level = null) {
    const { player, world } = this.run;
    const viewRadius = Math.hypot(CONFIG.canvas.width, CONFIG.canvas.height) / 2;
    const d = distance ?? viewRadius + rand(40, 160);
    const a = Math.random() * Math.PI * 2;
    const x = clamp(player.x + Math.cos(a) * d, 30, world.width - 30);
    const y = clamp(player.y + Math.sin(a) * d, 30, world.height - 30);
    return this.spawnAt(enemyId, x, y, level);
  }

  spawnAt(enemyId, x, y, level = null) {
    // Chefes têm vida definida direto nos dados: aplicar também a escala da fase
    // dobraria a dificuldade e tornaria o balanceamento impossível de prever.
    const isBoss = !!getEnemy(enemyId)?.boss;
    // ajuste por inicial (0.11.5): na fase em que um inicial sobra, os inimigos
    // (o líder também) ficam um pouco mais fortes quando ele é o da jornada
    const tilt = this.stage.starterTuning?.[this.run.campaignStarter] ?? 1;
    // o líder da fase (0.12.2): das últimas fases, mais vida e mais dano
    const lead = isBoss ? { hp: 1, damage: 1, ...this.stage.bossTuning } : { hp: 1, damage: 1 };
    const lift = isBoss ? this.bossLift() : 1;
    let scaling = { hp: tilt * lead.hp * lift, speed: 1, damage: tilt * lead.damage * lift };
    if (!isBoss) {
      const ramp = this.scaling;
      const byLevel = levelScaling(level);
      scaling = {
        hp: ramp.hp * byLevel.hp * tilt, speed: ramp.speed, damage: ramp.damage * byLevel.damage * tilt,
        xp: byLevel.xp * (this.stage.xpScale ?? 1)
      };
    }
    const enemy = new Enemy(enemyId, x, y, scaling, level);
    enemy.attackMult = tilt * lead.damage * lift;   // os golpes do líder também
    // nasce fora das árvores, pedras e paredes
    this.run.terrain?.place(enemy, enemy.box);
    this.run.enemies.push(enemy);
    return enemy;
  }
}
