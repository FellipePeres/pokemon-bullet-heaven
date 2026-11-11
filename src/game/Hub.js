import { CONFIG } from '../core/config.js';
import { HUB } from '../data/hub.js';
import { HUB_MAPS, HUB_DECOR } from '../data/hubMaps.js';
import { DECOR, decorMax } from '../data/decor.js';
import { DIALOGUE } from '../data/dialogue.js';
import { getPokemon } from '../data/pokemon.js';
import { STAGES, RIVAL_STARTER } from '../data/stages.js';
import { bus, EVENTS } from '../core/events.js';

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };
const LOOK_DIRS = ['down', 'left', 'right', 'down', 'up'];

/** "LT. SURGE" -> "Lt. Surge": os nomes dos líderes vêm em maiúsculas nos dados. */
const titleCase = (text) => text.toLowerCase().replace(/(^|[\s.])\p{L}/gu, (c) => c.toUpperCase());
const between = (min, max) => min + Math.random() * (max - min);

/**
 * A VILA — o lobby jogável (PLANEJAMENTO-LOBBY.md): o jogador anda em grade,
 * como no FireRed, entra nas casas, fala com as pessoas e sai para a jornada.
 *
 * Aqui fica só a regra (andar, colidir, portas, saídas, conversas); quem
 * desenha é render/HubRenderer.js, e a caixa de texto e a barra são de
 * ui/hubHud.js. O Game passa o tempo, o direcional e o "correr" a cada quadro.
 *
 * A grade é a do FireRed: um passo é um tile; tocar numa direção nova primeiro
 * vira o personagem; a porta é um tile que bloqueia e leva para dentro quando
 * o jogador anda contra ela; o tapete da saída leva para fora quando ele
 * aperta para baixo em cima dele.
 */
export class Hub {
  constructor(game) {
    this.game = game;
    this.mapId = null;
    this.place = null;      // a entrada de data/hub.js
    this.map = null;        // o mapa gerado (data/hubMaps.js): tamanho e colisão
    this.player = { x: 0, y: 0, fx: 0, fy: 0, dir: 'down', moving: false, t: 0, dx: 0, dy: 0, run: false, stride: 0, turn: 0, walking: false };
    this.npcs = [];
    this.dialog = null;
    this.fade = null;
    this.banner = null;
    this.path = null;       // os passos de um clique (andar até o tile)
    this.pending = null;    // o que fazer ao chegar (falar, entrar na porta, sair)
    this.awaitStarter = false;
    this.scene = null;      // a cena tocando (0.39, game/Cutscene.js): enquanto dura, o jogador não anda
  }

  /* ============================== lugares ============================== */

  /** Põe o jogador num lugar: 'bedroom', 'home' ou { map, x, y, dir }. */
  enter(target) {
    const spot = typeof target === 'string' ? HUB.spawn[target] : target;
    // uma cena pela metade (um save carregado no meio dela) não fica presa (0.37.9); a
    // que o lugar começa ao chegar (o trigger 'enter' das cenas, 0.39) fica
    this.scene = null;
    this._load(spot.map);
    this._place(spot.x, spot.y, spot.dir);
    this.dialog = null;
    this.fade = null;
    this.awaitStarter = false;
  }

  _load(mapId) {
    this.mapId = mapId;
    this.place = HUB.maps[mapId];
    this.map = HUB_MAPS[mapId];
    this.npcs = (this.place.npcs ?? []).map((npc) => ({ ...npc, timer: between(...CONFIG.hub.lookEvery) }));
    this.banner = { text: this.place.name, t: CONFIG.hub.bannerSeconds };
    // num palco de cena (0.39), a tela fica cheia
    this.game.onPlaceChange?.();
    // a história (0.38): "Vá ao laboratório" fecha ao entrar nele
    bus.emit(EVENTS.STORY, { on: 'enter', target: mapId });
  }

  _place(x, y, dir) {
    Object.assign(this.player, { x, y, fx: x, fy: y, dir, moving: false, t: 0, turn: 0, walking: false });
    this.path = null;
    this.pending = null;
  }

  /* ============================== consultas ============================== */

  get campaign() { return this.game.campaign; }
  get hasStarter() { return !!this.campaign.starter; }

