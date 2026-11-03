# PLANEJAMENTO — Pokémon Bullet Heaven

> Roteiro do que vem depois da `0.4.0`, combinado com o Fellipe em **2026-11-02**.
> O `HANDOFF.md` descreve o que **existe**; este arquivo descreve o que **vem**,
> em que ordem e por quê. Atualize o status das etapas conforme elas fecham.

---

## 1. O pedido

- Completar as fases que faltam, da Fase 3 (Lt. Surge) à Elite Four e ao Campeão,
  com **dificuldade e quantidade de inimigos subindo fase a fase**.
- **Sprites nos golpes**: cada golpe com a animação dele, e não uma bolinha colorida.
- **Escolha de treinador no começo**: Menino ou Menina, em cards clicáveis com o
  modelo de cada um.
- **Tudo ambientado com sprites**: treinador andando, Pokémon animados, cenário de
  verdade e golpes.
- **Outras regiões em breve.** A estrutura tem que nascer preparada para elas.

**O movimento continua livre**, em qualquer ângulo, como hoje. Nada de andar por
quadrados como no FireRed: o FireRed entra **só no visual** (cenário, sprites,
golpes). O sprite do treinador tem 4 poses, e na diagonal a pose atual continua
se fizer parte do movimento; senão, ele fica de lado. A `vitrine.html` mostra as
8 direções.

## 2. Onde estamos (0.4.0)

| Área | Hoje |
|---|---|
| Fases | 1 e 2 jogáveis; 3 a 9 e o Campeão só aparecem no mapa como "em breve" |
| Pokémon em campo | PNG parado baixado da PokeAPI; a única animação é um balanço de 2 px |
| Treinador | desenhado à mão no canvas, só vira para esquerda e direita |
| Cenário | textura de manchas por tema, sem nenhum objeto; a troca de trecho é um corte seco |
| Golpes | 57 golpes em 7 desenhos genéricos (bolinha, arco, círculo, anel, linha reta); só a cor muda |
| Som | nenhum |

---

## 3. De onde vêm os assets: o Pokemon All

`D:\fellipe\Dev\Pokemon All` é o Pokémon Hunt (repositório privado, do Fellipe com
o Braga). A pasta `extracted/` guarda matéria-prima com a procedência registrada em
`extracted/README.md`, principalmente o decomp **pret/pokefirered** (commit `c75f352`).

| Precisamos de | Onde está (dentro de `Pokemon All/`) | Formato |
|---|---|---|
| Treinador andando: Menino (Red) e Menina (Leaf) | `extracted/pokefirered/graphics/object_events/pics/people/red_normal.png` e `green_normal.png` (no decomp a Leaf se chama "green"); os quadros de correr são o 3 ao 13 de `*_surf_run.png`; as cores estão em `object_events/palettes/player.pal` | 9 quadros de 16×32: 0 baixo, 1 cima, 2 esquerda (a direita é o espelho), 3-4, 5-6 e 7-8 são os passos |
| Retrato do treinador (tela de escolha) | `graphics/trainers/front_pics/red_front_pic.png` e `leaf_front_pic.png` | 64×64 |
| Retratos dos líderes, da Elite Four, do rival e do Oak | `graphics/trainers/front_pics/leader_*`, `elite_four_*`, `champion_rival_*`, `professor_oak_*` | 64×64 |
| Caixa de texto do jogo | `graphics/text_window/type2.png` + `stdpal_0.pal` | moldura 24×24 |
| Sprites de golpe | `graphics/battle_anims/sprites/`: 279 gráficos (small_ember, fire, water_orb, bubble, razor_leaf, vine, rocks, lightning, spark, ice_crystals, poison_bubble, music_notes, claw_slash, punch_impact, explosion, shadow_ball, bone…) | tiras de quadros de 16, 32 ou 64 px |
| Qual sprite cada golpe usa | `data/battle_anim_scripts.s`: o `loadspritegfx` de cada golpe (Ember usa `SMALL_EMBER`; Thunderbolt usa `SPARK`, `SHOCK_3` e `SPARK_2`) | texto |
| Cenário | `data/tilesets/`: o primário `general` + um secundário por lugar (`viridian_forest`, `cave`, `rock_tunnel`, `pokemon_tower`, `power_plant`, `seafoam_islands`, `pokemon_mansion`, `pokemon_league`, e um por ginásio: `pewter_gym` … `viridian_gym`) | tiles 8×8, metatiles 16×16 e `.pal` |
| Pokémon animados | `assets/pokemon/battle/front/<dex>.gif`: GIFs da Gen 5, os 151 de Kanto presentes (Pikachu: 60×60, 33 quadros). É a mesma arte que a interface já usa, só que local | GIF |
| Selvagens de cada rota, com nível | `extracted/pokefirered/data/wild_encounters.json` | JSON |
| Times dos líderes, com nível | `extracted/pokefirered/data/trainer_parties.h` | C |
| Som | `assets/sound/cries/` (386 gritos), `assets/sound/se/` (255 efeitos), `assets/sound/music/` (ginásio, batalha contra líder, vitória) | OGG |

**Regras de uso**

