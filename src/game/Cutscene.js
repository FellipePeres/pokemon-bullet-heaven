import { CONFIG } from '../core/config.js';
import { heightOk } from '../data/hub.js';

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

/** Para onde virar para olhar de (ax, ay) para (bx, by), como as pessoas da vila. */
function dirToward(ax, ay, bx, by, fallback) {
  const dx = bx - ax;
  const dy = by - ay;
  if (!dx && !dy) return fallback;
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
}

/**
 * O MOTOR DAS CENAS (0.39, PLANEJAMENTO-HISTORIA.md seção 9.1) — toca um roteiro
 * de data/cutscenes.js por cima da vila (game/Hub.js). Nasceu da cena do Maxie
 * (0.37), que agora é um roteiro como os outros e roda igual, quadro a quadro.
 *
 * - **Os atores**: os da cena (`actors` do roteiro), as pessoas do lugar (pelo id)
 *   e o jogador ('player'). Andam em tiles, como na vila.
 * - **Um passo por vez**: cada quadro anda quem está andando, conta o tempo do
 *   pássaro, roda o passo atual e, se ele acabou, passa ao próximo (um passo por
 *   quadro, como era na do Maxie).
 * - **O fim**: só o passo `end` faz a cena contar como vista (`onEnd`). O `then`
 *   (a ação de uma fala, como abrir a escolha do inicial) roda depois, pela vila.
 *
 * O desenho dos atores e dos efeitos está em render/HubRenderer.js.
 */
export class Cutscene {
  /**
   * @param hub     a vila
   * @param def     o roteiro (data/cutscenes.js)
   * @param options id; fill(text) troca {player} e companhia; value(key) lê o contexto
   *                das falas (o `pick` dos passos); give(item, count) dá um item e devolve o
   *                nome; quest(id) abre uma quest; emit(on, target) conta um acontecimento da
   *                história (a pista); cry(dex) toca o grito de um Pokémon; toast(text, icon) põe
   *                um aviso no canto; onEnd() no fim
   */
  constructor(hub, def, { id = null, fill = (text) => text, value = () => null, give = null, quest = null, emit = null, card = null, cry = null, toast = null, onEnd = null, matches = null } = {}) {
    this.hub = hub;
    this.id = id;
    this.band = def.band ?? null;
    // a música da cena (a lapidação da história): a do clima dela por cima da do lugar; o passo
    // `music` troca no meio (o rival indo embora, o Mew aparecendo). Sem ela, toca a do lugar
    this.music = def.music ?? null;
    this.steps = def.steps;
    this.step = 0;
    this.t = 0;
    this.local = {};           // o estado do passo atual (o roteiro em si nunca muda)
    this.cast = Object.entries(def.actors ?? {}).map(([actorId, a]) => ({
      id: actorId, sprite: a.sprite, x: a.x, y: a.y, dir: a.dir ?? 'down', hidden: !!a.hidden, glow: !!a.glow, lift: a.lift ?? 0,
      moving: false, steps: 0, prog: 0, walkPath: null, from: null, speed: CONFIG.hub.walkTime
    }));
    this.fx = { emote: null, ball: null, flash: 0, bird: null, cutin: null, fade: 0, camera: null, shake: null, storm: null, item: null, mist: null };
    this.then = null;
    this.done = false;
    this._fill = fill;
    this._value = value;
    this._give = give;
    this._quest = quest;
    this._emit = emit;
    this._card = card;
    this._cry = cry;
    this._toast = toast;
    this._onEnd = onEnd;
    this._matches = matches;   // (cond) => a condição `when` de um passo vale agora? (a lapidação)
  }

  /** O jogador apertou Espaço (ou clicou) sem caixa de texto: o card de fim segue (o passo `title`). */
  confirm() {
    this.local.go = true;
  }

  /** Um ator pelo nome: 'player', um da cena ou uma pessoa do lugar. */
  actor(who) {
    if (who === 'player') return this.hub.player;
    return this.cast.find((a) => a.id === who) ?? this.hub.npcs.find((npc) => npc.id === who) ?? null;
  }

  /** Onde alguém está agora, em tiles (o jogador anda pelo fx/fy). */
  where(who) {
    const a = typeof who === 'string' ? this.actor(who) : who;
    if (!a) return null;
    if (a === this.hub.player) return { x: a.fx, y: a.fy, hidden: false };
    return { x: a.x, y: a.y, hidden: !!a.hidden };
  }

