/**
 * Tipos elementais.
 * Por enquanto servem para cor/identidade visual e para um multiplicador simples.
 * A tabela completa de efetividade pode ser preenchida depois sem mexer no gameplay.
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
 * Vantagens implementadas no MVP (apenas as relevantes para Kanto inicial).
 * Formato: ATAQUE -> { DEFESA: multiplicador }
 * Tudo o que não estiver aqui vale 1x.
 */
export const EFFECTIVENESS = {
  fire:     { grass: 2, bug: 2, ice: 2, water: 0.5, rock: 0.5 },
  water:    { fire: 2, rock: 2, ground: 2, grass: 0.5 },
  grass:    { water: 2, rock: 2, ground: 2, fire: 0.5, flying: 0.5, bug: 0.5, poison: 0.5 },
  electric: { water: 2, flying: 2, ground: 0 },
  fighting: { normal: 2, rock: 2, ice: 2, flying: 0.5, poison: 0.5, psychic: 0.5 },
  poison:   { grass: 2, fairy: 2, rock: 0.5, ground: 0.5, poison: 0.5 },
  ground:   { fire: 2, electric: 2, rock: 2, poison: 2, flying: 0, grass: 0.5 },
  flying:   { grass: 2, fighting: 2, bug: 2, rock: 0.5, electric: 0.5 },
  psychic:  { fighting: 2, poison: 2 },
  bug:      { grass: 2, psychic: 2, fire: 0.5, flying: 0.5, fighting: 0.5 },
  rock:     { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5, ground: 0.5 },
  normal:   { rock: 0.5, ghost: 0 }
};

/** Multiplicador de dano de um tipo de ataque contra uma lista de tipos defensivos. */
export function typeMultiplier(attackType, defenderTypes = []) {
  const table = EFFECTIVENESS[attackType];
  if (!table) return 1;
  return defenderTypes.reduce((mult, t) => mult * (table[t] ?? 1), 1);
}

export const typeColor = (type) => TYPES[type]?.color ?? '#9aa7c7';
export const typeName = (type) => TYPES[type]?.name ?? type;