1. **O Pokemon All é só leitura.** É um projeto a dois, com protocolo próprio
   (`AVISOS.md`), e nada do trabalho daqui grava lá.
2. **O extrator é nosso.** `tools/assets/`, em Python + Pillow, recebe o caminho do
   Pokemon All e gera PNG e JSON em `assets/`, mais o catálogo `src/data/assetManifest.js`.
   Os arquivos gerados são commitados: o jogo continua sem build e sem dependências,
   e o Python só serve para regenerar assets.
3. **Procedência anotada** em `assets/PROVENIENCIA.md` (fonte, commit, script),
   como o Pokemon All faz.
4. **A cor certa nem sempre está no PNG.** Pokémon e sprites de andar trazem uma
   paleta provisória, e as cores de verdade estão num `.pal` separado. Alguns
   gráficos de golpe usam a do próprio PNG. O extrator segue a regra do build do
   jogo, e o índice 0 é transparente: recortar pelo **índice**, nunca pela cor
   (armadilha documentada no `extracted/README.md` de lá). A vitrine confere.
5. **Pixel art em escala inteira**, sem suavização. Uma escala vale para o mundo
   inteiro, provavelmente 2× (tile de 32 px, treinador de 32×64), decidida olhando
   a vitrine.
6. **Licença.** É arte da Nintendo / Game Freak, da mesma natureza dos sprites da
   PokeAPI que já usamos. O projeto continua de fã e sem fins lucrativos, com o
   aviso do README. O logotipo do FireRed (`reference-only/`) não entra.

---

## 4. As etapas

Cada etapa fecha com `npm test` passando, screenshot da vitrine conferido e uma
partida jogada pelo Fellipe. Há um commit local por etapa. **Push na `main` só
quando o Fellipe mandar**, porque o push publica o jogo.

| # | Etapa | Versão | Status |
|---|---|---|---|
| 0 | Fundação: extrator, carregador, vitrine e estrutura por região | 0.5 | ✅ feita (2026-11-02) |
| 1 | Treinador: Menino ou Menina | 0.5 | 🟡 feita; falta a partida do Fellipe |
| 2 | Golpes com sprite (e no máximo 4 por tipo) | 0.6 | ✅ feita (2026-11-02) |
| 3 | Pokémon animados e cenário de tiles | 0.7 → 0.8 | ✅ feita (2026-11-02): Pokémon animados na 0.7, cenário de tiles na 0.8 |
| 4 | Fases 3 a 8, Elite Four e Campeão | 0.7 | ✅ feita (2026-11-02); falta só os lendários como encontros especiais |
| 5 | Som | 1.0 | ⏳ |
| 6 | Acabamento: opções salvas, controle, celular, desempenho, assets locais | 0.6 → 1.0 | 🔶 opções, desempenho e controle feitos; faltam celular e assets locais |
| 7 | Final da jornada: Hall da Fama e créditos | 0.7 | ✅ feita (2026-11-02); o pós-jogo (D9) fica para depois |
| 8 | Outras regiões | 1.x | ⏳ |

Kanto completo (a 1.0) é o fim das etapas 2 a 7. Os itens pequenos da Etapa 6
(opções salvas, controle) podem entrar antes, junto de qualquer outra etapa.

### Etapa 0 — Fundação

Vem antes de qualquer sprite, para nada ter que ser refeito depois.

- **Extrator** `tools/assets/extract.py`, conforme as regras 2 a 4 acima.
- **Carregador** `src/render/assets.js`: carrega as folhas do catálogo e devolve o
  quadro certo para um tempo `t`. Se o arquivo faltar, cai no desenho de hoje. No
  Node não carrega nada, então `npm test` continua rodando sem navegador.
- **Vitrine** (`vitrine.html`): uma cena fixa desenhada pelo mesmo código da
  partida. Na 0.5 mostra treinadores, 8 direções, proporção e retratos; cada
  etapa acrescenta o dela (golpes, Pokémon, temas de cenário). A variante de
  estresse com 250 inimigos para medir o FPS entra com os golpes, na Etapa 2.
  O screenshot sai do `tools/screenshot.mjs`, que dirige o Chrome sem janela
  (roteiros `vitrine`, `treinador`, `jornada`, `partida`) e lista os erros de
  JavaScript da página. É assim que o visual passa a ser conferido antes de
  chegar ao Fellipe, coisa que até então não acontecia.
- **Estrutura por região**, só em dados e sem conteúdo novo. `src/data/regions.js`
  tem `kanto: { nome, faixa da Pokédex, campanha, iniciais }`, e o progresso do
  perfil passa a ser guardado por região (`profile.regions.kanto`: fases
  concluídas, insígnias e jornada). O `normalizeProfile` migra sozinho do
  `profile.campaign` de hoje, então save antigo continua abrindo.
- **`npm run check` ganha conferências novas**: na 0.5, todo arquivo do catálogo
  existe, todo modelo de treinador tem folha e retrato, e toda região tem
  iniciais, fases e retratos válidos. Com as próximas etapas vêm: todo golpe
  aponta para um efeito que existe, toda espécie tem sprite e todo tema de
  trecho tem tiles.