  update(dt) {
    if (this.done) return;
    const hub = this.hub;
    for (const a of this._walkers()) this._walk(a, dt);
    if (this.fx.bird) this.fx.bird.t += dt;
    if (this.fx.storm) this.fx.storm.t += dt;
    if (this.fx.shake) { this.fx.shake.left -= dt; if (this.fx.shake.left <= 0) this.fx.shake = null; }
    const a = this._current();
    if (!a) return;
    // o passo com `when` (a lapidação) só roda se a condição vale agora; senão, a cena segue
    if (a.when && this._matches && !this._matches(a.when)) { this.step++; this.t = 0; this.local = {}; return; }
    this.t += dt;
    const local = this.local;
    let done = false;
    switch (a.do) {
      case 'wait': done = this.t >= a.t; break;
      case 'say':
        if (!local.open) {
          local.open = true;
          hub.dialog = { name: a.name ?? null, pages: a.lines.map((line) => this._fill(line)), index: 0, shown: 0, ask: null, then: null, after: () => { local.closed = true; } };
        }
        done = !!local.closed;
        break;
      case 'talk':
        // uma fala da vila: conta para as quests no fim, e a ação dela espera a cena acabar
        if (!local.open) {
          local.open = true;
          const npc = a.npc ? hub.npcs.find((n) => n.id === a.npc) ?? null : null;
          if (!hub.say(a.key, { npc })) { done = true; break; }
          if (hub.dialog.then) { this.then = hub.dialog.then; hub.dialog.then = null; }
        }
        done = !hub.dialog;
        break;
      case 'show': this.actor(a.who).hidden = false; done = true; break;
      case 'hide': this.actor(a.who).hidden = true; done = true; break;
      case 'place': this._place(this.actor(a.who), a.x, a.y, a.dir); done = true; break;
      case 'face': {
        const m = this.actor(a.who);
        if (a.toward) {
          const from = this._tile(m), to = this._tile(this.actor(a.toward));
          m.dir = dirToward(from.x, from.y, to.x, to.y, m.dir);
        } else m.dir = a.dir;
        done = true;
        break;
      }
      case 'walk': {
        const m = this.actor(a.who);
        if (!local.started) {
          local.started = true;
          const route = a.path ? { path: a.path, goal: null } : this._route(m, a.to);
          local.goal = route?.goal ?? null;
          if (route?.path.length) {
            m.walkPath = route.path.map(([x, y]) => ({ x, y }));
            m.speed = a.speed ?? CONFIG.hub.walkTime;
            m.prog = 0;
            m.steps ??= 0;
            m.from = null;
            if (a.bird) this.fx.bird = { ...(this.fx.bird ?? {}), follow: true, who: a.who };
          }
        }
        done = !m.walkPath;
        if (done && local.goal?.[2]) m.dir = local.goal[2];
        break;
      }
      case 'emote': this.fx.emote = { who: a.who, t: this.t }; done = this.t >= 1.0; if (done) this.fx.emote = null; break;
      case 'throw': {
        // a Poké Ball sobe e abre num clarão
        const m = this.actor(a.who);
        const k = Math.min(1, this.t / 0.55);
        this.fx.ball = this.t <= 0.55 ? { x0: m.x + 0.25, y0: m.y - 0.9, x1: m.x + 1.4, y1: m.y - 0.25, k } : null;
        if (this.t > 0.55) this.fx.flash = Math.max(0, 1 - (this.t - 0.55) / 0.3);
        done = this.t >= 0.85;
        if (done) this.fx.flash = 0;
        break;
      }
      case 'cutin': this.fx.cutin = { t: this.t, sprite: a.sprite }; done = this.t >= 2.1; if (done) this.fx.cutin = null; break;
      case 'bird': {
        const b = this.fx.bird;
        const m = this.actor(a.who);
        if (a.mode === 'in') {
          if (!local.started) { local.started = true; this.fx.bird = { mode: 'in', t: 0, who: a.who, sx: m.x - 5.5, sy: m.y - 7, tx: m.x + 2.1, ty: m.y - 0.9 }; }
          done = this.t >= 0.9;
        } else if (a.mode === 'grab') {
          if (!local.started) { local.started = true; Object.assign(b, { mode: 'grab', t: 0, sx: b.x, sy: b.y, tx: m.x + 0.5, ty: m.y - 1.4 }); }
          if (this.t >= 0.45) { m.hidden = true; done = true; }
        } else if (a.mode === 'away') {
          if (!local.started) { local.started = true; Object.assign(b, { mode: 'away', t: 0, sx: b.x, sy: b.y, carry: true }); }
          done = this.t >= 1.3;
        } else if (a.mode === 'gone') { this.fx.bird = null; done = true; }
        break;
      }
      case 'fade': {
        if (local.from == null) local.from = this.fx.fade;
        const k = a.t ? Math.min(1, this.t / a.t) : 1;
        this.fx.fade = local.from + ((a.to ?? 1) - local.from) * k;
        done = k >= 1;
        break;
      }
      case 'camera': {
        const p = hub.player;
        if (!local.from) local.from = this.fx.camera ?? { x: p.fx, y: p.fy };
        const target = a.to === 'player' ? { x: p.fx, y: p.fy } : { x: a.x, y: a.y };
        const k = a.t ? Math.min(1, this.t / a.t) : 1;
        const e = k * k * (3 - 2 * k);
        this.fx.camera = { x: local.from.x + (target.x - local.from.x) * e, y: local.from.y + (target.y - local.from.y) * e };
        done = k >= 1;
        if (done && a.to === 'player') this.fx.camera = null;
        break;
      }
      case 'shake':
        if (!local.started) { local.started = true; this.fx.shake = { left: a.t ?? 0.5, power: a.power ?? 2 }; }
        done = a.wait === false || this.t >= (a.t ?? 0.5);
        break;
      case 'give':
        if (!local.open) {
          local.open = true;
          const count = a.count ?? 1;
          const name = this._give?.(a.item, count) ?? null;
          if (!name || a.silent) { done = true; break; }
          const what = `${count > 1 ? `${count} ` : ''}${name.toUpperCase()}`;
          hub.dialog = { name: null, pages: [this._fill(`{player} recebeu ${what}!`)], index: 0, shown: 0, ask: null, then: null, after: () => { local.closed = true; } };
        }
        done = !!local.closed;
        break;
      case 'quest': this._quest?.(a.id); done = true; break;
      case 'cry': this._cry?.(a.dex); done = true; break;
      case 'toast': this._toast?.(this._fill(a.text), a.icon ?? 'stages'); done = true; break;
      case 'music': this.music = a.track ?? null; done = true; break;
      // o card de fim (a lapidação): a tela preta com o título e as linhas. Segue com o Espaço (ou
      // um clique) depois de `min` segundos, ou sozinho depois de `t`
      case 'title':
        if (!local.open) {
          local.open = true;
          this.fx.title = { title: this._fill(a.text), lines: (a.lines ?? []).map((line) => this._fill(line)), t: 0, hint: false };
        }
        this.fx.title.t = this.t;
        this.fx.title.hint = this.t >= (a.min ?? 2);
        done = this.t >= (a.t ?? 12) || (!!local.go && this.t >= (a.min ?? 2));
        if (done) this.fx.title = null;
        break;
      // a lembrança da tempestade (a Erika, H-4): a tela azul-escura, os clarões e uma sombra de
      // asas cruzando o alto; fica até o `storm` com `off`
      case 'storm': this.fx.storm = a.off ? null : { t: 0, sprite: a.sprite ?? 'dive/crobat' }; done = true; break;
      // um item no quadro, ao lado da conversa (o pedaço de metal); `off` tira
      case 'item': this.fx.item = a.off ? null : { sprite: a.sprite, x: a.at?.[0] ?? 1.5, y: a.at?.[1] ?? 2 }; done = true; break;
      case 'tremble': {
        // tremendo no lugar (o Zapdos assustado, H-6): de um lado para o outro, em pixels do GBA
        const m = this.actor(a.who);
        m.jx = this.t < (a.t ?? 0.6) ? Math.round(Math.sin(this.t * 60) * (a.power ?? 2)) : 0;
        done = this.t >= (a.t ?? 0.6);
        break;
      }
      case 'fly': {
        // levanta voo e some pelo alto da tela (`height` pixels do GBA em `t` segundos, acelerando)
        const m = this.actor(a.who);
        const k = Math.min(1, this.t / (a.t ?? 0.9));
        if (local.base == null) local.base = m.lift ?? 0;
        m.lift = local.base + (a.height ?? 200) * k * k;
        m.jx = Math.round(Math.sin(this.t * 25) * 2 * (1 - k));
        done = k >= 1;
        if (done) { m.hidden = true; m.lift = 0; m.jx = 0; }
        break;
      }
      case 'land': {
        // o contrário do `fly` (H-9, os pássaros na Mansão): aparece lá no alto e pousa no tile dele
        const m = this.actor(a.who);
        m.hidden = false;
        const k = Math.min(1, this.t / (a.t ?? 0.7));
        m.lift = (a.height ?? 160) * (1 - k) * (1 - k);
        done = k >= 1;
        if (done) m.lift = 0;
        break;
      }
      case 'flash': {
        // um clarão branco na tela inteira, que some em `t` segundos (o raio, a máquina explodindo)
        const k = Math.min(1, this.t / (a.t ?? 0.4));
        this.fx.flash = (a.power ?? 1) * (1 - k);
        this.fx.flashColor = a.color ?? null;   // (H-10) a luz rosa do Mew
        done = k >= 1;
        if (done) this.fx.flash = 0;
        break;
      }
      case 'emit': this._emit?.(a.on, a.target ?? null); done = true; break;
      case 'mist': {
        // a névoa (H-7, o fundo de Seafoam): vai do nível de agora até `to` em `t` segundos; `off`
        // devolve a névoa ao lugar (data/hub.js, `mist`)
        if (a.off) { this.fx.mist = null; done = true; break; }
        if (local.from == null) local.from = this.fx.mist ?? hub.mist;
        const k = a.t ? Math.min(1, this.t / a.t) : 1;
        this.fx.mist = local.from + ((a.to ?? 0) - local.from) * k;
        done = k >= 1;
        break;
      }
      case 'card':
        // o card de uma missão (data/missions.js): a cena espera o Lutar ou o Voltar. No
        // Lutar, a cena acaba ali (sem o `then` do fim): a luta começa (Game.startMission)
        // (H-7) o fim no Lutar acontece na hora da escolha: a vila para durante a transição de
        // batalha e não roda mais a cena, que antes ficava 'started' para sempre (e voltava a tocar
        // na volta da luta, na frente da cena de depois)
        if (!local.open) {
          local.open = true;
          if (!this._card) { done = true; break; }
          this._card(a.mission, (choice) => {
            local.choice = choice;
            if (choice === 'play' && !this.done) { this.done = true; this._onEnd?.(); }
          });
        }
        done = !!local.choice;
        break;
      case 'flag': hub._flags()[a.name] = a.value ?? true; done = true; break;
      case 'end':
        this.done = true;
        done = true;
        if (a.then) this.then = a.then;
        this._onEnd?.();
        break;
      default: done = true; break;   // passo desconhecido: segue (o check-data acusa)
    }
    this._moveBird();
    if (done) { this.step++; this.t = 0; this.local = {}; }
  }

