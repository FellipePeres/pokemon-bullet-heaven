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
      scene: true,
      dark: true,
      npcs: [],
      things: []
    },
    // o fundo da Usina depois da missão do Zapdos (H-6): a luz voltou, e a máquina do emblema
    // vermelho está destruída no meio da sala. Um palco: só as cenas (`zapdos_livre` e a volta)
    usina_luz: {
      name: 'O fundo da Usina',
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
