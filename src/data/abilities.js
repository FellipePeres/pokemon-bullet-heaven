import { BONUS_MOVES } from './bonusMoves.js';

/**
 * HABILIDADES
 *
 * Toda habilidade é só dados. Quem executa é o AbilitySystem, que conhece
 * um conjunto pequeno de COMPORTAMENTOS genéricos:
 *
 *  projectile  — dispara projéteis em direção ao alvo (pode perfurar, explodir, perseguir)
 *  melee_arc   — golpe em arco perto do Pokémon
 *  orbit       — orbes girando em volta do Pokémon
 *  aura        — área permanente ao redor do Pokémon causando dano por tick
 *  ground_zone — deixa uma área no chão (no alvo) que dura alguns segundos
 *  nova        — onda de choque que se expande a partir do Pokémon
 *  chain       — raio instantâneo que salta entre inimigos
 *
 * Para criar uma habilidade nova, na maioria dos casos basta adicionar dados aqui.
 * Só é preciso tocar no AbilitySystem se o comportamento for realmente inédito.
 *
 * Campos de `base` (todos opcionais, dependem do comportamento):
 *   damage     dano por acerto/tick
 *   cooldown   segundos entre disparos
 *   count      quantidade de projéteis/orbes
 *   speed      velocidade do projétil (px/s)
 *   range      alcance de busca do alvo
 *   pierce     quantos inimigos o projétil atravessa
 *   size       raio de colisão do projétil (px)
 *   duration   tempo de vida do projétil/zona
 *   area       raio de área (aura, zona, nova, explosão)
 *   arc        abertura do golpe em arco (radianos)
 *   spread     abertura do leque de projéteis (radianos)
 *   tickRate   intervalo entre ticks de dano em áreas
 *   chains     saltos do raio
 *   knockback  empurrão aplicado ao inimigo
 *   homing     0..1 — força da perseguição do projétil
 */
