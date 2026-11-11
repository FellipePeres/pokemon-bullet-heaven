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
import { LEGENDARY_MOVES, LEGENDARY_KITS, LEGENDARY_ENCOUNTERS } from '../src/data/legendaries.js';
import { MART_ITEMS, getMartItem, itemEvolutions, KEY_ITEMS } from '../src/data/items.js';
import { UPGRADES } from '../src/data/upgrades.js';
import { AWAKENING_KEYS, awakeningSuffixes } from '../src/data/awakening.js';
import { ENEMIES } from '../src/data/enemies.js';
import { STAGES } from '../src/data/stages.js';
import { nextMoveFor } from '../src/data/tms.js';
import { CAPTURE_POOLS, poolEntries } from '../src/data/capturePools.js';
import { ASSET_MANIFEST } from '../src/data/assetManifest.js';
import { TRAINER_LOOKS } from '../src/data/trainers.js';
import { REGIONS } from '../src/data/regions.js';
import { FX, ABILITY_FX, BOSS_WAVE_FX, STATUS_FX } from '../src/data/fx.js';
import { SCENES, stageScenes } from '../src/data/scenery.js';
import { ALL_SCENE_TILES as SCENE_TILES } from '../src/data/sceneTiles.js';
import { DIVE_WORLD } from '../src/data/diveWorld.js';
import { buildSceneGrid, TILE } from '../src/systems/terrain.js';
import { HUB } from '../src/data/hub.js';
import { HUB_MAPS, HUB_SPRITES, HUB_DECOR } from '../src/data/hubMaps.js';
import { DIALOGUE } from '../src/data/dialogue.js';
import { DECOR, decorMax } from '../src/data/decor.js';
import { QUESTS, CHAPTERS, FIRST_QUEST, QUEST_EVENTS } from '../src/data/quests.js';
import { DONE_IF_KEYS } from '../src/systems/QuestSystem.js';
import { CUTSCENES, CUTSCENE_STEPS, CUTSCENE_TRIGGERS } from '../src/data/cutscenes.js';
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
// evolução por item (0.23): pedra ou troca só pelo Poké Mart; o item existe na loja,
// a espécie de destino existe, e quem evolui por item não tem nível de evolução
const itemEvo = species.filter((p) => p.evolution?.method);
const badItemEvo = itemEvo.filter((p) => p.evolution.level != null || !Object.keys(itemEvolutions(p.id)).length ||
  Object.entries(itemEvolutions(p.id)).some(([item, to]) => getMartItem(item)?.kind !== 'evolution' || !POKEMON[to]));
const unusedItems = MART_ITEMS.filter((i) => i.kind === 'evolution' && !species.some((p) => itemEvolutions(p.id)[i.id]));
badItemEvo.length || unusedItems.length
  ? fail(`evolução por item quebrada: ${badItemEvo.map((p) => p.id).join(', ')} / itens sem uso: ${unusedItems.map((i) => i.id).join(', ')}`)
  : ok(`${itemEvo.length} espécies evoluem por pedra ou troca, todas com o item no Poké Mart`);

const noLine = species.filter((p) => !p.moveLine || p.moveLine.length !== lineSize(p));
noLine.length
  ? fail(`espécies sem a linha de golpes certa: ${noLine.map((p) => p.id).join(', ')}`)
  : ok('todas as espécies têm linha de 3 golpes (os lendários, o exclusivo)');

// a chave do Golpe Desperto (0.28): todo golpe jogável tem 3 melhorias diferentes que existem,
// de 11 a 13 no total; a lista só cita golpes que existem
const playableMoves = Object.values(ABILITIES).filter((a) => !a.hostile);
const badKeys = playableMoves.filter((a) => {
  const suffixes = awakeningSuffixes(a);
  const ups = suffixes.map((s) => UPGRADES[`${a.id}_${s}`]);
  const total = ups.reduce((sum, up) => sum + (up?.maxStacks ?? 0), 0);
  return suffixes.length !== 3 || new Set(suffixes).size !== 3 || ups.some((up) => !up) || total < 11 || total > 13;
});
const strayKeys = Object.keys(AWAKENING_KEYS).filter((id) => !ABILITIES[id] || ABILITIES[id].hostile);
badKeys.length || strayKeys.length
  ? fail(`chave do Golpe Desperto quebrada: ${badKeys.map((a) => a.id).join(', ')} ${strayKeys.join(', ')}`)
  : ok(`${playableMoves.length} golpes com a chave do Golpe Desperto (3 melhorias, 11 a 13 no total)`);

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

