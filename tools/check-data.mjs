/**
 * Conferência dos dados de conteúdo.
 * Roda rápido e avisa sobre referências quebradas (evolução para espécie
 * inexistente, habilidade que não existe, pool de captura com id errado).
 *
 * Uso: npm run check
 */
import { POKEMON } from '../src/data/pokemon.js';
import { ABILITIES } from '../src/data/abilities.js';
import { BONUS_MOVES } from '../src/data/bonusMoves.js';
import { LEGENDARY_MOVES, LEGENDARY_KITS } from '../src/data/legendaries.js';
import { UPGRADES } from '../src/data/upgrades.js';
import { ENEMIES } from '../src/data/enemies.js';
import { STAGES } from '../src/data/stages.js';
import { nextMoveFor } from '../src/data/tms.js';
import { CAPTURE_POOLS, poolEntries } from '../src/data/capturePools.js';
import { ASSET_MANIFEST } from '../src/data/assetManifest.js';
import { TRAINER_LOOKS } from '../src/data/trainers.js';
import { REGIONS } from '../src/data/regions.js';
import { FX, ABILITY_FX, BOSS_WAVE_FX, STATUS_FX } from '../src/data/fx.js';
import { SCENES, stageScenes } from '../src/data/scenery.js';
import { SCENE_TILES } from '../src/data/sceneManifest.js';
import { buildSceneGrid, TILE } from '../src/systems/terrain.js';
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

// a linha de 3 golpes; o lendário tem só o golpe exclusivo dele (0.16)
const lineSize = (p) => (LEGENDARY_KITS[p.id] ? 1 : 3);
const noLine = species.filter((p) => !p.moveLine || p.moveLine.length !== lineSize(p));
noLine.length
  ? fail(`espécies sem a linha de golpes certa: ${noLine.map((p) => p.id).join(', ')}`)
  : ok('todas as espécies têm linha de 3 golpes (os lendários, o exclusivo)');

// os lendários: golpe exclusivo, de um Pokémon só, com kit que aponta para melhorias e 2º golpe que existem
const badKits = Object.entries(LEGENDARY_KITS).filter(([id, kit]) =>
  POKEMON[id]?.rarity !== 'legendary' || POKEMON[id].abilities[0] !== kit.move ||
  LEGENDARY_MOVES[kit.move]?.exclusive !== id || !BONUS_MOVES[kit.bonusMove] ||
  Object.keys(kit.upgrades).some((suffix) => !UPGRADES[`${kit.move}_${suffix}`]));
const sharedSignature = species.filter((p) => p.moveLine?.some((id) => LEGENDARY_MOVES[id] && LEGENDARY_MOVES[id].exclusive !== p.id));
const legendaryNoKit = species.filter((p) => p.rarity === 'legendary' && !LEGENDARY_KITS[p.id]);
badKits.length || sharedSignature.length || legendaryNoKit.length
  ? fail(`lendários: kit quebrado (${badKits.map(([id]) => id).join(', ')}), golpe exclusivo usado por outro ` +
         `(${sharedSignature.map((p) => p.id).join(', ')}), lendário sem kit (${legendaryNoKit.map((p) => p.id).join(', ')})`)
  : ok(`${Object.keys(LEGENDARY_KITS).length} lendários com golpe exclusivo, melhorias e 2º golpe de saída`);

const brokenLine = species.filter((p) => (p.moveLine ?? []).some((id) => !ABILITIES[id]));
brokenLine.length
  ? fail(`linha de golpes com habilidade inexistente: ${brokenLine.map((p) => p.id).join(', ')}`)
  : ok('todas as linhas de golpes apontam para habilidades existentes');

const outOfLine = species.filter((p) => !(p.moveLine ?? []).includes(p.abilities[0]));
outOfLine.length
  ? fail(`começam com um golpe fora da própria linha: ${outOfLine.map((p) => p.id).join(', ')}`)
  : ok('todas começam com um golpe da própria linha');

