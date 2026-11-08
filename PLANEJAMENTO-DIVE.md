# PLANEJAMENTO — O modo aquático (a descida do Dive)

> Ideia do Fellipe (2026-11-08): com um Pokémon que sabe **Dive** na equipe, a
> lagoa da vila leva a um modo **diferente do Bullet Heaven**. O jogador desce
> montado no Pokémon, no estilo submerso do Emerald, e **desvia** de hordas de
> Pokémon aquáticos que atravessam a tela ocupando linhas inteiras de tiles. São
> **6 níveis de profundidade**, cada um mais difícil, e o 6º é muito difícil. Quem
> passa do 6º chega à **caverna do Kyogre**, e falar com ele abre uma fase de
> Bullet Heaven extremamente difícil (nível recomendado 90+), com chance de
> **capturar o Kyogre com uma Dive Ball**.
>
> **Status:** planejado, nada construído. A TM Dive e o golpe Dive existem desde a
> **0.34** (PLANEJAMENTO-LOBBY.md, seção 8); hoje o SIM da lagoa ainda diz "em
> breve". Onde o texto diz "**padrão**", é a escolha recomendada até o Fellipe
> decidir. As decisões em aberto estão na seção 12.
>
> **Maquete visual** (o fundo do mar do FireRed contra o do Emerald): o artifact
> privado "Fundo da Lagoa", https://claude.ai/artifact/WzWyZwbiZhLRox7na5T1VQ.

---

## 1. O pedido, nas palavras do Fellipe

- "O modo vai ser diferente do comum, em tiles do Emerald. O personagem anda em
  tiles, como na vila. Vai ser um espaço de **6 de altura e 10 de largura**."
- "Hordas de Pokémon aquáticos vão passar **ocupando linhas completas** dos tiles,
  e o objetivo vai ser o jogador desviar, enquanto está em cima do Pokémon em
  Dive, no estilo submerso do Emerald."
- "Ao encerrar um level, uma **pequena animação obrigatória** leva o jogador como
  se ele tivesse chegado em uma parte do mapa indo para frente, e essa parte
  mostra que dá para ir mais fundo ainda."
- "Teremos **6 níveis**, sendo o 6 muito difícil, pouco tempo de reação."
- "Caso ele complete o 6, ele pode submergir para a **caverna do Kyogre**, que tem
  no Emerald. Ao conversar com ele, vai ter uma fase de Bullet Heaven extremamente
  difícil, com **nível recomendado 90+**."
- "**3 bolhas de vida**, reseta no nível 3 de profundidade: *parece que encontrou
  um bolsão de ar no caminho*."
- "Caso morra, aparece no **Centro Pokémon** com a enfermeira falando algo cômico
  relacionando o pescador: o pescador disse que pescou você desmaiado."
- "Hordas até o nível 3 somente de **Kanto**, o 4 **misturado**, 5 e 6 somente
  **Hoenn**."
- "Captura vai ser o método **B, com Dive Ball**; a chance de captura é de **10%**."
- "Pós-captura, continua a luta até o fim da fase completa. Se ele perder durante a
  fase, volta para o Centro como se tivesse morrido na bolha. Se encerrar a luta
  matando o Kyogre, ela encerra de alguma maneira normal e o jogador volta para a
  superfície pelo lago; o mesmo caso ele capture e encerre."

---

## 2. O fluxo

```
VILA ─ lagoa, com Dive na equipe ─► "Quer usar Dive?" ─ SIM
  └─► A DESCIDA: Nível 1 ─► Nível 2 ─► Nível 3 (bolsão de ar) ─► 4 ─► 5 ─► 6
        │   cada fim de nível: a animação obrigatória para a frente e para baixo
        │   perdeu as 3 bolhas ─► CENTRO POKÉMON (a enfermeira e o pescador)
        └─► passou o 6 ─► entrada submersa da Caverna Marinha ─► "Quer emergir?"
              └─► O SALÃO DO KYOGRE (andar em tiles) ─► falar com o Kyogre
                    └─► A LUTA (Bullet Heaven, 90+)
                          ├─ venceu (Kyogre derrotado) ─► superfície, pela lagoa
                          ├─ capturou e terminou a fase ─► superfície, pela lagoa
                          └─ perdeu ─► CENTRO POKÉMON (como na descida)
```

