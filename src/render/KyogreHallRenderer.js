import { getSheet } from './assets.js';
import { getTrainerLook } from '../data/trainers.js';
import { DIVE_WORLD } from '../data/diveWorld.js';

const VW = 240, VH = 160, T = 16;   // a tela do GBA: o salão em 1x, ampliado na maior escala inteira
const HALL = DIVE_WORLD.hall;
const STAND = { down: 0, up: 1, left: 2, right: 2 };
const WALKF = { down: 3, up: 5, left: 7, right: 7 };
const RUNF = { down: 9, up: 12, left: 15, right: 15 };

/**
 * DESENHO DO SALÃO DO KYOGRE (game/KyogreHall.js): o MarineCave_End do Emerald,
 * o Kyogre do mapa, o treinador do jogador, a névoa, os clarões e a transição de
 * batalha do Kyogre. A tela lógica é a do GBA (240x160).
 */
export class KyogreHallRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext?.('2d') ?? null;
    this.scale = 3;
    this.img = {};
  }

  _load(src) {
    if (typeof Image === 'undefined') return null;
    const im = new Image();
    im.src = src;
    return im;
  }

  preload() {
    for (const k of ['hall', 'fog', 'transition']) this.img[k] ??= this._load(`assets/dive/${k}.png`);
  }

  _ready(im) { return im && im.complete && im.naturalWidth > 0; }

  resize(maxW, maxH) {
    const canvas = this.canvas;
    if (!canvas) return;
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    this.scale = Math.max(1, Math.floor(Math.min((maxW * dpr) / VW, (maxH * dpr) / VH)));
    canvas.width = VW * this.scale;
    canvas.height = VH * this.scale;
    canvas.style.width = `${(VW * this.scale) / dpr}px`;
    canvas.style.height = `${(VH * this.scale) / dpr}px`;
  }

  render(hall, trainer) {
    const ctx = this.ctx;
    if (!ctx || !hall.active) return;
    const p = hall.p, k = Math.min(1, p.mv);
    const px = (p.fx + (p.x - p.fx) * k) * T, py = (p.fy + (p.y - p.fy) * k) * T;
    const cx = Math.max(0, Math.min(HALL.w * T - VW, px - VW / 2 + 8));
    const cy = Math.max(0, Math.min(HALL.h * T - VH, py - VH / 2 + 8));
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, VW, VH);
    if (hall.shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 4), Math.round((Math.random() - 0.5) * 3));
    if (this._ready(this.img.hall)) ctx.drawImage(this.img.hall, -Math.round(cx), -Math.round(cy));

    // o Kyogre: 32x32 em cima do tile, com o balanço do affine
    const ky = getSheet('dive/kyogre_ow');
    if (ky && !hall.k.hidden) {
      const kx = hall.k.x * T - 8 - cx, kyy = hall.k.y * T - 16 - cy + (hall.k.awake ? 0 : Math.round(Math.sin(hall.t * 1.5)));
      ctx.save();
      ctx.translate(Math.round(kx + 16), Math.round(kyy + 16));
      ctx.rotate(hall.k.rot);
      ctx.drawImage(ky.img, hall.k.frame * 32, 0, 32, 32, -16, -16, 32, 32);
      if (hall.glow > 0) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = hall.glow * 0.8;
        ctx.drawImage(ky.img, hall.k.frame * 32, 0, 32, 32, -16, -16, 32, 32);
      }
      ctx.restore();
    }

    // o treinador (a folha do jogo, 16x32)
    const look = getTrainerLook(trainer);
    const sheet = getSheet(look.sheet);
    if (sheet) {
      let f = STAND[p.dir];
      if (p.mv < 1) f = p.run ? RUNF[p.dir] + (Math.floor(p.mv * 3) % 3) : p.mv < 0.5 ? WALKF[p.dir] + (p.step % 2) : f;
      const x = Math.round(px - cx), y = Math.round(py - cy - 16);
      ctx.save();
      if (p.dir === 'right') { ctx.translate(x + 16, y); ctx.scale(-1, 1); ctx.drawImage(sheet.img, f * 16, 0, 16, 32, 0, 0, 16, 32); }
      else ctx.drawImage(sheet.img, f * 16, 0, 16, 32, x, y, 16, 32);
      ctx.restore();
    }

    // a névoa horizontal do Emerald (o tempo do MarineCave_End)
    if (this._ready(this.img.fog)) {
      ctx.globalAlpha = 0.28;
      const ox = -((hall.fogX + cx * 0.5) % 64), oy = -((cy * 0.5) % 64);
      for (let y = oy; y < VH; y += 64) for (let x = ox; x < VW; x += 64) ctx.drawImage(this.img.fog, Math.round(x), Math.round(y));
      ctx.globalAlpha = 1;
    }
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    if (hall.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${hall.flash})`; ctx.fillRect(0, 0, VW, VH); }
    if (hall.trans && this._ready(this.img.transition)) {
      ctx.drawImage(this.img.transition, hall.trans.frame * 240, 0, 240, 160, 0, 0, VW, VH);
      if (hall.trans.black) { ctx.fillStyle = `rgba(0,0,0,${hall.trans.black})`; ctx.fillRect(0, 0, VW, VH); }
    }
    if (hall.mode === 'card') { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, VW, VH); }
    if (hall.alpha < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - hall.alpha})`; ctx.fillRect(0, 0, VW, VH); }
  }
}
