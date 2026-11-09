/**
 * Teste de interface sem navegador.
 *
 * Monta um DOM mínimo a partir do index.html real e roda o jogo inteiro por cima:
 * menu, escolha de inicial, mapa, partida, HUD, modais e overlays. Não valida
 * aparência — valida que nenhuma tela quebra e que os elementos existem.
 *
 * Uso: npm run smoke:ui
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const ids = [...html.matchAll(/id="([a-zA-Z0-9-]+)"/g)].map((m) => m[1]);

let failures = 0;
const check = (label, condition, extra = '') => {
  const ok = !!condition;
  if (!ok) failures++;
  console.log(`${ok ? '  OK  ' : ' FALHA'} | ${label}${extra ? ` — ${extra}` : ''}`);
};

/* ===================== DOM mínimo ===================== */

class StubElement {
  constructor(tag = 'div', id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.children = [];
    this.classes = new Set();
    this.style = new Proxy({}, {
      get: (t, k) => (k === 'setProperty' ? (name, value) => { t[name] = String(value); } : t[k] ?? ''),
      set: (t, k, v) => { t[k] = v; return true; }
    });
    this.dataset = {};
    this.attributes = {};
    this._text = '';
    this._html = '';
    this.listeners = {};
  }
  get classList() {
    const set = this.classes;
    return {
      add: (...c) => c.forEach((x) => set.add(x)),
      remove: (...c) => c.forEach((x) => set.delete(x)),
      contains: (c) => set.has(c),
      toggle: (c, force) => (force ?? !set.has(c)) ? set.add(c) : set.delete(c)
    };
  }
  get className() { return [...this.classes].join(' '); }
  set className(v) { this.classes = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get firstChild() { return this.children[0] ?? null; }
  get textContent() { return this._text; }
  set textContent(v) { this._text = String(v); }
  get innerHTML() { return this._html; }
  set innerHTML(v) { this._html = String(v); this.children = []; }
  appendChild(child) { this.children.push(child); return child; }
  append(...nodes) { nodes.forEach((n) => this.appendChild(n)); }
  prepend(...nodes) { this.children.unshift(...nodes); }
  removeChild(child) { this.children = this.children.filter((c) => c !== child); return child; }
  remove() {}
  replaceWith() {}
  querySelector() { return new StubElement('span'); }
  querySelectorAll() { return []; }
  addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  click() { this.onclick?.({ stopPropagation() {} }); }
  getContext() { return stubCtx(); }
}

function stubCtx() {
  const noop = () => {};
  const gradient = { addColorStop: noop };
  return new Proxy({
    canvas: { width: 1280, height: 720 },
    createPattern: () => ({}),
    createRadialGradient: () => gradient,
    createLinearGradient: () => gradient,
    measureText: () => ({ width: 10 }),
    getImageData: () => ({ data: [] })
  }, {
    get: (target, key) => (key in target ? target[key] : noop),
    set: () => true
  });
}

const registry = new Map();
for (const id of ids) registry.set(id, new StubElement('div', id));
// o canvas precisa de contexto
registry.get('game-canvas').getContext = () => stubCtx();

const selectorMatches = {
  '[data-modal]': ['modal-pokedex', 'modal-achievements', 'modal-team', 'modal-options', 'modal-help']
    .map((m) => { const e = new StubElement('button'); e.dataset.modal = m; return e; }),
  '[data-close]': [new StubElement('button')],
  '[data-back]': [(() => { const e = new StubElement('button'); e.dataset.back = 'screen-title'; return e; })()]
};

global.document = {
  getElementById: (id) => registry.get(id) ?? null,
  createElement: (tag) => (tag === 'canvas'
    ? Object.assign(new StubElement('canvas'), { width: 0, height: 0 })
    : new StubElement(tag)),
  querySelectorAll: (sel) => selectorMatches[sel] ?? [],
  body: new StubElement('body'),
  addEventListener: () => {}
};
global.window = {
  addEventListener: () => {}, removeEventListener: () => {}, location: { href: '' },
  innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1
};
global.requestAnimationFrame = () => 0;
global.Image = class { set src(v) { this._src = v; } get src() { return this._src; } };
global.localStorage = {
  store: new Map(),
  getItem(k) { return this.store.get(k) ?? null; },
  setItem(k, v) { this.store.set(k, v); },
  removeItem(k) { this.store.delete(k); }
};
global.Blob = class {};
global.URL = { createObjectURL: () => 'blob:stub', revokeObjectURL: () => {} };
global.setTimeout = ((fn) => { fn(); return 0; });

/* ===================== o jogo ===================== */

const { Game } = await import('../src/game/Game.js');
const { CONFIG } = await import('../src/core/config.js');
const { normalizeProfile } = await import('../src/save/profile.js');

console.log('\n=== INTERFACE — teste sem navegador ===\n');

const game = new Game(registry.get('game-canvas'));
check('jogo inicia no menu principal', !registry.get('screen-title').classes.has('hidden'));
check('barra lateral visível no menu', !registry.get('side-rail').classes.has('hidden'));

// ---- janelas da barra lateral ----
for (const id of ['modal-pokedex', 'modal-achievements', 'modal-team', 'modal-options', 'modal-help']) {
  game.menus.showModal(id);
  check(`janela ${id.replace('modal-', '')} abre`, !registry.get(id).classes.has('hidden'));
  game.menus.closeModal();
  check(`janela ${id.replace('modal-', '')} fecha`, registry.get(id).classes.has('hidden'));
}

check('Pokédex lista as 151 espécies e, no fim, o lendário secreto', registry.get('pokedex-grid').children.length === 152,
      `${registry.get('pokedex-grid').children.length} células`);
{
  // o "???" do fim (0.35): sem número nem silhueta até ser capturado, e fora da contagem
  const last = () => registry.get('pokedex-grid').children.at(-1);
  check('o lendário secreto aparece como "???", sem número e sem silhueta',
        last().classes.has('mystery') && last().innerHTML.includes('???') && !last().innerHTML.includes('<img') && !/#\d/.test(last().innerHTML));
  game.tracker.registerSecret('kyogre');
  game.menus.showModal('modal-pokedex');
  check('capturado, ele se revela: o Kyogre, ainda sem número',
        last().classes.has('caught') && last().innerHTML.includes('Kyogre') && last().innerHTML.includes('<img') && !/#\d/.test(last().innerHTML));
  check('...e não entra na contagem da Pokédex', registry.get('pokedex-progress').textContent.includes('de 151'));
  game.menus.closeModal();
  game.profile.pokedex.secret = [];
}
check('conquistas listadas sem quebrar', registry.get('achievements-list').children.length > 5,
      `${registry.get('achievements-list').children.length} conquistas`);

// ---- nova jornada: o treinador, e a vila (0.29) ----
game.newGame();
check('nova jornada começa pela escolha de treinador', !registry.get('screen-trainer').classes.has('hidden'));
check('tela de treinador oferece menino e menina', registry.get('trainer-choices').children.length === 2,
      `${registry.get('trainer-choices').children.length} modelos`);
game.chooseTrainer('leaf');
check('depois de menino ou menina vem o nome do jogador (0.30), com o do modelo como sugestão',
      !registry.get('screen-name').classes.has('hidden') && registry.get('name-input').placeholder === 'Leaf');
game.chooseName('  Fel<lipe>  ');
check('o nome escrito fica limpo (sem espaços nem HTML) e guardado na jornada',
      game.profile.trainerName === 'Fellipe' && game.playerName === 'Fellipe');

const hub = game.hub;
const STEP = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const busy = () => hub.fade || hub.player.moving || hub.path?.length || hub.pending;
// deixa a vila andar até parar (passo, caminho do clique, troca de lugar)
const settle = () => { for (let i = 0; i < 900 && busy(); i++) hub.update(1 / 60); };
// segura uma direção até o passo começar (ou abrir uma conversa, ou trocar de lugar) e solta
const press = (dir) => {
  for (let i = 0; i < 30 && !hub.player.moving && !hub.fade && !hub.dialog; i++) hub.update(1 / 60, STEP[dir]);
  settle();
};
const goTo = (x, y) => { hub.clickTile(x, y); settle(); return hub.player.x === x && hub.player.y === y; };
const dialogText = () => (hub.dialog ? hub.dialog.pages.join(' ') : '');
const closeDialog = () => { for (let i = 0; i < 40 && hub.dialog; i++) hub.confirm(); };
const hubVisible = () => !registry.get('screen-hub').classes.has('hidden');

check('escolher o treinador leva à vila: o jogador acorda no quarto, ainda sem Pokémon',
      game.profile.trainer === 'leaf' && hubVisible() && hub.mapId === 'casa_2f' && !game.campaign.starter);
game.hubRenderer.render(hub);
game.hubHud.update(hub);
check('a barra da vila mostra o nome do jogador e o Mapa da jornada travado',
      registry.get('hub-title').textContent === 'Fellipe · Kanto' && registry.get('hub-btn-map').classes.has('locked'));
game.hubOpenMap();
check('sem o inicial, o Mapa da jornada não abre', hubVisible() && registry.get('screen-campaign').classes.has('hidden'));

// andar em grade, como no FireRed
press('down');
check('um toque para baixo anda exatamente um tile', hub.player.x === 5 && hub.player.y === 6, `${hub.player.x},${hub.player.y}`);
press('left'); press('left'); press('left');
check('a cama bloqueia o caminho', hub.player.x === 3 && hub.player.y === 6 && hub.player.dir === 'left', `${hub.player.x},${hub.player.y}`);
hub.confirm();
for (let i = 0; i < 10 && !hub._onAsk(); i++) hub.confirm();
check('o A de frente para a cama pergunta se quer salvar', hub._onAsk() && dialogText().includes('salvar'));
hub.cancel();
check('NÃO fecha a conversa', !hub.dialog);
check('a escada leva ao térreo', goTo(10, 3) && (press('up'), hub.mapId === 'casa_1f'));
hub.clickTile(8, 4);
settle();
check('clicar na mãe anda até ela e conversa: o Carvalho está no laboratório',
      hub.dialog?.name === 'Mãe' && dialogText().includes('laboratório'));
closeDialog();
check('o tapete da saída leva para a vila, na frente de casa',
      goTo(4, 8) && (press('down'), hub.mapId === 'vila' && hub.player.x === 6 && hub.player.y === 17));

// as saídas travadas até o inicial (seção 4 do planejamento)
goTo(17, 27);
press('down');
check('sem o inicial, a saída sul fica travada: o rapaz avisa',
      hub.dialog?.name === 'Rapaz' && dialogText().includes('Carvalho') && hubVisible() && registry.get('screen-campaign').classes.has('hidden'));
closeDialog();
settle();
check('...e o jogador volta um passo', hub.player.y === 26);
goTo(0, 21);
press('left');
check('o mato alto a oeste também fica travado: o senhor avisa', hub.dialog?.name === 'Senhor');
closeDialog();
settle();

// o laboratório: o Carvalho conta a mini-história e dá o inicial
goTo(26, 7);
press('up');
check('a porta do laboratório leva para dentro', hub.mapId === 'lab' && hub.player.x === 6 && hub.player.y === 12);
check('as três Poké Balls estão na mesa', hub.decor.filter((d) => d.sprite === 'item_ball').length === 3);
hub.clickTile(6, 3);
settle();
check('o Carvalho conta a mini-história das hordas', hub.dialog?.name === 'Prof. Carvalho' && dialogText().includes('hordas'));
closeDialog();
check('...e abre a escolha do inicial com 3 opções',
      !registry.get('screen-starter').classes.has('hidden') && registry.get('starter-choices').children.length === 3);
{
  // o card de escolha (0.31): as três barras com os números dos dados, o golpe no pé e o aviso do efeito
  const cards = registry.get('starter-choices').children;
  const bars = (card) => card?.children.find((c) => c.classes.has('choice-stats'));
  const charmander = cards.find((card) => card.children.some((c) => c.classes.has('choice-head') && c.innerHTML.includes('Charmander')));
  check('o card do inicial tem as barras de vida, dano e alcance e o golpe no pé',
        cards.every((card) => bars(card)?.children.filter((c) => c.classes.has('stat-row')).length === 3
          && card.children.at(-1)?.classes.has('move-box')));
  check('...e avisa a queimadura do Ember, que o Dano/s não conta',
        !!bars(charmander)?.children.some((c) => c.classes.has('stat-extras') && c.innerHTML.includes('queimadura')));
}
game.cancelStarter();
check('o Voltar da escolha devolve ao laboratório, com o Carvalho esperando', hubVisible() && dialogText().includes('Pense com calma'));
closeDialog();
hub.clickTile(6, 3);
settle();
closeDialog();
game.chooseStarter('charmander');
check('escolhido o inicial, o Carvalho entrega o Mapa da Jornada (0.30)',
      hubVisible() && dialogText().includes('Charmander') && dialogText().includes('Fellipe recebeu o MAPA DA JORNADA'));
closeDialog();
check('a bola do inicial escolhido some da mesa', hub.decor.filter((d) => d.sprite === 'item_ball').length === 2);
check('Pokédex registra o inicial escolhido', game.profile.pokedex.caught.includes(4));
game.hubHud.render();
check('com o inicial, o Mapa da jornada destrava, com o aviso de novo',
      !registry.get('hub-btn-map').classes.has('locked') && registry.get('hub-btn-map').classes.has('alert'));

// o Centro Pokémon: a enfermeira abre o PC, o vendedor abre o Poké Mart (falando por cima do balcão)
goTo(6, 12); press('down');
goTo(17, 9); press('up');
check('a porta do Centro Pokémon leva para dentro', hub.mapId === 'centro' && hub.player.x === 2 && hub.player.y === 9);
hub.clickTile(4, 3);
settle();
check('fala-se com a enfermeira por cima do balcão (e ela não cura)', hub.dialog?.name === 'Enfermeira' && dialogText().includes('caixas'));
closeDialog();
check('...e ela abre o PC', game.menus.openModal === 'modal-pc');
game.menus.closeModal();
hub.clickTile(12, 3);
settle();
closeDialog();
check('o vendedor do outro balcão abre o Poké Mart', game.menus.openModal === 'modal-mart');
game.menus.closeModal();
goTo(2, 9); press('down');
check('o tapete do Centro devolve à porta dele', hub.mapId === 'vila' && hub.player.x === 17 && hub.player.y === 9);
// a loja de Pokédolls e o quarto decorável (seção 6 do planejamento)
goTo(23, 21);
press('up');
check('a entrada aberta da loja de Pokédolls leva para dentro', hub.mapId === 'pokedoll' && hub.player.x === 10 && hub.player.y === 10);
check('a entrada da loja fica livre (sem os vasos) e o Lapras gigante saiu do corredor das vitrines (0.30)',
      hub.walkable(10, 9) && hub.walkable(9, 10) && hub.walkable(8, 4) && !hub.walkable(3, 1));
hub.clickTile(3, 9);
settle();
closeDialog();
check('a vendedora abre o catálogo de enfeites para o quarto',
      game.menus.openModal === 'modal-decor' && registry.get('decor-list').children.length === 10);
game.profile.shards = 1000;
check('comprar a Mesa com PC desconta os Shards', game.buyDecor('pc_mesa') && game.profile.shards === 700 && game.profile.decor.pc_mesa === 1);
check('a mesma mesa não se compra duas vezes', game.buyDecor('pc_mesa') === false);
game.buyDecor('planta'); game.buyDecor('planta'); game.buyDecor('doll_pikachu');
check('as plantas somam até quatro lugares', game.profile.decor.planta === 2);
check('o Lapras gigante fica travado até o Campeão', game.buyDecor('lapras') === false && !game.profile.decor.lapras);
game.menus.closeModal();
hub.enter('bedroom');
const roomDecor = hub.decor.filter((d) => d.item);
check('o que foi comprado aparece no quarto (a mesa, as duas plantas e o boneco)', roomDecor.length === 4,
      roomDecor.map((d) => d.item.id).join(', '));
check('o boneco ocupa o tile dele', !hub.walkable(9, 5));
goTo(1, 2);
hub.player.dir = 'up';
hub.interact();
closeDialog();
check('a mesa com PC do quarto abre o PC', game.menus.openModal === 'modal-pc');
game.menus.closeModal();
game.profile.shards = 0;
hub.enter({ map: 'vila', x: 1, y: 21, dir: 'left' });
goTo(0, 21);
press('left');
check('com o inicial, o mato alto avisa que o modo Endless vem em breve', dialogText().includes('Endless'));
closeDialog();

// a saída sul abre o mapa da jornada (clicar nela anda até lá e sai)
goTo(17, 27);
check('clicar na saída sul anda até ela e abre o mapa da jornada', !registry.get('screen-campaign').classes.has('hidden'));
const mapNodes = () => registry.get('lobby-map').children.filter((c) => c.classes.has('map-node'));
check('o lobby mostra o Town Map com uma marca por cidade (8 ginásios e a Liga)', mapNodes().length === 9,
      `${mapNodes().length} marcas`);
check('ao entrar, a próxima fase já vem escolhida no painel',
      game.menus.lobby.selected === 'gym_1_pewter' && mapNodes().filter((c) => c.classes.has('next')).length === 1);
const { STAGE_CITY } = await import('../src/data/regionMap.js');
const { STAGES } = await import('../src/data/stages.js');
check('no mapa, o rosto do treinador fica na fase atual (0.30)', game.menus.lobby.playerCity === STAGE_CITY.gym_1_pewter);
game.menus.lobby.selected = 'gym_2_cerulean';
game.menus.lobby.render();
check('...e acompanha a fase escolhida no mapa', game.menus.lobby.playerCity === STAGE_CITY.gym_2_cerulean);
game.menus.lobby.selected = 'gym_1_pewter';
game.menus.lobby.render();
{
  // o painel da fase (0.31): o salão do líder, a faixa com uma Poké Ball por Pokémon dele e o JOGAR;
  // as métricas só depois da primeira tentativa
  const panel = registry.get('lobby-panel').children;
  const strip = panel.find((c) => c.classes.has('panel-strip'));
  const balls = strip?.children[0]?.children.find((c) => c.classes.has('panel-balls'));
  check('o painel da fase mostra o salão do líder, a faixa dele e o JOGAR',
        panel.some((c) => c.classes.has('panel-banner') && String(c.style.backgroundImage).includes('gym-banners/pewter_gym.png'))
        && balls?.children.length === STAGES.gym_1_pewter.bossTeam.length
        && panel.some((c) => c.classes.has('panel-actions')));
  check('...e esconde as métricas até a primeira tentativa', !panel.some((c) => c.classes.has('panel-metrics')));
  // as fraquezas do time do líder no banner (0.32): os 3 tipos que mais batem nele
  const banner = panel.find((c) => c.classes.has('panel-banner'));
  const weak = banner?.children.find((c) => c.classes.has('panel-weak'));
  check('o banner mostra no "Fraco" os 3 tipos que mais batem no Brock, com a lista inteira na dica',
        weak?.children[0]?.innerHTML === 'Fraco' && weak.children.filter((c) => c.classes.has('type-tag')).length === 3
        && String(weak.title).includes('Resiste a'));
}
registry.get('btn-village').click();
check('"Voltar para a Vila" fecha o mapa e volta para onde o jogador estava',
      hubVisible() && hub.mapId === 'vila' && hub.player.x === 17 && hub.player.y === 26);
check('depois de aberto uma vez, o aviso do botão do mapa some', !registry.get('hub-btn-map').classes.has('alert'));

// ---- partida ----
game.startStage('gym_1_pewter');
check('a fase começa', !!game.run && !registry.get('stage-wrapper').classes.has('hidden'));
check('a partida usa o treinador escolhido', game.run.trainerLook === 'leaf');
check('barra lateral some durante a partida', registry.get('side-rail').classes.has('hidden'));

const DT = 1 / 60;
const frame = (move = { x: 1, y: 0 }) => {
  game.run.update(DT, move);
  game._handleRunState();
  game.renderer.render(game.run);
  game.hud.update(game.run);
};

for (let i = 0; i < 60 * 30 && game.run; i++) {
  frame();
  // o teste é da interface, não de sobrevivência: desde a 0.8 o inicial sozinho
  // e parado na borda pode cair antes dos 30s
  for (const member of game.run?.team.members ?? []) if (!member.fainted) member.hp = Math.max(member.hp, 40);
  if (game.run?.state === 'levelup' && game.levelUpOpen) {
    // escolhe a primeira opção oferecida, como o jogador faria
    const choices = game.run.progression.rollChoices(game.run.levelUpMember);
    game.pickUpgrade(choices[0].id);
  }
  if (game.run?.state === 'evolution' && game.evolutionOpen) game.closeEvolution();
  if (game.run?.state === 'capture' && game.captureOpen) {
    const options = game.run.captureSystem.rollChoices();
    if (options.length) game.pickCapture(options[0].id);
    else game.resolveCapture();
  }
}

check('HUD desenha um card por Pokémon ativo',
      registry.get('active-slots').children.length === CONFIG.team.activeSlots,
      `${registry.get('active-slots').children.length} cards`);
check('HUD desenha os slots da reserva',
      registry.get('reserve-slots').children.length === CONFIG.team.maxSize - CONFIG.team.activeSlots,
      `${registry.get('reserve-slots').children.length} slots`);
check('30s de partida sem erro de runtime', game.run.time > 25, `t=${game.run.time.toFixed(0)}s`);

// ---- overlays ----
game.togglePause();
check('pausa abre', !registry.get('pause-overlay').classes.has('hidden') && game.run.state === 'paused');
game.togglePause();
check('pausa fecha', registry.get('pause-overlay').classes.has('hidden') && game.run.state === 'running');

// tela de captura com a equipe cheia (fluxo de substituição)
while (!game.run.team.isFull) game.run.team.add('pidgey') ?? game.run.team.add('poliwag');
game.run.pendingBall = true;
game.run.state = 'capture';
game.openCapture();
check('com a equipe cheia, a Poké Ball avisa que nada se perde (o PC guarda)',
      registry.get('capture-note').classes.has('strong') && !registry.get('capture-note').classes.has('hidden')
      && registry.get('capture-note').innerHTML.includes('Nenhum Pokémon se perde'));
const options = game.run.captureSystem.rollChoices();
game.pickCapture(options[0]?.id ?? 'pikachu');
check('equipe cheia: escolher onde o novo fica, sem perder ninguém',
      registry.get('capture-subtitle').textContent.includes('ninguém se perde')
      && registry.get('capture-skip').textContent === 'Desistir da captura',
      registry.get('capture-subtitle').textContent);
const replaceCards = registry.get('capture-choices').children;
check('o primeiro card guarda o novo no PC; os outros dizem que vão para o PC',
      replaceCards[0]?.classes.has('to-pc') && replaceCards.length === CONFIG.team.maxSize + 1);
game.resolveCapture();

// shiny (0.13.1): raro, só na captura; o card brilha e ele entra assim
const shinyChance = CONFIG.capture.shinyChance;
CONFIG.capture.shinyChance = 1;
game.run.pendingBall = true;
game.run.state = 'capture';
game.openCapture();
const shinyCards = registry.get('capture-choices').children;
check('opção shiny: o card brilha e diz "Shiny"', shinyCards.length > 0 && shinyCards.every((c) => c.classes.has('shiny')));
const shinyCaughtBefore = game.profile.stats.shinyCaught ?? 0;
const shinyPick = game.run.captureSystem.rollChoices()[0];
game.pickCapture(shinyPick.id, true);
registry.get('capture-choices').children[0].onclick?.();   // equipe cheia: guarda o novo no PC
check('a captura shiny conta para a conquista e marca a Pokédex',
      game.profile.stats.shinyCaught === shinyCaughtBefore + 1 && game.profile.pokedex.shiny.includes(shinyPick.dex)
      && game.run.pc.at(-1)?.shiny === true);
CONFIG.capture.shinyChance = shinyChance;
game.resolveCapture();

// níveis acumulados do banco (botão ▲)
const benched = game.run.team.reserve[0];
if (benched) {
  benched.pendingLevels = 2;
  game.openLevelUpFor(benched);
  check('botão ▲ abre a melhoria de um Pokémon da reserva',
        game.run.state === 'levelup' && game.run.levelUpMember === benched);
  const choices = game.run.progression.rollChoices(benched);
  game.pickUpgrade(choices[0].id);
  check('ainda restando 1 nível, a tela continua aberta', benched.pendingLevels === 1);
  game.pickUpgrade(game.run.progression.rollChoices(benched)[0].id);
  check('gastando o último nível, a partida volta', game.run.state === 'running' && benched.pendingLevels === 0);
}

// ---- apresentação do líder ----
game.run.pendingIntro = game.run.stage.leader;
game.run._checkState();
game._handleRunState();
check('o líder chega com a apresentação (retrato e fala)',
      game.run.state === 'intro' && !registry.get('leader-overlay').classes.has('hidden') &&
      registry.get('leader-quote').textContent === game.run.stage.leader.quote);
check('a apresentação mostra a contagem para a luta começar sozinha',
      registry.get('leader-countdown').textContent === `A luta começa em ${CONFIG.leaderIntroSeconds}s`);
game.closeLeaderIntro();
check('"Lutar!" fecha a apresentação e a partida volta',
      game.run.state === 'running' && registry.get('leader-overlay').classes.has('hidden'));

// ---- fim de partida ----
// a derrota guarda o progresso da tentativa (0.17): o nível que ela ganhou fica
game.run.team.members[0].level = 9;
game.run.team.members[0].upgrades = { ...game.run.team.members[0].upgrades, keep_test: 1 };
for (const member of game.run.team.members) member.fainted = true;
game.run.state = 'defeat';
game._handleRunState();
check('derrota mostra o resultado', !registry.get('result-overlay').classes.has('hidden'));
check('derrota não avança a jornada', game.campaign.clearedStages.length === 0);
check('derrota guarda o que a equipe ganhou (níveis e melhorias)',
      game.campaign.journey?.team?.members[0]?.level === 9 && game.campaign.journey.team.members[0].upgrades.keep_test === 1,
      `nível ${game.campaign.journey?.team?.members[0]?.level}`);
check('derrota oferece o Centro Pokémon, e não mais recomeçar a jornada (foi para as Opções, 0.33)',
      !registry.get('result-defeat').classes.has('hidden') && registry.get('result-victory').classes.has('hidden') &&
      !registry.get('btn-result-restart') && !registry.get('result-confirm'));
registry.get('btn-result-center').click();
check('o Centro Pokémon mostra a equipe curada',
      game.centerOpen && !registry.get('center-overlay').classes.has('hidden') &&
      registry.get('result-overlay').classes.has('hidden') && registry.get('center-team').children.length >= 1);
registry.get('btn-center-go').click();
check('do Centro Pokémon a fase recomeça com a equipe curada',
      !game.centerOpen && registry.get('center-overlay').classes.has('hidden') &&
      game.run?.stage.id === 'gym_1_pewter' && game.run.time === 0 &&
      game.run.team.members.every((m) => !m.fainted && m.hp > 0) && game.run.team.members[0].level === 9);

game.run.team.members[0].level = 11;
game.quitToMenu();
check('sair da partida leva à vila, na frente de casa',
      hubVisible() && hub.mapId === 'vila' && hub.player.x === 6 && hub.player.y === 17);
check('abandonar no meio também guarda o progresso', game.campaign.journey.team.members[0].level === 11);

// ---- vitória e save ----
game.startStage('gym_1_pewter');
game.run.state = 'victory';
game._handleRunState();
check('vitória conclui a fase', game.campaign.clearedStages.includes('gym_1_pewter'));
check('vitória mostra Continuar jornada (e não as saídas da derrota)',
      !registry.get('result-victory').classes.has('hidden') && registry.get('result-defeat').classes.has('hidden'));
check('vitória registra a insígnia do líder',
      game.campaign.badges.includes('Insígnia Pedra') && game.profile.stats.badges === 1);
check('vitória rende Shards', game.profile.shards > 0, `${game.profile.shards} Shards`);

// ---- Shards (0.22): a fase paga uma vez; chefes pagam na hora ----
{
  const { killEnemy } = await import('../src/systems/combat.js');
  const shards = () => game.profile.shards;
  const before = shards();
  const boss = game.run.spawner.spawnAt(game.run.stage.bossTeam[0], game.run.player.x + 200, game.run.player.y);
  killEnemy(game.run, boss);
  check('cada Pokémon do líder derrotado dá 10 Shards', shards() === before + CONFIG.shards.leaderPokemon, `${shards() - before}`);
  const eliteId = game.run.stage.elites[0].id;
  const elite = game.run.spawner.spawnAt(eliteId, game.run.player.x - 200, game.run.player.y);
  killEnemy(game.run, elite);
  check('cada chefe simples (elite) dá 5 Shards', shards() === before + CONFIG.shards.leaderPokemon + CONFIG.shards.elite);
}

// ---- Modo Livre (0.20): da vitória, a fase sem fim; o botão do canto volta ao Centro ----
check('a vitória oferece o Modo Livre', !registry.get('btn-result-endless').classes.has('hidden'));
game.run.team.members[0].fainted = true;
registry.get('btn-result-endless').click();
check('o Modo Livre continua a fase, com a equipe curada e o botão do Centro no canto',
      game.run?.endless && game.run.state === 'running' && registry.get('result-overlay').classes.has('hidden') &&
      game.run.team.members.every((m) => !m.fainted) && (game.hud.update(game.run), !registry.get('btn-endless-center').classes.has('hidden')));
game.run.team.members[0].level = 17;
registry.get('btn-endless-center').click();
check('"Voltar para o Centro Pokémon" guarda o que a equipe ganhou e volta para a vila',
      !game.run && hubVisible() &&
      game.campaign.journey.team.members[0].level === 17 && game.campaign.clearedStages.includes('gym_1_pewter'));

// conquistas: concluídas ficam para coletar, não entram sozinhas
const claimable = game.tracker.claimableAchievements;
check('conquistas concluídas ficam disponíveis para coletar', claimable.length > 0,
      `${claimable.length} para coletar`);
if (claimable.length) {
  const achievement = claimable[0];
  const tierBefore = game.tracker.tierState(achievement).claimed;
  const before = game.profile.shards;
  const gained = game.claimAchievement(achievement.id);
  check('coletar a conquista credita os Shards', gained > 0 && game.profile.shards === before + gained,
        `+${gained} Shards`);
  // conquistas em níveis (0.11): coletar sobe um degrau, e o próximo pede um objetivo maior
  const after = game.tracker.tierState(achievement);
  check('coletar sobe exatamente um degrau, com objetivo maior',
        after.claimed === tierBefore + 1 && (after.complete || after.next.goal > achievement.tiers[tierBefore].goal),
        `${achievement.name}: degrau ${after.claimed}, próximo objetivo ${after.next?.goal ?? '—'}`);
  // sem alcançar o próximo objetivo, não há o que coletar
  const value = game.profile.stats[achievement.stat];
  game.profile.stats[achievement.stat] = after.next ? after.next.goal - 1 : value;
  check('o mesmo degrau não pode ser coletado duas vezes', game.claimAchievement(achievement.id) === 0);
  game.profile.stats[achievement.stat] = value;
}

// a loja do treinador saiu (0.21): nem a janela nem os botões existem, e um save
// antigo com melhorias compradas carrega sem elas
check('a aba de melhorias do treinador não existe mais',
      typeof game.trainerShop === 'undefined' && typeof game.buyTrainerUpgrade === 'undefined'
      && !readFileSync(join(root, 'index.html'), 'utf8').includes('modal-trainer'));
const oldSave = normalizeProfile({ trainerUpgrades: { meta_damage: 3 }, achievements: { tiers: { shop: 2, hunter: 1 } } });
check('save antigo: as melhorias compradas e a conquista da loja somem; as outras ficam',
      !('trainerUpgrades' in oldSave) && !oldSave.achievements.tiers.shop && oldSave.achievements.tiers.hunter === 1);
check('vitória guarda a equipe da jornada', !!game.campaign.journey?.team?.members?.length);

// ---- o PC (0.12): a tela do FireRed, pegar e soltar ----
const pcJourney = game.campaign.journey;
// a derrota guarda as capturas (0.17): a equipe pode chegar cheia; o teste precisa de uma vaga
pcJourney.team.members = pcJourney.team.members.slice(0, 3);
pcJourney.team.active = pcJourney.team.members.map((m) => m.uid);
pcJourney.pc = [{ ...pcJourney.team.members[0], uid: 'pc-test-1', pokemonId: 'psyduck', level: 9, slot: 0 }];
game.menus.showModal('modal-pc');
const pcs = game.menus.pcScreen;
const pcSlots = () => registry.get('pc-screen').children.filter((c) => c.classes.has('pc-slot'));
check('o PC abre com as 30 casas da caixa e as 6 vagas da equipe',
      pcs.isOpen && !registry.get('modal-pc').classes.has('hidden') && pcSlots().length === 36, `${pcSlots().length} lugares`);
const teamSize = pcJourney.team.members.length;
pcs.act({ area: 'box', slot: 0 });
check('clicar num Pokémon do PC pega ele', pcs.held?.area === 'box' && pcs.held.slot === 0);
pcs.act({ area: 'team', index: teamSize });
check('soltar na vaga vazia da equipe leva ele para o fim da equipe',
      !pcs.held && pcJourney.team.members.at(-1).uid === 'pc-test-1' && pcJourney.pc.length === 0);
pcs.act({ area: 'team', index: teamSize });
pcs.act({ area: 'box', slot: 7 });
check('e de volta para uma casa do PC', pcJourney.pc[0]?.uid === 'pc-test-1' && pcJourney.pc[0].slot === 7
      && pcJourney.team.members.length === teamSize);
pcs.act({ area: 'team', index: 0 });
pcs.act({ area: 'box', slot: 8 });
check('o último da equipe não vai para o PC', teamSize > 1 || (pcJourney.team.members.length === 1 && !!pcs.message));
pcs.held = null;
game.menus.closeModal();
check('fechar o PC desliga o teclado dele', !pcs.isOpen && registry.get('modal-pc').classes.has('hidden'));

game.quitToMenu();
game.openCampaign();
check('Fase 2 desbloqueia após a Fase 1',
      mapNodes().filter((c) => c.classes.has('done')).length === 1 && game.menus.lobby.selected === 'gym_2_cerulean');
const pewterStats = game.campaign.stageStats.gym_1_pewter;
check('a fase guarda as métricas do estojo (tentativas, vitórias, primeira vitória)',
      pewterStats?.wins === 1 && pewterStats.attempts >= 2 && !!pewterStats.firstWin?.team?.length,
      JSON.stringify({ wins: pewterStats?.wins, attempts: pewterStats?.attempts }));
game.menus.showModal('modal-badges', { stageId: 'gym_1_pewter' });
check('o Estojo de Insígnias abre com o cartão, as 8 casas e a Liga',
      !registry.get('modal-badges').classes.has('hidden')
      && registry.get('trainer-card').children.filter((c) => c.classes.has('card-slot')).length === 8
      && registry.get('league-row').children.filter((c) => c.classes.has('league-chip')).length === 5);
game.menus.closeModal();

// ---- Campeão e Hall da Fama ----
game.region.campaign.slice(0, -1).forEach((e) => {
  if (!game.campaign.clearedStages.includes(e.stage)) game.campaign.clearedStages.push(e.stage);
});
game.startStage('champion');
game.run.state = 'victory';
game._handleRunState();
check('vencer o Campeão abre o Hall da Fama com a equipe',
      !registry.get('hall-overlay').classes.has('hidden') && game.profile.hallOfFame.length === 1 &&
      registry.get('hall-team').children.length === game.profile.hallOfFame[0].team.length,
      `${registry.get('hall-team').children.length} Pokémon`);
check('o Hall da Fama guarda o nome do jogador', game.profile.hallOfFame[0].trainerName === 'Fellipe');
registry.get('hall-close').click();
check('fechar o Hall da Fama mostra a tela de vitória (com o Modo Livre, 0.27)',
      registry.get('hall-overlay').classes.has('hidden') && !registry.get('result-overlay').classes.has('hidden'));
registry.get('btn-result-menu').click();
check('e de lá "Continuar Jornada" volta para a vila', hubVisible());
game.openCampaign();
check('o mapa mostra o botão do Hall da Fama', !registry.get('btn-hall').classes.has('hidden'));

const save = game.buildSaveData();
check('save é montado a partir do estado atual',
      save.signature === 'pokemon-bullet-heaven' && !!save.profile.regions.kanto.journey);

// save de antes da escolha de treinador: o Continuar pergunta uma vez
game.profile.trainer = null;
game.pendingRun = null;
game.continueGame();
check('save sem treinador pede a escolha ao continuar', !registry.get('screen-trainer').classes.has('hidden'));
game.chooseTrainer('red');
check('...e depois pede o nome', !registry.get('screen-name').classes.has('hidden'));
game.chooseName('');
check('depois da escolha, o Continuar segue para a jornada (na vila); sem nome, fica o do modelo',
      game.profile.trainer === 'red' && hubVisible() && game.playerName === 'Red');

// ---- o Poké Mart (0.23) ----
{
  const journey = game.campaign.journey;
  journey.pc = [...(journey.pc ?? []), { uid: 'mart-eevee', pokemonId: 'eevee', level: 30, xp: 0, hp: 50, abilities: ['quick_attack'], upgrades: {} }];
  game.profile.shards = 0;
  game.menus.showModal('modal-mart');
  check('o Poké Mart abre com os itens', !registry.get('modal-mart').classes.has('hidden') && registry.get('mart-list').children.length === 9);
  check('sem Shards, não compra', game.buyMartItem('revive') === false && (game.profile.bag.revive ?? 0) === 0);
  game.profile.shards = 10000;
  check('comprar o Reviver vai para a mochila e desconta 600', game.buyMartItem('revive') && game.profile.bag.revive === 1 && game.profile.shards === 9400);
  game.buyMartItem('reroll');
  const targets = game.martTargets('thunder_stone');
  check('a Pedra do Trovão mostra quem pode evoluir (a Eevee do PC vira Jolteon)', targets.some((t) => t.member.uid === 'mart-eevee' && t.result === 'jolteon'));
  check('usar a pedra evolui na hora e desconta 2.500',
        game.buyMartItem('thunder_stone', 'mart-eevee') && journey.pc.find((m) => m.uid === 'mart-eevee').pokemonId === 'jolteon' && game.profile.shards === 9100 - 2500);
  check('a pedra sem ninguém que evolua com ela não vende', game.buyMartItem('leaf_stone', 'mart-eevee') === false);

  // a TM Dive (0.34): só aparece com um Pokémon de Água que tenha o Golpe Desperto
  check('sem Pokémon de Água com Golpe Desperto, a TM Dive não aparece na loja',
        game.martTargets('tm_dive').length === 0 && !registry.get('mart-list').children.some((c) => c.innerHTML.includes('TM Dive')));
  journey.pc.push({ uid: 'mart-kabuto', pokemonId: 'kabuto', level: 40, xp: 0, hp: 80, abilities: ['rock_throw', 'surf'], upgrades: {} });
  journey.pc.push({ uid: 'mart-squirtle', pokemonId: 'squirtle', level: 20, xp: 0, hp: 40, abilities: ['water_gun'], upgrades: {} });
  const diveTargets = game.martTargets('tm_dive');
  check('com um Pokémon de Água (mesmo de tipo secundário) com Golpe Desperto, ela aparece; sem o Golpe Desperto, não',
        diveTargets.length === 1 && diveTargets[0].member.uid === 'mart-kabuto' && diveTargets[0].label.includes('Surf'));
  game.menus.buildMart();
  check('...e a loja mostra a TM Dive', registry.get('mart-list').children.some((c) => c.innerHTML.includes('TM Dive')));
  const before = game.profile.shards;
  check('a TM Dive troca o Golpe Desperto por Dive e mantém o golpe principal',
        game.buyMartItem('tm_dive', 'mart-kabuto') && journey.pc.find((m) => m.uid === 'mart-kabuto').abilities.join() === 'rock_throw,dive'
        && game.profile.shards === before - 1500);
  check('quem já sabe Dive não aparece mais para a TM', game.martTargets('tm_dive').length === 0);
  journey.pc = journey.pc.filter((m) => m.uid !== 'mart-kabuto' && m.uid !== 'mart-squirtle');
  game.menus.closeModal();

  // o Reviver na fase e o Novo Sorteio na Poké Ball
  game.startStage('gym_1_pewter');
  game.run.team.add('pidgey', 5);
  const down = game.run.team.members[1];
  down.fainted = true; down.hp = 0; game.run.team.handleFaint(down);
  check('o Reviver traz de volta quem desmaiou, com metade da vida', game.useRevive(down.uid) && !down.fainted && down.hp > 0
        && game.profile.bag.revive === 0);
  game.run.pendingBall = true;
  game.run.state = 'capture';
  game._handleRunState();
  check('na Poké Ball aparece o Novo Sorteio da mochila', !registry.get('capture-reroll').classes.has('hidden'));
  check('o Novo Sorteio sorteia de novo e gasta da mochila', game.rerollCapture() && game.profile.bag.reroll === 0);
  game.resolveCapture();
  game.quitToMenu();
}

const DIVE_LAST = (await import('../src/data/dive.js')).DIVE.levels.length - 1;   // o último nível (0.37.3: o 5)
// ---- a descida do Dive (0.36): a lagoa abre a descida; perder as bolhas leva à enfermeira; o fim volta à lagoa ----
{
  const member = game.campaign.journey.team.members[0];
  const saved = [...member.abilities];
  member.abilities = [saved[0], 'dive'];
  game.openHub('home');
  hub.say('lagoa');
  for (let i = 0; i < 10 && !hub._onAsk(); i++) hub.confirm();
  check('com Dive na equipe, a lagoa pergunta "Quer usar Dive?"', hub._onAsk() && dialogText().includes('Dive'));
  hub.confirm();
  check('o SIM escurece a vila antes da descida', !!hub.fade && !game.diveOpen);
  for (let i = 0; i < 120 && !game.diveOpen; i++) hub.update(1 / 60);
  const diveVisible = () => !registry.get('screen-dive').classes.has('hidden');
  check('o SIM abre a descida, no Nível 1', diveVisible() && game.diveOpen && !game.hubOpen && game.dive.mode === 'play' && game.dive.level === 0);
  game._frame(1000); game._frame(1016);
  check('a barra mostra o nível e a profundidade', registry.get('dive-depth').textContent === 'NÍVEL 1 · 10 m');
  game.handleAction('pause');
  game._frame(1032);
  check('ESC pausa a descida', game.dive.paused && !registry.get('dive-pause').classes.has('hidden'));
  game.handleAction('pause');
  // parado no meio, as hordas o pegam: acorda no Centro, na frente da enfermeira
  game.dive.p.c = 4; game.dive.p.r = 3;
  for (let i = 0; i < 60 * 120 && game.diveOpen; i++) game.dive.update(1 / 60, null);
  check('perdeu as 3 bolhas: acorda no Centro, e a enfermeira conta do pescador',
        !game.diveOpen && hubVisible() && hub.mapId === 'centro' && hub.dialog?.name === 'Enfermeira' && dialogText().includes('pescador'),
        `${hub.mapId} ${hub.player.x},${hub.player.y}`);
  check('...em pé, num tile do Centro', hub.walkable(hub.player.x, hub.player.y));
  closeDialog();
  check('o resgate fica guardado na jornada', game.campaign.dive?.rescues === 1);
  hub.say('pescador');
  check('o pescador comenta o resgate (uma vez)', dialogText().includes('peixão'));
  closeDialog();
  hub.say('pescador');
  check('...e depois volta à fala de sempre', !dialogText().includes('peixão'));
  closeDialog();
  // a descida inteira: depois do último nível (o 5), a entrada da Caverna Marinha e o salão
  game.openHub('home');
  game.openDive();
  game.dive.start(DIVE_LAST);
  game.dive.levelDone();
  for (let i = 0; i < 60 * 60 && game.diveOpen && !game.hall.active; i++) {
    if (game.dive.dialog) { game.dive.dialog.shown = 999; game.dive.confirm(); }
    game.dive.update(1 / 60, null);
  }
  check('passou o último nível: emerge no salão do Kyogre (a descida guarda o recorde)', game.diveOpen && game.hall.active
        && !registry.get('hall-stage').classes.has('hidden') && registry.get('dive-console').classes.has('hidden')
        && game.campaign.dive.best === 5 && game.campaign.dive.reachedCave === 1);
  check('o salão: ele emerge no warp do Emerald e só anda por onde dá para pisar',
        game.hall.p.x === 20 && game.hall.p.y === 4 && game.hall.constructor.walkable(20, 4) && !game.hall.constructor.walkable(9, 22));
  // a cena até o card (pulando a caminhada, como o botão de teste)
  const playHall = () => {
    game.hall.skipWalk();
    for (let i = 0; i < 60 * 30 && game.hall.mode !== 'card'; i++) {
      if (game.hall.dialog) { game.hall.dialog.shown = 999; game.hall.confirm(); }
      game.hall.update(1 / 60);
    }
  };
  playHall();
  check('o encontro: o Kyogre desperta, avança três tiles e vem a transição dele', game.hall.k.awake && game.hall.k.y === 25 && !!game.hall.trans);
  check('...e abre o card da fase: Caverna Marinha, com Jogar e Voltar para a Vila',
        !registry.get('hall-card').classes.has('hidden') && registry.get('hall-card').children.some((c) => c.children?.some((d) => d.innerHTML === 'Caverna Marinha')));
  registry.get('hall-card').children.at(-1).children[1].onclick();
  check('Voltar para a Vila: sai pela lagoa', !game.diveOpen && hubVisible() && hub.mapId === 'vila' && hub.player.x === 30 && hub.player.y === 11);

  // a luta: Jogar no card
  game.openDive(); game.dive.start(DIVE_LAST); game.dive.levelDone();
  for (let i = 0; i < 60 * 60 && !game.hall.active; i++) { if (game.dive.dialog) { game.dive.dialog.shown = 999; game.dive.confirm(); } game.dive.update(1 / 60, null); }
  playHall();
  registry.get('hall-card').children.at(-1).children[0].onclick();
  const run = game.run;
  run.damageCompanion = () => {};   // a equipe do teste é fraca: aqui só importa a captura
  check('Jogar: a fase do salão, na chuva, com a luta do Kyogre', run?.stage.id === 'kyogre' && run.stage.weather === 'rain' && !!run.fight
        && run.world.scene === 'kyogre_hall');
  run.time = run.stage.duration;
  for (let i = 0; i < 60 * 3; i++) { run.update(1 / 60, { x: 0, y: 0 }); if (run.state === 'intro') { game.closeLeaderIntro?.(); run.pendingIntro = null; run.state = 'running'; } }
  const boss = run.boss;
  check('aos 0:45, o Kyogre sai do lago (o chefe da fase)', boss?.data.id === 'kyogre_boss' && run.fight.state === 'fight' && boss.rise === 1);
  // no vermelho: o piso de vida, a exaustão e a Dive Ball
  const { damageEnemy } = await import('../src/systems/combat.js');
  boss.hp = boss.maxHp * 0.2;
  damageEnemy(run, boss, boss.maxHp);
  check('com Dive Ball sobrando, a vida não passa de 15%: ele fica exausto e a bola cai no campo',
        Math.abs(boss.hp / boss.maxHp - 0.15) < 1e-9 && !boss.dead && run.fight.state === 'exhausted' && !!run.fight.ball);
  run.player.x = run.fight.ball.x; run.player.y = run.fight.ball.y;
  run.fight.rng = () => 0.99;   // a primeira falha
  run.update(1 / 60, { x: 0, y: 0 });
  check('passar por cima joga a bola: tudo para enquanto ela balança', run.state === 'legendary' && !!run.fight.throwing);
  for (let i = 0; i < 60 * 6 && run.state === 'legendary'; i++) run.update(1 / 60, { x: 0, y: 0 });
  check('falhou: ele escapa, volta só a 25% e gasta uma das 3 Dive Balls', run.fight.balls === 2 && Math.abs(boss.hp / boss.maxHp - 0.25) < 1e-9
        && run.fight.state === 'fight');
  damageEnemy(run, boss, boss.maxHp);
  run.fight.t = run.fight.cfg.exhaust;
  run.update(1 / 60, { x: 0, y: 0 });
  check('sem pegar a bola a tempo: ele se recupera, mas a bola não conta como gasta', run.fight.balls === 2 && run.fight.state === 'fight');
  damageEnemy(run, boss, boss.maxHp);
  run.player.x = run.fight.ball.x; run.player.y = run.fight.ball.y;
  run.fight.rng = () => 0.01;   // os 10%
  run.update(1 / 60, { x: 0, y: 0 });
  for (let i = 0; i < 60 * 8 && run.state === 'legendary'; i++) run.update(1 / 60, { x: 0, y: 0 });
  run.update(1 / 60, { x: 0, y: 0 });
  game._handleRunState();
  check('capturou: a tela de captura do Kyogre, sem Ignorar', game.captureOpen && registry.get('capture-skip').classes.has('hidden'));
  game.pickCapture('kyogre');
  const where = game.run.team.has('kyogre') || game.run.pc.some((m) => m.pokemonId === 'kyogre');
  check('...o Kyogre entra (na equipe ou no PC), revela o "???" e fica fora das 151',
        where && game.profile.pokedex.secret.includes('kyogre') && !game.profile.pokedex.caught.includes(382) && game.campaign.dive.captured);
  check('a maré final: a vitória espera os 30 s', run.fight.final && run.fight.holding && run.state === 'running');
  run.fight.final.t = 0.01;
  for (let i = 0; i < 10; i++) run.update(1 / 60, { x: 0, y: 0 });
  game._handleRunState();
  check('a maré baixou: a vitória, sem o Modo Livre', run.state === 'victory' && registry.get('btn-result-endless').classes.has('hidden'));
  game.quitToMenu();
  check('a volta é pela lagoa, e a cena do Maxie começa', hubVisible() && hub.mapId === 'vila' && hub.player.x === 30 && !!hub.scene
        && game.campaign.dive.sceneSeen);
  for (let i = 0; i < 60 * 60 && hub.scene; i++) { if (hub.dialog) { hub.dialog.shown = 999; hub.confirm(); } hub.update(1 / 60); }
  check('a cena acaba e devolve o controle (uma vez por jornada)', !hub.scene && !hub.dialog);
  hub.say('pescador');
  check('o pescador depois da captura', dialogText().includes('minhoca'));
  closeDialog();

  // depois da captura, o salão vazio: o card do Endless aquático (sem XP)
  game.openDive(); game.dive.start(DIVE_LAST); game.dive.levelDone();
  for (let i = 0; i < 60 * 60 && !game.hall.active; i++) { if (game.dive.dialog) { game.dive.dialog.shown = 999; game.dive.confirm(); } game.dive.update(1 / 60, null); }
  playHall();
  check('com o Kyogre na jornada, o salão está vazio e o card é o da maré sem fim', game.hall.k.hidden
        && registry.get('hall-card').children.some((c) => c.children?.some((d) => d.innerHTML === 'A maré sem fim')));
  registry.get('hall-card').children.at(-1).children[0].onclick();
  const endless = game.run;
  const before = endless.team.members.map((m) => m.xp).join();
  endless.progression.addXp(5000);
  check('o Endless aquático já começa sem fim e não dá XP', endless.stage.id === 'kyogre_endless' && endless.endless && endless.team.members.map((m) => m.xp).join() === before);
  game.quitToMenu();
  check('sair do Endless também volta pela lagoa', hubVisible() && hub.mapId === 'vila' && hub.player.x === 30 && !hub.scene);

  // caiu na luta: acorda no Centro (a luta não recomeça)
  game.campaign.dive.captured = false; game.campaign.dive.sceneSeen = false;
  game.startStage('kyogre');
  game.run.team.members.forEach((m) => { m.fainted = true; m.hp = 0; });
  game.run.update(1 / 60, { x: 0, y: 0 });
  game._handleRunState();
  check('caiu na luta do Kyogre: acorda no Centro, com a enfermeira', !game.run && hubVisible() && hub.mapId === 'centro' && hub.dialog?.name === 'Enfermeira');
  closeDialog();
  member.abilities = saved;
}

// ---- 0.25: a partida anda com toques espaçados (aba escondida), a luta começa sozinha e os Shards no canto ----
{
  game.startStage('gym_1_pewter');
  game.run.spawner.update = () => {};
  game.lastTime = 1000;
  game._frame(1000);
  const t0 = game.run.time;
  game._frame(4000);                       // um toque só, 3 s depois (o relógio da aba escondida)
  check('um toque espaçado avança a partida o tempo todo que passou, em passos pequenos',
        Math.abs(game.run.time - t0 - 3) < 0.01, `${(game.run.time - t0).toFixed(2)} s`);
  game.hud.update(game.run);
  check('os Shards aparecem no canto da partida',
        registry.get('shard-count').textContent === (game.profile.shards ?? 0).toLocaleString('pt-BR'), registry.get('shard-count').textContent);
  // a apresentação do líder: sem clicar em Lutar, a luta começa sozinha
  game.run.pendingIntro = game.run.stage.leader;
  game.run.state = 'intro';
  game._handleRunState();
  game._frame(4000 + 3000);
  check('3 s depois a apresentação continua, contando', game.introOpen && registry.get('leader-countdown').textContent === 'A luta começa em 4s',
        registry.get('leader-countdown').textContent);
  game._frame(4000 + 3000 + 4500);
  check(`sem clicar em Lutar, a luta começa sozinha depois de ${CONFIG.leaderIntroSeconds} s`,
        !game.introOpen && game.run.state === 'running' && registry.get('leader-overlay').classes.has('hidden'));
  game.quitToMenu();
}

// ---- o Campeão também tem Modo Livre (0.27): depois do Hall da Fama, a tela de vitória ----
{
  const keep = [...game.campaign.clearedStages];
  game.campaign.clearedStages.push(...game.region.campaign.filter((e) => e.stage && e.stage !== 'champion').map((e) => e.stage));
  game.startStage('champion');
  game.run.state = 'victory';
  game._handleRunState();
  check('vencer o Campeão abre o Hall da Fama', game.hallOpen && !registry.get('hall-overlay').classes.has('hidden'));
  registry.get('hall-close').click();
  check('...e depois a tela de vitória, com o Modo Livre',
        !game.hallOpen && !registry.get('result-overlay').classes.has('hidden') && !registry.get('btn-result-endless').classes.has('hidden'));
  registry.get('btn-result-endless').click();
  check('o Modo Livre do Campeão funciona', game.run?.endless && game.run.state === 'running' && game.run.stage.id === 'champion');
  game.quitToMenu();
  game.profile.hallOfFame.pop();   // o teste não deixa uma equipe campeã a mais
  game.campaign.clearedStages.splice(0, game.campaign.clearedStages.length, ...keep, 'champion');
}

// ---- continuar nunca volta ao meio da fase (0.24; desde a 0.29, vai à vila): a partida que ficou no meio entra na jornada ----
{
  game.startStage('gym_1_pewter');
  game.run.team.members[0].level = 44;
  game.run.pc.push({ ...game.run.team.members[0], uid: 'meio-pc', pokemonId: 'oddish', level: 12 });
  const snapshot = game.run.serialize();
  game.run = null;                        // o navegador fechou no meio da fase
  game.pendingRun = snapshot;
  game.menus.show('screen-title');
  game.continueGame();
  check('continuar com uma partida que ficou no meio vai para a vila, não para a fase',
        !game.run && hubVisible() && game.pendingRun === null);
  check('...e o que a equipe ganhou nela entrou na jornada (nível e PC)',
        game.campaign.journey.team.members[0].level === 44 && game.campaign.journey.pc.some((m) => m.uid === 'meio-pc'));
}

// ---- rejogar uma fase já vencida não paga a recompensa de novo (0.22) ----
{
  const before = game.profile.shards;
  game.startStage('gym_1_pewter');
  game.run.state = 'victory';
  game._handleRunState();
  check('rejogar e vencer uma fase já concluída não paga a recompensa da fase',
        game.campaign.clearedStages.includes('gym_1_pewter') && game.profile.shards === before, `${game.profile.shards - before}`);
  game.quitToMenu();
}

// ---- derrota → Centro Pokémon → mapa da jornada ----
game.startStage('gym_1_pewter');
for (const member of game.run.team.members) member.fainted = true;
game.run.state = 'defeat';
game._handleRunState();
registry.get('btn-result-center').click();
registry.get('btn-center-map').click();
check('do Centro Pokémon dá para voltar para a vila',
      !game.centerOpen && !game.run && registry.get('center-overlay').classes.has('hidden') && hubVisible());

// ---- reiniciar a jornada do zero: nas Opções, com confirmação (0.33; até a 0.32, na derrota) ----
const dexBefore = game.profile.pokedex.caught.length;
game.startStage('gym_1_pewter');
for (const member of game.run.team.members) member.fainted = true;
game.run.state = 'defeat';
game._handleRunState();
registry.get('btn-result-center').click();
registry.get('btn-center-map').click();   // da derrota para a vila, e de lá as Opções
const optionNode = (key) => registry.get('options-list').children.find((n) => n.dataset?.option === key);
const optionButton = (node) => node.children.find((c) => c.tagName === 'BUTTON');
const confirmAction = (key) => optionNode('restart-confirm').children.find((c) => c.classes.has('node-actions'))
  .children.find((b) => b.dataset.action === key);
game.menus.showModal('modal-options');
check('as Opções têm "Reiniciar a jornada", com uma jornada ativa', hubVisible() && !!optionNode('restart'));
optionButton(optionNode('restart')).click();
check('reiniciar pede confirmação antes, com o texto do Fellipe',
      !!optionNode('restart-confirm') && !optionNode('restart') && !!game.campaign.starter &&
      optionNode('restart-confirm').innerHTML.includes('Tem certeza que deseja reiniciar a jornada? Seu progresso começa do zero.'));
confirmAction('restart-no').click();
check('"Cancelar" desiste de reiniciar', !!optionNode('restart') && !optionNode('restart-confirm') && !!game.campaign.starter);
optionButton(optionNode('restart')).click();
game.menus.closeModal();
game.menus.showModal('modal-options');
check('fechar e abrir as Opções desfaz a pergunta', !!optionNode('restart') && !optionNode('restart-confirm'));
optionButton(optionNode('restart')).click();
confirmAction('restart-yes').click();
check('reiniciar apaga a jornada e mantém a Pokédex e o Hall da Fama',
      !game.run && !game.campaign.starter && !game.campaign.journey && game.campaign.badges.length === 0 &&
      game.profile.pokedex.caught.length === dexBefore && game.profile.hallOfFame.length === 1);
check('a jornada nova começa pela escolha de treinador, com as Opções fechadas',
      !registry.get('screen-trainer').classes.has('hidden') && registry.get('modal-options').classes.has('hidden'));

// ---- o inicial também pode vir shiny (0.13.2): sorteado na escolha e guardado na jornada ----
const starterChance = CONFIG.capture.shinyChance;
CONFIG.capture.shinyChance = 1;
game.chooseTrainer('red');
game.chooseName('Red');
game.chooseStarter('bulbasaur');
CONFIG.capture.shinyChance = starterChance;
game.openCampaign();
check('o inicial sorteado shiny fica marcado na jornada, na Pokédex e na equipe do lobby',
      game.campaign.starterShiny === true && game.profile.pokedex.shiny.includes(1)
      && registry.get('campaign-team').children.some((c) => c.children?.some((k) => k.classes?.has('team-shiny'))));
game.startStage('gym_1_pewter');
check('e entra shiny na primeira fase', game.run.team.members[0].shiny === true);
game.quitToMenu();

// ---- os espaços de jornada (0.19): mais de uma jornada, e voltar para a outra ----
{
  const dexBefore = game.profile.pokedex.caught.length;
  // a jornada atual (Bulbasaur) tem uma fase vencida e um Pokémon no nível 30
  game.campaign.clearedStages.push('gym_1_pewter');
  game.campaign.journey = { team: { members: [{ uid: 'j-a', pokemonId: 'bulbasaur', level: 30, xp: 0, hp: 50, abilities: ['vine_whip'], upgrades: {} }], active: ['j-a'] }, pc: [] };
  const first = game.profile.activeJourney;
  game.menus.show('screen-title');
  check('o título mostra "Jornada" com quantos espaços estão em uso',
        registry.get('continue-seal').textContent === `1 de ${CONFIG.save.maxJourneys}`, registry.get('continue-seal').textContent);
  game.menus.showJourneys();
  const cards = () => registry.get('journey-slots').children;
  check('a tela de jornadas mostra a jornada e os espaços livres',
        !registry.get('screen-journeys').classes.has('hidden') && cards().length === CONFIG.save.maxJourneys &&
        cards().filter((c) => c.classes.has('empty')).length === CONFIG.save.maxJourneys - 1);

  // uma jornada nova, com outro treinador e outro inicial, sem mexer na primeira
  game.newJourney();
  check('a jornada nova começa pela escolha de treinador, do zero',
        !registry.get('screen-trainer').classes.has('hidden') && !game.campaign.starter && game.profile.activeJourney !== first);
  game.chooseTrainer('leaf');
  game.chooseName('Ana');
  check('a jornada nova já conta assim que o treinador é escolhido (o inicial vem depois, na vila)',
        game.listJourneys().length === 2 && !game.campaign.starter && game.hub.mapId === 'casa_2f');
  game.chooseStarter('charmander');
  check('...com o inicial dela e as fases dela', game.campaign.starter === 'charmander' && game.campaign.clearedStages.length === 0
        && game.profile.trainer === 'leaf');
  check('a Pokédex é a mesma (é do jogador)', game.profile.pokedex.caught.length >= dexBefore);
  check('as duas aparecem na tela de jornadas', game.listJourneys().length === 2);

  // voltar para a primeira: tudo dela como estava
  game.openJourney(first);
  check('voltar para a outra jornada traz tudo dela de volta',
        game.campaign.starter === 'bulbasaur' && game.campaign.clearedStages.includes('gym_1_pewter') &&
        game.campaign.journey.team.members[0].level === 30 && game.profile.trainer === 'red' &&
        hubVisible() && game.hub.mapId === 'vila');
  const second = game.listJourneys().find((j) => !j.active);
  check('e a segunda continua guardada, com o nome dela', second?.progress.starter === 'charmander' && second.trainer === 'leaf'
        && second.trainerName === 'Ana');

  // o save leva as duas, e carregar um save de antes da 0.19 cria o espaço 1
  const reloaded = normalizeProfile(JSON.parse(JSON.stringify(game.profile)));
  check('o save guarda os espaços de jornada', reloaded.journeys.length === 2 && reloaded.activeJourney === first
        && reloaded.journeys.find((j) => j.id === second.id)?.data?.regions?.kanto?.starter === 'charmander');
  const legacy = normalizeProfile({ trainer: 'red', regions: { kanto: { starter: 'squirtle', clearedStages: ['gym_1_pewter'], badges: [] } } });
  check('um save de antes da 0.19 vira a jornada 1', legacy.journeys.length === 1 && legacy.activeJourney === legacy.journeys[0].id
        && legacy.regions.kanto.starter === 'squirtle');

  // o limite e o apagar
  game.newJourney(); game.chooseTrainer('red'); game.chooseName('Bia'); game.chooseStarter('squirtle');
  game.newJourney();
  check(`com os ${CONFIG.save.maxJourneys} espaços ocupados, não abre outra (pede para apagar)`,
        game.listJourneys().length === CONFIG.save.maxJourneys && !registry.get('screen-journeys').classes.has('hidden'));
  game.deleteJourney(second.id);
  check('apagar libera o espaço e não mexe nas outras', game.listJourneys().length === CONFIG.save.maxJourneys - 1
        && game.listJourneys().some((j) => j.progress.starter === 'bulbasaur'));
  game.deleteJourney(game.profile.activeJourney);
  check('apagar a jornada atual deixa sem jornada ativa, e a outra continua', !game.profile.activeJourney
        && !game.campaign.starter && game.listJourneys().length === 1);
}

console.log(`\n=== ${failures === 0 ? 'TUDO OK' : failures + ' FALHA(S)'} ===\n`);
process.exit(failures ? 1 : 0);
