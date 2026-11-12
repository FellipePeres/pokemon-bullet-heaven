import { CONFIG } from '../core/config.js';
import { rand } from '../core/utils.js';
import { bus, EVENTS } from '../core/events.js';
import { burst } from '../entities/effects.js';
import { playCry } from '../audio/cry.js';
import { LegendaryFight } from './legendaryFight.js';

const TAU = Math.PI * 2;

/** A distância do ponto (px, py) ao segmento de (ax, ay) a (bx, by). */
function toSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len = dx * dx + dy * dy;
  const k = len ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len)) : 0;
  return Math.hypot(px - (ax + dx * k), py - (ay + dy * k));
}

/** A diferença entre dois ângulos, de 0 a PI. */
function angleGap(a, b) {
  const d = Math.abs(((a - b) % TAU + TAU) % TAU);
  return d > Math.PI ? TAU - d : d;
}

/**
 * A LUTA DO ARTICUNO (H-7, "Derrote e liberte o Articuno", PLANEJAMENTO-HISTORIA.md seção 5.2),
 * no molde das missões (systems/legendaryFight.js), no fundo das Ilhas Seafoam:
 *
 * - PRESO: nos primeiros 45 s, o Articuno está acorrentado à máquina do emblema vermelho, coberta
 *   de gelo, no alto da arena, e a horda de Seafoam vem em cima. Nos últimos segundos a máquina
 *   sobrecarrega; quando ele entra em campo, as correntes arrebentam.
 * - A NEVASCA, O TEMPO TODO (o desafio dele):
 *   - a névoa: o jogador só enxerga perto do treinador, e a horda lá fora vira sombra. O alcance
 *     (`sight`) cai quando ele perde vida (o desenho, render/articunoFight.js);
 *   - o gelo no chão: os golpes dele deixam gelo por `iceLife` segundos, e em cima dele o
 *     treinador anda `iceSlow` mais devagar (Run.update pergunta `trainerSpeed`).
 * - OS ATAQUES, cada um com aviso:
 *   - Raio de Gelo: a mira tracejada acende até o treinador por `beamWarn` s, e o raio passa
 *     pela faixa, deixando um rastro de gelo (dois seguidos na fúria);
 *   - Nevasca: o cone acende no chão na frente dele por `coneWarn` s, e a rajada passa; quem
 *     sai do cone a tempo não leva nada (deixa gelo pelo caminho);
 *   - o anel de gelo: dois anéis saem dele;
 *   - a horda chamada.
 * - FRIO ABSOLUTO (o golpe exclusivo dele, aos 66% e aos 33% da vida, e a cada `coldEvery` s na
 *   fúria): ele some na névoa, intocável; a geada cobre a arena e só o olho da nevasca fica livre,
 *   um círculo que anda devagar pelo caminho marcado. Fora dele, o frio tira vida da equipe e
 *   deixa o treinador lento. Depois de `coldTime` s, ele mergulha num lugar marcado, com o anel.
 * - A fúria abaixo de 20%: os ataques mais seguidos.
 * - FRACO: a máquina suga a energia dele há muito tempo (como a do Zapdos). Por isso a luta é de
 *   nível 57, para logo depois da Fase 7.
 * - SEM CAPTURA: a fase não tem bolas (o molde fica sem piso de vida). Derrotado, ele cai sem
 *   forças, e a fase é vencida; na cena de depois (`articuno_livre`) ele foge, assustado.
 *
 * O desenho está em render/articunoFight.js. Roda sem navegador (os testes).
 */
export class ArticunoFight extends LegendaryFight {
  constructor(run) {
    super(run);
    // os estados: waiting | break | fight | beam | cone | cold | exhausted | throw | gone
    const [mx, my] = this.cfg.machine;
    this.machine = { x: mx, y: my, broken: false, overload: 0 };
    this.glow = { fall: '200,236,255', land: '220,244,255', spark: '#bfe9ff',
      beamTop: '200,236,255', beam: '230,248,255', soft: '170,220,255', ring: '210,240,255' };
    // o dano antes de ele entrar em campo: a força dele de quando entrar
    this.attackMult = (run.stage.bossTuning?.damage ?? 1) * (run.stage.difficulty ?? 1);
    this.ultimates = [...this.cfg.coldAt];   // os Frios Absolutos que faltam (fração da vida)
    this.furyCold = this.cfg.coldEvery;
    this.snapped = false;                    // as correntes já arrebentaram
    this.beam = null;                        // o Raio de Gelo
    this.cone = null;                        // a Nevasca
    this.cold = null;                        // o Frio Absoluto
    this.ice = [];                           // o gelo no chão: { x, y, r, t, life } ou a faixa { x0, y0, x1, y1, w, t, life }
    this.coldTick = 0;
    this.downed = false;                     // derrotado: caiu sem forças (foge na cena de depois)
    this._blockMachine();
  }

