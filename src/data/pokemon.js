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
    abilities: ['mega_drain'], moveLine: ['mega_drain',  'toxic',  'solar_beam'], role: 'Aura tóxica', rarity: 'common', power: 1, hp: 100,
    description: 'Nuvem de veneno constante — ótima contra inimigos corpo a corpo.',
    evolution: { to: 'gloom', level: 21 }
  },
  poliwag: {
    id: 'poliwag', dex: 60, name: 'Poliwag', types: ['water'],
    abilities: ['water_gun'], moveLine: ['water_gun',  'water_pulse',  'hydro_pump'], role: 'Desaceleração', rarity: 'common', power: 1, hp: 115,
    description: 'Bolhas em leque que seguram o avanço da horda.',
    evolution: { to: 'poliwhirl', level: 25 }
  },
  bellsprout: {
    id: 'bellsprout', dex: 69, name: 'Bellsprout', types: ['grass', 'poison'],
    abilities: ['vine_whip'], moveLine: ['vine_whip',  'razor_leaf',  'solar_beam'], role: 'Zona de chão', rarity: 'common', power: 1, hp: 92,
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
    abilities: ['ember'], moveLine: ['ember',  'fire_spin',  'fire_blast'], role: 'Defesa de perímetro', rarity: 'uncommon', power: 1, hp: 112,
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
    abilities: ['water_gun'], moveLine: ['water_gun',  'water_pulse',  'ice_beam'], role: 'Desaceleração', rarity: 'uncommon', power: 1.05, hp: 105,
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
    abilities: ['peck'], moveLine: ['peck',  'wing_attack',  'hurricane'], role: 'Dano rápido', rarity: 'common', power: 1.05, hp: 88,
    description: 'Bicadas rápidas e precisas.',
    evolution: { to: 'fearow', level: 20 }
  },
  fearow: {
    id: 'fearow', dex: 22, name: 'Fearow', types: ['normal', 'flying'],
    abilities: ['wing_attack'], moveLine: ['peck',  'wing_attack',  'hurricane'], role: 'Dano rápido', rarity: 'evolved', power: 1.6, hp: 145,
    description: 'Bico perfurante em velocidade absurda.'
  },
  zubat: {
    id: 'zubat', dex: 41, name: 'Zubat', types: ['poison', 'flying'],
    abilities: ['leech_life'], moveLine: ['leech_life',  'wing_attack',  'sludge_bomb'], role: 'Corpo a corpo', rarity: 'common', power: 1, hp: 88,
    description: 'Drena quem chega perto do treinador.',
    evolution: { to: 'golbat', level: 22 }
  },
  golbat: {
    id: 'golbat', dex: 42, name: 'Golbat', types: ['poison', 'flying'],
    abilities: ['wing_attack'], moveLine: ['leech_life',  'wing_attack',  'sludge_bomb'], role: 'Corpo a corpo', rarity: 'evolved', power: 1.55, hp: 155,
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
    abilities: ['quick_attack'], moveLine: ['quick_attack',  'twister',  'hydro_pump'], role: 'Aposta de longo prazo', rarity: 'common', power: 0.35, hp: 70,
    description: 'Praticamente inútil — até chegar ao nível 20.',
    evolution: { to: 'gyarados', level: 20 }
  },
  gyarados: {
    id: 'gyarados', dex: 130, name: 'Gyarados', types: ['water', 'flying'],
    abilities: ['hydro_pump'], moveLine: ['quick_attack',  'twister',  'hydro_pump'], role: 'Dano massivo', rarity: 'evolved', power: 2.0, hp: 250,
    description: 'A recompensa por ter apostado no Magikarp.'
  },
  jigglypuff: {
    id: 'jigglypuff', dex: 39, name: 'Jigglypuff', types: ['fairy'],
    abilities: ['quick_attack'], moveLine: ['quick_attack',  'disarming_voice',  'hyper_voice'], role: 'Controle', rarity: 'common', power: 0.9, hp: 140,
    description: 'Canção que deixa a horda inteira lenta.',
    evolution: { to: 'wigglytuff', level: 30, method: 'stone', item: 'Pedra da Lua' }
  },
  wigglytuff: {
    id: 'wigglytuff', dex: 40, name: 'Wigglytuff', types: ['fairy'],
    abilities: ['disarming_voice'], moveLine: ['quick_attack',  'disarming_voice',  'hyper_voice'], role: 'Controle', rarity: 'evolved', power: 1.5, hp: 215,
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
    abilities: ['leech_life'], moveLine: ['leech_life',  'mega_drain',  'solar_beam'], role: 'Zona de chão', rarity: 'common', power: 1, hp: 100,
    description: 'Esporos que ficam no chão envenenando.',
    evolution: { to: 'parasect', level: 24 }
  },
  parasect: {
    id: 'parasect', dex: 47, name: 'Parasect', types: ['bug', 'grass'],
    abilities: ['mega_drain'], moveLine: ['leech_life',  'mega_drain',  'solar_beam'], role: 'Zona de chão', rarity: 'evolved', power: 1.55, hp: 165,
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
    abilities: ['toxic'], moveLine: ['mega_drain',  'toxic',  'solar_beam'], role: 'Aura tóxica', rarity: 'evolved',
    power: 1.35, hp: 150,
    description: 'A nuvem tóxica fica bem maior.',
    evolution: { to: 'vileplume', level: 32, method: 'stone', item: 'Pedra das Folhas' }
  },
  vileplume: {
    id: 'vileplume', dex: 45, name: 'Vileplume', types: ['grass', 'poison'],
    abilities: ['solar_beam'], moveLine: ['mega_drain',  'toxic',  'solar_beam'], role: 'Aura tóxica', rarity: 'evolved',
    power: 1.85, hp: 195,
    description: 'Forma final: veneno constante em área enorme.'
  },
  poliwhirl: {
    id: 'poliwhirl', dex: 61, name: 'Poliwhirl', types: ['water'],
    abilities: ['water_pulse'], moveLine: ['water_gun',  'water_pulse',  'hydro_pump'], role: 'Desaceleração', rarity: 'evolved',
    power: 1.35, hp: 160,
    description: 'Mais bolhas e desaceleração mais pesada.',
    evolution: { to: 'poliwrath', level: 36, method: 'stone', item: 'Pedra da Água' }
  },
  poliwrath: {
    id: 'poliwrath', dex: 62, name: 'Poliwrath', types: ['water', 'fighting'],
    abilities: ['hydro_pump'], moveLine: ['water_gun',  'water_pulse',  'hydro_pump'], role: 'Desaceleração', rarity: 'evolved',
    power: 1.85, hp: 215,
    description: 'Forma final: segura a horda inteira no lugar.'
  },
  weepinbell: {
    id: 'weepinbell', dex: 70, name: 'Weepinbell', types: ['grass', 'poison'],
    abilities: ['razor_leaf'], moveLine: ['vine_whip',  'razor_leaf',  'solar_beam'], role: 'Zona de chão', rarity: 'evolved',
    power: 1.4, hp: 135,
    description: 'Campos de vinha maiores e mais duradouros.',
    evolution: { to: 'victreebel', level: 32, method: 'stone', item: 'Pedra das Folhas' }
  },
  victreebel: {
    id: 'victreebel', dex: 71, name: 'Victreebel', types: ['grass', 'poison'],
    abilities: ['solar_beam'], moveLine: ['vine_whip',  'razor_leaf',  'solar_beam'], role: 'Zona de chão', rarity: 'evolved',
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
    abilities: ['fire_spin'], moveLine: ['ember',  'fire_spin',  'fire_blast'], role: 'Defesa de perímetro', rarity: 'evolved',
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
    abilities: ['ice_beam'], moveLine: ['water_gun',  'water_pulse',  'ice_beam'], role: 'Desaceleração', rarity: 'evolved',
    power: 1.85, hp: 165,
    description: 'Forma final: jatos rápidos e implacáveis.'
  },
  arcanine: {
    id: 'arcanine', dex: 59, name: 'Arcanine', types: ['fire'],
    abilities: ['fire_blast'], moveLine: ['ember', 'flamethrower', 'fire_blast'], role: 'Dano direto', rarity: 'evolved',
    power: 1.9, hp: 200,
    description: 'Forma final: o Pokémon lendário das chamas.'
  },

  /* ============ KANTO COMPLETA (0.7): as 83 que faltavam ============
     Tipos e status de hoje (PokeAPI), evolução do FireRed, linha de golpes
     por família. Vida e potência seguem a mesma conta das espécies acima. */
  vulpix: {
    id: 'vulpix', dex: 37, name: 'Vulpix', types: ['fire'],
    abilities: ['ember'], moveLine: ['ember', 'fire_spin', 'fire_blast'], role: 'Defesa giratória', rarity: 'common',
    power: 1.0, hp: 120,
    description: 'Brasas que queimam aos poucos; evolui com a Pedra do Fogo.',
    evolution: { to: 'ninetales', level: 32, method: 'stone', item: 'Pedra do Fogo' }
  },
  ninetales: {
    id: 'ninetales', dex: 38, name: 'Ninetales', types: ['fire'],
    abilities: ['fire_blast'], moveLine: ['ember', 'fire_spin', 'fire_blast'], role: 'Defesa giratória', rarity: 'evolved',
    power: 1.84, hp: 215,
    description: 'Forma final: nove caudas de chamas que não se apagam.'
  },
  venonat: {
    id: 'venonat', dex: 48, name: 'Venonat', types: ['bug', 'poison'],
    abilities: ['leech_life'], moveLine: ['leech_life', 'psybeam', 'psychic_wave'], role: 'Dano à distância', rarity: 'common',
    power: 1.0, hp: 150,
    description: 'Ondas psíquicas que atravessam a horda e a deixam lenta.',
    evolution: { to: 'venomoth', level: 31 }
  },
  venomoth: {
    id: 'venomoth', dex: 49, name: 'Venomoth', types: ['bug', 'poison'],
    abilities: ['psybeam'], moveLine: ['leech_life', 'psybeam', 'psychic_wave'], role: 'Dano à distância', rarity: 'evolved',
    power: 1.64, hp: 185,
    description: 'Forma final: pó psíquico que persegue os inimigos.'
  },
  diglett: {
    id: 'diglett', dex: 50, name: 'Diglett', types: ['ground'],
    abilities: ['mud_slap'], moveLine: ['mud_slap', 'rock_slide', 'earthquake'], role: 'Dano à distância', rarity: 'common',
    power: 1.0, hp: 60,
    description: 'Lama que atrasa a horda; tremores quando cresce.',
    evolution: { to: 'dugtrio', level: 26 }
  },
  dugtrio: {
    id: 'dugtrio', dex: 51, name: 'Dugtrio', types: ['ground'],
    abilities: ['rock_slide'], moveLine: ['mud_slap', 'rock_slide', 'earthquake'], role: 'Dano à distância', rarity: 'evolved',
    power: 1.55, hp: 130,
    description: 'Forma final: três cabeças, terremotos sem descanso.'
  },
  meowth: {
    id: 'meowth', dex: 52, name: 'Meowth', types: ['normal'],
    abilities: ['quick_attack'], moveLine: ['quick_attack', 'hyper_fang', 'hyper_beam'], role: 'Corpo a corpo', rarity: 'common',
    power: 1.0, hp: 105,
    description: 'Arranhões rápidos de quem vive atrás de moedinhas.',
    evolution: { to: 'persian', level: 28 }
  },
  persian: {
    id: 'persian', dex: 53, name: 'Persian', types: ['normal'],
    abilities: ['hyper_fang'], moveLine: ['quick_attack', 'hyper_fang', 'hyper_beam'], role: 'Corpo a corpo', rarity: 'evolved',
    power: 1.6, hp: 170,
    description: 'Forma final: elegante e mortal no corpo a corpo.'
  },
  psyduck: {
    id: 'psyduck', dex: 54, name: 'Psyduck', types: ['water'],
    abilities: ['water_gun'], moveLine: ['water_gun', 'confusion', 'hydro_pump'], role: 'Dano à distância', rarity: 'common',
    power: 1.0, hp: 135,
    description: 'Jatos d\'água e, quando a dor de cabeça aperta, Confusion.',
    evolution: { to: 'golduck', level: 33 }
  },
  golduck: {
    id: 'golduck', dex: 55, name: 'Golduck', types: ['water'],
    abilities: ['confusion'], moveLine: ['water_gun', 'confusion', 'hydro_pump'], role: 'Dano à distância', rarity: 'evolved',
    power: 1.82, hp: 215,
    description: 'Forma final: nadador veloz com poder psíquico.'
  },
  mankey: {
    id: 'mankey', dex: 56, name: 'Mankey', types: ['fighting'],
    abilities: ['karate_chop'], moveLine: ['karate_chop', 'seismic_toss', 'cross_chop'], role: 'Corpo a corpo', rarity: 'common',
    power: 1.0, hp: 110,
    description: 'Golpes de caratê de quem vive irritado.',
    evolution: { to: 'primeape', level: 28 }
  },
  primeape: {
    id: 'primeape', dex: 57, name: 'Primeape', types: ['fighting'],
    abilities: ['seismic_toss'], moveLine: ['karate_chop', 'seismic_toss', 'cross_chop'], role: 'Corpo a corpo', rarity: 'evolved',
    power: 1.65, hp: 175,
    description: 'Forma final: fúria pura em golpes de luta.'
  },
  tentacool: {
    id: 'tentacool', dex: 72, name: 'Tentacool', types: ['water', 'poison'],
    abilities: ['poison_sting'], moveLine: ['poison_sting', 'bubble_beam', 'hydro_pump'], role: 'Dano à distância', rarity: 'uncommon',
    power: 1.0, hp: 145,
    description: 'Ferrões venenosos e jatos que atravessam inimigos.',
    evolution: { to: 'tentacruel', level: 30 }
  },
  tentacruel: {
    id: 'tentacruel', dex: 73, name: 'Tentacruel', types: ['water', 'poison'],
    abilities: ['bubble_beam'], moveLine: ['poison_sting', 'bubble_beam', 'hydro_pump'], role: 'Dano à distância', rarity: 'evolved',
    power: 1.87, hp: 235,
    description: 'Forma final: oitenta tentáculos e Hydro Pump.'
  },
  slowpoke: {
    id: 'slowpoke', dex: 79, name: 'Slowpoke', types: ['water', 'psychic'],
    abilities: ['water_gun'], moveLine: ['water_gun', 'confusion', 'psychic_wave'], role: 'Dano à distância', rarity: 'common',
    power: 1.0, hp: 190,
    description: 'Lento para reagir, mas o poder psíquico chega longe.',
    evolution: { to: 'slowbro', level: 37 }
  },
  slowbro: {
    id: 'slowbro', dex: 80, name: 'Slowbro', types: ['water', 'psychic'],
    abilities: ['confusion'], moveLine: ['water_gun', 'confusion', 'psychic_wave'], role: 'Dano à distância', rarity: 'evolved',
    power: 1.78, hp: 255,
    description: 'Forma final: um Shellder na cauda e ondas psíquicas.'
  },
  magnemite: {
    id: 'magnemite', dex: 81, name: 'Magnemite', types: ['electric', 'steel'],
    abilities: ['thunder_shock'], moveLine: ['thunder_shock', 'thunderbolt', 'thunder'], role: 'Raio em cadeia', rarity: 'common',
    power: 1.0, hp: 120,
    description: 'Raios que saltam de inimigo em inimigo.',
    evolution: { to: 'magneton', level: 30 }
  },
  magneton: {
    id: 'magneton', dex: 82, name: 'Magneton', types: ['electric', 'steel'],
    abilities: ['thunderbolt'], moveLine: ['thunder_shock', 'thunderbolt', 'thunder'], role: 'Raio em cadeia', rarity: 'evolved',
    power: 1.69, hp: 180,
    description: 'Forma final: três ímãs, o triplo de eletricidade.'
  },
  farfetchd: {
    id: 'farfetchd', dex: 83, name: 'Farfetchd', types: ['normal', 'flying'],
    abilities: ['peck'], moveLine: ['peck', 'wing_attack', 'hurricane'], role: 'Corpo a corpo', rarity: 'uncommon',
    power: 1.37, hp: 150,
    description: 'Bicadas e cortes com o alho-poró que nunca larga.'
  },
  doduo: {
    id: 'doduo', dex: 84, name: 'Doduo', types: ['normal', 'flying'],
    abilities: ['peck'], moveLine: ['peck', 'hyper_voice', 'hurricane'], role: 'Afastamento', rarity: 'common',
    power: 1.0, hp: 100,
    description: 'Duas cabeças bicando ao mesmo tempo.',
    evolution: { to: 'dodrio', level: 31 }
  },
  dodrio: {
    id: 'dodrio', dex: 85, name: 'Dodrio', types: ['normal', 'flying'],
    abilities: ['hyper_voice'], moveLine: ['peck', 'hyper_voice', 'hurricane'], role: 'Afastamento', rarity: 'evolved',
    power: 1.71, hp: 170,
    description: 'Forma final: três cabeças e gritos ensurdecedores.'
  },
  seel: {
    id: 'seel', dex: 86, name: 'Seel', types: ['water'],
    abilities: ['water_gun'], moveLine: ['water_gun', 'ice_beam', 'blizzard'], role: 'Dano à distância', rarity: 'common',
    power: 1.0, hp: 170,
    description: 'Jatos gelados que deixam a horda quase parada.',
    evolution: { to: 'dewgong', level: 34 }
  },
  dewgong: {
    id: 'dewgong', dex: 87, name: 'Dewgong', types: ['water', 'ice'],
    abilities: ['ice_beam'], moveLine: ['water_gun', 'ice_beam', 'blizzard'], role: 'Dano à distância', rarity: 'evolved',
    power: 1.73, hp: 240,
    description: 'Forma final: nevascas que congelam a arena.'
  },
  grimer: {
    id: 'grimer', dex: 88, name: 'Grimer', types: ['poison'],
    abilities: ['poison_fang'], moveLine: ['poison_fang', 'toxic', 'sludge_bomb'], role: 'Controle de área', rarity: 'common',
    power: 1.0, hp: 175,
    description: 'Lama tóxica que envenena tudo por onde passa.',
    evolution: { to: 'muk', level: 38 }
  },
  muk: {
    id: 'muk', dex: 89, name: 'Muk', types: ['poison'],
    abilities: ['toxic'], moveLine: ['poison_fang', 'toxic', 'sludge_bomb'], role: 'Controle de área', rarity: 'evolved',
    power: 1.82, hp: 260,
    description: 'Forma final: uma poça de veneno que não acaba.'
  },
  shellder: {
    id: 'shellder', dex: 90, name: 'Shellder', types: ['water'],
    abilities: ['water_gun'], moveLine: ['water_gun', 'ice_beam', 'blizzard'], role: 'Dano à distância', rarity: 'common',
    power: 1.0, hp: 125,
    description: 'Concha dura e jatos que viram gelo; evolui com a Pedra da Água.',
    evolution: { to: 'cloyster', level: 32, method: 'stone', item: 'Pedra da Água' }
  },
  cloyster: {
    id: 'cloyster', dex: 91, name: 'Cloyster', types: ['water', 'ice'],
    abilities: ['blizzard'], moveLine: ['water_gun', 'ice_beam', 'blizzard'], role: 'Dano à distância', rarity: 'evolved',
    power: 1.91, hp: 220,
    description: 'Forma final: concha impenetrável e nevascas.'
  },
  gastly: {
    id: 'gastly', dex: 92, name: 'Gastly', types: ['ghost', 'poison'],
    abilities: ['lick'], moveLine: ['lick', 'night_shade', 'shadow_ball'], role: 'Raio em cadeia', rarity: 'common',
    power: 1.0, hp: 85,
    description: 'Lambidas fantasmagóricas que paralisam.',
    evolution: { to: 'haunter', level: 25 }
  },
  haunter: {
    id: 'haunter', dex: 93, name: 'Haunter', types: ['ghost', 'poison'],
    abilities: ['night_shade'], moveLine: ['lick', 'night_shade', 'shadow_ball'], role: 'Raio em cadeia', rarity: 'evolved',
    power: 1.47, hp: 130,
    description: 'Sombras que saltam entre os inimigos; evolui por troca.',
    evolution: { to: 'gengar', level: 38, method: 'trade' }
  },
  gengar: {
    id: 'gengar', dex: 94, name: 'Gengar', types: ['ghost', 'poison'],
    abilities: ['shadow_ball'], moveLine: ['lick', 'night_shade', 'shadow_ball'], role: 'Raio em cadeia', rarity: 'evolved',
    power: 1.82, hp: 170,
    description: 'Forma final: esferas de sombra que perseguem e explodem.'
  },
  onix: {
    id: 'onix', dex: 95, name: 'Onix', types: ['rock', 'ground'],
    abilities: ['rock_throw'], moveLine: ['rock_throw', 'rock_slide', 'earthquake'], role: 'Dano à distância', rarity: 'uncommon',
    power: 1.4, hp: 185,
    description: 'Uma serpente de pedra que faz o chão tremer.'
  },
  drowzee: {
    id: 'drowzee', dex: 96, name: 'Drowzee', types: ['psychic'],
    abilities: ['confusion'], moveLine: ['confusion', 'psybeam', 'psychic_wave'], role: 'Dano à distância', rarity: 'common',
    power: 1.0, hp: 170,
    description: 'Hipnose e ondas psíquicas que atravessam a horda.',
    evolution: { to: 'hypno', level: 26 }
  },
  hypno: {
    id: 'hypno', dex: 97, name: 'Hypno', types: ['psychic'],
    abilities: ['psybeam'], moveLine: ['confusion', 'psybeam', 'psychic_wave'], role: 'Dano à distância', rarity: 'evolved',
    power: 1.76, hp: 240,
    description: 'Forma final: o pêndulo que adormece e destrói.'
  },
  krabby: {
    id: 'krabby', dex: 98, name: 'Krabby', types: ['water'],
    abilities: ['water_gun'], moveLine: ['water_gun', 'bubble_beam', 'hydro_pump'], role: 'Dano à distância', rarity: 'common',
    power: 1.0, hp: 120,
    description: 'Jatos d\'água de quem tem uma pinça poderosa.',
    evolution: { to: 'kingler', level: 28 }
  },
  kingler: {
    id: 'kingler', dex: 99, name: 'Kingler', types: ['water'],
    abilities: ['bubble_beam'], moveLine: ['water_gun', 'bubble_beam', 'hydro_pump'], role: 'Dano à distância', rarity: 'evolved',
    power: 1.73, hp: 185,
    description: 'Forma final: a pinça gigante esmaga a horda.'
  },
  voltorb: {
    id: 'voltorb', dex: 100, name: 'Voltorb', types: ['electric'],
    abilities: ['thunder_shock'], moveLine: ['thunder_shock', 'thunderbolt', 'thunder'], role: 'Raio em cadeia', rarity: 'uncommon',
    power: 1.0, hp: 125,
    description: 'Raios em cadeia de uma Poké Ball que não é Poké Ball.',
    evolution: { to: 'electrode', level: 30 }
  },
  electrode: {
    id: 'electrode', dex: 101, name: 'Electrode', types: ['electric'],
    abilities: ['thunderbolt'], moveLine: ['thunder_shock', 'thunderbolt', 'thunder'], role: 'Raio em cadeia', rarity: 'evolved',
    power: 1.78, hp: 180,
    description: 'Forma final: o Pokémon mais rápido de Kanto.'
  },
  exeggcute: {
    id: 'exeggcute', dex: 102, name: 'Exeggcute', types: ['grass', 'psychic'],
    abilities: ['confusion'], moveLine: ['confusion', 'razor_leaf', 'solar_beam'], role: 'Dano à distância', rarity: 'common',
    power: 1.0, hp: 165,
    description: 'Ovos psíquicos que viram folhas cortantes; evolui com a Pedra das Folhas.',
    evolution: { to: 'exeggutor', level: 32, method: 'stone', item: 'Pedra das Folhas' }
  },
  exeggutor: {
    id: 'exeggutor', dex: 103, name: 'Exeggutor', types: ['grass', 'psychic'],
    abilities: ['solar_beam'], moveLine: ['confusion', 'razor_leaf', 'solar_beam'], role: 'Dano à distância', rarity: 'evolved',
    power: 1.93, hp: 235,
    description: 'Forma final: três cabeças e Solar Beam.'
  },
  cubone: {
    id: 'cubone', dex: 104, name: 'Cubone', types: ['ground'],
    abilities: ['mud_slap'], moveLine: ['mud_slap', 'bone_club', 'earthquake'], role: 'Dano à distância', rarity: 'common',
    power: 1.0, hp: 165,
    description: 'Arremessa o osso que nunca larga.',
    evolution: { to: 'marowak', level: 28 }
  },
  marowak: {
    id: 'marowak', dex: 105, name: 'Marowak', types: ['ground'],
    abilities: ['bone_club'], moveLine: ['mud_slap', 'bone_club', 'earthquake'], role: 'Dano à distância', rarity: 'evolved',
    power: 1.55, hp: 210,
    description: 'Forma final: o osso vira um bumerangue implacável.'
  },
  hitmonlee: {
    id: 'hitmonlee', dex: 106, name: 'Hitmonlee', types: ['fighting'],
    abilities: ['seismic_toss'], moveLine: ['karate_chop', 'seismic_toss', 'cross_chop'], role: 'Corpo a corpo', rarity: 'rare',
    power: 1.65, hp: 180,
    description: 'Chutes que alcançam longe; o prêmio do Dojo de Saffron.'
  },
  hitmonchan: {
    id: 'hitmonchan', dex: 107, name: 'Hitmonchan', types: ['fighting'],
    abilities: ['seismic_toss'], moveLine: ['karate_chop', 'seismic_toss', 'cross_chop'], role: 'Corpo a corpo', rarity: 'rare',
    power: 1.65, hp: 195,
    description: 'Socos rapidíssimos; o prêmio do Dojo de Saffron.'
  },
  lickitung: {
    id: 'lickitung', dex: 108, name: 'Lickitung', types: ['normal'],
    abilities: ['lick'], moveLine: ['lick', 'hyper_fang', 'hyper_beam'], role: 'Corpo a corpo', rarity: 'uncommon',
    power: 1.4, hp: 225,
    description: 'Uma língua enorme que paralisa quem chega perto.'
  },
  koffing: {
    id: 'koffing', dex: 109, name: 'Koffing', types: ['poison'],
    abilities: ['toxic'], moveLine: ['toxic', 'sludge_bomb', 'fire_blast'], role: 'Dano à distância', rarity: 'uncommon',
    power: 1.0, hp: 150,
    description: 'Gás tóxico que cobre o chão.',
    evolution: { to: 'weezing', level: 35 }
  },
  weezing: {
    id: 'weezing', dex: 110, name: 'Weezing', types: ['poison'],
    abilities: ['sludge_bomb'], moveLine: ['toxic', 'sludge_bomb', 'fire_blast'], role: 'Dano à distância', rarity: 'evolved',
    power: 1.78, hp: 215,
    description: 'Forma final: duas cabeças de gás e explosões de fogo.'
  },
  rhyhorn: {
    id: 'rhyhorn', dex: 111, name: 'Rhyhorn', types: ['ground', 'rock'],
    abilities: ['rock_throw'], moveLine: ['rock_throw', 'rock_slide', 'earthquake'], role: 'Dano à distância', rarity: 'uncommon',
    power: 1.25, hp: 190,
    description: 'Pedras e investidas de um tanque com chifre.',
    evolution: { to: 'rhydon', level: 42 }
  },
  rhydon: {
    id: 'rhydon', dex: 112, name: 'Rhydon', types: ['ground', 'rock'],
    abilities: ['rock_slide'], moveLine: ['rock_throw', 'rock_slide', 'earthquake'], role: 'Dano à distância', rarity: 'evolved',
    power: 1.76, hp: 255,
    description: 'Forma final: perfura rochas e faz a terra tremer.'
  },
  chansey: {
    id: 'chansey', dex: 113, name: 'Chansey', types: ['normal'],
    abilities: ['disarming_voice'], moveLine: ['quick_attack', 'disarming_voice', 'hyper_voice'], role: 'Afastamento', rarity: 'rare',
    power: 0.9, hp: 410,
    description: 'Muita vida e vozes que empurram a horda.'
  },
  tangela: {
    id: 'tangela', dex: 114, name: 'Tangela', types: ['grass'],
    abilities: ['vine_whip'], moveLine: ['vine_whip', 'mega_drain', 'solar_beam'], role: 'Controle de área', rarity: 'uncommon',
    power: 1.58, hp: 190,
    description: 'Vinhas que chicoteiam e drenam a vida.'
  },
  kangaskhan: {
    id: 'kangaskhan', dex: 115, name: 'Kangaskhan', types: ['normal'],
    abilities: ['hyper_fang'], moveLine: ['quick_attack', 'hyper_fang', 'hyper_beam'], role: 'Corpo a corpo', rarity: 'rare',
    power: 1.78, hp: 250,
    description: 'Mãe protetora: golpes fortes por ela e pelo filhote.'
  },
  horsea: {
    id: 'horsea', dex: 116, name: 'Horsea', types: ['water'],
    abilities: ['twister'], moveLine: ['twister', 'bubble_beam', 'hydro_pump'], role: 'Dano à distância', rarity: 'common',
    power: 1.0, hp: 105,
    description: 'Redemoinhos de dragão e jatos d\'água.',
    evolution: { to: 'seadra', level: 32 }
  },
  seadra: {
    id: 'seadra', dex: 117, name: 'Seadra', types: ['water'],
    abilities: ['bubble_beam'], moveLine: ['twister', 'bubble_beam', 'hydro_pump'], role: 'Dano à distância', rarity: 'evolved',
    power: 1.6, hp: 170,
    description: 'Forma final: espinhos venenosos e Hydro Pump.'
  },
  goldeen: {
    id: 'goldeen', dex: 118, name: 'Goldeen', types: ['water'],
    abilities: ['peck'], moveLine: ['peck', 'water_pulse', 'hydro_pump'], role: 'Afastamento', rarity: 'common',
    power: 1.0, hp: 135,
    description: 'O chifre que bica e as ondas que empurram.',
    evolution: { to: 'seaking', level: 33 }
  },
  seaking: {
    id: 'seaking', dex: 119, name: 'Seaking', types: ['water'],
    abilities: ['water_pulse'], moveLine: ['peck', 'water_pulse', 'hydro_pump'], role: 'Afastamento', rarity: 'evolved',
    power: 1.64, hp: 205,
    description: 'Forma final: o rei das cachoeiras.'
  },
  mr_mime: {
    id: 'mr_mime', dex: 122, name: 'Mr. Mime', types: ['psychic', 'fairy'],
    abilities: ['psybeam'], moveLine: ['confusion', 'psybeam', 'psychic_wave'], role: 'Dano à distância', rarity: 'rare',
    power: 1.67, hp: 180,
    description: 'Paredes invisíveis e ondas psíquicas.'
  },
  scyther: {
    id: 'scyther', dex: 123, name: 'Scyther', types: ['bug', 'flying'],
    abilities: ['wing_attack'], moveLine: ['quick_attack', 'wing_attack', 'hurricane'], role: 'Corpo a corpo', rarity: 'rare',
    power: 1.82, hp: 200,
    description: 'Lâminas tão rápidas que parecem asas.'
  },
  jynx: {
    id: 'jynx', dex: 124, name: 'Jynx', types: ['ice', 'psychic'],
    abilities: ['ice_beam'], moveLine: ['powder_snow', 'ice_beam', 'blizzard'], role: 'Dano à distância', rarity: 'rare',
    power: 1.65, hp: 175,
    description: 'Neve e beijos que congelam a horda.'
  },
  electabuzz: {
    id: 'electabuzz', dex: 125, name: 'Electabuzz', types: ['electric'],
    abilities: ['thunderbolt'], moveLine: ['thunder_shock', 'thunderbolt', 'thunder'], role: 'Raio em cadeia', rarity: 'rare',
    power: 1.78, hp: 185,
    description: 'Raios poderosos de quem vive em usinas.'
  },
  magmar: {
    id: 'magmar', dex: 126, name: 'Magmar', types: ['fire'],
    abilities: ['flamethrower'], moveLine: ['ember', 'flamethrower', 'fire_blast'], role: 'Dano à distância', rarity: 'rare',
    power: 1.8, hp: 185,
    description: 'Chamas de um vulcão que anda.'
  },
  pinsir: {
    id: 'pinsir', dex: 127, name: 'Pinsir', types: ['bug'],
    abilities: ['seismic_toss'], moveLine: ['bug_bite', 'seismic_toss', 'cross_chop'], role: 'Corpo a corpo', rarity: 'rare',
    power: 1.82, hp: 200,
    description: 'Pinças que agarram e arremessam.'
  },
  tauros: {
    id: 'tauros', dex: 128, name: 'Tauros', types: ['normal'],
    abilities: ['hyper_fang'], moveLine: ['quick_attack', 'hyper_fang', 'hyper_beam'], role: 'Corpo a corpo', rarity: 'rare',
    power: 1.78, hp: 215,
    description: 'Investidas de uma manada inteira em um só.'
  },
  lapras: {
    id: 'lapras', dex: 131, name: 'Lapras', types: ['water', 'ice'],
    abilities: ['ice_beam'], moveLine: ['water_gun', 'ice_beam', 'blizzard'], role: 'Dano à distância', rarity: 'rare',
    power: 1.95, hp: 295,
    description: 'Gentil, atravessa o mar e congela a horda.'
  },
  ditto: {
    id: 'ditto', dex: 132, name: 'Ditto', types: ['normal'],
    abilities: ['quick_attack'], moveLine: ['quick_attack', 'hyper_voice', 'hyper_beam'], role: 'Afastamento', rarity: 'common',
    power: 0.9, hp: 130,
    description: 'Imita o que vê; quase nunca é o suficiente.'
  },
  eevee: {
    id: 'eevee', dex: 133, name: 'Eevee', types: ['normal'],
    abilities: ['quick_attack'], moveLine: ['quick_attack', 'hyper_fang', 'hyper_beam'], role: 'Corpo a corpo', rarity: 'common',
    power: 1.0, hp: 150,
    description: 'Instável: evolui para Vaporeon, Jolteon ou Flareon.',
    evolution: { to: 'vaporeon', level: 30, method: 'stone', item: 'Pedra da Água/Trovão/Fogo', alternatives: ['jolteon', 'flareon'] }
  },
  vaporeon: {
    id: 'vaporeon', dex: 134, name: 'Vaporeon', types: ['water'],
    abilities: ['water_pulse'], moveLine: ['water_gun', 'water_pulse', 'hydro_pump'], role: 'Afastamento', rarity: 'evolved',
    power: 1.91, hp: 280,
    description: 'Forma de água: ondas e jatos poderosos.'
  },
  jolteon: {
    id: 'jolteon', dex: 135, name: 'Jolteon', types: ['electric'],
    abilities: ['thunderbolt'], moveLine: ['thunder_shock', 'thunderbolt', 'thunder'], role: 'Raio em cadeia', rarity: 'evolved',
    power: 1.91, hp: 190,
    description: 'Forma elétrica: raios em cadeia velocíssimos.'
  },
  flareon: {
    id: 'flareon', dex: 136, name: 'Flareon', types: ['fire'],
    abilities: ['fire_spin'], moveLine: ['ember', 'fire_spin', 'fire_blast'], role: 'Defesa giratória', rarity: 'evolved',
    power: 1.91, hp: 200,
    description: 'Forma de fogo: chamas que giram e explodem.'
  },
  porygon: {
    id: 'porygon', dex: 137, name: 'Porygon', types: ['normal'],
    abilities: ['thunder_shock'], moveLine: ['thunder_shock', 'psybeam', 'hyper_beam'], role: 'Dano à distância', rarity: 'uncommon',
    power: 1.44, hp: 185,
    description: 'Um Pokémon feito de código: ataques de três elementos.'
  },
  omanyte: {
    id: 'omanyte', dex: 138, name: 'Omanyte', types: ['rock', 'water'],
    abilities: ['water_gun'], moveLine: ['water_gun', 'rock_slide', 'hydro_pump'], role: 'Dano à distância', rarity: 'uncommon',
    power: 1.29, hp: 150,
    description: 'Um fóssil revivido: jatos e pedras antigas.',
    evolution: { to: 'omastar', level: 40 }
  },
  omastar: {
    id: 'omastar', dex: 139, name: 'Omastar', types: ['rock', 'water'],
    abilities: ['rock_slide'], moveLine: ['water_gun', 'rock_slide', 'hydro_pump'], role: 'Dano à distância', rarity: 'evolved',
    power: 1.8, hp: 225,
    description: 'Forma final: a concha pesada e Hydro Pump.'
  },
  kabuto: {
    id: 'kabuto', dex: 140, name: 'Kabuto', types: ['rock', 'water'],
    abilities: ['rock_throw'], moveLine: ['rock_throw', 'water_pulse', 'rock_slide'], role: 'Afastamento', rarity: 'uncommon',
    power: 1.29, hp: 130,
    description: 'Um fóssil revivido: pedras e ondas.',
    evolution: { to: 'kabutops', level: 40 }
  },
  kabutops: {
    id: 'kabutops', dex: 141, name: 'Kabutops', types: ['rock', 'water'],
    abilities: ['water_pulse'], moveLine: ['rock_throw', 'water_pulse', 'rock_slide'], role: 'Afastamento', rarity: 'evolved',
    power: 1.8, hp: 200,
    description: 'Forma final: foices afiadas do mar antigo.'
  },
  aerodactyl: {
    id: 'aerodactyl', dex: 142, name: 'Aerodactyl', types: ['rock', 'flying'],
    abilities: ['rock_slide'], moveLine: ['wing_attack', 'rock_slide', 'hyper_beam'], role: 'Dano à distância', rarity: 'rare',
    power: 1.87, hp: 200,
    description: 'Fera pré-histórica dos céus: asas e pedras.'
  },
  snorlax: {
    id: 'snorlax', dex: 143, name: 'Snorlax', types: ['normal'],
    abilities: ['hyper_voice'], moveLine: ['quick_attack', 'hyper_voice', 'hyper_beam'], role: 'Afastamento', rarity: 'rare',
    power: 1.96, hp: 335,
    description: 'Dorme quase o tempo todo; acordado, é uma muralha.'
  },
  articuno: {
    id: 'articuno', dex: 144, name: 'Articuno', types: ['ice', 'flying'],
    abilities: ['ice_beam'], moveLine: ['powder_snow', 'ice_beam', 'blizzard'], role: 'Dano à distância', rarity: 'legendary',
    power: 2.11, hp: 275,
    description: 'Lendário: nevascas que congelam a horda.'
  },
  zapdos: {
    id: 'zapdos', dex: 145, name: 'Zapdos', types: ['electric', 'flying'],
    abilities: ['thunderbolt'], moveLine: ['thunder_shock', 'thunderbolt', 'thunder'], role: 'Raio em cadeia', rarity: 'legendary',
    power: 2.11, hp: 240,
    description: 'Lendário: tempestades de raios.'
  },
  moltres: {
    id: 'moltres', dex: 146, name: 'Moltres', types: ['fire', 'flying'],
    abilities: ['flamethrower'], moveLine: ['ember', 'flamethrower', 'fire_blast'], role: 'Dano à distância', rarity: 'legendary',
    power: 2.11, hp: 240,
    description: 'Lendário: chamas que iluminam o céu.'
  },
  dratini: {
    id: 'dratini', dex: 147, name: 'Dratini', types: ['dragon'],
    abilities: ['twister'], moveLine: ['twister', 'dragon_breath', 'outrage'], role: 'Dano à distância', rarity: 'common',
    power: 1.0, hp: 120,
    description: 'Raro e tímido: redemoinhos de dragão.',
    evolution: { to: 'dragonair', level: 30 }
  },
  dragonair: {
    id: 'dragonair', dex: 148, name: 'Dragonair', types: ['dragon'],
    abilities: ['dragon_breath'], moveLine: ['twister', 'dragon_breath', 'outrage'], role: 'Dano à distância', rarity: 'evolved',
    power: 1.53, hp: 175,
    description: 'Aura de dragão que acalma o clima.',
    evolution: { to: 'dragonite', level: 55 }
  },
  dragonite: {
    id: 'dragonite', dex: 149, name: 'Dragonite', types: ['dragon', 'flying'],
    abilities: ['outrage'], moveLine: ['twister', 'dragon_breath', 'outrage'], role: 'Dano à distância', rarity: 'evolved',
    power: 2.18, hp: 255,
    description: 'Forma final: o dragão que dá a volta ao mundo.'
  },
  mewtwo: {
    id: 'mewtwo', dex: 150, name: 'Mewtwo', types: ['psychic'],
    abilities: ['psybeam'], moveLine: ['confusion', 'psybeam', 'psychic_wave'], role: 'Dano à distância', rarity: 'legendary',
    power: 2.47, hp: 265,
    description: 'Lendário: o Pokémon mais poderoso já criado.'
  },
  mew: {
    id: 'mew', dex: 151, name: 'Mew', types: ['psychic'],
    abilities: ['psybeam'], moveLine: ['confusion', 'psybeam', 'psychic_wave'], role: 'Dano à distância', rarity: 'legendary',
    power: 2.18, hp: 270,
    description: 'Lendário: dizem que guarda o código de todos.'
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
