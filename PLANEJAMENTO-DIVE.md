# PLANEJAMENTO — O modo aquático (a descida do Dive)

> Ideia do Fellipe (2026-11-08): com um Pokémon que sabe **Dive** na equipe, a
> lagoa da vila leva a um modo **diferente do Bullet Heaven**. O jogador desce
> montado no Pokémon, no estilo submerso do Emerald, e **desvia** de hordas de
> Pokémon aquáticos que atravessam a tela ocupando linhas inteiras de tiles. São
> **6 níveis de profundidade**, cada um mais difícil, e o 6º é muito difícil. Quem
> passa do 6º chega à **caverna do Kyogre**, e falar com ele abre uma fase de
> Bullet Heaven extremamente difícil (nível recomendado 90+), com chance de
> **capturar o Kyogre com uma Dive Ball**. A captura dispara uma **cena de
> história** que aponta para a continuação do jogo (o vulcão).
>
> **Status:** planejado, nada construído no jogo. A TM Dive e o golpe Dive existem
> desde a **0.34** (PLANEJAMENTO-LOBBY.md, seção 8); hoje o SIM da lagoa ainda diz
> "em breve". Onde o texto diz "**padrão**", é a escolha recomendada até o Fellipe
> decidir. As decisões em aberto estão na seção 13.
>
> **Maquetes** (artifacts privados do Fellipe):
> - "Fundo da Lagoa", o fundo do mar do FireRed contra o do Emerald:
>   https://claude.ai/artifact/WzWyZwbiZhLRox7na5T1VQ
> - "A Descida", a descida **jogável** (os 6 níveis nos mapas de verdade, as bolhas,
>   o bolsão, o resgate e a chegada à caverna):
>   https://claude.ai/artifact/WYVxGMgQ7DUCmofe4geVRv
> - "Depois do Kyogre", a **cena da captura** nas duas versões (na frente da lagoa e
>   no Centro Pokémon): https://claude.ai/artifact/1CQ2os9bD5otGFJ78A62Bv

---

## 1. O pedido, nas palavras do Fellipe

- "O modo vai ser diferente do comum, em tiles do Emerald. O personagem anda em
  tiles, como na vila. Vai ser um espaço de **6 de altura e 10 de largura**."
- "Hordas de Pokémon aquáticos vão passar **ocupando linhas completas** dos tiles,
  e o objetivo vai ser o jogador desviar, enquanto está em cima do Pokémon em
  Dive, no estilo submerso do Emerald."
- "Um detalhe extremamente importante: **os tiles jogáveis devem ser apenas os
  navegáveis no Emerald**. Em nenhum momento vamos fazer o Dive passando por cima
  de montanhas submersas inacessíveis no Emerald."
- "Ao encerrar um level, uma **pequena animação obrigatória** leva o jogador como
  se ele tivesse chegado em uma parte do mapa indo para frente, e essa parte
  mostra que dá para ir mais fundo ainda."
- "Teremos **6 níveis**, sendo o 6 muito difícil, pouco tempo de reação."
- "Caso ele complete o 6, ele pode submergir para a **caverna do Kyogre**, que tem
  no Emerald. Ao conversar com ele, vai ter uma fase de Bullet Heaven extremamente
  difícil, com **nível recomendado 90+**."
- "**3 bolhas de vida**. Não divida: só fale algo quando chegar no 3, algo como
  *encontrou um bolsão de ar no caminho*."
- "Caso morra, aparece no **Centro Pokémon** com a enfermeira falando algo cômico
  relacionando o pescador: o pescador disse que pescou você desmaiado."
- "Hordas até o nível 3 somente de **Kanto**, o 4 **misturado**, 5 e 6 somente
  **Hoenn**."
- "Captura vai ser o método **B, com Dive Ball**; a chance de captura é de **10%**;
  **2 Dive Balls por tentativa**."
- "Pós-captura, continua a luta até o fim da fase: uma **maré final de 30 segundos**.
  Se ele perder durante a fase, volta para o Centro como se tivesse morrido na
  bolha, **porém com o Kyogre**. Se encerrar a luta matando o Kyogre, ela encerra
  de alguma maneira normal e o jogador volta para a superfície pelo lago; o mesmo
  caso ele capture e encerre."
- "Depois da captura, vai ficar uma **fase Endless aquática, sem ganho de XP**."
- "Quando capturado, **uma história vai acontecer**. Caso ele capture e morra, a
  história acontece no Centro; caso saia sem morrer, na frente do lago. Um NPC bem
  característico aparece em cena, com um ponto de exclamação na cabeça, e fala
  indignado: *não acredito que cheguei tarde, você capturou o lendário Kyogre, não
  posso deixar que isso aconteça com os próximos*. Então a animação de soltar um
  Pokémon voador (a definir), e ele diz: *a caminho do vulcão! O próximo lendário
  será meu!* Dando indícios de uma continuação do jogo."
- "O NPC vai ser o **Maxie**; o voador pode ser um **Crobat** mesmo. O Endless
  aquático rende **Shards por chefe e elite**. Vamos deixar **bloqueada a corrida**;
  se ficar muito difícil, a gente repensa. Depois roda uma medição de tentativas
  para a gente entender. Vamos bolar os prêmios por nível mais tarde."
- "A velocidade de movimento do jogador deve ser **por tiles como no FireRed**, na
  mesma velocidade do caminhar no FireRed."
