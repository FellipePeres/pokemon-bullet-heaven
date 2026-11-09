import { CONFIG } from '../core/config.js';
import { SCENES } from '../data/scenery.js';
import { ALL_SCENE_TILES as SCENE_TILES } from '../data/sceneTiles.js';

/**
 * TERRENO DA ARENA — o chão da fase em metatiles do FireRed e o que bloqueia.
 *
 * buildSceneGrid monta o grid de um cenário (ID da metatile de cada casa e se
 * ela bloqueia), sempre igual para a mesma fase. Fica na lógica, e não só no
 * desenho, porque árvores, pedras e paredes bloqueiam o treinador e os
 * inimigos (o bot e os testes andam no mesmo terreno). O Renderer pinta o
 * mesmo grid (render/scenery.js).
 *
 * As receitas estão em data/scenery.js; os IDs abaixo são os do decomp
 * (include/constants/metatile_labels.h e os mapas da Rota 1, Floresta de
 * Viridian e Monte Lua). Quem bloqueia vem da colisão desses mapas
 * (`solid` em data/sceneManifest.js).
 */

/** Tamanho de uma metatile no mundo do jogo (16 px ampliados). */
export const TILE = 16 * CONFIG.render.pixelScale;

/* -------------------------------- sorteio -------------------------------- */

function rngFrom(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));

/* --------------------------------- grade --------------------------------- */

class Grid {
  constructor(cols, rows, fill) {
    this.cols = cols;
    this.rows = rows;
    this.cells = new Uint16Array(cols * rows).fill(fill);
  }

  inside(x, y) { return x >= 0 && y >= 0 && x < this.cols && y < this.rows; }
  get(x, y) { return this.inside(x, y) ? this.cells[y * this.cols + x] : -1; }
  set(x, y, id) { if (this.inside(x, y)) this.cells[y * this.cols + x] = id; }
}

/** Retângulos já ocupados (para enfeites não se encostarem). */
class Taken {
  constructor() { this.rects = []; }
  free(x, y, w, h, gap = 1) {
    return this.rects.every((r) => x + w + gap <= r.x || r.x + r.w + gap <= x || y + h + gap <= r.y || r.y + r.h + gap <= y);
  }
  add(x, y, w, h) { this.rects.push({ x, y, w, h }); }
}

/** Caixa com borda (9 pedaços): [[TL, T, TR], [L, C, R], [BL, B, BR]]. */
function nineSlice(grid, x, y, w, h, s) {
  for (let j = 0; j < h; j++) {
    const row = s[j === 0 ? 0 : j === h - 1 ? 2 : 1];
    for (let i = 0; i < w; i++) grid.set(x + i, y + j, row[i === 0 ? 0 : i === w - 1 ? 2 : 1]);
  }
}

/** Área perto do centro, onde o treinador começa: fica limpa. */
function nearCenter(grid, x, y, w, h, radius) {
  const cx = grid.cols / 2, cy = grid.rows / 2;
  return x - radius < cx && cx < x + w + radius && y - radius < cy && cy < y + h + radius;
}

/* --------------------------------- rota ---------------------------------- */

const ROUTE = {
  grass: [0x8, 0x9, 0x10, 0x11], mowed: 0x1, tall: 0xD, flower: 0x4,
  ledge: [0xB0, 0x87, 0xB1],
  sand: [[0xD3, 0xD4, 0xD5], [0xDB, 0xDC, 0xDD], [0xE3, 0xE4, 0xE5]],
  // metade esquerda/direita de uma árvore 2x2; o par muda com o vizinho
  canopy: { left: [0x1E, 0x1C], right: [0x1F, 0x1D] },        // [sem vizinho, com vizinho]
  lower: { left: [0x16, 0x14], right: [0x17, 0x15] },         // árvore embaixo
  trunk: { left: [0x26, 0x24], right: [0x27, 0x25] },         // chão embaixo
  top: [0xE, 0xF]                                             // copa sobre a grama
};

/** Mata fechada nas bordas: `depth` árvores de espessura. */
function forestBorder(trees, ucols, urows, depth) {
  for (let uy = 0; uy < urows; uy++) {
    for (let ux = 0; ux < ucols; ux++) {
      if (ux < depth || uy < depth || ux >= ucols - depth || uy >= urows - depth) trees[uy * ucols + ux] = 1;
    }
  }
}

