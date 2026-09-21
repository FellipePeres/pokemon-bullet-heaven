/**
 * POKÉMON JOGÁVEIS (os que entram na sua equipe).
 *
 * Campos:
 *   id          chave interna
 *   dex         número da Pokédex de Kanto (usado para o sprite e para o registro)
 *   name        nome exibido
 *   types       tipos (afetam cor, sinergias e vantagens)
 *   abilities   golpe com que ele entra na equipe
 *   moveLine    a LINHA de 3 golpes daquela família: base -> TM -> TM final.
 *               A TM encontrada em campo sobe o golpe atual para o próximo
 *               da linha dele — nunca um golpe aleatório de outro Pokémon.
 *   role        papel na equipe — informativo/estratégico
 *   rarity      peso relativo quando aparece como opção de captura
 *   power       multiplicador de dano próprio da espécie
 *   hp          vida máxima no nível 1 (cresce com o nível — ver CONFIG.pokemon)
 *   starter     marca os três iniciais
 *   evolution   { to, level, method?, item? }
 *
 * EVOLUÇÃO: os níveis seguem os jogos originais. Quando a evolução real depende
 * de pedra ou troca, usamos um nível equivalente e marcamos `method` — assim é
 * só trocar por itens quando eles existirem, sem mexer no sistema.
 */
