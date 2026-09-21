import { getAbility } from '../data/abilities.js';
import { getUpgrade } from '../data/upgrades.js';
import { applyModifiers, deepClone, clamp } from '../core/utils.js';
import { typeColor } from '../data/types.js';
import { Projectile, Orb } from '../entities/projectiles.js';
import { Zone } from '../entities/zones.js';
import { Beam, SlashArc } from '../entities/effects.js';
import { nearestEnemy, enemiesInRadius, damageEnemy } from './combat.js';
import { levelDamageMultiplier } from './stats.js';

/**
 * Calcula as stats finais de uma habilidade:
 *   base + upgrades daquele Pokémon + nível do Pokémon + bônus globais da equipe.
 * Sempre recalculado do zero — assim nenhum upgrade "gruda" por engano.
 */
export function computeAbility(run, abilityId, companion = null) {
  const ability = getAbility(abilityId);
  const mods = {};
  const effectMods = {};

  // upgrades de habilidade pertencem ao Pokémon que os escolheu
  const ownUpgrades = companion?.member?.upgrades ?? {};
  for (const [upId, stacks] of Object.entries(ownUpgrades)) {
    const up = getUpgrade(upId);
    if (!up || up.scope !== 'ability' || up.abilityId !== abilityId || !up.modifiers) continue;
    for (const [key, mod] of Object.entries(up.modifiers)) {
      const bucket = key.startsWith('effect.') ? effectMods : mods;
      if (!bucket[key]) bucket[key] = { add: 0, mult: 0 };
      bucket[key].add += (mod.add || 0) * stacks;
      bucket[key].mult += (mod.mult || 0) * stacks;
    }
  }

  const stats = applyModifiers(ability.base, mods);
  const ps = run.playerStats;

  // bônus globais, poder da espécie e nível do Pokémon
  const level = companion?.member?.level ?? 1;
  stats.damage = (stats.damage ?? 0) * ps.damageMult
                 * (companion?.data?.power ?? 1)
                 * levelDamageMultiplier(level);
  if (stats.cooldown) stats.cooldown = Math.max(0.1, stats.cooldown * ps.cooldownMult);
  if (stats.tickRate) stats.tickRate = Math.max(0.1, stats.tickRate);
  if (stats.count != null) stats.count = Math.max(1, Math.round(stats.count));
  if (stats.pierce != null) stats.pierce = Math.max(0, Math.round(stats.pierce));
  if (stats.chains != null) stats.chains = Math.max(1, Math.round(stats.chains));

  // efeitos de status (queimadura, veneno, lentidão)
  let effects = null;
  if (ability.effects) {
    effects = deepClone(ability.effects);
    for (const [key, mod] of Object.entries(effectMods)) {
      const [, group, field] = key.split('.');
      if (!effects[group] || typeof effects[group][field] !== 'number') continue;
      effects[group][field] = (effects[group][field] + (mod.add || 0)) * (1 + (mod.mult || 0));
    }
    if (effects.slow) effects.slow.factor = clamp(effects.slow.factor, 0.15, 1);
  }

  return { ability, stats, effects };
}

/**
 * Executa as habilidades dos Pokémon ativos.
 * Cada comportamento é uma função pequena e genérica — habilidades novas
 * normalmente reaproveitam um comportamento existente só com dados diferentes.
 */
export class AbilitySystem {
  constructor(run) {
    this.run = run;
  }

  /** Recalcula tudo (chamado ao escolher upgrade, trocar Pokémon ou iniciar a fase). */
  refresh() {
    for (const companion of this.run.companions) {
      for (const inst of companion.abilities) this.syncInstance(companion, inst);
    }
  }

  syncInstance(companion, inst) {
    const { ability, stats, effects } = computeAbility(this.run, inst.abilityId, companion);
    inst.ability = ability;
    inst.stats = stats;
    inst.effects = effects;
    inst.color = typeColor(ability.type);

    if (ability.behavior === 'aura') this._syncAura(companion, inst);
    if (ability.behavior === 'orbit') this._syncOrbs(companion, inst);
  }

