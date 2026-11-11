import { CONFIG } from '../core/config.js';
import { DIVE_WORLD } from '../data/diveWorld.js';
import { rand, weightedPick } from '../core/utils.js';
import { bus, EVENTS } from '../core/events.js';
import { burst } from '../entities/effects.js';
import { playCry } from '../audio/cry.js';
import { LegendaryFight } from './legendaryFight.js';

const SCALE = CONFIG.render.pixelScale;
const TAU = Math.PI * 2;

/**
 * A LUTA DO KYOGRE (0.37, PLANEJAMENTO-DIVE.md seção 9) — o que só esta luta tem,
 * por cima da fase de sempre (data/stages.js `kyogre`, `legendaryFight`):
 *
 * - o Kyogre sai do lago no meio do salão (o chefe da fase, `kyogre_boss`);
 * - OS ATAQUES (0.37.5, o Fellipe: "mais destrutivos e cinematográficos, ele é um
 *   lendário com muita importância"), cada um com aviso e impacto:
 *   - Origin Pulse: ele para, as marcas vermelhas acendem, e três anéis de onda
 *     grossos explodem dele, com clarão e tremor;
 *   - Water Spout: colunas d'água estouram do chão em volta do treinador (mais
 *     fortes com a vida cheia, como no jogo original);
 *   - Thunder (abaixo de 50%): o céu escurece e raios ramificados caem nos lugares
 *     marcados, com clarão e marca queimada no chão;
 *   - Maremoto (aos 66% e aos 33%, e de tempos em tempos na fúria): o grito, uma onda
 *     gigante atravessa a arena inteira, e só a bolha de ar marcada no chão protege;
 *   - a horda chamada e o mergulho (abaixo de 50%: ele afunda no chão e reaparece num
 *     lugar ao acaso, que borbulha antes);
 * - a fúria abaixo de 20% (os ataques mais densos);
 * - A CAPTURA (as 3 Dive Balls, a exaustão e a maré final de 30 s) é a do molde das
 *   missões, systems/legendaryFight.js (H-5), que nasceu daqui.
 *
 * O desenho está em render/legendaryFight.js. Roda sem navegador (os testes).
 */
export class KyogreFight extends LegendaryFight {
  constructor(run) {
    super(run);
    // os estados: waiting | rise | fight | charge | dive | exhausted | throw | gone
    this.tsunami = null;           // o maremoto: { phase, t, safe, dir, front, hits, damage }
    this.diveTimer = 12;
    this.ultimates = [...this.cfg.tsunamiAt];   // os maremotos que faltam (fração da vida)
    this.furyTsunami = 22;
    const arena = DIVE_WORLD.arena;
    this.lake = { x: arena.lake[0] * SCALE, y: arena.lake[1] * SCALE };
    this.boiling = 0;              // o lago fervendo antes de ele sair
  }

  /* ------------------------------ o laço (os ganchos do molde) ------------------------------ */

  _before(dt) {
    const run = this.run;
    if (!run.spawner.bossSpawned && run.time > run.stage.duration - 4) this.boiling = Math.min(1, this.boiling + dt / 3);
  }

  _updateSpecial(dt) { this._updateTsunami(dt); }

  _state(boss, dt) {
    switch (this.state) {
      case 'rise': {
        boss.rise = Math.min(1, this.t / 1.6);
        boss.x = this.lake.x; boss.y = this.lake.y;
        if (this.t >= 2.2) { boss.untouchable = false; this._set('fight'); }
        break;
      }
      case 'fight': this._fight(boss, dt); break;
      case 'charge': this._charge(boss); break;
      case 'dive': this._dive(boss); break;
      default: break;
    }
  }

  _calm() { this.tsunami = null; }

  _comeBack(boss) { this._resurface(boss); }

  /** O lago ferve, o grito, e ele sai da água devagar (intocável até terminar). */
  _rise(boss) {
    boss.x = this.lake.x; boss.y = this.lake.y;
    boss.rise = 0;
    boss.untouchable = true;
    this.boiling = 0;
    this.run.shake(10, 1.4);
    playCry(382);
    this._flash(0.5, '170,220,255');
    this.fx.push({ kind: 'splash', x: this.lake.x, y: this.lake.y, t: 0, life: 1.1, size: 260 });
    for (let i = 0; i < 30; i++) burst(this.run.particles, this.lake.x + rand(-140, 140), this.lake.y + rand(-70, 70), '#b8e6ff', 2, 260, 4, 1);
    this._set('rise');
  }

