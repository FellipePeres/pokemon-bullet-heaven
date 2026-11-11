/**
 * AS CENAS (0.39, PLANEJAMENTO-HISTORIA.md seção 9) — os roteiros que o
 * game/Cutscene.js toca por cima da vila. Enquanto uma cena dura, o jogador não
 * anda; a caixa de texto é a da vila. A regra do Maxie vale para todas: **a cena
 * só conta como vista quando chega ao fim**. Se o jogo fechar no meio, ela volta
 * do começo ao continuar, com o jogador no `spot`.
 *
 * Cada cena:
 *   map       o lugar da vila (data/hub.js) onde ela acontece
 *   spot      onde o jogador fica quando ela volta pendente
 *   trigger   o que começa a cena: { on: 'enter', target: lugar } (entrou no lugar),
 *             { on: 'npc', target: id } (falou com alguém do lugar), { on: 'starter' }
 *             (acabou de escolher o inicial), { on: 'win', target: fase } (venceu a fase:
 *             a cena fica devida e toca na volta, no `spot`) ou { on: 'play', target: fase }
 *             (apertou Jogar: a cena toca antes, e a fase começa no fim, com `then: 'stage'`).
 *             Sem trigger, só o código a começa (a do Maxie).
 *
 * As cenas são ANTES e DEPOIS das fases, nunca no meio, e sempre em tela cheia, num
 * cenário do FireRed, com os personagens em pixel (regra do Fellipe). Fora da vila, o
 * cenário é um palco (`scene: true` em data/hub.js): a barra da vila some, e a cena
 * termina com `then: 'home'` (de volta para a vila) ou `then: 'stage'` (a fase).
 *   when      as condições das falas (data/dialogue.js) para o trigger valer
 *   record    false: não se registra em `campaign.scenes` (a do Maxie usa o registro do Kyogre)
 *   band      a faixa do corte de tela (passo `cutin`)
 *   actors    quem entra só na cena: { id: { sprite, x, y, dir, hidden } }. As pessoas do
 *             lugar (pelo id de data/hub.js) e o jogador ('player') também atuam.
 *   preload   folhas para carregar antes (as dos atores entram sozinhas)
 *   steps     os passos, um de cada vez:
 *     wait   { t }                     espera t segundos
 *     say    { name, lines }           a caixa de texto ({player}, {pokemon}, {rival}...)
 *     talk   { key, npc }              uma fala de data/dialogue.js; conta para as quests,
 *                                      e o `then` dela fica para o fim da cena
 *     show / hide { who }              alguém aparece ou some
 *     place  { who, x, y, dir }        põe alguém num tile, sem andar
 *     walk   { who, path | to, speed, bird }
 *                                      anda pelos tiles de `path`; ou, com `to` ([x, y, dir?]...),
 *                                      até o primeiro desses tiles que estiver livre, pelo caminho
 *                                      mais curto, e vira para `dir`. `speed`: segundos por tile.
 *     face   { who, dir | toward }     vira para uma direção ou para alguém
 *     emote  { who }                   o "!" em cima de alguém
 *     throw  { who }                   solta uma Poké Ball, com o clarão
 *     cutin  { sprite }                o corte de tela com as listras (`band`) e um Pokémon passando
 *     bird   { who, mode }             o pássaro do Voar: 'in', 'grab', 'away' ou 'gone'
 *     fade   { to, t }                 escurece (to: 1) ou clareia (to: 0) a tela
 *     camera { x, y, t } / { to: 'player', t }
 *                                      leva a câmera até um tile, e de volta ao jogador
 *     shake  { t, power, wait }        treme a tela (wait: false segue sem esperar)
 *     give   { item, count, silent }   dá um item (da mochila ou da história) e avisa na caixa
 *     quest  { id }                    abre uma quest (data/quests.js)
 *     emit   { on, target }            um acontecimento da história no meio da cena (a `clue`, uma
 *                                      pista: o objetivo das quests que espera por ela fecha ali)
 *     flag   { name, value }           marca uma flag da vila (as falas `once`, os enfeites `hideIf`)
 *     end    { then }                  o fim: só aqui a cena conta como vista; `then` é uma
 *                                      ação das falas (data/dialogue.js), como 'starter'
 *   Um passo pode mudar com a jornada: `pick: 'rivalStarter'` e `cases: { squirtle: {...} }`
 *   juntam ao passo o caso daquele valor do contexto das falas.
 */

