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

/**
 * A LUTA DO ZAPDOS (H-6, "Derrote e liberte o Zapdos", PLANEJAMENTO-HISTORIA.md seção 5),
 * no molde das missões (systems/legendaryFight.js), no fundo da Usina:
 *
 * - PRESO: nos primeiros 45 s, o Zapdos está acorrentado à máquina do emblema vermelho,
 *   no alto da arena, e a horda elétrica da Usina vem em cima. Nos últimos segundos a
 *   máquina sobrecarrega; quando ele entra em campo, as correntes arrebentam e ele sai
 *   furioso e confuso.
 * - A TEMPESTADE (o desafio dele): os raios caem o tempo todo, sempre num lugar marcado
 *   no chão antes, e cada vez mais seguidos conforme a vida dele cai.
 * - OS ATAQUES, cada um com aviso:
 *   - Zap Cannon: ele para e carrega; a esfera de trovão atravessa a arena devagar,
 *     dando choques em quem passa perto, e explode no lugar marcado;
 *   - Investida (Drill Peck): a faixa acende no chão até o treinador e ele cruza a
 *     arena por ela (duas seguidas na fúria);
 *   - Discharge: dois anéis elétricos saem dele;
 *   - a horda chamada;
 *   - A TEMPESTADE TOTAL (aos 66% e aos 33%, e de tempos em tempos na fúria): ele sobe
 *     para as nuvens (some, intocável), e o chão vira um tabuleiro: as casas de uma cor
 *     caem, depois as da outra, depois as da primeira de novo. Fica a salvo quem pisa
 *     onde o raio acabou de cair. No fim ele mergulha de volta num lugar marcado.
 * - A fúria abaixo de 20%: os ataques e a tempestade mais densos.
 * - FRACO (o refino do Fellipe): a máquina suga a energia dele pelas correntes e manda para
 *   longe, em ondas (o desenho mostra), há muito tempo. Por isso uma equipe logo depois da
 *   Fase 3 consegue vencê-lo.
 * - SEM CAPTURA: a fase não tem bolas (o molde fica sem piso de vida). Derrotado, ele cai sem
 *   forças, e a fase é vencida; na cena de depois (`zapdos_livre`) ele foge, assustado.
 *
 * O desenho está em render/zapdosFight.js. Roda sem navegador (os testes).
 */
export class ZapdosFight extends LegendaryFight {
  constructor(run) {
    super(run);
    // os estados: waiting | break | fight | cannon | peck | sky | exhausted | throw | gone
    const [mx, my] = this.cfg.machine;
    this.machine = { x: mx, y: my, broken: false, overload: 0 };
    this.baseDim = this.cfg.dim;             // o fundo da Usina é escuro
    this.dim = this.baseDim;
    this.glow = { fall: '255,236,150', land: '255,244,190', spark: '#ffe066',
      beamTop: '255,236,150', beam: '255,246,200', soft: '255,214,90', ring: '255,240,170' };
    // o dano antes de ele entrar em campo (a tempestade presa): a força dele de quando entrar
    this.attackMult = (run.stage.bossTuning?.damage ?? 1) * (run.stage.difficulty ?? 1);
    this.stormTimer = 4;                     // a tempestade: o próximo raio marcado
    this.ultimates = [...this.cfg.stormAt];  // as tempestades totais que faltam (fração da vida)
    this.furyStorm = 24;
    this.snapped = false;                    // as correntes já arrebentaram
    this.orb = null;                         // a esfera do Zap Cannon
    this.peck = null;                        // a Investida
    this.sky = null;                         // a tempestade total
    this.downed = false;                     // derrotado: caiu sem forças (foge na cena de depois)
    this._blockMachine();
  }

  /** A base da máquina bloqueia o caminho (o treinador e a horda contornam), como as pedras do cenário. */
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

  /* ------------------------------ o laço (os ganchos do molde) ------------------------------ */

  _updateSpecial(dt) {
    const run = this.run;
    // a máquina sobrecarregando nos últimos segundos antes de ele entrar em campo
    if (!run.spawner.bossSpawned && run.time > run.stage.duration - 4) this.machine.overload = Math.min(1, this.machine.overload + dt / 3);
    this._updateOrb(dt);
    this._storm(dt);
  }

