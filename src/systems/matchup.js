/**
 * VANTAGEM DE TIPO CONTRA UM LÍDER (0.32) — as fraquezas do time do líder de uma
 * fase (o "Fraco" do painel, no mapa da jornada) e quão bem um Pokémon se sai
 * contra ele (o bot do balance com --tipos monta o time por isso).
 *
 * Os números são "passos de 2x": +1 é super efetivo (2x), +2 é 4x, −1 é pouco
 * efetivo (0,5x) e a imunidade conta como −2 (como se fosse 0,25x).
 */
import { TYPES, typeMultiplier } from '../data/types.js';
import { getPokemon } from '../data/pokemon.js';
import { ABILITIES, getAbility } from '../data/abilities.js';
import { getEnemy } from '../data/enemies.js';

const steps = (mult) => (mult <= 0 ? -2 : Math.log2(mult));
const mean = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0);
/** Só os tipos que algum golpe do jogo tem (Sombrio, por exemplo, não tem): fraqueza a eles não ajuda ninguém. */
const MOVE_TYPES = new Set(Object.values(ABILITIES).map((ability) => ability.type));

/** Os tipos de cada Pokémon do time do líder (no Campeão, o time depende do inicial). */
export function leaderTeamTypes(stage, starter = null) {
  const team = stage?.bossTeamByStarter?.[starter] ?? stage?.bossTeam ?? [];
  return team.map((id) => getEnemy(id)?.types ?? []).filter((types) => types.length);
}

/** Os tipos dos golpes de um Pokémon: o membro da equipe (com os golpes dele) ou a espécie. */
export function moveTypesOf(source) {
  const ids = typeof source === 'string' ? getPokemon(source)?.abilities ?? [] : source?.abilities ?? [];
  return [...new Set(ids.map((id) => getAbility(id)?.type).filter(Boolean))];
}

/**
 * Ataque e defesa de um Pokémon contra o time de um líder:
 *   offense  o melhor golpe dele contra cada Pokémon do time, na média (> 0 é bom)
 *   defense  o golpe de cada Pokémon do time (o 1º tipo dele, como na partida)
 *            contra os tipos deste, na média (> 0 é ruim: ele apanha mais)
 */
export function matchupAgainst(pokemonId, moveTypes, teamTypes) {
  const own = getPokemon(pokemonId)?.types ?? [];
  if (!teamTypes.length || !own.length) return { offense: 0, defense: 0 };
  const attacks = moveTypes.length ? moveTypes : own;
  const offense = mean(teamTypes.map((types) => Math.max(...attacks.map((type) => steps(typeMultiplier(type, types))))));
  const defense = mean(teamTypes.map((types) => steps(typeMultiplier(types[0], own))));
  return { offense, defense };
}

/** A nota de um Pokémon contra o líder (o bot escolhe por ela): o ataque pesa mais que a defesa. */
export const matchupScore = ({ offense, defense }) => offense - 0.7 * defense;

/**
 * As fraquezas e as resistências do time de um líder: para cada tipo de ataque,
 * o multiplicador médio contra os Pokémon do time. Fraco a: média de 1,5x para
 * cima; resiste: de 0,67x para baixo (a imunidade entra aqui, com 0).
 */
export function teamWeaknesses(teamTypes) {
  const rows = Object.keys(TYPES).filter((type) => MOVE_TYPES.has(type))
    .map((type) => ({ type, avg: mean(teamTypes.map((types) => typeMultiplier(type, types))) }));
  return {
    weak: rows.filter((r) => r.avg >= 1.5).sort((a, b) => b.avg - a.avg),
    resist: rows.filter((r) => r.avg <= 0.67).sort((a, b) => a.avg - b.avg)
  };
}