  /** O passo atual, já com o caso da jornada (`pick`/`cases`) juntado. */
  _current() {
    const raw = this.steps[this.step];
    if (!raw?.pick) return raw;
    if (!this.local.step) this.local.step = { ...raw, ...(raw.cases?.[this._value(raw.pick)] ?? {}) };
    return this.local.step;
  }

  /** Quem está andando agora: o jogador, os atores da cena e as pessoas do lugar. */
  _walkers() {
    const list = [];
    if (this.hub.player.walkPath) list.push(this.hub.player);
    for (const a of this.cast) if (a.walkPath) list.push(a);
    for (const npc of this.hub.npcs) if (npc.walkPath) list.push(npc);
    return list;
  }

  /** Um passo do caminho. O jogador anda pelo fx/fy (e o x/y só muda ao chegar no tile). */
  _walk(m, dt) {
    const player = m === this.hub.player;
    const next = m.walkPath[0];
    m.moving = true;
    if (m.from == null) {
      m.from = { x: m.x, y: m.y };
      m.dir = next.x > m.x ? 'right' : next.x < m.x ? 'left' : next.y > m.y ? 'down' : 'up';
    }
    m.prog += dt / m.speed;
    const k = Math.min(1, m.prog);
    const x = m.from.x + (next.x - m.from.x) * k;
    const y = m.from.y + (next.y - m.from.y) * k;
    if (player) {
      m.fx = x; m.fy = y;
      m.walking = true;
      m.run = m.speed <= CONFIG.hub.runTime;
      m.stride += (dt / m.speed) * CONFIG.trainer.animation.stride;
    } else { m.x = x; m.y = y; }
    if (m.prog >= 1) {
      m.x = next.x; m.y = next.y;
      if (player) { m.fx = next.x; m.fy = next.y; }
      m.walkPath.shift(); m.from = null; m.prog = 0; m.steps = (m.steps ?? 0) + 1;
      if (player) this.hub.trackLevel?.();
      if (!m.walkPath.length) {
        m.walkPath = null; m.moving = false;
        if (player) { m.walking = false; m.run = false; }
      }
    }
  }

