/** Entrada do teclado. Mantém apenas o estado; quem interpreta é o gameplay. */

const MOVE_KEYS = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right'
};

export class Input {
  constructor() {
    this.keys = new Set();
    this.onAction = null; // callback (actionName) => void

    window.addEventListener('keydown', (e) => this._onKeyDown(e));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  _onKeyDown(e) {
    if (e.repeat) return;
    this.keys.add(e.code);

    // ações pontuais (disparam uma vez por tecla pressionada)
    if (e.code === 'Escape') this._action('pause');
    else if (e.code === 'Tab') { e.preventDefault(); this._action('cycleSlot'); }
    else if (/^Digit[1-6]$/.test(e.code)) this._action('team:' + (Number(e.code.slice(5)) - 1));

    if (MOVE_KEYS[e.code] || e.code === 'Space') e.preventDefault();
  }

  _action(name) {
    if (this.onAction) this.onAction(name);
  }

  /** Vetor de movimento normalizado. */
  getMoveVector() {
    let x = 0, y = 0;
    for (const code of this.keys) {
      const dir = MOVE_KEYS[code];
      if (dir === 'up') y -= 1;
      else if (dir === 'down') y += 1;
      else if (dir === 'left') x -= 1;
      else if (dir === 'right') x += 1;
    }
    const len = Math.hypot(x, y);
    return len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
  }

  clear() {
    this.keys.clear();
  }
}
