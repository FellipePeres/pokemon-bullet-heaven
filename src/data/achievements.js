/**
 * CONQUISTAS — em níveis (0.11, pedido do Fellipe).
 *
 * Cada conquista observa um contador do perfil (profile.stats) e tem uma
 * escada de objetivos. Ao coletar a recompensa de um degrau, a mesma
 * conquista volta com o próximo objetivo e uma recompensa maior — capture 5,
 * depois 10, 20, 50, 100, 151 —, até o último degrau, quando fica completa.
 *
 * `description` recebe o objetivo do degrau atual. Para criar uma nova, basta
 * adicionar uma entrada aqui com um `stat` que o ProfileTracker conte.
 */
// as recompensas foram reescaladas na 0.22 (~11% do que eram): a economia nova paga
// 10 por Pokémon de líder e 5 por chefe simples, e uma jornada rende ~3.000
const tiers = (goals, shards) => goals.map((goal, i) => ({ goal, shards: shards[i] }));
const n = (value) => value.toLocaleString('pt-BR');

export const ACHIEVEMENTS = [
  /* ---- captura e Pokédex ---- */
  { id: 'catcher', name: 'Colecionador', icon: 'ball', stat: 'totalCaptures',
    description: (g) => `Capture ${n(g)} Pokémon.`,
    tiers: tiers([5, 10, 20, 50, 100, 151], [10, 10, 10, 20, 40, 65]) },
  { id: 'pokedex', name: 'Pokédex', icon: 'pokedex', stat: 'dexCaught',
    description: (g) => `Registre ${n(g)} espécies diferentes na Pokédex.`,
    tiers: tiers([10, 25, 50, 75, 100, 151], [10, 15, 25, 35, 50, 165]) },
  { id: 'shiny', name: 'Brilho Raro', icon: 'ball', stat: 'shinyCaught',
    description: (g) => `Capture ${g === 1 ? 'um Pokémon shiny' : `${n(g)} Pokémon shiny`}.`,
    tiers: tiers([1, 3, 5, 10], [20, 45, 70, 110]) },
  { id: 'full_team', name: 'Equipe Completa', icon: 'team', stat: 'fullTeams',
    description: (g) => `Termine ${n(g)} partida(s) com 6 Pokémon na equipe.`,
    tiers: tiers([1, 5, 15, 40], [10, 15, 30, 50]) },

  /* ---- combate ---- */
  { id: 'hunter', name: 'Caçador', icon: 'kills', stat: 'totalKills',
    description: (g) => `Derrote ${n(g)} Pokémon selvagens.`,
    tiers: tiers([100, 500, 1000, 5000, 10000, 50000], [10, 10, 15, 35, 55, 130]) },
  { id: 'elite_hunter', name: 'Caça aos Fortes', icon: 'boss', stat: 'elitesDefeated',
    description: (g) => `Derrote ${n(g)} Pokémon de elite.`,
    tiers: tiers([5, 25, 75, 200, 500], [10, 10, 20, 40, 75]) },
  { id: 'leader_slayer', name: 'Desafiante', icon: 'boss', stat: 'leaderPokemonDefeated',
    description: (g) => `Derrote ${n(g)} Pokémon de líderes.`,
    tiers: tiers([2, 10, 25, 50, 100], [10, 15, 30, 50, 90]) },
  { id: 'damage', name: 'Poder Bruto', icon: 'damage', stat: 'damageDealt',
    description: (g) => `Cause ${n(g)} de dano no total.`,
    tiers: tiers([10000, 100000, 500000, 2000000, 10000000], [10, 15, 25, 50, 100]) },
  { id: 'flawless', name: 'Sem um Arranhão', icon: 'regen', stat: 'flawlessClears',
    description: (g) => `Vença ${n(g)} fase(s) sem nenhum Pokémon desmaiar.`,
    tiers: tiers([1, 3, 8, 13], [15, 35, 55, 100]) },

  /* ---- jornada ---- */
  { id: 'stages', name: 'Viajante', icon: 'stages', stat: 'stagesCleared',
    description: (g) => `Vença ${n(g)} fase(s).`,
    tiers: tiers([1, 3, 5, 10, 25, 50], [10, 15, 25, 40, 65, 110]) },
  { id: 'badges', name: 'Insígnias', icon: 'badge', stat: 'badges',
    description: (g) => `Conquiste ${n(g)} insígnia(s) de ginásio.`,
    tiers: tiers([1, 2, 4, 6, 8], [15, 20, 30, 45, 75]) },
  { id: 'champion', name: 'Campeão', icon: 'boss', stat: 'champions',
    description: (g) => `Vença o Campeão ${g === 1 ? 'pela primeira vez' : `${n(g)} vezes`} e entre para o Hall da Fama.`,
    tiers: tiers([1, 3, 5], [165, 90, 130]) },
  { id: 'runs', name: 'Persistente', icon: 'speed', stat: 'runsPlayed',
    description: (g) => `Jogue ${n(g)} partida(s), vencendo ou não.`,
    tiers: tiers([1, 5, 10, 25, 50, 100], [10, 10, 10, 20, 35, 55]) },
  { id: 'play_time', name: 'Dedicação', icon: 'haste', stat: 'playTime',
    description: (g) => `Jogue por ${g >= 3600 ? `${n(g / 3600)} hora(s)` : `${n(g / 60)} minutos`} no total.`,
    tiers: tiers([1800, 3600, 3 * 3600, 10 * 3600, 24 * 3600], [10, 15, 30, 55, 100]) },

  /* ---- crescimento ---- */
  { id: 'level', name: 'Treinador Veterano', icon: 'levelUp', stat: 'maxRunLevel',
    description: (g) => `Leve um Pokémon ao nível ${n(g)}.`,
    tiers: tiers([10, 20, 30, 40, 50, 70, 100], [10, 10, 15, 20, 30, 45, 75]) },
  { id: 'evolutions', name: 'Evolução', icon: 'evolution', stat: 'evolutions',
    description: (g) => `Veja ${n(g)} evolução(ões).`,
    tiers: tiers([1, 5, 15, 40, 80], [10, 10, 20, 40, 65]) },
  { id: 'upgrades', name: 'Estrategista', icon: 'power', stat: 'upgradesPicked',
    description: (g) => `Escolha ${n(g)} melhorias de golpe.`,
    tiers: tiers([10, 50, 150, 400, 1000], [10, 10, 20, 40, 65]) },
  { id: 'tms', name: 'Biblioteca de TMs', icon: 'tm', stat: 'tmsLearned',
    description: (g) => `Ensine ${n(g)} TM(s).`,
    tiers: tiers([1, 3, 10, 25], [10, 15, 30, 55]) },
  { id: 'magnets', name: 'Atração', icon: 'chains', stat: 'magnets',
    description: (g) => `Pegue ${n(g)} Ímã(s).`,
    tiers: tiers([1, 3, 10], [10, 20, 45]) },

  /* ---- Shards ---- */
  { id: 'shards', name: 'Fortuna', icon: 'shards', stat: 'shardsEarned',
    description: (g) => `Ganhe ${n(g)} Shards no total.`,
    tiers: tiers([50, 200, 500, 1500, 4000], [10, 15, 35, 65, 110]) }
  // 'shop' (Cliente Fiel, comprar melhorias do treinador) saiu com a loja na 0.21
];

export const getAchievement = (id) => ACHIEVEMENTS.find((a) => a.id === id);

/** Quantos degraus existem ao todo (o "x de y" da tela de título). */
export const TOTAL_ACHIEVEMENT_TIERS = ACHIEVEMENTS.reduce((sum, a) => sum + a.tiers.length, 0);
