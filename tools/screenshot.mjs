/**
 * SCREENSHOTS — abre o jogo no Chrome (ou no Edge) sem janela, executa um
 * roteiro e salva as imagens. Serve para conferir o visual sem depender de
 * alguém abrir o navegador, e lista os erros de JavaScript da página.
 *
 * Uso:
 *   node tools/screenshot.mjs <roteiro> [--out pasta] [--size 1280x720]
 *
 * Roteiros: vitrine, treinador, jornada, opcoes, partida, golpes, estresse,
 * chefe, cenario e outros (ver ROTEIROS abaixo).
 * Sem --out, as imagens vão para a pasta temporária do sistema (pbh-screens).
 * Para usar outro navegador: variável de ambiente CHROME_PATH.
 *
 * Sem dependências: um servidor estático do próprio Node e o protocolo de
 * depuração do Chrome (DevTools Protocol) pelo WebSocket nativo do Node 22.
 * Cada execução usa um perfil novo do navegador, então o jogo começa sem save.
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Começa a jornada até a fase, pulando as telas de escolha. */
const START_RUN = "game.newGame(); game.chooseTrainer('red'); game.chooseStarter('bulbasaur'); game.startStage('gym_1_pewter')";

const ROTEIROS = {
  vitrine: [
    { open: 'vitrine.html' }, { wait: 1500 }, { shot: 'vitrine' }
  ],
  treinador: [
    { open: 'index.html' }, { wait: 500 },
    { run: 'game.newGame()' }, { wait: 900 }, { shot: 'tela-treinador' }
  ],
  jornada: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('leaf'); game.chooseStarter('charmander')" },
    { wait: 1200 }, { shot: 'jornada' }
  ],
  opcoes: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.menus.showModal('modal-options')" }, { wait: 700 }, { shot: 'opcoes' }
  ],
  partida: [
    { open: 'index.html' }, { wait: 500 },
    { run: START_RUN }, { wait: 1200 },
    { hold: ['KeyD'] }, { wait: 800 }, { shot: 'partida-direita' },
    { hold: ['KeyW', 'KeyD'] }, { wait: 600 }, { shot: 'partida-diagonal' },
    { hold: ['KeyS'] }, { wait: 600 }, { shot: 'partida-baixo' },
    { hold: [] }, { wait: 400 }, { shot: 'partida-parado' }
  ],
  // a apresentação do líder (o Lt. Surge, na Fase 3)
  lider: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('red'); game.chooseStarter('pikachu' in {} ? 'pikachu' : 'charmander');" +
           "['gym_1_pewter','gym_2_cerulean'].forEach((s) => game.campaign.clearedStages.push(s)); game.startStage('gym_3_vermilion')" },
    { wait: 300 }, { run: 'game.run.time = game.run.stage.duration + 0.2' }, { wait: 6500 }, { shot: 'lider', raw: true }
  ],
  // o controle nas telas: o 1º direcional mostra o foco, o 2º vai para a Menina; A confirma
  controle: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); ['right', 'right', 'a'].forEach((b) => game.handleAction('pad:' + b))" }, { wait: 300 },
    { log: 'game.profile.trainer' },
    { run: "['a', 'a'].forEach((b) => game.handleAction('pad:' + b))" }, { wait: 400 },
    { log: 'game.campaign.starter' }, { shot: 'controle' }
  ],
  // vencer o Campeão: o Hall da Fama com a equipe campeã
  hall: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('leaf'); game.chooseStarter('bulbasaur');" +
           "game.region.campaign.slice(0, -1).forEach((e) => game.campaign.clearedStages.push(e.stage));" +
           "game.startStage('champion'); game.run.team.members[0].pokemonId = 'venusaur'; game.run.team.members[0].level = 61;" +
           "[['pikachu', 58], ['lapras', 57], ['gengar', 59], ['dragonite', 60], ['snorlax', 58]].forEach(([id, lv]) => game.run.team.add(id, lv));" +
           "game.run.state = 'victory'" },
    { wait: 4500 }, { shot: 'hall', raw: true }
  ],
  // a jornada inteira liberada (página alta: use --size 1366x2600)
  campanha: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('leaf'); game.chooseStarter('squirtle');" +
           "game.region.campaign.slice(0, -1).forEach((e) => game.campaign.clearedStages.push(e.stage)); game.openCampaign()" },
    { wait: 1500 }, { shot: 'campanha' }
  ],
  // uma fase nova (Torre Pokémon) com uma equipe forte, para ver a horda e os golpes
  fase5: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('red'); game.chooseStarter('charmander');" +
           "['gym_1_pewter','gym_2_cerulean','gym_3_vermilion','gym_4_celadon'].forEach((s) => game.campaign.clearedStages.push(s));" +
           "game.startStage('gym_5_fuchsia');" +
           "game.run.team.members[0].level = 36; ['gengar', 'blastoise', 'jolteon'].forEach((id) => game.run.team.add(id, 36));" +
           "game.run.team.members.forEach((m) => { m.hp = 9999; }); game.run.refreshStats()" },
    { wait: 6000 }, { shot: 'fase5' }
  ],
  // os 52 golpes, 6 por foto, numa partida de verdade (vitrine.html?golpes=N)
  golpes: Array.from({ length: 9 }, (_, i) => [
    { open: `vitrine.html?golpes=${i}` }, { wait: 1600 }, { shot: `golpes-${i}` }
  ]).flat(),
  // ~250 inimigos e golpes pesados: imprime FPS e milissegundos por quadro
  estresse: [
    { open: 'vitrine.html?estresse' }, { wait: 5000 },
    { log: 'JSON.stringify(window.vitrineStats)' }, { shot: 'estresse' }
  ],
  // os cenários de metatiles do FireRed, um por foto, na partida de verdade
  cenario: [
    { open: 'index.html' }, { wait: 500 },
    { run: START_RUN }, { wait: 1800 }, { shot: 'cenario-rota' },
    ...['forest', 'cave', 'pewter_gym', 'cerulean_gym', 'celadon_gym', 'saffron_gym', 'lorelei_room', 'champion_room'].flatMap((scene) => [
      { run: `game.run.world.scene = '${scene}'` }, { wait: 1800 }, { shot: `cenario-${scene}` }
    ])
  ],
  // capturar na Fase 2 com a equipe já crescida: quem entra aparece em campo e no HUD
  captura: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('leaf'); game.chooseStarter('charmander');" +
           "game.campaign.clearedStages.push('gym_1_pewter'); game.startStage('gym_2_cerulean');" +
           "game.run.team.members[0].level = 18; game.run.team.add('pidgey', 16); game.run.refreshStats()" },
    { wait: 1500 }, { run: "game.run.state = 'capture'; game.captureOpen = true; game.pickCapture('clefairy')" },
    { wait: 2500 }, { shot: 'captura' },
    { log: "JSON.stringify(game.run.team.members.map((m) => [m.pokemonId, m.level, Math.round(m.hp), m.fainted]))" },
    { wait: 4000 }, { shot: 'captura-depois' },
    { log: "JSON.stringify(game.run.team.members.map((m) => [m.pokemonId, m.level, Math.round(m.hp), m.fainted]))" }
  ],
  // a tela de título: sem save, com o cursor descendo, e com uma jornada salva
  titulo: [
    { open: 'index.html' }, { wait: 1500 }, { shot: 'titulo' },
    { key: 'ArrowDown' }, { key: 'ArrowDown' }, { wait: 300 }, { shot: 'titulo-cursor' },
    { run: "game.newGame(); game.chooseTrainer('red'); game.chooseStarter('squirtle'); game.campaign.clearedStages.push('gym_1_pewter'); game.menus.show('screen-title')" },
    { wait: 900 }, { shot: 'titulo-com-save' }
  ],
  // o PC do lobby (equipe de 6 e 3 guardados) e a tela de equipe cheia na partida
  pc: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('leaf'); game.chooseStarter('bulbasaur'); game.campaign.clearedStages.push('gym_1_pewter', 'gym_2_cerulean');" +
           "import('./src/game/Run.js').then(({ Run }) => { const r = new Run('gym_3_vermilion', { starter: 'bulbasaur' });" +
           "['pidgey', 'pikachu', 'geodude', 'oddish', 'zubat'].forEach((id) => r.team.add(id, 22)); r.team.members[0].level = 24;" +
           "r.captureSystem.captureToPC('meowth'); r.captureSystem.captureToPC('psyduck'); r.captureSystem.captureToPC('growlithe');" +
           "game.campaign.journey = { team: r.team.serialize(), pc: r.pc }; game.openCampaign(); })" },
    { wait: 1200 }, { shot: 'pc-lobby' },
    { run: "game.menus.showModal('modal-pc')" }, { wait: 700 }, { shot: 'pc-modal' },
    { run: "{ const pc = game.menus.pcScreen; pc.aim = { area: 'box', slot: 1 }; pc.render() }" }, { wait: 400 }, { shot: 'pc-apontando' },
    { run: "{ const pc = game.menus.pcScreen; pc.act({ area: 'box', slot: 1 }); pc.aim = { area: 'team', index: 2 }; pc.render() }" }, { wait: 400 }, { shot: 'pc-trocando' },
    { run: "{ const pc = game.menus.pcScreen; pc.aim = { area: 'box', slot: 7 }; pc.render() }" }, { wait: 400 }, { shot: 'pc-soltando' },
    { run: "{ const pc = game.menus.pcScreen; pc.act({ area: 'team', index: 2 }); pc.flip(1) }" }, { wait: 400 }, { shot: 'pc-caixa-2' },
    { run: "game.menus.closeModal(); game.startStage('gym_3_vermilion')" }, { wait: 1500 },
    { run: "game.run.state = 'capture'; game.captureOpen = true; game.pickCapture('meowth')" }, { wait: 800 }, { shot: 'pc-captura', raw: true }
  ],
  // a Poké Ball com a equipe cheia (0.12): o aviso de que nada se perde e o "onde ele fica"
  'captura-cheia': [
    { open: 'index.html' }, { wait: 500 },
    { run: START_RUN }, { wait: 1500 },
    { run: "['pidgey', 'rattata', 'caterpie', 'weedle', 'spearow'].forEach((id) => game.run.team.add(id, 8)); game.run.pendingBall = true; game.run.state = 'capture'; game.openCapture()" },
    { wait: 900 }, { shot: 'captura-cheia-1-opcoes', raw: true },
    { run: "game.pickCapture(game.run.captureSystem.rollChoices()[0].id)" }, { wait: 900 }, { shot: 'captura-cheia-2-onde-fica', raw: true },
    { run: "game.resolveCapture(); game.run.team.members.splice(3); game.run.pendingBall = true; game.run.state = 'capture'; game.openCapture()" },
    { wait: 900 }, { shot: 'captura-cheia-3-com-vaga', raw: true }
  ],
  // a derrota: as duas saídas, o aviso de recomeçar do zero e o Centro Pokémon
  derrota: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('red'); game.chooseStarter('charmander'); game.campaign.clearedStages.push('gym_1_pewter');" +
           "import('./src/game/Run.js').then(({ Run }) => { const r = new Run('gym_1_pewter', { starter: 'charmander' });" +
           "['pidgey', 'nidoran_m'].forEach((id) => r.team.add(id, 12)); r.team.members[0].level = 15;" +
           "game.campaign.journey = { team: r.team.serialize(), pc: [] }; game.startStage('gym_2_cerulean');" +
           "game.run.captureSystem.capture('clefairy'); game.run.team.members.forEach((m) => { m.fainted = true; m.hp = 0; }); game.run.state = 'defeat'; })" },
    { wait: 1500 }, { shot: 'derrota-1-escolha', raw: true },
    { run: "document.getElementById('btn-result-restart').click()" }, { wait: 400 }, { shot: 'derrota-2-confirmar', raw: true },
    { run: "document.getElementById('btn-restart-no').click(); document.getElementById('btn-result-center').click()" },
    { wait: 1200 }, { shot: 'derrota-3-centro', raw: true },
    { run: "document.getElementById('btn-center-go').click()" }, { wait: 900 }, { shot: 'derrota-4-de-volta', raw: true }
  ],
  // as conquistas em níveis, com algumas prontas para coletar e outras já subidas de degrau
  conquistas: [
    { open: 'index.html' }, { wait: 500 },
    { run: "Object.assign(game.profile.stats, { totalCaptures: 12, totalKills: 640, runsPlayed: 6, stagesCleared: 2, badges: 2, maxRunLevel: 24, evolutions: 3 }); game.profile.achievements.tiers = { catcher: 1, hunter: 1, runs: 1 }; game.menus.showModal('modal-achievements')" },
    { wait: 800 }, { shot: 'conquistas' }
  ],
  // todas as telas, uma por foto: para conferir o visual (use antes e depois de mexer no CSS)
  telas: [
    { open: 'index.html' }, { wait: 1200 }, { shot: 'tela-01-titulo' },
    { run: 'game.newGame()' }, { wait: 900 }, { shot: 'tela-02-treinador' },
    { run: "game.chooseTrainer('leaf')" }, { wait: 900 }, { shot: 'tela-03-inicial' },
    { run: "game.chooseStarter('bulbasaur'); ['gym_1_pewter', 'gym_2_cerulean'].forEach((s) => game.campaign.clearedStages.push(s)); game.openCampaign()" },
    { wait: 1200 }, { shot: 'tela-04-jornada' },
    { run: "game.menus.showModal('modal-options')" }, { wait: 500 }, { shot: 'tela-05-opcoes' },
    { run: "game.menus.closeModal(); game.menus.showModal('modal-pokedex')" }, { wait: 800 }, { shot: 'tela-06-pokedex' },
    { run: "game.menus.closeModal(); game.menus.showModal('modal-trainer')" }, { wait: 500 }, { shot: 'tela-07-treinador-loja' },
    { run: "game.menus.closeModal(); game.menus.showModal('modal-achievements')" }, { wait: 500 }, { shot: 'tela-07b-conquistas' },
    { run: "game.menus.closeModal(); game.menus.showModal('modal-help')" }, { wait: 500 }, { shot: 'tela-07c-ajuda' },
    { run: "game.menus.closeModal(); game.startStage('gym_3_vermilion')" }, { wait: 1500 }, { shot: 'tela-08-partida', raw: true },
    { run: "const m = game.run.team.members[0]; m.pendingLevels = 1; game.openLevelUpFor(m)" }, { wait: 600 }, { shot: 'tela-09-nivel', raw: true },
    { run: "game.pickUpgrade(game.run.progression.rollChoices(game.run.levelUpMember)[0].id); game.run.state = 'capture'; game.captureOpen = true; game.hud.showCapture(game.run.captureSystem.rollChoices(), (id) => game.pickCapture(id))" },
    { wait: 700 }, { shot: 'tela-10-captura', raw: true },
    { run: 'game.resolveCapture(); game.togglePause()' }, { wait: 500 }, { shot: 'tela-11-pausa', raw: true }
  ],
  // o HUD da equipe: espadinha (atacar ou só acompanhar), selo de quem sai e a troca
  equipe: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('red'); game.chooseStarter('squirtle');" +
           "game.campaign.clearedStages.push('gym_1_pewter'); game.startStage('gym_2_cerulean');" +
           "['pidgey', 'clefairy', 'rattata', 'zubat'].forEach((id) => game.run.captureSystem.capture(id));" +
           "game.run.team.toggleAttack(game.run.team.active[2].uid); game.run.team.selectedSlot = 1; game.hud.signature = ''" },
    { wait: 2500 }, { shot: 'equipe' },
    { run: "game.run.team.swapIn(game.run.team.reserve[0].uid); game.hud.signature = ''" }, { wait: 600 },
    { log: "JSON.stringify(game.run.team.active.map((m) => m && [m.pokemonId, m.level, m.attack]))" },
    { shot: 'equipe-trocou' }
  ],
  // Poké Ball e Ímã no chão; depois o Ímã puxando o XP do mapa
  itens: [
    { open: 'index.html' }, { wait: 500 },
    { run: START_RUN }, { wait: 1200 },
    { run: "import('./src/entities/Pickup.js').then(({ Pickup }) => { const r = game.run, p = r.player;" +
           "r.spawner.update = () => {}; r.enemies.length = 0;" +
           "r.pickups.push(new Pickup('ball', p.x - 260, p.y - 40), new Pickup('magnet', p.x + 160, p.y + 10), new Pickup('heal', p.x - 120, p.y + 110, 28));" +
           "for (let i = 0; i < 40; i++) r.pickups.push(new Pickup('xp', p.x + Math.cos(i) * (200 + i * 12), p.y + Math.sin(i * 1.7) * (150 + i * 8), 2)); })" },
    { wait: 700 }, { shot: 'itens-chao' },
    { run: "game.run.pickups.find((x) => x.kind === 'magnet').x = game.run.player.x" }, { wait: 260 }, { shot: 'itens-ima', raw: true }
  ],
  // o líder entra e, antes de cada golpe, aparece o aviso no chão
  chefe: [
    { open: 'index.html' }, { wait: 500 },
    { run: START_RUN }, { wait: 300 },
    { run: 'game.run.time = game.run.stage.duration + 0.5' }, { wait: 2500 },
    // força o golpe do líder agora: primeiro o aviso, depois a onda
    { run: 'game.run.boss.abilities.forEach((a) => { a.timer = 0; })' }, { wait: 350 }, { shot: 'chefe-aviso' },
    { wait: 650 }, { shot: 'chefe-onda' }
  ]
};