Padrão: cada mergulho começa do Nível 1. O recorde de profundidade fica guardado.

---

## 3. A descida

**A tela.** Um tabuleiro de **10 tiles de largura por 6 de altura**, montado com
trechos de verdade dos mapas submersos do Emerald (tilesets General e Underwater).
Cada nível é um trecho diferente, e o fundo escurece a cada nível. Os 6 trechos
ficam lado a lado numa faixa de mapa só, e a animação entre os níveis é a câmera
correndo por ela (seção 5). Em volta do tabuleiro, a rocha lilás do Emerald faz a
moldura. No topo: as 3 bolhas de vida, o nível e a profundidade, e a barra de
quantas hordas faltam.

**O jogador.** Anda em tiles como na vila (`game/Hub.js`): um passo por toque, e
segurando a seta continua andando. Padrão: o passo da vila andando (0,27 s por
tile) e correndo com o botão de correr (0,13 s). O tabuleiro só deixa andar
dentro dos 10×6.

**O sprite.** No Emerald, o jogador submerso é um boneco azul-escuro sentado numa
sombra escura, que é o Pokémon (`object_events/pics/people/brendan/underwater.png`,
4 direções, com a paleta `player_underwater.pal`). O Emerald só tem o Brendan e a
May, então o extrator pinta o **Red e a Leaf** com a paleta submersa e põe a
mesma sombra embaixo.

**Os níveis e a profundidade** (padrão):

| Nível | Profundidade | O trecho |
|---|---|---|
| 1 | 10 m | fundo aberto, claro |
| 2 | 25 m | fundo com as primeiras algas |
| 3 | 45 m | fenda com algas (o bolsão de ar na chegada) |
| 4 | 70 m | fenda funda |
| 5 | 100 m | perto das paredes de rocha, mais escuro |
| 6 | 140 m | o mais escuro, já na boca da Caverna Marinha |

---

## 4. As hordas

**O que é uma horda.** Um cardume de Pokémon que entra por uma borda e atravessa
o tabuleiro até a outra, ocupando **uma linha inteira** (10 tiles) ou, a partir
do Nível 2, **uma coluna inteira** (6 tiles). Quem estiver num tile quando a
horda passar por ele perde uma bolha.

**O aviso.** Antes de cada horda, a borda de onde ela vem mostra bolhas e uma
sombra na linha (ou coluna) inteira. O tempo entre o aviso e a horda entrar é o
que **encurta a cada nível**: é ele que faz o Nível 6 ter pouco tempo de reação.

**Os padrões.** Cada nível traz um novo e mantém os anteriores:

| Nível | Aviso | Padrão novo | Hordas no nível | Pokémon |
|---|---|---|---|---|
| 1 | 1,5 s | uma linha por vez | 12 | **Kanto:** Magikarp, Goldeen, Horsea |
| 2 | 1,2 s | colunas; duas linhas ao mesmo tempo | 15 | **Kanto:** Shellder, Staryu, Tentacool, Krabby |
| 3 | 1,0 s | linha com um só tile livre (passa só por ali) | 18 | **Kanto:** Seel, Seadra, Kingler, Tentacruel, Seaking |
| 4 | 0,8 s | linha e coluna cruzadas | 22 | **misturado:** Cloyster, Starmie, Carvanha, Wailmer, Corphish, Clamperl |
| 5 | 0,6 s | hordas em sequência na mesma linha | 26 | **Hoenn:** Sharpedo, Crawdaunt, Huntail, Gorebyss, Relicanth, Whiscash |
| 6 | 0,4 s | até três ao mesmo tempo, tudo misturado | 32 | **Hoenn:** Wailord, Walrein, Sharpedo, Milotic, Relicanth |

Os números são o ponto de partida: o tempo de cada nível só se acerta jogando
(seção 11, a maquete jogável).

**Sempre tem saída.** O sorteio só aceita uma horda (ou um grupo de hordas) se
existir um tile livre que o jogador alcança antes dela, **andando**, de onde ele
está. No Nível 6, com 0,4 s de aviso, isso quer dizer um tile livre a 1 passo (ou
até 3, correndo). Um teste confere isso para milhares de sorteios.

