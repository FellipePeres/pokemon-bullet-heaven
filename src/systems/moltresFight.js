import { CONFIG } from '../core/config.js';
import { rand } from '../core/utils.js';
import { bus, EVENTS } from '../core/events.js';
import { burst } from '../entities/effects.js';
import { playCry } from '../audio/cry.js';
import { LegendaryFight } from './legendaryFight.js';

const TAU = Math.PI * 2;

/** A diferença entre dois ângulos, de 0 a PI. */
function angleGap(a, b) {
  const d = Math.abs(((a - b) % TAU + TAU) % TAU);
  return d > Math.PI ? TAU - d : d;
}

/**
 * A LUTA DO MOLTRES (H-8, "Derrote e liberte o Moltres", PLANEJAMENTO-HISTORIA.md seção 5.3), no
 * molde das missões (systems/legendaryFight.js), no cume do Monte Brasa:
 *
 * - PRESO: nos primeiros 45 s, o Moltres está acorrentado à máquina do emblema vermelho, em brasa,
 *   no alto da arena, e a horda do Monte Brasa vem em cima. Nos últimos segundos a máquina
 *   sobrecarrega; quando ele entra em campo, as correntes arrebentam.
 * - O SOL FORTE, O TEMPO TODO (`weather: 'sun'` na fase, combat.weatherMultiplier): golpes de Fogo
 *   ×1,5 e de Água ×0,5, para todos (o contrário da chuva do Kyogre). E o chão em brasa: os golpes
 *   dele deixam fogo no chão por `burnLife` s, e quem da equipe ficar em cima perde vida.
 * - OS ATAQUES, cada um com aviso:
 *   - Lança-chamas: um leque acende na frente dele por `sweepWarn` s, com o lado da varredura
 *     marcado, e a chama varre o leque de uma ponta à outra em `sweepTime` s (deixa brasa);
 *   - Redemoinho de Fogo: um anel de fogo se fecha em volta do treinador, com uma saída marcada;
 *     encostar no anel queima, e quem ainda estiver dentro quando ele fecha queima mais;
 *   - Onda de Calor (o segundo golpe dele): dois anéis quentes;
 *   - a horda chamada.
 * - FOGO SAGRADO (o golpe exclusivo, aos 66% e aos 33%, e a cada `sacredEvery` s na fúria): ele
 *   sobe para o sol, intocável, e `rocks` rochas sobem do chão. O fogo cai na arena inteira, menos
 *   na sombra das rochas; ele voa em círculo lá no alto, e as sombras giram junto. Depois de
 *   `sacredTime` s, ele mergulha num lugar marcado, com a Onda de Calor.
 * - A fúria abaixo de 20%: os ataques mais seguidos.
 * - FRACO: a máquina suga a energia dele há muito tempo. Nível 62, para logo depois da Fase 8.
 * - SEM CAPTURA: derrotado, ele cai sem forças; na cena de depois (`moltres_livre`) ele foge.
 *
 * O desenho está em render/moltresFight.js. Roda sem navegador (os testes).
 */
export class MoltresFight extends LegendaryFight {
  constructor(run) {
    super(run);
    // os estados: waiting | break | fight | sweep | sacred | exhausted | throw | gone
    const [mx, my] = this.cfg.machine;
    this.machine = { x: mx, y: my, broken: false, overload: 0 };
    this.glow = { fall: '255,200,120', land: '255,220,150', spark: '#ffb040',
      beamTop: '255,200,120', beam: '255,230,180', soft: '255,170,80', ring: '255,210,150' };
    this.attackMult = (run.stage.bossTuning?.damage ?? 1) * (run.stage.difficulty ?? 1);
    this.ultimates = [...this.cfg.sacredAt];   // os Fogos Sagrados que faltam (fração da vida)
    this.furySacred = this.cfg.sacredEvery;
    this.snapped = false;
    this.sweep = null;                         // o Lança-chamas
    this.spin = null;                          // o Redemoinho de Fogo (corre junto com a luta)
    this.sacred = null;                        // o Fogo Sagrado
    this.burn = [];                            // o chão em brasa: { x, y, r, t, life }
    this.burnTick = 0.5;
    this.downed = false;
    this._blockMachine();
  }

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

  get perch() { return { x: this.machine.x, y: this.machine.y - 40 }; }

