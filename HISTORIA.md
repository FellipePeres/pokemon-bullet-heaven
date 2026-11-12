# HISTÓRIA — Pokémon Bullet Heaven

> A história do jogo inteira, num lugar só: o que acontece, em que ordem e por quê.
> - **Este arquivo** é a história.
> - O [PLANEJAMENTO-HISTORIA.md](PLANEJAMENTO-HISTORIA.md) é como ela é construída (as etapas H-1 a H-12, as decisões técnicas e os números).
> - As falas exatas estão em `src/data/cutscenes.js` e `src/data/dialogue.js`.
>
> **Legenda:** ✅ no jogo (na branch; sobe junto com a H-12) · 📝 proposta esperando aprovação ·
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
- **O Kyogre era o próximo da lista.** Ele dorme no fundo da lagoa da vila. O Maxie chega tarde
  demais: o jogador já o capturou.
- **O Mewtwo:** o ladrão tentou levá-lo e falhou (decisão 6 do planejamento). A ideia nova da
  seção 8.1 pode mudar isso.
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
| **O Maxie** | o ladrão. Aparece pela primeira vez na cena do Kyogre (seção 8.1 discute mudar isso). Usa o Crobat para voar. |
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

### Capítulo 5 — A suspeita 📝
(Proposta "Monte Brasa: o fogo".)
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
  - o Sol forte e o Fogo Sagrado, em que só a sombra das rochas protege;
  - derrotado, o Moltres foge para o céu;
  - "Três máquinas, três pássaros. Para onde foi toda essa energia?";
  - de perto, o pico escuro do emblema **lembra um vulcão**;
  - a Liga reabre a Victory Road.

### Capítulo 6 — O sonho 🗺️
- A Victory Road se abre com os três pássaros livres.
- A Liga e o rival como Campeão, no fim, e o Hall da Fama.
- Depois, o Carvalho: as rotas estão mais calmas, mas não como antes. "Ainda falta alguma coisa."

### Capítulo 7 — O que a lagoa guarda 🗺️
- O velho sábio fala do Pokémon criado pelo homem, na Caverna Desconhecida. É **a missão do
  Mewtwo**; ver a ideia da seção 8.1.
- O pescador fala da lagoa da vila. O jogador desce com o Dive e captura **o Kyogre** no fundo
  (isso já existe desde a 0.37).
- **A cena do Maxie** (já existe):
  - "Não acredito que cheguei tarde! Você capturou o lendário Kyogre!";
  - o emblema do uniforme dele é o mesmo das máquinas;
  - o Crobat, e "A caminho do vulcão! O próximo lendário será meu!".
- É a ponte para Hoenn (o Monte Chimney).

### Epílogo — O Pokémon rosa 💡
- O Mew, que escapou do ladrão, aparece na vila.

---

## 6. As pistas e onde elas se pagam

| Pista | Onde aparece | Onde se paga |
|---|---|---|
| Os pássaros sumiram dos céus | o velho sábio (Cap. 1) | as três missões |
| As peças de máquina roubadas | a casa de Cerulean (Cap. 2) | as máquinas; o Giovanni no Cap. 5 liga as duas coisas |
| O emblema vermelho | a máquina da Usina (Cap. 2), o pedaço de metal da Erika (Cap. 3), as outras máquinas | o uniforme do Maxie, na cena do Kyogre |
| A energia mandada em ondas | a Usina (Cap. 2), os instrumentos do Blaine (Cap. 4) | a máquina central (End Game) |
| A sombra de asas | a lembrança da Erika (Cap. 3) | o Crobat do Maxie, no corte de tela da cena dele |
| O capuz vermelho | o Hiker e os recrutas no Monte Brasa (Cap. 5) | os capangas do Maxie |
| "Ainda falta um" | o sábio (Cap. 4) | o Moltres (Cap. 5) |
| O emblema que lembra um vulcão | a máquina do Moltres (Cap. 5) | "A caminho do vulcão!" (Cap. 7) |
| "Fraco demais para confiar em alguém" | a fuga de cada pássaro | 💡 a seção 8.1: eles voltam para proteger o jogador |
| A Equipe Rocket (pista falsa) | a vila, o policial, a Erika | o Giovanni ri (Cap. 5) |

---

## 7. Os pássaros lendários

