import { CONFIG } from '../core/config.js';
import { weightedPick } from '../core/utils.js';
import { bus, EVENTS } from '../core/events.js';
import { burst } from '../entities/effects.js';
import { playCry } from '../audio/cry.js';

const TAU = Math.PI * 2;

/**
 * O MOLDE DAS LUTAS DE LENDÁRIO (H-5, PLANEJAMENTO-HISTORIA.md seção 5), tirado da
 * luta do Kyogre (0.37). O que toda missão tem, por cima da fase de sempre
 * (`legendaryFight` em data/stages.js):
 *
 * - os avisos no chão (`hazards`): o aviso cresce e o golpe cai no lugar marcado
 *   (círculos; `shape: 'square'` são as casas da tempestade do Zapdos);
 * - os anéis (`rings`): quem a borda cruzar leva, uma vez por anel;
 * - A CAPTURA: enquanto houver bola, a vida dele não passa do piso (`floor`). Lá ele
 *   fica exausto, a horda para e a bola cai do alto num feixe de luz. Passar por cima
 *   é jogar: a bola voa até ele e sobe a faixa da captura, com até 3 balanços e a
 *   chance da fase (`chance`). Na falha, ele volta a `recover`; se a bola não for
 *   pega, ele se recupera do mesmo jeito, mas a bola não conta como gasta;
 * - capturou: ele vai para o PC (`toPC`), e vem a leva final (`finalTide` segundos).
 *   Só depois a fase é vencida. Sem bolas, ele pode ser derrotado.
 *
 * Cada lendário estende esta classe com a entrada e os ataques dele
 * (systems/kyogreFight.js, systems/zapdosFight.js) e dá os nomes e os textos no
 * `legendaryFight` da fase. O desenho está em render/legendaryFight.js. Roda sem
 * navegador (os testes).
 */
export class LegendaryFight {
  constructor(run) {
    this.run = run;
    this.cfg = run.stage.legendaryFight;
    this.kind = this.cfg.kind;
    this.name = this.cfg.name;     // 'Kyogre', 'Zapdos'
    this.dex = this.cfg.dex;       // o grito
    this.balls = this.cfg.balls;
    this.state = 'waiting';
    this.t = 0;
    this.hazards = [];             // os avisos no chão: { kind, x, y, r, warn, t, life, damage, type, shape? }
    this.rings = [];               // os anéis: { x, y, r, speed, max, width, delay, damage, hits, kind, type? }
    this.fx = [];                  // o que só se vê ({ kind, x, y, t, life })
    this.ball = null;              // a bola no campo
    this.throwing = null;          // a bola voando e a faixa da captura
    this.final = null;             // a leva final: { t } (segundos que faltam)
    this.captured = false;
    this.holding = false;          // segura a vitória enquanto a leva final não acaba
    this.attackTimer = 2.5;
    this.summonTimer = 9;
    this.fury = false;
    this.flash = 0; this.flashColor = '255,255,255';
    this.dim = 0;                  // o céu escurecendo antes dos raios
    this.baseDim = 0;              // o escuro de sempre da arena (o fundo da Usina)
    // as cores da bola caindo, do feixe e do estouro dela (a Dive Ball é azul; a Ultra Ball, amarela)
    this.glow = { fall: '170,230,255', land: '190,240,255', spark: '#8fe3ff',
      beamTop: '160,235,255', beam: '200,245,255', soft: '143,227,255', ring: '190,245,255' };
    this.rng = Math.random;
  }

  /** O chefe da fase, se for o lendário e estiver em campo. */
  get boss() {
    const boss = this.run.spawner.boss;
    return boss && boss.data.legendary && !boss.dead ? boss : null;
  }

  /** A horda para enquanto ele está exausto (a leva final não para). */
  get quiet() { return this.state === 'exhausted' || this.state === 'throw'; }

  get hpFraction() { const b = this.boss; return b ? b.hp / b.maxHp : 0; }

  /* ------------------------------ o laço ------------------------------ */

  update(dt) {
    this.t += dt;
    this._before(dt);
    this._updateHazards(dt);
    this._updateRings(dt);
    this._updateSpecial(dt);
    this._updateFx(dt);
    if (this.final) this._updateFinal(dt);
    const boss = this.boss;
    if (!boss) { this._withoutBoss(dt); return; }
    if (this.state === 'waiting') this._rise(boss);

    // enquanto houver bola, o piso de vida (combat.js para o dano nele)
    boss.hpFloor = this.balls > 0 ? boss.maxHp * this.cfg.floor : null;

    if (this.state === 'exhausted') this._exhausted(boss, dt);
    else this._state(boss, dt);
  }

