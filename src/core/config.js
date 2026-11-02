/**
 * CONFIG — todos os valores de balanceamento e de sistema ficam aqui.
 * Nada de número mágico espalhado pelo gameplay: se precisar ajustar, ajuste aqui.
 */
export const CONFIG = {
  version: '0.7.0',

  canvas: { width: 1280, height: 720 },

  /**
   * Escala da pixel art do FireRed no mundo do jogo: um pixel do GBA vira
   * `pixelScale` pixels do canvas (o tile de 16 px fica com 32). Sempre inteira,
   * sem suavização, para a arte continuar nítida.
   */
  render: { pixelScale: 2 },

  /**
   * Efeitos visuais dos golpes. Os tetos existem porque a horda é grande e o
   * jogo precisa rodar leve no navegador.
   */
  fx: {
    screenShake: true,        // tremor de tela (desligável em Opções)
    impactsPerFrame: 6,       // sprites de acerto novos por quadro, no máximo
    maxEffects: 160,          // efeitos vivos (números, acertos, raios), no máximo
    maxParticles: 360,        // partículas vivas, no máximo
    bossTelegraph: 0.7        // segundos de aviso no chão antes do golpe do líder
  },

  /** O treinador não luta e não tem vida: ele só guia a equipe pelo mapa. */
  trainer: {
    speed: 195,
    radius: 13,
    pickupRadius: 78,
    magnetSpeed: 620,
    /**
     * O movimento é livre; o sprite só acompanha. O passo segue a distância
     * andada, como no FireRed: um "quadrado" (`stride`, em px) por passo.
     * Acima de `runAt` px/s ele usa os quadros de correr. No FireRed, em 2x,
     * andar é 120 px/s e correr 240: a velocidade do jogo (195) já é de corrida.
     */
    animation: { stride: 32, runAt: 180 }
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
    xpWeight: { active: 3, benched: 1 },
    /**
     * Até o nível `xpKnee` a curva é exponencial (o começo, calibrado nas fases
     * 1 e 2); depois cresce como potência do nível. Só exponencial, chegar ao
     * nível 60 da Elite Four exigiria ~305 mil XP por Pokémon.
     */
    xpKnee: 20,
    xpLateExponent: 2.2
  },

  /**
   * Nível dos selvagens (definido nas ondas de cada fase, acompanhando a
   * equipe). Os números de enemies.js valem para `referenceLevel`; cada nível
   * acima multiplica vida e dano (crescimento composto: o poder do jogador
   * cresce mais rápido que linear, com evolução, golpe final e melhorias) e
   * soma XP. Fase sem nível nas ondas (1 e 2) fica como sempre foi.
   */
  enemies: {
    referenceLevel: 5,
    hpGrowth: 1.075,
    damageGrowth: 1.035,
    xpPerLevel: 0.08
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