// onde eles aparecem (0.18): só pelo sorteio próprio, em fases que existem, e todos têm onde aparecer
const encounterStages = Object.keys(LEGENDARY_ENCOUNTERS);
const badEncounter = encounterStages.filter((id) => !STAGES[id] || !(STAGES[id].maxBalls > 0) ||
  LEGENDARY_ENCOUNTERS[id].pool.some((p) => !LEGENDARY_KITS[p]));
const inPools = Object.values(CAPTURE_POOLS).flatMap((pool) => Object.keys(pool.species)).filter((id) => LEGENDARY_KITS[id]);
// o lendário secreto (o Kyogre, 0.37) vem da luta do salão, não do sorteio da Poké Ball
const nowhere = Object.keys(LEGENDARY_KITS).filter((id) => !POKEMON[id]?.secret && !encounterStages.some((s) => LEGENDARY_ENCOUNTERS[s].pool.includes(id)));
badEncounter.length || inPools.length || nowhere.length
  ? fail(`encontros de lendário: fase inválida ou sem Poké Ball (${badEncounter.join(', ')}), lendário na tabela comum ` +
         `(${inPools.join(', ')}), lendário sem onde aparecer (${nowhere.join(', ')})`)
  : ok(`lendários aparecem em ${encounterStages.length} fases, pelo sorteio próprio`);

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
  .filter(([, recipe]) => !SCENE_TILES[recipe.sheet] || !(ASSET_MANIFEST[`scene/${recipe.sheet}`] ?? DIVE_WORLD.sprites[`scene/${recipe.sheet}`])).map(([id]) => id);
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

// os tipos (0.32): todo tipo de Pokémon, inimigo e golpe existe, e todo tipo de golpe tem linha na tabela
{
  const { TYPES, EFFECTIVENESS } = await import('../src/data/types.js');
  const used = new Set([
    ...Object.values(POKEMON).flatMap((p) => p.types ?? []),
    ...Object.values(ENEMIES).flatMap((e) => e.types ?? [])
  ]);
  const attacks = new Set([...Object.values(ABILITIES), ...Object.values(BONUS_MOVES)].map((a) => a.type).filter(Boolean));
  const unknown = [...used, ...attacks].filter((t) => !TYPES[t]);
  const noRow = [...attacks].filter((t) => !EFFECTIVENESS[t]);
  const badCell = Object.entries(EFFECTIVENESS).flatMap(([atk, row]) =>
    Object.entries(row).filter(([def, m]) => !TYPES[def] || ![0, 0.5, 2].includes(m)).map(([def]) => `${atk}→${def}`));
  unknown.length ? fail(`tipos que não existem: ${[...new Set(unknown)].join(', ')}`)
    : noRow.length ? fail(`tipos de golpe sem linha na tabela de efetividade: ${noRow.join(', ')}`)
    : badCell.length ? fail(`casas estranhas na tabela de efetividade: ${badCell.join(', ')}`)
    : ok(`${Object.keys(EFFECTIVENESS).length} tipos na tabela de efetividade, todos os golpes cobertos`);
}

// os banners dos salões (0.31): o painel da fase mostra o salão do último trecho com cenário
{
  const halls = [...new Set(Object.values(STAGES)
    .map((stage) => [...(stage.segments ?? [])].reverse().find((seg) => seg.scene)?.scene).filter(Boolean))];
  const noBanner = halls.filter((scene) => !existsSync(join(root, 'assets', 'ui', 'gym-banners', `${scene}.png`)));
  noBanner.length
    ? fail(`salões sem banner no painel da fase: ${noBanner.join(', ')} — rode tools/assets/gym_banners.py`)
    : ok(`${halls.length} salões com banner no painel da fase`);
}