  /* os ganchos de cada lendário */
  /** Antes de tudo, a cada quadro (o lago fervendo antes do Kyogre sair). */
  _before() {}
  /** Depois dos avisos e dos anéis (o maremoto do Kyogre, a tempestade do Zapdos). */
  _updateSpecial() {}
  /** Sem o lendário em campo (antes dele chegar, ou depois de derrotado). */
  _withoutBoss() {}
  /** A chegada (o chefe acabou de entrar em campo). */
  _rise() {}
  /** Os estados próprios (a luta, os ataques). */
  _state() {}
  /** Exausto ou capturado: some o que é só dele (o maremoto, a tempestade marcada). */
  _calm() {}
  /** Ele volta à luta depois da bola (o estouro de água, o anel elétrico). */
  _comeBack() {}
  /** O golpe de um aviso que não é raio cai (as colunas do Water Spout). */
  _impactOther() {}

  _set(state) { this.state = state; this.t = 0; }

  _flash(alpha, color = '255,255,255') { if (alpha >= this.flash) { this.flash = alpha; this.flashColor = color; } }

  /** O dano de um ataque do lendário, na mesma escala dos golpes dos líderes (AbilitySystem.fireHostile). */
  _damage(base) {
    const boss = this.boss;
    return base * CONFIG.enemies.damageMult * CONFIG.enemies.boss.damageMult * (boss?.attackMult ?? 1);
  }

  /** A horda chamada: `n` da lista `summons` em volta dele. */
  _summon(boss, n) {
    for (let i = 0; i < n; i++) {
      const a = this.rng() * TAU, d = boss.radius + 40 + this.rng() * 70;
      this.run.spawner.spawnAt(weightedPick(this.cfg.summons).id, boss.x + Math.cos(a) * d, boss.y + Math.sin(a) * d, this.run.spawner.summonLevel);
    }
  }

  /* ------------------------------ a captura ------------------------------ */

  /** A vida chegou no piso: ele fica exausto e a bola cai do alto, longe do treinador. */
  onFloor(boss) {
    if (this.state === 'exhausted' || this.state === 'throw' || this.balls <= 0) return;
    boss.hidden = false; boss.untouchable = false; boss.rise = 1;
    this._set('exhausted');
    this.hazards = [];
    this.rings = [];
    this._calm();
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
    this._flash(0.25, this.glow.fall);
    bus.emit(EVENTS.TOAST, { text: `O ${this.name} está exausto! Uma ${this.cfg.ballName} caiu no campo!`, icon: 'ball' });
  }

  /** Exausto: parado, com a bola no campo; passar por cima dela é jogar. */
  _exhausted(boss, dt) {
    boss.applyStatus('slow', { factor: 0, duration: 0.2 });
    if (this.ball) {
      this.ball.t += dt;
      if (this.ball.t >= this.ball.fall && !this.ball.landed) this._ballLands();
      const p = this.run.player;
      if (this.ball.landed && Math.hypot(p.x - this.ball.x, p.y - this.ball.y) < 44) this._throw(boss);
    }
    if (this.state === 'exhausted' && this.t >= this.cfg.exhaust) this._recover(boss, false);
  }

