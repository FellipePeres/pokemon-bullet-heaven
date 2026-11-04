import { el, create, clear } from './dom.js';
import { getPokemon } from '../data/pokemon.js';
import { getAbility } from '../data/abilities.js';
import { typeColor, typeName } from '../data/types.js';
import { CONFIG } from '../core/config.js';
import { BOX_SIZE, boxCount, monAt, normalizePC, previewMove } from '../systems/pc.js';
import { isBonusMove } from '../data/bonusMoves.js';

/**
 * O PC — o "Pokémon Storage System" do FireRed, trazido do Pokemon All
 * (DEC-004 de lá; 0.12 aqui). A tela é composta em pixels do GBA, 288x160 (os
 * 240 do GBA mais a coluna da equipe), e ampliada pelo maior inteiro que cabe
 * na janela, para todo pixel da arte sair do mesmo tamanho.
 *
 * - À esquerda, os DADOS do Pokémon sob a mão (ou na mão).
 * - No meio, a caixa: 6x5 casas sobre o papel de parede do jogo, as setas
 *   trocam de caixa.
 * - À direita, a equipe, sempre à vista; a bolinha marca os 3 em campo.
 * - A mão é o cursor. Um clique pega, outro solta: em lugar vazio ele vai para
 *   lá, em cima de outro os dois trocam. Antes de soltar, a moldura diz o que
 *   acontece: dourada vai, laranja troca, vermelha não pode.
 *
 * As regras moram em systems/pc.js; aqui só se desenha e se pega e solta.
 */

const SCREEN = { w: 288, h: 160 };
const DATA_PANEL = { x: 0, y: 2, w: 80, h: 156 };
const BANNER = { x: 98, y: 2, w: 124, h: 22 };
const ARROWS = { '-1': { x: 86, y: 7, w: 8, h: 12 }, '1': { x: 226, y: 7, w: 8, h: 12 } };
const WALLPAPER = { x: 82, y: 25, w: 156, h: 116 };
const CLOSE_BUTTON = { x: 125, y: 143, w: 70, h: 16 };
const GRID = { x: 88, y: 27, w: 24, h: 22, columns: 6, rows: 5 };
const TEAM_PANEL = { x: 240, y: 0, w: 48, h: 160 };
const TEAM_SLOTS = Array.from({ length: 6 }, (_, i) => ({ x: 249, y: 4 + 24 * i, w: 30, h: 23 }));
/** A ponta do dedo dentro do sprite da mão: é ela que segue o mouse. */
const HAND_TIP = { x: 3, y: 19 };
/** Os 16 papéis de parede do FireRed, na ordem do jogo: a caixa N nasce com o N-ésimo. */
const WALLPAPERS = ['01-forest', '02-city', '03-desert', '04-savanna', '05-crag', '06-volcano', '07-snow', '08-cave',
  '09-beach', '10-seafloor', '11-river', '12-sky', '13-polka-dot', '14-pokecenter', '15-machine', '16-simple'];

const cellRect = (index) => ({
  x: GRID.x + (index % GRID.columns) * GRID.w,
  y: GRID.y + Math.floor(index / GRID.columns) * GRID.h,
  w: GRID.w, h: GRID.h
});

/** O retângulo como variáveis de CSS; a classe `.gba` faz a conta com `--px`. */
function place(node, rect) {
  node.style.setProperty('--x', rect.x);
  node.style.setProperty('--y', rect.y);
  node.style.setProperty('--w', rect.w);
  node.style.setProperty('--h', rect.h);
  return node;
}

const sameSpot = (a, b) => !!a && !!b && a.area === b.area && (a.slot ?? a.index) === (b.slot ?? b.index);

export class PCScreen {
  constructor(game) {
    this.game = game;
    this.box = 0;
    this.held = null;      // de onde saiu o Pokémon que está na mão
    this.aim = null;       // para onde a mão aponta: { area: 'box'|'team'|'arrow'|'banner'|'close', ... }
    this.mouse = false;    // a mão está seguindo o mouse
    this.message = '';
    this.onKey = (e) => this._key(e);
    this.onResize = () => this._scale();
  }

