/**
 * BALANCEAMENTO — joga a campanha várias vezes com o jogador virtual e mede.
 *
 * Uso:
 *   node tools/balance.mjs [--runs 8] [--starter charmander] [--until gym_2_cerulean]
 *   node tools/balance.mjs --until gym_5_fuchsia --save equipes.json
 *   node tools/balance.mjs --load equipes.json --from gym_6_saffron --until gym_8_viridian
 *
 * --save guarda as equipes que venceram a última fase; --load + --from
 * recomeça delas, sem rejogar as fases anteriores (calibrar as finais rápido).
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
 *
 * Alvo (0.17, "forçar o jogador a melhorar os Pokémon para passar"): o bot
 * passa as Fases 1 e 2 em 1–2 tentativas e precisa de ~2–4 nas seguintes,
 * cada vez mais, até a Liga. O Fellipe joga melhor que o bot: o que para o bot
 * é 3 tentativas para ele é 1–2.
 * Regra do projeto: mexa em uma alavanca por vez, meça, repita.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { simulate } from './bot.mjs';
import { STAGES } from '../src/data/stages.js';
import { getRegion } from '../src/data/regions.js';
import { getEnemy } from '../src/data/enemies.js';

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
const loaded = LOAD ? JSON.parse(readFileSync(LOAD, 'utf8')) : [];
const saved = [];

const stages = [];
let started = !FROM;
for (const entry of getRegion('kanto').campaign) {
  if (entry.comingSoon) break;
  if (entry.stage === FROM) started = true;
  if (started) stages.push(STAGES[entry.stage]);
  if (entry.stage === UNTIL) break;
}

const stats = new Map(stages.map((s) => [s.id, { tries: 0, wins: 0, first: 0, journeys: 0, attempts: [], entry: [], levels: [], fights: [], faints: [], peaks: [], blocked: 0 }]));
const teamLevel = (team) => avg(team.members.map((m) => m.level));
const avg = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : NaN);
const startedAt = Date.now();

for (let r = 0; r < RUNS; r++) {
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
      const result = simulate(stage.id, starter, { maxSeconds: stage.duration + 300, journey });
      const { run } = result;
      s.tries++;
      s.faints.push(run.stats.faints);
      s.peaks.push(result.peakEnemies);
      // vencendo ou não, a equipe leva o que ganhou (0.17)
      journey = { team: run.team.serialize() };
      if (run.state === 'victory') {
        won = true;
        s.wins++;
        if (attempt === 0) s.first++;
        s.entry.push(entry);
        s.fights.push(run.time - result.bossAt);
        s.levels.push(teamLevel(journey.team));
      }
    }
    s.attempts.push(attempt);
    if (!won) { s.blocked++; finished = false; break; }   // a jornada para aqui
  }
  if (finished && journey) saved.push({ starter, team: journey.team });
  process.stdout.write('.');
}

console.log(`\n\nBALANCEAMENTO — ${RUNS} jornada(s), ${((Date.now() - startedAt) / 1000).toFixed(0)}s\n`);
console.log('fase                 1ª tent.   tentativas  entrada  nível ao vencer (ace)   luta    desmaios  pico');
for (const stage of stages) {
  const s = stats.get(stage.id);
  const ace = Math.max(...(stage.bossTeam ?? []).map((id) => getEnemy(id)?.level ?? 0));
  console.log(
    `${stage.id.padEnd(20)} ${`${s.first}/${s.journeys}`.padEnd(10)} ${avg(s.attempts).toFixed(1).padStart(6)}  ` +
    `${avg(s.entry).toFixed(1).padStart(7)}      ` +
    `${avg(s.levels).toFixed(1).padStart(5)} (${ace || '?'})`.padEnd(24) +
    `${avg(s.fights).toFixed(0).padStart(4)}s  ${avg(s.faints).toFixed(1).padStart(6)}  ${Math.round(avg(s.peaks)).toString().padStart(5)}` +
    (s.blocked ? `   ${s.blocked} jornada(s) parada(s) aqui` : '')
  );
}

if (SAVE) {
  writeFileSync(SAVE, JSON.stringify(saved));
  console.log(`\n${saved.length} equipe(s) vencedora(s) guardada(s) em ${SAVE}`);
}