- "Na descida e nas fases, **não pode ser impossível**. Por exemplo: temos 6
  fileiras que podem vir hordas laterais; se a fileira 2 está disponível, na
  próxima horda a fileira 1 ou 3 precisa estar livre para ele se mover para ela,
  pois se não fica impossível em algum momento."
- "Essa parte de novas hordas saírem só quando o jogador está salvo deixa muito
  fácil. O que precisa é só de **um espaço para ele ir**; deixar dinâmico, **hordas
  sobre hordas**, é muito bom, principalmente para os últimos níveis."
- (Com hordas sobre hordas) "Tá muito difícil agora, kkkkk. Tenta **equilibrar** de
  algum jeito."

---

## 2. O fluxo

```
VILA ─ lagoa, com Dive na equipe ─► "Quer usar Dive?" ─ SIM
  └─► A DESCIDA (Rota 126): Nível 1 ─► 2 ─► 3 (bolsão de ar) ─► 4
        │   ─► "Mais fundo..." ─► (Rota 127): Nível 5 ─► 6
        │   cada fim de nível: a animação obrigatória, nadando pela água de verdade
        │   perdeu as 3 bolhas ─► CENTRO POKÉMON (a enfermeira e o pescador)
        └─► passou o 6 ─► entrada submersa da Caverna Marinha ─► "Quer emergir?"
              └─► O SALÃO DO KYOGRE (andar em tiles) ─► falar com o Kyogre
                    └─► A LUTA (Bullet Heaven, 90+), com 3 Dive Balls
                          ├─ derrotou o Kyogre ─► superfície, pela lagoa
                          ├─ capturou ─► maré final de 30 s
                          │     ├─ sobreviveu ─► lagoa ─► A CENA (na frente da lagoa)
                          │     └─ perdeu ─► Centro, com o Kyogre ─► A CENA (no Centro)
                          └─ perdeu sem capturar ─► CENTRO POKÉMON

Depois de capturado: o salão vira a FASE ENDLESS AQUÁTICA (sem XP).
```

Padrão: cada mergulho começa do Nível 1. O recorde de profundidade fica guardado.

---

## 3. Só os tiles navegáveis do Emerald (a regra)

**Tudo o que o jogador pisa, na descida e nas animações, é água navegável no
Emerald.** Ele nunca passa por cima da rocha submersa (as "montanhas" lilases),
nem por áreas que o jogo original não deixa alcançar.

**Como se sabe o que é navegável.** O `map.bin` de cada mapa guarda, em cada
tile, a colisão (bits 10-11) e a elevação (bits 12-15). Na água submersa do
Emerald, o fundo onde se nada tem **colisão 0 e elevação 3**. Um tile de elevação
0 aceita entrar de qualquer altura; por isso, na entrada da Caverna Marinha o
poço navegável é o 3×3 de colisão 0 em volta do ponto de emergir. O extrator
grava essa grade junto com cada mapa, e o jogo só usa tiles marcados nela.

**Os tabuleiros** são áreas de 10×6 em que **todos** os tiles são navegáveis,
procuradas em todos os mapas submersos. Só quatro mapas têm áreas assim (as Rotas
124, 125, 126 e 127). A descida usa duas, cada uma com os tabuleiros ligados por
água:

| Nível | Mapa | Onde (x, y no mapa) | Até o próximo |
|---|---|---|---|
| 1 | Rota 126 submersa | 49, 16 | 9 tiles nadando |
| 2 | Rota 126 submersa | 44, 26 | 80 tiles: um corredor longo |
| 3 | Rota 126 submersa | 36, 66 | 7 tiles, para a frente |
| 4 | Rota 126 submersa | 46, 66 | sai pelo corredor (17 tiles), "Mais fundo..." |
| 5 | Rota 127 submersa | 24, 52 | entra pelo vale (10 tiles); depois, 5 tiles para baixo |
| 6 | Rota 127 submersa | 26, 58 | desce pelo vale (14 tiles) até a Caverna Marinha |

A Rota 126 tem água aberta com algas. A Rota 127 é um vale fundo, com o chão
descendo em degraus mais escuros, e é onde a Caverna Marinha aparece no Emerald.
Isso combina com os dois níveis mais fundos.

**A conferência.** A maquete tem um teste que segue o mergulhador em todas as
animações entre os níveis: em 1.229 quadros, nenhum fora da água navegável. O
mesmo teste vai para o `smoke-test` do jogo.

---

## 4. A descida

**A tela.** Durante a partida, a tela mostra **exatamente o tabuleiro**: 10×6
tiles de água navegável de um mapa de verdade. Em cima: as 3 bolhas de vida, o
nível e a profundidade, e a barra de quantas hordas faltam. O fundo escurece um
pouco a cada nível.

**O jogador.** Anda em tiles como na vila (`game/Hub.js`), mas **o passo sai no
primeiro toque** (na vila, tocar numa direção nova só vira o jogador), porque cada
fração de segundo conta. Segurando, continua andando. **Não dá para correr**
(decisão do Fellipe; se ficar difícil demais, ele repensa): cada passo leva 0,27 s,
o passo da vila andando. Só anda dentro dos 10×6.

**O sprite.** No Emerald, o jogador submerso é um boneco azul-escuro sentado numa
sombra escura, que é o Pokémon (`object_events/pics/people/brendan/underwater.png`,
com a paleta `player_underwater.pal`). O Emerald só tem o Brendan e a May, então o
extrator pinta o **Red e a Leaf** com os 4 tons da paleta submersa e põe a mesma
sombra embaixo (a maquete já faz isso).