function blob(grid, rng, cx, cy, rx, ry, paint) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d <= 1 - rng() * 0.25) paint(x, y);
    }
  }
}

function buildRoute(grid, rng) {
  const { cols, rows } = grid;
  const area = cols * rows;
  for (let i = 0; i < grid.cells.length; i++) {
    grid.cells[i] = rng() < 0.12 ? ROUTE.mowed : ROUTE.grass[Math.floor(rng() * 4)];
  }
  const taken = new Taken();

  // caminhos de areia (retas que não se cruzam: o FireRed só tem cantos de dentro em curvas)
  for (let i = 0; i < Math.round(area / 1400); i++) {
    const horizontal = rng() < 0.6;
    const w = horizontal ? between(rng, 12, 28) : 3;
    const h = horizontal ? 3 : between(rng, 10, 20);
    const x = between(rng, 3, cols - w - 3), y = between(rng, 3, rows - h - 3);
    if (!taken.free(x, y, w, h, 3)) continue;
    nineSlice(grid, x, y, w, h, ROUTE.sand);
    taken.add(x, y, w, h);
  }
  const onGrass = (x, y) => ROUTE.grass.includes(grid.get(x, y)) || grid.get(x, y) === ROUTE.mowed;

  // grama alta
  for (let i = 0; i < Math.round(area / 260); i++) {
    blob(grid, rng, between(rng, 0, cols), between(rng, 0, rows), between(rng, 2, 6), between(rng, 2, 4), (x, y) => {
      if (onGrass(x, y)) grid.set(x, y, ROUTE.tall);
    });
  }
  // flores
  for (let i = 0; i < Math.round(area / 320); i++) {
    const cx = between(rng, 0, cols), cy = between(rng, 0, rows);
    for (let y = cy; y < cy + 3; y++) for (let x = cx; x < cx + 3; x++) {
      if (rng() < 0.45 && onGrass(x, y)) grid.set(x, y, ROUTE.flower);
    }
  }
  // desníveis (ledges)
  for (let i = 0; i < Math.round(area / 700); i++) {
    const len = between(rng, 4, 9), x = between(rng, 3, cols - len - 3), y = between(rng, 4, rows - 5);
    let ok = true;
    for (let k = 0; k < len; k++) ok = ok && onGrass(x + k, y);
    if (!ok || !taken.free(x, y, len, 1, 2)) continue;
    for (let k = 0; k < len; k++) grid.set(x + k, y, k === 0 ? ROUTE.ledge[0] : k === len - 1 ? ROUTE.ledge[2] : ROUTE.ledge[1]);
    taken.add(x, y, len, 1);
  }

  // árvores: uma grade de 2x2; a borda inteira é mata fechada
  const ucols = Math.ceil(cols / 2), urows = Math.ceil(rows / 2);
  const trees = new Uint8Array(ucols * urows);
  const treeAt = (ux, uy) => ux < 0 || uy < 0 || ux >= ucols || uy >= urows || trees[uy * ucols + ux] === 1;
  forestBorder(trees, ucols, urows, 2);
  for (let i = 0; i < Math.round((ucols * urows) / 40); i++) {
    const w = between(rng, 1, 3), h = between(rng, 1, 2);
    const ux = between(rng, 2, ucols - w - 2), uy = between(rng, 2, urows - h - 2);
    if (nearCenter(grid, ux * 2, uy * 2, w * 2, h * 2, 8) || !taken.free(ux * 2, uy * 2 - 1, w * 2, h * 2 + 1, 1)) continue;
    for (let j = 0; j < h; j++) for (let k = 0; k < w; k++) trees[(uy + j) * ucols + ux + k] = 1;
    taken.add(ux * 2, uy * 2 - 1, w * 2, h * 2 + 1);
  }
  for (let uy = 0; uy < urows; uy++) {
    for (let ux = 0; ux < ucols; ux++) {
      if (!treeAt(ux, uy)) continue;
      const x = ux * 2, y = uy * 2;
      const L = treeAt(ux - 1, uy) ? 1 : 0, R = treeAt(ux + 1, uy) ? 1 : 0;
      grid.set(x, y, ROUTE.canopy.left[L]);
      grid.set(x + 1, y, ROUTE.canopy.right[R]);
      const below = treeAt(ux, uy + 1) ? ROUTE.lower : ROUTE.trunk;
      grid.set(x, y + 1, below.left[L]);
      grid.set(x + 1, y + 1, below.right[R]);
      if (!treeAt(ux, uy - 1)) {
        grid.set(x, y - 1, ROUTE.top[0]);
        grid.set(x + 1, y - 1, ROUTE.top[1]);
      }
    }
  }
}

