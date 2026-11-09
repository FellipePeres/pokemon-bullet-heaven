import { DIVE } from '../data/dive.js';
import { DIVE_WORLD } from '../data/diveWorld.js';

const { cols: COLS, rows: ROWS, walk: WALK, react: REACT, safety: SAFETY, tolerance: TOL } = DIVE;
const T = 32;                     // um tile na tela da descida: o metatile do Emerald em 2x
const VW = COLS * T, VH = ROWS * T;
const NEIGHBORS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const STEP = { l: [-1, 0], r: [1, 0], u: [0, -1], d: [0, 1] };

/* ============================== as hordas ============================== */

const laneLen = (l) => (l.axis === 'row' ? COLS : ROWS);
const inLane = (l, c, r) => (l.axis === 'row' ? r === l.idx : c === l.idx);
const laneS = (l, c, r) => (l.axis === 'row' ? (l.dir > 0 ? c : COLS - 1 - c) : (l.dir > 0 ? r : ROWS - 1 - r));
/** O intervalo de tempo em que a horda ocupa o tile (c, r), ou null se ela não passa por ele. */
function cover(l, c, r) {
  if (!inLane(l, c, r)) return null;
  const s = laneS(l, c, r), go = l.t0 + l.warn;
  return [go + (s + TOL) / l.speed, go + (s + l.len + 1 - TOL) / l.speed];
}
export const laneEnd = (l) => l.t0 + l.warn + (laneLen(l) + l.len + 1) / l.speed;
export const freeDuring = (lanes, c, r, t1, t2) => lanes.every((l) => { const iv = cover(l, c, r); return !iv || iv[1] <= t1 || iv[0] >= t2; });
const covered = (lanes, c, r, t) => lanes.some((l) => { const iv = cover(l, c, r); return iv && t > iv[0] && t < iv[1]; });
const inside = (c, r) => c >= 0 && r >= 0 && c < COLS && r < ROWS;

/** Andando a partir de `start`, já reagido em `tStart`: existe um tile que fica livre até `end`? */
function escapeFrom(lanes, start, tStart, end) {
  let frontier = [start];
  const seen = new Set([start.c + ',' + start.r]);
  for (let k = 0; k <= 12; k++) {
    const arrive = tStart + k * WALK;
    for (const n of frontier) if (freeDuring(lanes, n.c, n.r, arrive, end)) return true;
    const next = [];
    for (const n of frontier) for (const [dc, dr] of NEIGHBORS) {
      const c = n.c + dc, r = n.r + dr, key = c + ',' + r;
      if (!inside(c, r) || seen.has(key)) continue;
      // o tile do caminho não pode ser pego enquanto o jogador passa por ele
      if (!freeDuring(lanes, c, r, tStart + k * WALK, tStart + (k + 1) * WALK + WALK * 0.5)) continue;
      seen.add(key);
      next.push({ c, r });
    }
    frontier = next;
    if (!frontier.length) break;
  }
  return false;
}

/* ============================== o mundo ============================== */

const WORLD = DIVE_WORLD;
const toLocal = (map, x, y) => ({ x: x - WORLD.maps[map].ox, y: y - WORLD.maps[map].oy });
const BOARDS = WORLD.boards.map(([map, x, y]) => ({ map, ...toLocal(map, x, y) }));
/** Dá para nadar ali no Emerald? (a grade gerada do map.bin: colisão 0 e elevação 3) */
export const isNav = (map, x, y) => {
  const m = WORLD.maps[map];
  return x >= 0 && y >= 0 && x < m.w && y < m.h && m.nav[y * m.w + x] === '1';
};
/** O caminho mais curto só por tiles navegáveis (o mergulhador nunca passa por cima da rocha). */
function bfsPath(map, from, isTarget) {
  const m = WORLD.maps[map], key = (p) => p.y * m.w + p.x;
  const prev = new Map([[key(from), null]]), q = [from];
  while (q.length) {
    const p = q.shift();
    if (isTarget(p)) {
      const path = [];
      for (let c = p; c; c = prev.get(key(c))) path.push(c);
      return path.reverse();
    }
    for (const [dx, dy] of NEIGHBORS) {
      const n = { x: p.x + dx, y: p.y + dy };
      if (isNav(map, n.x, n.y) && !prev.has(key(n))) { prev.set(key(n), p); q.push(n); }
    }
  }
  return [from];
}
const inBoard = (b) => (p) => p.x >= b.x && p.x < b.x + COLS && p.y >= b.y && p.y < b.y + ROWS;
const boardCam = (b) => ({ x: b.x * T, y: b.y * T });
const smooth = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };

/**
 * A DESCIDA DO DIVE (PLANEJAMENTO-DIVE.md) — o modo aquático: 6 níveis em
 * tabuleiros de 10x6 tiles de água navegável do Emerald. O jogador anda em tiles
 * (o passo do FireRed, sem correr) e desvia das hordas que atravessam linhas e
 * colunas inteiras. São 3 bolhas de vida, com o bolsão de ar na chegada ao Nível 3;
 * entre os níveis, a animação obrigatória nada pelo caminho de verdade.
 *
 * Só a regra: o desenho está em render/DiveRenderer.js e a barra em ui/diveHud.js.
 * Roda sem navegador (os testes do smoke-test). `onEnd(result)` avisa o fim:
 * 'rescued' (perdeu as 3 bolhas) ou 'cave' (passou o Nível 6).
 *
 * Os modos: play (as hordas) · transition (a animação entre os níveis) ·
 * down (perdeu as bolhas: a tela escurece) · over (acabou; esperando o Game).
 */
export class Dive {
  constructor({ onEnd = null, rng = Math.random } = {}) {
    this.onEnd = onEnd;
    this.rng = rng;
    this.mode = 'idle';
    this.paused = false;
    this.fx = [];
    this.best = 0;    // o nível mais fundo concluído neste mergulho
  }

  static get size() { return { cols: COLS, rows: ROWS, tile: T, width: VW, height: VH }; }
  get levelData() { return DIVE.levels[this.level]; }
  get mapData() { return WORLD.maps[this.map]; }

  /** Começa a descida no nível `level` (0 a 5; o jogo começa sempre do 0). */
  start(level = 0) {
    this.level = level;
    this.lives = DIVE.lives;
    this.inv = 0; this.hits = 0; this.lanes = []; this.spawned = 0;
    this.clock = 0; this.nextAt = 1.2; this.elapsed = 0;
    this.p = { c: 1, r: 2, fc: 1, fr: 2, mv: 1, dur: WALK, face: 'r', wx: null, wy: null };
    this.map = BOARDS[level].map;
    this.cam = boardCam(BOARDS[level]);
    this.mode = 'play'; this.alpha = 1; this.script = []; this.paused = false;
    this.dark = this.darkTarget = DIVE.dark[level];
    this.dialog = null; this.shake = 0; this.downT = 0; this.fx = []; this.best = 0;
    this.showBanner(`NÍVEL ${level + 1} · ${DIVE.levels[level].depth} m`, 1.4);
  }

  showBanner(text, secs) { this.banner = { text, t: secs }; }

  /** O A: passa o texto (ou mostra a página inteira). */
  confirm() {
    const d = this.dialog;
    if (!d) return false;
    const page = d.pages[d.index];
    if (d.shown < page.length) { d.shown = page.length; return true; }
    if (d.index < d.pages.length - 1) { d.index++; d.shown = 0; return true; }
    this.dialog = null;
    d.then?.();
    return true;
  }

  say(pages, then) { this.dialog = { pages, index: 0, shown: 0, then }; }

  togglePause(force) {
    if (this.mode === 'play' || this.mode === 'transition') this.paused = force ?? !this.paused;
  }