**A profundidade:** 10, 25, 45, 70, 100 e 140 m, um valor por nível.

---

## 5. As hordas

**O que é uma horda.** Um cardume de uma espécie, do tamanho da linha (10
Pokémon) ou da coluna (6), que entra por uma borda e atravessa o tabuleiro. Quem
estiver num tile quando ela passar perde uma bolha.

**O aviso.** Antes de cada horda, a linha (ou coluna) inteira fica marcada em tom
avermelhado, com setas no sentido em que ela vem e bolhas na borda de entrada. O
tempo entre o aviso e a horda entrar é o que **encurta a cada nível**.

| Nível | Aviso | Velocidade | Padrão novo | Hordas | Pokémon |
|---|---|---|---|---|---|
| 1 | 1,3 s | 9 | uma linha por vez (a próxima só depois da anterior) | 10 | **Kanto:** Magikarp, Goldeen, Horsea |
| 2 | 1,0 s | 10 | colunas; duas linhas ao mesmo tempo | 15 | **Kanto:** Shellder, Staryu, Tentacool, Krabby |
| 3 | 0,85 s | 11 | paredão: quatro linhas de uma vez, sobram duas | 18 | **Kanto:** Seel, Seadra, Kingler, Tentacruel, Seaking |
| 4 | 0,65 s | 12 | linha e coluna cruzadas | 22 | **misturado:** Cloyster, Starmie, Carvanha, Wailmer, Corphish, Clamperl |
| 5 | 0,55 s | 13 | em sequência na mesma linha; paredão de cinco, sobra uma (mais raro) | 26 | **Hoenn:** Sharpedo, Crawdaunt, Huntail, Gorebyss, Relicanth, Whiscash |
| 6 | 0,35 s | 15 | até três ao mesmo tempo; três colunas juntas | 32 | **Hoenn:** Wailord, Walrein, Sharpedo, Milotic, Relicanth |

A velocidade é em tiles por segundo. Na maquete, o Nível 1 dura ~40 s e os outros
~22 s cada. Estes números já são a segunda versão (2026-11-08): a primeira
ficou fácil demais na medição (abaixo) e foi endurecida.

**Nunca é impossível, e as hordas vêm umas sobre as outras** (as duas regras do
Fellipe). A horda nova não espera o jogador ficar a salvo: ela sai assim que o
tempo do nível manda, por cima das que ainda estão passando. O sorteio só a
aceita se o jogador tiver para onde ir:

1. **Do tile dele existe saída andando**, depois de 0,25 s de reação (mais 0,05 s
   de folga para os quadros de 17 ms): ou ficar parado, ou um caminho até um tile que
   fica livre até a horda passar. Os tiles do caminho também não podem ser pegos
   enquanto ele passa. No exemplo do Fellipe: se a fileira 2 é a única livre e a
   próxima horda cobre a 2, ela só sai se a 1 ou a 3 (ou outro tile alcançável)
   estiver livre a tempo.
2. **Se ele está fugindo de outra horda** (o tile dele vai ser pego), ele pode dar
   um passo para o lado antes de ver o aviso. Então a saída também tem que existir
   de cada vizinho, e esse passo não pode cair numa horda. Num tile seguro, ele não
   tem motivo para se mexer, e basta a regra 1.

Se nenhum padrão do nível cabe, o sorteio tenta hordas de uma linha em qualquer
fileira, coluna e sentido; se nem isso cabe, tenta de novo 0,1 s depois. Nada
fica escondido: no padrão "em sequência", a segunda horda mostra o aviso junto
com a primeira, e a fileira fica marcada até as duas passarem.

**A prova** (o endereço `#prova` da maquete) é um jogador perfeito que só enxerga
o que está na tela: a horda existe para ele a partir do aviso, mais o tempo de
reação. Ele anda, sem correr, com bolhas infinitas, 50 partidas por nível. Com
reação de 0,25 s, tomou **zero acertos em 12.300 hordas** (duas rodadas). A prova
também mede quantas hordas ficam ativas ao mesmo tempo:

| Nível | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Hordas ativas, em média | 0,9 | 2,7 | 4,4 | 4,2 | 5,5 | 5,7 |
| Duração do nível | 40 s | 21 s | 22 s | 23 s | 22 s | 22 s |

**Como se chegou a isso.** Antes das duas regras, o jogador perfeito com 0,2 s de
reação tomava 1 ou 2 acertos a cada 450 hordas no Nível 3, sempre nos paredões:
eram os momentos impossíveis que o Fellipe apontou. A primeira correção fazia a
horda nova esperar o jogador ficar a salvo, e o Fellipe achou fácil demais (uma
média de ~3 hordas ativas e níveis de ~40 s). O que segurava as hordas era a
regra do passo para o lado valendo sempre (71.517 tentativas rejeitadas numa
prova). Valendo só quando o jogador está fugindo, ela rejeita 129, e a prova
continua sem nenhum acerto. Esse teste vai para o `smoke-test` do jogo.

**O passo** é o do FireRed andando: 16 quadros por tile (3,75 tiles por segundo),
deslizando de um tile ao outro. Ele sai no primeiro toque (na vila, tocar numa
direção nova só vira o jogador), porque cada fração de segundo conta.

### A medição de tentativas (2026-11-08)

