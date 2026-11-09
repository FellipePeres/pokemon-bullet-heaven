import { SCENES } from '../data/scenery.js';
import { ALL_SCENE_TILES as SCENE_TILES } from '../data/sceneTiles.js';
import { getSheet, preloadAssets } from './assets.js';

/**
 * CENÁRIO DA ARENA — pinta o chão da fase com as metatiles do FireRed.
 *
 * O grid de cada cenário vem do terreno da partida (systems/terrain.js, o
 * mesmo que bloqueia o caminho). Aqui ele é pintado uma vez num canvas em 1x,
 * e o Renderer só recorta a parte que a câmera vê.
 *
 * Canvas prontos dos cenários da fase atual: monta no máximo um por quadro
 * (os do resto da fase vão ficando prontos antes de o trecho chegar) e
 * descarta os da fase anterior.
 */
export class SceneryCache {
  constructor() {
    this.stageId = null;
    this.canvases = new Map();
  }

  /** Começa a baixar as tiras de metatiles que a fase vai usar. */
  static preload(sceneIds) {
    preloadAssets([...new Set(sceneIds)].filter((id) => SCENES[id]).map((id) => `scene/${SCENES[id].sheet}`));
  }

  /** Canvas do cenário, ou null enquanto a tira não carregou. */
  get(run, sceneId) {
    if (run.stage.id !== this.stageId) {
      this.stageId = run.stage.id;
      this.canvases.clear();
    }
    if (this.canvases.has(sceneId)) return this.canvases.get(sceneId);
    const canvas = this._paint(run, sceneId);
    if (canvas) this.canvases.set(sceneId, canvas);
    return canvas;
  }

  /** Deixa pronto o próximo cenário da fase que ainda falta (um por chamada). */
  warm(run, sceneIds) {
    for (const id of sceneIds) {
      if (this.canvases.has(id)) continue;
      this.get(run, id);
      return;
    }
  }

  _paint(run, sceneId) {
    const recipe = SCENES[sceneId];
    const sheet = recipe && getSheet(`scene/${recipe.sheet}`);
    if (!sheet || typeof document === 'undefined') return null;
    const grid = run.terrain.grid(sceneId);
    const { cols, rows } = grid;
    const frameOf = new Map(SCENE_TILES[recipe.sheet].ids.map((id, i) => [id, i]));
    const canvas = document.createElement('canvas');
    canvas.width = cols * 16;
    canvas.height = rows * 16;
    const ctx = canvas.getContext('2d');
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const frame = frameOf.get(grid.cells[y * cols + x]);
        if (frame !== undefined) ctx.drawImage(sheet.img, frame * 16, 0, 16, 16, x * 16, y * 16, 16, 16);
      }
    }
    return canvas;
  }
}
