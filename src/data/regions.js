import { KANTO_CAMPAIGN } from './stages.js';
import { KANTO_DEX } from './kanto.js';

/**
 * REGIÕES — cada uma é uma campanha completa: Pokédex, iniciais, a jornada de
 * ginásio em ginásio e os modelos de treinador dela.
 *
 * O progresso (fases, insígnias e a equipe da jornada) fica guardado por
 * região no perfil, em `profile.regions[id]`. Shards, Pokédex e conquistas são
 * do jogador e valem em todas.
 *
 * Para criar uma região: uma entrada aqui, as fases dela em stages.js, as
 * tabelas de captura em capturePools.js e os modelos em trainers.js.
 *
 *   dex       nomes na ordem da Pokédex regional
 *   starters  os três iniciais oferecidos no começo da jornada
 *   campaign  as fases em ordem (e as que ainda estão "em breve")
 *   trainers  modelos de treinador que a região oferece (data/trainers.js)
 *   secret    o lendário misterioso no fim da Pokédex (0.35, pedido do Fellipe):
 *             aparece desde o começo como "???", sem número e sem silhueta, e
 *             só se revela quando é capturado (`profile.pokedex.secret`). Fica
 *             fora da contagem da Pokédex. Em Kanto é o Kyogre, do fundo da
 *             lagoa (PLANEJAMENTO-DIVE.md).
 */
export const REGIONS = {
  kanto: {
    id: 'kanto',
    name: 'Kanto',
    dex: KANTO_DEX,
    starters: ['bulbasaur', 'charmander', 'squirtle'],
    campaign: KANTO_CAMPAIGN,
    trainers: ['red', 'leaf'],
    secret: [{ id: 'kyogre', dex: 382, name: 'Kyogre' }]
  }
};

export const DEFAULT_REGION = 'kanto';

export const getRegion = (id) => REGIONS[id] ?? REGIONS[DEFAULT_REGION];