  /** Alguém está em cima do chão em brasa? */
  onBurn(x, y) { return this.burn.some((b) => Math.hypot(x - b.x, y - b.y) < b.r); }

  /** A sombra das rochas do Fogo Sagrado protege (x, y)? */
  inShadow(x, y) {
    const s = this.sacred;
    if (!s?.rocks) return false;
    const L = this.sunAt();
    const len = this.cfg.shadowLength;
    return s.rocks.some((r) => {
      let dx = r.x - L.x, dy = r.y - L.y;
      const dl = Math.hypot(dx, dy) || 1;
      dx /= dl; dy /= dl;
      const along = (x - r.x) * dx + (y - r.y) * dy;
      if (along < -20 || along > len) return false;
      const side = Math.abs((x - r.x) * -dy + (y - r.y) * dx);
      return side < 34 + 22 * Math.max(0, along) / len;
    });
  }

  /** Onde o Moltres está no céu, durante o Fogo Sagrado: a luz das sombras, girando em volta da arena. */
  sunAt() {
    const s = this.sacred;
    const a = s ? s.angle0 + (this.t - (s.from ?? 0)) * 0.42 : 0;
    const c = s?.center ?? { x: 0, y: 0 };
    return { x: c.x + Math.cos(a) * 900, y: c.y + Math.sin(a) * 900 };
  }

  /** Onde o centro da sombra de uma rocha está agora (o bot e o desenho usam). */
  shadowSpot(rock, k = 0.45) {
    const L = this.sunAt();
    let dx = rock.x - L.x, dy = rock.y - L.y;
    const dl = Math.hypot(dx, dy) || 1;
    return { x: rock.x + (dx / dl) * this.cfg.shadowLength * k, y: rock.y + (dy / dl) * this.cfg.shadowLength * k };
  }

  /* ------------------------------ o laço (os ganchos do molde) ------------------------------ */

  _updateSpecial(dt) {
    const run = this.run;
    if (!run.spawner.bossSpawned && run.time > run.stage.duration - 4) this.machine.overload = Math.min(1, this.machine.overload + dt / 3);
    for (const b of this.burn) b.t += dt;
    this.burn = this.burn.filter((b) => b.t < b.life);
    if (this.spin) this._spin(dt);
    // o fogo no chão e o fogo sagrado contam a cada meio segundo
    this.burnTick -= dt;
    if (this.burnTick <= 0) {
      this.burnTick = 0.5;
      if (this.burn.length) this._burnGround();
      if (this.sacred?.phase === 'fire' && this.sacred.rise > 0.9) this._sacredFire();
    }
  }

  /** O chão em brasa: quem da equipe estiver em cima perde vida (a cada meio segundo). */
  _burnGround() {
    const run = this.run;
    for (const c of run.companions) {
      if (c.dead || c.member.fainted || !this.onBurn(c.x, c.y)) continue;
      run.damageCompanion(c, this._damage(this.cfg.damage.burn), 'fire');
    }
  }

