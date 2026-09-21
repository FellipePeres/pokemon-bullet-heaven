import { CONFIG } from '../core/config.js';
import { getPokemon } from '../data/pokemon.js';
import { lerp } from '../core/utils.js';
import { maxHpFor } from '../systems/stats.js';

/**
 * Pokémon da equipe em campo.
 *
 * O estado persistente (nível, XP, vida, níveis pendentes, desmaio) mora no
 * `member` — a entrada da equipe —, não no Companion. Assim um Pokémon que sai
 * de campo continua com a mesma vida e o mesmo nível quando voltar, e o save
 * só precisa gravar a equipe.
 */
export class Companion {
  /** @param {object} member { uid, pokemonId, level, xp, hp, fainted, pendingLevels, abilities } */
  constructor(member, x, y, slotIndex) {
    this.member = member;
    this.pokemonId = member.pokemonId;
    this.data = getPokemon(member.pokemonId);
    this.slotIndex = slotIndex;
    this.x = x;
    this.y = y;
    this.radius = CONFIG.pokemon.radius;
    this.facing = 1;
    this.kind = 'companion';
    this.bob = Math.random() * Math.PI * 2;
    this.spawnTime = 0;
    this.invulnTimer = 0;
    this.hitFlash = 0;
    this.dead = false;         // "dead" aqui = fora de campo (desmaiado ou trocado)

    /** Instâncias de habilidade: { abilityId, timer, stats, effects, runtime } */
    this.abilities = member.abilities.map((abilityId) => ({
      abilityId,
      timer: Math.random() * 0.4, // dessincroniza os disparos
      stats: null,
      effects: null,
      runtime: {}
    }));
  }

  get level() { return this.member.level; }
  get hp() { return this.member.hp; }
  get fainted() { return this.member.fainted; }

  maxHp(bonus = 0) { return maxHpFor(this.member, bonus); }

  /**
   * Aplica dano. Devolve 'fainted' quando o Pokémon cai, true quando
   * apenas levou dano e false quando o golpe foi ignorado.
   */
  takeDamage(amount) {
    if (this.dead || this.member.fainted || CONFIG.debug.godMode) return false;
    if (this.invulnTimer > 0) return false;

    this.member.hp -= amount;
    this.invulnTimer = CONFIG.pokemon.invulnerability;
    this.hitFlash = 0.22;

    if (this.member.hp <= 0) {
      this.member.hp = 0;
      this.member.fainted = true;
      return 'fainted';
    }
    return true;
  }

  heal(amount, bonus = 0) {
    this.member.hp = Math.min(this.maxHp(bonus), this.member.hp + amount);
  }

  /** Posição-alvo: em círculo ao redor do treinador, distribuída pelos slots ativos. */
  update(dt, player, slotCount, teamStats) {
    this.spawnTime += dt;
    this.bob += dt * 3;
    this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt);

    // regeneração em campo (vem de upgrades)
    const regen = CONFIG.pokemon.fieldRegen + (teamStats?.pokemonRegen ?? 0);
    if (regen > 0 && !this.member.fainted) {
      this.heal(regen * dt, teamStats?.pokemonHpBonus ?? 0);
    }

    const angleStep = (Math.PI * 2) / Math.max(1, slotCount);
    const baseAngle = -Math.PI / 2 + angleStep * this.slotIndex;
    const moving = Math.abs(player.vx) + Math.abs(player.vy) > 1;
    const trail = moving ? 0.25 : 0;
    let targetX = player.x + Math.cos(baseAngle) * CONFIG.pokemon.followRadius - player.vx * trail * 0.12;
    let targetY = player.y + Math.sin(baseAngle) * CONFIG.pokemon.followRadius - player.vy * trail * 0.12;

    // O Pokémon avança um pouco na direção do alvo em vez de ficar preso à
    // formação. Sem isso, quem tem golpe de curto alcance nunca alcança nada
    // enquanto o treinador corre fugindo da horda.
    // Abaixo de 35% de vida ele para de avançar e fica colado no treinador:
    // é o que dá chance de um Pokémon machucado sobreviver até a troca.
    const healthy = this.member.hp / this.maxHp(teamStats?.pokemonHpBonus ?? 0) > 0.35;
    if (healthy && this.target && !this.target.dead) {
      const dx = this.target.x - targetX;
      const dy = this.target.y - targetY;
      const d = Math.hypot(dx, dy);
      if (d > 1) {
        const reach = Math.min(CONFIG.pokemon.engageDistance, d);
        targetX += (dx / d) * reach;
        targetY += (dy / d) * reach;
      }
    }

    const t = 1 - Math.pow(0.0001, dt); // suavização independente do framerate
    this.x = lerp(this.x, targetX, t);
    this.y = lerp(this.y, targetY, t);

    if (this.target && !this.target.dead) this.facing = this.target.x >= this.x ? 1 : -1;
    else if (moving) this.facing = player.vx >= 0 ? 1 : -1;
  }
}
