import { typeMultiplier, typeColor } from '../data/types.js';
import { bus, EVENTS } from '../core/events.js';
import { FloatingText, burst } from '../entities/effects.js';
import { Pickup } from '../entities/Pickup.js';
import { CONFIG } from '../core/config.js';
import { chance } from '../core/utils.js';

/**
 * Peso de alvo: chefes e elites "parecem" mais próximos do que são.
 * Sem isso, a horda serve de escudo e a luta contra o chefe não anda.
 */
const targetPriority = (enemy) => (enemy.boss ? 0.25 : enemy.elite ? 0.6 : 1);

/** Inimigo vivo mais próximo de um ponto (com prioridade para alvos grandes). */
export function nearestEnemy(run, x, y, maxRange, exclude = null) {
  const candidates = run.grid.query(x, y, maxRange);
  const maxD2 = maxRange * maxRange;
  let best = null;
  let bestScore = Infinity;
  for (const e of candidates) {
    if (e.dead || e === exclude) continue;
    const dx = e.x - x, dy = e.y - y;
    const d2 = dx * dx + dy * dy;
    if (d2 > maxD2) continue;
    const score = d2 * targetPriority(e);
    if (score < bestScore) { bestScore = score; best = e; }
  }
  return best;
}

/** Todos os inimigos vivos dentro de um raio. */
export function enemiesInRadius(run, x, y, radius) {
  const out = [];
  const r2 = radius * radius;
  for (const e of run.grid.query(x, y, radius)) {
    if (e.dead) continue;
    const dx = e.x - x, dy = e.y - y;
    if (dx * dx + dy * dy <= r2 + e.radius * e.radius) out.push(e);
  }
  return out;
}

/** Aplica efeitos de status (queimadura, veneno, lentidão) a um inimigo. */
export function applyEffects(enemy, effects) {
  if (!effects) return;
  if (effects.burn) enemy.applyStatus('burn', effects.burn);
  if (effects.poison) enemy.applyStatus('poison', effects.poison);
  if (effects.slow) enemy.applyStatus('slow', effects.slow);
}

/**
 * Causa dano a um inimigo.
 * opts: { type, effects, knockback, from:{x,y}, silent (sem número), source }
 */
export function damageEnemy(run, enemy, amount, opts = {}) {
  if (enemy.dead) return 0;

  const mult = opts.type ? typeMultiplier(opts.type, enemy.types) : 1;
  const dealt = amount * mult;
  enemy.hp -= dealt;
  enemy.hitFlash = 0.08;
  run.stats.damageDealt += dealt;

  if (opts.effects) applyEffects(enemy, opts.effects);

  if (opts.knockback && opts.from) {
    const dx = enemy.x - opts.from.x;
    const dy = enemy.y - opts.from.y;
    const d = Math.hypot(dx, dy) || 1;
    enemy.knockback(dx / d, dy / d, opts.knockback);
  }

  // número de dano — limitado para não poluir a tela nem pesar
  if (!opts.silent && run.effects.length < 90) {
    const color = mult > 1 ? '#ffe066' : mult < 1 ? '#8ea0c9' : '#ffffff';
    const size = mult > 1 ? 16 : 13;
    run.effects.push(new FloatingText(enemy.x, enemy.y - enemy.radius, Math.round(dealt).toString(), color, size));
  }

  if (enemy.hp <= 0) killEnemy(run, enemy, opts);
  return dealt;
}

/** Morte de inimigo: partículas, drops, XP e estatísticas. */
export function killEnemy(run, enemy, opts = {}) {
  if (enemy.dead) return;
  enemy.dead = true;
  run.stats.kills++;

  const color = typeColor(enemy.types[0]);
  burst(run.particles, enemy.x, enemy.y, color, enemy.boss ? 40 : enemy.elite ? 18 : 7,
        enemy.boss ? 260 : 150, enemy.boss ? 5 : 3, enemy.boss ? 0.9 : 0.5);

  // orbes de experiência (inimigos maiores soltam várias)
  const orbs = enemy.boss ? 12 : enemy.elite ? 4 : 1;
  const xpEach = Math.max(1, Math.round(enemy.xp / orbs));
  for (let i = 0; i < orbs; i++) {
    run.pickups.push(new Pickup('xp', enemy.x, enemy.y, xpEach));
  }

  // chance de Poké Ball, respeitando o teto da fase
  const maxBalls = run.stage.maxBalls ?? Infinity;
  if (run.stats.ballsDropped < maxBalls) {
    const ballChance = (enemy.data.dropChance ?? 0) * run.stage.ballChance * run.playerStats.ballChance
                       * CONFIG.capture.dropChanceMultiplier;
    if (chance(ballChance)) {
      run.stats.ballsDropped++;
      run.pickups.push(new Pickup('ball', enemy.x + 6, enemy.y + 6));
    }
  }

  // Curas no chão: como subir de nível não cura mais, a sustentação vem daqui.
  if (enemy.elite || enemy.boss) {
    run.pickups.push(new Pickup('heal', enemy.x - 8, enemy.y, enemy.boss ? 70 : 28));
  } else if (chance(CONFIG.capture.potionChance)) {
    run.pickups.push(new Pickup('heal', enemy.x - 6, enemy.y, 18));
  }

  bus.emit(EVENTS.ENEMY_KILLED, { enemy, run });
}

/** Dano em área genérico (explosões, novas, zonas). */
export function damageArea(run, x, y, radius, damage, opts = {}) {
  const hit = enemiesInRadius(run, x, y, radius);
  for (const enemy of hit) {
    damageEnemy(run, enemy, damage, { ...opts, from: { x, y } });
  }
  return hit.length;
}