O endereço `#medir` da maquete joga a descida inteira com cinco perfis de jogador
automático. As regras são as do jogo: sem correr, 3 bolhas, o bolsão no Nível 3,
e sempre a partir do Nível 1. O jogador automático só enxerga uma horda depois
do seu tempo de reação e planeja o melhor caminho; nos dois últimos perfis, uma
parte dos passos sai para o lado errado, como um erro de comando. Cada linha soma
60 descidas.

**A primeira versão estava fácil demais.** Quem reagia em 0,25 s passava sempre.
Mudou para a versão de agora:
- menos tempo de aviso;
- hordas mais rápidas;
- o sorteio conta 0,2 s de reação (era 0,25 s), o que deixa os padrões mais
  apertados;
- dois padrões novos: o paredão de cinco linhas (sobra uma) e três colunas juntas;
- o Nível 1 mais curto.

**Uma correção na maquete.** Entre a versão sem corrida e a do passo corrigido, um
comentário mal posto engolia o fim do passo, e o mergulhador pulava um tile por
quadro. O Fellipe sentiu ("estava muito rápido"). As medições daquele intervalo
estavam erradas; as de baixo foram refeitas com o passo do FireRed andando (16
quadros por tile, 3,75 tiles por segundo).

**O equilíbrio** (o Fellipe achou a versão com hordas sobre hordas difícil
demais). O botão mais justo é o tempo de reação para o qual o sorteio **garante**
saída: com mais folga, os padrões ficam menos apertados sem diminuir as hordas.
Para medir isso entrou um perfil **típico**, mais parecido com uma pessoa: a
reação muda a cada horda (sorteada entre 0,25 e 0,45 s) e ele erra 3% dos passos.

| Saída garantida para | Típico | Reação de 0,35 s | 0,35 s, errando 5% | Reação de 0,5 s |
|---|---|---|---|---|
| 0,2 s | 2% (~60 tentativas) | 8% | 5% | 0% |
| 0,24 s | 5% (~20) | 32% | 5% | 0% |
| **0,25 s (a escolhida)** | **23% (~4)** | 90% | 50% | 0% |
| 0,27 s | 15% (~7) | 97% | 60% | 2% |

Cada célula é a parte das 60 descidas (sempre do Nível 1, sem correr, com o
bolsão no 3) que chegou até o fim; a margem de erro é de uns 10 pontos. Na
escolhida, o Nível 5 também ficou um pouco mais leve (aviso de 0,55 s, o paredão
de cinco mais raro), para os mais lentos chegarem ao 6.

**A escolhida, nível a nível** (quantos passam de cada nível, entre os que chegaram):

| Perfil | N1 | N2 | N3 | N4 | N5 | N6 |
|---|---|---|---|---|---|---|
| típico | 100% | 100% | 100% | 98% | 71% | 33% |
| reação de 0,35 s | 100% | 100% | 100% | 97% | 98% | 95% |
| reação de 0,5 s | 100% | 100% | 100% | 88% | 30% | 0% |

**O que dá para ler:**
- **O jogador típico precisa de umas 4 tentativas** para descer tudo. O Nível 6
  continua o paredão: ele passa dele 1 em cada 3 vezes.
- **Os níveis 1 a 4 aquecem; o 5 começa a cobrar e o 6 decide.**
- **Quem reage em 0,5 s não passa do 6**: é o "pouco tempo de reação" que o Fellipe
  pediu para o último nível.
- **O sorteio continua justo:** o jogador perfeito com 0,25 s de reação nunca é
  pego (a prova acima).
- O jogador automático planeja melhor que uma pessoa: os números servem para
  comparar níveis e mudanças, e o feel de verdade vem de o Fellipe jogar. Os
  botões, se precisar: o tempo de reação garantido (hoje 0,25 s), o aviso de cada
  nível, o intervalo entre as hordas ou a corrida (decisão do Fellipe).

**Os desenhos.** Cada Pokémon da horda é o **ícone de caixa da 3ª geração** (32×32,
dois quadros), virado para o lado em que a horda anda. Os de Kanto já estão em
`assets/pokemon/gen3/icons/`; os de Hoenn vêm do Pokemon All, reduzidos de 4x. Os
de Hoenn **só aparecem nas hordas**: não entram na Pokédex nem são capturados.
Cada tile do tabuleiro tem 32 px (o metatile do Emerald em 2x) e o ícone entra em
1x, ocupando um tile.

---

## 6. A animação entre os níveis

Obrigatória e sem pular:

1. "Nível N concluído!", e as hordas param.
2. O mergulhador **nada pelo caminho de verdade** até o próximo tabuleiro (a busca
   do caminho só passa por tiles navegáveis), e a câmera vai com ele. O passo é
   mais rápido nos corredores longos, para a animação ficar em 1,5 a 4 segundos.
3. Na troca de mapa (do Nível 4 para o 5), ele sai por um corredor da Rota 126,
   aparece "Mais fundo...", a tela escurece e ele entra pelo vale da Rota 127.
4. "Nível N · X m", e as hordas recomeçam.

**O bolsão de ar** fica na chegada ao **Nível 3**: bolhas grandes sobem, as 3
bolhas de vida enchem de novo e a caixa de texto diz "Parece que você encontrou um
bolsão de ar no caminho!".

**Depois do Nível 6**, ele desce pelo vale, a tela escurece e ele aparece no poço
da entrada submersa da Caverna Marinha (`Underwater_MarineCave`), nadando até o
ponto de emergir (o warp do Emerald, em 9,8): "Uma luz fraca vem lá de cima. Dá
para emergir." e "Quer emergir?".