  _syncAura(companion, inst) {
    let zone = inst.runtime.zone;
    if (!zone || zone.dead) {
      zone = new Zone({
        kind: 'aura', owner: companion, life: Infinity,
        abilityId: inst.abilityId, type: inst.ability.type, color: inst.color
      });
      inst.runtime.zone = zone;
      this.run.zones.push(zone);
    }
    zone.radius = inst.stats.area;
    zone.maxRadius = inst.stats.area;
    zone.damage = inst.stats.damage;
    zone.tickRate = inst.stats.tickRate;
    zone.effects = inst.effects;
  }

  _syncOrbs(companion, inst) {
    const list = inst.runtime.orbs ?? (inst.runtime.orbs = []);
    // remove orbes mortos (ex.: Pokémon saiu de campo)
    for (let i = list.length - 1; i >= 0; i--) if (list[i].dead) list.splice(i, 1);

    const wanted = inst.stats.count;
    const changed = list.length !== wanted;

    while (list.length < wanted) {
      const orb = new Orb({ owner: companion, abilityId: inst.abilityId, type: inst.ability.type, color: inst.color });
      list.push(orb);
      this.run.orbs.push(orb);
    }
    while (list.length > wanted) list.pop().dead = true;

    // Reposiciona apenas quando a quantidade muda: o ângulo é o estado da
    // rotação e reescrevê-lo todo frame travaria os orbes parados.
    if (changed) {
      const base = list[0]?.angle ?? 0;
      list.forEach((orb, i) => { orb.angle = base + (Math.PI * 2 / wanted) * i; });
    }

    for (const orb of list) {
      orb.distance = inst.stats.area;
      orb.size = inst.stats.size;
      orb.damage = inst.stats.damage;
      orb.angularSpeed = inst.stats.speed;
      orb.knockback = inst.stats.knockback;
      orb.tickRate = inst.stats.tickRate;
      orb.effects = inst.effects;
    }
  }

  update(dt) {
    for (const companion of this.run.companions) {
      if (companion.dead) continue;
      for (const inst of companion.abilities) {
        if (!inst.stats) this.syncInstance(companion, inst);
        const behavior = inst.ability.behavior;

        if (behavior === 'aura') { this._syncAura(companion, inst); continue; }
        if (behavior === 'orbit') { this._syncOrbs(companion, inst); continue; }

        inst.timer -= dt;
        if (inst.timer > 0) continue;
        const fired = this.fire(companion, inst);
        // se não havia alvo, tenta de novo logo em seguida
        inst.timer = fired ? inst.stats.cooldown : 0.15;
      }
    }
  }

  /** Dispara uma habilidade. Retorna false se não havia alvo. */
  fire(companion, inst) {
    switch (inst.ability.behavior) {
      case 'projectile': return this._fireProjectile(companion, inst);
      case 'melee_arc': return this._fireMelee(companion, inst);
      case 'nova': return this._fireNova(companion, inst);
      case 'chain': return this._fireChain(companion, inst);
      case 'ground_zone': return this._fireGroundZone(companion, inst);
      default: return false;
    }
  }

  _fireProjectile(companion, inst) {
    const run = this.run;
    const s = inst.stats;
    const target = nearestEnemy(run, companion.x, companion.y, s.range);
    if (!target) return false;

    const baseAngle = Math.atan2(target.y - companion.y, target.x - companion.x);
    const n = s.count;
    const spread = s.spread ?? 0.25;
    const start = baseAngle - (spread * (n - 1)) / 2;

    for (let i = 0; i < n; i++) {
      const a = start + spread * i;
      run.projectiles.push(new Projectile({
        x: companion.x, y: companion.y,
        vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed,
        damage: s.damage, size: s.size, pierce: s.pierce, life: s.duration,
        type: inst.ability.type, color: inst.color,
        knockback: s.knockback, effects: inst.effects,
        homing: s.homing ?? 0, abilityId: inst.abilityId,
        explode: s.area ? { area: s.area, ratio: s.explodeDamage ?? 0.5 } : null
      }));
    }
    companion.target = target;
    return true;
  }

