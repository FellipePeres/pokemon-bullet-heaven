import { CONFIG } from '../core/config.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { KANTO_TOTAL } from '../data/kanto.js';
import { REGIONS, DEFAULT_REGION } from '../data/regions.js';
import { recordStageResult } from '../systems/stageStats.js';
import { STAGES } from '../data/stages.js';
import { bus, EVENTS } from '../core/events.js';

/**
 * PERFIL — tudo o que sobrevive entre partidas:
 * Pokédex, conquistas, estatísticas e progresso de campanha.
 *
 * É propositalmente "burro": só dados simples, fáceis de serializar em JSON
 * e fáceis de estender (basta adicionar campos, o merge cuida dos saves antigos).
 */
export function createProfile() {
  return {
    createdAt: new Date().toISOString(),
    trainerName: 'Treinador',
    // modelo de treinador escolhido no começo (data/trainers.js); null = ainda não escolheu
    trainer: null,
    // Pokédex: só registra o que foi CAPTURADO. O que não foi aparece como silhueta.
    pokedex: {
      caught: [],
      shiny: []       // espécies que você já teve shiny (0.13.1)
    },
    achievements: {
      // degraus coletados de cada conquista (data/achievements.js): { catcher: 2, ... }
      tiers: {},
      // até que degrau o jogador já foi avisado (o aviso sai uma vez por degrau)
      notified: {},
      // das conquistas antigas (antes da 0.11), guardadas só para não perder o histórico
      unlocked: [],
      claimed: []
    },
    /** Shards: vêm das fases e das conquistas. */
    shards: 0,
    stats: {
      runsPlayed: 0,
      totalKills: 0,
      totalCaptures: 0,
      stagesCleared: 0,
      bossesDefeated: 0,
      maxRunLevel: 0,
      fullTeams: 0,
      badges: 0,
      dexCaught: 0,
      playTime: 0,
      // desde a 0.11, para as conquistas em níveis
      elitesDefeated: 0,
      leaderPokemonDefeated: 0,
      evolutions: 0,
      upgradesPicked: 0,
      tmsLearned: 0,
      magnets: 0,
      damageDealt: 0,
      flawlessClears: 0,
      shardsEarned: 0,
      champions: 0,
      shinyCaught: 0
    },
    // equipes campeãs (Hall da Fama): { date, trainer, region, team: [{ pokemonId, level }] }
    hallOfFame: [],
    // a campanha é guardada por região (data/regions.js); `region` é a da jornada atual
    region: DEFAULT_REGION,
    regions: { [DEFAULT_REGION]: createRegionProgress() },
    // OS ESPAÇOS DE JORNADA (0.19, pedido do Fellipe: "fazer mais de uma jornada
    // com novos Pokémon, mas poder voltar para a outra"). A jornada ATIVA mora nos
    // campos de cima (`trainer`, `region`, `regions`; a partida em andamento é o
    // `run` do save), e todo o resto do jogo continua lendo dali. Cada espaço
    // guarda a sua em `data` enquanto está guardado (null enquanto é a ativa).
    // Pokédex, conquistas, Shards e Hall da Fama são do jogador e valem para todas.
    journeys: [],          // [{ id, createdAt, updatedAt, data: { trainer, region, regions } | null, pendingRun }]
    activeJourney: null    // o id do espaço que está nos campos de cima
  };
}

