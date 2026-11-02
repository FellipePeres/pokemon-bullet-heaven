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
    this.speed = 0;
    this.radius = CONFIG.trainer.radius;
    this.facing = 1;
    this.walkTime = 0;
    // pose do sprite (down | up | left | right) e distância andada, que dita o passo
    this.dir = 'down';
    this.moving = false;
    this.stride = 0;
  }

  /** stats vem do ProgressionSystem (base + upgrades). */
  update(dt, move, stats, world) {
    const speed = stats.speed;
    this.speed = speed;
    this.vx = move.x * speed;
    this.vy = move.y * speed;
    const inset = CONFIG.arena.inset;
    this.x = clamp(this.x + this.vx * dt, inset, world.width - inset);
    this.y = clamp(this.y + this.vy * dt, inset, world.height - inset);

    this.moving = move.x !== 0 || move.y !== 0;
    if (move.x !== 0) this.facing = move.x > 0 ? 1 : -1;
    if (this.moving) {
      this.walkTime += dt;
      this.stride += speed * dt;
      this.dir = facingDir(move, this.dir);
    }
  }
}

/**
 * O movimento é livre, em qualquer ângulo, mas o sprite do FireRed só tem
 * quatro poses. Na diagonal, a pose atual continua se fizer parte do
 * movimento (subindo e virando para a direita, ele segue de costas); senão,
 * fica de lado, que é a pose que melhor lê como diagonal.
 */
export function facingDir(move, current) {
  const h = move.x > 0 ? 'right' : move.x < 0 ? 'left' : null;
  const v = move.y > 0 ? 'down' : move.y < 0 ? 'up' : null;
  if (!h || !v) return h ?? v ?? current;

  // um eixo bem mais forte que o outro manda (vale para controles analógicos)
  const ax = Math.abs(move.x);
  const ay = Math.abs(move.y);
  if (ax > ay * 1.5) return h;
  if (ay > ax * 1.5) return v;
  return current === h || current === v ? current : h;
}
