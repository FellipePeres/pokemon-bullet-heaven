/**
 * BALANCEAMENTO — joga a campanha várias vezes com o jogador virtual e mede.
 *
 * Uso:
 *   node tools/balance.mjs [--runs 8] [--starter charmander] [--until gym_2_cerulean]
 *   node tools/balance.mjs --until gym_5_fuchsia --save equipes.json
 *   node tools/balance.mjs --load equipes.json --from gym_6_saffron --until gym_8_viridian
 *   node tools/balance.mjs --runs 24 --jobs 8      (8 processos em paralelo)
 *   node tools/balance.mjs --load equipes.json --from gym_6_saffron --until gym_6_saffron --set gym_6_saffron.difficulty=0.8
 *
 * --save guarda as equipes que venceram a última fase; --load + --from
 * recomeça delas, sem rejogar as fases anteriores (calibrar as finais rápido).
 * --jobs N (0.28) divide as jornadas entre N processos: a mesma medida, N vezes
 * mais rápida (cada jornada continua sendo jogada inteira por um processo só).
 * --tipos (0.32): o bot monta o time pensando em tipos (ver tools/bot.mjs); a
 * diferença para o bot de sempre mostra quanto vale explorar as fraquezas.
 * As missões dos lendários (a história, 0.39) entram no lugar delas: o Zapdos depois da
 * Fase 3, o Articuno depois da 7 e o Moltres depois da 8 (--sem-missoes tira).
 * --teto (o Level Cap): a partida recebe o teto de nível da fase (data/levelCap.js), como
 * no jogo; --teto-mais N soma N a todos os tetos (para calibrar). A coluna "máx" é o
 * nível do Pokémon mais alto ao vencer; "no teto", as vitórias em que alguém chegou nele.
 *
 * Cada jornada joga as fases em ordem, levando a equipe de uma para a outra
 * como no jogo. Desde a 0.17 a derrota também leva o progresso (níveis,
 * melhorias, capturas): a fase é repetida, com a equipe do fim da tentativa,
 * até vencer (no máximo --attempts, padrão 10). Por fase, mostra:
 *   1ª tent.     quantas jornadas venceram a fase de primeira
 *   tentativas   média de tentativas até passar (as paradas contam o máximo)
 *   entrada      média de nível da equipe no começo da tentativa que venceu (é o
 *                "nível recomendado" do lobby: stage.recommendedLevel)
 *   nível        média de nível da equipe ao vencer, e o do ace do líder
 *   luta         quanto tempo o time do líder levou para cair
 *   desmaios     média por tentativa
 *   pico         maior número de inimigos vivos ao mesmo tempo
 *   bolas        Poké Balls que caíram por tentativa (média), e o teto da fase
 *   despertos    quantos da equipe tinham o Golpe Desperto ao vencer (média; 0.33)
 *
 * Alvo (0.17, "forçar o jogador a melhorar os Pokémon para passar"): o bot
 * passa as Fases 1 e 2 em 1–2 tentativas e precisa de ~2–4 nas seguintes,
 * cada vez mais, até a Liga. O Fellipe joga melhor que o bot: o que para o bot
 * é 3 tentativas para ele é 1–2.
 * Regra do projeto: mexa em uma alavanca por vez, meça, repita.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { simulate } from './bot.mjs';
import { STAGES } from '../src/data/stages.js';
import { getRegion } from '../src/data/regions.js';
import { getEnemy } from '../src/data/enemies.js';
import { isBonusMove } from '../src/data/bonusMoves.js';
import { LEVEL_CAPS, STORY_MISSIONS } from '../src/data/levelCap.js';

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const RUNS = Number(arg('runs', 8));
const STARTER = arg('starter', null);
const UNTIL = arg('until', null);
const STARTERS = ['charmander', 'bulbasaur', 'squirtle'];
const MAX_ATTEMPTS = Number(arg('attempts', 10));
const SAVE = arg('save', null);
const LOAD = arg('load', null);
const FROM = arg('from', null);
const JOBS = Math.max(1, Number(arg('jobs', 1)));
const TYPE_AWARE = args.includes('--tipos');
const MISSIONS = !args.includes('--sem-missoes');
const CAP = args.includes('--teto');
const CAP_PLUS = Number(arg('teto-mais', 0));
/** O teto da partida desta fase (o Level Cap), ou nada sem --teto. */
const capFor = (stageId) => (CAP && LEVEL_CAPS[stageId] ? LEVEL_CAPS[stageId] + CAP_PLUS : null);
// processo filho do --jobs: joga só as jornadas da sua fatia e devolve os números crus
const SLICE = arg('slice', null);
const loaded = LOAD ? JSON.parse(readFileSync(LOAD, 'utf8')) : [];
// --set gym_6_saffron.difficulty=0.8 (0.28, repetível): testa um valor sem editar stages.js
args.forEach((a, i) => {
  if (a !== '--set') return;
  const [path, value] = args[i + 1].split('=');
  const [stageId, field] = path.split('.');
  if (!STAGES[stageId]) throw new Error(`--set: fase ${stageId} não existe`);
  STAGES[stageId][field] = Number(value);
});

