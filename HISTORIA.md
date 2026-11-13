# HISTÓRIA — Pokémon Bullet Heaven

> A história do jogo inteira, num lugar só: o que acontece, em que ordem e por quê.
> - **Este arquivo** é a história.
> - O [PLANEJAMENTO-HISTORIA.md](PLANEJAMENTO-HISTORIA.md) é como ela é construída (as etapas H-1 a H-12, as decisões técnicas e os números).
> - As falas exatas estão em `src/data/cutscenes.js` e `src/data/dialogue.js`.
>
> **Legenda:** ✅ no jogo (na branch; a H-12, as recompensas das quests, fechou a história de Kanto: sobe inteira) · 📝 proposta esperando aprovação ·
> 🗺️ planejado, sem proposta ainda · 💡 ideia em aberto.
>
> Atualizado em 2026-11-12.

---

## 1. Em uma frase

O jogador quer ser o Campeão de Kanto, mas as rotas estão tomadas por hordas de Pokémon
desorientados. Ao longo da jornada, ele descobre que os três pássaros lendários foram roubados
e presos em máquinas que sugam a energia deles. Ele liberta um por um, e no fim encontra o
ladrão: o **Maxie**.

---

## 2. O que só o autor sabe (a verdade por trás de tudo)

- **O ladrão é o Maxie**, líder de uma equipe de Hoenn. Ele roubou os três pássaros de Kanto
  (Zapdos, Articuno e Moltres) e prendeu cada um numa **máquina com um emblema vermelho**: um
  escudo com um pico escuro, que é o emblema do uniforme dele.
- **As máquinas sugam a energia dos pássaros** e a mandam em ondas, pelo céu e pelo mar, para o
  sul. A energia alimenta uma **máquina central** numa base do Maxie, fora de Kanto. É essa
  máquina que desorienta os Pokémon e faz as hordas: a causa de todo o caos. Ela é a ideia de
  **End Game**, depois de Kanto.
- **Por que os pássaros estão fracos:** presos há muito tempo, com a energia sendo sugada. É por
  isso que um treinador de meio de jornada consegue vencê-los.
- **Como as máquinas foram feitas e levadas:**
  - as peças vieram de roubos, como o da casa de Cerulean (motores, cabos, chapas de metal);
  - uma sombra de asas (o **Crobat** do Maxie) carregou a máquina pelo céu na noite do apagão;
  - capangas de capuz vermelho arrastaram as peças montanha acima.
- **O Kyogre era o próximo da lista.** Ele dorme no fundo da lagoa da vila. Depois de fugir dos
  pássaros na base, o Maxie volta atrás dele, mas chega tarde demais: o jogador já o capturou.
- **O Mewtwo:** o Maxie o capturou e o prendeu numa máquina na **base dele em Kanto**. A Elite dos
  Quatro descobre a ameaça, vai até a base para enfrentá-la e cai presa em jaulas. É lá que o
  jogador vê o Maxie pela primeira vez (seção 8.1).
- **O Mew** escapou do ladrão e aparece no epílogo.
- **A pista falsa:** todo mundo em Kanto culpa a Equipe Rocket. O Giovanni também não sabe quem
  é, e quer saber.

---

## 3. As regras da escrita

1. **O jogador descobre antes de entender.** Ninguém diz "Maxie" antes de ele aparecer. O que
   existe até lá são **rastros**:
   - as máquinas;
   - o emblema vermelho que ninguém reconhece;
   - a sombra de asas;
   - os capangas de capuz vermelho, vistos de longe ou contados por alguém.
2. **Sem spoiler em título** (regra do Fellipe). Nenhum nome de fase, quest, trava, card ou aviso
   revela uma descoberta antes da cena dela. A trava da Fase 4 fala do Túnel de Pedra no escuro,
   nunca do Zapdos; o nome do lendário só aparece quando o jogador o vê.
3. **As cenas são antes e depois das fases, nunca no meio** (regra do Fellipe). E sempre em tela
   cheia, num mapa do FireRed, com os personagens em pixel.
