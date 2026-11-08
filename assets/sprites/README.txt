Coloque aqui sprites proprios no formato <numero-da-pokedex>.png (ex.: 4.png para Charmander)
e ligue CONFIG.sprites.useLocal em src/core/config.js.
Eles entram no lugar dos sprites do PokeAPI (os da interface e o estatico do canvas).
Em campo o Pokemon continua sendo a tira animada de assets/pokemon/ (os GIFs da Gen 5),
e os cards de escolha usam assets/pokemon/gen3/ (o sprite do FireRed).
Sem arquivos aqui, a interface usa o PokeAPI (online) ou um desenho procedural (offline).
