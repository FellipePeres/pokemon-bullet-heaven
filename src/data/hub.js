/**
 * A VILA DA JORNADA — o lobby jogável (PLANEJAMENTO-LOBBY.md).
 *
 * Os mapas (o chão, a camada de cima e a colisão) são gerados por
 * tools/assets/hub.py em data/hubMaps.js. Aqui fica o que é desenho de jogo:
 * portas, saídas, quem está em cada lugar e o que responde ao botão A. As
 * falas ficam em data/dialogue.js.
 *
 * Coordenadas em tiles (x, y), a partir do canto de cima, à esquerda, de cada mapa.
 *
 *   spawn    onde o jogador aparece: no quarto (jornada nova) ou na frente de casa
 *   warps    ir para outro lugar. `on` diz como:
 *              'push'  andar contra o tile, na direção `face` (a porta bloqueia, como no FireRed)
 *              'step'  pisar no tile (a escada, a entrada aberta da loja)
 *              'mat'   apertar para baixo em cima do tapete da saída
 *            `to`, `tx`, `ty` e `dir`: o mapa, o tile e para onde o jogador olha ao chegar
 *   exits    sair pela borda do mapa, andando na direção `dir` a partir das células
 *            `cells`. `needs: 'starter'` trava até o Carvalho dar o inicial; `guard` é
 *            quem avisa (a fala `<guard>` com a condição `locked`)
 *   npcs     pessoas e Pokémon: `sprite` (data/hubMaps.js), para onde olham (`dir`),
 *            `look` (olham em volta de tempos em tempos), `counter` (atrás de um balcão:
 *            o jogador fala por cima dele) e a fala (`talk`, uma chave de data/dialogue.js)
 *   things   o que responde ao A: placas, a TV, a cama, a lagoa, as vitrines
 *   decor    sprites parados (as Poké Balls na mesa, os bonecos nas vitrines);
 *            `hideIf` esconde quando a condição bate (a bola do inicial escolhido some).
 *            No quarto (`room`) entra também o que o jogador comprou (data/decor.js)
 */
/** As células da máquina no alto do cume do Monte Brasa (H-8): ela não se atravessa. */
const BRASA_MACHINE = [[8, 5], [9, 5], [10, 5], [11, 5], [8, 6], [9, 6], [10, 6], [11, 6]];
// a máquina do Mewtwo no laboratório do subsolo da Mansão (H-9): 4 x 3 tiles, encostada na parede
const MANSAO_MACHINE = [5, 6, 7, 8].flatMap((x) => [[x, 3], [x, 4], [x, 5]]);

