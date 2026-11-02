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
import { ASSET_MANIFEST } from '../src/data/assetManifest.js';
import { TRAINER_LOOKS } from '../src/data/trainers.js';
import { REGIONS } from '../src/data/regions.js';
import { FX, ABILITY_FX, BOSS_WAVE_FX, STATUS_FX } from '../src/data/fx.js';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

// ---- assets gerados (tools/assets/extract.py) ----
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const missingFiles = Object.entries(ASSET_MANIFEST).filter(([, a]) => !existsSync(join(root, a.src)));
missingFiles.length
  ? fail(`assets do catálogo sem arquivo: ${missingFiles.map(([key]) => key).join(', ')} — rode tools/assets/extract.py`)
  : ok(`${Object.keys(ASSET_MANIFEST).length} assets do catálogo presentes no disco`);

const brokenLooks = Object.values(TRAINER_LOOKS).filter((look) => {
  const sheet = ASSET_MANIFEST[look.sheet];
  const used = Object.values(look.frames).flatMap((pose) => Object.values(pose).flat());
  return !sheet || !ASSET_MANIFEST[look.portrait] || used.some((frame) => frame >= sheet.frames);
});
brokenLooks.length
  ? fail(`modelo de treinador com folha, retrato ou quadro inexistente: ${brokenLooks.map((l) => l.id).join(', ')}`)
  : ok(`${Object.keys(TRAINER_LOOKS).length} modelos de treinador com folha e retrato`);

for (const region of Object.values(REGIONS)) {
  const problemsBefore = problems;
  const badTrainers = region.trainers.filter((id) => !TRAINER_LOOKS[id]);
  if (badTrainers.length) fail(`${region.id}: modelos de treinador inexistentes — ${badTrainers.join(', ')}`);
  const badStarters = region.starters.filter((id) => !POKEMON[id]);
  if (badStarters.length) fail(`${region.id}: iniciais inexistentes — ${badStarters.join(', ')}`);
  for (const entry of region.campaign) {
    if (!entry.comingSoon && !STAGES[entry.stage]) fail(`${region.id}: fase inexistente na campanha — ${entry.stage}`);
    const portrait = entry.comingSoon ? entry.portrait : STAGES[entry.stage]?.leader?.portrait;
    if (portrait && !ASSET_MANIFEST[portrait]) fail(`${region.id}: retrato inexistente — ${portrait}`);
  }
  if (problems === problemsBefore) {
    ok(`região ${region.name}: ${region.campaign.length} etapas, iniciais, treinadores e retratos válidos`);
  }
}

// ---- efeitos dos golpes (data/fx.js) ----
const fxSheetOk = (fxId) => FX[fxId] && ASSET_MANIFEST[FX[fxId].sheet ?? `fx/${fxId}`];
const playable = Object.values(ABILITIES).filter((a) => !a.hostile);
const noFx = playable.filter((a) => !ABILITY_FX[a.id]);
const staleFx = Object.keys(ABILITY_FX).filter((id) => !ABILITIES[id]);
const fxRefs = [
  ...Object.entries(ABILITY_FX),
  ...Object.entries(BOSS_WAVE_FX).map(([type, vfx]) => [`líder ${type}`, vfx]),
  ['status', STATUS_FX], ['fixos', { telegraph: 'x_sign', explosion: 'explosion' }]
];
const brokenFx = fxRefs.flatMap(([id, vfx]) =>
  Object.entries(vfx).filter(([, value]) => typeof value === 'string' && !fxSheetOk(value)).map(([key, value]) => `${id}.${key}=${value}`));
noFx.length ? fail(`golpes sem efeito visual: ${noFx.map((a) => a.id).join(', ')}`)
  : staleFx.length ? fail(`efeitos de golpes que não existem: ${staleFx.join(', ')}`)
  : brokenFx.length ? fail(`efeitos apontando para sprite inexistente: ${brokenFx.join(', ')}`)
  : ok(`${playable.length} golpes com efeito visual, ${Object.keys(FX).length} efeitos com sprite`);

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