  /* ---------------------- o sorteio: nunca é impossível ---------------------- */

  /**
   * Nunca é impossível (o Fellipe: "se a fileira 2 está livre, na próxima horda a 1 ou a 3
   * precisa estar livre"; e "hordas sobre hordas", sem esperar o jogador ficar a salvo). A horda
   * só sai se houver saída andando de QUALQUER tile onde o jogador possa estar quando perceber o
   * aviso: o dele (ou o do passo em curso) e, se ele está fugindo de outra horda, também cada
   * vizinho (ele pode ter começado um passo para o lado). E esse passo não pode cair numa horda.
   */
  solvable(cands, now) {
    const lanes = [...this.lanes, ...cands];
    const end = Math.max(...cands.map(laneEnd)) + 0.05;
    const p = this.p;
    const D = { c: p.c, r: p.r };                              // onde ele está (ou para onde o passo leva)
    const tD = now + (p.mv < 1 ? (1 - p.mv) * p.dur : 0);
    const tAct = Math.max(tD, now + REACT + SAFETY);           // quando ele já viu e pode agir
    if (!freeDuring(lanes, D.c, D.r, now, tAct + WALK * 0.5)) return false;
    if (!escapeFrom(lanes, D, tAct, end)) return false;
    // num tile seguro ele não tem motivo para se mexer, e basta a saída de onde está
    const safeNow = !this.lanes.length || freeDuring(this.lanes, D.c, D.r, now, Math.max(...this.lanes.map(laneEnd)));
    if (!safeNow && tD < now + REACT) {
      const tN = now + REACT + WALK;   // um passo começado antes de ver o aviso termina, no pior caso, aqui
      for (const [dc, dr] of NEIGHBORS) {
        const c = D.c + dc, r = D.r + dr;
        if (!inside(c, r)) continue;
        if (!freeDuring(lanes, c, r, tD + WALK * 0.5, tN + WALK * 0.5)) return false;
        if (!escapeFrom(lanes, { c, r }, tN, end)) return false;
      }
    }
    return true;
  }

  _pick(arr) { return arr[Math.floor(this.rng() * arr.length)]; }
  _shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  _weighted(obj) {
    const e = Object.entries(obj);
    let t = this.rng() * e.reduce((s, [, w]) => s + w, 0);
    for (const [k, w] of e) if ((t -= w) <= 0) return k;
    return e[0][0];
  }
  _lane(L, axis, idx, t0) {
    const l = { axis, idx, dir: this.rng() < 0.5 ? 1 : -1, t0, warn: L.warn, speed: L.speed, sp: this._pick(L.species) };
    l.len = laneLen(l);
    return l;
  }

  /** Um padrão do nível, sorteado: metade das vezes mira a fileira (ou coluna) do jogador. */
  _makeEvent(L, now) {
    const kind = this._weighted(L.kinds);
    const myRow = () => (this.rng() < 0.5 ? this.p.r : Math.floor(this.rng() * ROWS));
    const myCol = () => (this.rng() < 0.5 ? this.p.c : Math.floor(this.rng() * COLS));
    const rows = (n) => {
      const first = myRow();
      return [first, ...this._shuffle([...Array(ROWS).keys()].filter((r) => r !== first))].slice(0, n);
    };
    switch (kind) {
      case 'row': return [this._lane(L, 'row', myRow(), now)];
      case 'col': return [this._lane(L, 'col', myCol(), now)];
      case 'row2': return rows(2).map((r) => this._lane(L, 'row', r, now));
      case 'wall': return rows(ROWS - 2).map((r) => this._lane(L, 'row', r, now));
      case 'wall5': return rows(ROWS - 1).map((r) => this._lane(L, 'row', r, now));
      case 'cols3': {
        const first = myCol();
        return [first, ...this._shuffle([...Array(COLS).keys()].filter((c) => c !== first))].slice(0, 3).map((c) => this._lane(L, 'col', c, now));
      }
      case 'cross': return [this._lane(L, 'row', myRow(), now), this._lane(L, 'col', myCol(), now)];
      case 'chain': {
        // a segunda avisa junto com a primeira (a fileira fica marcada até as duas passarem): nada escondido
        const r = myRow(), a = this._lane(L, 'row', r, now), b = this._lane(L, 'row', r, now);
        b.dir = a.dir;
        b.warn = a.warn + (a.len + 2) / L.speed;
        const out = [a, b];
        if (this.rng() < 0.5) out.push(this._lane(L, 'col', myCol(), now));
        return out;
      }
      case 'triple': return [0, 1, 2].map(() => (this.rng() < 0.5 ? this._lane(L, 'row', myRow(), now) : this._lane(L, 'col', myCol(), now)))
        .filter((l, i, arr) => arr.findIndex((o) => o.axis === l.axis && o.idx === l.idx) === i);
      default: return [this._lane(L, 'row', myRow(), now)];
    }
  }