  _fight(boss, dt) {
    const frac = boss.hp / boss.maxHp;
    if (!this.fury && boss.enraged) {
      this.fury = true;
      this.run.shake(8, 0.8);
      this._flash(0.4, '255,90,80');
      playCry(382);
    }
    boss.sway = Math.sin(this.run.time * 2) * 0.08;
    // o maremoto: aos 66% e aos 33%, e de tempos em tempos na fúria
    if (!this.tsunami && this.ultimates.length && frac <= this.ultimates[0]) { this.ultimates.shift(); this._tsunami(boss); return; }
    if (this.fury && !this.tsunami) {
      this.furyTsunami -= dt;
      if (this.furyTsunami <= 0) { this.furyTsunami = 22; this._tsunami(boss); return; }
    }
    this.attackTimer -= dt;
    if (this.attackTimer <= 0 && !this.tsunami) this._attack(boss, frac);
    this.summonTimer -= dt;
    if (this.summonTimer <= 0) {
      this.summonTimer = this.fury ? 9 : 12;
      for (let i = 0; i < 3; i++) {
        const a = this.rng() * TAU, d = boss.radius + rand(40, 110);
        this.run.spawner.spawnAt(weightedPick(this.cfg.summons).id, boss.x + Math.cos(a) * d, boss.y + Math.sin(a) * d, this.run.spawner.summonLevel);
      }
    }
    if (frac < 0.5 && !this.tsunami) {
      this.diveTimer -= dt;
      if (this.diveTimer <= 0) { this.spot = this._randomSpot(280, 560); this._set('dive'); }
    }
  }

  /** Um ponto ao acaso a uma distância do treinador, dentro da arena (longe das paredes). */
  _randomSpot(min, max) {
    const p = this.run.player, w = this.run.world;
    let x = p.x, y = p.y;
    for (let i = 0; i < 40; i++) {
      const a = this.rng() * TAU, d = rand(min, max);
      x = p.x + Math.cos(a) * d; y = p.y + Math.sin(a) * d;
      if (x > 220 && y > 240 && x < w.width - 220 && y < w.height - 200) break;
    }
    return { x: Math.max(220, Math.min(w.width - 220, x)), y: Math.max(240, Math.min(w.height - 200, y)) };
  }

  /** O próximo ataque: depende da fase de vida (o Thunder só abaixo de 50%). */
  _attack(boss, frac) {
    const pool = ['pulse', 'spout', 'spout'];
    if (frac < 0.5) pool.push('thunder', 'thunder');
    const kind = pool[Math.floor(this.rng() * pool.length)];
    const p = this.run.player;
    if (kind === 'pulse') {
      // Origin Pulse: ele para e carrega; as marcas vermelhas acendem (o disparo vem em _charge)
      this._set('charge');
      boss.untouchable = false;
    } else if (kind === 'spout') {
      // Water Spout: mais colunas e mais forte com a vida cheia, como no jogo original
      const n = Math.round(6 + 4 * frac);
      for (let i = 0; i < n; i++) {
        const a = this.rng() * TAU, d = i === 0 ? 0 : rand(40, 240);
        this.hazards.push({ kind: 'spout', x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, r: 56,
          warn: 1.1 + i * 0.07, life: 0.8, t: 0, damage: this._damage(7 + 9 * frac), type: 'water' });
      }
    } else {
      // Thunder: o céu escurece e os raios caem sempre no lugar marcado (na chuva, não erram)
      for (let i = 0; i < 4; i++) {
        const a = this.rng() * TAU, d = i === 0 ? 0 : rand(60, 210);
        this.hazards.push({ kind: 'thunder', x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, r: 48,
          warn: 1.0 + i * 0.28, life: 0.35, t: 0, damage: this._damage(14), type: 'electric' });
      }
    }
    const base = this.fury ? 1.6 : frac < 0.5 ? 2.2 : 2.9;
    this.attackTimer = base + this.rng() * 0.6;
  }

  /** A carga do Origin Pulse (0,9 s parado, brilhando) e a explosão dos três anéis. */
  _charge(boss) {
    boss.applyStatus('slow', { factor: 0, duration: 0.2 });
    if (this.t < this.cfg.pulseCharge) return;
    this.run.shake(13, 0.6);
    this._flash(0.45, '150,200,255');
    playCry(382);
    this.fx.push({ kind: 'splash', x: boss.x, y: boss.y, t: 0, life: 0.8, size: 200 });
    for (let i = 0; i < 3; i++) {
      this.rings.push({ x: boss.x, y: boss.y, r: boss.radius, speed: 540, max: 640, width: 44, delay: i * 0.34,
        damage: this._damage(10), hits: new Set(), kind: 'pulse' });
    }
    this._set('fight');
  }