  /** A tempestade: os raios caem o tempo todo, sempre num lugar marcado antes. */
  _storm(dt) {
    if (this.sky || this.quiet || this.final || this.downed || this.state === 'gone' || this.state === 'break') return;
    this.stormTimer -= dt;
    if (this.stormTimer > 0) return;
    const boss = this.boss;
    const frac = boss ? boss.hp / boss.maxHp : 1;
    const n = !boss ? 1 : this.fury ? 3 : frac < 0.5 ? 2 : 1 + (this.rng() < 0.5 ? 1 : 0);
    this.stormTimer = !boss ? this.cfg.stormEvery[0] : this.fury ? this.cfg.stormEvery[3] : frac < 0.5 ? this.cfg.stormEvery[2] : this.cfg.stormEvery[1];
    const p = this.run.player;
    for (let i = 0; i < n; i++) {
      const a = this.rng() * TAU, d = i === 0 ? rand(0, 90) : rand(130, 290);
      this.hazards.push({ kind: 'thunder', x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, r: 56,
        warn: 1.25 + i * 0.25, life: 0.35, t: 0, damage: this._damage(this.cfg.damage.storm), type: 'electric' });
    }
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
      case 'cannon': this._cannon(boss); break;
      case 'peck': this._peck(boss, dt); break;
      case 'sky': this._sky(boss); break;
      default: break;
    }
  }

  /** As correntes arrebentam: o clarão, o grito, os elos voando; ele sobe da máquina e a luta começa. */
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
      this._flash(0.75, '255,250,200');
      this.fx.push({ kind: 'chainsnap', x: perch.x, y: perch.y, t: 0, life: 1.4, seed: this.rng() * 1000 });
      this.fx.push({ kind: 'blast', x: this.machine.x, y: this.machine.y, t: 0, life: 0.9, r: 230 });
      for (let i = 0; i < 30; i++) burst(this.run.particles, this.machine.x + rand(-130, 130), this.machine.y + rand(-60, 60), i % 2 ? '#ffe066' : '#ffffff', 2, 300, 4, 1);
      bus.emit(EVENTS.TOAST, { text: 'As correntes arrebentaram! O Zapdos está fraco, mas furioso!', icon: 'boss' });
    }
    if (this.t >= 2.2) { boss.untouchable = false; this.attackTimer = 1.2; this._set('fight'); }
  }

  _fight(boss, dt) {
    const frac = boss.hp / boss.maxHp;
    if (!this.fury && boss.enraged) {
      this.fury = true;
      this.run.shake(8, 0.8);
      this._flash(0.4, '255,230,90');
      playCry(this.dex);
    }
    boss.sway = Math.sin(this.run.time * 3) * 0.06;
    // a tempestade total: aos 66% e aos 33%, e de tempos em tempos na fúria
    if (this.ultimates.length && frac <= this.ultimates[0]) { this.ultimates.shift(); this._startSky(boss); return; }
    if (this.fury) {
      this.furyStorm -= dt;
      if (this.furyStorm <= 0) { this.furyStorm = 24; this._startSky(boss); return; }
    }
    this.attackTimer -= dt;
    if (this.attackTimer <= 0) this._attack(boss, frac);
    this.summonTimer -= dt;
    if (this.summonTimer <= 0) {
      this.summonTimer = this.fury ? 9 : 12;
      this._summon(boss, 3);
    }
  }

  /** O próximo ataque: abaixo de 50%, mais Investidas e mais Zap Cannons. */
  _attack(boss, frac) {
    const pool = ['cannon', 'peck', 'discharge'];
    if (frac < 0.5) pool.push('peck', 'cannon');
    const kind = pool[Math.floor(this.rng() * pool.length)];
    if (kind === 'cannon') this._set('cannon');
    else if (kind === 'peck') this._startPeck(boss, this.fury ? 2 : 1, this.cfg.peckWarn);
    else this._discharge(boss);
    const base = this.fury ? 1.7 : frac < 0.5 ? 2.3 : 3.0;
    this.attackTimer = base + this.rng() * 0.6;
  }

  /* ------------------------------ os ataques ------------------------------ */

  /** Discharge: dois anéis elétricos saem dele. */
  _discharge(boss) {
    this.run.shake(7, 0.4);
    this._flash(0.3, '255,240,150');
    for (let i = 0; i < 2; i++) {
      this.rings.push({ x: boss.x, y: boss.y, r: boss.radius, speed: 470, max: 560, width: 40, delay: i * 0.4,
        damage: this._damage(this.cfg.damage.discharge), hits: new Set(), kind: 'discharge', type: 'electric' });
    }
  }

  /** O Zap Cannon: carrega parado (a mira segue o treinador) e solta a esfera, que explode no lugar marcado. */
  _cannon(boss) {
    boss.applyStatus('slow', { factor: 0, duration: 0.2 });
    if (this.t < this.cfg.cannonCharge) return;
    const p = this.run.player, w = this.run.world;
    const dx = p.x - boss.x, dy = p.y - boss.y, d = Math.hypot(dx, dy) || 1;
    const reach = 320 * 2.2;
    const end = {
      x: Math.max(160, Math.min(w.width - 160, boss.x + (dx / d) * reach)),
      y: Math.max(200, Math.min(w.height - 160, boss.y + (dy / d) * reach))
    };
    const life = 2.2;
    this.orb = { x: boss.x, y: boss.y, vx: (end.x - boss.x) / life, vy: (end.y - boss.y) / life, t: 0, life, zap: 0.3, end };
    this.hazards.push({ kind: 'blast', x: end.x, y: end.y, r: 150, warn: life, life: 0.5, t: 0,
      damage: this._damage(this.cfg.damage.cannon), type: 'electric' });
    this.run.shake(8, 0.4);
    this._flash(0.35, '255,240,150');
    playCry(this.dex);
    this._set('fight');
  }

  /** A esfera anda devagar e dá choques em quem passa perto (um por vez). */
  _updateOrb(dt) {
    const o = this.orb;
    if (!o) return;
    o.t += dt;
    o.x += o.vx * dt; o.y += o.vy * dt;
    o.zap -= dt;
    if (o.zap <= 0) {
      o.zap = 0.3;
      let best = null, bestD = 130;
      for (const c of this.run.companions) {
        if (c.dead || c.member.fainted) continue;
        const d = Math.hypot(c.x - o.x, c.y - o.y) - c.radius;
        if (d < bestD) { bestD = d; best = c; }
      }
      if (best) {
        this.run.damageCompanion(best, this._damage(this.cfg.damage.zap), 'electric');
        this.fx.push({ kind: 'zap', x: o.x, y: o.y, tx: best.x, ty: best.y, t: 0, life: 0.18, seed: this.rng() * 1000 });
      }
    }
    if (o.t >= o.life) this.orb = null;
  }

  /** A Investida: a faixa acende do Zapdos até depois do treinador; `left` são as que vêm em seguida. */
  _startPeck(boss, count, warn) {
    const p = this.run.player, w = this.run.world;
    let dx = p.x - boss.x, dy = p.y - boss.y;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d; dy /= d;
    const len = Math.max(700, d + 360);
    const x1 = Math.max(200, Math.min(w.width - 200, boss.x + dx * len));
    const y1 = Math.max(240, Math.min(w.height - 180, boss.y + dy * len));
    this.peck = { x0: boss.x, y0: boss.y, x1, y1, w: 130, phase: 'aim', warn, hits: new Set(),
      damage: this._damage(this.cfg.damage.peck), left: count - 1 };
    this._set('peck');
  }

  _peck(boss, dt) {
    const pk = this.peck;
    if (!pk) { this._set('fight'); return; }
    boss.applyStatus('slow', { factor: 0, duration: 0.2 });
    if (pk.phase === 'aim') {
      boss.x = pk.x0; boss.y = pk.y0;
      if (this.t >= pk.warn) { pk.phase = 'dash'; pk.from = this.t; this.run.shake(6, 0.3); }
      return;
    }
    const total = Math.hypot(pk.x1 - pk.x0, pk.y1 - pk.y0) || 1;
    const k = Math.min(1, ((this.t - pk.from) * 2100) / total);
    boss.x = pk.x0 + (pk.x1 - pk.x0) * k;
    boss.y = pk.y0 + (pk.y1 - pk.y0) * k;
    // quem estiver no caminho que ele já cruzou leva (uma vez por Investida)
    const run = this.run;
    let any = false;
    for (const c of run.companions) {
      if (c.dead || c.member.fainted || pk.hits.has(c)) continue;
      if (toSegment(c.x, c.y, pk.x0, pk.y0, boss.x, boss.y) < pk.w / 2 + c.radius) { pk.hits.add(c); run.damageCompanion(c, pk.damage, 'flying'); any = true; }
    }
    const p = run.player;
    if (!any && !pk.hits.has(p) && toSegment(p.x, p.y, pk.x0, pk.y0, boss.x, boss.y) < pk.w / 2 + p.radius) {
      pk.hits.add(p);
      run.damageCompanion(run.nearestCompanion(p.x, p.y), pk.damage, 'flying');
    }
    if (k < 1) return;
    this.run.shake(7, 0.3);
    burst(run.particles, boss.x, boss.y, '#ffe066', 14, 300, 3, 0.5);
    if (pk.left > 0) { this._startPeck(boss, pk.left, 0.6); return; }
    this.peck = null;
    this.attackTimer = Math.max(this.attackTimer, 1.2);
    this._set('fight');
  }

  /* ------------------------------ a tempestade total ------------------------------ */

  _startSky(boss) {
    this.sky = { phase: 'up' };
    this.hazards = [];
    this.orb = null;
    this.peck = null;
    boss.untouchable = true;
    this.run.shake(10, 1.2);
    this._flash(0.35, '255,240,150');
    playCry(this.dex);
    bus.emit(EVENTS.TOAST, { text: 'O Zapdos subiu para a tempestade! Fique onde o raio acabou de cair!', icon: 'boss' });
    this._set('sky');
  }

  /** Sobe e some; o tabuleiro de raios cai em três levas; ele volta mergulhando num lugar marcado. */
  _sky(boss) {
    const sk = this.sky;
    boss.applyStatus('slow', { factor: 0, duration: 0.2 });
    if (sk.phase === 'up') {
      boss.rise = Math.max(0, 1 - this.t / 0.7);
      if (this.t >= 0.7) { boss.hidden = true; sk.phase = 'storm'; sk.until = this.t + this._grid(); }
      return;
    }
    if (sk.phase === 'storm') {
      if (this.t < sk.until) return;
      const p = this.run.player, w = this.run.world;
      const a = this.rng() * TAU, d = rand(120, 240);
      sk.spot = {
        x: Math.max(220, Math.min(w.width - 220, p.x + Math.cos(a) * d)),
        y: Math.max(240, Math.min(w.height - 200, p.y + Math.sin(a) * d))
      };
      sk.phase = 'down';
      sk.at = this.t + 1.0;
      this.hazards.push({ kind: 'blast', x: sk.spot.x, y: sk.spot.y, r: 130, warn: 1.0, life: 0.4, t: 0,
        damage: this._damage(this.cfg.damage.dive), type: 'electric' });
      return;
    }
    // o mergulho de volta
    boss.x = sk.spot.x; boss.y = sk.spot.y;
    boss.hidden = false;
    boss.rise = Math.max(0, Math.min(1, 1 - (sk.at - this.t) / 0.4));
    if (this.t < sk.at) return;
    boss.rise = 1;
    boss.untouchable = false;
    this.sky = null;
    this.attackTimer = 1.4;
    this._discharge(boss);
    this._set('fight');
  }

  /**
   * O tabuleiro: casas de `stormCell` px em volta do treinador (ele no meio de uma). As
   * casas de uma cor caem primeiro (a dele inclusive), depois as da outra, depois as da
   * primeira de novo. Devolve quanto tempo a tempestade dura.
   */
  _grid() {
    const C = this.cfg.stormCell, half = C / 2;
    const p = this.run.player, w = this.run.world;
    const { stormWarn: warn, stormGap: gap } = this.cfg;
    for (let j = -2; j <= 2; j++) {
      for (let i = -3; i <= 3; i++) {
        const x = p.x + i * C, y = p.y + j * C;
        if (x < -half * 0.5 || y < -half * 0.5 || x > w.width + half * 0.5 || y > w.height + half * 0.5) continue;
        const parity = (((i + j) % 2) + 2) % 2;
        for (const wave of parity === 0 ? [0, 2] : [1]) {
          this.hazards.push({ kind: 'thunder', shape: 'square', x, y, r: half, warn: warn + wave * gap, life: 0.3, t: 0,
            damage: this._damage(this.cfg.damage.cell), type: 'electric', wave });
        }
      }
    }
    return warn + 2 * gap + 0.5;
  }

  /* ------------------------------ os ganchos da captura ------------------------------ */

  _calm() {
    this.orb = null;
    this.peck = null;
    if (this.sky) {
      this.sky = null;
      const boss = this.boss;
      if (boss) { boss.hidden = false; boss.rise = 1; boss.untouchable = false; }
    }
  }

  _comeBack(boss) {
    this._discharge(boss);
    this.fx.push({ kind: 'blast', x: boss.x, y: boss.y, t: 0, life: 0.8, r: 200 });
    for (let i = 0; i < 18; i++) burst(this.run.particles, boss.x + rand(-60, 60), boss.y + rand(-30, 30), '#ffe066', 2, 300, 4, 0.8);
  }

  /** A esfera do Zap Cannon e o mergulho de volta explodem no lugar marcado. */
  _impactOther(h) {
    if (h.kind !== 'blast') return;
    this.run.shake(11, 0.5);
    this._flash(0.45, '255,240,170');
    this.fx.push({ kind: 'blast', x: h.x, y: h.y, t: 0, life: 0.7, r: h.r });
    this.fx.push({ kind: 'scorch', x: h.x, y: h.y, t: 0, life: 2.6, r: h.r * 0.8 });
    burst(this.run.particles, h.x, h.y, '#ffe066', 22, 360, 4, 0.6);
  }

  /** Derrotado (combat.killEnemy): ele cai sem forças; a fuga, assustado, é a cena de depois. */
  onBossDown(boss) {
    if (boss.captured || this.downed || !boss.data.legendary) return;
    this.downed = true;
    this.hazards = [];
    this.rings = [];
    this.orb = null;
    this.peck = null;
    this._flash(0.5, '255,250,200');
    playCry(this.dex);
    bus.emit(EVENTS.TOAST, { text: 'O Zapdos caiu, sem forças!', icon: 'boss' });
  }
}