/* -------------------------------- floresta ------------------------------- */

const FOREST = {
  grass: [0x8, 0x9, 0x10, 0x11, 0x1], tall: 0xD,
  sand: [[0xD0, 0xD1, 0xD2], [0xD8, 0xD9, 0xDA], [0xE0, 0xE1, 0xE2]],
  // árvore grande, 3 de largura
  first: [0x288, 0x299, 0x28A],    // linha de cima (nada em cima)
  canopy: [0x298, 0x299, 0x29A],   // linha de cima com árvore em cima
  lower: [0x290, 0x291],           // linha de baixo com árvore embaixo
  last: [0x290, 0x2A1],            // linha de baixo da última árvore
  right: [0x2A2, 0x292],           // terceira coluna: [sem vizinho, com vizinho à direita]
  trunk: [0x2A3, 0x2A4, 0x2A5],
  top: { tall: 0x284, mowed: 0x281 }
};

function buildForest(grid, rng) {
  const { cols, rows } = grid;
  const area = cols * rows;
  grid.cells.fill(FOREST.tall);
  const taken = new Taken();

  // clareiras de grama baixa e trilhas de areia
  for (let i = 0; i < Math.round(area / 180); i++) {
    blob(grid, rng, between(rng, 0, cols), between(rng, 0, rows), between(rng, 3, 8), between(rng, 2, 5), (x, y) => {
      grid.set(x, y, FOREST.grass[Math.floor(rng() * FOREST.grass.length)]);
    });
  }
  for (let i = 0; i < Math.round(area / 1800); i++) {
    const w = between(rng, 8, 18), h = 3;
    const x = between(rng, 4, cols - w - 4), y = between(rng, 4, rows - h - 4);
    if (!taken.free(x, y, w, h, 3)) continue;
    nineSlice(grid, x, y, w, h, FOREST.sand);
    taken.add(x, y, w, h);
  }

  const ucols = Math.ceil(cols / 3), urows = Math.ceil(rows / 2);
  const trees = new Uint8Array(ucols * urows);
  const treeAt = (ux, uy) => ux < 0 || uy < 0 || ux >= ucols || uy >= urows || trees[uy * ucols + ux] === 1;
  forestBorder(trees, ucols, urows, 2);
  for (let i = 0; i < Math.round((ucols * urows) / 12); i++) {
    const w = between(rng, 1, 3), h = between(rng, 1, 3);
    const ux = between(rng, 2, ucols - w - 2), uy = between(rng, 2, urows - h - 2);
    if (nearCenter(grid, ux * 3, uy * 2, w * 3, h * 2, 8) || !taken.free(ux * 3, uy * 2 - 1, w * 3, h * 2 + 2, 1)) continue;
    for (let j = 0; j < h; j++) for (let k = 0; k < w; k++) trees[(uy + j) * ucols + ux + k] = 1;
    taken.add(ux * 3, uy * 2 - 1, w * 3, h * 2 + 2);
  }
  // copas e troncos primeiro (caem nas casas de chão em volta das árvores)
  for (let uy = 0; uy < urows; uy++) {
    for (let ux = 0; ux < ucols; ux++) {
      if (!treeAt(ux, uy)) continue;
      const x = ux * 3, y = uy * 2;
      if (!treeAt(ux, uy - 1)) {
        grid.set(x + 1, y - 1, grid.get(x + 1, y - 1) === FOREST.tall ? FOREST.top.tall : FOREST.top.mowed);
      }
      if (!treeAt(ux, uy + 1)) FOREST.trunk.forEach((id, k) => grid.set(x + k, y + 2, id));
    }
  }
  for (let uy = 0; uy < urows; uy++) {
    for (let ux = 0; ux < ucols; ux++) {
      if (!treeAt(ux, uy)) continue;
      const x = ux * 3, y = uy * 2;
      (treeAt(ux, uy - 1) ? FOREST.canopy : FOREST.first).forEach((id, k) => grid.set(x + k, y, id));
      const lower = treeAt(ux, uy + 1) ? FOREST.lower : FOREST.last;
      grid.set(x, y + 1, lower[0]);
      grid.set(x + 1, y + 1, lower[1]);
      grid.set(x + 2, y + 1, FOREST.right[treeAt(ux + 1, uy) ? 1 : 0]);
    }
  }
}

