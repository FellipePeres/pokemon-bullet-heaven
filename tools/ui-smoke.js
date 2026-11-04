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
check('nova jornada começa pela escolha de treinador', !registry.get('screen-trainer').classes.has('hidden'));
check('tela de treinador oferece menino e menina', registry.get('trainer-choices').children.length === 2,
      `${registry.get('trainer-choices').children.length} modelos`);
game.chooseTrainer('leaf');
check('escolher o treinador grava no perfil e segue para o inicial',
      game.profile.trainer === 'leaf' && !registry.get('screen-starter').classes.has('hidden'));
check('tela de iniciais montada com 3 opções', registry.get('starter-choices').children.length === 3);

game.chooseStarter('charmander');
check('mapa da jornada aparece após escolher o inicial',
      !registry.get('screen-campaign').classes.has('hidden'));
const mapNodes = () => registry.get('lobby-map').children.filter((c) => c.classes.has('map-node'));
check('o lobby mostra o Town Map com uma marca por cidade (8 ginásios e a Liga)', mapNodes().length === 9,
      `${mapNodes().length} marcas`);
check('ao entrar, a próxima fase já vem escolhida no painel',
      game.menus.lobby.selected === 'gym_1_pewter' && mapNodes().filter((c) => c.classes.has('next')).length === 1);
check('Pokédex registra o inicial escolhido', game.profile.pokedex.caught.includes(4));

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
game.closeLeaderIntro();
check('"Lutar!" fecha a apresentação e a partida volta',
      game.run.state === 'running' && registry.get('leader-overlay').classes.has('hidden'));

// ---- fim de partida ----
for (const member of game.run.team.members) member.fainted = true;
game.run.state = 'defeat';
game._handleRunState();
check('derrota mostra o resultado', !registry.get('result-overlay').classes.has('hidden'));
check('derrota não avança a jornada', game.campaign.clearedStages.length === 0);
check('derrota oferece o Centro Pokémon e recomeçar a jornada',
      !registry.get('result-defeat').classes.has('hidden') && registry.get('result-victory').classes.has('hidden'));
registry.get('btn-result-center').click();
check('o Centro Pokémon mostra a equipe curada',
      game.centerOpen && !registry.get('center-overlay').classes.has('hidden') &&
      registry.get('result-overlay').classes.has('hidden') && registry.get('center-team').children.length >= 1);
registry.get('btn-center-go').click();
check('do Centro Pokémon a fase recomeça com a equipe curada',
      !game.centerOpen && registry.get('center-overlay').classes.has('hidden') &&
      game.run?.stage.id === 'gym_1_pewter' && game.run.time === 0 &&
      game.run.team.members.every((m) => !m.fainted && m.hp > 0));

game.quitToMenu();
check('voltar ao mapa funciona', !registry.get('screen-campaign').classes.has('hidden'));

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
check('vitória guarda a equipe da jornada', !!game.campaign.journey?.team?.members?.length);

// ---- o PC (0.12): a tela do FireRed, pegar e soltar ----
const pcJourney = game.campaign.journey;
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
registry.get('hall-close').click();
check('fechar o Hall da Fama volta para a jornada',
      registry.get('hall-overlay').classes.has('hidden') && !registry.get('screen-campaign').classes.has('hidden'));
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
check('depois da escolha, o Continuar segue para a jornada',
      game.profile.trainer === 'red' && !registry.get('screen-campaign').classes.has('hidden'));

// ---- derrota → Centro Pokémon → mapa da jornada ----
game.startStage('gym_1_pewter');
for (const member of game.run.team.members) member.fainted = true;
game.run.state = 'defeat';
game._handleRunState();
registry.get('btn-result-center').click();
registry.get('btn-center-map').click();
check('do Centro Pokémon dá para ir ao mapa da jornada',
      !game.centerOpen && !game.run && registry.get('center-overlay').classes.has('hidden') &&
      !registry.get('screen-campaign').classes.has('hidden'));

// ---- derrota → recomeçar a jornada do zero ----
const dexBefore = game.profile.pokedex.caught.length;
game.startStage('gym_1_pewter');
for (const member of game.run.team.members) member.fainted = true;
game.run.state = 'defeat';
game._handleRunState();
registry.get('btn-result-restart').click();
check('recomeçar a jornada pede confirmação antes',
      !registry.get('result-confirm').classes.has('hidden') && registry.get('result-defeat').classes.has('hidden') &&
      !!game.campaign.starter);
registry.get('btn-restart-no').click();
check('"Voltar" desiste de recomeçar',
      registry.get('result-confirm').classes.has('hidden') && !registry.get('result-defeat').classes.has('hidden'));
registry.get('btn-result-restart').click();
registry.get('btn-restart-yes').click();
check('recomeçar apaga a jornada e mantém a Pokédex e o Hall da Fama',
      !game.run && !game.campaign.starter && !game.campaign.journey && game.campaign.badges.length === 0 &&
      game.profile.pokedex.caught.length === dexBefore && game.profile.hallOfFame.length === 1);
check('a jornada nova começa pela escolha de treinador', !registry.get('screen-trainer').classes.has('hidden'));

console.log(`\n=== ${failures === 0 ? 'TUDO OK' : failures + ' FALHA(S)'} ===\n`);
process.exit(failures ? 1 : 0);
