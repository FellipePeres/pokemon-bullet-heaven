import { getEnemy } from '../data/enemies.js';
import { CONFIG } from '../core/config.js';
import { getAbility } from '../data/abilities.js';
import { rand } from '../core/utils.js';

/**
 * Pokémon selvagem hostil.
 * O comportamento é escolhido por dados (`behavior`), então criar um inimigo
 * novo normalmente não exige código novo.
 */
export class Enemy {
  constructor(enemyId, x, y, scaling = { hp: 1, speed: 1, damage: 1 }, level = null) {
    const data = getEnemy(enemyId);
    this.data = data;
    this.id = enemyId;
    this.x = x;
    this.y = y;
    this.radius = data.radius;
    this.scale = data.scale ?? 1;
    // os líderes têm vida absoluta nos dados (sem a escala da fase), mais o reforço deles
    const tuning = data.boss ? CONFIG.enemies.boss : { hpMult: CONFIG.enemies.hpMult, damageMult: 1 };
    this.maxHp = data.hp * scaling.hp * tuning.hpMult;
    this.hp = this.maxHp;
    this.speed = data.speed * scaling.speed;
    this.damage = data.damage * scaling.damage * CONFIG.enemies.damageMult * tuning.damageMult;
    this.xp = data.xp * (scaling.xp ?? 1);
    this.level = level ?? data.level ?? null;
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
    this.animPhase = rand(0, 5);   // cada um começa a animação num ponto: a horda não se mexe junta
    this.stateTimer = rand(0, 1.2);
    this.dashing = false;
    this.dashX = 0;
    this.dashY = 0;
    // colisão com o cenário: o corpo, menor que o raio (cabe entre duas árvores)
    this.box = { oy: this.radius * 0.25, hw: Math.min(12, this.radius * 0.5), hh: Math.min(9, this.radius * 0.35) };
    this.detourSide = Math.random() < 0.5 ? 1 : -1;   // por onde contorna um obstáculo

    // efeitos de status ativos
    this.status = { burn: null, poison: null, slow: null, weak: null, curse: null };

    // habilidades hostis (chefes): as do líder mais as que todo líder tem
    const hostile = [...(data.abilities ?? [])];
    if (data.boss) for (const id of CONFIG.enemies.boss.extraAbilities) if (!hostile.includes(id)) hostile.push(id);
    this.enraged = false;
    this.abilities = hostile.map((abilityId) => ({
      abilityId,
      timer: (getAbility(abilityId)?.base.cooldown ?? 3) * (data.cooldownMult ?? 1)
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
    // do 2º golpe: enfraquecido (leva mais dano) e amaldiçoado (explode ao morrer)
    if (kind === 'weak' || kind === 'curse') {
      this.status[kind] = { ...payload, t: Math.max(payload.duration, current?.t ?? 0) };
      return;
    }
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
    for (const kind of ['slow', 'weak', 'curse']) {
      const st = this.status[kind];
      if (!st) continue;
      st.t -= dt;
      if (st.t <= 0) this.status[kind] = null;
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

    const stepX = (mx + this.kvx) * dt;
    const stepY = (my + this.kvy) * dt;
    const terrain = world.terrain;
    if (terrain) {
      const moved = terrain.move(this, stepX, stepY, this.box);
      // travou de frente num obstáculo: contorna pelo lado; se o lado também
      // estiver fechado, da próxima vez tenta o outro
      const wanted = Math.hypot(stepX, stepY);
      if (wanted > 0.01 && Math.hypot(moved.x, moved.y) < wanted * 0.35) {
        const side = speed * dt * this.detourSide;
        const slid = terrain.move(this, -ny * side, nx * side, this.box);
        if (!slid.x && !slid.y) this.detourSide = -this.detourSide;
      }
    } else {
      this.x += stepX;
      this.y += stepY;
    }

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
