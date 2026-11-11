/**
 * CENÁRIO — como cada arena é montada com as metatiles do FireRed.
 *
 * As metatiles (16x16) saem do decomp por tools/assets/extract.py: uma tira
 * por mapa (asset `scene/<sheet>`) e, nos salões, o mapa original inteiro
 * (data/sceneManifest.js). Quem monta é render/scenery.js:
 *
 *   route   gramado de rota: grama, grama alta, flores, desníveis, caminhos
 *           de areia, árvores de 2x2 e uma cerca de árvores na borda (Rota 1)
 *   forest  mata fechada com as árvores grandes da Floresta de Viridian
 *   cave    chão de caverna, crateras, pedras e paredões do Monte Lua
 *   room    salão: piso, paredes e enfeites recortados do mapa do ginásio
 *   repeat  um bloco do mapa repetido na arena toda (as salas de Saffron)
 *   fixed   o layout pronto da tira (o salão do Kyogre, 0.37: tools/assets/dive.py)
 *
 * O andar continua livre: o cenário é só chão desenhado, nada bloqueia.
 *
 * Retângulos de recorte são [x, y, largura, altura] em metatiles do mapa
 * original; faixas são [início, fim) — o fim fica de fora.
 *   floor    bloco do piso, repetido no salão todo
 *   top      faixa de parede no alto: rows (linhas do mapa), repeat (colunas
 *            que se repetem), left/right (colunas dos cantos), door (porta
 *            centralizada na faixa)
 *   bottom   igual a top, no pé da arena
 *   sides    paredes laterais: left/right (colunas), repeat (linhas)
 *   center   enfeite principal, no centro da arena (onde o treinador começa)
 *   props    enfeites espalhados numa grade de `spacing` metatiles
 */