4. **Cada líder vê um pedaço do problema** na cidade dele e conta depois da vitória.
5. **As missões de lendário a pé** seguem o mapa original: o jogador só pisa onde o FireRed
   deixa. Elas têm Poké Balls no caminho de ida e, depois da cena final, o atalho de volta para a
   vila.

---

## 4. Os personagens

| Quem | Papel |
|---|---|
| **O jogador** | quer ser Campeão; aceita a missão de devolver a paz às rotas. |
| **A mãe** | o começo da jornada, no quarto. |
| **Prof. Carvalho** | dá a missão no prólogo: o sonho de Campeão continua possível, mas o ideal é resolver as hordas. "Volte e me conte." |
| **O rival** | o neto do Carvalho. O sonho sem a missão: quer as oito insígnias e acha bobagem se preocupar com as hordas. Pega o inicial com vantagem e é o Campeão no fim. |
| **O velho sábio** | a memória de Kanto. Foi o primeiro a notar que os pássaros sumiram dos céus. Comenta cada descoberta, uma vez. |
| **Os moradores da vila** | culpam a Equipe Rocket e comentam as notícias (a Usina acendeu, o mar descongelou). |
| **Os líderes** | Brock, Misty, Surge e Erika dão pistas; Koga e Sabrina são ginásios comuns; Blaine mede as ondas; Giovanni desmonta a pista falsa. |
| **O marinheiro de Vermilion** | preso em terra pelo mar agitado, escutou correntes dentro da Usina. |
| **Os pássaros lendários** | as vítimas. Presos, enfraquecidos e fora de si. Derrotados, fogem assustados ("fraco demais para confiar em alguém"). |
| **A Elite dos Quatro** | Lorelei, Bruno, Agatha e Lance. Juntam-se para derrotar uma ameaça maior, vão até a base do Maxie e caem presos em jaulas. Libertados pelo jogador, voltam para a Liga. |
| **O Maxie** | o ladrão. Aparece pela primeira vez na base dele, na emboscada (seção 8.1), e depois na lagoa, na cena do Kyogre. Usa o Crobat para voar. |
| **O Mew** | o Pokémon rosa do epílogo. Aparece de relance em algumas cenas antes (ideia). |

---

## 5. A história, capítulo por capítulo

### Prólogo — O sonho ✅
- O jogador acorda no quarto e a mãe manda ir ao laboratório.
- **O discurso do Carvalho:**
  - as hordas mudaram e os Pokémon andam em bandos de dezenas;
  - "Um Pokémon não abandona a própria casa sem motivo... Alguma coisa aconteceu";
  - ser Campeão é um sonho bonito, mas o ideal é fazer as rotas voltarem a ser um lugar de paz.
- **O jogador escolhe o inicial.** O rival chega atrasado e pega o que leva vantagem: "Hordas,
  hordas... Vô, eu quero é ser Campeão!"
- O Carvalho dá o Mapa da Jornada: "volte e me conte".

### Capítulo 1 — As rotas tomadas ✅
- **Depois do Brock (ginásio de Pewter):**
  - os Geodude desceram do Monte Lua, coisa que nunca fizeram;
  - "Isso é muito sério", e ele pede ajuda;
  - manda investigar Cerulean.
- **Na vila, o velho sábio** sai de casa para contar: os três pássaros lendários sumiram dos céus,
  e foi depois disso que as hordas começaram. "Deve ter alguma coisa a ver."

### Capítulo 2 — O céu vazio ✅
- **Depois da Misty:**
  - o mar ficou bravo desde que o Articuno deixou de ser visto sobre as Ilhas Seafoam (a primeira
    prova de que o sábio tem razão);
  - se os outros pássaros também sumiram, o Zapdos aparecia perto da Usina, e o Lt. Surge conhece
    o lugar.
- **A casa roubada de Cerulean:**
  - o policial culpa a Rocket;
  - o dono estranha que só levaram peças de máquina;
  - o rival passa correndo, a caminho de Vermilion.
- **Depois do Surge:**
  - a Usina apagou de uma noite para a outra;
  - os Voltorb e os Magnemite invadiram Vermilion;
  - ninguém vê o Zapdos desde aquela noite ("Com o Articuno, já são dois");
  - ouviram trovões lá dentro, como um combate;
  - o Túnel de Pedra, caminho para Celadon, está no escuro.
