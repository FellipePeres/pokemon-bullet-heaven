import { rand } from '../core/utils.js';

/**
 * Itens no chão.
 *   kind 'xp'   — orbe de experiência (atraída pelo raio de coleta)
 *   kind 'ball' — Poké Ball: ao ser coletada, abre a tela de captura
 *   kind 'heal' — restaura vida do treinador
 */
export class Pickup {
  constructor(kind, x, y, value = 0) {
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.value = value;
    this.radius = kind === 'ball' ? 14 : 8;
    this.dead = false;
    this.age = 0;
    this.bob = rand(0, Math.PI * 2);
    this.attracted = false;
    // pequeno impulso inicial para as orbes se espalharem no chão
    this.vx = rand(-60, 60);
    this.vy = rand(-60, 60);
  }

  update(dt, player, pickupRadius, magnetSpeed) {
    this.age += dt;
    this.bob += dt * 4;

    // atrito do impulso inicial
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const decay = Math.pow(0.002, dt);
    this.vx *= decay;
    this.vy *= decay;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const d = Math.hypot(dx, dy) || 1;

    const isBall = this.kind === 'ball';

    // A Poké Ball rola devagar na direção do treinador quando ele está por perto.
    // Sem isso, builds de longo alcance matavam longe e nunca conseguiam capturar.
    if (isBall && d < 620) {
      this.x += (dx / d) * 62 * dt;
      this.y += (dy / d) * 62 * dt;
    }

    const radius = isBall ? pickupRadius * 0.6 : pickupRadius;
    const speed = (isBall ? magnetSpeed * 0.5 : magnetSpeed) * (1 - Math.min(1, d / 400) * 0.4);
    if (this.attracted || d < radius) {
      this.attracted = true;
      this.x += (dx / d) * speed * dt;
      this.y += (dy / d) * speed * dt;
    }

    return d < player.radius + this.radius + (this.kind === 'ball' ? 4 : 2);
  }
}
