/**
 * AS FALAS DA VILA (PLANEJAMENTO-LOBBY.md, seção 9). Rascunho para o Fellipe
 * ajustar; a do pescador é dele.
 *
 * Cada chave é uma pessoa, uma placa ou um objeto (o `talk` de data/hub.js).
 *   name   o nome na plaquinha da caixa de texto (sem nome, só a caixa)
 *   lines  as falas possíveis; vale a PRIMEIRA cuja condição bate, então a
 *          mais específica vem antes e a geral (sem `when`) fecha a lista
 *
 * Cada fala:
 *   say    as páginas da caixa de texto, uma por item (cada uma cabe em duas linhas)
 *   when   a condição (todas as chaves precisam bater):
 *            starter   tem (true) ou não tem (false) o inicial
 *            starterIs o inicial escolhido é este
 *            shiny     o inicial veio shiny
 *            badges    tem pelo menos N insígnias
 *            champion  já venceu o Campeão
 *            dex       quantos Pokémon na Pokédex: [mínimo, máximo]
 *            veteran   já começou outra jornada antes desta
 *            dive      alguém da equipe sabe Dive (seção 8 do planejamento)
 *            diveTm    a TM Dive está na loja: alguém da jornada pode aprender (0.34)
 *            diveRescued  o pescador já o tirou da água desmaiado (a descida, 0.36)
 *            kyogre    o Kyogre já foi capturado nesta jornada (0.37)
 *            locked    a saída que este guarda está travada (a fala da trava)
 *            once      só uma vez por jornada: a chave fica guardada depois de mostrar
 *                      ({badges} vira o número de insígnias: uma vez por insígnia)
 *            quest     a quest com este id está ativa (data/quests.js, 0.38)
 *            questDone a quest com este id já fechou
 *
 * A conversa que chega ao fim conta para as quests ("Fale com a mãe"): o
 * objetivo `talk` olha a chave da fala (mae, carvalho_inicial...).
 *   then  o que acontece depois da última página: 'starter' (a escolha do
 *          inicial), 'pc', 'mart', 'pokedoll' (o catálogo do quarto), 'badges'
 *          (o Estojo de Insígnias), 'campaign' (o mapa)
 *   ask    uma pergunta de SIM/NÃO na última página: { yes: ação, no: [páginas] }
 *
 * No texto: {player} é o nome do treinador, {pokemon} o inicial, {leader} o
 * último líder vencido, {dex} quantos há na Pokédex e {item} o nome do enfeite.
 */
