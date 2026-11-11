/**
 * AS MISSÕES DOS LENDÁRIOS (0.39, PLANEJAMENTO-HISTORIA.md seção 5): o card de cada uma,
 * no padrão do card de fase do mapa da jornada (ui/missionCard.js), com a foto do lendário.
 * A luta de cada uma vem com o molde das missões (H-5), tirado do salão do Kyogre.
 *
 * Cada missão:
 *   name        o nome do lendário (a faixa do card)
 *   title       o título do card ("Derrote e liberte o Zapdos")
 *   place       onde ele está (o rótulo de cima)
 *   dex         o número na Pokédex (a foto: assets/pokemon/gen3/front/<dex>.png)
 *   type, weak  o tipo e as fraquezas (as pílulas do banner)
 *   banner      a faixa do lugar (assets/ui/gym-banners)
 *   balls       as bolas especiais da luta: { icon, name, count, chance }
 *   trail       a linha de baixo do card
 *   recommendedLevel  o nível recomendado
 *   note        o aviso embaixo dos botões
 */
export const MISSIONS = {
  zapdos: {
    name: 'ZAPDOS',
    title: 'Derrote e liberte o Zapdos',
    place: 'O fundo da Usina',
    about: 'Pokémon lendário de Kanto',
    dex: 145,
    type: 'electric',
    weak: ['ice', 'rock'],
    banner: 'assets/ui/gym-banners/usina.png',
    balls: { icon: 'assets/items/ultra-ball.png', name: 'Ultra Balls', count: 3, chance: 0.1 },
    trail: 'O fundo da Usina · no escuro · preso por correntes, fora de si',
    recommendedLevel: 58,
    note: 'Volte quando estiver pronto: a escotilha continua no mesmo lugar.'
  }
};

export const getMission = (id) => MISSIONS[id] ?? null;