### Etapa 1 — Treinador: Menino ou Menina

- **Tela nova antes da escolha do inicial**: dois cards clicáveis com o retrato
  grande (64×64 em 3×) e o sprite andando em loop (correndo ao passar o mouse).
  Para ambientar, como no FireRed, o Prof. Carvalho pergunta "Você é menino ou
  menina?" na caixa de texto do jogo.
- **Modelos de treinador são dado.** `src/data/trainers.js` tem `red` e `leaf`, com
  nome, sprites e retrato. Uma região nova acrescenta os dela (Brendan e May, por
  exemplo) sem código novo.
- A escolha fica em `profile.trainer` e pode ser trocada em Opções.
- **No jogo**, o sprite substitui o desenho à mão do `Renderer._drawTrainer`:
  quatro direções, passo pela distância andada e quadro parado virado para onde
  andou. Na velocidade do jogo (195 px/s) ele **corre**: em 2×, o FireRed anda a
  120 px/s e corre a 240, então 195 já é corrida. Para vê-lo andando, suba
  `CONFIG.trainer.animation.runAt`. O anel do raio de coleta continua.
- O retrato aparece no mapa da jornada (feito, com os retratos dos líderes e a
  silhueta dos próximos) e no resultado da fase (fica para a Etapa 4, junto com a
  apresentação do líder).

### Etapa 2 — Golpes com sprite

**Feita na 0.6**, com uma mudança pedida no meio: **no máximo 4 golpes por tipo**,
reaproveitados pelas espécies, para o jogo ficar leve. Saíram 12 golpes (Fire
Ring, Flame Wheel, Whirlpool, Bubble, Splash, Leech Field, Petal Dance, Sing,
Flail, Air Cutter, Drill Peck, Acid) e entraram 10 dos tipos novos (Mud-Slap,
Bone Club, Lick, Night Shade, Shadow Ball, Twister, Dragon Breath, Outrage,
Powder Snow, Blizzard). O visual de cada golpe ficou em `data/fx.js`, e não em
`abilities.js`, para trocar sprite sem mexer em balanceamento. Medido: 60 FPS e
~2 ms por quadro com 245 inimigos.

O plano original, para referência:


- Cada golpe ganha um campo `vfx` em `abilities.js`, que aponta para efeitos de um
  catálogo em `src/data/fx.js` (folha, tamanho do quadro, quantidade, velocidade,
  e se gira no sentido do voo).
- **O sprite de cada golpe vem do próprio FireRed**: o `battle_anim_scripts.s` diz
  quais gráficos a animação do golpe carrega. Golpe que não existe no FireRed
  (Fire Ring, Leech Field…) usa o do golpe mais parecido do mesmo tipo.
- **O renderer desenha de acordo com o comportamento do golpe**:
  - projétil: o sprite gira no sentido do voo (Ember, Razor Leaf, Rock Throw);
  - órbita: o sprite gira em volta do Pokémon (Flame Wheel, Petal Dance);
  - aura e zona: sprites ao longo da borda (chamas, bolhas de veneno, raízes);
  - onda: sprites na frente da onda (Gust; no Earthquake, terra voando);
  - corrente: raio em zigue-zague, com faíscas em cada alvo (Thunderbolt);
  - corpo a corpo: o golpe aparece no alvo (garra, mordida, a mão do Karate Chop).
- **Resposta ao acerto**:
  - sprite de impacto no inimigo, com um teto por quadro;
  - ícone de status em cima do inimigo (queimadura, veneno, lentidão);
  - tremor leve de tela em explosões, no Earthquake e no chefe, que dá para
    desligar em Opções;
  - **aviso no chão antes do golpe do líder**: hoje ele acerta sem dar chance de
    reação.
- Os golpes das fases novas (Fantasma, Gelo, Dragão, Terra) já nascem com sprite.

### Etapa 3 — Pokémon animados e cenário de tiles

**Pokémon**

- O extrator transforma os GIFs da Gen 5 em folhas de quadros para os 151 de Kanto
  (o Pillow lê cada quadro e quanto tempo ele dura). Cada Pokémon começa a animação
  num ponto diferente, para a horda não se mexer em sincronia.
- **O corpo também reage**:
  - avanço curto ao atacar;
  - achatamento ao levar golpe;
  - desmaio encolhendo e sumindo;
  - **entrada saindo da Poké Ball** na troca;
  - efeito de captura.

  Os dois últimos eram pendências antigas de polimento.
- Cada fase carrega só as espécies dela, as da equipe e as da tabela de captura.

**Cenário**

- O extrator monta folhas de metatiles por tema a partir dos tilesets: chão, grama
  alta, flores (animadas, como no jogo), árvores, pedras, caminho e água.
- A arena é montada com esses tiles a cada partida, a partir de uma semente fixa
  por fase, e desenhada antes em blocos fora da tela para não pesar.
- **Cada trecho usa o tileset do lugar**: Rota 1 e 2 usam `general`, a Floresta usa
  `viridian_forest`, o Monte Lua usa `cave` e cada ginásio usa o dele. A troca de
  trecho vira uma transição suave.