const stages = [];
let started = !FROM;
for (const entry of getRegion('kanto').campaign) {
  if (entry.comingSoon) break;
  if (entry.stage === FROM) started = true;
  if (started) stages.push(STAGES[entry.stage]);
  if (entry.stage === UNTIL) break;
  // a missão que a história põe depois desta fase (o Zapdos depois da 3...)
  const mission = MISSIONS ? STORY_MISSIONS[entry.stage] : null;
  if (started && mission) stages.push(STAGES[mission]);
}

const blankStats = () => new Map(stages.map((s) => [s.id, { tries: 0, wins: 0, first: 0, journeys: 0, attempts: [], entry: [], levels: [], top: [], capped: 0, balls: [], fights: [], faints: [], peaks: [], awakened: [], blocked: 0 }]));
const teamLevel = (team) => avg(team.members.map((m) => m.level));
const avg = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : NaN);
/** O percentil `q` de uma lista (0.9: 90% ficam nele ou abaixo). */
const pct = (list, q) => (list.length ? [...list].sort((a, b) => a - b)[Math.min(list.length - 1, Math.floor(q * list.length))] : null);

/** Joga as jornadas de índice `indices` (o índice escolhe o inicial e a equipe carregada). */
function playJourneys(indices, onJourney = () => {}) {
  const stats = blankStats();
  const saved = [];
  for (const r of indices) {
    const from = loaded.length ? loaded[r % loaded.length] : null;
    const starter = from?.starter ?? STARTER ?? STARTERS[r % STARTERS.length];
    let journey = from ? { team: from.team } : null;
    let finished = true;
    for (const stage of stages) {
      const s = stats.get(stage.id);
      let won = false;
      let attempt = 0;
      s.journeys++;
      for (; attempt < MAX_ATTEMPTS && !won; attempt++) {
        const entry = journey ? teamLevel(journey.team) : 1;
        const result = simulate(stage.id, starter, { maxSeconds: (stage.duration ?? 300) + 300, journey, typeAware: TYPE_AWARE, levelCap: capFor(stage.id) });
        const { run } = result;
        s.tries++;
        s.faints.push(run.stats.faints);
        s.peaks.push(result.peakEnemies);
        s.balls.push(result.ballsDropped);
        // vencendo ou não, a equipe leva o que ganhou (0.17)
        journey = { team: run.team.serialize() };
        if (run.state === 'victory') {
          won = true;
          s.wins++;
          if (attempt === 0) s.first++;
          s.entry.push(entry);
          s.fights.push(run.time - result.bossAt);
          s.levels.push(teamLevel(journey.team));
          const top = Math.max(...journey.team.members.map((m) => m.level));
          s.top.push(top);
          if (capFor(stage.id) && top >= capFor(stage.id)) s.capped++;
          s.awakened.push(run.team.members.filter((m) => m.abilities.some(isBonusMove)).length);
        }
      }
      s.attempts.push(attempt);
      if (!won) { s.blocked++; finished = false; break; }   // a jornada para aqui
    }
    if (finished && journey) saved.push({ starter, team: journey.team });
    onJourney();
  }
  return { stats, saved };
}

/** Soma os números crus de vários processos. */
function merge(parts) {
  const stats = blankStats();
  const saved = [];
  for (const part of parts) {
    for (const [id, s] of Object.entries(part.stats)) {
      const t = stats.get(id);
      for (const [k, v] of Object.entries(s)) t[k] = Array.isArray(v) ? t[k].concat(v) : (t[k] ?? 0) + v;
    }
    saved.push(...part.saved);
  }
  return { stats, saved };
}