export const HUB = {
  spawn: {
    bedroom: { map: 'casa_2f', x: 5, y: 5, dir: 'down' },
    home: { map: 'vila', x: 6, y: 17, dir: 'down' }
  },

  // o quarto do jogador: é ali que aparece o que a loja de Pokédolls vende (data/decor.js)
  room: 'casa_2f',

  maps: {
    vila: {
      name: 'Vila da Jornada',
      warps: [
        { x: 6, y: 16, on: 'push', face: 'up', to: 'casa_1f', tx: 4, ty: 8, dir: 'up' },
        { x: 17, y: 8, on: 'push', face: 'up', to: 'centro', tx: 2, ty: 9, dir: 'up' },
        { x: 26, y: 6, on: 'push', face: 'up', to: 'lab', tx: 6, ty: 12, dir: 'up' },
        { x: 5, y: 7, on: 'push', face: 'up', to: 'cabana', tx: 4, ty: 7, dir: 'up' },
        { x: 30, y: 17, on: 'push', face: 'up', to: 'casa_sabio', tx: 6, ty: 9, dir: 'up' },
        { x: 22, y: 20, on: 'step', to: 'pokedoll', tx: 10, ty: 10, dir: 'up' },
        { x: 23, y: 20, on: 'step', to: 'pokedoll', tx: 10, ty: 10, dir: 'up' }
      ],
      exits: [
        // a Rota 1: abre o mapa da jornada
        { dir: 'down', cells: [[16, 27], [17, 27], [18, 27], [19, 27]], action: 'campaign', needs: 'starter', guard: 'rapaz' },
        // o mato alto: o modo Endless (ainda em breve)
        { dir: 'left', cells: [[0, 20], [0, 21], [0, 22], [0, 23]], action: 'endless', needs: 'starter', guard: 'senhor' }
      ],
      npcs: [
        { id: 'rapaz', sprite: 'youngster', x: 15, y: 25, dir: 'right', talk: 'rapaz' },
        { id: 'senhor', sprite: 'gentleman', x: 11, y: 20, dir: 'left', talk: 'senhor' },
        { id: 'pescador', sprite: 'fisher', x: 28, y: 9, dir: 'right', talk: 'pescador' },
        { id: 'menina', sprite: 'little_girl', x: 20, y: 12, dir: 'down', look: true, talk: 'menina' },
        { id: 'moca', sprite: 'lass', x: 25, y: 22, dir: 'left', look: true, talk: 'moca' },
        { id: 'meowth', sprite: 'meowth', x: 13, y: 18, dir: 'down', look: true, talk: 'meowth' },
        { id: 'clefairy', sprite: 'clefairy', x: 18, y: 21, dir: 'left', look: true, talk: 'clefairy' },
        { id: 'pidgey', sprite: 'pidgey', x: 32, y: 11, dir: 'left', look: true, talk: 'pidgey' }
      ],
      things: [
        { cells: [[15, 24]], talk: 'placa_rota1' },
        { cells: [[9, 19]], talk: 'placa_trilha' },
        { cells: [[20, 19]], talk: 'placa_loja' },
        { cells: [[4, 16]], talk: 'caixa_correio' },
        { cells: rect(29, 8, 4, 3), talk: 'lagoa' }
      ]
    },

    casa_1f: {
      name: 'Nossa casa',
      warps: [
        { x: 4, y: 8, on: 'mat', to: 'vila', tx: 6, ty: 17, dir: 'down' },
        { x: 5, y: 8, on: 'mat', to: 'vila', tx: 6, ty: 17, dir: 'down' },
        { x: 10, y: 2, on: 'step', to: 'casa_2f', tx: 10, ty: 2, dir: 'down' }
      ],
      npcs: [
        { id: 'mae', sprite: 'mom', x: 8, y: 4, dir: 'left', talk: 'mae' }
      ],
      things: [
        { cells: [[6, 1]], talk: 'tv' }
      ]
    },

    casa_2f: {
      name: 'Seu quarto',
      warps: [
        { x: 10, y: 2, on: 'step', to: 'casa_1f', tx: 10, ty: 2, dir: 'down' }
      ],
      npcs: [],
      things: [
        { cells: rect(1, 5, 2, 2), talk: 'cama' },
        { cells: [[11, 1]], talk: 'calendario' }
      ]
    },

    centro: {
      name: 'Centro Pokémon',
      music: 'mus_poke_center',
      warps: [
        { x: 2, y: 9, on: 'mat', to: 'vila', tx: 17, ty: 9, dir: 'down' }
      ],
      npcs: [
        { id: 'enfermeira', sprite: 'nurse', x: 4, y: 3, dir: 'down', counter: true, talk: 'enfermeira' },
        { id: 'vendedor', sprite: 'clerk', x: 12, y: 3, dir: 'down', counter: true, talk: 'vendedor' }
      ],
      things: [
        { cells: [[8, 2]], talk: 'pc_maquina' }
      ]
    },

    pokedoll: {
      name: 'Loja de Pokédolls',
      // a entrada é um tapete só, embaixo à direita, com o caminho livre (0.30)
      warps: [
        { x: 10, y: 10, on: 'mat', to: 'vila', tx: 23, ty: 21, dir: 'down' }
      ],
      npcs: [
        { id: 'vendedora', sprite: 'beauty', x: 3, y: 9, dir: 'up', counter: true, talk: 'vendedora' }
      ],
      things: [
        { cells: [...rect(5, 3, 3, 1), ...rect(9, 3, 3, 1), ...rect(5, 5, 3, 1), ...rect(9, 5, 3, 1)], talk: 'vitrine' },
        { cells: rect(1, 3, 2, 3), talk: 'prateleira' },
        { cells: [[3, 1]], talk: 'lapras_gigante' }
      ],
      decor: [
        { sprite: 'pikachu', x: 5, y: 3, oy: -7 }, { sprite: 'clefairy', x: 6, y: 3, oy: -7 },
        { sprite: 'jigglypuff', x: 7, y: 3, oy: -7 }, { sprite: 'meowth', x: 9, y: 3, oy: -7 },
        { sprite: 'pidgey', x: 10, y: 3, oy: -7 }, { sprite: 'pikachu', x: 11, y: 3, oy: -7 },
        { sprite: 'jigglypuff', x: 5, y: 5, oy: -7 }, { sprite: 'clefairy', x: 6, y: 5, oy: -7 },
        { sprite: 'pidgey', x: 10, y: 5, oy: -7 }, { sprite: 'meowth', x: 11, y: 5, oy: -7 },
        // o Lapras gigante fica no canto de cima, longe do corredor das vitrines (0.30)
        { sprite: 'lapras_doll', x: 3, y: 1, solid: true }
      ]
    },

    lab: {
      name: 'Laboratório do Prof. Carvalho',
      warps: [
        { x: 5, y: 12, on: 'mat', to: 'vila', tx: 26, ty: 7, dir: 'down' },
        { x: 6, y: 12, on: 'mat', to: 'vila', tx: 26, ty: 7, dir: 'down' },
        { x: 7, y: 12, on: 'mat', to: 'vila', tx: 26, ty: 7, dir: 'down' }
      ],
      npcs: [
        { id: 'carvalho', sprite: 'prof_oak', x: 6, y: 3, dir: 'down', talk: 'carvalho' },
        { id: 'cientista', sprite: 'scientist', x: 11, y: 10, dir: 'left', look: true, talk: 'cientista' },
        { id: 'assistente', sprite: 'worker_f', x: 2, y: 10, dir: 'right', look: true, talk: 'assistente' }
      ],
      things: [
        { cells: [[2, 1], [3, 1]], talk: 'lab_computador' },
        { cells: [[6, 1], [7, 1]], talk: 'lab_quadro' },
        { cells: [[8, 4], [9, 4], [10, 4]], talk: 'pokebolas' }
      ],
      // as três Poké Balls do FireRed: Bulbasaur, Squirtle e Charmander, da esquerda para a direita.
      // Some a do jogador e, depois que o rival pega a dele na cena (0.39), a com vantagem
      // sobre a do jogador (data/stages.js, RIVAL_STARTER)
      decor: [
        { sprite: 'item_ball', x: 8, y: 4, oy: -6, hideIf: [{ starterIs: 'bulbasaur' }, { starterIs: 'squirtle', flag: 'rival_inicial' }] },
        { sprite: 'item_ball', x: 9, y: 4, oy: -6, hideIf: [{ starterIs: 'squirtle' }, { starterIs: 'charmander', flag: 'rival_inicial' }] },
        { sprite: 'item_ball', x: 10, y: 4, oy: -6, hideIf: [{ starterIs: 'charmander' }, { starterIs: 'bulbasaur', flag: 'rival_inicial' }] }
      ]
    },

    cabana: {
      name: 'Cabana',
      warps: [
        { x: 3, y: 7, on: 'mat', to: 'vila', tx: 5, ty: 8, dir: 'down' },
        { x: 4, y: 7, on: 'mat', to: 'vila', tx: 5, ty: 8, dir: 'down' },
        { x: 5, y: 7, on: 'mat', to: 'vila', tx: 5, ty: 8, dir: 'down' }
      ],
      npcs: [
        { id: 'moradora', sprite: 'woman_1', x: 7, y: 5, dir: 'left', talk: 'moradora' }
      ],
      things: []
    },

    // os palcos das cenas (0.39, data/cutscenes.js): lugares fora da vila, só para as cenas de
    // antes e depois das fases, em tela cheia. Ninguém chega andando; no fim da cena, a volta é
    // para a vila (e, sem cena tocando, o jogador volta sozinho)
    ginasio_pewter: {
      name: 'Ginásio de Pewter',
      scene: true,
      npcs: [
        { id: 'brock', sprite: 'brock', x: 6, y: 5, dir: 'down', talk: 'brock' }
      ],
      things: []
    },
    ginasio_cerulean: {
      name: 'Ginásio de Cerulean',
      scene: true,
      npcs: [
        { id: 'misty', sprite: 'misty', x: 8, y: 6, dir: 'down', talk: 'misty' }
      ],
      things: []
    },
    ginasio_vermilion: {
      name: 'Ginásio de Vermilion',
      scene: true,
      npcs: [
        { id: 'surge', sprite: 'lt_surge', x: 5, y: 2, dir: 'down', talk: 'surge' }
      ],
      things: []
    },
    // o ginásio da Erika, inteiro (H-4): o palco da cena do emblema, depois da Fase 4
    ginasio_celadon: {
      name: 'Ginásio de Celadon',
      scene: true,
      npcs: [
        { id: 'erika', sprite: 'erika', x: 6, y: 4, dir: 'down', talk: 'erika' }
      ],
      things: []
    },
    // um recorte de Vermilion: o cais de madeira, com os marinheiros parados em terra
    vermilion: {
      name: 'Porto de Vermilion',
      scene: true,
      npcs: [
        { id: 'marinheiro', sprite: 'sailor', x: 18, y: 11, dir: 'left', talk: 'marinheiro' },
        { id: 'marinheiro2', sprite: 'sailor', x: 10, y: 15, dir: 'up', talk: 'marinheiro2' }
      ],
      things: []
    },
    // a Usina inteira (pedido do Fellipe): o jogador explora em tela cheia (`explore`), acha as
    // 13 Poké Balls (2 no caminho, 11 nas salas que não levam a nada) e a escotilha para o fundo.
    // A saída é o tapete da entrada. Os Voltorb fecham um corredor (sem isolar a escotilha)
    usina: {
      name: 'Usina',
      music: 'mus_poke_mansion',   // a da Usina no FireRed (a lapidação da história)
      explore: true,
      warps: [
        { x: 5, y: 38, on: 'mat', to: 'vila', tx: 6, ty: 17, dir: 'down' },
        // a escotilha: no escuro, enquanto o Zapdos está preso; depois da missão (H-6), a sala
        // iluminada com a máquina destruída (`when`: Hub._warp escolhe entre as duas)
        { x: 4, y: 12, on: 'step', to: 'usina_fundo', tx: 7, ty: 9, dir: 'up', when: { caged: 'zapdos' } },
        { x: 4, y: 12, on: 'step', to: 'usina_luz', tx: 7, ty: 9, dir: 'up', when: { freed: 'zapdos' } }
      ],
      npcs: [
        { id: 'voltorb1', sprite: 'voltorb', x: 23, y: 14, dir: 'down', talk: 'voltorb_usina' },
        { id: 'voltorb2', sprite: 'voltorb', x: 24, y: 14, dir: 'down', talk: 'voltorb_usina' }
      ],
      things: [
        { cells: [[6, 36], [7, 36], [8, 36]], talk: 'usina_raios' },
        { cells: [[7, 10], [8, 10], [9, 10], [7, 11], [8, 11], [9, 11]], talk: 'usina_gerador' }
      ],
      // a escotilha de metal com a escada de mão, na sala do gerador (onde o Zapdos fica no FireRed)
      decor: [
        { sprite: 'escotilha', x: 4, y: 12 }
      ],
      // as Poké Balls do chão: cada uma uma vez por jornada (a flag loot:usina:<id>). Nenhuma fica
      // num tile com a camada de cima da parede (ela sumiria atrás dela)
      loot: [
        // no caminho
        { id: 'c1', x: 17, y: 11, item: 'reroll' },
        { id: 'c2', x: 46, y: 24, item: 'revive' },
        // nas salas que não levam a nada
        { id: 's1', x: 22, y: 26, item: 'revive' },
        { id: 's2', x: 40, y: 22, item: 'revive' },
        { id: 's3', x: 45, y: 4, item: 'revive' },
        { id: 's4', x: 46, y: 8, item: 'revive' },
        { id: 's5', x: 31, y: 38, item: 'revive' },
        { id: 's6', x: 35, y: 6, item: 'reroll' },
        { id: 's7', x: 44, y: 12, item: 'reroll' },
        { id: 's8', x: 11, y: 38, item: 'reroll' },
        { id: 's9', x: 18, y: 36, item: 'reroll' },
        { id: 's10', x: 46, y: 37, item: 'reroll' },
        { id: 's11', x: 36, y: 34, item: 'reroll' }
      ]
    },
    // o fundo da Usina: no escuro (`dark`), só o círculo de luz em volta do jogador
    usina_fundo: {
      name: 'O fundo da Usina',
      music: 'mus_poke_mansion',   // a da Usina no FireRed (a lapidação da história)
      scene: true,
      dark: true,
      npcs: [],
      things: []
    },
    // o fundo da Usina depois da missão do Zapdos (H-6): a luz voltou, e a máquina do emblema
    // vermelho está destruída no meio da sala. Um palco: só as cenas (`zapdos_livre` e a volta)
    usina_luz: {
      name: 'O fundo da Usina',
      music: 'mus_poke_mansion',   // a da Usina no FireRed (a lapidação da história)
      scene: true,
      npcs: [],
      things: [],
      decor: [{ sprite: 'maquina_zapdos_quebrada', x: 7, y: 4, solid: true }]
    },
    // a sala do Blaine no ginásio de Cinnabar (H-7, o recorte da maquete aprovada): o palco da cena
    // das ondas, depois da Fase 7
    ginasio_cinnabar: {
      name: 'Ginásio de Cinnabar',
      scene: true,
      npcs: [
        { id: 'blaine', sprite: 'blaine', x: 5, y: 4, dir: 'down', talk: 'blaine' }
      ],
      things: []
    },

    /* AS ILHAS SEAFOAM (H-7, a missão do Articuno, PLANEJAMENTO-HISTORIA.md seção 5.2): os cinco
       andares do FireRed, inteiros, para explorar como a Usina, só por onde o original deixa. Os
       patamares têm duas alturas, e de uma para a outra só se passa pelas escadinhas (`heightOk`,
       a altura de cada tile vem do map.bin). As passagens são as do FireRed que funcionam a pé: as
       escadas (MB_LADDER) e os buracos do chão (MB_FALL_WARP, só de descida; os tiles onde se cai
       não levam de volta). Sem Surf e sem empurrar pedra, há caminho: 79 passos da entrada até a
       margem do fundo, pelos buracos do 1F e do B1F e pelas escadas do B2F e do B3F; e 87 de volta
       até a saída (depois da missão, a cena termina com o atalho para a vila). As pedras do Strength
       ficam onde estão no FireRed (as que estão à vista). */
    seafoam_1f: {
      name: 'Ilhas Seafoam',
      explore: true,
      music: 'mus_mt_moon',
      warps: [
        // a saída para a Rota 20 (a seta do FireRed): para baixo em cima dela, de volta para a vila
        { x: 6, y: 21, on: 'mat', to: 'vila', tx: 6, ty: 17, dir: 'down' },
        { x: 10, y: 6, on: 'step', to: 'seafoam_b1f', tx: 10, ty: 6, dir: 'down' },
        { x: 31, y: 4, on: 'step', to: 'seafoam_b1f', tx: 31, ty: 4, dir: 'down' },
        { x: 28, y: 19, on: 'step', to: 'seafoam_b1f', tx: 28, ty: 19, dir: 'down' },
        // os buracos: cai no andar de baixo
        { x: 21, y: 8, on: 'step', to: 'seafoam_b1f', tx: 21, ty: 8, dir: 'down' },
        { x: 30, y: 8, on: 'step', to: 'seafoam_b1f', tx: 29, ty: 8, dir: 'down' }
      ],
      npcs: [],
      things: [],
      decor: [{ sprite: 'pedra', x: 22, y: 12, solid: true }, { sprite: 'pedra', x: 32, y: 9, solid: true }],
      // as Poké Balls (15 nos cinco andares): as cinco do FireRed (o item vira Reviver ou Novo
      // Sorteio), sete no caminho de ida, à vista da rota sem fechá-la (pedido do Fellipe: "coloca
      // pokeloot nesse caminho de ida ao Articuno"), e três nos becos
      loot: [
        { id: 'fr1', x: 11, y: 8, item: 'reroll' },
        // no caminho: perto da escadinha da descida e no corredor de cima, antes do buraco
        { id: 'c1', x: 8, y: 13, item: 'revive' },
        { id: 'c2', x: 18, y: 4, item: 'reroll' }
      ]
    },
    seafoam_b1f: {
      name: 'Ilhas Seafoam',
      explore: true,
      music: 'mus_mt_moon',
      warps: [
        { x: 10, y: 6, on: 'step', to: 'seafoam_1f', tx: 10, ty: 6, dir: 'down' },
        { x: 31, y: 4, on: 'step', to: 'seafoam_1f', tx: 31, ty: 4, dir: 'down' },
        { x: 28, y: 19, on: 'step', to: 'seafoam_1f', tx: 28, ty: 19, dir: 'down' },
        { x: 7, y: 3, on: 'step', to: 'seafoam_b2f', tx: 7, ty: 4, dir: 'down' },
        { x: 17, y: 9, on: 'step', to: 'seafoam_b2f', tx: 17, ty: 9, dir: 'down' },
        { x: 25, y: 19, on: 'step', to: 'seafoam_b2f', tx: 25, ty: 19, dir: 'down' },
        { x: 32, y: 14, on: 'step', to: 'seafoam_b2f', tx: 32, ty: 14, dir: 'down' },
        { x: 23, y: 8, on: 'step', to: 'seafoam_b2f', tx: 22, ty: 7, dir: 'down' },
        { x: 28, y: 8, on: 'step', to: 'seafoam_b2f', tx: 29, ty: 8, dir: 'down' }
      ],
      npcs: [],
      things: [],
      decor: [{ sprite: 'pedra', x: 22, y: 8, solid: true }, { sprite: 'pedra', x: 30, y: 8, solid: true }],
      // a Water Stone e o Revive do FireRed; uma ao lado de onde se cai do buraco do 1F (no
      // caminho); e uma a mais, no canto de baixo à esquerda
      loot: [
        { id: 'fr1', x: 19, y: 18, item: 'reroll' },
        { id: 'fr2', x: 24, y: 14, item: 'revive' },
        { id: 'c1', x: 29, y: 9, item: 'reroll' },
        { id: 'b1', x: 3, y: 13, item: 'revive' }
      ]
    },
    seafoam_b2f: {
      name: 'Ilhas Seafoam',
      explore: true,
      music: 'mus_mt_moon',
      warps: [
        { x: 7, y: 17, on: 'step', to: 'seafoam_b3f', tx: 8, ty: 14, dir: 'down' },
        { x: 32, y: 4, on: 'step', to: 'seafoam_b3f', tx: 31, ty: 4, dir: 'down' },
        { x: 31, y: 17, on: 'step', to: 'seafoam_b3f', tx: 31, ty: 16, dir: 'down' },
        { x: 7, y: 4, on: 'step', to: 'seafoam_b1f', tx: 7, ty: 3, dir: 'down' },
        { x: 17, y: 9, on: 'step', to: 'seafoam_b1f', tx: 17, ty: 9, dir: 'down' },
        { x: 25, y: 19, on: 'step', to: 'seafoam_b1f', tx: 25, ty: 19, dir: 'down' },
        { x: 32, y: 14, on: 'step', to: 'seafoam_b1f', tx: 32, ty: 14, dir: 'down' }
      ],
      npcs: [],
      things: [],
      decor: [{ sprite: 'pedra', x: 22, y: 8, solid: true }, { sprite: 'pedra', x: 30, y: 8, solid: true }],
      // a Big Pearl do FireRed; uma no caminho até a escada; e uma a mais, na ponta do patamar de cima
      loot: [
        { id: 'fr1', x: 18, y: 15, item: 'reroll' },
        { id: 'c1', x: 31, y: 7, item: 'revive' },
        { id: 'b1', x: 4, y: 13, item: 'reroll' }
      ]
    },
    seafoam_b3f: {
      name: 'Ilhas Seafoam',
      explore: true,
      music: 'mus_mt_moon',
      warps: [
        { x: 8, y: 14, on: 'step', to: 'seafoam_b2f', tx: 7, ty: 17, dir: 'down' },
        { x: 31, y: 4, on: 'step', to: 'seafoam_b2f', tx: 32, ty: 4, dir: 'down' },
        { x: 31, y: 16, on: 'step', to: 'seafoam_b2f', tx: 31, ty: 17, dir: 'down' },
        { x: 12, y: 9, on: 'step', to: 'seafoam_b4f', tx: 15, ty: 9, dir: 'down' },
        { x: 29, y: 5, on: 'step', to: 'seafoam_b4f', tx: 32, ty: 5, dir: 'down' }
      ],
      npcs: [],
      things: [],
      decor: [
        { sprite: 'pedra', x: 12, y: 16, solid: true }, { sprite: 'pedra', x: 13, y: 16, solid: true },
        { sprite: 'pedra', x: 9, y: 16, solid: true }, { sprite: 'pedra', x: 6, y: 17, solid: true }
      ],
      // uma ao lado da chegada (no caminho: a escada do fundo é logo ali); e uma a mais, no beco
      // entre as pedras
      loot: [
        { id: 'c1', x: 31, y: 5, item: 'reroll' },
        { id: 'b1', x: 10, y: 16, item: 'revive' }
      ]
    },
    // o fundo (B4F): a margem de frente para a ilha onde o Articuno fica no FireRed. Enquanto ele
    // está preso, a névoa cobre a água (`mist`), e a máquina do emblema vermelho coberta de gelo
    // manda as ondas para o alto (`pulse`), com o Articuno acorrentado por cima dela. Pisar na
    // margem começa a cena do fundo (o gatilho 'tile' de data/cutscenes.js, `seafoam_fundo`)
    seafoam_b4f: {
      name: 'Ilhas Seafoam',
      explore: true,
      music: 'mus_mt_moon',
      mist: { alpha: 0.5, when: { caged: 'articuno' } },
      pulse: { x: 11, y: 1.2, when: { caged: 'articuno' } },
      warps: [
        { x: 15, y: 9, on: 'step', to: 'seafoam_b3f', tx: 12, ty: 9, dir: 'down' },
        { x: 32, y: 5, on: 'step', to: 'seafoam_b3f', tx: 29, ty: 5, dir: 'down' }
      ],
      npcs: [],
      things: [],
      // a máquina fica em cima das escadinhas da ilha (10,3 e 11,3), no meio delas
      decor: [
        { sprite: 'maquina_articuno_correntes', x: 10.5, y: 2.75, hideIf: { freed: 'articuno' } },
        { sprite: 'articuno', x: 10.5, y: 2.75, oy: -20, hideIf: { freed: 'articuno' } },
        { sprite: 'maquina_articuno_quebrada', x: 10.5, y: 2.75, hideIf: { caged: 'articuno' } }
      ],
      // a Ultra Ball do FireRed (aqui, um Reviver); e duas no caminho até a margem
      loot: [
        { id: 'fr1', x: 22, y: 19, item: 'revive' },
        { id: 'c1', x: 24, y: 3, item: 'reroll' },
        { id: 'c2', x: 18, y: 9, item: 'revive' }
      ]
    },

    // a sala do Giovanni no ginásio de Viridian (H-8, o recorte da maquete aprovada): o palco da
    // cena do emblema, depois da Fase 8
    ginasio_viridian: {
      name: 'Ginásio de Viridian',
      scene: true,
      npcs: [
        { id: 'giovanni', sprite: 'giovanni', x: 2, y: 2, dir: 'down', talk: 'giovanni' }
      ],
      things: []
    },

    /* O MONTE BRASA (H-8, a missão do Moltres, PLANEJAMENTO-HISTORIA.md seção 5.3): os mapas do
       FireRed, inteiros, para subir a pé como a Usina e Seafoam: a encosta, o caminho do cume por
       dentro (três andares) e o cume. No FireRed a subida pede o Strength: as cinco pedras que
       fecham o caminho já foram empurradas um tile para o lado por quem subiu antes, carregando a
       máquina (é a pista da chegada). As pedras de quebrar ficam (o caminho não passa por elas).
       As passagens: as portas de caverna (pisar), as setas de saída (o tapete, com o lado da seta:
       a do cume é para cima) e os degraus de pular, só de descida (`ledges`, Hub.ledgeAt). */
    brasa_encosta: {
      name: 'Monte Brasa',
      explore: true,
      music: 'mus_sevii_123',
      warps: [
        // a trilha da Kindle Road (as setas para baixo): de volta para a vila
        { x: 28, y: 48, on: 'mat', to: 'vila', tx: 6, ty: 17, dir: 'down' },
        { x: 29, y: 48, on: 'mat', to: 'vila', tx: 6, ty: 17, dir: 'down' },
        // as portas de caverna: a de baixo leva ao caminho do cume; a de cima, ao 3F
        { x: 14, y: 24, on: 'step', to: 'brasa_caminho_1f', tx: 2, ty: 15, dir: 'up' },
        { x: 39, y: 19, on: 'step', to: 'brasa_caminho_3f', tx: 11, ty: 8, dir: 'up' },
        // a seta do alto, para cima: o cume
        { x: 29, y: 7, on: 'mat', face: 'up', to: 'brasa_cume', tx: 9, ty: 15, dir: 'up' }
      ],
      npcs: [
        { id: 'hiker', sprite: 'hiker', x: 29, y: 45, dir: 'down', talk: 'hiker_brasa' },
        // os homens do Giovanni, na entrada do Ruby Path (fora do caminho)
        { id: 'recruta1', sprite: 'rocket', x: 41, y: 40, dir: 'down', talk: 'recruta_brasa' },
        { id: 'recruta2', sprite: 'rocket', x: 42, y: 40, dir: 'down', talk: 'recruta_brasa' }
      ],
      things: [],
      decor: [
        // as duas pedras do caminho, arrastadas um tile para o lado (de 22,45 e de 17,46)
        { sprite: 'pedra', x: 22, y: 46, solid: true }, { sprite: 'pedra', x: 17, y: 45, solid: true },
        // as que ficaram onde estão no FireRed, e as de quebrar
        { sprite: 'pedra', x: 36, y: 14, solid: true }, { sprite: 'pedra', x: 35, y: 14, solid: true },
        { sprite: 'pedra', x: 35, y: 17, solid: true },
        { sprite: 'rocha', x: 29, y: 41, solid: true }, { sprite: 'rocha', x: 30, y: 42, solid: true },
        { sprite: 'rocha', x: 34, y: 14, solid: true }, { sprite: 'rocha', x: 36, y: 15, solid: true },
        { sprite: 'rocha', x: 18, y: 39, solid: true }, { sprite: 'rocha', x: 19, y: 40, solid: true }
      ],
      loot: [
        // a Dire Hit do FireRed, a única das três da encosta que dá para alcançar a pé (aqui, um Novo Sorteio)
        { id: 'fr1', x: 48, y: 20, item: 'reroll' },
        // no caminho de ida, à vista da rota (pedido do Fellipe na H-7)
        { id: 'c1', x: 22, y: 43, item: 'revive' },
        { id: 'c2', x: 10, y: 41, item: 'reroll' },
        { id: 'c3', x: 12, y: 37, item: 'revive' },
        { id: 'c4', x: 26, y: 41, item: 'reroll' },
        { id: 'c5', x: 20, y: 35, item: 'revive' },
        { id: 'c6', x: 13, y: 25, item: 'reroll' },
        { id: 'c7', x: 28, y: 14, item: 'revive' }
      ]
    },
    brasa_caminho_1f: {
      name: 'Monte Brasa',
      explore: true,
      music: 'mus_sevii_123',
      warps: [
        { x: 2, y: 15, on: 'mat', to: 'brasa_encosta', tx: 14, ty: 25, dir: 'down' },
        { x: 11, y: 1, on: 'step', to: 'brasa_caminho_2f', tx: 8, ty: 39, dir: 'up' }
      ],
      npcs: [],
      things: [],
      loot: [
        // no caminho de ida, à vista da rota (pedido do Fellipe na H-7)
        { id: 'c1', x: 10, y: 3, item: 'reroll' }
      ]
    },
    brasa_caminho_2f: {
      name: 'Monte Brasa',
      explore: true,
      music: 'mus_sevii_123',
      warps: [
        { x: 8, y: 39, on: 'mat', to: 'brasa_caminho_1f', tx: 11, ty: 2, dir: 'down' },
        { x: 39, y: 6, on: 'step', to: 'brasa_caminho_3f', tx: 2, ty: 4, dir: 'up' }
      ],
      npcs: [],
      things: [],
      // as pedras de quebrar do FireRed (o caminho passa ao lado delas)
      decor: [
        { sprite: 'rocha', x: 40, y: 7, solid: true }, { sprite: 'rocha', x: 33, y: 5, solid: true },
        { sprite: 'rocha', x: 15, y: 19, solid: true }, { sprite: 'rocha', x: 13, y: 23, solid: true },
        { sprite: 'rocha', x: 13, y: 21, solid: true }, { sprite: 'rocha', x: 7, y: 38, solid: true },
        { sprite: 'rocha', x: 9, y: 35, solid: true }, { sprite: 'rocha', x: 7, y: 34, solid: true },
        { sprite: 'rocha', x: 15, y: 26, solid: true }
      ],
      loot: [
        // no caminho de ida, à vista da rota (pedido do Fellipe na H-7)
        { id: 'c1', x: 10, y: 32, item: 'revive' },
        { id: 'c2', x: 14, y: 21, item: 'reroll' },
        { id: 'c3', x: 23, y: 10, item: 'revive' },
        { id: 'c4', x: 32, y: 5, item: 'reroll' }
      ]
    },
    brasa_caminho_3f: {
      name: 'Monte Brasa',
      explore: true,
      music: 'mus_sevii_123',
      warps: [
        { x: 2, y: 4, on: 'mat', to: 'brasa_caminho_2f', tx: 39, ty: 7, dir: 'down' },
        { x: 11, y: 8, on: 'mat', to: 'brasa_encosta', tx: 39, ty: 20, dir: 'down' }
      ],
      npcs: [],
      things: [],
      loot: [
        // no caminho de ida, à vista da rota (pedido do Fellipe na H-7)
        { id: 'c1', x: 10, y: 5, item: 'revive' }
      ]
    },
    // o cume: no alto (onde o Moltres fica no FireRed), a máquina do emblema vermelho em brasa,
    // com o Moltres acorrentado por cima. Enquanto ele está preso, o calor (`heat`) e as ondas
    // subindo (`pulse`). Pisar logo abaixo do alto começa a cena do cume (o gatilho 'tile')
    brasa_cume: {
      name: 'Monte Brasa',
      explore: true,
      music: 'mus_sevii_123',
      heat: { alpha: 0.85, when: { caged: 'moltres' } },
      pulse: { x: 9.5, y: 4.2, color: 'fire', when: { caged: 'moltres' } },
      warps: [
        { x: 9, y: 15, on: 'mat', to: 'brasa_encosta', tx: 29, ty: 8, dir: 'down' }
      ],
      npcs: [],
      things: [],
      decor: [
        { sprite: 'maquina_moltres_correntes', x: 9, y: 6, hideIf: { freed: 'moltres' }, cells: BRASA_MACHINE },
        { sprite: 'moltres', x: 9, y: 6, oy: -20, hideIf: { freed: 'moltres' } },
        { sprite: 'maquina_moltres_quebrada', x: 9, y: 6, hideIf: { caged: 'moltres' }, cells: BRASA_MACHINE },
        // as três pedras do cume, arrastadas (de 9,12, 8,11 e 8,10), e a que ficou
        { sprite: 'pedra', x: 8, y: 12, solid: true }, { sprite: 'pedra', x: 7, y: 11, solid: true },
        { sprite: 'pedra', x: 7, y: 10, solid: true }, { sprite: 'pedra', x: 10, y: 12, solid: true }
      ],
      loot: [
        // no caminho de ida, à vista da rota (pedido do Fellipe na H-7)
        { id: 'c1', x: 10, y: 11, item: 'reroll' }
      ]
    },

    // ---------------- o Capítulo 7 (H-10): as salas da Liga do FireRed (os palcos das cenas) ----------------
    sala_lorelei: {
      name: 'Liga Pokémon', scene: true,
      npcs: [{ id: 'lorelei', sprite: 'lorelei', x: 6, y: 3, dir: 'down', talk: 'e4_jaula' }],
      things: []
    },
    sala_bruno: {
      name: 'Liga Pokémon', scene: true,
      npcs: [{ id: 'bruno', sprite: 'bruno', x: 6, y: 3, dir: 'down', talk: 'e4_jaula' }],
      things: []
    },
    sala_agatha: {
      name: 'Liga Pokémon', scene: true,
      npcs: [{ id: 'agatha', sprite: 'agatha', x: 6, y: 3, dir: 'down', talk: 'e4_jaula' }],
      things: []
    },
    sala_lance: {
      name: 'Liga Pokémon', scene: true,
      npcs: [{ id: 'lance', sprite: 'lance', x: 6, y: 3, dir: 'down', talk: 'e4_jaula' }],
      things: []
    },
    sala_campeao: {
      name: 'Liga Pokémon', scene: true,
      npcs: [{ id: 'rival', sprite: 'rival', x: 6, y: 4, dir: 'down', talk: 'e4_jaula' }],
      things: []
    },

    // ---------------- o Capítulo 6 (H-9): a porta da Victory Road e a Mansão Pokémon ----------------
    // o recorte da Rota 23: o último guarda das insígnias, na porta da Victory Road (o palco da cena
    // de antes da fase da Lorelei)
    rota23_portao: {
      name: 'Rota 23',
      scene: true,
      npcs: [
        { id: 'guarda', sprite: 'policeman', x: 6, y: 8, dir: 'left', talk: 'guarda_rota23' }
      ],
      things: []
    },

    // a Mansão Pokémon de Cinnabar, a base do Maxie: os quatro andares do FireRed, só por onde o jogo
    // deixa. As estátuas viram o interruptor (`switch`), que troca as barreiras dos quatro andares
    // (o desenho e a colisão do andar apertado vêm do hub.py). 15 Poké Balls: as 11 do FireRed (a
    // Chave Secreta sai) e 4 no caminho de ida
    mansao_1f: {
      name: 'Mansão Pokémon',
      explore: true,
      music: 'mus_poke_mansion',
      switch: 'mansao_interruptor',
      warps: [
        { x: 7, y: 33, on: 'mat', to: 'vila', tx: 6, ty: 17, dir: 'down' },
        { x: 8, y: 33, on: 'mat', to: 'vila', tx: 6, ty: 17, dir: 'down' },
        { x: 9, y: 33, on: 'mat', to: 'vila', tx: 6, ty: 17, dir: 'down' },
        { x: 34, y: 33, on: 'mat', to: 'vila', tx: 6, ty: 17, dir: 'down' },
        { x: 10, y: 13, on: 'step', to: 'mansao_2f', tx: 6, ty: 14, dir: 'right' },
        { x: 25, y: 27, on: 'step', to: 'mansao_b1f', tx: 34, ty: 29, dir: 'left' }
      ],
      npcs: [
        // na porta, só na chegada (a cena `mansao_entrada`): depois, ele vai embora
        { id: 'blaine', sprite: 'blaine', x: 8, y: 30, dir: 'up', talk: 'blaine_mansao', hideIf: { scene: 'mansao_entrada' } }
      ],
      things: [
        { cells: [[5, 5]], talk: 'estatua_mansao' }
      ],
      loot: [
        { id: 'fr1', x: 29, y: 32, item: 'reroll' }, { id: 'fr2', x: 22, y: 6, item: 'revive' },
        { id: 'fr3', x: 27, y: 15, item: 'reroll' },
        // no caminho de ida, à vista da rota (o padrão das missões a pé)
        { id: 'c1', x: 9, y: 24, item: 'revive' }
      ]
    },
    mansao_2f: {
      name: 'Mansão Pokémon',
      explore: true,
      music: 'mus_poke_mansion',
      switch: 'mansao_interruptor',
      warps: [
        { x: 6, y: 14, on: 'step', to: 'mansao_1f', tx: 10, ty: 13, dir: 'left' },
        { x: 9, y: 3, on: 'step', to: 'mansao_3f', tx: 8, ty: 3, dir: 'right' },
        { x: 34, y: 22, on: 'step', to: 'mansao_3f', tx: 34, ty: 18, dir: 'right' },
        { x: 9, y: 14, on: 'step', to: 'mansao_3f', tx: 11, ty: 11, dir: 'right' }
      ],
      npcs: [],
      things: [
        { cells: [[2, 16]], talk: 'estatua_mansao' },
        { cells: [[25, 4]], talk: 'diario_5jul' },
        { cells: [[6, 31]], talk: 'diario_10jul' }
      ],
      loot: [
        { id: 'fr1', x: 36, y: 8, item: 'revive' }, { id: 'fr2', x: 18, y: 23, item: 'reroll' },
        { id: 'fr3', x: 35, y: 17, item: 'revive' },
        { id: 'c1', x: 10, y: 9, item: 'reroll' }
      ]
    },
    mansao_3f: {
      name: 'Mansão Pokémon',
      explore: true,
      music: 'mus_poke_mansion',
      switch: 'mansao_interruptor',
      warps: [
        { x: 8, y: 3, on: 'step', to: 'mansao_2f', tx: 9, ty: 3, dir: 'left' },
        { x: 34, y: 18, on: 'step', to: 'mansao_2f', tx: 34, ty: 22, dir: 'left' },
        { x: 11, y: 11, on: 'step', to: 'mansao_2f', tx: 9, ty: 14, dir: 'left' },
        // os buracos do chão queimado: caem no 1º andar (e os da direita, no 2º), como no FireRed
        { x: 18, y: 18, on: 'step', to: 'mansao_1f', tx: 19, ty: 22, dir: 'down' },
        { x: 19, y: 18, on: 'step', to: 'mansao_1f', tx: 20, ty: 22, dir: 'down' },
        { x: 20, y: 18, on: 'step', to: 'mansao_1f', tx: 20, ty: 22, dir: 'down' },
        { x: 23, y: 18, on: 'step', to: 'mansao_2f', tx: 27, ty: 17, dir: 'down' },
        { x: 24, y: 18, on: 'step', to: 'mansao_2f', tx: 27, ty: 17, dir: 'down' }
      ],
      npcs: [],
      things: [
        { cells: [[12, 5]], talk: 'estatua_mansao' },
        { cells: [[8, 16]], talk: 'diario_6fev' }
      ],
      loot: [
        { id: 'fr1', x: 9, y: 19, item: 'reroll' }, { id: 'fr2', x: 32, y: 6, item: 'revive' },
        { id: 'c1', x: 17, y: 8, item: 'reroll' }
      ]
    },
    // o subsolo: o laboratório (a sala da Chave Secreta do FireRed) com o Mewtwo na máquina e a Elite
    // dos Quatro nas jaulas. A cena `mansao_lab` começa na passagem que o interruptor abre (12, 10-12)
    mansao_b1f: {
      name: 'Mansão Pokémon',
      explore: true,
      music: 'mus_poke_mansion',
      switch: 'mansao_interruptor',
      pulse: { x: 7, y: 4, color: 'psychic', when: { noflag: 'mansao_maquina' } },
      warps: [
        { x: 34, y: 29, on: 'step', to: 'mansao_1f', tx: 25, ty: 27, dir: 'right' }
      ],
      npcs: [
        { id: 'lorelei', sprite: 'lorelei', x: 2, y: 4, dir: 'down', talk: 'e4_jaula', hideIf: { scene: 'mansao_lab' } },
        { id: 'bruno', sprite: 'bruno', x: 3, y: 4, dir: 'down', talk: 'e4_jaula', hideIf: { scene: 'mansao_lab' } },
        { id: 'agatha', sprite: 'agatha', x: 10, y: 4, dir: 'down', talk: 'e4_jaula', hideIf: { scene: 'mansao_lab' } },
        { id: 'lance', sprite: 'lance', x: 11, y: 4, dir: 'down', talk: 'e4_jaula', hideIf: { scene: 'mansao_lab' } }
      ],
      things: [
        { cells: [[24, 29]], talk: 'estatua_mansao' },
        { cells: [[27, 5]], talk: 'estatua_mansao' },
        { cells: [[21, 27]], talk: 'diario_1set' },
        { cells: [[19, 2], [20, 2], [21, 2]], talk: 'anotacao_capuz' }
      ],
      decor: [
        // a máquina do Mewtwo (roxa) e ele em cima; na cena, os pássaros a destroem (as flags da cena)
        { sprite: 'maquina_mewtwo', x: 6.5, y: 5, cells: MANSAO_MACHINE, hideIf: { flag: 'mansao_maquina' } },
        { sprite: 'maquina_mewtwo_quebrada', x: 6.5, y: 5, cells: MANSAO_MACHINE, hideIf: { noflag: 'mansao_maquina' } },
        { sprite: 'mewtwo', x: 6.5, y: 5, oy: -30, hideIf: { flag: 'mansao_mewtwo' } },
        // as jaulas, na frente de cada um; abrem quando a máquina cai
        ...[2, 3, 10, 11].flatMap((x) => [
          { sprite: 'jaula', x, y: 4, solid: true, front: true, hideIf: { flag: 'mansao_jaulas' } },
          { sprite: 'jaula_aberta', x, y: 4, solid: true, front: true, hideIf: { noflag: 'mansao_jaulas' } }
        ])
      ],
      loot: [
        { id: 'fr1', x: 6, y: 21, item: 'revive' }, { id: 'fr2', x: 23, y: 4, item: 'reroll' },
        { id: 'fr3', x: 2, y: 29, item: 'revive' },
        { id: 'c1', x: 14, y: 24, item: 'reroll' }
      ]
    },

    // um recorte de Cerulean: a casa assaltada do FireRed, com o policial na porta
    cerulean: {
      name: 'Cidade de Cerulean',
      scene: true,
      npcs: [
        { id: 'policial', sprite: 'policeman', x: 11, y: 8, dir: 'down', talk: 'policial' },
        { id: 'dono', sprite: 'old_man_2', x: 9, y: 8, dir: 'down', talk: 'dono_casa' }
      ],
      things: []
    },

    casa_sabio: {
      name: 'Casa do velho sábio',
      warps: [
        { x: 6, y: 9, on: 'mat', to: 'vila', tx: 30, ty: 18, dir: 'down' }
      ],
      npcs: [
        { id: 'sabio', sprite: 'old_man_1', x: 3, y: 5, dir: 'down', look: true, talk: 'sabio' }
      ],
      things: [
        { cells: rect(4, 4, 4, 1), talk: 'sabio_vitrine' }
      ]
    }
  }
};

/**
 * A regra dos patamares do FireRed (H-7, as Ilhas Seafoam): o jogador só passa de uma altura para
 * outra por um tile de altura 0 (as escadinhas) ou 15. É a do jogo (IsElevationMismatchAt, com a
 * altura de quem anda sendo a do tile em que está: os mapas de Seafoam não têm tile de altura 15
 * no chão). Num mapa sem `levels` (data/hubMaps.js), vale tudo.
 */
export function heightOk(map, x, y, nx, ny) {
  const levels = map?.levels;
  if (!levels) return true;
  const a = parseInt(levels[y]?.[x] ?? '0', 16);
  const b = parseInt(levels[ny]?.[nx] ?? '0', 16);
  return a === b || a === 0 || b === 0 || a === 15 || b === 15;
}

/** As células de um retângulo, para `things`. */
function rect(x, y, w, h) {
  const cells = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) cells.push([x + i, y + j]);
  return cells;
}