/** Códigos de tecla do Windows para as teclas que os roteiros apertam. */
const KEY_CODES = { ArrowUp: 38, ArrowDown: 40, Enter: 13, Escape: 27 };

/** Antes de cada foto da partida: fecha telas de melhoria, captura e evolução. */
const SETTLE = `typeof game !== 'undefined' && game.run && (() => {
  if (game.levelUpOpen) game.pickUpgrade(game.run.progression.rollChoices(game.run.levelUpMember)[0].id);
  if (game.captureOpen) game.resolveCapture();
  if (game.evolutionOpen) game.closeEvolution();
  if (game.introOpen) game.closeLeaderIntro();
})()`;

const BROWSERS = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser'
].filter(Boolean);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ogg': 'audio/ogg'
};

const delay = (ms) => new Promise((done) => setTimeout(done, ms));

/** Servidor estático do repositório numa porta livre. */
function serve() {
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://local').pathname);
    if (path === '/favicon.ico') { res.writeHead(204).end(); return; }   // o jogo não tem ícone
    const file = normalize(join(ROOT, path === '/' ? 'index.html' : path));
    try {
      if (!file.startsWith(ROOT + sep) || !statSync(file).isFile()) throw new Error('fora');
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(readFileSync(file));
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((done) => server.listen(0, '127.0.0.1', () => done(server)));
}

/** Cliente mínimo do DevTools Protocol. */
class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.nextId = 0;
    this.pending = new Map();
    this.listeners = [];
    this.ready = new Promise((done, fail) => {
      this.ws.onopen = done;
      this.ws.onerror = () => fail(new Error('não conectou ao navegador'));
    });
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const call = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) call.fail(new Error(`${call.method}: ${msg.error.message}`));
        else call.done(msg.result);
      } else {
        for (const listener of [...this.listeners]) listener(msg);
      }
    };
  }

  send(method, params = {}, sessionId) {
    const id = ++this.nextId;
    this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    return new Promise((done, fail) => this.pending.set(id, { done, fail, method }));
  }

  on(listener) {
    this.listeners.push(listener);
  }

  once(method) {
    return new Promise((done) => {
      const listener = (msg) => {
        if (msg.method !== method) return;
        this.listeners = this.listeners.filter((l) => l !== listener);
        done(msg.params);
      };
      this.listeners.push(listener);
    });
  }
}

