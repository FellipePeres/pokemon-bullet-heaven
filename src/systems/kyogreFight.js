import { CONFIG } from '../core/config.js';
import { DIVE_WORLD } from '../data/diveWorld.js';
import { rand, weightedPick } from '../core/utils.js';
import { bus, EVENTS } from '../core/events.js';
import { burst } from '../entities/effects.js';
import { playCry } from '../audio/cry.js';

const SCALE = CONFIG.render.pixelScale;
const TAU = Math.PI * 2;

/**
 * A LUTA DO KYOGRE (0.37, PLANEJAMENTO-DIVE.md seção 9) — o que só esta luta tem,
 * por cima da fase de sempre (data/stages.js `kyogre`, `legendaryFight`):
 *
 * - o Kyogre sai do lago no meio do salão (o chefe da fase, `kyogre_boss`);
 * - os ataques: Origin Pulse (três anéis), Water Spout (colunas d'água em volta do
 *   treinador, mais fortes com a vida cheia), Thunder (abaixo de 50%; na chuva cai
 *   sempre no lugar marcado), a horda chamada e o mergulho (abaixo de 50%: afunda
 *   e volta por uma das poças, que borbulha antes);
 * - a fúria abaixo de 20% (os ataques mais densos);
 * - A CAPTURA: enquanto houver Dive Ball, a vida dele não passa de 15%. Lá, ele fica
 *   exausto por 8 s, a horda para e a bola cai no campo. Passar por cima é jogar:
 *   até 3 balanços, 10% de captura. Na falha, ele volta a 25%. Se a bola não for
 *   pega, ele se recupera do mesmo jeito, mas a bola não conta como gasta.
 * - capturou: a maré final de 30 s, sem o Kyogre. Só depois a fase é vencida.
 *
 * O desenho está em render/kyogreFight.js. Roda sem navegador (os testes).
 */
export class KyogreFight {
  constructor(run) {
    this.run = run;
    this.cfg = run.stage.legendaryFight;
    this.balls = this.cfg.balls;
    this.state = 'waiting';        // waiting | rise | fight | dive | exhausted | throw | gone
    this.t = 0;
    this.hazards = [];             // os avisos no chão: { kind: 'spout' | 'thunder', x, y, r, warn, t, damage }
    this.ball = null;              // a Dive Ball no campo
    this.throwing = null;          // a bola voando e balançando
    this.final = null;             // a maré final: { t } (segundos que faltam)
    this.captured = false;
    this.holding = false;          // segura a vitória enquanto a maré final não acaba
    this.attackTimer = 2.5;
    this.summonTimer = 9;
    this.diveTimer = 12;
    this.fury = false;
    const arena = DIVE_WORLD.arena;
    this.lake = { x: arena.lake[0] * SCALE, y: arena.lake[1] * SCALE };
    this.pools = arena.pools.map(([x, y]) => ({ x: x * SCALE, y: y * SCALE }));
    this.boiling = 0;              // o lago fervendo antes de ele sair
    this.rng = Math.random;
  }

  /** O chefe da fase, se for o Kyogre e estiver em campo. */
  get boss() {
    const boss = this.run.spawner.boss;
    return boss && boss.data.legendary && !boss.dead ? boss : null;
  }

  /** A horda para enquanto ele está exausto (a maré final não para). */
  get quiet() { return this.state === 'exhausted' || this.state === 'throw'; }

  get hpFraction() { const b = this.boss; return b ? b.hp / b.maxHp : 0; }

  /* ------------------------------ o laço ------------------------------ */