/* -------------------------------- caverna -------------------------------- */

const CAVE = {
  floor: 0x281, rocks: [0x282, 0x283],
  crater: [[0x2D5, 0x2D6], [0x2DD, 0x2DE]],
  ridge: [[0x288, 0x289, 0x28A], [0x290, 0x291, 0x292], [0x298, 0x299, 0x29A]]
};

function buildCave(grid, rng) {
  const { cols, rows } = grid;
  const area = cols * rows;
  for (let i = 0; i < grid.cells.length; i++) {
    grid.cells[i] = rng() < 0.008 ? CAVE.rocks[Math.floor(rng() * 2)] : CAVE.floor;
  }
  const taken = new Taken();
  // paredões (blocos de rocha elevada)
  for (let i = 0; i < Math.round(area / 300); i++) {
    const tall = rng() < 0.4;
    const w = tall ? 3 : between(rng, 4, 10), h = tall ? between(rng, 6, 12) : between(rng, 3, 5);
    const x = between(rng, 4, cols - w - 4), y = between(rng, 4, rows - h - 4);
    if (nearCenter(grid, x, y, w, h, 8) || !taken.free(x, y, w, h, 3)) continue;
    nineSlice(grid, x, y, w, h, CAVE.ridge);
    taken.add(x, y, w, h);
  }
  // crateras
  for (let i = 0; i < Math.round(area / 450); i++) {
    const x = between(rng, 3, cols - 5), y = between(rng, 3, rows - 5);
    if (!taken.free(x, y, 2, 2, 1)) continue;
    CAVE.crater.forEach((row, j) => row.forEach((id, k) => grid.set(x + k, y + j, id)));
    taken.add(x, y, 2, 2);
  }
  // paredes da caverna em volta (como o Monte Lua)
  const W = cols - 1, H = rows - 1;
  for (let x = 0; x <= W; x++) {
    grid.set(x, 0, 0x2C4);
    grid.set(x, 1, 0x311);
    grid.set(x, H - 1, 0x289);
    grid.set(x, H, 0x2A3);
  }
  for (let y = 1; y < H - 1; y++) {
    grid.set(0, y, 0x2C7);
    grid.set(1, y, 0x292);
    grid.set(W - 1, y, 0x290);
    grid.set(W, y, 0x2C6);
  }
  grid.set(0, 0, 0x29B); grid.set(1, 1, 0x29B);
  grid.set(W, 0, 0x29C); grid.set(W - 1, 1, 0x29C); grid.set(W, 1, 0x2C6);
  grid.set(0, H - 1, 0x2C7); grid.set(1, H - 1, 0x2A3);
  grid.set(W - 1, H - 1, 0x2A4); grid.set(W, H - 1, 0x2C6);
}

/* --------------------------------- salões -------------------------------- */

function mapCell(map, x, y) {
  return map.grid[y * map.width + x];
}

function stamp(grid, map, [sx, sy, w, h], x, y) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) grid.set(x + i, y + j, mapCell(map, sx + i, sy + j));
}

/** Faixa de parede (alto ou pé): cantos fixos e o meio repetido. */
function band(grid, map, spec, y0) {
  const [r0, r1] = spec.rows;
  const left = spec.left ? spec.left[1] - spec.left[0] : 0;
  const right = spec.right ? spec.right[1] - spec.right[0] : 0;
  const [p0, p1] = spec.repeat;
  for (let j = 0; j < r1 - r0; j++) {
    for (let x = 0; x < grid.cols; x++) {
      let sx;
      if (x < left) sx = spec.left[0] + x;
      else if (x >= grid.cols - right) sx = spec.right[0] + (x - (grid.cols - right));
      else sx = p0 + ((x - left) % (p1 - p0));
      grid.set(x, y0 + j, mapCell(map, sx, r0 + j));
    }
  }
  if (spec.door) {
    const [, dy, dw] = spec.door;
    stamp(grid, map, spec.door, Math.floor((grid.cols - dw) / 2), y0 + (dy - r0));
  }
}