/** Um espaço de jornada novo (vazio até o jogador escolher treinador e inicial). */
export function createJourneySlot() {
  const now = new Date().toISOString();
  const id = `journey-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return { id, createdAt: now, updatedAt: now, data: null, pendingRun: null };
}

/** Progresso de campanha de uma região. */
export function createRegionProgress() {
  return {
    starter: null,
    starterShiny: false,   // o inicial veio shiny (0.13.2)
    clearedStages: [],
    badges: [],
    lastStage: null,
    // "jornada": equipe, build e nível levados de uma fase para a seguinte.
    // É atualizada a cada fase concluída e serve de checkpoint em caso de derrota.
    journey: null,
    // métricas de cada fase, para o Estojo de Insígnias (0.13; systems/stageStats.js)
    stageStats: {}
  };
}

/** Progresso da região informada (por padrão, a da jornada atual). */
export function regionProgress(profile, regionId = profile.region) {
  profile.regions[regionId] ??= createRegionProgress();
  return profile.regions[regionId];
}

/** Insígnias somadas de todas as regiões. */
export function countBadges(profile) {
  return Object.values(profile.regions).reduce((total, region) => total + region.badges.length, 0);
}

/** As campanhas de um save, com todos os campos atuais (e as migrações antigas). */
function normalizeRegions(loadedRegions, legacy = null) {
  const regions = { [DEFAULT_REGION]: createRegionProgress() };
  for (const [id, progress] of Object.entries(loadedRegions ?? {})) {
    regions[id] = { ...createRegionProgress(), ...progress };
  }
  // saves de antes das regiões guardavam a campanha de Kanto em `campaign`
  if (!loadedRegions && legacy) {
    const { region, ...progress } = legacy;   // `region: 'Kanto'` era só um rótulo
    regions.kanto = { ...createRegionProgress(), ...progress };
  }
  // Até a 0.4 a insígnia não era registrada (procurava `stage.badge`, que não
  // existe). Quem já venceu um ginásio recebe a dele ao carregar o save.
  for (const progress of Object.values(regions)) {
    for (const stageId of progress.clearedStages) {
      const badge = STAGES[stageId]?.leader?.badge;
      if (badge && !progress.badges.includes(badge)) progress.badges.push(badge);
    }
  }
  return regions;
}

/** Os espaços de jornada de um save; o de antes da 0.19 vira o espaço 1. */
function normalizeJourneys(loaded, regions) {
  if (!Array.isArray(loaded.journeys)) {
    // save antigo: a jornada que ele tem (se já começou) vira o primeiro espaço
    const region = REGIONS[loaded.region] ? loaded.region : DEFAULT_REGION;
    if (!regions[region]?.starter) return { journeys: [], activeJourney: null };
    const slot = createJourneySlot();
    return { journeys: [slot], activeJourney: slot.id };
  }
  const journeys = loaded.journeys.filter((slot) => slot?.id).map((slot) => ({
    ...createJourneySlot(),
    ...slot,
    data: slot.data ? {
      trainer: slot.data.trainer ?? null,
      region: REGIONS[slot.data.region] ? slot.data.region : DEFAULT_REGION,
      regions: normalizeRegions(slot.data.regions)
    } : null,
    pendingRun: slot.pendingRun ?? null
  }));
  const activeJourney = journeys.some((slot) => slot.id === loaded.activeJourney) ? loaded.activeJourney : null;
  return { journeys, activeJourney };
}

/** Os degraus guardados, só das conquistas que ainda existem. */
function knownAchievements(record = {}) {
  return Object.fromEntries(Object.entries(record ?? {}).filter(([id]) => ACHIEVEMENTS.some((a) => a.id === id)));
}

/** Garante que um perfil carregado tenha todos os campos atuais. */
export function normalizeProfile(loaded) {
  const base = createProfile();
  if (!loaded || typeof loaded !== 'object') return base;

  // `trainerUpgrades` era a loja do treinador (saiu na 0.21): fica fora do save
  const { campaign: legacy, trainerUpgrades: _shop, ...rest } = loaded;
  const regions = normalizeRegions(loaded.regions, legacy);
  const stats = { ...base.stats, ...(loaded.stats ?? {}) };
  stats.badges = countBadges({ regions });

  return {
    ...base,
    ...rest,
    pokedex: { ...base.pokedex, ...(loaded.pokedex ?? {}) },
    achievements: {
      ...base.achievements,
      ...(loaded.achievements ?? {}),
      // só as conquistas que existem (a 'shop' saiu com a loja na 0.21)
      tiers: knownAchievements(loaded.achievements?.tiers),
      notified: knownAchievements(loaded.achievements?.notified)
    },
    // saves antigos guardavam "coins"; vira shards sem perder nada
    shards: loaded.shards ?? loaded.coins ?? base.shards,
    stats,
    region: REGIONS[loaded.region] ? loaded.region : base.region,
    regions,
    ...normalizeJourneys(loaded, regions)
  };
}

/** I, II, III... — o degrau de uma conquista. */
export function roman(n) {
  return ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] ?? String(n);
}

/**
 * Observa os eventos do jogo e mantém Pokédex, estatísticas e conquistas em dia.
 * Fica fora do gameplay de propósito: o combate não sabe que a Pokédex existe.
 */
export class ProfileTracker {
  constructor(profile) {
    this.profile = profile;
    this._bind();
  }

  setProfile(profile) {
    this.profile = profile;
    this.refreshDexCount();
  }

  _bind() {
    const stats = () => this.profile.stats;
    bus.on(EVENTS.ENEMY_KILLED, ({ enemy }) => {
      stats().totalKills++;
      // chefes pagam Shards na hora (0.22): ficam mesmo se a tentativa terminar em derrota
      if (enemy?.boss) { stats().leaderPokemonDefeated++; this.addShards(CONFIG.shards.leaderPokemon); }
      else if (enemy?.elite) { stats().elitesDefeated++; this.addShards(CONFIG.shards.elite); }
    });
    bus.on(EVENTS.POKEMON_CAPTURED, ({ dex, shiny }) => {
      stats().totalCaptures++;
      this.registerCaught(dex);
      if (shiny) {
        stats().shinyCaught = (stats().shinyCaught ?? 0) + 1;
        this.registerShiny(dex);
      }
      this.checkAchievements();
    });
    bus.on(EVENTS.POKEMON_EVOLVED, () => { stats().evolutions++; });
    bus.on(EVENTS.UPGRADE_TAKEN, ({ upgrade }) => {
      if (upgrade?.scope === 'tm') stats().tmsLearned++;
      else stats().upgradesPicked++;
    });
    bus.on(EVENTS.MAGNET_PICKED, () => { stats().magnets++; this.checkAchievements(); });
  }

  /** Capturar (ou escolher como inicial) registra na Pokédex. */
  /** A espécie que você já teve shiny ganha a estrelinha na Pokédex. */
  registerShiny(dex) {
    const seen = (this.profile.pokedex.shiny ??= []);
    if (dex && !seen.includes(dex)) seen.push(dex);
  }

  registerCaught(dex) {
    if (!dex) return;
    const caught = this.profile.pokedex.caught;
    if (!caught.includes(dex)) {
      caught.push(dex);
      this.refreshDexCount();
    }
  }

  /** Crédito de Shards (fases concluídas, conquistas coletadas). */
  addShards(amount) {
    if (!amount) return 0;
    if (amount > 0) this.profile.stats.shardsEarned = (this.profile.stats.shardsEarned ?? 0) + Math.round(amount);
    this.profile.shards = Math.max(0, Math.round((this.profile.shards ?? 0) + amount));
    bus.emit(EVENTS.SHARDS_EARNED, { amount, total: this.profile.shards });
    return amount;
  }

  /**
   * Em que degrau uma conquista está: quantos já foram coletados, o próximo
   * (null quando completa), o valor do contador e se dá para coletar agora.
   */
  tierState(achievement) {
    const claimed = this.profile.achievements.tiers[achievement.id] ?? 0;
    const next = achievement.tiers[claimed] ?? null;
    const value = this.profile.stats[achievement.stat] ?? 0;
    return { claimed, next, value, complete: !next, claimable: !!next && value >= next.goal };
  }

  /** Conquistas com um degrau alcançado e ainda não coletado. */
  get claimableAchievements() {
    return ACHIEVEMENTS.filter((a) => this.tierState(a).claimable);
  }

  /** Coleta os Shards do degrau atual; a conquista volta com o próximo objetivo. */
  claimAchievement(id) {
    const achievement = ACHIEVEMENTS.find((a) => a.id === id);
    if (!achievement) return 0;
    const state = this.tierState(achievement);
    if (!state.claimable) return 0;
    this.profile.achievements.tiers[id] = state.claimed + 1;
    return this.addShards(state.next.shards);
  }

  refreshDexCount() {
    this.profile.stats.dexCaught = this.profile.pokedex.caught.length;
  }

  /** Contadores que se calculam a partir do perfil (e não de eventos). */
  refreshDerivedStats() {
    const p = this.profile;
    p.stats.champions = p.hallOfFame?.length ?? 0;
    this.refreshDexCount();
  }

  /** Avisa (uma vez por degrau) as conquistas que ficaram prontas para coletar; devolve essas. */
  checkAchievements() {
    this.refreshDerivedStats();
    const ready = [];
    const { notified } = this.profile.achievements;
    for (const achievement of ACHIEVEMENTS) {
      const state = this.tierState(achievement);
      if (!state.claimable) continue;
      ready.push(achievement);
      const tier = state.claimed + 1;
      if ((notified[achievement.id] ?? 0) >= tier) continue;
      notified[achievement.id] = tier;
      bus.emit(EVENTS.TOAST, {
        text: `Conquista: ${achievement.name} ${roman(tier)} — colete os Shards!`,
        icon: achievement.icon
      });
    }
    return ready;
  }

  /** Aplica o resultado de uma partida ao perfil. */
  applyRunResult({ stage, victory, level, teamSize, stats, time, journey = null, team = [] }) {
    const p = this.profile;
    const campaign = regionProgress(p);
    campaign.stageStats ??= {};
    campaign.stageStats[stage.id] = recordStageResult(campaign.stageStats[stage.id], {
      victory, time, faints: stats?.faints, level, captures: stats?.captures, damage: stats?.damageDealt,
      team, date: new Date().toISOString()
    });
    p.stats.runsPlayed++;
    p.stats.playTime += Math.round(time ?? 0);
    p.stats.maxRunLevel = Math.max(p.stats.maxRunLevel, level ?? 0);
    p.stats.damageDealt = Math.round((p.stats.damageDealt ?? 0) + (stats?.damageDealt ?? 0));
    if (teamSize >= CONFIG.team.maxSize) p.stats.fullTeams++;
    if (victory && (stats?.faints ?? 0) === 0) p.stats.flawlessClears = (p.stats.flawlessClears ?? 0) + 1;

    // o progresso da tentativa fica, vencendo ou não (0.17): a derrota só não
    // libera a próxima fase — para passar, às vezes é preciso fortalecer a equipe
    if (journey) campaign.journey = journey;

    if (victory) {
      p.stats.stagesCleared++;
      p.stats.bossesDefeated++;
      // Shards da fase: só na primeira vitória (0.22; rejogar não ganha nada)
      const firstTime = !campaign.clearedStages.includes(stage.id);
      if (firstTime) this.addShards((stage.reward?.shards ?? CONFIG.shards.perStageClear) + CONFIG.shards.firstClearBonus);
      if (!campaign.clearedStages.includes(stage.id)) campaign.clearedStages.push(stage.id);
      const badge = stage.leader?.badge;
      if (badge && !campaign.badges.includes(badge)) {
        campaign.badges.push(badge);
        p.stats.badges = countBadges(p);
      }
    }
    campaign.lastStage = stage.id;
    this.refreshDexCount();
    return this.checkAchievements();
  }

  get dexProgress() {
    return { caught: this.profile.pokedex.caught.length, total: KANTO_TOTAL };
  }
}
