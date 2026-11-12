/**
 * AS QUESTS (PLANEJAMENTO-HISTORIA.md, seção 7). As conquistas são do jogador e
 * valem em todas as jornadas; as quests são DA JORNADA: contam a história dela e
 * guiam o jogador ("o que eu faço agora?") pelo rastreador do canto superior.
 *
 * Cada quest:
 *   kind        'story' (a história, dourada: sempre há uma ativa), 'legendary'
 *               (a missão de um lendário, azul) ou 'side' (pedidos pequenos)
 *   chapter     o capítulo (CHAPTERS, abaixo): o título do rastreador
 *   desc        o texto da tela de missões
 *   objectives  o que fazer. Cada um: { text, on, target?, count? }
 *                 on  'talk'   a conversa com `target` (a chave de data/dialogue.js) chegou ao fim
 *                     'enter'  o jogador entrou no lugar `target` da vila (data/hub.js)
 *                     'map'    o mapa da jornada abriu
 *                     'win'    venceu a fase `target` (data/stages.js)
 *                     'scene'  a cena `target` (data/cutscenes.js) chegou ao fim (0.39)
 *                     'clue'   a pista `target` apareceu numa cena (o passo `emit`, 0.39)
 *               `doneIf` no objetivo: ele fica cumprido, sem comemorar, quando a jornada já
 *               fez aquilo (a vitória de antes das cenas). A quest continua esperando o resto
 *               `count` é quantas vezes (1 se faltar): o rastreador mostra "0/1"
 *   doneIf      quando a quest já está cumprida sem o evento (a jornada que já
 *               existia antes das quests, ou que pulou um passo): ela fecha em
 *               silêncio. Chaves: starter, mapSeen, cleared (o id de uma fase)
 *   next        as quests que abrem quando esta fecha
 *   openedBy    a cena que abre esta quest (0.39, o passo `quest`): quando a anterior
 *               fecha, ela espera a cena (o Brock pede a ajuda e só então ela aparece).
 *               Na jornada de antes das cenas, que nunca vai ver a cena, ela abre direto
 *   reward      vazio por enquanto (as recompensas vêm no fim, pedido do Fellipe)
 *
 * A primeira quest de uma jornada nova é FIRST_QUEST. O check-data confere que
 * cada `next`, cada fala, cada lugar e cada fase citados existem.
 */
export const CHAPTERS = {
  prologo: 'Prólogo',
  cap1: 'Capítulo 1 — As rotas tomadas',
  cap2: 'Capítulo 2 — O céu vazio',
  cap3: 'Capítulo 3 — Os rastros',
  // H-7: o antigo Capítulo 4 virou parte do 3; o do gelo é o 4. O 5 é o do Giovanni (sem o "fogo"
  // no título: o Moltres só se descobre na cena dele)
  cap4: 'Capítulo 4 — As ondas',
  cap5: 'Capítulo 5 — A suspeita',
  // H-8 e a decisão 22: o Capítulo 6 é o da Elite dos Quatro (a Victory Road e a base do Maxie, H-9)
  cap6: 'Capítulo 6 — A Elite dos Quatro',
  cap7: 'Capítulo 7 — O sonho',
  // as missões dos lendários (azuis) levam o nome do lugar
  usina: 'A Usina'
};