- A borda da arena vira uma fileira de árvores, como as bordas das rotas, no lugar
  do traço preto.

**Como ficou (0.8)**

- O extrator tira, de cada mapa usado, só as metatiles que ele tem (uma tira de
  16x16 por mapa, ~70 KB ao todo) e, nos salões, o próprio mapa. 17 cenários:
  `route` (Rota 1), `forest` (Floresta de Viridian), `cave` (Monte Lua), os 8
  ginásios, as salas da Lorelei, do Bruno, da Agatha, do Lance e do Campeão, e o
  corredor da Liga. Receitas em `src/data/scenery.js`; gerador em `render/scenery.js`.
- **Rota, floresta e caverna são geradas** com as regras do FireRed: as árvores
  juntam as metades conforme o vizinho (como na Rota 1), a mata fecha a borda com
  duas árvores de espessura, os caminhos de areia são retas que não se cruzam (o
  tileset não tem os cantos de dentro para curvas), e a caverna tem paredões,
  crateras e as paredes do Monte Lua em volta.
- **Os salões são recortados do mapa de verdade**: a parede do alto com a porta no
  meio, as laterais, o piso repetido, o enfeite principal no centro (a pedra do
  Brock, a piscina da Misty, o campo de batalha da Liga, o emblema do Campeão) e
  outros enfeites espalhados numa grade.
- Silph Co., Mansão Pokémon e Esconderijo Rocket usam o ginásio da mesma cidade (o
  tileset deles não está completo no decomp do Pokemon All).
- A semente é a fase: o mesmo desenho toda vez. O canvas é pintado uma vez por
  trecho (em 1x) e o Renderer só recorta o que a câmera vê; a troca de trecho some
  aos poucos em 0,8 s.
- **D2 aplicado como padrão**: árvores e paredes são só desenho, ninguém esbarra.
  O treinador para 96 px antes da borda (`CONFIG.arena.inset`), onde fica a mata.
- Ficou para depois: flores e água animadas (hoje paradas) e cenários próprios para
  a Caverna do Diglett, o Túnel de Pedra, a Torre Pokémon, a Usina, Seafoam e
  Victory Road (hoje todos usam o Monte Lua) e para Cerulean e a Zona Safári (hoje
  usam a Floresta). É só tirar a tira do mapa no extrator e escrever a receita.

### Etapa 4 — Fases 3 a 8, Elite Four e Campeão

**Feita na 0.7**, junto com o pedido de "todo o conteúdo":

- **151 espécies jogáveis.** As 83 novas foram geradas com tipos e status de hoje
  (PokeAPI), evolução do FireRed e a mesma conta de vida e potência das antigas;
  a linha de golpes de cada família usa a lista enxuta da Etapa 2.
- **13 etapas**: Fases 3 a 8, a Elite Four em 4 salas (uma por membro, cada uma
  com o time de 5 do FireRed) e o Campeão, cujo time depende do seu inicial.
- **Selvagens com nível** (D3). Diferente do plano: o nível **acompanha a equipe**
  (de uns níveis abaixo dela no começo da fase até perto do ace do líder), e não o
  das rotas do FireRed. Aqui a equipe sobe mais rápido que no jogo, e com os
  níveis das rotas as fases 4 em diante ficavam triviais. Os líderes mantêm os
  níveis do FireRed. Vida e dano crescem de forma composta por nível
  (`CONFIG.enemies`), porque o poder do jogador cresce mais rápido que linear.
- **Curva de XP com joelho** no nível 20 (exponencial antes, potência depois).
  A equipe do bot chega ao Campeão por volta do nível 55.
- **Presentes** (`stage.gifts`, D7): Farfetch'd na Fase 3, Lickitung e o prêmio do
  Dojo (Hitmonlee ou Hitmonchan) na Fase 6. Goldeen, Onix, Venonat, Doduo e Seel
  entraram nas tabelas de captura com peso 3, nos lugares do FireRed, como padrão
  até o Fellipe decidir as porcentagens.
- **Eevee** sorteia entre Vaporeon, Jolteon e Flareon (sem pedras como item), e
  quem evolui para uma linha de golpes diferente leva o golpe para a posição
  equivalente, com as melhorias.
- **Calibrado** com `tools/balance.mjs`, uma fase por vez (ver HANDOFF §5).

- **Apresentação do líder**: quando o líder chega, a partida pausa no retrato dele,
  com a fala na caixa de texto do FireRed e o botão "Lutar!".

Ainda falta desta etapa: os **lendários como encontros especiais** (hoje estão na
tabela da fase 9 com chance baixa, como o Fellipe definiu).

O plano original, para referência:


Uma fase por vez, e cada uma é jogada e medida antes da próxima. Toda fase tem:

1. **As espécies novas** da tabela de captura dela, com `moveLine` de 3 golpes e
   evolução nos níveis do jogo (pedra e troca marcadas, como hoje).
2. **Os selvagens das rotas de verdade** (`wild_encounters.json`), com os níveis do
   FireRed.
3. **O líder com o time canônico** (`trainer_parties.h`), enfrentado em sequência
   até o ace, com golpes especiais do tipo dele, retrato e fala na caixa de texto do
   jogo.
