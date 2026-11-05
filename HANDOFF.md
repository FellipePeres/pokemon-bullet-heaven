# HANDOFF — Pokémon Bullet Heaven

> **Leia este arquivo primeiro ao retomar o projeto.**
> Ele descreve o estado atual, as regras de design já decididas, por que cada
> decisão foi tomada e o que falta fazer. O `README.md` é o manual de uso;
> este aqui é o contexto de desenvolvimento.

**Versão atual:** `0.20.0` · **Última atualização:** 2026-11-05
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
npm run assets               # regera os sprites a partir do Pokemon All (Python + Pillow)
npm run balance -- --runs 12 # joga a campanha com o bot: tentativas até passar cada fase, níveis e lutas
```

Os testes são a rede de segurança do projeto — **rode sempre que mexer em
balanceamento, dados ou interface**. `smoke` usa um "jogador virtual" que foge da
horda em círculos, desvia para pegar Poké Balls, troca Pokémon machucado por
descansado, escolhe melhorias e prefere TMs.

**Balanceamento (desde a 0.6; métrica nova na 0.17).** `tools/balance.mjs` joga a
campanha inteira várias vezes com o jogador virtual (`tools/bot.mjs`, o mesmo do
`smoke`), levando a equipe de uma fase para a outra **e de uma tentativa para a
outra** (a derrota guarda o progresso, como no jogo). Mostra por fase: quantas
jornadas venceram de primeira, a média de tentativas até passar (`--attempts`,
padrão 10, é o teto; quem não passa "para ali"), o nível médio da equipe ao
vencer, a duração da luta, desmaios e pico de inimigos.

**Conferência visual (desde a 0.5).** `tools/screenshot.mjs` abre o jogo no Chrome
(ou Edge) sem janela, executa um roteiro (`vitrine`, `treinador`, `jornada`,
`partida`), salva PNGs e lista os erros de JavaScript da página. Sai com código 1
se a página tiver erro. A `vitrine.html` desenha os assets com o mesmo código da
partida: poses, andar e correr, as 8 direções, a proporção com os Pokémon e os
retratos. **Olhe os screenshots antes de entregar mudança visual.** O feel
(velocidade, animação em movimento) continua sendo validado pelo Fellipe.

---

## 2b. Publicação (GitHub Pages)

O jogo está no ar em **https://fellipeperes.github.io/pokemon-bullet-heaven/**
(a 0.10.1 desde 2026-11-03),
servido pelo GitHub Pages direto da branch `main`, pasta raiz (`build_type: legacy`).

**Para publicar uma atualização, basta `git push` na `main`** — o workflow
*pages build and deployment* roda sozinho e leva ~1-2 minutos. Acompanhe com:

```bash
gh run list --limit 3                  # status do deploy
gh api repos/FellipePeres/pokemon-bullet-heaven/pages --jq .status
curl -sI https://fellipeperes.github.io/pokemon-bullet-heaven/ | head -1
```

⚠️ **O site é servido em um subcaminho** (`/pokemon-bullet-heaven/`), então
**todos os caminhos do projeto precisam continuar relativos** (`css/style.css`,
`src/main.js`, `assets/...`). Nada de barra inicial — isso quebraria o deploy
sem quebrar o ambiente local.

A identidade de commit configurada no repositório local é
`Fellipe Peres <130771865+FellipePeres@users.noreply.github.com>` (e-mail noreply
do GitHub, para não expor o e-mail pessoal no histórico público).

---

## 3. Arquitetura

```
index.html            página única (telas, HUD, overlays, modais)
vitrine.html          conferência visual dos assets (ver seção 2)
css/style.css         toda a interface
assets/               sprites do FireRed gerados pelo extrator + PROVENIENCIA.md
src/
  main.js             ponto de entrada
  vitrine.js          a cena da vitrine.html
  core/
    config.js         ⭐ TODO o balanceamento e as opções
    events.js         EventBus + nomes de eventos
    input.js          teclado e controle (Gamepad API)
    utils.js          matemática, sorteios, sistema de modificadores
  data/               ⭐ CONTEÚDO (só dados, sem lógica)
    pokemon.js        as 151 espécies: tipos, hp, power, evolução, moveLine
    abilities.js      52 golpes (no máximo 4 por tipo) + 3 golpes dos líderes
    upgrades.js       217 upgrades de partida, gerados a partir das habilidades
    trainerUpgrades.js 9 melhorias permanentes compradas com Shards
    tms.js            linha de golpes: qual o próximo golpe de cada Pokémon
    capturePools.js   chances de captura por fase (as 9 tabelas do design)
    enemies.js        159 inimigos: selvagens, elites e Pokémon dos líderes
    stages.js         as 13 etapas de Kanto (ondas, elites, trechos, líder)
    regions.js        regiões: Pokédex, iniciais, campanha e treinadores de cada uma
    trainers.js       modelos de treinador (Red, Leaf) e o mapa de quadros da folha
    fx.js             qual sprite do FireRed cada golpe usa
    scenery.js        receitas dos 17 cenários (rota, floresta, caverna, salões)
    assetManifest.js  GERADO pelo extrator: tamanho e quadros de cada folha
    sceneManifest.js  GERADO pelo extrator: metatiles de cada cenário e o mapa dos salões
    musicTracks.js    GERADO por render_music.py: onde começa e acaba o loop de cada música
    types.js          tipos, cores e tabela de efetividade
    kanto.js          nomes da Pokédex 1-151
    achievements.js   12 conquistas e suas recompensas em Shards
  entities/           Player, Companion, Enemy, projéteis, zonas, pickups, efeitos
  systems/            comportamento genérico
    combat.js         dano, morte, drops, alvo mais próximo
    AbilitySystem.js  calcula stats e executa os 7 comportamentos de habilidade
    ProgressionSystem.js  XP, níveis, evolução, TMs, melhorias, stats do treinador
    TeamSystem.js     equipe, slots ativos, troca, desmaio, serialização
    CaptureSystem.js  sorteio da captura
    SpawnSystem.js    ondas, elites, Poké Balls roteirizadas, time do líder
    SpatialGrid.js    grade espacial (evita colisão O(n²))
    terrain.js        gera o cenário de cada trecho e diz o que bloqueia (colisão)
    pc.js             o PC da jornada: as casas de cada Pokémon, pegar e soltar
    stageStats.js     as métricas de cada fase (o Estojo de Insígnias)
    stats.js          vida máxima, XP por nível, multiplicador de dano por nível
  game/
    Run.js            uma partida: estado, loop, colisões, condições de fim
    Game.js           orquestra tudo: perfil, telas, loop principal, save, loja
  render/
    Renderer.js       canvas: chão, atores, efeitos, barra do chefe, treinador
    assets.js         carrega as folhas do catálogo e desenha quadros em escala inteira
    trainer.js        qual quadro do treinador mostrar (passo pela distância andada)
    fx.js             desenha os sprites de golpe
    scenery.js        pinta o chão da arena (o grid do terreno) num canvas por cenário
    sprites.js        sprites de Pokémon (estático/animado/artwork) e insígnias
    icons.js          ícones de item por chave semântica
  ui/
    HUD.js            HUD da partida e overlays (nível, captura, evolução, pausa)
    Menus.js          menu, mapa, modais (Pokédex, conquistas, equipe, loja, opções)
    pcScreen.js       a tela do PC (a do FireRed, portada do Pokemon All): caixas, equipe, pegar e soltar
    lobby.js          o lobby: o Town Map de Kanto, a fase escolhida, a equipe e a barra do topo
    badgeCase.js      o Estojo de Insígnias: o Cartão de Treinador e as métricas de cada fase
    dom.js            helpers de DOM e toasts
    pad.js            o controle nas telas: foco nos alvos clicáveis da camada de cima
  audio/
    music.js          a música: uma faixa por vez, loop do jogo, troca suave, volume
    backdrop.js       o fundo dos menus: um trecho de rota montado pelo gerador do cenário
    titleMenu.js      o menu da tela de título: ↑ ↓ e Enter, Poké Ball de ponteiro
  save/
    SaveManager.js    arquivo .json + autosave em localStorage
    profile.js        progresso permanente + ProfileTracker (eventos → perfil)