/** Divide as jornadas entre JOBS processos filhos (cada um com a sua fatia de índices). */
function playParallel() {
  const self = fileURLToPath(import.meta.url);
  const passThrough = args.filter((_, i) => !['--jobs', '--save'].includes(args[i]) && !['--jobs', '--save'].includes(args[i - 1]));
  // um processo que cai (no Windows, com muitos subindo juntos, alguns saem com código 1 sem
  // mensagem; sozinhos, rodam até o fim) é refeito depois de 3 s, até 5 vezes, e o aviso sai na
  // tela. Os processos sobem com 1,5 s de intervalo, o que já evita quase todas as quedas
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  const runSlice = (j, tries = 1) => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [self, ...passThrough, '--slice', `${j}/${JOBS}`], { stdio: ['ignore', 'pipe', 'inherit'] });
    // os pontos de progresso do filho vêm pelo stderr (direto na tela); o stdout é só o JSON
    let out = '';
    child.stdout.on('data', (chunk) => { out += chunk; });
    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (code === 0) return resolve(JSON.parse(out));
      if (tries >= 5) return reject(new Error(`processo ${j} saiu com código ${code ?? signal} (${tries} tentativas)`));
      process.stderr.write(`\n[processo ${j} saiu com código ${code ?? signal}; refazendo a fatia]\n`);
      resolve(wait(3000).then(() => runSlice(j, tries + 1)));
    });
  });
  return Promise.all(Array.from({ length: JOBS }, (_, j) => wait(j * 1500).then(() => runSlice(j))));
}

const startedAt = Date.now();
const all = Array.from({ length: RUNS }, (_, r) => r);

if (SLICE) {
  const [j, n] = SLICE.split('/').map(Number);
  const { stats, saved } = playJourneys(all.filter((r) => r % n === j), () => process.stderr.write('.'));
  process.stdout.write(JSON.stringify({ stats: Object.fromEntries(stats), saved }));
} else {
  const { stats, saved } = JOBS > 1
    ? merge(await playParallel())
    : playJourneys(all, () => process.stdout.write('.'));

  console.log(`\n\nBALANCEAMENTO — ${RUNS} jornada(s)${STARTER ? ` de ${STARTER}` : ''}${TYPE_AWARE ? ', bot que monta o time por tipo' : ''}${MISSIONS ? ', com as missões' : ''}${CAP ? `, com o teto${CAP_PLUS ? ` (${CAP_PLUS > 0 ? '+' : ''}${CAP_PLUS})` : ''}` : ''}, ${((Date.now() - startedAt) / 1000).toFixed(0)}s\n`);
  console.log('fase                 1ª tent.   tentativas  entrada  nível ao vencer (ace)   máx (P90)   teto  no teto   luta    desmaios  pico   bolas (teto)  despertos');
  for (const stage of stages) {
    const s = stats.get(stage.id);
    const ace = Math.max(...(stage.bossTeam ?? []).map((id) => getEnemy(id)?.level ?? 0));
    console.log(
      `${stage.id.padEnd(20)} ${`${s.first}/${s.journeys}`.padEnd(10)} ${avg(s.attempts).toFixed(1).padStart(6)}  ` +
      `${avg(s.entry).toFixed(1).padStart(7)}      ` +
      `${avg(s.levels).toFixed(1).padStart(5)} (${ace || '?'})`.padEnd(24) +
      `${avg(s.top).toFixed(1).padStart(5)} (${pct(s.top, 0.9) ?? '?'})`.padEnd(12) +
      `${String(capFor(stage.id) ?? LEVEL_CAPS[stage.id] ?? '-').padStart(4)}  ${`${s.capped}/${s.wins}`.padStart(7)}  ` +
      `${avg(s.fights).toFixed(0).padStart(4)}s  ${avg(s.faints).toFixed(1).padStart(6)}  ${Math.round(avg(s.peaks)).toString().padStart(5)}   ${avg(s.balls).toFixed(2)} (${stage.maxBalls ?? '∞'})` +
      `${avg(s.awakened).toFixed(1).padStart(9)}` +
      (s.blocked ? `   ${s.blocked} jornada(s) parada(s) aqui` : '')
    );
  }

  if (SAVE) {
    writeFileSync(SAVE, JSON.stringify(saved));
    console.log(`\n${saved.length} equipe(s) vencedora(s) guardada(s) em ${SAVE}`);
  }
}
