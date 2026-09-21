/**
 * CONQUISTAS
 *
 * Cada conquista concluída libera SHARDS, que o jogador coleta na aba
 * Conquistas e gasta nas melhorias do treinador.
 * Cada conquista observa um contador do perfil (profile.stats) e um objetivo.
 * Para criar uma nova, basta adicionar uma entrada aqui — o sistema cuida do resto.
 *
 * `reward` também aceita outros tipos no futuro (desbloquear um Pokémon,
 * um bônus inicial...), bastando tratá-los no ProfileTracker.
 */
export const ACHIEVEMENTS = [
  { id: 'first_steps',    name: 'Primeiros Passos',      description: 'Conclua sua primeira partida.',                 icon: 'speed', stat: 'runsPlayed',      goal: 1,    reward: { shards: 60 } },
  { id: 'first_clear',    name: 'Rota Concluída',        description: 'Complete uma fase derrotando o líder do ginásio.',          icon: 'stages', stat: 'stagesCleared',   goal: 1,    reward: { shards: 150 } },
  { id: 'hunter_100',     name: 'Caçador Iniciante',     description: 'Derrote 100 Pokémon selvagens.',                 icon: 'kills', stat: 'totalKills',      goal: 100,  reward: { shards: 80 } },
  { id: 'hunter_1000',    name: 'Exterminador',          description: 'Derrote 1.000 Pokémon selvagens.',               icon: 'boss', stat: 'totalKills',      goal: 1000, reward: { shards: 250 } },
  { id: 'catcher_1',      name: 'Primeira Captura',      description: 'Capture seu primeiro Pokémon em uma partida.',   icon: 'ball', stat: 'totalCaptures',   goal: 1,    reward: { shards: 60 } },
  { id: 'catcher_25',     name: 'Colecionador',          description: 'Capture 25 Pokémon no total.',                   icon: 'team', stat: 'totalCaptures',   goal: 25,   reward: { shards: 200 } },
  { id: 'full_team',      name: 'Equipe Completa',       description: 'Tenha 6 Pokémon na equipe em uma partida.',      icon: 'team', stat: 'fullTeams',       goal: 1,    reward: { shards: 120 } },
  { id: 'level_20',       name: 'Treinador Veterano',    description: 'Alcance o nível 20 em uma única partida.',       icon: 'levelUp', stat: 'maxRunLevel',     goal: 20,   reward: { shards: 150 } },
  { id: 'boss_slayer',    name: 'Matador de Chefes',     description: 'Derrote 5 chefes.',                              icon: 'boss', stat: 'bossesDefeated',  goal: 5,    reward: { shards: 300 } },
  { id: 'first_badge',    name: 'Primeira Insígnia',     description: 'Vença o primeiro líder de ginásio.',                     icon: 'badge', stat: 'badges',          goal: 1,    reward: { shards: 250 } },
  { id: 'dex_10',         name: 'Pokédex em Progresso',  description: 'Registre 10 espécies diferentes na Pokédex.',    icon: 'pokedex', stat: 'dexCaught',       goal: 10,   reward: { shards: 120 } },
  { id: 'dex_kanto',      name: 'Mestre Pokémon',        description: 'Registre todas as 151 espécies de Kanto.',       icon: 'pokedex', stat: 'dexCaught',       goal: 151,  reward: { shards: 2000 } }
];

export const getAchievement = (id) => ACHIEVEMENTS.find((a) => a.id === id);