// a cena do Maxie (0.37, PLANEJAMENTO-DIVE.md seção 10), igual à de antes, agora em dados
const MAXIE = [
  'Não acredito que cheguei tarde!',
  'Você capturou o lendário Kyogre!',
  'Não posso deixar que isso aconteça com os próximos...'
];
const MAXIE_END = 'A caminho do vulcão! O próximo lendário será meu!';
const MAXIE_SHEETS = ['dive/maxie', 'dive/exclam', 'dive/bird', 'dive/crobat', 'dive/band_out', 'dive/band_in'];

const OAK = 'Prof. Carvalho';

export const CUTSCENES = {
  /* ============================ o Maxie (0.37) ============================ */

  // na frente da lagoa: voltou à superfície com o Kyogre
  maxie_lagoa: {
    map: 'vila', spot: { x: 30, y: 11, dir: 'down' }, record: false,
    band: 'dive/band_out',
    actors: { maxie: { sprite: 'dive/maxie', x: 21, y: 12, dir: 'right', hidden: true } },
    preload: MAXIE_SHEETS,
    steps: [
      { do: 'wait', t: 0.6 },
      { do: 'say', lines: ['{player} voltou à superfície pela lagoa, com o Kyogre!'] },
      { do: 'show', who: 'maxie' },
      { do: 'walk', who: 'maxie', path: [[22, 12], [23, 12], [24, 12], [25, 12], [26, 12], [27, 12], [28, 12], [29, 12], [30, 12]], speed: 0.13 },
      { do: 'face', who: 'maxie', dir: 'up' }, { do: 'face', who: 'player', dir: 'down' },
      { do: 'emote', who: 'maxie' },
      { do: 'say', name: 'Maxie', lines: MAXIE },
      { do: 'throw', who: 'maxie' },
      { do: 'cutin', sprite: 'dive/crobat' },
      { do: 'bird', who: 'maxie', mode: 'in' },
      { do: 'say', name: 'Maxie', lines: [MAXIE_END] },
      { do: 'bird', who: 'maxie', mode: 'grab' },
      { do: 'bird', who: 'maxie', mode: 'away' },
      { do: 'wait', t: 0.6 },
      { do: 'end' }
    ]
  },

  // no Centro Pokémon: caiu na maré final e o pescador trouxe
  maxie_centro: {
    map: 'centro', spot: { x: 4, y: 5, dir: 'up' }, record: false,
    band: 'dive/band_in',
    actors: { maxie: { sprite: 'dive/maxie', x: 2, y: 9, dir: 'up', hidden: true } },
    preload: MAXIE_SHEETS,
    steps: [
      { do: 'wait', t: 0.4 },
      { do: 'say', name: 'Enfermeira', lines: [
        'Ah, você acordou! O pescador da lagoa trouxe você até aqui.',
        'Disse que fisgou você desmaiado lá no fundo... e que foi o maior peixe da vida dele.',
        'E o Pokémon gigante que veio com você também está bem.'
      ] },
      { do: 'show', who: 'maxie' },
      { do: 'walk', who: 'maxie', path: [[2, 8], [2, 7], [3, 7], [4, 7], [4, 6]], speed: 0.13 },
      { do: 'face', who: 'maxie', dir: 'up' }, { do: 'face', who: 'player', dir: 'down' },
      { do: 'emote', who: 'maxie' },
      { do: 'say', name: 'Maxie', lines: MAXIE },
      { do: 'throw', who: 'maxie' },
      { do: 'cutin', sprite: 'dive/crobat' },
      { do: 'bird', who: 'maxie', mode: 'in' },
      { do: 'say', name: 'Maxie', lines: [MAXIE_END] },
      // dentro de casa não dá para voar: ele sai correndo pela porta com o Crobat
      { do: 'walk', who: 'maxie', path: [[4, 7], [3, 7], [2, 7], [2, 8], [2, 9]], speed: 0.13, bird: true },
      { do: 'hide', who: 'maxie' }, { do: 'bird', who: 'maxie', mode: 'gone' },
      { do: 'wait', t: 0.6 },
      { do: 'end' }
    ]
  },

  /* ============================ o prólogo (0.39) ============================ */

  // 1. o discurso do Carvalho, encenado: ele chama o jogador, olha o quadro e vai até a mesa
  prologo_carvalho: {
    map: 'lab', spot: { x: 6, y: 11, dir: 'up' },
    trigger: [{ on: 'enter', target: 'lab' }, { on: 'npc', target: 'carvalho' }],
    when: { starter: false, veteran: false },
    steps: [
      { do: 'wait', t: 0.3 },
      { do: 'camera', x: 6, y: 4, t: 0.6 },
      { do: 'face', who: 'carvalho', dir: 'down' },
      { do: 'emote', who: 'carvalho' },
      { do: 'say', name: OAK, lines: ['Ah, aí está você, {player}! Entre, entre. Antes de tudo, precisamos conversar.'] },
      { do: 'camera', to: 'player', t: 0.5 },
      { do: 'walk', who: 'player', to: [[6, 4, 'up']] },
      { do: 'face', who: 'carvalho', toward: 'player' },
      { do: 'say', name: OAK, lines: [
        'Você quer ser o Campeão de Kanto, eu sei. E esse sonho continua possível.',
        'Mas preciso ser honesto: as rotas não são mais como antes. As hordas mudaram.'
      ] },
      // ele se vira para o quadro, como quem ainda procura a resposta
      { do: 'face', who: 'carvalho', dir: 'up' },
      { do: 'wait', t: 0.6 },
      { do: 'say', name: OAK, lines: [
        'Os Pokémon selvagens andam em bandos de dezenas e cercam qualquer treinador que passa.',
        'Isso não é natural. Um Pokémon não abandona a própria casa sem motivo... Alguma coisa aconteceu.'
      ] },
      { do: 'face', who: 'carvalho', dir: 'down' },
      { do: 'say', name: OAK, lines: [
        'Ser Campeão é um sonho bonito. Mas o ideal, de verdade, era resolver o problema das hordas.',
        'Fazer as rotas voltarem a ser o que eram: um lugar de paz, de encontros, e não de caos.',
        'Sozinho, eu não consigo. Mas um treinador que atravessa Kanto inteira... talvez consiga.'
      ] },
      // e vai para trás da mesa das Poké Balls; o jogador para na frente dela
      { do: 'walk', who: 'carvalho', path: [[7, 3], [8, 3], [9, 3]] },
      { do: 'face', who: 'carvalho', dir: 'down' },
      { do: 'walk', who: 'player', to: [[8, 5, 'up']] },
      { do: 'say', name: OAK, lines: ['Ninguém atravessa Kanto sozinho. Por isso quero que você leve um destes três.'] },
      { do: 'end', then: 'starter' }
    ]
  },

  // 2. o rival chega atrasado, pega o inicial com vantagem sobre o seu e acha bobagem
  // se preocupar com as hordas (decisão 1 do planejamento)
  prologo_rival: {
    map: 'lab', spot: { x: 8, y: 5, dir: 'up' },
    trigger: [{ on: 'starter' }],
    actors: { rival: { sprite: 'npc/rival', x: 6, y: 12, dir: 'up', hidden: true } },
    steps: [
      // voltando pendente, a bola dele ainda está na mesa
      { do: 'flag', name: 'rival_inicial', value: false },
      { do: 'wait', t: 0.5 },
      { do: 'show', who: 'rival' },
      { do: 'say', name: 'Rival', lines: ['Vô! Cheguei! Cadê o meu Pokémon?'] },
      { do: 'face', who: 'player', toward: 'rival' },
      { do: 'face', who: 'carvalho', toward: 'rival' },
      { do: 'say', name: OAK, lines: ['Atrasado como sempre! {player} chegou primeiro e já escolheu.'] },
      // até a bola com vantagem sobre o inicial do jogador (como no FireRed)
      { do: 'walk', who: 'rival', speed: 0.16, pick: 'rivalStarter', cases: {
        bulbasaur: { to: [[8, 5, 'up'], [8, 3, 'down']] },
        squirtle: { to: [[9, 5, 'up'], [9, 3, 'down']] },
        charmander: { to: [[10, 5, 'up'], [10, 3, 'down']] }
      } },
      { do: 'say', name: 'Rival', lines: ['Então eu fico com este!'] },
      { do: 'flag', name: 'rival_inicial' },
      { do: 'say', lines: ['O rival pegou o {rival}!'] },
      { do: 'face', who: 'rival', toward: 'player' },
      { do: 'face', who: 'player', toward: 'rival' },
      { do: 'say', name: 'Rival', lines: ['O meu {rival} leva vantagem contra o seu {pokemon}. Já comecei na frente!'] },
      { do: 'say', name: OAK, lines: ['Eu estava contando a {player} sobre as hordas. Você também devia ouvir.'] },
      { do: 'face', who: 'rival', toward: 'carvalho' },
      { do: 'say', name: 'Rival', lines: [
        'Hordas, hordas... Vô, eu quero é ser Campeão!',
        'Os Pokémon selvagens que se virem. Eu vou juntar as oito insígnias.'
      ] },
      { do: 'face', who: 'rival', toward: 'player' },
      { do: 'say', name: 'Rival', lines: ['A gente se vê na Liga, {player}. Se você chegar lá!'] },
      { do: 'walk', who: 'rival', to: [[6, 12]], speed: 0.13 },
      { do: 'hide', who: 'rival' },
      { do: 'face', who: 'carvalho', toward: 'player' },
      { do: 'face', who: 'player', toward: 'carvalho' },
      { do: 'say', name: OAK, lines: ['Esse meu neto... Sonha alto, mas ainda não entendeu o que está acontecendo lá fora.'] },
      // o fim de antes: o Mapa da Jornada e o "volte e me conte" (fecha a quest do Carvalho)
      { do: 'talk', key: 'carvalho_inicial', npc: 'carvalho' },
      { do: 'end' }
    ]
  },

  /* ============================ o Capítulo 1 (0.39) ============================ */

  // depois da Fase 1, no ginásio dele: o Brock parabeniza, conta que os Pokémon estão
  // estranhos e pede ajuda. É a apresentação do problema (o Maxie ainda não aparece), e
  // abre a quest da Misty, com as pistas em Cerulean
  depois_brock: {
    map: 'ginasio_pewter', spot: { x: 6, y: 6, dir: 'up' },
    trigger: [{ on: 'win', target: 'gym_1_pewter' }],
    steps: [
      { do: 'face', who: 'brock', dir: 'down' },
      { do: 'wait', t: 0.8 },
      { do: 'say', name: 'Brock', lines: [
        'Que batalha, {player}! Fazia tempo que ninguém me vencia desse jeito.',
        'A Insígnia Pedra é sua. Você e o {pokemon} mereceram.'
      ] },
      { do: 'wait', t: 0.5 },
      // ele olha para o lado, para a saída do ginásio, como quem pensa nas rotas lá fora
      { do: 'face', who: 'brock', dir: 'left' },
      { do: 'wait', t: 0.5 },
      { do: 'say', name: 'Brock', lines: [
        'Mas tem uma coisa que eu preciso te contar. Você atravessou as rotas até aqui e viu as hordas.',
        'Os Geodude desceram do Monte Lua, coisa que nunca fizeram. Os Pokémon estão agindo de um jeito que eu nunca vi.'
      ] },
      { do: 'face', who: 'brock', dir: 'down' },
      { do: 'wait', t: 0.4 },
      { do: 'say', name: 'Brock', lines: [
        'Isso é muito sério, {player}. Eu quero entender o que está acontecendo, e preciso da sua ajuda.',
        'O seu próximo ginásio é o da Misty, em Cerulean. Quando chegar lá, investigue a cidade e veja se acha alguma pista.'
      ] },
      { do: 'quest', id: 'c2_misty' },
      { do: 'say', name: 'Brock', lines: ['Conto com você. Qualquer coisa que descobrir pode ser importante.'] },
      { do: 'wait', t: 0.6 },
      { do: 'end', then: 'home' }
    ]
  },

  // logo depois, de volta à vila (pedido do Fellipe): o velho sábio sai de casa, vê o jogador,
  // o "!", e conta o que reparou: os pássaros lendários sumiram dos céus, e foi aí que tudo
  // começou. É tudo o que ele sabe; depois ele volta para casa e o jogador está livre.
  // O jogador aparece na rua, embaixo da casa dele (a volta da Fase 1 chega no `spot`)
  sabio_passaros: {
    map: 'vila', spot: { x: 27, y: 21, dir: 'left' },
    trigger: [{ on: 'win', target: 'gym_1_pewter' }],
    actors: { sabio: { sprite: 'npc/old_man_1', x: 30, y: 18, dir: 'down', hidden: true } },
    steps: [
      { do: 'wait', t: 0.4 },
      // a câmera sobe um pouco para mostrar a porta dele e o jogador juntos (o rastreador fica no canto de cima)
      { do: 'camera', x: 28, y: 19, t: 0.6 },
      // a porta abre: ele sai de casa
      { do: 'show', who: 'sabio' },
      { do: 'wait', t: 0.4 },
      { do: 'face', who: 'sabio', toward: 'player' },
      { do: 'emote', who: 'sabio' },
      { do: 'face', who: 'player', toward: 'sabio' },
      { do: 'say', name: 'Velho sábio', lines: ['{player}! Espere um pouco!'] },
      { do: 'walk', who: 'sabio', to: [[28, 21, 'left'], [27, 20, 'down']], speed: 0.3 },
      { do: 'face', who: 'player', toward: 'sabio' },
      { do: 'say', name: 'Velho sábio', lines: [
        'Soube que o Brock te pediu ajuda. As notícias correm rápido nesta vila.',
        'Antes de você seguir para Cerulean, quero te contar uma coisa.'
      ] },
      // ele olha para o céu, como faz todas as manhãs
      { do: 'face', who: 'sabio', dir: 'up' },
      { do: 'wait', t: 0.8 },
      { do: 'say', name: 'Velho sábio', lines: [
        'Faz muitos anos que eu olho o céu todas as manhãs. E reparei numa coisa...',
        'Os três pássaros lendários de Kanto sumiram dos céus. Faz tempo que ninguém vê nenhum deles.'
      ] },
      { do: 'face', who: 'sabio', toward: 'player' },
      { do: 'say', name: 'Velho sábio', lines: [
        'Foi depois disso que os Pokémon começaram a agir assim, e as hordas apareceram. Deve ter alguma coisa a ver.',
        'Mas isso é tudo que eu posso te ajudar, por enquanto. Boa sorte, {player}.'
      ] },
      { do: 'wait', t: 0.3 },
      // e volta para casa
      { do: 'walk', who: 'sabio', to: [[30, 18, 'up']], speed: 0.3 },
      { do: 'wait', t: 0.2 },
      { do: 'hide', who: 'sabio' },
      { do: 'camera', to: 'player', t: 0.5 },
      { do: 'end' }
    ]
  },

  /* ============================ o Capítulo 2 (0.39) ============================ */

  // depois da Fase 2, no ginásio dela: a Misty conta que o mar ficou bravo desde que o
  // Articuno sumiu (a primeira prova de que o sábio tem razão) e aponta o Surge e o Zapdos
  depois_misty: {
    map: 'ginasio_cerulean', spot: { x: 8, y: 7, dir: 'up' },
    trigger: [{ on: 'win', target: 'gym_2_cerulean' }],
    steps: [
      { do: 'face', who: 'misty', dir: 'down' },
      { do: 'wait', t: 0.8 },
      { do: 'say', name: 'Misty', lines: [
        'Nada mal, {player}! Pouca gente sai deste ginásio vitoriosa e seca.',
        'O Brock me avisou que você vinha. Disse que você está investigando as hordas.'
      ] },
      // ela se vira para a piscina
      { do: 'face', who: 'misty', dir: 'left' },
      { do: 'wait', t: 0.6 },
      { do: 'say', name: 'Misty', lines: [
        'Olhe a água. Meus Pokémon andam agitados, e não é só aqui. Os pescadores do Cabo dizem que o mar ficou bravo.',
        'Começou quando o Articuno deixou de ser visto sobre as Ilhas Seafoam. Ele voava por lá desde que eu era criança.'
      ] },
      { do: 'face', who: 'misty', dir: 'down' },
      { do: 'wait', t: 0.4 },
      { do: 'say', name: 'Misty', lines: [
        'Os pássaros lendários, você diz? Então o Articuno é um deles. E se os outros dois também sumiram?',
        'O Zapdos aparecia perto da Usina, para os lados de Vermilion. O Lt. Surge conhece aquele lugar melhor que ninguém.'
      ] },
      // a pista: fecha o "Encontre pistas" e abre a quest do Surge, no rastreador
      { do: 'emit', on: 'clue', target: 'articuno' },
      { do: 'wait', t: 0.4 },
      { do: 'say', name: 'Misty', lines: ['Se descobrir alguma coisa, me avise também. Boa sorte, {player}!'] },
      { do: 'wait', t: 0.6 },
      { do: 'end', then: 'home' }
    ]
  },

  // logo depois, na rua: a casa assaltada (como no FireRed). Todos culpam a Rocket (a pista
  // falsa), mas o ladrão só levou peças de máquina (as máquinas que prendem os pássaros, no
  // Capítulo 4). O rival passa correndo, a caminho de Vermilion
  cerulean_roubo: {
    map: 'cerulean', spot: { x: 10, y: 10, dir: 'up' },
    trigger: [{ on: 'win', target: 'gym_2_cerulean' }],
    actors: { rival: { sprite: 'npc/rival', x: 1, y: 9, dir: 'right', hidden: true } },
    steps: [
      { do: 'wait', t: 0.8 },
      { do: 'say', name: 'Policial', lines: ['Circulando! Ninguém entra na cena do crime.'] },
      { do: 'face', who: 'dono', toward: 'player' },
      { do: 'say', name: 'Dono da casa', lines: ['Entraram pelo muro de trás, de madrugada!'] },
      { do: 'face', who: 'policial', toward: 'dono' },
      { do: 'say', name: 'Policial', lines: ['Só pode ser a Equipe Rocket. Eles estão aprontando por toda Kanto.'] },
      { do: 'face', who: 'policial', dir: 'down' },
      { do: 'wait', t: 0.4 },
      { do: 'say', name: 'Dono da casa', lines: [
        'Mas eu não entendo... Não levaram dinheiro, nem Pokémon.',
        'Só as peças de máquina que eu guardava: motores, cabos, chapas de metal.'
      ] },
      { do: 'wait', t: 0.5 },
      // o rival chega correndo
      { do: 'show', who: 'rival' },
      { do: 'walk', who: 'rival', to: [[9, 10, 'right']], speed: 0.13 },
      { do: 'face', who: 'player', toward: 'rival' },
      { do: 'say', name: 'Rival', lines: ['Brincando de detetive, {player}? Eu já estou indo para Vermilion. Até mais!'] },
      { do: 'walk', who: 'rival', to: [[0, 9]], speed: 0.13 },
      { do: 'hide', who: 'rival' },
      { do: 'wait', t: 0.6 },
      { do: 'end', then: 'home' }
    ]
  }
};

/** Os passos que o game/Cutscene.js conhece (o check-data confere). */
export const CUTSCENE_STEPS = ['wait', 'say', 'talk', 'show', 'hide', 'place', 'walk', 'face', 'emote', 'throw', 'cutin',
  'bird', 'fade', 'camera', 'shake', 'give', 'quest', 'emit', 'flag', 'end'];

/** O que pode começar uma cena. */
export const CUTSCENE_TRIGGERS = ['enter', 'npc', 'starter', 'win', 'play'];