4. **Trechos** com o tileset de cada lugar.
5. **Medição**, descrita mais abaixo.

| Fase | Trechos (sugestão) | Nível dos selvagens no FR | Time do líder no FR | Espécies novas |
|---|---|---|---|---|
| 1 ✅ | Rota 1 → Rota 2 → Floresta de Viridian → Ginásio | 2–6 | Brock: Geodude 12, Onix 14 | — |
| 2 ✅ | Monte Lua → Rota 4 → Cerulean → Ginásio | 6–14 | Misty: Staryu 18, Starmie 21 | — |
| 3 | Rotas 5/6 → Caverna do Diglett → Rota 11 → Ginásio de Vermilion | 10–17 (Diglett até 31) | Lt. Surge: Voltorb 21, Pikachu 18, Raichu 24 | 10 |
| 4 | Rotas 9/10 → Túnel de Pedra → Rotas 8/7 → Ginásio de Celadon | 11–22 | Erika: Victreebel 29, Tangela 24, Vileplume 29 | 11 |
| 5 | Torre Pokémon → Rotas 12–15 → Zona Safári → Ginásio de Fuchsia | 13–31 | Koga: Koffing 37, Muk 39, Koffing 37, Weezing 43 | 25 |
| 6 | Usina → Rotas 16–18 → Silph Co. (Equipe Rocket) → Ginásio de Saffron | 18–35 | Sabrina: Kadabra 38, Mr. Mime 37, Venomoth 38, Alakazam 43 | 8 |
| 7 | Rotas 19/20 → Ilhas Seafoam → Mansão Pokémon → Ginásio de Cinnabar | 22–36 | Blaine: Growlithe 42, Ponyta 40, Rapidash 42, Arcanine 47 | 5 |
| 8 | Rota 21 → Esconderijo Rocket → Ginásio de Viridian | 17–28 ¹ | Giovanni: Rhyhorn 45, Dugtrio 42, Nidoqueen 44, Nidoking 45, Rhyhorn 50 | 8 |
| E4 | Rota 23 → Victory Road → Lorelei → Bruno → Agatha → Lance | 32–46 | 4 times de 5 (aces: Lapras 54, Machamp 56, Gengar 58, Dragonite 60) | 5 (lendários) |
| Campeão | arena única | — | o rival ² | — |

¹ As rotas antes do Giovanni têm nível baixo no FireRed, porque o jogador chega lá
com o time que já tem. Para a curva não cair, os selvagens da Fase 8 sobem para
perto de 35–42, ou dão lugar aos Pokémon da Equipe Rocket.

² Como no FireRed, o time do rival depende do seu inicial:
- **Charmander**: Pidgeot 59, Alakazam 57, Rhydon 59, Arcanine 59, Exeggutor 61, **Blastoise 63**;
- **Bulbasaur**: Pidgeot 59, Alakazam 57, Rhydon 59, Exeggutor 59, Gyarados 61, **Charizard 63**;
- **Squirtle**: Pidgeot 59, Alakazam 57, Rhydon 59, Gyarados 59, Arcanine 61, **Venusaur 63**.

Conteúdo que entra junto:

- **72 espécies novas** no total (todas as das tabelas de captura 3 a 9); o
  `npm run check` mostra quais faltam. Hoje temos 68 das 151 de Kanto.
- **Tipos novos pedem linhas de golpe novas**: Fantasma (Lick → Night Shade →
  Shadow Ball), Gelo (Powder Snow → Ice Beam → Blizzard), Dragão (Twister → Dragon
  Breath → Outrage) e Terra (Mud-Slap → Bonemerang → Earthquake).
- Talvez um comportamento novo, `beam` (raio contínuo para Hyper Beam e Solar
  Beam), se o projétil não der a sensação certa.
- **9 espécies não estão em tabela de captura nenhuma** (levantamento de
  2026-11-02): Venonat, Farfetch'd, Doduo, Seel, Onix, Hitmonlee, Hitmonchan,
  Lickitung e Goldeen. Sem elas a Pokédex não fecha. Persian e Venomoth vêm por
  evolução (de Meowth e de Venonat). Proposta (D7), com os lugares do FireRed:
  - Goldeen na Fase 3 (pesca);
  - Onix na Fase 4 (Túnel de Pedra);
  - Venonat na Fase 5 (Rotas 12–15 e Zona Safári);
  - Doduo na Fase 6 (Rotas 16–18);
  - Seel na Fase 7 (Ilhas Seafoam);
  - por presente, como no jogo: Farfetch'd (a troca de Vermilion, Fase 3),
    Lickitung (a troca da Rota 18, Fase 6) e Hitmonlee **ou** Hitmonchan (o
    prêmio do Dojo de Saffron, Fase 6, escolhendo um dos dois).
- **Presentes da fase** (`stage.gifts`, novo mecanismo genérico): um Pokémon
  oferecido num momento da fase ou na vitória. Serve aos presentes acima, ao
  Lapras da Silph, ao Eevee de Celadon e aos fósseis.