- **No cais:** o marinheiro escutou correntes pesadas dentro da Usina fechada.
- **A Usina, a pé:**
  - o labirinto do FireRed, com as paredes marcadas por raios;
  - lá embaixo, pela escotilha, dois olhos vermelhos no escuro;
  - **o Zapdos**, preso por correntes numa máquina que suga a energia dele.
- **A luta e a fuga:**
  - a tempestade marcada no chão;
  - derrotado, o Zapdos foge assustado;
  - na máquina destruída: a energia mandada para longe, em ondas ("Para onde?"), um emblema
    vermelho que o jogador nunca viu e a conclusão: "Alguém prendeu o Zapdos aqui de propósito";
  - a luz volta, e o Túnel de Pedra acende.

### Capítulo 3 — Os rastros ✅
- **Depois da Erika:**
  - na noite do apagão, caiu uma tempestade estranha sobre Celadon;
  - na lembrança, uma sombra enorme de asas cruza o céu carregando algo pesado;
  - de manhã, um pedaço de metal no jardim, com o emblema. O jogador reconhece: o mesmo da
    máquina da Usina;
  - a Rocket tem um esconderijo em Celadon, mas a sombra seguiu para o sul, rumo ao mar;
  - ela dá o **Pedaço de Metal** e aponta o Koga, também ao sul.
- **O Koga e a Sabrina** são ginásios comuns: a história dos lendários descansa.

### Capítulo 4 — As ondas ✅
- **Depois do Blaine:**
  - o quiz: "o que faz o mar congelar do lado de um vulcão?";
  - os instrumentos dele captam ondas estranhas que saem das Ilhas Seafoam e seguem para o sul;
  - o jogador lembra da máquina da Usina;
  - o mar em volta de Seafoam está congelando, e nenhum barco sai de Cinnabar (a Fase 8 fecha).
- **Seafoam, a pé:**
  - os cinco andares do FireRed, com 15 Poké Balls;
  - no fundo, a névoa se abre sobre uma máquina coberta de gelo: **o Articuno**, acorrentado.
- **A luta e a fuga:**
  - a névoa, o gelo no chão e o Frio Absoluto;
  - derrotado, o Articuno foge pela fenda do teto;
  - "Duas máquinas, dois pássaros. Alguém está juntando a energia deles. Para quê?";
  - o mar descongela, e o jogador volta direto para a vila;
  - o sábio: "E ainda falta um."

### Capítulo 5 — A suspeita ✅
(A proposta "Monte Brasa: o fogo", feita na H-8.)
- **Depois do Giovanni:**
  - o jogador mostra o Pedaço de Metal, achando que achou o culpado;
  - o Giovanni ri: "Isso não é da Rocket. O nosso emblema é um R." Ele também quer saber quem é;
  - os homens dele viram gente com o emblema subindo o Monte Brasa, na Ilha 1, com peças de
    máquina; o jogador lembra da casa de Cerulean;
  - a Liga fica fechada até o fim do capítulo.
- **O Monte Brasa, a pé:**
  - as pedras do caminho já foram arrastadas por quem subiu antes;
  - um Hiker viu sujeitos de capuz vermelho;
  - os recrutas da Rocket confirmam: "esses de vermelho não são dos nossos";
  - no cume, a terceira máquina, em brasa: **o Moltres**.
- **A luta e a fuga:**
  - o Sol forte, o chão em brasa, o Lança-chamas, o Redemoinho de Fogo e o Fogo Sagrado, em que
    só a sombra das rochas protege;
  - derrotado, o Moltres foge para o céu;
  - "Três máquinas, três pássaros. Para onde foi toda essa energia?";
  - de perto, o pico escuro do emblema **lembra um vulcão**;
  - a Liga reabre a Victory Road.

### Capítulo 6 — A Elite dos Quatro ✅
(O ajuste do Fellipe de 2026-11-12, seção 8.1, e a proposta "A base na Mansão", feita na H-9.)
- A Victory Road se abre com os três pássaros livres.
- **Ao começar a Victory Road**, a cena: a Elite dos Quatro se juntou para derrotar uma ameaça
  maior e foi até a base. A quest: "Ajude a Elite dos Quatro". A Liga fica fechada.