  get journey() { return this.game.campaign.journey; }
  get maxSize() { return CONFIG.team.maxSize; }

  open() {
    this.isOpen = true;
    this.held = null;
    this.message = '';
    this.aim = { area: 'box', slot: this.box * BOX_SIZE };
    window.addEventListener('keydown', this.onKey, true);
    window.addEventListener('resize', this.onResize);
    this._bindPointer();
    this._scale();
    this.render();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    window.removeEventListener('keydown', this.onKey, true);
    window.removeEventListener('resize', this.onResize);
    this.held = null;
  }

  /* ============================== escala ============================== */

  /** O maior inteiro em pixel físico que cabe; o ícone um degrau abaixo (até 80%). */
  _scale() {
    const screen = el('pc-screen');
    if (!screen) return;
    const dpr = window.devicePixelRatio || 1;
    const fit = Math.min((window.innerWidth - 32) / (SCREEN.w + 8), (window.innerHeight - 96) / (SCREEN.h + 8));
    const exact = Math.max(fit, 0.5) * dpr;
    const whole = Math.min(12, Math.floor(exact));
    const device = whole >= 1 && (dpr < 2 || whole / exact >= 0.95) ? whole : exact;
    const icon = Number.isInteger(device) ? Math.max(1, Math.floor(device * 0.8)) : device * 0.75;
    this.px = device / dpr;
    screen.style.setProperty('--px', `${device / dpr}px`);
    screen.style.setProperty('--ipx', `${icon / dpr}px`);
  }

  /* ============================== desenho ============================== */

  render() {
    const screen = el('pc-screen');
    if (!screen) return;
    const journey = this.journey;
    const hasTeam = !!journey?.team?.members?.length;
    const boxes = hasTeam ? boxCount(journey) : 1;
    this.box = Math.min(this.box, boxes - 1);
    const hand = this._hand();
    clear(screen);

    screen.appendChild(this._dataPanel());

    // a caixa: faixa com o nome, setas e o papel de parede
    const wall = WALLPAPERS[this.box % WALLPAPERS.length];
    const banner = place(create('button', `gba pc-banner${this.aim?.area === 'banner' ? ' pc-banner--aim' : ''}`), BANNER);
    banner.type = 'button';
    banner.style.backgroundImage = `url(assets/pc/wallpapers/${wall}-banner.png)`;
    banner.textContent = `Caixa ${this.box + 1}`;
    this._bind(banner, { area: 'banner' });
    screen.appendChild(banner);
    for (const side of [-1, 1]) {
      const aimed = this.aim?.area === 'arrow' && this.aim.side === side;
      const arrow = place(create('button', `gba pc-arrow pc-arrow--${side < 0 ? 'left' : 'right'}${aimed ? (this.held ? ' pc-arrow--carry' : ' pc-arrow--aim') : ''}`), ARROWS[side]);
      arrow.type = 'button';
      arrow.setAttribute('aria-label', side < 0 ? 'Caixa anterior' : 'Próxima caixa');
      this._bind(arrow, { area: 'arrow', side });
      screen.appendChild(arrow);
    }
    const paper = place(create('div', 'gba pc-wall'), WALLPAPER);
    paper.style.backgroundImage = `url(assets/pc/wallpapers/${wall}.png)`;
    screen.appendChild(paper);

    for (let i = 0; i < BOX_SIZE; i++) {
      screen.appendChild(this._slot({ area: 'box', slot: this.box * BOX_SIZE + i }, cellRect(i)));
    }

    // a equipe, fixa à direita
    screen.appendChild(place(create('div', 'gba pc-team'), TEAM_PANEL));
    TEAM_SLOTS.forEach((rect, index) => screen.appendChild(this._slot({ area: 'team', index }, rect, true)));

    const close = place(create('button', `gba pc-button${this.aim?.area === 'close' ? ' pc-button--on' : ''}`), CLOSE_BUTTON);
    close.type = 'button';
    close.textContent = 'Fechar PC';
    this._bind(close, { area: 'close' });
    screen.appendChild(close);

    screen.appendChild(hand);
    this._placeHand();

    const count = hasTeam ? normalizePC(journey).length : 0;
    el('pc-hint').textContent = this.message || (!hasTeam
      ? 'Vença a primeira fase para a sua equipe passar a ser guardada na jornada.'
      : `${count} no PC · clique para pegar e soltar · Q/E trocam de caixa · Esc devolve`);
    el('pc-hint').classList.toggle('pc-hint--warn', !!this.message);
  }

