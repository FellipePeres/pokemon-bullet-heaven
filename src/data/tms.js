import { getPokemon } from './pokemon.js';
import { getAbility } from './abilities.js';

/**
 * TMs — sobem o golpe do Pokémon para o PRÓXIMO da linha dele.
 *
 * Cada espécie tem uma `moveLine` de 3 golpes em data/pokemon.js
 * (ex.: Charmander → Ember → Flamethrower → Fire Blast). A TM encontrada
 * durante a fase nunca é um golpe aleatório: é sempre a evolução natural
 * do golpe atual daquele Pokémon.
 *
 * Ao aprender, TODAS as melhorias já investidas são transferidas
 * (ver ProgressionSystem.learnTM) — trocar nunca é um downgrade.
 */

/** Número da TM nos jogos originais, só por sabor. */
export const TM_NUMBERS = {
  razor_leaf: 22, solar_beam: 22, flamethrower: 38, fire_blast: 38,
  bubble_beam: 11, hydro_pump: 14, water_pulse: 3, ice_beam: 13,
  wing_attack: 43, hurricane: 15, drill_peck: 47, air_cutter: 40,
  hyper_fang: 5, hyper_beam: 15, bug_bite: 28, psybeam: 33, psychic_wave: 29,
  twineedle: 6, sludge_bomb: 36, poison_fang: 6, toxic: 6,
  mega_drain: 21, petal_dance: 22, rock_slide: 48, earthquake: 26,
  fire_spin: 20, thunderbolt: 24, thunder: 25,
  seismic_toss: 19, cross_chop: 1, flail: 8,
  disarming_voice: 45, hyper_voice: 49
};

export const tmNumber = (abilityId) => TM_NUMBERS[abilityId] ?? 0;

/**
 * Próximo golpe da linha do Pokémon, ou null se ele já está no último.
 * Considera o golpe atual (o primeiro da lista de habilidades do membro).
 */
export function nextMoveFor(pokemonId, currentAbilityId) {
  const data = getPokemon(pokemonId);
  const line = data?.moveLine;
  if (!line || !line.length) return null;

  const index = line.indexOf(currentAbilityId);
  // se o golpe atual não está na linha (caso raro), começa do início dela
  const nextIndex = index === -1 ? 0 : index + 1;
  const next = line[nextIndex];
  return next && getAbility(next) ? next : null;
}

/** A linha completa, já resolvida em habilidades (para mostrar na interface). */
export function moveLineOf(pokemonId) {
  const line = getPokemon(pokemonId)?.moveLine ?? [];
  return line.map((id) => getAbility(id)).filter(Boolean);
}