  /** A bola toca o chão: o estouro de luz e o brilho que fica pulsando. */
  _ballLands() {
    const b = this.ball;
    b.landed = true;
    this.run.shake(6, 0.4);
    this._flash(0.35, this.glow.land);
    this.fx.push({ kind: 'ballLand', x: b.x, y: b.y, t: 0, life: 0.9 });
    for (let i = 0; i < 20; i++) burst(this.run.particles, b.x, b.y, i % 2 ? this.glow.spark : '#ffffff', 2, 280, 4, 0.8);
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

  /** Ele escapou (ou a bola não foi pega): volta só um pouco, a `recover`. */
  _recover(boss, spent) {
    if (spent) this.balls--;
    this.ball = null;
    boss.hp = Math.max(boss.hp, boss.maxHp * this.cfg.recover);
    boss.rise = 1;
    this.attackTimer = 1.4;
    this._set('fight');
    this._comeBack(boss);
    playCry(this.dex);
    const ball = this.cfg.ballName;
    const left = this.balls === 0 ? `Não resta nenhuma ${ball}.` : this.balls === 1 ? `Resta 1 ${ball}.` : `Restam ${this.balls} ${ball}s.`;
    bus.emit(EVENTS.TOAST, { text: spent ? `Ah, não! O ${this.name} escapou! ${left}` : this.cfg.lostBall, icon: 'ball' });
  }

  /** Capturou: a tela de captura (o presente da fase) e, depois dela, a leva final. */
  _captured(boss) {
    this.throwing = null;
    this.captured = true;
    this.holding = true;
    boss.captured = true;
    boss.dead = true;          // sai de campo sem morrer (sem XP nem Shards de chefe)
    this.state = 'gone';
    this.run.state = 'running';
    this.rings = []; this.hazards = []; this._calm();
    // toPC (0.37.9): ele vai sempre para o PC, e o card da captura avisa
    this.run.pendingGift = { choices: [this.cfg.species], title: `Gotcha! O ${this.name} foi capturado!`, mandatory: true, toPC: true };
    this.final = { t: this.cfg.finalTide, spawn: 0 };
    this.run.objective = this.cfg.finalObjective;
    bus.emit(EVENTS.TOAST, { text: this.cfg.finalToast, icon: 'boss' });
  }

  /** A leva final: `finalTide` segundos de hordas em fúria; no fim, a vitória. */
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
      bus.emit(EVENTS.TOAST, { text: this.cfg.finalEnd, icon: 'stages' });
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
          this._flash(h.shape === 'square' ? 0.3 : 0.6, '255,255,230');
          run.shake(9, 0.35);
          this.fx.push({ kind: 'bolt', x: h.x, y: h.y, t: 0, life: 0.4, seed: this.rng() * 1000 });
          this.fx.push({ kind: 'scorch', x: h.x, y: h.y, t: 0, life: 2.6, r: h.r, shape: h.shape });
          // as casas da tempestade caem às dezenas: o raio basta, sem as faíscas de cada uma
          if (h.shape !== 'square') burst(run.particles, h.x, h.y, '#fff3a0', 14, 320, 3, 0.5);
        } else {
          this._impactOther(h);
        }
      }
    }
    this.hazards = this.hazards.filter((h) => h.t < h.warn + h.life);
    // o céu escurece enquanto os raios se armam
    const target = Math.max(this.baseDim, thunderWarn * 0.45);
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
      const type = ring.type ?? 'water';
      let any = false;
      for (const c of run.companions) {
        if (c.dead || c.member.fainted || ring.hits.has(c)) continue;
        if (Math.abs(Math.hypot(c.x - ring.x, c.y - ring.y) - ring.r) < band + c.radius) {
          ring.hits.add(c); run.damageCompanion(c, ring.damage, type); any = true;
        }
      }
      const p = run.player;
      if (!any && !ring.hits.has(p) && Math.abs(Math.hypot(p.x - ring.x, p.y - ring.y) - ring.r) < band + p.radius) {
        ring.hits.add(p);
        run.damageCompanion(run.nearestCompanion(p.x, p.y), ring.damage, type);
      }
      ring.done = ring.r >= ring.max;
    }
    this.rings = this.rings.filter((r) => !r.done);
  }

  _updateFx(dt) {
    for (const f of this.fx) f.t += dt;
    this.fx = this.fx.filter((f) => f.t < f.life);
  }

  /** Quem está dentro do aviso (o círculo, ou a casa quadrada da tempestade). */
  _inside(h, x, y, radius) {
    if (h.shape === 'square') return Math.abs(x - h.x) < h.r && Math.abs(y - h.y) < h.r;
    return Math.hypot(x - h.x, y - h.y) < h.r + radius;
  }

  /** O golpe cai: quem da equipe estiver dentro leva; o treinador dentro, o Pokémon mais perto defende. */
  _strike(h) {
    const run = this.run;
    let any = false;
    for (const c of run.companions) {
      if (c.dead || c.member.fainted) continue;
      if (this._inside(h, c.x, c.y, c.radius)) { run.damageCompanion(c, h.damage, h.type); any = true; }
    }
    if (!any && this._inside(h, run.player.x, run.player.y, run.player.radius)) {
      run.damageCompanion(run.nearestCompanion(h.x, h.y), h.damage, h.type);
    }
  }
}