  /** Uma casa da caixa ou vaga da equipe, com o ícone, a mira e o fantasma. */
  _slot(spot, rect, isTeam = false) {
    const journey = this.journey;
    const mon = this._shown(spot);
    const kind = this._aimKind(spot);
    const node = place(create('button', `gba pc-slot${isTeam ? ' pc-slot--team' : ''}${kind ? ` pc-slot--${kind}` : ''}`), rect);
    node.type = 'button';
    if (isTeam && mon && journey?.team?.active?.includes(mon.uid)) node.classList.add('pc-slot--field');
    if (mon) node.appendChild(this._icon(mon, !!kind));
    if (mon?.shiny) node.appendChild(create('span', 'pc-shiny', '✦'));
    const ghost = !mon && this._ghost(spot);
    if (ghost) node.appendChild(this._icon(ghost, false, true));
    const data = mon && getPokemon(mon.pokemonId);
    node.setAttribute('aria-label', data ? `${data.name}, Nv. ${mon.level}` : 'Vazio');
    this._bind(node, spot);
    return node;
  }

  _icon(mon, active = false, ghost = false) {
    const wrap = create('span', `pc-mon${ghost ? ' pc-mon--ghost' : ''}`);
    const icon = create('span', `pc-icon${active ? ' pc-icon--active' : ''}`);
    icon.style.backgroundImage = `url(assets/pokemon/gen3/icons/${getPokemon(mon.pokemonId).dex}.png)`;
    wrap.appendChild(icon);
    return wrap;
  }

  /** O Pokémon que aparece no lugar: o que está na mão sai do lugar dele. */
  _shown(spot) {
    if (this.held && sameSpot(spot, this.held)) return null;
    return monAt(this.journey, spot);
  }

  /** A moldura do lugar: 'point' só apontando; com um Pokémon na mão, o que acontece ao soltar. */
  _aimKind(spot) {
    if (!sameSpot(spot, this.aim)) return null;
    if (!this.held) return 'point';
    return previewMove(this.journey, this.held, spot, this.maxSize) ?? 'drop';
  }

  /**
   * O fantasma: onde o Pokémon vai parar se for solto. Na casa vazia mirada, o
   * da mão; na troca, o outro aparece de onde o primeiro saiu. Na vaga vazia
   * da equipe ele entra no fim da fila.
   */
  _ghost(spot) {
    if (!this.held || !this.aim) return null;
    const kind = previewMove(this.journey, this.held, this.aim, this.maxSize);
    if (kind === 'drop') {
      const members = this.journey.team.members.length - (this.held.area === 'team' ? 1 : 0);
      const target = this.aim.area === 'team' ? { area: 'team', index: members } : this.aim;
      return sameSpot(spot, target) ? monAt(this.journey, this.held) : null;
    }
    if (kind === 'swap' && sameSpot(spot, this.held)) return monAt(this.journey, this.aim);
    return null;
  }

