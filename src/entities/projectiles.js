/** Projéteis e orbes. Só guardam estado e movimento — o dano é aplicado pelo CombatSystem. */

export class Projectile {
  constructor(opts) {
    Object.assign(this, {
      x: 0, y: 0, vx: 0, vy: 0,
      damage: 10,
      size: 8,
      pierce: 0,
      life: 1.5,
      type: 'normal',
      color: '#fff',
      knockback: 0,
      effects: null,
      homing: 0,
      explode: null,       // { area, damageRatio }
      abilityId: null,
      hostile: false,
      dead: false
    }, opts);
    this.hits = new Set();
    this.age = 0;
    this.angle = Math.atan2(this.vy, this.vx);
  }

  update(dt, findTarget, world) {
    this.age += dt;
    this.life -= dt;

    if (this.homing > 0) {
      const target = findTarget(this.x, this.y, 420);
      if (target) {
        const desired = Math.atan2(target.y - this.y, target.x - this.x);
        const speed = Math.hypot(this.vx, this.vy);
        let diff = desired - this.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.angle += diff * Math.min(1, this.homing * dt * 4);
        this.vx = Math.cos(this.angle) * speed;
        this.vy = Math.sin(this.angle) * speed;
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.life <= 0) this.dead = true;
    if (this.x < -60 || this.y < -60 || this.x > world.width + 60 || this.y > world.height + 60) this.dead = true;
  }
}

/** Orbe que gira ao redor de um Pokémon (comportamento 'orbit'). */
export class Orb {
  constructor(opts) {
    Object.assign(this, {
      owner: null,
      angle: 0,
      distance: 70,
      angularSpeed: 2.4,
      size: 14,
      damage: 10,
      type: 'normal',
      color: '#fff',
      knockback: 0,
      effects: null,
      tickRate: 0.5,
      abilityId: null,
      dead: false
    }, opts);
    this.x = 0;
    this.y = 0;
    this.cooldowns = new Map(); // inimigo -> tempo até poder acertar de novo
  }

  update(dt) {
    if (!this.owner || this.owner.dead) { this.dead = true; return; }
    this.angle += this.angularSpeed * dt;
    this.x = this.owner.x + Math.cos(this.angle) * this.distance;
    this.y = this.owner.y + Math.sin(this.angle) * this.distance;

    for (const [enemy, time] of this.cooldowns) {
      const next = time - dt;
      if (next <= 0 || enemy.dead) this.cooldowns.delete(enemy);
      else this.cooldowns.set(enemy, next);
    }
  }
}
