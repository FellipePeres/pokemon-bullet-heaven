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
                    └─► A LUTA (Bullet Heaven, 90+), com 2 Dive Balls
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
| 1 | 1,5 s | 8 | uma linha por vez (a próxima só depois da anterior) | 12 | **Kanto:** Magikarp, Goldeen, Horsea |
| 2 | 1,2 s | 9 | colunas; duas linhas ao mesmo tempo | 15 | **Kanto:** Shellder, Staryu, Tentacool, Krabby |
| 3 | 1,0 s | 10 | paredão: quatro linhas de uma vez, sobram duas | 18 | **Kanto:** Seel, Seadra, Kingler, Tentacruel, Seaking |
| 4 | 0,8 s | 11 | linha e coluna cruzadas | 22 | **misturado:** Cloyster, Starmie, Carvanha, Wailmer, Corphish, Clamperl |
| 5 | 0,6 s | 12 | hordas em sequência na mesma linha | 26 | **Hoenn:** Sharpedo, Crawdaunt, Huntail, Gorebyss, Relicanth, Whiscash |
| 6 | 0,4 s | 14 | até três ao mesmo tempo, tudo misturado | 32 | **Hoenn:** Wailord, Walrein, Sharpedo, Milotic, Relicanth |

A velocidade é em tiles por segundo. Na maquete, o Nível 1 dura ~56 s e os outros
~27 s cada. Esses números são o ponto de partida, para acertar jogando.

**Sempre tem saída.** O sorteio só aceita uma horda (ou um grupo) se existir um
tile livre que o jogador alcança **andando**, já descontando 0,25 s de reação e
considerando as hordas que ainda estão passando. No Nível 6, isso quer dizer um
tile livre a 1 passo. O jogador automático da maquete (endereço `#bot`) passou os
6 níveis 6 vezes cada, sem nenhum acerto; e um jogador parado no Nível 3 tomou 15
acertos em 30 s.

### A medição de tentativas (2026-11-08)

O endereço `#medir` da maquete joga a descida inteira com cinco perfis de jogador
automático, 30 descidas cada (a tabela soma duas rodadas, 60 por perfil). As
regras são as do jogo: sem correr, 3 bolhas, o bolsão no Nível 3, e sempre a
partir do Nível 1. O jogador automático só enxerga uma horda depois do seu tempo
de reação e planeja o melhor caminho; nos dois últimos perfis, uma parte dos
passos sai para o lado errado, como um erro de comando.

| Perfil | Descidas completas | Tentativas por descida | Passam N1-N6 | Acertos por nível N1-N6 |
|---|---|---|---|---|
| reação de 0,25 s | 60/60 (100%) | ~1,0 | 100, 100, 100, 100, 100, 100% | 0; 0; 0; 0; 0; 0 |
| reação de 0,35 s | 51/60 (85%) | ~1,2 | 100, 100, 97, 100, 98, 89% | 0; 0; 0,3; 0,1; 0,2; 0,5 |
| reação de 0,5 s | 36/60 (60%) | ~1,7 | 100, 100, 100, 92, 87, 75% | 0; 0,1; 0,4; 0,3; 0,6; 0,7 |
| 0,35 s, errando 5% dos passos | 27/60 (45%) | ~2,2 | 100, 98, 95, 82, 78, 75% | 0; 0,5; 0,8; 0,5; 0,7; 0,6 |
| 0,5 s, errando 10% dos passos | 10/60 (17%) | ~6,0 | 100, 98, 86, 73, 49, 56% | 0; 0,7; 1,2; 0,7; 1,1; 0,7 |

**O que dá para ler:**
- **O tempo de reação puro quase não reprova.** Quem reage em 0,25 s passa sempre,
  e mesmo com 0,5 s passa 60% das descidas. O aviso não é a parte difícil para
  quem sempre escolhe o tile certo, porque o sorteio garante a saída e a horda
  ainda leva um tempo para atravessar até o jogador.
- **O que reprova é errar.** Com 5% dos passos errados, menos da metade completa;
  com 10%, só uma em seis. Para uma pessoa de verdade, que também lê errado e
  hesita, a descida deve ficar entre esses dois últimos perfis.
- **O Nível 1 e o 2 quase não tiram bolhas**, e o perigo começa no 3 (o paredão).
  Os níveis 4 a 6 são onde as descidas acabam, com o 5 e o 6 parecidos, porque o
  bolsão do Nível 3 enche as bolhas antes deles.
