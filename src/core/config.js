/**
 * CONFIG — todos os valores de balanceamento e de sistema ficam aqui.
 * Nada de número mágico espalhado pelo gameplay: se precisar ajustar, ajuste aqui.
 */
export const CONFIG = {
  version: '0.4.0',

  canvas: { width: 1280, height: 720 },

  /** O treinador não luta e não tem vida: ele só guia a equipe pelo mapa. */
  trainer: {
    speed: 195,
    radius: 13,
    pickupRadius: 78,
    magnetSpeed: 620
  },

  team: {
    maxSize: 6,
    activeSlots: 3,         // quantos Pokémon lutam ao mesmo tempo
    swapCooldown: 6         // segundos entre trocas
  },

  /** Cada Pokémon tem vida e nível próprios. */
  pokemon: {
    baseHp: 100,            // usado se a espécie não definir `hp`
    hpPerLevel: 6,          // vida máxima ganha por nível
    // Subir de nível NÃO cura: cura vem de poções, da reserva e de itens.
    // (Curar a cada nível tornava a fase trivial.)
    // Como a melhoria só aparece a cada 3 níveis, cada nível em si
    // precisa valer mais: o poder vem do nível, não da quantidade de telas.
    damagePerLevel: 0.07,
    benchRegen: 2.5,        // vida por segundo recuperada enquanto está na reserva
    fieldRegen: 0.6,        // vida por segundo em campo (upgrades podem aumentar)
    // Invencibilidade curta depois de cada golpe: é o que impede que 20 inimigos
    // encostados derrubem um Pokémon em menos de um segundo.
    invulnerability: 0.5,
    followRadius: 56,       // distância que o Pokémon mantém do treinador
    engageDistance: 42,     // o quanto ele avança em direção ao alvo
    radius: 14
  },

  progression: {
    baseXp: 12,             // XP para o Pokémon sair do nível 1
    xpGrowth: 1.15,         // multiplicador por nível
    upgradeChoices: 3,
    /**
     * A tela de melhoria aparece a cada N níveis. Os níveis intermediários
     * continuam valendo (vida e dano sobem), só não interrompem a partida.
     */
    upgradeEveryLevels: 3,
    /** Chance de uma das opções do nível ser uma TM (troca da habilidade base). */
    tmChance: 0.12,
    /**
     * Divisão de XP por Pokémon (pesos normalizados).
     * Com a equipe cheia (3 ativos + 3 reservas) isso resulta exatamente em
     * 25% para cada ativo (75% no total) e 8,33% para cada um da reserva.
     * Com menos Pokémon, a mesma proporção 3:1 é redistribuída.
     */
    xpWeight: { active: 3, benched: 1 }
  },

  capture: {
    choices: 3,
    dropChanceMultiplier: 1, // multiplicador global da chance de Poké Ball
    potionChance: 0.04       // chance de um selvagem comum deixar uma poção
  },

  /** SHARDS: a moeda do jogo, gasta nas melhorias permanentes do treinador. */
  shards: {
    perStageClear: 120,     // ao vencer uma fase
    firstClearBonus: 180,   // bônus na primeira vez que conclui aquela fase
    perAchievement: 60      // padrão quando a conquista não define recompensa
  },

  sprites: {
    // Sprites do repositório público PokeAPI/sprites.
    // Estáticos no canvas (o canvas não anima GIF) e animados na interface.
    useRemote: true,
    remoteBase: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/',
    animatedBase: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/',
    artworkBase: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/',
    itemBase: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/',
    badgeBase: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges/',
    useAnimatedUI: true,
    // Para usar arte própria: coloque "assets/sprites/<dex>.png" e ligue useLocal.
    useLocal: false,
    localBase: 'assets/sprites/'
  },

  save: {
    fileName: 'pokemon-bullet-heaven-save.json',
    useLocalStorage: true,
    storageKey: 'pbh.autosave'
  },

  debug: {
    showHitboxes: false,
    godMode: false
  }
};
