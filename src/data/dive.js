/**
 * A DESCIDA DO DIVE (PLANEJAMENTO-DIVE.md, seções 4 a 7) — conteúdo, sem lógica.
 * A regra está em game/Dive.js; o mundo (os mapas submersos do Emerald e a grade
 * do que é navegável) em data/diveWorld.js, gerado por tools/assets/dive.py.
 *
 * Os números vêm da maquete que o Fellipe aprovou (2026-11-08, "a descida
 * equilibrada"): hordas sobre hordas e a garantia de saída. Na 0.37.1 ("achei muito
 * difícil, facilite bem pouco"): o bolsão foi para a passagem do 3 para o 4, a
 * garantia de saída passou a valer para quem reage em 0,28 s (era 0,25), os níveis 5 e
 * 6 têm um pouco mais de intervalo entre as hordas e o 6 tem hordas um pouco mais
 * lentas (14 tiles/s, eram 15). Depois ("deixe menos desvios para passar"), cada nível
 * ficou com ~20% menos hordas (8, 12, 15, 18, 21 e 25). Medido com tools/descida.mjs.
 *
 * Cada nível:
 *   depth    a profundidade mostrada (m)
 *   warn     o aviso: segundos entre a linha marcada e a horda entrar
 *   speed    a velocidade da horda (tiles por segundo)
 *   count    quantas hordas o nível solta
 *   gap      o intervalo sorteado entre uma horda e a próxima (s)
 *   overlap  false: a próxima só depois que a anterior sai (o Nível 1)
 *   kinds    os padrões e o peso de cada um no sorteio:
 *            row/col uma linha ou coluna · row2 duas linhas · wall quatro linhas (sobram duas)
 *            wall5 cinco linhas (sobra uma) · cross linha e coluna · chain duas em sequência
 *            na mesma linha · triple até três · cols3 três colunas
 *   species  os números da Pokédex das hordas (Kanto até o 3, misturado no 4, Hoenn no 5)
 *
 * Desde a 0.37.3 são 5 níveis (o Fellipe: "deixe o nível 5 sendo o último, vamos
 * tirar o nível 6"); o 5 leva direto à Caverna Marinha e ganhou um pouco mais de
 * intervalo entre as hordas. O 6º tabuleiro continua no mundo (diveWorld.js), sem uso.
 */
export const DIVE = {
  cols: 10,
  rows: 6,
  // o passo do FireRed andando: 16 quadros por tile; na descida não se corre (decisão do Fellipe)
  walk: 16 / 60,
  // o tempo de reação para o qual o sorteio garante saída, e a folga dos quadros de 17 ms
  react: 0.28,
  safety: 0.05,
  // a folga de quanto a horda precisa entrar no tile para pegar (em tiles)
  tolerance: 0.12,
  // depois de um acerto, ele pisca e fica intocável
  invincible: 1.0,
  lives: 3,
  // o bolsão de ar enche as bolhas na chegada a este nível (o índice: 3 = Nível 4, ao passar o 3)
  airPocketLevel: 3,
  // o escuro por cima do fundo, nível a nível (a Rota 127 já é mais escura)
  dark: [0, 0.05, 0.1, 0.15, 0.2],
  levels: [
    { depth: 10, warn: 1.3, speed: 9, count: 8, gap: [0.2, 0.4], overlap: false, kinds: { row: 1 }, species: [129, 118, 116] },
    { depth: 25, warn: 1.0, speed: 10, count: 12, gap: [1.0, 1.4], overlap: true, kinds: { row: 3, col: 2, row2: 2 }, species: [90, 120, 72, 98] },
    { depth: 45, warn: 0.85, speed: 11, count: 15, gap: [0.9, 1.25], overlap: true, kinds: { row: 2, col: 2, row2: 2, wall: 3 }, species: [86, 117, 99, 73, 119] },
    { depth: 70, warn: 0.65, speed: 12, count: 18, gap: [0.75, 1.05], overlap: true, kinds: { row: 1, col: 2, row2: 2, wall: 2, cross: 3 }, species: [91, 121, 318, 320, 341, 366] },
    { depth: 100, warn: 0.55, speed: 13, count: 21, gap: [0.74, 1.0], overlap: true, kinds: { row: 1, col: 1, row2: 1, wall: 1, wall5: 1, cross: 2, chain: 3 }, species: [319, 342, 367, 368, 369, 340] }
  ],
  // as falas da descida (as do resgate ficam com a enfermeira, em data/dialogue.js)
  lines: {
    airPocket: ['Parece que você encontrou um bolsão de ar no caminho!'],
    // depois, o salão do Kyogre (game/KyogreHall.js)
    cave: ['Você chegou à entrada submersa da Caverna Marinha.', 'Uma luz fraca vem lá de cima. Dá para emergir.']
  }
};
