import { CONFIG } from '../core/config.js';
import { getPokemon } from '../data/pokemon.js';

/**
 * Stats derivadas de um Pokémon da equipe.
 * Ficam em um módulo só para que HUD, combate e save usem exatamente a mesma conta.
 */

/** Vida máxima: base da espécie + ganho por nível + bônus de upgrades da equipe. */
export function maxHpFor(member, bonus = 0) {
  const data = getPokemon(member.pokemonId);
  const base = data?.hp ?? CONFIG.pokemon.baseHp;
  return Math.round(base + CONFIG.pokemon.hpPerLevel * (member.level - 1) + bonus);
}

/** Multiplicador de dano vindo do nível do Pokémon. */
export function levelDamageMultiplier(level) {
  return 1 + CONFIG.pokemon.damagePerLevel * (level - 1);
}

/** XP necessário para o Pokémon sair do nível informado. */
export function xpToNextLevel(level) {
  const { baseXp, xpGrowth } = CONFIG.progression;
  return Math.floor(baseXp * Math.pow(xpGrowth, level - 1));
}

/** Fração 0..1 da barra de vida. */
export function hpRatio(member, bonus = 0) {
  const max = maxHpFor(member, bonus);
  return max > 0 ? Math.max(0, Math.min(1, member.hp / max)) : 0;
}

/** Fração 0..1 da barra de experiência. */
export function xpRatio(member) {
  const need = xpToNextLevel(member.level);
  return need > 0 ? Math.max(0, Math.min(1, member.xp / need)) : 0;
}
