/**
 * Conferência dos dados de conteúdo.
 * Roda rápido e avisa sobre referências quebradas (evolução para espécie
 * inexistente, habilidade que não existe, pool de captura com id errado).
 *
 * Uso: npm run check
 */
import { POKEMON } from '../src/data/pokemon.js';
import { ABILITIES } from '../src/data/abilities.js';
import { ENEMIES } from '../src/data/enemies.js';
import { STAGES } from '../src/data/stages.js';
import { nextMoveFor } from '../src/data/tms.js';
import { CAPTURE_POOLS, poolEntries } from '../src/data/capturePools.js';

let problems = 0;
const fail = (msg) => { problems++; console.log(` FALHA | ${msg}`); };
const ok = (msg) => console.log(`  OK   | ${msg}`);

const species = Object.values(POKEMON);

const brokenEvo = species.filter((p) => p.evolution && !POKEMON[p.evolution.to]);
brokenEvo.length
  ? fail(`evolução para espécie inexistente: ${brokenEvo.map((p) => `${p.id}->${p.evolution.to}`).join(', ')}`)
  : ok(`${species.length} espécies jogáveis, todas as evoluções válidas`);

const brokenAbility = species.filter((p) => p.abilities.some((id) => !ABILITIES[id]));
brokenAbility.length
  ? fail(`habilidade inexistente em: ${brokenAbility.map((p) => p.id).join(', ')}`)
  : ok('todas as espécies usam habilidades existentes');

const brokenEnemyAbility = Object.values(ENEMIES)
  .filter((e) => (e.abilities ?? []).some((id) => !ABILITIES[id]));
brokenEnemyAbility.length
  ? fail(`inimigo com habilidade inexistente: ${brokenEnemyAbility.map((e) => e.id).join(', ')}`)
  : ok(`${Object.keys(ENEMIES).length} inimigos com habilidades válidas`);

const noLine = species.filter((p) => !p.moveLine || p.moveLine.length !== 3);
noLine.length
  ? fail(`espécies sem linha de 3 golpes: ${noLine.map((p) => p.id).join(', ')}`)
  : ok('todas as espécies têm linha de 3 golpes');

const brokenLine = species.filter((p) => (p.moveLine ?? []).some((id) => !ABILITIES[id]));
brokenLine.length
  ? fail(`linha de golpes com habilidade inexistente: ${brokenLine.map((p) => p.id).join(', ')}`)
  : ok('todas as linhas de golpes apontam para habilidades existentes');

const outOfLine = species.filter((p) => !(p.moveLine ?? []).includes(p.abilities[0]));
outOfLine.length
  ? fail(`começam com um golpe fora da própria linha: ${outOfLine.map((p) => p.id).join(', ')}`)
  : ok('todas começam com um golpe da própria linha');

const deadEnd = species.filter((p) => p.moveLine && p.abilities[0] !== p.moveLine[2] &&
  !nextMoveFor(p.id, p.abilities[0]));
deadEnd.length
  ? fail(`TM não encontra o próximo golpe: ${deadEnd.map((p) => p.id).join(', ')}`)
  : ok('a TM encontra o próximo golpe de todas as espécies');

for (const stage of Object.values(STAGES)) {
  const missingEnemies = [
    ...stage.waves.flatMap((w) => w.enemies.map((e) => e.id)),
    ...(stage.elites ?? []).map((e) => e.id),
    ...(stage.bossTeam ?? [])
  ].filter((id) => !ENEMIES[id]);

  if (missingEnemies.length) fail(`${stage.id}: inimigos inexistentes — ${[...new Set(missingEnemies)].join(', ')}`);
  if (!CAPTURE_POOLS[stage.capturePool]) fail(`${stage.id}: pool de captura "${stage.capturePool}" não existe`);
}
ok(`${Object.keys(STAGES).length} fases com inimigos e pools válidos`);

// pools de captura: mostra quanto de cada fase já está implementado
console.log('\nPools de captura (espécies já implementadas / total da tabela):');
for (const [id, pool] of Object.entries(CAPTURE_POOLS)) {
  const total = Object.keys(pool.species).length;
  const ready = poolEntries(id).length;
  const chance = poolEntries(id).reduce((sum, e) => sum + e.weight, 0);
  const bar = ready === total ? '✔' : '…';
  console.log(`  ${bar} ${id.padEnd(8)} ${String(ready).padStart(2)}/${total} espécies · ${chance.toFixed(1)}% da tabela disponível`);
}

console.log(`\n=== ${problems === 0 ? 'DADOS OK' : problems + ' PROBLEMA(S)'} ===\n`);
process.exit(problems ? 1 : 0);
