/**
 * MAPAS DA VILA — gerado por tools/assets/hub.py. Não edite à mão: rode o
 * gerador de novo. Portas, pessoas e falas ficam em src/data/hub.js.
 *
 * Cada mapa tem o chão (`src`), o que fica por cima dos personagens (`top`)
 * e a colisão, uma linha por fileira de tiles: "." anda, "#" bloqueia.
 */
export const HUB_MAPS = {
  vila: {
    src: 'assets/hub/vila.png', top: 'assets/hub/vila-top.png', width: 36, height: 28,
    walk: [
      '####################################',
      '####################################',
      '##................................##',
      '##...................#########....##',
      '##........##.........#########....##',
      '##..####..##...#####...#######....##',
      '##..####.......#####...#######....##',
      '##..####.......#####..............##',
      '##.............#####.........####.##',
      '####.........................####.##',
      '####.........................####.##',
      '##................................##',
      '##................................##',
      '##...#####........................##',
      '##...#####........................##',
      '##...#####...................#######',
      '##..######...........####....#######',
      '##...................####....#######',
      '##...................####.........##',
      '##.......#..........#####.........##',
      '.....................#..#.........##',
      '..................................##',
      '...............................##.##',
      '...............................##.##',
      '##.............#.......##.........##',
      '##..........##.........##.........##',
      '################....################',
      '################....################'
    ]
  },
  casa_1f: {
    src: 'assets/hub/casa_1f.png', top: 'assets/hub/casa_1f-top.png', width: 13, height: 10,
    walk: [
      '#############',
      '#############',
      '#..........##',
      '#............',
      '#.....##.....',
      '#.....##.....',
      '#............',
      '##..........#',
      '#............',
      '#############'
    ]
  },
  casa_2f: {
    src: 'assets/hub/casa_2f.png', top: 'assets/hub/casa_2f-top.png', width: 12, height: 9,
    walk: [
      '############',
      '############',
      '#.......##..',
      '#.......##..',
      '#...........',
      '###.........',
      '###.........',
      '#...........',
      '#...........'
    ]
  },
  centro: {
    src: 'assets/hub/centro.png', top: 'assets/hub/centro-top.png', width: 16, height: 11,
    walk: [
      '################',
      '################',
      '################',
      '####..##.#....##',
      '########.#######',
      '#..............#',
      '#..............#',
      '#..............#',
      '##............##',
      '#..............#',
      '################'
    ]
  },
  pokedoll: {
    src: 'assets/hub/pokedoll.png', top: 'assets/hub/pokedoll-top.png', width: 13, height: 12,
    walk: [
      '#############',
      '###.......###',
      '.............',
      '.##..###.###.',
      '.##..........',
      '.##..###.###.',
      '.............',
      '.............',
      '########.....',
      '.......#.....',
      '.......#.....',
      '#############'
    ]
  },
  lab: {
    src: 'assets/hub/lab.png', top: 'assets/hub/lab-top.png', width: 13, height: 14,
    walk: [
      '#############',
      '#############',
      '#...........#',
      '#...........#',
      '###.....###.#',
      '###.........#',
      '#...........#',
      '#...........#',
      '#####...#####',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#############'
    ]
  },
  cabana: {
    src: 'assets/hub/cabana.png', top: 'assets/hub/cabana-top.png', width: 11, height: 9,
    walk: [
      '###########',
      '###########',
      '...........',
      '...........',
      '.....##....',
      '.....##....',
      '...........',
      '#.........#',
      '###########'
    ]
  },
  casa_sabio: {
    src: 'assets/hub/casa_sabio.png', top: 'assets/hub/casa_sabio-top.png', width: 13, height: 11,
    walk: [
      '#############',
      '#############',
      '.............',
      '.............',
      '##..####..###',
      '##........#.#',
      '.............',
      '.............',
      '.............',
      '#...........#',
      '#############'
    ]
  },
  ginasio_pewter: {
    src: 'assets/hub/ginasio_pewter.png', top: 'assets/hub/ginasio_pewter-top.png', width: 13, height: 16,
    walk: [
      '#############',
      '####.....####',
      '#############',
      '#....#.#....#',
      '#...........#',
      '#...#...#...#',
      '#...........#',
      '#..#.#.#.#..#',
      '##.........##',
      '#...#...#...#',
      '##.........##',
      '#...........#',
      '#...#...#...#',
      '#...........#',
      '#...........#',
      '#############'
    ]
  },
  ginasio_cerulean: {
    src: 'assets/hub/ginasio_cerulean.png', top: 'assets/hub/ginasio_cerulean-top.png', width: 17, height: 20,
    walk: [
      '#################',
      '#####.#...#.#####',
      '#################',
      '#...............#',
      '#......###......#',
      '#.#############.#',
      '#.#####...#####.#',
      '#.##.........##.#',
      '#.#####...##.##.#',
      '#.##########.##.#',
      '#.##.........##.#',
      '#.##.####.#####.#',
      '#.##.####..####.#',
      '#.##......#####.#',
      '#.#######.#####.#',
      '#.#######.#####.#',
      '#.####.....####.#',
      '#.#####...#####.#',
      '#...............#',
      '#################'
    ]
  },
  cerulean: {
    src: 'assets/hub/cerulean.png', top: 'assets/hub/cerulean-top.png', width: 22, height: 15,
    walk: [
      '##...#...#############',
      '##...#...#.........###',
      '.#...#...#.........###',
      '.#...#...#.........###',
      '##.......#...##...####',
      '##......#######...####',
      '##......#######...####',
      '##......#######......#',
      '..............#......#',
      '..............#......#',
      '..............#......#',
      '..............#......#',
      '#####.........#......#',
      '#####.........#......#',
      '###############.......'
    ]
  },
  ginasio_vermilion: {
    src: 'assets/hub/ginasio_vermilion.png', top: 'assets/hub/ginasio_vermilion-top.png', width: 11, height: 21,
    walk: [
      '###########',
      '###########',
      '#..#...#..#',
      '#.........#',
      '#.........#',
      '#.........#',
      '###########',
      '###########',
      '...........',
      '...........',
      '.#.#.#.#.#.',
      '...........',
      '.#.#.#.#.#.',
      '...........',
      '.#.#.#.#.#.',
      '...........',
      '...........',
      '...#...#...',
      '...........',
      '...........',
      '###########'
    ]
  },
  vermilion: {
    src: 'assets/hub/vermilion.png', top: 'assets/hub/vermilion-top.png', width: 26, height: 18,
    walk: [
      '....................#.....',
      '..........................',
      '..........................',
      '.................###.....#',
      '####.........#######.....#',
      '####..####...#######.....#',
      '#####.####...#######.....#',
      '##....####.......####...##',
      '......###############...##',
      '......###############...##',
      '......##................##',
      '########................##',
      '########................##',
      '########...###############',
      '########...###############',
      '########...###############',
      '########...###############',
      '######..###..#############'
    ]
  },
  usina: {
    src: 'assets/hub/usina.png', top: 'assets/hub/usina-top.png', width: 49, height: 40,
    walk: [
      '#################################################',
      '#################################################',
      '#################################################',
      '#...#####.#...#######............#####......#####',
      '#......##.#......####............############.###',
      '#.................###............###..#######..##',
      '#.................#####..######..##...######...##',
      '#.........####..#######..######..####.####.....##',
      '####..########..#####......####..####..##......##',
      '####..#######....####.......###..##....##.###...#',
      '#......######.....###........##..#.....#..#######',
      '#......#######......#.........#..#.........######',
      '#.........##.#................#..#...........####',
      '#.........##.#................#..#...........####',
      '#######################..######..######..########',
      '#######################..######..######..########',
      '#####.....#.....#####.........#.................#',
      '###...............###.........#.................#',
      '##.................##.........#.................#',
      '##.................##########################...#',
      '#####.....####......#########################...#',
      '#####.....####......####....................#...#',
      '#.........##...........###.#############....#...#',
      '#.........#............###################..#...#',
      '#...#######...#######.......................#...#',
      '#...#######...#######....################...#...#',
      '#......####.........#.......................#...#',
      '#.......###.........#.......................#...#',
      '#.......###.........#########################...#',
      '######..#########...#########################..##',
      '######..#########...#........####......#.......##',
      '#.........###...........##....#....##.........###',
      '#.........#.............##........###..##########',
      '##......###.............##........####.##########',
      '###.....######..####################.#.##########',
      '###.....######..####################...##########',
      '##.......####......####.....#####...........#####',
      '#.........##......####......#####.##..###...##..#',
      '#.........#.....................#...............#',
      '#################################################'
    ]
  },
  usina_fundo: {
    src: 'assets/hub/usina_fundo.png', top: 'assets/hub/usina_fundo-top.png', width: 15, height: 11,
    walk: [
      '###############',
      '###############',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '###############'
    ]
  },
  usina_luz: {
    src: 'assets/hub/usina_luz.png', top: 'assets/hub/usina_luz-top.png', width: 15, height: 11,
    walk: [
      '###############',
      '###############',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '#.............#',
      '###############'
    ]
  }
};

