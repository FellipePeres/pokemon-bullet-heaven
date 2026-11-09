import { el, show, hide } from './dom.js';
import { DIVE } from '../data/dive.js';

/**
 * A INTERFACE DA DESCIDA — a barra de cima (as 3 bolhas de vida, o nível e a
 * profundidade, a barra das hordas do nível), o letreiro do meio da tela, a caixa
 * de texto do FireRed e a pausa. A regra está em game/Dive.js; aqui só se mostra.
 * `update` roda a cada quadro, então só mexe no DOM quando algo muda.
 */
export class DiveHUD {
  constructor(game) {
    this.game = game;
    this.shown = {};
    el('dive-dialog-box').onclick = () => (game.hall?.active ? game.hall : game.dive).confirm();
    el('dive-resume').onclick = () => game.dive.togglePause(false);
  }

  reset() { this.shown = {}; }

  update(dive, hall = null) {
    const lives = el('dive-lives').children;
    for (let i = 0; i < lives.length; i++) {
      lives[i].classList.toggle('gone', i >= dive.lives);
      lives[i].classList.toggle('pop', (dive.popped?.i === i) || !!dive.refilled);
    }
    const L = DIVE.levels[dive.level];
    const depth = `NÍVEL ${dive.level + 1} · ${L.depth} m`;
    if (this._changed('depth', depth)) el('dive-depth').textContent = depth;
    const prog = `${Math.round(dive.progress * 100)}%`;
    if (this._changed('prog', prog)) el('dive-prog').style.width = prog;

    const banner = dive.banner?.text ?? null;
    if (this._changed('banner', banner)) {
      el('dive-banner').textContent = banner ?? '';
      (banner ? show : hide)(el('dive-banner'));
    }

    const d = hall?.active ? hall.dialog : dive.dialog;
    const page = d ? d.pages[d.index] : null;
    if (this._changed('open', !!d)) (d ? show : hide)(el('dive-dialog'));
    if (d) {
      const text = page.slice(0, Math.floor(d.shown));
      if (this._changed('text', text)) el('dive-dialog-text').textContent = text;
      const done = d.shown >= page.length;
      if (this._changed('next', done)) el('dive-dialog-next').classList.toggle('on', done);
    }
    if (this._changed('paused', dive.paused)) (dive.paused ? show : hide)(el('dive-pause'));
  }

  _changed(key, value) {
    if (this.shown[key] === value) return false;
    this.shown[key] = value;
    return true;
  }
}
