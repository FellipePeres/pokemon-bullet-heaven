import { CONFIG } from '../core/config.js';

/**
 * ÍCONES DA INTERFACE
 *
 * Em vez de emojis genéricos, a interface usa os ícones de itens oficiais do
 * repositório PokeAPI/sprites. Cada chave semântica aqui ("damage", "pokedex",
 * "coins"...) aponta para o item que melhor representa a ideia.
 *
 * Os dados do jogo (upgrades, conquistas, fases) guardam só a CHAVE — quem
 * resolve a imagem é a UI. Assim dá para trocar a arte sem tocar no conteúdo,
 * e existe um emoji de reserva para quando o jogo roda offline.
 */
const ITEM = {
  /* navegação */
  pokedex:      { item: 'town-map',     emoji: '📕' },
  achievements: { item: 'star-piece',   emoji: '🏆' },
  team:         { item: 'poke-ball',    emoji: '🎒' },
  trainer:      { item: 'coin-case',    emoji: '🪙' },
  options:      { item: 'escape-rope',  emoji: '⚙️' },
  help:         { item: 'oaks-parcel',  emoji: '❔' },

  /* recursos e progresso */
  shards:       { item: 'nugget',       emoji: '💎' },
  coins:        { item: 'nugget',       emoji: '💎' },
  badge:        { item: 'star-piece',   emoji: '🥇' },
  stages:       { item: 'town-map',     emoji: '🗺️' },
  ball:         { item: 'poke-ball',    emoji: '◓' },
  greatBall:    { item: 'great-ball',   emoji: '◓' },
  potion:       { item: 'potion',       emoji: '💊' },
  revive:       { item: 'revive',       emoji: '❤️‍🩹' },
  levelUp:      { item: 'rare-candy',   emoji: '⭐' },
  evolution:    { item: 'moon-stone',   emoji: '🌀' },
  tm:           { item: 'tm-normal',    emoji: '💿' },

  /* melhorias de habilidade */
  damage:       { item: 'x-attack',     emoji: '💥' },
  cooldown:     { item: 'x-speed',      emoji: '⏱️' },
  count:        { item: 'dire-hit',     emoji: '✳️' },
  pierce:       { item: 'x-accuracy',   emoji: '➳' },
  projSpeed:    { item: 'carbos',       emoji: '💨' },
  area:         { item: 'x-defense',    emoji: '⭕' },
  tick:         { item: 'iron',         emoji: '🔁' },
  duration:     { item: 'calcium',      emoji: '🕸️' },
  chains:       { item: 'magnet',       emoji: '⚡' },
  status:       { item: 'poison-barb',  emoji: '☠️' },

  /* melhorias do treinador */
  speed:        { item: 'bicycle',      emoji: '👟' },
  pickup:       { item: 'magnet',       emoji: '🧲' },
  xp:           { item: 'exp-share',    emoji: '🍀' },
  hp:           { item: 'hp-up',        emoji: '❤️' },
  regen:        { item: 'super-potion', emoji: '💊' },
  swap:         { item: 'soothe-bell',  emoji: '🔄' },
  power:        { item: 'protein',      emoji: '🏅' },
  haste:        { item: 'x-speed',      emoji: '⏩' },
  luck:         { item: 'lucky-egg',    emoji: '🍀' },

  /* combate */
  kills:        { item: 'dire-hit',     emoji: '⚔' },
  boss:         { item: 'master-ball',  emoji: '💀' },
  faint:        { item: 'revive',       emoji: '💫' }
};

/** Ícone de TM pelo tipo (tm-fire, tm-water...). */
export const tmIconForType = (type) => `tm-${type}`;

export function itemUrl(itemName) {
  return `${CONFIG.sprites.itemBase}${itemName}.png`;
}

/** URL do ícone de uma chave semântica (ou de um item direto, se já for um). */
export function iconUrl(key) {
  const entry = ITEM[key];
  return itemUrl(entry ? entry.item : key);
}

export const iconEmoji = (key) => ITEM[key]?.emoji ?? '•';

/**
 * <img> do ícone, com emoji de reserva se a imagem não carregar.
 * `size` em pixels; os ícones originais são pequenos, então ficam nítidos
 * com image-rendering: pixelated (ver .ui-icon no CSS).
 */
export function iconEl(key, { size = 22, alt = '', className = '' } = {}) {
  const span = document.createElement('span');
  span.className = `ui-icon ${className}`.trim();
  span.style.width = `${size}px`;
  span.style.height = `${size}px`;

  const img = document.createElement('img');
  img.src = iconUrl(key);
  img.alt = alt;
  img.onerror = () => { span.textContent = iconEmoji(key); };
  span.appendChild(img);
  return span;
}

/** Versão em HTML (para templates com innerHTML). */
export function iconHTML(key, size = 20) {
  return `<span class="ui-icon" style="width:${size}px;height:${size}px">` +
         `<img src="${iconUrl(key)}" alt="" onerror="this.parentNode.textContent='${iconEmoji(key)}'" />` +
         '</span>';
}