  /** PKMN DATA: o Pokémon na mão, ou o sob a mão. */
  _dataPanel() {
    const panel = place(create('div', 'gba pc-data'), DATA_PANEL);
    panel.appendChild(create('span', 'pc-data__label', 'Dados'));
    const spot = this.aim?.area === 'box' || this.aim?.area === 'team' ? this.aim : null;
    const mon = this.held ? monAt(this.journey, this.held) : spot && monAt(this.journey, spot);
    if (!mon) return panel;
    const data = getPokemon(mon.pokemonId);
    const sprite = create('img', 'pc-data__sprite');
    sprite.src = `assets/pokemon/gen3/${mon.shiny ? 'front-shiny' : 'front'}/${data.dex}.png`;
    sprite.alt = '';
    panel.appendChild(sprite);
    const info = create('div', 'pc-data__info');
    info.appendChild(create('p', `pc-data__name${mon.shiny ? ' shiny' : ''}`, `${mon.shiny ? '✦ ' : ''}${data.name}`));
    const types = create('p', 'pc-types');
    for (const type of data.types) {
      const tag = create('span', 'pc-type', typeName(type));
      tag.style.background = typeColor(type);
      types.appendChild(tag);
    }
    info.appendChild(types);
    info.appendChild(create('p', 'pc-data__level', `Nv. ${mon.level}`));
    const move = getAbility(mon.abilities?.[0]);
    if (move) info.appendChild(create('p', 'pc-data__line', move.name));
    const second = mon.abilities?.find(isBonusMove);   // o 2º golpe (raro)
    if (second) info.appendChild(create('p', 'pc-data__line pc-data__bonus', `+ ${getAbility(second).name}`));
    const team = this.journey?.team;
    const where = mon.slot !== undefined ? 'No PC'
      : team?.active?.includes(mon.uid) ? 'Em campo' : 'Na reserva';
    info.appendChild(create('p', 'pc-data__line pc-data__where', where));
    panel.appendChild(info);
    return panel;
  }

  /* ============================== a mão ============================== */

  _hand() {
    if (!this.handNode) {
      this.handNode = create('span', 'pc-hand');
      this.handNode.setAttribute('aria-hidden', 'true');
    }
    const hand = this.handNode;
    clear(hand);
    const mon = this.held && monAt(this.journey, this.held);
    if (mon) {
      const carried = create('span', 'pc-hand__mon');
      carried.style.setProperty('--tip-x', HAND_TIP.x);
      carried.style.setProperty('--tip-y', HAND_TIP.y);
      carried.appendChild(this._icon(mon, true));
      hand.appendChild(carried);
    }
    hand.appendChild(create('span', 'pc-hand__sprite'));
    return hand;
  }

  /** Sem o mouse, a mão pousa sobre o lugar em foco e balança, como no jogo. */
  _placeHand() {
    const hand = this.handNode;
    hand.classList.toggle('pc-hand--free', this.mouse);
    if (this.mouse) return;
    const rect = this._rectOf(this.aim);
    if (!rect) { hand.hidden = true; return; }
    hand.hidden = false;
    place(hand, { x: rect.x + rect.w / 2 - 6, y: Math.max(rect.y - 12, -4), w: 18, h: 20 });
  }

  _rectOf(spot) {
    if (!spot) return null;
    if (spot.area === 'box') return cellRect(spot.slot - this.box * BOX_SIZE);
    if (spot.area === 'team') return TEAM_SLOTS[spot.index];
    if (spot.area === 'arrow') return ARROWS[spot.side];
    if (spot.area === 'banner') return BANNER;
    if (spot.area === 'close') return CLOSE_BUTTON;
    return null;
  }