  _spawnEvent(now) {
    const L = this.levelData;
    for (let i = 0; i < 60; i++) {
      const ev = this._makeEvent(L, now);
      if (this.solvable(ev, now)) { this.lanes.push(...ev); return true; }
    }
    // os padrões grandes não cabem agora: uma horda de uma linha, em qualquer fileira, coluna e sentido
    const singles = this._shuffle([...Array(ROWS).keys()].map((r) => ['row', r]).concat([...Array(COLS).keys()].map((c) => ['col', c])));
    for (const [axis, idx] of singles) {
      const ev = [this._lane(L, axis, idx, now)];
      if (this.solvable(ev, now)) { this.lanes.push(...ev); return true; }
      ev[0].dir *= -1;
      if (this.solvable(ev, now)) { this.lanes.push(...ev); return true; }
    }
    return false;
  }

  /* ------------------------------ o jogador ------------------------------ */

  /** Onde desenhar o mergulhador (px da tela da descida). */
  playerPos() {
    const p = this.p;
    if (p.wx != null) return { x: p.wx - this.cam.x, y: p.wy - this.cam.y };
    const k = Math.min(1, p.mv);
    return { x: (p.fc + (p.c - p.fc) * k) * T, y: (p.fr + (p.r - p.fr) * k) * T };
  }

  /** O tile em que ele conta para as hordas: o de origem até a metade do passo. */
  occupied() { return this.p.mv < 0.5 ? { c: this.p.fc, r: this.p.fr } : { c: this.p.c, r: this.p.r }; }

  _stepPlayer(dt, dir) {
    const p = this.p;
    if (p.mv < 1) {
      p.mv += dt / p.dur;
      if (p.mv < 1) return;
      dt = (p.mv - 1) * p.dur;
      p.mv = 1;
    }
    if (!dir) return;
    // o passo sai no primeiro toque (na vila, tocar numa direção nova só vira): cada fração de segundo conta
    p.face = dir;
    const [dc, dr] = STEP[dir];
    const c = p.c + dc, r = p.r + dr;
    if (!inside(c, r)) return;
    p.fc = p.c; p.fr = p.r; p.c = c; p.r = r; p.dur = WALK; p.mv = Math.min(0.99, dt / p.dur);
  }

  _hit() {
    this.lives--; this.hits++; this.inv = DIVE.invincible; this.shake = 0.25;
    this.popped = { i: this.lives, t: 0.4 };
    const pos = this.playerPos();
    for (let i = 0; i < 8; i++) this.fx.push({ x: pos.x + 16, y: pos.y + 14, vx: (this.rng() - 0.5) * 90, vy: -20 - this.rng() * 60, t: 0, life: 0.6 });
    if (this.lives <= 0) { this.mode = 'down'; this.downT = 0; }
  }

  /* --------------------------- a animação entre níveis --------------------------- */

