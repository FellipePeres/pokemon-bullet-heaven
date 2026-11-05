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
 *   segments       trechos da jornada: { from, name, theme, scene? } — mudam o
 *                  cenário (scene: um de data/scenery.js; sem ele, vale o tema)
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
 *   xpScale        multiplica o XP de cada selvagem: as fases foram encurtadas (3:30 até o
 *                  líder na 0.11, 2:45 na 0.15); menos inimigos, cada um vale mais
 *   music          a música da fase (assets/music, data/musicTracks.js); leaderMusic
 *                  toca quando o líder entra
 *   difficulty     a força da fase (0.17): multiplica a vida e o dano de tudo nela,
 *                  selvagens, elites e o time do líder. É a alavanca da campanha: a
 *                  derrota guarda o progresso, e a fase pede uma equipe mais forte
 *   recommendedLevel  o nível médio com que a equipe ENTRA na tentativa que vence a
 *                  fase (coluna "entrada" do tools/balance.mjs); o lobby mostra como
 *                  "nível recomendado"
 *   bossTuning     { hp, damage } — multiplica a vida e o dano (golpes inclusive) do time
 *                  do líder; as últimas fases ficavam fáceis para quem joga bem (0.12.2)
 *   starterTuning  { inicial: fator } — vida e dano dos inimigos (e do líder) multiplicados
 *                  quando esse é o inicial da jornada; para a fase em que um inicial sobra
 *   maxBalls       teto de Poké Balls da fase (controla o ritmo das capturas)
 *   scriptedBalls  segundos em que uma Poké Ball aparece garantida (0.10: só uma,
 *                  na Fase 1, para o inicial ganhar companhia; o resto é sorte)
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
    music: 'mus_route1', leaderMusic: 'mus_vs_gym_leader',
    duration: 165,
    xpScale: 1.35,   // 2:45 até o líder (0.15; era 3:30, e antes da 0.11, mais): cada inimigo vale mais XP
    world: { width: 2800, height: 1900, theme: 'grass' },
    scaling: { hp: 1.8, speed: 0.3, damage: 0.18 },

    segments: [
      { from: 0,   name: 'Rota 1',               theme: 'grass' },
      { from: 44,  name: 'Rota 2',               theme: 'grass' },
      { from: 88, name: 'Floresta de Viridian', theme: 'forest' },
      { from: 138, name: 'Ginásio de Pewter',    theme: 'gym', scene: 'pewter_gym' }
    ],

    waves: [
      { from: 0, to: 46, interval: 1.11,  batch: 1, maxAlive: 24, enemies: [{ id: 'rattata', weight: 6 }, { id: 'caterpie', weight: 3 }] },
      { from: 38, to: 90, interval: 0.82, batch: 1, maxAlive: 34, enemies: [{ id: 'rattata', weight: 5 }, { id: 'spearow', weight: 4 }, { id: 'weedle', weight: 3 }] },
      { from: 82, to: 140, interval: 0.7, batch: 2, maxAlive: 60, enemies: [{ id: 'caterpie', weight: 4 }, { id: 'weedle', weight: 4 }, { id: 'spearow', weight: 3 }, { id: 'ekans', weight: 3 }, { id: 'zubat', weight: 2 }] },
      { from: 132, to: 159, interval: 0.7, batch: 4, maxAlive: 78, enemies: [{ id: 'geodude_wild', weight: 5 }, { id: 'sandshrew', weight: 4 }, { id: 'zubat', weight: 3 }, { id: 'spearow', weight: 2 }] }
    ],

    elites: [
      { at: 69, id: 'raticate', count: 1 },   // 0.10: mais tarde (com poucas capturas, a equipe ainda é de 2)
      { at: 90, id: 'raticate', count: 2 },
      { at: 107, id: 'primeape', count: 1 },
      { at: 146, id: 'graveler', count: 2 }
    ],

    leader: {
      name: 'BROCK',
      title: 'Líder do Ginásio de Pewter',
      badge: 'Insígnia Pedra',
      badgeIndex: 1,
      type: 'rock',
      dex: 95,
      portrait: 'portrait/brock',
      quote: 'Minha defesa de rocha é intransponível!'
    },
    bossTeam: ['brock_geodude', 'brock_onix'],

    // o Squirtle sobrava aqui (0.11.5: 100% de vitórias quase sem desmaio, contra 43–67% dos outros)
    starterTuning: { squirtle: 1.2 },
    capturePool: 'phase1',
    ballChance: 1,
    maxBalls: 3,
    scriptedBalls: [24, 77],
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
    music: 'mus_mt_moon', leaderMusic: 'mus_vs_gym_leader',
    duration: 165,
    xpScale: 1.41,   // 2:45 até o líder (0.15; era 3:30, e antes da 0.11, mais): cada inimigo vale mais XP
    world: { width: 3000, height: 2000, theme: 'cave' },
    scaling: { hp: 2.9, speed: 0.34, damage: 1.0 },
    difficulty: 1.08,   // a força da fase (0.17)
    unlockedBy: 'gym_1_pewter',

    segments: [
      { from: 0,   name: 'Monte Lua',           theme: 'cave' },
      { from: 55, name: 'Rota 4',              theme: 'grass' },
      { from: 105, name: 'Cidade de Cerulean',  theme: 'forest' },
      { from: 140, name: 'Ginásio de Cerulean', theme: 'gym', scene: 'cerulean_gym' }
    ],

    waves: [
      { from: 0, to: 57, interval: 0.85, batch: 2, maxAlive: 45,  enemies: [{ id: 'zubat', weight: 6 }, { id: 'geodude_wild', weight: 3 }, { id: 'paras', weight: 3 }, { id: 'clefairy', weight: 2 }] },
      { from: 50, to: 108, interval: 0.71, batch: 3, maxAlive: 70,  enemies: [{ id: 'spearow', weight: 5 }, { id: 'ekans', weight: 4 }, { id: 'mankey', weight: 4 }, { id: 'sandshrew', weight: 3 }] },
      { from: 100, to: 142, interval: 0.6, batch: 4, maxAlive: 110,  enemies: [{ id: 'psyduck', weight: 5 }, { id: 'goldeen', weight: 4 }, { id: 'krabby', weight: 4 }, { id: 'mankey', weight: 2 }] },
      { from: 138, to: 161, interval: 0.57, batch: 5, maxAlive: 115, enemies: [{ id: 'shellder', weight: 5 }, { id: 'tentacool', weight: 5 }, { id: 'horsea', weight: 4 }, { id: 'krabby', weight: 3 }] }
    ],

    elites: [
      { at: 45,  id: 'golbat', count: 1 },
      { at: 82, id: 'parasect', count: 2 },
      { at: 120, id: 'primeape', count: 2 },
      { at: 150, id: 'seaking', count: 2 }
    ],

    leader: {
      name: 'MISTY',
      title: 'Líder do Ginásio de Cerulean',
      badge: 'Insígnia Cascata',
      badgeIndex: 2,
      type: 'water',
      dex: 121,
      portrait: 'portrait/misty',
      quote: 'Você vai afundar na minha onda!'
    },
    recommendedLevel: 25,
    bossTeam: ['misty_staryu', 'misty_starmie'],

    capturePool: 'phase2',
    ballChance: 1,
    maxBalls: 2,
    reward: { shards: 200 }
  },

  /* ============================================================
     FASE 3 — RUMO A VERMILION
     ============================================================ */
  gym_3_vermilion: {
    id: 'gym_3_vermilion',
    name: 'Fase 3 — Rumo a Vermilion',
    region: 'Kanto',
    type: 'gym',
    icon: 'tm-electric',
    description: 'Rotas 5 e 6, a Caverna do Diglett e a Rota 11 — até o Ginásio do Lt. Surge.',
    music: 'mus_vermillion', leaderMusic: 'mus_vs_gym_leader',
    duration: 165,
    xpScale: 1.44,   // 2:45 até o líder (0.15; era 3:30, e antes da 0.11, mais): cada inimigo vale mais XP
    world: { width: 3000, height: 2000, theme: 'grass' },
    scaling: { hp: 3.0, speed: 0.3, damage: 2.3 },
    difficulty: 1.4,   // a força da fase (0.17)
    unlockedBy: 'gym_2_cerulean',

    segments: [
      { from: 0, name: 'Rota 5', theme: 'grass' },
      { from: 41, name: 'Rota 6', theme: 'grass' },
      { from: 79, name: 'Caverna do Diglett', theme: 'cave' },
      { from: 126, name: 'Ginásio de Vermilion', theme: 'gym', scene: 'vermilion_gym' }
    ],

    // nível dos selvagens: acompanha a equipe, chegando perto do ace do líder
    // (os líderes têm os níveis do FireRed; ver CONFIG.enemies)
    waves: [
      { from: 0, to: 46, interval: 0.74, batch: 3, maxAlive: 50, level: [17, 20], enemies: [{ id: 'meowth', weight: 5 }, { id: 'pidgey', weight: 4 }, { id: 'oddish', weight: 4 }, { id: 'mankey', weight: 2 }] },
      { from: 38, to: 84, interval: 0.62, batch: 4, maxAlive: 80, level: [19, 22], enemies: [{ id: 'meowth', weight: 3 }, { id: 'psyduck', weight: 4 }, { id: 'oddish', weight: 3 }, { id: 'pidgey', weight: 3 }, { id: 'mankey', weight: 3 }] },
      { from: 76, to: 129, interval: 0.56, batch: 5, maxAlive: 115, level: [21, 24], enemies: [{ id: 'diglett', weight: 6 }, { id: 'ekans', weight: 3 }, { id: 'spearow', weight: 3 }, { id: 'drowzee', weight: 3 }] },
      { from: 122, to: 162, interval: 0.5, batch: 6, maxAlive: 130, level: [23, 26], enemies: [{ id: 'voltorb', weight: 5 }, { id: 'magnemite', weight: 5 }, { id: 'pikachu', weight: 3 }, { id: 'diglett', weight: 2 }] }
    ],

    elites: [
      { at: 48, id: 'primeape', count: 1, level: 25 },
      { at: 86, id: 'dugtrio_elite', count: 2, level: 25 },
      { at: 115, id: 'raticate', count: 2, level: 25 },
      { at: 144, id: 'electrode_elite', count: 2, level: 25 }
    ],

    leader: {
      name: 'LT. SURGE',
      title: 'Líder do Ginásio de Vermilion',
      badge: 'Insígnia Trovão',
      badgeIndex: 3,
      type: 'electric',
      dex: 26,
      portrait: 'portrait/lt_surge',
      quote: 'Ei, garoto! Eletricidade de verdade não perdoa amador!'
    },
    recommendedLevel: 33,
    bossTeam: ['lt_surge_voltorb', 'lt_surge_pikachu', 'lt_surge_raichu'],
    // presentes (como as trocas e o Dojo do FireRed): oferecidos uma vez, na hora marcada
    gifts: [
      { at: 72, choices: ['farfetchd'], title: 'A troca de Vermilion: um Farfetch\'d quer entrar para a sua equipe!' }
    ],

    capturePool: 'phase3',
    ballChance: 1,
    maxBalls: 2,
    reward: { shards: 260 }
  },

  /* ============================================================
     FASE 4 — RUMO A CELADON
     ============================================================ */
  gym_4_celadon: {
    id: 'gym_4_celadon',
    name: 'Fase 4 — Rumo a Celadon',
    region: 'Kanto',
    type: 'gym',
    icon: 'tm-grass',
    description: 'Rota 9, o Túnel de Pedra e a Rota 8 — até o Ginásio da Erika.',
    music: 'mus_celadon', leaderMusic: 'mus_vs_gym_leader',
    duration: 165,
    xpScale: 1.48,   // 2:45 até o líder (0.15; era 3:30, e antes da 0.11, mais): cada inimigo vale mais XP
    world: { width: 3000, height: 2000, theme: 'grass' },
    scaling: { hp: 3.5, speed: 0.3, damage: 5.2 },
    unlockedBy: 'gym_3_vermilion',

    segments: [
      { from: 0, name: 'Rota 9', theme: 'grass' },
      { from: 41, name: 'Túnel de Pedra', theme: 'cave' },
      { from: 87, name: 'Rota 8', theme: 'grass' },
      { from: 128, name: 'Ginásio de Celadon', theme: 'gym', scene: 'celadon_gym' }
    ],

    // nível dos selvagens: acompanha a equipe, chegando perto do ace do líder
    // (os líderes têm os níveis do FireRed; ver CONFIG.enemies)
    waves: [
      { from: 0, to: 46, interval: 0.67, batch: 4, maxAlive: 70, level: [27, 30], enemies: [{ id: 'spearow', weight: 3 }, { id: 'rattata', weight: 3 }, { id: 'ekans', weight: 3 }, { id: 'voltorb', weight: 2 }, { id: 'sandshrew', weight: 2 }] },
      { from: 39, to: 92, interval: 0.61, batch: 4, maxAlive: 95, level: [29, 32], enemies: [{ id: 'zubat', weight: 4 }, { id: 'geodude_wild', weight: 4 }, { id: 'machop', weight: 3 }, { id: 'mankey', weight: 2 }] },
      { from: 85, to: 133, interval: 0.52, batch: 5, maxAlive: 125, level: [31, 34], enemies: [{ id: 'growlithe', weight: 3 }, { id: 'meowth', weight: 3 }, { id: 'oddish', weight: 3 }, { id: 'pidgey', weight: 2 }, { id: 'drowzee', weight: 2 }] },
      { from: 126, to: 161, interval: 0.49, batch: 6, maxAlive: 145, level: [33, 36], enemies: [{ id: 'gloom', weight: 3 }, { id: 'weepinbell', weight: 3 }, { id: 'tangela', weight: 2 }, { id: 'exeggcute', weight: 2 }, { id: 'paras', weight: 2 }, { id: 'bellsprout', weight: 2 }] }
    ],

    elites: [
      { at: 50, id: 'graveler', count: 1, level: 34 },
      { at: 80, id: 'onix_elite', count: 1, level: 34 },
      { at: 110, id: 'persian_elite', count: 2, level: 34 },
      { at: 145, id: 'ninetales_elite', count: 2, level: 34 }
    ],

    leader: {
      name: 'ERIKA',
      title: 'Líder do Ginásio de Celadon',
      badge: 'Insígnia Arco-Íris',
      badgeIndex: 4,
      type: 'grass',
      dex: 45,
      portrait: 'portrait/erika',
      quote: 'Ah... que dia lindo. Minhas flores não vão pegar leve, viu?'
    },
    // líder mais forte nas últimas fases (0.12.2: "no final tá muito fácil")
    bossTuning: { hp: 1.25, damage: 1.1 },
    recommendedLevel: 44,
    bossTeam: ['erika_victreebel', 'erika_tangela', 'erika_vileplume'],

    capturePool: 'phase4',
    ballChance: 1,
    maxBalls: 2,
    reward: { shards: 320 }
  },

  /* ============================================================
     FASE 5 — RUMO A FUCHSIA
     ============================================================ */
  gym_5_fuchsia: {
    id: 'gym_5_fuchsia',
    name: 'Fase 5 — Rumo a Fuchsia',
    region: 'Kanto',
    type: 'gym',
    icon: 'tm-poison',
    description: 'A Torre Pokémon, as Rotas 12 a 15 e a Zona Safári — até o Ginásio do Koga.',
    music: 'mus_fuchsia', leaderMusic: 'mus_vs_gym_leader',
    duration: 165,
    xpScale: 1.51,   // 2:45 até o líder (0.15; era 3:30, e antes da 0.11, mais): cada inimigo vale mais XP
    world: { width: 3200, height: 2100, theme: 'cave' },
    scaling: { hp: 4.0, speed: 0.3, damage: 7.2 },
    unlockedBy: 'gym_4_celadon',

    segments: [
      { from: 0, name: 'Torre Pokémon', theme: 'cave' },
      { from: 42, name: 'Rotas 12–15', theme: 'grass' },
      { from: 86, name: 'Zona Safári', theme: 'forest' },
      { from: 130, name: 'Ginásio de Fuchsia', theme: 'gym', scene: 'fuchsia_gym' }
    ],

    // nível dos selvagens: acompanha a equipe, chegando perto do ace do líder
    // (os líderes têm os níveis do FireRed; ver CONFIG.enemies)
    waves: [
      { from: 0, to: 46, interval: 0.59, batch: 4, maxAlive: 85, level: [28, 31], enemies: [{ id: 'gastly', weight: 6 }, { id: 'haunter', weight: 2 }, { id: 'cubone', weight: 3 }, { id: 'zubat', weight: 2 }] },
      { from: 39, to: 90, interval: 0.54, batch: 5, maxAlive: 115, level: [30, 33], enemies: [{ id: 'venonat', weight: 4 }, { id: 'gloom', weight: 3 }, { id: 'pidgeotto', weight: 3 }, { id: 'bellsprout', weight: 2 }, { id: 'ditto', weight: 1 }] },
      { from: 83, to: 132, interval: 0.51, batch: 5, maxAlive: 140, level: [32, 35], enemies: [{ id: 'rhyhorn', weight: 3 }, { id: 'exeggcute', weight: 3 }, { id: 'nidorino', weight: 2 }, { id: 'nidorina', weight: 2 }, { id: 'venonat', weight: 2 }, { id: 'doduo', weight: 2 }, { id: 'paras', weight: 2 }] },
      { from: 126, to: 162, interval: 0.45, batch: 6, maxAlive: 160, level: [34, 37], enemies: [{ id: 'koffing', weight: 5 }, { id: 'grimer', weight: 4 }, { id: 'venonat', weight: 3 }, { id: 'arbok', weight: 3 }] }
    ],

    elites: [
      { at: 53, id: 'marowak_elite', count: 1, level: 36 },
      { at: 93, id: 'kangaskhan_elite', count: 1, level: 36 },
      { at: 110, id: 'tauros_elite', count: 2, level: 36 },
      { at: 132, id: 'scyther_elite', count: 2, level: 36 },
      { at: 149, id: 'weezing_elite', count: 2, level: 36 }
    ],

    leader: {
      name: 'KOGA',
      title: 'Líder do Ginásio de Fuchsia',
      badge: 'Insígnia Alma',
      badgeIndex: 5,
      type: 'poison',
      dex: 110,
      portrait: 'portrait/koga',
      quote: 'Fwahahaha! Veneno e sombras: a arte ninja!'
    },
    // líder mais forte nas últimas fases (0.12.2: "no final tá muito fácil")
    bossTuning: { hp: 1.35, damage: 1.15 },
    recommendedLevel: 58,
    bossTeam: ['koga_koffing', 'koga_muk', 'koga_koffing', 'koga_weezing'],

    capturePool: 'phase5',
    ballChance: 1,
    maxBalls: 2,
    reward: { shards: 380 }
  },

  /* ============================================================
     FASE 6 — RUMO A SAFFRON
     ============================================================ */
  gym_6_saffron: {
    id: 'gym_6_saffron',
    name: 'Fase 6 — Rumo a Saffron',
    region: 'Kanto',
    type: 'gym',
    icon: 'tm-psychic',
    description: 'A Usina, a Ciclovia e a Silph Co. — até o Ginásio da Sabrina.',
    music: 'mus_silph', leaderMusic: 'mus_vs_gym_leader',
    duration: 165,
    xpScale: 1.53,   // 2:45 até o líder (0.15; era 3:30, e antes da 0.11, mais): cada inimigo vale mais XP
    world: { width: 3200, height: 2100, theme: 'cave' },
    scaling: { hp: 7.0, speed: 0.3, damage: 5.2 },
    unlockedBy: 'gym_5_fuchsia',

    segments: [
      { from: 0, name: 'Usina', theme: 'cave' },
      { from: 42, name: 'Rotas 16–18', theme: 'grass' },
      { from: 85, name: 'Silph Co.', theme: 'gym', scene: 'saffron_gym' },
      { from: 127, name: 'Ginásio de Saffron', theme: 'gym', scene: 'saffron_gym' }
    ],

    // nível dos selvagens: acompanha a equipe, chegando perto do ace do líder
    // (os líderes têm os níveis do FireRed; ver CONFIG.enemies)
    waves: [
      { from: 0, to: 46, interval: 0.59, batch: 4, maxAlive: 95, level: [33, 36], enemies: [{ id: 'voltorb', weight: 4 }, { id: 'magnemite', weight: 4 }, { id: 'pikachu', weight: 2 }, { id: 'magneton', weight: 1 }] },
      { from: 40, to: 89, interval: 0.52, batch: 5, maxAlive: 125, level: [35, 38], enemies: [{ id: 'doduo', weight: 4 }, { id: 'fearow', weight: 3 }, { id: 'rattata', weight: 3 }, { id: 'grimer', weight: 2 }] },
      { from: 82, to: 131, interval: 0.47, batch: 5, maxAlive: 150, level: [37, 40], enemies: [{ id: 'koffing', weight: 3 }, { id: 'arbok', weight: 3 }, { id: 'grimer', weight: 2 }, { id: 'drowzee', weight: 3 }, { id: 'machop', weight: 2 }, { id: 'machoke', weight: 1 }, { id: 'zubat', weight: 2 }] },
      { from: 125, to: 162, interval: 0.44, batch: 6, maxAlive: 170, level: [39, 42], enemies: [{ id: 'drowzee', weight: 3 }, { id: 'kadabra', weight: 2 }, { id: 'slowpoke', weight: 3 }, { id: 'jynx', weight: 1 }] }
    ],

    elites: [
      { at: 51, id: 'electabuzz_elite', count: 1, level: 41 },
      { at: 80, id: 'dodrio_elite', count: 2, level: 41 },
      { at: 110, id: 'muk_elite', count: 2, level: 41 },
      { at: 140, id: 'hypno_elite', count: 2, level: 41 }
    ],

    leader: {
      name: 'SABRINA',
      title: 'Líder do Ginásio de Saffron',
      badge: 'Insígnia Pântano',
      badgeIndex: 6,
      type: 'psychic',
      dex: 65,
      portrait: 'portrait/sabrina',
      quote: 'Eu já sabia que você viria. E também sei como isso termina.'
    },
    // líder mais forte nas últimas fases (0.12.2: "no final tá muito fácil")
    bossTuning: { hp: 1.5, damage: 1.2 },
    recommendedLevel: 67,
    bossTeam: ['sabrina_kadabra', 'sabrina_mr_mime', 'sabrina_venomoth', 'sabrina_alakazam'],
    // presentes (como as trocas e o Dojo do FireRed): oferecidos uma vez, na hora marcada
    gifts: [
      { at: 64, choices: ['lickitung'], title: 'Uma troca na Rota 18: Lickitung quer entrar para a sua equipe!' },
      { at: 101, choices: ['hitmonlee', 'hitmonchan'], title: 'O Dojo de Saffron: escolha o seu prêmio!' }
    ],

    // o Squirtle sobrava aqui (0.11.5: 100%, contra 13–22% dos outros)
    starterTuning: { squirtle: 1.2 },
    capturePool: 'phase6',
    ballChance: 1,
    maxBalls: 2,
    reward: { shards: 440 }
  },

  /* ============================================================
     FASE 7 — RUMO A CINNABAR
     ============================================================ */
  gym_7_cinnabar: {
    id: 'gym_7_cinnabar',
    name: 'Fase 7 — Rumo a Cinnabar',
    region: 'Kanto',
    type: 'gym',
    icon: 'tm-fire',
    description: 'As Rotas 19 e 20, as Ilhas Seafoam e a Mansão Pokémon — até o Ginásio do Blaine.',
    music: 'mus_cinnabar', leaderMusic: 'mus_vs_gym_leader',
    duration: 165,
    xpScale: 1.57,   // 2:45 até o líder (0.15; era 3:30, e antes da 0.11, mais): cada inimigo vale mais XP
    world: { width: 3300, height: 2200, theme: 'grass' },
    scaling: { hp: 4.5, speed: 0.3, damage: 6.0 },
    unlockedBy: 'gym_6_saffron',

    segments: [
      { from: 0, name: 'Rotas 19 e 20', theme: 'grass' },
      { from: 42, name: 'Ilhas Seafoam', theme: 'cave' },
      { from: 83, name: 'Mansão Pokémon', theme: 'gym', scene: 'cinnabar_gym' },
      { from: 124, name: 'Ginásio de Cinnabar', theme: 'gym', scene: 'cinnabar_gym' }
    ],

    // nível dos selvagens: acompanha a equipe, chegando perto do ace do líder
    // (os líderes têm os níveis do FireRed; ver CONFIG.enemies)
    waves: [
      { from: 0, to: 47, interval: 0.54, batch: 5, maxAlive: 110, level: [38, 41], enemies: [{ id: 'tentacool', weight: 6 }, { id: 'horsea', weight: 3 }, { id: 'shellder', weight: 3 }, { id: 'staryu', weight: 2 }, { id: 'krabby', weight: 2 }] },
      { from: 41, to: 87, interval: 0.49, batch: 5, maxAlive: 140, level: [40, 43], enemies: [{ id: 'seel', weight: 4 }, { id: 'golduck', weight: 2 }, { id: 'psyduck', weight: 2 }, { id: 'zubat', weight: 3 }, { id: 'slowpoke', weight: 3 }, { id: 'krabby', weight: 2 }] },
      { from: 82, to: 128, interval: 0.46, batch: 6, maxAlive: 165, level: [42, 45], enemies: [{ id: 'growlithe', weight: 3 }, { id: 'ponyta', weight: 3 }, { id: 'grimer', weight: 3 }, { id: 'koffing', weight: 3 }, { id: 'rattata', weight: 2 }, { id: 'vulpix', weight: 2 }, { id: 'ditto', weight: 1 }] },
      { from: 123, to: 162, interval: 0.43, batch: 6, maxAlive: 185, level: [44, 47], enemies: [{ id: 'ponyta', weight: 3 }, { id: 'growlithe', weight: 3 }, { id: 'vulpix', weight: 3 }] }
    ],

    elites: [
      { at: 45, id: 'tentacruel_elite', count: 1, level: 46 },
      { at: 73, id: 'dewgong_elite', count: 2, level: 46 },
      { at: 94, id: 'cloyster_elite', count: 1, level: 46 },
      { at: 114, id: 'weezing_elite', count: 2, level: 46 },
      { at: 134, id: 'magmar_elite', count: 2, level: 46 },
      { at: 151, id: 'rapidash_elite', count: 2, level: 46 }
    ],

    leader: {
      name: 'BLAINE',
      title: 'Líder do Ginásio de Cinnabar',
      badge: 'Insígnia Vulcão',
      badgeIndex: 7,
      type: 'fire',
      dex: 59,
      portrait: 'portrait/blaine',
      quote: 'Hah! Espero que você tenha trazido Anti-Queimadura!'
    },
    // líder mais forte nas últimas fases (0.12.2: "no final tá muito fácil")
    bossTuning: { hp: 1.6, damage: 1.2 },
    recommendedLevel: 76,
    bossTeam: ['blaine_growlithe', 'blaine_ponyta', 'blaine_rapidash', 'blaine_arcanine'],

    // o Squirtle sobrava aqui (0.11.5: 100%: Água contra o Blaine)
    starterTuning: { squirtle: 1.15 },
    capturePool: 'phase7',
    ballChance: 1,
    maxBalls: 2,
    reward: { shards: 500 }
  },

  /* ============================================================
     FASE 8 — RUMO A VIRIDIAN
     ============================================================ */
  gym_8_viridian: {
    id: 'gym_8_viridian',
    name: 'Fase 8 — Rumo a Viridian',
    region: 'Kanto',
    type: 'gym',
    icon: 'tm-ground',
    description: 'A Rota 21, o Esconderijo Rocket e a Rota 22 — até o Ginásio do Giovanni.',
    music: 'mus_rocket_hideout', leaderMusic: 'mus_vs_gym_leader',
    duration: 165,
    xpScale: 1.59,   // 2:45 até o líder (0.15; era 3:30, e antes da 0.11, mais): cada inimigo vale mais XP
    world: { width: 3400, height: 2200, theme: 'grass' },
    scaling: { hp: 3.2, speed: 0.3, damage: 12.5 },
    unlockedBy: 'gym_7_cinnabar',

    segments: [
      { from: 0, name: 'Rota 21', theme: 'grass' },
      { from: 43, name: 'Esconderijo Rocket', theme: 'gym', scene: 'viridian_gym' },
      { from: 85, name: 'Rota 22', theme: 'grass' },
      { from: 124, name: 'Ginásio de Viridian', theme: 'gym', scene: 'viridian_gym' }
    ],

    // nível dos selvagens: acompanha a equipe, chegando perto do ace do líder
    // (os líderes têm os níveis do FireRed; ver CONFIG.enemies)
    waves: [
      { from: 0, to: 47, interval: 0.53, batch: 5, maxAlive: 120, level: [43, 46], enemies: [{ id: 'tangela', weight: 3 }, { id: 'tentacool', weight: 3 }, { id: 'pidgeotto', weight: 3 }, { id: 'rattata', weight: 2 }] },
      { from: 41, to: 88, interval: 0.48, batch: 5, maxAlive: 150, level: [45, 48], enemies: [{ id: 'arbok', weight: 3 }, { id: 'koffing', weight: 2 }, { id: 'grimer', weight: 2 }, { id: 'zubat', weight: 2 }, { id: 'machoke', weight: 2 }, { id: 'drowzee', weight: 2 }, { id: 'rattata', weight: 2 }] },
      { from: 82, to: 127, interval: 0.45, batch: 6, maxAlive: 175, level: [47, 50], enemies: [{ id: 'mankey', weight: 3 }, { id: 'nidorino', weight: 3 }, { id: 'nidorina', weight: 3 }, { id: 'fearow', weight: 2 }, { id: 'ponyta', weight: 2 }] },
      { from: 122, to: 162, interval: 0.4, batch: 6, maxAlive: 200, level: [49, 52], enemies: [{ id: 'rhyhorn', weight: 3 }, { id: 'diglett', weight: 3 }, { id: 'sandslash', weight: 2 }, { id: 'cubone', weight: 2 }, { id: 'nidorino', weight: 2 }] }
    ],

    elites: [
      { at: 51, id: 'rhydon_elite', count: 1, level: 51 },
      { at: 79, id: 'nidoking_elite', count: 1, level: 51 },
      { at: 102, id: 'nidoqueen_elite', count: 1, level: 51 },
      { at: 130, id: 'dugtrio_elite', count: 2, level: 51 },
      { at: 149, id: 'marowak_elite', count: 2, level: 51 }
    ],

    leader: {
      name: 'GIOVANNI',
      title: 'Líder do Ginásio de Viridian',
      badge: 'Insígnia Terra',
      badgeIndex: 8,
      type: 'ground',
      dex: 111,
      portrait: 'portrait/giovanni',
      quote: 'Fwahaha! Faz tempo que ninguém me desafia de verdade.'
    },
    // líder mais forte nas últimas fases (0.12.2: "no final tá muito fácil")
    bossTuning: { hp: 1.7, damage: 1.25 },
    recommendedLevel: 85,
    bossTeam: ['giovanni_rhyhorn', 'giovanni_dugtrio', 'giovanni_nidoqueen', 'giovanni_nidoking', 'giovanni_rhyhorn_ace'],

    capturePool: 'phase8',
    ballChance: 1,
    maxBalls: 2,
    reward: { shards: 560 }
  },

  /* ============================================================
     ELITE FOUR — LORELEI
     ============================================================ */
  e4_lorelei: {
    id: 'e4_lorelei',
    name: 'Elite Four — Lorelei',
    region: 'Kanto',
    type: 'gym',
    icon: 'tm-ice',
    description: 'A Rota 23 e a Victory Road — até a sala da Lorelei.',
    music: 'mus_victory_road', leaderMusic: 'mus_vs_gym_leader',
    duration: 165,
    xpScale: 1.35,   // 2:45 até o líder (0.15; era 3:30, e antes da 0.11, mais): cada inimigo vale mais XP
    world: { width: 3000, height: 2000, theme: 'cave' },
    scaling: { hp: 4.0, speed: 0.3, damage: 4.6 },
    difficulty: 1.05,   // a força da fase (0.17)
    unlockedBy: 'gym_8_viridian',

    segments: [
      { from: 0, name: 'Rota 23', theme: 'grass' },
      { from: 55, name: 'Victory Road', theme: 'cave' },
      { from: 110, name: 'Sala da Lorelei', theme: 'gym', scene: 'lorelei_room' }
    ],

    // nível dos selvagens: acompanha a equipe, chegando perto do ace do líder
    // (os líderes têm os níveis do FireRed; ver CONFIG.enemies)
    waves: [
      { from: 0, to: 60, interval: 0.6, batch: 5, maxAlive: 130, level: [48, 51], enemies: [{ id: 'arbok', weight: 3 }, { id: 'fearow', weight: 3 }, { id: 'mankey', weight: 3 }, { id: 'machoke', weight: 2 }, { id: 'cubone', weight: 2 }] },
      { from: 52, to: 116, interval: 0.53, batch: 6, maxAlive: 170, level: [50, 53], enemies: [{ id: 'geodude_wild', weight: 3 }, { id: 'machoke', weight: 3 }, { id: 'zubat', weight: 2 }, { id: 'kadabra', weight: 1 }, { id: 'sandslash', weight: 2 }] },
      { from: 107, to: 160, interval: 0.51, batch: 6, maxAlive: 200, level: [52, 55], enemies: [{ id: 'seel', weight: 3 }, { id: 'shellder', weight: 3 }, { id: 'jynx', weight: 2 }, { id: 'slowpoke', weight: 3 }] }
    ],

    elites: [
      { at: 66, id: 'primeape', count: 2, level: 54 },
      { at: 110, id: 'golbat', count: 2, level: 54 },
      { at: 138, id: 'dewgong_elite', count: 2, level: 54 },
      { at: 154, id: 'cloyster_elite', count: 1, level: 54 }
    ],

    leader: {
      name: 'LORELEI',
      title: 'Elite Four',
      type: 'ice',
      dex: 131,
      portrait: 'portrait/lorelei',
      quote: 'Ninguém entende de gelo como eu. Prepare-se para congelar!'
    },
    // líder mais forte nas últimas fases (0.12.2: "no final tá muito fácil")
    bossTuning: { hp: 1.7, damage: 1.25 },
    recommendedLevel: 92,
    bossTeam: ['lorelei_dewgong', 'lorelei_cloyster', 'lorelei_slowbro', 'lorelei_jynx', 'lorelei_lapras'],

    capturePool: 'phase9',
    ballChance: 1,
    maxBalls: 1,
    reward: { shards: 300 }
  },

  /* ============================================================
     ELITE FOUR — BRUNO
     ============================================================ */
  e4_bruno: {
    id: 'e4_bruno',
    name: 'Elite Four — Bruno',
    region: 'Kanto',
    type: 'gym',
    icon: 'tm-fighting',
    description: 'O corredor da Liga — até a sala do Bruno.',
    music: 'mus_trainer_tower', leaderMusic: 'mus_vs_gym_leader',
    duration: 165,
    xpScale: 1.3,   // 2:45 até o líder (0.15; era 3:30, e antes da 0.11, mais): cada inimigo vale mais XP
    world: { width: 3000, height: 2000, theme: 'gym' },
    scaling: { hp: 2.4, speed: 0.3, damage: 10 },
    difficulty: 1.12,   // a força da fase (0.17)
    unlockedBy: 'e4_lorelei',

    segments: [
      { from: 0, name: 'Corredor da Liga', theme: 'gym', scene: 'league_hall' },
      { from: 106, name: 'Sala do Bruno', theme: 'gym', scene: 'bruno_room' }
    ],

    // nível dos selvagens: acompanha a equipe, chegando perto do ace do líder
    // (os líderes têm os níveis do FireRed; ver CONFIG.enemies)
    waves: [
      { from: 0, to: 82, interval: 0.59, batch: 6, maxAlive: 160, level: [53, 56], enemies: [{ id: 'machop', weight: 3 }, { id: 'machoke', weight: 4 }, { id: 'mankey', weight: 3 }, { id: 'geodude_wild', weight: 2 }] },
      { from: 74, to: 160, interval: 0.52, batch: 6, maxAlive: 200, level: [55, 58], enemies: [{ id: 'machoke', weight: 4 }, { id: 'rhyhorn', weight: 2 }, { id: 'sandslash', weight: 2 }, { id: 'mankey', weight: 2 }] }
    ],

    elites: [
      { at: 59, id: 'onix_elite', count: 2, level: 57 },
      { at: 101, id: 'hitmonlee_elite', count: 1, level: 57 },
      { at: 118, id: 'hitmonchan_elite', count: 1, level: 57 },
      { at: 148, id: 'machamp_elite', count: 2, level: 57 }
    ],

    leader: {
      name: 'BRUNO',
      title: 'Elite Four',
      type: 'fighting',
      dex: 68,
      portrait: 'portrait/bruno',
      quote: 'Treinamos os músculos até o limite. Hoo hah!'
    },
    // líder mais forte nas últimas fases (0.12.2: "no final tá muito fácil")
    bossTuning: { hp: 1.7, damage: 1.25 },
    recommendedLevel: 94,
    bossTeam: ['bruno_onix', 'bruno_hitmonchan', 'bruno_hitmonlee', 'bruno_onix', 'bruno_machamp'],

    capturePool: 'phase9',
    ballChance: 1,
    maxBalls: 1,
    reward: { shards: 320 }
  },

  /* ============================================================
     ELITE FOUR — AGATHA
     ============================================================ */
  e4_agatha: {
    id: 'e4_agatha',
    name: 'Elite Four — Agatha',
    region: 'Kanto',
    type: 'gym',
    icon: 'tm-ghost',
    description: 'O corredor da Liga — até a sala da Agatha.',
    music: 'mus_poke_tower', leaderMusic: 'mus_vs_gym_leader',
    duration: 165,
    xpScale: 1.3,   // 2:45 até o líder (0.15; era 3:30, e antes da 0.11, mais): cada inimigo vale mais XP
    world: { width: 3000, height: 2000, theme: 'cave' },
    scaling: { hp: 2.9, speed: 0.3, damage: 3.8 },
    difficulty: 1.05,   // a força da fase (0.17)
    unlockedBy: 'e4_bruno',

    segments: [
      { from: 0, name: 'Corredor da Liga', theme: 'gym', scene: 'league_hall' },
      { from: 106, name: 'Sala da Agatha', theme: 'cave', scene: 'agatha_room' }
    ],

    // nível dos selvagens: acompanha a equipe, chegando perto do ace do líder
    // (os líderes têm os níveis do FireRed; ver CONFIG.enemies)
    waves: [
      { from: 0, to: 82, interval: 0.59, batch: 6, maxAlive: 160, level: [55, 58], enemies: [{ id: 'gastly', weight: 5 }, { id: 'haunter', weight: 3 }, { id: 'zubat', weight: 2 }, { id: 'arbok', weight: 2 }] },
      { from: 74, to: 160, interval: 0.52, batch: 6, maxAlive: 200, level: [57, 60], enemies: [{ id: 'haunter', weight: 4 }, { id: 'gastly', weight: 3 }, { id: 'arbok', weight: 2 }, { id: 'kadabra', weight: 1 }] }
    ],

    elites: [
      { at: 59, id: 'golbat', count: 2, level: 59 },
      { at: 101, id: 'arbok_elite', count: 2, level: 59 },
      { at: 135, id: 'gengar_elite', count: 2, level: 59 }
    ],

    leader: {
      name: 'AGATHA',
      title: 'Elite Four',
      type: 'ghost',
      dex: 94,
      portrait: 'portrait/agatha',
      quote: 'Pokémon são para lutar! Vou te mostrar como se faz.'
    },
    // líder mais forte nas últimas fases (0.12.2: "no final tá muito fácil")
    bossTuning: { hp: 1.7, damage: 1.25 },
    recommendedLevel: 99,
    bossTeam: ['agatha_gengar', 'agatha_golbat', 'agatha_haunter', 'agatha_arbok', 'agatha_gengar_ace'],

    capturePool: 'phase9',
    ballChance: 1,
    maxBalls: 1,
    reward: { shards: 340 }
  },

  /* ============================================================
     ELITE FOUR — LANCE
     ============================================================ */
  e4_lance: {
    id: 'e4_lance',
    name: 'Elite Four — Lance',
    region: 'Kanto',
    type: 'gym',
    icon: 'tm-dragon',
    description: 'O corredor da Liga — até a sala do Lance.',
    music: 'mus_sevii_dungeon', leaderMusic: 'mus_vs_gym_leader',
    duration: 165,
    xpScale: 1.3,   // 2:45 até o líder (0.15; era 3:30, e antes da 0.11, mais): cada inimigo vale mais XP
    world: { width: 3000, height: 2000, theme: 'cave' },
    scaling: { hp: 2.7, speed: 0.3, damage: 2.8 },
    difficulty: 1.15,   // a força da fase (0.17)
    unlockedBy: 'e4_agatha',

    segments: [
      { from: 0, name: 'Corredor da Liga', theme: 'gym', scene: 'league_hall' },
      { from: 106, name: 'Sala do Lance', theme: 'cave', scene: 'lance_room' }
    ],

    // nível dos selvagens: acompanha a equipe, chegando perto do ace do líder
    // (os líderes têm os níveis do FireRed; ver CONFIG.enemies)
    waves: [
      { from: 0, to: 82, interval: 0.59, batch: 6, maxAlive: 160, level: [57, 60], enemies: [{ id: 'dratini', weight: 4 }, { id: 'dragonair', weight: 2 }, { id: 'seadra', weight: 3 }, { id: 'horsea', weight: 3 }] },
      { from: 74, to: 160, interval: 0.52, batch: 6, maxAlive: 200, level: [59, 62], enemies: [{ id: 'dragonair', weight: 4 }, { id: 'seadra', weight: 3 }, { id: 'kingler', weight: 2 }] }
    ],

    elites: [
      { at: 59, id: 'gyarados_elite', count: 2, level: 61 },
      { at: 101, id: 'aerodactyl_elite', count: 2, level: 61 },
      { at: 135, id: 'gyarados_elite', count: 2, level: 61 }
    ],

    leader: {
      name: 'LANCE',
      title: 'Elite Four',
      type: 'dragon',
      dex: 149,
      portrait: 'portrait/lance',
      quote: 'Dragões são criaturas místicas... e quase invencíveis.'
    },
    // líder mais forte nas últimas fases (0.12.2: "no final tá muito fácil")
    bossTuning: { hp: 1.75, damage: 1.25 },
    recommendedLevel: 104,
    bossTeam: ['lance_gyarados', 'lance_dragonair', 'lance_dragonair', 'lance_aerodactyl', 'lance_dragonite'],

    capturePool: 'phase9',
    ballChance: 1,
    maxBalls: 1,
    reward: { shards: 360 }
  },

  /* ============================================================
     CAMPEÃO — O SEU RIVAL
     ============================================================ */
  champion: {
    id: 'champion',
    name: 'Campeão — o seu rival',
    region: 'Kanto',
    type: 'gym',
    icon: 'badge',
    description: 'O Platô Indigo — o desafio final da jornada.',
    music: 'mus_encounter_rival', leaderMusic: 'mus_vs_champion',
    duration: 165,
    xpScale: 1.21,   // 2:45 até o líder (0.15; era 3:30, e antes da 0.11, mais): cada inimigo vale mais XP
    world: { width: 3000, height: 2000, theme: 'gym' },
    scaling: { hp: 2.4, speed: 0.3, damage: 2.1 },
    difficulty: 1.25,   // a força da fase (0.17)
    unlockedBy: 'e4_lance',

    segments: [
      { from: 0, name: 'Platô Indigo', theme: 'gym', scene: 'league_hall' },
      { from: 103, name: 'Sala do Campeão', theme: 'gym', scene: 'champion_room' }
    ],

    // nível dos selvagens: acompanha a equipe, chegando perto do ace do líder
    // (os líderes têm os níveis do FireRed; ver CONFIG.enemies)
    waves: [
      { from: 0, to: 82, interval: 0.64, batch: 6, maxAlive: 170, level: [59, 62], enemies: [{ id: 'golduck', weight: 3 }, { id: 'kadabra', weight: 3 }, { id: 'magneton', weight: 3 }, { id: 'kingler', weight: 2 }, { id: 'ditto', weight: 1 }] },
      { from: 72, to: 160, interval: 0.57, batch: 6, maxAlive: 210, level: [61, 64], enemies: [{ id: 'rhyhorn', weight: 2 }, { id: 'sandslash', weight: 2 }, { id: 'golduck', weight: 2 }, { id: 'seadra', weight: 2 }, { id: 'machoke', weight: 2 }] }
    ],

    elites: [
      { at: 62, id: 'kadabra_elite', count: 2, level: 63 },
      { at: 103, id: 'magneton_elite', count: 2, level: 63 },
      { at: 138, id: 'golduck_elite', count: 2, level: 63 }
    ],

    leader: {
      name: 'RIVAL',
      title: 'Campeão da Liga Pokémon',
      type: 'normal',
      dex: 18,
      portrait: 'portrait/rival',
      quote: 'Até que enfim! Eu sou o melhor treinador do mundo!'
    },
    // como no FireRed, o rival escolheu o inicial com vantagem sobre o seu
    // líder mais forte nas últimas fases (0.12.2: "no final tá muito fácil")
    bossTuning: { hp: 1.8, damage: 1.3 },
    recommendedLevel: 106,
    bossTeam: ['rival_pidgeot', 'rival_alakazam', 'rival_rhydon', 'rival_arcanine', 'rival_exeggutor', 'rival_blastoise'],
    bossTeamByStarter: {
      charmander: ['rival_pidgeot', 'rival_alakazam', 'rival_rhydon', 'rival_arcanine', 'rival_exeggutor', 'rival_blastoise'],
      bulbasaur: ['rival_pidgeot', 'rival_alakazam', 'rival_rhydon', 'rival_exeggutor', 'rival_gyarados', 'rival_charizard'],
      squirtle: ['rival_pidgeot', 'rival_alakazam', 'rival_rhydon', 'rival_gyarados', 'rival_arcanine', 'rival_venusaur']
    },

    capturePool: 'phase9',
    ballChance: 1,
    maxBalls: 1,   // 0.18: uma, para o lendário (era 0)
    reward: { shards: 800 }
  }
};

/**
 * CAMPANHA — a jornada por Kanto, ginásio a ginásio, até o Campeão.
 * Uma entrada `{ comingSoon: true, name, icon, portrait, description }` aparece no
 * mapa como "em breve": é como uma região nova começa antes de ter as fases.
 */
export const KANTO_CAMPAIGN = [
  { stage: 'gym_1_pewter' },
  { stage: 'gym_2_cerulean' },
  { stage: 'gym_3_vermilion' },
  { stage: 'gym_4_celadon' },
  { stage: 'gym_5_fuchsia' },
  { stage: 'gym_6_saffron' },
  { stage: 'gym_7_cinnabar' },
  { stage: 'gym_8_viridian' },
  { stage: 'e4_lorelei' },
  { stage: 'e4_bruno' },
  { stage: 'e4_agatha' },
  { stage: 'e4_lance' },
  { stage: 'champion' }
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