- O jogador automático é um modelo: ele planeja melhor que uma pessoa. Os números
  servem para comparar níveis e mudanças, e o feel de verdade vem de o Fellipe
  jogar.

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

Uma fase única, na arena da caverna (com os tiles do Emerald; padrão), com a
equipe de sempre. A força dos inimigos vem na escala do nível 90+; para comparar,
hoje o bot chega ao Campeão por volta do nível 74.

- **Chuva o tempo todo** (a habilidade Drizzle do Kyogre): os golpes de Água ficam
  mais fortes, os do jogador também, e os de Fogo mais fracos.
- **Os ataques do Kyogre:**
  - Origin Pulse: anéis de ondas que se abrem;
  - Water Spout: colunas d'água que caem depois de um aviso no chão;
  - Thunder: raios em corrente;
  - hordas de Pokémon de Água o tempo todo (os de Hoenn dos níveis 5 e 6).
- **Fases de vida:** abaixo de 50% e de 20%, ele fica mais rápido e os ataques
  ficam mais densos.

### A captura: a Dive Ball (o método B)

1. Com a vida do Kyogre no vermelho (padrão: 15%), ele fica **exausto** por uns
   8 segundos, e uma **Dive Ball** aparece no campo, longe do treinador.
2. O jogador vai até ela; pegar é jogar, e a bola voa até o Kyogre.
3. A captura tem **10% de chance**.
4. Se falhar, ele escapa, recupera vida (padrão: até 40%) e a luta continua.
   Quando ele volta ao vermelho, aparece a segunda Dive Ball: **2 por tentativa**.
   Com 10% em cada, a chance de capturar numa luta fica em ~19%.
5. Sem mais bolas, a luta segue até o fim, e o Kyogre pode ser derrotado.

A Dive Ball usa a arte do FireRed (`graphics/interface/ball/dive.png`).

### O fim da luta

- **O Kyogre derrotado:** ele afunda de volta no abismo, "A água fica calma.", a
  tela de vitória e o jogador volta à **superfície pela lagoa**. Sem captura, ele
  volta a dormir no salão, e outra chance exige descer os 6 níveis de novo.
- **O Kyogre capturado:** ele entra para a equipe (ou vai para o PC, se a equipe
  estiver cheia), e a luta **continua até o fim da fase**: sem o Kyogre, a caverna
  se enche com uma **maré final de 30 segundos** de hordas em fúria. Sobreviver
  fecha a fase, "A maré baixou.", e o jogador volta à superfície pela lagoa, onde
  acontece **a cena** (seção 10).
- **Perdeu depois de capturar:** acorda no Centro Pokémon, **com o Kyogre**, e a
  cena acontece ali.
- **Perdeu sem capturar:** acorda no Centro Pokémon, como na descida.

### O Kyogre na equipe

Ele fica **fora da Pokédex de Kanto**: entra como espécie especial (dex 382), sem
contar nas 151, como um lendário de outra região. Precisa:
- de uma entrada em `data/pokemon.js`;
- de um kit de lendário (`data/legendaries.js`) com um golpe exclusivo (padrão:
  Origin Pulse);
- da tira animada do GIF da Gen 5 (já no Pokemon All);
- de ajustes no `check-data` e nas contagens da Pokédex.

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
5. Ele sai voando.

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
1. **D-1 — Assets:** um extrator `tools/assets/dive.py` que lê o decomp do
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
2. **D-2 — A descida:**
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
   - a chuva, as 2 Dive Balls e a maré final de 30 s;
   - a volta pela lagoa.
5. **D-5 — O Kyogre na equipe:** a espécie especial, o kit, a Pokédex e o `check-data`.
6. **D-6 — A cena e o Endless:** a cena da história (na lagoa ou no Centro) e a
   fase Endless aquática sem XP.
7. **D-7 — Capricho:** os sons (o mergulho, a bolha que estoura, o alarme do
   aviso), as falas e os prêmios; medir a luta com o `balance.mjs` numa equipe
   de nível 90+.

---

## 14. Decisões em aberto

1. **Os prêmios por nível** da descida (seção 11): o Fellipe vai bolar mais tarde.
2. **O tempo de cada nível:** a medição (seção 5) diz que o perigo começa no Nível
   3 e que o erro pesa mais que a reação. O ajuste fino vem de o Fellipe jogar a
   maquete; se ficar difícil demais, a corrida volta à mesa.
