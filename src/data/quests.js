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
  cap2: 'Capítulo 2 — O céu vazio'
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
    objectives: [{ text: 'Derrote a Misty e encontre pistas sobre o comportamento dos Pokémon', on: 'win', target: 'gym_2_cerulean' }],
    doneIf: { cleared: 'gym_2_cerulean' },
    openedBy: 'depois_brock',
    next: [],
    reward: null
  }
};

export const FIRST_QUEST = 'p_mae';

/** Os eventos que um objetivo pode esperar (o check-data recusa os outros). */
export const QUEST_EVENTS = ['talk', 'enter', 'map', 'win', 'scene'];
