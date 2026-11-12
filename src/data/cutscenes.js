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
 *             (apertou Jogar: a cena toca antes, e a fase começa no fim, com `then: 'stage'`)
 *             ou { on: 'tile', target: lugar, cells: [[x, y]...] } (pisou num desses tiles do lugar,
 *             H-7: a margem do fundo de Seafoam). Sem trigger, só o código a começa (a do Maxie).
 *
 * As cenas são ANTES e DEPOIS das fases, nunca no meio, e sempre em tela cheia, num
 * cenário do FireRed, com os personagens em pixel (regra do Fellipe). Fora da vila, o
 * cenário é um palco (`scene: true` em data/hub.js): a barra da vila some, e a cena
 * termina com `then: 'home'` (de volta para a vila) ou `then: 'stage'` (a fase).
 *   when      as condições das falas (data/dialogue.js) para o trigger valer
 *   record    false: não se registra em `campaign.scenes` (a do Maxie usa o registro do Kyogre)
 *   band      a faixa do corte de tela (passo `cutin`)
 *   actors    quem entra só na cena: { id: { sprite, x, y, dir, hidden, glow } } (`glow`: aparece
 *             por cima do escuro, como os olhos do Zapdos). As pessoas do
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
 *     card   { mission }               o card de uma missão de lendário (data/missions.js), no
 *                                      padrão do card de fase; espera o Lutar ou o Voltar
 *     cry    { dex }                   o grito de um Pokémon (assets/sound/cries)
 *     tremble { who, t, power }        alguém treme no lugar (o Zapdos assustado)
 *     fly    { who, t, height }        alguém levanta voo e some pelo alto da tela
 *     toast  { text, icon }            um aviso no canto da tela
 *     storm  { sprite } / { off }      a lembrança de uma tempestade: a tela azul-escura, os
 *                                      clarões e uma sombra de asas cruzando o alto
 *     item   { sprite, at } / { off }  um item num quadro ao lado da conversa (`at`: o tile)
 *     mist   { to, t } / { off }       a névoa (H-7, o fundo de Seafoam): do nível de agora até `to`
 *                                      em `t` segundos; `off` devolve a do lugar (`mist` em data/hub.js)
 *     flag   { name, value }           marca uma flag da vila (as falas `once`, os enfeites `hideIf`)
 *     end    { then }                  o fim: só aqui a cena conta como vista; `then` é uma
 *                                      ação das falas (data/dialogue.js), como 'starter', ou
 *                                      { go: { map, x, y, dir } } (leva a outro lugar, escurecendo)
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

/**
 * A margem do fundo de Seafoam (H-7): pisar num destes tiles começa a cena do fundo. São os da
 * margem de frente para a ilha (x até 15, linhas 7 a 11); quem chega pela escada do B4F (15,9)
 * aparece aqui dentro sem pisar, e a cena começa no primeiro passo.
 */
/**
 * Logo abaixo do alto do cume do Monte Brasa (H-8): pisar num destes tiles começa a cena do cume.
 * São a frente da plataforma (linha 7), o degrau (9,8 e 10,8) e a linha de baixo (9).
 */
const BRASA_SUMMIT = [
  [7, 7], [8, 7], [9, 7], [10, 7], [11, 7], [9, 8], [10, 8],
  [7, 9], [8, 9], [9, 9], [10, 9], [11, 9]
];

/**
 * A passagem do laboratório no subsolo da Mansão (H-9): só se abre com o interruptor apertado.
 * Pisar nela começa a cena do Mewtwo e da Elite dos Quatro.
 */
const MANSAO_DOOR = [[12, 10], [12, 11], [12, 12]];

