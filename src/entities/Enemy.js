import { getEnemy } from '../data/enemies.js';
import { getAbility } from '../data/abilities.js';
import { rand } from '../core/utils.js';

/**
 * Pokémon selvagem hostil.
 * O comportamento é escolhido por dados (`behavior`), então criar um inimigo
 * novo normalmente não exige código novo.
 */
export class Enemy {
  constructor(enemyId, x, y, scaling = { hp: 1, speed: 1, damage: 1 }) {
    const data = getEnemy(enemyId);
    this.data = data;
    this.id = enemyId;
    this.x = x;
    this.y = y;
    this.radius = data.radius;
    this.scale = data.scale ?? 1;
    this.maxHp = data.hp * scaling.hp;
    this.hp = this.maxHp;
    this.speed = data.speed * scaling.speed;
    this.damage = data.damage * scaling.damage;
    this.xp = data.xp;
    this.elite = !!data.elite;
    this.boss = !!data.boss;
    this.kind = 'enemy';
    this.types = data.types ?? [];
    this.dead = false;
    this.facing = -1;
    this.hitFlash = 0;

    // movimento
    this.kvx = 0;             // velocidade de empurrão (knockback)
    this.kvy = 0;
    this.wobble = rand(0, Math.PI * 2);
    this.stateTimer = rand(0, 1.2);
    this.dashing = false;
    this.dashX = 0;
    this.dashY = 0;

    // efeitos de status ativos
    this.status = { burn: null, poison: null, slow: null };

    // habilidades hostis (chefes)
    this.abilities = (data.abilities ?? []).map((abilityId) => ({
      abilityId,
      timer: getAbility(abilityId)?.base.cooldown ?? 3
    }));
    this.summonTimer = data.summons?.interval ?? 0;

    // cadência de ataque: o inimigo só golpeia o Pokémon à sua frente
    // a cada `attackInterval` segundos, mesmo encostado o tempo todo.
    this.attackInterval = data.attackInterval ?? 1.1;
    this.attackTimer = Math.random() * this.attackInterval;
  }

  /** Aplica um efeito de status (o mais forte/mais longo prevalece). */
  applyStatus(kind, payload) {
    const current = this.status[kind];
    if (kind === 'slow') {
      const factor = payload.factor ?? 1;
      if (!current || factor <= current.factor) this.status.slow = { factor, t: payload.duration };
      else current.t = Math.max(current.t, payload.duration);
      return;
    }
    // burn / poison acumulam no dps mais alto e renovam a duração
    if (!current) this.status[kind] = { dps: payload.dps, t: payload.duration };
    else {
      current.dps = Math.max(current.dps, payload.dps);
      current.t = Math.max(current.t, payload.duration);
    }
  }

  /** true quando o golpe está disponível (e já reinicia a cadência). */
  tryAttack() {
    if (this.attackTimer > 0) return false;
    this.attackTimer = this.attackInterval;
    return true;
  }

  knockback(dirX, dirY, force) {
    if (this.boss) force *= 0.12;      // chefes quase não são empurrados
    else if (this.elite) force *= 0.45;
    this.kvx += dirX * force;
    this.kvy += dirY * force;
  }

  get speedMultiplier() {
    return this.status.slow ? this.status.slow.factor : 1;
  }

  /** Movimento por comportamento. Retorna o dano de status a ser aplicado neste frame. */
  update(dt, player, world) {
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.attackTimer = Math.max(0, this.attackTimer - dt);

    // ---- status ----
    let dotDamage = 0;
    for (const kind of ['burn', 'poison']) {
      const st = this.status[kind];
      if (st) {
        dotDamage += st.dps * dt;
        st.t -= dt;
        if (st.t <= 0) this.status[kind] = null;
      }
    }
    if (this.status.slow) {
      this.status.slow.t -= dt;
      if (this.status.slow.t <= 0) this.status.slow = null;
    }

    // ---- movimento ----
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const d = Math.hypot(dx, dy) || 1;
    const nx = dx / d, ny = dy / d;
    const speed = this.speed * this.speedMultiplier;
    let mx = 0, my = 0;

    switch (this.data.behavior) {
      case 'wanderer': {
        // avança em zigue-zague
        this.wobble += dt * 2.2;
        const perpX = -ny, perpY = nx;
        const sway = Math.sin(this.wobble) * 0.55;
        mx = (nx + perpX * sway) * speed;
        my = (ny + perpY * sway) * speed;
        break;
      }
      case 'swooper': {
        // ataca em investidas curtas, com pausa entre elas
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.dashing = !this.dashing;
          this.stateTimer = this.dashing ? 0.75 : rand(0.5, 1.1);
          if (this.dashing) { this.dashX = nx; this.dashY = ny; }
        }
        if (this.dashing) {
          mx = this.dashX * speed * 1.9;
          my = this.dashY * speed * 1.9;
        } else {
          mx = nx * speed * 0.35;
          my = ny * speed * 0.35;
        }
        break;
      }
      case 'boss': {
        // o chefe acelera quando o jogador tenta fugir: sem isso dá para
        // correr em círculos para sempre e a luta nunca acontece
        const chase = 1 + Math.min(1.4, Math.max(0, (d - 260) / 420));
        mx = nx * speed * chase;
        my = ny * speed * chase;
        break;
      }
      case 'tank':
      case 'chaser':
      default:
        mx = nx * speed;
        my = ny * speed;
        break;
    }

    this.x += (mx + this.kvx) * dt;
    this.y += (my + this.kvy) * dt;

    // o empurrão perde força rapidamente
    const decay = Math.pow(0.0015, dt);
    this.kvx *= decay;
    this.kvy *= decay;

    // mantém o inimigo dentro da arena
    this.x = Math.max(8, Math.min(world.width - 8, this.x));
    this.y = Math.max(8, Math.min(world.height - 8, this.y));
    this.facing = nx >= 0 ? 1 : -1;

    return dotDamage;
  }
}
