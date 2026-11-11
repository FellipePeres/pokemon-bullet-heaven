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
 *   balls       as bolas especiais da luta: { icon, name, count, chance }, ou null numa luta
 *               sem captura (o Zapdos: fraco e assustado, ele foge; a captura é outro momento)
 *   trail       a linha de baixo do card
 *   recommendedLevel  o nível recomendado
 *   note        o aviso embaixo dos botões
 *   stage       a fase da luta (data/stages.js, `legendaryFight`), no molde das missões (H-5)
 *   species     quem é liberado: depois da missão vencida, ele entra no sorteio da Poké Ball
 *               das fases seguintes (PLANEJAMENTO-HISTORIA.md seção 6)
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
    balls: null,
    trail: 'O fundo da Usina · preso por correntes · enfraquecido e fora de si',
    recommendedLevel: 36,
    note: 'Volte quando estiver pronto: a escotilha continua no mesmo lugar.',
    stage: 'zapdos',
    species: 'zapdos'
  }
};

export const getMission = (id) => MISSIONS[id] ?? null;

/** Os lendários que têm missão: antes dela vencida, nenhum deles aparece na Poké Ball (H-5). */
export const MISSION_SPECIES = Object.values(MISSIONS).map((m) => m.species);

/** A missão de um lendário (pela espécie), ou null. */
export const missionOf = (species) => Object.keys(MISSIONS).find((id) => MISSIONS[id].species === species) ?? null;