  _fireMelee(companion, inst) {
    const run = this.run;
    const s = inst.stats;
    const target = nearestEnemy(run, companion.x, companion.y, s.range + 20);
    if (!target) return false;

    const a = Math.atan2(target.y - companion.y, target.x - companion.x);
    run.effects.push(new SlashArc(companion, a, s.range, s.arc, inst.color, s.duration ?? 0.2));

    for (const enemy of enemiesInRadius(run, companion.x, companion.y, s.range)) {
      let diff = Math.atan2(enemy.y - companion.y, enemy.x - companion.x) - a;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > s.arc / 2) continue;
      damageEnemy(run, enemy, s.damage, {
        type: inst.ability.type, effects: inst.effects,
        knockback: s.knockback, from: { x: companion.x, y: companion.y }
      });
    }
    companion.target = target;
    return true;
  }

  _fireNova(companion, inst) {
    const s = inst.stats;
    this.run.zones.push(new Zone({
      kind: 'nova', x: companion.x, y: companion.y,
      radius: 14, maxRadius: s.area, growSpeed: s.speed ?? 280,
      damage: s.damage, knockback: s.knockback, effects: inst.effects,
      type: inst.ability.type, color: inst.color, abilityId: inst.abilityId
    }));
    return true;
  }

  _fireChain(companion, inst) {
    const run = this.run;
    const s = inst.stats;
    let target = nearestEnemy(run, companion.x, companion.y, s.range);
    if (!target) return false;

    const points = [{ x: companion.x, y: companion.y }];
    const hit = new Set();
    let damage = s.damage;

    for (let i = 0; i < s.chains && target; i++) {
      points.push({ x: target.x, y: target.y });
      hit.add(target);
      const from = { x: points[points.length - 2].x, y: points[points.length - 2].y };
      damageEnemy(run, target, damage, { type: inst.ability.type, effects: inst.effects, from });

      // próximo salto: inimigo mais próximo ainda não atingido
      let next = null, bestD = s.area * s.area;
      for (const e of run.grid.query(target.x, target.y, s.area)) {
        if (e.dead || hit.has(e)) continue;
        const dx = e.x - target.x, dy = e.y - target.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD) { bestD = d2; next = e; }
      }
      target = next;
      damage *= 0.85; // cada salto perde um pouco de força
    }

    run.effects.push(new Beam(points, inst.color, 4, s.duration ?? 0.18));
    return true;
  }

  _fireGroundZone(companion, inst) {
    const run = this.run;
    const s = inst.stats;
    const count = s.count ?? 1;
    let placed = false;

    for (let i = 0; i < count; i++) {
      const target = nearestEnemy(run, companion.x, companion.y, s.range);
      const x = target ? target.x + (i ? (Math.random() - 0.5) * s.area * 1.5 : 0) : companion.x;
      const y = target ? target.y + (i ? (Math.random() - 0.5) * s.area * 1.5 : 0) : companion.y;
      if (!target && i > 0) break;
      if (!target) return false;

      run.zones.push(new Zone({
        kind: 'zone', x, y, radius: s.area, maxRadius: s.area,
        damage: s.damage, tickRate: s.tickRate, life: s.duration,
        effects: inst.effects, type: inst.ability.type, color: inst.color,
        knockback: 0, abilityId: inst.abilityId
      }));
      placed = true;
    }
    return placed;
  }

  /** Habilidades hostis (usadas por chefes). */
  fireHostile(enemy, abilityId) {
    const ability = getAbility(abilityId);
    if (!ability) return;
    const s = ability.base;
    if (ability.behavior === 'nova') {
      this.run.zones.push(new Zone({
        kind: 'nova', x: enemy.x, y: enemy.y,
        radius: enemy.radius, maxRadius: s.area, growSpeed: s.speed,
        damage: s.damage, knockback: s.knockback,
        type: ability.type, color: '#ff6b6b', hostile: true, abilityId
      }));
    }
  }
}