- **Lendários**: Articuno, Zapdos, Moltres, Mewtwo e Mew estão na tabela da
  fase 9, mas, como no jogo, deveriam ser encontros especiais. Proposta: um
  chefe opcional que, derrotado, pode ser capturado.
- **Apresentação do líder**: hoje a fala dele é só um aviso no canto. Ela passa
  a abrir com o retrato e a caixa de texto do FireRed, antes do time entrar.

**Curva de dificuldade** (rascunho; os números finais saem da medição)

| | F1 | F2 | F3 | F4 | F5 | F6 | F7 | F8 | E4 |
|---|---|---|---|---|---|---|---|---|---|
| Duração (s) | 300 | 330 | 345 | 360 | 375 | 390 | 405 | 420 | 480 |
| Pico de inimigos vivos | 85 | 115 | 130 | 145 | 160 | 175 | 190 | 205 | 220 |
| Elites | 4 | 4 | 5 | 5 | 6 | 6 | 7 | 7 | 8 |
| Pokémon do líder | 2 | 2 | 3 | 3 | 4 | 4 | 4 | 5 | 4 × 5 |

O teto de ~220 inimigos vivos depende do FPS medido na vitrine de estresse.

**O problema do nível** (precisa estar resolvido antes da Fase 5)

A curva de XP de hoje é exponencial (`12 × 1,15^nível`). Ela funciona até o nível
~20, mas para chegar ao 60 da Elite Four um Pokémon precisaria de ~305 mil XP, 390
vezes o que ele junta até o nível 18. Nenhuma quantidade razoável de inimigos fecha
essa conta, e evoluções como Dragonite (nível 55) nunca aconteceriam.

**Proposta (D3)**: a mesma lógica dos jogos.

- **Selvagens com nível**, o da rota no FireRed. A vida e o dano deles seguem a
  mesma conta dos nossos Pokémon (`hpPerLevel`, `damagePerLevel`), e o XP que cada
  um dá cresce com o nível.
- **Curva de XP cúbica** no lugar da exponencial (como a "Medium Fast" dos jogos,
  numa escala nossa). Na cúbica, ir do 18 ao 60 pede ~37 vezes mais XP. Isso é o que
  dão selvagens que valem ~10 vezes mais XP (nível 5 contra nível 45), em número
  ~2,5 vezes maior e em fases ~1,5 vez mais longas. A conta fecha.
- O poder sobe junto dos dois lados, e a dificuldade vem do que foi pedido:
  **quantidade, densidade, elites e líderes**.
- **Alvo medível: a equipe chega ao líder perto do nível do ace dele** (Brock 14,
  Misty 21, Surge 24, Erika 29, Koga 43, Sabrina 43, Blaine 47, Giovanni 50, Lance 60).
- Isso mexe no balanceamento das fases 1 e 2, que serão medidas de novo.

**Medição**

- O `smoke` passa a jogar a campanha inteira em sequência, carregando a equipe como
  na jornada real (hoje ele já faz isso com as fases 1 e 2). Para cada fase, mostra
  as vitórias do bot, o nível médio ao chegar no líder comparado ao do ace, o pico
  de inimigos vivos e os desmaios.
- O alvo do bot era ~60% de vitória por fase, porque o Fellipe joga melhor que ele.
  Depois da primeira partida (0.8) o alvo passou a ~45–55%, com 3 a 4 desmaios por
  tentativa: ver "Retorno da primeira partida" abaixo.
- Vale a regra do HANDOFF: **uma alavanca por vez, medir, repetir.**

### Etapa 5 — Som

Os arquivos já estão no Pokemon All, em OGG, prontos para o navegador.

- **Gritos**: ao entrar em campo, capturar, evoluir e na entrada de cada Pokémon do
  líder.
- **Efeitos** (255): acerto (com limite por segundo), subir de nível, Poké Ball,
  evolução e menus.
- **Música**: as 3 prontas cobrem o líder (`mus_vs_gym_leader`) e a vitória. As
  das rotas, da floresta, da caverna e da batalha contra selvagem precisam ser
  renderizadas do MIDI pelo `render_sound.py` do Pokemon All, rodando numa **cópia
  temporária** e nunca dentro dele, ou pedindo ao Braga (D6).
- Controle de volume em Opções. O áudio só começa depois do primeiro clique, que é
  uma regra dos navegadores.
- Gritos e efeitos são baratos e podem entrar já junto das etapas 2 e 3.

### Etapa 6 — Acabamento

Levantamento de 2026-11-02:

- ✅ **Opções salvas** (0.6): ficam no navegador (`save/options.js`), com o
  tremor de tela como opção nova.
- ✅ **Controle (gamepad)** (0.7): na partida, analógico ou direcional anda,
  LB/RB escolhem o slot, X/Y/B põem a reserva em campo e Start pausa; nas telas e
  janelas, o direcional move o foco e o A confirma (`ui/pad.js`, genérico).
- **Celular (D8).** Joystick virtual na tela e uma interface que caiba na tela
  pequena. O site é público, e hoje no celular o jogo não é jogável.
