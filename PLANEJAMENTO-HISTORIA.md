# PLANEJAMENTO — A história e as quests

> Ideia do Fellipe (2026-11-10): o jogo ganha uma **história própria**, correndo
> junto da jornada de ginásio em ginásio, como no Pokémon Tower Defense. O
> jogador quer ser o Campeão de Kanto, mas o Prof. Carvalho conta que as hordas
> mudaram e que o ideal seria **devolver a paz às rotas**. A causa: os **pássaros
> lendários sumiram dos céus de Kanto**, porque alguém os roubou. Esse alguém é o
> **Maxie**, que só aparece quando o jogador captura o Kyogre. A história é
> **recuperar os lendários**, cada um com a sua fase. Quem guia o jogador é um
> sistema novo, o das **quests**, no canto superior da tela.
>
> **Status:** o Fellipe aprovou o plano inteiro em 2026-11-10 ("aceito todas suas
> ideias"): todo "**padrão**" deste texto virou decisão (seção 12). Ele também
> acrescentou uma regra para a captura dos lendários (seção 6). **A H-1 está no
> jogo desde a 0.38**: as quests, o rastreador e o prólogo, do quarto ao Brock. **Da H-2
> à H-7, prontas na branch (0.39)**, sem push até a H-12; a última foi a missão do
> Articuno e o Capítulo 4 (seção 5.2), em 2026-11-12.
>
> **A história inteira, em texto corrido** (o que acontece e por quê, capítulo por capítulo, as
> pistas e as ideias em aberto), está no [HISTORIA.md](HISTORIA.md). Este arquivo é como ela
> é construída.
>
> **Referência:** o Pokémon Tower Defense (Sam e Dan) segue a jornada que todo
> mundo conhece (Pallet, o Carvalho, os 8 ginásios, a Liga), mas cada fase é
> também um capítulo de uma história própria, com um vilão que explica por que o
> mundo está estranho. Trazemos a **estrutura**, não o enredo nem os personagens dele.

---

## 1. O pedido, nas palavras do Fellipe

- "Vamos manter as conquistas, mas vamos ter um novo sistema no jogo, **as quests**.
  Elas dão recompensas que vamos bolar só lá no final."
- "Temos a proposta do personagem: se tornar campeão de Kanto. Ao ir pegar o
  inicial, um **diálogo importante com o Carvalho**, dizendo que as hordas mudaram.
  O sonho de ser campeão ainda é possível, mas o ideal era resolver o problema com
  as hordas e fazer as rotas serem o que eram antes, algo pacífico e menos caótico.
  Esse é o enredo da história."
- "Ao iniciar o jogo, a primeira quest, sem recompensa mesmo, só um guia da
  história, que vai ficar no **canto superior da tela**: 'fale com a mãe 0/1'. Isso
  vai rolar até a ida ao Professor Carvalho. Novas quests vão ser passadas ao
  decorrer do jogo."
- "Vamos trabalhar bastante com **cutscenes**."
- "As hordas mudaram depois que os pássaros lendários sumiram dos céus de Kanto.
  Alguém roubou. Esse alguém é o Maxie, que só vai ser introduzido quando o jogador
  pegar o Kyogre. Ele está roubando todos os lendários."
- "Jogadores **não podem pegar lendários casualmente** agora. Vamos fazer missões
  de encontro com lendários, igual é com o Kyogre: **cada lendário vai ter sua
  fase**. A ideia vai ser recuperar os lendários. Essa é a base da história."
- Antes, na mesma conversa: a fase do Kyogre é **late game**, e cada geração terá
  a **sua vila**, com as fases nos mapas da região dela.

---

## 2. A premissa

Dois objetivos andam juntos a jornada inteira:

| | O que é | Quem conta |
|---|---|---|
| **O sonho** | as 8 insígnias, a Liga e o Campeão | a campanha que já existe |
| **A missão** | descobrir por que as hordas mudaram e devolver a paz às rotas | as quests e as cenas (novo) |

**A verdade, revelada aos poucos:** os três pássaros lendários (Articuno, Zapdos e
Moltres) sumiram dos céus de Kanto porque alguém os roubou. Sem eles, os Pokémon
perderam o rumo, abandonaram as suas casas e passaram a andar em hordas. Cada
pássaro recuperado acalma um pedaço de Kanto. O ladrão é o **Maxie**, que
aparece na cena do Kyogre: ele chegou tarde, porque o Kyogre era o próximo da lista.

**As máquinas que sugam a energia** (refino do Fellipe, depois da luta do Zapdos): as
máquinas que prendem os lendários **sugam a energia deles**, canalizam e mandam em ondas
para um lugar que o jogador ainda não conhece. Lá, numa base do Maxie (não
necessariamente em Kanto), essa energia alimenta uma **máquina central**, e é ela que
desorienta os Pokémon: a causa de toda a confusão das hordas. É a ideia de um **End Game**
no futuro. Ela também explica por que um jogador de nível baixo vence um lendário: preso
há muito tempo, com a energia sendo sugada, ele está **enfraquecido**.

**Sem spoiler em título** (o Fellipe, 2026-11-11: "a descoberta do Zapdos só acontece na
Usina; não pode ter spoilers no título das fases ou quests"): nenhum nome de fase, quest,
trava, card ou aviso revela uma descoberta antes da cena dela. A trava da Fase 4, por
exemplo, fala do Túnel de Pedra no escuro e da Usina, nunca do Zapdos.

**A regra da escrita:** o jogador descobre antes de entender. Ninguém diz "Maxie"
antes da base dele, na emboscada (decisões 21 e 22; até então era a cena do Kyogre). O que aparece são **rastros**: as máquinas vazias, um
vulto de capuz vermelho visto de longe e um **emblema vermelho** que ninguém
reconhece. Na base, o emblema está no uniforme dele. Esse é o pagamento.

**A pista falsa:** a vila inteira culpa a Equipe Rocket. O jogador chega ao
Giovanni (Fase 8) achando que encontrou o culpado, e o Giovanni ri: o emblema não
é da Rocket, e ele também quer saber quem é.

---

## 3. Os personagens

| Quem | Papel na história |
|---|---|
| **Prof. Carvalho** | dá a missão; o jogador volta a ele depois de cada descoberta. Guarda o emblema e estuda as máquinas. |
| **Mãe** | o começo de tudo; comenta a jornada (já faz). |
| **Velho sábio** | a memória de Kanto: conta a lenda dos três pássaros (a fala já existe; ela passa para logo depois do Brock). |
| **Os líderes** | cada um vê um pedaço do problema na sua cidade. Hoje só falam antes da luta; ganham uma **fala de depois da vitória**, que é a pista do capítulo. |
| **O rival** | o sonho sem a missão: quer ser Campeão e acha bobagem se preocupar com as hordas. Poucas cenas, e é o Campeão (padrão; decisão 1). |
| **O vulto de vermelho** | os capangas do ladrão, vistos de longe, sem nome (os sprites de capanga da Magma estão no decomp do FireRed). |
| **Maxie** | o ladrão. Só na cena do Kyogre, que já existe. |
| **O Pokémon rosa** (ideia) | o **Mew**, que escapou do ladrão. Ele aparece de relance, por um segundo, no fundo de algumas cenas, sem explicação. No fim de Kanto, vem até o jogador (decisão 5). |

---

## 4. A linha da história em Kanto

Cada capítulo cobre uma ou duas fases da campanha de hoje. O que o jogador
descobre chega sempre **antes ou depois das fases, nunca no meio delas**, e sempre
numa **cena em tela cheia**, num cenário do FireRed, com os personagens em pixel
(decisões 11 e 12, seção 9.2): o líder no ginásio dele depois da vitória, a vila
quando o jogador volta, ou o lugar da fase antes dela.

| Capítulo | Quando | O que o jogador descobre | Missão de lendário |
|---|---|---|---|
| **Prólogo — O sonho** | na vila, antes da Fase 1 | O Carvalho: as hordas mudaram, ninguém sabe por quê. O sonho de ser Campeão continua possível, mas o ideal é devolver a paz às rotas. | — |
| **1 — As rotas tomadas** | Fase 1 (Brock) | **Feito na 0.39** (pedido do Fellipe). Depois da vitória, no ginásio de Pewter, em tela cheia: o Brock parabeniza o jogador por ter vencido, conta que os Pokémon estão agindo de um jeito que ninguém viu (os Geodude desceram do Monte Lua), diz que é muito sério e pede ajuda para entender o que está acontecendo. Manda investigar a cidade de Cerulean. É a apresentação do problema; o Maxie não aparece, e não há corte de tela. Abre a quest **"Derrote a Misty e encontre pistas sobre o comportamento dos Pokémon"** (o mapa segue para o ginásio dela). Logo depois, de volta à vila: o **velho sábio** sai de casa, vê o jogador (o "!"), vem até ele e conta que soube do pedido do Brock, que os pássaros lendários sumiram dos céus e que foi depois disso que tudo começou ("deve ter alguma coisa a ver"), mas que é tudo o que ele pode ajudar por enquanto. Ele volta para casa, e o jogador fica livre. | — |
| **2 — O céu vazio** | Fases 2 e 3 (Misty, Surge) | **A parte da Misty está feita na 0.39** (proposta "Cerulean: o mar bravo", aprovada inteira pelo Fellipe). Depois da Fase 2, duas cenas: no ginásio, a Misty conta que o mar ficou bravo desde que o Articuno deixou de ser visto sobre as Ilhas Seafoam (a primeira prova de que o sábio tem razão) e aponta o Surge e a Usina, onde o Zapdos aparecia; na rua de Cerulean, a casa assaltada do FireRed: o policial culpa a Equipe Rocket (a pista falsa) e o dono estranha que só levaram peças de máquina (as máquinas dos pássaros, no Capítulo 4); o rival passa correndo, a caminho de Vermilion. Na vila, os moradores culpam a Rocket, e só o velho sábio estranha o ladrão. **A parte do Surge também, na 0.39** (proposta "Vermilion: a Usina apagou", versão 2, com as mudanças do Fellipe: nada chega de barco, ninguém viu clarão). No ginásio, o Surge conta que a Usina apagou, que os Voltorb e os Magnemite invadiram Vermilion e que ninguém vê o Zapdos ("com o Articuno, já são dois"); naquela noite, pareceu haver um combate dentro da Usina, como se o Zapdos estivesse brigando. No cais, um marinheiro, preso em terra pelo mar agitado (o mesmo da Misty), conta que trabalhando pela Rota 10 escutou correntes dentro da Usina fechada: abre a quest paralela **"Investigue a Usina"**, e o "Investigar" (pela marca da Usina no mapa) leva o jogador para dentro da **Usina andável**: ele explora o labirinto do FireRed, pega Poké Balls com Reviver e Novo Sorteio e acha a escotilha da sala do gerador; lá embaixo, no escuro, dois olhos vermelhos e o card **"Derrote e liberte o Zapdos"** (seção 5). | **Zapdos** (a missão na Usina, seção 5.1) |
| **3 — Os rastros** | Fases 4 a 6 (Erika, Koga, Sabrina) | **Feito na 0.39** (a proposta "Celadon: o emblema", com as decisões do Fellipe, decisão 18, aprovada: "ficou excelente"). A Fase 4 só abre com o Zapdos libertado: o Túnel de Pedra, na Rota 10, está no escuro desde o apagão, e acende quando a luz volta à Usina (padrão). A trava não cita o Zapdos: "O Túnel de Pedra está no escuro desde que a Usina apagou. Ninguém passa." A Fase 4 é a batalha da Erika de sempre. Depois dela, no ginásio, **a cena do emblema** (montada como maquete na página da proposta): a Erika conta da tempestade da noite do apagão e, na lembrança, **uma sombra enorme de asas** cruzando o céu carregando algo pesado (o Crobat do Maxie, sem nome); de manhã, o pedaço de metal no jardim. O jogador reconhece: **é o mesmo emblema da máquina que prendia o Zapdos**. A Erika lembra o esconderijo da Rocket embaixo do Cassino (a pista falsa continua), mas a sombra **seguiu para o sul, rumo ao mar**; ela entrega o Pedaço de Metal e aponta o Koga, também ao sul. **Depois disso, a história dos lendários descansa**: o Koga e a Sabrina são ginásios comuns, só com a quest de cada um (padrão). Saem por enquanto a pena dourada, o vulto de capuz vermelho na Rota 10 e a visão da Sabrina. | — |
| ~~O trovão preso~~ | — | **Saiu** (decisão 19): a Sabrina ficou no Capítulo 3, como ginásio comum (decisão 18), e os capítulos seguintes desceram um número. A ideia de antes (a visão da Sabrina) fica guardada. | — |
| **4 — As ondas** | Fase 7 (Blaine) | **Feito na 0.39 (H-7)**, a proposta "Seafoam: as ondas", aprovada ("pode seguir com o que fez"; seção 5.2). Depois do Blaine, no ginásio dele, os instrumentos do Laboratório Pokémon medem ondas estranhas saindo das Ilhas Seafoam rumo ao sul, e o jogador liga às ondas da máquina da Usina; o mar em volta de Seafoam está congelando, e nenhum barco sai de Cinnabar (a trava da Fase 8). O jogador desce a pé os cinco andares do FireRed até o fundo e acha o Articuno preso numa máquina coberta de gelo; vence a luta, ele foge pela fenda do teto, e na máquina quebrada: "Duas máquinas, dois pássaros". O mar descongela, e a Fase 8 abre. | **Articuno** |
| **5 — A suspeita** | Fase 8 (Giovanni) | **Feito na 0.39 (H-8)**, a proposta "Monte Brasa: o fogo", aprovada ("construa a h-8 então"; seção 5.3). O jogador chega achando que é a Rocket. O Giovanni olha o Pedaço de Metal e ri: não é da Rocket, e ele também quer saber quem é. Os homens dele viram gente com o emblema subindo o Monte Brasa, na Ilha 1, com peças de máquina (as da casa de Cerulean). A Liga fica fechada até o Moltres (decisão 2). O jogador sobe a pé até o cume e acha o Moltres preso na terceira máquina, em brasa. (No jogo, o título é só "A suspeita": "o fogo" adiantaria o Moltres, sem spoiler em título.) | **Moltres** |
| **6 — A Elite dos Quatro** | o começo da Victory Road | **Ajuste de 2026-11-12** (decisão 22; HISTORIA.md, seção 8.1). A Victory Road só abre com os três pássaros de volta (decisão 2). Ao começar por ela, uma cena: a Elite dos Quatro se juntou para derrotar uma ameaça maior e foi até a base do Maxie (o lugar a pensar). A quest "Ajude a Elite dos Quatro". Na base, o Mewtwo preso numa máquina e os quatro em jaulas; a emboscada: o Maxie aparece pela primeira vez, o jogador vai ser capturado, os três pássaros chegam e o Maxie foge. Só então a Liga abre. | **Mewtwo** |
| **7 — O sonho** | Liga e Campeão | A Elite dos Quatro, libertada, de volta à Liga. O rival no fim, e o Hall da Fama. Depois, o Carvalho: as rotas estão mais calmas, mas não como antes: "ainda falta alguma coisa". | — |
| **8 — O que a lagoa guarda** | late game, depois do Campeão | O pescador fala da lagoa: a descida, o Kyogre e o **Maxie** (a cena que já existe), agora o segundo encontro. "A caminho do vulcão!" leva a Hoenn. | **Kyogre** |
| **Epílogo — O Pokémon rosa** (ideia) | depois do Maxie | O Mew aparece na vila. | **Mew** (decisão 5) |

**Recuperar um pássaro** acalma as rotas perto do ninho dele, mas só na história:
os moradores e os líderes comentam, e as fases continuam com as hordas de sempre,
porque o jogo precisa delas (padrão; decisão 7). As hordas diminuem, mas **não
acabam em Kanto**: o Maxie passou por outras regiões, e esse é o gancho das
próximas vilas (seção 10).

---

## 5. Os lendários: cada um tem a sua fase

O molde é o salão do Kyogre (HANDOFF, seção 4), e cada missão segue os mesmos
passos:

1. **O encontro**: o jogador anda no mapa do FireRed, só nos tiles navegáveis
   (colisão 0), até o lendário. Nos pássaros, ele está **preso numa máquina** com o
   emblema vermelho. O jogador desliga a máquina, e o pássaro acorda furioso e
   confuso.
2. **A transição de batalha**, e então **a luta**: um Bullet Heaven com o kit do
   lendário (o golpe exclusivo, que já existe) e um **desafio próprio** de cada um.
3. **A captura**, quando a missão tem: 3 bolas especiais por luta (a Dive Ball do
   Kyogre). A vida não cai abaixo de 15% enquanto houver bola, e na falha ela volta a
   25%. **Os pássaros não são capturados na missão** (refino do Fellipe, decisão 16):
   enfraquecidos e assustados, eles fogem na cena de depois, e a captura fica para
   outro momento.
4. **A recuperação**: o lendário vai para o PC, como o Kyogre (decisão 3), e uma
   cena fecha o capítulo.

| Lendário | Onde (mapa do FireRed) | Abre quando | Nível recomendado (padrão) | O desafio próprio (ideia) |
|---|---|---|---|---|
| **Zapdos** | o fundo da Usina (`PowerPlant`), pela escotilha da sala do gerador | o card aparece depois da Fase 3 (a Usina andável) | 36 (enfraquecido pela máquina) | Tempestade: raios marcados no chão antes de cair |
| **Articuno** | Ilhas Seafoam, o fundo (`SeafoamIslands_B4F`), a pé pelos cinco andares | depois do Blaine | 57 (enfraquecido; feito na 0.39) | A nevasca: a névoa que esconde a horda e o gelo no chão que desacelera; o Frio Absoluto com o olho da nevasca |
| **Moltres** | o cume do Monte Brasa, na Ilha 1 (`MtEmber_Summit`), a pé pela encosta e pelo caminho do cume | depois do Giovanni | 62 (enfraquecido; proposta) | O Sol forte (Fogo ×1,5 e Água ×0,5, o contrário do Drizzle) e o chão em brasa; o Fogo Sagrado com a sombra das rochas |
| **Mewtwo** | a base do Maxie em Kanto (o lugar a pensar; decisão 22) | ao começar a Victory Road, na missão "Ajude a Elite dos Quatro" | a decidir | a decidir (há luta? HISTORIA.md, seção 8.1) |
| **Kyogre** | a lagoa da vila (já existe) | depois do Campeão (padrão), com o Dive | 90 | o Drizzle (já existe) |
| **Mew** | — | epílogo | — | decisão 5 |

- As missões aparecem no **mapa da jornada** como um ícone no lugar delas (a Usina,
  Seafoam, a Caverna Desconhecida), com um card como o do salão do Kyogre. O Monte
  Brasa fica nas Ilhas Sevii, fora do Town Map de Kanto, então ganha um ícone na
  borda do mapa (padrão).
- **A lagoa passa a abrir só depois do Campeão** (padrão): antes disso, a pergunta
  do Dive não aparece, e o pescador diz que o fundo está agitado demais. Sem isso,
  quem conseguisse a TM Dive cedo veria o Maxie antes da hora.
- Cada lendário ganha **a sua seção ou maquete** quando chegar a vez, como foi com
  o Dive. Esta tabela é o ponto de partida.

### 5.1 A missão do Zapdos (H-5 e H-6, feita na 0.39)

Pedido do Fellipe: "pode construir isso" (a luta do Zapdos, para o "Lutar" do card
funcionar: o molde das missões, tirado do salão do Kyogre, e a tempestade). Depois de
ver a luta, ele refinou a história (decisão 16): a máquina suga a energia do Zapdos, por
isso ele está fraco; e não dá para capturá-lo agora, porque ele foge, assustado. As
decisões abertas ficaram no padrão, para o Fellipe mudar o que quiser.

- **O Lutar**: o grito do Zapdos e a transição de batalha do FireRed para os
  lendários (`B_TRANSITION_BLUR`: duas piscadas para o cinza e o borrão em blocos que
  escurece), por cima do escuro do fundo da Usina. A cena acaba ali, e a luta começa.
- **A arena**: o fundo da Usina, montado com as peças da Power Plant do FireRed (o
  piso, a parede de canos, os transformadores, o entulho e os geradores), um pouco
  escurecido. No meio, logo acima de onde o jogador chega, **a máquina do emblema
  vermelho** (desenhada em pixel: duas bobinas, o console com o emblema e a base com a
  faixa de aviso), e a base dela bloqueia o caminho. A música é a da Usina no FireRed
  (`mus_poke_mansion`), e a do lendário quando ele se solta.
- **Preso (0:00 a 0:45)**: o Zapdos acorrentado à máquina (quatro correntes, das
  bobinas e do console), se debatendo e soltando faíscas. **A energia dele escorre**: as
  bolhas de luz descem pelas correntes até a máquina, e ondas sobem das bobinas, para
  longe. A horda elétrica da Usina vem (Voltorb, Magnemite, Pikachu, Electrode, Magneton,
  Electabuzz e Raichu, níveis 32 a 36, com dois Electrode e um Electabuzz mais fortes).
  A tempestade já cai. Nos últimos segundos, a máquina sobrecarrega.
- **As correntes arrebentam**: ele entra em campo ainda preso (a apresentação diz "A
  máquina sugou a energia dele por muito tempo. Ele está fraco, mas fora de si!"), e
  logo depois o clarão, o grito, os elos voando, a máquina quebra, e ele sobe: "As
  correntes arrebentaram! O Zapdos está fraco, mas furioso!".
- **A tempestade (o desafio dele)**: os raios caem o tempo todo, sempre num lugar
  marcado no chão antes (1,25 s de aviso). Um a cada 3,2 s com ele preso; 1 ou 2 a cada
  2,4 s solto; 2 a cada 1,8 s abaixo de 50%; 3 a cada 1,3 s na fúria.
- **Os ataques**, cada um com aviso:
  - **Zap Cannon** (o golpe exclusivo dele): ele para e carrega (a mira tracejada até o
    treinador), solta a esfera de trovão, que atravessa a arena devagar dando choques em
    quem passa perto, e explode no lugar marcado;
  - **Investida** (Drill Peck): a faixa acende no chão do Zapdos até depois do
    treinador, com as setas correndo, e ele cruza a arena por ela (duas seguidas na fúria);
  - **Discharge**: dois anéis elétricos saem dele;
  - a horda chamada, como os líderes.
- **A tempestade total** (aos 66% e aos 33%, e a cada 24 s na fúria): ele sobe para as
  nuvens e some, intocável, e o chão vira um tabuleiro de casas de 200 px em volta do
  treinador. As casas de uma cor caem primeiro (a dele inclusive), depois as da outra,
  depois as da primeira de novo, com 1 s entre as levas. Só a próxima leva acende
  forte, e a casa queimada fica escura: **fica a salvo quem pisa onde o raio acabou de
  cair**. No fim, ele mergulha de volta num lugar marcado, com um Discharge.
- **Sem captura**: a luta não tem bolas (o card diz "Sem captura nesta luta"), e ele não
  tem piso de vida. Derrotado, **ele cai sem forças** ("O Zapdos caiu, sem forças!") e
  a fase é vencida.
- **A força**: fraco pela máquina, ele é para **logo depois da Fase 3** (o nível
  recomendado do card é 36; a Fase 3 pede 33, a Fase 4, 40). Medida com o jogador
  automático e uma equipe comum (`node tools/kyogre.mjs 36 12 zapdos`): no nível 28
  vence 5 de 12; no 30, 8 de 12; no 32, 11 de 12; **no 36, 11 de 12, com 3 a 4
  desmaios**; no 40, 12 de 12. Primeira vitória: 300 Shards.
- **Perdeu**: a tela de resultado oferece "Tentar de novo" (a equipe curada, sem
  atravessar a Usina) e "Voltar para a vila" (acorda no Centro: um marinheiro de
  Vermilion achou o jogador desmaiado perto da escotilha). Saiu no meio: volta para
  cima, ao lado da escotilha.
- **Venceu**: a missão fica registrada na jornada, a quest "Derrote e liberte o Zapdos"
  fecha, e o "Continuar Jornada" leva à **cena de depois** (`zapdos_livre`), na sala do
  fundo **com a luz de volta**. O Zapdos está caído no chão, sem forças. Ele treme, vê o
  jogador (o "!"), grita, treme de medo e **foge pelo alto, assustado**: "Ele ainda está
  fraco demais para confiar em alguém." O jogador vai até a máquina destruída: "Ela
  sugava a energia do Zapdos pelas correntes e mandava para longe, em ondas. Para
  onde?", e no meio dela, **um emblema vermelho que nunca viu**: "Alguém prendeu o
  Zapdos aqui de propósito." O jogador fica em cima, ao lado da escotilha, e a
  escotilha passa a levar à sala iluminada, só com os pedaços da máquina. Na vila, o
  rapaz conta que a Usina voltou a funcionar, e o velho sábio, uma vez, fala da máquina
  que sugava a energia e de alguém caçando os pássaros.
- **A captura do Zapdos é outro momento**: desde a decisão 20, nenhum lendário aparece na
  Poké Ball, nem depois de liberado. A forma de ele entrar na equipe fica para a história
  (HISTORIA.md, seção 8.1).

### 5.2 A missão do Articuno (H-7, feita na 0.39)

Pedido do Fellipe: "podemos planejar a H-7 agora". A proposta, com as três cenas montadas
em pixel e as mecânicas da luta em movimento, está na página **"Seafoam: as ondas"**
(https://claude.ai/artifact/YCgPux377xbGTytGRVUtzU). **Aprovada em 2026-11-12** ("pode seguir
com o que fez", decisão 19) e construída na 0.39 como está abaixo. O que a construção acrescentou:

- **A regra de altura na vila** (o achado técnico da proposta): `heightOk` em `data/hub.js`,
  com a altura de cada tile no mapa gerado (`levels`). Vale no passo, no clique, nas cenas e no
  check-data. E o desenho também: no patamar alto, o jogador aparece por cima da camada de cima
  do mapa, como no FireRed (a prioridade do sprite pela altura).
- **Os números medidos**: 79 passos da entrada até ficar de frente para a ilha (75 até o primeiro
  tile da margem) e 86 de volta até a saída, pelo check-data. A luta, no nível 57, vence 11 de 12
  com 2 a 3 desmaios; no 51, 8 de 12 (a mesma curva do Zapdos).
- **O Lutar no primeiro card** contava a cena como vista só depois da transição de batalha, e a
  cena da margem voltava a tocar na volta da luta. Corrigido no motor das cenas.
- **O Capítulo 5** se chama só "A suspeita" no jogo (sem o "fogo", que adiantaria o Moltres).
- **Depois de ver a H-7** (o Fellipe, 2026-11-12): o atalho ("o articuno foi derrotado, ele pode
  aparecer na vila pós cena já"): a cena de depois termina na vila, sem a volta a pé; e 15 Poké
  Balls nas ilhas ("pode por até 15"): as cinco do FireRed, sete à vista do caminho de ida e três
  nos becos.

- **As ondas** (`depois_blaine`, no ginásio de Cinnabar do FireRed, depois da Fase 7): o
  Blaine conta que os instrumentos do Laboratório Pokémon captam ondas estranhas, que
  saem das Ilhas Seafoam e seguem para o sul, pelo mar. O jogador lembra da máquina da
  Usina (o "!"). O mar em volta de Seafoam está congelando, e nenhum barco sai de
  Cinnabar. Abre a quest dourada "Investigue as Ilhas Seafoam" e a marca de Seafoam no
  mapa da jornada.
- **A trava da Fase 8** (a Rota 21 é o mar entre Cinnabar e Pallet): "O mar da Rota 21
  está congelando, fora de época. Nenhum barco sai de Cinnabar." O botão leva a Seafoam.
  Não cita o Articuno.
- **Seafoam a pé**: os cinco andares do FireRed, como a Usina, só por onde o original
  deixa. Sem Surf e sem empurrar pedra, existe caminho: dois buracos no chão (o jogador
  cai no andar de baixo, como no FireRed) e duas escadas, 79 passos até a margem do fundo
  (a Usina tinha 170). As cinco Poké Balls do FireRed ficam alcançáveis, e entram mais três
  nos becos (Reviver e Novo Sorteio). **Achado técnico:** Seafoam tem patamares em duas
  alturas (3 e 4), ligados por escadinhas (altura 0). O FireRed só deixa passar de uma
  altura para a outra por elas; o `hub.py` e a vila hoje só olham a colisão e a água. A
  vila precisa da regra de altura (o `map.bin` já traz a altura de cada tile), senão o
  jogador sobe pelas paredes de gelo. O caminho foi medido com essa regra.
- **O fundo** (`seafoam_fundo`, na primeira vez que o jogador chega à margem): a névoa
  cobre a água, o zumbido da Usina, as ondas subindo; a névoa se abre e, na ilha do canto
  (onde o Articuno fica no FireRed), a máquina do emblema vermelho coberta de gelo com uma
  silhueta de asas presa por correntes. "É o Articuno!" fecha "Investigue as Ilhas
  Seafoam", abre "Derrote e liberte o Articuno" e sobe o card (Voltar ou Lutar).
- **A luta** (o molde do Zapdos): preso nos primeiros 45 s com a horda de Seafoam (Seel,
  Dewgong, Shellder, Cloyster, Slowpoke, Slowbro, Psyduck, Golduck, Zubat e Golbat, níveis
  52 a 56); as correntes arrebentam. **A nevasca, o tempo todo**: a névoa (o alcance da
  vista cai de 420 px para 340 abaixo de 50% e 280 na fúria; a horda lá fora vira sombra)
  e o gelo no chão (os golpes deixam gelo por 8 s; em cima, o treinador anda 40% mais
  devagar). **Os ataques, com aviso**: Raio de Gelo (a mira tracejada por 1,2 s, o raio e
  o rastro de gelo), Nevasca (o cone acende no chão por 1,1 s e a rajada passa), o anel de
  gelo e a horda chamada. **Frio Absoluto** (o golpe exclusivo, aos 66% e aos 33%, e a cada
  24 s na fúria): ele some na névoa, a geada cobre a arena e só o olho da nevasca fica
  livre, um círculo que anda devagar com o caminho marcado; fora dele, o frio tira vida e
  deixa lento; 9 s, e ele mergulha num lugar marcado com o anel de gelo. **Sem captura**;
  nível 57 (a Fase 7 pede 55, a Fase 8, 60), medido com o jogador automático até 11 de 12.
- **Depois da luta** (`articuno_livre`, na ilha, sem névoa): ele está caído, treme, vê o
  jogador, grita e foge pela fenda do teto. A máquina quebrada: "A mesma máquina da Usina,
  coberta de gelo. O mesmo emblema vermelho." e "Duas máquinas, dois pássaros. Alguém está
  juntando a energia deles. Para quê?". O aviso: "O mar descongelou: os barcos saem de
  Cinnabar de novo. O caminho para Viridian está aberto." A Fase 8 abre.
- **Na volta**: o rapaz da vila comenta o mar; o velho sábio, uma vez: "Duas máquinas...
  alguém está juntando a força dos pássaros. E ainda falta um." O Articuno não aparece na
  Poké Ball (decisão 20). A quest seguinte é "Vença o Giovanni, em Viridian".
- **As quests**: depois da Sabrina, "Vença o Blaine, em Cinnabar" e "Ouça o que o Blaine
  descobriu" (Capítulo 4, "As ondas"); depois, "Investigue as Ilhas Seafoam" e "Derrote e
  liberte o Articuno", todas douradas.

### 5.3 A missão do Moltres (H-8 ✅, feita na 0.39)

Pedido do Fellipe: "bora para o planejamento então". A proposta, com as três cenas montadas
em pixel, os mapas da subida com o caminho e as mecânicas da luta em movimento, está na página
**"Monte Brasa: o fogo"** (https://claude.ai/artifact/6ppShMZkPmWuGzW2MoHySx). Aprovada ("construa a h-8 então", 2026-11-12, depois do ajuste
da decisão 22) e feita na 0.39: tudo abaixo entrou como está. A luta foi medida no nível 62: 11 de
12 (no 56, 7 de 12). Já entram as Poké Balls no caminho de ida e o atalho para a vila depois
da cena final, como ele pediu na H-7.

- **O emblema** (`depois_giovanni`, na sala do Giovanni no ginásio de Viridian do FireRed, com
  o Giovanni em pixel, depois da Fase 8): a quest dele ganha a linha "Mostre o Pedaço de Metal
  ao Giovanni". Ele ri: "Isso não é da Rocket. O nosso emblema é um R, e a Rocket não deixa
  rastro para trás." Ele também quer saber quem é (alguém age no território dele e deixa a
  Rocket levar a culpa). Os homens dele nas Ilhas Sevii viram gente com o emblema subindo o
  Monte Brasa com peças de máquina; o jogador lembra da casa assaltada de Cerulean. "O barco
  para a Ilha 1 sai de Cinnabar. Se descobrir quem são... volte e me conte." Abre a quest
  dourada "Investigue o Monte Brasa, na Ilha 1" e a marca da Ilha 1, na borda do mapa da
  jornada, ao lado de Cinnabar (o Monte Brasa fica fora do Town Map de Kanto).
- **A trava da Liga** (a decisão 2; a Lorelei espera a fase `moltres`): "Hordas furiosas
  tomaram a Victory Road, e a Liga fechou a passagem até as rotas se acalmarem." O botão leva
  à Ilha 1. Não cita o Moltres. A cena da Victory Road abrindo no mapa continua na H-9.
- **O Monte Brasa a pé**: o jogador chega direto ao pé da montanha (sem a cidade da Ilha 1 e
  sem a Kindle Road) e sobe os mapas do FireRed: a encosta (`MtEmber_Exterior`), o caminho do
  cume por dentro (1F, 2F e 3F) e o cume. **Achado técnico:** no FireRed a subida pede o
  Strength (sem ele, não há caminho); cinco pedras fecham o caminho, duas na encosta e três no
  cume. Na proposta, elas já foram empurradas um tile para o lado por quem subiu antes,
  carregando a máquina, e isso vira pista na cena de chegada ("Alguém subiu carregando uma coisa
  pesada"). As pedras de quebrar (Rock Smash) ficam: o caminho não passa por elas. São **232
  passos** até ficar de frente para o Moltres: 92 na encosta até a porta da caverna, 22 no 1F,
  65 no 2F, 15 no 3F, 24 no alto da encosta e 9 no cume. A vila ganha as portas de caverna (as
  portas de sempre), as setas de saída com a direção da seta (a do cume é para cima) e os
  degraus de pular do FireRed, só de descida (a volta a pé, se o jogador sair antes da luta,
  tem 60 passos). As Poké Balls: 15, a do FireRed que dá para alcançar a pé e 14 à vista do
  caminho de ida. O Hiker na chegada ("uns sujeitos de capuz vermelho subiram empurrando as
  pedras") e os dois recrutas da Rocket no Ruby Path, os homens do Giovanni ("esses de vermelho
  não são dos nossos"). A música é a das Ilhas 1, 2 e 3 do FireRed.
- **O cume** (`brasa_cume`, na primeira vez que o jogador chega ao alto): o calor, o ar tremendo;
  no alto, a máquina em brasa com o Moltres preso por correntes; as ondas subindo pela boca do
  vulcão. "É o Moltres! A terceira máquina. A terceira ave." Fecha "Investigue o Monte Brasa",
  abre "Derrote e liberte o Moltres" e sobe o card. Depois, a versão curta.
- **A luta** (o molde do Zapdos e do Articuno): preso nos primeiros 45 s com a horda do Monte
  Brasa (Ponyta, Rapidash, Magmar, Geodude, Graveler, Machop, Machoke, Spearow e Fearow, níveis
  58 a 62); as correntes arrebentam. **O Sol forte, o tempo todo**: golpes de Fogo ×1,5 e de
  Água ×0,5, para todos (a trombada não conta), com a tela quente; e o chão em brasa (os golpes
  dele deixam fogo por 8 s, e quem da equipe ficar em cima perde vida). **Os ataques, com
  aviso**: Lança-chamas (um leque acende por 1,2 s com a seta do lado da varredura, e a chama
  varre de uma ponta à outra), Redemoinho de Fogo (um anel de fogo se fecha em volta do
  treinador com uma saída marcada; 3 s para sair), Onda de Calor (dois anéis) e a horda chamada.
  **Fogo Sagrado** (o golpe exclusivo, aos 66% e aos 33%, e a cada 24 s na fúria): ele sobe para
  o sol, intocável, e quatro rochas sobem do chão; o fogo cai na arena inteira, menos na sombra
  das rochas, e as sombras giram com ele voando em círculo; 9 s, e ele mergulha num lugar marcado
  com o anel de fogo. **Sem captura**; nível 62 (a Fase 8 pede 60, a Lorelei, 64), medido com o
  jogador automático até 11 de 12. A música é a da Victory Road (onde o Moltres morava no Red e
  no Blue).
- **Depois da luta** (`moltres_livre`, no cume): ele está caído, treme, grita e foge para o céu
  pela boca do vulcão. A máquina: "A mesma máquina, em brasa. O mesmo emblema vermelho." e "Três
  máquinas, três pássaros. Toda essa energia, mandada para longe. Para onde?". **A pista nova:**
  o emblema num quadro, de perto: "o pico escuro do emblema lembra... um vulcão" (na cena do
  Kyogre, o Maxie diz "A caminho do vulcão!"). O aviso: "As rotas se acalmaram: a Liga reabriu a
  Victory Road." E o atalho: o jogador aparece na vila.
- **Na volta**: o rapaz comenta o Monte Brasa sem fumaça; o sábio, uma vez: "Os três pássaros
  livres... Mas toda aquela energia foi para algum lugar. Isso ainda não acabou." O Moltres não
  aparece na Poké Ball (decisão 20). A quest seguinte é "Vença a Lorelei, na Liga Pokémon"
  (Capítulo 6, "O sonho").
- **As quests**: "Vença o Giovanni, em Viridian" e "Mostre o Pedaço de Metal ao Giovanni"
  (Capítulo 5, "A suspeita"); depois, "Investigue o Monte Brasa, na Ilha 1" e "Derrote e liberte
  o Moltres", todas douradas.

### 5.4 A Elite dos Quatro e a base do Maxie (H-9, proposta de 2026-11-12)

Pedido do Fellipe: "vamos para o planejamento da H-9 e essa proposta de base, onde pode ser". A
proposta, com as opções de lugar, as três cenas montadas em pixel (uma fala por quadro) e o caminho
a pé andar por andar, está na página **"A base na Mansão"**
(https://claude.ai/artifact/PmKT7En4wqaNBYMubwW7NU). Esperando aprovação; tudo abaixo é o padrão
recomendado. Já vale a decisão dele no HISTORIA.md: o Mewtwo é libertado numa cena, sem luta, e na
mesma cena a Elite dos Quatro agradece e volta para a Liga.

- **O lugar: a Mansão Pokémon, em Cinnabar** (recomendada). É onde o Mewtwo nasceu (os diários do
  FireRed), e o Maxie o trouxe de volta para o laboratório do subsolo. Os diários falam do Mew
  (prepara o epílogo dele), as estátuas dos interruptores fazem a exploração, e Cinnabar fica entre
  Seafoam e a Ilha 1, para onde iam as ondas. As outras: o Laboratório Pokémon de Cinnabar (quatro
  salas pequenas, sem o que explorar) e o Armazém da Ilha 5 (é da Rocket no FireRed, o que confunde
  depois do Giovanni). O Esconderijo Magma do Emerald fica guardado para o End Game.
- **A cena da Victory Road** (o gatilho de antes da fase da Lorelei, uma vez; ela não começa a
  fase): na Rota 23, o último guarda das insígnias (o da Insígnia da Terra, na porta da Victory Road)
  vê as oito, mas a Liga está vazia: os quatro desceram juntos ontem à noite. O bilhete do Lance:
  "Os pássaros de Kanto voltaram, mas alguém continua prendendo Pokémon fortes. Os fantasmas da
  Agatha sentiram um sofrendo na velha Mansão de Cinnabar." A quest "Ajude a Elite dos Quatro".
- **A trava da Liga muda**: "A Liga está vazia: a Elite dos Quatro partiu." O botão: "Vá até a
  Mansão Pokémon, em Cinnabar". A Lorelei passa a esperar a cena do subsolo (uma trava por cena,
  porque a missão não tem luta). Nada cita o Maxie nem o Mewtwo.
- **A chegada** (a marca da Mansão no mapa da jornada): o Blaine na porta. Os quatro entraram e não
  saíram; a mansão foi um laboratório onde ele trabalhou ("O que fizemos lá embaixo... eu prefiro
  esquecer"); a dica das estátuas e a pergunta bônus ("o que se esconde no porão de uma casa
  queimada? Essa, eu não quero saber a resposta").
- **A Mansão a pé**: os quatro andares do FireRed com os interruptores funcionando como no jogo (o
  estado vale para os quatro andares; as barreiras vêm do script do pret,
  `data/scripts/pokemon_mansion.inc`). O caminho mais curto até o laboratório tem 219 passos e três
  viradas (uma no 3º andar, duas no subsolo), com a queda pelo buraco do 3º andar. 15 Poké Balls: as
  11 do FireRed (a Chave Secreta sai) e 4 no caminho de ida. Os quatro diários do FireRed, traduzidos,
  e uma anotação nova do capuz vermelho perto do laboratório.
- **O laboratório** (a sala da Chave Secreta do FireRed; pisar na entrada começa a cena): o Mewtwo
  numa máquina roxa, os quatro em jaulas. O Lance grita que é uma armadilha; a Agatha: os fantasmas
  dela sentem o sofrimento dele. O Maxie aparece pela primeira vez, com dois capangas de capuz
  vermelho (a Equipe Magma do Emerald), e se apresenta; o emblema do uniforme é o das máquinas. O que
  deixa o jogador sem defesa: as Poké Balls não abrem perto da máquina (foi assim que os quatro
  caíram). Os capangas avançam; o raio do Zapdos rasga o teto, o gelo do Articuno prende os capangas,
  a parede de fogo do Moltres separa o Maxie. "Os pássaros... vieram por você?!" O Crobat leva o
  Maxie embora ("A energia deles já está onde precisa estar"). Os três destroem a máquina; o Mewtwo
  encara o jogador e some num clarão. As jaulas abrem, cada um dos quatro fala, o Lance promete
  esperar na Liga, os pássaros voam juntos, sem medo. O aviso "A Elite dos Quatro voltou para a
  Liga" e o atalho para a vila.
- **As quests**: "Siga pela Victory Road" fecha na cena da Rota 23; "Ajude a Elite dos Quatro"
  (dourada) fecha na cena do subsolo; depois, "Vença a Elite dos Quatro" (Capítulo 7, "O sonho").
- **Para o Fellipe decidir** (com o padrão): o lugar (a Mansão); quem dá a notícia (o guarda, com o
  bilhete do Lance; ou o rival); o Blaine na porta (sim); os interruptores como no FireRed (sim; ou
  barreiras fixas); o que deixa o jogador sem defesa (as Poké Balls que não abrem); o Mewtwo depois
  (some num clarão; ideia guardada: aparecer na Caverna de Cerulean, como no FireRed); os pássaros
  depois (voam juntos, ainda fora da equipe); a anotação nova (sim); a volta (o atalho).

---

## 6. A captura muda: o lendário só depois da missão dele

> **Mudou em 2026-11-12 (decisão 20):** a captura dos lendários está fechada. Nenhum
> aparece na Poké Ball das fases, nem depois de liberado ("ainda não pode aparecer os
> lendários na captura, mesmo que depois de liberados"). O sorteio e a regra abaixo ficam
> guardados no código (`LEGENDARY_CAPTURE.open`, em `data/legendaries.js`) para quando a
> história abrir a captura. O texto abaixo é a regra de antes.

- **Regra do Fellipe** (2026-11-10): "sempre que um lendário é liberado, ele entra
  na chance de captura nas seguintes fases, com a % reduzida (como é hoje)".
  - **Liberado** é a missão vencida, com ou sem a captura. Se o jogador derrota o
    lendário sem pegá-lo, ele foge livre, e a Poké Ball das fases seguintes vira a
    segunda chance.
  - **As fases seguintes** são as fases com sorteio de lendário
    (`LEGENDARY_ENCOUNTERS`), jogadas depois da liberação, com a chance de hoje
    (3% na Fase 7 a 12% no Campeão). Isso vale para as primeiras vezes e para
    quem rejoga uma fase.
  - **Continua valendo um de cada por jornada.** Quem capturou na missão não vê o
    mesmo lendário de novo na Poké Ball.
- **Antes da liberação, nenhum lendário aparece na Poké Ball.** O sorteio
  (`CaptureSystem.rollLegendary`) passa a olhar a lista dos liberados da jornada.
- **Ordem de construção:** o sorteio de hoje só muda quando as missões
  existirem (H-5 em diante). Sem isso, as aves sumiriam do jogo. **Feito na 0.39,
  lendário por lendário**: quem já tem missão (o Zapdos) só cai na Poké Ball depois de
  liberado; os outros (Articuno, Moltres, Mewtwo, Mew) continuam como antes até a
  missão deles existir (`MISSION_SPECIES` em `data/missions.js`). Como o Zapdos foge na
  missão (decisão 16), a Poké Ball das fases seguintes é, por enquanto, o "outro
  momento" da captura dele (padrão).
- **O kit continua**: o golpe exclusivo, as melhorias e o Golpe Desperto chegam
  com o lendário quando ele é recuperado.
- **Nenhuma jornada chega com um lendário de antes das missões**: o jogo recomeça do
  zero quando a história subir (decisão 17). A ideia antiga (a missão concluída e a
  fala do Carvalho para quem já tinha o lendário) saiu.
- Continua valendo um de cada por jornada.
- **Efeito no balanceamento:** até hoje, as aves podiam vir na Poké Ball a partir
  da Fase 7, e o Mewtwo e o Mew na Liga. Agora elas chegam pelas missões, em pontos
  marcados. Será preciso medir a Liga de novo no `balance.mjs`.

---

## 7. O sistema de quests

### 7.1 O que é

As **conquistas continuam**: são do jogador e valem em todas as jornadas. As
**quests são da jornada**: contam a história daquela jornada. Há três tipos:

| Tipo | Cor | O que é |
|---|---|---|
| **História** | dourada | sempre há uma ativa. É o guia: "o que eu faço agora?" |
| **Lendário** | azul | a missão de cada lendário. Aparece quando a história chega lá e fica aberta junto da de história. |
| **Secundária** | branca | pedidos dos moradores, coisas pequenas. Fica para depois da primeira leva. |

**As recompensas ficam para o final** (pedido do Fellipe). O campo `reward` já
nasce nos dados, vazio.

### 7.2 O rastreador, no canto superior

```
                              ┌─────────────────────────────┐
                              │ ◆ PRÓLOGO                   │
                              │ Fale com a mãe        0/1   │
                              └─────────────────────────────┘
```

- **Onde:** a janela do FireRed, no **canto superior direito**, logo abaixo da barra
  da vila e da do mapa da jornada. O canto esquerdo já é o lugar do nome do lugar,
  quando o jogador entra num mapa (padrão; decisão 8).
- **O que mostra:** a quest de história e, embaixo dela, até 2 outras ativas, como
  as dos lendários.
- **Ao completar:** o objetivo fica verde com ✓, aparece "Missão concluída!" e a
  próxima entra deslizando. Quando houver efeitos sonoros, entra um som curto.
- **Na partida:** aparece só se a quest for daquela fase ("Vença o Brock 0/1"),
  pequena, embaixo do relógio. Fora isso, some, para não poluir o campo (padrão).
- **Recolher:** um clique esconde o rastreador, e o navegador lembra a escolha.

### 7.3 A tela de missões

A barra ganha um ícone novo, **Missões**, ao lado das Conquistas. A tela mostra as
quests ativas com a descrição de cada uma e, embaixo, as concluídas, por capítulo.
Funciona também como diário: dá para reler o que já aconteceu.

**Feito na 0.39 (H-3)**, com os padrões:
- **O botão**: o Diário (o item `journal`) nas duas barras, a da vila e a do mapa da
  jornada. O pontinho vermelho acende quando abre uma quest que a tela ainda não
  mostrou, e apaga quando ela abre (`seen` no estado das quests).
- **Agora**: cada quest ativa num cartão com a faixa da cor do tipo (dourada para a
  história, azul para lendário), o capítulo, a descrição e os objetivos com o placar.
- **O que já aconteceu**: um grupo por capítulo, na ordem da história, que abre e
  fecha; dentro, as quests na ordem em que fecharam, com o ✓, a data e o texto. Os
  outros objetivos de uma quest aparecem embaixo, já feitos.
- **Itens importantes**: os itens que a história deu (o Pedaço de Metal), com o
  desenho e o texto.
- **Sem spoiler**: só aparece o que já abriu. Nenhuma quest futura.

### 7.4 Os dados (`data/quests.js`)

```js
p_mae: {
  id: 'p_mae', kind: 'story', chapter: 'prologo',
  title: 'Prólogo',
  desc: 'Bom dia! Hoje é o dia de começar a jornada.',
  objectives: [{ text: 'Fale com a mãe', on: 'talk', target: 'mae', count: 1 }],
  next: ['p_lab'],
  reward: null
}
```

| Campo | O que é |
|---|---|
| `kind` | `story`, `legendary` ou `side` |
| `chapter` | o capítulo, para a tela de missões |
| `title`, `desc` | o título do rastreador e o texto da tela |
| `objectives` | cada um com `on` (`talk`, `enter`, `win`, `capture`, `scene`, `flag`, `badges` ou `dex`), o `target` e o `count` |
| `unlock` | quando a quest pode aparecer: o mesmo `when` das falas (insígnias, Campeão...) |
| `next` | as quests que abrem ao concluir |
| `scene` | a cena que roda ao concluir (seção 9) |
| `reward` | vazio por enquanto |

- **O sistema** (`systems/QuestSystem.js`) escuta os eventos do jogo pelo
  `core/events.js`, que já existe: falou com X, entrou em Y, venceu a fase Z,
  capturou W, a cena acabou. Os outros sistemas **só emitem** o evento e não sabem
  nada de quest. É a mesma regra de `/data` e `/systems`.
- **As falas ganham duas condições**, `quest: 'id'` (a quest está ativa) e
  `questDone: 'id'`. Assim cada morador acompanha a história.

### 7.5 O save

- **Por jornada:** `regions.kanto.quests = { active, progress, done }`.
- **A migração:** uma jornada que já existe não começa no "Fale com a mãe". O jogo
  deduz o capítulo pelo que ela já fez (inicial, insígnias, Campeão, Kyogre) e
  marca o que ficou para trás como concluído, sem tocar as cenas antigas (padrão).
  A cena do Maxie de quem já capturou o Kyogre continua como está.

---

## 8. O prólogo (a primeira leva)

**A cadeia de quests**, que guia o jogador do quarto até o mapa da jornada:

| # | O rastreador | Conclui quando |
|---|---|---|
| 1 | Fale com a mãe 0/1 | fala com a mãe (o jogador acorda no quarto, no andar de cima) |
| 2 | Vá ao laboratório do Prof. Carvalho 0/1 | entra no laboratório |
| 3 | Fale com o Prof. Carvalho 0/1 | ouve o discurso e escolhe o inicial |
| 4 | Abra o Mapa da Jornada 0/1 | sai pela saída sul ou aperta o botão do mapa (padrão) |
| 5 | Vença o Brock, em Pewter 0/1 | o Capítulo 1 começa |

A fala da mãe já diz o que precisa ("O Prof. Carvalho passou aqui cedinho te
procurando... Ele está no laboratório, do outro lado da vila").

**O discurso do Carvalho** (rascunho para o Fellipe ajustar; uma página por item):

1. "Ah, aí está você, {player}! Entre, entre. Antes de tudo, precisamos conversar."
2. "Você quer ser o Campeão de Kanto, eu sei. E esse sonho continua possível."
3. "Mas preciso ser honesto: as rotas não são mais como antes. As hordas mudaram."
4. "Os Pokémon selvagens andam em bandos de dezenas e cercam qualquer treinador que passa."
5. "Isso não é natural. Um Pokémon não abandona a própria casa sem motivo... Alguma coisa aconteceu."
6. "Ser Campeão é um sonho bonito. Mas o ideal, de verdade, era resolver o problema das hordas."
7. "Fazer as rotas voltarem a ser o que eram: um lugar de paz, de encontros, e não de caos."
8. "Sozinho, eu não consigo. Mas um treinador que atravessa Kanto inteira... talvez consiga."
9. "Ninguém atravessa Kanto sozinho. Por isso quero que você leve um destes três." (a escolha do inicial)

Depois da escolha, entra o fim de hoje (o Mapa da Jornada) e uma última página:
"E, {player}... se descobrir qualquer coisa sobre as hordas, volte e me conte."

Quem já começou outra jornada (`veteran`) continua com a versão curta. A fala do
cientista ("Ninguém sabe ao certo por que elas começaram") e o e-mail do
computador do laboratório já combinam com o prólogo.

---

## 9. As cenas

### 9.1 O motor

A cena do Maxie (até a 0.38, `game/MaxieScene.js`) virou o molde. Desde a 0.39,
o `game/Cutscene.js` lê os roteiros de `data/cutscenes.js`:

- **os passos que já existem:** `wait`, `say`, `show`, `walk`, `face`, `emote`,
  `throw`, `cutin`, `bird` e `end`;
- **os passos novos:** escurecer e clarear a tela, mover a câmera, fazer alguém
  aparecer ou sumir, tremer a tela, dar um item e abrir uma quest.

A regra do Maxie vale para todas: **a cena só conta como vista quando chega ao
fim**. Se ficar pendente, ela volta ao continuar o jogo. A cena do Maxie passa
para o formato novo sem mudar nada do que o jogador vê (conferido quadro a
quadro na 0.39: a antiga e a nova dão o mesmo estado em todos os 553 quadros da
lagoa e 447 do Centro).

**O que entrou na 0.39 (H-2):**

- **Os gatilhos**: entrar num lugar (`enter`), falar com alguém (`npc`), escolher
  o inicial (`starter`) ou vencer uma fase (`win`: a cena fica devida e toca quando
  o jogador chegar na vila), com as condições das falas (`when`).
- **Os passos novos**: `fade`, `camera`, `show`/`hide` (também das pessoas do
  lugar), `place`, `shake`, `give` (da mochila ou um item da história),
  `quest`, `flag` e `talk` (uma fala de `data/dialogue.js`, que conta para as
  quests). O `walk` anda por um `path` ou até o primeiro tile livre de `to`, pelo
  caminho mais curto. Um passo pode mudar com a jornada (`pick` e `cases`).
- **O registro**: `campaign.scenes = { id: 'due' | 'started' | 'seen' }`. A cena
  se registra ao começar (e o jogo salva) e só vira `seen` no fim. Uma `started`
  volta do começo ao continuar, no `spot` dela; uma `due` (a de depois de uma fase
  vencida) toca na próxima chegada à vila, também ao continuar.
- **O check-data** confere cada roteiro: o lugar, os atores e as folhas, os
  caminhos só no chão do mapa, as falas, os itens e as quests citados, e o `end`
  no fim.

### 9.2 Antes e depois das fases, em tela cheia

**Regras do Fellipe (2026-11-10):**

- **Não há cena no meio de uma fase.** As cenas são antes e depois das fases,
  apenas isso. A fase é o Bullet Heaven, do começo ao fim, sem pausa para
  história. (A apresentação do líder continua como era: ela é parte da luta, não
  da história.)
- **A cena é em tela cheia, com um cenário e os personagens em pixel**, como os da
  vila. Nada de caixa com o retrato em PNG abrindo por cima: a conversa acontece
  no lugar, com o líder em pixel na frente do jogador.

Como funciona:

- **Os palcos**: os cenários de fora da vila (`scene: true` em `data/hub.js`),
  montados dos mapas do FireRed pelo `tools/assets/hub.py`, com a colisão do
  original. O primeiro é o **ginásio de Pewter**. Num palco, a barra da vila e o
  rodapé somem (tela cheia), o rastreador continua, e ninguém chega andando: no
  fim da cena, a tela escurece e o jogador volta para a vila.
- **Depois da fase** (o gatilho `win`): vencer a fase deixa a cena devida, e ela
  toca na volta (o "Voltar para a vila" da tela de resultado, a saída do Modo
  Livre, o Continuar ou o Carregar save), no palco dela. É o lugar da conversa
  com o líder vencido.
- **Antes da fase** (o gatilho `play`): ao apertar Jogar, a cena toca primeiro, no
  palco dela, e a fase começa no fim (`then: 'stage'`).
- **Uma quest pode nascer na cena** (`openedBy`): a da Misty espera o Brock pedir
  a ajuda e entra deslizando no rastreador no meio da conversa. Uma jornada de
  antes das cenas, que não vai ver a cena, recebe a quest direto.

Cada cena aparece uma vez por jornada (o `id` entra em `campaign.scenes`) e conta
para o objetivo `scene` das quests. O check-data recusa a caixa com retrato
(`stage.story`) e qualquer coisa no meio da fase.

### 9.3 As cenas de Kanto

| # | Cena | Onde | Capítulo | Etapa |
|---|---|---|---|---|
| 1 | O discurso do Carvalho, encenado | laboratório | Prólogo | H-2 ✅ |
| 2 | O rival pega o inicial dele (decisão 1) | laboratório | Prólogo | H-2 ✅ |
| 3 | O Brock pede ajuda | ginásio de Pewter, depois da Fase 1 | 1 | H-2 ✅ |
| 4 | O velho sábio e os pássaros | vila, na volta da Fase 1 | 1 | H-2 ✅ |
| 5 | O mar bravo: a Misty e o Articuno | ginásio de Cerulean, depois da Fase 2 | 2 | H-4 ✅ |
| 6 | A casa roubada (e o rival passa) | cidade de Cerulean, depois da Fase 2 | 2 | H-4 ✅ |
| 7 | A vila culpa a Equipe Rocket | vila (falas dos moradores, sem cena) | 2 | H-4 ✅ |
| 8 | A Usina apagou: o Surge e o combate | ginásio de Vermilion, depois da Fase 3 | 2 | H-4 ✅ |
| 9 | As correntes: o marinheiro | porto de Vermilion, depois da Fase 3 | 2 | H-4 ✅ |
| 10 | A Usina andável e o fundo: os olhos e o card do Zapdos | Usina, pela marca no mapa da jornada | 2 | H-4 ✅ |
| 11 | ~~O vulto de vermelho na Rota 10~~ (guardado: a história dos lendários descansa depois da Erika, decisão 18) | — | — | — |
| 11b | O emblema de novo: a Erika, a lembrança da tempestade e o pedaço de metal (`depois_erika`) | ginásio de Celadon, depois da Fase 4 | 3 | H-4 ✅ |
| 12 | ~~O estrondo na Usina~~ (saiu: a Usina andável e a missão vieram para depois da Fase 3, decisão 14) | — | — | — |
| 13 | A jaula do Zapdos: a luta e, depois, a sala com a luz de volta, o Zapdos fugindo assustado e a máquina que sugava a energia dele, com o emblema vermelho (`zapdos_livre`) | o fundo da Usina | 2 (missão) | H-6 ✅ |
| 14 | O Carvalho e o emblema | laboratório | 3 ou 4 | depois |
| 15a | As ondas: o Blaine e os instrumentos (`depois_blaine`) | ginásio de Cinnabar, depois da Fase 7 | 4 | H-7 ✅ |
| 15 | O fundo de Seafoam: a máquina no gelo e o card (`seafoam_fundo`, e a versão curta `seafoam_fundo_card`) | Ilhas Seafoam, o fundo | 4 | H-7 ✅ |
| 15b | Depois da luta: o Articuno foge e a segunda máquina (`articuno_livre`) | a ilha do fundo | 4 | H-7 ✅ |
| 16 | O Giovanni e o emblema (`depois_giovanni`) | ginásio de Viridian, depois da Fase 8 | 5 | H-8 ✅ |
| 17 | O cume: a terceira máquina e o card (`brasa_cume`, e a versão curta `brasa_cume_card`) | o cume do Monte Brasa | 5 | H-8 ✅ |
| 17b | Depois da luta: o Moltres foge e o emblema que lembra um vulcão (`moltres_livre`) | o cume do Monte Brasa | 5 | H-8 ✅ |
| 18 | A Victory Road: a Elite dos Quatro partiu, e o bilhete do Lance (`victory_road`, antes da fase da Lorelei) | Rota 23, o último guarda das insígnias | 6 (proposta) | H-9 (proposta) |
| 18a | A Mansão: o Blaine na porta e as estátuas | Mansão Pokémon, 1º andar | 6 (proposta) | H-9 (proposta) |
| 18b | O laboratório: o Mewtwo na máquina, os quatro em jaulas, a emboscada do Maxie, os pássaros e a libertação | Mansão Pokémon, o subsolo | 6 (proposta) | H-9 (proposta) |
| 19 | O rival Campeão | sala do Campeão | 7 | H-10 |
| 20 | "Ainda falta alguma coisa" | laboratório | 7 | H-10 |
| 22 | O Kyogre e o Maxie (o segundo encontro) | lagoa ou Centro (já existe) | 8 | H-11 |
| 23 | O Pokémon rosa | vila | Epílogo | H-11 |

Cada cena chega na etapa do capítulo dela. A H-2 trouxe o motor, as duas do
prólogo e as duas da volta da Fase 1, a do Brock e a do velho sábio (pedidos do
Fellipe); a do Maxie passou para o motor sem mudar.

**As duas do prólogo (0.39):**

- **O discurso** (`prologo_carvalho`): começa ao entrar no laboratório pela
  primeira vez (ou ao falar com o Carvalho), só numa jornada sem inicial e para
  quem não é veterano. A câmera vai até ele e aparece o "!". O jogador anda até
  ele, e o Carvalho se vira para o quadro no meio do discurso. No fim, vai para
  trás da mesa das Poké Balls, e a escolha do inicial abre.
- **O rival** (`prologo_rival`): logo depois da escolha. Ele entra atrasado ("Vô!
  Cheguei!"), anda até a bola com vantagem sobre a sua (como no FireRed; é a
  mesma do time dele no Campeão), "O rival pegou o Squirtle!", e acha bobagem se
  preocupar com as hordas: "Eu quero é ser Campeão!". Ele sai, e o Carvalho
  fecha com a fala de sempre (o Mapa da Jornada). **Padrão até o Fellipe
  decidir:** o rival é o neto do Carvalho, como no FireRed, e se chama "Rival",
  como no Campeão.

**A do Brock (0.39, `depois_brock`):** depois da Fase 1, no ginásio de Pewter (o
primeiro palco), em tela cheia. O Brock (o sprite dele do FireRed, em pixel) está
na frente do jogador: parabeniza, olha para o lado ao falar das rotas, volta e diz
que é muito sério, pede ajuda e manda investigar Cerulean. A quest da Misty entra
no rastreador no meio da conversa. No fim, a tela escurece e o jogador está na
vila, já na cena seguinte.

**A do velho sábio (0.39, `sabio_passaros`):** logo depois da do Brock (as duas
ficam devidas na vitória, e a saída do palco leva ao lugar da próxima). O jogador
aparece na rua, embaixo da casa do sábio; a câmera sobe um pouco para mostrar a
porta, ele sai, vê o jogador (o "!") e chama: "Espere um pouco!". Vem até o lado
dele e conta: "Soube que o Brock te pediu ajuda", olha para o céu ("faz muitos
anos que eu olho o céu todas as manhãs"), os três pássaros lendários sumiram, e
foi depois disso que os Pokémon começaram a agir assim: "deve ter alguma coisa a
ver. Mas isso é tudo que eu posso te ajudar, por enquanto". Ele volta para casa,
a câmera volta ao jogador e o jogo segue livre. Na casa dele, depois, ele lembra
da conversa.

**As da Misty (0.39, `depois_misty` e `cerulean_roubo`):** depois da Fase 2, duas
cenas emendadas, em dois palcos novos (o ginásio de Cerulean inteiro e um recorte
da cidade com a casa assaltada, os dois do FireRed). A Misty, na beira da
piscina, conta do mar bravo e do Articuno; quando ela aponta o Surge, a pista
(`emit` da `clue` `articuno`) fecha o "Encontre pistas" com a comemoração, e a
quest do Surge entra no rastreador. Na rua, o policial culpa a Rocket, o dono da
casa estranha as peças de máquina, e o rival passa correndo ("Brincando de
detetive?"). Depois, na vila, os moradores comentam o assalto, e só o sábio
estranha; essas falas valem enquanto a quest do Surge está ativa.

**As do Surge (0.39, `depois_surge` e `vermilion_correntes`) e a Usina andável (`usina_entrada` e `usina_fundo`):**
depois da Fase 3, duas cenas emendadas em dois palcos novos (o ginásio de
Vermilion inteiro e o cais da cidade). O Surge conta a Usina apagada, os Voltorb
na cidade e o Zapdos sumido; quando ele fala do combate dentro da Usina, a pista
`zapdos` fecha a quest dele (e o Capítulo 2) e abre a da Erika. No cais, o
marinheiro vê o jogador (o "!"), vem até ele e conta das correntes; ele abre a
quest paralela da Usina (azul). Na vila, o sábio diz que aquilo não é coisa da
natureza.

**A Usina andável** (pedido do Fellipe, maquete "Usina: o fundo"): a primeira marca
de lugar da história no mapa da jornada (`STORY_PLACES` em `data/regionMap.js`),
enquanto a quest da Usina está ativa. O "Investigar" leva o jogador para dentro
da Usina inteira do FireRed (49×40, andável só onde o original deixa), em tela
cheia, com o rodapé dos controles. Na primeira vez, uma cena curta: as luzes
piscam, as marcas de raio, as correntes ao fundo. Depois ele explora à vontade:
- **13 Poké Balls no chão**: 2 no caminho e 11 nas salas que não levam a nada, com
  6 Revivers e 7 Novos Sorteios (os Revivers nas mais escondidas). Cada uma uma vez
  por jornada. Nenhuma fica embaixo da camada de cima da parede.
- **Dois Voltorb** fecham um corredor do salão de cima (e uma sala que só se abre
  por ali). Parecem Poké Balls, como os Voltorb e Electrode disfarçados de item da
  Usina do FireRed.
- **A escotilha** (desenhada em pixel: metal, escada de mão, cantos de aviso) fica
  na sala do gerador grande, onde o Zapdos fica no FireRed; o caminho mais curto
  até ela tem 170 passos. A saída é o tapete da entrada.

**O fundo da Usina** (toda vez que o jogador desce): a tela escura, só o jogador
com um círculo fraco de luz em volta, em degraus de pixel. Dois segundos depois,
os olhos vermelhos do Zapdos, desenhados em pixel num tile do mapa, por cima do
escuro (a pista `olhos` fecha "Investigue a Usina" e abre **"Derrote e liberte o
Zapdos"**). Mais dois segundos e sobe o card, no padrão do card de fase, com a foto
do Zapdos, o tipo, as fraquezas e o nível recomendado (36; sem captura, decisão 16).
"Voltar" devolve o jogador para cima, ao lado da escotilha; "Lutar" começa a luta
(o molde das missões, H-5, e a do Zapdos, H-6: seção 5.1).

---

## 10. Depois de Kanto: as vilas das outras gerações

- O Maxie parte "a caminho do vulcão", que é o **Monte Chimney, em Hoenn**. É a
  ponte para a segunda vila: a da **Gen 3**, com os tiles do Emerald e as fases nos
  mapas de Hoenn.
- **Cada região tem** uma vila, a sua campanha de ginásios e os lendários que o
  Maxie roubou ali. As hordas existem em toda região por onde ele passou, e é por
  isso que o problema não acaba em Kanto.
- **Os assets:** Hoenn está pronto (os mapas do Emerald, os retratos dos líderes,
  da Elite Four, do Steven, do Maxie, do Archie e das equipes Magma e Aqua no
  decomp do FireRed). Johto e as outras regiões pedem outra fonte. O FireRed ainda
  tem o **Navel Rock** (Lugia e Ho-Oh) e a **Birth Island** (Deoxys), que podem
  servir de ponte mais tarde.
- A estrutura por região (`data/regions.js`, `profile.regions[id]`) já existe
  desde a 0.5.

---

## 11. Como construir (etapas)

| Etapa | O que entra |
|---|---|
| **H-1** ✅ 0.38 | O sistema de quests e o prólogo: `data/quests.js`, o `QuestSystem`, o rastreador, o save por jornada com a migração, as condições novas nas falas, a cadeia do prólogo e o discurso novo do Carvalho. Testes no `ui-smoke`. |
| **H-2** ✅ 0.39 | As cenas em dados (`Cutscene.js` a partir da cena do Maxie, que não muda), as cenas de antes e de depois das fases, em tela cheia nos palcos (o ginásio de Pewter), as duas cenas do prólogo e as duas da volta da Fase 1 (o Brock, com a quest da Misty, e o velho sábio): o discurso do Carvalho encenado e o rival pegando o inicial dele (seção 9.3). |
| **H-3** ✅ 0.39 | A tela de missões (seção 7.3): o botão Missões nas duas barras, ao lado das Conquistas, com o pontinho quando abre uma quest nova; em cima, o que fazer agora; embaixo, o diário por capítulo, com a data de cada quest; no fim, os itens importantes da história. |
| **H-4** ✅ 0.39 | Os capítulos 1 a 3: as falas de depois da vitória dos líderes, o velho sábio, os moradores e as quests de cada capítulo. O Capítulo 1 (o Brock e o velho sábio), o Capítulo 2 (a Misty, a casa roubada, os moradores; o Surge, o marinheiro e a Usina andável, com a missão do Zapdos, H-5 e H-6) e o Capítulo 3 (decisão 18): a Fase 4 fechada até a Usina, a cena do emblema com a Erika, e o Koga e a Sabrina como ginásios comuns. |
| **H-5** ✅ 0.39 | A captura sem lendários e o molde da missão de lendário, tirado do salão do Kyogre: `systems/legendaryFight.js` (a captura, os avisos, os anéis, a leva final), o Kyogre por cima dele sem mudar nada (o mesmo rastro, quadro a quadro), o registro das missões na jornada, a volta pela missão e a regra da Poké Ball para quem tem missão. |
| **H-6** ✅ 0.39 | O Zapdos (seção 5.1): o Lutar com a transição, a luta no fundo da Usina com ele enfraquecido pela máquina, a tempestade, e a cena de depois, em que ele foge assustado (sem captura, decisão 16). |
| **H-7** ✅ 0.39 | O Articuno e o Capítulo 4 (seção 5.2, página "Seafoam: as ondas"): a cena do Blaine, a trava da Fase 8, Seafoam a pé com a regra de altura, a luta e as duas cenas da missão. |
| **H-8** ✅ 0.39 | O Moltres e o Capítulo 5 (seção 5.3, página "Monte Brasa: o fogo"): a cena do Giovanni, a trava da Liga, o Monte Brasa a pé com as pedras arrastadas, os degraus de pular e as 15 Poké Balls, a luta sob o Sol forte e as duas cenas da missão. |
| **H-9** (proposta) | A Victory Road e a base do Maxie (decisão 22; seção 5.4, página "A base na Mansão"): a cena da Elite dos Quatro, a quest "Ajude a Elite dos Quatro", a base com o Mewtwo e as jaulas, a emboscada do Maxie e os pássaros. Ganha proposta e maquete. |
| **H-10** | A Liga e o fim do Capítulo 7: a Elite dos Quatro de volta, o rival Campeão e o "ainda falta alguma coisa". |
| **H-11** | O Kyogre como fecho de Kanto (as quests em volta da cena que já existe, a lagoa depois do Campeão, o Maxie como segundo encontro) e o Mew. |
| **H-12** | As recompensas das quests (no final, pedido do Fellipe). |

---

## 12. Decisões (aprovadas pelo Fellipe em 2026-11-10)

1. **O rival entra na história**: no prólogo e em poucas cenas, e é o Campeão.
2. **A Liga exige os três pássaros**: a Victory Road só abre com eles.
3. **O lendário recuperado fica com o jogador**: vai para o PC, como o Kyogre. Se
   escapar na missão, volta pela Poké Ball (seção 6). **Mudou com as decisões 16 e 20:** os
   pássaros fogem na missão e não aparecem na Poké Ball; como eles entram na equipe fica para
   a história.
4. **O Moltres fica no Monte Brasa**, na Ilha 1, como no FireRed.
5. **O Mew é o Pokémon rosa do epílogo**, que aparece de relance em algumas cenas
   antes. A missão dele ganha o seu plano quando chegar a vez.
6. **O ladrão tentou levar o Mewtwo e falhou**: a máquina quebrada fica na caverna.
7. **Recuperar um pássaro não muda as fases**: muda só a história e as falas.
8. **O rastreador fica no canto superior direito** e aparece na partida só quando
   a quest é daquela fase (feito na 0.38).
9. **Hoenn é a próxima vila**, pelo Maxie e pelos assets. Ainda falta decidir se a
   equipe de Kanto vai junto ou se a jornada recomeça (fica para quando Hoenn
   chegar).
10. **A lagoa só abre depois do Campeão** (seção 5).
11. **As cenas são antes e depois das fases, nunca no meio** (pedido do Fellipe
    depois da 0.39: "não se pode ter cenas no meio de fases, as cenas são antes e
    depois de fases, apenas isso"). O evento que pausava a fase saiu; as cenas que
    eram no meio da Fase 5 e da Fase 6 passaram para antes delas (seção 9.2).
12. **As cenas são em tela cheia, com cenário e personagens em pixel** (pedido do
    Fellipe ao ver a fala do Brock numa caixa com o retrato: "eu penso em ser um
    full screen com um cenário e ele em formato de pixel personagem da vila, não
    assim PNG que abre a imagem"). A caixa com retrato saiu; os cenários de fora da
    vila são palcos montados dos mapas do FireRed. A conversa com o Brock é a
    apresentação do problema, sem o Maxie e sem corte de tela, e abre a quest da
    Misty com as pistas em Cerulean (seção 4).
13. **Em Vermilion, nada chega de barco e ninguém vê clarão** (pedido do Fellipe:
    "ninguém vai buscar sentido entre o barco e que é uma equipe que vem de fora").
    As pistas do Surge e do marinheiro são o combate dentro da Usina e as correntes
    lá dentro, e o jogador pode ir verificar: a Usina vira uma marca no mapa da
    jornada.
14. **A Usina é andável, e a missão do Zapdos começa nela** (pedido do Fellipe):
    o jogador explora por conta, acha as Poké Balls e a escotilha, e no fundo, no
    escuro, os olhos (em pixel, num tile, nada de imagem desfocada) e o card de
    fase "Derrote e liberte o Zapdos", com a foto dele. O card aparece depois da
    Fase 3, e a luta pede o nível dela (~58, padrão; depois, 36: decisão 16). A visão da Sabrina no
    Capítulo 4 passa a apontar para os outros dois pássaros.
15. **A luta do Zapdos** (pedido do Fellipe: "pode construir isso"; os detalhes no
    padrão, seção 5.1): preso na máquina nos primeiros 45 s, as correntes arrebentando,
    a tempestade marcada no chão o tempo todo, o Zap Cannon, a Investida, o Discharge e
    a tempestade total em tabuleiro. Depois, a sala com a luz de volta e o emblema
    vermelho na máquina destruída.
16. **As máquinas sugam a energia dos lendários, e o Zapdos foge** (refino do Fellipe
    depois de ver a luta: "essas máquinas que prendem os lendários sugam a energia
    deles, canaliza e manda por ondas para um outro lugar até então misterioso para o
    jogador"; "ao derrotar o Zapdos, rola uma cutscene do Zapdos voando e fugindo,
    assustado, então não é possível capturar o Zapdos por enquanto, vai ter um outro
    momento para isso"). A energia alimenta uma máquina central numa base do Maxie, a
    causa da desorientação dos Pokémon: ideia de End Game, para o futuro (seção 2).
    Enfraquecido, o Zapdos é uma luta para logo depois da Fase 3 (nível 36, padrão). Sem
    captura na missão: derrotado, ele cai; na cena de depois, foge pelo alto. O "outro
    momento" da captura, por enquanto, é a Poké Ball das fases seguintes (padrão, como
    na decisão 3). A mesma lógica deve valer para as outras máquinas (o Articuno e o
    Moltres), a confirmar quando chegar a vez de cada um. (A Poké Ball saiu com a decisão 20.)
17. **O jogo recomeça do zero quando a história subir** (o Fellipe, 2026-11-11: "o jogo
    vai ser resetado quando tudo for pro ar, então não vai existir jogadores com
    lendários ou coisas do tipo"). As etapas daqui para a frente não precisam tratar
    saves antigos. O que existia só para eles nas missões (o estado 'antes', a fala do
    Carvalho e as quests da Usina fechando sozinhas para quem já tinha o Zapdos) saiu.
18. **Celadon: a Fase 4 só abre com o Zapdos libertado, e a Erika mostra o emblema de
    novo** (o Fellipe, 2026-11-11: "A fase da Erika é barrada, o jogador precisa passar
    do Zapdos para liberar a Erika, o emblema pode ser visto outra vez e o jogador faz
    ligação que era o mesmo da máquina, após isso continua a jornada um pouco, deixando
    de lado essa sub trama dos lendários, derrotar o ginásio e ir seguindo"). A missão
    do Zapdos deixa de ser opcional e vira o degrau entre a Fase 3 (33) e a Fase 4 (40).
    Depois da Erika, o Koga e a Sabrina seguem sem a história dos lendários. Os detalhes
    (o túnel no escuro, as quests douradas, a pena dourada fora, a lembrança com a sombra
    de asas, onde a história volta) estão na proposta "Celadon: o emblema", aprovada
    ("ficou excelente") e construída na 0.39.
19. **Seafoam: as ondas** (o Fellipe, 2026-11-12: "pode seguir com o que fez"). A proposta
    da H-7 inteira, com os padrões dela: a cena do Blaine com as ondas e o mar congelando, a
    Fase 8 fechada até o Articuno ("O mar da Rota 21 está congelando, fora de época"),
    Seafoam a pé com a regra de altura do FireRed, a luta de nível 57 sem captura (a mesma
    lógica do Zapdos, decisão 16), a fuga pela fenda do teto e o Capítulo 4 renomeado "As
    ondas" (os seguintes descem um número; o do Giovanni fica "A suspeita").

20. **A captura dos lendários fica fechada** (o Fellipe, 2026-11-12: "ainda não pode aparecer
    os lendários na captura, mesmo que depois de liberados"). Nenhum lendário aparece na Poké
    Ball das fases: nem os pássaros depois das missões, nem o Mewtwo e o Mew na Liga. O sorteio
    fica guardado (`LEGENDARY_CAPTURE.open`). O Kyogre não muda: ele vem da luta do salão.
    Enquanto ela estiver fechada, a Pokédex chega no máximo a 146 de 151.
21. **A emboscada do Maxie no Mewtwo, antes da lagoa** (o Fellipe, 2026-11-12: "vai ser antes da
    lagoa"). Ao ir libertar o Mewtwo, o Maxie aparece pela primeira vez e surpreende o jogador;
    os três pássaros aparecem para protegê-lo, e o Maxie foge. A cena do Kyogre vira o segundo
    encontro, sem mudar as falas. A regra da escrita passa a ser "ninguém diz Maxie antes do
    Mewtwo". Padrão até ele decidir: a lagoa abre depois da missão do Mewtwo. Muda a decisão 6
    (o ladrão "tentou levar o Mewtwo e falhou" vira a cena ao vivo). HISTORIA.md, seção 8.1.
22. **O Mewtwo está na base do Maxie, e a Elite dos Quatro cai presa lá** (o Fellipe,
    2026-11-12). O Mewtwo não fica na Caverna Desconhecida: está preso numa máquina na base do
    Maxie em Kanto (um mapa do FireRed, a escolher; a recomendação é a Mansão Pokémon de
    Cinnabar, onde ele foi criado). Ao começar a Victory Road, uma cena conta que a Elite dos
    Quatro se juntou para derrotar uma ameaça maior e foi até a base; a quest "Ajude a Elite dos
    Quatro". Na base, o Mewtwo na máquina e os quatro em jaulas; a emboscada da decisão 21; os
    pássaros; o Maxie foge. Só depois a Liga abre. Os capítulos passam a ser: 6, a Elite dos
    Quatro; 7, o sonho (a Liga); 8, a lagoa. As etapas: a H-9 é a Victory Road e a base; a H-10,
    a Liga e o rival; a H-11, a lagoa e o Mew.

---

## 13. Para depois (ideias registradas, sem construir)

### 13.1 O Level Cap

Pedido do Fellipe (2026-11-11, depois da missão do Zapdos): "vai existir Level Cap,
cada fase os pokémons podem evoluir até um limite, liberando o próximo limite somente
quando passarem da fase, uma tentativa de equilibrar, mas deixa isso no planejamento".

- **A regra**: cada fase tem um teto de nível. Os Pokémon da equipe sobem até ele, e o
  próximo teto só abre quando a fase é vencida.
- **Por que**: equilibrar. Hoje dá para ficar muito acima de uma fase (repetindo a
  anterior, no Modo Livre, no Endless), e a luta perde a graça; com o teto, cada fase
  e cada missão são jogadas perto do nível em que foram medidas.
- **A evolução** (decidido pelo Fellipe em 2026-11-11): o teto segura a evolução por
  nível (quem evolui no 36 só evolui quando o teto chegar lá); **a evolução por item é
  livre** (as pedras e a troca do Poké Mart funcionam a qualquer hora).
- **Sem jornadas antigas**: o jogo recomeça do zero quando tudo subir (decisão 17), então
  não há equipe acima do teto para tratar.
- **O que decidir quando chegar a vez** (nada disso está decidido):
  - **o valor de cada teto** (o Fellipe: "vamos pensar no valor de cada teto no
    futuro"). Um ponto de partida: o nível recomendado da fase seguinte, de
    `data/stages.js` (a Fase 1 pede 25, a 3 pede 33, a 4 pede 40, a 8 pede 60);
  - o que acontece com a experiência acima do teto (some, fica guardada para quando o
    teto subir, ou vira outra coisa, como Shards);
  - quem entra na equipe (a captura, os presentes, os lendários, que chegam no nível
    da equipe) e o PC;
  - o Modo Livre, o Endless e as missões dos lendários: a do Zapdos (nível 36) abre
    depois da Fase 3, então o teto depois da Fase 3 precisa deixar a equipe chegar
    perto de 36;
  - como o jogo mostra o teto (na barra de XP, no card da fase, no mapa da jornada).
- **Antes de construir**: ganha um plano e uma maquete próprios, e o `balance.mjs` mede a
  campanha de novo com o teto.

### 13.3 A emboscada do Maxie no Mewtwo

Ideia do Fellipe (2026-11-12): ao ir libertar o Mewtwo, o Maxie aparece e surpreende o jogador,
que está vulnerável e prestes a ser capturado; os três pássaros lendários aparecem para
protegê-lo, e o Maxie foge. **Antes da lagoa** (decisão 21): é a primeira aparição do Maxie.
**Na base do Maxie, com a Elite dos Quatro presa** (decisão 22). Detalhes, as opções de lugar
para a base e o que ainda está em aberto: [HISTORIA.md](HISTORIA.md), seção 8.1.

### 13.2 A máquina central do Maxie

A ideia de End Game da decisão 16 (seção 2): a energia sugada dos lendários alimenta uma
máquina central numa base do Maxie, e é ela que desorienta os Pokémon. Ganha o seu
plano quando chegar a vez (depois de Kanto, seção 10).

