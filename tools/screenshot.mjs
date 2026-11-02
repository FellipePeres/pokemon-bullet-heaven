/**
 * SCREENSHOTS — abre o jogo no Chrome (ou no Edge) sem janela, executa um
 * roteiro e salva as imagens. Serve para conferir o visual sem depender de
 * alguém abrir o navegador, e lista os erros de JavaScript da página.
 *
 * Uso:
 *   node tools/screenshot.mjs <roteiro> [--out pasta] [--size 1280x720]
 *
 * Roteiros: vitrine, treinador, jornada, opcoes, partida (ver ROTEIROS abaixo).
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
  ]
};

/** Antes de cada foto da partida: fecha telas de melhoria, captura e evolução. */
const SETTLE = `typeof game !== 'undefined' && game.run && (() => {
  if (game.levelUpOpen) game.pickUpgrade(game.run.progression.rollChoices(game.run.levelUpMember)[0].id);
  if (game.captureOpen) game.resolveCapture();
  if (game.evolutionOpen) game.closeEvolution();
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
      } else if (step.hold) {
        await evaluate(`game.input.keys.clear(); ${JSON.stringify(step.hold)}.forEach((k) => game.input.keys.add(k))`);
      } else if (step.shot) {
        await evaluate(SETTLE);
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