export const POKEMON = {
  /* ============================= INICIAIS ============================= */
  bulbasaur: {
    id: 'bulbasaur', dex: 1, name: 'Bulbasaur', types: ['grass', 'poison'],
    abilities: ['vine_whip'], moveLine: ['vine_whip', 'razor_leaf', 'solar_beam'], role: 'Controle de área', rarity: 'starter',
    power: 1, hp: 145, starter: true,
    description: 'Golpes em arco que acertam vários inimigos e empurram a horda.',
    evolution: { to: 'ivysaur', level: 16 }
  },
  charmander: {
    id: 'charmander', dex: 4, name: 'Charmander', types: ['fire'],
    abilities: ['ember'], moveLine: ['ember', 'flamethrower', 'fire_blast'], role: 'Dano direto', rarity: 'starter',
    power: 1, hp: 110, starter: true,
    description: 'Projéteis de fogo que aplicam queimadura contínua.',
    evolution: { to: 'charmeleon', level: 16 }
  },
  squirtle: {
    id: 'squirtle', dex: 7, name: 'Squirtle', types: ['water'],
    abilities: ['water_gun'], moveLine: ['water_gun', 'bubble_beam', 'hydro_pump'], role: 'Controle e perfuração', rarity: 'starter',
    power: 1, hp: 140, starter: true,
    description: 'Jatos que atravessam inimigos, empurram e deixam lentos.',
    evolution: { to: 'wartortle', level: 16 }
  },

  /* ======================= CAPTURÁVEIS ======================= */
  pidgey: {
    id: 'pidgey', dex: 16, name: 'Pidgey', types: ['normal', 'flying'],
    abilities: ['gust'], moveLine: ['gust', 'wing_attack', 'hurricane'], role: 'Afastamento', rarity: 'common', power: 1, hp: 95,
    description: 'Rajadas circulares que abrem espaço quando você está cercado.',
    evolution: { to: 'pidgeotto', level: 18 }
  },
  nidoran_m: {
    id: 'nidoran_m', dex: 32, name: 'Nidoran♂', types: ['poison'],
    abilities: ['poison_sting'], moveLine: ['poison_sting', 'poison_fang', 'sludge_bomb'], role: 'Dano contínuo', rarity: 'common', power: 1, hp: 110,
    description: 'Ferrões rápidos que acumulam veneno nos inimigos.',
    evolution: { to: 'nidorino', level: 16 }
  },
  oddish: {
    id: 'oddish', dex: 43, name: 'Oddish', types: ['grass', 'poison'],
    abilities: ['acid'], moveLine: ['acid', 'mega_drain', 'petal_dance'], role: 'Aura tóxica', rarity: 'common', power: 1, hp: 100,
    description: 'Nuvem de veneno constante — ótima contra inimigos corpo a corpo.',
    evolution: { to: 'gloom', level: 21 }
  },
  poliwag: {
    id: 'poliwag', dex: 60, name: 'Poliwag', types: ['water'],
    abilities: ['bubble'], moveLine: ['bubble', 'water_pulse', 'hydro_pump'], role: 'Desaceleração', rarity: 'common', power: 1, hp: 115,
    description: 'Bolhas em leque que seguram o avanço da horda.',
    evolution: { to: 'poliwhirl', level: 25 }
  },
  bellsprout: {
    id: 'bellsprout', dex: 69, name: 'Bellsprout', types: ['grass', 'poison'],
    abilities: ['leech_field'], moveLine: ['leech_field', 'razor_leaf', 'solar_beam'], role: 'Zona de chão', rarity: 'common', power: 1, hp: 92,
    description: 'Campos de vinhas que ficam no chão causando dano por tempo.',
    evolution: { to: 'weepinbell', level: 21 }
  },
  geodude: {
    id: 'geodude', dex: 74, name: 'Geodude', types: ['rock', 'ground'],
    abilities: ['rock_throw'], moveLine: ['rock_throw', 'rock_slide', 'earthquake'], role: 'Dano em área', rarity: 'uncommon', power: 1, hp: 160,
    description: 'Pedras pesadas que explodem ao cair sobre o grupo.',
    evolution: { to: 'graveler', level: 25 }
  },
  ponyta: {
    id: 'ponyta', dex: 77, name: 'Ponyta', types: ['fire'],
    abilities: ['flame_wheel'], moveLine: ['flame_wheel', 'fire_spin', 'fire_blast'], role: 'Defesa de perímetro', rarity: 'uncommon', power: 1, hp: 112,
    description: 'Chamas orbitais que protegem quem está perto de você.',
    evolution: { to: 'rapidash', level: 40 }
  },
  machop: {
    id: 'machop', dex: 66, name: 'Machop', types: ['fighting'],
    abilities: ['karate_chop'], moveLine: ['karate_chop', 'seismic_toss', 'cross_chop'], role: 'Dano alto corpo a corpo', rarity: 'uncommon', power: 1, hp: 140,
    description: 'Poucos golpes, muito dano. Excelente contra inimigos de Pedra.',
    evolution: { to: 'machoke', level: 28 }
  },
  growlithe: {
    id: 'growlithe', dex: 58, name: 'Growlithe', types: ['fire'],
    abilities: ['ember'], moveLine: ['ember', 'flamethrower', 'fire_blast'], role: 'Dano direto', rarity: 'uncommon', power: 1.1, hp: 125,
    description: 'Companheiro leal: fogo constante e boa resistência.',
    evolution: { to: 'arcanine', level: 36, method: 'stone', item: 'Pedra do Fogo' }
  },
  staryu: {
    id: 'staryu', dex: 120, name: 'Staryu', types: ['water'],
    abilities: ['bubble'], moveLine: ['bubble', 'water_pulse', 'ice_beam'], role: 'Desaceleração', rarity: 'uncommon', power: 1.05, hp: 105,
    description: 'Jatos rápidos que seguram quem chega perto.',
    evolution: { to: 'starmie', level: 30, method: 'stone', item: 'Pedra da Água' }
  },
  pikachu: {
    id: 'pikachu', dex: 25, name: 'Pikachu', types: ['electric'],
    abilities: ['thunder_shock'], moveLine: ['thunder_shock', 'thunderbolt', 'thunder'], role: 'Dano em corrente', rarity: 'rare', power: 1, hp: 95,
    description: 'Raios que saltam entre inimigos — quanto mais horda, melhor.',
    evolution: { to: 'raichu', level: 30, method: 'stone', item: 'Pedra do Trovão' }
  },
  abra: {
    id: 'abra', dex: 63, name: 'Abra', types: ['psychic'],
    abilities: ['confusion'], moveLine: ['confusion', 'psybeam', 'psychic_wave'], role: 'Perseguição', rarity: 'rare', power: 1, hp: 82,
    description: 'Ondas psíquicas que perseguem alvos e atravessam inimigos.',
    evolution: { to: 'kadabra', level: 16 }
  },

  /* ============ SELVAGENS COMUNS (capturáveis nas rotas) ============ */
  rattata: {
    id: 'rattata', dex: 19, name: 'Rattata', types: ['normal'],
    abilities: ['quick_attack'], moveLine: ['quick_attack', 'hyper_fang', 'hyper_beam'], role: 'Investida rápida', rarity: 'common', power: 1, hp: 90,
    description: 'Ataca muito rápido, mas precisa chegar perto.',
    evolution: { to: 'raticate', level: 20 }
  },
  raticate: {
    id: 'raticate', dex: 20, name: 'Raticate', types: ['normal'],
    abilities: ['hyper_fang'], moveLine: ['quick_attack', 'hyper_fang', 'hyper_beam'], role: 'Investida rápida', rarity: 'evolved', power: 1.5, hp: 150,
    description: 'Presas que cortam qualquer coisa que encoste.'
  },
  caterpie: {
    id: 'caterpie', dex: 10, name: 'Caterpie', types: ['bug'],
    abilities: ['string_shot'], moveLine: ['string_shot', 'bug_bite', 'psybeam'], role: 'Zona de chão', rarity: 'common', power: 0.9, hp: 85,
    description: 'Teias que seguram a horda no lugar.',
    evolution: { to: 'metapod', level: 7 }
  },
  metapod: {
    id: 'metapod', dex: 11, name: 'Metapod', types: ['bug'],
    abilities: ['bug_bite'], moveLine: ['string_shot', 'bug_bite', 'psybeam'], role: 'Zona de chão', rarity: 'evolved', power: 0.85, hp: 130,
    description: 'Casca dura: pouco dano, muita resistência.',
    evolution: { to: 'butterfree', level: 10 }
  },
  butterfree: {
    id: 'butterfree', dex: 12, name: 'Butterfree', types: ['bug', 'flying'],
    abilities: ['psybeam'], moveLine: ['string_shot', 'bug_bite', 'psybeam'], role: 'Perseguição', rarity: 'evolved', power: 1.5, hp: 135,
    description: 'Pós psíquicos que perseguem os inimigos.'
  },
  weedle: {
    id: 'weedle', dex: 13, name: 'Weedle', types: ['bug', 'poison'],
    abilities: ['poison_sting'], moveLine: ['poison_sting', 'twineedle', 'sludge_bomb'], role: 'Dano contínuo', rarity: 'common', power: 0.95, hp: 82,
    description: 'Ferrão venenoso simples, mas constante.',
    evolution: { to: 'kakuna', level: 7 }
  },
  kakuna: {
    id: 'kakuna', dex: 14, name: 'Kakuna', types: ['bug', 'poison'],
    abilities: ['twineedle'], moveLine: ['poison_sting', 'twineedle', 'sludge_bomb'], role: 'Dano contínuo', rarity: 'evolved', power: 0.85, hp: 126,
    description: 'Aguenta muito enquanto se prepara.',
    evolution: { to: 'beedrill', level: 10 }
  },
  beedrill: {
    id: 'beedrill', dex: 15, name: 'Beedrill', types: ['bug', 'poison'],
    abilities: ['sludge_bomb'], moveLine: ['poison_sting', 'twineedle', 'sludge_bomb'], role: 'Dano contínuo', rarity: 'evolved', power: 1.55, hp: 130,
    description: 'Ferrões duplos em alta velocidade.'
  },
  spearow: {
    id: 'spearow', dex: 21, name: 'Spearow', types: ['normal', 'flying'],
    abilities: ['peck'], moveLine: ['peck', 'wing_attack', 'drill_peck'], role: 'Dano rápido', rarity: 'common', power: 1.05, hp: 88,
    description: 'Bicadas rápidas e precisas.',
    evolution: { to: 'fearow', level: 20 }
  },
  fearow: {
    id: 'fearow', dex: 22, name: 'Fearow', types: ['normal', 'flying'],
    abilities: ['wing_attack'], moveLine: ['peck', 'wing_attack', 'drill_peck'], role: 'Dano rápido', rarity: 'evolved', power: 1.6, hp: 145,
    description: 'Bico perfurante em velocidade absurda.'
  },
  zubat: {
    id: 'zubat', dex: 41, name: 'Zubat', types: ['poison', 'flying'],
    abilities: ['leech_life'], moveLine: ['leech_life', 'air_cutter', 'sludge_bomb'], role: 'Corpo a corpo', rarity: 'common', power: 1, hp: 88,
    description: 'Drena quem chega perto do treinador.',
    evolution: { to: 'golbat', level: 22 }
  },
  golbat: {
    id: 'golbat', dex: 42, name: 'Golbat', types: ['poison', 'flying'],
    abilities: ['air_cutter'], moveLine: ['leech_life', 'air_cutter', 'sludge_bomb'], role: 'Corpo a corpo', rarity: 'evolved', power: 1.55, hp: 155,
    description: 'Mordidas que drenam a horda inteira.'
  },
  ekans: {
    id: 'ekans', dex: 23, name: 'Ekans', types: ['poison'],
    abilities: ['poison_sting'], moveLine: ['poison_sting', 'poison_fang', 'toxic'], role: 'Dano contínuo', rarity: 'common', power: 1.05, hp: 105,
    description: 'Veneno persistente à distância.',
    evolution: { to: 'arbok', level: 22 }
  },
  arbok: {
    id: 'arbok', dex: 24, name: 'Arbok', types: ['poison'],
    abilities: ['poison_fang'], moveLine: ['poison_sting', 'poison_fang', 'toxic'], role: 'Dano contínuo', rarity: 'evolved', power: 1.6, hp: 175,
    description: 'Veneno que derrete qualquer defesa.'
  },
  sandshrew: {
    id: 'sandshrew', dex: 27, name: 'Sandshrew', types: ['ground'],
    abilities: ['rock_throw'], moveLine: ['rock_throw', 'rock_slide', 'earthquake'], role: 'Dano em área', rarity: 'common', power: 1.05, hp: 130,
    description: 'Arremessa terra e pedra em área.',
    evolution: { to: 'sandslash', level: 22 }
  },
  sandslash: {
    id: 'sandslash', dex: 28, name: 'Sandslash', types: ['ground'],
    abilities: ['rock_slide'], moveLine: ['rock_throw', 'rock_slide', 'earthquake'], role: 'Dano em área', rarity: 'evolved', power: 1.6, hp: 195,
    description: 'Espinhos e pedras em escala maior.'
  },
  nidoran_f: {
    id: 'nidoran_f', dex: 29, name: 'Nidoran♀', types: ['poison'],
    abilities: ['poison_sting'], moveLine: ['poison_sting', 'poison_fang', 'sludge_bomb'], role: 'Dano contínuo', rarity: 'common', power: 0.98, hp: 112,
    description: 'Mais resistente que o Nidoran♂, veneno igualmente teimoso.',
    evolution: { to: 'nidorina', level: 16 }
  },
  nidorina: {
    id: 'nidorina', dex: 30, name: 'Nidorina', types: ['poison'],
    abilities: ['poison_fang'], moveLine: ['poison_sting', 'poison_fang', 'sludge_bomb'], role: 'Dano contínuo', rarity: 'evolved', power: 1.35, hp: 152,
    description: 'Veneno mais forte e mais vida.',
    evolution: { to: 'nidoqueen', level: 36, method: 'stone', item: 'Pedra da Lua' }
  },
  nidoqueen: {
    id: 'nidoqueen', dex: 31, name: 'Nidoqueen', types: ['poison', 'ground'],
    abilities: ['sludge_bomb'], moveLine: ['poison_sting', 'poison_fang', 'sludge_bomb'], role: 'Dano contínuo', rarity: 'evolved', power: 1.9, hp: 215,
    description: 'Forma final: muralha venenosa.'
  },
  magikarp: {
    id: 'magikarp', dex: 129, name: 'Magikarp', types: ['water'],
    abilities: ['splash'], moveLine: ['splash', 'flail', 'hydro_pump'], role: 'Aposta de longo prazo', rarity: 'common', power: 0.35, hp: 70,
    description: 'Praticamente inútil — até chegar ao nível 20.',
    evolution: { to: 'gyarados', level: 20 }
  },
  gyarados: {
    id: 'gyarados', dex: 130, name: 'Gyarados', types: ['water', 'flying'],
    abilities: ['hydro_pump'], moveLine: ['splash', 'flail', 'hydro_pump'], role: 'Dano massivo', rarity: 'evolved', power: 2.0, hp: 250,
    description: 'A recompensa por ter apostado no Magikarp.'
  },
  jigglypuff: {
    id: 'jigglypuff', dex: 39, name: 'Jigglypuff', types: ['fairy'],
    abilities: ['sing'], moveLine: ['sing', 'disarming_voice', 'hyper_voice'], role: 'Controle', rarity: 'common', power: 0.9, hp: 140,
    description: 'Canção que deixa a horda inteira lenta.',
    evolution: { to: 'wigglytuff', level: 30, method: 'stone', item: 'Pedra da Lua' }
  },
  wigglytuff: {
    id: 'wigglytuff', dex: 40, name: 'Wigglytuff', types: ['fairy'],
    abilities: ['disarming_voice'], moveLine: ['sing', 'disarming_voice', 'hyper_voice'], role: 'Controle', rarity: 'evolved', power: 1.5, hp: 215,
    description: 'Área de controle enorme e muita vida.'
  },
  clefairy: {
    id: 'clefairy', dex: 35, name: 'Clefairy', types: ['fairy'],
    abilities: ['quick_attack'], moveLine: ['quick_attack', 'disarming_voice', 'hyper_voice'], role: 'Investida rápida', rarity: 'uncommon', power: 1, hp: 120,
    description: 'Pequena, teimosa e surpreendentemente forte.',
    evolution: { to: 'clefable', level: 30, method: 'stone', item: 'Pedra da Lua' }
  },
  clefable: {
    id: 'clefable', dex: 36, name: 'Clefable', types: ['fairy'],
    abilities: ['disarming_voice'], moveLine: ['quick_attack', 'disarming_voice', 'hyper_voice'], role: 'Investida rápida', rarity: 'evolved', power: 1.6, hp: 185,
    description: 'Forma final: rápida e resistente.'
  },
  paras: {
    id: 'paras', dex: 46, name: 'Paras', types: ['bug', 'grass'],
    abilities: ['leech_field'], moveLine: ['leech_field', 'mega_drain', 'petal_dance'], role: 'Zona de chão', rarity: 'common', power: 1, hp: 100,
    description: 'Esporos que ficam no chão envenenando.',
    evolution: { to: 'parasect', level: 24 }
  },
  parasect: {
    id: 'parasect', dex: 47, name: 'Parasect', types: ['bug', 'grass'],
    abilities: ['mega_drain'], moveLine: ['leech_field', 'mega_drain', 'petal_dance'], role: 'Zona de chão', rarity: 'evolved', power: 1.55, hp: 165,
    description: 'Campos de esporos muito maiores.'
  },

  /* ========================= EVOLUÇÕES ========================= */
  ivysaur: {
    id: 'ivysaur', dex: 2, name: 'Ivysaur', types: ['grass', 'poison'],
    abilities: ['razor_leaf'], moveLine: ['vine_whip', 'razor_leaf', 'solar_beam'], role: 'Controle de área', rarity: 'evolved',
    power: 1.35, hp: 190,
    description: 'Vinhas mais fortes e muito mais resistência.',
    evolution: { to: 'venusaur', level: 32 }
  },
  venusaur: {
    id: 'venusaur', dex: 3, name: 'Venusaur', types: ['grass', 'poison'],
    abilities: ['solar_beam'], moveLine: ['vine_whip', 'razor_leaf', 'solar_beam'], role: 'Controle de área', rarity: 'evolved',
    power: 1.85, hp: 265,
    description: 'Forma final: domina o campo de batalha inteiro.'
  },
  charmeleon: {
    id: 'charmeleon', dex: 5, name: 'Charmeleon', types: ['fire'],
    abilities: ['flamethrower'], moveLine: ['ember', 'flamethrower', 'fire_blast'], role: 'Dano direto', rarity: 'evolved',
    power: 1.4, hp: 150,
    description: 'Chamas maiores e mais rápidas.',
    evolution: { to: 'charizard', level: 36 }
  },
  charizard: {
    id: 'charizard', dex: 6, name: 'Charizard', types: ['fire', 'flying'],
    abilities: ['fire_blast'], moveLine: ['ember', 'flamethrower', 'fire_blast'], role: 'Dano direto', rarity: 'evolved',
    power: 1.95, hp: 210,
    description: 'Forma final: fogo em escala devastadora.'
  },
  wartortle: {
    id: 'wartortle', dex: 8, name: 'Wartortle', types: ['water'],
    abilities: ['bubble_beam'], moveLine: ['water_gun', 'bubble_beam', 'hydro_pump'], role: 'Controle e perfuração', rarity: 'evolved',
    power: 1.35, hp: 195,
    description: 'Jatos mais largos e mais empurrão.',
    evolution: { to: 'blastoise', level: 36 }
  },
  blastoise: {
    id: 'blastoise', dex: 9, name: 'Blastoise', types: ['water'],
    abilities: ['hydro_pump'], moveLine: ['water_gun', 'bubble_beam', 'hydro_pump'], role: 'Controle e perfuração', rarity: 'evolved',
    power: 1.85, hp: 275,
    description: 'Forma final: canhões de água que atravessam a horda.'
  },
  pidgeotto: {
    id: 'pidgeotto', dex: 17, name: 'Pidgeotto', types: ['normal', 'flying'],
    abilities: ['wing_attack'], moveLine: ['gust', 'wing_attack', 'hurricane'], role: 'Afastamento', rarity: 'evolved',
    power: 1.35, hp: 130,
    description: 'Rajadas maiores e mais frequentes.',
    evolution: { to: 'pidgeot', level: 36 }
  },
  pidgeot: {
    id: 'pidgeot', dex: 18, name: 'Pidgeot', types: ['normal', 'flying'],
    abilities: ['hurricane'], moveLine: ['gust', 'wing_attack', 'hurricane'], role: 'Afastamento', rarity: 'evolved',
    power: 1.8, hp: 175,
    description: 'Forma final: limpa o perímetro sozinho.'
  },
  nidorino: {
    id: 'nidorino', dex: 33, name: 'Nidorino', types: ['poison'],
    abilities: ['poison_fang'], moveLine: ['poison_sting', 'poison_fang', 'sludge_bomb'], role: 'Dano contínuo', rarity: 'evolved',
    power: 1.4, hp: 145,
    description: 'Ferrões mais rápidos e veneno mais forte.',
    evolution: { to: 'nidoking', level: 36, method: 'stone', item: 'Pedra da Lua' }
  },
  nidoking: {
    id: 'nidoking', dex: 34, name: 'Nidoking', types: ['poison', 'ground'],
    abilities: ['sludge_bomb'], moveLine: ['poison_sting', 'poison_fang', 'sludge_bomb'], role: 'Dano contínuo', rarity: 'evolved',
    power: 1.9, hp: 205,
    description: 'Forma final: veneno em escala industrial.'
  },
  gloom: {
    id: 'gloom', dex: 44, name: 'Gloom', types: ['grass', 'poison'],
    abilities: ['mega_drain'], moveLine: ['acid', 'mega_drain', 'petal_dance'], role: 'Aura tóxica', rarity: 'evolved',
    power: 1.35, hp: 150,
    description: 'A nuvem tóxica fica bem maior.',
    evolution: { to: 'vileplume', level: 32, method: 'stone', item: 'Pedra das Folhas' }
  },
  vileplume: {
    id: 'vileplume', dex: 45, name: 'Vileplume', types: ['grass', 'poison'],
    abilities: ['petal_dance'], moveLine: ['acid', 'mega_drain', 'petal_dance'], role: 'Aura tóxica', rarity: 'evolved',
    power: 1.85, hp: 195,
    description: 'Forma final: veneno constante em área enorme.'
  },
  poliwhirl: {
    id: 'poliwhirl', dex: 61, name: 'Poliwhirl', types: ['water'],
    abilities: ['water_pulse'], moveLine: ['bubble', 'water_pulse', 'hydro_pump'], role: 'Desaceleração', rarity: 'evolved',
    power: 1.35, hp: 160,
    description: 'Mais bolhas e desaceleração mais pesada.',
    evolution: { to: 'poliwrath', level: 36, method: 'stone', item: 'Pedra da Água' }
  },
  poliwrath: {
    id: 'poliwrath', dex: 62, name: 'Poliwrath', types: ['water', 'fighting'],
    abilities: ['hydro_pump'], moveLine: ['bubble', 'water_pulse', 'hydro_pump'], role: 'Desaceleração', rarity: 'evolved',
    power: 1.85, hp: 215,
    description: 'Forma final: segura a horda inteira no lugar.'
  },
  weepinbell: {
    id: 'weepinbell', dex: 70, name: 'Weepinbell', types: ['grass', 'poison'],
    abilities: ['razor_leaf'], moveLine: ['leech_field', 'razor_leaf', 'solar_beam'], role: 'Zona de chão', rarity: 'evolved',
    power: 1.4, hp: 135,
    description: 'Campos de vinha maiores e mais duradouros.',
    evolution: { to: 'victreebel', level: 32, method: 'stone', item: 'Pedra das Folhas' }
  },
  victreebel: {
    id: 'victreebel', dex: 71, name: 'Victreebel', types: ['grass', 'poison'],
    abilities: ['solar_beam'], moveLine: ['leech_field', 'razor_leaf', 'solar_beam'], role: 'Zona de chão', rarity: 'evolved',
    power: 1.9, hp: 180,
    description: 'Forma final: o chão inteiro vira armadilha.'
  },
  graveler: {
    id: 'graveler', dex: 75, name: 'Graveler', types: ['rock', 'ground'],
    abilities: ['rock_slide'], moveLine: ['rock_throw', 'rock_slide', 'earthquake'], role: 'Dano em área', rarity: 'evolved',
    power: 1.4, hp: 220,
    description: 'Pedras maiores, explosões maiores.',
    evolution: { to: 'golem', level: 36, method: 'trade' }
  },
  golem: {
    id: 'golem', dex: 76, name: 'Golem', types: ['rock', 'ground'],
    abilities: ['earthquake'], moveLine: ['rock_throw', 'rock_slide', 'earthquake'], role: 'Dano em área', rarity: 'evolved',
    power: 1.9, hp: 290,
    description: 'Forma final: bombardeio constante.'
  },
  rapidash: {
    id: 'rapidash', dex: 78, name: 'Rapidash', types: ['fire'],
    abilities: ['fire_spin'], moveLine: ['flame_wheel', 'fire_spin', 'fire_blast'], role: 'Defesa de perímetro', rarity: 'evolved',
    power: 1.8, hp: 165,
    description: 'Chamas orbitais muito mais largas e rápidas.'
  },
  machoke: {
    id: 'machoke', dex: 67, name: 'Machoke', types: ['fighting'],
    abilities: ['seismic_toss'], moveLine: ['karate_chop', 'seismic_toss', 'cross_chop'], role: 'Dano alto corpo a corpo', rarity: 'evolved',
    power: 1.45, hp: 190,
    description: 'Golpes que atravessam qualquer defesa.',
    evolution: { to: 'machamp', level: 40, method: 'trade' }
  },
  machamp: {
    id: 'machamp', dex: 68, name: 'Machamp', types: ['fighting'],
    abilities: ['cross_chop'], moveLine: ['karate_chop', 'seismic_toss', 'cross_chop'], role: 'Dano alto corpo a corpo', rarity: 'evolved',
    power: 1.95, hp: 245,
    description: 'Forma final: quatro braços, zero sobreviventes.'
  },
  raichu: {
    id: 'raichu', dex: 26, name: 'Raichu', types: ['electric'],
    abilities: ['thunderbolt'], moveLine: ['thunder_shock', 'thunderbolt', 'thunder'], role: 'Dano em corrente', rarity: 'evolved',
    power: 1.8, hp: 130,
    description: 'Raios que saltam muito mais longe.'
  },
  kadabra: {
    id: 'kadabra', dex: 64, name: 'Kadabra', types: ['psychic'],
    abilities: ['psybeam'], moveLine: ['confusion', 'psybeam', 'psychic_wave'], role: 'Perseguição', rarity: 'evolved',
    power: 1.5, hp: 100,
    description: 'Ondas psíquicas mais rápidas e precisas.',
    evolution: { to: 'alakazam', level: 36, method: 'trade' }
  },
  alakazam: {
    id: 'alakazam', dex: 65, name: 'Alakazam', types: ['psychic'],
    abilities: ['psychic_wave'], moveLine: ['confusion', 'psybeam', 'psychic_wave'], role: 'Perseguição', rarity: 'evolved',
    power: 2.0, hp: 125,
    description: 'Forma final: poder psíquico absoluto.'
  },
  starmie: {
    id: 'starmie', dex: 121, name: 'Starmie', types: ['water', 'psychic'],
    abilities: ['ice_beam'], moveLine: ['bubble', 'water_pulse', 'ice_beam'], role: 'Desaceleração', rarity: 'evolved',
    power: 1.85, hp: 165,
    description: 'Forma final: jatos rápidos e implacáveis.'
  },
  arcanine: {
    id: 'arcanine', dex: 59, name: 'Arcanine', types: ['fire'],
    abilities: ['fire_blast'], moveLine: ['ember', 'flamethrower', 'fire_blast'], role: 'Dano direto', rarity: 'evolved',
    power: 1.9, hp: 200,
    description: 'Forma final: o Pokémon lendário das chamas.'
  }
};

/** Peso de sorteio por raridade (usado nas opções de captura). */
export const RARITY_WEIGHT = {
  starter: 0,
  common: 10,
  uncommon: 5,
  rare: 2,
  evolved: 0,     // evoluções não aparecem em captura: você as conquista evoluindo
  legendary: 0.5
};

export const getPokemon = (id) => POKEMON[id];
export const getStarters = () => Object.values(POKEMON).filter((p) => p.starter);

/** Linha evolutiva completa de uma espécie (ex.: charmander → charmeleon → charizard). */
export function evolutionLine(id) {
  const line = [id];
  let current = POKEMON[id];
  while (current?.evolution?.to && POKEMON[current.evolution.to]) {
    line.push(current.evolution.to);
    current = POKEMON[current.evolution.to];
  }
  return line;
}