  update(dt) {
    const run = this.run;
    this.t += dt;
    if (!run.spawner.bossSpawned && run.time > run.stage.duration - 4) this.boiling = Math.min(1, this.boiling + dt / 3);
    this._updateHazards(dt);
    if (this.final) this._updateFinal(dt);
    const boss = this.boss;
    if (!boss) return;
    if (this.state === 'waiting') this._rise(boss);

    // enquanto houver Dive Ball, o piso de vida (combat.js para o dano nele)
    boss.hpFloor = this.balls > 0 ? boss.maxHp * this.cfg.floor : null;

    switch (this.state) {
      case 'rise': {
        boss.rise = Math.min(1, this.t / 1.6);
        boss.x = this.lake.x; boss.y = this.lake.y;
        if (this.t >= 2.2) { boss.untouchable = false; this._set('fight'); }
        break;
      }
      case 'fight': this._fight(boss, dt); break;
      case 'dive': this._dive(boss, dt); break;
      case 'exhausted': {
        boss.applyStatus('slow', { factor: 0, duration: 0.2 });
        if (this.ball) {
          this.ball.t += dt;
          const p = run.player;
          if (Math.hypot(p.x - this.ball.x, p.y - this.ball.y) < 40) this._throw(boss);
        }
        if (this.state === 'exhausted' && this.t >= this.cfg.exhaust) this._recover(boss, false);
        break;
      }
      default: break;
    }
  }

  _set(state) { this.state = state; this.t = 0; }

  /** O lago ferve, o grito, e ele sai da água devagar (intocável até terminar). */
  _rise(boss) {
    boss.x = this.lake.x; boss.y = this.lake.y;
    boss.rise = 0;
    boss.untouchable = true;
    this.boiling = 0;
    this.run.shake(9, 1.2);
    playCry(382);
    for (let i = 0; i < 26; i++) burst(this.run.particles, this.lake.x + rand(-120, 120), this.lake.y + rand(-60, 60), '#b8e6ff', 2, 220, 4, 0.9);
    this._set('rise');
  }

  _fight(boss, dt) {
    const frac = boss.hp / boss.maxHp;
    if (!this.fury && boss.enraged) {
      this.fury = true;
      this.run.shake(6, 0.6);
      playCry(382);
    }
    boss.sway = Math.sin(this.run.time * 2) * 0.08;
    this.attackTimer -= dt;
    if (this.attackTimer <= 0) this._attack(boss, frac);
    this.summonTimer -= dt;
    if (this.summonTimer <= 0) {
      this.summonTimer = this.fury ? 9 : 12;
      for (let i = 0; i < 3; i++) {
        const a = this.rng() * TAU, d = boss.radius + rand(40, 110);
        this.run.spawner.spawnAt(weightedPick(this.cfg.summons).id, boss.x + Math.cos(a) * d, boss.y + Math.sin(a) * d, this.run.spawner.summonLevel);
      }
    }
    if (frac < 0.5) {
      this.diveTimer -= dt;
      if (this.diveTimer <= 0) {
        // volta pela poça mais perto do treinador: o mergulho surpreende, mas a luta não para
        const p = this.run.player;
        this.pool = [...this.pools].sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
        this._set('dive');
      }
    }
  }

  /** O próximo ataque: depende da fase de vida (o Thunder só abaixo de 50%). */
  _attack(boss, frac) {
    const pool = ['pulse', 'spout', 'spout'];
    if (frac < 0.5) pool.push('thunder', 'thunder');
    const kind = pool[Math.floor(this.rng() * pool.length)];
    const p = this.run.player;
    const hostile = this.run.abilitySystem;
    if (kind === 'pulse') {
      // Origin Pulse: três anéis, um atrás do outro (o nova dos chefes)
      for (let i = 0; i < 3; i++) hostile.fireHostile(boss, 'kyogre_origin_pulse', { extraDelay: i * 0.45 });
    } else if (kind === 'spout') {
      // Water Spout: mais colunas e mais forte com a vida cheia, como no jogo original
      const n = Math.round(6 + 4 * frac);
      for (let i = 0; i < n; i++) {
        const a = this.rng() * TAU, d = i === 0 ? 0 : rand(40, 230);
        this.hazards.push({ kind: 'spout', x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, r: 52,
          warn: 1.1 + i * 0.06, life: 0.5, t: 0, damage: this._damage(7 + 9 * frac), type: 'water' });
      }
    } else {
      // Thunder: na chuva, cai sempre no lugar marcado
      for (let i = 0; i < 4; i++) {
        const a = this.rng() * TAU, d = i === 0 ? 0 : rand(60, 200);
        this.hazards.push({ kind: 'thunder', x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, r: 44,
          warn: 0.9 + i * 0.25, life: 0.3, t: 0, damage: this._damage(14), type: 'electric' });
      }
    }
    const base = this.fury ? 1.6 : frac < 0.5 ? 2.2 : 2.9;
    this.attackTimer = base + this.rng() * 0.6;
  }