  /** A base da máquina bloqueia o caminho (o treinador e a horda contornam), como no Zapdos. */
  _blockMachine() {
    const terrain = this.run.terrain;
    const grid = terrain?.grid(this.run.world.scene);
    if (!grid) return;
    const tile = 16 * CONFIG.render.pixelScale;
    const x0 = Math.floor((this.machine.x - 44) / tile), x1 = Math.floor((this.machine.x + 44) / tile);
    const y0 = Math.floor((this.machine.y - 10) / tile), y1 = Math.floor((this.machine.y + 40) / tile);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) grid.solid[y * grid.cols + x] = 1;
  }

  _damage(base) {
    return base * CONFIG.enemies.damageMult * CONFIG.enemies.boss.damageMult * (this.boss?.attackMult ?? this.attackMult);
  }

  /** Onde ele fica preso: em cima da máquina. */
  get perch() { return { x: this.machine.x, y: this.machine.y - 40 }; }

  /** O alcance da vista na névoa (px do mundo): menor quando ele perde vida, menor ainda na fúria. */
  get sight() {
    const [full, half, fury] = this.cfg.sight;
    const boss = this.boss;
    if (!boss) return full;
    if (this.fury) return fury;
    return boss.hp / boss.maxHp < 0.5 ? half : full;
  }

  /** O treinador está em cima do gelo do chão? */
  onIce(x, y) {
    return this.ice.some((i) => (i.x0 != null ? toSegment(x, y, i.x0, i.y0, i.x1, i.y1) < i.w / 2 : Math.hypot(x - i.x, y - i.y) < i.r));
  }

  /** Dentro do olho da nevasca (o Frio Absoluto)? */
  inEye(x, y) {
    const eye = this.cold?.eye;
    return !!eye && Math.hypot(x - eye.x, y - eye.y) < eye.r;
  }

  /**
   * O quanto o treinador anda (Run.update): mais devagar em cima do gelo e fora do olho da
   * nevasca, durante o Frio Absoluto. 1 é normal.
   */
  trainerSpeed() {
    const p = this.run.player;
    if (this.cold?.phase === 'frost' && this.cold.frost > 0.5 && !this.inEye(p.x, p.y)) return 1 - this.cfg.coldSlow;
    return this.onIce(p.x, p.y) ? 1 - this.cfg.iceSlow : 1;
  }

  /* ------------------------------ o laço (os ganchos do molde) ------------------------------ */

  _updateSpecial(dt) {
    const run = this.run;
    // a máquina sobrecarregando nos últimos segundos antes de ele entrar em campo
    if (!run.spawner.bossSpawned && run.time > run.stage.duration - 4) this.machine.overload = Math.min(1, this.machine.overload + dt / 3);
    for (const i of this.ice) i.t += dt;
    this.ice = this.ice.filter((i) => i.t < i.life);
    if (this.cold?.phase === 'frost') this._frost(dt);
  }

  /** Ele entrou em campo: ainda preso (a apresentação vem por cima); as correntes arrebentam logo depois. */
  _rise(boss) {
    const perch = this.perch;
    boss.x = perch.x; boss.y = perch.y;
    boss.rise = 1;
    boss.untouchable = true;
    this.machine.overload = 1;
    this._set('break');
  }

  _state(boss, dt) {
    switch (this.state) {
      case 'break': this._break(boss); break;
      case 'fight': this._fight(boss, dt); break;
      case 'beam': this._beam(boss); break;
      case 'cone': this._cone(boss); break;
      case 'cold': this._cold(boss, dt); break;
      default: break;
    }
  }

  /** As correntes arrebentam: o clarão, o grito, os elos voando e o gelo estilhaçando; a luta começa. */
  _break(boss) {
    boss.applyStatus('slow', { factor: 0, duration: 0.2 });
    const perch = this.perch;
    boss.x = perch.x;
    boss.y = perch.y - 50 * Math.min(1, Math.max(0, this.t - 0.25) / 1.4);
    if (!this.snapped && this.t >= 0.25) {
      this.snapped = true;
      this.machine.broken = true;
      this.run.shake(13, 1.4);
      playCry(this.dex);
      this._flash(0.75, '230,246,255');
      this.fx.push({ kind: 'chainsnap', x: perch.x, y: perch.y, t: 0, life: 1.4, seed: this.rng() * 1000 });
      this.fx.push({ kind: 'shatter', x: this.machine.x, y: this.machine.y, t: 0, life: 1.0, r: 230, seed: this.rng() * 1000 });
      for (let i = 0; i < 30; i++) burst(this.run.particles, this.machine.x + rand(-130, 130), this.machine.y + rand(-60, 60), i % 2 ? '#bfe9ff' : '#ffffff', 2, 300, 4, 1);
      bus.emit(EVENTS.TOAST, { text: 'As correntes arrebentaram! O Articuno está fraco, mas furioso!', icon: 'boss' });
    }
    if (this.t >= 2.2) { boss.untouchable = false; this.attackTimer = 1.2; this._set('fight'); }
  }

  _fight(boss, dt) {
    const frac = boss.hp / boss.maxHp;
    if (!this.fury && boss.enraged) {
      this.fury = true;
      this.run.shake(8, 0.8);
      this._flash(0.4, '220,240,255');
      playCry(this.dex);
    }
    boss.sway = Math.sin(this.run.time * 2.6) * 0.06;
    // o Frio Absoluto: aos 66% e aos 33%, e de tempos em tempos na fúria
    if (this.ultimates.length && frac <= this.ultimates[0]) { this.ultimates.shift(); this._startCold(boss); return; }
    if (this.fury) {
      this.furyCold -= dt;
      if (this.furyCold <= 0) { this.furyCold = this.cfg.coldEvery; this._startCold(boss); return; }
    }
    this.attackTimer -= dt;
    if (this.attackTimer <= 0) this._attack(boss, frac);
    this.summonTimer -= dt;
    if (this.summonTimer <= 0) {
      this.summonTimer = this.fury ? 9 : 12;
      this._summon(boss, 3);
    }
  }

  /** O próximo ataque: abaixo de 50%, mais Raios de Gelo e mais Nevascas. */
  _attack(boss, frac) {
    const pool = ['beam', 'cone', 'ring'];
    if (frac < 0.5) pool.push('beam', 'cone');
    const kind = pool[Math.floor(this.rng() * pool.length)];
    if (kind === 'beam') this._startBeam(boss, this.fury ? 2 : 1, this.cfg.beamWarn);
    else if (kind === 'cone') this._startCone(boss);
    else this._iceRing(boss);
    const base = this.fury ? 1.8 : frac < 0.5 ? 2.4 : 3.0;
    this.attackTimer = base + this.rng() * 0.6;
  }

  /* ------------------------------ os ataques ------------------------------ */

  /** O anel de gelo: dois anéis saem dele. */
  _iceRing(boss) {
    this.run.shake(6, 0.4);
    this._flash(0.25, '220,244,255');
    for (let i = 0; i < 2; i++) {
      this.rings.push({ x: boss.x, y: boss.y, r: boss.radius, speed: 430, max: 560, width: 38, delay: i * 0.4,
        damage: this._damage(this.cfg.damage.ring), hits: new Set(), kind: 'ice', type: 'ice' });
    }
  }

  /** O Raio de Gelo: a faixa sai dele e passa do treinador; `left` são os que vêm em seguida. */
  _startBeam(boss, count, warn) {
    const p = this.run.player, w = this.run.world;
    let dx = p.x - boss.x, dy = p.y - boss.y;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d; dy /= d;
    const len = Math.max(800, d + 420);
    const x1 = Math.max(120, Math.min(w.width - 120, boss.x + dx * len));
    const y1 = Math.max(160, Math.min(w.height - 120, boss.y + dy * len));
    this.beam = { x0: boss.x, y0: boss.y, x1, y1, w: 76, phase: 'aim', warn, hits: new Set(),
      damage: this._damage(this.cfg.damage.beam), left: count - 1 };
    this._set('beam');
  }

  _beam(boss) {
    const bm = this.beam;
    if (!bm) { this._set('fight'); return; }
    boss.applyStatus('slow', { factor: 0, duration: 0.2 });
    if (bm.phase === 'aim') {
      if (this.t < bm.warn) return;
      // o raio passa: quem está na faixa leva (uma vez), e o rastro de gelo fica no chão
      bm.phase = 'fire';
      bm.from = this.t;
      const run = this.run;
      let any = false;
      for (const c of run.companions) {
        if (c.dead || c.member.fainted) continue;
        if (toSegment(c.x, c.y, bm.x0, bm.y0, bm.x1, bm.y1) < bm.w / 2 + c.radius) { run.damageCompanion(c, bm.damage, 'ice'); any = true; }
      }
      const p = run.player;
      if (!any && toSegment(p.x, p.y, bm.x0, bm.y0, bm.x1, bm.y1) < bm.w / 2 + p.radius) {
        run.damageCompanion(run.nearestCompanion(p.x, p.y), bm.damage, 'ice');
      }
      this.ice.push({ x0: bm.x0, y0: bm.y0, x1: bm.x1, y1: bm.y1, w: 64, t: 0, life: this.cfg.iceLife });
      run.shake(7, 0.35);
      this._flash(0.3, '220,246,255');
      burst(run.particles, bm.x1, bm.y1, '#bfe9ff', 14, 300, 3, 0.5);
      return;
    }
    if (this.t - bm.from < 0.35) return;
    if (bm.left > 0) { this._startBeam(boss, bm.left, 0.7); return; }
    this.beam = null;
    this.attackTimer = Math.max(this.attackTimer, 1.2);
    this._set('fight');
  }

  /** A Nevasca: o cone acende no chão, na frente dele, apontado para o treinador. */
  _startCone(boss) {
    const p = this.run.player;
    this.cone = { x: boss.x, y: boss.y, a: Math.atan2(p.y - boss.y, p.x - boss.x), spread: this.cfg.coneSpread, len: this.cfg.coneLength,
      phase: 'aim', warn: this.cfg.coneWarn, damage: this._damage(this.cfg.damage.cone) };
    this._set('cone');
  }

  /** Quem está dentro do cone da Nevasca? */
  inCone(x, y) {
    const c = this.cone;
    if (!c) return false;
    const d = Math.hypot(x - c.x, y - c.y);
    return d < c.len && (d < 40 || angleGap(Math.atan2(y - c.y, x - c.x), c.a) < c.spread);
  }

  _cone(boss) {
    const c = this.cone;
    if (!c) { this._set('fight'); return; }
    boss.applyStatus('slow', { factor: 0, duration: 0.2 });
    if (c.phase === 'aim') {
      if (this.t < c.warn) return;
      // a rajada passa: quem ficou no cone leva; o gelo fica pelo caminho
      c.phase = 'gust';
      c.from = this.t;
      const run = this.run;
      let any = false;
      for (const m of run.companions) {
        if (m.dead || m.member.fainted) continue;
        if (this.inCone(m.x, m.y)) { run.damageCompanion(m, c.damage, 'ice'); any = true; }
      }
      const p = run.player;
      if (!any && this.inCone(p.x, p.y)) run.damageCompanion(run.nearestCompanion(p.x, p.y), c.damage, 'ice');
      for (const k of [0.35, 0.6, 0.85]) {
        this.ice.push({ x: c.x + Math.cos(c.a) * c.len * k, y: c.y + Math.sin(c.a) * c.len * k, r: 60 + 50 * k, t: 0, life: this.cfg.iceLife });
      }
      run.shake(8, 0.5);
      this._flash(0.35, '235,248,255');
      return;
    }
    if (this.t - c.from < 0.6) return;
    this.cone = null;
    this.attackTimer = Math.max(this.attackTimer, 1.2);
    this._set('fight');
  }

  /* ------------------------------ o Frio Absoluto ------------------------------ */

  _startCold(boss) {
    this.cold = { phase: 'up', frost: 0 };
    this.hazards = [];
    this.beam = null;
    this.cone = null;
    boss.untouchable = true;
    this.run.shake(10, 1.2);
    this._flash(0.4, '235,248,255');
    playCry(this.dex);
    bus.emit(EVENTS.TOAST, { text: 'O Articuno sumiu na névoa! Fique no olho da nevasca!', icon: 'boss' });
    this._set('cold');
  }

  /**
   * Onde o olho da nevasca está `s` segundos depois de a geada cobrir a arena: começa no
   * treinador e anda devagar, num caminho que se pode ler (as duas senoides da maquete).
   */
  eyeAt(s) {
    const c = this.cold, w = this.run.world, r = this.cfg.eyeRadius;
    const x = c.origin.x + Math.sin(s * 0.32) * 340;
    const y = c.origin.y + Math.sin(s * 0.55) * 200;
    return { x: Math.max(r + 80, Math.min(w.width - r - 80, x)), y: Math.max(r + 120, Math.min(w.height - r - 80, y)) };
  }

  /** Sobe e some; a geada cobre a arena com o olho andando; ele mergulha de volta num lugar marcado. */
  _cold(boss, dt) {
    const c = this.cold;
    boss.applyStatus('slow', { factor: 0, duration: 0.2 });
    if (c.phase === 'up') {
      boss.rise = Math.max(0, 1 - this.t / 0.7);
      if (this.t >= 0.7) {
        boss.hidden = true;
        const p = this.run.player;
        c.origin = { x: p.x, y: p.y };
        c.phase = 'frost';
        c.from = this.t;
        c.eye = { ...this.eyeAt(0), r: this.cfg.eyeRadius };
        this.coldTick = 0.5;
      }
      return;
    }
    if (c.phase === 'frost') {
      if (this.t - c.from < this.cfg.coldTime) return;
      // o mergulho: o lugar marcado perto do treinador
      const p = this.run.player, w = this.run.world;
      const a = this.rng() * TAU, d = rand(120, 240);
      c.spot = {
        x: Math.max(220, Math.min(w.width - 220, p.x + Math.cos(a) * d)),
        y: Math.max(240, Math.min(w.height - 200, p.y + Math.sin(a) * d))
      };
      c.phase = 'down';
      c.at = this.t + 1.0;
      this.hazards.push({ kind: 'icefall', x: c.spot.x, y: c.spot.y, r: 130, warn: 1.0, life: 0.4, t: 0,
        damage: this._damage(this.cfg.damage.dive), type: 'ice' });
      return;
    }
    // o mergulho de volta (a geada já recuando)
    c.frost = Math.max(0, c.frost - dt / 0.8);
    boss.x = c.spot.x; boss.y = c.spot.y;
    boss.hidden = false;
    boss.rise = Math.max(0, Math.min(1, 1 - (c.at - this.t) / 0.4));
    if (this.t < c.at) return;
    boss.rise = 1;
    boss.untouchable = false;
    this.cold = null;
    this.attackTimer = 1.4;
    this._iceRing(boss);
    this._set('fight');
  }

  /** A geada: sobe em 1,2 s; o olho anda; quem está fora dele leva o frio a cada meio segundo. */
  _frost(dt) {
    const c = this.cold;
    const s = this.t - c.from;
    c.frost = Math.min(1, s / 1.2);
    Object.assign(c.eye, this.eyeAt(s));
    if (c.frost < 0.9) return;
    this.coldTick -= dt;
    if (this.coldTick > 0) return;
    this.coldTick = 0.5;
    const run = this.run;
    for (const m of run.companions) {
      if (m.dead || m.member.fainted || this.inEye(m.x, m.y)) continue;
      run.damageCompanion(m, this._damage(this.cfg.damage.cold), 'ice');
      burst(run.particles, m.x, m.y - 10, '#e8f6ff', 4, 120, 2, 0.4);
    }
  }

  /* ------------------------------ os ganchos da captura ------------------------------ */

  _calm() {
    this.beam = null;
    this.cone = null;
    if (this.cold) {
      this.cold = null;
      const boss = this.boss;
      if (boss) { boss.hidden = false; boss.rise = 1; boss.untouchable = false; }
    }
  }

  _comeBack(boss) {
    this._iceRing(boss);
    this.fx.push({ kind: 'shatter', x: boss.x, y: boss.y, t: 0, life: 0.8, r: 200, seed: this.rng() * 1000 });
  }

  /** O mergulho de volta estilhaça o gelo no lugar marcado. */
  _impactOther(h) {
    if (h.kind !== 'icefall') return;
    this.run.shake(11, 0.5);
    this._flash(0.45, '235,248,255');
    this.fx.push({ kind: 'shatter', x: h.x, y: h.y, t: 0, life: 0.8, r: h.r, seed: this.rng() * 1000 });
    this.ice.push({ x: h.x, y: h.y, r: h.r * 0.8, t: 0, life: this.cfg.iceLife });
    burst(this.run.particles, h.x, h.y, '#bfe9ff', 22, 360, 4, 0.6);
  }

  /** Derrotado (combat.killEnemy): ele cai sem forças; a fuga, assustado, é a cena de depois. */
  onBossDown(boss) {
    if (boss.captured || this.downed || !boss.data.legendary) return;
    this.downed = true;
    this.hazards = [];
    this.rings = [];
    this.beam = null;
    this.cone = null;
    this.cold = null;
    this._flash(0.5, '235,248,255');
    playCry(this.dex);
    bus.emit(EVENTS.TOAST, { text: 'O Articuno caiu, sem forças!', icon: 'boss' });
  }
}
