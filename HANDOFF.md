# HANDOFF — Pokémon Bullet Heaven

> **Leia este arquivo primeiro ao retomar o projeto.**
> Ele descreve o estado atual, as regras de design já decididas, por que cada
> decisão foi tomada e o que falta fazer. O `README.md` é o manual de uso;
> este aqui é o contexto de desenvolvimento.

**Versão atual:** `0.4.0` · **Última atualização:** 2026-09-21
**Stack:** HTML + CSS + JavaScript puro (ES Modules). Sem backend, sem build, sem dependências.

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
npm run check                # dados: evoluções, linhas de golpe, inimigos, pools
npm run smoke                # lógica: fases inteiras simuladas, sem navegador
npm run smoke:ui             # interface: DOM simulado a partir do index.html real
```

Os testes são a rede de segurança do projeto — **rode sempre que mexer em
balanceamento, dados ou interface**. `smoke` usa um "jogador virtual" que foge da
horda em círculos, desvia para pegar Poké Balls, troca Pokémon machucado por
descansado, escolhe melhorias e prefere TMs.

⚠️ **Nunca foi validado em navegador por mim.** A lógica e a montagem das telas
estão cobertas por teste; aparência, layout e feel são validados pelo Fellipe.

---

## 3. Arquitetura

```
index.html            página única (telas, HUD, overlays, modais)
css/style.css         toda a interface
src/
  main.js             ponto de entrada
  core/
    config.js         ⭐ TODO o balanceamento e as opções
    events.js         EventBus + nomes de eventos
    input.js          teclado
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
    sprites.js        sprites de Pokémon (estático/animado/artwork) e insígnias
    icons.js          ícones de item por chave semântica
  ui/
    HUD.js            HUD da partida e overlays (nível, captura, evolução, pausa)
    Menus.js          menu, mapa, modais (Pokédex, conquistas, equipe, loja, opções)
    dom.js            helpers de DOM e toasts
  save/
    SaveManager.js    arquivo .json + autosave em localStorage
    profile.js        progresso permanente + ProfileTracker (eventos → perfil)
tools/
  check-data.mjs      conferência dos dados
  smoke-test.js       teste da lógica
  ui-smoke.js         teste da interface
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
  (`profile.campaign.journey`). Derrota devolve ao início da fase com a equipe
  como estava no começo dela.

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
| Curva de XP por Pokémon | 12 × 1,15^nível |
| Melhoria a cada | 3 níveis |
| Chance de TM no level up | 12% |
| Vida por nível / dano por nível | +6 HP / +7% |
| Invencibilidade após golpe | 0,5s |
| Regeneração: campo / reserva | 0,6 / 2,5 HP/s |
| Chance de poção (selvagem comum) | 4% |
| Poké Balls por fase | 5 (3 garantidas) |
| Shards por fase | 120 (+180 na 1ª vez) |
| Duração das fases | 300s / 330s |

**Dificuldade medida** (24 partidas simuladas na Fase 1, jogador virtual):
**63% de vitória**, nível máximo ~17-18, ~20 telas de melhoria, 2-4 desmaios por
partida, derrotas concentradas entre 260s e 293s (na reta final / no líder).
O Fellipe joga melhor que o bot, então na prática fica em torno de 75-85%.

**Como ajustar dificuldade** (na ordem de impacto):
1. `scaling.damage` da fase — é o que mais mata.
2. Densidade das ondas (`batch`, `interval`, `maxAlive`) e quantidade de elites.
3. `scaling.hp` da fase — alonga a partida sem matar.
4. Vida dos Pokémon do líder em `enemies.js`.
5. `damagePerLevel` / upgrade de dano — mexem no poder do jogador.

⚠️ Aprendizado: mexer em várias alavancas ao mesmo tempo já levou de 90% para 13%
de vitória. **Mexa em uma, meça, repita.**

---

## 6. Comportamentos genéricos de habilidade

O `AbilitySystem` conhece 7 comportamentos. Habilidade nova quase sempre reusa um:

| Comportamento | O que faz | Exemplos |
|---|---|---|
| `projectile` | dispara projéteis no alvo (pierce, homing, explosão) | Ember, Hydro Pump |
| `melee_arc` | golpe em arco perto do Pokémon | Vine Whip, Cross Chop |
| `orbit` | orbes girando em volta | Flame Wheel, Petal Dance |
| `aura` | área permanente com dano por tick | Fire Ring, Mega Drain |
| `ground_zone` | área no chão, no alvo, por alguns segundos | Leech Field, Toxic |
| `nova` | onda que se expande do Pokémon | Gust, Earthquake |
| `chain` | raio que salta entre inimigos | Thunder Shock, Thunder |

