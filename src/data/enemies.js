/**
 * INIMIGOS (Pokémon selvagens hostis).
 *
 * Campos:
 *   hp, speed, damage, xp, dropChance  — balanceamento puro
 *   damage                             — dano por golpe no Pokémon que estiver na frente
 *   dropChance                         — chance de deixar uma Poké Ball ao ser derrotado
 *   behavior                           — 'chaser' | 'wanderer' | 'swooper' | 'tank' | 'boss'
 *   radius / scale                     — colisão e tamanho do sprite
 *   abilities                          — habilidades hostis (ver abilities.js)
 *   cooldownMult                       — chefes: espaça (>1) ou apressa os golpes deste líder
 *   elite / boss                       — marcam inimigos especiais (barra de vida, XP extra)
 */
export const ENEMIES = {
  rattata: {
    id: 'rattata', dex: 19, name: 'Rattata', types: ['normal'],
    hp: 22, speed: 88, damage: 5, xp: 6, dropChance: 0.012,
    behavior: 'chaser', radius: 12, scale: 1
  },
  caterpie: {
    id: 'caterpie', dex: 10, name: 'Caterpie', types: ['bug'],
    hp: 38, speed: 54, damage: 5, xp: 6, dropChance: 0.014,
    behavior: 'wanderer', radius: 13, scale: 1
  },
  weedle: {
    id: 'weedle', dex: 13, name: 'Weedle', types: ['bug', 'poison'],
    hp: 31, speed: 62, damage: 6, xp: 6, dropChance: 0.014,
    behavior: 'wanderer', radius: 13, scale: 1
  },
  spearow: {
    id: 'spearow', dex: 21, name: 'Spearow', types: ['normal', 'flying'],
    hp: 27, speed: 118, damage: 7, xp: 7, dropChance: 0.022,
    behavior: 'swooper', radius: 12, scale: 1
  },
  zubat: {
    id: 'zubat', dex: 41, name: 'Zubat', types: ['poison', 'flying'],
    hp: 29, speed: 96, damage: 7, xp: 7, dropChance: 0.022,
    behavior: 'swooper', radius: 12, scale: 1
  },
  sandshrew: {
    id: 'sandshrew', dex: 27, name: 'Sandshrew', types: ['ground'],
    hp: 66, speed: 66, damage: 9, xp: 11, dropChance: 0.022,
    behavior: 'tank', radius: 15, scale: 1.1
  },
  geodude_wild: {
    id: 'geodude_wild', dex: 74, name: 'Geodude', types: ['rock', 'ground'],
    hp: 82, speed: 60, damage: 11, xp: 12, dropChance: 0.022,
    behavior: 'tank', radius: 15, scale: 1.1
  },
  ekans: {
    id: 'ekans', dex: 23, name: 'Ekans', types: ['poison'],
    hp: 46, speed: 94, damage: 9, xp: 9, dropChance: 0.018,
    behavior: 'chaser', radius: 13, scale: 1
  },


  paras: {
    id: 'paras', dex: 46, name: 'Paras', types: ['bug', 'grass'],
    hp: 52, speed: 58, damage: 8, xp: 7, dropChance: 0.014,
    behavior: 'wanderer', radius: 13, scale: 1
  },
  clefairy: {
    id: 'clefairy', dex: 35, name: 'Clefairy', types: ['fairy'],
    hp: 72, speed: 70, damage: 9, xp: 9, dropChance: 0.018,
    behavior: 'chaser', radius: 13, scale: 1
  },
  mankey: {
    id: 'mankey', dex: 56, name: 'Mankey', types: ['fighting'],
    hp: 57, speed: 112, damage: 11, xp: 12, dropChance: 0.016,
    behavior: 'swooper', radius: 13, scale: 1
  },
  psyduck: {
    id: 'psyduck', dex: 54, name: 'Psyduck', types: ['water'],
    hp: 77, speed: 68, damage: 10, xp: 10, dropChance: 0.016,
    behavior: 'chaser', radius: 14, scale: 1.05
  },
  krabby: {
    id: 'krabby', dex: 98, name: 'Krabby', types: ['water'],
    hp: 68, speed: 76, damage: 13, xp: 10, dropChance: 0.016,
    behavior: 'chaser', radius: 13, scale: 1
  },
  goldeen: {
    id: 'goldeen', dex: 118, name: 'Goldeen', types: ['water'],
    hp: 64, speed: 96, damage: 11, xp: 10, dropChance: 0.016,
    behavior: 'swooper', radius: 13, scale: 1
  },
  tentacool: {
    id: 'tentacool', dex: 72, name: 'Tentacool', types: ['water', 'poison'],
    hp: 81, speed: 64, damage: 12, xp: 11, dropChance: 0.018,
    behavior: 'wanderer', radius: 14, scale: 1.05
  },
  shellder: {
    id: 'shellder', dex: 90, name: 'Shellder', types: ['water'],
    hp: 105, speed: 52, damage: 14, xp: 12, dropChance: 0.02,
    behavior: 'tank', radius: 14, scale: 1.05
  },
  horsea: {
    id: 'horsea', dex: 116, name: 'Horsea', types: ['water'],
    hp: 62, speed: 92, damage: 11, xp: 10, dropChance: 0.016,
    behavior: 'swooper', radius: 12, scale: 1
  },

  /* ============================ ELITES ============================ */
  raticate: {
    id: 'raticate', dex: 20, name: 'Raticate', types: ['normal'],
    hp: 260, speed: 92, damage: 12, xp: 30, dropChance: 0.25,
    behavior: 'chaser', radius: 18, scale: 1.45, elite: true
  },
  primeape: {
    id: 'primeape', dex: 57, name: 'Primeape', types: ['fighting'],
    hp: 470, speed: 104, damage: 16, xp: 40, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  graveler: {
    id: 'graveler', dex: 75, name: 'Graveler', types: ['rock', 'ground'],
    hp: 450, speed: 54, damage: 18, xp: 45, dropChance: 0.25,
    behavior: 'tank', radius: 22, scale: 1.6, elite: true
  },


  golbat: {
    id: 'golbat', dex: 42, name: 'Golbat', types: ['poison', 'flying'],
    hp: 360, speed: 124, damage: 17, xp: 38, dropChance: 0.25,
    behavior: 'swooper', radius: 19, scale: 1.5, elite: true
  },
  parasect: {
    id: 'parasect', dex: 47, name: 'Parasect', types: ['bug', 'grass'],
    hp: 420, speed: 62, damage: 19, xp: 42, dropChance: 0.25,
    behavior: 'tank', radius: 20, scale: 1.5, elite: true
  },
  seaking: {
    id: 'seaking', dex: 119, name: 'Seaking', types: ['water'],
    hp: 470, speed: 104, damage: 20, xp: 46, dropChance: 0.25,
    behavior: 'chaser', radius: 20, scale: 1.5, elite: true
  },

  /* ============================= CHEFES ============================= */

  /* ===================== POKÉMON DOS LÍDERES =====================
     O chefe de cada fase é o time do líder, enfrentado em sequência:
     ao derrotar um, o próximo entra. O último é o ace do líder.
     ============================================================== */
  brock_geodude: {
    id: 'brock_geodude', dex: 74, name: 'Geodude do Brock', types: ['rock', 'ground'], level: 12,
    hp: 1700, speed: 78, damage: 14, xp: 180, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Brock',
    // 0.11.3: a chuva de pedras do Brock "matava tudo": golpes mais espaçados e um pouco menos de vida
    cooldownMult: 1.6,
    abilities: ['boss_shockwave'],
    summons: { enemy: 'geodude_wild', count: 1, interval: 12 }
  },
  brock_onix: {
    id: 'brock_onix', dex: 95, name: 'Onix do Brock', types: ['rock', 'ground'], level: 14,
    hp: 3400, speed: 88, damage: 19, xp: 420, dropChance: 1,
    behavior: 'boss', radius: 40, scale: 3.4, boss: true, ace: true,
    leader: 'Brock',
    cooldownMult: 1.6,
    abilities: ['leader_rock_barrage', 'boss_shockwave'],
    summons: { enemy: 'geodude_wild', count: 2, interval: 11 }
  },

  misty_staryu: {
    id: 'misty_staryu', dex: 120, name: 'Staryu da Misty', types: ['water'], level: 18,
    hp: 5000, speed: 106, damage: 21, xp: 260, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Misty',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'horsea', count: 3, interval: 10 }
  },
  misty_starmie: {
    id: 'misty_starmie', dex: 121, name: 'Starmie da Misty', types: ['water', 'psychic'], level: 21,
    hp: 9000, speed: 118, damage: 27, xp: 620, dropChance: 1,
    behavior: 'boss', radius: 38, scale: 3.2, boss: true, ace: true,
    leader: 'Misty',
    abilities: ['leader_whirlpool', 'boss_shockwave'],
    summons: { enemy: 'shellder', count: 3, interval: 9 }
  },

  boss_raticate: {
    id: 'boss_raticate', dex: 20, name: 'Raticate Alfa', types: ['normal'],
    hp: 1500, speed: 95, damage: 16, xp: 150, dropChance: 1,
    behavior: 'boss', radius: 32, scale: 2.6, boss: true,
    abilities: ['boss_shockwave'],
    summons: { enemy: 'rattata', count: 4, interval: 7 }
  },
  boss_fearow: {
    id: 'boss_fearow', dex: 22, name: 'Fearow Líder de Bando', types: ['normal', 'flying'],
    hp: 2600, speed: 112, damage: 20, xp: 220, dropChance: 1,
    behavior: 'boss', radius: 32, scale: 2.6, boss: true,
    abilities: ['boss_shockwave'],
    summons: { enemy: 'spearow', count: 5, interval: 6 }
  },
  boss_onix: {
    id: 'boss_onix', dex: 95, name: 'Onix de Brock', types: ['rock', 'ground'],
    hp: 4200, speed: 82, damage: 26, xp: 400, dropChance: 1,
    behavior: 'boss', radius: 40, scale: 3.4, boss: true,
    abilities: ['boss_shockwave'],
    summons: { enemy: 'geodude_wild', count: 3, interval: 10 }
  },

  /* ============ FASES 3 EM DIANTE (0.7) ============
     Selvagens e elites no nível de referência (CONFIG.enemies): cada fase dá o
     nível nas ondas. Os líderes têm vida absoluta e o nível do FireRed. */
  meowth: {
    id: 'meowth', dex: 52, name: 'Meowth', types: ['normal'],
    hp: 34, speed: 98, damage: 5, xp: 8, dropChance: 0.016,
    behavior: 'chaser', radius: 13, scale: 1
  },
  pidgey: {
    id: 'pidgey', dex: 16, name: 'Pidgey', types: ['normal', 'flying'],
    hp: 36, speed: 104, damage: 5, xp: 7, dropChance: 0.022,
    behavior: 'swooper', radius: 13, scale: 1
  },
  oddish: {
    id: 'oddish', dex: 43, name: 'Oddish', types: ['grass', 'poison'],
    hp: 45, speed: 64, damage: 7, xp: 9, dropChance: 0.016,
    behavior: 'wanderer', radius: 13, scale: 1
  },
  diglett: {
    id: 'diglett', dex: 50, name: 'Diglett', types: ['ground'],
    hp: 16, speed: 100, damage: 5, xp: 8, dropChance: 0.016,
    behavior: 'chaser', radius: 13, scale: 1
  },
  drowzee: {
    id: 'drowzee', dex: 96, name: 'Drowzee', types: ['psychic'],
    hp: 47, speed: 71, damage: 5, xp: 9, dropChance: 0.016,
    behavior: 'chaser', radius: 13, scale: 1
  },
  voltorb: {
    id: 'voltorb', dex: 100, name: 'Voltorb', types: ['electric'],
    hp: 40, speed: 103, damage: 5, xp: 9, dropChance: 0.016,
    behavior: 'chaser', radius: 13, scale: 1
  },
  magnemite: {
    id: 'magnemite', dex: 81, name: 'Magnemite', types: ['electric', 'steel'],
    hp: 43, speed: 73, damage: 8, xp: 9, dropChance: 0.016,
    behavior: 'chaser', radius: 13, scale: 1
  },
  pikachu: {
    id: 'pikachu', dex: 25, name: 'Pikachu', types: ['electric'],
    hp: 34, speed: 98, damage: 5, xp: 9, dropChance: 0.016,
    behavior: 'chaser', radius: 15, scale: 1.15
  },
  machop: {
    id: 'machop', dex: 66, name: 'Machop', types: ['fighting'],
    hp: 54, speed: 67, damage: 7, xp: 9, dropChance: 0.016,
    behavior: 'chaser', radius: 13, scale: 1
  },
  growlithe: {
    id: 'growlithe', dex: 58, name: 'Growlithe', types: ['fire'],
    hp: 45, speed: 81, damage: 6, xp: 10, dropChance: 0.016,
    behavior: 'chaser', radius: 13, scale: 1
  },
  gloom: {
    id: 'gloom', dex: 44, name: 'Gloom', types: ['grass', 'poison'],
    hp: 58, speed: 70, damage: 7, xp: 11, dropChance: 0.016,
    behavior: 'wanderer', radius: 15, scale: 1.15
  },
  weepinbell: {
    id: 'weepinbell', dex: 70, name: 'Weepinbell', types: ['grass', 'poison'],
    hp: 52, speed: 78, damage: 8, xp: 11, dropChance: 0.016,
    behavior: 'chaser', radius: 15, scale: 1.15
  },
  tangela: {
    id: 'tangela', dex: 114, name: 'Tangela', types: ['grass'],
    hp: 81, speed: 81, damage: 8, xp: 12, dropChance: 0.016,
    behavior: 'chaser', radius: 13, scale: 1
  },
  exeggcute: {
    id: 'exeggcute', dex: 102, name: 'Exeggcute', types: ['grass', 'psychic'],
    hp: 63, speed: 70, damage: 6, xp: 9, dropChance: 0.016,
    behavior: 'tank', radius: 15, scale: 1.1
  },
  bellsprout: {
    id: 'bellsprout', dex: 69, name: 'Bellsprout', types: ['grass', 'poison'],
    hp: 38, speed: 70, damage: 7, xp: 9, dropChance: 0.016,
    behavior: 'wanderer', radius: 13, scale: 1
  },
  gastly: {
    id: 'gastly', dex: 92, name: 'Gastly', types: ['ghost', 'poison'],
    hp: 27, speed: 92, damage: 8, xp: 9, dropChance: 0.016,
    behavior: 'chaser', radius: 13, scale: 1
  },
  haunter: {
    id: 'haunter', dex: 93, name: 'Haunter', types: ['ghost', 'poison'],
    hp: 40, speed: 100, damage: 9, xp: 12, dropChance: 0.016,
    behavior: 'chaser', radius: 15, scale: 1.15
  },
  cubone: {
    id: 'cubone', dex: 104, name: 'Cubone', types: ['ground'],
    hp: 65, speed: 67, damage: 5, xp: 9, dropChance: 0.016,
    behavior: 'tank', radius: 15, scale: 1.1
  },
  venonat: {
    id: 'venonat', dex: 48, name: 'Venonat', types: ['bug', 'poison'],
    hp: 50, speed: 73, damage: 5, xp: 9, dropChance: 0.016,
    behavior: 'wanderer', radius: 13, scale: 1
  },
  pidgeotto: {
    id: 'pidgeotto', dex: 17, name: 'Pidgeotto', types: ['normal', 'flying'],
    hp: 53, speed: 112, damage: 6, xp: 10, dropChance: 0.022,
    behavior: 'swooper', radius: 15, scale: 1.15
  },
  ditto: {
    id: 'ditto', dex: 132, name: 'Ditto', types: ['normal'],
    hp: 43, speed: 74, damage: 5, xp: 8, dropChance: 0.016,
    behavior: 'chaser', radius: 13, scale: 1
  },
  rhyhorn: {
    id: 'rhyhorn', dex: 111, name: 'Rhyhorn', types: ['ground', 'rock'],
    hp: 79, speed: 62, damage: 7, xp: 10, dropChance: 0.016,
    behavior: 'tank', radius: 15, scale: 1.1
  },
  nidorino: {
    id: 'nidorino', dex: 33, name: 'Nidorino', types: ['poison'],
    hp: 53, speed: 84, damage: 6, xp: 10, dropChance: 0.016,
    behavior: 'chaser', radius: 15, scale: 1.15
  },
  nidorina: {
    id: 'nidorina', dex: 30, name: 'Nidorina', types: ['poison'],
    hp: 62, speed: 79, damage: 6, xp: 10, dropChance: 0.016,
    behavior: 'chaser', radius: 15, scale: 1.15
  },
  doduo: {
    id: 'doduo', dex: 84, name: 'Doduo', types: ['normal', 'flying'],
    hp: 36, speed: 114, damage: 7, xp: 9, dropChance: 0.022,
    behavior: 'swooper', radius: 13, scale: 1
  },
  koffing: {
    id: 'koffing', dex: 109, name: 'Koffing', types: ['poison'],
    hp: 61, speed: 67, damage: 6, xp: 10, dropChance: 0.016,
    behavior: 'tank', radius: 15, scale: 1.1
  },
  grimer: {
    id: 'grimer', dex: 88, name: 'Grimer', types: ['poison'],
    hp: 58, speed: 62, damage: 7, xp: 9, dropChance: 0.016,
    behavior: 'chaser', radius: 13, scale: 1
  },
  arbok: {
    id: 'arbok', dex: 24, name: 'Arbok', types: ['poison'],
    hp: 58, speed: 92, damage: 8, xp: 13, dropChance: 0.016,
    behavior: 'chaser', radius: 15, scale: 1.15
  },
  magneton: {
    id: 'magneton', dex: 82, name: 'Magneton', types: ['electric', 'steel'],
    hp: 65, speed: 86, damage: 10, xp: 13, dropChance: 0.016,
    behavior: 'chaser', radius: 15, scale: 1.15
  },
  fearow: {
    id: 'fearow', dex: 22, name: 'Fearow', types: ['normal', 'flying'],
    hp: 58, speed: 128, damage: 8, xp: 13, dropChance: 0.022,
    behavior: 'swooper', radius: 15, scale: 1.15
  },
  machoke: {
    id: 'machoke', dex: 67, name: 'Machoke', types: ['fighting'],
    hp: 68, speed: 73, damage: 8, xp: 12, dropChance: 0.016,
    behavior: 'chaser', radius: 15, scale: 1.15
  },
  slowpoke: {
    id: 'slowpoke', dex: 79, name: 'Slowpoke', types: ['water', 'psychic'],
    hp: 70, speed: 56, damage: 6, xp: 9, dropChance: 0.016,
    behavior: 'chaser', radius: 13, scale: 1
  },
  kadabra: {
    id: 'kadabra', dex: 64, name: 'Kadabra', types: ['psychic'],
    hp: 32, speed: 106, damage: 10, xp: 11, dropChance: 0.016,
    behavior: 'chaser', radius: 15, scale: 1.15
  },
  staryu: {
    id: 'staryu', dex: 120, name: 'Staryu', types: ['water'],
    hp: 38, speed: 95, damage: 6, xp: 10, dropChance: 0.016,
    behavior: 'chaser', radius: 13, scale: 1
  },
  seel: {
    id: 'seel', dex: 86, name: 'Seel', types: ['water'],
    hp: 54, speed: 73, damage: 5, xp: 9, dropChance: 0.016,
    behavior: 'chaser', radius: 13, scale: 1
  },
  ponyta: {
    id: 'ponyta', dex: 77, name: 'Ponyta', types: ['fire'],
    hp: 47, speed: 98, damage: 7, xp: 12, dropChance: 0.016,
    behavior: 'chaser', radius: 13, scale: 1
  },
  vulpix: {
    id: 'vulpix', dex: 37, name: 'Vulpix', types: ['fire'],
    hp: 35, speed: 84, damage: 5, xp: 9, dropChance: 0.016,
    behavior: 'chaser', radius: 13, scale: 1
  },
  golduck: {
    id: 'golduck', dex: 55, name: 'Golduck', types: ['water'],
    hp: 71, speed: 95, damage: 8, xp: 14, dropChance: 0.016,
    behavior: 'chaser', radius: 15, scale: 1.15
  },
  sandslash: {
    id: 'sandslash', dex: 28, name: 'Sandslash', types: ['ground'],
    hp: 83, speed: 84, damage: 8, xp: 13, dropChance: 0.016,
    behavior: 'chaser', radius: 15, scale: 1.15
  },
  jynx: {
    id: 'jynx', dex: 124, name: 'Jynx', types: ['ice', 'psychic'],
    hp: 45, speed: 100, damage: 9, xp: 13, dropChance: 0.016,
    behavior: 'chaser', radius: 15, scale: 1.15
  },
  dratini: {
    id: 'dratini', dex: 147, name: 'Dratini', types: ['dragon'],
    hp: 39, speed: 76, damage: 6, xp: 9, dropChance: 0.016,
    behavior: 'chaser', radius: 13, scale: 1
  },
  dragonair: {
    id: 'dragonair', dex: 148, name: 'Dragonair', types: ['dragon'],
    hp: 57, speed: 86, damage: 7, xp: 12, dropChance: 0.016,
    behavior: 'chaser', radius: 15, scale: 1.15
  },
  seadra: {
    id: 'seadra', dex: 117, name: 'Seadra', types: ['water'],
    hp: 68, speed: 95, damage: 8, xp: 13, dropChance: 0.016,
    behavior: 'chaser', radius: 15, scale: 1.15
  },
  kingler: {
    id: 'kingler', dex: 99, name: 'Kingler', types: ['water'],
    hp: 76, speed: 89, damage: 10, xp: 14, dropChance: 0.016,
    behavior: 'chaser', radius: 15, scale: 1.15
  },
  dugtrio_elite: {
    id: 'dugtrio_elite', dex: 51, name: 'Dugtrio', types: ['ground'],
    hp: 380, speed: 110, damage: 14, xp: 42, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  electrode_elite: {
    id: 'electrode_elite', dex: 101, name: 'Electrode', types: ['electric'],
    hp: 580, speed: 110, damage: 12, xp: 49, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  raichu_elite: {
    id: 'raichu_elite', dex: 26, name: 'Raichu', types: ['electric'],
    hp: 520, speed: 108, damage: 13, xp: 48, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  onix_elite: {
    id: 'onix_elite', dex: 95, name: 'Onix', types: ['rock', 'ground'],
    hp: 880, speed: 86, damage: 8, xp: 38, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  persian_elite: {
    id: 'persian_elite', dex: 53, name: 'Persian', types: ['normal'],
    hp: 560, speed: 110, damage: 11, xp: 44, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  ninetales_elite: {
    id: 'ninetales_elite', dex: 38, name: 'Ninetales', types: ['fire'],
    hp: 670, speed: 103, damage: 12, xp: 50, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  marowak_elite: {
    id: 'marowak_elite', dex: 105, name: 'Marowak', types: ['ground'],
    hp: 760, speed: 73, damage: 12, xp: 42, dropChance: 0.25,
    behavior: 'tank', radius: 22, scale: 1.5, elite: true
  },
  kangaskhan_elite: {
    id: 'kangaskhan_elite', dex: 115, name: 'Kangaskhan', types: ['normal'],
    hp: 830, speed: 98, damage: 14, xp: 49, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  tauros_elite: {
    id: 'tauros_elite', dex: 128, name: 'Tauros', types: ['normal'],
    hp: 760, speed: 108, damage: 14, xp: 49, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  scyther_elite: {
    id: 'scyther_elite', dex: 123, name: 'Scyther', types: ['bug', 'flying'],
    hp: 680, speed: 131, damage: 15, xp: 50, dropChance: 0.25,
    behavior: 'swooper', radius: 19, scale: 1.5, elite: true
  },
  weezing_elite: {
    id: 'weezing_elite', dex: 110, name: 'Weezing', types: ['poison'],
    hp: 830, speed: 81, damage: 13, xp: 49, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  electabuzz_elite: {
    id: 'electabuzz_elite', dex: 125, name: 'Electabuzz', types: ['electric'],
    hp: 550, speed: 106, damage: 14, xp: 49, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  dodrio_elite: {
    id: 'dodrio_elite', dex: 85, name: 'Dodrio', types: ['normal', 'flying'],
    hp: 580, speed: 134, damage: 15, xp: 47, dropChance: 0.25,
    behavior: 'swooper', radius: 19, scale: 1.5, elite: true
  },
  hypno_elite: {
    id: 'hypno_elite', dex: 97, name: 'Hypno', types: ['psychic'],
    hp: 700, speed: 85, damage: 11, xp: 48, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  muk_elite: {
    id: 'muk_elite', dex: 89, name: 'Muk', types: ['poison'],
    hp: 810, speed: 76, damage: 14, xp: 50, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  tentacruel_elite: {
    id: 'tentacruel_elite', dex: 73, name: 'Tentacruel', types: ['water', 'poison'],
    hp: 650, speed: 103, damage: 12, xp: 52, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  dewgong_elite: {
    id: 'dewgong_elite', dex: 87, name: 'Dewgong', types: ['water', 'ice'],
    hp: 760, speed: 86, damage: 11, xp: 48, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  cloyster_elite: {
    id: 'cloyster_elite', dex: 91, name: 'Cloyster', types: ['water', 'ice'],
    hp: 1040, speed: 86, damage: 14, xp: 52, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  magmar_elite: {
    id: 'magmar_elite', dex: 126, name: 'Magmar', types: ['fire'],
    hp: 550, speed: 99, damage: 14, xp: 50, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  rapidash_elite: {
    id: 'rapidash_elite', dex: 78, name: 'Rapidash', types: ['fire'],
    hp: 610, speed: 106, damage: 14, xp: 50, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  rhydon_elite: {
    id: 'rhydon_elite', dex: 112, name: 'Rhydon', types: ['ground', 'rock'],
    hp: 1010, speed: 70, damage: 17, xp: 48, dropChance: 0.25,
    behavior: 'tank', radius: 22, scale: 1.5, elite: true
  },
  nidoking_elite: {
    id: 'nidoking_elite', dex: 34, name: 'Nidoking', types: ['poison', 'ground'],
    hp: 710, speed: 95, damage: 14, xp: 50, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  nidoqueen_elite: {
    id: 'nidoqueen_elite', dex: 31, name: 'Nidoqueen', types: ['poison', 'ground'],
    hp: 800, speed: 90, damage: 13, xp: 50, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  slowbro_elite: {
    id: 'slowbro_elite', dex: 80, name: 'Slowbro', types: ['water', 'psychic'],
    hp: 920, speed: 64, damage: 14, xp: 49, dropChance: 0.25,
    behavior: 'tank', radius: 22, scale: 1.5, elite: true
  },
  lapras_elite: {
    id: 'lapras_elite', dex: 131, name: 'Lapras', types: ['water', 'ice'],
    hp: 940, speed: 81, damage: 12, xp: 54, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  hitmonlee_elite: {
    id: 'hitmonlee_elite', dex: 106, name: 'Hitmonlee', types: ['fighting'],
    hp: 460, speed: 96, damage: 16, xp: 46, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  hitmonchan_elite: {
    id: 'hitmonchan_elite', dex: 107, name: 'Hitmonchan', types: ['fighting'],
    hp: 580, speed: 90, damage: 14, xp: 46, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  machamp_elite: {
    id: 'machamp_elite', dex: 68, name: 'Machamp', types: ['fighting'],
    hp: 760, speed: 78, damage: 17, xp: 50, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  gengar_elite: {
    id: 'gengar_elite', dex: 94, name: 'Gengar', types: ['ghost', 'poison'],
    hp: 540, speed: 108, damage: 17, xp: 50, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  gyarados_elite: {
    id: 'gyarados_elite', dex: 130, name: 'Gyarados', types: ['water', 'flying'],
    hp: 780, speed: 118, damage: 16, xp: 54, dropChance: 0.25,
    behavior: 'swooper', radius: 19, scale: 1.5, elite: true
  },
  aerodactyl_elite: {
    id: 'aerodactyl_elite', dex: 142, name: 'Aerodactyl', types: ['rock', 'flying'],
    hp: 650, speed: 135, damage: 14, xp: 52, dropChance: 0.25,
    behavior: 'swooper', radius: 19, scale: 1.5, elite: true
  },
  golduck_elite: {
    id: 'golduck_elite', dex: 55, name: 'Golduck', types: ['water'],
    hp: 710, speed: 95, damage: 14, xp: 50, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  arbok_elite: {
    id: 'arbok_elite', dex: 24, name: 'Arbok', types: ['poison'],
    hp: 580, speed: 92, damage: 14, xp: 45, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  venomoth_elite: {
    id: 'venomoth_elite', dex: 49, name: 'Venomoth', types: ['bug', 'poison'],
    hp: 580, speed: 98, damage: 13, xp: 45, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  magneton_elite: {
    id: 'magneton_elite', dex: 82, name: 'Magneton', types: ['electric', 'steel'],
    hp: 650, speed: 86, damage: 16, xp: 46, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  kadabra_elite: {
    id: 'kadabra_elite', dex: 64, name: 'Kadabra', types: ['psychic'],
    hp: 320, speed: 106, damage: 16, xp: 40, dropChance: 0.25,
    behavior: 'chaser', radius: 19, scale: 1.5, elite: true
  },
  lt_surge_voltorb: {
    id: 'lt_surge_voltorb', dex: 100, name: 'Voltorb do Lt. Surge', types: ['electric'], level: 21,
    hp: 6100, speed: 112, damage: 26, xp: 294, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Lt. Surge',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'voltorb', count: 3, interval: 10 }
  },
  lt_surge_pikachu: {
    id: 'lt_surge_pikachu', dex: 25, name: 'Pikachu do Lt. Surge', types: ['electric'], level: 18,
    hp: 5200, speed: 108, damage: 22, xp: 252, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Lt. Surge',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'voltorb', count: 3, interval: 10 }
  },
  lt_surge_raichu: {
    id: 'lt_surge_raichu', dex: 26, name: 'Raichu do Lt. Surge', types: ['electric'], level: 24,
    hp: 10500, speed: 116, damage: 34, xp: 571, dropChance: 1,
    behavior: 'boss', radius: 38, scale: 3.2, boss: true, ace: true,
    leader: 'Lt. Surge',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'voltorb', count: 4, interval: 9 }
  },
  erika_victreebel: {
    id: 'erika_victreebel', dex: 71, name: 'Victreebel da Erika', types: ['grass', 'poison'], level: 29,
    hp: 9500, speed: 99, damage: 34, xp: 406, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Erika',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'gloom', count: 3, interval: 10 }
  },
  erika_tangela: {
    id: 'erika_tangela', dex: 114, name: 'Tangela da Erika', types: ['grass'], level: 24,
    hp: 7900, speed: 95, damage: 28, xp: 336, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Erika',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'gloom', count: 3, interval: 10 }
  },
  erika_vileplume: {
    id: 'erika_vileplume', dex: 45, name: 'Vileplume da Erika', types: ['grass', 'poison'], level: 29,
    hp: 14200, speed: 91, damage: 39, xp: 690, dropChance: 1,
    behavior: 'boss', radius: 38, scale: 3.2, boss: true, ace: true,
    leader: 'Erika',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'gloom', count: 4, interval: 9 }
  },
  koga_koffing: {
    id: 'koga_koffing', dex: 109, name: 'Koffing do Koga', types: ['poison'], level: 37,
    hp: 10800, speed: 85, damage: 33, xp: 518, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Koga',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'koffing', count: 3, interval: 10 }
  },
  koga_muk: {
    id: 'koga_muk', dex: 89, name: 'Muk do Koga', types: ['poison'], level: 39,
    hp: 11300, speed: 91, damage: 34, xp: 546, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Koga',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'koffing', count: 3, interval: 10 }
  },
  koga_weezing: {
    id: 'koga_weezing', dex: 110, name: 'Weezing do Koga', types: ['poison'], level: 43,
    hp: 18800, speed: 95, damage: 44, xp: 1023, dropChance: 1,
    behavior: 'boss', radius: 38, scale: 3.2, boss: true, ace: true,
    leader: 'Koga',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'koffing', count: 4, interval: 9 }
  },
  sabrina_kadabra: {
    id: 'sabrina_kadabra', dex: 64, name: 'Kadabra da Sabrina', types: ['psychic'], level: 38,
    hp: 13700, speed: 114, damage: 37, xp: 532, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Sabrina',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'drowzee', count: 3, interval: 10 }
  },
  sabrina_mr_mime: {
    id: 'sabrina_mr_mime', dex: 122, name: 'Mr. Mime da Sabrina', types: ['psychic', 'fairy'], level: 37,
    hp: 13300, speed: 108, damage: 36, xp: 518, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Sabrina',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'drowzee', count: 3, interval: 10 }
  },
  sabrina_venomoth: {
    id: 'sabrina_venomoth', dex: 49, name: 'Venomoth da Sabrina', types: ['bug', 'poison'], level: 38,
    hp: 13700, speed: 108, damage: 37, xp: 532, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Sabrina',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'drowzee', count: 3, interval: 10 }
  },
  sabrina_alakazam: {
    id: 'sabrina_alakazam', dex: 65, name: 'Alakazam da Sabrina', types: ['psychic'], level: 43,
    hp: 23200, speed: 120, damage: 48, xp: 1023, dropChance: 1,
    behavior: 'boss', radius: 38, scale: 3.2, boss: true, ace: true,
    leader: 'Sabrina',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'drowzee', count: 4, interval: 9 }
  },
  blaine_growlithe: {
    id: 'blaine_growlithe', dex: 58, name: 'Growlithe do Blaine', types: ['fire'], level: 42,
    hp: 17000, speed: 95, damage: 41, xp: 588, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Blaine',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'ponyta', count: 3, interval: 10 }
  },
  blaine_ponyta: {
    id: 'blaine_ponyta', dex: 77, name: 'Ponyta do Blaine', types: ['fire'], level: 40,
    hp: 16200, speed: 108, damage: 39, xp: 560, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Blaine',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'ponyta', count: 3, interval: 10 }
  },
  blaine_rapidash: {
    id: 'blaine_rapidash', dex: 78, name: 'Rapidash do Blaine', types: ['fire'], level: 42,
    hp: 17000, speed: 114, damage: 41, xp: 588, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Blaine',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'ponyta', count: 3, interval: 10 }
  },
  blaine_arcanine: {
    id: 'blaine_arcanine', dex: 59, name: 'Arcanine do Blaine', types: ['fire'], level: 47,
    hp: 28500, speed: 110, damage: 53, xp: 1119, dropChance: 1,
    behavior: 'boss', radius: 38, scale: 3.2, boss: true, ace: true,
    leader: 'Blaine',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'ponyta', count: 4, interval: 9 }
  },
  giovanni_rhyhorn: {
    id: 'giovanni_rhyhorn', dex: 111, name: 'Rhyhorn do Giovanni', types: ['ground', 'rock'], level: 45,
    hp: 20700, speed: 80, damage: 45, xp: 630, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Giovanni',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'rhyhorn', count: 3, interval: 10 }
  },
  giovanni_dugtrio: {
    id: 'giovanni_dugtrio', dex: 51, name: 'Dugtrio do Giovanni', types: ['ground'], level: 42,
    hp: 19300, speed: 120, damage: 42, xp: 588, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Giovanni',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'rhyhorn', count: 3, interval: 10 }
  },
  giovanni_nidoqueen: {
    id: 'giovanni_nidoqueen', dex: 31, name: 'Nidoqueen do Giovanni', types: ['poison', 'ground'], level: 44,
    hp: 20200, speed: 102, damage: 44, xp: 616, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Giovanni',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'rhyhorn', count: 3, interval: 10 }
  },
  giovanni_nidoking: {
    id: 'giovanni_nidoking', dex: 34, name: 'Nidoking do Giovanni', types: ['poison', 'ground'], level: 45,
    hp: 20700, speed: 106, damage: 45, xp: 630, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Giovanni',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'rhyhorn', count: 3, interval: 10 }
  },
  giovanni_rhyhorn_ace: {
    id: 'giovanni_rhyhorn_ace', dex: 111, name: 'Rhyhorn do Giovanni', types: ['ground', 'rock'], level: 50,
    hp: 34500, speed: 80, damage: 57, xp: 1190, dropChance: 1,
    behavior: 'boss', radius: 38, scale: 3.2, boss: true, ace: true,
    leader: 'Giovanni',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'rhyhorn', count: 4, interval: 9 }
  },
  lorelei_dewgong: {
    id: 'lorelei_dewgong', dex: 87, name: 'Dewgong da Lorelei', types: ['water', 'ice'], level: 52,
    hp: 26000, speed: 99, damage: 52, xp: 728, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Lorelei',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'seel', count: 3, interval: 10 }
  },
  lorelei_cloyster: {
    id: 'lorelei_cloyster', dex: 91, name: 'Cloyster da Lorelei', types: ['water', 'ice'], level: 51,
    hp: 25500, speed: 99, damage: 51, xp: 714, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Lorelei',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'seel', count: 3, interval: 10 }
  },
  lorelei_slowbro: {
    id: 'lorelei_slowbro', dex: 80, name: 'Slowbro da Lorelei', types: ['water', 'psychic'], level: 52,
    hp: 26000, speed: 83, damage: 52, xp: 728, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Lorelei',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'seel', count: 3, interval: 10 }
  },
  lorelei_jynx: {
    id: 'lorelei_jynx', dex: 124, name: 'Jynx da Lorelei', types: ['ice', 'psychic'], level: 54,
    hp: 27000, speed: 110, damage: 54, xp: 756, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Lorelei',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'seel', count: 3, interval: 10 }
  },
  lorelei_lapras: {
    id: 'lorelei_lapras', dex: 131, name: 'Lapras da Lorelei', types: ['water', 'ice'], level: 54,
    hp: 40500, speed: 95, damage: 62, xp: 1285, dropChance: 1,
    behavior: 'boss', radius: 38, scale: 3.2, boss: true, ace: true,
    leader: 'Lorelei',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'seel', count: 4, interval: 9 }
  },
  bruno_onix: {
    id: 'bruno_onix', dex: 95, name: 'Onix do Bruno', types: ['rock', 'ground'], level: 51,
    hp: 27300, speed: 99, damage: 52, xp: 714, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Bruno',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'machoke', count: 3, interval: 10 }
  },
  bruno_hitmonchan: {
    id: 'bruno_hitmonchan', dex: 107, name: 'Hitmonchan do Bruno', types: ['fighting'], level: 53,
    hp: 28400, speed: 102, damage: 54, xp: 742, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Bruno',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'machoke', count: 3, interval: 10 }
  },
  bruno_hitmonlee: {
    id: 'bruno_hitmonlee', dex: 106, name: 'Hitmonlee do Bruno', types: ['fighting'], level: 53,
    hp: 28400, speed: 107, damage: 54, xp: 742, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Bruno',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'machoke', count: 3, interval: 10 }
  },
  bruno_machamp: {
    id: 'bruno_machamp', dex: 68, name: 'Machamp do Bruno', types: ['fighting'], level: 56,
    hp: 45000, speed: 93, damage: 66, xp: 1333, dropChance: 1,
    behavior: 'boss', radius: 38, scale: 3.2, boss: true, ace: true,
    leader: 'Bruno',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'machoke', count: 4, interval: 9 }
  },
  agatha_gengar: {
    id: 'agatha_gengar', dex: 94, name: 'Gengar da Agatha', types: ['ghost', 'poison'], level: 54,
    hp: 30700, speed: 116, damage: 56, xp: 756, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Agatha',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'haunter', count: 3, interval: 10 }
  },
  agatha_golbat: {
    id: 'agatha_golbat', dex: 42, name: 'Golbat da Agatha', types: ['poison', 'flying'], level: 54,
    hp: 30700, speed: 108, damage: 56, xp: 756, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Agatha',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'haunter', count: 3, interval: 10 }
  },
  agatha_haunter: {
    id: 'agatha_haunter', dex: 93, name: 'Haunter da Agatha', types: ['ghost', 'poison'], level: 53,
    hp: 30200, speed: 110, damage: 55, xp: 742, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Agatha',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'haunter', count: 3, interval: 10 }
  },
  agatha_arbok: {
    id: 'agatha_arbok', dex: 24, name: 'Arbok da Agatha', types: ['poison'], level: 56,
    hp: 31900, speed: 104, damage: 58, xp: 784, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Agatha',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'haunter', count: 3, interval: 10 }
  },
  agatha_gengar_ace: {
    id: 'agatha_gengar_ace', dex: 94, name: 'Gengar da Agatha', types: ['ghost', 'poison'], level: 58,
    hp: 49500, speed: 116, damage: 69, xp: 1380, dropChance: 1,
    behavior: 'boss', radius: 38, scale: 3.2, boss: true, ace: true,
    leader: 'Agatha',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'haunter', count: 4, interval: 9 }
  },
  lance_gyarados: {
    id: 'lance_gyarados', dex: 130, name: 'Gyarados do Lance', types: ['water', 'flying'], level: 56,
    hp: 33600, speed: 104, damage: 59, xp: 784, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Lance',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'dragonair', count: 3, interval: 10 }
  },
  lance_dragonair: {
    id: 'lance_dragonair', dex: 148, name: 'Dragonair do Lance', types: ['dragon'], level: 54,
    hp: 32400, speed: 99, damage: 57, xp: 756, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Lance',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'dragonair', count: 3, interval: 10 }
  },
  lance_aerodactyl: {
    id: 'lance_aerodactyl', dex: 142, name: 'Aerodactyl do Lance', types: ['rock', 'flying'], level: 58,
    hp: 34800, speed: 125, damage: 61, xp: 812, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Lance',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'dragonair', count: 3, interval: 10 }
  },
  lance_dragonite: {
    id: 'lance_dragonite', dex: 149, name: 'Dragonite do Lance', types: ['dragon', 'flying'], level: 60,
    hp: 54000, speed: 104, damage: 72, xp: 1428, dropChance: 1,
    behavior: 'boss', radius: 38, scale: 3.2, boss: true, ace: true,
    leader: 'Lance',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'dragonair', count: 4, interval: 9 }
  },
  rival_pidgeot: {
    id: 'rival_pidgeot', dex: 18, name: 'Pidgeot do Rival', types: ['normal', 'flying'], level: 59,
    hp: 37500, speed: 112, damage: 62, xp: 826, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Rival',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'golduck', count: 3, interval: 10 }
  },
  rival_alakazam: {
    id: 'rival_alakazam', dex: 65, name: 'Alakazam do Rival', types: ['psychic'], level: 57,
    hp: 36200, speed: 120, damage: 60, xp: 798, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Rival',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'golduck', count: 3, interval: 10 }
  },
  rival_rhydon: {
    id: 'rival_rhydon', dex: 112, name: 'Rhydon do Rival', types: ['ground', 'rock'], level: 59,
    hp: 37500, speed: 87, damage: 62, xp: 826, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Rival',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'golduck', count: 3, interval: 10 }
  },
  rival_arcanine: {
    id: 'rival_arcanine', dex: 59, name: 'Arcanine do Rival', types: ['fire'], level: 59,
    hp: 37500, speed: 110, damage: 62, xp: 826, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Rival',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'golduck', count: 3, interval: 10 }
  },
  rival_exeggutor: {
    id: 'rival_exeggutor', dex: 103, name: 'Exeggutor do Rival', types: ['grass', 'psychic'], level: 61,
    hp: 38700, speed: 93, damage: 64, xp: 854, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Rival',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'golduck', count: 3, interval: 10 }
  },
  rival_blastoise: {
    id: 'rival_blastoise', dex: 9, name: 'Blastoise do Rival', types: ['water'], level: 63,
    hp: 60000, speed: 103, damage: 76, xp: 1499, dropChance: 1,
    behavior: 'boss', radius: 38, scale: 3.2, boss: true, ace: true,
    leader: 'Rival',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'golduck', count: 4, interval: 9 }
  },
  rival_gyarados: {
    id: 'rival_gyarados', dex: 130, name: 'Gyarados do Rival', types: ['water', 'flying'], level: 61,
    hp: 38700, speed: 104, damage: 64, xp: 854, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Rival',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'golduck', count: 3, interval: 10 }
  },
  rival_charizard: {
    id: 'rival_charizard', dex: 6, name: 'Charizard do Rival', types: ['fire', 'flying'], level: 63,
    hp: 60000, speed: 112, damage: 76, xp: 1499, dropChance: 1,
    behavior: 'boss', radius: 38, scale: 3.2, boss: true, ace: true,
    leader: 'Rival',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'golduck', count: 4, interval: 9 }
  },
  rival_venusaur: {
    id: 'rival_venusaur', dex: 3, name: 'Venusaur do Rival', types: ['grass', 'poison'], level: 63,
    hp: 60000, speed: 104, damage: 76, xp: 1499, dropChance: 1,
    behavior: 'boss', radius: 38, scale: 3.2, boss: true, ace: true,
    leader: 'Rival',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'golduck', count: 4, interval: 9 }
  },

  /* ============== O SALÃO DO KYOGRE (0.37, PLANEJAMENTO-DIVE seção 9) ==============
     As hordas de Hoenn (as dos níveis 5 e 6 da descida), os elites e o Kyogre. */
  carvanha: {
    id: 'carvanha', dex: 318, name: 'Carvanha', types: ['water', 'dark'],
    hp: 54, speed: 112, damage: 6, xp: 13, dropChance: 0.012,
    behavior: 'chaser', radius: 13, scale: 1
  },
  sharpedo: {
    id: 'sharpedo', dex: 319, name: 'Sharpedo', types: ['water', 'dark'],
    hp: 74, speed: 118, damage: 7, xp: 15, dropChance: 0.012,
    behavior: 'chaser', radius: 15, scale: 1.15
  },
  wailmer: {
    id: 'wailmer', dex: 320, name: 'Wailmer', types: ['water'],
    hp: 120, speed: 62, damage: 6, xp: 16, dropChance: 0.012,
    behavior: 'tank', radius: 18, scale: 1.2
  },
  crawdaunt: {
    id: 'crawdaunt', dex: 342, name: 'Crawdaunt', types: ['water', 'dark'],
    hp: 84, speed: 92, damage: 7, xp: 15, dropChance: 0.012,
    behavior: 'chaser', radius: 15, scale: 1.15
  },
  whiscash: {
    id: 'whiscash', dex: 340, name: 'Whiscash', types: ['water', 'ground'],
    hp: 104, speed: 74, damage: 6, xp: 15, dropChance: 0.012,
    behavior: 'tank', radius: 16, scale: 1.15
  },
  walrein: {
    id: 'walrein', dex: 365, name: 'Walrein', types: ['ice', 'water'],
    hp: 118, speed: 70, damage: 6, xp: 16, dropChance: 0.012,
    behavior: 'tank', radius: 17, scale: 1.2
  },
  huntail: {
    id: 'huntail', dex: 367, name: 'Huntail', types: ['water'],
    hp: 76, speed: 104, damage: 7, xp: 15, dropChance: 0.012,
    behavior: 'chaser', radius: 15, scale: 1.15
  },
  gorebyss: {
    id: 'gorebyss', dex: 368, name: 'Gorebyss', types: ['water'],
    hp: 72, speed: 104, damage: 6, xp: 15, dropChance: 0.012,
    behavior: 'chaser', radius: 15, scale: 1.15
  },
  relicanth: {
    id: 'relicanth', dex: 369, name: 'Relicanth', types: ['water', 'rock'],
    hp: 110, speed: 66, damage: 6, xp: 16, dropChance: 0.012,
    behavior: 'tank', radius: 16, scale: 1.15
  },
  milotic: {
    id: 'milotic', dex: 350, name: 'Milotic', types: ['water'],
    hp: 96, speed: 96, damage: 6, xp: 16, dropChance: 0.012,
    behavior: 'wanderer', radius: 16, scale: 1.2
  },
  sharpedo_elite: {
    id: 'sharpedo_elite', dex: 319, name: 'Sharpedo', types: ['water', 'dark'],
    hp: 760, speed: 124, damage: 11, xp: 55, dropChance: 0,
    behavior: 'swooper', radius: 20, scale: 1.6, elite: true
  },
  wailord_elite: {
    id: 'wailord_elite', dex: 321, name: 'Wailord', types: ['water'],
    hp: 1400, speed: 56, damage: 12, xp: 70, dropChance: 0,
    behavior: 'tank', radius: 30, scale: 2.2, elite: true
  },
  // o Kyogre: os ataques dele (Origin Pulse, Water Spout, Thunder, o mergulho, a horda)
  // são do systems/kyogreFight.js; `legendary` tira a rajada que todo líder tem
  kyogre_boss: {
    id: 'kyogre_boss', dex: 382, name: 'Kyogre', types: ['water'], level: 90,
    hp: 400000, speed: 50, damage: 55, xp: 2400, dropChance: 0,
    behavior: 'boss', radius: 56, scale: 3, boss: true, ace: true, legendary: true, enrageAt: 0.2,
    leader: 'Kyogre', abilities: []
  }
};

export const getEnemy = (id) => ENEMIES[id];
