/**
 * O 2º GOLPE (D11 do PLANEJAMENTO, aprovado pelo Fellipe na 0.13; feito na 0.14).
 *
 * Quando um Pokémon completa a chave do golpe dele (as 3 melhorias de
 * data/awakening.js no máximo; 0.28), cada nível que ele sobe tem 4% de chance
 * de despertar um golpe a mais (0.33; de 0.28 a 0.32 vinha na hora): do tipo
 * principal ou, em 1/3 das vezes, do secundário (CONFIG.bonusMove). Até a 0.27
 * era preciso ter todas as melhorias e contar com 2% por nível. Cada tipo tem 3
 * opções e ele recebe uma, ao acaso; um por Pokémon, para sempre. Ele mantém o
 * golpe de antes e passa a usar os dois.
 *
 * Os ids não podem repetir os de abilities.js nem os golpes que saíram
 * (RETIRED_ABILITIES): saves antigos ainda podem trazê-los.
 *
 * O formato é o de abilities.js (mesmos comportamentos), com o que é só daqui:
 *   - o dano por acerto é 60% do dano atual do golpe principal do Pokémon
 *     (`CONFIG.bonusMove.damageRatio`), vezes `hitScale` — menor para o que
 *     acerta muitas vezes (auras, órbitas), maior para o que é raro (meteoros);
 *   - não têm melhorias próprias;
 *   - curas (`lifesteal`, `healTeam`) passam por um teto por segundo, para não
 *     sobrar (pedido do Fellipe).
 *
 * Comportamentos novos (systems/AbilitySystem.js):
 *   rain      impactos que caem depois de um aviso: `target` 'nearest' (na horda
 *             mais perto, espalhados por `scatter`), 'random' (em inimigos ao
 *             acaso) ou 'strongest' (no de mais vida)
 *   trail     deixa áreas no chão por onde o Pokémon passa
 *   buff      sem dano direto: `buff` 'dance', 'reflect' ou 'phantom'
 *   reactive  uma onda que sai quando o Pokémon leva dano
 * e campos novos: `placement` ('far': longe do próprio Pokémon; 'around': em
 * volta dele), `pull` (puxa para o centro), `stack` (fica mais forte a cada
 * uso), `speedScale` (mais forte com o treinador correndo), `delayedBlast` (o
 * projétil gruda e explode depois) e os efeitos `weak` (o inimigo leva mais
 * dano) e `curse` (o inimigo explode ao morrer).
 */

const RADIAL = (count) => (Math.PI * 2) / count;

