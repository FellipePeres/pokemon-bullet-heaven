/**
 * OS LENDÁRIOS (0.16, pedido do Fellipe: "naturalmente mais fortes, já vêm com
 * os atributos upados, até com segundo golpe, e o golpe primário é exclusivo
 * deles, único e visualmente muito bonito").
 *
 * Cada lendário tem:
 *   - um GOLPE EXCLUSIVO (LEGENDARY_MOVES): o golpe principal dele, que nenhum
 *     outro Pokémon aprende. É a linha de golpes inteira (`moveLine` de um
 *     golpe só): não há TM acima dele. Recebe melhorias como qualquer golpe
 *     (dano, recarga, área, quantidade — geradas em upgrades.js).
 *   - um KIT (LEGENDARY_KITS): ao entrar na equipe ele já chega com melhorias
 *     nesse golpe e com o 2º golpe aprendido, e entra no nível da média da
 *     equipe (os outros entram 3 abaixo).
 *
 * Os golpes usam o comportamento `signature` (systems/signatureMoves.js): cada
 * um tem a lógica e o desenho próprios (render/signature.js), feitos em código,
 * com brilho, partículas e fases (carga, disparo, impacto). O campo
 * `signature` diz qual deles é.
 *
 * Os ids não podem repetir os de abilities.js, os 2º golpes nem os que saíram.
 */
export const LEGENDARY_MOVES = {
  /* Articuno: o floco de neve gigante se forma em volta e estilhaça num anel de gelo. */
  sheer_cold: {
    id: 'sheer_cold', name: 'Sheer Cold', type: 'ice', behavior: 'signature', signature: 'sheer_cold',
    exclusive: 'articuno',
    description: 'Exclusivo do Articuno. Um floco de neve gigante se forma em volta e estilhaça num anel de gelo que congela a horda.',
    base: { damage: 82, cooldown: 3.0, area: 255, speed: 560, charge: 0.5, knockback: 160 },
    effects: { slow: { factor: 0.15, duration: 2.6 } }
  },

  /* Zapdos: uma esfera de trovão lenta que atravessa tudo e solta raios em volta. */
  zap_cannon: {
    id: 'zap_cannon', name: 'Zap Cannon', type: 'electric', behavior: 'signature', signature: 'zap_cannon',
    exclusive: 'zapdos',
    description: 'Exclusivo do Zapdos. Uma esfera de trovão atravessa a horda soltando raios em quem estiver perto e explode no fim.',
    base: { damage: 64, cooldown: 2.5, range: 420, speed: 175, size: 24, duration: 2.6, area: 150,
            chains: 3, tickRate: 0.22, knockback: 60 },
    effects: { slow: { factor: 0.5, duration: 1.1 } }
  },

  /* Moltres: as asas se abrem e penas de fogo saem em espiral; onde param, sobe uma coluna de chamas. */
  sacred_fire: {
    id: 'sacred_fire', name: 'Sacred Fire', type: 'fire', behavior: 'signature', signature: 'sacred_fire',
    exclusive: 'moltres',
    description: 'Exclusivo do Moltres. As asas se abrem e penas de fogo saem em espiral; onde elas param, sobe uma coluna de chamas.',
    base: { damage: 46, cooldown: 2.6, count: 10, speed: 310, size: 13, duration: 0.95, area: 78, range: 360,
            knockback: 50 },
    effects: { burn: { dps: 24, duration: 3.5 } }
  },

  /* Mewtwo: uma singularidade psíquica puxa a horda para um ponto e implode. */
  psystrike: {
    id: 'psystrike', name: 'Psystrike', type: 'psychic', behavior: 'signature', signature: 'psystrike',
    exclusive: 'mewtwo',
    description: 'Exclusivo do Mewtwo. Uma singularidade psíquica nasce no meio da horda, puxa todos para o centro e implode.',
    base: { damage: 108, cooldown: 3.0, range: 470, area: 175, duration: 1.0, tickRate: 0.15, pull: 240,
            knockback: 280 },
    effects: { slow: { factor: 0.5, duration: 1.5 } }
  },

  /* Mew: bolhas iridescentes, cada uma um golpe ao acaso, perseguem e estouram num arco-íris. */
  metronome: {
    id: 'metronome', name: 'Metronome', type: 'psychic', behavior: 'signature', signature: 'metronome',
    exclusive: 'mew',
    description: 'Exclusivo do Mew. Bolhas de arco-íris perseguem a horda; cada uma é um golpe ao acaso — fogo, gelo, trovão, veneno ou mente.',
    base: { damage: 44, cooldown: 2.1, count: 6, speed: 240, size: 15, duration: 3.2, area: 88, range: 460,
            knockback: 90 },
    // o que cada bolha pode ser: o tipo do dano, a cor e o efeito
    elements: [
      { type: 'fire', hue: 18, effects: { burn: { dps: 18, duration: 3 } } },
      { type: 'ice', hue: 190, effects: { slow: { factor: 0.3, duration: 2 } } },
      { type: 'electric', hue: 52, effects: { slow: { factor: 0.55, duration: 1 } } },
      { type: 'poison', hue: 285, effects: { poison: { dps: 18, duration: 3.5 } } },
      { type: 'psychic', hue: 330, effects: { weak: { amount: 0.25, duration: 3 } } }
    ]
  }
};

