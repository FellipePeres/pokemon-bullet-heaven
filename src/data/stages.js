/**
 * FASES
 *
 * Uma FASE é a jornada inteira até um ginásio: você atravessa várias rotas
 * (os `segments`) enfrentando os Pokémon selvagens de cada trecho e, no fim,
 * encara o time do líder — um Pokémon de cada vez, terminando no ace dele.
 *
 * Tudo é configuração. Para criar a próxima fase, copie um bloco e ajuste;
 * nenhum código de gameplay precisa mudar.
 *
 *   duration       tempo (s) de travessia antes do líder aparecer
 *   segments       trechos da jornada: { from, name, theme } — mudam o cenário
 *                  e aparecem no HUD conforme você avança
 *   world          tamanho da arena
 *   scaling        o quanto os selvagens ficam mais fortes até o fim da fase
 *   waves          janelas de spawn: entre `from` e `to` segundos, spawna `batch`
 *                  inimigos a cada `interval` segundos, respeitando `maxAlive`
 *   elites         aparições pontuais de inimigos de elite
 *   leader         dados do líder do ginásio (nome, insígnia, fala)
 *   bossTeam       time do líder, enfrentado em sequência
 *   capturePool    id da tabela de chances de captura (data/capturePools.js)
 *   ballChance     multiplicador da chance de drop de Poké Ball
 *   maxBalls       teto de Poké Balls da fase (controla o ritmo das capturas)
 *   scriptedBalls  segundos em que uma Poké Ball aparece garantida
 *   reward         Shards ganhos ao concluir
 */
export const STAGES = {
  /* ============================================================
     FASE 1 — de Pallet até o Ginásio de Pewter (BROCK)
     ============================================================ */
  gym_1_pewter: {
    id: 'gym_1_pewter',
    name: 'Fase 1 — Rumo a Pewter',
    region: 'Kanto',
    type: 'gym',
    icon: 'tm-rock',
    description: 'Rota 1, Rota 2 e a Floresta de Viridian — até o Ginásio de Pewter.',
    duration: 300,
    world: { width: 2800, height: 1900, theme: 'grass' },
    scaling: { hp: 2.6, speed: 0.3, damage: 0.55 },

    segments: [
      { from: 0,   name: 'Rota 1',               theme: 'grass' },
      { from: 80,  name: 'Rota 2',               theme: 'grass' },
      { from: 160, name: 'Floresta de Viridian', theme: 'forest' },
      { from: 250, name: 'Ginásio de Pewter',    theme: 'gym' }
    ],

    waves: [
      { from: 0,   to: 85,  interval: 1.5,  batch: 1, maxAlive: 24, enemies: [{ id: 'rattata', weight: 6 }, { id: 'caterpie', weight: 3 }] },
      { from: 70,  to: 165, interval: 1.25, batch: 2, maxAlive: 45, enemies: [{ id: 'rattata', weight: 5 }, { id: 'spearow', weight: 4 }, { id: 'weedle', weight: 3 }] },
      { from: 150, to: 255, interval: 0.95, batch: 3, maxAlive: 85, enemies: [{ id: 'caterpie', weight: 4 }, { id: 'weedle', weight: 4 }, { id: 'spearow', weight: 3 }, { id: 'ekans', weight: 3 }, { id: 'zubat', weight: 2 }] },
      { from: 240, to: 288, interval: 0.95, batch: 4, maxAlive: 78, enemies: [{ id: 'geodude_wild', weight: 5 }, { id: 'sandshrew', weight: 4 }, { id: 'zubat', weight: 3 }, { id: 'spearow', weight: 2 }] }
    ],

    elites: [
      { at: 95,  id: 'raticate', count: 1 },
      { at: 150, id: 'raticate', count: 2 },
      { at: 195, id: 'primeape', count: 1 },
      { at: 265, id: 'graveler', count: 2 }
    ],

    leader: {
      name: 'BROCK',
      title: 'Líder do Ginásio de Pewter',
      badge: 'Insígnia Pedra',
      badgeIndex: 1,
      type: 'rock',
      dex: 95,
      quote: 'Minha defesa de rocha é intransponível!'
    },
    bossTeam: ['brock_geodude', 'brock_onix'],

    capturePool: 'phase1',
    ballChance: 1,
    maxBalls: 5,
    scriptedBalls: [25, 85, 175],
    reward: { shards: 140 }
  },

  /* ============================================================
     FASE 2 — do Monte Lua até o Ginásio de Cerulean (MISTY)
     ============================================================ */
  gym_2_cerulean: {
    id: 'gym_2_cerulean',
    name: 'Fase 2 — Rumo a Cerulean',
    region: 'Kanto',
    type: 'gym',
    icon: 'tm-water',
    description: 'Monte Lua, Rota 4 e Cerulean — até o Ginásio da Misty.',
    duration: 330,
    world: { width: 3000, height: 2000, theme: 'cave' },
    scaling: { hp: 3.2, speed: 0.34, damage: 0.7 },
    unlockedBy: 'gym_1_pewter',

    segments: [
      { from: 0,   name: 'Monte Lua',           theme: 'cave' },
      { from: 110, name: 'Rota 4',              theme: 'grass' },
      { from: 210, name: 'Cidade de Cerulean',  theme: 'forest' },
      { from: 280, name: 'Ginásio de Cerulean', theme: 'gym' }
    ],

    waves: [
      { from: 0,   to: 115, interval: 1.2, batch: 2, maxAlive: 45,  enemies: [{ id: 'zubat', weight: 6 }, { id: 'geodude_wild', weight: 3 }, { id: 'paras', weight: 3 }, { id: 'clefairy', weight: 2 }] },
      { from: 100, to: 215, interval: 1.0, batch: 3, maxAlive: 70,  enemies: [{ id: 'spearow', weight: 5 }, { id: 'ekans', weight: 4 }, { id: 'mankey', weight: 4 }, { id: 'sandshrew', weight: 3 }] },
      { from: 200, to: 285, interval: 0.85, batch: 4, maxAlive: 110,  enemies: [{ id: 'psyduck', weight: 5 }, { id: 'goldeen', weight: 4 }, { id: 'krabby', weight: 4 }, { id: 'mankey', weight: 2 }] },
      { from: 275, to: 322, interval: 0.8, batch: 5, maxAlive: 115, enemies: [{ id: 'shellder', weight: 5 }, { id: 'tentacool', weight: 5 }, { id: 'horsea', weight: 4 }, { id: 'krabby', weight: 3 }] }
    ],

    elites: [
      { at: 90,  id: 'golbat', count: 1 },
      { at: 165, id: 'parasect', count: 2 },
      { at: 240, id: 'primeape', count: 2 },
      { at: 300, id: 'seaking', count: 2 }
    ],

    leader: {
      name: 'MISTY',
      title: 'Líder do Ginásio de Cerulean',
      badge: 'Insígnia Cascata',
      badgeIndex: 2,
      type: 'water',
      dex: 121,
      quote: 'Você vai afundar na minha onda!'
    },
    bossTeam: ['misty_staryu', 'misty_starmie'],

    capturePool: 'phase2',
    ballChance: 1,
    maxBalls: 5,
    scriptedBalls: [30, 120, 220],
    reward: { shards: 200 }
  }
};

