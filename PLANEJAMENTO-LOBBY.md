# PLANEJAMENTO — O lobby jogável (a Vila da Jornada)

> Ideia do Fellipe (2026-11-07): ao abrir uma jornada, o jogador **não cai mais
> na tela do mapa**. Ele aparece no próprio quarto, numa **mini-vila jogável**,
> anda com o Red/Leaf pelos tiles do FireRed, fala com os moradores, usa o Centro
> Pokémon, a loja de Pokédolls e o laboratório do Carvalho, e daí parte para a
> jornada.
> O **mapa da jornada** (o Town Map de hoje, `ui/lobby.js`) continua existindo,
> aberto pela saída sul da vila ou pelo HUD.
>
> **Status:** a vila está no jogo desde a **0.29.0** (2026-11-07): as etapas L-1 a
> L-5 (andar, entrar, falar e começar, os serviços e o quarto decorável). Na
> **0.30.0**: a loja de Pokédolls com a entrada livre, o Carvalho entregando o mapa,
> o Voltar para a Vila embaixo do mapa, o rosto do treinador na fase atual e o nome
> do jogador no lugar de Red e Leaf. Faltam
> a L-6 (o golpe Dive e a TM Dive), a L-7 (sons e capricho), o modo Endless e o
> modo aquático. As decisões que ainda faltam estão na seção 13. Onde o texto
> diz "padrão", é a escolha recomendada até o Fellipe decidir (e é o que está no
> jogo).
>
> **Maquete:** a vila, os interiores e o quarto foram montados com metatiles e
> sprites do decomp, sem nenhuma arte nova, na página "Vila da Jornada"
> (artifact privado do Fellipe: https://claude.ai/artifact/KLcYaJKcd2vbfLdFdzN4QA).
> Antes dela, três direções foram testadas e descartadas: lobbies com os
> serviços em fileira (vila quadrada, acampamento, ilha-porto, base interna), um
> vale-santuário sem casas e o acampamento noturno. O Fellipe quer **uma vila de
> verdade, com casas espalhadas**, não um quadrado com os serviços enfileirados.

---

## 1. O pedido, nas palavras do Fellipe

- "Uma mini vila, mais de uma casa, não simplesmente um quadrado com as coisas
  em fileiradas. Eu imagino casas de NPC."
- "Pode ter um Centro Pokémon, aí a gente remodela o interior: dentro tem um
  balcão com PC e enfermeira, que não serve necessariamente para curar. No mesmo
  centro, em outro balcão, tem um NPC que funciona como Poké Mart."
- "Em algum outro edifício vai ter um vendedor de Pokédoll."
- "Nossa casa é onde a gente spawna. No nosso quarto 'vazio' podemos decorar com
  itens compráveis."
- "O Oak deve ficar em algum lugar": o laboratório do Carvalho entrou na vila, e
  o velho sábio das histórias mora na casa de tijolo.
- "No canto do jardim, mato alto: se o jogador sai pela lateral, vai para um modo
  **Endless**." (seção 7)
- "Na lagoa terá um easter egg: com um Pokémon com **Dive** ele entra num modo
  diferente, só aquático." (seção 8)
- "No início da jornada, se o jogador tenta sair, deve estar **bloqueado até ele
  ir falar com o Oak**. O Oak é quem dá o primeiro inicial, diferente de como
  fazemos hoje. Então libera os caminhos." (seção 4)
- "Temos que pensar nas **falas de todos os NPCs**." (seção 9)
- "A TM Dive só libera se um Pokémon do tipo Água tiver o **Golpe Desperto**
  desbloqueado; então libera a opção de trocar o golpe dele para Dive." (seção 8)

---

## 2. O fluxo novo

```
Título
 ├─ Jornada ─────► Jornadas (os 3 espaços, como hoje)
 │                    └─ Jogar ─────────────► VILA (na frente de casa)
 └─ Nova jornada ─► Treinador ─► VILA (acorda no quarto)
                                   └─ mãe ─► laboratório ─► CARVALHO:
                                      mini-história + o inicial ─► saídas liberadas

VILA
 ├─ saída sul (ou HUD › Mapa da jornada) ─► Town Map ─► Jogar ─► partida
 ├─ mato alto a oeste ───────────────────► modo Endless       (seção 7)
 ├─ lagoa, com um Pokémon que saiba Dive ► modo aquático      (seção 8)
 ├─ casas, Centro, loja de Pokédolls, laboratório, quarto
 └─ voltar ao título (pelo menu do HUD)

Partida (vitória, derrota ou abandono) ─► volta para a VILA, na frente de casa
```

As duas saídas e o botão do mapa ficam **travados até o jogador receber o
inicial do Carvalho** (seção 4).

O que muda no código: `Game.openJourney`, o fim da partida e a jornada nova
passam a chamar `openHub()` no lugar de `openCampaign()`. O `openCampaign()`
continua existindo, agora chamado pela saída sul e pelo botão do HUD. A tela de
cards do inicial deixa de vir logo depois do treinador e passa a ser aberta pelo
Carvalho.

---

## 3. A vila (aprovada)

Mapa de **36×28 tiles**, cercado de mata, cortado por um **caminho de terra
sinuoso** que liga tudo. Nada fica enfileirado: cada casa tem estilo e posição
próprios. A câmera segue o jogador, como numa cidade do FireRed (a tela do GBA
mostra 15×10 tiles).

| # | Lugar | O que faz | Peça do FireRed |
|---|---|---|---|
| 1 | **Nossa casa** | onde o jogador acorda ao começar a jornada; o quarto fica no andar de cima (seção 6) | casa de Pallet |
| 2 | **A mãe** | no térreo de casa (na maquete, na porta); manda o jogador ao laboratório e comenta cada insígnia | sprite `mom` |
| 3 | **Centro Pokémon** | PC e Poké Mart, cada um no seu balcão (seção 5) | exterior de Viridian |
| 4 | **Loja de Pokédolls** | decorações para o quarto (seção 5) | loja de bicicletas de Cerulean (teto de vidro, toldo listrado) |
| 5 | **Cabana** | casa de uma moradora | casa de Four Island |
| 6 | **Laboratório do Carvalho** | dá o inicial e conta a mini-história (seção 4); depois, dicas que mudam com as insígnias e a avaliação da Pokédex | laboratório de Pallet |
| 7 | **Casa do velho sábio** | as histórias de Kanto, dos lendários e das hordas | casa de tijolo de Fuchsia |
| 8 | **Lagoa** | o pescador e o segredo do Dive (seção 8) | lagoa de Pallet |
| 9 | **Mato alto a oeste** | saída lateral para o modo Endless (seção 7) | grama alta da Rota 1 |
| 10 | **Saída sul** | abre o mapa da jornada | — |

Também tem moradores pelas ruas (a menina na praça, o rapaz da saída sul, o
senhor do mato alto, a moça na porta da loja) e Pokémon soltos (Meowth,
Clefairy, Pidgey). As falas de todos estão na seção 9.

---

## 4. O começo da jornada: o Carvalho e o inicial

**Como é hoje:** depois do treinador, a tela de cards mostra os 3 iniciais da
região (`region.starters`: Bulbasaur, Charmander e Squirtle). O jogador escolhe
um e cai direto no mapa da jornada.

**Como fica:**

1. O jogador escolhe o treinador (a tela de hoje) e **acorda no quarto**, ainda
   sem Pokémon.
2. Desce a escada. A mãe avisa que o Prof. Carvalho passou procurando por ele.
3. As **saídas da vila estão travadas** (veja abaixo). O Centro, a loja e as
   casas já podem ser visitados.
4. No laboratório, falar com o Carvalho dispara a **mini-história** e termina
   com ele oferecendo os 3 iniciais. Padrão: a fala abre a **tela de cards que já
   existe** (`buildStarters`), porque ela mostra os tipos e o golpe de cada um. As
   3 Poké Balls ficam na mesa do laboratório, como cenário (pegar a bola na mesa,
   como no FireRed, fica para a etapa de capricho, se for aprovado).
5. Escolhido o inicial, o Carvalho entrega o **Mapa da Jornada** ("leve aqui o
   mapa, vai ser útil para você saber o caminho") e **as saídas e o botão do mapa
   são liberados** na hora. No mapa, **Voltar para a Vila** (embaixo dele) volta
   para onde o jogador estava, e o rosto do treinador fica na fase atual.

**As travas** (enquanto `campaign.starter` estiver vazio):

- **Saída sul:** o rapaz que fica perto da saída chama o jogador, fala, e o
  jogador volta um passo.
- **Saída oeste (mato alto):** o mesmo, com o senhor que fica na beira do mato.
- **HUD › Mapa da jornada:** o botão aparece apagado, com a dica "Fale com o
  Prof. Carvalho primeiro".
- **Balcão do PC:** a enfermeira avisa que ainda não há Pokémon para guardar.

A trava vem do próprio save (`campaign.starter` vazio), sem flag nova: ao
receber o inicial, tudo se libera.

**Consequência técnica importante.** Hoje, uma jornada sem inicial é tratada
como "não começada": ela some da tela de jornadas (`listJourneys`), é
descartada ao trocar de jornada (`_stashActive`) e é reaproveitada pela
"Nova jornada" (`newJourney`). Com a vila, o jogador pode andar, comprar e
salvar **antes** de receber o inicial. Então o critério de "jornada começada"
passa a ser **ter escolhido o treinador** (ou uma flag `journey.started`). Os
pontos a mudar: `listJourneys`, `_stashActive`, `newJourney`, `continueGame`,
`canContinue`, `newGame` (o "Recomeçar a jornada" da derrota também volta para
o quarto, e o Carvalho dá o inicial de novo) e o trecho de `Game.js` que abre a
tela de cards quando falta o inicial. O `chooseStarter` deixa de chamar
`openCampaign()` e devolve o controle à conversa do Carvalho.

**Saves antigos:** quem já tem inicial entra na vila com tudo liberado e sem a
mini-história (`introSeen` vira verdadeiro no `normalizeProfile`).

---

## 5. Os interiores

**Centro Pokémon, remodelado.** A base é o Centro de Indigo Plateau, que no
FireRed já reúne a enfermeira e um vendedor no mesmo salão. Ele fica com dois
balcões:

- **Balcão do PC:** a enfermeira **não cura**, porque a equipe já volta inteira
  de cada fase. Ela abre a tela do PC de hoje (caixas e equipe). A máquina do PC
  fica ao lado do balcão.
- **Balcão do Poké Mart:** o vendedor abre o menu de compra que já existe
  (`data/items.js`): Novo Sorteio (300), Reviver (600), TM (1.500), as cinco
  pedras e o Cabo de Troca (2.500 cada). A **TM Dive** só aparece quando alguém
  pode aprendê-la (seção 8).

**Loja de Pokédolls.** Por dentro, a base é a loja de Celadon: vitrines com os
bonecos à venda e um **Lapras gigante** no canto de cima, como peça rara (na 0.29
ele ficava no meio e atrapalhava o caminho). A entrada é um tapete só, com o
caminho livre. A vendedora abre o catálogo de decorações (seção 6).

**Laboratório.** O Carvalho, a mesa com as 3 Poké Balls (até o inicial ser
escolhido) e as estantes. Depois do inicial, o Carvalho fica na mesa dele.

**Casas de NPC.** Padrão: dá para entrar em todas. Cada uma é um cômodo pequeno
com um morador e as falas dele. A do velho sábio tem as histórias que vão sendo
liberadas com as insígnias.

---

## 6. O quarto decorável

O jogador acorda no quarto. Na primeira vez ele está **vazio** (só a escada e a
janela) e vai ganhando móveis e bonecos comprados com **Shards**.

Catálogo de exemplo (os preços são só para dar escala; a economia de Shards
decide os valores):

| Item | Efeito | Shards |
|---|---|---|
| Cama | dormir **salva o jogo** | grátis (já vem no quarto) |
| Mesa com PC | abre as caixas sem ir ao Centro | 300 |
| Estante | mostra as insígnias e os troféus das conquistas | 250 |
| Tapete e videogame | decoração | 150 |
| Planta | decoração (até 4 no quarto) | 60 |
| Pokédoll | Pikachu, Clefairy, Jigglypuff, Meowth, Pidgey e outros | 120 |
| Lapras gigante | só depois do Campeão | 1.500 |

Padrão: cada móvel tem **um lugar fixo** no quarto (comprar já põe no lugar),
sem editor livre. Mover peças à vontade fica para depois, se fizer falta.

Save: `profile.decor` (quantos de cada enfeite estão no quarto). Padrão no
jogo: a decoração é **do jogador**, o mesmo quarto em todas as jornadas, como os
Shards e a Pokédex (ver seção 13).

---

## 7. O modo Endless (pela saída oeste)

O canto sudoeste da vila é um **mato alto** que vai até a borda do mapa. Sair por
essa lateral leva a um modo de jogo novo, a ser implementado:

- **Sem ganho de XP:** a equipe não sobe de nível lá dentro.
- **Com ganho de Shards:** é o lugar de juntar Shards.
- **Sem fim:** a dificuldade sobe sem parar, até ficar praticamente impossível
  em algum momento. A graça é ver até onde a equipe aguenta.
- Travado até o jogador receber o inicial (seção 4).

A desenhar: como a dificuldade cresce (ondas, tempo, nível dos inimigos), como
os Shards são pagos (por onda, por tempo, por recorde), se existe um placar de
recorde, e o que acontece com capturas e itens lá dentro.

Relação com o **Modo Livre** de hoje (0.27, depois do Campeão): são coisas
diferentes. O Modo Livre sobe a equipe sem avançar na jornada; o Endless não dá
XP, só Shards.

---

## 8. O easter egg da lagoa e a TM Dive

### A TM Dive

- **Quem pode aprender:** um Pokémon **do tipo Água** (primário ou secundário)
  que já tenha o **Golpe Desperto** desbloqueado, na equipe ou no PC, como nas
  TMs de hoje.
- **Quando aparece no Mart:** só quando existe pelo menos um Pokémon assim.
  Antes disso, ela não aparece na lista. Na primeira vez que aparece, o vendedor
  comenta (seção 9).
- **O que faz:** abre a opção de **trocar o Golpe Desperto daquele Pokémon por
  Dive**. Hoje o Golpe Desperto de Água sai ao acaso entre Whirlpool, Aqua Ring e
  Surf (e um Pokémon de dois tipos pode ter despertado um golpe do outro tipo);
  com a TM, esse golpe vira Dive. Antes de confirmar, a tela mostra o golpe que
  vai ser esquecido. Padrão: a troca é para sempre, como o Golpe Desperto.
- **Preço:** a decidir (padrão: o mesmo da TM, 1.500).
- No FireRed não dá para aprender Dive (a MO08 só existe em Ruby, Sapphire e
  Emerald). Aqui ela vira uma TM especial.

**Dive na luta (proposta):** o Pokémon mergulha (fica intocável por um instante)
e reaparece embaixo do grupo de inimigos mais perto, com um impacto em área.
Segue o formato dos golpes de `data/bonusMoves.js`, mas **fora do sorteio** do
Golpe Desperto: hoje o `BONUS_BY_TYPE` junta todos os golpes de `BONUS_MOVES`,
então o Dive precisa de uma marca para ficar de fora.

### A lagoa

- **Sem Dive na equipe:** interagir com a água mostra "A água é escura e funda.
  Não dá para ver o fundo.", e o pescador ao lado dá a pista (seção 9).
- **Com um Pokémon que sabe Dive na equipe** (não basta estar no PC): interagir
  com a água pergunta se ele quer mergulhar. Sim leva ao **modo aquático**.
- Padrão: só dispara ao interagir com a água (`A` de frente para ela), para não
  entrar por acidente.

**O modo aquático** ainda vai ser pensado: arena, inimigos, regras, se repete e
qual a recompensa.

### Implementação (resumo)

- `data/bonusMoves.js`: o Dive, marcado para ficar fora do sorteio.
- `data/items.js`: o item `tm_dive`, com um tipo novo (ou um caso à parte no
  `martTargets`): ele lista os Pokémon de Água com Golpe Desperto que ainda não
  têm Dive, e a loja esconde o item quando a lista está vazia.
- `buyMartItem`: troca o Golpe Desperto em `member.abilities` por `dive`.
- A vila: o gatilho da lagoa olha se alguém da equipe tem `dive`.

---

## 9. As falas

Cada fala cabe em duas linhas da caixa de texto do FireRed. Um NPC tem uma
lista de falas com condições, e vale **a primeira que bater**, da mais
específica para a mais geral. As condições previstas: sem inicial; com inicial;
número de insígnias; depois do Campeão; tem Pokémon com Dive; já entrou no modo
aquático; já foi ao Endless. `{...}` é trocado na hora: nome do Pokémon, do
líder, números.

Tudo abaixo é rascunho para o Fellipe ajustar, menos a fala do pescador, que é
dele.

**Mãe** (térreo de casa)
- Primeira vez: "Bom dia! O Prof. Carvalho passou aqui cedinho te procurando.
  Disse que era importante. Ele está no laboratório."
- Logo depois do inicial: "Esse é o seu primeiro Pokémon? Que gracinha! Cuide
  bem dele, viu?"
- A cada insígnia: "Fiquei sabendo que você venceu {líder}! A vila inteira está
  falando nisso."
- Normal: "Cansado? Sua cama está lá em cima, arrumadinha."
- Depois do Campeão: "Campeão de Kanto... e ainda deixa a cama desarrumada!"

**Prof. Carvalho** (laboratório)
- A mini-história, com o inicial no meio:
  > **CARVALHO:** Ah, aí está você! Chegou a hora, hein?
  > **CARVALHO:** Quer ser o Campeão de Kanto? Então preciso ser honesto: as
  > rotas não são mais como antes.
  > **CARVALHO:** Os Pokémon selvagens andam em hordas, dezenas de uma vez,
  > esperando um treinador passar.
  > **CARVALHO:** Ninguém atravessa Kanto sozinho. Por isso quero que você leve
  > um destes três.
  > *(abre a escolha do inicial)*
  > **CARVALHO:** {Pokémon}! Ótima escolha.
  > *(se vier shiny)* **CARVALHO:** Espere... a cor dele é diferente! Que sorte!
  > **CARVALHO:** Capture, treine, troque quem luta. Seus Pokémon lutam por você;
  > você só precisa saber onde pisar.
  > **CARVALHO:** As saídas da vila estão livres. Ao sul, a Rota 1. Boa sorte!
- Da segunda jornada do perfil em diante, uma versão curta (as duas primeiras
  falas e a escolha).
- Depois do inicial: "Ao sul, a Rota 1 e o resto de Kanto. A oeste, o mato que
  não tem fim... esse eu não recomendo ainda!"
- Dicas, uma por insígnia. Exemplos: "Troque quem luta na frente conforme o tipo
  dos inimigos." · "Cada melhoria do golpe conta. Complete as três da chave e
  veja o que acontece." · "Um Pokémon no PC não ganha nada. Faça rodízio!"
- Avaliação da Pokédex, por faixa: menos de 10, "Só {n}? Kanto é bem maior que
  isso!" · até 39, "{n} Pokémon! Está pegando o jeito." · até 79, "{n}! Metade
  do caminho já ficou para trás." · até 150, "{n}... Você está quase lá!" ·
  151, "Você completou a Pokédex?! Isso é... incrível!"
- Depois do Campeão: "Você fez o que poucos fizeram. Mas as hordas não acabaram.
  Ouvi falar de um mato sem fim, a oeste daqui..."

**Enfermeira** (balcão do PC)
- Sem inicial: "Ainda sem Pokémon? Volte quando tiver um parceiro. Vou guardar
  um espaço para ele!"
- Normal: "Bem-vindo ao Centro Pokémon! Aqui eu cuido das caixas da sua equipe.
  Quer usar o PC?"
- Se insistir: "Curar? Seus Pokémon voltam inteiros de cada rota. Aqui a gente
  só organiza a equipe."

**Vendedor do Poké Mart** (o outro balcão)
- Normal: "Bem-vindo ao Poké Mart! Do que você precisa?"
- Na primeira vez em que a TM Dive aparece: "Chegou uma TM diferente hoje. Dizem
  que ensina um Pokémon de Água a mergulhar bem fundo..."

**Vendedora de Pokédolls**
- Normal: "Bem-vindo à Pokédoll! Um quarto sem bonecos é um quarto triste,
  sabia?"
- Sobre o Lapras, antes do Campeão: "O Lapras gigante? Esse é especial. Só vendo
  para o Campeão da Liga."

**Velho sábio** (casa de tijolo), uma história nova a cada duas insígnias:
- 0: "Sente-se, jovem. Quando eu era criança, os Pokémon andavam sozinhos ou em
  pares. Hoje andam em bandos de cem."
- 2: "Dizem que as hordas começaram depois que três pássaros lendários sumiram
  dos céus de Kanto. Gelo, trovão e fogo... onde estarão?"
- 4: "Na Floresta de Viridian, as árvores escondem mais olhos do que folhas.
  Nunca pare de andar lá dentro."
- 6: "Existe um Pokémon criado pelo homem, escondido numa caverna perto de
  Cerulean. Nem as hordas chegam perto dele."
- Depois do Campeão: "Você venceu a Liga. Mas me diga: já foi até o fim do mato
  a oeste? Ninguém nunca foi."

**Pescador** (na beira da lagoa)
- Normal (fala do Fellipe): "Às vezes fico imaginando o que tem lá embaixo...
  Se eu soubesse mergulhar, descobriria."
- Com um Pokémon com Dive na equipe: "Esse seu Pokémon... ele sabe mergulhar,
  não sabe? Vai lá e me conta o que tem no fundo!"
- Depois do modo aquático: "E aí, o que tinha lá embaixo? ...Não, não conta.
  Prefiro imaginar."

**A lagoa** (interagir com a água)
- Sem Dive: "A água é escura e funda. Não dá para ver o fundo."
- Com Dive: "A água é escura e funda. {Pokémon} pode mergulhar aqui. Quer usar
  Dive?" (SIM / NÃO)

**Moradora da cabana**
- Normal: "Meu filho saiu em jornada no ano passado. Mandou uma carta da
  Floresta de Viridian e nunca mais escreveu..."
- Depois da 1ª insígnia: "Você passou pela floresta? Viu um menino de rede e
  boné por lá?"
- Depois do Campeão: "Ele voltou! Disse que viu o Campeão passar correndo pela
  floresta. Era você?"

**Rapaz da saída sul**
- Sem inicial (trava): "Ei! Vai sair sem Pokémon? As hordas te pegam na primeira
  curva. Passa no laboratório do Prof. Carvalho antes!"
- Depois: "Daqui para o sul, é Kanto inteira. Boa sorte!"

**Senhor do mato alto**
- Sem inicial (trava): "Opa, opa! Esse mato não acaba nunca, e os Pokémon de lá
  não dormem. Sem um parceiro, nem pense nisso."
- Depois: "Quer mesmo entrar? Lá ninguém fica mais forte... mas quem aguenta
  volta com os bolsos cheios de Shards."
- Depois de ir ao Endless: "Até onde você chegou? {recorde}? Hmm. Ainda falta
  muito mato."

**Menina da praça:** "Sabia que o Clefairy dança quando a lua aparece? Eu fico
acordada só para ver!"

**Moça na porta da loja:** "Já tenho três Pikachus de pelúcia. Falta um para
completar a coleção!"

**Pokémon soltos:** Meowth: "Miau! Meowth procura moedinhas no chão." ·
Clefairy: "Clefairy dá uma voltinha e acena." · Pidgey: "Prruu! Pidgey bate as
asas."

**Placas e objetos**
- Saída sul: "ROTA 1 ao sul. Atenção: hordas de Pokémon selvagens."
- Mato alto: "TRILHA SEM FIM. Quem entra não volta igual."
- Loja: "POKÉDOLL. Bonecos e móveis para o seu quarto."
- Caixa de correio: "Casa de {nome do jogador}."
- Placa da vila: "{nome da vila}. Onde toda jornada começa." (o nome está na
  seção 13)
- Cama: "Você deita e descansa um pouco... Jogo salvo!"

---

## 10. Movimento: grade na vila, livre na partida

O HANDOFF (§4, "Treinador e equipe") decidiu que **o movimento é livre, nada de
andar por quadrados**. Essa regra continua valendo na partida. **Na vila, o
movimento é em grade, como no FireRed** (pedido do Fellipe):

- um passo = um tile (16 px no mundo, 32 px na tela em 2x);
- tocar numa direção primeiro **vira** o personagem; segurar faz andar;
- **correr** segurando `B` / `Shift` (os quadros de correr já foram extraídos);
- colisão por tile: parede, árvore, cerca, balcão, água;
- portas levam aos interiores, com o fade do FireRed;
- interação com `A` / `Enter` / `Espaço` no tile à frente, ou **clicando** no
  NPC (o personagem anda até lá e interage);
- controle: direcional e analógico andam, `A` interage, `B` corre, `Start` abre
  o menu do HUD (o `ui/pad.js` e o `core/input.js` já têm a base).

Os dois modos diferentes ajudam a contar a história: a vila é o momento calmo, e
a horda é o caos.

---

## 11. O HUD

Sempre visível e enxuto. À esquerda, o retrato, o nome e as 8 insígnias; no
centro, os Shards e a Pokédex (`18/151`); à direita, **Mapa da jornada** em
destaque (apagado até o inicial) e ícones que abrem **pop-overs** (Equipe,
Pokédex, Conquistas, Opções, Ajuda). `Start`/`ESC` abre a janela do menu START
do FireRed, com Salvar e Voltar ao título. Enquanto um pop-over, uma janela ou
uma conversa está aberta, o treinador não anda.

Requisitos do sistema de diálogo: uma lista de falas, o nome de quem fala, um
retrato opcional, perguntas de SIM/NÃO (a lagoa) e um roteiro de passos para o
personagem andar durante a conversa (`walk: ['up', 'up', 'left']`), sem trocar de
tela.

---

## 12. Como construir (esboço técnico)

**Arquivos novos (proposta):**

```
src/data/hub.js         a vila e os interiores: imagem, colisão, portas, NPCs, gatilhos
src/data/dialogue.js    as falas da seção 9, com as condições
src/data/decor.js       o catálogo do quarto (item, lugar fixo, preço)
src/game/Hub.js         o modo vila: loop, câmera, movimento em grade, portas, travas
src/ui/hubHud.js        o HUD e os pop-overs
src/ui/dialog.js        a caixa de texto do FireRed com as falas em sequência
tools/assets/hub.py     monta os mapas da vila a partir do decomp
```

- **Cada mapa é uma imagem única**, montada pelo extrator a partir de pedaços
  dos mapas do FireRed (metatiles de 16 px), mais uma **matriz de colisão e de
  gatilhos** em `data/hub.js`. O script da maquete já faz essa montagem
  (`stamp`, `fill`, autotile do caminho de terra, recorte de fundo): é a base do
  `tools/assets/hub.py`. Isso segue a regra de dados separados de lógica.
- **Mapas usados na maquete:** PalletTown (casa, laboratório, lagoa),
  ViridianCity (Centro, árvores, caminho), FourIsland (cabana), FuchsiaCity (casa
  de tijolo), CeruleanCity (loja), Route1 (grama alta),
  IndigoPlateau_PokemonCenter_1F (Centro por dentro),
  CeladonCity_DepartmentStore_4F (loja por dentro), PalletTown_PlayersHouse_2F e
  SaffronCity_CopycatsHouse_2F (quarto). NPCs em
  `graphics/object_events/pics/people/`, bonecos em `.../pics/pokemon/` e
  `.../pics/misc/lapras_doll.png`. A procedência vai para
  `assets/PROVENIENCIA.md`.
- **Atenção no extrator:** o nome da pasta de alguns tilesets tem número
  (`gTileset_GenericBuilding1` → `generic_building_1`); o `snake()` de hoje não
  trata isso.
- **Render:** reaproveita `render/trainer.js` (o Red/Leaf já tem os quadros de
  andar e correr nas 4 direções). A câmera segue o treinador em pixels inteiros,
  2x.
- **Música:** o tema do lobby que já existe (`lobby-theme.ogg`), ou o de Pallet,
  se for extraído.
- **Save:** na jornada, `regions.<id>.hub.flags` (as falas de "uma vez só" já
  vistas); no perfil, `profile.decor`. A posição na vila não é guardada: a
  jornada abre na frente de casa. A mini-história não precisa de flag própria,
  porque ela é a conversa do Carvalho enquanto não há inicial. Depois virão
  `aquaticSeen` e o recorde do Endless. O critério de "jornada começada" mudou
  (seção 4).
- **Testes:** o `smoke:ui` ganha o caminho título → nova jornada → quarto → saída
  travada → Carvalho → inicial → saída sul → mapa → partida → vila. Testes de
  unidade para as travas, para a escolha da fala certa e para a TM Dive (quem
  pode aprender, o item escondido, a troca do golpe). Um roteiro novo no
  `tools/screenshot.mjs` (`vila`).
- **Celular** (Etapa 6 do PLANEJAMENTO): tocar num tile anda até lá; tocar num
  NPC interage.

### Etapas sugeridas

Feitas na 0.29.0: **L-1 a L-5**. O que ficou diferente do esboço: os dados das
falas ficaram em `data/dialogue.js`, o catálogo em `data/decor.js`, e os móveis do
quarto também saem do `tools/assets/hub.py` (peças soltas, com a colisão de origem).

1. **L-1 — Andar:** a vila como imagem, colisão, movimento em grade, câmera, a
   saída sul abrindo o mapa e o fluxo título → jornada → vila → mapa → partida →
   vila (com saves que já têm inicial).
2. **L-2 — Entrar:** portas e interiores (nossa casa, Centro, loja de Pokédolls,
   laboratório, casas de NPC), com o fade do FireRed.
3. **L-3 — Falar e começar:** o sistema de diálogo e as falas da seção 9; o
   Carvalho com a mini-história e o inicial; as travas das saídas e do botão do
   mapa; o novo critério de "jornada começada".
4. **L-4 — Os serviços:** balcão do PC e balcão do Mart no Centro, a loja de
   Pokédolls, a cama para salvar e o HUD com os pop-overs.
5. **L-5 — O quarto:** o catálogo de decoração, a compra com Shards e os móveis
   aparecendo no quarto.
6. **L-6 — Dive:** o golpe Dive, a TM Dive no Mart (com a condição do Golpe
   Desperto) e o gatilho da lagoa. O modo aquático em si vem depois.
7. **L-7 — Capricho:** sons (passos, "bump" na parede, porta, abrir menu),
   Pokémon soltos andando, as falas que mudam com as insígnias e, se aprovado,
   pegar o inicial na mesa.
8. **Depois, cada um com seu próprio plano:** o modo Endless (seção 7) e o modo
   aquático (seção 8). Até lá, as duas entradas existem no mapa mas mostram "em
   breve".

Cada etapa é entregável sozinha, com `npm test` e screenshots, como o resto do
projeto.

---

## 13. Decisões em aberto

1. **A TM Dive troca o Golpe Desperto** (a leitura deste plano) ou o golpe
   principal? E a troca é para sempre?
2. **O nome da vila.**
3. **A escolha do inicial:** a tela de cards aberta pelo Carvalho (padrão, no
   jogo) ou pegar a Poké Ball na mesa?
4. **Casas de NPC:** dá para entrar em todas (padrão, no jogo) ou só em algumas?
5. **A decoração do quarto** vale por jornada (cada espaço tem o seu quarto) ou é
   do perfil (padrão, no jogo: o mesmo quarto em todas as jornadas)?
6. **Móveis em lugar fixo** (padrão, no jogo) ou o jogador escolhe onde pôr?
7. **O rival:** ganha uma casa na vila (por exemplo a cabana), ou só aparece em
   momentos marcados?
8. **A cama:** é o único jeito de salvar, ou o menu START também salva?
9. **Endless e modo aquático:** cada um vai ganhar o seu próprio planejamento
   quando chegar a vez.

---

## 14. Relação com o PLANEJAMENTO-VISUAL.md

- A tela do **mapa da jornada** continua, agora aberta pela saída sul e pelo HUD:
  as propostas L1 a L9 do plano visual continuam valendo para ela. A L7 (barra do
  topo) vira o **HUD da vila** descrito aqui.
- A **tela inicial**, a de **Jornadas** e a escolha do **treinador** não mudam com
  este plano. A tela de cards do **inicial** continua, mas passa a ser aberta pelo
  Carvalho, dentro da vila.