Stats suportadas: `damage, cooldown, count, speed, range, pierce, size, duration,
area, arc, spread, tickRate, chains, knockback, homing, explodeDamage` +
`effects: { burn, poison, slow }`.

Os upgrades genéricos (dano, recarga, quantidade, área, perfuração...) são
**gerados automaticamente** para toda habilidade nova em `upgrades.js`.

---

## 7. Assets

Tudo vem do repositório público **PokeAPI/sprites** (verificado, tudo 200):

| Uso | Caminho |
|---|---|
| Canvas (jogo) | `sprites/pokemon/<dex>.png` — estático (canvas não anima GIF) |
| Menus, HUD, cards | `.../versions/generation-v/black-white/animated/<dex>.gif` |
| Escolha do inicial | `.../other/official-artwork/<dex>.png` |
| Ícones de interface | `sprites/items/<nome>.png` |
| Insígnias de ginásio | `sprites/badges/<n>.png` (1 = Pedra, 2 = Cascata...) |

- **Não existem sprites de treinador** nesses repositórios — o treinador é
  desenhado à mão no `Renderer._drawTrainer` (boné virando com o movimento,
  pernas/braços animados, mochila, anel do raio de coleta).
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
  "signature": "pokemon-bullet-heaven", "schemaVersion": 1, "gameVersion": "0.4.0",
  "profile": {
    "shards": 620,
    "trainerUpgrades": { "meta_speed": 2 },
    "pokedex": { "caught": [4, 5, 25] },            // só capturados/evoluídos
    "achievements": { "unlocked": [], "claimed": [], "progress": {} },
    "stats": { "totalKills": 0, "...": 0 },
    "campaign": {
      "starter": "charmander", "clearedStages": ["gym_1_pewter"], "badges": [],
      "journey": { "team": { "members": [], "active": [] }, "level": 18 }
    }
  },
  "run": { "stageId": "...", "time": 95, "team": {}, "trainerUpgrades": {}, "stats": {} }
}
```

`normalizeProfile` faz merge com os padrões, então **campo novo não quebra save
antigo**. Ao carregar uma partida salva, a fase recomeça com a equipe curada.

---

## 9. Estado do conteúdo

**Pronto e jogável:**
- Fase 1 — Rumo a Pewter (BROCK): 4 trechos, elites, Geodude + Onix em sequência.
- Fase 2 — Rumo a Cerulean (MISTY): 4 trechos, elites, Staryu + Starmie.
- 68 espécies jogáveis com linha de golpes e evolução.
- Pools de captura: **fases 1 e 2 a 100%** das tabelas.

**Esqueleto (aparece como "em breve" no mapa):**
Fases 3 a 9 — Lt. Surge, Erika, Koga, Sabrina, Blaine, Giovanni, Elite Four + Campeão.
As tabelas de captura delas **já estão escritas** em `capturePools.js`; falta
implementar as espécies e os blocos de fase. Cobertura hoje:

| Pool | Espécies prontas |
|---|---|
| phase3 | 17/27 (64%) |
| phase4 | 14/31 (43%) |
| phase5 | 8/44 (22%) |
| phase6 | 19/43 (35%) |
| phase7 | 16/41 (31%) |
| phase8 | 18/55 (26%) |
| phase9 | 18/60 (21%) |

`npm run check` sempre mostra esse quadro atualizado.

---

## 10. Próximos passos (ordem sugerida)

1. **Fase 3 (Lt. Surge)** — copiar o bloco da Fase 2 em `stages.js`, criar as
   espécies que faltam do `phase3` (Meowth, Psyduck, Diglett, Vulpix, Magnemite,
   Voltorb, Slowpoke...) com `moveLine` e evolução, e montar o time do líder
   em `enemies.js` (Voltorb, Pikachu, Raichu) com uma habilidade especial.
2. **Item Revive** — trazer um Pokémon desmaiado de volta no meio da fase.
   O sistema de desmaio já está isolado em `TeamSystem.handleFaint`.
3. **Pedras evolutivas como item** — `method: 'stone'` já marca quem depende delas.
4. Sinergias de tipo entre membros da equipe (ainda não existe nada).
5. Som e música.
6. Polimento: animação de troca, efeito de captura.

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

---

## 13. Como o Fellipe trabalha

- Escreve em **português**; respostas e interface em pt-BR.
- Testa o jogo de verdade entre as rodadas e traz feedback de sensação
  ("muito fácil", "incomoda a quantidade de telas") — **tratar isso como requisito**.
- Valoriza **fidelidade ao universo Pokémon** (níveis de evolução, golpes que
  fazem sentido para a espécie, nomes corretos).
- Quer poder continuar mexendo sozinho: **dados separados de lógica** e
  comentários explicando o porquê, não o quê.