- ✅ **Desempenho medido** (0.6): `vitrine.html?estresse` deu 60 FPS e ~2 ms por
  quadro com 245 inimigos. Medir de novo com os Pokémon animados (Etapa 3).
- **Assets locais.** Os sprites de Pokémon, itens e insígnias ainda vêm do
  raw.githubusercontent.com a cada partida. Com a Etapa 3 o canvas fica local;
  falta a interface (HUD, menus, Pokédex).
- **Publicar.** A 0.5 está numa branch local; o site roda a 0.4. Publicar é
  merge na `main` + push, quando o Fellipe mandar.

### Etapa 7 — Final da jornada

**Feita na 0.7**: vencer o Campeão abre o Hall da Fama com a equipe campeã (um
Pokémon por vez, com o retrato do treinador) e os créditos; o perfil guarda as
equipes (`profile.hallOfFame`) e o mapa da jornada ganha o botão para revê-las.
O plano original, para referência:

- Hoje, depois do Campeão, não acontece nada.
- **Hall da Fama como no FireRed**: a equipe que venceu, um Pokémon por vez,
  com o retrato do treinador, e depois créditos curtos.
- O perfil guarda os times campeões, para revê-los no menu.
- **Pós-jogo (D9, depois da 1.0)**: revanche dos líderes com níveis maiores e
  os lendários como chefes opcionais.

### Etapa 8 — Outras regiões

A Etapa 0 deixa a estrutura pronta, então cada região nova é só dado e assets:
faixa da Pokédex, iniciais, campanha (rotas, ginásios, Elite Four), tabelas de
captura (o Fellipe define, como fez com Kanto), tilesets e modelos de treinador.

Todas as fontes possíveis são decomps do mesmo grupo, o pret:

| Região | Fonte | Custo |
|---|---|---|
| **Hoenn** | `pret/pokeemerald`, no **mesmo formato do FireRed**: o extrator serve quase sem mudança. O FireRed já traz até os retratos dos líderes de Hoenn. Treinadores: Brendan e May | baixo |
| Johto | `pret/pokecrystal` (Game Boy Color: 4 cores, outro estilo de arte) ou `pret/pokeheartgold` (DS, decomp incompleto, outros formatos) | alto |
| Sinnoh | `pret/pokeplatinum` (DS, em andamento) | alto |

Recomendação: **Hoenn como segunda região** (D5).

Fica para decidir quando chegar lá: numa região nova, a jornada começa do zero com
os iniciais dela, ou dá para levar a equipe de Kanto? A jornada guardada por
região, da Etapa 0, serve para as duas respostas.

---

### Retorno da primeira partida (0.8)

O Fellipe jogou a 0.7 em 2026-11-02 e pediu:

| Pedido | O que mudou |
|---|---|
| "Quase não tomo dano": mais dano dos inimigos e mais inimigos | Dano de contato e dos golpes dos líderes ×1,2 (`CONFIG.enemies.damageMult`) e ondas 20% mais cheias e frequentes (`spawnMult`); o `scaling.damage` de cada fase foi recalibrado com o bot, e os selvagens de Celadon subiram 4 níveis. O bot agora vence 35% a 60% das tentativas (antes 44% a 88%) e desmaia 3 a 4 vezes em cada uma (antes ~2) |
| Poké Ball mais difícil | Chance de cair ×0,45 (`CONFIG.capture.dropChanceMultiplier`); os momentos garantidos continuam |
| TM mais rara no level up | 12% → 4% (`CONFIG.progression.tmChance`). Agora **evoluir melhora o golpe**: Charmander → Charmeleon chega com o golpe do estágio novo, levando as melhorias |
| Cenário com os sprites que já temos | O cenário de tiles do FireRed (Etapa 3, acima) |
| Ícone da Poké Ball mais bonito | O sprite do item, com brilho dourado pulsando |
| Ímã | Raro (0,15% por selvagem, 4% por elite ou Pokémon de líder, um por vez no mapa). Ao pegar, todo o XP do mapa voa até o treinador, acelerando, com rastro |

### Segundo retorno (0.9)

O Fellipe jogou a 0.8 e pediu:

| Pedido | O que mudou |
|---|---|
| Poké Ball 3x mais rara | Chance de cair ×0,15 (era ×0,45); os momentos garantidos de cada fase continuam |
| Ícone de vida vira Poção | A cura que cai no chão é o sprite da Poção |
| Clefairy capturada "bugada", não foi para o time | Ela entrava, mas no **nível 1**: numa equipe de nível 20 não causava dano e desmaiava logo. Quem é capturado (e os presentes) agora entra com a média da equipe menos 3 (`CONFIG.capture.levelsBehindTeam`) |
| Rochas, árvores e obstáculos bloqueiam o jogador e os inimigos | D2 decidido. Grid de colisão por cenário (`systems/terrain.js`), com a colisão dos mapas do FireRed: árvores, mata da borda, pedras, paredões, estátuas, paredes e desníveis. Grama, areia, copa das árvores e água não bloqueiam. O treinador esbarra com os pés; o inimigo desliza no obstáculo e contorna pelo lado |
| Inimigos com um pouco mais de vida | +15% (`CONFIG.enemies.hpMult`) |
| Líderes com muito mais vida e bem mais difíceis | Vida ×2,5, dano ×1,4 e golpes 25% mais frequentes (`CONFIG.enemies.boss`) |
| Ímã menor no mapa e ainda mais raro | Sprite em 1x (era 2x); 0,05% por selvagem e 1,5% por elite ou líder (era 0,15% e 4%) |
| A troca às vezes não troca o Pokémon que eu quero | Duas causas: o HUD se refazia entre apertar e soltar o botão (o clique se perdia), e não dava para ver qual slot ia sair. Agora o clique vale no apertar, o card que sai tem o selo "⇄ sai", a reserva diz quem ela substitui e clicar durante a recarga avisa quanto falta |
| Espadinha em cada Pokémon ativo | Botão no card: desligado, o Pokémon fica em campo só acompanhando o treinador (não ataca, não avança, sem aura nem orbes). Vai no save |

