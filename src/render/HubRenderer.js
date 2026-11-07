import { CONFIG } from '../core/config.js';
import { getSheet, drawFrame } from './assets.js';
import { trainerFrame } from './trainer.js';
import { getTrainerLook } from '../data/trainers.js';

const T = 16;
/** Quadro parado de cada direção nas folhas do FireRed (a direita é a esquerda espelhada). */
const STAND = { down: 0, up: 1, left: 2, right: 2 };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * DESENHO DA VILA — o chão, as pessoas e o jogador, e por cima a camada que
 * cobre os personagens (a beirada do telhado, a copa das árvores), como as
 * camadas do FireRed. Tudo em escala inteira, sem suavizar: o canvas tem o
 * tamanho real da tela em pixels, e a escala é o maior inteiro que ainda mostra
 * `CONFIG.hub.view` tiles.
 */
export class HubRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext?.('2d') ?? null;
    this.scale = 3;
    this.insetTop = 0;      // a faixa de cima coberta pela barra (px do canvas)
    this.offset = { x: 0, y: 0 };
  }

  /**
   * Mede a tela de novo (ao abrir a vila e quando a janela muda de tamanho).
   * `barBottom` é onde a barra do topo termina (px de CSS): o mapa se
   * centraliza e a câmera segue o jogador na área de baixo dela.
   */
  resize(barBottom = 0) {
    const canvas = this.canvas;
    if (!canvas) return;
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    const width = Math.max(320, Math.round((canvas.clientWidth || CONFIG.canvas.width) * dpr));
    const height = Math.max(240, Math.round((canvas.clientHeight || CONFIG.canvas.height) * dpr));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    this.insetTop = Math.min(Math.round(barBottom * dpr), Math.round(height / 3));
    const { tilesWide, tilesHigh } = CONFIG.hub.view;
    this.scale = Math.max(2, Math.floor(Math.min(width / (tilesWide * T), (height - this.insetTop) / (tilesHigh * T))));
  }

  /** Converte um ponto da tela (px do canvas) no tile do mapa. */
  tileAt(px, py) {
    const size = T * this.scale;
    return { x: Math.floor((px - this.offset.x) / size), y: Math.floor((py - this.offset.y) / size) };
  }

  render(hub) {
    const ctx = this.ctx;
    if (!ctx || !hub.map) return;
    const S = this.scale;
    const size = T * S;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const mapW = hub.map.width * size;
    const mapH = hub.map.height * size;
    const p = hub.player;

    // a câmera segue o jogador sem sair do mapa; mapa pequeno (um cômodo) fica no
    // meio. Na vertical, conta só a área abaixo da barra do topo.
    const top = this.insetTop;
    const areaH = H - top;
    const ox = mapW <= W ? Math.round((W - mapW) / 2) : Math.round(clamp(W / 2 - (p.fx + 0.5) * size, W - mapW, 0));
    const oy = mapH <= areaH
      ? Math.round(top + (areaH - mapH) / 2)
      : Math.round(clamp(top + areaH / 2 - (p.fy + 0.5) * size, H - mapH, top));
    this.offset = { x: ox, y: oy };

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    const base = getSheet(`hub/${hub.mapId}`);
    if (base) ctx.drawImage(base.img, ox, oy, mapW, mapH);
    const decor = hub.decor;
    // os móveis comprados assentam no chão; a camada de cima deles vem depois das pessoas
    for (const item of decor) if (item.piece) this._piece(item, '');

    // quem está mais embaixo na tela fica na frente
    const actors = [];
    for (const item of decor) {
      if (item.piece) continue;
      actors.push({ y: item.y, order: 0, draw: () => this._sprite(`npc/${item.sprite}`, 0, false, item.x, item.y, item.oy ?? 0) });
    }
    for (const npc of hub.npcs) {
      actors.push({ y: npc.y, order: 1, draw: () => this._sprite(`npc/${npc.sprite}`, STAND[npc.dir], npc.dir === 'right', npc.x, npc.y, 0) });
    }
    actors.push({ y: p.fy, order: 2, draw: () => this._player(hub) });
    actors.sort((a, b) => a.y - b.y || a.order - b.order);
    for (const actor of actors) actor.draw();

    const cover = getSheet(`hub/${hub.mapId}-top`);
    if (cover) ctx.drawImage(cover.img, ox, oy, mapW, mapH);
    for (const item of decor) if (item.piece) this._piece(item, '-top');

    const fade = hub.fadeAlpha;
    if (fade > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${fade.toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  /** Um móvel do quarto (o chão dele, ou a camada de cima com `layer` = '-top'). */
  _piece(item, layer) {
    const sheet = getSheet(`hub/decor/${item.piece}${layer}`);
    if (!sheet) return;
    const size = T * this.scale;
    this.ctx.drawImage(sheet.img, this.offset.x + item.x * size, this.offset.y + item.y * size,
      sheet.def.frameWidth * this.scale, sheet.def.frameHeight * this.scale);
  }

  /** Um sprite com os pés no meio do tile (x, y); `oy` em pixels do GBA (para cima é negativo). */
  _sprite(key, frame, flip, x, y, oy) {
    const sheet = getSheet(key);
    if (!sheet) return;
    const size = T * this.scale;
    const index = Math.min(frame, sheet.def.frames - 1);
    drawFrame(this.ctx, sheet, index, this.offset.x + (x + 0.5) * size, this.offset.y + (y + 1) * size + oy * this.scale,
      { scale: this.scale, flipX: flip });
  }

  _player(hub) {
    const look = getTrainerLook(hub.game.profile.trainer);
    const sheet = getSheet(look.sheet);
    if (!sheet) return;
    const p = hub.player;
    const speed = p.run ? CONFIG.trainer.animation.stride / CONFIG.hub.runTime : CONFIG.trainer.animation.stride / CONFIG.hub.walkTime;
    const { frame, flip } = trainerFrame({ dir: p.dir, moving: p.moving, stride: p.stride, speed }, look);
    const size = T * this.scale;
    drawFrame(this.ctx, sheet, frame, this.offset.x + (p.fx + 0.5) * size, this.offset.y + (p.fy + 1) * size,
      { scale: this.scale, flipX: flip });
  }
}