export const ABILITIES = {
  /* ============================ INICIAIS ============================ */
  ember: {
    id: 'ember',
    name: 'Ember',
    type: 'fire',
    behavior: 'projectile',
    description: 'Lança uma pequena bola de fogo que queima o alvo.',
    base: {
      damage: 13, cooldown: 1.0, count: 1, speed: 340, range: 330,
      pierce: 0, size: 8, duration: 1.5, spread: 0.28, knockback: 30
    },
    effects: { burn: { dps: 4, duration: 2.5 } }
  },


  vine_whip: {
    id: 'vine_whip',
    name: 'Vine Whip',
    type: 'grass',
    behavior: 'melee_arc',
    description: 'Chicoteia vinhas em arco, acertando vários inimigos próximos.',
    base: { damage: 15, cooldown: 1.35, range: 138, arc: 1.4, knockback: 175, duration: 0.22 }
  },


  water_gun: {
    id: 'water_gun',
    name: 'Water Gun',
    type: 'water',
    behavior: 'projectile',
    description: 'Jato d\'água que atravessa inimigos, empurra e reduz a velocidade.',
    base: {
      damage: 18, cooldown: 1.05, count: 1, speed: 400, range: 340,
      pierce: 2, size: 10, duration: 1.4, spread: 0.2, knockback: 130
    },
    effects: { slow: { factor: 0.6, duration: 1.2 } }
  },



  /* =============== GOLPES BÁSICOS DE SELVAGENS =============== */
  quick_attack: {
    id: 'quick_attack',
    name: 'Quick Attack',
    type: 'normal',
    behavior: 'melee_arc',
    description: 'Investida rápida e curta em quem estiver colado.',
    base: { damage: 11, cooldown: 0.85, range: 112, arc: 1.5, knockback: 120, duration: 0.18 }
  },
  peck: {
    id: 'peck',
    name: 'Peck',
    type: 'flying',
    behavior: 'projectile',
    description: 'Bicadas rápidas à distância.',
    base: {
      damage: 10, cooldown: 0.8, count: 1, speed: 500, range: 300,
      pierce: 0, size: 6, duration: 1.1, spread: 0.2, knockback: 25
    }
  },
  string_shot: {
    id: 'string_shot',
    name: 'String Shot',
    type: 'bug',
    behavior: 'ground_zone',
    description: 'Teia no chão que prende e machuca aos poucos.',
    base: { damage: 5, cooldown: 2.4, area: 84, duration: 4, tickRate: 0.6, range: 280, count: 1 },
    effects: { slow: { factor: 0.45, duration: 1.4 } }
  },
  leech_life: {
    id: 'leech_life',
    name: 'Leech Life',
    type: 'bug',
    behavior: 'melee_arc',
    description: 'Mordida que drena a vida de quem chega perto.',
    base: { damage: 14, cooldown: 1.2, range: 120, arc: 1.3, knockback: 60, duration: 0.2 },
    effects: { poison: { dps: 3, duration: 2 } }
  },

  /* ======================= POKÉMON CAPTURÁVEIS ======================= */
  gust: {
    id: 'gust',
    name: 'Gust',
    type: 'flying',
    behavior: 'nova',
    description: 'Rajada circular que empurra tudo ao redor.',
    base: { damage: 14, cooldown: 2.6, area: 140, speed: 260, knockback: 220, size: 16 }
  },




  thunder_shock: {
    id: 'thunder_shock',
    name: 'Thunder Shock',
    type: 'electric',
    behavior: 'chain',
    description: 'Raio que salta entre inimigos próximos.',
    base: { damage: 17, cooldown: 1.7, chains: 3, range: 300, area: 170, duration: 0.18 },
    effects: { slow: { factor: 0.8, duration: 0.5 } }
  },

  rock_throw: {
    id: 'rock_throw',
    name: 'Rock Throw',
    type: 'rock',
    behavior: 'projectile',
    description: 'Pedra pesada que explode ao acertar o chão.',
    base: {
      damage: 22, cooldown: 2.0, count: 1, speed: 230, range: 300,
      pierce: 0, size: 11, duration: 1.8, spread: 0.2, knockback: 80,
      area: 64, explodeDamage: 0.6
    }
  },

  poison_sting: {
    id: 'poison_sting',
    name: 'Poison Sting',
    type: 'poison',
    behavior: 'projectile',
    description: 'Ferrões rápidos que envenenam.',
    base: {
      damage: 6, cooldown: 0.75, count: 2, speed: 460, range: 320,
      pierce: 0, size: 5, duration: 1.1, spread: 0.18, knockback: 10
    },
    effects: { poison: { dps: 4, duration: 3 } }
  },

  karate_chop: {
    id: 'karate_chop',
    name: 'Karate Chop',
    type: 'fighting',
    behavior: 'melee_arc',
    description: 'Golpe curto e devastador contra quem chega perto.',
    base: { damage: 34, cooldown: 1.6, range: 118, arc: 1.2, knockback: 230, duration: 0.2 }
  },

  confusion: {
    id: 'confusion',
    name: 'Confusion',
    type: 'psychic',
    behavior: 'projectile',
    description: 'Onda psíquica que persegue o alvo e o deixa lento.',
    base: {
      damage: 19, cooldown: 1.9, count: 1, speed: 260, range: 420,
      pierce: 2, size: 12, duration: 2.6, spread: 0.1, knockback: 40, homing: 0.75
    },
    effects: { slow: { factor: 0.6, duration: 1.4 } }
  },


  /* ===================== HABILIDADES DE TM =====================
     Versões avançadas que substituem a habilidade base do Pokémon.
     Ao aprender uma TM, as melhorias já investidas são transferidas
     (ver ProgressionSystem.learnTM), então trocar nunca é um downgrade.
     ============================================================ */
  flamethrower: {
    id: 'flamethrower',
    name: 'Flamethrower',
    type: 'fire',
    behavior: 'projectile',
    tier: 'tm',
    description: 'Jato contínuo de fogo que atravessa a horda e queima muito.',
    base: {
      damage: 32, cooldown: 0.95, count: 1, speed: 430, range: 380,
      pierce: 2, size: 13, duration: 1.6, spread: 0.22, knockback: 40
    },
    effects: { burn: { dps: 10, duration: 3 } }
  },

  ice_beam: {
    id: 'ice_beam',
    name: 'Ice Beam',
    type: 'ice',
    behavior: 'projectile',
    tier: 'tm',
    description: 'Raio congelante que atravessa inimigos e quase os paralisa.',
    base: {
      damage: 29, cooldown: 1.1, count: 1, speed: 520, range: 400,
      pierce: 3, size: 12, duration: 1.6, spread: 0.18, knockback: 30
    },
    effects: { slow: { factor: 0.35, duration: 2.2 } }
  },

  solar_beam: {
    id: 'solar_beam',
    name: 'Solar Beam',
    type: 'grass',
    behavior: 'projectile',
    tier: 'tm',
    description: 'Feixe solar devastador que varre uma linha inteira de inimigos.',
    base: {
      damage: 52, cooldown: 2.2, count: 1, speed: 560, range: 460,
      pierce: 6, size: 18, duration: 1.8, spread: 0.14, knockback: 90
    }
  },

  thunderbolt: {
    id: 'thunderbolt',
    name: 'Thunderbolt',
    type: 'electric',
    behavior: 'chain',
    tier: 'tm',
    description: 'Descarga que salta por muitos inimigos de uma vez.',
    base: { damage: 33, cooldown: 1.4, chains: 5, range: 360, area: 220, duration: 0.2 },
    effects: { slow: { factor: 0.7, duration: 0.8 } }
  },

  earthquake: {
    id: 'earthquake',
    name: 'Earthquake',
    type: 'ground',
    behavior: 'nova',
    tier: 'tm',
    description: 'Abala o chão inteiro ao redor, arremessando tudo para longe.',
    base: { damage: 46, cooldown: 2.8, area: 215, speed: 420, knockback: 300, size: 20 }
  },

  psychic_wave: {
    id: 'psychic_wave',
    name: 'Psychic',
    type: 'psychic',
    behavior: 'projectile',
    tier: 'tm',
    description: 'Ondas psíquicas que perseguem, atravessam e desorientam.',
    base: {
      damage: 38, cooldown: 1.5, count: 1, speed: 320, range: 480,
      pierce: 4, size: 16, duration: 2.8, spread: 0.1, knockback: 60, homing: 0.9
    },
    effects: { slow: { factor: 0.5, duration: 1.6 } }
  },

  toxic: {
    id: 'toxic',
    name: 'Toxic',
    type: 'poison',
    behavior: 'ground_zone',
    tier: 'tm',
    description: 'Poça tóxica persistente que corrói qualquer coisa que pise nela.',
    base: { damage: 13, cooldown: 2.4, area: 112, duration: 6, tickRate: 0.4, range: 340, count: 1 },
    effects: { poison: { dps: 16, duration: 4 }, slow: { factor: 0.6, duration: 1 } }
  },

  hyper_beam: {
    id: 'hyper_beam',
    name: 'Hyper Beam',
    type: 'normal',
    behavior: 'projectile',
    tier: 'tm',
    description: 'O golpe mais bruto que existe: atravessa tudo pela frente.',
    base: {
      damage: 68, cooldown: 3.1, count: 1, speed: 640, range: 480,
      pierce: 8, size: 20, duration: 1.7, spread: 0.12, knockback: 140
    }
  },

  /* ==================== GOLPES DE TM — NÍVEL 2 ====================
     Cada Pokémon tem uma linha própria de 3 golpes (ver `moveLine` em
     pokemon.js). A TM sobe o golpe atual para o próximo da linha DELE,
     então nada de Pidgey aprendendo Hyper Beam.
     ================================================================ */
  razor_leaf: {
    id: 'razor_leaf', name: 'Razor Leaf', type: 'grass', behavior: 'projectile', tier: 'tm',
    description: 'Folhas afiadas em leque que atravessam a horda.',
    base: {
      damage: 21, cooldown: 1.0, count: 3, speed: 430, range: 360,
      pierce: 2, size: 9, duration: 1.5, spread: 0.3, knockback: 40
    }
  },
  bubble_beam: {
    id: 'bubble_beam', name: 'Bubble Beam', type: 'water', behavior: 'projectile', tier: 'tm',
    description: 'Rajada de bolhas pressurizadas que atravessa e desacelera.',
    base: {
      damage: 26, cooldown: 0.95, count: 2, speed: 450, range: 370,
      pierce: 3, size: 11, duration: 1.5, spread: 0.24, knockback: 150
    },
    effects: { slow: { factor: 0.45, duration: 1.6 } }
  },
  water_pulse: {
    id: 'water_pulse', name: 'Water Pulse', type: 'water', behavior: 'nova', tier: 'tm',
    description: 'Onda de choque aquática que empurra tudo ao redor.',
    base: { damage: 24, cooldown: 2.0, area: 175, speed: 340, knockback: 240, size: 18 },
    effects: { slow: { factor: 0.5, duration: 1.4 } }
  },
  wing_attack: {
    id: 'wing_attack', name: 'Wing Attack', type: 'flying', behavior: 'melee_arc', tier: 'tm',
    description: 'Golpe de asa em arco largo, empurrando quem está perto.',
    base: { damage: 26, cooldown: 0.95, range: 158, arc: 1.9, knockback: 210, duration: 0.2 }
  },
  hyper_fang: {
    id: 'hyper_fang', name: 'Hyper Fang', type: 'normal', behavior: 'melee_arc', tier: 'tm',
    description: 'Mordida brutal que arremessa o alvo para longe.',
    base: { damage: 38, cooldown: 1.05, range: 142, arc: 1.5, knockback: 260, duration: 0.2 }
  },
  bug_bite: {
    id: 'bug_bite', name: 'Bug Bite', type: 'bug', behavior: 'ground_zone', tier: 'tm',
    description: 'Enxame que fica no chão devorando quem entra.',
    base: { damage: 12, cooldown: 2.0, area: 108, duration: 5, tickRate: 0.45, range: 320, count: 1 },
    effects: { slow: { factor: 0.5, duration: 1.2 } }
  },
  twineedle: {
    id: 'twineedle', name: 'Twineedle', type: 'bug', behavior: 'projectile', tier: 'tm',
    description: 'Ferrões duplos rápidos que envenenam com força.',
    base: {
      damage: 15, cooldown: 0.6, count: 3, speed: 520, range: 340,
      pierce: 1, size: 7, duration: 1.2, spread: 0.2, knockback: 25
    },
    effects: { poison: { dps: 9, duration: 3 } }
  },
  poison_fang: {
    id: 'poison_fang', name: 'Poison Fang', type: 'poison', behavior: 'melee_arc', tier: 'tm',
    description: 'Presas que injetam uma dose pesada de veneno.',
    base: { damage: 28, cooldown: 1.15, range: 140, arc: 1.5, knockback: 130, duration: 0.2 },
    effects: { poison: { dps: 14, duration: 4 } }
  },
  mega_drain: {
    id: 'mega_drain', name: 'Mega Drain', type: 'grass', behavior: 'aura', tier: 'tm',
    description: 'Campo que suga a energia de tudo ao redor sem parar.',
    base: { damage: 13, area: 122, tickRate: 0.4 },
    effects: { poison: { dps: 7, duration: 2.5 } }
  },
  rock_slide: {
    id: 'rock_slide', name: 'Rock Slide', type: 'rock', behavior: 'projectile', tier: 'tm',
    description: 'Avalanche de pedras que explode em área ao cair.',
    base: {
      damage: 34, cooldown: 1.5, count: 2, speed: 300, range: 340,
      pierce: 0, size: 13, duration: 1.8, spread: 0.35, knockback: 140,
      area: 92, explodeDamage: 0.7
    }
  },
  fire_spin: {
    id: 'fire_spin', name: 'Fire Spin', type: 'fire', behavior: 'orbit', tier: 'tm',
    description: 'Vórtice de fogo girando ao redor, prendendo quem encosta.',
    base: { damage: 20, count: 3, area: 96, size: 17, speed: 3.4, knockback: 80, tickRate: 0.35 },
    effects: { burn: { dps: 10, duration: 2.5 } }
  },
  psybeam: {
    id: 'psybeam', name: 'Psybeam', type: 'psychic', behavior: 'projectile', tier: 'tm',
    description: 'Feixe psíquico que persegue e atravessa os inimigos.',
    base: {
      damage: 27, cooldown: 1.3, count: 1, speed: 340, range: 440,
      pierce: 3, size: 14, duration: 2.4, spread: 0.12, knockback: 50, homing: 0.85
    },
    effects: { slow: { factor: 0.55, duration: 1.4 } }
  },
  seismic_toss: {
    id: 'seismic_toss', name: 'Seismic Toss', type: 'fighting', behavior: 'melee_arc', tier: 'tm',
    description: 'Arremessa os inimigos ao redor com força brutal.',
    base: { damage: 48, cooldown: 1.4, range: 140, arc: 1.5, knockback: 320, duration: 0.22 }
  },
  disarming_voice: {
    id: 'disarming_voice', name: 'Disarming Voice', type: 'fairy', behavior: 'nova', tier: 'tm',
    description: 'Onda sonora que atinge todo mundo ao redor.',
    base: { damage: 22, cooldown: 1.8, area: 185, speed: 400, knockback: 120, size: 16 },
    effects: { slow: { factor: 0.6, duration: 1.2 } }
  },

  /* ==================== GOLPES DE TM — NÍVEL 3 ==================== */
  fire_blast: {
    id: 'fire_blast', name: 'Fire Blast', type: 'fire', behavior: 'projectile', tier: 'tm3',
    description: 'Explosão de fogo que atravessa tudo e incendeia a área.',
    base: {
      damage: 58, cooldown: 1.5, count: 1, speed: 400, range: 420,
      pierce: 4, size: 20, duration: 1.9, spread: 0.18, knockback: 120,
      area: 110, explodeDamage: 0.8
    },
    effects: { burn: { dps: 22, duration: 4 } }
  },
  hydro_pump: {
    id: 'hydro_pump', name: 'Hydro Pump', type: 'water', behavior: 'projectile', tier: 'tm3',
    description: 'Jato de altíssima pressão que varre uma linha inteira.',
    base: {
      damage: 62, cooldown: 1.6, count: 1, speed: 620, range: 460,
      pierce: 8, size: 19, duration: 1.7, spread: 0.12, knockback: 260
    },
    effects: { slow: { factor: 0.45, duration: 1.5 } }
  },
  hurricane: {
    id: 'hurricane', name: 'Hurricane', type: 'flying', behavior: 'nova', tier: 'tm3',
    description: 'Tempestade que arremessa toda a horda para longe.',
    base: { damage: 52, cooldown: 2.4, area: 260, speed: 460, knockback: 420, size: 22 }
  },
  sludge_bomb: {
    id: 'sludge_bomb', name: 'Sludge Bomb', type: 'poison', behavior: 'projectile', tier: 'tm3',
    description: 'Bombas tóxicas que explodem e deixam veneno pesado.',
    base: {
      damage: 44, cooldown: 1.3, count: 2, speed: 380, range: 400,
      pierce: 1, size: 14, duration: 1.7, spread: 0.3, knockback: 90,
      area: 96, explodeDamage: 0.75
    },
    effects: { poison: { dps: 24, duration: 4 } }
  },
  thunder: {
    id: 'thunder', name: 'Thunder', type: 'electric', behavior: 'chain', tier: 'tm3',
    description: 'Tempestade elétrica que salta por metade da tela.',
    base: { damage: 56, cooldown: 1.5, chains: 8, range: 420, area: 280, duration: 0.22 },
    effects: { slow: { factor: 0.6, duration: 1 } }
  },
  cross_chop: {
    id: 'cross_chop', name: 'Cross Chop', type: 'fighting', behavior: 'melee_arc', tier: 'tm3',
    description: 'Golpe cruzado devastador em arco completo.',
    base: { damage: 86, cooldown: 1.3, range: 165, arc: 2.2, knockback: 340, duration: 0.24 }
  },
  hyper_voice: {
    id: 'hyper_voice', name: 'Hyper Voice', type: 'normal', behavior: 'nova', tier: 'tm3',
    description: 'Grito que sacode a arena inteira.',
    base: { damage: 46, cooldown: 1.7, area: 245, speed: 520, knockback: 220, size: 20 }
  },

  /* ============ TIPOS NOVOS: TERRA, FANTASMA, DRAGÃO E GELO ============
     No máximo 4 golpes por tipo (pedido do Fellipe na 0.6, para o jogo ficar
     leve no navegador): cada tipo tem um golpe de base, um de TM e um final,
     reaproveitados por todas as espécies daquele tipo. */
  mud_slap: {
    id: 'mud_slap',
    name: 'Mud-Slap',
    type: 'ground',
    behavior: 'projectile',
    description: 'Joga lama no alvo, que fica lento.',
    base: {
      damage: 14, cooldown: 1.0, count: 1, speed: 380, range: 320,
      pierce: 1, size: 9, duration: 1.3, spread: 0.25, knockback: 50
    },
    effects: { slow: { factor: 0.55, duration: 1.4 } }
  },
  bone_club: {
    id: 'bone_club',
    name: 'Bone Club',
    type: 'ground',
    behavior: 'projectile',
    tier: 'tm',
    description: 'Arremessa um osso girando que atravessa a fila de inimigos.',
    base: {
      damage: 30, cooldown: 1.1, count: 1, speed: 420, range: 360,
      pierce: 4, size: 12, duration: 1.5, spread: 0.2, knockback: 120
    }
  },
  lick: {
    id: 'lick',
    name: 'Lick',
    type: 'ghost',
    behavior: 'melee_arc',
    description: 'Uma lambida fantasmagórica que paralisa quem está perto.',
    base: { damage: 16, cooldown: 1.0, range: 120, arc: 1.4, knockback: 90, duration: 0.2 },
    effects: { slow: { factor: 0.55, duration: 1.2 } }
  },
  night_shade: {
    id: 'night_shade',
    name: 'Night Shade',
    type: 'ghost',
    behavior: 'chain',
    tier: 'tm',
    description: 'Uma sombra que salta de inimigo em inimigo.',
    base: { damage: 30, cooldown: 1.5, chains: 4, range: 340, area: 200, duration: 0.2 }
  },
  shadow_ball: {
    id: 'shadow_ball',
    name: 'Shadow Ball',
    type: 'ghost',
    behavior: 'projectile',
    tier: 'tm',
    description: 'Esfera de sombra que persegue o alvo e explode em área.',
    base: {
      damage: 52, cooldown: 1.4, count: 1, speed: 360, range: 440,
      pierce: 2, size: 18, duration: 2.2, spread: 0.15, knockback: 120,
      homing: 0.6, area: 96, explodeDamage: 0.6
    }
  },
  twister: {
    id: 'twister',
    name: 'Twister',
    type: 'dragon',
    behavior: 'nova',
    description: 'Um redemoinho de vento que se abre em volta do Pokémon.',
    base: { damage: 16, cooldown: 2.4, area: 150, speed: 280, knockback: 200, size: 16 }
  },
  dragon_breath: {
    id: 'dragon_breath',
    name: 'Dragon Breath',
    type: 'dragon',
    behavior: 'projectile',
    tier: 'tm',
    description: 'Sopro de dragão que atravessa inimigos e os deixa lentos.',
    base: {
      damage: 30, cooldown: 1.2, count: 1, speed: 400, range: 380,
      pierce: 3, size: 14, duration: 1.6, spread: 0.3, knockback: 80
    },
    effects: { slow: { factor: 0.6, duration: 1.2 } }
  },
  outrage: {
    id: 'outrage',
    name: 'Outrage',
    type: 'dragon',
    behavior: 'melee_arc',
    tier: 'tm',
    description: 'Fúria em arco largo que arremessa tudo em volta.',
    base: { damage: 80, cooldown: 1.25, range: 172, arc: 2.6, knockback: 360, duration: 0.26 }
  },
  powder_snow: {
    id: 'powder_snow',
    name: 'Powder Snow',
    type: 'ice',
    behavior: 'nova',
    description: 'Neve fina em volta do Pokémon, que deixa a horda lenta.',
    base: { damage: 12, cooldown: 2.2, area: 150, speed: 260, knockback: 80, size: 16 },
    effects: { slow: { factor: 0.5, duration: 1.6 } }
  },
  blizzard: {
    id: 'blizzard',
    name: 'Blizzard',
    type: 'ice',
    behavior: 'nova',
    tier: 'tm',
    description: 'Nevasca enorme que congela quase tudo na tela.',
    base: { damage: 50, cooldown: 2.6, area: 260, speed: 420, knockback: 260, size: 22 },
    effects: { slow: { factor: 0.4, duration: 2.2 } }
  },

  /* ======================= HABILIDADES DE INIMIGOS ======================= */
/** Golpes especiais dos líderes de ginásio (usados pelos chefes). */
  leader_rock_barrage: {
    id: 'leader_rock_barrage',
    name: 'Chuva de Pedras',
    type: 'rock',
    behavior: 'nova',
    description: 'Onda de pedras que percorre a arena.',
    base: { damage: 22, cooldown: 4.5, area: 250, speed: 340, knockback: 240, size: 20 },
    hostile: true
  },
  leader_whirlpool: {
    id: 'leader_whirlpool',
    name: 'Redemoinho',
    type: 'water',
    behavior: 'nova',
    description: 'Vórtice que empurra tudo ao redor.',
    base: { damage: 26, cooldown: 4, area: 230, speed: 380, knockback: 300, size: 20 },
    hostile: true
  },
  leader_barrage: {
    id: 'leader_barrage',
    name: 'Rajada',
    type: 'normal',
    behavior: 'projectile',
    description: 'Leque de projéteis na direção do treinador (o visual é do tipo do líder).',
    base: { damage: 12, cooldown: 3.4, count: 5, spread: 0.24, speed: 250, size: 14, duration: 3.4 },
    hostile: true
  },
  boss_shockwave: {
    id: 'boss_shockwave',
    name: 'Investida',
    type: 'normal',
    behavior: 'nova',
    description: 'Onda de choque do chefe.',
    base: { damage: 18, cooldown: 5, area: 190, speed: 300, knockback: 260, size: 18 },
    hostile: true
  }
};

// os 2º golpes (data/bonusMoves.js) ficam num registro à parte: não têm melhorias
export const getAbility = (id) => ABILITIES[id] ?? BONUS_MOVES[id];

/**
 * GOLPES QUE SAÍRAM na 0.6 (no máximo 4 por tipo). Saves antigos ainda podem
 * trazê-los: quem tinha recebe o golpe da mesma posição (`tier`: 0 base, 1 TM,
 * 2 final) na linha nova da espécie. Os três que eram o golpe extra dos
 * iniciais viram o extra novo (`extra`). As melhorias são transferidas.
 */
export const RETIRED_ABILITIES = {
  flame_wheel: { tier: 0 },
  bubble: { tier: 0 },
  splash: { tier: 0 },
  sing: { tier: 0 },
  acid: { tier: 0 },
  leech_field: { tier: 0, extra: 'mega_drain' },
  flail: { tier: 1 },
  air_cutter: { tier: 1 },
  petal_dance: { tier: 2 },
  drill_peck: { tier: 2 },
  fire_ring: { tier: 1, extra: 'fire_spin' },
  whirlpool: { tier: 1, extra: 'water_pulse' }
};