function buildRoom(grid, rng, recipe, map) {
  const { cols, rows } = grid;
  const [fx, fy, fw, fh] = recipe.floor;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) grid.set(x, y, mapCell(map, fx + (x % fw), fy + (y % fh)));

  const topRows = recipe.top ? recipe.top.rows[1] - recipe.top.rows[0] : 0;
  const bottomRows = recipe.bottom ? recipe.bottom.rows[1] - recipe.bottom.rows[0] : 0;
  const leftCols = recipe.sides?.left ? recipe.sides.left[1] - recipe.sides.left[0] : 0;
  const rightCols = recipe.sides?.right ? recipe.sides.right[1] - recipe.sides.right[0] : 0;
  const taken = new Taken();

  if (recipe.center) {
    const [, , w, h] = recipe.center;
    const x = Math.floor((cols - w) / 2), y = Math.floor((rows - h) / 2);
    stamp(grid, map, recipe.center, x, y);
    taken.add(x, y, w, h);
  }
  // enfeites numa grade com sorteio leve, longe das paredes e do centro
  const s = recipe.spacing ?? 8;
  for (let gy = topRows + 2; gy < rows - bottomRows - 2; gy += s) {
    for (let gx = leftCols + 2; gx < cols - rightCols - 2; gx += s) {
      const rect = recipe.props?.[Math.floor(rng() * recipe.props.length)];
      if (!rect) continue;
      const [, , w, h] = rect;
      const x = gx + Math.floor(rng() * Math.max(1, s - w)), y = gy + Math.floor(rng() * Math.max(1, s - h));
      if (x + w > cols - rightCols - 1 || y + h > rows - bottomRows - 1) continue;
      if (nearCenter(grid, x, y, w, h, 5) || !taken.free(x, y, w, h, 2)) continue;
      stamp(grid, map, rect, x, y);
      taken.add(x, y, w, h);
    }
  }

  if (recipe.sides) {
    const [r0, r1] = recipe.sides.repeat;
    for (let y = topRows; y < rows - bottomRows; y++) {
      const sy = r0 + ((y - topRows) % (r1 - r0));
      for (let i = 0; i < leftCols; i++) grid.set(i, y, mapCell(map, recipe.sides.left[0] + i, sy));
      for (let i = 0; i < rightCols; i++) grid.set(cols - rightCols + i, y, mapCell(map, recipe.sides.right[0] + i, sy));
    }
  }
  if (recipe.top) band(grid, map, recipe.top, 0);
  if (recipe.bottom) band(grid, map, recipe.bottom, rows - bottomRows);
}

function buildRepeat(grid, recipe, map) {
  const [bx, by, bw, bh] = recipe.block;
  for (let y = 0; y < grid.rows; y++) for (let x = 0; x < grid.cols; x++) {
    grid.set(x, y, mapCell(map, bx + (x % bw), by + (y % bh)));
  }
}

/** O layout pronto da tira (o salão do Kyogre): copiado como está; o que sobrar fica com a 1ª metatile. */
function buildFixed(grid, map) {
  const { cols, rows, cells } = map.layout;
  for (let y = 0; y < grid.rows; y++) for (let x = 0; x < grid.cols; x++) {
    grid.set(x, y, x < cols && y < rows ? cells[y * cols + x] : map.ids[0]);
  }
}

/**
 * Monta o grid de um cenário: `cells` (ID da metatile do FireRed, linha a
 * linha) e `solid` (1 onde bloqueia). `seed` deixa o desenho igual toda vez
 * que a mesma fase abre.
 */
export function buildSceneGrid(sceneId, cols, rows, seed = sceneId) {
  const recipe = SCENES[sceneId];
  if (!recipe) throw new Error(`Cenário desconhecido: ${sceneId}`);
  const grid = new Grid(cols, rows, 0);
  const rng = rngFrom(`${seed}:${sceneId}`);
  const map = SCENE_TILES[recipe.sheet];
  if (recipe.kind === 'route') buildRoute(grid, rng);
  else if (recipe.kind === 'forest') buildForest(grid, rng);
  else if (recipe.kind === 'cave') buildCave(grid, rng);
  else if (recipe.kind === 'room') buildRoom(grid, rng, recipe, map);
  else if (recipe.kind === 'repeat') buildRepeat(grid, recipe, map);
  else if (recipe.kind === 'fixed') buildFixed(grid, map);
  const solidIds = new Set(map.solid);
  grid.solid = Uint8Array.from(grid.cells, (id) => (solidIds.has(id) ? 1 : 0));
  return grid;
}

/* -------------------------------- colisão -------------------------------- */

