/**
 * Grade espacial uniforme.
 * Com centenas de inimigos em tela, testar todos contra todos fica caro.
 * A grade limita as verificações aos inimigos das células vizinhas.
 */
export class SpatialGrid {
  constructor(cellSize = 96) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  _key(cx, cy) {
    return cx * 100000 + cy;
  }

  clear() {
    this.cells.clear();
  }

  /** Reconstrói a grade a partir da lista de inimigos (uma vez por frame). */
  rebuild(entities) {
    this.clear();
    for (const e of entities) {
      if (e.dead) continue;
      const key = this._key(Math.floor(e.x / this.cellSize), Math.floor(e.y / this.cellSize));
      let cell = this.cells.get(key);
      if (!cell) this.cells.set(key, (cell = []));
      cell.push(e);
    }
  }

  /** Todos os candidatos dentro de um raio (pode devolver alguns a mais — filtre depois). */
  query(x, y, radius, out = []) {
    out.length = 0;
    const cs = this.cellSize;
    const minX = Math.floor((x - radius) / cs);
    const maxX = Math.floor((x + radius) / cs);
    const minY = Math.floor((y - radius) / cs);
    const maxY = Math.floor((y + radius) / cs);
    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const cell = this.cells.get(this._key(cx, cy));
        if (cell) for (const e of cell) out.push(e);
      }
    }
    return out;
  }
}
