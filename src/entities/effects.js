/** Efeitos puramente visuais (não causam dano). */

export class FloatingText {
  constructor(x, y, text, color = '#fff', size = 14) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.size = size;
    this.life = 0.7;
    this.maxLife = 0.7;
    this.vy = -46;
    this.dead = false;
  }
  update(dt) {
    this.y += this.vy * dt;
    this.vy *= Math.pow(0.05, dt);
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }
}

/** Linha do raio (chain) ou rastro rápido. */
export class Beam {
  constructor(points, color = '#f8d030', width = 4, life = 0.18) {
    this.points = points;      // [{x,y}, ...]
    this.color = color;
    this.width = width;
    this.life = life;
    this.maxLife = life;
    this.dead = false;
  }
  update(dt) {
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }
}

/** Arco do golpe corpo a corpo. */
export class SlashArc {
  constructor(owner, angle, range, arc, color, life = 0.22) {
    this.owner = owner;
    this.angle = angle;
    this.range = range;
    this.arc = arc;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.x = owner.x;
    this.y = owner.y;
    this.dead = false;
  }
  update(dt) {
    if (this.owner && !this.owner.dead) { this.x = this.owner.x; this.y = this.owner.y; }
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }
}

/** Partícula simples usada em mortes, explosões e impactos. */
export class Particle {
  constructor(x, y, vx, vy, color, size = 3, life = 0.5) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.color = color;
    this.size = size;
    this.life = life;
    this.maxLife = life;
    this.dead = false;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const decay = Math.pow(0.02, dt);
    this.vx *= decay;
    this.vy *= decay;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }
}

/** Gera um pequeno estouro de partículas. */
export function burst(list, x, y, color, count = 8, speed = 140, size = 3, life = 0.5) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.4 + Math.random() * 0.8);
    list.push(new Particle(x, y, Math.cos(a) * s, Math.sin(a) * s, color, size, life * (0.6 + Math.random() * 0.6)));
  }
}