  inside(x, y) { return x >= 0 && y >= 0 && x < this.map.width && y < this.map.height; }

  /** O tile em si (sem contar quem está em cima). */
  floor(x, y) { return this.inside(x, y) && this.map.walk[y][x] === '.'; }

  npcAt(x, y) { return this.npcs.find((npc) => !npc.hidden && npc.x === x && npc.y === y) ?? null; }

  /**
   * O que está enfeitando o lugar agora: as peças fixas (a bola do inicial
   * escolhido some da mesa) e, no quarto, o que o jogador comprou na loja de
   * Pokédolls (data/decor.js). Cada uma é um sprite (`sprite`) ou um móvel (`piece`).
   */
  get decor() {
    const ctx = { starterId: this.campaign.starter };
    const loot = this.loot.map((l) => ({ sprite: 'item_ball', x: l.x, y: l.y, solid: true, loot: l }));
    // `hideIf` é uma condição ou uma lista delas (some se qualquer uma bater: a bola do
    // inicial do jogador e, depois da cena do rival, a dele, 0.39)
    const hidden = (cond) => (Array.isArray(cond) ? cond : [cond]).some((c) => this._matches(c, ctx));
    const fixed = (this.place.decor ?? []).filter((d) => !d.hideIf || !hidden(d.hideIf));
    return this.mapId === HUB.room ? [...fixed, ...this._roomDecor()] : [...fixed, ...loot];
  }

  /** As Poké Balls do chão (0.39, `loot` em data/hub.js) que ainda não foram pegas nesta jornada. */
  get loot() {
    const flags = this._flags();
    return (this.place?.loot ?? []).filter((l) => !flags[`loot:${this.mapId}:${l.id}`]);
  }

  /** Pega a Poké Ball do chão: o item vai para a mochila, e a bola some (uma vez por jornada). */
  _pickup(loot) {
    const count = loot.count ?? 1;
    const name = this.game.giveItem?.(loot.item, count) ?? loot.item;
    this._flags()[`loot:${this.mapId}:${loot.id}`] = true;
    const what = `${count > 1 ? `${count} ` : 'um '}${name.toUpperCase()}`;
    this.dialog = { key: null, name: null, pages: [`${this.game.playerName} encontrou ${what}!`], index: 0, shown: 0, ask: null, then: null, npc: null };
    this.game.autosave?.();
  }

  _roomDecor() {
    const owned = this.game.profile.decor ?? {};
    const items = [];
    for (const item of DECOR) {
      const count = Math.min(owned[item.id] ?? 0, decorMax(item));
      for (let i = 0; i < count; i++) {
        const [x, y] = item.slots ? item.slots[i] : item.at;
        items.push(item.piece ? { piece: item.piece, x, y, item } : { sprite: item.sprite, x, y, solid: true, item });
      }
    }
    return items;
  }

  /** As células que um enfeite bloqueia (o boneco no tile dele; o móvel, as do mapa de origem). */
  _solidCells(d) {
    if (d.piece) return HUB_DECOR[d.piece].solid.map(([sx, sy]) => [d.x + sx, d.y + sy]);
    return d.solid ? [[d.x, d.y]] : [];
  }

  walkable(x, y) {
    if (!this.floor(x, y) || this.npcAt(x, y)) return false;
    return !this.decor.some((d) => this._solidCells(d).some(([cx, cy]) => cx === x && cy === y));
  }

  _warp(x, y) { return (this.place.warps ?? []).find((w) => w.x === x && w.y === y) ?? null; }

  _thing(x, y) {
    const fixed = (this.place.things ?? []).find((t) => t.cells.some(([cx, cy]) => cx === x && cy === y));
    if (fixed) return fixed;
    // os enfeites comprados respondem ao A pelas células que bloqueiam
    const bought = this.decor.find((d) => d.item && this._solidCells(d).some(([cx, cy]) => cx === x && cy === y));
    return bought ? { talk: bought.item.talk, extra: { item: bought.item.name } } : null;
  }

  _exit(x, y, dir) {
    return (this.place.exits ?? []).find((e) => e.dir === dir && e.cells.some(([cx, cy]) => cx === x && cy === y)) ?? null;
  }

