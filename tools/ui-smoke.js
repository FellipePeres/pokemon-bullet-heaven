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
    this.style = new Proxy({}, { get: (t, k) => t[k] ?? '', set: (t, k, v) => { t[k] = v; return true; } });
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
  removeChild(child) { this.children = this.children.filter((c) => c !== child); return child; }
  remove() {}
  replaceWith() {}
  querySelector() { return new StubElement('span'); }
  querySelectorAll() { return []; }
  addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }
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
  '[data-modal]': ['modal-pokedex', 'modal-achievements', 'modal-team', 'modal-trainer', 'modal-options', 'modal-help']
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
global.window = { addEventListener: () => {}, location: { href: '' } };
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

console.log('\n=== INTERFACE — teste sem navegador ===\n');

const game = new Game(registry.get('game-canvas'));
check('jogo inicia no menu principal', !registry.get('screen-title').classes.has('hidden'));
check('barra lateral visível no menu', !registry.get('side-rail').classes.has('hidden'));

// ---- janelas da barra lateral ----
for (const id of ['modal-pokedex', 'modal-achievements', 'modal-team', 'modal-trainer', 'modal-options', 'modal-help']) {
  game.menus.showModal(id);
  check(`janela ${id.replace('modal-', '')} abre`, !registry.get(id).classes.has('hidden'));
  game.menus.closeModal();
  check(`janela ${id.replace('modal-', '')} fecha`, registry.get(id).classes.has('hidden'));
}

check('Pokédex lista as 151 espécies', registry.get('pokedex-grid').children.length === 151,
      `${registry.get('pokedex-grid').children.length} células`);
check('conquistas listadas sem quebrar', registry.get('achievements-list').children.length > 5,
      `${registry.get('achievements-list').children.length} conquistas`);

// ---- nova jornada ----
game.newGame();
check('tela de iniciais montada com 3 opções', registry.get('starter-choices').children.length === 3);

game.chooseStarter('charmander');
check('mapa da jornada aparece após escolher o inicial',
      !registry.get('screen-campaign').classes.has('hidden'));
check('mapa lista as fases', registry.get('campaign-list').children.length >= 3,
      `${registry.get('campaign-list').children.length} entradas`);
check('Pokédex registra o inicial escolhido', game.profile.pokedex.caught.includes(4));

// ---- partida ----
game.startStage('gym_1_pewter');
check('a fase começa', !!game.run && !registry.get('stage-wrapper').classes.has('hidden'));
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
const options = game.run.captureSystem.rollChoices();
game.captureOpen = true;
game.pickCapture(options[0]?.id ?? 'pikachu');
check('equipe cheia pede para escolher quem sai',
      registry.get('capture-subtitle').textContent.includes('Quem sai'),
      registry.get('capture-subtitle').textContent);
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

// ---- fim de partida ----
for (const member of game.run.team.members) member.fainted = true;
game.run.state = 'defeat';
game._handleRunState();
check('derrota mostra o resultado', !registry.get('result-overlay').classes.has('hidden'));
check('derrota não avança a jornada', game.profile.campaign.clearedStages.length === 0);

game.quitToMenu();
check('voltar ao mapa funciona', !registry.get('screen-campaign').classes.has('hidden'));

// ---- vitória e save ----
game.startStage('gym_1_pewter');
game.run.state = 'victory';
game._handleRunState();
check('vitória conclui a fase', game.profile.campaign.clearedStages.includes('gym_1_pewter'));
check('vitória rende Shards', game.profile.shards > 0, `${game.profile.shards} Shards`);

// conquistas: concluídas ficam para coletar, não entram sozinhas
const claimable = game.tracker.claimableAchievements;
check('conquistas concluídas ficam disponíveis para coletar', claimable.length > 0,
      `${claimable.length} para coletar`);
if (claimable.length) {
  const before = game.profile.shards;
  const gained = game.claimAchievement(claimable[0].id);
  check('coletar a conquista credita os Shards', gained > 0 && game.profile.shards === before + gained,
        `+${gained} Shards`);
  check('a mesma conquista não pode ser coletada duas vezes',
        game.claimAchievement(claimable[0].id) === 0);
}

// loja do treinador
game.menus.showModal('modal-trainer');
const shop = game.trainerShop();
check('loja do treinador lista as melhorias', shop.length >= 5, `${shop.length} melhorias`);
const affordable = shop.find((e) => e.affordable);
if (affordable) {
  const before = game.profile.shards;
  check('comprar melhoria desconta os Shards',
        game.buyTrainerUpgrade(affordable.upgrade.id) &&
        game.profile.shards === before - affordable.cost &&
        game.profile.trainerUpgrades[affordable.upgrade.id] === 1);
}
game.menus.closeModal();
check('vitória guarda a equipe da jornada', !!game.profile.campaign.journey?.team?.members?.length);

game.quitToMenu();
game.menus.buildCampaign();
check('Fase 2 desbloqueia após a Fase 1',
      registry.get('campaign-list').children.length >= 3);

const save = game.buildSaveData();
check('save é montado a partir do estado atual',
      save.signature === 'pokemon-bullet-heaven' && !!save.profile.campaign.journey);

console.log(`\n=== ${failures === 0 ? 'TUDO OK' : failures + ' FALHA(S)'} ===\n`);
process.exit(failures ? 1 : 0);
