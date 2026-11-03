/**
 * O menu da tela de título, como o menu do jogo: a escolhida ganha a Poké Ball
 * de ponteiro e avança; ↑ ↓ (ou W S) trocam, Enter, Espaço ou Z confirmam, e o
 * mouse escolhe ao passar por cima. Entradas desabilitadas são puladas.
 */
export class TitleMenu {
  constructor(menus) {
    this.menus = menus;
    this.index = 0;
    for (const [i, item] of this.items().entries()) item.addEventListener('mouseenter', () => this.select(i, false));
    document.addEventListener('keydown', (e) => this.onKey(e));
  }

  items() {
    return [...document.querySelectorAll('#title-menu .title-item')];
  }

  get active() {
    return !document.getElementById('screen-title')?.classList.contains('hidden') && !this.menus.openModal;
  }

  /** Escolhe a entrada `i` (pulando as desabilitadas na direção do movimento). */
  select(i, skipDisabled = true, step = 1) {
    const items = this.items();
    if (!items.length) return;
    let index = (i + items.length) % items.length;
    for (let tries = 0; skipDisabled && items[index].disabled && tries < items.length; tries++) {
      index = (index + step + items.length) % items.length;
    }
    this.index = index;
    items.forEach((item, k) => item.classList.toggle('on', k === index));
  }

  /** Ao abrir o título: a primeira entrada que dá para usar. */
  reset() {
    this.select(0);
  }

  onKey(e) {
    if (!this.active) return;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') { this.select(this.index - 1, true, -1); e.preventDefault(); }
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') { this.select(this.index + 1, true, 1); e.preventDefault(); }
    else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyZ') {
      const item = this.items()[this.index];
      if (item && !item.disabled) { item.click(); e.preventDefault(); }
    }
  }
}