  /** O Fogo Sagrado: quem da equipe estiver fora da sombra das rochas queima (a cada meio segundo). */
  _sacredFire() {
    const run = this.run;
    for (const c of run.companions) {
      if (c.dead || c.member.fainted || this.inShadow(c.x, c.y)) continue;
      run.damageCompanion(c, this._damage(this.cfg.damage.sacred), 'fire');
      burst(run.particles, c.x, c.y - 10, '#ffb040', 3, 120, 2, 0.4);
    }
  }

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
      case 'sweep': this._sweep(boss); break;
      case 'sacred': this._sacred(boss, dt); break;
      default: break;
    }
  }

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
      this._flash(0.75, '255,230,190');
      this.fx.push({ kind: 'chainsnap', x: perch.x, y: perch.y, t: 0, life: 1.4, seed: this.rng() * 1000 });
      this.fx.push({ kind: 'flare', x: this.machine.x, y: this.machine.y, t: 0, life: 1.0, r: 230, seed: this.rng() * 1000 });
      for (let i = 0; i < 30; i++) burst(this.run.particles, this.machine.x + rand(-130, 130), this.machine.y + rand(-60, 60), i % 2 ? '#ffb040' : '#fff2a0', 2, 300, 4, 1);
      bus.emit(EVENTS.TOAST, { text: 'As correntes arrebentaram! O Moltres está fraco, mas furioso!', icon: 'boss' });
    }
    if (this.t >= 2.2) { boss.untouchable = false; this.attackTimer = 1.2; this._set('fight'); }
  }

  _fight(boss, dt) {
    const frac = boss.hp / boss.maxHp;
    if (!this.fury && boss.enraged) {
      this.fury = true;
      this.run.shake(8, 0.8);
      this._flash(0.4, '255,200,120');
      playCry(this.dex);
    }
    boss.sway = Math.sin(this.run.time * 2.8) * 0.06;
    if (this.ultimates.length && frac <= this.ultimates[0]) { this.ultimates.shift(); this._startSacred(boss); return; }
    if (this.fury) {
      this.furySacred -= dt;
      if (this.furySacred <= 0) { this.furySacred = this.cfg.sacredEvery; this._startSacred(boss); return; }
    }
    this.attackTimer -= dt;
    if (this.attackTimer <= 0) this._attack(boss, frac);
    this.summonTimer -= dt;
    if (this.summonTimer <= 0) {
      this.summonTimer = this.fury ? 9 : 12;
      this._summon(boss, 3);
    }
  }

  /** O próximo ataque: abaixo de 50%, mais Lança-chamas e mais Redemoinhos. */
  _attack(boss, frac) {
    const pool = ['sweep', 'spin', 'wave'];
    if (frac < 0.5) pool.push('sweep', 'spin');
    let kind = pool[Math.floor(this.rng() * pool.length)];
    if (kind === 'spin' && this.spin) kind = 'sweep';
    if (kind === 'sweep') this._startSweep(boss);
    else if (kind === 'spin') this._startSpin();
    else this._heatWave(boss);
    const base = this.fury ? 1.8 : frac < 0.5 ? 2.4 : 3.0;
    this.attackTimer = base + this.rng() * 0.6;
  }

  /* ------------------------------ os ataques ------------------------------ */

  /** A Onda de Calor: dois anéis quentes saem dele. */
  _heatWave(boss) {
    this.run.shake(6, 0.4);
    this._flash(0.25, '255,210,150');
    for (let i = 0; i < 2; i++) {
      this.rings.push({ x: boss.x, y: boss.y, r: boss.radius, speed: 440, max: 580, width: 40, delay: i * 0.4,
        damage: this._damage(this.cfg.damage.ring), hits: new Set(), kind: 'heat', type: 'fire' });
    }
  }

  /** O Lança-chamas: o leque na frente dele, apontado para o treinador, e o lado para onde a chama vai. */
  _startSweep(boss) {
    const p = this.run.player;
    const aim = Math.atan2(p.y - boss.y, p.x - boss.x);
    const half = this.cfg.sweepArc / 2;
    const cw = this.rng() < 0.5;
    this.sweep = { x: boss.x, y: boss.y, from: cw ? aim - half : aim + half, to: cw ? aim + half : aim - half,
      range: this.cfg.sweepRange, phase: 'aim', warn: this.cfg.sweepWarn, hits: new Set(), lastPatch: null,
      damage: this._damage(this.cfg.damage.sweep) };
    this._set('sweep');
  }

  /** O ângulo da chama agora (só na varredura). */
  get sweepAngle() {
    const s = this.sweep;
    if (!s || s.phase !== 'fire') return null;
    const k = Math.min(1, (this.t - s.start) / this.cfg.sweepTime);
    return s.from + (s.to - s.from) * k;
  }

  /** Quem está dentro do leque do Lança-chamas? */
  inSweep(x, y) {
    const s = this.sweep;
    if (!s) return false;
    const d = Math.hypot(x - s.x, y - s.y);
    if (d > s.range) return false;
    const mid = (s.from + s.to) / 2;
    return d < 40 || angleGap(Math.atan2(y - s.y, x - s.x), mid) <= Math.abs(s.to - s.from) / 2;
  }

  _sweep(boss) {
    const s = this.sweep;
    if (!s) { this._set('fight'); return; }
    boss.applyStatus('slow', { factor: 0, duration: 0.2 });
    if (s.phase === 'aim') {
      if (this.t < s.warn) return;
      s.phase = 'fire';
      s.start = this.t;
      this.run.shake(6, 0.3);
      return;
    }
    const a = this.sweepAngle;
    const run = this.run;
    // a chama passa: quem estiver na linha dela leva (uma vez por Lança-chamas)
    const hit = (x, y, radius) => Math.hypot(x - s.x, y - s.y) < s.range + radius
      && angleGap(Math.atan2(y - s.y, x - s.x), a) < 0.09 + radius / Math.max(60, Math.hypot(x - s.x, y - s.y));
    let any = false;
    for (const c of run.companions) {
      if (c.dead || c.member.fainted || s.hits.has(c)) continue;
      if (hit(c.x, c.y, c.radius)) { s.hits.add(c); run.damageCompanion(c, s.damage, 'fire'); any = true; }
    }
    const p = run.player;
    if (!any && !s.hits.has(p) && hit(p.x, p.y, p.radius)) {
      s.hits.add(p);
      run.damageCompanion(run.nearestCompanion(p.x, p.y), s.damage, 'fire');
    }
    // a brasa fica pelo caminho da chama
    if (s.lastPatch == null || Math.abs(a - s.lastPatch) > 0.16) {
      s.lastPatch = a;
      for (const r of [s.range * 0.35, s.range * 0.62, s.range * 0.88]) {
        this.burn.push({ x: s.x + Math.cos(a) * r, y: s.y + Math.sin(a) * r, r: 52 + r * 0.04, t: 0, life: this.cfg.burnLife });
      }
    }
    if (this.t - s.start < this.cfg.sweepTime + 0.15) return;
    this.sweep = null;
    this.attackTimer = Math.max(this.attackTimer, 1.2);
    this._set('fight');
  }

  /** O Redemoinho de Fogo: o anel se fecha em volta do treinador, com uma saída marcada. */
  _startSpin() {
    const p = this.run.player;
    this.spin = { x: p.x, y: p.y, gap: this.rng() * TAU, t: 0, tick: 0.3, r: this.cfg.spinRadius };
    this.run.shake(5, 0.4);
    bus.emit(EVENTS.TOAST, { text: 'Um redemoinho de fogo! Saia pela abertura!', icon: 'boss' });
  }

  /** Dentro da abertura do redemoinho (o lado da saída)? */
  inGap(x, y) {
    const s = this.spin;
    return !!s && angleGap(Math.atan2(y - s.y, x - s.x), s.gap) < this.cfg.spinGap / 2;
  }

  _spin(dt) {
    const s = this.spin;
    s.t += dt;
    const k = Math.min(1, s.t / this.cfg.spinTime);
    s.r = this.cfg.spinRadius - (this.cfg.spinRadius - this.cfg.spinEnd) * k;
    const run = this.run;
    s.tick -= dt;
    if (s.tick <= 0) {
      s.tick = 0.5;
      // encostar na parede de fogo queima (menos na abertura)
      for (const c of run.companions) {
        if (c.dead || c.member.fainted || this.inGap(c.x, c.y)) continue;
        if (Math.abs(Math.hypot(c.x - s.x, c.y - s.y) - s.r) < 26 + c.radius) run.damageCompanion(c, this._damage(this.cfg.damage.spin), 'fire');
      }
    }
    if (k < 1) return;
    // o anel fecha: quem ainda estiver dentro queima de vez
    for (const c of run.companions) {
      if (c.dead || c.member.fainted) continue;
      if (Math.hypot(c.x - s.x, c.y - s.y) < s.r + 10) run.damageCompanion(c, this._damage(this.cfg.damage.spin * 3), 'fire');
    }
    this.fx.push({ kind: 'flare', x: s.x, y: s.y, t: 0, life: 0.7, r: s.r * 1.6, seed: this.rng() * 1000 });
    this.burn.push({ x: s.x, y: s.y, r: s.r, t: 0, life: this.cfg.burnLife * 0.6 });
    run.shake(7, 0.4);
    this.spin = null;
  }

  /* ------------------------------ o Fogo Sagrado ------------------------------ */

  _startSacred(boss) {
    const p = this.run.player, w = this.run.world;
    const rocks = [];
    for (let i = 0; i < this.cfg.rocks; i++) {
      const a = (i / this.cfg.rocks) * TAU + Math.PI / 4;
      rocks.push({
        x: Math.max(180, Math.min(w.width - 180, p.x + Math.cos(a) * 250)),
        y: Math.max(220, Math.min(w.height - 160, p.y + Math.sin(a) * 210))
      });
    }
    this.sacred = { phase: 'up', rocks, rise: 0, center: { x: p.x, y: p.y }, angle0: this.rng() * TAU };
    this.hazards = [];
    this.sweep = null;
    this.spin = null;
    boss.untouchable = true;
    this.run.shake(10, 1.2);
    this._flash(0.4, '255,220,160');
    playCry(this.dex);
    bus.emit(EVENTS.TOAST, { text: 'O Moltres subiu para o sol! Fique na sombra das rochas!', icon: 'boss' });
    this._set('sacred');
  }

  _sacred(boss, dt) {
    const s = this.sacred;
    boss.applyStatus('slow', { factor: 0, duration: 0.2 });
    if (s.phase === 'up') {
      boss.rise = Math.max(0, 1 - this.t / 0.7);
      s.rise = Math.min(1, this.t / 1.0);
      if (this.t >= 1.0) { boss.hidden = true; s.phase = 'fire'; s.from = this.t; s.rise = 1; }
      return;
    }
    if (s.phase === 'fire') {
      if (this.t - s.from < this.cfg.sacredTime) return;
      const p = this.run.player, w = this.run.world;
      const a = this.rng() * TAU, d = rand(120, 240);
      s.spot = {
        x: Math.max(220, Math.min(w.width - 220, p.x + Math.cos(a) * d)),
        y: Math.max(240, Math.min(w.height - 200, p.y + Math.sin(a) * d))
      };
      s.phase = 'down';
      s.at = this.t + 1.0;
      this.hazards.push({ kind: 'flare', x: s.spot.x, y: s.spot.y, r: 130, warn: 1.0, life: 0.4, t: 0,
        damage: this._damage(this.cfg.damage.dive), type: 'fire' });
      return;
    }
    // o mergulho de volta; as rochas desmoronam
    s.rise = Math.max(0, s.rise - dt / 0.8);
    boss.x = s.spot.x; boss.y = s.spot.y;
    boss.hidden = false;
    boss.rise = Math.max(0, Math.min(1, 1 - (s.at - this.t) / 0.4));
    if (this.t < s.at) return;
    boss.rise = 1;
    boss.untouchable = false;
    for (const r of s.rocks) this.fx.push({ kind: 'crumble', x: r.x, y: r.y, t: 0, life: 0.9, seed: this.rng() * 1000 });
    this.sacred = null;
    this.attackTimer = 1.4;
    this._heatWave(boss);
    this._set('fight');
  }

  /* ------------------------------ os ganchos da captura ------------------------------ */

  _calm() {
    this.sweep = null;
    this.spin = null;
    if (this.sacred) {
      this.sacred = null;
      const boss = this.boss;
      if (boss) { boss.hidden = false; boss.rise = 1; boss.untouchable = false; }
    }
  }

  _comeBack(boss) {
    this._heatWave(boss);
    this.fx.push({ kind: 'flare', x: boss.x, y: boss.y, t: 0, life: 0.8, r: 200, seed: this.rng() * 1000 });
  }

  /** O mergulho de volta explode em chamas no lugar marcado. */
  _impactOther(h) {
    if (h.kind !== 'flare') return;
    this.run.shake(11, 0.5);
    this._flash(0.45, '255,220,160');
    this.fx.push({ kind: 'flare', x: h.x, y: h.y, t: 0, life: 0.8, r: h.r, seed: this.rng() * 1000 });
    this.burn.push({ x: h.x, y: h.y, r: h.r * 0.8, t: 0, life: this.cfg.burnLife });
    burst(this.run.particles, h.x, h.y, '#ffb040', 22, 360, 4, 0.6);
  }

  onBossDown(boss) {
    if (boss.captured || this.downed || !boss.data.legendary) return;
    this.downed = true;
    this.hazards = [];
    this.rings = [];
    this.sweep = null;
    this.spin = null;
    this.sacred = null;
    this._flash(0.5, '255,230,190');
    playCry(this.dex);
    bus.emit(EVENTS.TOAST, { text: 'O Moltres caiu, sem forças!', icon: 'boss' });
  }
}
