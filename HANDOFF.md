# HANDOFF — Pokémon Bullet Heaven

> **Leia este arquivo primeiro ao retomar o projeto.**
> Ele descreve o estado atual, as regras de design já decididas, por que cada
> decisão foi tomada e o que falta fazer. O `README.md` é o manual de uso;
> este aqui é o contexto de desenvolvimento.

**Versão atual:** `0.7.0` · **Última atualização:** 2026-11-02
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
npm run balance -- --runs 12 # joga a campanha com o bot e mede vitórias, níveis e lutas
```

Os testes são a rede de segurança do projeto — **rode sempre que mexer em
balanceamento, dados ou interface**. `smoke` usa um "jogador virtual" que foge da
horda em círculos, desvia para pegar Poké Balls, troca Pokémon machucado por
descansado, escolhe melhorias e prefere TMs.

**Balanceamento (desde a 0.6).** `tools/balance.mjs` joga a campanha inteira
várias vezes com o jogador virtual (`tools/bot.mjs`, o mesmo do `smoke`), levando a
equipe de uma fase para a outra, e mostra por fase: vitórias por tentativa, nível
da equipe quando o líder aparece, duração da luta, desmaios e pico de inimigos.
Na 0.6: Fase 1 com 67% e Fase 2 com 61% de vitórias, nível ~16 e ~21 no líder.

**Conferência visual (desde a 0.5).** `tools/screenshot.mjs` abre o jogo no Chrome
(ou Edge) sem janela, executa um roteiro (`vitrine`, `treinador`, `jornada`,
`partida`), salva PNGs e lista os erros de JavaScript da página. Sai com código 1
se a página tiver erro. A `vitrine.html` desenha os assets com o mesmo código da
partida: poses, andar e correr, as 8 direções, a proporção com os Pokémon e os
retratos. **Olhe os screenshots antes de entregar mudança visual.** O feel
(velocidade, animação em movimento) continua sendo validado pelo Fellipe.

---

## 2b. Publicação (GitHub Pages)

O jogo está no ar em **https://fellipeperes.github.io/pokemon-bullet-heaven/**,
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
    pokemon.js        68 espécies: tipos, hp, power, evolução, moveLine
    abilities.js      57 habilidades (21 base, 24 TM, 9 TM final, 3 hostis)
    upgrades.js       228 upgrades de partida, gerados a partir das habilidades
    trainerUpgrades.js 9 melhorias permanentes compradas com Shards
    tms.js            linha de golpes: qual o próximo golpe de cada Pokémon
    capturePools.js   chances de captura por fase (as 9 tabelas do design)
    enemies.js        30 inimigos: selvagens, elites e Pokémon dos líderes
    stages.js         2 fases completas + esqueleto da campanha de Kanto
    regions.js        regiões: Pokédex, iniciais, campanha e treinadores de cada uma
    trainers.js       modelos de treinador (Red, Leaf) e o mapa de quadros da folha
    assetManifest.js  GERADO pelo extrator: tamanho e quadros de cada folha
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
    stats.js          vida máxima, XP por nível, multiplicador de dano por nível
  game/
    Run.js            uma partida: estado, loop, colisões, condições de fim
    Game.js           orquestra tudo: perfil, telas, loop principal, save, loja
  render/
    Renderer.js       canvas: chão, atores, efeitos, barra do chefe, treinador
    assets.js         carrega as folhas do catálogo e desenha quadros em escala inteira
    trainer.js        qual quadro do treinador mostrar (passo pela distância andada)
    sprites.js        sprites de Pokémon (estático/animado/artwork) e insígnias
    icons.js          ícones de item por chave semântica
  ui/
    HUD.js            HUD da partida e overlays (nível, captura, evolução, pausa)
    Menus.js          menu, mapa, modais (Pokédex, conquistas, equipe, loja, opções)
    dom.js            helpers de DOM e toasts
    pad.js            o controle nas telas: foco nos alvos clicáveis da camada de cima
  save/
    SaveManager.js    arquivo .json + autosave em localStorage
    profile.js        progresso permanente + ProfileTracker (eventos → perfil)
tools/
  check-data.mjs      conferência dos dados
  smoke-test.js       teste da lógica
  ui-smoke.js         teste da interface
  screenshot.mjs      screenshots no Chrome sem janela (DevTools Protocol, sem dependências)
  assets/extract.py   gera assets/ a partir do decomp do FireRed no Pokemon All
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
- **3 Pokémon ativos** ao mesmo tempo, equipe de até 6 (`CONFIG.team`).
- Pokémon que desmaia **fica fora até o fim da fase** (item Revive virá depois).
  Um da reserva entra automaticamente no lugar. **Os 6 desmaiados = derrota.**
- Reserva regenera vida sozinha (2,5 HP/s) — trocar é a principal sustentação.

### Experiência e níveis
- O XP de cada inimigo é **dividido pela equipe**: peso 3 para ativo, 1 para
  reserva. Com equipe cheia dá exatamente **25% por ativo e 8,33% por reserva**,
  que foi o pedido original. Com menos Pokémon a proporção se redistribui —
  nada de XP se perde no começo.
- **Subir de nível NÃO cura.** (Curava antes; deixava o jogo trivial.)
  Cura vem de poções no chão, da regeneração da reserva e da troca.
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

### Evolução
- **Por nível, fiel aos jogos**: Charmander→Charmeleon 16→Charizard 36,
  Bulbasaur 16/32, Squirtle 16/36, Pidgey 18/36, Magikarp→Gyarados 20, etc.
- Onde a evolução real depende de pedra ou troca, usamos um nível equivalente e
  marcamos `method: 'stone' | 'trade'` + `item`, para virar item de verdade depois.
- Evoluir **mantém tudo**: golpe atual, melhorias e a proporção de vida (não cura).
- Evolução registra a espécie nova na Pokédex e abre uma tela de evolução.

### TMs — linha de 3 golpes por espécie
- Cada espécie tem `moveLine` com **exatamente 3 golpes**: base → TM → TM final.
- A TM que aparece no level up (12% de chance) dá **o próximo golpe da linha
  daquele Pokémon** — nunca um golpe aleatório de outro. (Bug antigo: Pidgey
  aprendia Hyper Beam. Corrigido e coberto por teste.)
- Ao aprender, **todas as melhorias investidas são transferidas** (`ember_damage`
  vira `flamethrower_damage`); o que não tem equivalente vira potência. Trocar
  nunca é downgrade.
- Quem está no último golpe da linha não recebe mais TM.
- Espécies evoluídas começam no golpe do estágio delas (Raticate já nasce com
  Hyper Fang), mas compartilham a mesma linha da família.

### Captura
- Poké Ball dropa de inimigos derrotados, com **teto por fase** (`maxBalls`) e
  **momentos garantidos** (`scriptedBalls`) — a jornada não pode depender de sorte.
- A bola rola devagar na direção do treinador quando ele está perto: sem isso,
  builds de longo alcance matavam longe e nunca capturavam.
- Quais espécies aparecem e com qual chance está em `capturePools.js`, com as
  **9 tabelas de porcentagem definidas pelo Fellipe**. Espécies ainda não
  implementadas são filtradas automaticamente.

### Fases
- **Uma fase = a jornada inteira até um ginásio.** Ela tem `segments` (Rota 1 →
  Rota 2 → Floresta → Ginásio) que trocam o cenário e aparecem no HUD.
- O chefe final é o **time do líder, enfrentado em sequência** (`bossTeam`),
  terminando no ace. Vencer dá insígnia + Shards.
- A **jornada carrega equipe, níveis e build** de uma fase para a próxima
  (`regions.kanto.journey`). Derrota devolve ao início da fase com a equipe
  como estava no começo dela.
- **Kanto tem 13 etapas** (0.7): os 8 ginásios, a Elite Four em 4 salas (uma por
  membro, cada uma com o time de 5 do FireRed) e o Campeão. Os times são os do
  FireRed, com os níveis dele; o do rival muda pelo seu inicial
  (`bossTeamByStarter`), como no jogo.
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
| Chance de TM no level up | 12% |
| Vida por nível / dano por nível | +6 HP / +7% |
| Invencibilidade após golpe | 0,5s |
| Regeneração: campo / reserva | 0,6 / 2,5 HP/s |
| Chance de poção (selvagem comum) | 4% |
| Poké Balls por fase | 5 a 6 (3 garantidas); 4 na Elite Four, 2 no Campeão |
| Shards por fase | 120 (+180 na 1ª vez) |
| Duração das fases | 300s a 420s (Fases 1 a 8); 280s a 300s (Elite Four); 240s (Campeão) |
| Selvagens por nível (Fase 3+) | vida ×1,075 e dano ×1,035 por nível acima do 5; XP +8% por nível |

**Dificuldade medida** (0.7, `npm run balance -- --runs 12 --until champion`: 12
jornadas do zero, levando a equipe de fase em fase, jogador virtual):

| Etapa | Vitórias do bot | Nível no líder (ace) | Luta | Desmaios | Pico de inimigos |
|---|---|---|---|---|---|
| Fase 1 (Brock) | 71% | 16 (14) | 24s | 2,4 | 65 |
| Fase 2 (Misty) | 80% | 22 (21) | 18s | 2,0 | 79 |
| Fase 3 (Lt. Surge) | 63% | 31 (24) | 21s | 3,1 | 92 |
| Fase 4 (Erika) | 79% | 35 (29) | 21s | 1,7 | 90 |
| Fase 5 (Koga) | 71% | 39 (43) | 33s | 1,9 | 103 |
| Fase 6 (Sabrina) | 44% | 45 (43) | 28s | 4,3 | 116 |
| Fase 7 (Blaine) | 80% | 49 (47) | 28s | 2,0 | 111 |
| Fase 8 (Giovanni) | 70% | 48 (50) | 35s | 2,1 | 115 |
| Lorelei | 88% | 49 (54) | 40s | 1,8 | 142 |
| Bruno | 78% | 51 (56) | 43s | 1,6 | 103 |
| Agatha | 50% | 53 (58) | 52s | 3,5 | 91 |
| Lance | 63% | 54 (60) | 43s | 2,9 | 135 |
| Campeão | 83% | 60 (63) | 48s | 1,8 | 121 |

5 das 12 jornadas foram do zero até o Campeão. Entre uma medição e outra os
números variam uns ±15 pontos (o sorteio de capturas pesa muito), então olhe a
tendência de várias rodadas antes de mexer. O Fellipe joga melhor que o bot: se a
sensação for de jogo fácil, a primeira alavanca é o `scaling.damage` da fase.

**Como ajustar dificuldade** (na ordem de impacto):
1. `scaling.damage` da fase — é o que mais mata.
2. Densidade das ondas (`batch`, `interval`, `maxAlive`) e quantidade de elites.
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
    "achievements": { "unlocked": [], "claimed": [], "progress": {} },
    "stats": { "totalKills": 0, "badges": 1, "...": 0 },
    "region": "kanto",                               // região da jornada atual
    "regions": {
      "kanto": {
        "starter": "charmander", "clearedStages": ["gym_1_pewter"], "badges": ["Insígnia Pedra"],
        "journey": { "team": { "members": [], "active": [] }, "level": 18 }
      }
    }
  },
  "run": { "stageId": "...", "time": 95, "team": {}, "trainerUpgrades": {}, "stats": {} }
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

**Ainda não existe** (ver `PLANEJAMENTO.md`): os lendários como encontros
especiais, o pós-jogo, os Pokémon animados e o cenário de tiles (Etapa 3), o som
(Etapa 5) e o celular (Etapa 6). O controle (gamepad) funciona desde a 0.7.

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

---

## 13. Como o Fellipe trabalha

- Escreve em **português**; respostas e interface em pt-BR.
- Testa o jogo de verdade entre as rodadas e traz feedback de sensação
  ("muito fácil", "incomoda a quantidade de telas") — **tratar isso como requisito**.
- Valoriza **fidelidade ao universo Pokémon** (níveis de evolução, golpes que
  fazem sentido para a espécie, nomes corretos).
- Quer poder continuar mexendo sozinho: **dados separados de lógica** e
  comentários explicando o porquê, não o quê.
