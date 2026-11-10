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
 * - A CAPTURA: enquanto houver Dive Ball, a vida dele não passa de 15%. Lá, ele fica
 *   exausto, a horda para e a bola cai do alto num feixe de luz. Passar por cima é
 *   jogar: a bola voa até ele e sobe a faixa da captura (como a do Voar), com a Dive
 *   Ball balançando até 3 vezes, 10% de captura. Na falha, ele volta a 25%. Se a bola
 *   não for pega, ele se recupera do mesmo jeito, mas a bola não conta como gasta.
 * - capturou: a maré final de 30 s, sem o Kyogre. Só depois a fase é vencida.
 *
 * O desenho está em render/kyogreFight.js. Roda sem navegador (os testes).
 */
export class KyogreFight {
  constructor(run) {
    this.run = run;
    this.cfg = run.stage.legendaryFight;
    this.balls = this.cfg.balls;
    this.state = 'waiting';        // waiting | rise | fight | charge | dive | exhausted | throw | gone
    this.t = 0;
    this.hazards = [];             // os avisos no chão: { kind: 'spout' | 'thunder', x, y, r, warn, t, damage }
    this.rings = [];               // os anéis de onda: { x, y, r, speed, max, width, delay, damage, hits }
    this.fx = [];                  // o que só se vê: colunas, raios, marcas, estouros ({ kind, x, y, t, life })
    this.tsunami = null;           // o maremoto: { phase, t, safe, dir, front, hits, damage }
    this.ball = null;              // a Dive Ball no campo
    this.throwing = null;          // a bola voando e a faixa da captura
    this.final = null;             // a maré final: { t } (segundos que faltam)
    this.captured = false;
    this.holding = false;          // segura a vitória enquanto a maré final não acaba
    this.attackTimer = 2.5;
    this.summonTimer = 9;
    this.diveTimer = 12;
    this.ultimates = [...this.cfg.tsunamiAt];   // os maremotos que faltam (fração da vida)
    this.furyTsunami = 22;
    this.fury = false;
    this.flash = 0; this.flashColor = '255,255,255';
    this.dim = 0;                  // o céu escurecendo antes dos raios
    const arena = DIVE_WORLD.arena;
    this.lake = { x: arena.lake[0] * SCALE, y: arena.lake[1] * SCALE };
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
    this._updateRings(dt);
    this._updateTsunami(dt);
    this._updateFx(dt);
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
      case 'charge': this._charge(boss); break;
      case 'dive': this._dive(boss); break;
      case 'exhausted': {
        boss.applyStatus('slow', { factor: 0, duration: 0.2 });
        if (this.ball) {
          this.ball.t += dt;
          if (this.ball.t >= this.ball.fall && !this.ball.landed) this._ballLands();
          const p = run.player;
          if (this.ball.landed && Math.hypot(p.x - this.ball.x, p.y - this.ball.y) < 44) this._throw(boss);
        }
        if (this.state === 'exhausted' && this.t >= this.cfg.exhaust) this._recover(boss, false);
        break;
      }
      default: break;
    }
  }

  _set(state) { this.state = state; this.t = 0; }

  _flash(alpha, color = '255,255,255') { if (alpha >= this.flash) { this.flash = alpha; this.flashColor = color; } }

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

  /** O dano de um ataque do Kyogre, na mesma escala dos golpes dos líderes (AbilitySystem.fireHostile). */
  _damage(base) {
    const boss = this.boss;
    return base * CONFIG.enemies.damageMult * CONFIG.enemies.boss.damageMult * (boss?.attackMult ?? 1);
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

  /* ------------------------------ a captura ------------------------------ */

  /** A vida chegou no piso: ele fica exausto e a Dive Ball cai do alto, longe do treinador. */
  onFloor(boss) {
    if (this.state === 'exhausted' || this.state === 'throw' || this.balls <= 0) return;
    boss.hidden = false; boss.untouchable = false; boss.rise = 1;
    this._set('exhausted');
    this.hazards = [];
    this.rings = [];
    this.tsunami = null;
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
    this.ball = { x, y, t: 0, fall: 0.9, landed: false };
    this.run.shake(5, 0.5);
    this._flash(0.25, '170,230,255');
    bus.emit(EVENTS.TOAST, { text: 'O Kyogre está exausto! Uma Dive Ball caiu no campo!', icon: 'ball' });
  }

  /** A Dive Ball toca o chão: o estouro de luz e o brilho que fica pulsando. */
  _ballLands() {
    const b = this.ball;
    b.landed = true;
    this.run.shake(6, 0.4);
    this._flash(0.35, '190,240,255');
    this.fx.push({ kind: 'ballLand', x: b.x, y: b.y, t: 0, life: 0.9 });
    for (let i = 0; i < 20; i++) burst(this.run.particles, b.x, b.y, i % 2 ? '#8fe3ff' : '#ffffff', 2, 280, 4, 0.8);
  }

  /** Passou por cima: a bola voa até ele, e sobe a faixa da captura. A luta para enquanto isso. */
  _throw(boss) {
    const ok = this.rng() < this.cfg.chance;
    // na falha, ela abre depois de 1, 2 ou 3 balanços, como no jogo original
    const shakes = ok ? 3 : 1 + Math.floor(this.rng() * 3);
    this.throwing = { stage: 'fly', t: 0, from: { x: this.run.player.x, y: this.run.player.y - 20 }, to: { x: boss.x, y: boss.y },
      ok, need: shakes, shakes: 0, band: 0 };
    this.ball = null;
    this._set('throw');
    this.run.state = 'legendary';   // tudo para enquanto a bola balança (Run.update)
  }

  /**
   * O arremesso e a faixa da captura (Run.update chama no estado 'legendary'):
   * fly → absorb → open (a faixa sobe) → shake (cada balanço) → click ou burst → close.
   */
  updateThrow(dt) {
    const th = this.throwing, boss = this.boss;
    if (!th || !boss) { this.run.state = 'running'; return; }
    th.t += dt;
    this.flash = Math.max(0, this.flash - dt * 1.6);
    switch (th.stage) {
      case 'fly': if (th.t >= 0.6) { th.stage = 'absorb'; th.t = 0; this._flash(0.6, '255,255,255'); } break;
      case 'absorb':
        boss.rise = Math.max(0, 1 - th.t / 0.45);
        if (th.t >= 0.7) { th.stage = 'open'; th.t = 0; }
        break;
      case 'open':
        th.band = Math.min(1, th.t / 0.3);
        if (th.t >= 0.45) { th.stage = 'shake'; th.t = 0; }
        break;
      case 'shake':
        if (th.t >= 1.0) {
          th.t = 0;
          th.shakes++;
          if (th.shakes >= th.need) {
            th.stage = th.ok ? 'click' : 'burst';
            if (th.ok) this._flash(0.3, '255,255,210');
            else { this._flash(0.7, '255,255,255'); this.run.shake(8, 0.4); }
          }
        }
        break;
      case 'click': if (th.t >= 1.8) { th.stage = 'close'; th.t = 0; } break;
      case 'burst':
        if (th.t >= 1.3) { th.stage = 'close'; th.t = 0; boss.rise = 1; }
        break;
      case 'close':
        th.band = Math.max(0, 1 - th.t / 0.3);
        if (th.t >= 0.35) {
          if (th.ok) this._captured(boss);
          else { this.throwing = null; this.run.state = 'running'; this._recover(boss, true); }
        }
        break;
      default: break;
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
    this._resurface(boss);
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
    this.rings = []; this.hazards = []; this.tsunami = null;
    // toPC (0.37.9): ele vai sempre para o PC, e o card da captura avisa
    this.run.pendingGift = { choices: ['kyogre'], title: 'Gotcha! O Kyogre foi capturado!', mandatory: true, toPC: true };
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
      f.spawn = 0.5;
      for (let i = 0; i < 5; i++) this.run.spawner.spawn(weightedPick(this.cfg.summons).id, null, this.cfg.finalLevel);
    }
    if (f.t <= 0) {
      this.final = null;
      this.holding = false;
      bus.emit(EVENTS.TOAST, { text: 'A maré baixou.', icon: 'stages' });
    }
  }

  /* ------------------------------ os avisos, os anéis e os efeitos ------------------------------ */

  _updateHazards(dt) {
    const run = this.run;
    let thunderWarn = 0;
    for (const h of this.hazards) {
      h.t += dt;
      if (h.kind === 'thunder' && !h.fired) thunderWarn = Math.max(thunderWarn, Math.min(1, h.t / h.warn));
      if (h.t >= h.warn && !h.fired) {
        h.fired = true;
        this._strike(h);
        if (h.kind === 'thunder') {
          this._flash(0.6, '255,255,230');
          run.shake(9, 0.35);
          this.fx.push({ kind: 'bolt', x: h.x, y: h.y, t: 0, life: 0.4, seed: this.rng() * 1000 });
          this.fx.push({ kind: 'scorch', x: h.x, y: h.y, t: 0, life: 2.6, r: h.r });
          burst(run.particles, h.x, h.y, '#fff3a0', 14, 320, 3, 0.5);
        } else {
          run.shake(4, 0.25);
          this.fx.push({ kind: 'column', x: h.x, y: h.y, t: 0, life: 0.85, r: h.r });
          burst(run.particles, h.x, h.y, '#b8e6ff', 16, 340, 4, 0.7);
        }
      }
    }
    this.hazards = this.hazards.filter((h) => h.t < h.warn + h.life);
    // o céu escurece enquanto os raios se armam
    const target = thunderWarn * 0.45;
    this.dim += (target - this.dim) * Math.min(1, dt * 6);
    if (this.flash) this.flash = Math.max(0, this.flash - dt * 1.6);
  }

  /** Os anéis crescem; quem a borda do anel cruzar leva (uma vez por anel). */
  _updateRings(dt) {
    const run = this.run;
    for (const ring of this.rings) {
      if (ring.delay > 0) { ring.delay -= dt; continue; }
      ring.r += ring.speed * dt;
      const band = ring.width / 2;
      let any = false;
      for (const c of run.companions) {
        if (c.dead || c.member.fainted || ring.hits.has(c)) continue;
        if (Math.abs(Math.hypot(c.x - ring.x, c.y - ring.y) - ring.r) < band + c.radius) {
          ring.hits.add(c); run.damageCompanion(c, ring.damage, 'water'); any = true;
        }
      }
      const p = run.player;
      if (!any && !ring.hits.has(p) && Math.abs(Math.hypot(p.x - ring.x, p.y - ring.y) - ring.r) < band + p.radius) {
        ring.hits.add(p);
        run.damageCompanion(run.nearestCompanion(p.x, p.y), ring.damage, 'water');
      }
      ring.done = ring.r >= ring.max;
    }
    this.rings = this.rings.filter((r) => !r.done);
  }

  _updateFx(dt) {
    for (const f of this.fx) f.t += dt;
    this.fx = this.fx.filter((f) => f.t < f.life);
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