// as condições e ações das falas da vila (game/Hub.js), que as cenas também usam
const KNOWN_WHEN = new Set(['starter', 'starterIs', 'shiny', 'badges', 'champion', 'dex', 'veteran', 'dive', 'diveTm', 'diveRescued', 'kyogre', 'locked', 'once', 'quest', 'questDone', 'scene', 'flag']);
const KNOWN_ACTIONS = new Set(['starter', 'pc', 'mart', 'save', 'campaign', 'pokedoll', 'badges', 'aquatic']);
// o chão da vila: só onde o mapa do FireRed deixa pisar
const floor = (mapId, x, y) => {
  const map = HUB_MAPS[mapId];
  return !!map && x >= 0 && y >= 0 && x < map.width && y < map.height && map.walk[y][x] === '.';
};
const inside = (mapId, x, y) => { const m = HUB_MAPS[mapId]; return !!m && x >= 0 && y >= 0 && x < m.width && y < m.height; };

// a vila (0.29): mapas gerados, portas, saídas, pessoas, objetos e falas
{
  const issues = [];
  const talkKeys = new Set();

  for (const [name, spot] of Object.entries(HUB.spawn)) {
    if (!floor(spot.map, spot.x, spot.y)) issues.push(`spawn ${name} fora do chão (${spot.map} ${spot.x},${spot.y})`);
  }
  for (const [mapId, place] of Object.entries(HUB.maps)) {
    const map = HUB_MAPS[mapId];
    if (!map) { issues.push(`${mapId}: sem mapa gerado — rode tools/assets/hub.py`); continue; }
    for (const file of [map.src, map.top]) if (!existsSync(join(root, file))) issues.push(`${mapId}: falta ${file}`);
    if (map.walk.length !== map.height || map.walk.some((row) => row.length !== map.width)) issues.push(`${mapId}: colisão com tamanho errado`);

    for (const w of place.warps ?? []) {
      const at = `${mapId} ${w.x},${w.y}`;
      if (!HUB.maps[w.to]) { issues.push(`${at}: porta para um lugar que não existe (${w.to})`); continue; }
      if (!floor(w.to, w.tx, w.ty)) issues.push(`${at}: chega fora do chão em ${w.to} ${w.tx},${w.ty}`);
      // a porta bloqueia (anda-se contra ela); a escada, a entrada aberta e o tapete são chão
      if (w.on === 'push' ? floor(mapId, w.x, w.y) : !floor(mapId, w.x, w.y)) issues.push(`${at}: '${w.on}' no tile errado`);
      if (!['push', 'step', 'mat'].includes(w.on)) issues.push(`${at}: tipo de porta desconhecido (${w.on})`);
    }
    for (const exit of place.exits ?? []) {
      for (const [x, y] of exit.cells) if (!floor(mapId, x, y)) issues.push(`${mapId}: saída fora do chão em ${x},${y}`);
      if (exit.guard && !(place.npcs ?? []).some((n) => n.id === exit.guard)) issues.push(`${mapId}: a saída tem um guarda que não existe (${exit.guard})`);
      if (!['campaign', 'endless'].includes(exit.action)) issues.push(`${mapId}: saída com ação desconhecida (${exit.action})`);
    }
    const taken = new Set();
    for (const npc of place.npcs ?? []) {
      if (!floor(mapId, npc.x, npc.y)) issues.push(`${mapId}: ${npc.id} em cima de parede (${npc.x},${npc.y})`);
      if (taken.has(`${npc.x},${npc.y}`)) issues.push(`${mapId}: duas pessoas no tile ${npc.x},${npc.y}`);
      taken.add(`${npc.x},${npc.y}`);
      if (!HUB_SPRITES[`npc/${npc.sprite}`]) issues.push(`${mapId}: ${npc.id} sem sprite (${npc.sprite})`);
      talkKeys.add(npc.talk);
    }
    for (const thing of place.things ?? []) {
      for (const [x, y] of thing.cells) if (!inside(mapId, x, y)) issues.push(`${mapId}: objeto fora do mapa em ${x},${y}`);
      talkKeys.add(thing.talk);
    }
    for (const d of place.decor ?? []) {
      if (!HUB_SPRITES[`npc/${d.sprite}`]) issues.push(`${mapId}: decoração sem sprite (${d.sprite})`);
      if (!inside(mapId, d.x, d.y)) issues.push(`${mapId}: decoração fora do mapa em ${d.x},${d.y}`);
    }
  }
  // o quarto decorável (data/decor.js): cada enfeite no chão, sem se sobrepor, e com
  // tudo comprado o quarto ainda tem caminho da cama até a escada
  const room = HUB.room;
  const blocked = new Set();
  for (const item of DECOR) {
    talkKeys.add(item.talk);
    if (item.piece && !HUB_DECOR[item.piece]) { issues.push(`enfeite ${item.id}: peça que não existe (${item.piece})`); continue; }
    if (item.sprite && !HUB_SPRITES[`npc/${item.sprite}`]) issues.push(`enfeite ${item.id}: sem sprite (${item.sprite})`);
    const spots = item.slots ?? [item.at];
    if (spots.length !== decorMax(item)) issues.push(`enfeite ${item.id}: lugares e máximo não batem`);
    for (const [x, y] of spots) {
      const cells = item.piece ? HUB_DECOR[item.piece].solid.map(([sx, sy]) => [x + sx, y + sy]) : [[x, y]];
      const size = item.piece ? [HUB_DECOR[item.piece].width, HUB_DECOR[item.piece].height] : [1, 1];
      if (!inside(room, x, y) || !inside(room, x + size[0] - 1, y + size[1] - 1)) issues.push(`enfeite ${item.id}: fora do quarto em ${x},${y}`);
      for (const [cx, cy] of cells) {
        if (blocked.has(`${cx},${cy}`)) issues.push(`enfeite ${item.id}: em cima de outro em ${cx},${cy}`);
        blocked.add(`${cx},${cy}`);
        // boneco no chão (o móvel pode bloquear a parede, como a mesa do PC)
        if (!item.piece && !floor(room, cx, cy)) issues.push(`enfeite ${item.id}: em cima de parede em ${cx},${cy}`);
      }
    }
  }
  {
    const start = HUB.spawn.bedroom;
    const stairs = (HUB.maps[room].warps ?? []).find((w) => w.on === 'step');
    const seen = new Set([`${start.x},${start.y}`]);
    const queue = [[start.x, start.y]];
    while (queue.length) {
      const [x, y] = queue.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = `${x + dx},${y + dy}`;
        if (seen.has(k) || blocked.has(k) || !floor(room, x + dx, y + dy)) continue;
        seen.add(k);
        queue.push([x + dx, y + dy]);
      }
    }
    if (blocked.has(`${start.x},${start.y}`)) issues.push('o quarto: um enfeite em cima de onde o jogador acorda');
    if (stairs && !seen.has(`${stairs.x},${stairs.y}`)) issues.push('o quarto: com tudo comprado, a escada fica sem caminho');
  }

  for (const key of talkKeys) if (!DIALOGUE[key]) issues.push(`fala que não existe: ${key}`);
  for (const [key, entry] of Object.entries(DIALOGUE)) {
    if (!entry.lines?.length) { issues.push(`${key}: sem falas`); continue; }
    if (entry.lines.at(-1).when) issues.push(`${key}: a última fala tem condição (alguém pode ficar sem resposta)`);
    for (const line of entry.lines) {
      for (const cond of Object.keys(line.when ?? {})) if (!KNOWN_WHEN.has(cond)) issues.push(`${key}: condição desconhecida (${cond})`);
      for (const cond of ['quest', 'questDone']) {
        if (line.when?.[cond] && !QUESTS[line.when[cond]]) issues.push(`${key}: ${cond} de uma quest que não existe (${line.when[cond]})`);
      }
      for (const action of [line.then, line.ask?.yes].filter(Boolean)) if (!KNOWN_ACTIONS.has(action)) issues.push(`${key}: ação desconhecida (${action})`);
      if (!line.say?.length) issues.push(`${key}: fala sem páginas`);
    }
  }
  for (const [key, sheet] of Object.entries(HUB_SPRITES)) if (!existsSync(join(root, sheet.src))) issues.push(`falta a folha ${key}`);

  const npcCount = Object.values(HUB.maps).reduce((n, place) => n + (place.npcs?.length ?? 0), 0);
  issues.length
    ? fail(`vila: ${issues.join(' · ')}`)
    : ok(`a vila: ${Object.keys(HUB.maps).length} lugares, ${npcCount} pessoas e Pokémon, ${Object.keys(DIALOGUE).length} falas e ${DECOR.length} enfeites para o quarto, tudo no lugar`);
}