  /** A saída está travada? (até o Carvalho dar o inicial: seção 4 do planejamento) */
  locked(exit) { return exit.needs === 'starter' && !this.hasStarter; }

  /** O quanto a tela está escura na troca de lugar (0 a 1). */
  get fadeAlpha() {
    if (!this.fade) return 0;
    return this.fade.phase === 'out' ? this.fade.t : 1 - this.fade.t;
  }

  /* ============================== o quadro ============================== */

  /**
   * Um passo do tempo. `move` é o direcional (o vetor do Input) e `running`, o
   * botão de correr. A conversa e a troca de lugar seguram o jogador.
   */
  update(dt, move = { x: 0, y: 0 }, running = false) {
    if (!this.map) return;
    if (this.banner && (this.banner.t -= dt) <= 0) this.banner = null;
    if (this.fade) { this._updateFade(dt); return; }
    // uma cena (0.37 o Maxie; 0.39 o motor de game/Cutscene.js): o roteiro anda, e a
    // caixa de texto é a da vila. No fim, a ação que ela deixou (abrir a escolha do inicial...)
    if (this.scene) {
      this.scene.update(dt);
      if (this.dialog) this._updateDialog(dt);
      if (this.scene?.done) {
        const then = this.scene.then;
        this.scene = null;
        if (then) this._act(then);
      }
      return;
    }
    // um palco de cena (0.39) sem cena tocando não é lugar de andar: volta para a vila
    if (this.place.scene && !this.dialog) { this._goHome(); return; }
    this._updateNpcs(dt);
    if (this.dialog) { this._updateDialog(dt); return; }

    const p = this.player;
    if (p.moving) {
      const duration = p.run ? CONFIG.hub.runTime : CONFIG.hub.walkTime;
      const step = dt / duration;
      p.t += step;
      p.stride += step * CONFIG.trainer.animation.stride;
      if (p.t < 1) {
        p.fx = p.x + p.dx * p.t;
        p.fy = p.y + p.dy * p.t;
        return;
      }
      p.x += p.dx;
      p.y += p.dy;
      Object.assign(p, { fx: p.x, fy: p.y, moving: false, t: 0 });
      if (this._arrive()) return;
    }

    let dir = this._inputDir(move);
    if (dir) { this.path = null; this.pending = null; }
    const fromPath = !dir && this.path?.length;
    if (fromPath) dir = this.path[0];
    if (!dir) {
      p.walking = false;
      p.turn = 0;
      if (this.pending) this._runPending();
      return;
    }

    // tocar numa direção nova, parado, só vira (como no FireRed); segurar anda
    if (!fromPath && dir !== p.dir && !p.walking) {
      p.dir = dir;
      p.turn = CONFIG.hub.turnDelay;
      p.walking = true;
      return;
    }
    if (p.turn > 0 && !fromPath) { p.turn -= dt; if (p.turn > 0) return; }

    const moved = this._tryMove(dir, running);
    if (fromPath) {
      if (moved) this.path.shift();
      else { this.path = null; this.pending = null; }
    }
  }

  _inputDir(move) {
    if (!move || (!move.x && !move.y)) return null;
    // na diagonal, a direção em que ele já está continua valendo (como no FireRed)
    const horizontal = move.x > 0 ? 'right' : 'left';
    const vertical = move.y > 0 ? 'down' : 'up';
    if (move.x && move.y) {
      if (this.player.dir === horizontal || this.player.dir === vertical) return this.player.dir;
      return Math.abs(move.x) >= Math.abs(move.y) ? horizontal : vertical;
    }
    return move.x ? horizontal : vertical;
  }

  /** Tenta dar um passo. Devolve se andou (ou entrou por uma porta). */
  _tryMove(dir, running) {
    const p = this.player;
    p.dir = dir;
    p.walking = true;
    const [dx, dy] = DIRS[dir];

    // o tapete da saída: para baixo em cima dele
    const here = this._warp(p.x, p.y);
    if (here?.on === 'mat' && dir === 'down') { this._warpTo(here); return true; }

    const nx = p.x + dx;
    const ny = p.y + dy;
    if (!this.inside(nx, ny)) {
      const exit = this._exit(p.x, p.y, dir);
      if (exit) this._useExit(exit);
      return false;
    }
    const door = this._warp(nx, ny);
    if (door?.on === 'push' && (!door.face || door.face === dir)) { this._warpTo(door); return true; }
    if (!this.walkable(nx, ny)) return false;

    Object.assign(p, { moving: true, t: 0, dx, dy, run: running });
    return true;
  }

