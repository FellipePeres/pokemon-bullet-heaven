import { DIVE_WORLD } from '../data/diveWorld.js';
import { playCry } from '../audio/cry.js';

const HALL = DIVE_WORLD.hall;
const WALK = 16 / 60, RUN = 8 / 60;   // o passo do FireRed andando e correndo
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

/**
 * O SALÃO DO KYOGRE (0.37, PLANEJAMENTO-DIVE.md seção 8) — a cena aprovada na
 * maquete "O Salão do Kyogre", depois do último nível da descida (o 5):
 *
 * 1. emergir no alto do MarineCave_End do Emerald (o warp, em 20,4);
 * 2. andar pelo salão (só por colisão 0) até a margem do lago;
 * 3. ir até a frente do Kyogre e olhar para cima ("Um Pokémon gigante dorme...");
 * 4. o despertar, no estilo do Sapphire: o chão treme e três clarões;
 * 5. a aproximação e o grito, do Emerald (MarineCave_End_EventScript_Kyogre);
 * 6. a transição de batalha do Kyogre (B_TRANSITION_KYOGRE);
 * 7. o card da fase (ui/hallCard.js): Jogar ou Voltar para a Vila.
 *
 * Depois da captura, o salão está vazio: na margem, o card do Endless aquático.
 * Só a regra: o desenho está em render/KyogreHallRenderer.js. `onCard` avisa o Game.
 */
export class KyogreHall {
  constructor({ onCard = null } = {}) {
    this.onCard = onCard;
    this.active = false;
  }

  /** Começa a cena. `captured`: o Kyogre já está na jornada (o salão vazio). */
  start({ captured = false } = {}) {
    const [wx, wy] = HALL.warp;
    this.active = true;
    this.captured = captured;
    this.mode = 'walk';
    this.alpha = 0;
    this.t = 0;
    this.shake = 0; this.flash = 0; this.glow = 0;
    this.p = { x: wx, y: wy, fx: wx, fy: wy, mv: 1, dur: WALK, dir: 'down', step: 0, run: false };
    this.k = { x: HALL.kyogre[0], y: HALL.kyogre[1], frame: 0, rot: 0, awake: false, hidden: captured };
    this.script = [{ kind: 'fade', to: 1, dur: 0.9 }];
    this.dialog = null;
    this.trans = null;
    this.fogX = 0;
  }

  stop() { this.active = false; }

  static walkable(x, y) { return x >= 0 && y >= 0 && x < HALL.w && y < HALL.h && HALL.coll[y * HALL.w + x] === '0'; }
  static isShore(x, y) { return HALL.shore.some(([sx, sy]) => sx === x && sy === y); }

  say(pages, then) { this.dialog = { pages, index: 0, shown: 0, then }; }

  /** O A: passa o texto. */
  confirm() {
    const d = this.dialog;
    if (!d) return false;
    if (d.shown < d.pages[d.index].length) { d.shown = d.pages[d.index].length; return true; }
    if (d.index < d.pages.length - 1) { d.index++; d.shown = 0; return true; }
    this.dialog = null;
    d.then?.();
    return true;
  }

  /** Pula a caminhada (o atalho do teste e o botão de pular). */
  skipWalk() {
    if (this.mode !== 'walk') return;
    this.alpha = 1; this.script = [];
    Object.assign(this.p, { x: 9, y: 27, fx: 9, fy: 27, mv: 1, dir: 'up' });
    this._arrive();
  }

  /* ------------------------------ o laço ------------------------------ */

  update(dt, dir = null, running = false) {
    if (!this.active) return;
    const d = this.dialog;
    if (d) d.shown = Math.min(d.pages[d.index].length, d.shown + dt * 50);
    this.fogX += dt * 10;
    this.shake = Math.max(0, this.shake - dt);
    this.t += dt;
    this._walk(dt, dir, running);
    this._runScript(dt);
    if (!this.k.awake) this.k.frame = Math.floor(this.t / 1.2) % 2;   // dormindo, respira devagar
  }

  _step(nx, ny, dir, dur) {
    const p = this.p;
    Object.assign(p, { dir, fx: p.x, fy: p.y, x: nx, y: ny, mv: 0, dur });
    p.step++;
  }

  _walk(dt, dir, running) {
    const p = this.p;
    if (p.mv < 1) { p.mv = Math.min(1, p.mv + dt / p.dur); if (p.mv < 1) return; }
    if (this.mode !== 'walk' || this.dialog || this.script.length) return;
    if (KyogreHall.isShore(p.x, p.y)) { this._arrive(); return; }
    if (!dir) { p.run = false; return; }
    const [dx, dy] = DIRS[dir];
    p.run = running;
    if (KyogreHall.walkable(p.x + dx, p.y + dy)) this._step(p.x + dx, p.y + dy, dir, running ? RUN : WALK);
    else p.dir = dir;
  }