| Pássaro | Onde está preso | O desafio da luta | Como termina |
|---|---|---|---|
| **Zapdos** ✅ | o fundo da Usina (Cap. 2), nível 36 | a tempestade marcada no chão e o tabuleiro de raios | foge assustado pelo alto; a luz da Usina volta |
| **Articuno** ✅ | o fundo das Ilhas Seafoam (Cap. 4), nível 57 | a névoa, o gelo no chão e o Frio Absoluto com o olho da nevasca | foge pela fenda do teto; o mar descongela |
| **Moltres** 📝 | o cume do Monte Brasa (Cap. 5), nível 62 | o Sol forte, o chão em brasa e o Fogo Sagrado com a sombra das rochas | foge para o céu; a Victory Road abre |

- **Eles não ficam com o jogador.** Derrotados nas missões, fogem com medo.
- **A captura deles está fechada** (decisão 20, o Fellipe em 2026-11-12: "ainda não pode aparecer
  os lendários na captura, mesmo que depois de liberados"). Nenhum lendário aparece na Poké Ball
  das fases, nem o Mewtwo e o Mew na Liga. A forma de eles entrarem na equipe fica para a
  história decidir (ver a seção 8.1).
  - O Kyogre é à parte: ele é capturado na luta do salão, no fundo da lagoa.
  - Enquanto a captura estiver fechada, a Pokédex chega no máximo a 146 de 151, e o último
    degrau da conquista "Pokédex" espera.

---

## 8. Ideias em aberto

### 8.1 A emboscada do Maxie no Mewtwo 💡 (o Fellipe, 2026-11-12)

> "Algum momento vamos liberar o Mewtwo, e nesse momento a cena vai ser: ao ir liberar o Mewtwo,
> o Maxie aparece e surpreende a gente, o jogador está vulnerável e vai ser capturado, até então
> os 3 pássaros lendários aparecem para proteger o jogador, nesse momento Maxie foge, é o que ele
> pode fazer. Mas ainda não tenho certeza em qual momento da história isso vai ser."

**A cena:**
1. O jogador vai libertar o Mewtwo.
2. O Maxie aparece e o surpreende.
3. O jogador está vulnerável, prestes a ser capturado.
4. Os três pássaros lendários aparecem para protegê-lo.
5. Diante dos três, o Maxie foge.

**Por que encaixa no que já existe:**
- Em cada fuga, o pássaro estava "fraco demais para confiar em alguém". A volta dos três para
  proteger o jogador é o pagamento desse arco: é quando eles passam a confiar nele.
- A decisão 6 (o ladrão tentou levar o Mewtwo e falhou) vira uma cena ao vivo, em vez de uma
  máquina quebrada contada pelo sábio.

**Ainda em aberto:**
- **Quando acontece.** Duas leituras, cada uma com consequências:
  - **Antes da lagoa** (o Mewtwo antes do Kyogre, como no Capítulo 7 de hoje): a primeira
    aparição do Maxie e o emblema no uniforme passam para esta cena. A cena do Kyogre vira o
    segundo encontro; as falas dela ("Não acredito que cheguei tarde!") continuam funcionando.
    A regra "ninguém diz Maxie antes do Kyogre" muda para "antes do Mewtwo".
  - **Depois da lagoa** (o Kyogre primeiro): o Maxie já é conhecido, e a emboscada é a volta
    dele atrás do "próximo lendário". Pede ajustar o "A caminho do vulcão!", que hoje o leva
    para Hoenn logo depois.
- **O que deixa o jogador vulnerável:** a equipe desmaiada depois da luta do Mewtwo? Os capangas
  de capuz vermelho? O Crobat?
- **O que acontece com o Mewtwo:** livre, foge, fica?
- **Os pássaros entram na equipe nessa hora?** Seria uma forma natural de abrir a captura fechada
  pela decisão 20 (uma sugestão, não decidido).

### 8.2 A máquina central do Maxie 🗺️
A energia dos três pássaros alimenta uma máquina numa base do Maxie, e é ela que desorienta os
Pokémon. É a ideia de End Game, depois de Kanto. Até lá, o jogador só pergunta "para onde?".

### 8.3 Depois de Kanto 🗺️
O Maxie parte "a caminho do vulcão", que é o Monte Chimney, em Hoenn. É a ponte para a próxima
vila. As hordas existem em toda região por onde ele passou, por isso o problema não acaba em
Kanto.

### 8.4 Guardado, por enquanto
Saíram por enquanto, e podem voltar:
- o vulto de capuz vermelho na Rota 10;
- a visão da Sabrina ("três jaulas e um homem olhando para o mar");
- a pena dourada da Usina;
- a cena do Carvalho estudando o emblema.