const SEAFOAM_SHORE = [
  [11, 7], [12, 7], [13, 7], [14, 7], [15, 7], [11, 8], [12, 8],
  [11, 9], [12, 9], [13, 9], [14, 9], [15, 9], [11, 10], [12, 10], [13, 10], [14, 10], [15, 10],
  [11, 11], [12, 11], [13, 11], [14, 11], [15, 11]
];

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
      // a câmera mostra o professor e a porta juntos: a caixa de texto não tampa o jogador (H-9)
      { do: 'camera', x: 6, y: 8, t: 0.6 },
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
      // a câmera desce até a porta, para a caixa de texto não tampar o rival chegando (H-9)
      { do: 'camera', x: 8, y: 8, t: 0.4 },
      { do: 'show', who: 'rival' },
      { do: 'say', name: 'Rival', lines: ['Vô! Cheguei! Cadê o meu Pokémon?'] },
      { do: 'face', who: 'player', toward: 'rival' },
      { do: 'face', who: 'carvalho', toward: 'rival' },
      { do: 'say', name: OAK, lines: ['Atrasado como sempre! {player} chegou primeiro e já escolheu.'] },
      { do: 'camera', to: 'player', t: 0.5 },
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
  },

  // depois da Fase 3, no ginásio dele: a Usina apagou, o Zapdos sumiu (já são dois), e naquela
  // noite pareceu haver um combate lá dentro, como se o Zapdos estivesse brigando (pedido do Fellipe)
  depois_surge: {
    map: 'ginasio_vermilion', spot: { x: 5, y: 3, dir: 'up' },
    trigger: [{ on: 'win', target: 'gym_3_vermilion' }],
    steps: [
      { do: 'face', who: 'surge', dir: 'down' },
      { do: 'wait', t: 0.8 },
      { do: 'say', name: 'Lt. Surge', lines: [
        'Hah! Você tem pulso firme, recruta! Fazia tempo que ninguém me dava um choque desses.',
        'A Misty me ligou. Disse que você anda fazendo perguntas sobre os pássaros lendários.'
      ] },
      { do: 'face', who: 'surge', dir: 'left' },
      { do: 'wait', t: 0.5 },
      { do: 'say', name: 'Lt. Surge', lines: [
        'Então escute. Há alguns meses, a Usina, perto da Rota 10, apagou de uma noite para a outra. Vermilion ficou dias no escuro.',
        'Os Voltorb e os Magnemite que viviam lá vieram parar na cidade. Você enfrentou alguns no caminho até aqui.',
        'E desde aquela noite, ninguém vê o Zapdos. Ele vivia na Usina. Com o Articuno, já são dois.'
      ] },
      { do: 'face', who: 'surge', dir: 'down' },
      { do: 'wait', t: 0.4 },
      { do: 'say', name: 'Lt. Surge', lines: [
        'Mas tem uma coisa que não sai da minha cabeça. Quem estava perto da Usina naquela noite ouviu trovões lá dentro, um atrás do outro.',
        'Parecia um combate. Como se o Zapdos estivesse brigando com alguma coisa. Depois, silêncio. E tudo apagou.'
      ] },
      // a pista: fecha o "Descubra se o Zapdos também sumiu" (e o Capítulo 2) e abre a da Erika
      { do: 'emit', on: 'clue', target: 'zapdos' },
      { do: 'wait', t: 0.4 },
      // a Fase 4 está fechada (decisão 18): o Túnel de Pedra está no escuro desde o apagão
      { do: 'say', name: 'Lt. Surge', lines: [
        'Se foi a Equipe Rocket, eles aprenderam truques novos.',
        'E tem mais: o caminho para Celadon passa pelo Túnel de Pedra, e desde o apagão ele está no escuro. Ninguém atravessa.'
      ] },
      { do: 'wait', t: 0.6 },
      { do: 'end', then: 'home' }
    ]
  },

  // logo depois, no cais: o mar agitado (o mesmo da Misty) prendeu o marinheiro em terra, e
  // trabalhando pela Rota 10 ele escutou correntes dentro da Usina fechada. Abre a quest dela
  vermilion_correntes: {
    map: 'vermilion', spot: { x: 11, y: 11, dir: 'right' },
    trigger: [{ on: 'win', target: 'gym_3_vermilion' }],
    steps: [
      { do: 'wait', t: 0.8 },
      { do: 'face', who: 'marinheiro', toward: 'player' },
      { do: 'emote', who: 'marinheiro' },
      { do: 'say', name: 'Marinheiro', lines: ['Ei, treinador!'] },
      { do: 'walk', who: 'marinheiro', to: [[12, 11, 'left']] },
      { do: 'say', name: 'Marinheiro', lines: [
        'Você é o que anda investigando as hordas? O Lt. Surge falou de você.',
        'Faz semanas que eu não saio para o mar. A maré está agitada demais, nenhum barco consegue deixar o porto.'
      ] },
      // ele olha para o norte, para o lado da Usina
      { do: 'face', who: 'marinheiro', dir: 'up' },
      { do: 'wait', t: 0.5 },
      { do: 'say', name: 'Marinheiro', lines: [
        'Parado em terra, arrumei serviço levando cargas pela Rota 10. E uns dias atrás, passando perto da Usina...',
        'Escutei correntes. Correntes pesadas, se arrastando lá dentro. Mas a Usina está fechada desde o apagão!'
      ] },
      { do: 'face', who: 'marinheiro', toward: 'player' },
      { do: 'say', name: 'Marinheiro', lines: ['Eu não tive coragem de chegar perto. Mas um treinador como você... talvez consiga ver o que é.'] },
      { do: 'quest', id: 'z_usina' },
      { do: 'wait', t: 1.6 },
      { do: 'end', then: 'home' }
    ]
  },

  // a chegada na Usina (pela marca dela no mapa da jornada), uma vez: as luzes piscam, as paredes
  // estão marcadas por raios e um barulho de correntes vem lá do fundo. Depois, o jogador explora
  usina_entrada: {
    map: 'usina', spot: { x: 5, y: 37, dir: 'up' },
    trigger: [{ on: 'enter', target: 'usina' }],
    steps: [
      { do: 'wait', t: 0.5 },
      // as luzes piscam
      { do: 'fade', to: 0.7, t: 0.08 }, { do: 'fade', to: 0, t: 0.1 },
      { do: 'wait', t: 0.25 },
      { do: 'fade', to: 0.7, t: 0.08 }, { do: 'fade', to: 0, t: 0.14 },
      { do: 'wait', t: 0.4 },
      { do: 'say', lines: ['As luzes piscam, e as paredes estão marcadas por raios. Houve uma batalha aqui.'] },
      { do: 'shake', t: 0.6, power: 1.5 },
      { do: 'say', lines: ['Clanc... clanc... Um barulho de correntes vem lá do fundo da Usina.'] },
      { do: 'end' }
    ]
  },

  // o fundo da Usina (pela escotilha da sala do gerador), toda vez: o escuro, só o jogador com um
  // brilho fraco em volta; 2 s depois os olhos vermelhos (em pixel, num tile do mapa); mais 2 s e
  // o card da missão (pedido do Fellipe)
  usina_fundo: {
    map: 'usina_fundo', spot: { x: 7, y: 9, dir: 'up' }, record: false,
    trigger: [{ on: 'enter', target: 'usina_fundo' }],
    // só enquanto o Zapdos está preso (depois da missão, a escotilha leva à sala iluminada)
    when: { caged: 'zapdos' },
    actors: { olhos: { sprite: 'npc/olhos_zapdos', x: 7, y: 4, dir: 'down', hidden: true, glow: true } },
    steps: [
      { do: 'wait', t: 2 },
      { do: 'show', who: 'olhos' },
      { do: 'shake', t: 0.5, power: 1, wait: false },
      // a pista: fecha "Investigue a Usina" e abre "Derrote e liberte o Zapdos"
      { do: 'emit', on: 'clue', target: 'olhos' },
      { do: 'wait', t: 2 },
      { do: 'card', mission: 'zapdos' },
      // Voltar: de volta para cima, ao lado da escotilha (o Lutar acaba a cena ali e começa a luta)
      { do: 'end', then: { go: { map: 'usina', x: 5, y: 12, dir: 'left' } } }
    ]
  },

  // depois da missão do Zapdos (H-6, o gatilho 'win' da fase `zapdos`): a sala do fundo com a
  // luz de volta. O Zapdos, caído e sem forças, vê o jogador, se assusta e foge pelo alto (o
  // refino do Fellipe: a captura dele fica para outro momento). Na máquina destruída, a energia
  // sugada e mandada para longe, e o emblema vermelho. Toca na volta da luta (o "Continuar
  // Jornada" da vitória) e deixa o jogador em cima, ao lado da escotilha
  zapdos_livre: {
    map: 'usina_luz', spot: { x: 7, y: 9, dir: 'up' },
    trigger: [{ on: 'win', target: 'zapdos' }],
    actors: { zapdos: { sprite: 'npc/zapdos', x: 7, y: 7, dir: 'down' } },
    steps: [
      { do: 'fade', to: 1, t: 0 },
      { do: 'wait', t: 0.5 },
      // a luz volta: as lâmpadas piscam e acendem
      { do: 'fade', to: 0.3, t: 0.08 }, { do: 'fade', to: 1, t: 0.1 }, { do: 'wait', t: 0.25 },
      { do: 'fade', to: 0.2, t: 0.08 }, { do: 'fade', to: 0.8, t: 0.12 }, { do: 'wait', t: 0.15 },
      { do: 'fade', to: 0, t: 0.6 },
      { do: 'wait', t: 0.4 },
      { do: 'say', lines: ['A luz voltou à Usina. O Zapdos está caído no chão, sem forças.'] },
      { do: 'wait', t: 0.4 },
      { do: 'tremble', who: 'zapdos', t: 0.5, power: 1 },
      { do: 'wait', t: 0.3 },
      // ele vê o jogador, se assusta e foge pelo alto
      { do: 'emote', who: 'zapdos' },
      { do: 'cry', dex: 145 },
      { do: 'tremble', who: 'zapdos', t: 0.6, power: 3 },
      { do: 'shake', t: 0.5, power: 1.5, wait: false },
      { do: 'fly', who: 'zapdos', t: 0.9, height: 230 },
      { do: 'wait', t: 0.5 },
      { do: 'say', lines: [
        'O Zapdos fugiu, assustado.',
        'Ele ainda está fraco demais para confiar em alguém.'
      ] },
      { do: 'walk', who: 'player', to: [[7, 6, 'up']] },
      { do: 'emote', who: 'player' },
      { do: 'say', lines: [
        'A máquina que prendia o Zapdos está destruída. As correntes saíam dela.',
        'Ela sugava a energia do Zapdos pelas correntes e mandava para longe, em ondas. Para onde?',
        'No meio, um emblema vermelho que {player} nunca viu.',
        'Alguém prendeu o Zapdos aqui de propósito.'
      ] },
      { do: 'wait', t: 0.4 },
      // a luz da Usina volta, e com ela o Túnel de Pedra: a Fase 4 abre (decisão 18)
      { do: 'toast', text: 'A luz voltou: o Túnel de Pedra acendeu. O caminho para Celadon está aberto.', icon: 'stages' },
      { do: 'end', then: { go: { map: 'usina', x: 5, y: 12, dir: 'left' } } }
    ]
  },

  /* ========================= Capítulo 3: os rastros ========================= */
  // depois da Fase 4 (H-4, decisão 18, a proposta "Celadon: o emblema" aprovada pelo Fellipe):
  // no ginásio de Celadon, a Erika conta da tempestade da noite do apagão (a lembrança: uma sombra
  // de asas cruzando o céu, o Crobat do Maxie sem nome) e mostra o pedaço de metal do jardim. O
  // jogador reconhece o emblema da máquina da Usina. A pista falsa da Rocket continua, mas a
  // sombra seguiu para o sul, rumo ao mar. Depois, a história dos lendários descansa
  depois_erika: {
    map: 'ginasio_celadon', spot: { x: 7, y: 4, dir: 'left' },
    trigger: [{ on: 'win', target: 'gym_4_celadon' }],
    preload: ['dive/crobat', 'npc/pedaco_metal'],
    steps: [
      { do: 'face', who: 'erika', dir: 'right' },
      { do: 'wait', t: 0.6 },
      { do: 'say', name: 'Erika', lines: ['Que batalha bonita, {player}. Até as flores do ginásio se agitaram.'] },
      { do: 'face', who: 'erika', dir: 'up' },
      { do: 'wait', t: 0.5 },
      { do: 'say', name: 'Erika', lines: ['Sabe... na noite em que a Usina apagou, caiu uma tempestade estranha sobre Celadon.'] },
      // a lembrança: a tela escurece, os raios piscam e uma sombra de asas cruza o alto
      { do: 'storm' },
      { do: 'wait', t: 1.0 },
      { do: 'say', name: 'Erika', lines: ['No meio dos raios, vi uma sombra enorme cruzando o céu. Um Pokémon de asas, carregando alguma coisa pesada.'] },
      { do: 'storm', off: true },
      { do: 'face', who: 'erika', dir: 'right' },
      { do: 'wait', t: 0.3 },
      { do: 'say', name: 'Erika', lines: ['Pela manhã, achei isto no jardim, entre as flores. Como se tivesse caído do céu.'] },
      { do: 'item', sprite: 'npc/pedaco_metal', at: [1.4, 2.1] },
      { do: 'say', lines: ['Um pedaço de metal retorcido, com um emblema vermelho.'] },
      { do: 'emote', who: 'player' },
      { do: 'say', lines: ['{player} reconhece o emblema: é o mesmo da máquina que prendia o Zapdos!'] },
      // a pista: fecha "Descubra o que a Erika encontrou no jardim" e abre a do Koga
      { do: 'emit', on: 'clue', target: 'emblema' },
      { do: 'item', off: true },
      { do: 'say', name: 'Erika', lines: ['Você já viu isso antes? A Equipe Rocket tem um esconderijo aqui em Celadon, embaixo do Cassino...'] },
      { do: 'face', who: 'erika', dir: 'down' },
      { do: 'wait', t: 0.3 },
      { do: 'say', name: 'Erika', lines: ['Mas a sombra não foi para o Cassino. Seguiu para o sul, na direção do mar.'] },
      { do: 'face', who: 'erika', dir: 'right' },
      { do: 'say', name: 'Erika', lines: ['Fique com ele. Quem sabe um dia você descobre de onde veio.'] },
      { do: 'give', item: 'emblema_vermelho' },
      { do: 'say', name: 'Erika', lines: ['O seu próximo desafio é o Koga, em Fuchsia. Também fica ao sul. Fique de olhos abertos pelo caminho.'] },
      { do: 'wait', t: 0.5 },
      { do: 'end', then: 'home' }
    ]
  },

  // de volta à sala do fundo depois da missão: só os pedaços da máquina
  usina_luz_volta: {
    map: 'usina_luz', spot: { x: 7, y: 9, dir: 'up' }, record: false,
    trigger: [{ on: 'enter', target: 'usina_luz' }],
    when: { scene: 'zapdos_livre' },
    steps: [
      { do: 'wait', t: 0.6 },
      { do: 'say', lines: ['A sala do fundo está quieta. Só sobraram os pedaços da máquina do emblema vermelho.'] },
      { do: 'end', then: { go: { map: 'usina', x: 5, y: 12, dir: 'left' } } }
    ]
  },

  /* ========================= Capítulo 4: as ondas (H-7) ========================= */
  // depois da Fase 7 (a proposta "Seafoam: as ondas", aprovada pelo Fellipe: "pode seguir com o que
  // fez"): na sala do Blaine, a pergunta bônus do quiz dele, os instrumentos do Laboratório Pokémon
  // captando ondas que saem das Ilhas Seafoam e seguem para o sul, e o mar congelando em volta
  // delas. O jogador liga às ondas da máquina da Usina. Sem citar o Articuno (sem spoiler)
  depois_blaine: {
    map: 'ginasio_cinnabar', spot: { x: 5, y: 5, dir: 'up' },
    trigger: [{ on: 'win', target: 'gym_7_cinnabar' }],
    preload: ['npc/leitura'],
    steps: [
      { do: 'face', who: 'blaine', dir: 'down' },
      { do: 'wait', t: 0.6 },
      { do: 'say', name: 'Blaine', lines: [
        'Hah! Você apagou o meu fogo, {player}! Faz tempo que ninguém me vence assim.',
        'Pergunta bônus do meu quiz: o que faz o mar congelar do lado de um vulcão?'
      ] },
      { do: 'face', who: 'blaine', dir: 'left' },
      { do: 'wait', t: 0.4 },
      { do: 'say', name: 'Blaine', lines: ['...Também não sei a resposta. E é isso que me tira o sono.'] },
      // a leitura dos instrumentos, num quadro: pulsos que se repetem
      { do: 'item', sprite: 'npc/leitura', at: [9.2, 0.7] },
      { do: 'say', name: 'Blaine', lines: [
        'No Laboratório Pokémon, os meus instrumentos captam umas ondas estranhas. Faz semanas.',
        'Pulsam de tempos em tempos, sempre vindas das Ilhas Seafoam. E seguem para o sul, pelo mar, até sumir.'
      ] },
      { do: 'item', off: true },
      { do: 'face', who: 'blaine', dir: 'down' },
      { do: 'emote', who: 'player' },
      { do: 'say', lines: ['Ondas... {player} lembra da máquina da Usina, que mandava a energia do Zapdos para longe!'] },
      // a pista: fecha "Ouça o que o Blaine descobriu" e abre "Investigue as Ilhas Seafoam"
      { do: 'emit', on: 'clue', target: 'ondas' },
      { do: 'say', name: 'Blaine', lines: [
        'Ondas de máquina? Hah! Então tem alguém mexendo onde não devia.',
        'E tem mais: o mar em volta de Seafoam está congelando, fora de época. Nenhum barco consegue sair de Cinnabar.',
        'Se quer respostas, desça até o fundo das Ilhas Seafoam. E leve um casaco! Hah!'
      ] },
      { do: 'wait', t: 0.5 },
      { do: 'end', then: 'home' }
    ]
  },

  // a chegada às Ilhas Seafoam (pela marca delas no mapa da jornada), uma vez: o frio, o gelo e um
  // zumbido lá do fundo. Depois, o jogador desce a pé (os cinco andares do FireRed)
  seafoam_entrada: {
    map: 'seafoam_1f', spot: { x: 6, y: 20, dir: 'up' },
    trigger: [{ on: 'enter', target: 'seafoam_1f' }],
    steps: [
      { do: 'wait', t: 0.5 },
      { do: 'say', lines: ['Um frio que corta. O chão das Ilhas Seafoam está coberto de gelo.'] },
      { do: 'shake', t: 0.5, power: 1 },
      { do: 'say', lines: ['Lá embaixo, as ondas batem forte. E, no meio delas, um zumbido baixo, que vem lá do fundo.'] },
      { do: 'end' }
    ]
  },

  // o fundo (pisou na margem pela primeira vez): a névoa cobre a água, o zumbido da Usina e as
  // ondas subindo; a névoa se abre e, na ilha do canto (onde o Articuno fica no FireRed), a máquina
  // do emblema vermelho coberta de gelo com o Articuno preso por correntes. O card sobe
  seafoam_fundo: {
    map: 'seafoam_b4f', spot: { x: 17, y: 7, dir: 'left' },
    trigger: [{ on: 'tile', target: 'seafoam_b4f', cells: SEAFOAM_SHORE }],
    when: { caged: 'articuno' },
    steps: [
      { do: 'mist', to: 0.62, t: 0.6 },
      { do: 'say', lines: ['Um frio que corta. A névoa cobre toda a água.'] },
      { do: 'walk', who: 'player', to: [[12, 7, 'left']] },
      { do: 'say', lines: ['Do outro lado da água, um zumbido. O mesmo da Usina.'] },
      { do: 'camera', x: 11.5, y: 4, t: 1.0 },
      { do: 'face', who: 'player', dir: 'up' },
      { do: 'mist', to: 0.24, t: 1.4 },
      { do: 'emote', who: 'player' },
      { do: 'say', lines: [
        'Numa máquina coberta de gelo, uma silhueta enorme de asas, presa por correntes.',
        'As ondas saem da máquina e somem pelo teto da caverna. Como na Usina.'
      ] },
      { do: 'cry', dex: 144 },
      { do: 'shake', t: 0.6, power: 1.5 },
      { do: 'say', lines: ['É o Articuno! A máquina está sugando a energia dele.'] },
      // a pista: fecha "Investigue as Ilhas Seafoam" e abre "Derrote e liberte o Articuno"
      { do: 'emit', on: 'clue', target: 'articuno_preso' },
      { do: 'wait', t: 1.2 },
      { do: 'card', mission: 'articuno' },
      // Voltar: um passo para trás na margem (o Lutar acaba a cena ali e começa a luta)
      { do: 'end', then: { go: { map: 'seafoam_b4f', x: 17, y: 7, dir: 'right' } } }
    ]
  },

  // de volta à margem com o Articuno ainda preso, toda vez: a névoa se abre, a máquina e o card
  seafoam_fundo_card: {
    map: 'seafoam_b4f', spot: { x: 17, y: 7, dir: 'left' }, record: false,
    trigger: [{ on: 'tile', target: 'seafoam_b4f', cells: SEAFOAM_SHORE }],
    when: { caged: 'articuno', scene: 'seafoam_fundo' },
    steps: [
      { do: 'walk', who: 'player', to: [[12, 7, 'up']] },
      { do: 'camera', x: 11.5, y: 4, t: 0.8 },
      { do: 'mist', to: 0.24, t: 1.0 },
      { do: 'say', lines: ['A máquina coberta de gelo continua sugando a energia do Articuno.'] },
      { do: 'card', mission: 'articuno' },
      { do: 'end', then: { go: { map: 'seafoam_b4f', x: 17, y: 7, dir: 'right' } } }
    ]
  },

  // depois da missão do Articuno (o gatilho 'win' da fase `articuno`), na ilha, sem névoa: ele está
  // caído, treme, vê o jogador, grita e foge pela fenda do teto. Na máquina quebrada, o mesmo
  // emblema: duas máquinas, dois pássaros. O mar descongela, e a Fase 8 abre. No fim, o atalho
  // (pedido do Fellipe): o jogador aparece na vila, sem subir os cinco andares de volta
  articuno_livre: {
    map: 'seafoam_b4f', spot: { x: 13, y: 2, dir: 'left' },
    trigger: [{ on: 'win', target: 'articuno' }],
    actors: { articuno: { sprite: 'npc/articuno', x: 11, y: 3, dir: 'down' } },
    steps: [
      { do: 'fade', to: 1, t: 0 },
      { do: 'wait', t: 0.4 },
      { do: 'fade', to: 0, t: 0.8 },
      { do: 'wait', t: 0.3 },
      { do: 'say', lines: ['A névoa se desfez. O Articuno está caído no gelo, sem forças.'] },
      { do: 'tremble', who: 'articuno', t: 0.5, power: 1 },
      { do: 'wait', t: 0.3 },
      // ele vê o jogador, se assusta e foge pelo alto
      { do: 'emote', who: 'articuno' },
      { do: 'cry', dex: 144 },
      { do: 'tremble', who: 'articuno', t: 0.6, power: 3 },
      { do: 'shake', t: 0.5, power: 1.5, wait: false },
      { do: 'say', lines: ['O Articuno treme, vê {player} e grita, assustado!'] },
      { do: 'fly', who: 'articuno', t: 1.0, height: 230 },
      { do: 'wait', t: 0.4 },
      { do: 'say', lines: [
        'O Articuno fugiu pela fenda do teto, por onde caem as pedras.',
        'Ele ainda está fraco demais para confiar em alguém.'
      ] },
      { do: 'emote', who: 'player' },
      { do: 'say', lines: [
        'A mesma máquina da Usina, coberta de gelo. O mesmo emblema vermelho.',
        'Duas máquinas, dois pássaros. Alguém está juntando a energia deles. Para quê?'
      ] },
      { do: 'say', lines: ['A correnteza voltou a correr.'] },
      // o mar descongela, e com ele a Rota 21: a Fase 8 abre
      { do: 'toast', text: 'O mar descongelou: os barcos saem de Cinnabar de novo. O caminho para Viridian está aberto.', icon: 'stages' },
      { do: 'end', then: 'home' }
    ]
  },

  /* ========================= Capítulo 5: a suspeita (H-8) ========================= */
  // depois da Fase 8 (a proposta "Monte Brasa: o fogo"): o jogador chega achando que é a Rocket e
  // mostra o Pedaço de Metal. O Giovanni ri: não é da Rocket, e ele também quer saber quem é. Os
  // homens dele viram o emblema subindo o Monte Brasa, com peças de máquina (as de Cerulean)
  depois_giovanni: {
    map: 'ginasio_viridian', spot: { x: 2, y: 4, dir: 'up' },
    trigger: [{ on: 'win', target: 'gym_8_viridian' }],
    preload: ['npc/pedaco_metal'],
    steps: [
      { do: 'face', who: 'giovanni', dir: 'down' },
      { do: 'wait', t: 0.6 },
      { do: 'say', name: 'Giovanni', lines: [
        'Fwahaha! Faz tempo que ninguém me derrota no meu próprio ginásio, {player}.',
        'Então é você o treinador que anda revirando Kanto atrás da Equipe Rocket.'
      ] },
      { do: 'item', sprite: 'npc/pedaco_metal', at: [9.2, 0.7] },
      { do: 'say', lines: ['{player} mostra o Pedaço de Metal, com o emblema vermelho.'] },
      { do: 'face', who: 'giovanni', dir: 'left' },
      { do: 'wait', t: 0.4 },
      { do: 'say', name: 'Giovanni', lines: ['Hm... Fwahaha! Isso não é da Rocket. O nosso emblema é um R, e a Rocket não deixa rastro para trás.'] },
      { do: 'item', off: true },
      { do: 'face', who: 'giovanni', dir: 'down' },
      { do: 'say', name: 'Giovanni', lines: ['Mas eu também quero saber quem é. Alguém anda agindo no meu território e deixando a Rocket levar a culpa.'] },
      { do: 'face', who: 'giovanni', dir: 'up' },
      { do: 'wait', t: 0.4 },
      { do: 'say', name: 'Giovanni', lines: ['Meus homens nas Ilhas Sevii viram gente com esse emblema subindo o Monte Brasa, na Ilha 1. Carregavam peças de máquina.'] },
      { do: 'emote', who: 'player' },
      { do: 'say', lines: ['Peças de máquina... {player} lembra da casa assaltada de Cerulean!'] },
      // a pista: fecha "Mostre o Pedaço de Metal ao Giovanni" e abre "Investigue o Monte Brasa"
      { do: 'emit', on: 'clue', target: 'monte_brasa' },
      { do: 'face', who: 'giovanni', dir: 'down' },
      { do: 'say', name: 'Giovanni', lines: ['O barco para a Ilha 1 sai de Cinnabar. Se descobrir quem são... volte e me conte. Fwahaha!'] },
      { do: 'wait', t: 0.5 },
      { do: 'end', then: 'home' }
    ]
  },

  // a chegada ao Monte Brasa (pela marca da Ilha 1 no mapa da jornada), uma vez: a fumaça e as
  // pedras do caminho arrastadas para o lado. Depois, o jogador sobe a pé
  brasa_entrada: {
    map: 'brasa_encosta', spot: { x: 28, y: 47, dir: 'up' },
    trigger: [{ on: 'enter', target: 'brasa_encosta' }],
    steps: [
      { do: 'wait', t: 0.5 },
      { do: 'say', lines: ['O barco deixou {player} na Ilha 1. A trilha sobe até o pé do Monte Brasa, que solta fumaça.'] },
      // as duas pedras arrastadas, ali do lado
      { do: 'camera', x: 20, y: 45, t: 1.0 },
      { do: 'say', lines: [
        'As pedras grandes do caminho foram arrastadas para o lado. O chão está marcado, como se alguém tivesse puxado uma coisa pesada.',
        'Alguém subiu por aqui, até o cume.'
      ] },
      { do: 'camera', to: 'player', t: 0.8 },
      { do: 'end' }
    ]
  },

  // o cume (pisou logo abaixo do alto pela primeira vez): o calor, a máquina em brasa com o Moltres
  // preso por correntes e as ondas subindo pela boca do vulcão. O card sobe
  brasa_cume: {
    map: 'brasa_cume', spot: { x: 8, y: 10, dir: 'up' },
    trigger: [{ on: 'tile', target: 'brasa_cume', cells: BRASA_SUMMIT }],
    when: { caged: 'moltres' },
    steps: [
      { do: 'say', lines: ['Um calor que sufoca. O ar treme em cima das pedras.'] },
      { do: 'walk', who: 'player', to: [[9, 8, 'up']] },
      { do: 'camera', x: 9.5, y: 6, t: 0.8 },
      { do: 'emote', who: 'player' },
      { do: 'say', lines: [
        'No alto, uma máquina em brasa. Presa a ela por correntes, uma silhueta de asas em chamas.',
        'As ondas saem da máquina e somem no céu, pela boca do vulcão. Como na Usina e em Seafoam.'
      ] },
      { do: 'cry', dex: 146 },
      { do: 'shake', t: 0.6, power: 1.5 },
      { do: 'say', lines: ['É o Moltres! A terceira máquina. A terceira ave.'] },
      // a pista: fecha "Investigue o Monte Brasa" e abre "Derrote e liberte o Moltres"
      { do: 'emit', on: 'clue', target: 'moltres_preso' },
      { do: 'wait', t: 1.2 },
      { do: 'card', mission: 'moltres' },
      // Voltar: um passo atrás, fora do alto (o Lutar acaba a cena ali e começa a luta)
      { do: 'end', then: { go: { map: 'brasa_cume', x: 8, y: 10, dir: 'down' } } }
    ]
  },

  // de volta ao alto com o Moltres ainda preso, toda vez: a máquina e o card
  brasa_cume_card: {
    map: 'brasa_cume', spot: { x: 8, y: 10, dir: 'up' }, record: false,
    trigger: [{ on: 'tile', target: 'brasa_cume', cells: BRASA_SUMMIT }],
    when: { caged: 'moltres', scene: 'brasa_cume' },
    steps: [
      { do: 'walk', who: 'player', to: [[9, 8, 'up']] },
      { do: 'camera', x: 9.5, y: 6, t: 0.8 },
      { do: 'say', lines: ['A máquina em brasa continua sugando a energia do Moltres.'] },
      { do: 'card', mission: 'moltres' },
      { do: 'end', then: { go: { map: 'brasa_cume', x: 8, y: 10, dir: 'down' } } }
    ]
  },

  // depois da missão do Moltres (o gatilho 'win' da fase `moltres`), no cume, com o calor baixando:
  // ele está caído, treme, grita e foge para o céu. A terceira máquina, e a pista nova: o pico escuro
  // do emblema lembra um vulcão. A Liga reabre a Victory Road, e o atalho leva para a vila
  moltres_livre: {
    map: 'brasa_cume', spot: { x: 10, y: 8, dir: 'left' },
    trigger: [{ on: 'win', target: 'moltres' }],
    actors: { moltres: { sprite: 'npc/moltres', x: 9, y: 7, dir: 'down' } },
    preload: ['npc/emblema'],
    steps: [
      { do: 'fade', to: 1, t: 0 },
      { do: 'wait', t: 0.4 },
      { do: 'fade', to: 0, t: 0.8 },
      { do: 'wait', t: 0.3 },
      { do: 'say', lines: ['O calor baixou. O Moltres está caído ao pé da máquina, sem forças.'] },
      { do: 'tremble', who: 'moltres', t: 0.5, power: 1 },
      { do: 'wait', t: 0.3 },
      { do: 'emote', who: 'moltres' },
      { do: 'cry', dex: 146 },
      { do: 'tremble', who: 'moltres', t: 0.6, power: 3 },
      { do: 'shake', t: 0.5, power: 1.5, wait: false },
      { do: 'say', lines: ['O Moltres treme, vê {player} e grita, assustado!'] },
      { do: 'fly', who: 'moltres', t: 1.0, height: 230 },
      { do: 'wait', t: 0.4 },
      { do: 'say', lines: [
        'O Moltres fugiu para o céu, por cima da boca do vulcão.',
        'Ele ainda está fraco demais para confiar em alguém.'
      ] },
      { do: 'face', who: 'player', dir: 'up' },
      { do: 'emote', who: 'player' },
      { do: 'say', lines: [
        'A mesma máquina, em brasa. O mesmo emblema vermelho.',
        'Três máquinas, três pássaros. Toda essa energia, mandada para longe. Para onde?'
      ] },
      // a pista nova: o emblema de perto (na cena do Kyogre, o Maxie diz "A caminho do vulcão!")
      { do: 'item', sprite: 'npc/emblema', at: [12, 3.5] },
      { do: 'say', lines: ['De perto, o pico escuro do emblema lembra... um vulcão.'] },
      { do: 'item', off: true },
      { do: 'say', lines: ['O vento muda, e a fumaça do vulcão se abre.'] },
      // os três pássaros livres: a Liga reabre a Victory Road (decisão 2)
      { do: 'toast', text: 'As rotas se acalmaram: a Liga reabriu a Victory Road.', icon: 'stages' },
      // o atalho (pedido do Fellipe na H-7): de volta para a vila, sem descer a montanha
      { do: 'end', then: 'home' }
    ]
  },

  /* ========================= Capítulo 7: o sonho (H-10) ========================= */
  // a proposta "O sonho da Liga", aprovada ("top, tudo aprovado"). Depois da primeira vitória contra
  // cada um dos quatro, a volta passa pela sala dele, com duas falas que lembram a Mansão
  depois_lorelei: {
    map: 'sala_lorelei', spot: { x: 6, y: 5, dir: 'up' },
    trigger: [{ on: 'win', target: 'e4_lorelei' }],
    steps: [
      { do: 'wait', t: 0.4 },
      { do: 'say', name: 'Lorelei', lines: ['Na Mansão, eu achei que você tinha tido sorte. Não era sorte.'] },
      { do: 'say', name: 'Lorelei', lines: ['Só agora parei de tremer daquela jaula. Vá em frente, {player}: o Bruno está esperando.'] },
      { do: 'wait', t: 0.3 },
      { do: 'end', then: 'home' }
    ]
  },
  depois_bruno: {
    map: 'sala_bruno', spot: { x: 6, y: 5, dir: 'up' },
    trigger: [{ on: 'win', target: 'e4_bruno' }],
    steps: [
      { do: 'wait', t: 0.4 },
      { do: 'say', name: 'Bruno', lines: ['Hmph! Treinei a noite inteira depois daquela grade. Não foi o bastante.'] },
      { do: 'say', name: 'Bruno', lines: ['A Agatha é a próxima. Ela não perdoa ninguém, nem quem a tirou de uma jaula.'] },
      { do: 'wait', t: 0.3 },
      { do: 'end', then: 'home' }
    ]
  },
  depois_agatha: {
    map: 'sala_agatha', spot: { x: 6, y: 5, dir: 'up' },
    trigger: [{ on: 'win', target: 'e4_agatha' }],
    steps: [
      { do: 'wait', t: 0.4 },
      { do: 'say', name: 'Agatha', lines: ['Hehe... Os meus fantasmas avisaram que você ia ganhar. Eu não quis ouvir.'] },
      { do: 'say', name: 'Agatha', lines: ['Vá. O Lance espera, e os pássaros estão de olho em você.'] },
      { do: 'wait', t: 0.3 },
      { do: 'end', then: 'home' }
    ]
  },
  depois_lance: {
    map: 'sala_lance', spot: { x: 6, y: 5, dir: 'up' },
    trigger: [{ on: 'win', target: 'e4_lance' }],
    steps: [
      { do: 'wait', t: 0.4 },
      { do: 'say', name: 'Lance', lines: ['Você nos tirou de uma jaula e agora nos venceu. A Liga vai lembrar desse nome.'] },
      { do: 'say', name: 'Lance', lines: ['Mas ainda há uma porta. Alguém chegou lá antes de você.'] },
      { do: 'wait', t: 0.3 },
      { do: 'end', then: 'home' }
    ]
  },

  // o primeiro Jogar do Campeão: o rival na sala dele. Ele venceu os quatro antes do jogador,
  // aproveitando que o jogador os trouxe de volta (como no FireRed, em que ele chega antes)
  campeao_antes: {
    map: 'sala_campeao', spot: { x: 6, y: 8, dir: 'up' },
    trigger: [{ on: 'play', target: 'champion' }],
    steps: [
      { do: 'wait', t: 0.4 },
      { do: 'walk', who: 'player', to: [[6, 6, 'up']] },
      { do: 'say', name: 'Rival', lines: ['Até que enfim, {player}! Adivinha quem é o Campeão?'] },
      { do: 'emote', who: 'player' },
      { do: 'say', name: 'Rival', lines: ['Enquanto você brincava de detetive, a Elite dos Quatro voltou. E eu venci os quatro antes de você!'] },
      { do: 'say', name: 'Rival', lines: ['Valeu por trazer eles de volta. Agora vem: o melhor treinador do mundo está bem aqui!'] },
      { do: 'end', then: 'stage' }
    ]
  },

  // depois do Campeão (e do Hall da Fama): o rival vencido admite que o jogador estava certo
  campeao_depois: {
    map: 'sala_campeao', spot: { x: 6, y: 6, dir: 'up' },
    trigger: [{ on: 'win', target: 'champion' }],
    steps: [
      { do: 'wait', t: 0.4 },
      { do: 'say', name: 'Rival', lines: ['Eu... perdi? Logo agora que eu era o Campeão?'] },
      { do: 'face', who: 'rival', dir: 'left' },
      { do: 'say', name: 'Rival', lines: ['As hordas, as máquinas, os pássaros... Você estava certo, {player}. Eu só olhava para as insígnias.'] },
      { do: 'face', who: 'rival', dir: 'down' },
      { do: 'say', name: 'Rival', lines: ['Vou treinar de verdade. E da próxima vez que alguém precisar, eu também ajudo.'] },
      { do: 'walk', who: 'rival', to: [[6, 9]], speed: 0.14 },
      { do: 'hide', who: 'rival' },
      // fecha "Vença o Campeão" pela vitória; abre "Conte ao Prof. Carvalho"
      { do: 'end', then: 'home' }
    ]
  },

  // no laboratório da vila, com a quest "Conte ao Prof. Carvalho" (a nota do Fellipe no HISTORIA): o
  // Carvalho ("ainda falta alguma coisa") e o Mew, por telepatia. A captura dos lendários já está
  // aberta pelo Campeão (decisão 24); o Carvalho conta isso ao jogador
  carvalho_mew: {
    map: 'lab', spot: { x: 6, y: 11, dir: 'up' },
    trigger: [{ on: 'enter', target: 'lab' }, { on: 'npc', target: 'carvalho' }],
    when: { quest: 'c7_carvalho' },
    actors: { mew: { sprite: 'npc/mew', x: 10, y: 6, hidden: true, lift: 12 } },
    steps: [
      { do: 'wait', t: 0.3 },
      { do: 'walk', who: 'player', to: [[6, 5, 'up']] },
      { do: 'face', who: 'carvalho', dir: 'down' },
      { do: 'say', name: OAK, lines: ['{player}! O novo Campeão de Kanto! Eu sempre soube.'] },
      { do: 'say', name: OAK, lines: ['As rotas estão mais calmas desde que os pássaros voltaram... mas não como antes. Ainda falta alguma coisa.'] },
      // a luz rosa e o Mew flutuando
      { do: 'flash', t: 0.8, power: 0.7, color: '255,170,225' },
      { do: 'show', who: 'mew' },
      { do: 'emote', who: 'player' },
      { do: 'say', lines: ['Uma luz rosa se acende no meio do laboratório.'] },
      { do: 'face', who: 'player', dir: 'right' },
      { do: 'say', lines: ['É o Mew, o Pokémon dos diários da Mansão! Uma voz soa dentro da cabeça de {player}...'] },
      // a telepatia: só o jogador entende
      { do: 'say', name: 'Mew', lines: ['Obrigado por libertar os pássaros e o Mewtwo.'] },
      { do: 'say', name: 'Mew', lines: ['O Maxie também tentou me prender numa das máquinas dele. Eu consegui fugir.'] },
      { do: 'say', name: 'Mew', lines: ['As hordas continuam estranhas porque ele não parou. Ele anda roubando a energia de lendários em outras regiões também.'] },
      { do: 'say', name: 'Mew', lines: ['E o próximo da lista dorme aqui perto, no fundo da lagoa.'] },
      { do: 'fly', who: 'mew', t: 0.8, height: 120 },
      { do: 'flash', t: 0.6, power: 0.8, color: '255,170,225' },
      { do: 'say', lines: ['O Mew dá uma volta no ar... e some.'] },
      { do: 'face', who: 'player', dir: 'up' },
      { do: 'say', name: OAK, lines: ['Você também viu? Um Pokémon rosa! Ele olhava para você como se estivesse falando...'] },
      { do: 'say', name: OAK, lines: ['Os lendários confiam em você agora. Se cruzar com eles por aí, talvez aceitem seguir com você.'] },
      { do: 'end' }
    ]
  },

  /* ========================= Capítulo 6: a Elite dos Quatro (H-9) ========================= */
  // a proposta "A base na Mansão", aprovada ("pode seguir exatamente com esse roteiro"), com o refino
  // do Fellipe: a caixa de texto nunca tampa ninguém (a câmera das cenas e o teste do ui-smoke)

  // o primeiro Jogar da Lorelei (o gatilho de antes da fase), com os três pássaros livres: na porta
  // da Victory Road, o guarda conta que a Liga está vazia e entrega o bilhete do Lance. A fase não
  // começa: a volta é para o mapa da jornada, com a trava nova (data/stages.js)
  victory_road: {
    map: 'rota23_portao', spot: { x: 5, y: 8, dir: 'right' },
    trigger: [{ on: 'play', target: 'e4_lorelei' }],
    preload: ['npc/bilhete'],
    steps: [
      { do: 'wait', t: 0.5 },
      { do: 'say', name: 'Guarda', lines: ['A Insígnia da Terra... São as oito! Pode passar: a Victory Road é logo ali.'] },
      { do: 'emote', who: 'player' },
      { do: 'say', name: 'Guarda', lines: ['Mas não adianta subir agora. A Liga está vazia.'] },
      { do: 'face', who: 'guarda', dir: 'up' },
      { do: 'say', name: 'Guarda', lines: ['Ontem à noite os quatro desceram juntos: a Lorelei, o Bruno, a Agatha e o Lance. Em vinte anos de guarda, nunca vi isso.'] },
      { do: 'face', who: 'guarda', dir: 'left' },
      { do: 'item', sprite: 'npc/bilhete', at: [10.5, 1.2] },
      { do: 'say', name: 'Guarda', lines: ['O Lance deixou um bilhete para o primeiro treinador que chegasse aqui com as oito insígnias.'] },
      { do: 'say', name: 'Bilhete', lines: [
        'Os pássaros de Kanto voltaram, mas alguém continua prendendo Pokémon fortes. Os fantasmas da Agatha sentiram um sofrendo na velha Mansão de Cinnabar.',
        'Nós vamos acabar com isso. Se não voltarmos, a Liga continua fechada. Lance.'
      ] },
      { do: 'item', off: true },
      { do: 'say', name: 'Guarda', lines: ['Se você chegou até aqui, é forte. Talvez eles precisem de ajuda.'] },
      // fecha "Siga pela Victory Road" e abre "Ajude a Elite dos Quatro" (o objetivo `scene`)
      { do: 'end', then: 'campaign' }
    ]
  },

  // a chegada à Mansão (pela marca de Cinnabar no mapa da jornada), uma vez: o Blaine na porta
  mansao_entrada: {
    map: 'mansao_1f', spot: { x: 8, y: 32, dir: 'up' },
    trigger: [{ on: 'enter', target: 'mansao_1f' }],
    steps: [
      { do: 'wait', t: 0.5 },
      { do: 'say', lines: ['A Mansão Pokémon. Queimada e abandonada há anos... e com a porta arrombada.'] },
      { do: 'face', who: 'blaine', dir: 'down' },
      { do: 'emote', who: 'blaine' },
      { do: 'say', name: 'Blaine', lines: ['Hah! Eu sabia que você vinha.'] },
      { do: 'say', name: 'Blaine', lines: ['Os quatro entraram ontem à noite e não saíram. Eu vi da janela do ginásio.'] },
      { do: 'face', who: 'blaine', dir: 'up' },
      { do: 'say', name: 'Blaine', lines: ['Esta mansão foi um laboratório. Eu trabalhei aqui, há muitos anos. O que fizemos lá embaixo... eu prefiro esquecer.'] },
      { do: 'face', who: 'blaine', dir: 'down' },
      { do: 'say', name: 'Blaine', lines: ['Uma dica: as estátuas escondem um interruptor. Ele abre umas passagens e fecha outras. Leia os diários pelo caminho.'] },
      { do: 'say', name: 'Blaine', lines: ['Pergunta bônus: o que se esconde no porão de uma casa queimada? ...Essa, eu não quero saber a resposta.'] },
      // ele sai pela porta (pelo lado do jogador)
      { do: 'walk', who: 'blaine', to: [[9, 33]], speed: 0.14 },
      { do: 'hide', who: 'blaine' },
      { do: 'end' }
    ]
  },

  // o laboratório do subsolo (pisar na passagem que o interruptor abre): o Mewtwo na máquina, a
  // Elite dos Quatro nas jaulas, a emboscada do Maxie (a primeira aparição dele), os três pássaros e
  // a libertação, sem luta (decisão do Fellipe). As jaulas e a máquina mudam pelas flags da cena
  mansao_lab: {
    map: 'mansao_b1f', spot: { x: 13, y: 11, dir: 'left' },
    trigger: [{ on: 'tile', target: 'mansao_b1f', cells: MANSAO_DOOR }],
    when: { quest: 'c6_e4' },
    preload: ['npc/emblema', 'dive/maxie', 'dive/crobat'],
    actors: {
      maxie: { sprite: 'dive/maxie', x: 13, y: 11, dir: 'left', hidden: true },
      capanga1: { sprite: 'npc/capanga', x: 14, y: 11, dir: 'left', hidden: true },
      capanga2: { sprite: 'npc/capanga', x: 13, y: 12, dir: 'left', hidden: true },
      gelo1: { sprite: 'npc/gelo', x: 11, y: 10, hidden: true },
      gelo2: { sprite: 'npc/gelo', x: 12, y: 12, hidden: true },
      fogo: { sprite: 'npc/fogo', x: 10, y: 10.4, hidden: true },
      raio: { sprite: 'npc/raio', x: 9, y: 8, hidden: true },
      zapdos: { sprite: 'npc/zapdos', x: 9, y: 8, hidden: true },
      articuno: { sprite: 'npc/articuno', x: 11, y: 8, hidden: true },
      moltres: { sprite: 'npc/moltres', x: 7, y: 9, hidden: true },
      crobat: { sprite: 'dive/crobat', x: 11, y: 11, hidden: true }
    },
    steps: [
      // a câmera mostra a sala inteira acima da caixa de texto: as jaulas, a máquina e a passagem
      { do: 'camera', x: 8, y: 7.6, t: 0.6 },
      { do: 'say', lines: ['Um laboratório escondido. As máquinas zumbem, e uma luz roxa pulsa no meio da sala.'] },
      { do: 'walk', who: 'player', to: [[9, 6, 'up']] },
      { do: 'emote', who: 'player' },
      { do: 'say', lines: ['Presos em jaulas: a Lorelei, o Bruno, a Agatha e o Lance!'] },
      { do: 'face', who: 'lance', dir: 'left' },
      { do: 'say', name: 'Lance', lines: ['{player}?! Não chegue perto! É uma armadilha!'] },
      { do: 'face', who: 'player', dir: 'up' },
      { do: 'say', lines: ['No meio da sala, uma máquina como as dos pássaros. Presa nela, a criatura dos diários: o Mewtwo.'] },
      { do: 'face', who: 'agatha', dir: 'left' },
      { do: 'say', name: 'Agatha', lines: ['Hehe... Os meus fantasmas não mentem. Ele sofre há dias aí dentro.'] },
      // a emboscada: o homem de vermelho e os dois capangas de capuz, pela passagem
      { do: 'show', who: 'maxie' },
      { do: 'show', who: 'capanga1' },
      { do: 'show', who: 'capanga2' },
      { do: 'face', who: 'player', dir: 'right' },
      { do: 'emote', who: 'player' },
      { do: 'say', name: '???', lines: ['Muito bem. Mais um que veio sozinho.'] },
      { do: 'walk', who: 'maxie', to: [[11, 11]], speed: 0.16 },
      { do: 'walk', who: 'capanga1', to: [[12, 11]], speed: 0.16 },
      { do: 'say', name: 'Maxie', lines: ['Eu sou o Maxie. Você soltou os meus pássaros, um por um. Achou mesmo que eu não ia notar?'] },
      // o emblema do uniforme: o mesmo das máquinas (o pagamento de todos os rastros)
      { do: 'item', sprite: 'npc/emblema', at: [12.5, 3.2] },
      { do: 'emote', who: 'player' },
      { do: 'say', lines: ['O emblema no uniforme dele... O mesmo das máquinas!'] },
      { do: 'item', off: true },
      { do: 'say', name: 'Maxie', lines: ['As Poké Balls não abrem perto da minha máquina. Foi assim que eu peguei os quatro.'] },
      { do: 'walk', who: 'capanga1', to: [[11, 10, 'up']], speed: 0.16 },
      { do: 'walk', who: 'capanga2', to: [[12, 12, 'up']], speed: 0.16 },
      { do: 'say', name: 'Maxie', lines: ['Peguem a criança. Ela vai para uma jaula também.'] },
      // os três pássaros: o raio, o gelo e o fogo
      { do: 'show', who: 'raio' },
      { do: 'flash', t: 0.45 },
      { do: 'cry', dex: 145 },
      { do: 'shake', t: 0.5, power: 2 },
      { do: 'hide', who: 'raio' },
      { do: 'land', who: 'zapdos', t: 0.5, height: 120 },
      { do: 'say', lines: ['Um trovão rasga o teto!'] },
      { do: 'land', who: 'articuno', t: 0.6, height: 150 },
      { do: 'cry', dex: 144 },
      { do: 'show', who: 'gelo1' },
      { do: 'show', who: 'gelo2' },
      { do: 'say', lines: ['O gelo prende os capangas no chão!'] },
      { do: 'land', who: 'moltres', t: 0.6, height: 150 },
      { do: 'cry', dex: 146 },
      { do: 'show', who: 'fogo' },
      { do: 'say', lines: ['Uma parede de fogo entre o Maxie e {player}!'] },
      { do: 'say', lines: ['Os três pássaros voltaram. Dessa vez, para proteger {player}.'] },
      { do: 'emote', who: 'maxie' },
      { do: 'say', name: 'Maxie', lines: ['Os pássaros... vieram por você?!'] },
      { do: 'show', who: 'crobat' },
      { do: 'say', name: 'Maxie', lines: ['Isso não acabou, criança. A energia deles já está onde precisa estar.'] },
      // o Crobat agarra o Maxie e foge com ele pelo buraco do teto
      { do: 'hide', who: 'maxie' },
      { do: 'fly', who: 'crobat', t: 0.9, height: 220 },
      { do: 'hide', who: 'fogo' },
      // os pássaros destroem a máquina; o Mewtwo, livre, some num clarão
      { do: 'flash', t: 0.6 },
      { do: 'shake', t: 0.6, power: 3 },
      { do: 'flag', name: 'mansao_maquina' },
      { do: 'say', lines: ['Raio, gelo e fogo: a máquina explode!'] },
      // ele encara o jogador durante a fala, e o clarão vem depois dela
      { do: 'say', lines: ['O Mewtwo encara {player} por um instante... e some num clarão.'] },
      { do: 'flash', t: 0.5, power: 0.8 },
      { do: 'flag', name: 'mansao_mewtwo' },
      // sem a máquina, as jaulas abrem; os quatro saem (os capangas continuam presos no gelo)
      { do: 'flag', name: 'mansao_jaulas' },
      { do: 'walk', who: 'lorelei', to: [[2, 5, 'right']], speed: 0.16 },
      { do: 'walk', who: 'bruno', to: [[3, 5, 'right']], speed: 0.16 },
      { do: 'walk', who: 'agatha', to: [[10, 5, 'left']], speed: 0.16 },
      { do: 'walk', who: 'lance', to: [[11, 5, 'left']], speed: 0.16 },
      { do: 'face', who: 'player', dir: 'up' },
      { do: 'say', name: 'Lance', lines: ['A máquina caiu, e as jaulas abriram. Você nos salvou, {player}.'] },
      { do: 'say', name: 'Lorelei', lines: ['Viemos acabar com ele e caímos direto na armadilha. Que vergonha.'] },
      { do: 'say', name: 'Bruno', lines: ['Hmph! Toda a minha força, e eu não dobrei uma grade. Você tem coragem.'] },
      { do: 'say', name: 'Agatha', lines: ['Hehe... Os pássaros confiam em você. Isso diz muito, criança.'] },
      { do: 'say', name: 'Lance', lines: ['Vamos voltar para a Liga. Quando você chegar, estaremos esperando, e não vamos pegar leve.'] },
      // os três gritam e voam juntos pelo buraco do teto, sem medo
      { do: 'cry', dex: 145 },
      { do: 'fly', who: 'zapdos', t: 0.6, height: 220 },
      { do: 'fly', who: 'articuno', t: 0.6, height: 220 },
      { do: 'fly', who: 'moltres', t: 0.6, height: 220 },
      { do: 'toast', text: 'A Elite dos Quatro voltou para a Liga.', icon: 'stages' },
      // o atalho: de volta para a vila (o padrão das missões a pé)
      { do: 'end', then: 'home' }
    ]
  }
};

/** Os passos que o game/Cutscene.js conhece (o check-data confere). */
export const CUTSCENE_STEPS = ['wait', 'say', 'talk', 'show', 'hide', 'place', 'walk', 'face', 'emote', 'throw', 'cutin',
  'bird', 'fade', 'camera', 'shake', 'give', 'quest', 'emit', 'card', 'flag', 'cry', 'tremble', 'fly', 'toast', 'storm', 'item',
  'mist', 'land', 'flash', 'end'];

/** O que pode começar uma cena. */
export const CUTSCENE_TRIGGERS = ['enter', 'npc', 'starter', 'win', 'play', 'tile'];