  _bindPointer() {
    const screen = el('pc-screen');
    if (screen.dataset.bound) return;
    screen.dataset.bound = '1';
    screen.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || !this.handNode) return;
      const bounds = screen.getBoundingClientRect();
      this.handNode.style.setProperty('--mx', Math.floor((e.clientX - bounds.left) / this.px) - HAND_TIP.x);
      this.handNode.style.setProperty('--my', Math.floor((e.clientY - bounds.top) / this.px) - HAND_TIP.y);
      if (!this.mouse) { this.mouse = true; this._placeHand(); }
    });
    screen.addEventListener('pointerleave', () => { this.mouse = false; this._placeHand(); });
    // botão direito: devolve o que está na mão
    screen.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (this.held) { this.held = null; this.render(); }
    });
  }

  _bind(node, spot) {
    node.addEventListener('pointerenter', () => {
      if (sameSpot(spot, this.aim) && spot.side === this.aim?.side) return;
      this.aim = spot;
      this.message = '';
      this.render();
    });
    node.addEventListener('click', () => { this.aim = spot; this.act(spot); });
  }

  /* ============================== ações ============================== */

  /** Clique (ou Enter) num lugar: pega, solta, troca de caixa ou fecha. */
  act(spot) {
    if (spot.area === 'close') { this.game.menus.closeModal(); return; }
    if (spot.area === 'arrow') { this.flip(spot.side); return; }
    if (spot.area === 'banner') return;
    if (!this.journey?.team?.members?.length) return;

    if (!this.held) {
      if (monAt(this.journey, spot)) this.held = spot;
      this.render();
      return;
    }
    const kind = previewMove(this.journey, this.held, spot, this.maxSize);
    if (kind === 'blocked') {
      const members = this.journey.team.members.length;
      this.message = this.held.area === 'team' && members <= 1
        ? 'A equipe precisa de pelo menos um Pokémon.'
        : 'Equipe cheia: solte em cima de alguém da equipe para trocar.';
      this.render();
      return;
    }
    if (kind) this.game.pcMove(this.held, spot);
    this.held = null;
    this.render();
  }

  /** Troca de caixa; com um Pokémon na mão, ele vai junto. */
  flip(side) {
    const boxes = boxCount(this.journey);
    this.box = (this.box + side + boxes) % boxes;
    if (this.aim?.area === 'box') this.aim = { area: 'box', slot: this.box * BOX_SIZE + (this.aim.slot % BOX_SIZE) };
    this.render();
  }

  /** Teclado: setas movem a mão, Enter pega e solta, Q/E trocam de caixa, Esc devolve e fecha. */
  _key(e) {
    const key = e.code;
    const handled = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD',
      'Enter', 'Space', 'KeyZ', 'KeyQ', 'KeyE', 'PageUp', 'PageDown', 'Escape'];
    if (!handled.includes(key)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (this.mouse) { this.mouse = false; }
    if (key === 'Escape') {
      if (this.held) { this.held = null; this.render(); } else this.game.menus.closeModal();
      return;
    }
    if (key === 'KeyQ' || key === 'PageUp') { this.flip(-1); return; }
    if (key === 'KeyE' || key === 'PageDown') { this.flip(1); return; }
    if (key === 'Enter' || key === 'Space' || key === 'KeyZ') { if (this.aim) this.act(this.aim); return; }
    const dir = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1],
      ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] }[key];
    this.aim = this._step(this.aim, dir[0], dir[1]);
    this.message = '';
    this.render();
  }

  /** Para onde a mão vai com uma seta, a partir de onde está. */
  _step(aim, dx, dy) {
    const base = this.box * BOX_SIZE;
    const toBox = (col, row) => ({ area: 'box', slot: base + row * GRID.columns + col });
    if (!aim) return toBox(0, 0);
    if (aim.area === 'box') {
      const i = aim.slot - base;
      const col = i % GRID.columns, row = Math.floor(i / GRID.columns);
      if (dx > 0 && col === GRID.columns - 1) return { area: 'team', index: Math.min(5, Math.round(row * 1.25)) };
      if (dx < 0 && col === 0) return toBox(0, row);
      if (dy < 0 && row === 0) return { area: 'banner' };
      if (dy > 0 && row === GRID.rows - 1) return { area: 'close' };
      return toBox(col + dx, row + dy);
    }
    if (aim.area === 'team') {
      if (dx < 0) return toBox(GRID.columns - 1, Math.min(GRID.rows - 1, Math.round(aim.index / 1.25)));
      return { area: 'team', index: Math.max(0, Math.min(5, aim.index + dy)) };
    }
    if (aim.area === 'banner' || aim.area === 'arrow') {
      if (dy > 0) return toBox(2, 0);
      if (dx) return { area: 'arrow', side: dx };
      return aim;
    }
    if (aim.area === 'close') return dy < 0 ? toBox(2, GRID.rows - 1) : aim;
    return aim;
  }
}