Com tudo isso o bot vence 45% das tentativas em média (0.8: 53%), desmaia 3,7
vezes por tentativa e as lutas contra os líderes duram o dobro. Para não ficar
injusto no começo, com menos Poké Balls e selvagens mais resistentes, o dano das
ondas das Fases 1 e 2 caiu um pouco (tabela no HANDOFF, seção 5).

**XP: sugestões para refinar (D10, a decidir)**

1. **Orbes por faixa de valor** (recomendada): pequeno azul, médio verde, grande
   dourado, como os cristais dos bullet heavens, mas com cara de doce (o Doce
   Raro está nos itens do Pokemon All; os Exp. Candy da Gen 8 não estão).
   Orbes perto uns dos outros se juntam num maior, o que também alivia o
   navegador com a horda grande.
2. **Coleta com "pop"**: o orbe dá um pulinho e um brilho ao ser puxado, e um
   número "+XP" sobe do Pokémon que recebeu.
3. **Barra de XP do Pokémon que mais recebe** pulsando no HUD, com o nível novo
   piscando ao subir.
4. **Sequência (combo)**: pegar orbes em seguida aumenta o XP por alguns segundos
   (x1,1, x1,2...), premiando quem corre atrás deles no meio da horda.
5. **Doce Raro**: muito raro, cai de elites e sobe um nível na hora no Pokémon
   escolhido.
6. **Exp. Share**: uma melhoria do treinador (Shards) que dá mais XP à reserva.

## 5. Decisões em aberto (do Fellipe)

| | Pergunta | Recomendação | Trava |
|---|---|---|---|
| D1 | Pokémon em campo: GIF animado da Gen 5, sprite do FireRed (parado, mas no estilo do cenário) ou ícone da caixa (2 quadros, estilo "mini")? | GIF animado, porque é o que dá movimento. A vitrine mostra os três lado a lado para escolher olhando. | Etapa 3 |
| D2 | Árvores e pedras do cenário: só decoração ou obstáculo de verdade? | ✅ Decidido (0.9): bloqueiam o treinador e os inimigos. Quem bloqueia é a colisão do próprio mapa do FireRed; os Pokémon da equipe, os golpes e os itens passam por cima. | Etapa 3 |
| D3 | Selvagens com nível e curva de XP cúbica? | ✅ Feito na 0.7, com ajustes: nível acompanha a equipe; curva exponencial até o 20 e potência depois. | Etapa 4 |
| D4 | Quem já tem save escolhe o treinador ao abrir o jogo, ou fica Menino até trocar em Opções? | ✅ Decidido: escolhe ao continuar (a tela aparece uma vez) e pode trocar em Opções. | Etapa 1 |
| D5 | Próxima região? | Hoenn | Etapa 8 |
| D6 | Músicas novas do FireRed: renderizar (numa cópia temporária do Pokemon All, ou com o Braga) ou ficar com as 3 prontas por enquanto? | Renderizar as das rotas e a da batalha contra selvagem. | Etapa 5 |
| D7 | Onde entram as 9 espécies que não estão em tabela nenhuma? | Aplicado como padrão na 0.7 (lugares do FireRed com peso 3, e os presentes). As porcentagens são suas: é só mudar em `capturePools.js`. | Etapa 4 |
| D8 | Celular e controle importam? | Controle feito na 0.7 (padrão); celular depois de Kanto fechado. | Etapa 6 |
| D9 | Final e pós-jogo | Hall da Fama e créditos na 1.0; revanche dos líderes e lendários depois. | Etapa 7 |
| D10 | Como refinar o XP? (o Fellipe pediu sugestões na 0.9) | Ver as opções em "Segundo retorno" abaixo. Recomendação: orbes por faixa de valor com o visual de doce, que se juntam no chão. | — |

Enquanto uma decisão não vem, a recomendação vale como padrão. O que foi feito
assim fica anotado como "padrão até o Fellipe decidir".

## 6. Depois de Kanto

Vieram da lista antiga do HANDOFF e continuam valendo:

- **Item Revive**: o `TeamSystem.handleFaint` já isola o desmaio.
- **Pedras evolutivas como item**: o `method: 'stone'` já marca quem depende delas.
- **Sinergias de tipo** entre membros da equipe.
