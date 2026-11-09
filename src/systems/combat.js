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
    if (e.dead || e.hidden || e === exclude) continue;
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
    if (e.dead || e.hidden) continue;
    const dx = e.x - x, dy = e.y - y;
    if (dx * dx + dy * dy <= r2 + e.radius * e.radius) out.push(e);
  }
  return out;
}

/** Quem não pega o status, como na série: Fogo não queima; Veneno e Metálico não envenenam. */
const STATUS_IMMUNE = { burn: ['fire'], poison: ['poison', 'steel'] };

/**
 * Aplica efeitos de status (queimadura, veneno, lentidão) a um inimigo. Desde a
 * 0.32 a queimadura e o veneno passam pela tabela do golpe que os causou: o Ember
 * queima o Geodude pela metade (até a 0.31 a queimadura ignorava a resistência).
 */
export function applyEffects(enemy, effects, type = null) {
  if (!effects) return;
  for (const kind of ['burn', 'poison']) {
    const payload = effects[kind];
    if (!payload || enemy.types.some((t) => STATUS_IMMUNE[kind].includes(t))) continue;
    const mult = type ? typeMultiplier(type, enemy.types) : 1;
    if (mult > 0) enemy.applyStatus(kind, { ...payload, dps: payload.dps * mult });
  }
  if (effects.slow) enemy.applyStatus('slow', effects.slow);
  if (effects.weak) enemy.applyStatus('weak', effects.weak);
}

/** O aviso de efetividade em cima do líder e dos elites, no máximo um a cada 2,5 s por alvo (0.32). */
const EFFECT_LABEL = [
  { test: (m) => m === 0, text: 'Não afeta…', color: '#c3cede' },
  { test: (m) => m > 1, text: 'Super efetivo!', color: '#ffe066' },
  { test: (m) => m < 1, text: 'Pouco efetivo…', color: '#8ea0c9' }
];
function effectivenessLabel(run, enemy, mult) {
  if (mult === 1 || !(enemy.boss || enemy.elite)) return;
  if (run.time - (enemy.labelAt ?? -Infinity) < 2.5) return;
  enemy.labelAt = run.time;
  const label = EFFECT_LABEL.find((l) => l.test(mult));
  run.effects.push(new FloatingText(enemy.x, enemy.y - enemy.radius - 22, label.text, label.color, 13));
}

/**
 * Cura dos 2º golpes (sanguessuga, campos): cada Pokémon tem um teto por
 * segundo (`CONFIG.bonusMove.healPerSecond`), recarregado pelo AbilitySystem —
 * a cura não pode sobrar (pedido do Fellipe).
 */
export function bonusHeal(run, companion, amount) {
  if (!companion || companion.dead || companion.member?.fainted || amount <= 0) return 0;
  const healed = Math.min(amount, companion.healBudget ?? 0);
  if (healed <= 0) return 0;
  companion.healBudget -= healed;
  companion.heal(healed, run.playerStats.pokemonHpBonus);
  return healed;
}

/**
 * O tempo da fase (0.37): na chuva do Kyogre (Drizzle), Água ×1,5 e Fogo ×0,5,
 * para todos — os golpes da equipe e os dos inimigos.
 */
export function weatherMultiplier(run, type) {
  if (run?.stage?.weather !== 'rain' || !type) return 1;
  return type === 'water' ? 1.5 : type === 'fire' ? 0.5 : 1;
}

/**
 * Causa dano a um inimigo.
 * opts: { type, effects, knockback, from:{x,y}, silent (sem número), source }
 */