**Os desenhos.** Cada Pokémon da horda é o **ícone de caixa da 3ª geração** (32×32,
dois quadros, que já parecem nadar), virado para o lado em que a horda anda. Os
de Kanto já estão em `assets/pokemon/gen3/icons/`; os de Hoenn vêm do Pokemon All
(`assets/pokemon/gen3/icons/<dex>.png`, reduzidos de 4x, como os de Kanto). Os de
Hoenn **só aparecem nas hordas**: não entram na Pokédex nem podem ser capturados.

**Uma questão de escala.** O ícone tem 32 px e o metatile do Emerald tem 16. Padrão:
cada tile do tabuleiro tem 32 px (o metatile em 2x), e o ícone entra em 1x,
ocupando um tile. A maquete mostra se a diferença de densidade de pixel incomoda.

---

## 5. A animação entre os níveis

Obrigatória, uns 3 segundos, sem pular:

1. As hordas param e o tabuleiro fica livre.
2. A câmera corre para a frente pela faixa de mapa até o trecho seguinte, onde
   aparece uma fenda que desce.
3. O jogador vai até a beira e desce; o fundo escurece.
4. Aparece "Nível 2 · 25 m", e as hordas recomeçam.

Na chegada ao **Nível 3**, a animação passa por um **bolsão de ar**: bolhas
grandes sobem, as 3 bolhas de vida enchem de novo, e a caixa de texto diz
"Parece que você encontrou um bolsão de ar no caminho!".

Depois do **Nível 6**, a animação leva à entrada submersa da Caverna Marinha
(`Underwater_MarineCave`, 20×10 no Emerald) e pergunta "Quer emergir?".

---

## 6. As vidas e o resgate

- **3 bolhas de vida.** Cada horda que pega o jogador estoura uma. Depois de um
  acerto, ele pisca e fica intocável por um instante (padrão: 1 s).
- **O bolsão de ar** enche as 3 de novo, uma vez por mergulho, na chegada ao Nível 3.
- **Perdeu as 3:** a tela escurece e o jogador acorda no **Centro Pokémon** da vila,
  na frente da enfermeira, que conta que o pescador o pescou desmaiado (seção 10).
  O próximo mergulho começa do Nível 1.

---

## 7. A caverna do Kyogre

**O salão.** É o `MarineCave_End` do Emerald (27×30, tileset Cave), onde o Kyogre
fica no jogo original. O jogador anda em tiles, como na vila, até o Kyogre, que
dorme no fundo do salão.

**Falar com o Kyogre.** "Um Pokémon gigante dorme no fundo do salão...", e a
pergunta "Acordar o Kyogre? Nível recomendado: 90+". No SIM: o "!", o grito do
Kyogre (o 382 dos gritos do Pokemon All) e a luta.

**Depois de capturado** (padrão): o salão fica vazio, um Kyogre por jornada. A
descida continua valendo pelo recorde e pelos prêmios (seção 9).

---

## 8. A luta do Kyogre (Bullet Heaven)

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
4. Se falhar, ele escapa, recupera vida (padrão: até 40%) e a luta continua. A
   cada volta ao vermelho aparece outra Dive Ball, até **3 por luta** (padrão).
   Com 10% em cada, a chance de capturar numa luta fica em ~27%.
5. Sem mais bolas, a luta segue até o fim, e o Kyogre pode ser derrotado.

A Dive Ball usa a arte do FireRed (`graphics/interface/ball/dive.png`).

### O fim da luta

- **O Kyogre derrotado:** ele afunda de volta no abismo, "A água fica calma.", a
  tela de vitória e o jogador volta à **superfície pela lagoa**. Sem captura, ele
  volta a dormir no salão, e outra chance exige descer os 6 níveis de novo.
- **O Kyogre capturado:** ele entra para a equipe (ou vai para o PC, se a equipe
  estiver cheia), e a luta **continua até o fim da fase**. Padrão do que é esse
  fim: sem o Kyogre, a caverna se enche com uma **maré final** de 60 segundos de
  hordas em fúria; sobreviver fecha a fase, "A maré baixou.", e o jogador volta à
  superfície pela lagoa.