  /** O dano de um ataque do Kyogre, na mesma escala dos golpes dos líderes (AbilitySystem.fireHostile). */
  _damage(base) {
    const boss = this.boss;
    return base * CONFIG.enemies.damageMult * CONFIG.enemies.boss.damageMult * (boss?.attackMult ?? 1);
  }

  /** O mergulho: afunda (intocável), a poça escolhida borbulha e ele volta com uma onda de choque. */
  _dive(boss, dt) {
    if (this.t < 0.6) { boss.rise = Math.max(0, 1 - this.t / 0.6); boss.untouchable = true; return; }
    if (!boss.hidden) { boss.hidden = true; boss.x = this.pool.x; boss.y = this.pool.y; }
    boss.applyStatus('slow', { factor: 0, duration: 0.2 });
    if (this.t < 1.8) return;
    boss.hidden = false; boss.untouchable = false; boss.rise = 1;
    this.diveTimer = this.fury ? 9 : 13;
    this.attackTimer = 0.8;
    this.run.abilitySystem.fireHostile(boss, 'kyogre_resurface');
    this.run.shake(6, 0.5);
    this._set('fight');
  }

  /* ------------------------------ a captura ------------------------------ */

  /** A vida chegou no piso: ele fica exausto e a Dive Ball cai longe do treinador. */
  onFloor(boss) {
    if (this.state === 'exhausted' || this.state === 'throw' || this.balls <= 0) return;
    boss.hidden = false; boss.untouchable = false; boss.rise = 1;
    this._set('exhausted');
    this.hazards = [];
    for (const z of this.run.zones) if (z.hostile) z.dead = true;
    const p = this.run.player, w = this.run.world;
    let x = p.x, y = p.y;
    for (let i = 0; i < 40; i++) {
      const a = this.rng() * TAU;
      x = p.x + Math.cos(a) * 450; y = p.y + Math.sin(a) * 450;
      if (x > 140 && y > 160 && x < w.width - 140 && y < w.height - 140) break;
    }
    x = Math.max(140, Math.min(w.width - 140, x));
    y = Math.max(160, Math.min(w.height - 140, y));
    this.ball = { x, y, t: 0 };
    bus.emit(EVENTS.TOAST, { text: 'O Kyogre está exausto! Uma Dive Ball caiu no campo!', icon: 'ball' });
  }

  /** Passou por cima: a bola voa até ele. A luta para enquanto ela balança. */
  _throw(boss) {
    const ok = this.rng() < this.cfg.chance;
    // na falha, ela abre depois de 1, 2 ou 3 balanços, como no jogo original
    const shakes = ok ? 3 : 1 + Math.floor(this.rng() * 3);
    this.throwing = { stage: 'fly', t: 0, from: { x: this.run.player.x, y: this.run.player.y - 20 }, to: { x: boss.x, y: boss.y }, ok, need: shakes, shakes: 0 };
    this.ball = null;
    this._set('throw');
    this.run.state = 'legendary';   // tudo para enquanto a bola balança (Run.update)
  }

  /** O arremesso e os balanços (Run.update chama no estado 'legendary'). */
  updateThrow(dt) {
    const th = this.throwing, boss = this.boss;
    if (!th || !boss) { this.run.state = 'running'; return; }
    th.t += dt;
    if (th.stage === 'fly') {
      if (th.t >= 0.7) { th.stage = 'absorb'; th.t = 0; }
    } else if (th.stage === 'absorb') {
      boss.rise = Math.max(0, 1 - th.t / 0.45);
      if (th.t >= 0.8) { th.stage = 'shake'; th.t = 0; }
    } else if (th.stage === 'shake') {
      if (th.t >= 0.95) {
        th.t = 0;
        th.shakes++;
        if (th.shakes >= th.need) th.stage = th.ok ? 'click' : 'burst';
        if (th.stage === 'burst') { boss.rise = 1; this.run.shake(5, 0.4); }
      }
    } else if (th.stage === 'click') {
      if (th.t >= 1.1) this._captured(boss);
    } else if (th.stage === 'burst') {
      if (th.t >= 0.5) { this.throwing = null; this.run.state = 'running'; this._recover(boss, true); }
    }
  }

