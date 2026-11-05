import { CONFIG } from '../core/config.js';
import { getAbility } from '../data/abilities.js';
import { getUpgrade } from '../data/upgrades.js';
import { BOSS_WAVE_FX, abilityFx as abilityFxOf } from '../data/fx.js';
import { applyModifiers, deepClone, clamp } from '../core/utils.js';
import { typeColor } from '../data/types.js';
import { Projectile, Orb } from '../entities/projectiles.js';
import { Zone } from '../entities/zones.js';
import { Beam, SlashArc } from '../entities/effects.js';
import { nearestEnemy, enemiesInRadius, damageEnemy } from './combat.js';
import { isBonusMove } from '../data/bonusMoves.js';
import { levelDamageMultiplier } from './stats.js';
import { castSignature } from './signatureMoves.js';

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
  const dance = companion?.dance;
  if (dance?.t > 0) {
    stats.damage *= dance.damageMult;
    if (stats.cooldown) stats.cooldown *= dance.cooldownMult;
  }
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
    // o 2º golpe bate 60% do golpe principal do Pokémon (com as melhorias dele), por acerto
    if (isBonusMove(inst.abilityId)) {
      const main = computeAbility(this.run, companion.member.abilities[0], companion).stats.damage;
      stats.damage = main * CONFIG.bonusMove.damageRatio * (stats.hitScale ?? 1);
    }
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
    zone.healTeam = inst.stats.healTeam ?? 0;
    zone.lifesteal = inst.stats.lifesteal ?? 0;
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

    // Gyro Ball: mais forte quanto mais rápido o treinador anda
    const player = this.run.player;
    const boost = inst.stats.speedScale
      ? 1 + inst.stats.speedScale * Math.min(1, Math.hypot(player.vx ?? 0, player.vy ?? 0) / 300) : 1;
    for (const orb of list) {
      orb.distance = inst.stats.area;
      orb.size = inst.stats.size;
      orb.damage = inst.stats.damage * boost;
      orb.lifesteal = inst.stats.lifesteal ?? 0;
      orb.angularSpeed = inst.stats.speed;
      orb.knockback = inst.stats.knockback;
      orb.tickRate = inst.stats.tickRate;
      orb.effects = inst.effects;
    }
  }

  update(dt) {
    const buffs = this.run.buffs;
    if (buffs) for (const key of Object.keys(buffs)) buffs[key] = Math.max(0, buffs[key] - dt);
    for (const companion of this.run.companions) {
      if (companion.dead) continue;
      this._tickCompanion(companion, dt);
      // espadinha desligada no HUD: acompanha o treinador sem atacar
      if (companion.member.attack === false) { this._holdFire(companion); continue; }
      for (const inst of companion.abilities) {
        if (!inst.stats) this.syncInstance(companion, inst);
        const behavior = inst.ability.behavior;

        if (behavior === 'aura') { this._syncAura(companion, inst); continue; }
        if (behavior === 'orbit') { this._syncOrbs(companion, inst); continue; }
        if (behavior === 'reactive') { this._react(companion, inst, dt); continue; }

        inst.timer -= dt;
        if (inst.timer > 0) continue;
        const fired = this.fire(companion, inst);
        // se não havia alvo, tenta de novo logo em seguida
        inst.timer = fired ? inst.stats.cooldown : 0.15;
      }
    }
  }

  /**
   * O que o 2º golpe guarda no Pokémon: o teto de cura por segundo (recarrega
   * aos poucos) e o tempo da Dragon Dance (ao acabar, os golpes voltam ao normal).
   */
  _tickCompanion(companion, dt) {
    const cap = CONFIG.bonusMove.healPerSecond * companion.maxHp(this.run.playerStats.pokemonHpBonus);
    companion.healBudget = Math.min(cap, (companion.healBudget ?? cap) + cap * dt);
    if (companion.dance?.t > 0) {
      companion.dance.t -= dt;
      if (companion.dance.t <= 0) for (const inst of companion.abilities) this.syncInstance(companion, inst);
    }
  }

  /** Counter: quando o Pokémon leva dano, revida com uma onda (com um intervalo mínimo). */
  _react(companion, inst, dt) {
    inst.timer -= dt;
    const hp = companion.member.hp;
    const hurt = inst.runtime.lastHp != null && hp < inst.runtime.lastHp;
    inst.runtime.lastHp = hp;
    if (!hurt || inst.timer > 0) return;
    this._fireNova(companion, inst);
    inst.timer = inst.stats.cooldown;
  }

  /** Recolhe auras e orbes de quem parou de atacar (voltam ao religar). */
  _holdFire(companion) {
    companion.target = null;
    for (const inst of companion.abilities) {
      if (inst.runtime.zone) { inst.runtime.zone.dead = true; inst.runtime.zone = null; }
      if (inst.runtime.orbs?.length) { inst.runtime.orbs.forEach((orb) => { orb.dead = true; }); inst.runtime.orbs.length = 0; }
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
      case 'rain': return this._fireRain(companion, inst);
      case 'trail': return this._fireTrail(companion, inst);
      case 'buff': return this._fireBuff(companion, inst);
      case 'signature': return castSignature(this.run, companion, inst);   // golpe exclusivo de lendário
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
        explode: s.area ? { area: s.area, ratio: s.explodeDamage ?? 0.5 } : null,
        delayedBlast: s.delayedBlast ?? null, owner: companion, lifesteal: s.lifesteal ?? 0
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
    run.effects.push(new SlashArc(companion, a, s.range, s.arc, inst.color, s.duration ?? 0.2, inst.abilityId));

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
    // Echoed Voice: mais forte a cada uso seguido
    let damage = s.damage;
    if (s.stack) {
      inst.runtime.stack = Math.min(s.stack.max, (inst.runtime.stack ?? 0) + 1);
      damage *= 1 + s.stack.per * (inst.runtime.stack - 1);
    }
    this.run.zones.push(new Zone({
      kind: 'nova', x: companion.x, y: companion.y,
      radius: 14, maxRadius: s.area, growSpeed: s.speed ?? 280,
      damage, knockback: s.knockback, effects: inst.effects,
      type: inst.ability.type, color: inst.color, abilityId: inst.abilityId,
      owner: companion, lifesteal: s.lifesteal ?? 0
    }));
    if (s.buff === 'tailwind' && this.run.buffs) this.run.buffs.tailwind = s.duration;   // a equipe acelera
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

    run.effects.push(new Beam(points, inst.color, 4, s.duration ?? 0.18, inst.abilityId));
    return true;
  }

  _fireGroundZone(companion, inst) {
    const run = this.run;
    const s = inst.stats;
    const count = s.count ?? 1;
    let placed = false;

    // 2º golpe: o Whirlpool nasce longe do Pokémon e do treinador (puxar a horda
    // para perto dele seria uma faca de dois gumes); os Toxic Spikes, em volta dele
    if (s.placement === 'far' || s.placement === 'around') {
      const spots = this._zoneSpots(companion, s, count);
      for (const { x, y } of spots) {
        run.zones.push(new Zone({
          kind: 'zone', x, y, radius: s.area, maxRadius: s.area,
          damage: s.damage, tickRate: s.tickRate, life: s.duration,
          effects: inst.effects, type: inst.ability.type, color: inst.color,
          knockback: 0, abilityId: inst.abilityId, pull: s.pull ?? 0, owner: companion
        }));
      }
      return spots.length > 0;
    }

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

  /** Onde o 2º golpe põe as áreas: longe (na horda, a `minDistance` do Pokémon e do treinador) ou em volta. */
  _zoneSpots(companion, s, count) {
    const run = this.run;
    if (!nearestEnemy(run, companion.x, companion.y, s.range)) return [];
    if (s.placement === 'around') {
      return Array.from({ length: count }, () => {
        const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 80;
        return { x: companion.x + Math.cos(a) * d, y: companion.y + Math.sin(a) * d };
      });
    }
    const min = s.minDistance ?? 200;
    let best = null, bestD = Infinity;
    for (const e of run.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - companion.x, e.y - companion.y);
      if (d < min || d > s.range || Math.hypot(e.x - run.player.x, e.y - run.player.y) < min) continue;
      if (d < bestD) { bestD = d; best = e; }
    }
    return best ? [{ x: best.x, y: best.y }] : [];
  }

  /**
   * O que cai do céu (2º golpe): o círculo avisa e, no fim dele, o impacto. Alvo:
   * 'nearest' (a horda mais perto, espalhado), 'random' (inimigos ao acaso) ou
   * 'strongest' (o de mais vida).
   */
  _fireRain(companion, inst) {
    const run = this.run;
    const s = inst.stats;
    const near = enemiesInRadius(run, companion.x, companion.y, s.range).filter((e) => !e.dead);
    if (!near.length) return false;
    let spots;
    if (s.target === 'random') {
      spots = Array.from({ length: s.count }, () => near[Math.floor(Math.random() * near.length)]);
    } else if (s.target === 'strongest') {
      spots = [near.reduce((a, b) => (b.hp > a.hp ? b : a))];
    } else {
      const center = nearestEnemy(run, companion.x, companion.y, s.range);
      const scatter = s.scatter ?? 0;
      spots = Array.from({ length: s.count }, (_, i) => ({
        x: center.x + (i ? (Math.random() - 0.5) * scatter * 2 : 0),
        y: center.y + (i ? (Math.random() - 0.5) * scatter * 2 : 0)
      }));
    }
    const strike = abilityFxOf(inst.abilityId)?.strike ?? null;
    spots.forEach(({ x, y }, i) => {
      run.zones.push(new Zone({
        kind: 'nova', x, y, radius: 8, maxRadius: s.area, growSpeed: s.area * 6,
        damage: s.damage, knockback: s.knockback ?? 0, effects: inst.effects,
        delay: s.delay + i * 0.08, delayTotal: s.delay + i * 0.08,
        type: inst.ability.type, color: inst.color, abilityId: inst.abilityId,
        owner: companion, strike
      }));
    });
    // Dig: o Pokémon some no chão enquanto o golpe não sai
    if (s.ownerBlink) companion.invulnTimer = Math.max(companion.invulnTimer, s.delay + 0.2);
    return true;
  }

  /** Flame Charge: deixa brasas no chão por onde passa (só andando). */
  _fireTrail(companion, inst) {
    const s = inst.stats;
    const last = inst.runtime.last;
    if (last && Math.hypot(companion.x - last.x, companion.y - last.y) < s.area * 0.6) return false;
    inst.runtime.last = { x: companion.x, y: companion.y };
    this.run.zones.push(new Zone({
      kind: 'zone', x: companion.x, y: companion.y + 10, radius: s.area, maxRadius: s.area,
      damage: s.damage, tickRate: s.tickRate, life: s.duration, effects: inst.effects,
      type: inst.ability.type, color: inst.color, knockback: 0, abilityId: inst.abilityId, owner: companion
    }));
    return true;
  }

  /** Os 2º golpes sem dano direto: Dragon Dance, Reflect e Phantom Force. */
  _fireBuff(companion, inst) {
    const run = this.run;
    const s = inst.stats;
    if (!nearestEnemy(run, companion.x, companion.y, 320)) return false;   // guardado para a luta
    const zone = (opts) => run.zones.push(new Zone({
      type: inst.ability.type, color: inst.color, abilityId: inst.abilityId, damage: 0, ...opts
    }));

    if (s.buff === 'dance') {
      companion.dance = { t: s.duration, damageMult: s.damageMult, cooldownMult: s.cooldownMult };
      for (const other of companion.abilities) if (other !== inst) this.syncInstance(companion, other);
      zone({ kind: 'nova', x: companion.x, y: companion.y, radius: 10, maxRadius: 70, growSpeed: 220 });
    } else if (s.buff === 'reflect') {
      run.buffs.reflect = s.duration;
      // a barreira desfaz os projéteis dos líderes perto do treinador
      for (const p of run.projectiles) {
        if (p.hostile && !p.dead && Math.hypot(p.x - run.player.x, p.y - run.player.y) < s.area) p.dead = true;
      }
      zone({ kind: 'aura', owner: run.player, radius: 90, maxRadius: 90, life: s.duration, tickRate: 1 });
    } else if (s.buff === 'phantom') {
      companion.invulnTimer = Math.max(companion.invulnTimer, s.duration);
      zone({ kind: 'aura', owner: companion, radius: s.area, maxRadius: s.area, life: s.duration,
             tickRate: s.tickRate, damage: s.damage, effects: inst.effects });
    }
    return true;
  }

  /** Habilidades hostis (usadas por chefes). */
  fireHostile(enemy, abilityId) {
    const ability = getAbility(abilityId);
    if (!ability) return;
    const s = ability.base;
    const damageMult = CONFIG.enemies.damageMult * (enemy.boss ? CONFIG.enemies.boss.damageMult : 1) * (enemy.attackMult ?? 1);
    if (ability.behavior === 'projectile') {
      // leque mirando o treinador; o visual e o tipo são os do líder
      const type = enemy.types[0] ?? 'normal';
      const count = s.count + (enemy.enraged ? CONFIG.enemies.boss.enrage.barrageExtra : 0);
      const aim = Math.atan2(this.run.player.y - enemy.y, this.run.player.x - enemy.x);
      for (let i = 0; i < count; i++) {
        const a = aim + s.spread * (i - (count - 1) / 2);
        this.run.projectiles.push(new Projectile({
          x: enemy.x, y: enemy.y, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed,
          damage: s.damage * damageMult, size: s.size, life: s.duration,
          type, color: typeColor(type), hostile: true, sprite: BOSS_WAVE_FX[type]?.ring ?? null
        }));
      }
      return;
    }
    if (ability.behavior === 'nova') {
      // a onda sai depois de um aviso no chão, para dar tempo de reagir
      this.run.zones.push(new Zone({
        kind: 'nova', x: enemy.x, y: enemy.y,
        radius: enemy.radius, maxRadius: s.area, growSpeed: s.speed,
        damage: s.damage * damageMult,
        knockback: s.knockback,
        type: ability.type, color: '#ff6b6b', hostile: true, abilityId,
        delay: CONFIG.fx.bossTelegraph, visualType: enemy.types[0]
      }));
    }
  }
}