/** O navegador escreve a porta de depuração neste arquivo do perfil. */
async function devtoolsUrl(profileDir) {
  const file = join(profileDir, 'DevToolsActivePort');
  for (let i = 0; i < 150; i++) {
    if (existsSync(file)) {
      const [port, path] = readFileSync(file, 'utf8').trim().split('\n');
      if (path) return `ws://127.0.0.1:${port}${path.trim()}`;
    }
    await delay(100);
  }
  throw new Error('o navegador não abriu a porta de depuração');
}

function parseArgs(argv) {
  const args = { name: 'vitrine', out: join(tmpdir(), 'pbh-screens'), width: 1280, height: 720 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') args.out = resolve(argv[++i]);
    else if (argv[i] === '--size') [args.width, args.height] = argv[++i].split('x').map(Number);
    else args.name = argv[i];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const steps = ROTEIROS[args.name];
  if (!steps) {
    console.error(`Roteiro desconhecido: ${args.name}. Use: ${Object.keys(ROTEIROS).join(', ')}`);
    process.exit(2);
  }
  const browserPath = BROWSERS.find((path) => existsSync(path));
  if (!browserPath) {
    console.error('Não achei Chrome nem Edge. Informe o caminho em CHROME_PATH.');
    process.exit(2);
  }
  mkdirSync(args.out, { recursive: true });

  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const profileDir = mkdtempSync(join(tmpdir(), 'pbh-chrome-'));
  const browser = spawn(browserPath, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profileDir}`,
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio',
    `--window-size=${args.width},${args.height}`, 'about:blank'
  ], { stdio: 'ignore' });

  const errors = [];
  try {
    const cdp = new Cdp(await devtoolsUrl(profileDir));
    await cdp.ready;
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    const page = (method, params) => cdp.send(method, params, sessionId);

    cdp.on((msg) => {
      if (msg.sessionId !== sessionId) return;
      const p = msg.params;
      if (msg.method === 'Runtime.exceptionThrown') {
        errors.push(p.exceptionDetails.exception?.description ?? p.exceptionDetails.text);
      } else if (msg.method === 'Runtime.consoleAPICalled' && p.type === 'error') {
        errors.push(p.args.map((a) => a.value ?? a.description).join(' '));
      } else if (msg.method === 'Log.entryAdded' && p.entry.level === 'error') {
        errors.push(`${p.entry.text}${p.entry.url ? ` (${p.entry.url})` : ''}`);
      }
    });
    await page('Page.enable');
    await page('Runtime.enable');
    await page('Log.enable');
    await page('Emulation.setDeviceMetricsOverride', {
      width: args.width, height: args.height, deviceScaleFactor: 1, mobile: false
    });

    const evaluate = async (expression) => {
      const result = await page('Runtime.evaluate', { expression, awaitPromise: true });
      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
      }
      return result.result?.value;
    };

    for (const step of steps) {
      if (step.open) {
        const loaded = cdp.once('Page.loadEventFired');
        await page('Page.navigate', { url: base + step.open });
        await loaded;
      } else if (step.wait) {
        await delay(step.wait);
      } else if (step.run) {
        await evaluate(step.run);
      } else if (step.log) {
        console.log(`${step.log} => ${await evaluate(step.log)}`);
      } else if (step.key) {
        // uma tecla de verdade, apertada e solta (menus que ouvem keydown)
        for (const type of ['keyDown', 'keyUp']) {
          await page('Input.dispatchKeyEvent', { type, key: step.key, code: step.key, windowsVirtualKeyCode: KEY_CODES[step.key] ?? 0 });
        }
      } else if (step.hold) {
        await evaluate(`game.input.keys.clear(); ${JSON.stringify(step.hold)}.forEach((k) => game.input.keys.add(k))`);
      } else if (step.shot) {
        if (!step.raw) await evaluate(SETTLE);   // raw: fotografa a tela como está
        const { data } = await page('Page.captureScreenshot', { format: 'png' });
        const file = join(args.out, `${step.shot}.png`);
        writeFileSync(file, Buffer.from(data, 'base64'));
        console.log(file);
      }
    }
    await cdp.send('Browser.close').catch(() => {});
  } finally {
    browser.kill();
    server.close();
    await delay(300);
    rmSync(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }

  if (errors.length) {
    console.log(`\nErros da página (${errors.length}):`);
    for (const error of [...new Set(errors)]) console.log(`  - ${error}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