- **Perdeu** (antes ou depois da captura): acorda no Centro Pokémon, como na
  descida. Padrão: o Kyogre capturado **fica** com o jogador, como as capturas de
  uma fase perdida já ficam hoje.

### O Kyogre na equipe

Ele fica **fora da Pokédex de Kanto**: entra como espécie especial (dex 382), sem
contar nas 151, como um lendário de outra região. Precisa:
- de uma entrada em `data/pokemon.js`;
- de um kit de lendário (`data/legendaries.js`) com um golpe exclusivo (padrão:
  Origin Pulse);
- da tira animada do GIF da Gen 5 (já no Pokemon All);
- de ajustes no `check-data` e nas contagens da Pokédex.

---

## 9. Os prêmios (padrão)

- **Shards por nível concluído** na descida: 10, 15, 20, 30, 40 e 60 (175 numa
  descida completa de uns 5 minutos, perto do que rende rejogar fases).
- **A primeira vez em cada profundidade** paga em dobro.
- **O recorde de profundidade** vai para o Cartão de Treinador.
- **O Kyogre** e os Shards de chefe da luta (na escala dos líderes).

---

## 10. As falas (rascunho para o Fellipe ajustar)

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

---

## 11. Como construir (esboço)

Cada etapa é entregável sozinha, com `npm test` e screenshots.

0. **Maquete jogável** (artifact, fora do jogo): o tabuleiro 10×6 com os tiles do
   Emerald, as hordas dos 6 níveis, as bolhas de vida e o bolsão de ar, para
   acertar o tempo de aviso de cada nível jogando.
1. **D-1 — Assets:** um extrator `tools/assets/dive.py` que lê o decomp do
   Emerald (`D:\fellipe\Dev\pokeemerald`, pret/pokeemerald commit `731ad5b`, clone
   parcial) e gera:
   - os 6 trechos da descida;
   - a entrada submersa e o salão da Caverna Marinha;
   - o Red e a Leaf submersos;
   - a arena da luta.

   Também traz do Pokemon All os ícones de Hoenn, a tira do Kyogre e o grito.
   Tudo registrado no `assets/PROVENIENCIA.md`.
2. **D-2 — A descida:**
   - `game/Dive.js` (o tabuleiro, o passo, as hordas, as bolhas, a animação);
   - `data/dive.js` (os níveis, os padrões e as espécies: conteúdo, sem lógica);
   - o gatilho da lagoa;
   - o resgate no Centro;
   - o teste de que toda horda sorteada tem saída.
3. **D-3 — A caverna:** o salão como um lugar da vila (o mesmo motor do
   `game/Hub.js`), o Kyogre e as falas.
4. **D-4 — A luta:**
   - a fase do Kyogre em `data/stages.js` e o chefe em `data/enemies.js`;
   - os ataques (de preferência com os comportamentos que já existem);
   - a chuva;
   - a Dive Ball e a maré final;
   - a volta pela lagoa.
5. **D-5 — O Kyogre na equipe:** a espécie especial, o kit, a Pokédex e o `check-data`.
6. **D-6 — Capricho:** os sons (o mergulho, a bolha que estoura, o alarme do
   aviso), as falas e os prêmios; medir a luta com o `balance.mjs` numa equipe
   de nível 90+.

---

## 12. Decisões em aberto

1. **O bolsão de ar:** na chegada ao Nível 3 (a leitura deste plano) ou depois de
   terminar o 3 (metade da descida: 3 níveis com as primeiras bolhas, 3 com as novas)?
2. **Quantas Dive Balls por luta:** 3 (padrão) ou uma só?
3. **O fim da fase depois da captura:** a maré final de 60 s (padrão) ou outra coisa?
4. **Perder depois de capturar:** o Kyogre fica (padrão, como as capturas de hoje)
   ou só vale se terminar a fase?
5. **Depois de capturado:** o salão fica vazio (padrão) ou a luta continua
   disponível, só pelos Shards?
6. **Correr na descida:** vale correr (padrão) ou só andar?
7. **Os prêmios** da seção 9.
