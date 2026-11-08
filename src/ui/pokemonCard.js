import { create } from './dom.js';
import { CONFIG } from '../core/config.js';
import { typeColor, typeName } from '../data/types.js';
import { starterStats } from '../systems/stats.js';

/** O que o 1º golpe faz além do dano (o card avisa, porque o Dano/s não conta). */
const EXTRA_LABEL = { burn: 'queimadura', poison: 'veneno', slow: 'lentidão' };

/** O sprite de frente do FireRed (64 px, `assets/pokemon/gen3`), para mostrar em 2x. */
export const gen3Sprite = (dex, shiny = false) => `assets/pokemon/gen3/${shiny ? 'front-shiny' : 'front'}/${dex}.png`;

/**
 * O CARD DE ESCOLHA (0.31) — o mesmo na escolha do inicial (ui/Menus.js) e na
 * Poké Ball da fase (ui/HUD.js). De cima para baixo:
 *   - o Pokémon em pixel (o sprite do FireRed em 2x) em cima da base de batalha;
 *   - o nome e o papel na mesma linha, e os tipos;
 *   - três barras em blocos (vida, dano por segundo e alcance do 1º golpe), com
 *     os números de systems/stats.js (`starterStats`) e o máximo de CONFIG.cards;
 *   - o golpe, colado no pé do card.
 *
 * `shiny` troca o sprite pelo shiny; `registered` põe a Poké Ball ao lado do
 * nome (já está na Pokédex); `footer` é uma linha a mais embaixo dos tipos.
 */
export function choiceCard(pokemon, { tag = 'button', className = '', shiny = false, registered = false, footer = '' } = {}) {
  const stats = starterStats(pokemon.id);
  const card = create(tag, `choice-card${className ? ` ${className}` : ''}`);
  if (tag === 'button') card.type = 'button';

  const stage = create('div', 'choice-stage');
  stage.appendChild(create('span', 'battle-base'));
  const sprite = create('img', 'choice-sprite');
  sprite.src = gen3Sprite(pokemon.dex, shiny);
  sprite.alt = pokemon.name;
  sprite.width = 128;
  sprite.height = 128;
  stage.appendChild(sprite);
  card.appendChild(stage);

  const ball = registered ? '<img class="caught-ball" src="assets/items/poke-ball.png" alt="" title="Já registrado na Pokédex">' : '';
  card.appendChild(create('div', 'choice-head', `<h3>${ball}${pokemon.name}</h3><span class="choice-role">${pokemon.role ?? ''}</span>`));
  card.appendChild(create('div', 'type-row', pokemon.types
    .map((t) => `<span class="type-tag" style="background:${typeColor(t)}">${typeName(t)}</span>`).join('')));
  if (footer) card.appendChild(create('div', 'stack-info', footer));

  const { maxHp, maxDps, maxRange } = CONFIG.cards;
  const bars = create('div', 'choice-stats');
  bars.append(statRow('Vida', stats.hp, maxHp), statRow('Dano/s', stats.dps, maxDps), statRow('Alcance', stats.range, maxRange));
  if (stats.extras.length) {
    bars.appendChild(create('p', 'stat-extras', stats.extras.map((key) => `+ ${EXTRA_LABEL[key] ?? key}`).join(' · ')));
  }
  card.appendChild(bars);

  if (stats.ability) {
    card.appendChild(create('div', 'move-box', `<b>${stats.ability.name}</b><span>${stats.ability.description ?? ''}</span>`));
  }
  return card;
}

/** Uma barra em blocos: quantos de CONFIG.cards.blocks o valor enche, e o número ao lado. */
function statRow(label, value, max) {
  const blocks = CONFIG.cards.blocks;
  const filled = value > 0 ? Math.max(1, Math.min(blocks, Math.round((value / max) * blocks))) : 0;
  const cells = Array.from({ length: blocks }, (_, i) => `<i${i < filled ? ' class="on"' : ''}></i>`).join('');
  return create('div', 'stat-row',
    `<span class="stat-label">${label}</span><span class="stat-blocks" role="img" aria-label="${label}: ${value}">${cells}</span><b class="stat-value">${value}</b>`);
}
