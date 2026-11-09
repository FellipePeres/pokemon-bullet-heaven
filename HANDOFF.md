# HANDOFF — Pokémon Bullet Heaven

> **Leia este arquivo primeiro ao retomar o projeto.**
> Ele descreve o estado atual, as regras de design já decididas, por que cada
> decisão foi tomada e o que falta fazer. O `README.md` é o manual de uso;
> este aqui é o contexto de desenvolvimento.

**Versão atual:** `0.37.0` · **Última atualização:** 2026-11-09
**Stack:** HTML + CSS + JavaScript puro (ES Modules). Sem backend, sem build, sem dependências.
**Repositório:** https://github.com/FellipePeres/pokemon-bullet-heaven (público)
**Jogo no ar:** https://fellipeperes.github.io/pokemon-bullet-heaven/

---

## 1. O que é o jogo

Bullet Heaven (Vampire Survivors / Survivor.io) com estrutura de jornada Pokémon.
O jogador controla um **treinador que não luta**: ele só anda pelo mapa. Quem
combate, toma dano e sobe de nível são os **Pokémon da equipe**, que atacam
sozinhos. Durante a fase o jogador captura novos Pokémon, sobe o nível de cada um,
escolhe melhorias e troca quem está em campo. Cada fase é a jornada inteira até
um ginásio, terminando no time do líder.

**A sensação buscada:** "estou fazendo uma jornada Pokémon enquanto construo uma
build de Bullet Heaven". Progressão e descoberta de equipe importam mais que números.

---

## 2. Como rodar e testar

```bash
# servir (ES Modules exigem HTTP; abrir o arquivo direto não funciona)
npm run dev                  # http://localhost:5173
# ou Live Server no VS Code, ou: python -m http.server 5173

npm test                     # roda os três testes abaixo
npm run check                # dados: evoluções, linhas de golpe, inimigos, pools, assets
npm run smoke                # lógica: fases inteiras simuladas, sem navegador
npm run smoke:ui             # interface: DOM simulado a partir do index.html real

npm run screens -- <roteiro> --out <pasta>   # screenshots no Chrome sem janela
npm run screens -- banner --size 1280x480 --out assets   # regera o banner do README (tools/banner.html)
npm run assets               # regera os sprites a partir do Pokemon All (Python + Pillow)
python tools/assets/hub.py   # regera os mapas da vila (0.29) a partir do mesmo decomp
python tools/assets/gym_banners.py   # regera os banners dos salões do painel da fase (0.31)
# as outras ferramentas de assets (render_music.py, copy_pc_art.py, extract_region_map.py): ver assets/PROVENIENCIA.md
npm run balance -- --runs 12 # joga a campanha com o bot: tentativas até passar cada fase, níveis e lutas
npm run balance -- --runs 48 --jobs 12          # o mesmo, em 12 processos (0.28; a máquina tem 12 núcleos)
npm run balance -- --runs 24 --jobs 12 --starter charmander --tipos   # o bot que monta o time por tipo (0.32)
npm run balance -- --load equipes.json --from gym_6_saffron --until gym_6_saffron --set gym_6_saffron.difficulty=0.8
                                                # testa um valor sem editar stages.js (vários --set valem)
```

Os testes são a rede de segurança do projeto — **rode sempre que mexer em
balanceamento, dados ou interface**. `smoke` usa um "jogador virtual" que foge da
horda em círculos, desvia para pegar Poké Balls, troca Pokémon machucado por
descansado e escolhe melhorias: a TM primeiro, depois a chave do Golpe Desperto,
depois dano.

**Balanceamento (desde a 0.6; métrica nova na 0.17).** `tools/balance.mjs` joga a
campanha inteira várias vezes com o jogador virtual (`tools/bot.mjs`, o mesmo do
`smoke`), levando a equipe de uma fase para a outra **e de uma tentativa para a
outra** (a derrota guarda o progresso, como no jogo). Mostra por fase: quantas
jornadas venceram de primeira, a média de tentativas até passar (`--attempts`,
padrão 10, é o teto; quem não passa "para ali"), o nível médio da equipe ao
vencer, a duração da luta, desmaios, pico de inimigos, Poké Balls e quantos da
equipe têm o Golpe Desperto ao vencer (coluna "despertos", 0.33).

**Conferência visual (desde a 0.5).** `tools/screenshot.mjs` abre o jogo no Chrome
(ou Edge) sem janela, executa um dos 42 roteiros (os mais usados: `vitrine`,
`treinador`, `vila`, `jornada`, `partida`, `ux`, `efetivo`; um nome desconhecido lista
todos), salva PNGs e lista os erros de JavaScript da página. Sai com código 1
se a página tiver erro. A `vitrine.html` desenha os assets com o mesmo código da
partida: poses, andar e correr, as 8 direções, a proporção com os Pokémon e os
retratos. **Olhe os screenshots antes de entregar mudança visual.** O feel
(velocidade, animação em movimento) continua sendo validado pelo Fellipe.

---

## 2b. Publicação (GitHub Pages)

O jogo está no ar em **https://fellipeperes.github.io/pokemon-bullet-heaven/**
(desde a 0.10.1, em 2026-11-03),
servido pelo GitHub Pages direto da branch `main`, pasta raiz (`build_type: legacy`).

**Publicar é levar o commit para a `main`, e só quando o Fellipe pedir** (o push
coloca o jogo no ar). O trabalho fica na branch `etapa-0-1-treinador`; a
publicação é `git push origin HEAD:main` e, para a branch acompanhar,
`git push origin HEAD`. O workflow *pages build and deployment* roda sozinho e
leva ~1-2 minutos. Acompanhe com:

```bash
gh run list --limit 3                  # status do deploy
gh api repos/FellipePeres/pokemon-bullet-heaven/pages --jq .status
curl -sI https://fellipeperes.github.io/pokemon-bullet-heaven/ | head -1
curl -s https://fellipeperes.github.io/pokemon-bullet-heaven/src/core/config.js | grep "version:"   # a versão no ar
```

⚠️ **O site é servido em um subcaminho** (`/pokemon-bullet-heaven/`), então
**todos os caminhos do projeto precisam continuar relativos** (`css/style.css`,
`src/main.js`, `assets/...`). Nada de barra inicial — isso quebraria o deploy
sem quebrar o ambiente local.

O "Sobre" do repositório (a descrição, o site e as tags) muda com
`gh repo edit FellipePeres/pokemon-bullet-heaven --description "..."` (até 350
caracteres). Desde a 0.32.2 ele fala como gente, não como ficha técnica (pedido do
Fellipe: estava "IAzudo"), e traz os controles, com o Espaço como a tecla de ação.

A identidade de commit configurada no repositório local é
`Fellipe Peres <130771865+FellipePeres@users.noreply.github.com>` (e-mail noreply
do GitHub, para não expor o e-mail pessoal no histórico público).

---

## 3. Arquitetura

```
index.html            página única (telas, HUD, overlays, modais)
vitrine.html          conferência visual dos assets (ver seção 2)
css/style.css         toda a interface
assets/               sprites, cenários, mapas e músicas do FireRed gerados pelos extratores + PROVENIENCIA.md
src/
  main.js             ponto de entrada
  vitrine.js          a cena da vitrine.html
  core/
    config.js         ⭐ TODO o balanceamento e as opções
    events.js         EventBus + nomes de eventos
    input.js          teclado e controle (Gamepad API)
    utils.js          matemática, sorteios, sistema de modificadores, ids (`uid`, `uniqueId`)
  data/               ⭐ CONTEÚDO (só dados, sem lógica)
    pokemon.js        as 151 espécies: tipos, hp, power, evolução, moveLine
    abilities.js      61 golpes: os 52 jogáveis (no máximo 4 por tipo), os 5 exclusivos dos lendários e os 4 dos líderes
    bonusMoves.js     o Golpe Desperto (0.14): 51 golpes, 3 por tipo, e o Dive (0.34, só pela TM Dive)
    awakening.js      a chave do Golpe Desperto (0.28): as 3 melhorias de cada golpe
    legendaries.js    os lendários (0.16): golpe exclusivo, kit, poder e onde aparecem (0.18)
    items.js          o Poké Mart (0.23): itens, preços e quem evolui com cada item
    upgrades.js       235 melhorias de partida, geradas a partir dos golpes
    tms.js            linha de golpes: qual o próximo golpe de cada Pokémon e o número de cada TM
    capturePools.js   chances de captura por fase (as 9 tabelas do design)
    enemies.js        159 inimigos: selvagens, elites e Pokémon dos líderes
    stages.js         as 13 etapas de Kanto (ondas, elites, trechos, líder, força)
    regions.js        regiões: Pokédex, iniciais, campanha, treinadores e o lendário secreto do fim da Pokédex (0.35)
    regionMap.js      o Town Map de Kanto (0.13): em que casa do mapa fica cada fase
    trainers.js       modelos de treinador (Red, Leaf), o mapa de quadros da folha e o nome do jogador (0.30)
    fx.js             qual sprite do FireRed cada golpe usa
    scenery.js        receitas dos 17 cenários (rota, floresta, caverna, salões)
    assetManifest.js  GERADO pelo extrator: tamanho e quadros de cada folha
    sceneManifest.js  GERADO pelo extrator: metatiles de cada cenário e o mapa dos salões
    musicTracks.js    GERADO por render_music.py: onde começa e acaba o loop de cada música
    hub.js            a vila (0.29): portas, saídas, pessoas, objetos e a decoração fixa de cada lugar
    hubMaps.js        GERADO por tools/assets/hub.py: os mapas da vila (camadas e colisão), as folhas e os móveis
    dive.js           a descida do Dive (0.36): os 6 níveis (aviso, velocidade, hordas, padrões, espécies) e as falas
    diveWorld.js      GERADO por tools/assets/dive.py: os mapas submersos do Emerald, a grade do que é navegável, os tabuleiros, o salão do Kyogre, a arena da luta e as folhas do modo aquático
    sceneTiles.js     as tiras de metatiles de todos os cenários: as do FireRed e a do salão do Kyogre (0.37)
    dialogue.js       as falas da vila, com as condições (inicial, insígnias, Campeão, uma vez só)
    decor.js          a loja de Pokédolls: os enfeites do quarto, o preço e o lugar de cada um
    types.js          tipos, cores, a tabela de efetividade completa e a defesa (0.32)
    kanto.js          nomes da Pokédex 1-151
    achievements.js   20 conquistas em 99 degraus, com as recompensas em Shards
  entities/           Player, Companion, Enemy, projéteis, zonas, pickups, efeitos
  systems/            comportamento genérico
    combat.js         dano (com o tipo), queimadura e veneno, morte, drops, alvo mais próximo
    AbilitySystem.js  calcula stats e executa os 12 comportamentos de golpe (seção 6)
    signatureMoves.js os golpes exclusivos dos lendários (o comportamento `signature`, 0.16)
    moves.js          trocar de golpe levando as melhorias (TM, evolução, saves antigos) e o kit dos lendários
    ProgressionSystem.js  XP, níveis, evolução, TMs, melhorias, a chave do Golpe Desperto
    TeamSystem.js     equipe, slots ativos, troca, desmaio, serialização
    CaptureSystem.js  sorteio da captura (e do lendário)
    SpawnSystem.js    ondas, elites, Poké Balls roteirizadas, time do líder, Modo Livre
    SpatialGrid.js    grade espacial (evita colisão O(n²))
    terrain.js        gera o cenário de cada trecho e diz o que bloqueia (colisão)
    pc.js             o PC da jornada: as casas de cada Pokémon, pegar e soltar
    stageStats.js     as métricas de cada fase (o Estojo de Insígnias)
    stats.js          vida máxima, XP por nível, dano por nível e as barras dos cards (0.31)
    matchup.js        a vantagem de tipo contra o time de um líder: o "Fraco" do painel e a nota do bot (0.32)
  game/
    Run.js            uma partida: estado, loop, colisões, dano recebido (com o tipo), condições de fim
    Hub.js            a vila (0.29): andar em grade, portas, saídas, conversas e o clique
    Game.js           orquestra tudo: perfil, jornadas, telas, loop principal, save
  render/
    Renderer.js       canvas: chão, atores, efeitos, barra do chefe, treinador
    assets.js         carrega as folhas do catálogo e desenha quadros em escala inteira
    trainer.js        qual quadro do treinador mostrar (passo pela distância andada)
    HubRenderer.js    a vila: o chão, as pessoas, a camada de cima e o escurecer das portas
    fx.js             desenha os sprites de golpe
    signature.js      desenha em código os golpes exclusivos dos lendários (0.16)
    scenery.js        pinta o chão da arena (o grid do terreno) num canvas por cenário
    sprites.js        Pokémon em campo (a tira animada local), as URLs do PokeAPI e as insígnias
    icons.js          ícones de item por chave semântica
  ui/
    HUD.js            HUD da partida e overlays (nível, captura, evolução, pausa, resultado, Centro Pokémon)
    pokemonCard.js    o card de escolha (0.31): o inicial e a Poké Ball, em pixel, com as barras
    Menus.js          telas e janelas (Pokédex, conquistas, equipe, Poké Mart, Pokédolls, Opções)
    titleMenu.js      o menu da tela de título: ↑ ↓ e Enter, Poké Ball de ponteiro
    journeys.js       a tela de jornadas (0.19): os 3 espaços, Jogar e Apagar
    backdrop.js       o fundo dos menus: um trecho de rota montado pelo gerador do cenário
    pcScreen.js       a tela do PC (a do FireRed, portada do Pokemon All): caixas, equipe, pegar e soltar
    lobby.js          o mapa da jornada: o Town Map de Kanto, a fase escolhida, a equipe e a barra do topo
    hubHud.js         a vila (0.29): a barra do topo, a caixa de texto do FireRed, o SIM/NÃO e a placa do lugar
    badgeCase.js      o Estojo de Insígnias: o Cartão de Treinador e as métricas de cada fase
    dom.js            helpers de DOM e toasts
    pad.js            o controle nas telas: foco nos alvos clicáveis da camada de cima
  audio/
    music.js          a música: uma faixa por vez, loop do jogo, troca suave, volume e a vinheta
  save/
    SaveManager.js    arquivo .json + autosave em localStorage
    profile.js        progresso permanente e os espaços de jornada + ProfileTracker (eventos → perfil)
    options.js        as Opções (volume, tremor de tela, autosave), guardadas no navegador, fora do save
tools/
  check-data.mjs      conferência dos dados
  smoke-test.js       teste da lógica
  ui-smoke.js         teste da interface
  bot.mjs             o jogador virtual (usado pelo smoke e pelo balance)
  balance.mjs         mede a dificuldade fase a fase (ver seção 5)
  screenshot.mjs      screenshots no Chrome sem janela (DevTools Protocol, sem dependências)
  banner.html         o banner do README: o logo sobre a arte do título (roteiro `banner`)
  assets/extract.py   gera assets/ a partir do decomp do FireRed no Pokemon All
  assets/render_music.py  renderiza as músicas do FireRed (cópia do sintetizador do Pokemon All)
  assets/copy_pc_art.py   traz do Pokemon All a arte do PC, os sprites do FireRed e o Cartão de Treinador
  assets/extract_region_map.py  monta o Town Map de Kanto do decomp (o mapa da jornada)
  assets/hub.py       monta a vila e os interiores com pedaços de mapas do FireRed (0.29)
  assets/gym_banners.py  recorta os salões dos líderes para o painel da fase (0.31)
```

**Regra do projeto: `/data` é conteúdo, `/systems` é comportamento.**
Adicionar Pokémon, habilidade, inimigo, fase ou conquista deve ser só editar
`/data`. Se precisou mexer em `/systems`, provavelmente o comportamento é
genuinamente novo (aí crie um comportamento genérico, não um caso especial).

Comentários e nomes de UI em **pt-BR**; código em inglês.

---

## 4. Regras de design já decididas

Estas decisões vieram do Fellipe ao longo de várias rodadas — **não mudar sem
confirmar com ele**.

### Treinador e equipe
- O jogador **escolhe menino (Red) ou menina (Leaf)** no começo da jornada, numa
  tela com o Prof. Carvalho, como no FireRed. Dá para trocar em Opções. Save
  antigo, sem treinador, pergunta uma vez ao continuar.
