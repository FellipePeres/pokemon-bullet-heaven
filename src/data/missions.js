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
 *   retreat     onde o jogador fica quando sai da luta no meio (H-7): { map, x, y, dir }, e o aviso
 *               (`retreatToast`)
 *   nurse       a fala da enfermeira do Centro quando a equipe cai na luta (data/dialogue.js)
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
    species: 'zapdos',
    retreat: { map: 'usina', x: 5, y: 12, dir: 'left' },
    retreatToast: 'Você recua pela escotilha.',
    nurse: 'enfermeira_usina'
  },
  // H-7: o fundo das Ilhas Seafoam (PLANEJAMENTO-HISTORIA.md seção 5.2); o card sobe na margem
  articuno: {
    name: 'ARTICUNO',
    title: 'Derrote e liberte o Articuno',
    place: 'O fundo das Ilhas Seafoam',
    about: 'Pokémon lendário de Kanto',
    dex: 144,
    type: 'ice',
    weak: ['rock', 'fire', 'electric', 'steel'],
    banner: 'assets/ui/gym-banners/seafoam.png',
    balls: null,
    trail: 'O fundo das Ilhas Seafoam · preso por correntes · enfraquecido e fora de si',
    recommendedLevel: 57,
    note: 'Volte quando estiver pronto: a margem continua no mesmo lugar.',
    stage: 'articuno',
    species: 'articuno',
    retreat: { map: 'seafoam_b4f', x: 17, y: 7, dir: 'right' },
    retreatToast: 'Você recua para a margem.',
    nurse: 'enfermeira_seafoam'
  },
  // H-8: o cume do Monte Brasa (PLANEJAMENTO-HISTORIA.md seção 5.3); o card sobe no alto do cume
  moltres: {
    name: 'MOLTRES',
    title: 'Derrote e liberte o Moltres',
    place: 'O cume do Monte Brasa',
    about: 'Pokémon lendário de Kanto',
    dex: 146,
    type: 'fire',
    weak: ['rock', 'water', 'electric'],
    banner: 'assets/ui/gym-banners/monte_brasa.png',
    balls: null,
    trail: 'O cume do Monte Brasa · preso por correntes · enfraquecido e fora de si',
    recommendedLevel: 62,
    note: 'Volte quando estiver pronto: o cume continua no mesmo lugar.',
    stage: 'moltres',
    species: 'moltres',
    retreat: { map: 'brasa_cume', x: 8, y: 10, dir: 'down' },
    retreatToast: 'Você recua do alto do cume.',
    nurse: 'enfermeira_brasa'
  }
};

export const getMission = (id) => MISSIONS[id] ?? null;

/** Os lendários que têm missão: antes dela vencida, nenhum deles aparece na Poké Ball (H-5). */
export const MISSION_SPECIES = Object.values(MISSIONS).map((m) => m.species);

/** A missão de um lendário (pela espécie), ou null. */
export const missionOf = (species) => Object.keys(MISSIONS).find((id) => MISSIONS[id].species === species) ?? null;