  /** O mergulho: afunda no chão (intocável), o lugar ao acaso borbulha e ele volta com uma onda. */
  _dive(boss) {
    if (this.t < 0.6) { boss.rise = Math.max(0, 1 - this.t / 0.6); boss.untouchable = true; return; }
    if (!boss.hidden) { boss.hidden = true; boss.x = this.spot.x; boss.y = this.spot.y; }
    boss.applyStatus('slow', { factor: 0, duration: 0.2 });
    if (this.t < 1.9) return;
    boss.hidden = false; boss.untouchable = false; boss.rise = 1;
    this.diveTimer = this.fury ? 9 : 13;
    this.attackTimer = 0.9;
    this._resurface(boss);
    this._set('fight');
  }

  /** A volta à tona: um anel de onda, o tremor e o estouro de água. */
  _resurface(boss) {
    this.rings.push({ x: boss.x, y: boss.y, r: boss.radius, speed: 620, max: 420, width: 52, delay: 0,
      damage: this._damage(9), hits: new Set(), kind: 'surface' });
    this.fx.push({ kind: 'splash', x: boss.x, y: boss.y, t: 0, life: 0.9, size: 230 });
    this.run.shake(9, 0.6);
    for (let i = 0; i < 18; i++) burst(this.run.particles, boss.x + rand(-60, 60), boss.y + rand(-30, 30), '#b8e6ff', 2, 300, 4, 0.8);
  }

  /* ------------------------------ o maremoto ------------------------------ */

  /** O grito, a bolha de ar marcada no chão e, depois do aviso, a onda gigante atravessando a arena. */
  _tsunami(boss) {
    const safe = { ...this._randomSpot(240, 380), r: 150 };
    const dir = this.rng() < 0.5 ? 1 : -1;
    this.tsunami = { phase: 'warn', t: 0, safe, dir, front: dir > 0 ? -300 : this.run.world.width + 300,
      hits: new Set(), damage: this._damage(this.cfg.tsunamiDamage) };
    this.hazards = [];
    this.attackTimer = 3;
    this.run.shake(10, 1.2);
    this._flash(0.35, '120,170,255');
    playCry(382);
    bus.emit(EVENTS.TOAST, { text: 'O Kyogre invoca um maremoto! Corra para a bolha de ar!', icon: 'boss' });
  }

  _updateTsunami(dt) {
    const ts = this.tsunami;
    if (!ts) return;
    ts.t += dt;
    const boss = this.boss;
    if (boss) boss.applyStatus('slow', { factor: 0, duration: 0.2 });
    if (ts.phase === 'warn') {
      if (ts.t >= this.cfg.tsunamiWarn) { ts.phase = 'sweep'; ts.t = 0; this.run.shake(16, 2.2); }
      return;
    }
    if (ts.phase === 'sweep') {
      ts.front += ts.dir * 1500 * dt;
      const run = this.run;
      const inSafe = (x, y) => Math.hypot(x - ts.safe.x, y - ts.safe.y) < ts.safe.r;
      const passed = (x) => (ts.dir > 0 ? ts.front >= x : ts.front <= x);
      let any = false;
      for (const c of run.companions) {
        if (c.dead || c.member.fainted || ts.hits.has(c) || !passed(c.x)) continue;
        ts.hits.add(c);
        if (!inSafe(c.x, c.y)) { run.damageCompanion(c, ts.damage, 'water'); any = true; }
      }
      const p = run.player;
      if (!any && !ts.hits.has(p) && passed(p.x)) {
        ts.hits.add(p);
        if (!inSafe(p.x, p.y)) run.damageCompanion(run.nearestCompanion(p.x, p.y), ts.damage, 'water');
      }
      const done = ts.dir > 0 ? ts.front > run.world.width + 400 : ts.front < -400;
      if (done) { ts.phase = 'after'; ts.t = 0; }
      return;
    }
    if (ts.t > 0.8) this.tsunami = null;
  }

  /* ------------------------------ os golpes que caem ------------------------------ */

  /** A coluna do Water Spout estoura (o raio é do molde). */
  _impactOther(h) {
    this.run.shake(4, 0.25);
    this.fx.push({ kind: 'column', x: h.x, y: h.y, t: 0, life: 0.85, r: h.r });
    burst(this.run.particles, h.x, h.y, '#b8e6ff', 16, 340, 4, 0.7);
  }
}