- **A base do Maxie** (proposta: a Mansão Pokémon, em Cinnabar, onde o Mewtwo nasceu): o Blaine na
  porta, os quatro andares com os interruptores e os diários, e no subsolo o Mewtwo preso numa
  máquina e os quatro em jaulas.
- **A emboscada:**
  - o Maxie aparece pela primeira vez e surpreende o jogador;
  - o emblema do uniforme dele é o mesmo das máquinas, e é aqui que o jogador entende;
  - o jogador, vulnerável (as Poké Balls não abrem perto da máquina), vai ser capturado;
  - os três pássaros chegam para protegê-lo, e o Maxie foge.
- A Elite dos Quatro é libertada, e as fases da Liga abrem.
(aqui não tem combate para liberar o mewtwo, ele é liberto em uma cena, e nessa mesma cena ao liberar os treinadores da E4 eles agradecem e falam que vão para a E4 para o jogador poder desafiar)
### Capítulo 7 — O sonho ✅
(A proposta "O sonho da Liga", feita na H-10.)
- A Liga: Lorelei, Bruno, Agatha e Lance, agora conhecidos. Depois de cada vitória, duas falas que
  lembram a Mansão.
- **O rival como Campeão**: ele venceu os quatro antes do jogador, aproveitando que o jogador os
  trouxe de volta. Vencido (depois do Hall da Fama), admite: "Você estava certo. Eu só olhava para as
  insígnias."
- **Depois, o Carvalho**: as rotas estão mais calmas, mas não como antes. "Ainda falta alguma coisa."
- **O Mew**, no laboratório, por telepatia (só o jogador entende): escapou do Maxie; as hordas
  continuam porque o Maxie rouba a energia de lendários em outras regiões; o próximo da lista dorme
  no fundo da lagoa.
- **Os lendários confiam no jogador** (o Carvalho). A captura deles já abriu na Mansão (decisão
  25). A TM Dive chega ao Poké Mart.

-Mew aparece quando o jogador é campeão volta para vila e fala com o carvalho, Mew faz telepatia com o jogador, por isso  o jogador entende, Ele explica que conseguiu fugir do Maxie, e que as hordas ainda estão estranhas pois ele anda roubando energia de lendários em outras regiões também

### Capítulo 8 — O que a lagoa guarda ✅
(Feito na H-11.)
- A quest "Descubra o que a lagoa guarda", pelo aviso do Mew. O pescador conta que a lagoa anda
  borbulhando e que o Poké Mart tem uma TM de mergulho. O jogador desce com o Dive e captura **o
  Kyogre** no fundo (a descida e a luta existem desde a 0.36 e a 0.37).
- **A cena do Maxie na lagoa**, agora o segundo encontro:
  - "Você de novo?! Não acredito que cheguei tarde! Você capturou o lendário Kyogre!";
  - o Crobat, e "A caminho do vulcão! O próximo lendário será meu!".
- É a ponte para Hoenn (o Monte Chimney).
- Na vila, o sábio: "Kanto está em paz. Mas as hordas não vão sumir enquanto ele estiver por aí."
- **O fim** (a lapidação): logo depois do Maxie, a tela escurece, toca o tema de Pallet e sobe o card
  "Fim da história de Kanto": "Os pássaros voltaram aos céus, todos os lendários liberados. Mas Maxie
  partiu para o Vulcão, as hordas continuam por onde ele passou!" E o anúncio: "A história continua em
  Pokémon Bullet Heaven 2."

## 6. As pistas e onde elas se pagam