// as quests da história (0.38, PLANEJAMENTO-HISTORIA.md): cada uma alcançável a
// partir da primeira, e tudo o que ela cita existe (falas, lugares, fases, capítulos)
{
  const issues = [];
  const KINDS = new Set(['story', 'legendary', 'side']);
  if (!QUESTS[FIRST_QUEST]) issues.push(`a primeira quest não existe (${FIRST_QUEST})`);
  for (const [id, quest] of Object.entries(QUESTS)) {
    if (!KINDS.has(quest.kind)) issues.push(`${id}: tipo desconhecido (${quest.kind})`);
    if (!CHAPTERS[quest.chapter]) issues.push(`${id}: capítulo que não existe (${quest.chapter})`);
    if (!quest.objectives?.length) issues.push(`${id}: sem objetivos`);
    for (const objective of quest.objectives ?? []) {
      if (!objective.text) issues.push(`${id}: objetivo sem texto`);
      if (!QUEST_EVENTS.includes(objective.on)) issues.push(`${id}: evento desconhecido (${objective.on})`);
      if (objective.on === 'talk' && !DIALOGUE[objective.target]) issues.push(`${id}: fala que não existe (${objective.target})`);
      if (objective.on === 'enter' && !HUB.maps[objective.target]) issues.push(`${id}: lugar que não existe (${objective.target})`);
      if (objective.on === 'win' && !STAGES[objective.target]) issues.push(`${id}: fase que não existe (${objective.target})`);
    }
    for (const key of Object.keys(quest.doneIf ?? {})) if (!DONE_IF_KEYS.includes(key)) issues.push(`${id}: doneIf desconhecido (${key})`);
    if (quest.doneIf?.cleared && !STAGES[quest.doneIf.cleared]) issues.push(`${id}: doneIf de uma fase que não existe (${quest.doneIf.cleared})`);
    for (const next of quest.next ?? []) if (!QUESTS[next]) issues.push(`${id}: a seguinte não existe (${next})`);
  }
  const reached = new Set();
  const queue = [FIRST_QUEST];
  while (queue.length) {
    const id = queue.shift();
    if (reached.has(id) || !QUESTS[id]) continue;
    reached.add(id);
    queue.push(...(QUESTS[id].next ?? []));
  }
  const orphans = Object.keys(QUESTS).filter((id) => !reached.has(id));
  if (orphans.length) issues.push(`quests que nenhuma outra abre: ${orphans.join(', ')}`);
  issues.length
    ? fail(`quests: ${issues.join(' · ')}`)
    : ok(`a história: ${Object.keys(QUESTS).length} quests em ${Object.keys(CHAPTERS).length} capítulos, todas encadeadas a partir de "${FIRST_QUEST}"`);
}