tools/
  check-data.mjs      conferência dos dados
  smoke-test.js       teste da lógica
  ui-smoke.js         teste da interface
  bot.mjs             o jogador virtual (usado pelo smoke e pelo balance)
  balance.mjs         mede a dificuldade fase a fase (ver seção 5)
  screenshot.mjs      screenshots no Chrome sem janela (DevTools Protocol, sem dependências)
  assets/extract.py   gera assets/ a partir do decomp do FireRed no Pokemon All
  assets/render_music.py  renderiza as músicas do FireRed (cópia do sintetizador do Pokemon All)
  assets/copy_pc_art.py   traz do Pokemon All a arte do PC, os sprites do FireRed e o Cartão de Treinador
  assets/extract_region_map.py  monta o Town Map de Kanto do decomp (o mapa do lobby)
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
- **O movimento é livre**, em qualquer ângulo, como sempre foi. **Nada de andar
  por quadrados** como no FireRed: o FireRed entra só no visual. O sprite tem 4
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
  nos cards, os GIFs shiny do PokeAPI; no PC, o sprite shiny do FireRed (o ícone de
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
  | 1/10 do nível 11 (0.11.4) | 43 / 56 / 100% | 59 / 81 / 57% | 100 / 92 / 87% | 0–3,4 | Fora isso, cura vem de poções no chão, da regeneração da
  reserva e da troca.
- A tela de melhoria aparece **a cada 3 níveis** (`upgradeEveryLevels`). Os níveis
  intermediários valem em vida e dano, sem interromper. Isso caiu de ~45 telas
  por fase para ~20, que foi a reclamação do Fellipe.
- Pokémon **ativo** que sobe pausa a partida na hora. Pokémon da **reserva**
  acumula e o jogador gasta quando quiser pelo botão ▲ no card.

### Melhorias: duas camadas separadas
| Camada | Onde | Escopo |
|---|---|---|
| Partida | Level up do Pokémon | **Só aquele Pokémon** (dano, projéteis, área, recarga, efeitos). Fica em `member.upgrades`. |
| Permanente | Shards na aba Treinador | Toda a equipe, todas as fases. Fica em `profile.trainerUpgrades`. |

Nunca voltar bônus globais para o pool de level up — foi pedido explícito.

### O 2º golpe — "Golpe Desperto" (0.14; nome e anúncio na 0.16)
- **O nome que o jogador vê é `BONUS_MOVE_LABEL`** (`data/bonusMoves.js`):
  "Golpe Desperto", padrão até o Fellipe decidir ("segundo golpe é muito feio,
  algo mais impactante"). No código continua `bonusMove`.
- **Aprender abre uma tela só** (0.16): a de nível, com uma opção única e dourada
  que anuncia o golpe; clicar segue a partida (`run.unlockQueue`, estado
  `'unlock'`, `Game.openUnlock`, `HUD.showUnlock`). É a única tela que o Pokémon
  com todas as melhorias ainda abre.
- **Com todas as melhorias, cada nível pode ensinar um 2º golpe** (`data/bonusMoves.js`,
  a D11 do PLANEJAMENTO, aprovada golpe a golpe pelo Fellipe): 2% de um dos 3 do
  tipo principal; se não sair, 1% de um dos 3 do secundário
  (`CONFIG.bonusMove`). Um por Pokémon, para sempre; ele mantém o golpe dele e
  usa os dois. O 2º golpe entra em `member.abilities` (o mesmo lugar do golpe
  extra dos iniciais), então o save, o PC e a troca já o levam.
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
- **Onde aparecem** (0.18, "desde a fase 7, com porcentagem baixa que vai
  escalando até a fase do campeão; só pode aparecer 1 de cada lendário na mesma
  run"; números padrão até o Fellipe decidir): saíram das tabelas de captura e
  têm sorteio próprio (`LEGENDARY_ENCOUNTERS`, `CaptureSystem.rollLegendary`).
  Em cada Poké Ball, com a chance da fase, a última opção vira um lendário:
  Fase 7 3% e Fase 8 4% (só as aves), Lorelei 5%, Bruno 6%, Agatha 7%, Lance 8%
  e Campeão 12% (aves, Mewtwo e Mew; eram 2% a 10%, e o Fellipe pediu "aumentar
  levemente"). Entre eles, peso 1 por ave, 0,35 Mewtwo e
  0,15 Mew. O Campeão ganhou 1 Poké Ball (tinha 0). **Um de cada**: quem está na
  equipe, no PC da partida ou no do lobby (`run.ownedElsewhere`) não volta, e na
  mesma tentativa cada um aparece uma vez só, mesmo recusado
  (`run.legendariesOffered`). Medido: ~1,7 Poké Ball por tentativa nas Fases 7
  e 8, ~0,9 por sala da Liga; passando cada fase em ~1,5 tentativa, ~50% das
  jornadas veem algum lendário (cada ave ~19%, Mewtwo ~5%, Mew ~2%).
- **Poké Balls por tentativa** (0.18, bot, `balance.mjs` coluna "bolas"): Fase 1
  2,5 (teto 3), Fases 2 a 8 de 1,25 a 1,84 (teto 2; a chance de cair subiu de
  ×0,07 para ×0,085, +20%, mas o teto corta: a média foi de 1,50 para 1,62), Liga
  e Campeão ~0,9–1,0 (teto 1). Uma jornada passando tudo de primeira dá ~17.

### Evolução
- **Por nível, fiel aos jogos**: Charmander→Charmeleon 16→Charizard 36,
  Bulbasaur 16/32, Squirtle 16/36, Pidgey 18/36, Magikarp→Gyarados 20, etc.
- Onde a evolução real depende de pedra ou troca, usamos um nível equivalente e
  marcamos `method: 'stone' | 'trade'` + `item`, para virar item de verdade depois.
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

### Captura
- Poké Ball dropa de inimigos derrotados, com **teto por fase** (`maxBalls`: 3 na
  Fase 1, 2 nas outras, 1 em cada sala da Liga, 0 no Campeão). Desde a 0.10 só a
  Fase 1 tem **garantidas** (`scriptedBalls`, duas, para o inicial ganhar
  companhia): o Fellipe achou que elas deixavam a captura fácil demais.
- A bola rola devagar na direção do treinador quando ele está perto: sem isso,
  builds de longo alcance matavam longe e nunca capturavam.
- A chance de cair é ×0,07 (`CONFIG.capture.dropChanceMultiplier`; ×0,45 na
  0.8, ×0,15 na 0.9): pegar Pokémon novo é raro, a pedido do Fellipe.
- **Mais opções** (0.11): cada Poké Ball oferece 4 espécies; a tabela de uma
  fase acumula as das anteriores com metade do peso (`poolEntries`); os dois
  iniciais que o jogador não escolheu entram raros da Fase 3 em diante
  (`STARTER_CAPTURES`; o próprio inicial é filtrado no `CaptureSystem`).
- **Quem entra chega perto da equipe** (0.9): capturado ou presente, o novato tem
  a média de nível da equipe menos 3. Antes entrava no nível 1 e, numa equipe de
  nível 20, desmaiava na hora (parecia que a captura não tinha funcionado).
- **Ímã**: raríssimo (0,05% por selvagem, 1,5% por elite ou Pokémon de líder; um
  por vez no mapa). Ao pegar, todo o XP do mapa vem até o treinador
  (`Pickup.magnetized`), acelerando até 2400 px/s.
- Quais espécies aparecem e com qual chance está em `capturePools.js`, com as
  **9 tabelas de porcentagem definidas pelo Fellipe**. Espécies ainda não
  implementadas são filtradas automaticamente.
- A **Fase 1 foi ampliada** (0.11.2, "simples demais… mais chances de estágio 1"):
  28 espécies, 96% do peso em formas básicas (Rotas 1, 2, 22 e 3, Floresta de
  Viridian e a pesca do começo) e 4% nos evoluídos. Água e Planta (Poliwag,
  Goldeen, Oddish) ficaram em 2% cada porque tiram 4x do Brock.

### Modo Livre (0.20)
- Pedido do Fellipe: "quando ganhar do Brock, além dos botões de hoje, um botão
  Modo Livre: um Endless Mode daquela fase, com XP reduzido; no canto superior
  direito, ao lado do contador de inimigos e da configuração, um botão Voltar para
  o Centro Pokémon"; e "os inimigos vão ganhando gradativamente mais status até
  que fique quase impossível".
- **Na tela de vitória** (menos a do Campeão, que vai para o Hall da Fama),
  **Modo Livre** (`Game.startEndless`): a equipe volta curada e a fase continua
  sem fim (`Run.startEndless`, `SpawnSystem.startEndless`). As ondas da segunda
  metade da fase se repetem, sem o líder, e um elite da fase aparece a cada
  minuto. A vitória já ficou registrada; `_checkState` não dá outra.
- **Fica cada vez mais difícil** (`CONFIG.endless`, padrão até o Fellipe decidir):
  vida e dano dos inimigos ×1,2 por minuto, composto (5 min ×2,5; 10 min ×6,2;
  `SpawnSystem.endlessFactor`, que multiplica a força da fase), e +8% de inimigos
  por minuto até o dobro. **XP ×0,4** (era ×0,5: "ainda é muito"). As Poké Balls
  seguem o teto da fase.
- **HUD**: o relógio mostra "∞" e o tempo no modo; a faixa, "MODO LIVRE -
  INIMIGOS MAIS FORTES" (texto do Fellipe). **"Voltar para o Centro Pokémon"** (vermelho, no canto) e cair
  com a equipe toda fazem o mesmo (`Game.leaveEndless`): guardam na jornada o que
  a equipe ganhou e abrem o Centro Pokémon (de lá, a fase de novo ou o mapa).
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
- **Cada card**: o treinador, as 8 insígnias, a equipe (ou o inicial), a próxima
  fase, a partida em andamento e quando foi jogada; **Jogar** (ou Continuar, com
  partida em andamento) e **Apagar**, que pergunta no próprio card.
- **Cada jornada tem o seu**: treinador (Red/Leaf), inicial, insígnias, fases,
  equipe, PC, métricas e a partida em andamento. **Do jogador, para todas**:
  Pokédex, conquistas, Shards, melhorias do treinador e Hall da Fama.
- **Como fica no save** (`save/profile.js`): a jornada ATIVA mora nos campos de
  sempre (`trainer`, `region`, `regions`, e o `run` do save), então o resto do
  jogo não mudou. `profile.journeys` guarda os espaços, e cada um guarda a sua em
  `data` (e a partida em `pendingRun`) enquanto não é a ativa; `activeJourney` é
  o id da ativa. Trocar (`openJourney`) guarda a ativa no espaço dela
  (`_stashActive`) e põe a escolhida nos campos de cima (`_activate`). Um espaço
  largado antes de escolher o inicial some sozinho. Save de antes da 0.19 vira o
  espaço 1 (`normalizeJourneys`). `newGame` continua sendo "recomeçar a jornada
  ativa" (o da derrota).

### O lobby (0.13)
- **O mapa da jornada é o Town Map de Kanto do FireRed** (`ui/lobby.js`, Etapa 9
  do PLANEJAMENTO), no lugar da lista de 13 cards: o mapa do decomp
  (`extract_region_map.py`, 192x144) em pixels inteiros; cada fase na cidade do
  ginásio e a Liga e o Campeão no Indigo Plateau (`data/regionMap.js`, as casas
  da grade 22x15 do jogo). Concluída mostra a insígnia; a próxima, o cursor do
  Town Map; bloqueada fica apagada; o número da fase embaixo. O ícone do Red/Leaf
  fica na cidade da última vitória e anda até a nova ao voltar. Ao entrar, a
  próxima fase já vem escolhida.
- **Ao lado, a fase escolhida**: o líder, a insígnia, os trechos, as métricas e
  Jogar (na Liga, as cinco salas para escolher). **Embaixo, a equipe** com os
  ícones do PC (a bolinha marca os 3 em campo); clicar abre o PC.
- **Barra do topo** com tudo: o treinador, o estojo em miniatura, Shards e
  Pokédex, os ícones (Pokédex, Conquistas com o aviso de "para coletar", Equipe,
  Treinador, Opções, Ajuda) e PC, Hall, Salvar e Menu escritos. A lateral de
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
  `stage.leaderLevel` do líder que acompanha a equipe.
- **Música** (0.11): cada fase tem `music` e `leaderMusic`. `Game._updateMusic`
  escolhe a faixa a cada quadro (lobby, fase, líder, vitória, Hall da Fama,
  Centro Pokémon) e
  `audio/music.js` toca com loop sem emenda (Web Audio, pontos do loop do jogo em
  `data/musicTracks.js`). O volume é o `CONFIG.audio.musicVolume`, salvo nas
  opções; na pausa a música abaixa.
- O chefe final é o **time do líder, enfrentado em sequência** (`bossTeam`),
  terminando no ace. Vencer dá insígnia + Shards.
- A **jornada carrega equipe, níveis e build** de uma fase para a próxima
  (`regions.kanto.journey`). **Desde a 0.17 a derrota também carrega** (ver
  "Progressão por tentativas" abaixo). A **derrota tem duas saídas** (0.11.1): o
  **Centro Pokémon** (`Game.pokemonCenter`) cura a equipe da jornada — a do fim
  da tentativa, com o que ela ganhou — e a fase recomeça (`leaveCenter`); ali
  mesmo dá para abrir o PC ou ir ao mapa da jornada. Ou **recomeçar a
  jornada** do zero (`restartJourney` → `newGame`), com confirmação: perde
  insígnias, equipe e PC da região; Pokédex, conquistas, Shards, melhorias do
  treinador e Hall da Fama ficam.
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
  - o lobby mostra o **nível recomendado** (`stage.recommendedLevel`: a média com
    que a equipe do bot ENTRA na tentativa que vence — a coluna "entrada" do
    `balance.mjs`; não o nível ao vencer, que já inclui o que a fase dá) ao lado
    da média da equipe: verde pronta, laranja perto (até 5 abaixo), vermelho longe;
  - a meta (padrão até o Fellipe decidir) é medida em tentativas do bot até
    passar: ~1,5 nas Fases 1 e 2, ~2 na 3 a 5, mais nas seguintes e ~4–5 na Liga,
    onde o Fellipe achava tudo fácil. O bot joga pior que ele.
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
  (`SpawnSystem.spawnAt`, e `enemy.tilt` nos golpes do líder). Hoje só o Squirtle,
  nas Fases 1 (×1,2), 6 (×1,2) e 7 (×1,15): ele vencia 100% delas, contra 13–67%
  dos outros; com o ajuste, 45–56%, 24–31% e 50–83% (48 jornadas).
- **Selvagens com nível** (0.7, só da Fase 3 em diante): cada onda tem `level:
  [mín, máx]`, que **acompanha a equipe** (alguns níveis abaixo dela no começo,
  perto do ace do líder no fim). Vida e dano crescem de forma composta por nível
  (`CONFIG.enemies`). As Fases 1 e 2 não têm nível e ficaram como eram.
- **Presentes** (`stage.gifts`): na hora marcada, a tela de captura abre com
  opções fixas, como as trocas e o Dojo do FireRed (Farfetch'd na Fase 3;
  Lickitung e Hitmonlee ou Hitmonchan na Fase 6). Um de cada vez.

### Shards (moeda)
- Vêm de concluir fases (automático: 120 + 180 na primeira vez) e de
  **coletar conquistas** — a conquista concluída fica com botão "coletar" na aba.
- Gastos nas melhorias permanentes do treinador.
- Saves antigos com `coins` migram para `shards` sozinhos.

---

## 5. Balanceamento atual

Valores em `src/core/config.js` (o que não estiver lá está em `/data`):

| Item | Valor |
|---|---|
| Pokémon ativos / equipe | 3 / 6 |
| Cooldown de troca | 6s |
| Curva de XP por Pokémon | 12 × 1,15^nível até o nível 20; depois cresce como (nível/20)^2,2 |
| Melhoria a cada | 3 níveis |
| Chance de TM no level up | 4% (o golpe melhora mais pela evolução) |
| Vida por nível / dano por nível | +6 HP / +7% |
| Invencibilidade após golpe | 0,5s |
| Regeneração: campo / reserva | 0,6 / 2,5 HP/s |
| Chance de poção (selvagem comum) | 4% |
| Poké Balls por fase | até 3 na Fase 1 (uma garantida), 2 nas outras, 1 em cada sala da Liga e no Campeão (desde a 0.18); chance de cair ×0,085 (×0,07 até a 0.17) |
| Ímã | 0,05% por selvagem, 1,5% por elite ou Pokémon de líder |
| Jogador virtual (`tools/bot.mjs`) | escolhe a melhoria que mais dá dano (TM primeiro), circula pela arena desviando do que encosta, dos avisos e dos projéteis dos líderes, e vai atrás das Poké Balls |
| Dano, vida e quantidade de inimigos | dano ×1,3, vida ×1,2 e ondas ×1,2 em todas as fases (`CONFIG.enemies`), além do `scaling` de cada fase |
| Líderes | vida ×4, dano ×1,6, golpes a cada 60% do tempo, Rajada, fúria abaixo de 50% (`CONFIG.enemies.boss`) |
| Nível de quem entra na equipe | média da equipe − 3 |
| Shards por fase | 120 (+180 na 1ª vez) |
| Duração das fases | 2:45 até o líder em todas (~3:15 com a luta), desde a 0.15 (3:30 na 0.11) |
| Opções por Poké Ball | 4 (tabelas acumuladas; os outros iniciais raros da Fase 3 em diante) |
| Selvagens por nível (Fase 3+) | vida ×1,075 e dano ×1,035 por nível acima do 5; XP +8% por nível |

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
   `CONFIG.enemies.damageMult` (1,2), igual para todas.
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

O `AbilitySystem` conhece 7 comportamentos. Habilidade nova quase sempre reusa um:

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

Stats suportadas: `damage, cooldown, count, speed, range, pierce, size, duration,
area, arc, spread, tickRate, chains, knockback, homing, explodeDamage` +
`effects: { burn, poison, slow }`.

Os upgrades genéricos (dano, recarga, quantidade, área, perfuração...) são
**gerados automaticamente** para toda habilidade nova em `upgrades.js`.

**No máximo 4 golpes por tipo** (pedido do Fellipe na 0.6, para o jogo ficar leve
no navegador): cada tipo tem base, TM e final, reaproveitados pelas espécies. São
52 golpes jogáveis em 16 tipos; o `smoke` falha se algum tipo passar de 4. Os
golpes dos líderes são à parte: `boss_shockwave` é um golpe só, que muda de cara
conforme o tipo de quem usa (`BOSS_WAVE_FX`).

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
| Pokémon animados | `assets/pokemon/<dex>.png`: os GIFs da Gen 5 do Pokemon All em tiras de quadros |
| Poké Ball, Ímã e Poção no chão | `assets/items/{poke-ball,magnet,potion}.png` |
| Cenário | `assets/scenes/<id>.png`: as metatiles de cada mapa (17 cenários); `src/data/sceneManifest.js` diz qual metatile é cada quadro e guarda o mapa dos salões |
| Moldura das janelas e dos botões | `assets/ui/window-frame.png` (3x, fatia 24) e `window-frame-button.png` (2x, fatia 16): a `text_window` do FireRed, copiadas do Pokemon All |
| Fontes | `assets/fonts/`: Press Start 2P e Pixelify Sans (licença OFL), as do Pokemon All |
| Fundo da tela de título | `assets/ui/title-background.webp`: arte do Fellipe (a clareira à noite cercada pela horda) |
| Músicas | `assets/music/*.ogg`: 18 do FireRed, a vinheta de cura do Centro Pokémon (`tools/assets/render_music.py`) e o tema do lobby do Pokemon All; 7,5 MB ao todo, cada uma carregada quando toca |

- Tudo é pixel art em **escala inteira, sem suavização** (`CONFIG.render.pixelScale`,
  hoje 2). `render/assets.js` carrega sob demanda e, enquanto a folha não carrega,
  devolve null: quem desenha cai no desenho procedural de antes. É assim que os
  testes sem navegador continuam rodando.
- O Pokemon All ainda tem o que as próximas etapas usam: sprites de golpe, tilesets
  de Kanto, GIFs da Gen 5, gritos, efeitos sonoros e músicas (ver `PLANEJAMENTO.md` §3).

**2. PokeAPI/sprites, pela internet** (verificado, tudo 200):

| Uso | Caminho |
|---|---|
| Canvas (jogo) | `sprites/pokemon/<dex>.png` — estático (canvas não anima GIF) |
| Menus, HUD, cards | `.../versions/generation-v/black-white/animated/<dex>.gif` |
| Escolha do inicial | `.../other/official-artwork/<dex>.png` |
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

Arquivo `.json` baixado pelo navegador + autosave em `localStorage` (só para o
botão Continuar). Estrutura:

```jsonc
{
  "signature": "pokemon-bullet-heaven", "schemaVersion": 1, "gameVersion": "0.5.0",
  "profile": {
    "trainer": "leaf",                               // null = ainda não escolheu
    "shards": 620,
    "trainerUpgrades": { "meta_speed": 2 },
    "pokedex": { "caught": [4, 5, 25] },            // só capturados/evoluídos
    "achievements": { "tiers": { "catcher": 2 }, "notified": { "catcher": 3 } },  // degraus coletados (0.11)
    "stats": { "totalKills": 0, "badges": 1, "...": 0 },
    "region": "kanto",                               // região da jornada atual
    "regions": {
      "kanto": {
        "starter": "charmander", "clearedStages": ["gym_1_pewter"], "badges": ["Insígnia Pedra"],
        "journey": { "team": { "members": [], "active": [] }, "level": 18, "pc": [] },  // pc: 0.11
        "stageStats": { "gym_1_pewter": { "attempts": 2, "wins": 1, "bestTime": 241, "...": 0 } }  // 0.13
      }
    }
  },
  "run": { "stageId": "...", "time": 95, "team": {}, "pc": [], "trainerUpgrades": {}, "stats": {} }
}
```

`normalizeProfile` faz merge com os padrões, então **campo novo não quebra save
antigo**. Ao carregar uma partida salva, a fase recomeça com a equipe curada.

**Migrações que ele faz:** `coins` vira `shards`; a campanha antiga em `campaign`
vira `regions.kanto`; e as insígnias que a 0.4 deixou de registrar (ver seção 11)
são repostas a partir das fases de ginásio concluídas. No código, a campanha da
região atual é `game.campaign` (`regionProgress(profile)`).

---

## 9. Estado do conteúdo

**Pronto e jogável (0.7): Kanto inteira.**
- **13 etapas**: Fase 1 (Brock) → Fase 2 (Misty) → Fase 3 (Lt. Surge) → Fase 4
  (Erika) → Fase 5 (Koga) → Fase 6 (Sabrina) → Fase 7 (Blaine) → Fase 8
  (Giovanni) → Elite Four (Lorelei, Bruno, Agatha, Lance) → Campeão (o rival).
  Cada uma com trechos dos lugares do FireRed, selvagens das rotas, elites e o
  time do líder com os níveis do jogo.
- **151 espécies jogáveis**, todas com linha de 3 golpes e evolução (pedra e troca
  por nível equivalente; Eevee sorteia a evolução).
- **Tabelas de captura**: as 9 do Fellipe, 100% das espécies disponíveis; mais
  Goldeen, Onix, Venonat, Doduo e Seel com peso 3 (padrão até o Fellipe decidir).
- **52 golpes**, no máximo 4 por tipo, todos com sprite do FireRed.

Quando o líder chega, a partida pausa na **apresentação** dele (retrato, nome e a
fala na caixa de texto do FireRed) até o jogador apertar "Lutar!".

Vencer o Campeão abre o **Hall da Fama** (a equipe campeã, um Pokémon por vez, com
os créditos); as equipes ficam em `profile.hallOfFame`, e o mapa da jornada tem o
botão para revê-las.

Desde a 0.8 o chão de cada trecho é o **cenário de tiles do FireRed** (rota,
floresta, caverna e o salão de cada ginásio e da Liga), e os Pokémon em campo são
animados desde a 0.7.

**Ainda não existe** (ver `PLANEJAMENTO.md`): os lendários como encontros
especiais, o pós-jogo, o som (Etapa 5) e o celular (Etapa 6). O controle (gamepad)
funciona desde a 0.7.

`npm run check` mostra o quadro das tabelas de captura sempre atualizado.

---

## 10. Próximos passos

O roteiro está em **[PLANEJAMENTO.md](PLANEJAMENTO.md)**, combinado em 2026-11-02:
fundação de assets a partir do Pokemon All, escolha de treinador (Menino ou
Menina), golpes com sprite, Pokémon animados e cenário de tiles, fases 3 a 8 +
Elite Four + Campeão com a curva de dificuldade, som e outras regiões.
Os itens que estavam aqui foram para lá: Revive, pedras evolutivas, sinergias de
tipo, som e o polimento de troca e captura.

---

## 11. Armadilhas conhecidas (já resolvidas — não reintroduzir)

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
- **Tabela de tipos:** Elétrico não causa dano em Terrestre. Se um teste de dano
  der 0, confira o tipo do alvo antes de suspeitar do código.
- **Metatile fora da tira:** o extrator só guarda as metatiles que o mapa de origem
  usa. Um ID novo num gerador de `render/scenery.js` precisa existir naquele mapa;
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
  `evolution`, senão o tempo congela.
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
- **Estados que pausam a partida** (`levelup`, `capture`, `evolution`, `intro`):
  `Run.update` não roda fora de `running`. Todo estado novo precisa ser resolvido
  pelo `Game`, pelo bot (`tools/bot.mjs`) e pelo `SETTLE` do `screenshot.mjs`,
  senão a simulação congela.
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
| 25 | Modo Livre: depois da vitória, a fase sem fim com XP reduzido, inimigos cada vez mais fortes até ficar quase impossível, e o botão "Voltar para o Centro Pokémon" no canto | 0.20: `Game.startEndless/leaveEndless`, `Run.startEndless`, `SpawnSystem` com as ondas da segunda metade em laço, um elite por minuto e ×1,2 por minuto; XP ×0,4; testes e roteiro de screenshot "livre" |
| 24 | no título, "Jornada" no lugar de "Continuar", com os espaços das jornadas: fazer mais de uma, com novos Pokémon, e voltar para a outra | 0.19: 3 espaços de jornada (`ui/journeys.js`, `Game.openJourney/newJourney/deleteJourney`); cada uma com treinador, inicial, insígnias, equipe, PC e partida; Pokédex, conquistas, Shards e melhorias valem para todas; save antigo vira a jornada 1 |
| 23 | taxa dos lendários: aparecer desde a Fase 7, com chance baixa que cresce até o Campeão; um de cada por jornada; depois, subir levemente lendários e Poké Balls | 0.18: sorteio próprio por Poké Ball (3% → 12%), aves desde a Fase 7, Mewtwo e Mew só na Liga; um de cada (equipe, PC) e uma vez por tentativa; o Campeão com 1 Poké Ball; Poké Ball ×0,085 (era ×0,07); `balance.mjs` mostra as Poké Balls; corrigido o travamento dos golpes que caem do céu (inimigo na borda do alcance) |
| 22 | equilibrar de novo: forçar o jogador a melhorar os Pokémon para passar; ao morrer não perde o progresso da fase, só não libera a seguinte (a Elite Four estava "a coisa mais fácil"); Pokémon já registrados com uma Poké Ball na captura | 0.17: derrota e abandono guardam o progresso; o líder não cresce mais com a equipe (`bossLift` saiu); `stage.difficulty` (a força da fase) calibrada em tentativas até passar, com a Liga mais forte; nível recomendado no lobby; `balance.mjs` mede tentativas e o nível de entrada; Poké Ball no card de quem já está na Pokédex |
| 21 | lendários naturalmente mais fortes, com melhorias e 2º golpe de saída, e um golpe exclusivo, único e muito bonito; com todas as melhorias, curar os 20% sem abrir tela, e a tela só para o 2º golpe, com uma opção única; um nome mais impactante para o 2º golpe | 0.16: `data/legendaries.js` (5 golpes exclusivos desenhados em código, kit, poder maior, entram no nível da equipe); Poção automática e anúncio do "Golpe Desperto" (nome padrão até o Fellipe escolher; sugestões dadas na conversa); roteiro `lendarios` no `screenshot.mjs` |

---

## 13. Como o Fellipe trabalha

- Escreve em **português**; respostas e interface em pt-BR.
- Testa o jogo de verdade entre as rodadas e traz feedback de sensação
  ("muito fácil", "incomoda a quantidade de telas") — **tratar isso como requisito**.
- Valoriza **fidelidade ao universo Pokémon** (níveis de evolução, golpes que
  fazem sentido para a espécie, nomes corretos).
- Quer poder continuar mexendo sozinho: **dados separados de lógica** e
  comentários explicando o porquê, não o quê.