| Pista | Onde aparece | Onde se paga |
|---|---|---|
| Os pássaros sumiram dos céus | o velho sábio (Cap. 1) | as três missões |
| As peças de máquina roubadas | a casa de Cerulean (Cap. 2) | as máquinas; o Giovanni no Cap. 5 liga as duas coisas |
| O emblema vermelho | a máquina da Usina (Cap. 2), o pedaço de metal da Erika (Cap. 3), as outras máquinas | o uniforme do Maxie, na base (Cap. 6) |
| A energia mandada em ondas | a Usina (Cap. 2), os instrumentos do Blaine (Cap. 4) | a máquina central (End Game) |
| A sombra de asas | a lembrança da Erika (Cap. 3) | o Crobat do Maxie, na emboscada e na lagoa |
| O capuz vermelho | o Hiker e os recrutas no Monte Brasa (Cap. 5) | os capangas do Maxie |
| "Ainda falta um" | o sábio (Cap. 4) | o Moltres (Cap. 5) |
| O emblema que lembra um vulcão | a máquina do Moltres (Cap. 5) | "A caminho do vulcão!" (Cap. 8) |
| "Fraco demais para confiar em alguém" | a fuga de cada pássaro | a base (Cap. 6): eles voltam para proteger o jogador |
| A Equipe Rocket (pista falsa) | a vila, o policial, a Erika | o Giovanni ri (Cap. 5) |

---

## 7. Os pássaros lendários

| Pássaro | Onde está preso | O desafio da luta | Como termina |
|---|---|---|---|
| **Zapdos** ✅ | o fundo da Usina (Cap. 2), nível 36 | a tempestade marcada no chão e o tabuleiro de raios | foge assustado pelo alto; a luz da Usina volta |
| **Articuno** ✅ | o fundo das Ilhas Seafoam (Cap. 4), nível 57 | a névoa, o gelo no chão e o Frio Absoluto com o olho da nevasca | foge pela fenda do teto; o mar descongela |
| **Moltres** ✅ | o cume do Monte Brasa (Cap. 5), nível 62 | o Sol forte, o chão em brasa e o Fogo Sagrado com a sombra das rochas | foge para o céu; a Victory Road abre |

- **Eles não ficam com o jogador.** Derrotados nas missões, fogem com medo.
- **A captura deles abre com a cena que salva a Elite dos Quatro** (decisão 25, o Fellipe em
  2026-11-12: "capturas de lendários liberam depois da cena que salva a E4"). Antes dela, fechada
  (decisão 20): nenhum lendário aparece na Poké Ball das fases. Depois, os pássaros (desde a Fase
  7), o Mewtwo e o Mew (na Liga) podem aparecer, um de cada.
  - O Kyogre é à parte: ele é capturado na luta do salão, no fundo da lagoa.
  - Enquanto a captura estiver fechada, a Pokédex chega no máximo a 146 de 151; depois, a 151.

---

## 8. Ideias em aberto

### 8.1 A base do Maxie: a Elite dos Quatro, o Mewtwo e a emboscada (o Fellipe, 2026-11-12) ✅
(Construída na H-9: a Mansão Pokémon, o Capítulo 6. O texto abaixo é o registro da ideia.)

> "O Mewtwo não está na caverna, vai estar na base do Maxie, em algum lugar que vamos pensar que
> dá para usar como base do FireRed. Ao jogador iniciar a jornada da Victory Road, uma cena entra
> falando que os treinadores da E4 se juntaram para derrotar uma ameaça maior; eles se
> direcionaram para a base. O jogador então recebe a missão 'Ajude a E4' e vai até a base. Lá ele
> encontra o Mewtwo preso na máquina e os 4 treinadores em jaulas também, e aí então começa a cena
> em que ele é surpreendido pelo Maxie, vai ser capturado, e então os pássaros chegam. Só depois
> de concluir isso libera a E4 para o jogador."

E antes, sobre o momento: "vai ser antes da lagoa".

**A sequência:**
1. Com os três pássaros livres, a Victory Road se abre, e o jogador parte para a Liga.
2. **Ao começar a Victory Road**, uma cena: a Elite dos Quatro não está na Liga. Os quatro se
   juntaram para derrotar uma ameaça maior e foram até a base. A quest: **"Ajude a Elite dos
   Quatro"**. A Liga fica fechada até lá.
3. **Na base**, o jogador encontra o **Mewtwo preso numa máquina**, como os pássaros, e a **Lorelei,
   o Bruno, a Agatha e o Lance presos em jaulas**.