  /**
   * O fim de um nível: a animação obrigatória. O mergulhador nada pelo caminho de verdade (só
   * tiles navegáveis) até o próximo tabuleiro, e a câmera vai com ele. Na troca de mapa (da Rota
   * 126 para a 127) ele sai por um corredor, a tela escurece e ele entra pelo outro. Depois do 6,
   * o mesmo até a entrada submersa da Caverna Marinha.
   */
  levelDone() {
    const from = this.level, b = BOARDS[from];
    this.best = Math.max(this.best, from + 1);
    this.mode = 'transition';
    this.lanes = [];
    const here = { x: b.x + this.p.c, y: b.y + this.p.r };
    this.p.wx = here.x * T; this.p.wy = here.y * T;
    this.cam = boardCam(b);
    const S = [{ kind: 'banner', text: `NÍVEL ${from + 1} CONCLUÍDO!`, dur: 1 }, { kind: 'wait', dur: 0.7 }];
    const exitPath = (map) => { const e = toLocal(map, ...WORLD.exit[map]); return bfsPath(map, here, (p) => p.x === e.x && p.y === e.y); };
    if (from === DIVE.levels.length - 1) {
      const [ax, ay] = WORLD.cave.arrive, [ex, ey] = WORLD.cave.emerge;
      const down = [];
      for (let y = ay; y <= ey; y++) down.push({ x: ax, y });
      S.push({ kind: 'swim', map: this.map, path: exitPath(this.map) },
        { kind: 'fade', to: 0, dur: 0.7 },
        { kind: 'map', map: 'cave', at: { x: ax, y: ay }, dark: 0.15 },
        { kind: 'fade', to: 1, dur: 0.7 },
        { kind: 'swim', map: 'cave', path: down, slow: true },
        { kind: 'wait', dur: 0.5 },
        { kind: 'say', lines: DIVE.lines.cave },
        { kind: 'call', fn: () => this._finish('cave') });
    } else {
      const nb = BOARDS[from + 1];
      let arrive;
      if (nb.map !== this.map) {
        const entry = toLocal(nb.map, ...WORLD.entry[nb.map]);
        const inPath = bfsPath(nb.map, entry, inBoard(nb));
        arrive = inPath.at(-1);
        S.push({ kind: 'swim', map: this.map, path: exitPath(this.map) },
          { kind: 'banner', text: 'MAIS FUNDO...', dur: 1.4 },
          { kind: 'fade', to: 0, dur: 0.7 },
          { kind: 'map', map: nb.map, at: entry, dark: DIVE.dark[from + 1] },
          { kind: 'fade', to: 1, dur: 0.6 },
          { kind: 'swim', map: nb.map, path: inPath, camEnd: boardCam(nb) });
      } else {
        const path = bfsPath(this.map, here, inBoard(nb));
        arrive = path.at(-1);
        S.push({ kind: 'swim', map: this.map, path, camEnd: boardCam(nb), dark: DIVE.dark[from + 1] });
      }
      S.push({ kind: 'call', fn: () => {
        this.level = from + 1;
        this.cam = boardCam(nb);
        const c = arrive.x - nb.x, r = arrive.y - nb.y;
        this.p = { c, r, fc: c, fr: r, mv: 1, dur: WALK, face: this.p.face, wx: null, wy: null };
      } });
      if (from + 1 === DIVE.airPocketLevel) {
        S.push({ kind: 'call', fn: () => {
          const pos = this.playerPos();
          for (let i = 0; i < 40; i++) {
            this.fx.push({ x: pos.x + 16 + (this.rng() - 0.5) * 120, y: VH + this.rng() * 30, vx: (this.rng() - 0.5) * 20, vy: -60 - this.rng() * 80, t: 0, life: 2.2, big: this.rng() < 0.4 });
          }
        } }, { kind: 'say', lines: DIVE.lines.airPocket, after: () => { this.lives = DIVE.lives; this.refilled = 0.4; } });
      }
      S.push({ kind: 'banner', text: `NÍVEL ${from + 2} · ${DIVE.levels[from + 1].depth} m`, dur: 1.3 }, { kind: 'wait', dur: 1.1 },
        { kind: 'call', fn: () => { this.mode = 'play'; this.clock = 0; this.nextAt = 0.6; this.spawned = 0; this.lanes = []; } });
    }
    this.script = S;
  }