/** As folhas dos personagens e objetos da vila (tiras de quadros, em 1x). */
export const HUB_SPRITES = {
  'item/ultra-ball': { src: 'assets/items/ultra-ball.png', frameWidth: 30, frameHeight: 30, frames: 1 },
  'npc/beauty': { src: 'assets/hub/npc/beauty.png', frameWidth: 16, frameHeight: 32, frames: 10 },
  'npc/brock': { src: 'assets/hub/npc/brock.png', frameWidth: 16, frameHeight: 32, frames: 3 },
  'npc/clefairy': { src: 'assets/hub/npc/clefairy.png', frameWidth: 16, frameHeight: 16, frames: 3 },
  'npc/clerk': { src: 'assets/hub/npc/clerk.png', frameWidth: 16, frameHeight: 32, frames: 9 },
  'npc/escotilha': { src: 'assets/hub/npc/escotilha.png', frameWidth: 16, frameHeight: 16, frames: 1 },
  'npc/fisher': { src: 'assets/hub/npc/fisher.png', frameWidth: 16, frameHeight: 32, frames: 10 },
  'npc/gentleman': { src: 'assets/hub/npc/gentleman.png', frameWidth: 16, frameHeight: 32, frames: 10 },
  'npc/item_ball': { src: 'assets/hub/npc/item_ball.png', frameWidth: 16, frameHeight: 16, frames: 1 },
  'npc/jigglypuff': { src: 'assets/hub/npc/jigglypuff.png', frameWidth: 16, frameHeight: 16, frames: 3 },
  'npc/lapras_doll': { src: 'assets/hub/npc/lapras_doll.png', frameWidth: 32, frameHeight: 32, frames: 1 },
  'npc/lass': { src: 'assets/hub/npc/lass.png', frameWidth: 16, frameHeight: 32, frames: 10 },
  'npc/little_girl': { src: 'assets/hub/npc/little_girl.png', frameWidth: 16, frameHeight: 16, frames: 10 },
  'npc/lt_surge': { src: 'assets/hub/npc/lt_surge.png', frameWidth: 16, frameHeight: 32, frames: 3 },
  'npc/maquina_zapdos': { src: 'assets/hub/npc/maquina_zapdos.png', frameWidth: 64, frameHeight: 48, frames: 1 },
  'npc/maquina_zapdos_quebrada': { src: 'assets/hub/npc/maquina_zapdos_quebrada.png', frameWidth: 64, frameHeight: 48, frames: 1 },
  'npc/meowth': { src: 'assets/hub/npc/meowth.png', frameWidth: 16, frameHeight: 16, frames: 3 },
  'npc/misty': { src: 'assets/hub/npc/misty.png', frameWidth: 16, frameHeight: 32, frames: 3 },
  'npc/mom': { src: 'assets/hub/npc/mom.png', frameWidth: 16, frameHeight: 32, frames: 3 },
  'npc/nurse': { src: 'assets/hub/npc/nurse.png', frameWidth: 16, frameHeight: 32, frames: 4 },
  'npc/old_man_1': { src: 'assets/hub/npc/old_man_1.png', frameWidth: 16, frameHeight: 32, frames: 10 },
  'npc/old_man_2': { src: 'assets/hub/npc/old_man_2.png', frameWidth: 16, frameHeight: 32, frames: 9 },
  'npc/olhos_zapdos': { src: 'assets/hub/npc/olhos_zapdos.png', frameWidth: 40, frameHeight: 16, frames: 1 },
  'npc/pidgey': { src: 'assets/hub/npc/pidgey.png', frameWidth: 16, frameHeight: 16, frames: 3 },
  'npc/pikachu': { src: 'assets/hub/npc/pikachu.png', frameWidth: 16, frameHeight: 16, frames: 3 },
  'npc/policeman': { src: 'assets/hub/npc/policeman.png', frameWidth: 16, frameHeight: 32, frames: 9 },
  'npc/prof_oak': { src: 'assets/hub/npc/prof_oak.png', frameWidth: 16, frameHeight: 32, frames: 9 },
  'npc/rival': { src: 'assets/hub/npc/rival.png', frameWidth: 16, frameHeight: 32, frames: 9 },
  'npc/sailor': { src: 'assets/hub/npc/sailor.png', frameWidth: 16, frameHeight: 32, frames: 10 },
  'npc/scientist': { src: 'assets/hub/npc/scientist.png', frameWidth: 16, frameHeight: 32, frames: 10 },
  'npc/voltorb': { src: 'assets/hub/npc/voltorb.png', frameWidth: 16, frameHeight: 16, frames: 3 },
  'npc/woman_1': { src: 'assets/hub/npc/woman_1.png', frameWidth: 16, frameHeight: 32, frames: 10 },
  'npc/worker_f': { src: 'assets/hub/npc/worker_f.png', frameWidth: 16, frameHeight: 32, frames: 10 },
  'npc/youngster': { src: 'assets/hub/npc/youngster.png', frameWidth: 16, frameHeight: 32, frames: 10 },
  'npc/zapdos': { src: 'assets/hub/npc/zapdos.png', frameWidth: 32, frameHeight: 32, frames: 1 }
};

/** Os móveis do quarto (data/decor.js): o chão, a camada de cima e as células que bloqueiam. */
export const HUB_DECOR = {
  pc_mesa: { src: 'assets/hub/decor/pc_mesa.png', top: 'assets/hub/decor/pc_mesa-top.png', width: 2, height: 2, solid: [[0, 0], [1, 0]] },
  estante: { src: 'assets/hub/decor/estante.png', top: 'assets/hub/decor/estante-top.png', width: 2, height: 2, solid: [[0, 0], [1, 0]] },
  tapete: { src: 'assets/hub/decor/tapete.png', top: 'assets/hub/decor/tapete-top.png', width: 5, height: 4, solid: [[2, 0], [2, 1]] },
  planta: { src: 'assets/hub/decor/planta.png', top: 'assets/hub/decor/planta-top.png', width: 1, height: 2, solid: [[0, 1]] }
};
