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
    /** Shards e melhorias permanentes do treinador (ver data/trainerUpgrades.js). */
    shards: 0,
    trainerUpgrades: {},
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
      trainerUpgradesBought: 0,
      shinyCaught: 0
    },
    // equipes campeãs (Hall da Fama): { date, trainer, region, team: [{ pokemonId, level }] }
    hallOfFame: [],
    // a campanha é guardada por região (data/regions.js); `region` é a da jornada atual
    region: DEFAULT_REGION,
    regions: { [DEFAULT_REGION]: createRegionProgress() }
  };
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

/** Garante que um perfil carregado tenha todos os campos atuais. */
export function normalizeProfile(loaded) {
  const base = createProfile();
  if (!loaded || typeof loaded !== 'object') return base;

  const regions = { ...base.regions };
  for (const [id, progress] of Object.entries(loaded.regions ?? {})) {
    regions[id] = { ...createRegionProgress(), ...progress };
  }
  // saves de antes das regiões guardavam a campanha de Kanto em `campaign`
  const { campaign: legacy, ...rest } = loaded;
  if (!loaded.regions && legacy) {
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
  const stats = { ...base.stats, ...(loaded.stats ?? {}) };
  stats.badges = countBadges({ regions });

  return {
    ...base,
    ...rest,
    pokedex: { ...base.pokedex, ...(loaded.pokedex ?? {}) },
    achievements: {
      ...base.achievements,
      ...(loaded.achievements ?? {}),
      tiers: { ...(loaded.achievements?.tiers ?? {}) },
      notified: { ...(loaded.achievements?.notified ?? {}) }
    },
    trainerUpgrades: { ...base.trainerUpgrades, ...(loaded.trainerUpgrades ?? {}) },
    // saves antigos guardavam "coins"; vira shards sem perder nada
    shards: loaded.shards ?? loaded.coins ?? base.shards,
    stats,
    region: REGIONS[loaded.region] ? loaded.region : base.region,
    regions
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
      if (enemy?.boss) stats().leaderPokemonDefeated++;
      else if (enemy?.elite) stats().elitesDefeated++;
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
    p.stats.trainerUpgradesBought = Object.values(p.trainerUpgrades ?? {}).reduce((sum, v) => sum + (v ?? 0), 0);
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

    if (victory) {
      p.stats.stagesCleared++;
      p.stats.bossesDefeated++;
      // Shards da fase (com bônus na primeira vez)
      const firstTime = !campaign.clearedStages.includes(stage.id);
      const reward = (stage.reward?.shards ?? CONFIG.shards.perStageClear)
                     + (firstTime ? CONFIG.shards.firstClearBonus : 0);
      this.addShards(reward);
      // a equipe e a build seguem para a próxima fase da jornada
      if (journey) campaign.journey = journey;
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