export function damageEnemy(run, enemy, amount, opts = {}) {
  if (enemy.dead || enemy.untouchable) return 0;   // o Kyogre submerso (0.37) não leva dano

  const mult = opts.type ? typeMultiplier(opts.type, enemy.types) : 1;
  const weak = enemy.status?.weak ? 1 + enemy.status.weak.amount : 1;   // Acid Spray
  const dealt = amount * mult * weak * weatherMultiplier(run, opts.type);
  enemy.hp -= dealt;
  // o piso de vida do Kyogre (0.37): enquanto houver Dive Ball, ele fica exausto em vez de cair
  if (enemy.hpFloor != null && enemy.hp < enemy.hpFloor) {
    enemy.hp = enemy.hpFloor;
    run.fight?.onFloor(enemy);
  }
  enemy.hitFlash = 0.08;
  run.stats.damageDealt += dealt;

  if (opts.effects) applyEffects(enemy, opts.effects, opts.type);
  // Hex: o amaldiçoado guarda o dano para explodir nos vizinhos quando morrer
  if (opts.effects?.curse) {
    const { area, ratio, duration } = opts.effects.curse;
    enemy.applyStatus('curse', { area, damage: amount * ratio, duration, type: opts.type });
  }
  if (opts.lifesteal && opts.owner) bonusHeal(run, opts.owner, dealt * opts.lifesteal);

  if (opts.knockback && opts.from) {
    const dx = enemy.x - opts.from.x;
    const dy = enemy.y - opts.from.y;
    const d = Math.hypot(dx, dy) || 1;
    enemy.knockback(dx / d, dy / d, opts.knockback);
  }

  // número de dano — limitado para não poluir a tela nem pesar (o imune não mostra o 0)
  if (!opts.silent && run.effects.length < 90) {
    if (dealt > 0) {
      const color = mult > 1 ? '#ffe066' : mult < 1 ? '#8ea0c9' : '#ffffff';
      const size = mult > 1 ? 16 : 13;
      run.effects.push(new FloatingText(enemy.x, enemy.y - enemy.radius, Math.round(dealt).toString(), color, size));
    }
    effectivenessLabel(run, enemy, mult);
  }

  if (enemy.hp <= 0) killEnemy(run, enemy, opts);
  return dealt;
}

/** Morte de inimigo: partículas, drops, XP e estatísticas. */
export function killEnemy(run, enemy, opts = {}) {
  if (enemy.dead) return;
  enemy.dead = true;
  run.stats.kills++;

  // amaldiçoado pelo Hex: explode em fogo-fátuo nos vizinhos
  const curse = enemy.status?.curse;
  if (curse) {
    enemy.status.curse = null;
    run.spawnFx?.(enemy.x, enemy.y, 'purple_flame', { life: 0.4, scale: 1.4 });
    damageArea(run, enemy.x, enemy.y, curse.area, curse.damage, { type: curse.type });
  }

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

  // Ímã: raro, um por vez no chão; ao ser pego, puxa todo o XP do mapa
  const magnetChance = enemy.elite || enemy.boss ? CONFIG.capture.magnetChanceElite : CONFIG.capture.magnetChance;
  if (!run.pickups.some((p) => p.kind === 'magnet' && !p.dead) && chance(magnetChance)) {
    run.pickups.push(new Pickup('magnet', enemy.x - 4, enemy.y + 8));
  }

  // Curas no chão: como subir de nível não cura mais, a sustentação vem daqui.
  if (enemy.elite || enemy.boss) {
    run.pickups.push(new Pickup('heal', enemy.x - 8, enemy.y, enemy.boss ? 70 : 28));
  } else if (chance(CONFIG.capture.potionChance)) {
    run.pickups.push(new Pickup('heal', enemy.x - 6, enemy.y, 18));
  }

  // chefes pagam Shards (0.22; quem credita é o perfil, ao ouvir ENEMY_KILLED)
  const shards = enemy.boss ? CONFIG.shards.leaderPokemon : enemy.elite ? CONFIG.shards.elite : 0;
  if (shards) {
    run.stats.shards = (run.stats.shards ?? 0) + shards;
    run.effects.push(new FloatingText(enemy.x, enemy.y - enemy.radius - 18, `+${shards} Shards`, '#ffd970', 15));
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
