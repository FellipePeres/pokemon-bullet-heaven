import { SCENE_TILES } from './sceneManifest.js';
import { DIVE_WORLD } from './diveWorld.js';

/**
 * TODAS AS TIRAS DE METATILES DOS CENÁRIOS: as do FireRed (sceneManifest.js, do
 * extract.py) e a do salão do Kyogre (0.37, o tileset cave do Emerald, de
 * tools/assets/dive.py). A do salão traz o layout inteiro da arena (`layout`):
 * o cenário `fixed` (data/scenery.js) é pintado exatamente assim.
 */
const ARENA = DIVE_WORLD.arena;

export const ALL_SCENE_TILES = {
  ...SCENE_TILES,
  [ARENA.sheet]: { ids: ARENA.ids, solid: [], layout: { cols: ARENA.cols, rows: ARENA.rows, cells: ARENA.cells } }
};