  _finish(result) {
    this.mode = 'over';
    this.result = result;
    this.onEnd?.(result, this);
  }

  _clampCam(c) {
    const m = this.mapData;
    return { x: Math.max(0, Math.min(m.w * T - VW, c.x)), y: Math.max(0, Math.min(m.h * T - VH, c.y)) };
  }

  /** Um passo da animação por quadro; os instantâneos encadeiam no mesmo quadro. */
  _runScript(dt) {
    const a = this.script[0];
    if (!a) return;
    a.t = (a.t ?? 0) + dt;
    let done = false;
    switch (a.kind) {
      case 'wait': done = a.t >= a.dur; break;
      case 'banner': this.showBanner(a.text, a.dur); done = true; break;
      case 'fade':
        a.from ??= this.alpha;
        this.alpha = a.from + (a.to - a.from) * Math.min(1, a.t / a.dur);
        done = a.t >= a.dur;
        break;
      case 'map':
        this.map = a.map;
        this.p.wx = a.at.x * T; this.p.wy = a.at.y * T;
        this.cam = this._clampCam({ x: this.p.wx - (VW - T) / 2, y: this.p.wy - (VH - T) / 2 });
        if (a.dark != null) this.dark = this.darkTarget = a.dark;
        done = true;
        break;
      case 'swim': done = this._swim(a, dt); break;
      case 'say':
        if (!a.started) { a.started = true; this.say(a.lines, () => { a.closed = true; a.after?.(); }); }
        done = !!a.closed;
        break;
      case 'call': a.fn(); done = true; break;
    }
    if (done) { this.script.shift(); if (this.script.length && this.mode === 'transition') this._runScript(0); }
  }

  _swim(a, dt) {
    if (!a.init) {
      a.init = true; a.s = 0; a.len = a.path.length - 1;
      // mais rápido nos corredores longos: a animação fica em 1,5 a 4 segundos
      a.v = a.slow ? 3 : Math.max(7, Math.min(26, a.len / 2.4));
      a.cam0 = { ...this.cam };
      if (a.dark != null) this.darkTarget = a.dark;
    }
    a.s = Math.min(a.len, a.s + a.v * dt);
    const i = Math.max(0, Math.min(a.len - 1, Math.floor(a.s))), f = a.len ? a.s - i : 0;
    const p0 = a.path[i], p1 = a.path[Math.min(a.len, i + 1)];
    this.p.wx = (p0.x + (p1.x - p0.x) * f) * T;
    this.p.wy = (p0.y + (p1.y - p0.y) * f) * T;
    if (a.len) this.p.face = p1.x > p0.x ? 'r' : p1.x < p0.x ? 'l' : p1.y > p0.y ? 'd' : 'u';
    const k = a.len ? a.s / a.len : 1;
    const F = this._clampCam({ x: this.p.wx - (VW - T) / 2, y: this.p.wy - (VH - T) / 2 });
    const w0 = smooth(k / 0.25), w1 = a.camEnd ? smooth((k - 0.7) / 0.3) : 0;
    let cx = a.cam0.x + (F.x - a.cam0.x) * w0, cy = a.cam0.y + (F.y - a.cam0.y) * w0;
    if (a.camEnd) { cx += (a.camEnd.x - cx) * w1; cy += (a.camEnd.y - cy) * w1; }
    this.cam = { x: cx, y: cy };
    return a.s >= a.len;
  }

  /* ------------------------------ o laço ------------------------------ */