  /** Ele escapou (ou a bola não foi pega): volta só um pouco, a 25%. */
  _recover(boss, spent) {
    if (spent) this.balls--;
    this.ball = null;
    boss.hp = Math.max(boss.hp, boss.maxHp * this.cfg.recover);
    boss.rise = 1;
    this.attackTimer = 1.4;
    this._set('fight');
    this.run.abilitySystem.fireHostile(boss, 'kyogre_resurface');
    this.run.shake(6, 0.6);
    playCry(382);
    const left = this.balls === 0 ? 'Não resta nenhuma Dive Ball.' : this.balls === 1 ? 'Resta 1 Dive Ball.' : `Restam ${this.balls} Dive Balls.`;
    bus.emit(EVENTS.TOAST, {
      text: spent ? `Ah, não! O Kyogre escapou! ${left}` : 'O Kyogre se recuperou um pouco! A Dive Ball afundou e volta na próxima vez.',
      icon: 'ball'
    });
  }

  /** Capturou: a tela de captura (o presente da fase) e, depois dela, a maré final. */
  _captured(boss) {
    this.throwing = null;
    this.captured = true;
    this.holding = true;
    boss.captured = true;
    boss.dead = true;          // sai de campo sem morrer (sem XP nem Shards de chefe)
    this.state = 'gone';
    this.run.state = 'running';
    this.run.pendingGift = { choices: ['kyogre'], title: 'Gotcha! O Kyogre foi capturado!', mandatory: true };
    this.final = { t: this.cfg.finalTide, spawn: 0 };
    this.run.objective = 'SOBREVIVA À MARÉ FINAL!';
    bus.emit(EVENTS.TOAST, { text: 'A água está subindo! Sobreviva à maré final!', icon: 'boss' });
  }

  /** A maré final: 30 s de hordas em fúria; no fim, a vitória. */
  _updateFinal(dt) {
    const f = this.final;
    if (this.run.pendingGift) return;     // a tela de captura ainda aberta
    f.t -= dt;
    f.spawn -= dt;
    if (f.spawn <= 0 && this.run.enemies.length < 170) {
      f.spawn = 0.35;
      for (let i = 0; i < 5; i++) this.run.spawner.spawn(weightedPick(this.cfg.summons).id, null, this.cfg.finalLevel);
    }
    if (f.t <= 0) {
      this.final = null;
      this.holding = false;
      bus.emit(EVENTS.TOAST, { text: 'A maré baixou.', icon: 'stages' });
    }
  }

  /* ------------------------------ os avisos no chão ------------------------------ */

  _updateHazards(dt) {
    const run = this.run;
    for (const h of this.hazards) {
      h.t += dt;
      if (h.t >= h.warn && !h.fired) {
        h.fired = true;
        this._strike(h);
        if (h.kind === 'thunder') this.flash = 0.35;
        burst(run.particles, h.x, h.y, h.kind === 'thunder' ? '#fff3a0' : '#b8e6ff', 8, 220, 3, 0.5);
      }
    }
    this.hazards = this.hazards.filter((h) => h.t < h.warn + h.life);
    if (this.flash) this.flash = Math.max(0, this.flash - dt * 1.6);
  }

  /** O golpe cai: quem da equipe estiver dentro leva; o treinador dentro, o Pokémon mais perto defende. */
  _strike(h) {
    const run = this.run;
    let any = false;
    for (const c of run.companions) {
      if (c.dead || c.member.fainted) continue;
      if (Math.hypot(c.x - h.x, c.y - h.y) < h.r + c.radius) { run.damageCompanion(c, h.damage, h.type); any = true; }
    }
    if (!any && Math.hypot(run.player.x - h.x, run.player.y - h.y) < h.r + run.player.radius) {
      run.damageCompanion(run.nearestCompanion(h.x, h.y), h.damage, h.type);
    }
  }
}