---

## 7. As vidas e o resgate

- **3 bolhas de vida.** Cada horda que pega o jogador estoura uma. Depois de um
  acerto, ele pisca e fica intocável por 1 s (padrão).
- **O bolsão de ar** enche as 3 de novo, uma vez por mergulho, na chegada ao Nível 3.
- **Perdeu as 3:** a tela escurece e o jogador acorda no **Centro Pokémon** da vila,
  na frente da enfermeira, que conta que o pescador o pescou desmaiado (seção 11).
  O próximo mergulho começa do Nível 1.

---

## 8. A caverna do Kyogre

**O encontro e o card** (pedido do Fellipe, 2026-11-09: "ao passar do nível 6 eu
gostaria de uma animação, estilo encontro do Kyogre no Sapphire, e após o encontro
abre um card mostrando que é uma fase, assim como os cards do mapa da jornada, com
opção de jogar ou voltar para a vila"). **Aprovado** ("achei bom demais pelo artifact, vamos fazer isso mesmo"). A maquete "O Salão do Kyogre"
(https://claude.ai/artifact/SHbVCDRVhieNLQUaAJiACn) mostra a proposta:
1. **Emergir** no alto do `MarineCave_End` (o warp do Emerald, em 20,4), com a névoa
   horizontal do mapa original. O jogador anda pelo salão só pelos tiles de colisão 0.
2. **A margem do lago:** ao pisar nela, ele vai até a frente do Kyogre (9,26), olha
   para cima, e "Um Pokémon gigante dorme no fundo do salão...".
3. **O despertar, no estilo do Sapphire:** o chão treme, a tela pisca em branco
   três vezes e o Kyogre se acende a cada piscada.
4. **A aproximação e o grito, do Emerald** (`MarineCave_End_EventScript_Kyogre`):
   o Kyogre anda três tiles balançando (o affine `GoSouthStart`/`GoSouth`), o grito
   de encontro e a pausa de 40 quadros.
5. **A transição de batalha do Kyogre** (`B_TRANSITION_KYOGRE`): as marcas vermelhas
   pulsando sobre o preto (`kyogre_pt1.pal`, 58 quadros) e tomando a tela
   (`kyogre_pt2.pal`, 68 quadros).
6. **O card da fase**, o mesmo painel do mapa da jornada: o salão no banner, o
   Kyogre, Água e as fraquezas (Elétrico, Planta), "FASE SECRETA · Caverna
   Marinha", as 3 Dive Balls de 10%, a chuva e a maré final, o nível recomendado
   90, **Jogar** e **Voltar para a Vila**. A pergunta "Acordar o Kyogre?" sai: o card
   faz esse papel. Padrão: voltando, a próxima chance exige descer os 6 níveis de novo.

**O salão.** É o `MarineCave_End` do Emerald (27×30, tileset Cave), onde o Kyogre
fica no jogo original. O jogador anda em tiles, como na vila, só pelos tiles
navegáveis do mapa, até o Kyogre, que dorme no fundo.

**Falar com o Kyogre.** "Um Pokémon gigante dorme no fundo do salão...", e a
pergunta "Acordar o Kyogre? Nível recomendado: 90+". No SIM: o "!", o grito do
Kyogre (o 382 dos gritos do Pokemon All) e a luta.

**Depois de capturado:** o salão vira a **fase Endless aquática** (seção 10). Um
Kyogre por jornada.

---

## 9. A luta do Kyogre (Bullet Heaven)

**O pedido** (2026-11-09): "agora bora planejar o cenário da fase e o funcionamento
completo de captura e etc... Aí a gente depois disso constrói e leva tudo para o
jogo". O encontro e o card (seção 8) foram aprovados: "achei bom demais pelo
artifact, vamos fazer isso mesmo". O que segue é a proposta; **(padrão)** marca o
que o Fellipe ainda não decidiu.

**A maquete "A Luta do Kyogre"** (https://claude.ai/artifact/XQXbpMG67jd1E5hd4Kqq1x)
jogou o plano. O Fellipe (2026-11-09): "essa cura dele pós saída da Poké Ball eu
achei muito alta, acho legal subir a vida dele um pouco, mas bem pouco, e vamos dar
3 chances, 3 Dive Balls... e eu gostei do cenário, podemos construir assim mesmo".
Ficou: **3 Dive Balls**, a volta a **25%** depois da fuga (eram 40%) e o cenário
da maquete (o salão com o lago no meio e as 4 poças, com a chuva).

Já decidido antes: chuva o tempo todo, as Dive Balls de 10% por tentativa, a maré
final de 30 s depois da captura, perder depois de capturar fica com o Kyogre, nível
recomendado 90.

### O cenário: o salão do Kyogre

- **A arena é o próprio salão**, montada com o tileset `cave` do Emerald (o mesmo
  do `MarineCave_End` do encontro), num cenário novo do tipo `room` em
  `data/scenery.js`: o chão de areia da caverna, as paredes de rocha nas bordas e,
  **no meio, o lago do Kyogre**, maior que o do mapa (padrão: 2.400 × 1.600 px de
  arena, o lago com ~1/5 dela). Como em todas as arenas, o cenário é só chão
  desenhado: o treinador anda por cima do lago.
- **Poças menores** espalhadas pela arena (padrão: 4), de onde o Kyogre volta à
  tona (ver "O mergulho", abaixo).
- **A chuva do Emerald** (`graphics/weather/rain.png`) caindo por cima de tudo, a
  tela um pouco mais escura e, a cada trovão, um clarão.
- **A música** (padrão): a "Vs. Lendário" do FireRed, se o `render_music.py`
  conseguir tirá-la do Pokemon All; se não, a do Campeão.

### A linha do tempo da luta

1. **A maré (0:00 a 0:45):** a caverna se enche de hordas de Hoenn (as dos níveis
   5 e 6 da descida, no nível ~85), com elites de Sharpedo e Wailord. É o
   aquecimento: a equipe ganha níveis e o jogador sente a chuva.
2. **O Kyogre (0:45):** o lago ferve, o grito e a apresentação do chefe (o mesmo
   letreiro dos líderes: "KYOGRE · Pokémon lendário"). Ele sai do lago gigante
   (o maior chefe do jogo) e a luta é contra ele, com as hordas continuando por
   cima.
3. **A captura**, quando ele chega no vermelho (abaixo).
4. **O fim:** derrotado, capturado e a maré final, ou o desmaio (seção "O fim da
   luta").

Padrão de duração: ~4 minutos até o Kyogre cair, medido com o `balance.mjs` numa
equipe de nível 90.

### Os ataques do Kyogre

Todos com aviso no chão antes do dano, como os golpes que já existem:

| Ataque | O que faz | De onde vem no jogo |
|---|---|---|
| **Origin Pulse** | três anéis de onda saindo dele, um atrás do outro | o `nova` dos chefes (`boss_shockwave`), em sequência |
| **Water Spout** | 6 a 10 colunas d'água caem em volta do treinador, depois de um círculo de aviso. Como no jogo original, **é mais forte quanto mais vida ele tem** | o `rain` (Hail, Bolt Strike) virado contra o jogador |
| **Thunder** | raios caem perto do treinador; **na chuva, sempre acertam o lugar marcado** (como no jogo original) | o `rain`, com o raio |
| **Chamar a horda** | traz Sharpedo, Carvanha e Wailmer em volta dele | o `summons` dos chefes |
| **O mergulho** | ele afunda no lago (não leva dano) e volta à tona numa das poças, com uma onda de choque na saída. A poça escolhida borbulha 1 s antes | novo, simples: some e aparece |

**As fases de vida:**
- **acima de 50%:** Origin Pulse, Water Spout e a horda;
- **abaixo de 50%:** entra o Thunder e o mergulho, e ele fica mais rápido;
- **abaixo de 20%:** fúria, como os líderes (o `enrage` que já existe): ataques
  mais densos.

**A chuva (Drizzle)** vale para todos: golpes de Água ×1,5 e de Fogo ×0,5,
inclusive os da equipe. Uma equipe de Água sai ganhando, e uma de Fogo sofre,
como no jogo original. As fraquezas no card (Elétrico e Planta) são a dica.

### A captura: a Dive Ball (o método B), em detalhe

1. **O piso de vida:** enquanto houver Dive Ball, a vida do Kyogre **não passa de
   15%**. Chegando lá, ele fica **exausto**: para de atacar, boia de lado no lugar
   e a horda para de vir por 8 segundos.
2. **A Dive Ball** cai no campo, a uns 450 px do treinador, com uma seta na borda
   da tela apontando para ela. Ela usa a arte do FireRed.
3. **Pegar é jogar:** ao passar por cima, a bola voa em arco até o Kyogre, abre e
   o puxa para dentro (a animação da Poké Ball do FireRed). Tudo para enquanto a bola
   balança.
4. **Os 10%:** a bola balança até 3 vezes. Na falha, ela abre depois de 1, 2 ou 3
   balanços, como no jogo original: quanto mais balança, mais o coração aperta.
5. **Falhou:** ele escapa com um grito e uma onda de choque que empurra a horda e
   o treinador. Recupera **só um pouco, até 25%** (decisão do Fellipe; eram 40%), e
   a luta continua. No vermelho de novo, vem a próxima Dive Ball: **são 3 por luta**.
6. **Não pegou a bola nos 8 s:** ele se recupera até 25% do mesmo jeito, mas
   **a bola não conta como gasta** (padrão): volta na próxima exaustão.
7. **Sem Dive Balls:** o piso de vida sai, e o Kyogre pode ser derrotado.

Com 10% em cada uma das 3 bolas, capturar numa luta é ~27%. Errar não perde a luta: dá para
vencer, ganhar a recompensa e tentar a captura numa próxima descida.

### O fim da luta

- **Capturou:**
  - aparece a tela de captura com o Kyogre (a mesma das Poké Balls: com a equipe
    cheia, escolhe quem vai para o PC);
  - ele entra no **nível da equipe**, como os outros lendários;
  - entra na Pokédex (`registerSecret('kyogre')`: o "???" se revela).

  Começa **a maré final de 30 s**: um relógio na tela, o lago transborda e a
  caverna se enche de hordas em fúria, sem o Kyogre.
  - Sobreviveu: "A maré baixou.", a tela de vitória e a volta pela lagoa, com **a
    cena do Maxie** (seção 10).
  - Caiu: acorda no Centro **com o Kyogre**, e a cena acontece ali.
- **Derrotou sem capturar:** "O Kyogre afundou de volta no abismo. A água fica
  calma.", a tela de vitória e a volta pela lagoa. Ele volta a dormir no salão, e
  outra chance exige descer os 6 níveis de novo.
- **Caiu sem capturar:** acorda no Centro, com as falas da enfermeira e do pescador.
- **A recompensa** (padrão): **500 Shards** na primeira vez que vence a luta,
  capturando ou não. O Campeão paga 300. Rejogar não paga de novo, como nas
  outras fases.
- **O que fica:** como em toda fase, a equipe guarda os níveis e as melhorias que
  ganhou, vencendo ou não.

### O Kyogre na equipe

Ele fica **fora da Pokédex de Kanto**: entra como espécie especial (dex 382), sem
contar nas 151, como um lendário de outra região. Precisa:
- de uma entrada em `data/pokemon.js`;
- da tira animada do GIF da Gen 5 (já no Pokemon All);
- de ajustes no `check-data`;
- de um **kit de lendário** (`data/legendaries.js`), como as aves, o Mewtwo e o
  Mew:

  | | O kit (padrão) |
  |---|---|
  | **Golpe exclusivo** | Origin Pulse: anéis de onda que se abrem em volta dele, empurrando a horda |
  | **Golpe Desperto** | Water Spout: colunas d'água sobre a horda, mais fortes com a vida cheia |
  | **Melhorias de saída** | dano 2, recarga 1, área 1 (as mesmas das aves) |

  **No campo**, ele é grande, como as aves no `fieldScale`.

### O Kyogre na Pokédex (feito na 0.35)

Pedido do Fellipe: no fim da Pokédex fica um Pokémon misterioso, **"???"**, sem
silhueta e sem número. O jogador o vê desde o começo do jogo, sem saber que é o
Kyogre, e ele só se revela quando é capturado. Já está no jogo:
- `secret` em `data/regions.js`;
- `profile.pokedex.secret`, preenchido por `ProfileTracker.registerSecret('kyogre')`;
- fora da contagem das 151, e sem número também depois de revelado.

A captura (etapa D-5) só precisa chamar `registerSecret`.

### Como construir (as etapas D-3 a D-5, revistas)

- **D-3, o encontro:**
  - `tools/assets/dive.py` gera o salão, o Kyogre do mapa, a névoa e a transição;
  - a cena da maquete aprovada vai para `game/Dive.js` (depois do Nível 6);
  - o card da fase reaproveita o painel do mapa da jornada (`ui/lobby.js`).
- **D-4, a luta:**
  - o cenário `kyogre_hall` (o tileset `cave` do Emerald), a chuva e a música;
  - a fase `kyogre` em `data/stages.js`, fora da campanha, e o chefe em
    `data/enemies.js`;
  - os ataques novos em `systems/` (o mergulho, o piso de vida, a exaustão);
  - a Drizzle no cálculo de dano.
- **D-5, a captura:**
  - a Dive Ball no campo, o arremesso e os balanços;
  - a espécie e o kit do Kyogre, e a maré final;
  - os testes: a chance (10% em mil sorteios), o piso, a bola perdida e os fins da
    luta;
  - a medição com o `balance.mjs`.

---

## 10. Depois da captura

### A cena da história

Acontece **uma vez por jornada**, logo depois da captura:
- **na frente da lagoa**, se o jogador sobreviveu à maré final e voltou à superfície;
- **no Centro Pokémon**, se ele perdeu depois de capturar (depois das falas da
  enfermeira).

A sequência:
1. O Maxie chega correndo e para na frente do jogador, com o
   **"!"** na cabeça (o balão do Emerald, `field_effects/pics/emotion_exclamation.png`).
2. Ele fala, indignado: "Não acredito que cheguei tarde! Você capturou o lendário
   Kyogre! Não posso deixar que isso aconteça com os próximos..."
3. Ele joga uma Poké Ball e solta o **Crobat**. O Emerald tem essa
   animação pronta, a do golpe Voar fora da batalha: o corte de tela com o Pokémon
   na frente das listras (`field_effects/pics/field_move_streaks.png`) e o pássaro
   que desce (`field_effects/pics/bird.png`).
4. Ele diz: "A caminho do vulcão! O próximo lendário será meu!"
5. Ele vai embora: na frente da lagoa, o pássaro do Voar desce e o leva pelo céu.
   No Centro, ele sai correndo pela porta com o Crobat, porque nos jogos não dá
   para voar dentro de casa.

A maquete "Depois do Kyogre" mostra as duas versões, com a vila e o Centro do
jogo, o Maxie e o "!" do Emerald, o corte de tela com as listras (a faixa preta
fora de casa, a azul dentro) e o Crobat, e o pássaro do Voar.

É o gancho para a **continuação do jogo**: o vulcão aponta para o **Groudon**, o
lendário de Hoenn que faz par com o Kyogre.

**O NPC: o Maxie** (decisão do Fellipe), o líder da Equipe Magma, o homem do
vulcão e do Groudon. O sprite é o do Emerald (`object_events/pics/people/team_magma/maxie.png`,
paleta `npc_2`), no mesmo formato de 9 quadros de 16×32 do Red, e fica bem na vila.

**O Pokémon voador: o Crobat** (decisão do Fellipe), que o Maxie usa no Emerald.

### A fase Endless aquática

Depois da captura, falar com o lugar onde o Kyogre dormia abre uma **fase Endless
aquática**: a arena da caverna, com a chuva e as hordas de Água sem fim, **sem
ganho de XP**. Rende **Shards por chefe e elite** derrotado (decisão do Fellipe;
os valores ficam para a etapa de capricho, na escala dos chefes de hoje). O
recorde de tempo vai para o Cartão de Treinador (padrão). Fala (rascunho): "O
salão está quieto, mas as águas ainda se agitam. Enfrentar a maré sem fim?"

---

## 11. Os prêmios

**Os prêmios por nível da descida ficam para depois** (o Fellipe: "vamos bolar os
prêmios por nível mais tarde"). Uma ideia de partida, para quando chegar a hora:
- Shards por nível concluído (por exemplo 10, 15, 20, 30, 40 e 60: 175 numa descida
  completa de uns 5 minutos, perto do que rende rejogar fases);
- a primeira vez em cada profundidade pagando em dobro;
- o recorde de profundidade no Cartão de Treinador.

Já decidido: **o Kyogre** e os Shards de chefe da luta (na escala dos líderes), e
os **Shards por chefe e elite** no Endless aquático.

---

## 12. As falas (rascunho para o Fellipe ajustar)

**Enfermeira** (depois de perder na descida ou na luta):
> "Ah, você acordou! O pescador da lagoa trouxe você até aqui."
> "Disse que fisgou você desmaiado lá no fundo... e que foi o maior peixe da vida dele."

**Pescador** (uma vez, depois de um resgate):
> "Ô, peixão! Quase arrebentou a minha linha. Da próxima vez, avisa antes de afundar!"

**Pescador** (depois de capturar o Kyogre):
> "Então era ISSO que vivia lá embaixo?! E eu jogando minhoca..."

**O bolsão de ar:**
> "Parece que você encontrou um bolsão de ar no caminho!"

**A entrada da caverna:**
> "Uma luz fraca vem lá de cima. Dá para emergir." (pergunta: "Quer emergir?")

**O Kyogre dormindo:**
> "Um Pokémon gigante dorme no fundo do salão..." (pergunta: "Acordar o Kyogre?
> Nível recomendado: 90+")

**O fim da luta:** "O Kyogre afundou de volta no abismo. A água fica calma."; com a
captura: "A maré baixou."

**A cena** (as do Fellipe):
> "Não acredito que cheguei tarde! Você capturou o lendário Kyogre! Não posso
> deixar que isso aconteça com os próximos..."
> "A caminho do vulcão! O próximo lendário será meu!"

---

## 13. Como construir (esboço)

Cada etapa é entregável sozinha, com `npm test` e screenshots.

0. **Maquete jogável** (feita em 2026-11-08: o artifact "A Descida"): os 6
   tabuleiros nos mapas de verdade, as hordas, as bolhas, o bolsão, as animações
   pela água navegável, o resgate e a chegada à caverna. Na primeira versão, os
   tabuleiros ficavam numa faixa montada sobre a rocha lilás; o Fellipe barrou
   ("só os tiles navegáveis"), e ela foi refeita sobre os mapas.
1. **D-1 — Assets** (a parte da descida feita na 0.36: os mapas, a grade, o mergulhador e os ícones de Hoenn): um extrator `tools/assets/dive.py` que lê o decomp do
   Emerald (`D:\fellipe\Dev\pokeemerald`, pret/pokeemerald commit `731ad5b`, clone
   parcial) e gera:
   - as Rotas 126 e 127 submersas, recortadas na região usada, **com a grade do
     que é navegável**;
   - a entrada submersa e o salão da Caverna Marinha;
   - o Red e a Leaf submersos;
   - a arena da luta;
   - o NPC da cena, o balão de "!" e a animação de voo.

   Também traz do Pokemon All os ícones de Hoenn, a tira do Kyogre e o grito.
   Tudo registrado no `assets/PROVENIENCIA.md`.
2. **D-2 — A descida** (feita na 0.36, igual à maquete aprovada):
   - `game/Dive.js` (o tabuleiro, o passo, as hordas, as bolhas, as animações);
   - `data/dive.js` (os níveis, os tabuleiros, os padrões e as espécies:
     conteúdo, sem lógica);
   - o gatilho da lagoa e o resgate no Centro;
   - os testes de que toda horda sorteada tem saída e de que nenhum passo sai da
     água navegável.
3. **D-3 — A caverna:** o salão como um lugar da vila (o mesmo motor do
   `game/Hub.js`), o Kyogre e as falas.
4. **D-4 — A luta:**
   - a fase do Kyogre em `data/stages.js` e o chefe em `data/enemies.js`;
   - os ataques (de preferência com os comportamentos que já existem);
   - a chuva, as 3 Dive Balls e a maré final de 30 s;
   - a volta pela lagoa.
5. **D-5 — O Kyogre na equipe:** a espécie especial, o kit e o `check-data`; a captura
   chama `registerSecret('kyogre')` (o "???" da Pokédex já existe desde a 0.35).
6. **D-6 — A cena e o Endless:** a cena da história (na lagoa ou no Centro) e a
   fase Endless aquática sem XP.
7. **D-7 — Capricho:** os sons (o mergulho, a bolha que estoura, o alarme do
   aviso), as falas e os prêmios; medir a luta com o `balance.mjs` numa equipe
   de nível 90+.

---

## 14. Decisões em aberto

1. **Os prêmios por nível** da descida (seção 11): o Fellipe vai bolar mais tarde.
2. **O tempo de cada nível:** a segunda versão (seção 5) faz do Nível 6 uma barreira
   de reação. O ajuste fino vem de o Fellipe jogar a maquete; se ficar difícil
   demais, a corrida volta à mesa.