export const SCENES = {
  route:  { sheet: 'route1', kind: 'route' },
  forest: { sheet: 'viridian_forest', kind: 'forest' },
  cave:   { sheet: 'mt_moon', kind: 'cave' },

  pewter_gym: {
    sheet: 'pewter_gym', kind: 'room',
    floor: [3, 4, 1, 1],
    top: { rows: [0, 4], repeat: [3, 10], left: [0, 3], right: [10, 13] },
    sides: { left: [0, 2], right: [12, 13], repeat: [4, 12] },
    bottom: { rows: [12, 15], repeat: [8, 12], left: [0, 2], right: [12, 13] },
    center: [4, 4, 5, 4],
    props: [[3, 8, 7, 1], [4, 9, 5, 3], [3, 7, 1, 1], [11, 8, 1, 1], [4, 4, 5, 4]],
    spacing: 9
  },
  cerulean_gym: {
    sheet: 'cerulean_gym', kind: 'room',
    floor: [15, 4, 1, 1],
    top: { rows: [0, 4], repeat: [2, 8], left: [0, 2], right: [15, 17] },
    sides: { left: [0, 2], right: [16, 17], repeat: [4, 18] },
    center: [2, 4, 13, 14],
    props: [[2, 4, 13, 14]],
    spacing: 22
  },
  vermilion_gym: {
    sheet: 'vermilion_gym', kind: 'room',
    floor: [2, 9, 1, 1],
    top: { rows: [6, 8], repeat: [0, 11] },
    sides: { left: [0, 1], repeat: [9, 19] },
    center: [3, 1, 5, 3],
    props: [[1, 10, 5, 5], [3, 16, 1, 2], [7, 16, 1, 2], [3, 1, 5, 3]],
    spacing: 9
  },
  celadon_gym: {
    sheet: 'celadon_gym', kind: 'room',
    floor: [5, 4, 2, 1],
    top: { rows: [0, 3], repeat: [3, 10], left: [0, 3], right: [10, 13] },
    sides: { left: [0, 2], right: [12, 13], repeat: [3, 15] },
    bottom: { rows: [15, 18], repeat: [8, 12], left: [0, 2], right: [12, 13] },
    center: [4, 5, 5, 3],
    props: [[3, 3, 2, 2], [3, 3, 1, 2], [8, 12, 2, 3], [4, 5, 5, 3]],
    spacing: 6
  },
  fuchsia_gym: {
    sheet: 'fuchsia_gym', kind: 'room',
    floor: [12, 3, 1, 1],
    top: { rows: [0, 3], repeat: [0, 4] },
    sides: { left: [0, 1], repeat: [3, 22] },
    center: [6, 12, 3, 3],
    props: [[6, 12, 3, 3], [4, 18, 1, 2]],
    spacing: 9
  },
  saffron_gym: {
    sheet: 'saffron_gym', kind: 'room',
    floor: [2, 4, 1, 1],
    top: { rows: [0, 3], repeat: [0, 10] },
    center: [12, 10, 5, 3],
    props: [[8, 4, 1, 1], [12, 10, 5, 3], [0, 7, 1, 1]],
    spacing: 8
  },
  cinnabar_gym: {
    sheet: 'cinnabar_gym', kind: 'room',
    floor: [3, 11, 1, 1],
    top: { rows: [0, 3], repeat: [13, 20], left: [0, 1], right: [29, 30] },
    sides: { left: [0, 2], right: [29, 30], repeat: [3, 7] },
    center: [4, 3, 3, 3],
    props: [[13, 7, 8, 3], [4, 3, 3, 3]],
    spacing: 11
  },
  viridian_gym: {
    sheet: 'viridian_gym', kind: 'room',
    floor: [19, 4, 1, 1],
    top: { rows: [0, 3], repeat: [5, 11], left: [0, 5] },
    sides: { left: [0, 1], repeat: [3, 7] },
    props: [[5, 15, 9, 3], [17, 4, 1, 11], [15, 19, 1, 2], [2, 12, 2, 7]],
    spacing: 11
  },

  // Elite dos Quatro: as três primeiras salas têm o mesmo desenho
  lorelei_room: leagueRoom('lorelei_room'),
  bruno_room: leagueRoom('bruno_room'),
  agatha_room: leagueRoom('agatha_room'),
  lance_room: {
    sheet: 'lance_room', kind: 'room',
    floor: [3, 8, 1, 1],
    top: { rows: [3, 6], repeat: [0, 2], door: [5, 3, 3, 3] },
    sides: { left: [0, 1], right: [12, 13], repeat: [7, 13] },
    bottom: { rows: [21, 24], repeat: [0, 2] },
    center: [4, 7, 5, 6],
    props: [[10, 7, 1, 2], [2, 7, 1, 2]],
    spacing: 8
  },
  // corredor da Liga (o salão das estátuas do mapa do Lance)
  league_hall: {
    sheet: 'lance_room', kind: 'room',
    floor: [3, 19, 1, 1],
    top: { rows: [3, 6], repeat: [0, 2] },
    bottom: { rows: [21, 24], repeat: [0, 2] },
    props: [[1, 16, 2, 3], [1, 20, 1, 1]],
    spacing: 6
  },
  champion_room: {
    sheet: 'champion_room', kind: 'room',
    floor: [4, 7, 1, 1],
    top: { rows: [0, 6], repeat: [4, 5], door: [5, 0, 3, 6] },
    sides: { left: [0, 3], right: [10, 13], repeat: [8, 10] },
    bottom: { rows: [11, 13], repeat: [4, 5], left: [0, 3], right: [10, 13] },
    center: [5, 7, 3, 4],
    props: [[3, 6, 7, 1], [3, 11, 7, 1], [5, 7, 3, 4]],
    spacing: 10
  },
  // o salão do Kyogre (0.37): a arena aprovada na maquete, com o tileset cave do Emerald
  kyogre_hall: { sheet: 'marine_cave', kind: 'fixed' },
  // o fundo da Usina (H-6, a missão do Zapdos): o piso, a parede de canos, os transformadores,
  // o entulho e os geradores da Power Plant do FireRed. `clear` (em casas da arena) deixa
  // livre o lugar da máquina do emblema vermelho, desenhada por cima (render/zapdosFight.js)
  usina_arena: {
    sheet: 'power_plant', kind: 'room',
    floor: [5, 5, 1, 1],
    top: { rows: [19, 21], repeat: [24, 30], left: [21, 24], right: [41, 44] },
    props: [[27, 22, 4, 2], [27, 25, 4, 1], [3, 3, 3, 1], [7, 4, 2, 1], [7, 10, 3, 3], [36, 25, 5, 1]],
    clear: [[30, 14, 16, 11]],
    spacing: 10
  }
};

function leagueRoom(sheet) {
  return {
    sheet, kind: 'room',
    floor: [3, 5, 1, 1],
    top: { rows: [0, 3], repeat: [0, 2], door: [5, 0, 3, 3] },
    sides: { left: [0, 1], right: [12, 13], repeat: [3, 10] },
    bottom: { rows: [10, 13], repeat: [0, 2] },
    center: [4, 4, 5, 6],
    props: [[2, 4, 1, 3], [2, 7, 1, 3]],
    spacing: 9
  };
}

/** Cenário de cada tema quando o trecho da fase não escolhe um. */
export const THEME_SCENES = { grass: 'route', forest: 'forest', cave: 'cave', gym: 'pewter_gym' };

/** Qual cenário um trecho da jornada usa. */
export function sceneOf(segment, world) {
  if (segment?.scene && SCENES[segment.scene]) return segment.scene;
  return THEME_SCENES[segment?.theme ?? world?.theme] ?? 'route';
}

/** Todos os cenários de uma fase, na ordem dos trechos. */
export function stageScenes(stage) {
  const segments = stage.segments?.length ? stage.segments : [{ theme: stage.world.theme }];
  return [...new Set(segments.map((segment) => sceneOf(segment, stage.world)))];
}
