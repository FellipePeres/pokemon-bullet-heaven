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
        { x: 22, y: 20, on: 'step', to: 'pokedoll', tx: 2, ty: 11, dir: 'up' },
        { x: 23, y: 20, on: 'step', to: 'pokedoll', tx: 10, ty: 11, dir: 'up' }
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
      warps: [
        { x: 2, y: 11, on: 'mat', to: 'vila', tx: 22, ty: 21, dir: 'down' },
        { x: 10, y: 11, on: 'mat', to: 'vila', tx: 23, ty: 21, dir: 'down' }
      ],
      npcs: [
        { id: 'vendedora', sprite: 'beauty', x: 3, y: 9, dir: 'up', counter: true, talk: 'vendedora' }
      ],
      things: [
        { cells: [...rect(5, 3, 3, 1), ...rect(9, 3, 3, 1), ...rect(5, 5, 3, 1), ...rect(9, 5, 3, 1)], talk: 'vitrine' },
        { cells: rect(1, 3, 2, 3), talk: 'prateleira' },
        { cells: [[8, 4]], talk: 'lapras_gigante' }
      ],
      decor: [
        { sprite: 'pikachu', x: 5, y: 3, oy: -7 }, { sprite: 'clefairy', x: 6, y: 3, oy: -7 },
        { sprite: 'jigglypuff', x: 7, y: 3, oy: -7 }, { sprite: 'meowth', x: 9, y: 3, oy: -7 },
        { sprite: 'pidgey', x: 10, y: 3, oy: -7 }, { sprite: 'pikachu', x: 11, y: 3, oy: -7 },
        { sprite: 'jigglypuff', x: 5, y: 5, oy: -7 }, { sprite: 'clefairy', x: 6, y: 5, oy: -7 },
        { sprite: 'pidgey', x: 10, y: 5, oy: -7 }, { sprite: 'meowth', x: 11, y: 5, oy: -7 },
        { sprite: 'lapras_doll', x: 8, y: 4, solid: true }
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
      // as três Poké Balls do FireRed: Bulbasaur, Squirtle e Charmander, da esquerda para a direita
      decor: [
        { sprite: 'item_ball', x: 8, y: 4, oy: -6, hideIf: { starterIs: 'bulbasaur' } },
        { sprite: 'item_ball', x: 9, y: 4, oy: -6, hideIf: { starterIs: 'squirtle' } },
        { sprite: 'item_ball', x: 10, y: 4, oy: -6, hideIf: { starterIs: 'charmander' } }
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

/** As células de um retângulo, para `things`. */
function rect(x, y, w, h) {
  const cells = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) cells.push([x + i, y + j]);
  return cells;
}
