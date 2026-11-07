/**
 * O QUARTO DECORÁVEL (PLANEJAMENTO-LOBBY.md, seção 6): o que a loja de
 * Pokédolls vende para o quarto do jogador, por Shards.
 *
 * O quarto começa vazio (só a escada, a janela e a cama) e cada compra já
 * aparece no lugar dela: os móveis têm lugar fixo, sem editor livre (padrão
 * até o Fellipe decidir). A decoração é do jogador, como os Shards e a
 * Pokédex: o mesmo quarto em todas as jornadas.
 *
 *   piece   um móvel montado com tiles do FireRed (tools/assets/hub.py, HUB_DECOR)
 *   sprite  um boneco (as folhas de data/hubMaps.js, HUB_SPRITES)
 *   at      onde fica no quarto (tile de cima, à esquerda); `slots` quando cabem vários
 *   talk    a fala ao apertar A nele (data/dialogue.js; {item} vira o nome)
 *   needs   'champion': só depois de vencer a Liga em alguma jornada
 *
 * Os preços são de exemplo, na escala do Poké Mart (data/items.js): a economia
 * de Shards decide os valores de verdade.
 */
export const DECOR = [
  { id: 'pc_mesa', name: 'Mesa com PC', price: 300, piece: 'pc_mesa', at: [1, 1], talk: 'quarto_pc',
    about: 'Abre as caixas do PC sem precisar ir ao Centro Pokémon.' },
  { id: 'estante', name: 'Estante', price: 250, piece: 'estante', at: [4, 1], talk: 'quarto_estante',
    about: 'Guarda o Estojo de Insígnias e os troféus da jornada à mão.' },
  { id: 'tapete', name: 'Tapete e videogame', price: 150, piece: 'tapete', at: [4, 4], talk: 'quarto_videogame',
    about: 'Um tapete verde, a TV e o videogame no meio do quarto.' },
  { id: 'planta', name: 'Planta', price: 60, piece: 'planta', slots: [[11, 2], [7, 2], [1, 7], [11, 7]], talk: 'quarto_planta',
    about: 'Um vaso para o quarto. Cabem até quatro.' },
  { id: 'doll_pikachu', name: 'Pokédoll de Pikachu', price: 120, sprite: 'pikachu', at: [9, 5], talk: 'quarto_boneco' },
  { id: 'doll_clefairy', name: 'Pokédoll de Clefairy', price: 120, sprite: 'clefairy', at: [10, 5], talk: 'quarto_boneco' },
  { id: 'doll_jigglypuff', name: 'Pokédoll de Jigglypuff', price: 120, sprite: 'jigglypuff', at: [3, 3], talk: 'quarto_boneco' },
  { id: 'doll_meowth', name: 'Pokédoll de Meowth', price: 120, sprite: 'meowth', at: [9, 8], talk: 'quarto_boneco' },
  { id: 'doll_pidgey', name: 'Pokédoll de Pidgey', price: 120, sprite: 'pidgey', at: [10, 8], talk: 'quarto_boneco' },
  { id: 'lapras', name: 'Lapras gigante', price: 1500, sprite: 'lapras_doll', at: [6, 8], needs: 'champion', talk: 'quarto_lapras',
    about: 'A peça rara da loja. Só para quem já venceu a Liga Pokémon.' }
];

export const getDecor = (id) => DECOR.find((item) => item.id === id) ?? null;

/** Quantos cabem no quarto (as plantas têm vários lugares; o resto, um). */
export const decorMax = (item) => item.slots?.length ?? 1;
