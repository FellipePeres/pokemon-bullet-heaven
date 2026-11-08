/**
 * Tipos elementais.
 * A cor e o nome de cada um, a tabela de efetividade (o dano que os seus golpes
 * causam) e, desde a 0.32, a defesa (o dano que os seus Pokémon recebem).
 */
export const TYPES = {
  normal:   { name: 'Normal',   color: '#a8a878', icon: '⭐' },
  fire:     { name: 'Fogo',     color: '#f08030', icon: '🔥' },
  water:    { name: 'Água',     color: '#6890f0', icon: '💧' },
  grass:    { name: 'Planta',   color: '#78c850', icon: '🌱' },
  electric: { name: 'Elétrico', color: '#f8d030', icon: '⚡' },
  ice:      { name: 'Gelo',     color: '#98d8d8', icon: '❄️' },
  fighting: { name: 'Lutador',  color: '#c03028', icon: '🥋' },
  poison:   { name: 'Venenoso', color: '#a040a0', icon: '☠️' },
  ground:   { name: 'Terrestre',color: '#e0c068', icon: '🏜️' },
  flying:   { name: 'Voador',   color: '#a890f0', icon: '🌪️' },
  psychic:  { name: 'Psíquico', color: '#f85888', icon: '🔮' },
  bug:      { name: 'Inseto',   color: '#a8b820', icon: '🐛' },
  rock:     { name: 'Pedra',    color: '#b8a038', icon: '🪨' },
  ghost:    { name: 'Fantasma', color: '#705898', icon: '👻' },
  dragon:   { name: 'Dragão',   color: '#7038f8', icon: '🐉' },
  dark:     { name: 'Sombrio',  color: '#705848', icon: '🌑' },
  steel:    { name: 'Metálico', color: '#b8b8d0', icon: '⚙️' },
  fairy:    { name: 'Fada',     color: '#ee99ac', icon: '✨' }
};

/**
 * A tabela de efetividade completa (0.32; até a 0.31 só tinha o essencial do
 * começo, e Fogo contra Fogo, por exemplo, valia 1x). É a da série desde a 6ª
 * geração, com Fada e Metálico, que alguns Pokémon e golpes daqui já usam.
 * Formato: ATAQUE -> { DEFESA: multiplicador }. O que não está aqui vale 1x.
 */
export const EFFECTIVENESS = {
  normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug:      { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
  dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};

/** Multiplicador de dano de um tipo de ataque contra uma lista de tipos defensivos. */
export function typeMultiplier(attackType, defenderTypes = []) {
  const table = EFFECTIVENESS[attackType];
  if (!table) return 1;
  return defenderTypes.reduce((mult, t) => mult * (table[t] ?? 1), 1);
}

/**
 * O dano que um Pokémon seu recebe (0.32): a mesma tabela, suavizada pela escala
 * da defesa (`CONFIG.types.defense`: 2x vira 1,5x, 0,5x vira 0,67x e a imunidade
 * vira 1x: o seu Voador toma o golpe de Terra como um golpe comum). O contato da
 * horda é constante; com 2x cheio, a desvantagem viraria derrota certa.
 */
export function defenseMultiplier(attackType, defenderTypes, scale = null) {
  const raw = typeMultiplier(attackType, defenderTypes);
  return scale?.[raw] ?? raw;
}

export const typeColor = (type) => TYPES[type]?.color ?? '#9aa7c7';
export const typeName = (type) => TYPES[type]?.name ?? type;