  /** Chegou num tile: a escada e a entrada aberta da loja levam na hora. */
  _arrive() {
    const warp = this._warp(this.player.x, this.player.y);
    if (warp?.on === 'step') { this._warpTo(warp); return true; }
    return false;
  }

  _warpTo(warp) {
    this.path = null;
    this.pending = null;
    this._fadeOut(() => {
      this._load(warp.to);
      this._place(warp.tx, warp.ty, warp.dir);
      // as falas de "uma vez só" já vistas ficam guardadas a cada troca de lugar
      this.game.autosave?.();
    });
  }

  _fadeOut(then) {
    this.fade = { phase: 'out', t: 0, then };
  }

  _updateFade(dt) {
    const fade = this.fade;
    fade.t += dt / CONFIG.hub.fadeSeconds;
    if (fade.t < 1) return;
    if (fade.phase === 'out') {
      const then = fade.then;
      this.fade = { phase: 'in', t: 0 };
      then?.();
    } else {
      this.fade = null;
    }
  }

  /* ============================== as saídas ============================== */

  _useExit(exit) {
    if (this.locked(exit)) {
      const guard = this.npcs.find((npc) => npc.id === exit.guard);
      if (guard) this._faceToward(guard, this.player);
      // depois do aviso, um passo para trás, como no FireRed (senão a fala volta em laço)
      if (this.say(guard?.talk ?? exit.guard, { locked: true, npc: guard })) {
        this.dialog.after = () => this._stepBack(exit.dir);
      }
      return;
    }
    if (exit.action === 'campaign') {
      // um passo para dentro: ao voltar do mapa, o jogador não fica colado na borda
      const [dx, dy] = DIRS[exit.dir];
      this._fadeOut(() => {
        this._place(this.player.x - dx, this.player.y - dy, OPPOSITE[exit.dir]);
        this.game.openCampaign();
      });
      return;
    }
    if (exit.action === 'endless') this.say('endless_breve');
  }

  /* ============================== as pessoas ============================== */

  _updateNpcs(dt) {
    for (const npc of this.npcs) {
      if (!npc.look || this.dialog?.npc === npc) continue;
      npc.timer -= dt;
      if (npc.timer > 0) continue;
      npc.timer = between(...CONFIG.hub.lookEvery);
      npc.dir = LOOK_DIRS[Math.floor(Math.random() * LOOK_DIRS.length)];
    }
  }

  _faceToward(npc, target) {
    const dx = target.x - npc.x;
    const dy = target.y - npc.y;
    if (!dx && !dy) return;
    npc.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  }

  /* ============================== o botão A ============================== */

  /** A: avança a conversa ou fala com quem está na frente. */
  confirm() {
    if (this.fade || !this.map) return;
    if (this.dialog) { this._advance(); return; }
    if (this.player.moving || this.scene) return;
    this.interact();
  }

  /** B: na pergunta, é o NÃO; na conversa, avança como o A. */
  cancel() {
    const d = this.dialog;
    if (!d || !this.map) return;
    if (this._onAsk()) { d.ask.choice = 1; this._advance(); return; }
    this._advance();
  }

  /** Na pergunta de SIM/NÃO, ↑ ↓ trocam a escolha. */
  choose() {
    if (this._onAsk()) this.dialog.ask.choice = 1 - this.dialog.ask.choice;
  }

  _onAsk() {
    const d = this.dialog;
    return !!(d?.ask && d.index === d.pages.length - 1 && d.shown >= d.pages[d.index].length);
  }

