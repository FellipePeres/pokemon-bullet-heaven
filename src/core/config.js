/**
 * CONFIG — todos os valores de balanceamento e de sistema ficam aqui.
 * Nada de número mágico espalhado pelo gameplay: se precisar ajustar, ajuste aqui.
 */
export const CONFIG = {
  version: '0.27.0',

  canvas: { width: 1280, height: 720 },

  /**
   * Escala da pixel art do FireRed no mundo do jogo: um pixel do GBA vira
   * `pixelScale` pixels do canvas (o tile de 16 px fica com 32). Sempre inteira,
   * sem suavização, para a arte continuar nítida.
   */
  render: { pixelScale: 2 },

  // Música (o mixer em Opções): 0 a 1
  audio: { musicVolume: 0.6 },

  // O treinador para um pouco antes da borda: ali ficam a mata e as paredes do cenário
  arena: { inset: 96 },

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
    /** Subir de nível cura essa fração da vida máxima de quem subiu; evoluir cura tudo. */
    // 0.11.4: 1/10 (era 1/4 na 0.11.3, que deixava as fases fáceis demais)
    levelUpHeal: 0.1,
    /** ...só a partir deste nível: no começo a cura deixava as fases fáceis demais. */
    levelUpHealFrom: 11,
    /** A "Poção" que aparece quando o Pokémon já tem todas as melhorias (0.12.1: era 50%, forte demais). */
    maxedHeal: 0.2,
    /** Chance de uma das opções do nível ser uma TM (troca da habilidade base). */
    // O golpe melhora sobretudo na evolução; a TM no level up é um bônus raro
    // (pedido do Fellipe na 0.8: antes era 12%).
    tmChance: 0.04,
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
    // dificuldade geral (0.8, "muito fácil, quase não tomo dano"): valem para
    // todas as fases por cima da calibragem de cada uma
    damageMult: 1.3,        // dano de contato e dos golpes dos líderes (por fase: scaling.damage)
    spawnMult: 1.2,         // ondas: levas mais frequentes e mais inimigos vivos
    hpMult: 1.2,            // selvagens e elites (0.9 e 0.10: "um pouco mais de vida")
    // Líderes (0.10, "o Brock foi muito fácil"): bem mais vida e dano, golpes
    // mais frequentes, uma rajada de projéteis mirando o treinador e, abaixo da
    // metade da vida, fúria (mais rápido, golpes e invocações mais seguidos).
    boss: {
      hpMult: 4, damageMult: 1.6, cooldownMult: 0.6,
      extraAbilities: ['leader_barrage'],
      summonBonus: 1, summonIntervalMult: 0.7,
      enrageAt: 0.5, enrage: { speed: 1.3, cooldown: 0.65, summonInterval: 0.6, barrageExtra: 2 }
    },
    // inimigo preso (0.11.5): dentro de um obstáculo por `insideFor` s, ou longe do
    // treinador andando menos de `minMove` do esperado em `strikes` janelas de
    // `window` s seguidas, é teleportado para um ponto livre
    unstick: { insideFor: 0.5, window: 1.5, strikes: 2, minMove: 0.12, nearPlayer: 140 },
    referenceLevel: 5,
    hpGrowth: 1.075,
    damageGrowth: 1.035,
    xpPerLevel: 0.08
  },

  /**
   * O 2º golpe (0.14, data/bonusMoves.js): com todas as melhorias, cada nível tem
   * essa chance de ensinar um golpe do tipo principal; senão, a do secundário.
   * O dano por acerto é `damageRatio` do golpe principal; as curas dele param em
   * `healPerSecond` da vida máxima do Pokémon por segundo.
   */
  // a apresentação do líder começa a luta sozinha depois disso, se ninguém clicar
  // em Lutar (0.25, pedido do Fellipe; a contagem aparece embaixo, pequena)
  leaderIntroSeconds: 7,

  // MODO LIVRE (0.20, pedido do Fellipe: "estilo Endless Mode daquela fase, com XP
  // reduzido; os inimigos vão ganhando gradativamente mais status até que fique
  // quase impossível"). Padrão até o Fellipe decidir.
  endless: {
    xpMult: 0.4,             // 40% do XP (era a metade; "ainda é muito")
    growthPerMinute: 1.2,    // vida e dano dos inimigos ×1,2 por minuto, composto (5 min ×2,5; 10 min ×6,2)
    densityPerMinute: 0.08,  // +8% de inimigos por minuto...
    densityMax: 2,           // ...até o dobro
    eliteEvery: 60,          // um elite da fase a cada minuto
    ballEvery: 180,          // uma Poké Ball a cada 3 minutos sobrevividos, fora do teto da fase (0.22)
    loopFrom: 0.5            // as ondas repetem a segunda metade da fase (a mais forte)
  },

  bonusMove: { chancePrimary: 0.02, chanceSecondary: 0.01, damageRatio: 0.6, healPerSecond: 0.02 },

  capture: {
    choices: 4,              // opções por Poké Ball (0.11: eram 3)
    // chance de cada opção da Poké Ball (ou do presente) vir shiny (0.13.1; padrão
    // até o Fellipe decidir). Selvagens nunca são shiny: só quem entra para a equipe
    shinyChance: 0.01,
    levelsBehindTeam: 3,     // quem entra chega com a média da equipe menos isso
    // Poké Ball rara (pedidos do Fellipe: ×0,45 na 0.8, ×0,15 na 0.9, ×0,07 na
    // 0.10, quando as garantidas também saíram: sobrou uma, na Fase 1; ×0,085 na
    // 0.18, "aumentar levemente": ~20% mais, onde a fase não está no teto)
    dropChanceMultiplier: 0.085,
    // Ímã: puxa todo o XP do mapa até o treinador. Raríssimo; um por vez no chão.
    magnetChance: 0.0005,
    magnetChanceElite: 0.015,
    potionChance: 0.04       // chance de um selvagem comum deixar uma poção
  },

  /**
   * SHARDS (0.22, regras do Fellipe): a recompensa da fase é única (só a
   * primeira vitória paga; rejogar não ganha nada); cada Pokémon de líder
   * derrotado dá 10 e cada chefe simples (elite) dá 5, na hora, mesmo que a
   * tentativa termine em derrota. No Modo Livre só os chefes simples pagam.
   * Mais as conquistas. Os Shards serão gastos no Poké Mart (planejado).
   */
  shards: {
    perStageClear: 100,     // a recompensa da fase sem `reward` próprio (só na primeira vitória)
    leaderPokemon: 10,      // cada Pokémon do líder derrotado
    elite: 5,               // cada chefe simples (elite) derrotado
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
    storageKey: 'pbh.autosave',
    maxJourneys: 3           // espaços de jornada (0.19; padrão até o Fellipe decidir)
  },

  debug: {
    showHitboxes: false,
    godMode: false
  }
};
