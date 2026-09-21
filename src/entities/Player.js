import { CONFIG } from '../core/config.js';
import { clamp } from '../core/utils.js';

/**
 * O TREINADOR.
 * Ele não luta e não tem vida: apenas guia a equipe pelo mapa.
 * Quem sofre dano e sobe de nível são os Pokémon (ver Companion).
 */
export class Player {
  constructor(x, y) {
    this.kind = 'trainer';
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = CONFIG.trainer.radius;
    this.facing = 1;
    this.walkTime = 0;
  }

  /** stats vem do ProgressionSystem (base + upgrades). */
  update(dt, move, stats, world) {
    const speed = stats.speed;
    this.vx = move.x * speed;
    this.vy = move.y * speed;
    this.x = clamp(this.x + this.vx * dt, 20, world.width - 20);
    this.y = clamp(this.y + this.vy * dt, 20, world.height - 20);

    if (move.x !== 0) this.facing = move.x > 0 ? 1 : -1;
    if (move.x !== 0 || move.y !== 0) this.walkTime += dt;
  }
}
