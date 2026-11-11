/**
 * O MAPA DE KANTO do lobby — o Town Map do FireRed (0.13).
 *
 * A imagem vem de tools/assets/extract_region_map.py: o mapa do jogo, recortado
 * à moldura dele (192x144, em 1x). As cidades estão na grade de 22x15 células de
 * 8 pixels do jogo (`region_map_layout_kanto.h` do decomp), e o jogo desenha a
 * célula (x, y) com o centro em (8x + 36, 8y + 36) na tela; o recorte começa em
 * (24, 16), então aqui o centro fica em (8x + 12, 8y + 20).
 */

export const REGION_MAP = { src: 'assets/ui/region-map/kanto.png', width: 192, height: 144 };

/** As cidades da jornada, pela célula do Town Map. */
const CITIES = {
  pallet: { name: 'Pallet', cell: [4, 11] },
  viridian: { name: 'Viridian', cell: [4, 8] },
  pewter: { name: 'Pewter', cell: [4, 4] },
  cerulean: { name: 'Cerulean', cell: [14, 3] },
  vermilion: { name: 'Vermilion', cell: [14, 9] },
  celadon: { name: 'Celadon', cell: [11, 6] },
  fuchsia: { name: 'Fuchsia', cell: [12, 12] },
  saffron: { name: 'Saffron', cell: [14, 6] },
  cinnabar: { name: 'Cinnabar', cell: [4, 14] },
  indigo: { name: 'Indigo Plateau', cell: [2, 3] }
};

/** Onde fica cada fase: o ginásio na cidade dele; a Liga e o Campeão no Indigo Plateau. */
export const STAGE_CITY = {
  gym_1_pewter: 'pewter',
  gym_2_cerulean: 'cerulean',
  gym_3_vermilion: 'vermilion',
  gym_4_celadon: 'celadon',
  gym_5_fuchsia: 'fuchsia',
  gym_6_saffron: 'saffron',
  gym_7_cinnabar: 'cinnabar',
  gym_8_viridian: 'viridian',
  e4_lorelei: 'indigo',
  e4_bruno: 'indigo',
  e4_agatha: 'indigo',
  e4_lance: 'indigo',
  champion: 'indigo'
};

/**
 * Os lugares da história no mapa (0.39): marcas que não são fases. Cada uma aparece
 * enquanto uma das quests de `quests` está ativa, e o botão do painel leva o jogador para
 * dentro do lugar (`map`, no `spot`), para andar à vontade. A cena `scene` é a da chegada
 * (o gatilho 'enter' dela): o painel muda o texto depois dela.
 */
export const STORY_PLACES = {
  usina: {
    name: 'A Usina', area: 'Rota 10', cell: [18, 4],
    map: 'usina', spot: { x: 5, y: 37, dir: 'up' },
    quests: ['z_usina', 'z_zapdos'],
    scene: 'usina_entrada',
    text: 'Um marinheiro de Vermilion escutou correntes pesadas se arrastando aqui dentro. A Usina está fechada desde o apagão.',
    seenText: 'As paredes estão marcadas por raios, e um barulho de correntes vem lá do fundo. Em algum lugar do labirinto, um caminho leva para baixo.',
    go: 'Investigar', goSeen: 'Entrar na Usina'
  }
};

/** O centro de um lugar da história no mapa recortado, em pixels de 1x. */
export function placePoint(id) {
  const [x, y] = STORY_PLACES[id].cell;
  return { x: 8 * x + 12, y: 8 * y + 20 };
}

/** A cidade de onde a jornada parte. */
export const HOME_CITY = 'pallet';

export const cityName = (id) => CITIES[id]?.name ?? id;

/** O centro da cidade no mapa recortado, em pixels de 1x. */
export function cityPoint(id) {
  const [x, y] = CITIES[id].cell;
  return { x: 8 * x + 12, y: 8 * y + 20 };
}