export const BONUS_MOVES = {
  /* ================================ Fogo ================================ */
  flame_ring: {
    id: 'flame_ring', name: 'Flame Wheel', type: 'fire', behavior: 'orbit',
    description: 'Um anel de chamas gira colado no Pokémon e queima quem encosta.',
    base: { count: 6, area: 58, size: 13, speed: 4, knockback: 60, tickRate: 0.4, hitScale: 0.5 },
    effects: { burn: { dps: 6, duration: 2 } }
  },
  heat_wave: {
    id: 'heat_wave', name: 'Heat Wave', type: 'fire', behavior: 'nova',
    description: 'De tempos em tempos, um círculo de fogo se abre em volta e deixa os atingidos queimando.',
    base: { cooldown: 3.2, area: 190, speed: 300, knockback: 120, hitScale: 1 },
    effects: { burn: { dps: 10, duration: 3 } }
  },
  flame_charge: {
    id: 'flame_charge', name: 'Flame Charge', type: 'fire', behavior: 'trail',
    description: 'Por onde o Pokémon passa, fica um rastro de brasas que queima quem pisa.',
    base: { cooldown: 0.3, area: 34, duration: 2.2, tickRate: 0.4, hitScale: 0.35 },
    effects: { burn: { dps: 6, duration: 2 } }
  },

  /* ================================ Água ================================ */
  whirlpool_zone: {
    id: 'whirlpool_zone', name: 'Whirlpool', type: 'water', behavior: 'ground_zone',
    description: 'Um redemoinho no meio da horda, longe do próprio Pokémon, puxa os inimigos para o centro.',
    base: { cooldown: 4, area: 120, duration: 3.5, tickRate: 0.45, range: 480, count: 1, hitScale: 0.45,
            placement: 'far', minDistance: 200, pull: 150 }
  },
  aqua_ring: {
    id: 'aqua_ring', name: 'Aqua Ring', type: 'water', behavior: 'orbit',
    description: 'Bolhas giram em volta, ferem quem encosta e cada acerto cura um pouco o Pokémon.',
    base: { count: 4, area: 70, size: 14, speed: 3, knockback: 40, tickRate: 0.45, hitScale: 0.5, lifesteal: 0.25 }
  },
  surf: {
    id: 'surf', name: 'Surf', type: 'water', behavior: 'projectile',
    description: 'Uma onda larga varre a frente e empurra a horda para longe.',
    base: { cooldown: 3.4, speed: 300, size: 46, pierce: 99, count: 1, spread: 0, range: 380, duration: 1.4,
            knockback: 320, hitScale: 1 }
  },

  /* =============================== Planta =============================== */
  petal_spiral: {
    id: 'petal_spiral', name: 'Petal Dance', type: 'grass', behavior: 'projectile',
    description: 'Folhas saem em espiral para todos os lados.',
    base: { cooldown: 2.6, count: 10, spread: RADIAL(10), speed: 260, size: 12, pierce: 1, range: 420,
            duration: 1.4, hitScale: 0.6 }
  },
  leech_seed: {
    id: 'leech_seed', name: 'Leech Seed', type: 'grass', behavior: 'nova',
    description: 'Planta sementes nos inimigos perto: elas drenam vida e curam o Pokémon, um pouco.',
    base: { cooldown: 3.6, area: 150, speed: 260, hitScale: 0.5, lifesteal: 0.3 },
    effects: { poison: { dps: 8, duration: 4 } }
  },
  grassy_terrain: {
    id: 'grassy_terrain', name: 'Grassy Terrain', type: 'grass', behavior: 'aura',
    description: 'O chão em volta vira grama: fere os inimigos e cura a equipe aos poucos.',
    base: { area: 110, tickRate: 0.6, hitScale: 0.35, healTeam: 0.006 }
  },

  /* ============================== Elétrico ============================== */
  discharge: {
    id: 'discharge', name: 'Discharge', type: 'electric', behavior: 'nova',
    description: 'Um pulso elétrico em toda a volta que paralisa (deixa lentos) os atingidos.',
    base: { cooldown: 3, area: 170, speed: 360, knockback: 80, hitScale: 1 },
    effects: { slow: { factor: 0.5, duration: 1.2 } }
  },
  bolt_strike: {
    id: 'bolt_strike', name: 'Bolt Strike', type: 'electric', behavior: 'rain',
    description: 'Raios caem do céu em inimigos ao acaso na tela.',
    base: { cooldown: 2.6, count: 3, area: 46, delay: 0.35, range: 560, target: 'random', hitScale: 1.2 }
  },
  spark: {
    id: 'spark', name: 'Spark', type: 'electric', behavior: 'orbit',
    description: 'Três esferas elétricas giram em volta e soltam faíscas em quem chega perto.',
    base: { count: 3, area: 80, size: 14, speed: 3.6, knockback: 60, tickRate: 0.5, hitScale: 0.6 },
    effects: { slow: { factor: 0.7, duration: 0.6 } }
  },

  /* ================================ Gelo ================================ */
  hail: {
    id: 'hail', name: 'Hail', type: 'ice', behavior: 'rain',
    description: 'Pedras de gelo caem em pontos ao acaso perto da horda e deixam os atingidos lentos.',
    base: { cooldown: 2.2, count: 5, area: 40, scatter: 120, delay: 0.5, range: 420, target: 'nearest', hitScale: 0.7 },
    effects: { slow: { factor: 0.6, duration: 1 } }
  },
  ice_shard: {
    id: 'ice_shard', name: 'Ice Shard', type: 'ice', behavior: 'projectile',
    description: 'Cristais de gelo em leque que congelam (deixam bem lentos).',
    base: { cooldown: 1.8, count: 5, spread: 0.22, speed: 420, size: 11, pierce: 1, range: 380, duration: 1, hitScale: 0.7 },
    effects: { slow: { factor: 0.35, duration: 1.6 } }
  },
  mist: {
    id: 'mist', name: 'Mist', type: 'ice', behavior: 'aura',
    description: 'Uma aura fria em volta desacelera muito quem entra.',
    base: { area: 120, tickRate: 0.6, hitScale: 0.25 },
    effects: { slow: { factor: 0.4, duration: 0.8 } }
  },

  /* =============================== Lutador ============================== */
  mach_punch: {
    id: 'mach_punch', name: 'Mach Punch', type: 'fighting', behavior: 'melee_arc',
    description: 'Um soco muito rápido no inimigo mais perto, a cada segundo, com empurrão forte.',
    base: { cooldown: 0.9, range: 110, arc: 0.9, knockback: 340, duration: 0.15, hitScale: 0.9 }
  },
  focus_blast: {
    id: 'focus_blast', name: 'Focus Blast', type: 'fighting', behavior: 'projectile',
    description: 'Carrega e solta uma esfera grande que explode em área.',
    base: { cooldown: 3.2, speed: 240, size: 22, pierce: 0, count: 1, range: 420, duration: 2, area: 120,
            explodeDamage: 1, hitScale: 1.4 }
  },
  counter: {
    id: 'counter', name: 'Counter', type: 'fighting', behavior: 'reactive',
    description: 'Quando o Pokémon leva dano, ele revida com uma onda de impacto.',
    base: { cooldown: 1.2, area: 150, speed: 420, knockback: 300, hitScale: 1.6 }
  },

  /* =============================== Venenoso ============================= */
  toxic_spikes: {
    id: 'toxic_spikes', name: 'Toxic Spikes', type: 'poison', behavior: 'ground_zone',
    description: 'Espalha armadilhas no chão em volta que envenenam quem pisa.',
    base: { cooldown: 3, count: 3, area: 46, duration: 6, tickRate: 0.5, range: 260, hitScale: 0.3, placement: 'around' },
    effects: { poison: { dps: 10, duration: 4 } }
  },
  smog: {
    id: 'smog', name: 'Smog', type: 'poison', behavior: 'aura',
    description: 'Uma nuvem tóxica segue o Pokémon e envenena tudo em volta.',
    base: { area: 105, tickRate: 0.6, hitScale: 0.3 },
    effects: { poison: { dps: 9, duration: 3 } }
  },
  acid_spray: {
    id: 'acid_spray', name: 'Acid Spray', type: 'poison', behavior: 'rain',
    description: 'Gotas de ácido caem nos inimigos: eles passam a levar mais dano por um tempo.',
    base: { cooldown: 2.8, count: 4, area: 50, delay: 0.4, range: 460, target: 'random', hitScale: 0.6 },
    effects: { weak: { amount: 0.25, duration: 4 }, poison: { dps: 6, duration: 2 } }
  },

  /* ============================== Terrestre ============================= */
  sand_tomb: {
    id: 'sand_tomb', name: 'Sand Tomb', type: 'ground', behavior: 'ground_zone',
    description: 'Prende os inimigos num redemoinho de areia: lentos e feridos.',
    base: { cooldown: 3.2, area: 100, duration: 3.5, tickRate: 0.45, range: 380, count: 1, hitScale: 0.4 },
    effects: { slow: { factor: 0.4, duration: 1 } }
  },
  bulldoze: {
    id: 'bulldoze', name: 'Bulldoze', type: 'ground', behavior: 'nova',
    description: 'De tempos em tempos o chão treme e fere todos na tela, um pouco.',
    base: { cooldown: 5, area: 720, speed: 900, knockback: 60, hitScale: 0.6 }
  },
  dig: {
    id: 'dig', name: 'Dig', type: 'ground', behavior: 'rain',
    description: 'O Pokémon some no chão e sai embaixo do inimigo mais forte, com um impacto em área.',
    base: { cooldown: 4, count: 1, area: 110, delay: 0.6, range: 600, target: 'strongest', knockback: 220,
            hitScale: 2.2, ownerBlink: true }
  },

  /* =============================== Voador =============================== */
  air_slash: {
    id: 'air_slash', name: 'Air Slash', type: 'flying', behavior: 'projectile',
    description: 'Lâminas de vento em linha que atravessam a horda.',
    base: { cooldown: 2, count: 3, spread: 0.12, speed: 520, size: 13, pierce: 6, range: 460, duration: 1, hitScale: 0.8 }
  },
  tailwind: {
    id: 'tailwind', name: 'Tailwind', type: 'flying', behavior: 'nova',
    description: 'Uma rajada empurra os inimigos para longe e acelera a equipe por alguns segundos.',
    base: { cooldown: 7, area: 210, speed: 420, knockback: 380, hitScale: 0.4, buff: 'tailwind', duration: 4 }
  },
  sky_attack: {
    id: 'sky_attack', name: 'Sky Attack', type: 'flying', behavior: 'projectile',
    description: 'Um mergulho em linha que acerta tudo no caminho.',
    base: { cooldown: 3.4, count: 1, speed: 720, size: 30, pierce: 99, range: 460, duration: 0.7, knockback: 200,
            hitScale: 1.5 }
  },

  /* ============================== Psíquico ============================== */
  psyshock: {
    id: 'psyshock', name: 'Psyshock', type: 'psychic', behavior: 'projectile',
    description: 'Orbes psíquicos que perseguem os inimigos sozinhos.',
    base: { cooldown: 1.6, count: 2, spread: 0.6, speed: 300, size: 13, pierce: 0, range: 460, duration: 2.4,
            homing: 6, hitScale: 0.9 }
  },
  reflect: {
    id: 'reflect', name: 'Reflect', type: 'psychic', behavior: 'buff',
    description: 'Uma barreira em volta da equipe: menos dano por alguns segundos, e os projéteis dos líderes perto somem.',
    base: { cooldown: 9, duration: 4, area: 240, buff: 'reflect' }
  },
  future_sight: {
    id: 'future_sight', name: 'Future Sight', type: 'psychic', behavior: 'rain',
    description: 'Marca um ponto na horda; segundos depois, uma explosão psíquica grande acontece ali.',
    base: { cooldown: 4.5, count: 1, area: 150, delay: 1.6, range: 480, target: 'nearest', knockback: 160, hitScale: 2.5 }
  },

  /* =============================== Inseto =============================== */
  bug_buzz: {
    id: 'bug_buzz', name: 'Bug Buzz', type: 'bug', behavior: 'orbit',
    description: 'Um enxame de insetinhos voa em volta e ataca quem chega perto.',
    base: { count: 5, area: 76, size: 10, speed: 4.5, knockback: 30, tickRate: 0.45, hitScale: 0.45 }
  },
  sticky_web: {
    id: 'sticky_web', name: 'Sticky Web', type: 'bug', behavior: 'ground_zone',
    description: 'Teias no chão que prendem os inimigos (bem lentos).',
    base: { cooldown: 3.4, area: 110, duration: 4, tickRate: 0.6, range: 380, count: 1, hitScale: 0.25 },
    effects: { slow: { factor: 0.25, duration: 1.2 } }
  },
  pin_missile: {
    id: 'pin_missile', name: 'Pin Missile', type: 'bug', behavior: 'projectile',
    description: 'Uma rajada de agulhas para todos os lados.',
    base: { cooldown: 2.2, count: 12, spread: RADIAL(12), speed: 420, size: 10, pierce: 0, range: 420, duration: 0.9,
            hitScale: 0.55 }
  },

  /* ================================ Pedra =============================== */
  stealth_rock: {
    id: 'stealth_rock', name: 'Stealth Rock', type: 'rock', behavior: 'orbit',
    description: 'Pedras pontudas giram em volta e acertam quem encosta.',
    base: { count: 3, area: 88, size: 16, speed: 2.6, knockback: 120, tickRate: 0.5, hitScale: 0.7 }
  },
  rock_tomb: {
    id: 'rock_tomb', name: 'Rock Tomb', type: 'rock', behavior: 'rain',
    description: 'Pedras caem do céu numa área perto da horda.',
    base: { cooldown: 3, count: 4, area: 52, scatter: 110, delay: 0.55, range: 420, target: 'nearest', knockback: 120,
            hitScale: 1 }
  },
  sandstorm: {
    id: 'sandstorm', name: 'Sandstorm', type: 'rock', behavior: 'aura',
    description: 'Uma tempestade de areia em volta fere tudo devagar.',
    base: { area: 140, tickRate: 0.7, hitScale: 0.3 }
  },

  /* ============================== Fantasma ============================== */
  hex: {
    id: 'hex', name: 'Hex', type: 'ghost', behavior: 'nova',
    description: 'Amaldiçoa os inimigos perto: quando um amaldiçoado morre, explode em fogo-fátuo nos vizinhos.',
    base: { cooldown: 3.4, area: 160, speed: 300, hitScale: 0.6 },
    effects: { curse: { area: 90, ratio: 1.2, duration: 5 } }
  },
  shadow_sneak: {
    id: 'shadow_sneak', name: 'Shadow Sneak', type: 'ghost', behavior: 'projectile',
    description: 'Uma sombra sai do Pokémon e persegue o inimigo mais perto.',
    base: { cooldown: 1.5, count: 1, speed: 340, size: 15, pierce: 0, range: 460, duration: 2.4, homing: 8, hitScale: 1.1 }
  },
  phantom_force: {
    id: 'phantom_force', name: 'Phantom Force', type: 'ghost', behavior: 'buff',
    description: 'O Pokémon fica intangível por um instante e fere quem estiver perto.',
    base: { cooldown: 6, duration: 1.6, area: 80, tickRate: 0.3, hitScale: 0.5, buff: 'phantom' }
  },

  /* =============================== Dragão =============================== */
  dragon_rage: {
    id: 'dragon_rage', name: 'Dragon Rage', type: 'dragon', behavior: 'melee_arc',
    description: 'Uma rajada de fogo de dragão em cone à frente.',
    base: { cooldown: 2.4, range: 170, arc: 1.1, knockback: 160, duration: 0.25, hitScale: 1.2 }
  },
  dragon_dance: {
    id: 'dragon_dance', name: 'Dragon Dance', type: 'dragon', behavior: 'buff',
    description: 'Por alguns segundos, os golpes do Pokémon ficam mais fortes e mais rápidos.',
    base: { cooldown: 10, duration: 5, buff: 'dance', damageMult: 1.3, cooldownMult: 0.75 }
  },
  draco_meteor: {
    id: 'draco_meteor', name: 'Draco Meteor', type: 'dragon', behavior: 'rain',
    description: 'Meteoros caem em pontos ao acaso, com dano alto.',
    base: { cooldown: 4.2, count: 3, area: 80, delay: 0.8, range: 560, target: 'random', knockback: 200, hitScale: 2 }
  },

  /* ================================ Fada ================================ */
  moonblast: {
    id: 'moonblast', name: 'Moonblast', type: 'fairy', behavior: 'projectile',
    description: 'Um orbe de luz que explode em área e encanta (deixa lentos) os inimigos.',
    base: { cooldown: 2.6, count: 1, speed: 280, size: 18, pierce: 0, range: 420, duration: 1.8, area: 100,
            explodeDamage: 0.8, hitScale: 1.2 },
    effects: { slow: { factor: 0.55, duration: 1.4 } }
  },
  misty_terrain: {
    id: 'misty_terrain', name: 'Misty Terrain', type: 'fairy', behavior: 'aura',
    description: 'Uma névoa rosa em volta que cura a equipe aos poucos.',
    base: { area: 120, tickRate: 0.8, hitScale: 0.15, healTeam: 0.008 }
  },
  draining_kiss: {
    id: 'draining_kiss', name: 'Draining Kiss', type: 'fairy', behavior: 'projectile',
    description: 'Corações perseguem inimigos e devolvem um pouco de vida ao Pokémon.',
    base: { cooldown: 1.8, count: 2, spread: 0.5, speed: 300, size: 13, pierce: 0, range: 440, duration: 2.2,
            homing: 6, hitScale: 0.8, lifesteal: 0.35 }
  },

  /* =============================== Normal =============================== */
  swift: {
    id: 'swift', name: 'Swift', type: 'normal', behavior: 'projectile',
    description: 'Estrelas que perseguem os inimigos e nunca erram.',
    base: { cooldown: 1.4, count: 3, spread: 0.4, speed: 360, size: 11, pierce: 0, range: 460, duration: 2.2,
            homing: 9, hitScale: 0.6 }
  },
  rapid_spin: {
    id: 'rapid_spin', name: 'Rapid Spin', type: 'normal', behavior: 'nova',
    description: 'O Pokémon gira e acerta tudo em volta, empurrando.',
    base: { cooldown: 1.6, area: 100, speed: 520, knockback: 300, hitScale: 0.7 }
  },
  echoed_voice: {
    id: 'echoed_voice', name: 'Echoed Voice', type: 'normal', behavior: 'nova',
    description: 'Uma onda sonora que fica mais forte a cada vez seguida.',
    base: { cooldown: 2.4, area: 170, speed: 330, knockback: 120, hitScale: 0.7, stack: { per: 0.2, max: 5 } }
  },

  /* ============================== Metálico ============================== */
  flash_cannon: {
    id: 'flash_cannon', name: 'Flash Cannon', type: 'steel', behavior: 'projectile',
    description: 'Um raio de luz em linha reta que atravessa tudo.',
    base: { cooldown: 2.8, count: 1, speed: 760, size: 18, pierce: 99, range: 520, duration: 0.8, hitScale: 1.4 }
  },
  gyro_ball: {
    id: 'gyro_ball', name: 'Gyro Ball', type: 'steel', behavior: 'orbit',
    description: 'Engrenagens giram em volta e ficam mais fortes quanto mais o treinador corre.',
    base: { count: 2, area: 84, size: 16, speed: 3, knockback: 120, tickRate: 0.45, hitScale: 0.6, speedScale: 1 }
  },
  magnet_bomb: {
    id: 'magnet_bomb', name: 'Magnet Bomb', type: 'steel', behavior: 'projectile',
    description: 'Bombas que grudam nos inimigos e explodem logo depois.',
    base: { cooldown: 2.6, count: 2, spread: 0.6, speed: 300, size: 12, pierce: 0, range: 460, duration: 2.4,
            homing: 7, hitScale: 0.6, delayedBlast: { area: 80, ratio: 1.2, delay: 0.9 } }
  }
};

/** Os 3 de cada tipo (Sombrio fica de fora: nenhuma das 151 é desse tipo). */
export const BONUS_BY_TYPE = {};
for (const move of Object.values(BONUS_MOVES)) (BONUS_BY_TYPE[move.type] ??= []).push(move.id);

export const isBonusMove = (id) => !!BONUS_MOVES[id];

/**
 * O nome que o jogador vê (0.16: "segundo golpe é muito feio, algo mais
 * impactante"). Padrão até o Fellipe decidir; trocar aqui troca em todo lugar.
 */
export const BONUS_MOVE_LABEL = 'Golpe Desperto';