  /** Fala com quem (ou o que) está no tile da frente. Devolve se havia alguém. */
  interact() {
    const p = this.player;
    const [dx, dy] = DIRS[p.dir];
    const fx = p.x + dx;
    const fy = p.y + dy;
    let npc = this.npcAt(fx, fy);
    // atrás do balcão: fala por cima dele, como no Centro Pokémon do FireRed
    if (!npc && !this.floor(fx, fy)) {
      const beyond = this.npcAt(fx + dx, fy + dy);
      if (beyond?.counter) npc = beyond;
    }
    if (npc) {
      if (!npc.counter) npc.dir = OPPOSITE[p.dir];
      npc.timer = between(...CONFIG.hub.lookEvery);
      // falar com alguém pode começar uma cena (o trigger 'npc', 0.39) no lugar da fala
      if (this.game.sceneTrigger?.('npc', npc.id)) return true;
      this.say(npc.talk, { npc });
      return true;
    }
    // uma Poké Ball no chão (0.39): pega
    const loot = this.decor.find((d) => d.loot && d.x === fx && d.y === fy)?.loot;
    if (loot) { this._pickup(loot); return true; }
    const thing = this._thing(fx, fy);
    if (thing) { this.say(thing.talk, thing.extra ?? {}); return true; }
    return false;
  }

  /* ============================== as conversas ============================== */

  /** Abre a fala `key` de data/dialogue.js: a primeira cuja condição bate. */
  say(key, extra = {}) {
    const entry = DIALOGUE[key];
    if (!entry) return false;
    const ctx = this._context(extra);
    const line = entry.lines.find((l) => this._matches(l.when, ctx));
    if (!line) return false;
    if (line.when?.once) this._flags()[this._fill(line.when.once, ctx)] = true;
    const pages = line.say.map((text) => this._fill(text, ctx));
    if (line.ask) pages.push(this._fill(line.ask.text, ctx));
    this.dialog = {
      key,
      name: entry.name ?? null,
      pages, index: 0, shown: 0,
      ask: line.ask ? { yes: line.ask.yes, no: (line.ask.no ?? []).map((t) => this._fill(t, ctx)), choice: 0 } : null,
      then: line.then ?? null,
      npc: extra.npc ?? null
    };
    return true;
  }

  /** A conversa `key` chegou ao fim (a história: "Fale com a mãe" fecha aqui, 0.38). */
  _talked(key) {
    if (key) bus.emit(EVENTS.STORY, { on: 'talk', target: key });
  }

  _updateDialog(dt) {
    const d = this.dialog;
    const page = d.pages[d.index];
    if (d.shown < page.length) d.shown = Math.min(page.length, d.shown + dt * CONFIG.hub.textSpeed);
  }

  _advance() {
    const d = this.dialog;
    const page = d.pages[d.index];
    if (d.shown < page.length) { d.shown = page.length; return; }
    if (d.index < d.pages.length - 1) { d.index++; d.shown = 0; return; }
    if (d.ask) {
      this.dialog = null;
      this._talked(d.key);
      if (d.ask.choice === 0) this._act(d.ask.yes);
      else if (d.ask.no.length) this.dialog = { ...d, key: null, pages: d.ask.no, index: 0, shown: 0, ask: null, then: null };
      return;
    }
    this.dialog = null;
    d.after?.();
    this._talked(d.key);
    if (d.then) this._act(d.then);
  }

  /**
   * De um palco de cena (0.39) para a vila, escurecendo a tela: na frente de casa ou,
   * se outra cena espera (a do velho sábio depois da do Brock), no lugar dela, e ela toca.
   */
  _goHome() {
    const next = this.game.pendingSceneSpot ?? null;
    const spot = next ?? HUB.spawn.home;
    this._fadeOut(() => {
      this._load(spot.map);
      this._place(spot.x, spot.y, spot.dir);
      if (next) this.game.playScene(next.id);
      this.game.autosave?.();
    });
  }

  /** Um passo na direção contrária, sem virar de costas (o empurrão do guarda). */
  _stepBack(dir) {
    const p = this.player;
    const [dx, dy] = DIRS[OPPOSITE[dir]];
    if (!this.walkable(p.x + dx, p.y + dy)) return;
    Object.assign(p, { moving: true, t: 0, dx, dy, run: false, walking: false });
  }