/**
 * CAMPANHA — a jornada por Kanto, ginásio a ginásio.
 * Entradas com `comingSoon` são o esqueleto do resto da região: cada uma vira
 * uma fase completa copiando um bloco de STAGES e ajustando rotas e líder.
 */
export const KANTO_CAMPAIGN = [
  { stage: 'gym_1_pewter' },
  { stage: 'gym_2_cerulean' },
  { comingSoon: true, name: 'Fase 3 — Rumo a Vermilion (LT. SURGE)', icon: 'tm-electric', description: 'Rotas 5 e 6 até o Ginásio Elétrico.' },
  { comingSoon: true, name: 'Fase 4 — Rumo a Celadon (ERIKA)', icon: 'tm-grass', description: 'Rota 7 e Celadon até o Ginásio de Planta.' },
  { comingSoon: true, name: 'Fase 5 — Rumo a Fuchsia (KOGA)', icon: 'tm-poison', description: 'Ciclovia e Rotas 16-19 até o Ginásio Venenoso.' },
  { comingSoon: true, name: 'Fase 6 — Rumo a Saffron (SABRINA)', icon: 'tm-psychic', description: 'Saffron e o Ginásio Psíquico.' },
  { comingSoon: true, name: 'Fase 7 — Rumo a Cinnabar (BLAINE)', icon: 'tm-fire', description: 'Mansão de Cinnabar e o Ginásio de Fogo.' },
  { comingSoon: true, name: 'Fase 8 — Rumo a Viridian (GIOVANNI)', icon: 'tm-ground', description: 'O último ginásio de Kanto.' },
  { comingSoon: true, name: 'ELITE FOUR', icon: 'master-ball', description: 'Lorelei, Bruno, Agatha e Lance, em sequência.' },
  { comingSoon: true, name: 'CAMPEÃO', icon: 'badge', description: 'O desafio final da jornada.' }
];

export const getStage = (id) => STAGES[id];

/** Uma fase está liberada se não depende de ninguém ou se a dependência foi concluída. */
export function isStageUnlocked(stageId, clearedStages = []) {
  const stage = STAGES[stageId];
  if (!stage) return false;
  return !stage.unlockedBy || clearedStages.includes(stage.unlockedBy);
}

/** Trecho da jornada em um dado momento da fase. */
export function segmentAt(stage, time) {
  const segments = stage.segments ?? [];
  let current = segments[0] ?? { name: stage.name, theme: stage.world.theme };
  for (const segment of segments) {
    if (time >= segment.from) current = segment;
  }
  return current;
}
