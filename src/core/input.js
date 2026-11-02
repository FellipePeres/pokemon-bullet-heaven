/** Entrada do teclado. Mantém apenas o estado; quem interpreta é o gameplay. */

const MOVE_KEYS = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right'
};

/** Botões do controle no layout padrão da Gamepad API (Xbox: A B X Y). */
const PAD_BUTTONS = { 0: 'a', 1: 'b', 2: 'x', 3: 'y', 4: 'lb', 5: 'rb', 9: 'start', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };
const DEADZONE = 0.3;

export class Input {
  constructor() {
    this.keys = new Set();
    this.onAction = null; // callback (actionName) => void
    this.padPressed = new Set();
    this.padMove = { x: 0, y: 0 };

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

  /**
   * Lê o controle (Gamepad API) uma vez por quadro. O analógico e o direcional
   * andam; cada botão dispara a ação `pad:<botão>` no instante em que é apertado
   * (o Game decide o que ela faz: na partida ou nas telas).
   */
  poll() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const pad = [...navigator.getGamepads()].find(Boolean);
    if (!pad) { this.padMove = { x: 0, y: 0 }; return; }

    const pressed = new Set();
    pad.buttons.forEach((button, i) => { if (button.pressed && PAD_BUTTONS[i]) pressed.add(PAD_BUTTONS[i]); });

    let x = pad.axes[0] ?? 0;
    let y = pad.axes[1] ?? 0;
    if (Math.hypot(x, y) < DEADZONE) { x = 0; y = 0; }
    // o analógico inclinado também conta como direcional nas telas
    if (x || y) pressed.add(Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up'));
    if (!x && !y) {
      x = (pressed.has('right') ? 1 : 0) - (pressed.has('left') ? 1 : 0);
      y = (pressed.has('down') ? 1 : 0) - (pressed.has('up') ? 1 : 0);
    }
    const len = Math.hypot(x, y);
    this.padMove = len > 1 ? { x: x / len, y: y / len } : { x, y };

    for (const button of pressed) if (!this.padPressed.has(button)) this._action(`pad:${button}`);
    this.padPressed = pressed;
  }

  /** Vetor de movimento normalizado (teclado; sem tecla, o controle). */
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
    if (len > 0) return { x: x / len, y: y / len };
    return { ...this.padMove };
  }

  clear() {
    this.keys.clear();
  }
}