const deadEnd = species.filter((p) => p.moveLine && p.abilities[0] !== p.moveLine.at(-1) &&
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

  const rivalTeams = Object.values(stage.bossTeamByStarter ?? {}).flat();
  missingEnemies.push(...rivalTeams.filter((id) => !ENEMIES[id]));
  if (missingEnemies.length) fail(`${stage.id}: inimigos inexistentes — ${[...new Set(missingEnemies)].join(', ')}`);
  const badGifts = (stage.gifts ?? []).flatMap((g) => g.choices).filter((id) => !POKEMON[id]);
  if (badGifts.length) fail(`${stage.id}: presentes com espécie inexistente — ${badGifts.join(', ')}`);
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
// os exclusivos dos lendários são desenhados em código (render/signature.js)
const noFx = playable.filter((a) => !ABILITY_FX[a.id] && a.behavior !== 'signature');
const staleFx = Object.keys(ABILITY_FX).filter((id) => !ABILITIES[id] && !BONUS_MOVES[id]);   // os 2º golpes também
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

// ---- cenário (data/scenery.js + metatiles extraídas) ----
const badSegments = Object.values(STAGES).flatMap((stage) =>
  (stage.segments ?? []).filter((seg) => seg.scene && !SCENES[seg.scene]).map((seg) => `${stage.id}/${seg.name}=${seg.scene}`));
const badSheets = Object.entries(SCENES)
  .filter(([, recipe]) => !SCENE_TILES[recipe.sheet] || !ASSET_MANIFEST[`scene/${recipe.sheet}`]).map(([id]) => id);
// recortes dos salões dentro do mapa original
const rectsOf = (r) => [r.floor, r.center, r.block, r.top?.door, ...(r.props ?? [])].filter(Boolean);
const badRects = Object.entries(SCENES).filter(([, r]) => SCENE_TILES[r.sheet]?.grid).flatMap(([id, r]) => {
  const map = SCENE_TILES[r.sheet];
  return rectsOf(r).filter(([x, y, w, h]) => x < 0 || y < 0 || x + w > map.width || y + h > map.height).map((rect) => `${id} [${rect}]`);
});
// toda metatile que os geradores usam precisa estar na tira extraída
const missingTiles = [];
const crowded = [];
for (const [id, recipe] of Object.entries(SCENES)) {
  if (badSheets.includes(id) || badRects.some((b) => b.startsWith(id + ' '))) continue;
  const known = new Set(SCENE_TILES[recipe.sheet].ids);
  const grid = buildSceneGrid(id, Math.ceil(3400 / TILE), Math.ceil(2200 / TILE), 'check');
  const missing = [...new Set(grid.cells)].filter((cell) => !known.has(cell));
  if (missing.length) missingTiles.push(`${id}: ${missing.map((m) => '0x' + m.toString(16)).join(', ')}`);
  // obstáculos demais deixam a arena sem espaço para fugir da horda
  const blocked = grid.solid.reduce((sum, v) => sum + v, 0) / grid.solid.length;
  if (blocked > 0.45) crowded.push(`${id} ${(blocked * 100).toFixed(0)}%`);
}
const usedScenes = new Set(Object.values(STAGES).flatMap((stage) => stageScenes(stage)));
badSegments.length ? fail(`trechos com cenário inexistente: ${badSegments.join(', ')}`)
  : badSheets.length ? fail(`cenários sem tira de metatiles: ${badSheets.join(', ')} — rode tools/assets/extract.py`)
  : badRects.length ? fail(`recortes fora do mapa: ${badRects.join(', ')}`)
  : missingTiles.length ? fail(`metatiles fora da tira: ${missingTiles.join(' · ')}`)
  : crowded.length ? fail(`cenários com obstáculo demais (mais de 45% bloqueado): ${crowded.join(', ')}`)
  : ok(`${Object.keys(SCENES).length} cenários do FireRed (${usedScenes.size} usados nas fases), todas as metatiles extraídas`);

// pools de captura: mostra quanto de cada fase já está implementado
// desde a 0.11 cada fase acumula as anteriores (metade do peso) e, da Fase 3 em diante, os iniciais
console.log('\nPools de captura (espécies da própria tabela + as que vêm das anteriores):');
for (const [id, pool] of Object.entries(CAPTURE_POOLS)) {
  const own = Object.keys(pool.species);
  const missing = own.filter((species) => !POKEMON[species]);
  const entries = poolEntries(id);
  const bar = missing.length ? '…' : '✔';
  console.log(`  ${bar} ${id.padEnd(8)} ${String(entries.length).padStart(3)} espécies ` +
              `(${own.length - missing.length} da tabela + ${entries.length - (own.length - missing.length)} de antes)` +
              (missing.length ? ` · faltam: ${missing.join(', ')}` : ''));
}

console.log(`\n=== ${problems === 0 ? 'DADOS OK' : problems + ' PROBLEMA(S)'} ===\n`);
process.exit(problems ? 1 : 0);