  _place(m, x, y, dir) {
    m.x = x; m.y = y;
    if (m === this.hub.player) { m.fx = x; m.fy = y; m.moving = false; }
    if (dir) m.dir = dir;
  }

  /** O tile de alguém (arredondado: quem está no meio de um passo conta onde está). */
  _tile(m) {
    return { x: Math.round(m.x), y: Math.round(m.y) };
  }

  /**
   * O tile está livre para `self` passar? (o chão da vila, as pessoas, o jogador e os atores da cena).
   * Vindo de (fx, fy), vale também a regra dos patamares (as Ilhas Seafoam, H-7).
   */
  _free(x, y, self, fx = null, fy = null) {
    const hub = this.hub;
    if (!hub.walkable(x, y)) return false;
    if (fx != null && !heightOk(hub.map, fx, fy, x, y)) return false;
    const p = hub.player;
    if (self !== p && p.x === x && p.y === y) return false;
    return !this.cast.some((a) => a !== self && !a.hidden && Math.round(a.x) === x && Math.round(a.y) === y);
  }

  /**
   * O caminho mais curto até o primeiro dos `goals` ([x, y, dir?]) que dá para
   * alcançar: { path, goal }, ou null se nenhum dá (o passo segue sem andar).
   */
  _route(m, goals) {
    const start = this._tile(m);
    const map = this.hub.map;
    const key = (x, y) => y * map.width + x;
    for (const goal of goals ?? []) {
      const [gx, gy] = goal;
      if (gx === start.x && gy === start.y) return { path: [], goal };
      if (!this._free(gx, gy, m)) continue;
      const from = new Map([[key(start.x, start.y), null]]);
      const queue = [[start.x, start.y]];
      while (queue.length) {
        const [x, y] = queue.shift();
        if (x === gx && y === gy) {
          const path = [];
          let k = key(x, y);
          while (from.get(k) != null) { path.unshift([k % map.width, Math.floor(k / map.width)]); k = from.get(k); }
          return { path, goal };
        }
        for (const [dx, dy] of Object.values(DIRS)) {
          const nx = x + dx, ny = y + dy;
          const k = key(nx, ny);
          if (from.has(k) || !this._free(nx, ny, m, x, y)) continue;
          from.set(k, key(x, y));
          queue.push([nx, ny]);
        }
      }
    }
    return null;
  }

  /** O pássaro do Voar, em tiles: desce até alguém, pega e sai pelo céu (ou acompanha até a porta). */
  _moveBird() {
    const b = this.fx.bird;
    if (!b) return;
    const m = this.actor(b.who);
    if (b.follow) { b.x = m.x - 0.9; b.y = m.y - 0.75; return; }
    if (b.mode === 'in') { const k = Math.min(1, b.t / 0.8), e = 1 - Math.pow(1 - k, 3); b.x = b.sx + (b.tx - b.sx) * e; b.y = b.sy + (b.ty - b.sy) * e; b.flip = false; }
    else if (b.mode === 'grab') { const k = Math.min(1, b.t / 0.45); b.x = b.sx + (b.tx - b.sx) * k; b.y = b.sy + (b.ty - b.sy) * k; }
    else if (b.mode === 'away') { const k = Math.min(1, b.t / 1.2); b.x = b.sx + 16 * k * k; b.y = b.sy - 10.5 * k; b.flip = true; }
  }
}
