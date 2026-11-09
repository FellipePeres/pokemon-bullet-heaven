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
    // a cena do Maxie (0.37): ele anda pela vila como as pessoas dela
    const m = hub.scene?.maxie;
    if (m && !m.hidden) {
      const frame = m.moving && m.prog < 0.5 ? { down: 3, up: 5, left: 7, right: 7 }[m.dir] + (m.steps % 2) : STAND[m.dir];
      actors.push({ y: m.y, order: 1, draw: () => this._sprite('dive/maxie', frame, m.dir === 'right', m.x, m.y, 0) });
    }
    actors.sort((a, b) => a.y - b.y || a.order - b.order);
    for (const actor of actors) actor.draw();

    const cover = getSheet(`hub/${hub.mapId}-top`);
    if (cover) ctx.drawImage(cover.img, ox, oy, mapW, mapH);
    for (const item of decor) if (item.piece) this._piece(item, '-top');

    if (hub.scene) this._scene(hub.scene);

    const fade = hub.fadeAlpha;
    if (fade > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${fade.toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  /**
   * Os efeitos da cena do Maxie (game/MaxieScene.js), em tiles da vila: o "!", a
   * Poké Ball, o clarão, o pássaro do Voar (levando o Maxie) e o corte de tela com
   * as listras e o Crobat.
   */
  _scene(scene) {
    const ctx = this.ctx, S = this.scale, size = T * S, fx = scene.fx, m = scene.maxie;
    const at = (x, y) => ({ x: this.offset.x + x * size, y: this.offset.y + y * size });
    if (fx.emote && !m.hidden) {
      const sheet = getSheet('dive/exclam');
      const k = Math.min(1, scene.t / 0.15);
      const q = at(m.x, m.y - 1);
      if (sheet) ctx.drawImage(sheet.img, q.x, q.y - (1 - k) * 6 * S, 16 * S, 16 * S);
    }
    if (fx.ball) {
      const sheet = getSheet('item/poke-ball');
      const b = fx.ball, x = b.x0 + (b.x1 - b.x0) * b.k, y = b.y0 + (b.y1 - b.y0) * b.k - Math.sin(b.k * Math.PI) * 1.1;
      const q = at(x, y);
      if (sheet) ctx.drawImage(sheet.img, q.x, q.y, 12 * S, 12 * S);
    }
    if (fx.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${fx.flash * 0.8})`; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); }
    const bird = fx.bird;
    const birdSheet = getSheet('dive/bird');
    if (bird && bird.x != null && birdSheet) {
      const q = at(bird.x, bird.y);
      const bob = Math.sin(performance.now() / 120) * 2 * S;
      ctx.save();
      if (bird.flip) { ctx.translate(q.x + 32 * S, q.y + bob); ctx.scale(-1, 1); ctx.drawImage(birdSheet.img, 0, 0, 32 * S, 32 * S); }
      else ctx.drawImage(birdSheet.img, q.x, q.y + bob, 32 * S, 32 * S);
      ctx.restore();
      // levando o Maxie pendurado
      if (bird.carry) {
        const mx = getSheet('dive/maxie');
        if (mx) ctx.drawImage(mx.img, 0, 0, 16, 32, q.x + 8 * S, q.y + bob + 18 * S, 16 * S, 32 * S);
      }
    }
    if (fx.cutin != null) this._cutin(scene, fx.cutin);
  }

  /** O corte de tela do Voar: a faixa com as listras correndo e o Crobat passando. */
  _cutin(scene, t) {
    const ctx = this.ctx, S = this.scale, W = this.canvas.width, H = this.canvas.height;
    const band = getSheet(scene.band), crobat = getSheet('dive/crobat');
    if (!band) return;
    const open = Math.min(1, t / 0.2) * Math.min(1, Math.max(0, (2.1 - t) / 0.2));
    const h = 80 * S * open, y0 = H / 2 - h / 2;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, y0, W, h); ctx.clip();
    const off = (t * 520 * S) % (256 * S);
    for (let x = -off; x < W; x += 256 * S) ctx.drawImage(band.img, Math.round(x), H / 2 - 40 * S, 256 * S, 80 * S);
    if (crobat) {
      const mid = W / 2 - 32 * S;
      let cx;
      if (t < 0.25) cx = W + 10;
      else if (t < 0.6) cx = W + 10 - (W + 10 - mid) * ((t - 0.25) / 0.35);
      else if (t < 1.55) cx = mid;
      else cx = mid - ((t - 1.55) / 0.35) * (W / 2 + 40 * S);
      ctx.drawImage(crobat.img, Math.round(cx), H / 2 - 32 * S, 64 * S, 64 * S);
    }
    ctx.restore();
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
