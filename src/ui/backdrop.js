import { SCENES } from '../data/scenery.js';
import { SCENE_TILES } from '../data/sceneManifest.js';
import { buildSceneGrid } from '../systems/terrain.js';
import { getSheet, preloadAssets } from '../render/assets.js';

/**
 * Fundo dos menus: um trecho de rota montado pelo próprio gerador do cenário
 * (systems/terrain.js), pintado em 1x num canvas que o CSS amplia sem
 * suavizar (#menu-bg). É a identidade do jogo: o mesmo FireRed da partida.
 * Enquanto a tira de metatiles não carrega, fica o fundo escuro.
 */
export function paintMenuBackdrop(canvas, { scene = 'route', seed = 'menu', cols = 48, rows = 28 } = {}) {
  const recipe = SCENES[scene];
  if (!canvas || !recipe) return;
  const key = `scene/${recipe.sheet}`;
  preloadAssets([key]);

  const paint = () => {
    const sheet = getSheet(key);
    if (!sheet) { setTimeout(paint, 120); return; }
    const grid = buildSceneGrid(scene, cols, rows, seed);
    const frameOf = new Map(SCENE_TILES[recipe.sheet].ids.map((id, i) => [id, i]));
    canvas.width = cols * 16;
    canvas.height = rows * 16;
    const ctx = canvas.getContext('2d');
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const frame = frameOf.get(grid.cells[y * cols + x]);
        if (frame !== undefined) ctx.drawImage(sheet.img, frame * 16, 0, 16, 16, x * 16, y * 16, 16, 16);
      }
    }
  };
  paint();
}