/**
 * O terreno de uma partida: o grid de cada cenário da fase (montado uma vez)
 * e o que bloqueia no trecho atual. Só o treinador e os inimigos esbarram:
 * os Pokémon da equipe, os golpes e os itens passam por cima.
 *
 * As caixas de colisão são `{ oy, hw, hh }`: centro deslocado `oy` para baixo
 * do centro da entidade, meia largura e meia altura. O treinador esbarra só
 * com os pés, como no FireRed.
 */
export class Terrain {
  constructor(stage, world) {
    this.seed = stage.id;
    this.cols = Math.ceil(world.width / TILE);
    this.rows = Math.ceil(world.height / TILE);
    this.grids = new Map();
    this.scene = null;
    this.solid = null;
  }

  /** Grid de um cenário da fase (o Renderer pinta este mesmo grid). */
  grid(sceneId) {
    if (!this.grids.has(sceneId)) this.grids.set(sceneId, buildSceneGrid(sceneId, this.cols, this.rows, this.seed));
    return this.grids.get(sceneId);
  }

  setScene(sceneId) {
    this.scene = sceneId;
    this.solid = this.grid(sceneId).solid;
  }

  /** A casa bloqueia? Fora da arena conta como bloqueado. */
  solidAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.cols || ty >= this.rows) return true;
    return this.solid?.[ty * this.cols + tx] === 1;
  }

  /** A caixa com centro (cx, cy) encosta em alguma casa que bloqueia? */
  blocked(cx, cy, hw, hh) {
    const x1 = Math.floor((cx + hw) / TILE), y1 = Math.floor((cy + hh) / TILE);
    for (let ty = Math.floor((cy - hh) / TILE); ty <= y1; ty++) {
      for (let tx = Math.floor((cx - hw) / TILE); tx <= x1; tx++) {
        if (this.solidAt(tx, ty)) return true;
      }
    }
    return false;
  }

  /** A entidade, com essa caixa, está encostada em algo agora? */
  overlaps(entity, box) {
    return this.blocked(entity.x, entity.y + box.oy, box.hw, box.hh);
  }

  /**
   * Move a entidade por (dx, dy), um eixo de cada vez: bater de frente num
   * eixo não impede de deslizar no outro. Quem já está dentro de algo (o
   * trecho mudou embaixo dele) anda livre até sair. Devolve quanto andou.
   */
  move(entity, dx, dy, box) {
    if (this.overlaps(entity, box)) {
      entity.x += dx;
      entity.y += dy;
      return { x: dx, y: dy };
    }
    let mx = 0, my = 0;
    if (dx && !this.blocked(entity.x + dx, entity.y + box.oy, box.hw, box.hh)) { entity.x += dx; mx = dx; }
    if (dy && !this.blocked(entity.x, entity.y + dy + box.oy, box.hw, box.hh)) { entity.y += dy; my = dy; }
    return { x: mx, y: my };
  }

  /**
   * Ponto livre mais perto de (x, y) para uma entidade com essa caixa, buscando
   * em anéis de casas até `maxTiles` de distância; null se não houver.
   */
  freeSpot(x, y, box, maxTiles = 10) {
    if (!this.blocked(x, y + box.oy, box.hw, box.hh)) return { x, y };
    const tx0 = Math.floor(x / TILE), ty0 = Math.floor((y + box.oy) / TILE);
    for (let r = 1; r <= maxTiles; r++) {
      let best = null, bestD = Infinity;
      for (let ty = ty0 - r; ty <= ty0 + r; ty++) {
        for (let tx = tx0 - r; tx <= tx0 + r; tx++) {
          if (Math.max(Math.abs(tx - tx0), Math.abs(ty - ty0)) !== r) continue;
          const cx = (tx + 0.5) * TILE, cy = (ty + 0.5) * TILE;
          if (this.blocked(cx, cy, box.hw, box.hh)) continue;
          const d = (cx - x) ** 2 + (cy - y) ** 2;
          if (d < bestD) { bestD = d; best = { x: cx, y: cy - box.oy }; }
        }
      }
      if (best) return best;
    }
    return null;
  }

  /** Tira a entidade de dentro de um obstáculo, para o ponto livre mais perto. */
  place(entity, box) {
    const spot = this.freeSpot(entity.x, entity.y, box);
    if (spot) { entity.x = spot.x; entity.y = spot.y; }
    return !!spot;
  }
}