export const DIALOGUE = {
  /* ================================ a casa ================================ */
  mae: {
    name: 'Mãe',
    lines: [
      { when: { starter: false }, say: [
        'Bom dia! O Prof. Carvalho passou aqui cedinho te procurando.',
        'Disse que era importante. Ele está no laboratório, do outro lado da vila.'
      ] },
      { when: { starter: true, once: 'mae_inicial' }, say: [
        'Esse é o seu primeiro Pokémon? Que gracinha!',
        'Cuide bem do {pokemon}, viu?'
      ] },
      { when: { champion: true }, say: ['Campeão de Kanto... e ainda deixa a cama desarrumada!'] },
      { when: { badges: 1, once: 'mae_insignia_{badges}' }, say: [
        'Fiquei sabendo que você venceu {leader}! A vila inteira está falando nisso.'
      ] },
      { say: ['Cansado? Sua cama está lá em cima, arrumadinha.'] }
    ]
  },
  tv: {
    lines: [
      { say: [
        'Está passando um filme: quatro meninos andando pelos trilhos do trem.',
        '...Melhor ir andando também!'
      ] }
    ]
  },
  cama: {
    lines: [
      { say: ['Uma cama bem macia.'], ask: { text: 'Quer descansar e salvar o jogo?', yes: 'save', no: [] } }
    ]
  },
  calendario: {
    lines: [{ say: ['Um calendário. Hoje é um ótimo dia para começar uma jornada.'] }]
  },
  // o que a loja de Pokédolls vende para o quarto (data/decor.js)
  quarto_pc: {
    lines: [
      { when: { starter: false }, say: ['O seu PC. Ainda não há nenhum Pokémon guardado nele.'] },
      { say: ['Você liga o seu PC.'], then: 'pc' }
    ]
  },
  quarto_estante: {
    lines: [{ say: ['Na estante ficam o Estojo de Insígnias e os troféus da jornada.'], then: 'badges' }]
  },
  quarto_videogame: {
    lines: [{ say: ['Você joga um pouco de videogame...', 'Certo, hora de voltar para a jornada!'] }]
  },
  quarto_planta: { lines: [{ say: ['Uma planta bem cuidada.'] }] },
  quarto_boneco: { lines: [{ say: ['{item}. Fofo demais!'] }] },
  quarto_lapras: { lines: [{ say: ['O Lapras gigante: o troféu de quem venceu a Liga.'] }] },
  caixa_correio: {
    lines: [{ say: ['Casa de {player}.'] }]
  },

  /* ============================== o laboratório ============================== */
  carvalho: {
    name: 'Prof. Carvalho',
    lines: [
      // a mini-história, que termina com a escolha do inicial (seção 4)
      { when: { starter: false, veteran: true }, say: [
        'Ah, aí está você! Pronto para mais uma jornada, hein?',
        'As hordas continuam lá fora. Escolha o seu parceiro.'
      ], then: 'starter' },
      // o discurso do prólogo (0.38, PLANEJAMENTO-HISTORIA.md seção 8): o sonho e a missão
      { when: { starter: false }, say: [
        'Ah, aí está você, {player}! Entre, entre. Antes de tudo, precisamos conversar.',
        'Você quer ser o Campeão de Kanto, eu sei. E esse sonho continua possível.',
        'Mas preciso ser honesto: as rotas não são mais como antes. As hordas mudaram.',
        'Os Pokémon selvagens andam em bandos de dezenas e cercam qualquer treinador que passa.',
        'Isso não é natural. Um Pokémon não abandona a própria casa sem motivo... Alguma coisa aconteceu.',
        'Ser Campeão é um sonho bonito. Mas o ideal, de verdade, era resolver o problema das hordas.',
        'Fazer as rotas voltarem a ser o que eram: um lugar de paz, de encontros, e não de caos.',
        'Sozinho, eu não consigo. Mas um treinador que atravessa Kanto inteira... talvez consiga.',
        'Ninguém atravessa Kanto sozinho. Por isso quero que você leve um destes três.'
      ], then: 'starter' },
      { when: { champion: true }, say: [
        'Você fez o que poucos fizeram. Mas as hordas não acabaram.',
        'Ouvi falar de um mato sem fim, a oeste daqui...'
      ] },
      // depois do inicial: uma dica por insígnia (uma vez cada) e a avaliação da Pokédex
      { when: { badges: 8, once: 'carvalho_dica_8' }, say: ['Oito insígnias! A Liga Pokémon espera você. Leve uma equipe de tipos variados.'] },
      { when: { badges: 7, once: 'carvalho_dica_7' }, say: ['Falta só uma insígnia. Giovanni não perdoa erro: confira os tipos da sua equipe.'] },
      { when: { badges: 6, once: 'carvalho_dica_6' }, say: ['Pokémon guardados no PC não ganham nada. Faça rodízio para todos crescerem.'] },
      { when: { badges: 5, once: 'carvalho_dica_5' }, say: ['Lendários aparecem nas fases mais difíceis. Uma Poké Ball pode mudar a sua jornada.'] },
      { when: { badges: 4, once: 'carvalho_dica_4' }, say: ['Gastou seus Shards? O Poké Mart do Centro vende pedras e TMs para a sua equipe.'] },
      { when: { badges: 3, once: 'carvalho_dica_3' }, say: ['Cada golpe tem três melhorias que formam uma chave. Complete as três e veja o que acontece.'] },
      { when: { badges: 2, once: 'carvalho_dica_2' }, say: ['Quem descansa no banco recupera a vida. Troque quem está cansado antes de desmaiar.'] },
      { when: { badges: 1, once: 'carvalho_dica_1' }, say: ['Sua primeira insígnia! Agora capture mais Pokémon: uma equipe cheia aguenta muito mais.'] },
      { when: { dex: [151, 999] }, say: ['Você completou a Pokédex?! Isso é... incrível!'] },
      { when: { dex: [80, 150] }, say: ['{dex} Pokémon na Pokédex... Você está quase lá!'] },
      { when: { dex: [40, 79] }, say: ['{dex} Pokémon! Metade do caminho já ficou para trás.'] },
      { when: { dex: [10, 39] }, say: ['{dex} Pokémon! Está pegando o jeito.'] },
      { say: [
        'Ao sul, a Rota 1 e o resto de Kanto. A oeste, o mato que não tem fim...',
        'Esse eu não recomendo ainda! Só {dex} na Pokédex? Kanto é bem maior que isso.'
      ] }
    ]
  },
  // o fim da mini-história, depois da escolha (Game.chooseStarter)
  // junto com o inicial, o Mapa da Jornada (0.30, pedido do Fellipe: "leve aqui o
  // mapa, vai ser útil para você saber o caminho")
  carvalho_inicial: {
    name: 'Prof. Carvalho',
    lines: [
      { when: { shiny: true }, say: [
        '{pokemon}! Ótima escolha.',
        'Espere... a cor dele é diferente! Que sorte!',
        'Ah, e leve aqui este mapa. Vai ser útil para você saber o caminho.',
        '{player} recebeu o MAPA DA JORNADA!',
        'Nele estão as rotas de Kanto, fase por fase. Abra pelo botão lá em cima ou pela saída sul da vila.',
        'Seus Pokémon lutam por você; você só precisa saber onde pisar.',
        'E, {player}... se descobrir qualquer coisa sobre as hordas, volte e me conte. Boa sorte!'
      ] },
      { say: [
        '{pokemon}! Ótima escolha.',
        'Ah, e leve aqui este mapa. Vai ser útil para você saber o caminho.',
        '{player} recebeu o MAPA DA JORNADA!',
        'Nele estão as rotas de Kanto, fase por fase. Abra pelo botão lá em cima ou pela saída sul da vila.',
        'Seus Pokémon lutam por você; você só precisa saber onde pisar.',
        'E, {player}... se descobrir qualquer coisa sobre as hordas, volte e me conte. Boa sorte!'
      ] }
    ]
  },
  // quem desiste da escolha (o Voltar da tela de iniciais)
  carvalho_espera: {
    name: 'Prof. Carvalho',
    lines: [{ say: ['Pense com calma. As Poké Balls continuam aqui na mesa.'] }]
  },
  pokebolas: {
    lines: [
      { when: { starter: false }, say: ['Três Poké Balls na mesa do Professor. Melhor falar com ele primeiro.'] },
      { say: ['Os outros Pokémon do Professor. Eles vão esperar o próximo treinador.'] }
    ]
  },
  cientista: {
    name: 'Cientista',
    lines: [{ say: ['O Professor estuda as hordas há anos. Ninguém sabe ao certo por que elas começaram.'] }]
  },
  assistente: {
    name: 'Assistente',
    lines: [
      { when: { starter: false }, say: ['O Professor separou três Pokémon especialmente para você!'] },
      { say: ['Volte sempre! O Professor adora ouvir as histórias da jornada.'] }
    ]
  },
  lab_computador: {
    lines: [{ say: ['Um e-mail na tela: "A TODOS OS TREINADORES. As hordas cresceram de novo nas rotas de Kanto."'] }]
  },
  lab_quadro: {
    lines: [{ say: ['Um quadro cheio de anotações sobre o tamanho das hordas, rota por rota.'] }]
  },

  /* ============================= o Centro Pokémon ============================= */
  enfermeira: {
    name: 'Enfermeira',
    lines: [
      { when: { starter: false }, say: ['Ainda sem Pokémon? Volte quando tiver um parceiro. Vou guardar um espaço para ele!'] },
      { when: { once: 'enfermeira_cura' }, say: [
        'Bem-vindo ao Centro Pokémon!',
        'Curar? Seus Pokémon voltam inteiros de cada rota. Aqui eu cuido das caixas da sua equipe.'
      ], then: 'pc' },
      { say: ['Bem-vindo ao Centro Pokémon! Vou abrir o PC para você.'], then: 'pc' }
    ]
  },
  pc_maquina: {
    lines: [
      { when: { starter: false }, say: ['O PC do Centro. Ainda não há nenhum Pokémon seu guardado nele.'] },
      { say: ['Você liga o PC.'], then: 'pc' }
    ]
  },
  vendedor: {
    name: 'Vendedor',
    lines: [
      { when: { diveTm: true, once: 'vendedor_dive' }, say: [
        'Chegou uma TM diferente hoje. Dizem que ensina um Pokémon de Água a mergulhar bem fundo...'
      ], then: 'mart' },
      { say: ['Bem-vindo ao Poké Mart! Do que você precisa?'], then: 'mart' }
    ]
  },

  /* ============================ a loja de Pokédolls ============================ */
  vendedora: {
    name: 'Vendedora',
    lines: [{ say: ['Bem-vindo à Pokédoll! Um quarto sem bonecos é um quarto triste, sabia?'], then: 'pokedoll' }]
  },
  vitrine: {
    lines: [{ say: ['Bonecos de pelúcia, cada um com uma etiqueta de preço em Shards.'] }]
  },
  prateleira: {
    lines: [{ say: ['Plantas, tapetes e móveis para deixar o quarto do seu jeito.'] }]
  },
  lapras_gigante: {
    lines: [
      { when: { champion: false }, say: ['Um Lapras de pelúcia gigante. A plaquinha diz: "Só para o Campeão da Liga".'] },
      { say: ['O Lapras gigante. Agora você pode levá-lo!'] }
    ]
  },

  /* ================================ os moradores ================================ */
  moradora: {
    name: 'Moradora',
    lines: [
      { when: { champion: true }, say: ['Ele voltou! Disse que viu o Campeão passar correndo pela floresta. Era você?'] },
      { when: { badges: 1 }, say: ['Você passou pela floresta? Viu um menino de rede e boné por lá?'] },
      { say: ['Meu filho saiu em jornada no ano passado. Mandou uma carta da Floresta de Viridian e nunca mais escreveu...'] }
    ]
  },
  sabio: {
    name: 'Velho sábio',
    lines: [
      { when: { champion: true }, say: ['Você venceu a Liga. Mas me diga: já foi até o fim do mato a oeste? Ninguém nunca foi.'] },
      { when: { badges: 6 }, say: ['Existe um Pokémon criado pelo homem, escondido numa caverna perto de Cerulean. Nem as hordas chegam perto dele.'] },
      { when: { badges: 4 }, say: ['Na Floresta de Viridian, as árvores escondem mais olhos do que folhas. Nunca pare de andar lá dentro.'] },
      { when: { badges: 2 }, say: ['Dizem que as hordas começaram depois que três pássaros lendários sumiram dos céus de Kanto.', 'Gelo, trovão e fogo... onde estarão?'] },
      { say: ['Sente-se, jovem. Quando eu era criança, os Pokémon andavam sozinhos ou em pares.', 'Hoje andam em bandos de cem.'] }
    ]
  },
  sabio_vitrine: {
    lines: [{ say: ['Fósseis e pedras antigas, guardados com cuidado atrás do vidro.'] }]
  },
  pescador: {
    name: 'Pescador',
    lines: [
      { when: { kyogre: true }, say: ['Então era ISSO que vivia lá embaixo?! E eu jogando minhoca...'] },
      { when: { diveRescued: true, once: 'pescador_resgate' }, say: ['Ô, peixão! Quase arrebentou a minha linha. Da próxima vez, avisa antes de afundar!'] },
      { when: { dive: true }, say: ['Esse seu Pokémon... ele sabe mergulhar, não sabe? Vai lá e me conta o que tem no fundo!'] },
      { say: ['Às vezes fico imaginando o que tem lá embaixo... Se eu soubesse mergulhar, descobriria.'] }
    ]
  },
  lagoa: {
    lines: [
      // com Dive, a pergunta leva à descida (game/Dive.js, PLANEJAMENTO-DIVE.md)
      { when: { dive: true }, say: ['A água é escura e funda. Não dá para ver o fundo.'], ask: { text: 'Quer usar Dive?', yes: 'aquatic', no: [] } },
      { say: ['A água é escura e funda. Não dá para ver o fundo.'] }
    ]
  },
  rapaz: {
    name: 'Rapaz',
    lines: [
      { when: { locked: true }, say: ['Ei! Vai sair sem Pokémon? As hordas te pegam na primeira curva.', 'Passa no laboratório do Prof. Carvalho antes!'] },
      { say: ['Daqui para o sul, é Kanto inteira. Boa sorte!'] }
    ]
  },
  senhor: {
    name: 'Senhor',
    lines: [
      { when: { locked: true }, say: ['Opa, opa! Esse mato não acaba nunca, e os Pokémon de lá não dormem.', 'Sem um parceiro, nem pense nisso.'] },
      { say: ['Quer mesmo entrar? Lá ninguém fica mais forte... mas quem aguenta volta com os bolsos cheios de Shards.'] }
    ]
  },
  menina: {
    name: 'Menina',
    lines: [{ say: ['Sabia que o Clefairy dança quando a lua aparece? Eu fico acordada só para ver!'] }]
  },
  moca: {
    name: 'Moça',
    lines: [{ say: ['Já tenho três Pikachus de pelúcia. Falta um para completar a coleção!'] }]
  },
  meowth: { lines: [{ say: ['Miau! Meowth procura moedinhas no chão.'] }] },
  clefairy: { lines: [{ say: ['Clefairy dá uma voltinha e acena.'] }] },
  pidgey: { lines: [{ say: ['Prruu! Pidgey bate as asas.'] }] },

  /* ================================ as placas ================================ */
  placa_rota1: { lines: [{ say: ['ROTA 1 ao sul. Atenção: hordas de Pokémon selvagens.'] }] },
  placa_trilha: { lines: [{ say: ['TRILHA SEM FIM. Quem entra não volta igual.'] }] },
  placa_loja: { lines: [{ say: ['POKÉDOLL. Bonecos e móveis para o seu quarto.'] }] },

  /* ============================ as saídas em breve ============================ */
  endless_breve: {
    lines: [{ say: ['O mato fica cada vez mais alto e fechado...', 'A Trilha Sem Fim ainda não abriu. (O modo Endless chega em breve.)'] }]
  },

  /* ============================ a descida do Dive ============================ */
  // depois de perder as 3 bolhas: ele acorda no Centro, na frente da enfermeira (seção 7)
  enfermeira_resgate: {
    name: 'Enfermeira',
    lines: [{ say: [
      'Ah, você acordou! O pescador da lagoa trouxe você até aqui.',
      'Disse que fisgou você desmaiado lá no fundo... e que foi o maior peixe da vida dele.'
    ] }]
  },
};
