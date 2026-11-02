import { CONFIG } from '../core/config.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { KANTO_TOTAL } from '../data/kanto.js';
import { REGIONS, DEFAULT_REGION } from '../data/regions.js';
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
      caught: []
    },
    achievements: {
      unlocked: [],   // objetivo alcançado
      claimed: [],    // shards já coletados pelo jogador
      progress: {}
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
      playTime: 0
    },
    // a campanha é guardada por região (data/regions.js); `region` é a da jornada atual
    region: DEFAULT_REGION,
    regions: { [DEFAULT_REGION]: createRegionProgress() }
  };
}

/** Progresso de campanha de uma região. */
export function createRegionProgress() {
  return {
    starter: null,
    clearedStages: [],
    badges: [],
    lastStage: null,
    // "jornada": equipe, build e nível levados de uma fase para a seguinte.
    // É atualizada a cada fase concluída e serve de checkpoint em caso de derrota.
    journey: null
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
    achievements: { ...base.achievements, ...(loaded.achievements ?? {}) },
    trainerUpgrades: { ...base.trainerUpgrades, ...(loaded.trainerUpgrades ?? {}) },
    // saves antigos guardavam "coins"; vira shards sem perder nada
    shards: loaded.shards ?? loaded.coins ?? base.shards,
    stats,
    region: REGIONS[loaded.region] ? loaded.region : base.region,
    regions
  };
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
    bus.on(EVENTS.ENEMY_KILLED, () => { this.profile.stats.totalKills++; });
    bus.on(EVENTS.POKEMON_CAPTURED, ({ dex }) => {
      this.profile.stats.totalCaptures++;
      this.registerCaught(dex);
      this.checkAchievements();
    });
  }

  /** Capturar (ou escolher como inicial) registra na Pokédex. */
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
    this.profile.shards = Math.max(0, Math.round((this.profile.shards ?? 0) + amount));
    bus.emit(EVENTS.SHARDS_EARNED, { amount, total: this.profile.shards });
    return amount;
  }

  /** Conquistas concluídas e ainda não coletadas. */
  get claimableAchievements() {
    const { unlocked, claimed } = this.profile.achievements;
    return ACHIEVEMENTS.filter((a) => unlocked.includes(a.id) && !claimed.includes(a.id));
  }

  /** Coleta os Shards de uma conquista concluída. */
  claimAchievement(id) {
    const { unlocked, claimed } = this.profile.achievements;
    if (!unlocked.includes(id) || claimed.includes(id)) return 0;
    const achievement = ACHIEVEMENTS.find((a) => a.id === id);
    const amount = achievement?.reward?.shards ?? achievement?.reward?.coins ?? CONFIG.shards.perAchievement;
    claimed.push(id);
    this.addShards(amount);
    return amount;
  }

  refreshDexCount() {
    this.profile.stats.dexCaught = this.profile.pokedex.caught.length;
  }

  /** Verifica todas as conquistas e devolve as recém-desbloqueadas. */
  checkAchievements() {
    const unlockedNow = [];
    const { unlocked } = this.profile.achievements;

    for (const achievement of ACHIEVEMENTS) {
      const value = this.profile.stats[achievement.stat] ?? 0;
      this.profile.achievements.progress[achievement.id] = value;
      if (unlocked.includes(achievement.id)) continue;
      if (value >= achievement.goal) {
        // Conquista concluída: os Shards ficam guardados para o jogador
        // coletar na aba Conquistas (não entram sozinhos).
        unlocked.push(achievement.id);
        unlockedNow.push(achievement);
        bus.emit(EVENTS.TOAST, {
          text: `Conquista concluída: ${achievement.name} — colete os Shards!`,
          icon: achievement.icon
        });
      }
    }
    return unlockedNow;
  }

  /** Aplica o resultado de uma partida ao perfil. */
  applyRunResult({ stage, victory, level, teamSize, stats, time, journey = null }) {
    const p = this.profile;
    const campaign = regionProgress(p);
    p.stats.runsPlayed++;
    p.stats.playTime += Math.round(time ?? 0);
    p.stats.maxRunLevel = Math.max(p.stats.maxRunLevel, level ?? 0);
    if (teamSize >= CONFIG.team.maxSize) p.stats.fullTeams++;

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
