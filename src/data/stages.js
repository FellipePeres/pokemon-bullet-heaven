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
 *                  (0.28: abaixo de 1 não quer dizer fase fácil — a curva de XP ficou
 *                  mais íngreme e a equipe chega ~10 a 40 níveis abaixo de antes; os
 *                  valores foram medidos em tentativas do bot, todas acima da 0.27)
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
 *   reward         Shards da primeira vitória (0.22: só ela paga; 100 nos ginásios, 150 na Liga, 300 no Campeão)
 */
export const STAGES = {
  /* ============================================================
     FASE 1 — de Pallet até o Ginásio de Pewter (BROCK)
     ============================================================ */
  gym_1_pewter: {
    id: 'gym_1_pewter',
    name: 'Fase 1 — Rumo a Pewter',
    difficulty: 1.45,   // a força da fase (a lapidação, o Fellipe: "uma média de 2 tentativas para players reais até as 4 primeiras fases"; o bot ~3,5); era 1
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
    capturePool: 'phase1',
    ballChance: 1,
    maxBalls: 3,
    scriptedBalls: [24, 77],
    reward: { shards: 100 }
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
    difficulty: 1.65,   // a força da fase (a lapidação, o Fellipe: "uma média de 2 tentativas para players reais até as 4 primeiras fases"; o bot ~3,5); era 1,25
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
    reward: { shards: 100 }
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
    difficulty: 1.55,   // a força da fase (a lapidação, o Fellipe: "uma média de 2 tentativas para players reais até as 4 primeiras fases"; o bot ~3,5); era 1,4
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
    reward: { shards: 100 }
  },

  /* ============================================================
     FASE 4 — RUMO A CELADON
     ============================================================ */
  gym_4_celadon: {
    id: 'gym_4_celadon',
    name: 'Fase 4 — Rumo a Celadon',
    difficulty: 1.35,   // a força da fase (a lapidação, o Fellipe: "uma média de 2 tentativas para players reais até as 4 primeiras fases"; o bot ~3,5); era 1
    region: 'Kanto',
    type: 'gym',
    icon: 'tm-grass',
    description: 'Rota 9, o Túnel de Pedra e a Rota 8 — até o Ginásio da Erika.',
    // a trava da história (H-4, decisão 18 do PLANEJAMENTO-HISTORIA): o Túnel de Pedra está no
    // escuro desde o apagão e só acende com a luz da Usina de volta (a missão do Zapdos, a fase
    // `zapdos`). O texto não cita o Zapdos: a descoberta dele é na Usina (sem spoiler em título)
    lock: {
      stage: 'zapdos',
      text: 'O Túnel de Pedra está no escuro desde que a Usina apagou. Ninguém passa.',
      go: 'Investigue a Usina, na Rota 10', place: 'usina'
    },
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
    recommendedLevel: 40,
    bossTeam: ['erika_victreebel', 'erika_tangela', 'erika_vileplume'],

    capturePool: 'phase4',
    ballChance: 1,
    maxBalls: 2,
    reward: { shards: 100 }
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
    difficulty: 1.0,   // a força da fase (a lapidação: o começo mais duro deixou o Koga fácil, 1,8 tentativas do bot; de volta a ~3); era 0,85
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
    recommendedLevel: 46,
    bossTeam: ['koga_koffing', 'koga_muk', 'koga_koffing', 'koga_weezing'],

    capturePool: 'phase5',
    ballChance: 1,
    maxBalls: 2,
    reward: { shards: 100 }
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
    difficulty: 0.82,   // a força da fase (0.17; 0.28: era 1, recalibrada com a curva de XP nova)
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
    recommendedLevel: 50,
    bossTeam: ['sabrina_kadabra', 'sabrina_mr_mime', 'sabrina_venomoth', 'sabrina_alakazam'],
    // presentes (como as trocas e o Dojo do FireRed): oferecidos uma vez, na hora marcada
    gifts: [
      { at: 64, choices: ['lickitung'], title: 'Uma troca na Rota 18: Lickitung quer entrar para a sua equipe!' },
      { at: 101, choices: ['hitmonlee', 'hitmonchan'], title: 'O Dojo de Saffron: escolha o seu prêmio!' }
    ],

    // o Squirtle sobrava aqui (0.11.5: 100%, contra 13–22% dos outros)
    capturePool: 'phase6',
    ballChance: 1,
    maxBalls: 2,
    reward: { shards: 100 }
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
    difficulty: 0.82,   // a força da fase (0.17; 0.28: era 1, recalibrada com a curva de XP nova)
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
    recommendedLevel: 55,
    bossTeam: ['blaine_growlithe', 'blaine_ponyta', 'blaine_rapidash', 'blaine_arcanine'],

    // o Squirtle sobrava aqui (0.11.5: 100%: Água contra o Blaine)
    capturePool: 'phase7',
    ballChance: 1,
    maxBalls: 2,
    reward: { shards: 100 }
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
    // a trava da história (H-7, a proposta "Seafoam: as ondas"): o mar da Rota 21, entre Cinnabar e
    // Pallet, está congelando, e nenhum barco sai de Cinnabar até a máquina de Seafoam parar (a
    // missão do Articuno, a fase `articuno`). O texto não cita o Articuno (sem spoiler em título)
    lock: {
      stage: 'articuno',
      text: 'O mar da Rota 21 está congelando, fora de época. Nenhum barco sai de Cinnabar.',
      go: 'Investigue as Ilhas Seafoam', place: 'seafoam'
    },
    music: 'mus_rocket_hideout', leaderMusic: 'mus_vs_gym_leader',
    duration: 165,
    xpScale: 1.59,   // 2:45 até o líder (0.15; era 3:30, e antes da 0.11, mais): cada inimigo vale mais XP
    world: { width: 3400, height: 2200, theme: 'grass' },
    scaling: { hp: 3.2, speed: 0.3, damage: 12.5 },
    difficulty: 0.8,   // a força da fase (0.17; 0.28: era 1, recalibrada com a curva de XP nova)
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
    recommendedLevel: 60,
    bossTeam: ['giovanni_rhyhorn', 'giovanni_dugtrio', 'giovanni_nidoqueen', 'giovanni_nidoking', 'giovanni_rhyhorn_ace'],

    capturePool: 'phase8',
    ballChance: 1,
    maxBalls: 2,
    reward: { shards: 100 }
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
    difficulty: 0.8,   // a força da fase (0.17; 0.28: era 1,05, recalibrada com a curva de XP nova)
    // a trava da história (H-8, a decisão 2: a Victory Road só abre com os três pássaros de volta):
    // as hordas tomaram a Victory Road até a missão do Moltres (a fase `moltres`). Sem citar o Moltres
    lock: [
      {
        stage: 'moltres',
        text: 'Hordas furiosas tomaram a Victory Road, e a Liga fechou a passagem até as rotas se acalmarem.',
        go: 'Investigue o Monte Brasa, na Ilha 1', place: 'monte_brasa'
      },
      // (H-9, decisão 22) depois da cena da porta da Victory Road (o primeiro Jogar), a Liga está
      // vazia até a cena do subsolo da Mansão. Sem citar quem prendeu os quatro
      {
        scene: 'mansao_lab', after: 'victory_road',
        text: 'A Liga está vazia: a Elite dos Quatro partiu.',
        go: 'Vá até a Mansão Pokémon, em Cinnabar', place: 'mansao'
      }
    ],
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
    recommendedLevel: 64,
    bossTeam: ['lorelei_dewgong', 'lorelei_cloyster', 'lorelei_slowbro', 'lorelei_jynx', 'lorelei_lapras'],

    capturePool: 'phase9',
    ballChance: 1,
    maxBalls: 1,
    reward: { shards: 150 }
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
    difficulty: 0.97,   // a força da fase (0.17; 0.28: era 1,12, recalibrada com a curva de XP nova)
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
    recommendedLevel: 66,
    bossTeam: ['bruno_onix', 'bruno_hitmonchan', 'bruno_hitmonlee', 'bruno_onix', 'bruno_machamp'],

    capturePool: 'phase9',
    ballChance: 1,
    maxBalls: 1,
    reward: { shards: 150 }
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
    difficulty: 0.95,   // a força da fase (0.17; 0.28: era 1,05, recalibrada com a curva de XP nova)
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
    recommendedLevel: 70,
    bossTeam: ['agatha_gengar', 'agatha_golbat', 'agatha_haunter', 'agatha_arbok', 'agatha_gengar_ace'],

    capturePool: 'phase9',
    ballChance: 1,
    maxBalls: 1,
    reward: { shards: 150 }
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
    difficulty: 0.88,   // a força da fase (0.17; 0.28: era 1,15, recalibrada com a curva de XP nova)
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
    recommendedLevel: 72,
    bossTeam: ['lance_gyarados', 'lance_dragonair', 'lance_dragonair', 'lance_aerodactyl', 'lance_dragonite'],

    capturePool: 'phase9',
    ballChance: 1,
    maxBalls: 1,
    reward: { shards: 150 }
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
    difficulty: 1.08,   // a força da fase (0.17; 0.28: era 1,25, recalibrada com a curva de XP nova)
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
    recommendedLevel: 74,
    bossTeam: ['rival_pidgeot', 'rival_alakazam', 'rival_rhydon', 'rival_arcanine', 'rival_exeggutor', 'rival_blastoise'],
    bossTeamByStarter: {
      charmander: ['rival_pidgeot', 'rival_alakazam', 'rival_rhydon', 'rival_arcanine', 'rival_exeggutor', 'rival_blastoise'],
      bulbasaur: ['rival_pidgeot', 'rival_alakazam', 'rival_rhydon', 'rival_exeggutor', 'rival_gyarados', 'rival_charizard'],
      squirtle: ['rival_pidgeot', 'rival_alakazam', 'rival_rhydon', 'rival_gyarados', 'rival_arcanine', 'rival_venusaur']
    },

    capturePool: 'phase9',
    ballChance: 1,
    maxBalls: 1,   // 0.18: uma, para o lendário (era 0)
    reward: { shards: 300 }
  },

  /* ============================================================
     FASE SECRETA — o salão do Kyogre (0.37, PLANEJAMENTO-DIVE.md seção 9)
     ============================================================
     Fora da campanha: só pela descida do Dive (game/Dive.js) e pelo card do
     salão. A arena é o salão aprovado na maquete (o tileset cave do Emerald),
     com a chuva do Kyogre o tempo todo. 45 s de maré de Hoenn e o Kyogre sai do
     lago; o que só esta luta tem (os ataques, o mergulho, a captura com as Dive
     Balls e a maré final) está em systems/kyogreFight.js. */
  kyogre: {
    id: 'kyogre',
    name: 'Fase secreta — Caverna Marinha',
    region: 'Hoenn',
    type: 'legendary',
    icon: 'boss',
    secret: true,
    description: 'O salão do Kyogre, no fundo da lagoa.',
    music: 'mus_sevii_dungeon', leaderMusic: 'mus_vs_legend',
    duration: 45,
    xpScale: 1.15,
    world: { width: 2400, height: 1600, theme: 'cave' },
    weather: 'rain',
    scaling: { hp: 0.6, speed: 0.25, damage: 0.3 },
    difficulty: 1,
    segments: [{ from: 0, name: 'Salão do Kyogre', theme: 'cave', scene: 'kyogre_hall' }],
    waves: [
      // a maré (0:00 a 0:45): o aquecimento
      { from: 0, to: 44, interval: 0.7, batch: 5, maxAlive: 150, level: [68, 72], enemies: [{ id: 'sharpedo', weight: 3 }, { id: 'carvanha', weight: 3 }, { id: 'wailmer', weight: 2 }, { id: 'crawdaunt', weight: 2 }, { id: 'whiscash', weight: 1 }, { id: 'walrein', weight: 1 }] },
      // com o Kyogre em campo, a horda continua, mais leve (como os líderes, ele chama a dele)
      { from: 45, to: 9999, interval: 2, batch: 3, maxAlive: 30, level: [68, 72], enemies: [{ id: 'sharpedo', weight: 3 }, { id: 'carvanha', weight: 3 }, { id: 'wailmer', weight: 2 }, { id: 'crawdaunt', weight: 2 }] }
    ],
    elites: [
      { at: 14, id: 'sharpedo_elite', count: 2, level: 72 },
      { at: 30, id: 'wailord_elite', count: 1, level: 72 }
    ],
    leader: {
      name: 'KYOGRE',
      title: 'Pokémon lendário',
      type: 'water',
      dex: 382,
      portrait: null,
      quote: 'Um rugido sacode o salão. O lago transborda!'
    },
    bossTuning: { hp: 1.3, damage: 1.2 },
    recommendedLevel: 90,
    bossTeam: ['kyogre_boss'],
    legendaryFight: {
      // o molde das missões (H-5, systems/legendaryFight.js): quem é, a bola e os textos
      kind: 'kyogre', species: 'kyogre', name: 'Kyogre', dex: 382,
      ballName: 'Dive Ball', ballSheet: 'item/dive-ball',
      lostBall: 'O Kyogre se recuperou um pouco! A Dive Ball afundou e volta na próxima vez.',
      finalObjective: 'SOBREVIVA À MARÉ FINAL!', finalToast: 'A água está subindo! Sobreviva à maré final!',
      finalEnd: 'A maré baixou.', finalBanner: 'MARÉ FINAL',
      balls: 3,           // 3 Dive Balls por luta (decisão do Fellipe; eram 2)
      chance: 0.1,        // 10% em cada uma: ~27% numa luta
      floor: 0.15,        // enquanto houver Dive Ball, a vida não passa daqui
      recover: 0.25,      // escapou (ou a bola não foi pega): volta só um pouco (eram 40%)
      exhaust: 8,         // segundos exausto, com a bola no campo
      finalTide: 30,      // a maré final depois da captura
      finalLevel: 72,
      pulseCharge: 0.9,   // o Origin Pulse: segundos parado, carregando, antes dos anéis
      tsunamiAt: [0.66, 0.33],   // o maremoto: aos 66% e aos 33% da vida (e de tempos em tempos na fúria)
      tsunamiWarn: 3,     // o aviso: a bolha de ar marcada no chão antes da onda
      tsunamiDamage: 30,
      summons: [{ id: 'sharpedo', weight: 3 }, { id: 'carvanha', weight: 3 }, { id: 'wailmer', weight: 2 }, { id: 'relicanth', weight: 1 }, { id: 'huntail', weight: 1 }]
    },
    // a fuga e a volta são pela lagoa da vila, não pelo mapa (Game.js)
    returnTo: 'lake',
    capturePool: 'phase9',
    ballChance: 0,
    maxBalls: 0,
    reward: { shards: 500 }
  },

  /* O Endless aquático (0.37, seção 10): depois da captura, o salão vazio com a
     maré sem fim. Sem XP; rende os Shards de cada elite e chefe derrotado. */
  kyogre_endless: {
    id: 'kyogre_endless',
    name: 'Fase secreta — A maré sem fim',
    region: 'Hoenn',
    type: 'legendary',
    icon: 'boss',
    secret: true,
    description: 'O salão vazio, com a maré sem fim.',
    music: 'mus_sevii_dungeon',
    duration: 60,
    noXp: true,
    endlessOnly: true,
    world: { width: 2400, height: 1600, theme: 'cave' },
    weather: 'rain',
    scaling: { hp: 0.6, speed: 0.25, damage: 0.3 },
    difficulty: 0.8,
    segments: [{ from: 0, name: 'Salão do Kyogre', theme: 'cave', scene: 'kyogre_hall' }],
    waves: [
      { from: 0, to: 60, interval: 0.7, batch: 5, maxAlive: 150, level: [68, 72], enemies: [{ id: 'sharpedo', weight: 3 }, { id: 'carvanha', weight: 3 }, { id: 'wailmer', weight: 2 }, { id: 'crawdaunt', weight: 2 }, { id: 'whiscash', weight: 1 }, { id: 'walrein', weight: 1 }, { id: 'relicanth', weight: 1 }, { id: 'milotic', weight: 1 }] }
    ],
    elites: [
      { at: 20, id: 'sharpedo_elite', count: 2, level: 72 },
      { at: 40, id: 'wailord_elite', count: 1, level: 82 }
    ],
    returnTo: 'lake',
    capturePool: 'phase9',
    ballChance: 0,
    maxBalls: 0,
    reward: { shards: 0 }
  },

  /* A MISSÃO DO ZAPDOS (H-6, "Derrote e liberte o Zapdos", PLANEJAMENTO-HISTORIA.md seção 5.1):
     o fundo da Usina, pelo card que sobe no escuro (data/missions.js). O Zapdos acorrentado
     à máquina do emblema vermelho, que suga a energia dele há muito tempo: por isso ele está
     fraco, e uma equipe logo depois da Fase 3 consegue vencê-lo (o refino do Fellipe). A horda
     elétrica e a tempestade marcada no chão (systems/zapdosFight.js, no molde das missões).
     Sem captura: derrotado, ele cai; na cena de depois (`zapdos_livre`) ele foge, assustado.
     Fora da campanha: vencer não abre fase, abre a história. */
  zapdos: {
    id: 'zapdos',
    name: 'Missão — O fundo da Usina',
    region: 'Kanto',
    type: 'legendary',
    icon: 'boss',
    secret: true,
    mission: 'zapdos',
    description: 'O Zapdos, preso por correntes numa máquina que suga a energia dele, no fundo da Usina.',
    music: 'mus_poke_mansion', leaderMusic: 'mus_vs_legend',
    duration: 45,
    xpScale: 1.1,
    world: { width: 2400, height: 1600, theme: 'gym' },
    scaling: { hp: 0.6, speed: 0.25, damage: 0.3 },
    difficulty: 1.1,
    segments: [{ from: 0, name: 'O fundo da Usina', theme: 'gym', scene: 'usina_arena' }],
    waves: [
      // os 45 s com ele preso: a horda elétrica da Usina
      { from: 0, to: 44, interval: 0.7, batch: 5, maxAlive: 140, level: [32, 36], enemies: [{ id: 'voltorb', weight: 3 }, { id: 'magnemite', weight: 3 }, { id: 'pikachu', weight: 2 }, { id: 'electrode', weight: 2 }, { id: 'magneton', weight: 2 }, { id: 'electabuzz', weight: 1 }, { id: 'raichu', weight: 1 }] },
      // com o Zapdos solto, a horda continua, mais leve
      { from: 45, to: 9999, interval: 2, batch: 3, maxAlive: 30, level: [32, 36], enemies: [{ id: 'voltorb', weight: 3 }, { id: 'magnemite', weight: 3 }, { id: 'electrode', weight: 2 }, { id: 'magneton', weight: 2 }] }
    ],
    elites: [
      { at: 14, id: 'electrode_elite', count: 2, level: 36 },
      { at: 30, id: 'electabuzz_elite', count: 1, level: 36 }
    ],
    leader: {
      name: 'ZAPDOS',
      title: 'Pokémon lendário',
      type: 'electric',
      dex: 145,
      portrait: null,
      quote: 'A máquina sugou a energia dele por muito tempo. Ele está fraco, mas fora de si!'
    },
    recommendedLevel: 36,
    bossTeam: ['zapdos_boss'],
    legendaryFight: {
      kind: 'zapdos', species: 'zapdos', name: 'Zapdos', dex: 145,
      // sem captura (o refino do Fellipe): fraco e assustado, ele foge na cena de depois, e a
      // captura fica para outro momento. Sem bolas, o molde não tem piso de vida nem leva final
      balls: 0,
      machine: [1200, 660],     // a máquina do emblema vermelho, logo acima de onde o treinador chega (px do mundo)
      dim: 0.3,                 // o fundo da Usina é escuro
      cannonCharge: 0.9,        // o Zap Cannon: segundos parado, carregando
      peckWarn: 0.85,           // a Investida: a faixa acesa antes dele cruzar
      stormEvery: [3.2, 2.4, 1.8, 1.3],   // a tempestade: um raio a cada (preso, solto, abaixo de 50%, fúria)
      stormAt: [0.66, 0.33],    // a tempestade total: aos 66% e aos 33% (e de tempos em tempos na fúria)
      stormCell: 200,           // a casa do tabuleiro de raios
      stormWarn: 1.5,           // a primeira leva cai depois disso; as outras, `stormGap` depois
      stormGap: 1.0,
      // o dano de cada golpe (na escala dos golpes dos líderes)
      damage: { storm: 7, cannon: 12, zap: 2, peck: 10, discharge: 6, cell: 11, dive: 8 },
      summons: [{ id: 'voltorb', weight: 3 }, { id: 'electrode', weight: 2 }, { id: 'magneton', weight: 2 }, { id: 'electabuzz', weight: 1 }]
    },
    // a volta é pela Usina (Game.js): vencer leva à cena `zapdos_livre`; cair, ao Centro
    returnTo: 'mission',
    capturePool: 'phase6',
    ballChance: 0,
    maxBalls: 0,
    reward: { shards: 300 }
  },

  /* A MISSÃO DO ARTICUNO (H-7, "Derrote e liberte o Articuno", PLANEJAMENTO-HISTORIA.md seção 5.2):
     o fundo das Ilhas Seafoam, pelo card que sobe da margem (data/missions.js). O Articuno
     acorrentado à máquina do emblema vermelho coberta de gelo, que suga a energia dele: por isso
     ele está fraco, e uma equipe logo depois da Fase 7 consegue vencê-lo. A horda de Seafoam, a
     nevasca o tempo todo (a névoa que esconde a horda e o gelo no chão que deixa o treinador lento)
     e o Frio Absoluto com o olho da nevasca (systems/articunoFight.js, no molde das missões).
     Sem captura: derrotado, ele cai; na cena de depois (`articuno_livre`) ele foge, assustado.
     Fora da campanha: vencer não abre fase sozinho, destrava a Fase 8 (o `lock` dela). */
  articuno: {
    id: 'articuno',
    name: 'Missão — O fundo das Ilhas Seafoam',
    region: 'Kanto',
    type: 'legendary',
    icon: 'boss',
    secret: true,
    mission: 'articuno',
    description: 'O Articuno, preso por correntes numa máquina coberta de gelo que suga a energia dele, no fundo das Ilhas Seafoam.',
    music: 'mus_sevii_dungeon', leaderMusic: 'mus_vs_legend',
    duration: 45,
    xpScale: 1.1,
    world: { width: 2400, height: 1600, theme: 'cave' },
    scaling: { hp: 0.6, speed: 0.25, damage: 0.3 },
    difficulty: 1.2,
    segments: [{ from: 0, name: 'O fundo das Ilhas Seafoam', theme: 'cave', scene: 'seafoam_arena' }],
    waves: [
      // os 45 s com ele preso: a horda de Seafoam
      { from: 0, to: 44, interval: 0.7, batch: 5, maxAlive: 140, level: [52, 56], enemies: [{ id: 'seel', weight: 3 }, { id: 'shellder', weight: 3 }, { id: 'dewgong', weight: 2 }, { id: 'cloyster', weight: 2 }, { id: 'slowpoke', weight: 2 }, { id: 'slowbro', weight: 1 }, { id: 'psyduck', weight: 2 }, { id: 'golduck', weight: 2 }, { id: 'zubat', weight: 2 }, { id: 'golbat', weight: 1 }] },
      // com o Articuno solto, a horda continua, mais leve
      { from: 45, to: 9999, interval: 2, batch: 3, maxAlive: 30, level: [52, 56], enemies: [{ id: 'seel', weight: 3 }, { id: 'shellder', weight: 3 }, { id: 'dewgong', weight: 2 }, { id: 'golbat', weight: 1 }] }
    ],
    elites: [
      { at: 14, id: 'dewgong_elite', count: 2, level: 56 },
      { at: 30, id: 'cloyster_elite', count: 1, level: 56 }
    ],
    leader: {
      name: 'ARTICUNO',
      title: 'Pokémon lendário',
      type: 'ice',
      dex: 144,
      portrait: null,
      quote: 'A máquina sugou a energia dele por muito tempo. Ele está fraco, mas fora de si!'
    },
    recommendedLevel: 57,
    bossTeam: ['articuno_boss'],
    legendaryFight: {
      kind: 'articuno', species: 'articuno', name: 'Articuno', dex: 144,
      // sem captura, como o Zapdos (decisão 16): fraco e assustado, ele foge na cena de depois
      balls: 0,
      machine: [1200, 660],     // a máquina coberta de gelo, logo acima de onde o treinador chega (px do mundo)
      sight: [420, 340, 280],   // a névoa: o alcance da vista (cheio, abaixo de 50%, na fúria)
      iceLife: 8,               // o gelo que os golpes deixam no chão dura isso
      iceSlow: 0.4,             // em cima do gelo, o treinador anda 40% mais devagar
      beamWarn: 1.2,            // o Raio de Gelo: a mira acesa antes do raio
      coneWarn: 1.1,            // a Nevasca: o cone aceso antes da rajada
      coneSpread: 0.42,         // a metade da abertura do cone (radianos)
      coneLength: 620,
      coldAt: [0.66, 0.33],     // o Frio Absoluto: aos 66% e aos 33% (e a cada `coldEvery` s na fúria)
      coldEvery: 24,
      coldTime: 9,              // a geada dura isso, com o olho andando
      coldSlow: 0.4,            // fora do olho, o treinador anda 40% mais devagar
      eyeRadius: 190,           // o olho da nevasca
      // o dano de cada golpe (na escala dos golpes dos líderes); o frio é a cada meio segundo fora do olho
      damage: { beam: 12, cone: 11, ring: 7, cold: 2.5, dive: 9 },
      summons: [{ id: 'seel', weight: 3 }, { id: 'dewgong', weight: 2 }, { id: 'cloyster', weight: 2 }, { id: 'golbat', weight: 1 }]
    },
    // a volta é pela margem do fundo (Game.js): vencer leva à cena `articuno_livre`; cair, ao Centro
    returnTo: 'mission',
    capturePool: 'phase7',
    ballChance: 0,
    maxBalls: 0,
    reward: { shards: 300 }
  },

  /* A MISSÃO DO MOLTRES (H-8, "Derrote e liberte o Moltres", PLANEJAMENTO-HISTORIA.md seção 5.3):
     o cume do Monte Brasa, pelo card que sobe no alto (data/missions.js). O Moltres acorrentado à
     máquina do emblema vermelho em brasa, que suga a energia dele: por isso ele está fraco, e uma
     equipe logo depois da Fase 8 consegue vencê-lo. A horda do Monte Brasa, o Sol forte o tempo
     todo (Fogo ×1,5 e Água ×0,5, o contrário da chuva do Kyogre) e o chão em brasa, o Lança-chamas
     que varre, o Redemoinho de Fogo, a Onda de Calor e o Fogo Sagrado com a sombra das rochas
     (systems/moltresFight.js, no molde das missões). Sem captura: derrotado, ele cai; na cena de
     depois (`moltres_livre`) ele foge, assustado. Vencer destrava a Liga (o `lock` da Lorelei). */
  moltres: {
    id: 'moltres',
    name: 'Missão — O cume do Monte Brasa',
    region: 'Kanto',
    type: 'legendary',
    icon: 'boss',
    secret: true,
    mission: 'moltres',
    description: 'O Moltres, preso por correntes numa máquina em brasa que suga a energia dele, no cume do Monte Brasa.',
    music: 'mus_victory_road', leaderMusic: 'mus_vs_legend',
    duration: 45,
    xpScale: 1.1,
    world: { width: 2400, height: 1600, theme: 'cave' },
    weather: 'sun',
    scaling: { hp: 0.6, speed: 0.25, damage: 0.3 },
    difficulty: 1.2,
    segments: [{ from: 0, name: 'O cume do Monte Brasa', theme: 'cave', scene: 'brasa_arena' }],
    waves: [
      // os 45 s com ele preso: a horda do Monte Brasa
      { from: 0, to: 44, interval: 0.7, batch: 5, maxAlive: 140, level: [58, 62], enemies: [{ id: 'ponyta', weight: 3 }, { id: 'rapidash', weight: 2 }, { id: 'magmar', weight: 2 }, { id: 'geodude_wild', weight: 3 }, { id: 'machop', weight: 2 }, { id: 'machoke', weight: 2 }, { id: 'spearow', weight: 2 }, { id: 'fearow', weight: 1 }] },
      // com o Moltres solto, a horda continua, mais leve
      { from: 45, to: 9999, interval: 2, batch: 3, maxAlive: 30, level: [58, 62], enemies: [{ id: 'ponyta', weight: 3 }, { id: 'rapidash', weight: 2 }, { id: 'magmar', weight: 2 }, { id: 'machoke', weight: 1 }] }
    ],
    elites: [
      { at: 14, id: 'rapidash_elite', count: 2, level: 62 },
      { at: 30, id: 'magmar_elite', count: 1, level: 62 }
    ],
    leader: {
      name: 'MOLTRES',
      title: 'Pokémon lendário',
      type: 'fire',
      dex: 146,
      portrait: null,
      quote: 'A máquina sugou a energia dele por muito tempo. Ele está fraco, mas fora de si!'
    },
    recommendedLevel: 62,
    bossTeam: ['moltres_boss'],
    legendaryFight: {
      kind: 'moltres', species: 'moltres', name: 'Moltres', dex: 146,
      // sem captura, como o Zapdos e o Articuno (decisão 16): ele foge na cena de depois
      balls: 0,
      machine: [1200, 660],     // a máquina em brasa, logo acima de onde o treinador chega (px do mundo)
      burnLife: 8,              // o fogo que os golpes deixam no chão dura isso
      sweepWarn: 1.2,           // o Lança-chamas: o leque aceso antes da chama
      sweepTime: 1.0,           // ...e o tempo da varredura, de uma ponta à outra
      sweepArc: 1.1,            // a abertura do leque (radianos)
      sweepRange: 640,
      spinRadius: 240,          // o Redemoinho de Fogo: o anel começa com este raio...
      spinEnd: 70,              // ...e fecha até este
      spinTime: 3.2,            // em tantos segundos
      spinGap: 0.8,             // a abertura da saída (radianos)
      sacredAt: [0.66, 0.33],   // o Fogo Sagrado: aos 66% e aos 33% (e a cada `sacredEvery` s na fúria)
      sacredEvery: 24,
      sacredTime: 9,            // o fogo cai por tanto tempo, com as sombras girando
      rocks: 4,                 // as rochas que sobem do chão
      shadowLength: 280,        // o comprimento da sombra de cada rocha
      // o dano de cada golpe (na escala dos golpes dos líderes); o chão em brasa, o anel do
      // redemoinho e o fogo sagrado contam a cada meio segundo
      damage: { sweep: 10, spin: 4, ring: 6, burn: 1.6, sacred: 2.2, dive: 8 },
      summons: [{ id: 'ponyta', weight: 3 }, { id: 'rapidash', weight: 2 }, { id: 'magmar', weight: 2 }, { id: 'machoke', weight: 1 }]
    },
    // a volta é pelo cume (Game.js): vencer leva à cena `moltres_livre`; cair, ao Centro
    returnTo: 'mission',
    capturePool: 'phase8',
    ballChance: 0,
    maxBalls: 0,
    reward: { shards: 300 }
  }
};