4. **A emboscada:** o Maxie aparece pela primeira vez e surpreende o jogador. O jogador está
   vulnerável, prestes a ser capturado.
5. **Os três pássaros lendários chegam** para proteger o jogador. Diante dos três, o Maxie foge: é o
   que ele pode fazer.
6. **Só depois** a Elite dos Quatro é libertada, e as fases da Liga abrem para o jogador.

**Por que encaixa no que já existe:**
- Em cada fuga, o pássaro estava "fraco demais para confiar em alguém". A volta dos três para
  proteger o jogador é o pagamento desse arco: é quando eles passam a confiar nele.
- **A primeira aparição do Maxie** é aqui, antes da lagoa. É na base que o emblema das máquinas
  aparece no uniforme dele: o pagamento de todos os rastros. A regra da escrita passa a ser
  "ninguém diz Maxie antes da base".
- **A cena do Kyogre vira o segundo encontro.** As falas dela ("Não acredito que cheguei tarde!
  Você capturou o lendário Kyogre!") continuam funcionando: ele fugiu dos pássaros e foi atrás do
  próximo da lista.
- **A Elite dos Quatro ganha personalidade:** em vez de quatro salas esperando o jogador, quatro
  treinadores que tentaram resolver o problema sozinhos e caíram na armadilha. Na Liga, depois, a
  luta contra cada um tem outro peso.
- A decisão 6 (o ladrão tentou levar o Mewtwo e falhou) muda: ele conseguiu, e o Mewtwo está preso
  na base.

**Onde fica a base** (a pensar; mapas do FireRed que servem):
- **A Mansão Pokémon, em Cinnabar** (recomendada). O laboratório queimado onde o Mewtwo foi criado
  (os diários do FireRed contam isso). O Maxie montou a base no lugar onde o Mewtwo nasceu,
  abandonado e longe de todo mundo. Fica no sul, para onde iam as ondas. São quatro andares (1F,
  2F, 3F e B1F), e o B1F é o laboratório.
- **O Armazém da Ilha 5** (Five Island). Um armazém industrial, cheio de máquinas e caixas, com cara
  de base. No FireRed ele é da Rocket, o que pode confundir quem conhece o jogo.
- **O Laboratório Pokémon de Cinnabar.** Salas pequenas de pesquisa, onde o Blaine trabalha; seria
  uma base escondida debaixo do nariz de todo mundo.

**Ainda em aberto:**
- **Onde fica a base** (as opções acima).
- **Há luta?** Contra o Mewtwo, como os pássaros? Contra os capangas de capuz vermelho? Ou só a
  cena?
- **O que deixa o jogador vulnerável:** a equipe desmaiada? Os capangas cercando? O Crobat?
- **O que acontece com o Mewtwo:** livre, foge, fica?
- **Os pássaros entram na equipe nessa hora?** Seria uma forma natural de abrir a captura fechada
  pela decisão 20 (uma sugestão, não decidido).
- **A lagoa** (padrão até você decidir): abre depois do Campeão, como no plano; o Maxie já foi
  visto na base.

### 8.2 A máquina central do Maxie 🗺️
A energia dos três pássaros alimenta uma máquina numa base do Maxie, e é ela que desorienta os
Pokémon. É a ideia de End Game, depois de Kanto. Até lá, o jogador só pergunta "para onde?".

### 8.3 Depois de Kanto: o Pokémon Bullet Heaven 2 🗺️
O Maxie parte "a caminho do vulcão", que é o Monte Chimney, em Hoenn. **A história deste jogo
termina aí** (o Fellipe, 2026-11-12): o vulcão fica em outra geração e vira o **Pokémon Bullet
Heaven 2**. As hordas existem em toda região por onde ele passou, por isso o problema não acaba
em Kanto; a máquina central do Maxie (8.2) é a candidata natural para o 2.

### 8.4 Guardado, por enquanto
Saíram por enquanto, e podem voltar:
- o vulto de capuz vermelho na Rota 10;
- a visão da Sabrina ("três jaulas e um homem olhando para o mar");
- a pena dourada da Usina;
- a cena do Carvalho estudando o emblema.