/**
 * O que cada lendário já traz ao entrar na equipe. `upgrades` usa o sufixo da
 * melhoria do golpe exclusivo (damage, cooldown, area, count): ele chega com
 * pelo menos essas pilhas. `bonusMove` é o 2º golpe (data/bonusMoves.js).
 */
export const LEGENDARY_KITS = {
  articuno: { move: 'sheer_cold', bonusMove: 'hail', upgrades: { damage: 2, cooldown: 1, area: 1 } },
  zapdos: { move: 'zap_cannon', bonusMove: 'bolt_strike', upgrades: { damage: 2, cooldown: 1, area: 1 } },
  moltres: { move: 'sacred_fire', bonusMove: 'heat_wave', upgrades: { damage: 2, cooldown: 1, count: 1 } },
  mewtwo: { move: 'psystrike', bonusMove: 'future_sight', upgrades: { damage: 2, cooldown: 1, area: 1 } },
  mew: { move: 'metronome', bonusMove: 'psyshock', upgrades: { damage: 2, cooldown: 1, count: 1 } }
};

/**
 * ONDE OS LENDÁRIOS APARECEM (0.18, pedido do Fellipe: "desde a fase 7, com
 * porcentagem baixa que vai escalando até a fase do campeão; só pode aparecer 1
 * de cada lendário na mesma run"). Padrão até o Fellipe decidir.
 *
 * Eles não estão nas tabelas de captura: cada Poké Ball destas fases faz um
 * sorteio à parte (systems/CaptureSystem.js). Com a `chance` da fase, uma das
 * opções vira um lendário, escolhido entre os de `pool` pelo peso
 * (LEGENDARY_WEIGHT). Não aparece:
 *   - um lendário que já está na equipe ou no PC da jornada (um de cada);
 *   - de novo, na mesma tentativa, um que já apareceu nela (mesmo recusado).
 *
 * Medido com o bot: ~1,6 Poké Ball por tentativa nas Fases 7 e 8, ~0,9 em cada
 * sala da Liga. Quem passa cada fase em ~1,5 tentativa vê algum lendário em
 * ~45% das jornadas (cada ave ~15–20%, Mewtwo ~3–4%, Mew ~1–2%).
 */
const BIRDS = ['articuno', 'zapdos', 'moltres'];
const ALL = [...BIRDS, 'mewtwo', 'mew'];

export const LEGENDARY_ENCOUNTERS = {
  gym_7_cinnabar: { chance: 0.02, pool: BIRDS },
  gym_8_viridian: { chance: 0.03, pool: BIRDS },
  e4_lorelei: { chance: 0.04, pool: ALL },
  e4_bruno: { chance: 0.05, pool: ALL },
  e4_agatha: { chance: 0.06, pool: ALL },
  e4_lance: { chance: 0.07, pool: ALL },
  champion: { chance: 0.10, pool: ALL }
};

/** Entre os lendários sorteados: as aves comuns, Mewtwo e Mew raros. */
export const LEGENDARY_WEIGHT = { articuno: 1, zapdos: 1, moltres: 1, mewtwo: 0.35, mew: 0.15 };

export const isLegendary = (pokemonId) => !!LEGENDARY_KITS[pokemonId];
export const isSignatureMove = (abilityId) => !!LEGENDARY_MOVES[abilityId];