  /** O que uma fala dispara no fim. */
  _act(action) {
    const game = this.game;
    switch (action) {
      case 'starter': this.awaitStarter = true; game.openStarterChoice(); break;
      case 'pc': game.menus.showModal('modal-pc'); break;
      case 'mart': game.menus.showModal('modal-mart'); break;
      case 'save': game.saveToFile(); break;
      case 'campaign': game.openCampaign(); break;
      case 'pokedoll': game.menus.showModal('modal-decor'); break;
      case 'badges': game.menus.showModal('modal-badges'); break;
      case 'aquatic': this._fadeOut(() => game.openDive()); break;   // escurece e aparece lá embaixo (0.37.1)
      // o fim das cenas dos palcos (0.39): de volta para a vila, ou a fase que vem depois da cena
      case 'home': this._goHome(); break;
      case 'stage': game.startSceneStage(); break;
      default:
        // { go: { map, x, y, dir } }: leva a outro lugar, escurecendo (o fim do fundo da Usina)
        if (action?.go) {
          const go = action.go;
          this._fadeOut(() => { this._load(go.map); this._place(go.x, go.y, go.dir); game.autosave?.(); });
        }
        break;
    }
  }

  /** Depois da escolha do inicial: o Carvalho fecha a mini-história. */
  afterStarter() {
    if (!this.awaitStarter) return;
    this.awaitStarter = false;
    const oak = this.npcs.find((npc) => npc.id === 'carvalho');
    if (oak) this._faceToward(oak, this.player);
    // a cena do rival (0.39), que termina com esta mesma fala do Carvalho
    if (this.game.sceneTrigger?.('starter')) return;
    this.say('carvalho_inicial', { npc: oak });
  }

  /** Quem volta da escolha sem escolher. */
  cancelStarter() {
    if (!this.awaitStarter) return;
    this.awaitStarter = false;
    this.say('carvalho_espera');
  }

  /* ============================== condições ============================== */

  _flags() {
    const campaign = this.campaign;
    campaign.hub ??= { flags: {} };
    campaign.hub.flags ??= {};
    return campaign.hub.flags;
  }

  _context(extra = {}) {
    const game = this.game;
    const campaign = this.campaign;
    const lastStage = game.region.campaign.filter((e) => e.stage).at(-1)?.stage;
    const leaderStage = [...campaign.clearedStages].reverse().map((id) => STAGES[id]).find((s) => s?.leader);
    const members = campaign.journey?.team?.members ?? [];
    return {
      starter: !!campaign.starter,
      starterId: campaign.starter,
      shiny: !!campaign.starterShiny,
      badges: campaign.badges.length,
      champion: !!lastStage && campaign.clearedStages.includes(lastStage),
      dex: game.tracker.dexProgress.caught,
      veteran: game.listJourneys().some((j) => !j.active && j.progress?.starter),
      dive: members.some((m) => m.abilities?.includes('dive')),
      kyogre: !!campaign.dive?.captured,
      diveTm: game.martTargets('tm_dive').length > 0,
      diveRescued: (campaign.dive?.rescues ?? 0) > 0,
      locked: !!extra.locked,
      quests: game.quests?.state ?? null,   // a história (0.38): as condições quest e questDone
      scenes: campaign.scenes ?? {},        // as cenas vistas (0.39): a condição scene
      item: extra.item ?? '',
      player: game.playerName,
      pokemon: campaign.starter ? getPokemon(campaign.starter)?.name ?? '' : '',
      // o inicial do rival: o que leva vantagem sobre o do jogador (data/stages.js)
      rivalStarter: RIVAL_STARTER[campaign.starter] ?? null,
      rival: RIVAL_STARTER[campaign.starter] ? getPokemon(RIVAL_STARTER[campaign.starter])?.name ?? '' : '',
      leader: leaderStage ? titleCase(leaderStage.leader.name) : ''
    };
  }