// as cenas (0.39, data/cutscenes.js): o lugar, os atores, os caminhos só no chão, e
// as falas, os itens e as quests que elas citam; e os eventos de história das fases
{
  const issues = [];
  const SHEETS = { ...ASSET_MANIFEST, ...HUB_SPRITES, ...DIVE_WORLD.sprites };
  const DIRS = ['up', 'down', 'left', 'right'];
  const NEEDS_WHO = new Set(['show', 'hide', 'place', 'walk', 'face', 'emote', 'throw', 'bird']);
  let stepCount = 0;
  for (const [id, def] of Object.entries(CUTSCENES)) {
    const place = HUB.maps[def.map];
    if (!place) { issues.push(`${id}: lugar que não existe (${def.map})`); continue; }
    if (def.spot && !floor(def.map, def.spot.x, def.spot.y)) issues.push(`${id}: spot fora do chão`);
    if (def.record !== false && !def.spot) issues.push(`${id}: sem spot (a cena pendente não teria onde voltar)`);
    for (const t of def.trigger ?? []) {
      if (!CUTSCENE_TRIGGERS.includes(t.on)) issues.push(`${id}: trigger desconhecido (${t.on})`);
      if (t.on === 'enter' && t.target !== def.map) issues.push(`${id}: trigger de entrada em outro lugar (${t.target})`);
      if (t.on === 'npc' && !(place.npcs ?? []).some((n) => n.id === t.target)) issues.push(`${id}: trigger de alguém que não está no lugar (${t.target})`);
      if (t.on === 'win' && !STAGES[t.target]) issues.push(`${id}: trigger de uma fase que não existe (${t.target})`);
    }
    for (const cond of Object.keys(def.when ?? {})) if (!KNOWN_WHEN.has(cond)) issues.push(`${id}: condição desconhecida (${cond})`);
    const actors = new Set(['player', ...Object.keys(def.actors ?? {}), ...(place.npcs ?? []).map((n) => n.id)]);
    for (const [aid, a] of Object.entries(def.actors ?? {})) {
      if (!SHEETS[a.sprite]) issues.push(`${id}: ${aid} sem folha (${a.sprite})`);
      if (!floor(def.map, a.x, a.y)) issues.push(`${id}: ${aid} começa fora do chão (${a.x},${a.y})`);
    }
    for (const key of [...(def.preload ?? []), ...(def.band ? [def.band] : [])]) if (!SHEETS[key]) issues.push(`${id}: folha que não existe (${key})`);
    const steps = def.steps ?? [];
    if (steps.at(-1)?.do !== 'end') issues.push(`${id}: o último passo não é o end (a cena nunca contaria como vista)`);
    steps.forEach((raw, i) => {
      if (raw.pick && !Object.keys(raw.cases ?? {}).length) issues.push(`${id} passo ${i + 1}: pick sem casos`);
      const variants = raw.pick ? Object.values(raw.cases ?? {}).map((c) => ({ ...raw, ...c })) : [raw];
      for (const step of variants) {
        stepCount++;
        const at = `${id} passo ${i + 1} (${step.do})`;
        if (!CUTSCENE_STEPS.includes(step.do)) { issues.push(`${at}: passo desconhecido`); continue; }
        if (NEEDS_WHO.has(step.do) && step.who == null) issues.push(`${at}: sem who`);
        for (const who of [step.who, step.toward, step.npc]) if (who != null && !actors.has(who)) issues.push(`${at}: ator que não está na cena (${who})`);
        if (step.do === 'face' && !step.toward && !DIRS.includes(step.dir)) issues.push(`${at}: direção desconhecida (${step.dir})`);
        if (step.do === 'say' && !step.lines?.length) issues.push(`${at}: sem falas`);
        if (step.do === 'talk' && !DIALOGUE[step.key]) issues.push(`${at}: fala que não existe (${step.key})`);
        if (step.do === 'walk') {
          const tiles = step.path ?? step.to ?? [];
          if (!tiles.length) issues.push(`${at}: sem path nem to`);
          for (const [x, y, dir] of tiles) {
            if (!floor(def.map, x, y)) issues.push(`${at}: tile fora do chão (${x},${y})`);
            if (dir && !DIRS.includes(dir)) issues.push(`${at}: direção desconhecida (${dir})`);
          }
          // o path anda de tile em tile, como na vila
          for (let k = 1; k < (step.path ?? []).length; k++) {
            const [ax, ay] = step.path[k - 1], [bx, by] = step.path[k];
            if (Math.abs(ax - bx) + Math.abs(ay - by) !== 1) issues.push(`${at}: o path pula de ${ax},${ay} para ${bx},${by}`);
          }
        }
        if (step.do === 'place' && !floor(def.map, step.x, step.y)) issues.push(`${at}: tile fora do chão (${step.x},${step.y})`);
        if (step.do === 'camera' && step.to !== 'player' && !inside(def.map, step.x, step.y)) issues.push(`${at}: fora do mapa`);
        if (step.do === 'cutin' && (!SHEETS[step.sprite] || !def.band)) issues.push(`${at}: sem a folha do Pokémon ou a faixa (band)`);
        if (step.do === 'bird' && !['in', 'grab', 'away', 'gone'].includes(step.mode)) issues.push(`${at}: modo desconhecido (${step.mode})`);
        if (step.do === 'give' && getMartItem(step.item)?.kind !== 'bag' && !KEY_ITEMS[step.item]) issues.push(`${at}: item que não existe (${step.item})`);
        if (step.do === 'quest' && !QUESTS[step.id]) issues.push(`${at}: quest que não existe (${step.id})`);
        if (step.do === 'flag' && !step.name) issues.push(`${at}: flag sem nome`);
        if (step.do === 'end' && step.then && !KNOWN_ACTIONS.has(step.then)) issues.push(`${at}: ação desconhecida (${step.then})`);
      }
    });
  }
  // a história das fases (stage.story): só antes e depois, NUNCA no meio da fase
  // (regra do Fellipe, seção 9.2 do planejamento)
  const storyIds = new Set();
  let storyCount = 0;
  for (const [stageId, stage] of Object.entries(STAGES)) {
    const story = stage.story;
    if (!story) continue;
    if (Array.isArray(story) || typeof story !== 'object' || Object.keys(story).some((k) => k !== 'before' && k !== 'after')) {
      issues.push(`${stageId}: a história da fase só tem before e after (nada no meio da fase)`);
      continue;
    }
    for (const [moment, e] of Object.entries(story)) {
      storyCount++;
      const at = `${stageId} (${moment})`;
      if (e.at != null) issues.push(`${at}: tem 'at', mas nada acontece no meio da fase`);
      if (!e.id) issues.push(`${at}: sem id`);
      else if (CUTSCENES[e.id] || storyIds.has(e.id)) issues.push(`${at}: id repetido (${e.id})`);
      storyIds.add(e.id);
      if (!e.lines?.length) issues.push(`${at}: sem falas`);
      if (e.portrait && !ASSET_MANIFEST[e.portrait]) issues.push(`${at}: retrato que não existe (${e.portrait})`);
    }
  }
  for (const [qid, quest] of Object.entries(QUESTS)) {
    for (const o of quest.objectives ?? []) {
      if (o.on === 'scene' && !CUTSCENES[o.target] && !storyIds.has(o.target)) issues.push(`${qid}: cena que não existe (${o.target})`);
    }
  }
  for (const [key, entry] of Object.entries(DIALOGUE)) {
    for (const line of entry.lines ?? []) {
      const scene = line.when?.scene;
      if (scene && !CUTSCENES[scene] && !storyIds.has(scene)) issues.push(`${key}: condição de uma cena que não existe (${scene})`);
    }
  }
  issues.length
    ? fail(`cenas: ${issues.join(' · ')}`)
    : ok(`as cenas: ${Object.keys(CUTSCENES).length} roteiros com ${stepCount} passos, caminhos só no chão; ${storyCount} fala(s) de antes e depois das fases, nenhuma no meio`);
}

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
