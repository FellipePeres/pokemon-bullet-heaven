/**
 * MODELOS DE TREINADOR — quem o jogador escolhe ser no começo da jornada.
 *
 * Os sprites são os do FireRed, gerados por tools/assets/extract.py.
 * A folha de cada modelo segue a ordem do sAnimTable_RedGreenNormal do jogo,
 * então Red e Leaf compartilham o mesmo mapa de quadros. Um modelo novo (de
 * outra região, por exemplo) é só mais uma entrada aqui, com a folha dele.
 *
 *   label     como aparece na tela de escolha
 *   sheet     folha de andar/correr (chave do assetManifest)
 *   portrait  retrato 64x64 (chave do assetManifest)
 *   frames    mapa de quadros da folha
 */

/**
 * Quadros da folha do FireRed. Só existem as poses para baixo, para cima e
 * para a esquerda: a direita é a esquerda espelhada.
 *   walk  os dois passos (um pé de cada vez)
 *   run   a passada e os dois pés
 */
export const FRLG_FRAMES = {
  stand: { down: 0, up: 1, left: 2 },
  walk: { down: [3, 4], up: [5, 6], left: [7, 8] },
  run: { down: [9, 10, 11], up: [12, 13, 14], left: [15, 16, 17] }
};

export const TRAINER_LOOKS = {
  red: {
    id: 'red',
    label: 'Menino',
    name: 'Red',
    sheet: 'trainer/red',
    portrait: 'portrait/red',
    frames: FRLG_FRAMES
  },
  leaf: {
    id: 'leaf',
    label: 'Menina',
    name: 'Leaf',
    sheet: 'trainer/leaf',
    portrait: 'portrait/leaf',
    frames: FRLG_FRAMES
  }
};

export const DEFAULT_TRAINER = 'red';

export const getTrainerLook = (id) => TRAINER_LOOKS[id] ?? TRAINER_LOOKS[DEFAULT_TRAINER];