export const QUESTS = {
  /* ================================ o prólogo ================================ */
  // o jogador acorda no quarto: a mãe, o laboratório, o Carvalho e o mapa (seção 8)
  p_mae: {
    kind: 'story', chapter: 'prologo',
    desc: 'Hoje é o dia de começar a jornada. A mãe está lá embaixo.',
    objectives: [{ text: 'Fale com a mãe', on: 'talk', target: 'mae' }],
    doneIf: { starter: true },
    next: ['p_lab'],
    reward: null
  },
  p_lab: {
    kind: 'story', chapter: 'prologo',
    desc: 'O Prof. Carvalho passou cedinho procurando você. O laboratório fica do outro lado da vila.',
    objectives: [{ text: 'Vá ao laboratório do Prof. Carvalho', on: 'enter', target: 'lab' }],
    doneIf: { starter: true },
    next: ['p_carvalho'],
    reward: null
  },
  p_carvalho: {
    kind: 'story', chapter: 'prologo',
    desc: 'O Professor disse que era importante.',
    // fecha no fim da conversa de depois da escolha do inicial (o Mapa da Jornada)
    objectives: [{ text: 'Fale com o Prof. Carvalho', on: 'talk', target: 'carvalho_inicial' }],
    doneIf: { starter: true },
    next: ['p_mapa'],
    reward: null
  },
  p_mapa: {
    kind: 'story', chapter: 'prologo',
    desc: 'O Carvalho deu o Mapa da Jornada. Ele abre pela saída sul da vila ou pelo botão lá em cima.',
    objectives: [{ text: 'Abra o Mapa da Jornada', on: 'map' }],
    doneIf: { mapSeen: true },
    next: ['c1_brock'],
    reward: null
  },

  /* ========================== Capítulo 1: as rotas tomadas ========================== */
  c1_brock: {
    kind: 'story', chapter: 'cap1',
    desc: 'O sonho começa em Pewter: atravesse a Rota 1, a Rota 2 e a Floresta de Viridian até o ginásio do Brock.',
    objectives: [{ text: 'Vença o Brock, em Pewter', on: 'win', target: 'gym_1_pewter' }],
    doneIf: { cleared: 'gym_1_pewter' },
    next: ['c2_misty'],
    reward: null
  },

  /* ========================== Capítulo 2: o céu vazio ========================== */
  // o Brock pede ajuda na cena de depois da Fase 1 (data/cutscenes.js, depois_brock): o mapa
  // segue para o ginásio da Misty, e em Cerulean o jogador procura pistas
  c2_misty: {
    kind: 'story', chapter: 'cap2',
    desc: 'O Brock pediu ajuda: os Pokémon estão agindo de um jeito que ninguém nunca viu, e isso é muito sério. Siga para Cerulean, vença a Misty e investigue a cidade atrás de pistas.',
    // as duas linhas (pedido do Fellipe): a vitória e a pista, que vem na conversa com a Misty
    objectives: [
      { text: 'Derrote a Misty', on: 'win', target: 'gym_2_cerulean', doneIf: { cleared: 'gym_2_cerulean' } },
      { text: 'Encontre pistas sobre o comportamento dos Pokémon', on: 'clue', target: 'articuno' }
    ],
    // a jornada que já venceu a Misty antes das cenas rejoga a fase para ouvir a pista; quem
    // já passou do Surge fecha em silêncio
    doneIf: { cleared: 'gym_3_vermilion' },
    openedBy: 'depois_brock',
    next: ['c2_surge'],
    reward: null
  },
  // a Misty aponta o caminho (data/cutscenes.js, depois_misty): o Surge, a Usina e o Zapdos
  c2_surge: {
    kind: 'story', chapter: 'cap2',
    desc: 'A Misty contou que o mar ficou bravo desde que o Articuno sumiu do céu de Seafoam. Se os outros pássaros também sumiram... O Zapdos aparecia perto da Usina, e o Lt. Surge, em Vermilion, conhece aquele lugar.',
    objectives: [
      { text: 'Vença o Lt. Surge, em Vermilion', on: 'win', target: 'gym_3_vermilion', doneIf: { cleared: 'gym_3_vermilion' } },
      // a pista chega com a cena de depois da Fase 3 (H-4)
      { text: 'Descubra se o Zapdos também sumiu', on: 'clue', target: 'zapdos' }
    ],
    doneIf: { cleared: 'gym_4_celadon' },
    // a da Erika segue a história; a da Usina, paralela, quem abre é o marinheiro
    // a Fase 4 está fechada (decisão 18): o caminho segue pela Usina, que o marinheiro abre
    next: ['z_usina'],
    reward: null
  },

  /* ========================== Capítulo 3: os rastros ========================== */
  // a luz voltou à Usina e o Túnel de Pedra acendeu (data/cutscenes.js, zapdos_livre): a Fase 4 abre
  c3_erika: {
    kind: 'story', chapter: 'cap3',
    desc: 'A luz voltou à Usina, e o Túnel de Pedra acendeu de novo. O caminho para Celadon está aberto, e a Erika espera no ginásio dela.',
    objectives: [
      { text: 'Vença a Erika, em Celadon', on: 'win', target: 'gym_4_celadon', doneIf: { cleared: 'gym_4_celadon' } },
      // a pista chega com a cena de depois da Fase 4 (depois_erika): o emblema de novo
      { text: 'Descubra o que a Erika encontrou no jardim', on: 'clue', target: 'emblema' }
    ],
    next: ['c3_koga'],
    reward: null
  },
  // depois da Erika, a história dos lendários descansa (decisão 18): os ginásios seguem
  c3_koga: {
    kind: 'story', chapter: 'cap3',
    desc: 'A Erika achou no jardim um pedaço de metal com o mesmo emblema da máquina da Usina. Na noite do apagão, ela viu uma sombra de asas seguir para o sul. O próximo ginásio é o do Koga, em Fuchsia, também ao sul.',
    objectives: [{ text: 'Vença o Koga, em Fuchsia', on: 'win', target: 'gym_5_fuchsia', doneIf: { cleared: 'gym_5_fuchsia' } }],
    next: ['c3_sabrina'],
    reward: null
  },
  c3_sabrina: {
    kind: 'story', chapter: 'cap3',
    desc: 'O Koga caiu. O próximo ginásio é o da Sabrina, em Saffron.',
    objectives: [{ text: 'Vença a Sabrina, em Saffron', on: 'win', target: 'gym_6_saffron', doneIf: { cleared: 'gym_6_saffron' } }],
    next: ['c4_blaine'],
    reward: null
  },

  /* ========================== Capítulo 4: as ondas (H-7) ========================== */
  // a proposta "Seafoam: as ondas" (PLANEJAMENTO-HISTORIA.md seção 5.2): depois do Blaine, as ondas
  // que os instrumentos dele captam, o mar congelando e a descida a pé até o fundo de Seafoam
  c4_blaine: {
    kind: 'story', chapter: 'cap4',
    desc: 'A Sabrina caiu. O último ginásio antes de Viridian é o do Blaine, na ilha vulcânica de Cinnabar.',
    objectives: [
      { text: 'Vença o Blaine, em Cinnabar', on: 'win', target: 'gym_7_cinnabar', doneIf: { cleared: 'gym_7_cinnabar' } },
      // a pista chega com a cena de depois da Fase 7 (depois_blaine): as ondas
      { text: 'Ouça o que o Blaine descobriu', on: 'clue', target: 'ondas' }
    ],
    next: ['c4_seafoam'],
    reward: null
  },
  // a visita é pela marca das Ilhas Seafoam no mapa da jornada (data/regionMap.js, STORY_PLACES)
  c4_seafoam: {
    kind: 'story', chapter: 'cap4',
    desc: 'Os instrumentos do Blaine captam ondas estranhas saindo das Ilhas Seafoam, rumo ao sul. Ondas, como as da máquina da Usina. E o mar em volta das ilhas está congelando: nenhum barco sai de Cinnabar.',
    // fecha na margem do fundo, quando a névoa se abre (data/cutscenes.js, seafoam_fundo)
    objectives: [{ text: 'Investigue as Ilhas Seafoam', on: 'clue', target: 'articuno_preso' }],
    next: ['c4_articuno'],
    reward: null
  },
  c4_articuno: {
    kind: 'story', chapter: 'cap4',
    desc: 'No fundo das Ilhas Seafoam, numa máquina coberta de gelo, o Articuno está preso por correntes. A máquina suga a energia dele, como a da Usina sugava a do Zapdos. O card sobe na margem.',
    // fecha com a luta vencida (a fase `articuno`): derrotado, ele foge (sem captura)
    objectives: [{ text: 'Derrote e liberte o Articuno', on: 'win', target: 'articuno' }],
    next: ['c5_giovanni'],
    reward: null
  },

  /* ========================== Capítulo 5: a suspeita ========================== */
  // o mar descongelou (data/cutscenes.js, articuno_livre): a Fase 8 abre. A cena do Giovanni é a H-8
  c5_giovanni: {
    kind: 'story', chapter: 'cap5',
    desc: 'O mar de Seafoam descongelou, e os barcos saem de Cinnabar de novo. O último ginásio de Kanto é o do Giovanni, em Viridian.',
    objectives: [
      { text: 'Vença o Giovanni, em Viridian', on: 'win', target: 'gym_8_viridian', doneIf: { cleared: 'gym_8_viridian' } },
      // a pista chega com a cena de depois da Fase 8 (depois_giovanni): o jogador acha que é a Rocket
      { text: 'Mostre o Pedaço de Metal ao Giovanni', on: 'clue', target: 'monte_brasa' }
    ],
    next: ['c5_brasa'],
    reward: null
  },
  // a proposta "Monte Brasa: o fogo" (PLANEJAMENTO-HISTORIA.md seção 5.3): a visita é pela marca da
  // Ilha 1 na borda do mapa da jornada (data/regionMap.js, STORY_PLACES)
  c5_brasa: {
    kind: 'story', chapter: 'cap5',
    desc: 'O Giovanni riu: o emblema não é da Rocket. Mas os homens dele viram gente com esse emblema subindo o Monte Brasa, na Ilha 1, carregando peças de máquina. O barco para a Ilha 1 sai de Cinnabar.',
    // fecha no alto do cume (data/cutscenes.js, brasa_cume)
    objectives: [{ text: 'Investigue o Monte Brasa, na Ilha 1', on: 'clue', target: 'moltres_preso' }],
    next: ['c5_moltres'],
    reward: null
  },
  c5_moltres: {
    kind: 'story', chapter: 'cap5',
    desc: 'No cume do Monte Brasa, numa máquina em brasa, o Moltres está preso por correntes. A terceira máquina, a terceira ave. O card sobe no alto do cume.',
    // fecha com a luta vencida (a fase `moltres`): derrotado, ele foge (sem captura)
    objectives: [{ text: 'Derrote e liberte o Moltres', on: 'win', target: 'moltres' }],
    next: ['c6_liga'],
    reward: null
  },

  /* ========================== Capítulo 6: a Elite dos Quatro ========================== */
  // a Liga reabriu a Victory Road (data/cutscenes.js, moltres_livre). A cena da Elite dos Quatro e a
  // base do Maxie são a H-9 (decisão 22)
  c6_liga: {
    kind: 'story', chapter: 'cap6',
    desc: 'Os três pássaros estão livres, e a Liga reabriu a Victory Road. O caminho até a Liga Pokémon está aberto.',
    // (H-9) fecha na cena da porta da Victory Road (o Jogar da Lorelei), onde a Liga está vazia
    objectives: [{ text: 'Siga pela Victory Road até a Liga Pokémon', on: 'scene', target: 'victory_road' }],
    next: ['c6_e4'],
    reward: null
  },
  // o bilhete do Lance (H-9): a quest dourada até a cena do subsolo da Mansão (sem citar quem os prendeu)
  c6_e4: {
    kind: 'story', chapter: 'cap6',
    desc: 'A Elite dos Quatro desceu junta atrás de quem prende Pokémon fortes, e não voltou. O bilhete do Lance fala da velha Mansão de Cinnabar.',
    objectives: [{ text: 'Ajude a Elite dos Quatro', on: 'scene', target: 'mansao_lab' }],
    next: ['c7_liga'],
    reward: null
  },
  c7_liga: {
    kind: 'story', chapter: 'cap7',
    desc: 'A Elite dos Quatro voltou para a Liga e espera você, sem pegar leve.',
    objectives: [{ text: 'Vença a Elite dos Quatro', on: 'win', target: 'e4_lance', doneIf: { cleared: 'e4_lance' } }],
    next: [],
    reward: null
  },

  /* ========================== a Usina (a missão do Zapdos) ========================== */
  // o marinheiro de Vermilion escutou correntes (data/cutscenes.js, vermilion_correntes): a visita
  // é pela marca da Usina no mapa da jornada (data/regionMap.js, STORY_PLACES)
  // a Usina é o caminho principal (decisão 18): as quests dela são douradas, no Capítulo 2
  z_usina: {
    kind: 'story', chapter: 'cap2',
    desc: 'Preso em terra pelo mar agitado, um marinheiro de Vermilion trabalhou pela Rota 10 e escutou correntes pesadas se arrastando dentro da Usina, fechada desde o apagão.',
    // fecha no fundo da Usina, quando os olhos aparecem no escuro (data/cutscenes.js, usina_fundo)
    objectives: [{ text: 'Investigue a Usina, na Rota 10', on: 'clue', target: 'olhos' }],
    openedBy: 'vermilion_correntes',
    next: ['z_zapdos'],
    reward: null
  },
  z_zapdos: {
    kind: 'story', chapter: 'cap2',
    desc: 'No fundo da Usina, no escuro, dois olhos vermelhos. O Zapdos está lá embaixo, preso por correntes e fora de si. A escotilha fica na sala do gerador.',
    // fecha com a luta vencida (a fase `zapdos`, H-6): derrotado, ele foge (sem captura)
    objectives: [{ text: 'Derrote e liberte o Zapdos', on: 'win', target: 'zapdos' }],
    next: ['c3_erika'],
    reward: null
  }
};

export const FIRST_QUEST = 'p_mae';

/** Os eventos que um objetivo pode esperar (o check-data recusa os outros). */
export const QUEST_EVENTS = ['talk', 'enter', 'map', 'win', 'scene', 'clue'];
