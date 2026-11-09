import { Dive } from '../game/Dive.js';

const { tile: T, width: VW, height: VH } = Dive.size;
const MAPS = ['r126', 'r127', 'cave'];

/**
 * DESENHO DA DESCIDA — o fundo do mapa submerso do Emerald (metatiles em 2x), o
 * aviso e as hordas, o mergulhador e as bolhas. A tela lógica é a do tabuleiro,
 * 320x192 (10x6 tiles de 32 px), ampliada na maior escala inteira que cabe. A
 * regra está em game/Dive.js.
 */
export class DiveRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext?.('2d') ?? null;
    this.scale = 3;
    this.img = { maps: {}, icons: {} };
    this.ambient = [];
    for (let i = 0; i < 22; i++) this.ambient.push({ x: Math.random() * VW, y: Math.random() * VH, v: 6 + Math.random() * 12, ph: Math.random() * 6, s: Math.random() < 0.3 });
  }

  _load(src) {
    if (typeof Image === 'undefined') return null;
    const im = new Image();
    im.src = src;
    return im;
  }

  /** Começa a carregar o que a descida mostra (ao abrir). */
  preload(trainer, species) {
    for (const m of MAPS) this.img.maps[m] ??= this._load(`assets/dive/${m}.png`);
    this.img.trainer = this._load(`assets/dive/${trainer === 'leaf' ? 'leaf' : 'red'}.png`);
    this.img.bubble ??= this._load('assets/fx/bubble.png');
    for (const n of species) this.img.icons[n] ??= this._load(`assets/pokemon/gen3/icons/${n}.png`);
  }

  /** O canvas na maior escala inteira que cabe em (maxW, maxH) px de CSS. */
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

  _ready(im) { return im && im.complete && im.naturalWidth > 0; }

  render(dive, dt = 1 / 60) {
    const ctx = this.ctx;
    if (!ctx || dive.mode === 'idle') return;
    const now = performance.now();
    for (const b of this.ambient) {
      b.y -= b.v * dt;
      b.x += Math.sin(now / 600 + b.ph) * 4 * dt;
      if (b.y < -8) { b.y = VH + 6; b.x = Math.random() * VW; }
    }
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (dive.shake > 0) ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
    this._floor(dive, now);
    if (dive.mode === 'play' || dive.mode === 'down') for (const l of dive.lanes) this._lane(l, dive.clock);
    this._player(dive, now);
    this._bubbles(dive);
    // a vinheta e o escurecer
    const v = ctx.createRadialGradient(VW / 2, VH / 2, VH * 0.35, VW / 2, VH / 2, VW * 0.7);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,10,.5)');
    ctx.fillStyle = v;
    ctx.fillRect(-4, -4, VW + 8, VH + 8);
    if (dive.alpha < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - dive.alpha})`; ctx.fillRect(-4, -4, VW + 8, VH + 8); }
  }

  _floor(dive, now) {
    const ctx = this.ctx;
    const m = this.img.maps[dive.map];
    ctx.fillStyle = '#0a0620';
    ctx.fillRect(0, 0, VW, VH);
    if (!this._ready(m)) return;
    // o mapa está em 1x (metatiles de 16 px) e a tela em 2x
    const cx = Math.round(dive.cam.x / 2), cy = Math.round(dive.cam.y / 2);
    ctx.drawImage(m, cx, cy, VW / 2, VH / 2, 0, 0, VW, VH);
    ctx.fillStyle = `rgba(4,2,26,${dive.dark})`;
    ctx.fillRect(0, 0, VW, VH);
    if (dive.map === 'cave') {
      // a luz do ponto de emergir (o warp do Emerald, em 9,8)
      const gx = 9 * T + T / 2 - cx * 2, gy = 8 * T + T / 2 - cy * 2;
      const g = ctx.createRadialGradient(gx, gy, 2, gx, gy, 44);
      g.addColorStop(0, `rgba(190,240,255,${0.35 + 0.15 * Math.sin(now / 300)})`);
      g.addColorStop(1, 'rgba(190,240,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(gx - 50, gy - 50, 100, 100);
    }
  }

  _lane(l, t) {
    const ctx = this.ctx;
    const len = l.axis === 'row' ? 10 : 6, go = l.t0 + l.warn;
    if (t < go + 0.05 && t >= l.t0) {
      // o aviso: a faixa avermelhada que pulsa, as setas e as bolhas na borda de onde a horda vem
      ctx.fillStyle = `rgba(255,110,100,${0.16 + 0.1 * Math.sin(t * 18)})`;
      const rr = l.axis === 'row' ? [0, l.idx * T, VW, T] : [l.idx * T, 0, T, VH];
      ctx.fillRect(...rr);
      ctx.strokeStyle = `rgba(255,138,122,${0.35 + 0.3 * Math.sin(t * 18)})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(rr[0] + 0.5, rr[1] + 0.5, rr[2] - 1, rr[3] - 1);
      ctx.fillStyle = 'rgba(255,138,122,.55)';
      for (let i = 0; i < len; i += 2) {
        const s = i + 0.5;
        const px = l.axis === 'row' ? (l.dir > 0 ? s : len - s) * T : l.idx * T + T / 2;
        const py = l.axis === 'row' ? l.idx * T + T / 2 : (l.dir > 0 ? s : len - s) * T;
        ctx.beginPath();
        if (l.axis === 'row') { ctx.moveTo(px - 4 * l.dir, py - 5); ctx.lineTo(px + 4 * l.dir, py); ctx.lineTo(px - 4 * l.dir, py + 5); }
        else { ctx.moveTo(px - 5, py - 4 * l.dir); ctx.lineTo(px, py + 4 * l.dir); ctx.lineTo(px + 5, py - 4 * l.dir); }
        ctx.fill();
      }
      const bubble = this.img.bubble;
      if (this._ready(bubble)) {
        const ex = l.axis === 'row' ? (l.dir > 0 ? 4 : VW - 4) : l.idx * T + T / 2;
        const ey = l.axis === 'row' ? l.idx * T + T / 2 : (l.dir > 0 ? 4 : VH - 4);
        for (let i = 0; i < 4; i++) {
          const ph = (t * 3 + i * 0.25) % 1;
          const bx = ex + (l.axis === 'row' ? 0 : (i - 1.5) * 6) + Math.sin(t * 9 + i) * 2;
          const by = ey + (l.axis === 'row' ? (i - 1.5) * 6 : 0) - ph * 8;
          ctx.drawImage(bubble, 0, 0, 16, 16, bx - 4, by - 4, 8, 8);
        }
      }
    }
    if (t < go) return;
    const icon = this.img.icons[l.sp];
    if (!this._ready(icon)) return;
    const head = (t - go) * l.speed;
    const fr = Math.floor(t * 6 + l.idx) % 2;
    for (let i = 0; i < l.len; i++) {
      const x0 = head - i - 1;
      if (x0 < -1 || x0 > len) continue;
      let x, y;
      if (l.axis === 'row') { x = (l.dir > 0 ? x0 : len - x0 - 1) * T; y = l.idx * T; }
      else { x = l.idx * T; y = (l.dir > 0 ? x0 : len - x0 - 1) * T; }
      const wob = Math.sin(t * 10 + i * 1.3) * 1.5;
      // os ícones olham para a esquerda: indo para a direita, espelha
      if (l.axis === 'row' && l.dir > 0) {
        ctx.save();
        ctx.translate(x + T, y + wob);
        ctx.scale(-1, 1);
        ctx.drawImage(icon, 0, fr * 32, 32, 32, 0, 0, 32, 32);
        ctx.restore();
      } else {
        ctx.drawImage(icon, 0, fr * 32, 32, 32, x + (l.axis === 'col' ? wob : 0), y + (l.axis === 'row' ? wob : 0), 32, 32);
      }
    }
  }

  _player(dive, now) {
    const ctx = this.ctx;
    const sheet = this.img.trainer;
    if (!this._ready(sheet)) return;
    if (dive.inv > 0 && Math.floor(dive.inv * 12) % 2 === 0 && dive.mode === 'play') return;
    const pos = dive.playerPos();
    const frame = { d: 0, u: 1, l: 2, r: 2 }[dive.p.face];
    const bob = Math.round(Math.sin(now / 260));
    ctx.save();
    if (dive.mode === 'down') { ctx.globalAlpha = dive.alpha; ctx.translate(0, dive.downT * 18); }
    ctx.fillStyle = 'rgba(0,0,20,.25)';
    ctx.beginPath();
    ctx.ellipse(pos.x + 16, pos.y + 29, 11, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    if (dive.p.face === 'r') {
      ctx.translate(pos.x + 32, pos.y - 2 + bob);
      ctx.scale(-1, 1);
      ctx.drawImage(sheet, frame * 32, 0, 32, 32, 0, 0, 32, 32);
    } else {
      ctx.drawImage(sheet, frame * 32, 0, 32, 32, pos.x, pos.y - 2 + bob, 32, 32);
    }
    ctx.restore();
  }

  _bubbles(dive) {
    const ctx = this.ctx;
    const bubble = this.img.bubble;
    if (!this._ready(bubble)) return;
    ctx.globalAlpha = 0.55;
    for (const b of this.ambient) { const z = b.s ? 8 : 5; ctx.drawImage(bubble, 0, 0, 16, 16, b.x, b.y, z, z); }
    for (const f of dive.fx) {
      const z = f.big ? 12 : 7;
      ctx.globalAlpha = 1 - f.t / f.life;
      ctx.drawImage(bubble, f.big ? 0 : 16, 0, 16, 16, f.x - z / 2, f.y - z / 2, z, z);
    }
    ctx.globalAlpha = 1;
  }
}
