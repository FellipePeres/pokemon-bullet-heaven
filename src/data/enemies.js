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
    id: 'brock_geodude', dex: 74, name: 'Geodude do Brock', types: ['rock', 'ground'],
    hp: 2600, speed: 78, damage: 17, xp: 180, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Brock',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'geodude_wild', count: 2, interval: 11 }
  },
  brock_onix: {
    id: 'brock_onix', dex: 95, name: 'Onix do Brock', types: ['rock', 'ground'],
    hp: 5000, speed: 88, damage: 23, xp: 420, dropChance: 1,
    behavior: 'boss', radius: 40, scale: 3.4, boss: true, ace: true,
    leader: 'Brock',
    abilities: ['leader_rock_barrage', 'boss_shockwave'],
    summons: { enemy: 'geodude_wild', count: 3, interval: 10 }
  },

  misty_staryu: {
    id: 'misty_staryu', dex: 120, name: 'Staryu da Misty', types: ['water'],
    hp: 5000, speed: 106, damage: 21, xp: 260, dropChance: 1,
    behavior: 'boss', radius: 30, scale: 2.4, boss: true,
    leader: 'Misty',
    abilities: ['boss_shockwave'],
    summons: { enemy: 'horsea', count: 3, interval: 10 }
  },
  misty_starmie: {
    id: 'misty_starmie', dex: 121, name: 'Starmie da Misty', types: ['water', 'psychic'],
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
  }
};

export const getEnemy = (id) => ENEMIES[id];