  _matches(when, ctx) {
    if (!when) return true;
    for (const [key, value] of Object.entries(when)) {
      switch (key) {
        case 'starter': case 'shiny': case 'champion': case 'veteran': case 'dive': case 'diveTm': case 'diveRescued': case 'kyogre': case 'locked':
          if (ctx[key] !== value) return false;
          break;
        case 'starterIs': if (ctx.starterId !== value) return false; break;
        case 'badges': if (ctx.badges < value) return false; break;
        case 'dex': if (ctx.dex < value[0] || ctx.dex > value[1]) return false; break;
        case 'once': if (this._flags()[this._fill(value, ctx)]) return false; break;
        // a história (0.38): a quest `value` está ativa / já fechou
        case 'quest': if (!ctx.quests?.active.includes(value)) return false; break;
        case 'questDone': if (!ctx.quests?.done[value]) return false; break;
        // as cenas (0.39): a cena `value` já foi vista; a flag `value` da vila está marcada
        case 'scene': if (ctx.scenes?.[value] !== 'seen') return false; break;
        case 'flag': if (!this._flags()[value]) return false; break;
        default: return false;   // condição desconhecida: a fala não vale (o check-data acusa)
      }
    }
    return true;
  }

  _fill(text, ctx) {
    return text
      .replaceAll('{player}', ctx.player)
      .replaceAll('{pokemon}', ctx.pokemon)
      .replaceAll('{rival}', ctx.rival ?? '')
      .replaceAll('{leader}', ctx.leader)
      .replaceAll('{dex}', String(ctx.dex))
      .replaceAll('{badges}', String(ctx.badges))
      .replaceAll('{item}', ctx.item ?? '');
  }

  /* ============================== o mouse ============================== */

  /**
   * Clique num tile: o jogador anda até lá pelo caminho mais curto. Clicou em
   * alguém, numa placa ou numa porta: anda até o lado, vira e fala (ou entra).
   */
  clickTile(tx, ty) {
    if (this.scene) { if (this.dialog) this.confirm(); return; }
    if (this.fade || !this.map) return;
    if (this.dialog) { this.confirm(); return; }
    const p = this.player;
    if (tx === p.x && ty === p.y) return;

    const goals = [];
    if (this.walkable(tx, ty)) {
      goals.push({ x: tx, y: ty, then: null });
      // clicou na saída: chega e sai
      for (const exit of this.place.exits ?? []) {
        if (exit.cells.some(([x, y]) => x === tx && y === ty)) goals[0].then = { dir: exit.dir, act: 'move' };
      }
    } else {
      const npc = this.npcAt(tx, ty);
      const door = this._warp(tx, ty);
      for (const [dir, [dx, dy]] of Object.entries(DIRS)) {
        if (door?.on === 'push' && door.face && door.face !== dir) continue;
        goals.push({ x: tx - dx, y: ty - dy, then: { dir, act: door?.on === 'push' ? 'move' : 'talk' } });
        // atrás do balcão: dá para falar de dois tiles
        if (npc?.counter && !this.floor(tx - dx, ty - dy)) {
          goals.push({ x: tx - 2 * dx, y: ty - 2 * dy, then: { dir, act: 'talk' } });
        }
      }
    }
    const route = this._route(goals);
    if (!route) return;
    this.path = route.steps;
    this.pending = route.goal.then;
  }

  _runPending() {
    const pending = this.pending;
    this.pending = null;
    this.player.dir = pending.dir;
    if (pending.act === 'move') this._tryMove(pending.dir, false);
    else this.interact();
  }

  /** Busca em largura até o objetivo mais perto (lista de direções), ou null. */
  _route(goals) {
    const p = this.player;
    const key = (x, y) => y * this.map.width + x;
    const wanted = new Map();
    for (const goal of goals) {
      if ((goal.x === p.x && goal.y === p.y) || this.walkable(goal.x, goal.y)) wanted.set(key(goal.x, goal.y), goal);
    }
    if (!wanted.size) return null;
    const from = new Map([[key(p.x, p.y), null]]);
    const queue = [[p.x, p.y]];
    while (queue.length) {
      const [x, y] = queue.shift();
      const goal = wanted.get(key(x, y));
      if (goal) {
        const steps = [];
        let k = key(x, y);
        while (from.get(k)) { const [dir, prev] = from.get(k); steps.unshift(dir); k = prev; }
        return { goal, steps };
      }
      for (const [dir, [dx, dy]] of Object.entries(DIRS)) {
        const nx = x + dx;
        const ny = y + dy;
        const k = key(nx, ny);
        if (from.has(k) || !this.walkable(nx, ny)) continue;
        from.set(k, [dir, key(x, y)]);
        queue.push([nx, ny]);
      }
    }
    return null;
  }
}