- **O nome é do jogador** (0.30, "substituir Red ou Leaf como personagens é meio
  ultrapassado"): depois de menino ou menina, o Carvalho pergunta o nome
  (`screen-name`, `Game.chooseName`). Até 12 letras, limpo por
  `cleanTrainerName` (só letras, números, espaço, ponto, hífen e apóstrofo: ele
  vai para a interface por innerHTML em alguns lugares); em branco, fica o do
  modelo (`trainerName` em `data/trainers.js`). Os cards da escolha mostram só
  Menino e Menina. O nome é da jornada (`profile.trainerName`, guardado no espaço
  com o treinador) e aparece na barra da vila, nas falas (`{player}`), no card da
  jornada, no Cartão de Treinador e no Hall da Fama. Saves antigos ficam com Red
  ou Leaf.
- **O movimento é livre**, em qualquer ângulo, como sempre foi. **Nada de andar
  por quadrados** como no FireRed: o FireRed entra só no visual. A exceção é a
  vila (0.29), onde se anda em grade, como no FireRed, a pedido do Fellipe. O sprite tem 4
  poses; na diagonal, a pose atual continua se fizer parte do movimento, senão
  fica de lado (`facingDir` em `Player.js`).
- O treinador **não tem vida nem nível**. Só guia a equipe.
- Cada Pokémon tem **vida e nível próprios**. Inimigo que encosta em um Pokémon
  bate nele; se alcança o treinador, o Pokémon ativo mais próximo o defende.
- **3 Pokémon ativos** ao mesmo tempo, equipe de até 6 (`CONFIG.team`). Desde a
  0.11 isso é fixo (a opção saiu), e os sprites ficam sempre ligados.
- **PC** (0.11): com a equipe cheia, a captura pergunta se o novo entra (e quem
  vai para o PC) ou se ele vai direto para o PC. Os depósitos da partida
  (`run.pc`, no autosave) entram no PC da jornada (`journey.pc`) quando a fase é
  vencida, como a equipe. A equipe nunca fica vazia.
- **Tela do PC** (0.12, pedido do Fellipe: "o modelo de PC do Pokemon All"): a
  Global Box do Pokemon All (DEC-004 de lá) portada para JS puro em
  `ui/pcScreen.js`. É o PC do FireRed em pixels do GBA (288x160) ampliado pelo
  maior inteiro que cabe: DADOS do Pokémon à esquerda (sprite frontal do
  FireRed, tipos, nível, golpe, onde está), a caixa 6x5 com os 16 papéis de
  parede do jogo e as setas, a equipe fixa à direita (a bolinha marca os 3 em
  campo), a mão como cursor. Um clique pega, outro solta; em cima de outro, os
  dois trocam; a moldura diz antes o que acontece (dourada vai, laranja troca,
  vermelha não pode) e o fantasma mostra onde cada um para. Teclado: setas, Enter,
  Q/E (caixas), Esc. As regras ficam em `systems/pc.js` (`moveMon`,
  `previewMove`, funções puras): cada Pokémon do PC tem uma casa (`slot`; caixa
  = `slot / 30`), quem chega sem casa vai para a primeira vazia
  (`normalizePC`), são no mínimo 8 caixas e sempre uma com folga. Do Pokemon All
  ficaram de fora o SUMÁRIO, o ORDENAR/Tipos, o PULAR e a lixeira (soltar na
  natureza) — padrão até o Fellipe decidir.
- **Shiny** (0.13.1, "não aparece shiny nos inimigos, apenas na captura e para o
  jogador"): cada opção da Poké Ball (ou do presente) tem `CONFIG.capture.shinyChance`
  de vir shiny (1%, padrão até o Fellipe decidir). O card brilha em dourado com
  "✦ Shiny"; quem entra guarda `member.shiny` (no save, na evolução e no PC). No
  campo, a tira animada shiny (`pokemon/shiny/<dex>`, os GIFs `front-shiny` do
  Pokemon All) e três estrelinhas piscando de tempos em tempos (`drawShinySparkles`);
  nos cards de escolha, o sprite shiny do FireRed (0.31); na equipe da partida, os
  GIFs shiny do PokeAPI; no PC, o sprite shiny do FireRed (o ícone de
  caixa não muda, como no jogo) e o ✦. A Pokédex marca com ✦ quem você já teve
  shiny (`pokedex.shiny`), e a conquista **Brilho Raro** conta `shinyCaught`
  (1, 3, 5, 10). Selvagens nunca são shiny. O inicial pode ser (0.13.2, "inicial
  pode ser shiny sim, 1%"): sorteado na escolha e guardado em
  `regions.<id>.starterShiny`, para não mudar a cada tentativa da Fase 1.
- **Captura sem medo** (0.12, "os testes deixam de capturar achando que um
  Pokémon é descartado"): a tela da Poké Ball avisa — em destaque com a equipe
  cheia — que nada se perde; a de equipe cheia pergunta "onde fica o X?", com
  "Guardar no PC" primeiro e "Trocar" nos da equipe ("vai para o PC"), e o
  cancelar virou "Desistir da captura".
- Pokémon que desmaia **fica fora até o fim da fase** (item Revive virá depois).
  Um da reserva entra automaticamente no lugar. **Os 6 desmaiados = derrota.**
- Reserva regenera vida sozinha (2,5 HP/s) — trocar é a principal sustentação.
- **Troca** (0.9): o card marcado "⇄ sai" (`team.selectedSlot`, escolhido com
  clique, tecla do ativo ou `Tab`) é quem sai; a reserva clicada entra no lugar.
  Os botões do HUD agem no `pointerdown`: o HUD se refaz quando alguém sobe de
  nível, e um clique entre apertar e soltar se perdia.
- **Espadinha** (0.9): cada ativo tem um botão de ataque (`member.attack`, vai no
  save). Desligado, o Pokémon continua em campo e apanha, mas não ataca, não
  avança para o alvo e recolhe aura e orbes (`AbilitySystem._holdFire`).

### Experiência e níveis
- O XP de cada inimigo é **dividido pela equipe**: peso 3 para ativo, 1 para
  reserva. Com equipe cheia dá exatamente **25% por ativo e 8,33% por reserva**,
  que foi o pedido original. Com menos Pokémon a proporção se redistribui —
  nada de XP se perde no começo.
- **Subir de nível cura 1/10 da vida máxima** de quem subiu, **do nível 11 em
  diante** (`CONFIG.progression.levelUpHeal` e `levelUpHealFrom`). Quem está
  desmaiado não volta. Quem já tem todas as melhorias recebe a **Poção** no lugar
  delas (`CONFIG.progression.maxedHeal`: 20% da vida; era 50% até a 0.12.1, forte
  demais no nível máximo). **Desde a 0.16 a Poção é automática** ("cure os 20%,
  não precisa abrir tela"): o nível de melhoria de quem tem tudo cura sozinho, com
  o número verde em cima dele, sem tela (`ProgressionSystem.maxedLevel`); a TM que
  a tela poderia trazer vem sozinha, com a mesma chance (trocar nunca é perder).
  Níveis guardados de quem ficou com tudo viram cura (`resolveMaxedLevels`, no
  `Run._checkState`). Antes da 0.11.3 subir de nível não curava (a cura total do começo deixava o
  jogo trivial); a 0.11.3 curava 1/4, fácil demais; a 0.11.4 baixou para 1/10, a
  pedido do Fellipe. Bot nas Fases 1 a 3 (Charmander / Bulbasaur / Squirtle):

  | Cura ao subir de nível | Fase 1 | Fase 2 | Fase 3 | Desmaios |
  |---|---|---|---|---|
  | nenhuma | 24 / 20 / 76% | 18 / 26 / 41% | 50 / 27 / 92% | 1,2–4,3 |
  | 1/4 do nível 11 (0.11.3) | 48 / 63 / 94% | 100 / 100 / 84% | 100% | 0–1,7 |
  | 1/10 do nível 11 (0.11.4) | 43 / 56 / 100% | 59 / 81 / 57% | 100 / 92 / 87% | 0–3,4 |

  Fora isso, cura vem de poções no chão, da regeneração da reserva e da troca.
- A tela de melhoria aparece **a cada 3 níveis** (`upgradeEveryLevels`). Os níveis
  intermediários valem em vida e dano, sem interromper. Isso caiu de ~45 telas
  por fase para ~20, que foi a reclamação do Fellipe.
- Pokémon **ativo** que sobe pausa a partida na hora. Pokémon da **reserva**
  acumula e o jogador gasta quando quiser pelo botão ▲ no card.
- **A curva depois do nível 20 ficou mais íngreme** (0.28, "a escala de ganho de
  nível tá muito alta"; o Brock fica como está): `xpLateExponent` de 2,2 para 3,4.
  Até o 20 (a Fase 1) nada muda. O bot chegava ao Campeão no ~115 e agora chega no
  ~73 (o ace dele é 63), mais perto do FireRed. Menos níveis é menos vida e dano
  para a equipe; a `difficulty` de cada fase foi recalibrada por cima disso (ver a
  seção 5). As evoluções por nível vêm mais tarde na jornada (Charizard no fim da
  fase do Surge ou na da Erika).

### Melhorias: só as do Pokémon (desde a 0.21)
- **Level up do Pokémon**: só aquele Pokémon (dano, projéteis, área, recarga,
  efeitos). Fica em `member.upgrades`.
- A segunda camada, a **loja de melhorias do treinador** (bônus permanentes para a
  equipe toda, comprados com Shards: `data/trainerUpgrades.js`,
  `profile.trainerUpgrades`), **saiu na 0.21** a pedido do Fellipe ("vamos
  remover essa aba de melhorias"). Os botões Treinador (título, lobby e a barra
  lateral), a janela, os bônus e a conquista "Cliente Fiel" saíram; um save com
  melhorias compradas carrega sem elas (`normalizeProfile` descarta o campo e os
  degraus de conquistas que não existem mais). O balanceamento já era medido sem
  elas (o bot nunca comprava). A Pokédex e as conquistas valem para todas as
  jornadas.

Nunca voltar bônus globais para o pool de level up — foi pedido explícito.

### O 2º golpe — "Golpe Desperto" (0.14; nome e anúncio na 0.16)
- **O nome que o jogador vê é `BONUS_MOVE_LABEL`** (`data/bonusMoves.js`):
  "Golpe Desperto", padrão até o Fellipe decidir ("segundo golpe é muito feio,
  algo mais impactante"). No código continua `bonusMove`.
- **Aprender abre uma tela só** (0.16): a de nível, com uma opção única e dourada
  que anuncia o golpe; clicar segue a partida (`run.unlockQueue`, estado
  `'unlock'`, `Game.openUnlock`, `HUD.showUnlock`). É a única tela que o Pokémon
  com todas as melhorias ainda abre.
- **A chave do Golpe Desperto** (0.28, ideia do Fellipe: "o golpe desperto pode
  ser desbloqueado se você aprimorar totalmente certas melhorias — o Gyarados
  seria velocidade, penetração e dano; o Gloom, área, intervalo entre os danos e
  cooldown"). Cada golpe tem **3 melhorias que formam a chave**
  (`data/awakening.js`: `AWAKENING_KEYS` por golpe, `AWAKENING_BY_BEHAVIOR` para o
  resto). **Com as 3 no máximo, a chance do 2º golpe fica liberada: 4% a cada
  nível que o Pokémon sobe** (0.33, o Fellipe: "ele não aprende quando você
  maximiza os status obrigatórios, quando você maximiza, você libera a chance de 4%
  de aprender quando evoluir de lvl"; `CONFIG.bonusMove.chancePerLevel`,
  `ProgressionSystem.rollBonusMove` a cada nível do `addXpTo`). Fechar a chave
  avisa: "X completou a chave: 4% de chance de despertar um golpe a cada nível".
  De 0.28 a 0.32, a chave completa ensinava na hora, sem sorteio. A chave é do golpe, não
  da espécie, porque as melhorias são do golpe (o Gyarados usa Hydro Pump, o Gloom
  usa Toxic); trocar de golpe transfere as melhorias, então o progresso quase
  sempre vem junto. Todas somam 11 a 13 melhorias (33 a 39 níveis no mínimo; o
  `check-data` confere). Padrão até o Fellipe decidir golpe a golpe.
  - **Na tela de nível**, a melhoria da chave vem com moldura dourada e o aviso
    "Maximize para liberar o Golpe Desperto (4% a cada nível) · chave 4/12"
    embaixo (pedido do Fellipe; o selo "✦ GOLPE DESPERTO" no canto saiu na 0.28.1,
    também a pedido dele); na janela da equipe, o progresso de cada parte ("chave
    completa · 4% de despertar a cada nível" quando fecha); no PC, "✦ Desperto
    4/12" ("✦ Desperto 4%/nível" com a chave completa). Roteiro `despertar` no
    `screenshot.mjs`.
  - O golpe é um dos 3 do tipo principal ou, em quem tem dois tipos, um dos 3 do
    secundário em 1/3 das vezes (`CONFIG.bonusMove.secondaryShare`, a proporção
    dos antigos 2% e 1%). Um por Pokémon, para sempre; ele mantém o golpe dele e
    usa os dois.
  - **Quem chega tarde** (`trainToLevel`) recebe primeiro as melhorias da chave:
    um Gyarados capturado no nível 45 chega com a chave feita e a chance
    liberada, mas o golpe só vem subindo de nível (até a 0.32 ele já chegava
    desperto). Quem já tinha despertado continua com o golpe; os lendários
    continuam chegando com ele (o kit).
  - O bot (`tools/bot.mjs`) escolhe TM, depois a chave, depois dano.
  - Até a 0.27: com **todas** as melhorias (~18, nível ~54), 2% por nível do tipo
    principal e 1% do secundário.
  - O 2º golpe entra em `member.abilities` (o mesmo lugar do golpe extra dos
    iniciais), então o save, o PC e a troca já o levam.
- 51 golpes (3 por tipo, 17 tipos — Sombrio não tem Pokémon nas 151), com o nome
  oficial e a descrição em português. **Dano por acerto: 60% do golpe principal
  atual** (com as melhorias dele) × `hitScale`, que diminui o de quem acerta
  muito (auras, órbitas) e aumenta o raro (meteoros). Sem melhorias próprias.
- Comportamentos novos no `AbilitySystem`: `rain` (o aviso no chão, na cor do
  tipo, e o impacto: na horda mais perto, em inimigos ao acaso ou no de mais
  vida), `trail` (Flame Charge), `buff` (Dragon Dance, Reflect, Phantom Force) e
  `reactive` (Counter, quando o Pokémon leva dano). E: o Whirlpool nasce longe
  do próprio Pokémon e do treinador e puxa a horda (`placement: 'far'`, `pull`);
  as curas (Aqua Ring, Leech Seed, Draining Kiss, Grassy e Misty Terrain) param
  num teto de 2% da vida por segundo por Pokémon (`bonusHeal`); Hex amaldiçoa
  (explode ao morrer); Acid Spray enfraquece (+25% de dano); Magnet Bomb gruda e
  explode; Echoed Voice cresce a cada uso; Gyro Ball cresce com o treinador
  correndo; Tailwind acelera o treinador; Reflect tira 40% do dano da equipe.
- Os ids não repetem os golpes que saíram (`RETIRED_ABILITIES`): Flame Wheel,
  Whirlpool e Petal Dance têm ids próprios (`flame_ring`, `whirlpool_zone`,
  `petal_spiral`), porque saves antigos ainda trazem os velhos.

### Lendários (0.16)
- Pedido do Fellipe: "naturalmente mais fortes, já vêm com os atributos upados,
  até com segundo golpe, e o golpe primário é exclusivo deles, único e
  visualmente muito bonito". Tudo em `data/legendaries.js`.
- **Golpe exclusivo** (comportamento `signature`, lógica em
  `systems/signatureMoves.js`, desenho em `render/signature.js`): Articuno
  **Sheer Cold** (o floco gigante se forma em volta e estilhaça num anel de gelo
  que congela), Zapdos **Zap Cannon** (esfera de trovão lenta que atravessa a
  horda soltando raios e explode), Moltres **Sacred Fire** (asas de fogo, penas
  em espiral e colunas de chamas onde param), Mewtwo **Psystrike** (singularidade
  na horda mais densa que puxa todos e implode) e Mew **Metronome** (bolhas de
  arco-íris, cada uma um golpe ao acaso: fogo, gelo, trovão, veneno ou mente).
  A linha de golpes deles é só o exclusivo (sem TM acima). Ficam fora da conta
  de 4 golpes por tipo (`exclusive`). Melhorias geradas: dano, recarga, área,
  quantidade e raios, conforme o golpe.
- **Desenhados em código, sem `lighter`**: a luz somada lavava tudo para branco
  no gramado claro do FireRed. Cores saturadas e contorno escuro por baixo de
  cada traço claro. Sem tremor de tela (só os líderes tremem).
- **Kit** (`LEGENDARY_KITS`, `applyLegendaryKit` em `systems/moves.js`): chegam
  com pilhas de melhoria no exclusivo (dano 2, recarga 1 e área ou quantidade 1)
  e com o 2º golpe já aprendido (Hail, Bolt Strike, Heat Wave, Future Sight,
  Psyshock), **no nível da equipe** (os outros entram 3 abaixo). O kit roda na
  criação e a cada carregamento sem somar (fica no maior valor); um lendário de
  save antigo passa para o exclusivo levando as melhorias, como numa TM.
- **Mais fortes por natureza**: poder 2,45 (aves), 2,65 (Mew) e 2,85 (Mewtwo),
  contra 2,18 do Dragonite, o maior fora deles; vida 285 a 320.
- O card da Poké Ball marca "★ Lendário", com moldura roxa.
- **Tamanho em campo** (0.21.1, "o Articuno em campo tá muito pequeno"): todo
  Pokémon em campo tem o teto de altura `ANIM_MAX_HEIGHT` (`render/sprites.js`),
  e quem tem a animação num quadro enorme por causa das asas abertas encolhia
  demais (o Articuno, num quadro de 172x171, ficava em 43%). `fieldScale` (em
  `data/pokemon.js`) sobe o teto só de quem precisa: Articuno ×1,8, Moltres
  ×1,5. Roteiro de screenshot `aves` (as três lado a lado).
- **Onde aparecem** (0.18, "desde a fase 7, com porcentagem baixa que vai
  escalando até a fase do campeão; só pode aparecer 1 de cada lendário na mesma
  run"; números padrão até o Fellipe decidir): saíram das tabelas de captura e
  têm sorteio próprio (`LEGENDARY_ENCOUNTERS`, `CaptureSystem.rollLegendary`).
  Em cada Poké Ball, com a chance da fase, a última opção vira um lendário:
  Fase 7 3% e Fase 8 4% (só as aves), Lorelei 5%, Bruno 6%, Agatha 7%, Lance 8%
  e Campeão 12% (aves, Mewtwo e Mew; eram 2% a 10%, e o Fellipe pediu "aumentar
  levemente"). Entre eles, peso 1 por ave, 0,35 Mewtwo e
  0,15 Mew. O Campeão ganhou 1 Poké Ball (tinha 0). **Um de cada**: quem está na
  equipe, no PC da partida ou no da jornada (`run.ownedElsewhere`) não volta, e na
  mesma tentativa cada um aparece uma vez só, mesmo recusado
  (`run.legendariesOffered`). Medido: ~1,7 Poké Ball por tentativa nas Fases 7
  e 8, ~0,9 por sala da Liga; passando cada fase em ~1,5 tentativa, ~50% das
  jornadas veem algum lendário (cada ave ~19%, Mewtwo ~5%, Mew ~2%).
- **Poké Balls por tentativa** (0.18, bot, `balance.mjs` coluna "bolas"): Fase 1
  2,5 (teto 3), Fases 2 a 8 de 1,25 a 1,84 (teto 2; a chance de cair subiu de
  ×0,07 para ×0,085, +20%, mas o teto corta: a média foi de 1,50 para 1,62), Liga
  e Campeão ~0,9–1,0 (teto 1). Uma jornada passando tudo de primeira dá ~17.

### Poké Mart (0.23)
- Pedido do Fellipe: os Shards compram itens "bem caros, para prender o jogador a
  jogar para comprar as coisas"; Rare Candy e Creche foram cortados. Fica no
  balcão do vendedor, no Centro Pokémon da vila (0.29), e na barra do mapa da
  jornada (**Poké Mart**, janela `modal-mart`; dados em `data/items.js`, regras
  em `Game.martTargets/buyMartItem`).
- **Itens e preços:** Novo Sorteio **300** e Reviver **600** (vão para a mochila,
  `profile.bag`, do jogador como os Shards); TM **1.500** (ensina agora o próximo
  golpe da linha, com as melhorias: `learnNextMove`); as 5 pedras e o Cabo de
  Troca **2.500** cada (evoluem agora: `evolveMember`, as mesmas regras de golpe da
  evolução por nível). A TM e os de evolução abrem, no card, a lista de quem da
  jornada (equipe ou PC) pode receber; sem ninguém, o botão fica apagado.
- **A TM Dive (0.34, a L-6 do PLANEJAMENTO-LOBBY):** **1.500**, `kind: 'tm_dive'`.
  Troca **para sempre** o Golpe Desperto de um Pokémon **de Água** (tipo principal
  ou secundário, equipe ou PC) por **Dive**; o golpe principal fica. Só aparece na
  loja quando alguém pode aprender (`martTargets('tm_dive')` não vazio), e a lista
  mostra o golpe esquecido ("esquece Surf → Dive"). Um Pokémon de dois tipos que
  despertou o golpe do outro tipo (o Kabuto com Rock Tomb) também troca. O Dive
  está em `data/bonusMoves.js` com `tmOnly: true`, que o deixa **fora do sorteio**
  do Golpe Desperto (`BONUS_BY_TYPE`). Em campo é o comportamento do Dig (`rain`
  com `ownerBlink`): o Pokémon some, intocável, e sai embaixo da horda **mais
  perto** (o Dig vai no mais forte), num impacto de água em área. Na vila, o
  vendedor comenta uma vez quando a TM aparece (condição `diveTm`), e com Dive na
  equipe o pescador e a lagoa mudam; o SIM da lagoa ainda diz "em breve".
- **Na fase:** o Reviver aparece no card de quem desmaiou ("✚ Reviver", pulsando):
  clicar traz de volta com metade da vida, e ele entra em campo se houver vaga
  (`Game.useRevive`). O Novo Sorteio aparece na tela da Poké Ball (não nos
  presentes) e sorteia de novo as 4 opções (`Game.rerollCapture`).
- **Quem evolui por pedra ou troca não evolui mais por nível** (pedido do Fellipe):
  `evolution.method` ('stone'/'trade') + `item` (o id do Mart), e a Eevee com
  `by: { water_stone: 'vaporeon', thunder_stone: 'jolteon', fire_stone: 'flareon' }`
  — ela escolhe pela pedra (antes era sorteio no nível 30). São 18 espécies; o
  `check-data` confere que todas têm o item na loja.
- **Bug antigo corrigido junto:** a partida salva no meio (`pendingRun`) não era
  descartada ao ser retomada; abandonando depois, ela podia voltar por cima do
  progresso. Agora o `startStage` a consome.

### Evolução
- **Por nível, fiel aos jogos**: Charmander→Charmeleon 16→Charizard 36,
  Bulbasaur 16/32, Squirtle 16/36, Pidgey 18/36, Magikarp→Gyarados 20, etc.
- Onde a evolução real depende de pedra ou troca, **desde a 0.23 só o item do
  Poké Mart evolui** (antes usávamos um nível equivalente).
- Evoluir **mantém** as melhorias, **cura toda a vida** (0.11.3; antes mantinha a
  proporção) e **melhora o
  golpe** (0.8, pedido do Fellipe): se a espécie nova começa num golpe mais adiante
  na linha, o Pokémon passa para ele levando as melhorias, como uma TM.
- Evolução registra a espécie nova na Pokédex e abre uma tela de evolução.

### TMs — linha de 3 golpes por espécie
- Cada espécie tem `moveLine` com **exatamente 3 golpes**: base → TM → TM final.
- A TM que aparece no level up (4% de chance desde a 0.8; o golpe melhora mais
  pela evolução) dá **o próximo golpe da linha
  daquele Pokémon** — nunca um golpe aleatório de outro. (Bug antigo: Pidgey
  aprendia Hyper Beam. Corrigido e coberto por teste.)
- Ao aprender, **todas as melhorias investidas são transferidas** (`ember_damage`
  vira `flamethrower_damage`); o que não tem equivalente vira potência. Trocar
  nunca é downgrade.
- Quem está no último golpe da linha não recebe mais TM.
- Espécies evoluídas começam no golpe do estágio delas (Raticate já nasce com
  Hyper Fang), mas compartilham a mesma linha da família.

### Tipos: fraquezas e vantagens (0.32)
- Pedido do Fellipe: incentivar o jogador a explorar fraquezas e vantagens, "nos
  jogos de Pokémon muitos jogadores montam time pensando em vantagens de tipos, pois
  isso facilita, e jogar contra dificulta muito"; com o Charmander ele passava fácil
  pelo Brock mesmo com a resistência a fogo. Eram quatro causas, todas corrigidas:
  1. **A tabela estava incompleta** (só o essencial do começo: Fogo contra Fogo
     valia 1x; Gelo, Fantasma e Dragão atacavam sempre em 1x). Agora é a da série
     desde a 6ª geração, com Fada e Metálico (`EFFECTIVENESS` em `data/types.js`).
     As imunidades valem 0 no ataque: **Fantasma não pega em Normal** (o Gengar não
     faz nada no Rattata), Normal e Lutador não pegam em Fantasma, Elétrico em
     Terra, Terra em Voador, Dragão em Fada, Veneno em Metálico.
  2. **Queimadura e veneno ignoravam a resistência** (o Ember tirava os 4/s cheios
     do Geodude). O dano por segundo passa pela tabela do golpe que os causou
     (`applyEffects` em `combat.js`) e, como na série, Fogo não queima e Veneno e
     Metálico não envenenam.
  3. **O dano recebido não tinha tipo.** O contato, os projéteis e a onda do líder
     usam o 1º tipo do inimigo contra os tipos do seu Pokémon (`Run.damageCompanion`),
     pela tabela suavizada (`CONFIG.types.defense`): 2x → 1,5x, 4x → 2,25x,
     0,5x → 0,67x, 0,25x → 0,44x. Suave porque o contato da horda é constante;
     simétrica porque, com 0,6x na resistência, o jogo ficava mais fácil até para
     quem ignora os tipos (medido com o bot). **A imunidade vale 1x no dano
     recebido** (o Fellipe: "mesmo que o jogador tenha um pokemon tipo voador, e ele
     receba ataque de um pokemon tipo ground, ele deve tomar um dano normal 1x...
     só para garantir que não fique tão fácil"): vale para todas (Normal e Lutador
     no seu Fantasma, Elétrico no seu Terrestre...) e para o resultado do Pokémon
     inteiro (o Charizard, Fogo/Voador, toma 1x do Terra, como de um golpe Normal).
     O golpe continua do tipo dele: o Terra segue super efetivo no seu Elétrico. No
     ataque, a imunidade continua 0 (o seu Terra não pega em Voador).
  4. **O jogo compensava a vantagem.** O `starterTuning` do Squirtle (+20% no Brock e
     na Sabrina, +15% no Blaine) saiu; o mecanismo continua no `SpawnSystem`, sem
     uso. E a chance de captura não muda por tipo: Poliwag, Goldeen e Oddish voltaram
     de 2 para 4 na Fase 1 ("não acho justo diminuir a chance de aparição de certos
     pokémons só pq eles tem vantagem de tipo").
- **O que o jogador vê**: no banner do painel da fase, embaixo da pílula do tipo, o
  **"Fraco"** com os 3 tipos que mais batem no time do líder (a dica tem a lista
  inteira e as resistências; `teamWeaknesses` em `systems/matchup.js`, só com tipos
  que algum golpe do jogo tem). Um selo ▲/▼ em cada Pokémon (nos cards da Poké Ball
  e na equipe do mapa) foi testado e saiu: o Fellipe prefere só o "Fraco", antes de
  começar a fase. Na luta, "Super efetivo!", "Pouco efetivo…" e "Não afeta…" em cima
  do líder e dos elites, no máximo um a cada 2,5 s por alvo (roteiro `efetivo`); o
  número de dano é amarelo e maior no super efetivo, azul e menor no resistido, e
  some no imune; o dano que o seu Pokémon leva fica maior e mais vermelho na fraqueza.
- **O bot que monta o time por tipo** (`balance.mjs --tipos`, `tools/bot.mjs`): escolhe
  na Poké Ball quem tem mais vantagem contra o líder da fase e, com o líder em campo,
  troca para os de mais vantagem (uma troca por vez). A diferença para o bot de
  sempre mede quanto vale explorar as fraquezas (seção 5). Ele é um jogador fraco de
  tipos: escolhe só pelo líder da fase e não olha a horda (um Gastly capturado na
  Fase 6 não pega nos Normais da rota).

### O lendário secreto da Pokédex (0.35)
- Pedido do Fellipe: no fim da Pokédex, um Pokémon misterioso, "???", **sem
  silhueta e sem número**, que o jogador vê desde o começo sem saber quem é, e
  que só se revela ao ser capturado. É o **Kyogre**, do fundo da lagoa
  (PLANEJAMENTO-DIVE.md).
- Dados: `secret` em `data/regions.js` (`{ id: 'kyogre', dex: 382, name: 'Kyogre' }`).
  Perfil: `profile.pokedex.secret` (os ids capturados), que o
  `ProfileTracker.registerSecret(id)` preenche. Ele fica **fora da contagem** da
  Pokédex (continua "de 151") e, revelado, também aparece sem número.
- Hoje ninguém consegue capturá-lo (a descida existe desde a 0.36, mas o salão e
  a luta ainda não), então ele fica como "???" para todos: é a isca. A captura vai
  chamar `registerSecret` (etapa D-5 do PLANEJAMENTO-DIVE). Roteiro de
  screenshots: `pokedex`.

### O salão do Kyogre — o encontro, a luta, a captura e a cena (0.37)
- O resto do modo aquático, como as maquetes aprovadas (PLANEJAMENTO-DIVE.md,
  seções 8 a 10): "O Salão do Kyogre", "A Luta do Kyogre" (com 3 Dive Balls e a
  volta a 25%) e "Depois do Kyogre".
- **O encontro** (`game/KyogreHall.js`, `render/KyogreHallRenderer.js`): depois do
  Nível 6, o jogador emerge no `MarineCave_End` do Emerald e anda pelo salão (só
  colisão 0). Na margem do lago:
  - "Um Pokémon gigante dorme no fundo do salão...";
  - o despertar no estilo do Sapphire (o tremor e três clarões);
  - a aproximação e o grito do Emerald (o script `MarineCave_End_EventScript_Kyogre`,
    com o balanço do affine);
  - a transição de batalha do Kyogre (`B_TRANSITION_KYOGRE`).
- **O card da fase** (`ui/hallCard.js`): o painel do mapa da jornada, com Jogar e
  Voltar para a Vila. Voltar sai pela lagoa, e outra chance exige descer de novo.
- **A luta**:
  - A fase `kyogre` (secreta, fora da campanha) e `systems/kyogreFight.js` por cima
    dela, com o desenho em `render/kyogreFight.js`.
  - A arena é o salão aprovado: o cenário `fixed` `kyogre_hall`, o tileset cave do
    Emerald.
  - A chuva o tempo todo (Drizzle: golpes de Água ×1,5 e de Fogo ×0,5, para todos;
    a trombada não conta).
  - 45 s de maré de Hoenn; depois o Kyogre sai do lago, com a música "Vs. Lendário"
    do FireRed.
  - Os ataques dele: o Origin Pulse (três anéis), o Water Spout (mais forte com a
    vida cheia), o Thunder (abaixo de 50%), a horda chamada e o mergulho (abaixo de
    50%, volta pela poça mais perto do treinador). Fúria abaixo de 20%.
- **A captura**:
  - Enquanto houver Dive Ball, a vida não passa de 15% (`hpFloor`, em
    `combat.js`). Lá ele fica exausto 8 s, a horda para e a bola cai no campo, com
    uma seta na borda.
  - Pegar é jogar (o estado `legendary` do Run): até 3 balanços, 10% de captura.
  - Na falha, ele volta a 25%. Não pegou a bola a tempo: ele volta do mesmo jeito,
    mas a bola não conta.
  - 3 Dive Balls por luta. Sem bolas, ele pode ser derrotado.
- **Capturou**:
  - a tela de captura de sempre, sem "Ignorar" (o presente `mandatory`);
  - o Kyogre entra no nível da equipe, com o Origin Pulse exclusivo e o Water
    Spout;
  - o "???" da Pokédex se revela (`registerCaught(382)` vai para o `secret`, fora
    das 151);
  - a maré final de 30 s, e só depois a vitória.
- **O fim**: a volta é sempre pela lagoa. Caiu na luta: acorda no Centro, com a
  enfermeira (a luta não recomeça). Primeira vitória: 500 Shards.
- **A cena do Maxie** (`game/MaxieScene.js`, desenhada pelo `HubRenderer`): uma vez
  por jornada, depois da captura, na frente da lagoa ou no Centro. O Maxie chega,
  o "!", a fala, o Crobat no corte de tela do Voar, "A caminho do vulcão!" e o
  pássaro do Voar (ou a porta, no Centro).
- **O Endless aquático** (a fase `kyogre_endless`): com o Kyogre na jornada, o
  salão está vazio e o card é o da maré sem fim. Sem XP (`stage.noXp`); cada elite
  rende os Shards de sempre.
- **O registro**: `campaign.dive.captured` e `sceneSeen`. O pescador comenta a
  captura (a condição `kyogre`).
- **A medição** (`node tools/kyogre.mjs [nível] [lutas]`), com a equipe de pós-jogo
  do Fellipe (os 5 lendários de Kanto e o Blastoise, tudo no máximo):
  - nível 80: vence 1 de 3;
  - nível 90: vence 2 de 3, com 3 a 5 desmaios;
  - no Campeão, a mesma equipe no nível 80 vence sem desmaio.

  A alavanca é a `difficulty` da fase (1). Com 0,8, a de 80 vencia todas.
- **Os testes**: o `smoke-test` (a arena, a chuva, a chegada do Kyogre, o kit e a
  Pokédex) e o `ui-smoke` (o fluxo inteiro, do Nível 6 à cena e ao Endless). O
  roteiro de screenshots é `kyogre`.

### A descida do Dive — o modo aquático (0.36)
- Pedido do Fellipe, desenhado e medido numa maquete jogável que ele aprovou
  (PLANEJAMENTO-DIVE.md, seções 3 a 7). Na lagoa da vila, com alguém da equipe
  sabendo **Dive**, a pergunta "Quer usar Dive?" abre a descida (`Game.openDive`).
- **O tabuleiro:** 10×6 tiles de água navegável de verdade do Emerald (as Rotas
  126 e 127 submersas). **Regra do Fellipe: só os tiles navegáveis** (colisão 0 e
  elevação 3 no `map.bin`), na partida e nas animações. O mundo sai de
  `tools/assets/dive.py` (lê o decomp em `D:\fellipe\Dev\pokeemerald`) para
  `assets/dive/` e `data/diveWorld.js`.
- **O jogador** anda em tiles no passo do FireRed andando (16 quadros por tile), sem
  correr; o passo sai no primeiro toque. São **3 bolhas de vida**; o **bolsão de ar**
  enche as 3 na chegada ao Nível 3.
- **As hordas** atravessam linhas e colunas inteiras, depois de um aviso que
  encurta a cada nível (de 1,3 s a 0,35 s). Elas vêm **umas sobre as outras**, mas o
  sorteio só solta uma horda se houver saída andando para quem reage em 0,25 s
  (`Dive.solvable`). O `smoke-test` prova: o jogador perfeito com 0,25 s nunca é
  pego, e o mergulhador nunca sai da água navegável nas animações.
- **Perdeu as 3 bolhas:** acorda no Centro Pokémon, na frente da enfermeira
  (`enfermeira_resgate`), e o pescador comenta uma vez (`diveRescued`). **Passou o
  6:** a entrada submersa da Caverna Marinha; por enquanto ele volta à superfície
  pela lagoa (o salão do Kyogre é a etapa D-3).
- O registro fica na campanha: `campaign.dive = { best, rescues, reachedCave }`.
- Código: `game/Dive.js` (a regra, roda sem navegador), `render/DiveRenderer.js`,
  `ui/diveHud.js`, `data/dive.js`; a tela é `screen-dive`. Roteiro: `descida`.

### Captura
- Poké Ball dropa de inimigos derrotados, com **teto por fase** (`maxBalls`: 3 na
  Fase 1, 2 nas outras, 1 em cada sala da Liga e 1 no Campeão, que tinha 0 até a
  0.17). Desde a 0.10 só a
  Fase 1 tem **garantidas** (`scriptedBalls`, duas, para o inicial ganhar
  companhia): o Fellipe achou que elas deixavam a captura fácil demais.
- A bola rola devagar na direção do treinador quando ele está perto: sem isso,
  builds de longo alcance matavam longe e nunca capturavam.
- A chance de cair é ×0,085 (`CONFIG.capture.dropChanceMultiplier`; ×0,45 na
  0.8, ×0,15 na 0.9, ×0,07 na 0.10 e +20% na 0.18): pegar Pokémon novo é raro, a
  pedido do Fellipe.
- **Mais opções** (0.11): cada Poké Ball oferece 4 espécies; a tabela de uma
  fase acumula as das anteriores com metade do peso (`poolEntries`); os dois
  iniciais que o jogador não escolheu entram raros da Fase 3 em diante
  (`STARTER_CAPTURES`; o próprio inicial é filtrado no `CaptureSystem`).
- **Quem chega tarde vem treinado** (0.26, "capturado no nível alto, ele vem sem
  melhorias e fica ruim"): todo Pokémon tem pelo menos as melhorias que teria
  subindo do nível 1 — uma a cada 3 níveis —, menos as guardadas no ▲, aplicadas
  sozinhas com dano primeiro (`ProgressionSystem.trainToLevel`, chamado no
  `createMember` e no `restore`). Vale para captura, presente e quem já estava na
  jornada (é completado ao entrar numa fase). Um Gengar capturado no nível 57 chega
  com as 18 melhorias do Shadow Ball, e daí já pode aprender o Golpe Desperto.
- **Quem entra chega perto da equipe** (0.9): capturado ou presente, o novato tem
  a média de nível da equipe menos 3. Antes entrava no nível 1 e, numa equipe de
  nível 20, desmaiava na hora (parecia que a captura não tinha funcionado).
- **Ímã**: raríssimo (0,05% por selvagem, 1,5% por elite ou Pokémon de líder; um
  por vez no mapa). Ao pegar, todo o XP do mapa vem até o treinador
  (`Pickup.magnetized`), acelerando até 2400 px/s.
- Quais espécies aparecem e com qual chance está em `capturePools.js`, com as
  **9 tabelas de porcentagem definidas pelo Fellipe**. Uma espécie que não esteja
  em `data/pokemon.js` é filtrada automaticamente (as 151 estão lá desde a 0.7).
- A **Fase 1 foi ampliada** (0.11.2, "simples demais… mais chances de estágio 1"):
  28 espécies, 96% do peso em formas básicas (Rotas 1, 2, 22 e 3, Floresta de
  Viridian e a pesca do começo) e 4% nos evoluídos. Água e Planta (Poliwag,
  Goldeen, Oddish) ficaram em 2% cada porque tiram 4x do Brock. Na 0.32 voltaram a
  4%: a chance não muda por vantagem de tipo (ver "Tipos").
- **O card de escolha** (0.31, `ui/pokemonCard.js`), o mesmo do inicial e da Poké
  Ball: o sprite do FireRed em 2x na base de batalha, o nome e o papel, os tipos,
  três barras de 10 blocos e o golpe no pé. As barras saem de `starterStats`
  (`systems/stats.js`): Vida é o `hp`, Dano/s é dano × projéteis ÷ recarga do 1º
  golpe e Alcance é o alcance (ou a área) dele. A escala é a do inicial
  (`CONFIG.cards`: 150, 20 e 350), então um Pokémon forte enche a barra e o número
  mostra a diferença. O efeito do golpe (queimadura, veneno, lentidão) vem escrito
  embaixo, porque o Dano/s não conta. Na Poké Ball o card tem 252 px, o papel vai
  para baixo do nome e a descrição do golpe sai; com a equipe cheia, 146 px só com
  sprite, nome e tipos. Na escolha do inicial, três cards de 320 px com o cabeçalho
  de duas linhas (o papel do Squirtle quebra), véu escuro, título na placa do
  FireRed e o Voltar pequeno no canto, que também sai com ESC.

### Modo Livre (0.20)
- Pedido do Fellipe: "quando ganhar do Brock, além dos botões de hoje, um botão
  Modo Livre: um Endless Mode daquela fase, com XP reduzido; no canto superior
  direito, ao lado do contador de inimigos e da configuração, um botão Voltar para
  o Centro Pokémon"; e "os inimigos vão ganhando gradativamente mais status até
  que fique quase impossível".
- **Na tela de vitória** de todas as fases, **Modo Livre** (`Game.startEndless`);
  no Campeão, ela vem depois do Hall da Fama (0.27, "deve existir modo livre no
  campeão também"; antes o Hall da Fama ia direto para o mapa): a equipe volta curada e a fase continua
  sem fim (`Run.startEndless`, `SpawnSystem.startEndless`). As ondas da segunda
  metade da fase se repetem, sem o líder, e um elite da fase aparece a cada
  minuto. A vitória já ficou registrada; `_checkState` não dá outra.
- **Fica cada vez mais difícil** (`CONFIG.endless`, padrão até o Fellipe decidir):
  vida e dano dos inimigos ×1,2 por minuto, composto (5 min ×2,5; 10 min ×6,2;
  `SpawnSystem.endlessFactor`, que multiplica a força da fase), e +8% de inimigos
  por minuto até o dobro. **Uma Poké Ball a cada 3 minutos** sobrevividos, fora do
  teto da fase (0.22, `CONFIG.endless.ballEvery`), com o sorteio de lendário da
  Fase 7 em diante. **XP ×0,4** (era ×0,5: "ainda é muito"). As Poké Balls que
  caem dos inimigos seguem o teto da fase.
- **HUD**: o relógio mostra "∞" e o tempo no modo; a faixa, "MODO LIVRE -
  INIMIGOS MAIS FORTES" (texto do Fellipe). **"Voltar para o Centro Pokémon"** (vermelho, no canto) e cair
  com a equipe toda fazem o mesmo (`Game.leaveEndless`): guardam na jornada o que
  a equipe ganhou e vão para a vila, na frente de casa (0.29; na 0.20.1, direto
  ao mapa da jornada; antes, a janela do Centro). A equipe chega curada na
  próxima fase.
  Abandonar pela pausa também guarda. O PC: o da vitória já está na jornada, então
  o da partida recomeça vazio e a jornada soma ao que havia na entrada
  (`endlessBasePc`); o autosave do loop atualiza a jornada a cada 15 s.

### Os espaços de jornada (0.19)
- Pedido do Fellipe: "no lugar de continuar, estar escrito Jornada; quando clica,
  aparecem os espaços das jornadas que você fez, podendo fazer mais de uma com
  novos Pokémon, mas se eu quiser voltar para a outra eu posso também".
- **No título**, "Continuar" virou **Jornada** (selo "2 de 3"), que abre a tela
  de jornadas (`ui/journeys.js`); **Nova jornada** abre um espaço novo sem apagar
  as outras (`Game.newJourney`). São **3 espaços** (`CONFIG.save.maxJourneys`,
  padrão até o Fellipe decidir); cheios, a Nova jornada pede para apagar uma.
- **Cada card**: o treinador, as 8 insígnias, a equipe (ou o inicial, em 3 por
  linha desde a 0.23.1), a próxima fase e quando foi jogada; **Jogar** e
  **Apagar**, que pergunta no próprio card.
- **Continuar é sempre ir ao mapa** (0.24, "mesmo que tenha saído no meio da
  fase"; desde a 0.29, à vila, na frente de casa): a partida que ficou no meio (navegador fechado, save feito na pausa,
  outra jornada com partida guardada) entra na jornada como um abandono
  (`Game._foldPendingRun`, chamado ao abrir o jogo, ao carregar um save, ao trocar
  de jornada e no `continueGame`) — a equipe e o PC dela ficam — e o jogador cai
  no mapa. A foto da partida não fica mais em `pendingRun` depois de salvar ou
  abandonar (podia voltar por cima do progresso).
- **Cada jornada tem o seu**: treinador (menino ou menina) e o nome do jogador
  (0.30), inicial, insígnias, fases, equipe, PC, métricas, as falas já vistas na
  vila (0.29) e a partida em andamento. **Do jogador, para todas**: Pokédex,
  conquistas, Shards, a mochila do Poké Mart (0.23), a decoração do quarto (0.29)
  e o Hall da Fama.
- **Como fica no save** (`save/profile.js`): a jornada ATIVA mora nos campos de
  sempre (`trainer`, `trainerName`, `region`, `regions`, e o `run` do save), então o resto do
  jogo não mudou. `profile.journeys` guarda os espaços, e cada um guarda a sua em
  `data` (e a partida em `pendingRun`) enquanto não é a ativa; `activeJourney` é
  o id da ativa. Trocar (`openJourney`) guarda a ativa no espaço dela
  (`_stashActive`) e põe a escolhida nos campos de cima (`_activate`). Um espaço
  largado antes de escolher o treinador some sozinho (até a 0.28: o inicial). Save de antes da 0.19 vira o
  espaço 1 (`normalizeJourneys`). `newGame` continua sendo "recomeçar a jornada
  ativa" (o da derrota).

### A vila — o lobby jogável (0.29)
- Pedido do Fellipe (PLANEJAMENTO-LOBBY.md): "uma mini vila, mais de uma casa, não
  simplesmente um quadrado com as coisas em fileiradas"; um Centro Pokémon
  remodelado, com a enfermeira no balcão do PC ("não serve necessariamente para
  curar") e outro balcão com o Poké Mart; uma loja de Pokédolls; "nossa casa é onde
  a gente spawna", com o quarto vazio decorável com itens compráveis; o Oak dá o
  inicial e as saídas ficam travadas até lá.
- **O fluxo**: Nova jornada → treinador → o jogador **acorda no quarto**
  (`Game.openHub('bedroom')`). A mãe manda ao laboratório; o **Prof. Carvalho**
  conta a mini-história e abre a tela de cards do inicial
  (`Game.openStarterChoice`); o Voltar dela devolve ao laboratório
  (`cancelStarter`). Escolhido o inicial, o Carvalho entrega o **Mapa da
  Jornada** (0.30: "leve aqui o mapa, vai ser útil para você saber o caminho") e
  as saídas abrem. O botão do mapa, na vila, fica com o aviso até a primeira vez
  que abre (`hub.flags.mapa_visto`). **Continuar, o fim da partida, o Modo
  Livre e o Centro da derrota levam à vila, na frente de casa** (`openHub('home')`;
  até a 0.28, ao mapa). O mapa da jornada abre pela saída sul, pelo botão "Mapa da
  jornada" da barra (ou Start no controle) e tem um botão "Vila" de volta.
- **Jornada começada = treinador escolhido** (era: inicial escolhido). Ela aparece
  na tela de jornadas mesmo sem inicial (o card avisa que o Carvalho espera), não
  some ao trocar de jornada (`_stashActive`) e a "Nova jornada" só reaproveita a
  ativa se nem o treinador foi escolhido. `campaign.starter` vazio trava as duas
  saídas (os guardas falam e o jogador volta um passo) e o botão do mapa.
- **Andar em grade, como no FireRed** (a exceção à regra do movimento livre, que
  continua valendo na partida): um passo é um tile (16 quadros andando, 8
  correndo: `CONFIG.hub`); tocar numa direção nova só vira; Shift/X/B segurado
  corre; Enter/Espaço/Z/A fala e avança o texto; X/Backspace/B é o NÃO; clique num
  tile anda até ele pelo caminho mais curto (clique numa pessoa, placa ou porta
  anda até o lado e age; numa saída, sai). A porta é um tile que bloqueia e leva
  para dentro quando se anda contra ela; o tapete leva para fora com ↓ em cima
  dele; a escada e a entrada aberta da loja levam ao pisar.
- **Os mapas são do FireRed, montados** por `tools/assets/hub.py`: a vila (36x28) e
  7 interiores, em duas camadas (o que cobre os personagens, como a beirada dos
  telhados e a copa das árvores, vem do tipo de camada de cada metatile), com a
  colisão do `map.bin` de origem (bit de colisão e elevação 1 = água). O
  desenho é de `render/HubRenderer.js`: canvas do tamanho da tela, escala inteira
  (`CONFIG.hub.view`), câmera presa ao mapa e só na área abaixo da barra.
- **Os dados**: `data/hub.js` (portas, saídas, pessoas, objetos, decoração fixa),
  `data/dialogue.js` (as falas, com condições: inicial, insígnias, Campeão,
  Pokédex, "uma vez só" por jornada em `regions.<id>.hub.flags`) e `data/decor.js`
  (a loja de Pokédolls). Falas e lugares são rascunho para o Fellipe ajustar; a do
  pescador ("Às vezes fico imaginando o que tem lá embaixo...") é dele.
- **Centro Pokémon**: a enfermeira e a máquina ao lado abrem o PC; o vendedor do
  outro balcão abre o Poké Mart de sempre. Fala-se por cima do balcão (`counter`).
- **A loja de Pokédolls** (0.30, refinada a pedido do Fellipe): a entrada é um
  tapete só, embaixo à direita, com o caminho livre (os dois vasos que bloqueavam
  saíram), e o Lapras gigante fica no canto de cima, fora do corredor das vitrines.
- **O quarto decorável**: a vendedora da loja de Pokédolls abre o catálogo
  (`modal-decor`): mesa com PC (abre o PC), estante (abre o Estojo), tapete com TV,
  até 4 plantas, 5 bonecos e o Lapras gigante (só depois de um Hall da Fama). Cada
  compra aparece no lugar fixo dela e bloqueia o tile. **A decoração é do jogador**
  (`profile.decor`), o mesmo quarto em todas as jornadas (padrão até o Fellipe
  decidir). A cama já vem no quarto e salva o jogo (o .json).
- **Ainda em breve**: o mato alto a oeste (modo Endless) e a lagoa (o modo
  aquático do Dive, com a TM Dive no Mart) só mostram o aviso. Ver as seções 7 e 8
  do PLANEJAMENTO-LOBBY.md.

### O mapa da jornada (o lobby, 0.13)
- Desde a 0.29 ele é o **mapa da jornada**, aberto da vila (a saída sul ou o botão
  da barra). Embaixo do mapa, **Voltar para a Vila** (0.30) fecha o mapa e volta
  para onde o jogador estava. **O rosto do treinador acompanha a fase atual** (0.30):
  ao entrar fica na próxima da jornada, e escolher outra fase no mapa faz ele
  andar até lá (até a 0.29 ficava na cidade da última vitória).
- **O mapa da jornada é o Town Map de Kanto do FireRed** (`ui/lobby.js`, Etapa 9
  do PLANEJAMENTO), no lugar da lista de 13 cards: o mapa do decomp
  (`extract_region_map.py`, 192x144) em pixels inteiros; cada fase na cidade do
  ginásio e a Liga e o Campeão no Indigo Plateau (`data/regionMap.js`, as casas
  da grade 22x15 do jogo). Concluída mostra a insígnia; a próxima, o cursor do
  Town Map; bloqueada fica apagada; o número da fase embaixo. O rosto do
  treinador fica na fase escolhida e anda até a outra quando ela muda (0.30; até
  a 0.29, na cidade da última vitória). Ao entrar, a próxima fase já vem
  escolhida.
- **Ao lado, a fase escolhida** (refeita na 0.31): o salão do líder
  (`assets/ui/gym-banners`, do último trecho com cenário) com ele em 2x por cima e a
  pílula do tipo; "FASE 4" e o nome da fase; a faixa do líder (nome, insígnia, uma
  Poké Ball por Pokémon do `bossTeam` e a insígnia apagada até vencer); o caminho
  com a duração; o nível recomendado; as métricas numa linha, só depois da
  primeira tentativa; o JOGAR vermelho e o "Ver no estojo" como link; no banner,
  o "Fraco" (0.32, ver "Tipos"). Na Liga, as
  cinco salas para escolher em cima (ícones de 40 px), e a faixa não repete o nome
  quando ele já é o título. **Embaixo, a equipe** com os
  ícones do PC (a bolinha marca os 3 em campo); clicar abre o PC.
- **Barra do topo** com tudo: o treinador, o estojo em miniatura, Shards e
  Pokédex, os ícones (Pokédex, Conquistas com o aviso de "para coletar", Equipe,
  Opções, Ajuda; o Treinador saiu na 0.21) e PC, Poké Mart, Hall, Salvar e Menu
  escritos. A lateral de
  ícones e a engrenagem do canto saem desta tela.
- **Estojo de Insígnias** (`ui/badgeCase.js`): o Cartão de Treinador azul do
  FireRed (do Pokemon All) com as 8 insígnias nas casas dele, a Liga embaixo e,
  ao lado, as métricas da fase (`systems/stageStats.js`, gravadas em
  `applyRunResult`): vitórias de tentativas, melhor tempo, menos desmaios numa
  vitória, maior nível, capturas, dano e a primeira vitória (data e equipe).
  Abandonar no meio não conta. Saves de antes começam com "—".

### Fases
- **Uma fase = a jornada inteira até um ginásio.** Ela tem `segments` (Rota 1 →
  Rota 2 → Floresta → Ginásio) que trocam o cenário e aparecem no HUD.
- **Cenário** (0.8): cada trecho tem um `scene` (ou usa o do tema) e o chão é
  montado com metatiles do FireRed (`data/scenery.js`; gerador em
  `systems/terrain.js`, pintura em `render/scenery.js`).
- **Obstáculos** (0.9, D2): árvores, pedras, paredões, estátuas, paredes e
  desníveis **bloqueiam o treinador e os inimigos**. O que bloqueia é a colisão do
  mapa do FireRed (`solid` no `sceneManifest.js`, por metatile). O grid fica na
  lógica (`run.terrain`), então o bot e os testes andam no mesmo terreno. O
  treinador esbarra só com os pés (`FEET_BOX`); o inimigo usa uma caixa menor que
  o raio (cabe entre duas árvores), desliza no obstáculo e, travado de frente,
  contorna pelo lado. Os Pokémon da equipe, golpes e itens passam por cima. Ao
  mudar de trecho, quem ficou dentro de um obstáculo novo vai para o ponto livre
  mais perto (`Run._settleTerrain`).
- **Inimigo preso** (0.11.5): a separação entre inimigos (`Run._updateEnemies`)
  empurrava direto na posição e, na multidão, jogava inimigos para dentro das
  árvores; agora passa por `terrain.move`. Rede de segurança (ideia do Fellipe,
  `Run._unstick`, `CONFIG.enemies.unstick`): dentro de um obstáculo por 0,5 s, ou
  longe do treinador quase sem sair do lugar por ~3 s (encurralado atrás de uma
  árvore), o inimigo é teleportado para um ponto livre ao acaso — fora da tela, ou,
  se for um líder, a 260–380 px. Medido: 0 quadros dentro de obstáculo em 3,7
  milhões; todos os teleportes da amostra eram de inimigos com parede ao lado.
- **Líderes** (0.10, "derrotei o Brock de maneira muito simples"):
  `CONFIG.enemies.boss` dá vida ×4, dano ×1,6 e golpes 40% mais frequentes que os
  dados, mais uma **Rajada** que todo líder tem (`leader_barrage`: leque de
  projéteis mirando o treinador, com o visual do tipo do líder e um halo
  vermelho; `Run._hostileHit` faz o Pokémon mais perto levar o dano) e a
  **fúria** abaixo da metade da vida (`enemy.enraged`: mais rápido, golpes e
  invocações mais seguidos, rajada maior; brilho vermelho e "furioso!" na barra).
  Os líderes também invocam um Pokémon a mais, com mais frequência. Um líder pode
  espaçar os golpes com `cooldownMult` nos dados dele: o Brock tem 1,6 (0.11.3, a
  chuva de pedras "matava tudo"; o Onix soltava pedra a cada ~2 s, ~1,3 s na
  fúria) e ~10% menos vida (Geodude 1900 → 1700, Onix 3800 → 3400).
- **Duração fixa** (0.11, "uma média de 4 min, não crescente"; 0.15, "levemente
  mais rápido": de 3:30 para 2:45): todas as fases têm 2:45 até o líder
  (`duration: 165`), ~3:15 com a luta. Nas duas vezes a linha do tempo foi
  comprimida; as levas ficaram ×1/√f mais densas e cada selvagem vale ×1/√f de XP
  (`stage.xpScale`), para a equipe chegar ao líder no mesmo nível de antes.
  Medido na 0.15 (16 jornadas por inicial): Brock 20,6–21,5, Misty 26,8–28,9,
  Surge 37,9–39,2, Erika ~46,6, Koga 49,9–54,8, Sabrina 57–63,5 — o mesmo da
  `stage.leaderLevel` do líder que acompanhava a equipe (saiu na 0.17).
- **Música** (0.11): cada fase tem `music` e `leaderMusic`. `Game._updateMusic`
  escolhe a faixa a cada quadro (menus e vila, ou a do lugar da vila que tem a
  sua, como o Centro; fase, líder, vitória, Hall da Fama, Centro Pokémon da
  derrota) e
  `audio/music.js` toca com loop sem emenda (Web Audio, pontos do loop do jogo em
  `data/musicTracks.js`). O volume é o `CONFIG.audio.musicVolume`, salvo nas
  opções; na pausa a música abaixa.
- O chefe final é o **time do líder, enfrentado em sequência** (`bossTeam`),
  terminando no ace. Vencer dá insígnia + Shards.
- A **jornada carrega equipe, níveis e build** de uma fase para a próxima
  (`regions.kanto.journey`). **Desde a 0.17 a derrota também carrega** (ver
  "Progressão por tentativas" abaixo). A **derrota leva ao Centro Pokémon**
  (`Game.pokemonCenter`), que cura a equipe da jornada — a do fim da tentativa,
  com o que ela ganhou — e a fase recomeça (`leaveCenter`); ali mesmo dá para
  abrir o PC ou voltar para a vila (0.29; antes, o mapa da jornada).
- **Reiniciar a jornada do zero fica nas Opções** (0.33, o Fellipe: "quando
  derrotado, não deve aparecer a opção de recomeçar do zero a jornada... essa
  opção deve existir nas configurações"; de 0.11.1 a 0.32 era a 2ª saída da
  derrota). Só aparece com uma jornada ativa e, antes de apagar, pergunta no
  próprio item: "Tem certeza que deseja reiniciar a jornada? Seu progresso começa
  do zero." (Sim, reiniciar / Cancelar; fechar as Opções também desiste;
  `Menus.buildOptions`, `restartJourney` → `newGame`). Perde insígnias, equipe e
  PC da região; Pokédex, conquistas, Shards, a mochila, o quarto e o Hall da Fama
  ficam. No meio de uma fase, a partida acaba sem guardar.
- **Kanto tem 13 etapas** (0.7): os 8 ginásios, a Elite Four em 4 salas (uma por
  membro, cada uma com o time de 5 do FireRed) e o Campeão. Os times são os do
  FireRed, com os níveis dele; o do rival muda pelo seu inicial
  (`bossTeamByStarter`), como no jogo.
- ~~O líder acompanha a equipe~~ (0.14) **saiu na 0.17**: com a derrota
  guardando o progresso, upar tem de valer. O líder tem força fixa (o
  `bossLift` e o `stage.leaderLevel` saíram; o smoke confere que o líder é o
  mesmo com a equipe no nível 30 ou no 120).
- **Progressão por tentativas** (0.17, pedido do Fellipe: "forçar o jogador a
  melhorar seus Pokémon para passar as fases; ao morrer você não perde progresso
  daquela fase, apenas não desbloqueia a seguinte"):
  - a derrota guarda níveis, melhorias, evoluções, capturas e o PC da tentativa
    (`Game._journeyFrom`, gravado em `applyRunResult` vencendo ou não); abandonar
    no meio também guarda (sem contar nas métricas);
  - a próxima fase só abre vencendo; fases vencidas podem ser rejogadas para upar;
  - cada fase tem uma **força** (`stage.difficulty`): multiplica a vida e o dano
    de tudo nela, selvagens, elites e o time do líder. É a alavanca da campanha;
  - o mapa da jornada mostra o **nível recomendado** (`stage.recommendedLevel`: a média com
    que a equipe do bot ENTRA na tentativa que vence — a coluna "entrada" do
    `balance.mjs`; não o nível ao vencer, que já inclui o que a fase dá) ao lado
    da média da equipe: verde pronta, laranja perto (até 5 abaixo), vermelho longe;
  - a meta (padrão até o Fellipe decidir) é medida em tentativas do bot até
    passar: ~1,5 nas Fases 1 e 2, ~2 na 3 a 5, mais nas seguintes e ~4–5 na Liga,
    onde o Fellipe achava tudo fácil. O bot joga pior que ele.
- **A partida não congela em outra aba** (0.25, pedido do Fellipe): o navegador
  para o `requestAnimationFrame` de abas escondidas e desacelera os timers delas,
  então um **Worker** manda um toque a cada 100 ms e, com a aba escondida, o
  `Game._frame` anda a partida por ele (sem desenhar). O tempo passado vira passos
  de no máximo 50 ms (até 60 s por toque, `MAX_CATCH_UP`), então a partida anda no
  tempo certo mesmo com os toques espaçados. O teclado solta as teclas ao perder o
  foco (`input.js`), então o treinador fica parado. As telas que pedem escolha
  (melhoria, captura, evolução) continuam esperando o jogador.
- **A luta com o líder começa sozinha** (0.25): a apresentação mostra "A luta
  começa em 7s" embaixo do Lutar! (`CONFIG.leaderIntroSeconds`), e sem clique a
  luta começa no fim da contagem.
- **Os Shards no canto da partida** (0.25): "◆" ao lado de "⚔" (inimigos) e "◓"
  (capturas), atualizado na hora em que um chefe cai.
- **Tremor de tela só nos golpes dos líderes** (0.14, pedido do Fellipe): saiu o
  dos golpes do jogador (Earthquake, explosões), do Ímã, da fúria e da queda do
  líder.
- **Líderes das últimas fases** (0.12.2, "no começo tá equilibrado, no final tá
  muito fácil"): `stage.bossTuning: { hp, damage }` multiplica a vida e o dano
  (golpes inclusive, por `enemy.attackMult`) do time do líder. Rampa, padrão até o
  Fellipe decidir: Erika ×1,25/×1,1 · Koga ×1,35/×1,15 · Sabrina ×1,5/×1,2 ·
  Blaine ×1,6/×1,2 · Giovanni e Elite Four ×1,7/×1,25 · Lance ×1,75/×1,25 ·
  Campeão ×1,8/×1,3. Brock, Misty e Surge ficaram como estavam. Com as mesmas
  equipes salvas, a luta com o líder ficou mais longa (Erika 17–35 s → 23–53 s,
  Giovanni 29 → 49 s, Lorelei 49 → 98 s, Agatha 61 → 87 s). O bot quase não chega
  ao fim (morre nas ondas das Fases 4 a 6 mesmo sem a rampa), então a medida
  final é o Fellipe jogando.
- **Ajuste por inicial** (0.11.5, `stage.starterTuning`): onde um inicial sobra,
  vida e dano dos inimigos e do líder sobem um pouco quando ele é o da jornada
  (`SpawnSystem.spawnAt`, e `enemy.tilt` nos golpes do líder). Até a 0.31 o Squirtle
  tinha ×1,2 nas Fases 1 e 6 e ×1,15 na 7. **Saiu na 0.32**: a vantagem de tipo é
  para ser sentida, não compensada (ver "Tipos" acima; a medição está na seção 5).
- **Selvagens com nível** (0.7, só da Fase 3 em diante): cada onda tem `level:
  [mín, máx]`, que **acompanha a equipe** (alguns níveis abaixo dela no começo,
  perto do ace do líder no fim). Vida e dano crescem de forma composta por nível
  (`CONFIG.enemies`). As Fases 1 e 2 não têm nível e ficaram como eram.
- **Presentes** (`stage.gifts`): na hora marcada, a tela de captura abre com
  opções fixas, como as trocas e o Dojo do FireRed (Farfetch'd na Fase 3;
  Lickitung e Hitmonlee ou Hitmonchan na Fase 6). Um de cada vez.

### Shards (moeda)
- **Regras do Fellipe (0.22):** a recompensa da fase é **única** (só a primeira
  vitória paga `stage.reward.shards`: **100** nos ginásios, **150** em cada sala da
  Liga, **300** no Campeão; eram 140–800 + 180 da primeira vez; rejogar não ganha
  nada); cada
  **Pokémon de líder** derrotado dá **10** e cada **chefe simples** (elite) dá **5**,
  na hora (`ProfileTracker`, em `ENEMY_KILLED`), mesmo que a tentativa termine em
  derrota; no **Modo Livre** só os chefes simples pagam. O campo mostra "+10
  Shards" sobre o chefe e o resultado da fase, "Shards dos chefes". Mais as
  **conquistas** (o botão "coletar" na aba), reescaladas para ~11% do que pagavam
  (de 35.070 para 3.915 no total, mínimo 10 por degrau; a "Fortuna" com as metas
  divididas por 10).
- **Quanto rende:** os chefes de uma fase vencida de primeira dão 50–90; uma
  jornada inteira, ~1.300 dos chefes (com as tentativas extras) + 1.700 das fases
  ≈ 3.000. Depois da campanha, rejogar paga só os chefes (~20–30 por minuto) e o
  Modo Livre, 5 por minuto.
- São gastos no **Poké Mart** (0.23: de 300 a 2.500) e na **loja de Pokédolls**
  (0.29: os enfeites do quarto, de 60 a 1.500). Até a 0.21 iam para a loja de
  melhorias do treinador, que saiu.
- Saves antigos com `coins` migram para `shards` sozinhos.

---

## 5. Balanceamento atual

Valores em `src/core/config.js` (o que não estiver lá está em `/data`):

| Item | Valor |
|---|---|
| Pokémon ativos / equipe | 3 / 6 |
| Cooldown de troca | 6s |
| Curva de XP por Pokémon | 12 × 1,15^nível até o nível 20; depois cresce como (nível/20)^3,4 (0.28; era ^2,2) |
| Melhoria a cada | 3 níveis |
| Chance de TM no level up | 4% (o golpe melhora mais pela evolução) |
| Vida por nível / dano por nível | +6 HP / +7% |
| Invencibilidade após golpe | 0,5s |
| Regeneração: campo / reserva | 0,6 / 2,5 HP/s |
| Chance de poção (selvagem comum) | 4% |
| Poké Balls por fase | até 3 na Fase 1 (duas garantidas), 2 nas outras, 1 em cada sala da Liga e no Campeão (desde a 0.18); chance de cair ×0,085 (×0,07 até a 0.17) |
| Ímã | 0,05% por selvagem, 1,5% por elite ou Pokémon de líder |
| Jogador virtual (`tools/bot.mjs`) | escolhe a TM, depois a chave do Golpe Desperto, depois a melhoria que mais dá dano; circula pela arena desviando do que encosta, dos avisos e dos projéteis dos líderes, e vai atrás das Poké Balls; com `--tipos` (0.32), escolhe na Poké Ball e troca em campo pela vantagem contra o líder |
| Dano, vida e quantidade de inimigos | dano ×1,3, vida ×1,2 e ondas ×1,2 em todas as fases (`CONFIG.enemies`), além do `scaling` de cada fase |
| Líderes | vida ×4, dano ×1,6, golpes a cada 60% do tempo, Rajada, fúria abaixo de 50% (`CONFIG.enemies.boss`) |
| Dano recebido por tipo (0.32) | 2x → 1,5x · 4x → 2,25x · 0,5x → 0,67x · 0,25x → 0,44x · imune → 1x (`CONFIG.types.defense`); o dano que a equipe causa usa a tabela cheia |
| Nível de quem entra na equipe | média da equipe − 3 |
| Shards | só a 1ª vitória da fase paga: 100 nos ginásios, 150 em cada sala da Liga, 300 no Campeão; 10 por Pokémon de líder e 5 por elite, na hora (0.22) |
| Duração das fases | 2:45 até o líder em todas (~3:15 com a luta), desde a 0.15 (3:30 na 0.11) |
| Opções por Poké Ball | 4 (tabelas acumuladas; os outros iniciais raros da Fase 3 em diante) |
| Selvagens por nível (Fase 3+) | vida ×1,075 e dano ×1,035 por nível acima do 5; XP +8% por nível |
| Golpe Desperto | com a chave completa, 4% de chance a cada nível (0.33); 60% do dano do golpe principal; 1/3 das vezes do 2º tipo; curas com teto de 2% da vida por segundo (`CONFIG.bonusMove`) |
| Modo Livre | XP ×0,4; inimigos ×1,2 por minuto (composto) e +8% por minuto até o dobro; um elite por minuto e uma Poké Ball a cada 3 min (`CONFIG.endless`) |

**A vantagem de tipo medida na 0.32** (24 jornadas por inicial,
`--runs 24 --jobs 12 --starter <inicial>`, com e sem `--tipos`). Vitórias de
primeira contra o líder, bot de sempre, da 0.31 para a 0.32:

| Líder | Charmander | Bulbasaur | Squirtle |
|---|---|---|---|
| Brock (Pedra) | 11 → 7 | 12 → 10 | 12 → 18 |
| Misty (Água) | 5 → 11 | 8 → 15 | 7 → 1 |
| Erika (Planta) | 12 → 16 | 10 → 16 | 14 → 12 |
| Blaine (Fogo) | 6 → 7 de 17 | 4 → 6 de 16 | 12 de 15 → 14 de 16 |

Na 0.31 os três iniciais venciam o Brock na mesma proporção; agora o tipo decide.
Quem explora as fraquezas vira os confrontos ruins: com o bot que monta o time por
tipo, o Charmander vence o Brock de primeira em 18 de 24 (7 com o de sempre) e o
Squirtle vence a Misty em 14 de 24 (1). Somando as tentativas até o Giovanni, o bot
de sempre fica em 21,8 (Charmander), 24,9 (Bulbasaur) e 20,4 (Squirtle) — eram 25,9,
29,2 e 17,9: os iniciais ficaram mais parecidos, e o Squirtle deixou de ser o fácil.
O bot por tipo soma 23,7, 22,7 e 17,5 (ele erra na Sabrina com o Charmander).
Variação: em 24 jornadas, ±3 vitórias de primeira é ruído. Medido com a imunidade
a 0,3x no dano recebido; a 1x (pedido logo depois) só deixa mais difícil, e só
onde havia imunidade: o Charizard volta a tomar 100% do Terra (Giovanni).

A campanha inteira não foi medida de novo depois da 0.32: as tabelas abaixo são de
antes da defesa por tipo e do fim do `starterTuning`.

**Dificuldade medida na 0.28** (curva de XP nova, chave do Golpe Desperto e
`difficulty` recalibrada; `npm run balance -- --runs 60 --jobs 12`, o bot mirando a
chave). "0.27" é a mesma medida antes da mudança (18 jornadas). Pedido do Fellipe:
o Brock como está, todas as outras mais duras, menos níveis.

| Etapa | `difficulty` (0.27 → 0.28) | Tentativas 0.27 | Tentativas 0.28 | Entrada (`recommendedLevel`) | Ao vencer 0.27 → 0.28 |
|---|---|---|---|---|---|
| Fase 1 (Brock) | 1 (igual) | 1,3 | 1,7 ¹ | — | 21 → 20 |
| Fase 2 (Misty) | 1,08 → 1,25 | 1,1 | 2,0 | 25 | 29 → 29 |
| Fase 3 (Lt. Surge) | 1,4 (igual) | 1,1 | 2,1 | 33 | 39 → 38 |
| Fase 4 (Erika) | 1 (igual) | 1,1 | 2,1 | 40 | 47 → 44 |
| Fase 5 (Koga) | 1 → 0,85 | 2,3 | 2,7 | 46 | 58 → 49 |
| Fase 6 (Sabrina) | 1 → 0,82 | 4,5 | 4,1–5,1 ² | 50 | 66 → 53 |
| Fase 7 (Blaine) | 1 → 0,82 | 2,4 | 3,2 | 55 | 74 → 58 |
| 56 | o encontro do Kyogre no estilo Sapphire, depois um card de fase com Jogar ou Voltar para a Vila; planejar a luta e a captura e ver numa maquete; a cura depois da fuga alta demais, 3 Dive Balls, o cenário aprovado | as maquetes "O Salão do Kyogre" (aprovada) e "A Luta do Kyogre"; 3 Dive Balls de 10% (~27% por luta), a fuga volta a 25% (eram 40%); o cenário da maquete; PLANEJAMENTO-DIVE seções 8 e 9 |
| 57 | "pode fazer tudo como planejamos desde o início, e vamos ver como ficaria" | 0.37: o modo aquático completo: o salão com o encontro (Sapphire e Emerald) e o card, a luta do Kyogre (a arena aprovada, a chuva, os ataques, o mergulho, as 3 Dive Balls, a volta a 25%, a maré final), o Kyogre na equipe (Origin Pulse e Water Spout, o "???" revelado), a cena do Maxie (lagoa ou Centro) e o Endless aquático sem XP; a força da fase medida com `tools/kyogre.mjs` (nível 80 vence 1 em 3, nível 90 2 em 3) |
| Fase 8 (Giovanni) | 1 → 0,8 | 4,0 | 4,5 | 60 | 84 → 62 |
| Lorelei | 1,05 → 0,8 | 3,5 | 3,1–4,7 | 64 | 92 → 66 |
| Bruno | 1,12 → 0,97 | 3,7 | 3,5–6,3 ² | 66 | 99 → 68 |
| Agatha | 1,05 → 0,95 | 2,2 | 4,4–5,6 | 70 | 104 → 71 |
| Lance | 1,15 → 0,88 | 3,7 | 4,1–5,5 | 72 | 112 → 74 |
| Campeão | 1,25 → 1,08 | 5,0 | 4,3–5,8 ² | 74 | 115 → 74 |

¹ A Fase 1 não mudou (a curva só muda do nível 20 em diante); a diferença é a
variação do bot, que agora também prefere as melhorias da chave às de dano.
² Faixas: medições diferentes do mesmo valor (ou de vizinhos: Sabrina 0,8–0,83,
Bruno 0,95–0,98, Campeão 1,05–1,1). Na Liga a resposta é muito íngreme — 10% de
força dobra as tentativas — e poucas jornadas chegam lá, então o valor ficou no
meio da faixa. `difficulty` abaixo de 1 não é fase fácil: a equipe chega de 10 a
40 níveis abaixo da 0.27. A medida final é o Fellipe jogando.

Como foi calibrado: as fases em ordem, cada uma a partir das equipes que venceram
a anterior (`--save` / `--load`), testando 3 valores em paralelo com `--set`.

**Dificuldade medida na 0.17** (a derrota guarda o progresso; o bot repete a fase,
levando o que ganhou, até vencer — teto de 10 tentativas; 15 jornadas do zero,
`npm run balance -- --runs 15`). "Entrada" é o nível com que a equipe começa a
tentativa que vence: é o `recommendedLevel` (a Fase 1 não tem, vence-se do nível 1).

| Etapa | `difficulty` | 1ª tentativa | Tentativas até passar | Entrada | Ao vencer |
|---|---|---|---|---|---|
| Fase 1 (Brock) | 1 | 8/15 | 1,5 | 7 | 20 |
| Fase 2 (Misty) | 1,08 | 6/15 | 1,6 | 25 | 31 |
| Fase 3 (Lt. Surge) | 1,4 | 7/15 | 1,6 | 33 | 41 |
| Fase 4 (Erika) | 1 | 9/15 | 1,9 | 44 | 52 |
| Fase 5 (Koga) | 1 | 5/15 | 4,3 ² | 59 | 63 |
| Fase 6 (Sabrina) | 1 | 3/13 | 5,3 ² | 68 | 73 |
| Fase 7 (Blaine) | 1 | 6/10 | 2,1 | 77 | 82 |
| Fase 8 (Giovanni) | 1 | 5/10 | 2,7 | 86 | 90 |
| Lorelei | 1,05 | 5/10 | 3,8 | 93 | 97 |
| Bruno | 1,12 | 5/9 | 3,2 | 93 | 96 |
| Agatha | 1,05 | 4/7 | 2,7 | 99 | 102 |
| Lance | 1,15 | 1/7 | 2,9 | 105 | 108 |
| Campeão | 1,25 | 3/7 | 3,3 | 106 | 108 |

² As Fases 5 e 6 são a parede do bot desde antes (ele morre nas ondas; de 1,9 a
4,3 tentativas entre medições, sem mudar nada). Não foram mexidas: o Fellipe
passou por elas sem reclamar. A Liga, a parte que ele achava fácil, subiu de
~1,3–3 tentativas para ~3–4 (numa medição a partir das equipes que venceram o
Giovanni, 16 jornadas: 3,4 / 5,3 / 3,0 / 5,3 / 3,7). A variação entre medições é
grande: a mesma fase já deu de 3 a 5 tentativas.

**Dificuldade medida na 0.11** (histórico: fases de 3:30 até o líder, 4 opções por Poké Ball e
tabelas acumuladas; jogador virtual esperto, `npm run balance` em blocos
encadeados). A meta é ~40–50% para o bot: quem joga bem vence mais.

| Etapa | Vitórias do bot | Nível no líder (ace) | Luta com o líder | Desmaios | Pico de inimigos | `scaling` (vida / dano) |
|---|---|---|---|---|---|---|
| Fase 1 (Brock) | 25% ¹ | 21 (14) | 24s | 2,5 | 60 | 1,8 / 0,18 |
| Fase 2 (Misty) | 44% | 27 (21) | 41s | 3,8 | 93 | 2,9 / 1,0 |
| Fase 3 (Lt. Surge) | 46% | 37 (24) | 22s | 3,7 | 108 | 3,0 / 2,3 |
| Fase 4 (Erika) | 68% \* | 46 (29) | 26s | 2,1 | 105 | 3,5 / 5,2 |
| Fase 5 (Koga) | 81% \* | 52 (43) | 36s | 1,6 | 109 | 4,0 / 7,2 |
| Fase 6 (Sabrina) | 88% \* | 59 (43) | 46s | 1,6 | 154 | 7,0 / 5,2 |
| Fase 7 (Blaine) | 42% | 68 (47) | 39s | 4,0 | 143 | 4,5 / 6,0 |
| Fase 8 (Giovanni) | 79% \* | 74 (50) | 32s | 2,1 | 141 | 3,2 / 12,5 |
| Lorelei | 46% | 80 (54) | 59s | 3,9 | 184 | 4,0 / 4,6 |
| Bruno | 92% \* | 87 (56) | 49s | 1,8 | 120 | 2,4 / 10 |
| Agatha | 52% | 95 (58) | 63s | 3,9 | 110 | 2,9 / 3,8 |
| Lance | 79% \* | 94 (60) | 71s | 2,1 | 139 | 2,7 / 2,8 |
| Campeão | 26% \* | 104 (63) | 73s | 4,7 | 145 | 2,4 / 2,1 |

Média medida: 59% (as 4 opções por Poké Ball deixaram as equipes mais fortes).
¹ Charmander contra o Brock é o caminho difícil (~10%); Bulbasaur ~35%, Squirtle
~75%. Com a Fase 1 ampliada (0.11.2, evoluídos raros na Poké Ball), o bot
passou de 30% → 4% com Bulbasaur, 2% → 2% com Charmander e 73% → 64% com
Squirtle (16 jornadas cada; o bot pega sempre a primeira opção). \* Depois da medição, o dano dessas subiu (e o do Campeão desceu) para
voltar à meta: Erika 4,6 → 5,2, Koga 6,2 → 7,2, Sabrina 4,2 → 5,2, Giovanni
11 → 12,5, Bruno 8,6 → 10, Lance 2,3 → 2,8, Campeão 2,4 → 2,1.

Por cima do `scaling` de cada fase valem o `CONFIG.enemies` (dano ×1,3, vida ×1,2,
ondas ×1,2) e o reforço dos líderes. **A variação entre medições é grande**: a
mesma fase com o mesmo número já deu 18% e 41%, porque a qualidade da equipe que
chega (capturas, golpes, evoluções) pesa muito. Olhe a média de várias rodadas e
mexa só no que sai do padrão em todas. Com menos Poké Balls, a Fase 1 é decidida
pelo tamanho da equipe: as ondas dela foram pensadas para 2 Pokémon. O Fellipe
joga melhor que o bot: se a sensação for de jogo fácil, a primeira alavanca é o
`scaling.damage` da fase.

**Como ajustar dificuldade** (na ordem de impacto):
0. **`stage.difficulty`** (0.17) — a força da fase: vida e dano de tudo nela, o
   líder inclusive. É a primeira alavanca agora; meça em tentativas até passar.
1. `scaling.damage` da fase — é o que mais mata. Por cima dele vale o
   `CONFIG.enemies.damageMult` (1,3), igual para todas.
2. Densidade das ondas (`batch`, `interval`, `maxAlive`) e quantidade de elites;
   `CONFIG.enemies.spawnMult` (1,2) aumenta todas de uma vez.
3. `scaling.hp` da fase — alonga a partida sem matar.
4. Faixa de `level` das ondas (Fase 3+): cada nível a mais é +7,5% de vida.
5. Vida dos Pokémon do líder em `enemies.js`.
6. `CONFIG.enemies` / `damagePerLevel` / upgrade de dano — mexem em todas as
   fases de uma vez: evite.

**Como medir uma fase do fim** sem rejogar tudo: `npm run balance -- --until
gym_5_fuchsia --save equipes.json` guarda as equipes que venceram, e `--load
equipes.json --from gym_6_saffron` recomeça delas. Cada fase recebe equipes vindas
da anterior, então calibre **em ordem**, uma fase por vez.

⚠️ Aprendizado: mexer em várias alavancas ao mesmo tempo já levou de 90% para 13%
de vitória. **Mexa em uma, meça, repita.**

---

## 6. Comportamentos genéricos de habilidade

O `AbilitySystem` conhece 12 comportamentos: os 7 de sempre, o `signature` dos
lendários e 4 que vieram com o Golpe Desperto (0.14). Golpe novo quase sempre reusa um:

| Comportamento | O que faz | Exemplos |
|---|---|---|
| `projectile` | dispara projéteis no alvo (pierce, homing, explosão) | Ember, Hydro Pump |
| `melee_arc` | golpe em arco perto do Pokémon | Vine Whip, Cross Chop |
| `orbit` | orbes girando em volta | Fire Spin |
| `aura` | área permanente com dano por tick | Mega Drain |
| `ground_zone` | área no chão, no alvo, por alguns segundos | Toxic, String Shot |
| `nova` | onda que se expande do Pokémon | Gust, Earthquake |
| `chain` | raio que salta entre inimigos | Thunder Shock, Thunder |
| `signature` | golpe exclusivo de lendário, com lógica e desenho próprios (0.16) | Sheer Cold, Psystrike |
| `rain` | cai do céu: o aviso no chão e o impacto (na horda mais perto, ao acaso ou no de mais vida) | Hail, Bolt Strike, Draco Meteor |
| `trail` | rastro no chão por onde o Pokémon passa | Flame Charge |
| `buff` | reforço por alguns segundos (dano e recarga, escudo, intangível) | Dragon Dance, Reflect, Phantom Force |
| `reactive` | revida quando o Pokémon leva dano | Counter |

Stats suportadas: `damage, cooldown, count, speed, range, pierce, size, duration,
area, arc, spread, tickRate, chains, knockback, homing, explodeDamage` +
`effects: { burn, poison, slow }`.

Os upgrades genéricos (dano, recarga, quantidade, área, perfuração...) são
**gerados automaticamente** para toda habilidade nova em `upgrades.js`.

**No máximo 4 golpes por tipo** (pedido do Fellipe na 0.6, para o jogo ficar leve
no navegador): cada tipo tem base, TM e final, reaproveitados pelas espécies. São
52 golpes jogáveis em 16 tipos; o `smoke` falha se algum tipo passar de 4. Ficam
fora dessa conta os 5 exclusivos dos lendários, os 51 do Golpe Desperto
(`data/bonusMoves.js`) e os 4 dos líderes: `leader_barrage` (a Rajada de todo
líder), `leader_rock_barrage`, `leader_whirlpool` e `boss_shockwave`, um golpe só
que muda de cara conforme o tipo de quem usa (`BOSS_WAVE_FX`).

**Golpes que saíram** ficam em `RETIRED_ABILITIES` (`abilities.js`): um save antigo
que ainda tenha um deles recebe o golpe da mesma posição na linha nova da espécie,
com as melhorias transferidas (`migrateMember` em `systems/moves.js`). Nunca
reaproveite o id de um golpe que saiu.

**Visual dos golpes** (`data/fx.js`): `ABILITY_FX` diz que sprite cada golpe usa
(corpo, acerto, borda da aura, frente da onda, nó do raio, golpe no alvo) e `FX`
diz como cada sprite anima. O sprite vem da animação do próprio golpe no FireRed.
O `check-data` confere que todo golpe tem visual e todo visual tem sprite.

---

## 7. Assets

Duas fontes:

**1. Sprites do FireRed, locais (desde a 0.5).** Gerados por
`tools/assets/extract.py` a partir do decomp **pret/pokefirered** que fica no
**Pokemon All** (`D:\fellipe\Dev\Pokemon All`, o outro projeto do Fellipe, feito
com o Braga). **O Pokemon All é só leitura**: o extrator lê de lá e grava aqui.
Procedência e como regerar: `assets/PROVENIENCIA.md`.

| Uso | Arquivo |
|---|---|
| Treinador andando e correndo | `assets/trainers/{red,leaf}.png`, 18 quadros de 16x32 |
| Retratos (escolha, mapa, Opções) | `assets/trainers/portraits/<id>.png`: Red, Leaf, Oak, os 8 líderes, a Elite Four e o rival |
| Caixa de texto do FireRed | `assets/ui/text_window.png`, usada como `border-image` (`.fr-window`) |
| Sprites de golpe | `assets/fx/<id>.png`: 46 folhas tiradas de `graphics/battle_anims/sprites` (ver `FX` em `extract.py`) |
| Pokémon animados (em campo) | `assets/pokemon/<dex>.png`: os GIFs da Gen 5 do Pokemon All em tiras de quadros; `assets/pokemon/shiny/<dex>.png`, as cores shiny |
| Pokémon do FireRed | `assets/pokemon/gen3/{front,front-shiny,icons}/<dex>.png`: o sprite frontal (cards de escolha e PC) e o ícone de caixa (PC e a equipe do mapa da jornada) |
| PC do FireRed (0.12) | `assets/pc/`: fundo, painéis, botões, a mão, as setas e os 16 papéis de parede |
| Mapa da jornada e Estojo (0.13) | `assets/ui/region-map/` (o Town Map de Kanto, o cursor e os ícones do Red e da Leaf) e `assets/ui/trainer-card.png` (o Cartão de Treinador) |
| Poké Ball, Ímã e Poção no chão | `assets/items/{poke-ball,magnet,potion}.png` |
| Cenário | `assets/scenes/<id>.png`: as metatiles de cada mapa (17 cenários em 16 folhas: o corredor da Liga usa a da sala do Lance); `src/data/sceneManifest.js` diz qual metatile é cada quadro e guarda o mapa dos salões |
| Moldura das janelas e dos botões | `assets/ui/window-frame.png` (3x, fatia 24) e `window-frame-button.png` (2x, fatia 16): a `text_window` do FireRed, copiadas do Pokemon All |
| Fontes | `assets/fonts/`: Press Start 2P e Pixelify Sans (licença OFL), as do Pokemon All |
| Fundo da tela de título | `assets/ui/title-background.webp`: arte do Fellipe (a clareira à noite cercada pela horda) |
| Banner do README (0.32.3) | `assets/banner.png` (1280x480): o logo do jogo sobre essa arte, fotografado de `tools/banner.html` pelo roteiro `banner`; mudou o logo, é só regerar. Até a 0.32.2 era um SVG da 0.4 |
| Banners dos salões (0.31) | `assets/ui/gym-banners/<cenário>.png`: 12x4 metatiles (192x64) do mapa de cada salão de líder, em volta de onde ele fica; o painel da fase mostra em 2x. Gerados por `tools/assets/gym_banners.py` |
| A vila (0.29) | `assets/hub/<mapa>.png` e `-top.png` (o chão e o que cobre os personagens), `assets/hub/npc/<id>.png` (as pessoas e os bonecos), `assets/hub/decor/<id>.png` (os móveis do quarto); `src/data/hubMaps.js` diz o tamanho e a colisão de cada mapa. Gerados por `tools/assets/hub.py` |
| Músicas | `assets/music/*.ogg`: 18 do FireRed, a vinheta de cura do Centro Pokémon (`tools/assets/render_music.py`) e o tema do lobby do Pokemon All; 7,5 MB ao todo, cada uma carregada quando toca |

- Tudo é pixel art em **escala inteira, sem suavização** (`CONFIG.render.pixelScale`,
  hoje 2). `render/assets.js` carrega sob demanda e, enquanto a folha não carrega,
  devolve null: quem desenha cai no desenho procedural de antes. É assim que os
  testes sem navegador continuam rodando.
- Do Pokemon All, o que ainda não entrou no jogo são os gritos e os efeitos
  sonoros (a Etapa 5 do `PLANEJAMENTO.md`; a §3 de lá diz onde eles ficam).

**2. PokeAPI/sprites, pela internet** (verificado, tudo 200):

| Uso | Caminho |
|---|---|
| Canvas (jogo) | `sprites/pokemon/<dex>.png` — o estático, só enquanto a tira animada local não carrega |
| HUD da equipe, telas de nível e evolução, Pokédex | `.../versions/generation-v/black-white/animated/<dex>.gif` (os cards de escolha usam o sprite do FireRed desde a 0.31) |
| Ícones de interface | `sprites/items/<nome>.png` |
| Insígnias de ginásio | `sprites/badges/<n>.png` (1 = Pedra, 2 = Cascata...) |

- O treinador desenhado à mão (`Renderer._drawTrainerFallback`) ficou como reserva
  para quando o sprite ainda não carregou.
- `render/icons.js` mapeia **chaves semânticas** (`damage`, `shards`, `pokedex`...)
  para itens. Os dados guardam só a chave; cada ícone tem emoji de reserva se
  estiver offline. **Preferência do Fellipe: ícones de item, não emojis.**
- Offline: sprites caem para um desenho procedural; ícones caem para emoji.

---

## 8. Save

Arquivo `.json` baixado pelo navegador (o botão Salvar das barras da vila e do
mapa, ou a cama do quarto) + autosave em `localStorage` (para o botão Jornada da
tela de título). Estrutura, resumida:

```jsonc
{
  "signature": "pokemon-bullet-heaven", "schemaVersion": 1, "gameVersion": "0.32.1", "savedAt": "...",
  "profile": {
    "trainer": "leaf",                               // da jornada ativa; null = ainda não escolheu
    "trainerName": "Ash",                            // da jornada ativa (0.30); null = o do modelo
    "shards": 620,
    "bag": { "reroll": 0, "revive": 1 },             // a mochila do Poké Mart (0.23)
    "decor": { "planta": 2, "doll_pikachu": 1 },     // o quarto (0.29), o mesmo em todas as jornadas
    "pokedex": { "caught": [4, 5, 25], "shiny": [25] },  // só capturados/evoluídos; shiny: 0.13.1
    "achievements": { "tiers": { "catcher": 2 }, "notified": { "catcher": 3 } },  // degraus coletados (0.11)
    "stats": { "totalKills": 0, "badges": 1, "...": 0 },
    "hallOfFame": [{ "date": "...", "trainer": "leaf", "trainerName": "Ash", "region": "kanto", "team": [] }],
    "region": "kanto",                               // região da jornada ativa
    "regions": {
      "kanto": {
        "starter": "charmander", "starterShiny": false,
        "clearedStages": ["gym_1_pewter"], "badges": ["Insígnia Pedra"], "lastStage": "gym_2_cerulean",
        "journey": { "team": { "members": [], "active": [] }, "level": 18, "pc": [] },  // pc: 0.11
        "stageStats": { "gym_1_pewter": { "attempts": 2, "wins": 1, "bestTime": 241, "...": 0 } },  // 0.13
        "hub": { "flags": { "mapa_visto": true } }   // as falas de "uma vez só" já vistas (0.29)
      }
    },
    "journeys": [{ "id": "journey-...", "createdAt": "...", "updatedAt": "...", "data": null, "pendingRun": null }],  // 0.19
    "activeJourney": "journey-..."
  },
  "run": { "stageId": "...", "time": 95, "team": {}, "pc": [], "stats": {} }   // a partida no meio, se houver
}
```

A jornada ativa mora nos campos de cima; as outras ficam em `journeys[].data`
(`trainer`, `trainerName`, `region`, `regions`) e `journeys[].pendingRun` (ver "Os
espaços de jornada" na seção 4). O "Treinador" que os saves antigos tinham em
`trainerName` vira null. As Opções (volume, tremor, autosave) ficam fora do save,
em `pbh.options` no navegador (`save/options.js`).

`normalizeProfile` faz merge com os padrões, então **campo novo não quebra save
antigo**. Um save com a partida no meio não volta para a fase: ela entra na jornada
como um abandono e o jogador vai para a vila (`_foldPendingRun`, 0.24).

**Migrações que ele faz:** `coins` vira `shards`; a campanha antiga em `campaign`
vira `regions.kanto`; as insígnias que a 0.4 deixou de registrar (ver seção 11)
são repostas a partir das fases de ginásio concluídas; o save de antes da 0.19
vira o espaço de jornada 1 (`normalizeJourneys`); a loja do treinador
(`trainerUpgrades`, 0.21) e os degraus de conquistas que não existem mais são
descartados. Fora dele, ao carregar: os golpes que saíram viram os da linha nova
(`migrateMember`) e ids repetidos são consertados (`fixDuplicateUids`). No código,
a campanha da região atual é `game.campaign` (`regionProgress(profile)`).

---

## 9. Estado do conteúdo

**Pronto e jogável: Kanto inteira, da vila ao Hall da Fama.**
- **13 etapas**: Fase 1 (Brock) → Fase 2 (Misty) → Fase 3 (Lt. Surge) → Fase 4
  (Erika) → Fase 5 (Koga) → Fase 6 (Sabrina) → Fase 7 (Blaine) → Fase 8
  (Giovanni) → Elite Four (Lorelei, Bruno, Agatha, Lance) → Campeão (o rival).
  Cada uma com trechos dos lugares do FireRed, selvagens das rotas, elites e o
  time do líder com os níveis do jogo.
- **151 espécies jogáveis**, todas com linha de golpes e evolução: por nível, ou
  com o item do Poké Mart para quem evolui por pedra ou troca (a Eevee escolhe
  pela pedra). Os 5 lendários têm golpe exclusivo e sorteio próprio, da Fase 7 em
  diante.
- **Tabelas de captura**: as 9 do Fellipe, 100% das espécies disponíveis; mais
  Goldeen, Onix, Venonat, Doduo e Seel com peso 3 (padrão até o Fellipe decidir).
- **Golpes**: 52 jogáveis (no máximo 4 por tipo) e os 51 do Golpe Desperto, com
  sprite do FireRed; os 5 exclusivos dos lendários, desenhados em código.
- **A vila** (0.29): 7 interiores, 17 moradores, o Centro com o PC e o Poké Mart,
  a loja de Pokédolls e o quarto decorável; o mapa da jornada sai pela saída sul.
- E também: os tipos de verdade (0.32), o Modo Livre depois de cada vitória
  (0.20), 3 espaços de jornada (0.19), o Poké Mart (0.23), shiny (0.13.1) e 20
  conquistas em 99 degraus (0.11).

Quando o líder chega, a partida pausa na **apresentação** dele (retrato, nome e a
fala na caixa de texto do FireRed) até o jogador apertar "Lutar!".

Vencer o Campeão abre o **Hall da Fama** (a equipe campeã, um Pokémon por vez, com
os créditos); as equipes ficam em `profile.hallOfFame`, e o mapa da jornada tem o
botão para revê-las.

Desde a 0.8 o chão de cada trecho é o **cenário de tiles do FireRed** (rota,
floresta, caverna e o salão de cada ginásio e da Liga), e os Pokémon em campo são
animados desde a 0.7.

**Ainda não existe** (ver `PLANEJAMENTO.md` e `PLANEJAMENTO-LOBBY.md`): os gritos e
os efeitos sonoros (a música existe desde a 0.11), o celular (o controle funciona
desde a 0.7), a revanche dos líderes, as outras regiões e, na vila, o modo Endless
(o mato alto) e o modo aquático (a lagoa; a TM Dive existe desde a 0.34).

`npm run check` mostra o quadro das tabelas de captura sempre atualizado.

---

## 10. Próximos passos

Nenhum pedido do Fellipe em aberto. O que está planejado:

- **A vila** ([PLANEJAMENTO-LOBBY.md](PLANEJAMENTO-LOBBY.md)): a L-7 (sons e
  capricho), o modo Endless pelo mato alto e o modo aquático pela lagoa (cada um
  com o seu plano, quando chegar a vez) e as decisões da seção 13 de lá (o nome
  da vila, pegar o inicial na mesa, entrar em todas as casas, o rival).
- **O modo aquático** ([PLANEJAMENTO-DIVE.md](PLANEJAMENTO-DIVE.md), combinado em
  2026-11-08): uma descida em tiles do Emerald, num tabuleiro de 10×6, desviando de
  hordas que ocupam linhas inteiras. **Regra do Fellipe: só os tiles navegáveis do
  Emerald** (colisão 0 e elevação 3 no `map.bin`), na partida e nas animações; os
  6 tabuleiros são áreas 10×6 inteiramente navegáveis das Rotas 126 e 127
  submersas. São 6 níveis com 3 bolhas de vida (o bolsão de ar no Nível 3) e o
  resgate no Centro ao perder. Depois do 6, a caverna do Kyogre e uma luta de
  Bullet Heaven para nível 90+, com 3 Dive Balls (10% cada; eram 2) e uma maré final de
  30 s depois da captura. A captura dispara uma cena de história (o Maxie,
  indignado, solta o Crobat e parte "a caminho do vulcão"), e o salão vira uma fase Endless
  aquática sem XP, que rende Shards por chefe e elite. Na descida não se corre. O decomp do Emerald está em `D:\fellipe\Dev\pokeemerald`
  (pret/pokeemerald, commit `731ad5b`, clone parcial). **Está todo no jogo desde a
  0.37**:
  - a descida (0.36);
  - o salão com o encontro e o card;
  - a luta com as 3 Dive Balls e a maré final;
  - o Kyogre na equipe;
  - a cena do Maxie;
  - o Endless aquático.

  O que falta é a D-7: os sons da descida, os prêmios por nível (o Fellipe vai bolar)
  e o ajuste fino da luta depois de ele jogar (`node tools/kyogre.mjs`).
- **O roteiro geral** ([PLANEJAMENTO.md](PLANEJAMENTO.md), combinado em
  2026-11-02): o som que falta (gritos e efeitos, Etapa 5), o celular e os assets
  locais da interface (Etapa 6), o pós-jogo além do Modo Livre (a revanche dos
  líderes, D9) e as outras regiões (Etapa 8; Hoenn é a recomendação). Em aberto
  lá: o XP em orbes (D10) e as sinergias de tipo entre os membros da equipe.

---

## 11. Armadilhas conhecidas (já resolvidas — não reintroduzir)

- **Ids de Pokémon repetidos (0.20.1):** o `uid()` de `core/utils.js` é um
  contador que recomeça do 1 a cada vez que o jogo abre. Os Pokémon da equipe e
  do PC vão no save, então um capturado hoje podia ganhar o mesmo id de um salvo
  ontem: o campo reaproveitava o Pokémon errado (o ativo trocado numa captura
  ficava no mapa), as barras de vida do HUD ficavam vazias (dois cards com o
  mesmo id) e as trocas pegavam o Pokémon errado. Tudo que vai para o save usa
  `uniqueId()` (tempo + sorteio); `TeamSystem.restore` e `fixDuplicateUids`
  (`systems/pc.js`, chamado no `normalizePC` e no `startStage`) consertam os
  saves que já tinham ids repetidos. O `uid()` fica só para o que vive numa partida.
- **Orbes de órbita parados:** `_syncOrbs` não pode reescrever `orb.angle` todo
  frame — o ângulo é o estado da rotação. Só reposicione quando a quantidade mudar.
- **Chefe inalcançável:** chefes mais lentos que o treinador podiam ser evitados
  para sempre. O comportamento `boss` acelera conforme o jogador se afasta.
- **Vida do chefe dobrada:** `SpawnSystem.spawnAt` não aplica `scaling` em chefes —
  a vida deles é absoluta nos dados.
- **Corpo a corpo inútil:** Pokémon avançam `engageDistance` na direção do alvo
  (e recuam abaixo de 35% de vida). Sem isso, quem tem golpe curto nunca alcança.
- **Captura impossível:** a Poké Ball rola na direção do treinador quando ele está
  perto; sem isso, builds de longo alcance nunca capturavam.
- **Tabela de tipos:** Elétrico não causa dano em Terrestre e, desde a 0.32 (a
  tabela completa), Fantasma não pega em Normal, Normal e Lutador não pegam em
  Fantasma, Terra não pega em Voador, Dragão em Fada e Veneno em Metálico. Se um
  teste de dano der 0, confira o tipo do alvo antes de suspeitar do código (o
  `smoke` escolhe o alvo pelo tipo do golpe: `targetFor`). No dano que os seus
  Pokémon recebem, a imunidade vale 1x.
- **Metatile fora da tira:** o extrator só guarda as metatiles que o mapa de origem
  usa. Um ID novo numa receita de `data/scenery.js` (ou num gerador de
  `systems/terrain.js`) precisa existir naquele mapa;
  o `npm run check` monta todos os cenários e acusa o que faltar.
- **Caminhos de areia que se cruzam:** o tileset das rotas só tem cantos de dentro
  para curvas desenhadas à mão; o gerador faz retas separadas (`Taken.free`).
- **Clique perdido no HUD:** os cards da equipe são refeitos quando a equipe muda
  (subir de nível, fim da recarga). Ação em `onclick` se perdia se o HUD se
  refizesse entre apertar e soltar; use `onpointerdown`.
- **Novato no nível 1:** quem entra na equipe tem que vir perto do nível dela
  (`CaptureSystem.newMemberLevel`), senão parece que a captura falhou.
- **Inimigo nascendo dentro de árvore:** todo spawn passa por `terrain.place`.
- **Som antes do clique:** o navegador bloqueia áudio até um gesto do jogador. O
  `MusicPlayer` guarda a faixa pedida e só cria o `AudioContext` no primeiro
  clique ou tecla.
- **Conquistas de saves antigos:** as da 0.10 (`unlocked`/`claimed`) ficaram no
  save só como histórico; as em níveis começam do zero (dá para coletar de novo
  os primeiros degraus, uma vez).
- **Tecla com a sombra do texto (0.32.3):** o `text-shadow` de um rodapé passa para
  as `<kbd>` de dentro, e na tecla clara a sombra preta borra as letras. Toda tecla
  zera a sombra (`text-shadow: none`), como no título e na vila.
- **Moldura borrada:** `border-image` ignora `image-rendering`. As molduras já vêm
  ampliadas no arquivo, e a largura da borda tem de ser igual à fatia (24 px na
  janela, 16 px no botão); outro valor reescala e borra.
- **Maiúscula acentuada na Press Start 2P:** ela achata É, Í, Ó e parece
  minúscula. Títulos nela vão com maiúscula só na inicial ("Subiu de nível!").
- **Fontes de fora não carregam nas screenshots:** o Chrome sem janela daqui não
  confia no certificado de sites externos. Por isso as fontes ficam em
  `assets/fonts` (e o jogo também fica independente do Google Fonts).
- **Level up trava o update:** `Run.update` retorna cedo quando o estado não é
  `running`. Testes que simulam frames precisam resolver `levelup`/`capture`/
  `unlock`/`evolution`/`intro`, senão o tempo congela.
- **Órbita com "anel vazio":** em habilidades `orbit`, se `area` (raio da órbita)
  for muito maior que o alcance em que os inimigos se acumulam, os orbes passam
  por fora e não acertam ninguém. Petal Dance tinha `area: 118` e causava zero
  dano; ficou em 92 com `size: 22`. Referência: 70-100 de raio funciona bem.
- **Insígnia nunca registrada (até a 0.4):** `applyRunResult` procurava
  `stage.badge`, mas a insígnia fica em `stage.leader.badge`. O contador ficava
  em 0 e a conquista "Primeira Insígnia" era impossível. Corrigido na 0.5, com
  reposição nos saves antigos.
- **Topo da tela cortado:** tela com `justify-content: center` que passa da
  altura da janela some para cima, e não dá para rolar até lá. As telas que rolam
  centralizam com `margin: auto` no primeiro e no último filho.
- **Pixel art tremendo:** a câmera precisa ficar em pixel inteiro, e `drawFrame`
  arredonda a posição. Coordenada quebrada com `imageSmoothingEnabled = false`
  desenha pixels de larguras diferentes.
- **Paleta do decomp:** o PNG traz uma paleta provisória; a cor certa está no
  `.pal`. Recorte a transparência pelo índice 0, nunca pela cor. Nos sprites de
  golpe, quando não existe `.pal` com o nome, o jogo usa a paleta do próprio PNG.
- **Nomes repetidos em `fx.js`:** `FX` (sprites) e `ABILITY_FX` (golpes) têm
  chaves iguais de propósito (`ember`, `gust`, `bubble`...). Ao remover um golpe,
  mexa só no `ABILITY_FX`: na 0.6 um script apagou o efeito `bubble` no lugar do
  golpe, e o `check-data` pegou.
- **Pular o relógio nos testes** (`game.run.time = ...`) dispara de uma vez todos
  os eventos que ficaram para trás: elites, Poké Balls garantidas, presentes e
  avisos. É efeito do atalho, não do jogo.
- **Estados que pausam a partida** (`levelup`, `capture`, `unlock`, `evolution`, `intro`):
  `Run.update` não roda fora de `running`. Todo estado novo precisa ser resolvido
  pelo `Game`, pelo bot (`tools/bot.mjs`) e pelo `SETTLE` do `screenshot.mjs`,
  senão a simulação congela.
- **Porta do FireRed bloqueia (0.29):** no `map.bin`, a porta é um tile com
  colisão; ela leva para dentro quando o jogador anda **contra** ela (`on: 'push'`
  em `data/hub.js`). Já a entrada aberta da loja de Cerulean é chão (`'step'`). O
  `check-data` confere qual é qual.
- **A vila só anda com a tela dela aberta (0.29):** o `Game._frame` só chama
  `hub.update` com `hubOpen`. Nos testes, `hub.update` direto continua andando com
  a vila escondida; clicar numa saída já anda até lá e sai (não aperte a direção
  depois, senão o jogador anda na vila escondida).
- **Desempenho:** gradiente criado por projétil a cada quadro era o desenho mais
  caro; agora é sprite. Efeitos, acertos e partículas têm teto (`CONFIG.fx`).
  Medido na `vitrine.html?estresse` (Chrome sem janela): 60 FPS e ~2 ms por
  quadro com 245 inimigos, 88 efeitos e 351 partículas.

---

## 12. Histórico de decisões (o que mudou e por quê)

| Rodada | Pedido do Fellipe | O que mudou |
|---|---|---|
| MVP | jogo base jogável | estrutura, combate, captura, equipe, save |
| 2 | 3 ativos; Pokédex só capturados; UI bonita; menos Poké Balls; vida/XP por Pokémon | HP e nível por Pokémon, XP dividido, menu com side rail e modais, teto de balls |
| 3 | sem cura no level up; menos telas; upgrades globais só com moeda; TM; evolução fiel | evolução real, Shards + loja do treinador, melhoria a cada 3 níveis |
| 3b | fases = jornada até o ginásio | `segments`, `bossTeam` sequencial, Fase 1 e 2 refeitas |
| 3c | tabelas de captura por fase | `capturePools.js` com as 9 tabelas |
| 3d | ícones de item em vez de emoji | `icons.js` + sprites de item/insígnia |
| 4 | jogo muito fácil; TM tem que ser a linha do próprio Pokémon; UI do treinador feia; Shards coletáveis | `moveLine` de 3 golpes por espécie, dificuldade recalibrada (63%), treinador redesenhado, conquistas com botão de coletar |
| 5 | fases que faltam com dificuldade crescente; sprites de golpe; escolher menino ou menina; tudo ambientado com sprites (movimento continua livre, só o cenário espelha o FireRed); outras regiões em breve | `PLANEJAMENTO.md`; etapas 0 e 1 (0.5): extrator do Pokemon All, vitrine e screenshots, progresso por região, tela do treinador com o Oak, Red/Leaf em jogo, retratos dos líderes; conserto da insígnia |
| 6 | jogo leve no navegador: no máximo 4 golpes por tipo, reaproveitando; otimizar; todo o conteúdo (fases e Pokémon novos) | etapa 2 (0.6): 52 golpes em 16 tipos (Terra, Fantasma, Dragão e Gelo novos), sprites do FireRed em todos, aviso no chão antes do golpe do líder, tremor de tela, opções salvas, vitrine de golpes e de estresse; migração dos saves. Etapa 4 (0.7): as 151 espécies, as 13 etapas até o Campeão, selvagens com nível, presentes, rival pelo inicial, apresentação do líder, calibragem fase a fase com `tools/balance.mjs` |
| 7 | (primeira partida) muito fácil, quase não toma dano: mais dano e mais inimigos; Poké Ball mais rara; TM mais rara, o golpe melhora na evolução; cenário com os sprites que temos; ícone bonito para a Poké Ball; Ímã raro que puxa todo o XP | 0.8: dano ×1,2 e ondas ×1,2 com o `scaling.damage` de cada fase recalibrado (bot vence 35% a 60%, contra 44% a 88% antes, e desmaia 3 a 4 vezes por tentativa); bola ×0,45; TM 4% e evolução que melhora o golpe; cenário de tiles do FireRed em 17 lugares (Etapa 3); sprites de item para Poké Ball e Ímã |
| 8 | Poké Ball 3x mais rara; ícone de vida vira Poção; sugestões para o XP; Clefairy capturada "bugada"; obstáculos bloqueiam jogador e inimigos; inimigos com um pouco mais de vida; líderes bem mais fortes; Ímã menor e mais raro; troca que às vezes troca o Pokémon errado; espadinha para o Pokémon só acompanhar | 0.9: bola ×0,15; Poção no chão; captura e presentes entram com a média da equipe − 3; colisão com o cenário (`systems/terrain.js`) pela colisão dos mapas do FireRed; vida ×1,15; líderes ×2,5 de vida, ×1,4 de dano, golpes mais frequentes; Ímã em 1x, 0,05%/1,5%; HUD no `pointerdown` e selo "⇄ sai"; botão de ataque por Pokémon; 6 sugestões de XP no PLANEJAMENTO (D10) |
| 9 | Poké Balls ainda demais, as garantidas atrapalham; jogo levemente mais difícil; líderes muito fáceis (o bot não joga como um humano); remodelar o front copiando o UX do Pokemon All; publicar | 0.10: só a Fase 1 com garantidas, tetos menores, bola ×0,07; dano ×1,3 e vida ×1,2; líderes com vida ×4, Rajada mirando o treinador e fúria; bot que escolhe bem as melhorias e desvia; identidade visual do Pokemon All (molduras do FireRed, fontes em pixel, logo próprio, fundo com o cenário do jogo); site publicado |
| 10 | fases de ~4 min fixas; música no lobby e em cada fase, do Pokemon All, com volume num botão sempre no canto; Opções sem ativos e sem sprites; conquistas em níveis; mais Pokémon à disposição; PC no lobby | 0.11: 3:30 até o líder em todas (linha do tempo comprimida, XP compensado); 17 músicas do FireRed renderizadas com a cópia do sintetizador do Pokemon All + o tema do lobby, Web Audio com loop do jogo, mixer em Opções e engrenagem em toda tela; 20 conquistas com 99 degraus; 4 opções por Poké Ball, tabelas acumuladas e os outros iniciais; PC (captura com equipe cheia e trocas no lobby) |
| 11 | na derrota, duas opções: Centro Pokémon (cura e recomeça a fase) ou a jornada do zero; quais Pokémon aparecem na Fase 1 e com que chance | 0.11.1: tela de derrota com as duas saídas e confirmação para recomeçar; Centro Pokémon com a equipe curada, a música do Centro e a vinheta de cura do FireRed (`MusicPlayer.jingle`), aviso de quem se perdeu e o PC à mão; tabela da Fase 1 respondida na conversa |
| 12 | todos os Pokémon são obtíveis?; a Fase 1 simples demais: mais espécies, poucos evoluídos, mais estágio 1 | as 151 têm caminho (141 captura, 3 iniciais, 4 presentes, 3 evolução), mas Mew (0,11% por bola, só na Liga) e companhia são impraticáveis — sugerido encontro de lendário no pós-jogo, aguardando o Fellipe; 0.11.2: Fase 1 com 28 espécies, 96% básicas |
| 13 | golpes do Brock mais espaçados (spam de pedra); subir de nível cura 1/4 e evoluir cura tudo; Brock com um pouco menos de vida; teste de vitória com os iniciais | 0.11.3: `cooldownMult` 1,6 nos Pokémon do Brock e −10% de vida; `levelUpHeal` 0,25 e evolução com vida cheia. Bot na Fase 1: Charmander 2% → 69%, Bulbasaur 4% → 100%, Squirtle 64% → 100% — a cura é quase todo o efeito (só o Brock: 28%, 22%, 68%). Depois, "no começo é muito fácil": a cura só do nível 11 em diante (Fase 1: 48%, 63%, 94%); publicado |
| 14 | ainda fácil com a cura: uma sugestão de cura por nível sem quebrar; o Fellipe escolheu 1/10 da vida máxima | 0.11.4: `levelUpHeal` 0,1 (do nível 11); Fases 1 a 3 com 43–100% e de 0 a 3,4 desmaios por tentativa (24 jornadas por inicial) |
| 15 | investigar o inimigo preso (sugestão: teleporte aleatório quando travar); Squirtle fácil demais: inimigos um pouco mais fortes com ele | 0.11.5: a causa era o empurrão entre inimigos, que ignorava o cenário; rede de segurança com teleporte; `starterTuning` do Squirtle nas Fases 1, 6 e 7 |
| 16 | usar o PC do Pokemon All (a Global Box: ícones, arrastar, equipe); sinalizar melhor na captura que nada se perde | 0.12: `ui/pcScreen.js` + `systems/pc.js` com casas; arte e sprites do FireRed por `tools/assets/copy_pc_art.py`; aviso na Poké Ball e tela de equipe cheia reescrita |
| 17 | a Poção do nível máximo (50%) forte demais: 20%; ideia do bônus de ataque raro no nível máximo (planejamento); tem shiny?; líderes das últimas fases fracos demais | 0.12.1: `maxedHeal` 0,2; D11 no PLANEJAMENTO; shiny não existe (respondido). 0.12.2: `stage.bossTuning`, rampa do Erika ao Campeão |
| 18 | lobby mais bonito e único (planejado junto: o Town Map, o estojo com as métricas, tudo na barra do topo); o 2º golpe no lugar do bônus de ataque; shiny só na captura e do jogador; publicar o lobby | 0.13: `ui/lobby.js`, `ui/badgeCase.js`, `systems/stageStats.js`, `data/regionMap.js`, mapa e cartão por script; D11 reescrita (publicada com a Poção e os líderes). 0.13.1: shiny (1% por opção da Poké Ball), com sprites shiny no campo, nos cards e no PC, ✦ na Pokédex e a conquista Brilho Raro |
| 19 | o inicial também shiny (1%) e publicar; refinar os 3 2º golpes por tipo (aprovados com ajustes: Whirlpool longe, curas com teto, 2%/1% pelos tipos, nome oficial, 60% do dano); tremor só nos golpes dos líderes; o nível passando de 100 (o número saía do selo) e os líderes fáceis demais | 0.13.2: inicial shiny. 0.14: `data/bonusMoves.js` (51 golpes) e o motor deles; o líder acompanha a equipe (`leaderLevel`, `bossLift`); tremor só dos líderes; selo do nível que cresce com o número |
| 20 | fases levemente mais rápidas: de 3:30 para 2:45 | 0.15: a linha do tempo das 13 fases comprimida (×165/210; levas ×√f mais densas, XP ×1/√f); a equipe chega ao líder no mesmo nível (medido) |
| 21 | lendários naturalmente mais fortes, com melhorias e 2º golpe de saída, e um golpe exclusivo, único e muito bonito; com todas as melhorias, curar os 20% sem abrir tela, e a tela só para o 2º golpe, com uma opção única; um nome mais impactante para o 2º golpe | 0.16: `data/legendaries.js` (5 golpes exclusivos desenhados em código, kit, poder maior, entram no nível da equipe); Poção automática e anúncio do "Golpe Desperto" (nome padrão até o Fellipe escolher; sugestões dadas na conversa); roteiro `lendarios` no `screenshot.mjs` |
| 22 | equilibrar de novo: forçar o jogador a melhorar os Pokémon para passar; ao morrer não perde o progresso da fase, só não libera a seguinte (a Elite Four estava "a coisa mais fácil"); Pokémon já registrados com uma Poké Ball na captura | 0.17: derrota e abandono guardam o progresso; o líder não cresce mais com a equipe (`bossLift` saiu); `stage.difficulty` (a força da fase) calibrada em tentativas até passar, com a Liga mais forte; nível recomendado no lobby; `balance.mjs` mede tentativas e o nível de entrada; Poké Ball no card de quem já está na Pokédex |
| 23 | taxa dos lendários: aparecer desde a Fase 7, com chance baixa que cresce até o Campeão; um de cada por jornada; depois, subir levemente lendários e Poké Balls | 0.18: sorteio próprio por Poké Ball (3% → 12%), aves desde a Fase 7, Mewtwo e Mew só na Liga; um de cada (equipe, PC) e uma vez por tentativa; o Campeão com 1 Poké Ball; Poké Ball ×0,085 (era ×0,07); `balance.mjs` mostra as Poké Balls; corrigido o travamento dos golpes que caem do céu (inimigo na borda do alcance) |
| 24 | no título, "Jornada" no lugar de "Continuar", com os espaços das jornadas: fazer mais de uma, com novos Pokémon, e voltar para a outra | 0.19: 3 espaços de jornada (`ui/journeys.js`, `Game.openJourney/newJourney/deleteJourney`); cada uma com treinador, inicial, insígnias, equipe, PC e partida; Pokédex, conquistas, Shards e melhorias valem para todas; save antigo vira a jornada 1 |
| 25 | Modo Livre: depois da vitória, a fase sem fim com XP reduzido, inimigos cada vez mais fortes até ficar quase impossível, e o botão "Voltar para o Centro Pokémon" no canto | 0.20: `Game.startEndless/leaveEndless`, `Run.startEndless`, `SpawnSystem` com as ondas da segunda metade em laço, um elite por minuto e ×1,2 por minuto; XP ×0,4; testes e roteiro de screenshot "livre" |
| 26 | "tá tudo meio bugado": capturar trocando um ativo deixava ele no mapa; barras de vida vazias com o Pokémon ativo; trocas quebradas; o botão do Modo Livre direto para o mapa da jornada | 0.20.1: ids de Pokémon únicos entre sessões (`uniqueId`) e conserto dos saves com ids repetidos; o Modo Livre em si estava certo (conferido no Chrome); "Voltar para o Centro Pokémon" vai direto ao mapa |
| 27 | remover a aba de melhorias do treinador; conquistas e Pokédex valem para todas as jornadas | 0.21: a loja saiu inteira (botões, janela, bônus, `data/trainerUpgrades.js`, a conquista "Cliente Fiel"); saves antigos carregam sem ela |
| 28 | o Articuno em campo muito pequeno | 0.21.1: `fieldScale` por espécie (Articuno ×1,8, Moltres ×1,5) |
| 29 | Modo Livre com Poké Ball (1 a cada 3 min); Shards: a fase paga uma vez só, Pokémon de líder 10, chefe simples 5, no Modo Livre só os chefes simples; base para os preços do Poké Mart | 0.22: `CONFIG.shards.leaderPokemon/elite`, `CONFIG.endless.ballEvery`, recompensa só na primeira vitória; "+N Shards" no campo e no resultado |
| 30 | Poké Mart: tirar Rare Candy e Creche, o resto nos preços caros; quem evolui por item ou troca não evolui mais por nível | 0.23: `data/items.js`, a janela no lobby, a mochila (Reviver na fase, Novo Sorteio na Poké Ball), TM e evolução na hora pela equipe ou PC; 18 espécies só por item; o `pendingRun` consumido ao retomar |
| 31 | tela de jornadas com os níveis encavalados; continuar a jornada sempre no mapa, mesmo saindo no meio da fase | 0.23.1: equipe do card em 3 por linha e o nome completo da fase; 0.24: `_foldPendingRun` (a partida do meio entra na jornada), sem retomar no meio da fase |
| 32 | a partida continuar rodando com a aba em segundo plano; a luta com o líder começar sozinha depois de 7 s, com a contagem pequena; mostrar os Shards na tela | 0.25: relógio num Worker + passos de 50 ms (`_frame`), contagem na apresentação (`leaderIntroSeconds`), "◆ Shards" no HUD |
| 33 | o Gengar não recebia o Golpe Desperto; capturado no nível alto vem sem melhorias e fica ruim | 0.26: sem bug no Golpe Desperto (precisava de 18 melhorias = 54 níveis); `trainToLevel`: quem chega tarde vem com 1 melhoria a cada 3 níveis, automáticas (opção 1, escolhida pelo Fellipe) |
| 34 | Modo Livre no Campeão também | 0.27: depois do Hall da Fama, a tela de vitória de sempre, com o Modo Livre |
| 35 | manter a fase do Brock como está e dificultar todas as outras; a escala de ganho de nível muito alta; o Golpe Desperto por chave: maximizar certas melhorias (Gyarados: velocidade, penetração e dano; Gloom: área, intervalo entre os danos e cooldown), com a melhoria da chave marcada na tela de nível ("maximize para despertar") | 0.28: `xpLateExponent` 2,2 → 3,4 (o bot chega ao Campeão no ~74, era ~115; o Brock igual); `stage.difficulty` recalibrada fase a fase, todas mais duras que na 0.27 em tentativas do bot (ver seção 5); `data/awakening.js`: 3 melhorias por golpe que despertam o 2º golpe na hora, selo dourado na tela de nível, progresso na equipe e no PC, quem chega tarde treina a chave primeiro; `balance.mjs --jobs` (paralelo) e `--set` (testar um valor) |
| 36 | tirar a tag "Golpe Desperto" das melhorias, deixar só o aviso de maximizar embaixo | 0.28.1: sem o selo no canto da carta; ficam a moldura dourada e o aviso |
| 37 | no lugar da tela do mapa, um lobby jogável: uma mini-vila com casas de NPC espalhadas, andar em tiles como no FireRed, o Centro com o balcão do PC (sem curar) e o do Mart, uma loja de Pokédolls, o quarto vazio decorável, o Oak dando o inicial com as saídas travadas até lá, o mato alto a oeste para um modo Endless, a lagoa com o easter egg do Dive, falas para todos (a do pescador é dele) | 0.29: `game/Hub.js`, `render/HubRenderer.js`, `ui/hubHud.js`, `data/hub.js`, `data/dialogue.js`, `data/decor.js` e `tools/assets/hub.py` (os mapas montados do FireRed, em duas camadas e com a colisão de origem); jornada começada = treinador escolhido; partida, Continuar e Centro voltam à vila; o Endless e o modo aquático ficam "em breve" (PLANEJAMENTO-LOBBY.md) |
| 38 | refinar a loja de Pokédolls (o Lapras no meio atrapalhava, os 2 vasos da entrada bloqueavam); o Oak entrega o mapa junto com o inicial; "Voltar para a Vila" embaixo do mapa; o rosto do treinador acompanhando a fase atual no mapa; o nome do jogador no lugar de Red ou Leaf | 0.30: loja com um tapete livre e o Lapras no canto; `carvalho_inicial` com o Mapa da Jornada e o aviso no botão; `btn-village` embaixo do mapa (o Menu voltou para a barra); o ícone do mapa na fase escolhida; `screen-name`, `chooseName`, `cleanTrainerName` e `profile.trainerName` por jornada |
| 39 | melhoria de UX: a escolha do inicial e dos demais Pokémon em cards com o sprite em pixel na base de batalha e barras de vida, dano e alcance; o painel da fase com o cenário do ginásio, o líder em 2x, a faixa com as Poké Balls do time e o JOGAR vermelho; os banners dos ginásios no extrator; um artifact de antes e depois antes de subir | 0.31: `ui/pokemonCard.js` e `starterStats` (`CONFIG.cards`), a tela do inicial com véu, placa e Voltar no canto (ESC), o card na Poké Ball e na troca; `_panel` do `lobby.js` refeito; `tools/assets/gym_banners.py` (13 salões); roteiro `ux` no `screenshot.mjs`; testes do card e do painel; o check-data confere um banner por salão |
| 40 | incentivar o jogador a explorar fraquezas e vantagens (com o Charmander ele passava fácil pelo Brock mesmo com a resistência); não diminuir a chance de captura de quem tem vantagem; medir antes de aplicar; o selo em cada Pokémon não precisa, só o "FRACO" do painel | 0.32: a tabela de tipos completa; queimadura e veneno pela tabela (Fogo não queima, Veneno e Metálico não envenenam); defesa por tipo suavizada e simétrica (`CONFIG.types.defense`); sem o `starterTuning` do Squirtle; Poliwag, Goldeen e Oddish de volta a 4% na Fase 1; o "Fraco" no banner do painel; "Super efetivo!" no líder e nos elites; `systems/matchup.js`; o bot `--tipos` no balance; medido antes e depois (seção 5) |
| 41 | ler o HANDOFF e arrumar tudo o que estava desatualizado no projeto inteiro | 0.32.1: o HANDOFF conferido com o código (arquitetura com os arquivos que faltavam, contagens, Poké Balls, Shards, o Mart na vila, o Modo Livre e o Centro levando à vila, save, estado do conteúdo, próximos passos, histórico em ordem); README, PLANEJAMENTOs e PROVENIENCIA atualizados; comentários vencidos no código; nas Opções, o tremor (só os líderes) e o autosave (botão Jornada); a Ajuda com os controles da vila; a arte oficial (código morto) e o `.pyc` versionado saíram |
| 42 | o "Sobre" do GitHub estava "IAzudo": humanizar e pôr os controles (setas e demais), com o Espaço como a tecla de ação | 0.32.2: a descrição do repositório reescrita (`gh repo edit`), com os controles; na Ajuda do jogo e no README, o Espaço como a ação da vila (Enter e Z também servem) |
| 43 | o banner do README estava muito antigo (era o da primeira versão) | 0.32.3: `assets/banner.png`, o logo do jogo sobre a arte do título, gerado de `tools/banner.html` pelo roteiro `banner` (some o `banner.svg` da 0.4); na vila, o rodapé diz "Espaço ação" (era "Enter falar"), e as teclas dele perderam a sombra do texto, que borrava as letras ("a sombra dos controles no rodapé está deixando ruim de enxergar") |
| 44 | o Golpe Desperto não vem quando a chave fica completa: maximizar libera a chance de 4% de aprender a cada nível | 0.33: `CONFIG.bonusMove.chancePerLevel` (0,04) e `ProgressionSystem.rollBonusMove` a cada nível; a chave fechada só avisa; quem chega tarde vem com a chance liberada, sem o golpe; os textos da tela de nível, da equipe e do PC dizem a chance; o `balance.mjs` ganhou a coluna "despertos"; medido (seção 5) |
| 45 | na derrota, não oferecer recomeçar a jornada do zero; a opção fica nas configurações, com a confirmação "tem certeza que deseja reiniciar a jornada, seu progresso começa do zero" | 0.33: a derrota só com o Centro Pokémon; "Reiniciar a jornada" nas Opções (só com jornada ativa), com a pergunta no próprio item (Sim, reiniciar / Cancelar); testes e roteiros `opcoes` e `derrota` refeitos |
| 46 | começar pela L-6 (o golpe Dive e a TM Dive); o modo aquático vai ser diferente do Bullet Heaven e vai usar os tiles do Emerald, mas ainda não criar nada dele | 0.34: o Dive (`tmOnly`, fora do sorteio) com o comportamento do Dig na horda mais perto; a TM Dive no Mart (`tm_dive`), só com um Pokémon de Água desperto; a fala do vendedor com `diveTm`; testes e o roteiro `dive`; o decomp do Emerald baixado para depois (seção 10) |
| 47 | o modo aquático: tiles do Emerald, andar em tiles num espaço de 10×6, hordas de Pokémon aquáticos ocupando linhas inteiras para desviar, montado no Pokémon do Dive; 6 níveis cada vez mais difíceis com uma animação obrigatória entre eles; 3 bolhas de vida que voltam no Nível 3 ("um bolsão de ar"); ao morrer, o Centro Pokémon com a enfermeira contando que o pescador o pescou; hordas de Kanto até o 3, misturadas no 4, de Hoenn no 5 e no 6; depois do 6, a caverna do Kyogre e uma fase de Bullet Heaven 90+, com a captura pela Dive Ball (10%), a luta seguindo até o fim da fase e a volta pela lagoa | planejado em PLANEJAMENTO-DIVE.md (2026-11-08), nada construído; as decisões que faltam estão na seção 12 de lá |
| 48 | os tiles jogáveis só os navegáveis no Emerald, nunca por cima das montanhas submersas; o bolsão só com a fala no Nível 3; 2 Dive Balls por tentativa; depois da captura, uma fase Endless aquática sem XP; perder depois de capturar leva ao Centro com o Kyogre; a maré final de 30 s; a cena da história depois da captura (no Centro ou na frente da lagoa), com o NPC indignado e o Pokémon voador, "a caminho do vulcão" | PLANEJAMENTO-DIVE.md refeito (seções 3 e 10 novas); a maquete "A Descida" refeita sobre as Rotas 126 e 127 submersas, com a grade de navegação do `map.bin` e o teste de que nenhum quadro das animações sai da água navegável |
| 49 | o NPC da cena é o Maxie, com um Crobat; o Endless aquático rende Shards por chefe e elite; a corrida fica bloqueada na descida ("se ficar muito difícil a gente repensa"); rodar uma medição de tentativas; os prêmios por nível ficam para depois | PLANEJAMENTO-DIVE.md atualizado; a maquete sem corrida e com a medição (endereço `#medir`: cinco perfis de reação e erro, 60 descidas cada); a tabela da medição na seção 5 do plano |
| 50 | achou fácil a descida? então dificultar; mostrar a cena do pós-captura num artifact | a segunda versão dos níveis (menos aviso, hordas mais rápidas, o sorteio contando 0,2 s de reação, o paredão de cinco e as três colunas; o Nível 6 virou barreira de reação), medida antes e depois na seção 5 do PLANEJAMENTO-DIVE; a maquete "Depois do Kyogre" com a cena nas duas versões (https://claude.ai/artifact/1CQ2os9bD5otGFJ78A62Bv) |
| 51 | na maquete da descida o jogador estava muito rápido: andar por tiles, na velocidade do caminhar do FireRed; no fim da Pokédex, um Pokémon misterioso "???" (o Kyogre), sem sombra nem número, visível desde o começo, que só se revela ao ser capturado | a maquete tinha um bug meu (ao tirar a corrida, um comentário engoliu o fim do passo, e o mergulhador pulava um tile por quadro); corrigido para 16 quadros por tile e as duas medições refeitas (as de antes estavam erradas); 0.35: o lendário secreto da Pokédex (`secret` em `data/regions.js`, `profile.pokedex.secret`, `registerSecret`), com testes e o roteiro `pokedex` |
| 52 | a descida e as fases não podem ser impossíveis: se só a fileira 2 está livre, a próxima horda precisa deixar a 1 ou a 3 livre a tempo | o sorteio da maquete com três condições (a horda nova só sai com o jogador a salvo; saída andando do tile dele, com 0,2 s de reação e 0,05 s de folga; o passo antes do aviso não cai numa horda) e a segunda horda da sequência avisando junto; a prova `#prova` (um jogador perfeito que só vê a tela, reagindo em 0,2 s): zero acertos em 12.300 hordas; PLANEJAMENTO-DIVE seção 5 |
| 53 | esperar o jogador ficar a salvo deixou fácil: basta um espaço para ele ir, com hordas sobre hordas (principalmente nos últimos níveis) | a horda nova não espera mais; a saída é conferida do tile dele e, se ele está fugindo, também dos vizinhos; a regra do passo para o lado só vale quando ele foge (era ela que segurava as hordas); a prova: zero acertos em 12.300 hordas, com ~5,7 hordas ativas nos níveis 5 e 6; a medição: quem reage em 0,35 s passa a descida 17% das vezes |
| 54 | ficou muito difícil com hordas sobre hordas: equilibrar | a saída garantida para quem reage em 0,25 s (era 0,2 s) e o Nível 5 mais leve (aviso de 0,55 s, o paredão de cinco mais raro); um perfil típico na medição (reação de 0,25 a 0,45 s por horda, 3% de erro): ~4 tentativas para descer tudo, o Nível 6 passa 1 em 3; a prova continua sem acertos; PLANEJAMENTO-DIVE seção 5 |
| 55 | "você fez praticamente completo nos artifacts, eu aprovei a versão final que montou, pode rodar ela" | 0.36: a descida no jogo, igual à maquete aprovada: `tools/assets/dive.py` gera do decomp do Emerald os mapas, a grade do que é navegável (idêntica à da maquete) e o mergulhador; `game/Dive.js` com o sorteio que nunca é impossível; a lagoa abre a descida, perder leva à enfermeira do Centro, e passar o 6 chega à Caverna Marinha (o salão é a D-3); a prova no smoke-test (zero acertos com 0,25 s de reação, nenhum passo fora da água navegável) e o roteiro `descida` |

---

## 13. Como o Fellipe trabalha

- Escreve em **português**; respostas e interface em pt-BR.
- Testa o jogo de verdade entre as rodadas e traz feedback de sensação
  ("muito fácil", "incomoda a quantidade de telas") — **tratar isso como requisito**.
- Valoriza **fidelidade ao universo Pokémon** (níveis de evolução, golpes que
  fazem sentido para a espécie, nomes corretos).
- Quer poder continuar mexendo sozinho: **dados separados de lógica** e
  comentários explicando o porquê, não o quê.
