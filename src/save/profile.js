import { CONFIG } from '../core/config.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { KANTO_TOTAL } from '../data/kanto.js';
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
    campaign: {
      region: 'Kanto',
      starter: null,
      clearedStages: [],
      badges: [],
      lastStage: null,
      // "jornada": equipe, build e nível levados de uma fase para a seguinte.
      // É atualizada a cada fase concluída e serve de checkpoint em caso de derrota.
      journey: null
    }
  };
}

/** Garante que um perfil carregado tenha todos os campos atuais. */
export function normalizeProfile(loaded) {
  const base = createProfile();
  if (!loaded || typeof loaded !== 'object') return base;
  return {
    ...base,
    ...loaded,
    pokedex: { ...base.pokedex, ...(loaded.pokedex ?? {}) },
    achievements: { ...base.achievements, ...(loaded.achievements ?? {}) },
    trainerUpgrades: { ...base.trainerUpgrades, ...(loaded.trainerUpgrades ?? {}) },
    // saves antigos guardavam "coins"; vira shards sem perder nada
    shards: loaded.shards ?? loaded.coins ?? base.shards,
    stats: { ...base.stats, ...(loaded.stats ?? {}) },
    campaign: { ...base.campaign, ...(loaded.campaign ?? {}) }
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
    p.stats.runsPlayed++;
    p.stats.playTime += Math.round(time ?? 0);
    p.stats.maxRunLevel = Math.max(p.stats.maxRunLevel, level ?? 0);
    if (teamSize >= CONFIG.team.maxSize) p.stats.fullTeams++;

    if (victory) {
      p.stats.stagesCleared++;
      p.stats.bossesDefeated++;
      // Shards da fase (com bônus na primeira vez)
      const firstTime = !p.campaign.clearedStages.includes(stage.id);
      const reward = (stage.reward?.shards ?? CONFIG.shards.perStageClear)
                     + (firstTime ? CONFIG.shards.firstClearBonus : 0);
      this.addShards(reward);
      // a equipe e a build seguem para a próxima fase da jornada
      if (journey) p.campaign.journey = journey;
      if (!p.campaign.clearedStages.includes(stage.id)) p.campaign.clearedStages.push(stage.id);
      if (stage.badge && !p.campaign.badges.includes(stage.badge)) {
        p.campaign.badges.push(stage.badge);
        p.stats.badges = p.campaign.badges.length;
      }
    }
    p.campaign.lastStage = stage.id;
    this.refreshDexCount();
    return this.checkAchievements();
  }

  get dexProgress() {
    return { caught: this.profile.pokedex.caught.length, total: KANTO_TOTAL };
  }
}