  /** `dir`: a direção segurada agora ('u', 'd', 'l', 'r') ou null. */
  update(dt, dir = null) {
    const d = this.dialog;
    if (d) d.shown = Math.min(d.pages[d.index].length, d.shown + dt * 55);
    for (const f of this.fx) { f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vy -= 30 * dt; }
    this.fx = this.fx.filter((f) => f.t < f.life);
    this.shake = Math.max(0, this.shake - dt);
    if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
    if (this.popped) { this.popped.t -= dt; if (this.popped.t <= 0) this.popped = null; }
    if (this.refilled) this.refilled = Math.max(0, this.refilled - dt);
    if (this.paused || this.mode === 'idle' || this.mode === 'over') return;
    this.elapsed += dt;

    if (this.mode === 'play') {
      this.clock += dt;
      const L = this.levelData;
      this._stepPlayer(dt, dir);
      this.inv = Math.max(0, this.inv - dt);
      this.lanes = this.lanes.filter((l) => this.clock < laneEnd(l));
      if (!L.overlap && this.lanes.length) this.nextAt = this.clock + (L.gap[0] + L.gap[1]) / 2;   // Nível 1: uma de cada vez
      if (this.spawned < L.count && this.clock >= this.nextAt && (L.overlap || this.lanes.length === 0)) {
        if (this._spawnEvent(this.clock)) {
          this.spawned++;
          this.nextAt = this.clock + L.gap[0] + this.rng() * (L.gap[1] - L.gap[0]);
        } else this.nextAt = this.clock + 0.1;   // nada cabe agora: tenta de novo logo
      }
      const o = this.occupied();
      if (this.inv <= 0 && covered(this.lanes, o.c, o.r, this.clock)) this._hit();
      if (this.mode === 'play' && this.spawned >= L.count && this.lanes.length === 0) this.levelDone();
    } else if (this.mode === 'transition') {
      this._runScript(dt);
    } else if (this.mode === 'down') {
      this.downT += dt;
      this.alpha = Math.max(0, 1 - this.downT / 1.4);
      if (this.downT > 1.6) this._finish('rescued');
    }
    this.dark += (this.darkTarget - this.dark) * Math.min(1, dt * 1.5);
  }

  /** A barra de quanto do nível já passou (0 a 1). */
  get progress() {
    if (this.mode === 'play') return Math.min(1, this.spawned / this.levelData.count);
    return this.mode === 'transition' ? 1 : 0;
  }

  /* -------------------- o jogador automático (testes) -------------------- */

  /**
   * Para os testes (tools/smoke-test.js): a direção que um jogador perfeito com `react`
   * segundos de reação seguraria agora. Ele só enxerga a horda depois do aviso mais a reação.
   */
  botDir(react = 0) {
    if (this.mode !== 'play' || this.p.mv < 1) return null;
    const now = this.clock, lanes = this.lanes.filter((l) => now >= l.t0 + react);
    const end = lanes.length ? Math.max(...lanes.map(laneEnd)) : now;
    const start = { c: this.p.c, r: this.p.r, first: null };
    if (freeDuring(lanes, start.c, start.r, now, end)) return null;
    let frontier = [start];
    const seen = new Set([start.c + ',' + start.r]);
    for (let k = 0; k < 12 && frontier.length; k++) {
      const next = [];
      for (const n of frontier) for (const [dc, dr, d] of [[1, 0, 'r'], [-1, 0, 'l'], [0, 1, 'd'], [0, -1, 'u']]) {
        const c = n.c + dc, r = n.r + dr, key = c + ',' + r;
        if (!inside(c, r) || seen.has(key)) continue;
        if (!freeDuring(lanes, c, r, now + k * WALK, now + (k + 1) * WALK + WALK * 0.5)) continue;
        const node = { c, r, first: n.first ?? d };
        if (freeDuring(lanes, c, r, now + (k + 1) * WALK, end)) return node.first;
        seen.add(key);
        next.push(node);
      }
      frontier = next;
    }
    return null;
  }
}
