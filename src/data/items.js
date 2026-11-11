import { POKEMON } from './pokemon.js';

/**
 * O POKÉ MART (0.23, aprovado pelo Fellipe item por item: "quero bem caro, para
 * prender o jogador a jogar para comprar as coisas").
 *
 * Os Shards vêm dos chefes (10 por Pokémon de líder, 5 por chefe simples), da
 * primeira vitória de cada fase e das conquistas: uma jornada inteira rende
 * ~3.000. Os preços contam o tempo de jogo para juntar (rejogando fases, ~25 por
 * minuto): o Novo Sorteio ~12 min, o Reviver ~25 min, a TM ~1 h e uma pedra
 * ~1h40. Rare Candy e Creche foram cortados pelo Fellipe.
 *
 * Tipos:
 *   bag        vai para a mochila (`profile.bag`) e é usado depois: o Reviver na
 *              fase (no card de quem desmaiou), o Novo Sorteio na tela da Poké Ball
 *   tm         ensina na hora o próximo golpe da linha de um Pokémon (equipe ou PC)
 *   evolution  evolui na hora um Pokémon que só evolui com aquele item (desde a
 *              0.23, quem evolui por pedra ou troca não evolui mais por nível)
 *   tm_dive    a TM Dive (0.34; PLANEJAMENTO-LOBBY.md, seção 8): troca para
 *              sempre o Golpe Desperto de um Pokémon de Água (tipo principal ou
 *              secundário) por Dive. Só aparece na loja quando alguém da jornada
 *              pode aprender. No FireRed não existe (a MO08 é do Ruby, Sapphire e
 *              Emerald); aqui ela é uma TM especial.
 */
export const STONES = ['fire_stone', 'water_stone', 'thunder_stone', 'leaf_stone', 'moon_stone'];

/**
 * OS ITENS DA HISTÓRIA (0.39, PLANEJAMENTO-HISTORIA.md): não se compram; as cenas
 * dão (o passo `give` de data/cutscenes.js) e eles ficam na jornada
 * (`campaign.keyItems`). Os dois primeiros são as pistas do Capítulo 3 (H-4).
 */
export const KEY_ITEMS = {
  // a Erika achou no jardim, depois da tempestade da noite do apagão (H-4, a cena do emblema)
  emblema_vermelho: { name: 'Pedaço de Metal', description: 'Um pedaço de máquina com um emblema vermelho. É o mesmo da máquina da Usina.' }
};

export const MART_ITEMS = [
  { id: 'reroll', name: 'Novo Sorteio', icon: 'reroll', price: 300, kind: 'bag',
    description: 'Na tela da Poké Ball, sorteia de novo as 4 opções. Vai para a mochila.' },
  { id: 'revive', name: 'Reviver', icon: 'revive', price: 600, kind: 'bag',
    description: 'Na fase, traz de volta um Pokémon desmaiado com metade da vida: clique no card dele. Vai para a mochila.' },
  { id: 'tm', name: 'TM', icon: 'tm', price: 1500, kind: 'tm',
    description: 'Ensina agora o próximo golpe da linha de um Pokémon, com as melhorias que ele já tem.' },
  { id: 'tm_dive', name: 'TM Dive', icon: 'tm', price: 1500, kind: 'tm_dive',
    description: 'Troca para sempre o Golpe Desperto de um Pokémon de Água por Dive: ele mergulha e sai embaixo da horda.' },
  { id: 'fire_stone', name: 'Pedra do Fogo', icon: 'fireStone', price: 2500, kind: 'evolution' },
  { id: 'water_stone', name: 'Pedra da Água', icon: 'waterStone', price: 2500, kind: 'evolution' },
  { id: 'thunder_stone', name: 'Pedra do Trovão', icon: 'thunderStone', price: 2500, kind: 'evolution' },
  { id: 'leaf_stone', name: 'Pedra das Folhas', icon: 'leafStone', price: 2500, kind: 'evolution' },
  { id: 'moon_stone', name: 'Pedra da Lua', icon: 'moonStone', price: 2500, kind: 'evolution' },
  { id: 'link_cable', name: 'Cabo de Troca', icon: 'linkCable', price: 2500, kind: 'evolution' }
];

export const getMartItem = (id) => MART_ITEMS.find((item) => item.id === id);

/**
 * Para quem cada item evolui a espécie: `{ itemId: toId }` (vazio se ela evolui
 * por nível ou não evolui). A Eevee tem as três pedras (`evolution.by`).
 */
export function itemEvolutions(pokemonId) {
  const evo = POKEMON[pokemonId]?.evolution;
  if (!evo?.method) return {};
  if (evo.by) return { ...evo.by };
  return evo.item ? { [evo.item]: evo.to } : {};
}

/** Quem cada item de evolução evolui (para a descrição na loja). */
export function evolvedBy(itemId) {
  return Object.values(POKEMON).filter((p) => itemEvolutions(p.id)[itemId]);
}
