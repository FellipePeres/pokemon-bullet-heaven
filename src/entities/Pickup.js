import { rand } from '../core/utils.js';

/**
 * Itens no chão.
 *   kind 'xp'   — orbe de experiência (atraída pelo raio de coleta)
 *   kind 'ball' — Poké Ball: ao ser coletada, abre a tela de captura
 *   kind 'heal' — restaura vida do treinador
 *   kind 'magnet' — Ímã: ao ser coletado, todo o XP do mapa vem até o treinador
 */
export class Pickup {
  constructor(kind, x, y, value = 0) {
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.value = value;
    this.radius = kind === 'ball' || kind === 'magnet' ? 14 : 8;
    this.magnetized = false;   // puxada pelo Ímã, de qualquer ponto do mapa
    this.pull = 0;
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

    // puxada pelo Ímã: acelera até o treinador, com um leve redemoinho no começo
    if (this.magnetized) {
      this.pull = Math.min(2400, this.pull + dt * 2600);
      const swirl = Math.max(0, 1 - this.age * 0.8) * 0.6;
      const speed = 260 + this.pull;
      this.x += ((dx / d) + (-dy / d) * swirl) * speed * dt;
      this.y += ((dy / d) + (dx / d) * swirl) * speed * dt;
      return d < player.radius + this.radius + 6;
    }

    const isBall = this.kind === 'ball' || this.kind === 'magnet';

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
