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
  // como o canvas de verdade: raio negativo lança erro (0.37.9, o Origin Pulse do
  // Kyogre do Theo travava o jogo assim, e este stub engolia o erro)
  const radius = (r, what) => { if (r < 0) throw new RangeError(`${what}: raio negativo (${r})`); };
  return new Proxy({
    canvas: { width: 1280, height: 720 },
    arc: (x, y, r) => radius(r, 'arc'),
    ellipse: (x, y, rx, ry) => { radius(rx, 'ellipse'); radius(ry, 'ellipse'); },
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
for (const id of ['modal-pokedex', 'modal-achievements', 'modal-quests', 'modal-team', 'modal-options', 'modal-help']) {
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
// as quests (0.38, PLANEJAMENTO-HISTORIA.md): o rastreador guia o prólogo
const questBox = () => registry.get('hub-quest');
check('a jornada nova começa com a quest "Fale com a mãe 0/1" no rastreador, no canto de cima',
      game.quests.isActive('p_mae') && !questBox().classes.has('hidden')
      && questBox().innerHTML.includes('Prólogo') && questBox().innerHTML.includes('Fale com a mãe') && questBox().innerHTML.includes('0/1'));
game.questTracker.toggle();
check('um clique recolhe o rastreador, e outro abre', questBox().classes.has('collapsed'));
game.questTracker.toggle();
check('...aberto de novo', !questBox().classes.has('collapsed'));
// a tela de Missões (H-3, PLANEJAMENTO-HISTORIA.md seção 7.3): o diário da jornada
const nodesOf = (node, out = []) => { out.push(node); for (const c of node.children ?? []) nodesOf(c, out); return out; };
const byClass = (node, cls) => nodesOf(node).filter((n) => n.classes?.has(cls));
const textIn = (node) => nodesOf(node).map((n) => n._text).join(' | ');
const questLog = () => registry.get('quests-log');
const questsDot = () => registry.get('hub-quests').classes.has('alert');
check('a quest nova acende o pontinho no botão Missões da barra da vila', questsDot());
game.menus.showModal('modal-quests');
check('a tela de Missões abre com a quest de agora: o capítulo, o tipo, a descrição e o objetivo',
      !registry.get('modal-quests').classes.has('hidden') && byClass(questLog(), 'ql-card').length === 1
      && byClass(questLog(), 'ql-story').length === 1
      && ['Agora', 'Prólogo', 'História', 'A mãe está lá embaixo', 'Fale com a mãe', '0/1'].every((t) => textIn(questLog()).includes(t)),
      textIn(questLog()));
check('...com o resumo em cima', registry.get('quests-sub').textContent.startsWith('Uma missão em andamento'), registry.get('quests-sub').textContent);
check('...e nada do que vem depois: nem o diário, nem os itens, nem a quest seguinte (sem spoiler)',
      !textIn(questLog()).includes('O que já aconteceu') && !textIn(questLog()).includes('Itens importantes')
      && !textIn(questLog()).includes('Prof. Carvalho passou cedinho') && !textIn(questLog()).includes('laboratório'));
check('...e o pontinho apaga', !questsDot() && game.quests.state.seen.includes('p_mae'));
game.menus.closeModal();
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
check('a quest só fecha quando a conversa acaba', game.quests.isActive('p_mae'));
{
  // aqui o setTimeout segura a comemoração (no resto do teste ele roda na hora)
  const instant = global.setTimeout;
  let later = null;
  global.setTimeout = (fn) => { later = fn; return 1; };
  closeDialog();
  check('falou com a mãe: o ✓, o "Missão concluída!" e a próxima é ir ao laboratório',
        game.quests.isDone('p_mae') && game.quests.isActive('p_lab')
        && questBox().innerHTML.includes('Missão concluída!') && questBox().innerHTML.includes('✓ Fale com a mãe')
        && questBox().innerHTML.includes('1/1'));
  global.setTimeout = instant;
  later?.();
  check('...e depois o rastreador passa para "Vá ao laboratório do Prof. Carvalho 0/1", deslizando',
        questBox().innerHTML.includes('Vá ao laboratório do Prof. Carvalho') && questBox().innerHTML.includes('0/1')
        && questBox().innerHTML.includes('quest-item quest-story enter'));
  game.questTracker.render();
  check('...e o deslizar acontece uma vez só', !questBox().innerHTML.includes(' enter'));
  check('a quest seguinte acende o pontinho das Missões de novo', questsDot());
  game.menus.showModal('modal-quests');
  check('...e a tela passa a ter o diário: a conversa com a mãe, já feita, embaixo do Prólogo',
        byClass(questLog(), 'ql-card').length === 1 && textIn(questLog()).includes('Vá ao laboratório')
        && byClass(questLog(), 'ql-group').length === 1 && byClass(questLog(), 'ql-group-title')[0]._text === 'Prólogo'
        && byClass(questLog(), 'ql-entry').length === 1 && textIn(byClass(questLog(), 'ql-entry')[0]).includes('Fale com a mãe')
        && byClass(questLog(), 'ql-date').length === 1);
  game.menus.closeModal();
  check('...e o pontinho apaga de novo', !questsDot());
}
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

// o laboratório (0.39): entrar começa a cena do discurso do Carvalho (data/cutscenes.js)
// toca a cena até o fim, passando as páginas; devolve o que apareceu na caixa de texto
const runScene = (watch = null) => {
  const seen = [];
  let last = null;
  for (let i = 0; i < 60 * 180 && hub.scene; i++) {
    if (hub.dialog && hub.dialog !== last) { last = hub.dialog; seen.push({ name: hub.dialog.name, text: hub.dialog.pages.join(' ') }); watch?.(seen.at(-1)); }
    if (hub.dialog) { hub.dialog.shown = 999; hub.confirm(); }
    hub.update(1 / 60);
  }
  return seen;
};
const said = (seen, text) => seen.some((d) => d.text.includes(text));
goTo(26, 7);
press('up');
check('a porta do laboratório leva para dentro', hub.mapId === 'lab' && hub.player.x === 6 && hub.player.y === 12);
check('entrar no laboratório fecha a quest: agora é falar com o Prof. Carvalho',
      game.quests.isDone('p_lab') && game.quests.isActive('p_carvalho'));
check('as três Poké Balls estão na mesa', hub.decor.filter((d) => d.sprite === 'item_ball').length === 3);
check('...e a cena do discurso do Carvalho começa sozinha (só conta como vista no fim)',
      hub.scene?.id === 'prologo_carvalho' && game.sceneRecord.prologo_carvalho === 'started');
{
  hub.update(1 / 60, STEP.down);
  check('durante a cena o jogador não anda', hub.player.x === 6 && hub.player.y === 12 && !hub.player.moving);
  let camera = false, oakTurned = false;
  const lab = runScene(() => {
    camera ||= !!hub.scene?.fx.camera;
    oakTurned ||= hub.npcs.find((n) => n.id === 'carvalho')?.dir === 'up';
  });
  check('o Carvalho conta a mini-história das hordas', lab.every((d) => d.name === 'Prof. Carvalho') && said(lab, 'hordas'));
  check('...o discurso do prólogo: o sonho continua possível, mas o ideal é devolver a paz às rotas',
        said(lab, 'Fellipe') && said(lab, 'esse sonho continua possível') && said(lab, 'resolver o problema das hordas') && said(lab, 'um lugar de paz'));
  check('...encenado: a câmera vai até ele e, no meio, ele se vira para o quadro', camera && oakTurned);
  const oak = hub.npcs.find((n) => n.id === 'carvalho');
  check('...ele vai para trás da mesa e o jogador para na frente dela',
        oak.x === 9 && oak.y === 3 && oak.dir === 'down' && hub.player.x === 8 && hub.player.y === 5 && hub.player.dir === 'up' && !hub.player.moving);
  check('no fim, a cena conta como vista', !hub.scene && game.sceneRecord.prologo_carvalho === 'seen');
}
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
hub.clickTile(9, 3);
settle();
check('vista a cena, falar com o Carvalho de novo é curto: escolha com calma', hub.dialog?.name === 'Prof. Carvalho' && dialogText().includes('esperando por você') && !hub.scene);
closeDialog();
check('...e a escolha abre de novo', !registry.get('screen-starter').classes.has('hidden'));
game.chooseStarter('charmander');
check('escolhido o inicial, o rival chega (a cena do rival, 0.39)', hubVisible() && hub.scene?.id === 'prologo_rival');
check('com o inicial escolhido, a quest do Carvalho espera ele terminar de falar', game.quests.isActive('p_carvalho'));
{
  let rivalAt = null;
  const rivalScene = runScene((d) => {
    if (d.text.includes('O rival pegou')) { const r = hub.scene.actor('rival'); rivalAt = `${r.x},${r.y},${r.dir}`; }
  });
  check('o rival entra atrasado e pega o inicial com vantagem sobre o seu (Squirtle contra Charmander)',
        said(rivalScene, 'Vô! Cheguei!') && said(rivalScene, 'O rival pegou o Squirtle!') && said(rivalScene, 'contra o seu Charmander'));
  check('...andando até a bola dele, na frente da mesa', rivalAt === '9,5,up', rivalAt);
  check('...e acha bobagem se preocupar com as hordas: quer ser Campeão', said(rivalScene, 'Hordas, hordas') && said(rivalScene, 'Liga'));
  check('escolhido o inicial, o Carvalho entrega o Mapa da Jornada (0.30)',
        said(rivalScene, 'Charmander! Ótima escolha') && said(rivalScene, 'Fellipe recebeu o MAPA DA JORNADA'));
  check('...e pede para voltar com o que descobrir sobre as hordas', said(rivalScene, 'volte e me conte'));
  check('o rival sai pela porta e a cena conta como vista', hub.scene === null && game.sceneRecord.prologo_rival === 'seen');
}
check('ele terminou: a próxima quest é abrir o Mapa da Jornada', game.quests.isDone('p_carvalho') && game.quests.isActive('p_mapa'));
check('a bola do inicial escolhido some da mesa, e a do rival também', hub.decor.filter((d) => d.sprite === 'item_ball').length === 1
      && hub.decor.some((d) => d.sprite === 'item_ball' && d.x === 8));
game.sceneRecord.prologo_rival = 'started';
game.continueGame();
check('uma cena que ficou no meio volta do começo ao continuar, no lugar dela',
      hubVisible() && hub.mapId === 'lab' && hub.player.x === 8 && hub.player.y === 5 && hub.scene?.id === 'prologo_rival' && hub.scene.step === 0);
check('...com a bola do rival de volta na mesa até ele pegar', (hub.update(1 / 60), hub.decor.filter((d) => d.sprite === 'item_ball').length === 2));
runScene();
check('...e no fim conta como vista de novo, sem repetir a quest', !hub.scene && game.sceneRecord.prologo_rival === 'seen' && game.quests.isActive('p_mapa'));
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
check('abrir o mapa fecha o prólogo: o Capítulo 1 pede vencer o Brock, no rastreador do mapa',
      game.quests.isDone('p_mapa') && game.quests.isActive('c1_brock') && !registry.get('lobby-quest').classes.has('hidden')
      && registry.get('lobby-quest').innerHTML.includes('Capítulo 1') && registry.get('lobby-quest').innerHTML.includes('Vença o Brock'));
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
check('na partida, a quest da fase aparece na plaquinha: "Vença o Brock 0/1"',
      !registry.get('hud-quest').classes.has('hidden') && registry.get('hud-quest').textContent.includes('Vença o Brock, em Pewter 0/1'));
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
check('...e a quest "Vença o Brock" fecha com a comemoração, não em silêncio',
      game.quests.isDone('c1_brock') && !game.campaign.quests.done.c1_brock.skipped);
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

// a cena de depois da Fase 1 (0.39): o Brock, no ginásio dele, em tela cheia, com os personagens em pixel
check('vencido o Brock, a volta passa pelo ginásio dele: a cena de depois da fase, em tela cheia (sem a barra da vila)',
      hub.mapId === 'ginasio_pewter' && hub.scene?.id === 'depois_brock' && registry.get('screen-hub').classes.has('cinema')
      && hub.player.x === 6 && hub.player.y === 6 && hub.npcs.some((n) => n.id === 'brock' && n.sprite === 'brock'));
check('...e a quest da Misty ainda não apareceu: quem pede é o Brock', game.quests.isDone('c1_brock') && !game.quests.isActive('c2_misty'));
{
  let askedFirst = false;
  const brockScene = runScene((d) => { if (d.text.includes('preciso da sua ajuda')) askedFirst = !game.quests.isActive('c2_misty'); });
  check('o Brock parabeniza o jogador por ter vencido', said(brockScene, 'Que batalha, Fellipe!') && said(brockScene, 'Insígnia Pedra'));
  check('...conta que os Pokémon estão estranhos, que é muito sério, e pede ajuda',
        said(brockScene, 'Os Geodude desceram do Monte Lua') && said(brockScene, 'Isso é muito sério') && said(brockScene, 'preciso da sua ajuda'));
  check('...e manda investigar Cerulean; o Maxie ainda não aparece', said(brockScene, 'investigue a cidade') && !said(brockScene, 'Maxie')
        && brockScene.every((d) => d.name === 'Brock'));
  check('a quest nova abre no meio da conversa, depois do pedido', askedFirst && game.quests.isActive('c2_misty'));
  settle();
  check('no fim, a tela escurece e o jogador aparece na vila (com a barra de volta), na rua embaixo da casa do velho sábio',
        hub.mapId === 'vila' && hub.player.x === 27 && hub.player.y === 21 && !registry.get('screen-hub').classes.has('cinema')
        && game.sceneRecord.depois_brock === 'seen');
  // logo depois, a cena do velho sábio (pedido do Fellipe): ele sai de casa, vê o jogador e conta dos pássaros
  check('...e a cena do velho sábio começa: ele sai de casa', hub.scene?.id === 'sabio_passaros' && game.sceneRecord.sabio_passaros === 'started');
  let sawPlayer = false, cameOver = null;
  const sage = runScene((d) => {
    const s = hub.scene?.actor('sabio');
    if (d.text.includes('Espere um pouco')) sawPlayer = !s.hidden && s.x === 30 && s.y === 18;
    if (d.text.includes('Soube que o Brock')) cameOver = `${s.x},${s.y},${s.dir}`;
  });
  check('...vê o jogador da porta, com o "!", e chama', sawPlayer && sage[0]?.name === 'Velho sábio');
  check('...vem até o lado do jogador para conversar', cameOver === '28,21,left', cameOver);
  check('...sabe que o Brock pediu ajuda e conta que os pássaros lendários sumiram dos céus',
        said(sage, 'Soube que o Brock te pediu ajuda') && said(sage, 'pássaros lendários de Kanto sumiram dos céus'));
  check('...que foi depois disso que tudo começou, e que é tudo o que ele pode ajudar por enquanto',
        said(sage, 'Deve ter alguma coisa a ver') && said(sage, 'isso é tudo que eu posso te ajudar'));
  check('no fim ele volta para casa e o jogador está livre', !hub.scene && game.sceneRecord.sabio_passaros === 'seen'
        && (press('left'), hub.player.x === 26 && hub.player.y === 21));
  hub.enter({ map: 'casa_sabio', x: 3, y: 6, dir: 'up' });
  hub.interact();
  check('na casa dele, depois, o sábio lembra da conversa', hub.dialog?.name === 'Velho sábio' && dialogText().includes('Os pássaros lendários sumiram'));
  closeDialog();
  hub.enter('home');
  game.questTracker.render();
  check('o rastreador mostra as duas linhas: derrote a Misty e encontre pistas sobre o comportamento dos Pokémon',
        questBox().innerHTML.includes('Capítulo 2') && questBox().innerHTML.includes('Derrote a Misty')
        && questBox().innerHTML.includes('Encontre pistas sobre o comportamento dos Pokémon'));
}

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

// ---- a volta da Fase 2 (0.39): a Misty e o Articuno, e a casa roubada de Cerulean ----
{
  const mistyQuest = () => game.quests.view('c2_misty');
  check('antes da Fase 2, a quest da Misty tem as duas linhas: a vitória e a pista',
        mistyQuest().objectives.map((o) => o.text).join(' | ') === 'Derrote a Misty | Encontre pistas sobre o comportamento dos Pokémon');
  game.startStage('gym_2_cerulean');
  check('na partida, a plaquinha mostra a linha da vitória', registry.get('hud-quest').textContent.includes('Derrote a Misty 0/1'));
  game.run.state = 'victory';
  game._handleRunState();
  check('vencida a Misty, a primeira linha fecha e a quest espera a pista',
        game.quests.isActive('c2_misty') && mistyQuest().objectives[0].have === 1 && mistyQuest().objectives[1].have === 0);
  game.quitToMenu();
  check('a volta passa pelo ginásio dela, em tela cheia, com a Misty em pixel',
        hub.mapId === 'ginasio_cerulean' && hub.scene?.id === 'depois_misty' && registry.get('screen-hub').classes.has('cinema')
        && hub.npcs.some((n) => n.id === 'misty' && n.sprite === 'misty'));
  let atLastLine = null;
  const misty = runScene((d) => {
    if (d.text.includes('Se descobrir alguma coisa')) atLastLine = { done: game.quests.isDone('c2_misty'), surge: game.quests.isActive('c2_surge') };
  });
  check('a Misty conta que o mar ficou bravo desde que o Articuno sumiu, e aponta o Surge e o Zapdos',
        said(misty, 'o mar ficou bravo') && said(misty, 'Articuno deixou de ser visto sobre as Ilhas Seafoam') && said(misty, 'O Zapdos aparecia perto da Usina'));
  check('...e a pista fecha a quest no meio da conversa (com a comemoração) e abre a do Surge',
        atLastLine?.done && atLastLine.surge && !game.campaign.quests.done.c2_misty.skipped);
  settle();
  check('emendada, a cena da casa roubada, na rua de Cerulean (outro palco, em tela cheia)',
        hub.mapId === 'cerulean' && hub.scene?.id === 'cerulean_roubo' && registry.get('screen-hub').classes.has('cinema'));
  let rivalAt = null;
  const roubo = runScene((d) => { if (d.name === 'Rival') { const r = hub.scene.actor('rival'); rivalAt = `${r.x},${r.y}`; } });
  check('o policial culpa a Equipe Rocket (a pista falsa)', said(roubo, 'Só pode ser a Equipe Rocket'));
  check('...e o dono da casa estranha: só levaram peças de máquina', said(roubo, 'Não levaram dinheiro, nem Pokémon') && said(roubo, 'peças de máquina'));
  check('o rival passa correndo, a caminho de Vermilion', said(roubo, 'Brincando de detetive') && rivalAt === '9,10', rivalAt);
  settle();
  game.questTracker.render();
  check('no fim, a vila, na frente de casa, com a quest do Surge em duas linhas',
        hub.mapId === 'vila' && hub.player.x === 6 && hub.player.y === 17 && !hub.scene && !registry.get('screen-hub').classes.has('cinema')
        && questBox().innerHTML.includes('Vença o Lt. Surge, em Vermilion') && questBox().innerHTML.includes('Descubra se o Zapdos também sumiu'));
  hub.enter({ map: 'vila', x: 15, y: 24, dir: 'down' });
  hub.interact();
  check('na vila, os moradores culpam a Equipe Rocket', dialogText().includes('A Equipe Rocket assaltou uma casa em Cerulean'));
  closeDialog();
  hub.enter({ map: 'casa_sabio', x: 3, y: 6, dir: 'up' });
  hub.interact();
  check('...e só o velho sábio estranha o que o ladrão levou', dialogText().includes('Que ladrão faz isso?'));
  closeDialog();
  hub.enter('home');
  game.openCampaign();
}

// ---- a volta da Fase 3 (0.39): o Surge e o Zapdos, as correntes no porto e a visita à Usina ----
{
  game.startStage('gym_3_vermilion');
  check('na partida, a plaquinha mostra a linha do Surge', registry.get('hud-quest').textContent.includes('Vença o Lt. Surge, em Vermilion 0/1'));
  game.run.state = 'victory';
  game._handleRunState();
  game.quitToMenu();
  check('vencido o Surge, a volta passa pelo ginásio dele, em tela cheia, com o Lt. Surge em pixel',
        hub.mapId === 'ginasio_vermilion' && hub.scene?.id === 'depois_surge' && registry.get('screen-hub').classes.has('cinema')
        && hub.npcs.some((n) => n.id === 'surge' && n.sprite === 'lt_surge'));
  let atErika = null;
  const surge = runScene((d) => {
    if (d.text.includes('Túnel de Pedra')) atErika = { done: game.quests.isDone('c2_surge'), erika: game.quests.isActive('c3_erika'), usina: game.quests.isActive('z_usina') };
  });
  check('o Surge conta da Usina que apagou e do Zapdos sumido (com o Articuno, já são dois)',
        said(surge, 'a Usina, perto da Rota 10, apagou') && said(surge, 'Com o Articuno, já são dois'));
  check('...e do combate naquela noite, como se o Zapdos estivesse brigando (nada de barco nem de clarão)',
        said(surge, 'Parecia um combate') && said(surge, 'Como se o Zapdos estivesse brigando') && !said(surge, 'barco') && !said(surge, 'clarão'));
  check('a pista do Zapdos fecha a quest do Surge; o caminho para Celadon está no escuro, e a da Usina espera o marinheiro',
        atErika?.done && !atErika.erika && !atErika.usina && !game.campaign.quests.done.c2_surge.skipped
        && said(surge, 'Túnel de Pedra') && said(surge, 'Ninguém atravessa'));
  settle();
  check('emendada, a cena do porto de Vermilion, em tela cheia',
        hub.mapId === 'vermilion' && hub.scene?.id === 'vermilion_correntes' && registry.get('screen-hub').classes.has('cinema'));
  let sailorAt = null;
  const porto = runScene((d) => {
    if (d.text.includes('Você é o que anda investigando')) { const sailor = hub.npcs.find((n) => n.id === 'marinheiro'); sailorAt = `${sailor.x},${sailor.y},${sailor.dir}`; }
  });
  check('o marinheiro vê o jogador e vem até ele', sailorAt === '12,11,left', sailorAt);
  check('...preso em terra pelo mar agitado, escutou correntes na Usina fechada',
        said(porto, 'A maré está agitada demais') && said(porto, 'Escutei correntes') && said(porto, 'fechada desde o apagão'));
  check('...e abre a quest da Usina, agora o caminho principal (dourada)', game.quests.isActive('z_usina') && game.quests.view('z_usina').kind === 'story');
  settle();
  game.questTracker.render();
  check('na vila, o rastreador mostra a da Usina (dourada), e ainda nada da Erika',
        hub.mapId === 'vila' && !hub.scene && !questBox().innerHTML.includes('Vença a Erika')
        && questBox().innerHTML.includes('Investigue a Usina, na Rota 10') && !questBox().innerHTML.includes('quest-legendary'));
  // a trava da Fase 4 (decisão 18): o túnel no escuro, sem o nome do Zapdos (sem spoiler)
  check('a Fase 4 está fechada até a Usina: jogar não começa nada', (game.startStage('gym_4_celadon'), !game.run));
  game.openCampaign();
  check('o mapa mostra a Fase 4 como a próxima, com a trava: o Túnel de Pedra no escuro e "Investigue a Usina" (sem o Zapdos)',
        game.menus.lobby.selected === 'gym_4_celadon'
        && JSON.stringify(registry.get('lobby-panel').children.map((c) => [c.className, c.innerHTML, (c.children ?? []).map((k) => k.innerHTML)])).includes('O Túnel de Pedra está no escuro')
        && !JSON.stringify(registry.get('lobby-panel').children.map((c) => [c.innerHTML, (c.children ?? []).map((k) => k.innerHTML)])).includes('Zapdos'));
  hub.enter('home');
  game.openHub('home');
  hub.enter({ map: 'casa_sabio', x: 3, y: 6, dir: 'up' });
  hub.interact();
  check('o velho sábio: o Zapdos brigando e as correntes não são coisa da natureza', dialogText().includes('Isso não é coisa da natureza'));
  closeDialog();
  hub.enter('home');

  game.openCampaign();
  const placeNode = () => mapNodes().find((c) => c.classes.has('place'));
  check('no mapa da jornada aparece a marca da Usina', !!placeNode() && String(placeNode().title).includes('Rota 10'));
  game.menus.lobby.selected = 'place:usina';
  game.menus.lobby.render();
  const placePanel = () => registry.get('lobby-panel').children;
  const goButton = () => placePanel().find((c) => c.classes.has('panel-actions'))?.children[0];
  check('...e o painel dela conta do marinheiro, com o Investigar',
        placePanel().some((c) => c.classes.has('panel-place-text') && c.innerHTML.includes('correntes')) && goButton()?.innerHTML.includes('Investigar') && !goButton().disabled);

  // a Usina andável (pedido do Fellipe): o jogador explora, acha as Poké Balls e a escotilha
  check('o Investigar leva para dentro da Usina, em tela cheia, com o rodapé dos controles',
        game.visitPlace('usina') && hub.mapId === 'usina' && hub.player.x === 5 && hub.player.y === 37
        && registry.get('screen-hub').classes.has('cinema') && registry.get('screen-hub').classes.has('explore'));
  check('...e a chegada toca uma vez: as luzes piscam, as marcas de raio, as correntes',
        hub.scene?.id === 'usina_entrada');
  const chegada = runScene();
  check('...e depois o jogador anda à vontade', chegada.some((d) => d.text.includes('marcadas por raios')) && chegada.some((d) => d.text.includes('correntes'))
        && !hub.scene && (press('up'), hub.player.y === 36));
  const balls = () => hub.decor.filter((d) => d.loot);
  check('13 Poké Balls no chão da Usina (2 no caminho, 11 nas salas sem saída)', balls().length === 13);
  {
    const revives = game.profile.bag.revive ?? 0;
    hub.enter({ map: 'usina', x: 46, y: 25, dir: 'up' });
    hub.interact();
    check('pegar uma Poké Ball: o item vai para a mochila', dialogText() === `${game.playerName} encontrou um REVIVER!` && game.profile.bag.revive === revives + 1);
    closeDialog();
    check('...e ela some do chão, de vez nesta jornada', balls().length === 12 && (hub.enter({ map: 'usina', x: 5, y: 37, dir: 'up' }), balls().length === 12));
    const rerolls = game.profile.bag.reroll ?? 0;
    hub.enter({ map: 'usina', x: 17, y: 12, dir: 'up' });
    hub.interact();
    check('...as outras guardam Novos Sorteios', dialogText().includes('NOVO SORTEIO') && game.profile.bag.reroll === rerolls + 1);
    closeDialog();
    // a mochila volta como estava (a loja, mais adiante, conta com ela)
    game.profile.bag.revive = revives;
    game.profile.bag.reroll = rerolls;
  }
  check('a escotilha fica na sala do gerador, e o caminho até ela existe com todas as bolas no lugar',
        hub.decor.some((d) => d.sprite === 'escotilha' && d.x === 4 && d.y === 12) && hub._route([{ x: 4, y: 12, then: null }]) !== null
        || (hub.enter({ map: 'usina', x: 5, y: 37, dir: 'up' }), hub._route([{ x: 4, y: 12, then: null }]) !== null));
  hub.enter({ map: 'usina', x: 4, y: 13, dir: 'up' });
  press('up');
  check('descer a escotilha leva ao fundo da Usina, no escuro', hub.mapId === 'usina_fundo' && hub.place.dark && hub.scene?.id === 'usina_fundo');
  const olhos = () => hub.scene?.actor('olhos');
  for (let i = 0; i < 60 * 1.8; i++) hub.update(1 / 60);
  check('nos 2 primeiros segundos, só o jogador com o brilho em volta', olhos()?.hidden && !game.missionCard);
  for (let i = 0; i < 60 * 0.4; i++) hub.update(1 / 60);
  check('depois, os olhos vermelhos (em pixel, num tile, por cima do escuro), e a Usina vira a missão do Zapdos',
        !olhos()?.hidden && olhos().glow && olhos().sprite === 'npc/olhos_zapdos' && game.quests.isDone('z_usina') && game.quests.isActive('z_zapdos')
        && !game.missionCard);
  for (let i = 0; i < 60 * 2.2; i++) hub.update(1 / 60);
  const card = registry.get('mission-card');
  const cardHtml = () => JSON.stringify(card.children.map((c) => [c.className, c.innerHTML, c.children.map((k) => [k.className, k.innerHTML, k.src])]));
  const deepText = (n) => [n.innerHTML ?? '', n.textContent ?? '', ...(n.children ?? []).map(deepText)].join(' ');
  check('mais 2 segundos e o card sobe, no padrão do card de fase, com a foto do Zapdos',
        game.missionCard?.id === 'zapdos' && !card.classes.has('hidden') && cardHtml().includes('Derrote e liberte o Zapdos') && cardHtml().includes('145.png')
        && deepText(card).includes('Sem captura nesta luta') && cardHtml().includes('Nível recomendado'));
  game.handleAction('cancel');
  for (let i = 0; i < 4; i++) hub.update(1 / 60);
  settle();
  check('o Voltar fecha o card e devolve o jogador à Usina, ao lado da escotilha',
        !game.missionCard && card.classes.has('hidden') && !hub.scene && hub.mapId === 'usina' && hub.player.x === 5 && hub.player.y === 12);
  game.questTracker.render();
  check('no rastreador: "Derrote e liberte o Zapdos" (azul)', questBox().innerHTML.includes('Derrote e liberte o Zapdos'));

  // ---- a missão do Zapdos (H-5 e H-6): o Lutar, a luta, a derrota, a vitória e a cena ----
  const { BATTLE_INTRO } = await import('../src/game/Hub.js');
  const toTheCard = () => {
    hub.enter({ map: 'usina', x: 4, y: 13, dir: 'up' });
    press('up');
    for (let i = 0; i < 60 * 4.5 && !game.missionCard; i++) hub.update(1 / 60);
    return !!game.missionCard;
  };
  const savedJourney = JSON.stringify(game.campaign.journey);
  check('o Zapdos ainda está preso: nada dele na Poké Ball das fases', game.missionState('zapdos') === 'preso' && !game.liberatedSpecies().includes('zapdos'));
  check('descer de novo: o escuro, os olhos e o card outra vez', toTheCard());
  game.handleAction('confirm');
  check('o Lutar fecha o card e começa a transição de batalha (a cena acaba ali)', !game.missionCard && !!hub.battle && !game.run);
  const where = `${hub.mapId}:${hub.player.x},${hub.player.y}`;
  for (let i = 0; i < 20; i++) hub.update(1 / 60, STEP.down);
  check('...durante a transição, nada anda', `${hub.mapId}:${hub.player.x},${hub.player.y}` === where && !hub.player.moving && !!hub.battle);
  for (let i = 0; i < 60 * BATTLE_INTRO + 2; i++) hub.update(1 / 60);
  check('no fim dela, a luta do Zapdos: o fundo da Usina e o Zapdos preso na máquina, sem captura',
        game.run?.stage.id === 'zapdos' && game.run.fight?.kind === 'zapdos' && game.run.fight.balls === 0 && !game.run.fight.snapped
        && game.run.world.scene === 'usina_arena' && !hub.battle && !hub.scene);
  // sair no meio: de volta para cima, ao lado da escotilha
  game.quitToMenu();
  check('sair no meio da luta volta para a Usina, ao lado da escotilha', !game.run && hubVisible() && hub.mapId === 'usina' && hub.player.x === 5 && hub.player.y === 12);
  // a derrota: Tentar de novo ou o Centro, com a enfermeira da Usina
  toTheCard();
  game.handleAction('confirm');
  for (let i = 0; i < 60 * BATTLE_INTRO + 2; i++) hub.update(1 / 60);
  game.run.team.members.forEach((m) => { m.fainted = true; m.hp = 0; });
  game.run.update(1 / 60, { x: 0, y: 0 });
  game._handleRunState();
  const sub = (id) => registry.get(id).children?.[0]?.children?.find?.((c) => c.className === 'btn-sub')?.textContent ?? '';
  check('caiu na luta do Zapdos: a derrota oferece Tentar de novo e Voltar para a vila', game.run?.state === 'defeat'
        && !registry.get('btn-result-retry-defeat').classes.has('hidden') && !registry.get('btn-result-village').classes.has('hidden')
        && registry.get('btn-result-center').classes.has('hidden'));
  registry.get('btn-result-retry-defeat').click();
  check('Tentar de novo: a luta recomeça, sem atravessar a Usina, com a equipe curada', game.run?.stage.id === 'zapdos' && game.run.state === 'running'
        && game.run.team.members.every((m) => !m.fainted));
  game.run.team.members.forEach((m) => { m.fainted = true; m.hp = 0; });
  game.run.update(1 / 60, { x: 0, y: 0 });
  game._handleRunState();
  const rescues = game.campaign.dive?.rescues ?? 0;
  registry.get('btn-result-village').click();
  check('Voltar para a vila: acorda no Centro, e a enfermeira conta do marinheiro de Vermilion',
        !game.run && hubVisible() && hub.mapId === 'centro' && hub.dialog?.name === 'Enfermeira' && dialogText().includes('Usina')
        && (game.campaign.dive?.rescues ?? 0) === rescues);
  closeDialog();
  check('perder não libera o Zapdos', game.missionState('zapdos') === 'preso' && game.quests.isActive('z_zapdos'));
  // a vitória (sem captura: ele cai sem forças)
  toTheCard();
  game.handleAction('confirm');
  for (let i = 0; i < 60 * BATTLE_INTRO + 2; i++) hub.update(1 / 60);
  game.run.state = 'victory';
  game._handleRunState();
  check('venceu: a missão fica registrada (o Zapdos livre, não capturado) e a quest fecha',
        game.missionState('zapdos') === 'livre' && !game.campaign.journey.pc.some((m) => m.pokemonId === 'zapdos')
        && game.quests.isDone('z_zapdos') && game.sceneRecord.zapdos_livre === 'due');
  check('a vitória não oferece jogar de novo (o Zapdos está livre)', registry.get('btn-result-retry').classes.has('hidden'));
  check('depois da missão, o Zapdos pode cair na Poké Ball das fases seguintes', game.liberatedSpecies().includes('zapdos'));
  registry.get('btn-result-menu').click();
  check('Continuar Jornada: a sala do fundo com a luz de volta, a máquina destruída e o Zapdos caído (a cena de depois)',
        hubVisible() && hub.mapId === 'usina_luz' && hub.scene?.id === 'zapdos_livre' && !hub.place.dark
        && hub.decor.some((d) => d.sprite === 'maquina_zapdos_quebrada') && hub.scene.actor('zapdos')?.sprite === 'npc/zapdos');
  // quando a caixa diz que ele fugiu, ele já subiu e sumiu (o passo fly)
  let flew = false;
  const livre = runScene((d) => { if (d.text.includes('fugiu')) flew = !!hub.scene?.actor('zapdos')?.hidden; });
  check('a cena: o Zapdos se assusta e foge pelo alto; a captura fica para outro momento',
        said(livre, 'fugiu, assustado') && flew && game.sceneRecord.zapdos_livre === 'seen');
  check('...e a máquina: a energia sugada, mandada para longe em ondas, e o emblema vermelho',
        said(livre, 'sugava a energia') && said(livre, 'em ondas') && said(livre, 'emblema vermelho') && said(livre, 'de propósito'));
  settle();
  check('...e o jogador fica em cima, ao lado da escotilha', hub.mapId === 'usina' && hub.player.x === 5 && hub.player.y === 12);
  hub.enter({ map: 'usina', x: 4, y: 13, dir: 'up' });
  press('up');
  check('agora a escotilha leva à sala iluminada, só com os pedaços da máquina', hub.mapId === 'usina_luz' && hub.scene?.id === 'usina_luz_volta');
  runScene();
  settle();
  check('...e volta para cima', hub.mapId === 'usina' && !hub.scene);
  check('o Lutar de uma missão vencida não começa nada', !game.startMission('zapdos') && !hub.battle);
  // o sábio comenta uma vez
  hub.enter({ map: 'vila', x: 27, y: 22, dir: 'up' });
  hub.say('sabio');
  check('o velho sábio, uma vez: o emblema vermelho e alguém caçando os pássaros', dialogText().includes('caçando os pássaros'));
  closeDialog();
  hub.say('sabio');
  check('...só uma vez', !dialogText().includes('caçando os pássaros'));
  closeDialog();
  game.campaign.journey = JSON.parse(savedJourney);
  hub.enter({ map: 'usina', x: 5, y: 38, dir: 'down' });
  press('down');
  check('o tapete da entrada leva de volta para a vila, sem a tela cheia', hub.mapId === 'vila' && !registry.get('screen-hub').classes.has('cinema'));
  game.openCampaign();
  game.menus.lobby.selected = 'place:usina';
  game.menus.lobby.render();
  check('depois da missão, a marca da Usina sai do mapa (as quests dela fecharam)', !placeNode());
  hub.enter('home');
  game.openCampaign();
}

// ---- o Capítulo 3 (H-4, decisão 18): a Fase 4 abre com a luz da Usina, e a cena do emblema ----
{
  const { isStageUnlocked } = await import('../src/data/stages.js');
  game.openHub('home');
  check('com a luz da Usina de volta, a Fase 4 abre, e a quest dourada é a da Erika',
        isStageUnlocked('gym_4_celadon', game.campaign.clearedStages) && game.quests.isActive('c3_erika'));
  game.startStage('gym_4_celadon');
  check('a Fase 4 é a batalha da Erika de sempre', game.run?.stage.id === 'gym_4_celadon');
  game.run.state = 'victory';
  game._handleRunState();
  check('vencer a Erika deixa a cena do emblema devida', game.sceneRecord.depois_erika === 'due');
  registry.get('btn-result-menu').click();
  check('Continuar Jornada: o ginásio de Celadon em tela cheia, com a Erika em pixel',
        hub.mapId === 'ginasio_celadon' && hub.scene?.id === 'depois_erika' && registry.get('screen-hub').classes.has('cinema')
        && hub.npcs.some((n) => n.id === 'erika' && n.sprite === 'erika'));
  let storm = false, item = false, emote = false, shadowGone = false;
  const cena = runScene((d) => {
    const fx = hub.scene?.fx;
    if (d.text.includes('sombra enorme')) storm = !!fx?.storm;
    if (d.text.includes('reconhece o emblema')) { item = fx?.item?.sprite === 'npc/pedaco_metal'; emote = true; }
    if (d.text.includes('Pela manhã')) shadowGone = !fx?.storm;
  });
  check('a lembrança: a tela escurece e a sombra de asas cruza o alto enquanto a Erika conta, e some depois',
        storm && shadowGone && said(cena, 'tempestade estranha sobre Celadon'));
  check('o pedaço de metal no quadro, e o jogador reconhece o emblema da máquina da Usina',
        item && emote && said(cena, 'é o mesmo da máquina que prendia o Zapdos'));
  check('a conversa deixa as pistas: a Rocket no Cassino, a sombra para o sul e o Koga, também ao sul',
        said(cena, 'embaixo do Cassino') && said(cena, 'Seguiu para o sul, na direção do mar') && said(cena, 'Koga, em Fuchsia'));
  check('o Pedaço de Metal vai para a mochila da jornada', game.campaign.keyItems?.emblema_vermelho >= 1 && said(cena, 'recebeu PEDAÇO DE METAL'));
  check('a pista fecha a quest da Erika e abre a do Koga (a história dos lendários descansa)',
        game.quests.isDone('c3_erika') && game.quests.isActive('c3_koga') && game.sceneRecord.depois_erika === 'seen');
  settle();
  check('...e a volta é para a vila', hub.mapId === 'vila' && !hub.scene);
  game.startStage('gym_5_fuchsia');
  game.run.state = 'victory';
  game._handleRunState();
  check('vencer o Koga abre a da Sabrina, sem cena nenhuma',
        game.quests.isDone('c3_koga') && game.quests.isActive('c3_sabrina') && !Object.values(game.sceneRecord).includes('due'));
  registry.get('btn-result-menu').click();
  settle();
  check('...e a volta é direto para a vila', hub.mapId === 'casa_2f' || hub.mapId === 'vila');
  game.openCampaign();
}

// ---- a tela de Missões depois do Capítulo 3 (H-3): o diário inteiro e os itens da história ----
{
  const { QUESTS, CHAPTERS } = await import('../src/data/quests.js');
  const state = game.quests.state;
  check('a quest nova (a da Sabrina) acende o pontinho no botão Missões do mapa da jornada',
        registry.get('bar-quests').classes.has('alert'));
  game.menus.showModal('modal-quests');
  const log = questLog();
  const all = textIn(log);
  check('agora: a quest da Sabrina, dourada, com o objetivo', byClass(log, 'ql-card').length === state.active.length
        && byClass(log, 'ql-card')[0].classes.has('ql-story') && all.includes('Vença a Sabrina'), all);
  const titles = byClass(log, 'ql-group-title').map((n) => n._text);
  const order = Object.values(CHAPTERS);
  check('o diário: um grupo por capítulo, na ordem da história, do Prólogo ao Capítulo 3',
        titles[0] === 'Prólogo' && titles.includes('Capítulo 3 — Os rastros')
        && titles.every((t, i) => !i || order.indexOf(titles[i - 1]) < order.indexOf(t)), titles.join(', '));
  check('...com cada quest concluída, uma vez',
        byClass(log, 'ql-entry').length === Object.keys(state.done).filter((id) => QUESTS[id]).length);
  check('...e dá para reler: a Usina, a Erika e o Koga estão lá, com o texto de cada uma',
        ['Vença o Koga', QUESTS.z_usina.desc, QUESTS.c3_erika.desc].every((t) => all.includes(t)));
  const items = byClass(log, 'ql-item');
  check('os itens importantes: o Pedaço de Metal, com o desenho e o texto do emblema',
        items.length >= 1 && textIn(items[0]).includes('Pedaço de Metal') && textIn(items[0]).includes('emblema vermelho')
        && byClass(items[0], 'ql-item-icon')[0]?.src === 'assets/hub/npc/pedaco_metal.png');
  check('o resumo em cima conta as concluídas', registry.get('quests-sub').textContent.includes('concluídas'), registry.get('quests-sub').textContent);
  game.menus.closeModal();
  check('...e o pontinho apaga nas duas barras',
        !registry.get('bar-quests').classes.has('alert') && !registry.get('hub-quests').classes.has('alert'));
}

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

// ---- o motor das cenas (0.39): os passos novos numa cena de teste, e a história antes e depois da fase (nunca no meio) ----
{
  const { CUTSCENES } = await import('../src/data/cutscenes.js');
  const { QUESTS } = await import('../src/data/quests.js');
  const { STAGES } = await import('../src/data/stages.js');
  game.openHub('home');
  QUESTS.teste_cena = { kind: 'side', chapter: 'cap1', objectives: [{ text: 'Veja a cena de teste', on: 'scene', target: 'teste_cena' }], next: [], reward: null };
  CUTSCENES.teste_cena = { map: 'vila', spot: { x: 6, y: 17, dir: 'down' }, steps: [
    { do: 'fade', to: 1, t: 0.2 }, { do: 'fade', to: 0, t: 0.2 },
    { do: 'shake', t: 0.3, power: 2 },
    { do: 'hide', who: 'menina' },
    { do: 'quest', id: 'teste_cena' },
    { do: 'give', item: 'revive', count: 2 },
    { do: 'give', item: 'emblema_vermelho' },
    { do: 'flag', name: 'teste_flag' },
    { do: 'place', who: 'player', x: 7, y: 17, dir: 'left' },
    { do: 'end' }
  ] };
  const revives = game.profile.bag.revive ?? 0;
  const keyBefore = game.campaign.keyItems?.emblema_vermelho ?? 0;
  check('uma cena começa pelo código (game.playScene)', game.playScene('teste_cena') && hub.scene?.id === 'teste_cena');
  let faded = 0, shook = false, opened = false;
  const texts = [];
  for (let i = 0; i < 60 * 20 && hub.scene; i++) {
    faded = Math.max(faded, hub.scene.fx.fade);
    shook ||= !!hub.scene.fx.shake;
    opened ||= game.quests.isActive('teste_cena');
    if (hub.dialog) { texts.push(hub.dialog.pages.join(' ')); hub.dialog.shown = 999; hub.confirm(); }
    hub.update(1 / 60);
  }
  const girl = hub.npcs.find((n) => n.id === 'menina');
  check('fade escurece e clareia, e shake treme a tela', faded === 1 && shook);
  check('hide some com alguém do lugar, que deixa de bloquear o tile', girl.hidden && !hub.npcAt(girl.x, girl.y));
  check('give dá um item da mochila e um da história, e avisa na caixa',
        game.profile.bag.revive === revives + 2 && game.campaign.keyItems?.emblema_vermelho === keyBefore + 1
        && texts.includes(`${game.playerName} recebeu 2 REVIVER!`) && texts.includes(`${game.playerName} recebeu PEDAÇO DE METAL!`));
  check('quest abre uma quest, e o fim da cena conta para o objetivo `scene`', opened && game.quests.isDone('teste_cena'));
  check('flag marca a flag da vila e place põe o jogador no tile',
        game.campaign.hub.flags.teste_flag === true && hub.player.x === 7 && hub.player.y === 17 && hub.player.dir === 'left');
  delete CUTSCENES.teste_cena; delete QUESTS.teste_cena; delete game.quests.state.done.teste_cena;
  delete game.campaign.scenes.teste_cena; delete game.campaign.hub.flags.teste_flag; if (keyBefore) game.campaign.keyItems.emblema_vermelho = keyBefore; else delete game.campaign.keyItems.emblema_vermelho;
  game.profile.bag.revive = revives;

  // antes da fase (o gatilho 'play'): a cena toca em tela cheia, num palco, e a fase começa no fim.
  // Nada de cartão com retrato nem de história no meio da fase (regra do Fellipe)
  CUTSCENES.teste_antes = { map: 'ginasio_pewter', spot: { x: 6, y: 8, dir: 'up' }, trigger: [{ on: 'play', target: 'gym_1_pewter' }],
    steps: [{ do: 'say', name: 'Brock', lines: ['Pronto para a revanche, {player}?'] }, { do: 'end', then: 'stage' }] };
  game.quitToMenu();
  game.startStage('gym_1_pewter');
  check('com uma cena de antes da fase, o Jogar abre o palco dela em tela cheia, antes da fase',
        !game.run && hubVisible() && hub.mapId === 'ginasio_pewter' && hub.scene?.id === 'teste_antes' && registry.get('screen-hub').classes.has('cinema'));
  const antes = runScene();
  check('...e no fim dela a fase começa', antes.some((d) => d.text === `Pronto para a revanche, ${game.playerName}?`)
        && game.run?.stage.id === 'gym_1_pewter' && game.run.state === 'running' && game.sceneRecord.teste_antes === 'seen');
  for (let i = 0; i < 60 * 5; i++) {
    game.run.update(1 / 60, { x: 0, y: 0 });
    if (game.run.state === 'intro') game.closeLeaderIntro();
    if (game.run.state !== 'running') game.run.state = 'running';
  }
  check('no meio da fase não há história: ela corre do começo ao fim', game.run.state === 'running' && !hub.scene && game.run.time > 4);
  game.quitToMenu();
  game.startStage('gym_1_pewter');
  check('vista, a cena não volta: o Jogar começa a fase direto', !!game.run && !hub.scene);
  game.quitToMenu();
  game.openHub({ map: 'ginasio_pewter', x: 6, y: 8, dir: 'up' });
  hub.update(1 / 60);
  settle();
  check('um palco sem cena tocando não é lugar de andar: o jogador volta para a vila', hub.mapId === 'vila' && !registry.get('screen-hub').classes.has('cinema'));
  check('nenhuma fase tem cartão de história (stage.story saiu)', Object.values(STAGES).every((st) => !st.story));
  delete CUTSCENES.teste_antes;
  delete game.campaign.scenes.teste_antes;
}

const HUB_RESCUE_SPOT_TEST = { map: 'centro', x: 4, y: 5, dir: 'up' };
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
  game._updateMusic();
  check('os Níveis 1 a 3 da descida tocam a Underwater do Emerald', game.music.wanted === 'mus_underwater');
  game.dive.level = 3; game._updateMusic();
  check('os Níveis 4 e 5, depois do bolsão de ar, tocam a Abnormal Weather', game.music.wanted === 'mus_abnormal_weather');
  game.dive.level = 0;
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
  game._updateMusic();
  check('no Centro, a música do Centro', game.music.wanted === 'mus_poke_center');
  game.openHub('home'); game._updateMusic();
  check('na vila, a música calma (as Ilhas 1, 2 e 3), não o tema do lobby', game.music.wanted === 'mus_sevii_123');
  game.openCampaign(); game._updateMusic();
  check('no mapa da jornada, a mesma música calma', game.music.wanted === 'mus_sevii_123');
  game.menus.show('screen-title'); game._updateMusic();
  check('o tema do lobby fica só no menu', game.music.wanted === 'lobby-theme');
  game.openHub(HUB_RESCUE_SPOT_TEST);
  closeDialog();
  check('o resgate fica guardado na jornada', game.campaign.dive?.rescues === 1);
  hub.say('pescador');
  check('o pescador comenta o resgate (uma vez)', dialogText().includes('peixão'));
  closeDialog();
  hub.say('pescador');
  check('...e depois volta à fala de sempre', !dialogText().includes('peixão'));
  closeDialog();
  // o checkpoint (0.37.4): perder no Nível 5, depois do bolsão, oferece continuar do Nível 4
  game.openHub('home');
  game.openDive();
  game.dive.start(DIVE_LAST);
  game.dive.p.c = 4; game.dive.p.r = 3;
  for (let i = 0; i < 60 * 120 && !game.diveHud.defeatOpen; i++) game.dive.update(1 / 60, null);
  check('depois do bolsão, a derrota mostra continuar do Nível 4 ou voltar', game.diveOpen && game.diveHud.defeatOpen
        && !registry.get('dive-defeat').classes.has('hidden') && registry.get('dive-defeat-text').textContent.includes('Nível 5'));
  game.handleAction('confirm');
  check('Continuar: volta ao Nível 4 com as 3 bolhas', game.diveOpen && !game.diveHud.defeatOpen && game.dive.level === 3
        && game.dive.lives === 3 && game.dive.mode === 'play' && game.dive.checkpoint);
  game.dive.p.c = 4; game.dive.p.r = 3;
  for (let i = 0; i < 60 * 120 && !game.diveHud.defeatOpen; i++) game.dive.update(1 / 60, null);
  game.handleAction('cancel');
  check('Voltar para a vila: acorda no Centro, como no resgate', !game.diveOpen && hubVisible() && hub.mapId === 'centro' && hub.dialog?.name === 'Enfermeira');
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
  run.fight.ball.t = run.fight.ball.fall;   // a bola já tocou o chão
  run.update(1 / 60, { x: 0, y: 0 });
  run.player.x = run.fight.ball.x; run.player.y = run.fight.ball.y;
  run.fight.rng = () => 0.99;   // a primeira falha
  run.update(1 / 60, { x: 0, y: 0 });
  check('passar por cima joga a bola: tudo para enquanto ela balança', run.state === 'legendary' && !!run.fight.throwing);
  for (let i = 0; i < 60 * 10 && run.state === 'legendary'; i++) run.update(1 / 60, { x: 0, y: 0 });
  check('falhou: ele escapa, volta só a 25% e gasta uma das 3 Dive Balls', run.fight.balls === 2 && Math.abs(boss.hp / boss.maxHp - 0.25) < 1e-9
        && run.fight.state === 'fight');
  damageEnemy(run, boss, boss.maxHp);
  run.fight.t = run.fight.cfg.exhaust;
  run.update(1 / 60, { x: 0, y: 0 });
  check('sem pegar a bola a tempo: ele se recupera, mas a bola não conta como gasta', run.fight.balls === 2 && run.fight.state === 'fight');
  damageEnemy(run, boss, boss.maxHp);
  run.fight.ball.t = run.fight.ball.fall;
  run.update(1 / 60, { x: 0, y: 0 });
  run.player.x = run.fight.ball.x; run.player.y = run.fight.ball.y;
  run.fight.rng = () => 0.01;   // os 10%
  run.update(1 / 60, { x: 0, y: 0 });
  for (let i = 0; i < 60 * 10 && run.state === 'legendary'; i++) run.update(1 / 60, { x: 0, y: 0 });
  run.update(1 / 60, { x: 0, y: 0 });
  game._handleRunState();
  check('capturou: a tela de captura do Kyogre, sem Ignorar', game.captureOpen && registry.get('capture-skip').classes.has('hidden'));
  check('...e o card avisa que ele vai para o PC', registry.get('capture-note').innerHTML.includes('vai direto para o PC'));
  const spare = !game.run.team.isFull;
  game.pickCapture('kyogre');
  check('o Kyogre vai sempre para o PC, mesmo com espaço na equipe (0.37.9), revela o "???" e fica fora das 151',
        spare && !game.run.team.has('kyogre') && game.run.pc.some((m) => m.pokemonId === 'kyogre')
        && game.profile.pokedex.secret.includes('kyogre') && !game.profile.pokedex.caught.includes(382) && game.campaign.dive.captured);
  check('a maré final: a vitória espera os 30 s', run.fight.final && run.fight.holding && run.state === 'running');
  run.fight.final.t = 0.01;
  for (let i = 0; i < 10; i++) run.update(1 / 60, { x: 0, y: 0 });
  game._handleRunState();
  check('a maré baixou: a vitória, sem o Modo Livre', run.state === 'victory' && registry.get('btn-result-endless').classes.has('hidden'));
  check('...e com Jogar de novo', !registry.get('btn-result-retry').classes.has('hidden'));
  game.quitToMenu();
  check('a volta é pela lagoa, e a cena do Maxie começa (só conta como vista no fim)', hubVisible() && hub.mapId === 'vila' && hub.player.x === 30 && !!hub.scene
        && !game.campaign.dive.sceneSeen);
  check('...e o Kyogre está no PC da jornada', game.campaign.journey.pc.some((m) => m.pokemonId === 'kyogre')
        && !game.campaign.journey.team.members.some((m) => m.pokemonId === 'kyogre'));
  // o jogo fechou (ou travou) no meio da cena: continuar volta à lagoa, e a cena recomeça (0.37.9)
  for (let i = 0; i < 60 * 3; i++) { if (hub.dialog) { hub.dialog.shown = 999; hub.confirm(); } hub.update(1 / 60); }
  game.continueGame();
  check('fechou no meio da cena: continuar volta à lagoa e a cena recomeça do início', hubVisible() && hub.mapId === 'vila'
        && hub.player.x === 30 && hub.player.y === 11 && hub.scene?.step === 0 && !game.campaign.dive.sceneSeen);
  await game.loadFromFile({ text: async () => JSON.stringify(game.buildSaveData()) });
  check('...e carregar o save também', hubVisible() && hub.mapId === 'vila' && hub.player.x === 30 && hub.scene?.step === 0);
  for (let i = 0; i < 60 * 60 && hub.scene; i++) { if (hub.dialog) { hub.dialog.shown = 999; hub.confirm(); } hub.update(1 / 60); }
  check('a cena acaba, devolve o controle e conta como vista (uma vez por jornada)', !hub.scene && !hub.dialog && game.campaign.dive.sceneSeen);
  game.continueGame();
  check('vista a cena, continuar volta à frente de casa, sem cena', hubVisible() && !hub.scene && hub.mapId === 'vila' && hub.player.x !== 30);
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
  check('caiu na luta do Kyogre: a derrota oferece Tentar de novo e Voltar para a vila', game.run?.state === 'defeat'
        && !registry.get('btn-result-retry-defeat').classes.has('hidden') && !registry.get('btn-result-village').classes.has('hidden')
        && registry.get('btn-result-center').classes.has('hidden'));
  registry.get('btn-result-retry-defeat').click();
  check('Tentar de novo: a luta recomeça, sem a descida, com a equipe curada', game.run?.stage.id === 'kyogre' && game.run.state === 'running'
        && game.run.team.members.every((m) => !m.fainted));
  game.run.team.members.forEach((m) => { m.fainted = true; m.hp = 0; });
  game.run.update(1 / 60, { x: 0, y: 0 });
  game._handleRunState();
  registry.get('btn-result-village').click();
  check('Voltar para a vila: acorda no Centro, com a enfermeira', !game.run && hubVisible() && hub.mapId === 'centro' && hub.dialog?.name === 'Enfermeira');
  closeDialog();
  member.abilities = saved;
}

// ---- o Origin Pulse do Kyogre do jogador, desenhado do 1º quadro ao fim (0.37.9) ----
// O anel nasce com raio ~8 e as marcas vermelhas eram traçadas com o raio - 10: o
// canvas lançava erro e o jogo travava no 1º golpe (o bug do Kyogre do Theo).
{
  const { drawSignatures } = await import('../src/render/signature.js');
  game.campaign.journey = { team: { members: [{ uid: 'kyo', pokemonId: 'kyogre', level: 90, xp: 0, hp: 0,
    abilities: ['origin_pulse', 'water_spout'], upgrades: {} }], active: ['kyo'] }, pc: [] };
  game.startStage('gym_1_pewter');
  const run = game.run;
  run.spawner.update = () => {};
  run.damageCompanion = () => {};
  run.progression.addXp = () => {};
  const ctx = stubCtx();
  let pulses = 0, error = null;
  for (let i = 0; i < 60 * 8 && !error; i++) {
    if (run.enemies.filter((e) => !e.dead).length < 4) run.spawner.spawnAt('rattata', run.player.x + 140, run.player.y + 20, 5);
    run.update(1 / 60, { x: 0, y: 0 });
    pulses += run.signatures.filter((s) => s.kind === 'origin_pulse' && s.age <= 1 / 60 + 1e-9).length;
    try { drawSignatures(ctx, run); game.renderer.render(run); } catch (err) { error = err; }
  }
  check('o Origin Pulse do Kyogre em campo é desenhado do 1º quadro ao fim, sem erro', pulses >= 2 && !error,
        error ? error.message : `${pulses} disparos`);
  game.quitToMenu();
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

// ---- as quests de uma jornada de antes delas (0.38): o doneIf põe em dia, em silêncio ----
{
  const { QuestSystem } = await import('../src/systems/QuestSystem.js');
  const questsFor = (campaign) => new QuestSystem({
    campaign: () => campaign,
    context: () => ({ starter: !!campaign.starter, mapSeen: !!campaign.hub?.flags?.mapa_visto, cleared: campaign.clearedStages })
  });
  const veteran = { starter: 'squirtle', clearedStages: ['gym_1_pewter'], hub: { flags: { mapa_visto: true } } };
  const qv = questsFor(veteran);
  qv.sync();
  check('quem já venceu o Brock antes das quests não volta ao "Fale com a mãe": o prólogo e o Brock fecham em silêncio',
        ['p_mae', 'p_lab', 'p_carvalho', 'p_mapa', 'c1_brock'].every((id) => veteran.quests.done[id]?.skipped));
  check('...e, como não vai ver a cena do Brock, a quest da Misty abre direto', qv.isActive('c2_misty') && veteran.quests.active.length === 1);
  const vetMisty = { starter: 'squirtle', clearedStages: ['gym_1_pewter', 'gym_2_cerulean'], hub: { flags: { mapa_visto: true } } };
  const qm = questsFor(vetMisty);
  qm.sync();
  check('quem já venceu a Misty antes das cenas fica com a vitória marcada, esperando a pista (rejoga a fase para ouvir a Misty)',
        qm.isActive('c2_misty') && vetMisty.quests.progress.c2_misty?.[0] === 1 && !vetMisty.quests.progress.c2_misty?.[1]);
  const vetSurge = { starter: 'squirtle', clearedStages: ['gym_1_pewter', 'gym_2_cerulean', 'gym_3_vermilion'], hub: { flags: { mapa_visto: true } } };
  const qs = questsFor(vetSurge);
  qs.sync();
  check('quem já passou do Surge fecha a da Misty em silêncio e cai na do Surge, com a vitória marcada',
        vetSurge.quests.done.c2_misty?.skipped && qs.isActive('c2_surge') && vetSurge.quests.progress.c2_surge?.[0] === 1);
  const fresh = { starter: 'squirtle', clearedStages: [], hub: { flags: {} } };
  const qf = questsFor(fresh);
  qf.sync();
  check('quem tem o inicial mas nunca abriu o mapa cai no "Abra o Mapa da Jornada"', qf.isActive('p_mapa') && !qf.isDone('c1_brock'));
  check('...e o evento fecha a quest com a comemoração', qf.notify('map').includes('p_mapa') && qf.isActive('c1_brock'));
  const before = { starter: null, clearedStages: [], hub: null };
  const qb = questsFor(before);
  qb.sync();
  check('sem o inicial, a jornada fica no começo do prólogo', qb.isActive('p_mae') && qb.tracked()[0]?.objectives[0].text === 'Fale com a mãe');
  check('evento de outro alvo não conta', !qb.notify('talk', 'tv').length && qb.isActive('p_mae'));
}

console.log(`\n=== ${failures === 0 ? 'TUDO OK' : failures + ' FALHA(S)'} ===\n`);
process.exit(failures ? 1 : 0);