/**
 * O inicial do rival (0.39, a cena do laboratório em data/cutscenes.js): o que leva
 * vantagem sobre o do jogador, como no FireRed. É o mesmo do time dele no Campeão
 * (`bossTeamByStarter`: Blastoise, Charizard ou Venusaur).
 */
export const RIVAL_STARTER = { charmander: 'squirtle', bulbasaur: 'charmander', squirtle: 'bulbasaur' };

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

/**
 * O progresso que as travas olham: as fases vencidas e, como `scene:<id>`, as cenas já vistas
 * (H-9: a Liga espera a cena do subsolo da Mansão, uma missão sem luta).
 */
export function storyProgress(campaign) {
  const scenes = Object.entries(campaign?.scenes ?? {}).filter(([, state]) => state === 'seen').map(([id]) => `scene:${id}`);
  return [...(campaign?.clearedStages ?? []), ...scenes];
}

/** As travas da história de uma fase (`lock`: uma ou uma lista, na ordem em que valem). */
export function locksOf(stage) {
  return !stage?.lock ? [] : Array.isArray(stage.lock) ? stage.lock : [stage.lock];
}

/** A trava já vale? (`after`: só depois de uma cena, H-9) E já foi cumprida? */
const lockActive = (lock, progress) => !lock.after || progress.includes(`scene:${lock.after}`);
const lockMet = (lock, progress) => progress.includes(lock.scene ? `scene:${lock.scene}` : lock.stage);

/** Uma fase está liberada se não depende de ninguém ou se a dependência foi concluída. */
export function isStageUnlocked(stageId, progress = []) {
  const stage = STAGES[stageId];
  if (!stage) return false;
  if (stage.unlockedBy && !progress.includes(stage.unlockedBy)) return false;
  // as travas da história (`lock`, H-4): a fase espera outra (a missão do Zapdos) ou uma cena (H-9)
  return locksOf(stage).every((lock) => !lockActive(lock, progress) || lockMet(lock, progress));
}

/**
 * A fase já estaria aberta pela anterior, mas espera uma trava da história? Devolve a trava que
 * segura (o texto, o botão e o lugar do mapa) ou null.
 */
export function storyLocked(stageId, progress = []) {
  const stage = STAGES[stageId];
  if (stage?.unlockedBy && !progress.includes(stage.unlockedBy)) return null;
  return locksOf(stage).find((lock) => lockActive(lock, progress) && !lockMet(lock, progress)) ?? null;
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