  /** Chegou à margem: o encontro (ou, com o Kyogre na jornada, o salão quieto e o card do Endless). */
  _arrive() {
    this.mode = 'scene';
    const path = this._path({ x: this.p.x, y: this.p.y }, { x: HALL.spot[0], y: HALL.spot[1] });
    if (this.captured) {
      this.script = [
        { kind: 'walkto', path }, { kind: 'face', dir: 'up' }, { kind: 'wait', dur: 0.4 },
        { kind: 'say', lines: ['O salão está quieto, mas as águas ainda se agitam...'] },
        { kind: 'card' }
      ];
      return;
    }
    this.script = [
      { kind: 'walkto', path },
      { kind: 'face', dir: 'up' },
      { kind: 'wait', dur: 0.5 },
      { kind: 'say', lines: ['Um Pokémon gigante dorme no fundo do salão...'] },
      { kind: 'wait', dur: 0.3 },
      { kind: 'awaken' },          // o Sapphire: o chão treme e a tela pisca três vezes
      { kind: 'wait', dur: 0.4 },
      { kind: 'approach' },        // o Emerald: anda, espera, anda, espera, anda
      { kind: 'cry' },             // playmoncry SPECIES_KYOGRE, CRY_MODE_ENCOUNTER; delay 40
      { kind: 'wait', dur: 40 / 60 + 0.6 },
      { kind: 'transition' },      // B_TRANSITION_KYOGRE
      { kind: 'card' }
    ];
  }

  _path(from, to) {
    const key = (p) => p.y * HALL.w + p.x;
    const prev = new Map([[key(from), null]]), q = [from];
    while (q.length) {
      const p = q.shift();
      if (p.x === to.x && p.y === to.y) { const out = []; for (let c = p; c; c = prev.get(key(c))) out.push(c); return out.reverse(); }
      for (const [dx, dy] of Object.values(DIRS)) {
        const n = { x: p.x + dx, y: p.y + dy };
        if (KyogreHall.walkable(n.x, n.y) && !prev.has(key(n))) { prev.set(key(n), p); q.push(n); }
      }
    }
    return [from];
  }

  _runScript(dt) {
    const a = this.script[0];
    if (!a) return;
    a.t = (a.t ?? 0) + dt;
    let done = false;
    const p = this.p;
    switch (a.kind) {
      case 'fade': a.from ??= this.alpha; this.alpha = a.from + (a.to - a.from) * Math.min(1, a.t / a.dur); done = a.t >= a.dur; break;
      case 'wait': done = a.t >= a.dur; break;
      case 'face': p.dir = a.dir; done = true; break;
      case 'say': if (!a.started) { a.started = true; this.say(a.lines, () => { a.closed = true; }); } done = !!a.closed; break;
      case 'walkto': {
        if (p.mv < 1) break;
        a.i ??= 1;
        if (a.i >= a.path.length) { done = true; break; }
        const n = a.path[a.i++];
        this._step(n.x, n.y, n.x > p.x ? 'right' : n.x < p.x ? 'left' : n.y > p.y ? 'down' : 'up', WALK);
        break;
      }
      case 'awaken': {
        // três piscadas brancas com o chão tremendo; a cada uma o Kyogre se acende
        const k = Math.floor(a.t / 0.42), f = (a.t % 0.42) / 0.42;
        this.flash = k < 3 ? Math.max(0, 1 - f * 2.4) * 0.85 : 0;
        this.glow = k < 3 ? Math.max(0, 1 - f * 1.6) : 0;
        if (a.t < 1.7) this.shake = 0.1;
        done = a.t >= 1.7;
        if (done) { this.flash = 0; this.glow = 0; this.k.awake = true; }
        break;
      }
      case 'approach': {
        // walk_down_start_affine, delay_16 x2, walk_down_affine, delay_16 x2, walk_down_affine
        const F = a.t * 60;
        let y = HALL.kyogre[1];
        for (const [s, e] of [[0, 16], [48, 64], [96, 112]]) y += Math.max(0, Math.min(1, (F - s) / (e - s)));
        this.k.y = y;
        // o balanço do affine (GoSouthStart e GoSouth): até +8 e depois de +8 a -8 (256 numa volta)
        const r = F < 32 ? F / 4 : 8 - 16 * Math.abs(((F - 32) / 64) % 2 - 1);
        this.k.rot = (r / 256) * Math.PI * 2;
        this.k.frame = Math.floor(F / 16) % 2;
        done = F >= 112;
        if (done) this.k.y = HALL.kyogre[1] + 3;
        break;
      }
      case 'cry': playCry(382); this.shake = 0.9; done = true; break;
      case 'transition': {
        // Kyogre_PaletteFlash (a cada 3 quadros por 58), Kyogre_PaletteBrighten (a cada 5 por 68) e o escuro
        const F = Math.floor(a.t * 60), { frames, flash } = DIVE_WORLD.transition;
        let frame, black = 0;
        if (F <= 58) frame = Math.floor((F % 30) / 3);
        else if (F <= 126) frame = flash + Math.min(frames - flash - 1, Math.floor((F - 59) / 5));
        else { frame = frames - 1; black = Math.min(1, (F - 127) / 30); }
        this.trans = { frame, black };
        done = F >= 157;
        break;
      }
      case 'card':
        this.mode = 'card';
        this.onCard?.(this.captured ? 'kyogre_endless' : 'kyogre');
        done = true;
        break;
    }
    if (done) { this.script.shift(); if (this.script.length) this._runScript(0); }
  }
}
