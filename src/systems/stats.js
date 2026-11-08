import { CONFIG } from '../core/config.js';
import { getPokemon } from '../data/pokemon.js';
import { getAbility } from '../data/abilities.js';

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
  const { baseXp, xpGrowth, xpKnee, xpLateExponent } = CONFIG.progression;
  if (level <= xpKnee) return Math.floor(baseXp * Math.pow(xpGrowth, level - 1));
  return Math.floor(baseXp * Math.pow(xpGrowth, xpKnee - 1) * Math.pow(level / xpKnee, xpLateExponent));
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

/**
 * Os três números dos cards de escolha (o inicial e a Poké Ball; 0.31): a vida
 * da espécie, o dano por segundo e o alcance do 1º golpe. Tudo sai dos dados
 * (POKEMON e ABILITIES): rebalanceou, as barras acompanham.
 *
 * O dano por segundo é dano × projéteis ÷ recarga (as auras e órbitas usam o
 * intervalo entre os acertos); não conta a queimadura nem o veneno, que vêm à
 * parte em `extras` para o card dizer "+ queimadura". O alcance de quem não
 * tem `range` (as ondas, as auras) é a área do golpe.
 */
export function starterStats(pokemonId) {
  const pokemon = getPokemon(pokemonId);
  const ability = getAbility(pokemon?.abilities?.[0]);
  const base = ability?.base ?? {};
  const rate = base.cooldown ?? base.tickRate ?? 1;
  return {
    hp: pokemon?.hp ?? CONFIG.pokemon.baseHp,
    dps: Math.round(((base.damage ?? 0) * (base.count ?? 1)) / rate),
    range: Math.round(base.range ?? base.area ?? 0),
    extras: Object.keys(ability?.effects ?? {}),
    ability
  };
}
