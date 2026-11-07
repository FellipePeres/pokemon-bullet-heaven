<p align="center">
  <img src="assets/banner.svg" alt="Pokémon Bullet Heaven" width="720" />
</p>

<h1 align="center">Pokémon Bullet Heaven</h1>

<p align="center">
  <b><a href="https://fellipeperes.github.io/pokemon-bullet-heaven/">▶ JOGAR AGORA NO NAVEGADOR</a></b>
</p>

<p align="center">
  Um <i>Bullet Heaven</i> (estilo Vampire Survivors / Survivor.io) com estrutura de jornada Pokémon.<br />
  HTML + CSS + JavaScript puro. Sem instalação, sem backend, sem dependências.
</p>

---

## O jogo

Você é um treinador atravessando Kanto: **menino ou menina**, você escolhe no começo,
como no FireRed. **O treinador não luta** — ele só anda.
Quem combate são os **Pokémon da sua equipe**, que atacam sozinhos enquanto você
se preocupa com posicionamento, composição e build.

Cada fase é a **jornada inteira até um ginásio**: você cruza as rotas daquele
trecho enfrentando hordas de Pokémon selvagens, captura novos companheiros, sobe o
nível de cada um e, no fim, encara o **time do líder do ginásio**, um Pokémon de
cada vez, até o ace dele.

A ideia é simples: *"estou fazendo uma jornada Pokémon enquanto construo uma build
de Bullet Heaven"*. Você começa fraco, com um único inicial, e termina a fase com
uma equipe de seis, evoluída, com golpes melhorados e sinergias que você escolheu.

**Entre uma fase e outra, a vila.** A jornada começa no seu quarto, numa mini-vila
feita com os tiles do FireRed, onde você anda em grade, como no jogo. Lá o
**Prof. Carvalho** conta por que as rotas estão tomadas por hordas e te dá o
**primeiro Pokémon**. Até falar com ele, as saídas da vila ficam fechadas. No
**Centro Pokémon**, a enfermeira cuida do PC e um vendedor tem o Poké Mart. A **loja de
Pokédolls** vende bonecos e móveis para decorar o seu quarto, e os moradores têm
o que contar. A saída sul abre o mapa da jornada; o mato alto a oeste e a lagoa
guardam modos que ainda estão por vir.

## Como jogar

| Ação | Tecla |
|---|---|
| Mover o treinador | `WASD` ou setas |
| Trocar o Pokémon em campo | `1` – `6` (ou clique no card) |
| Escolher quem sai na troca (o card marcado "⇄ sai") | `Tab` ou clique no card |
| Ligar ou desligar o ataque de um Pokémon em campo | botão da espadinha no card (desligado, ele só acompanha) |
| Opções e volume da música | a engrenagem no canto (na partida, ao lado da pausa) |
| Gastar os níveis acumulados de um Pokémon | botão `▲` no card |
| Pausar / fechar janela | `ESC` |
| Controle (gamepad) | analógico ou direcional anda · LB/RB escolhem o slot · X/Y/B põem a reserva em campo · Start pausa · nas telas, direcional e A |

Na vila:

| Ação | Tecla |
|---|---|
| Andar (um tile por passo; tocar só vira) | setas ou `WASD`, ou clique onde quer ir |
| Correr | segure `Shift` (ou `X`) |
| Falar, ler, entrar, avançar o texto | `Enter`, `Espaço` ou `Z`, ou clique na pessoa |
| Responder NÃO / voltar | `X` ou `Backspace` |
| Controle (gamepad) | direcional anda · A fala · B segurado corre · Start abre o mapa da jornada |

Os ataques são automáticos. O que você controla é **onde estar**, **quem está em
campo** e **quais melhorias escolher**.

> O progresso fica salvo no navegador e também pode ser exportado como arquivo
> `.json` pelo botão **Salvar Jogo** — dá para levar sua jornada para outra máquina.

## Os sistemas

**Equipe de 6, três em campo.** Os três ativos lutam ao mesmo tempo, orbitando o
treinador. Os outros três descansam e **recuperam vida** na reserva. Trocar tem
cooldown e é a principal forma de sustentar a equipe.

**Vida e nível por Pokémon.** O treinador não tem vida: quem toma dano são os
Pokémon, cada um com sua barra. Quem cai **desmaia até o fim da fase** e é
substituído automaticamente. Se os seis caírem, a fase é perdida.

**Experiência dividida.** O XP de cada inimigo é repartido pela equipe: **25% para
cada Pokémon em campo** e **8,33% para cada um da reserva**. Ninguém fica para trás,
mas quem luta cresce mais rápido.

**Melhorias a cada 3 níveis.** Pokémon ativo que sobe pausa a partida para você
escolher; o da reserva **acumula** e você gasta quando quiser, pelo botão `▲`.
As melhorias valem só para aquele Pokémon: mais dano, mais projéteis, mais área,
recarga menor, efeitos de status.

**Evolução fiel aos jogos.** Charmander vira Charmeleon no nível 16 e Charizard no
36; Bulbasaur e Squirtle seguem 16/32 e 16/36; Magikarp vira Gyarados no 20. Evoluir
mantém golpe e melhorias e cura toda a vida. Do nível 11 em diante, subir de nível
cura 1/10 da vida.

**TMs — a linha de 3 golpes.** Cada espécie tem a própria linha de evolução de
golpe. Charmander é `Ember → Flamethrower → Fire Blast`; Pidgey é
`Gust → Wing Attack → Hurricane`; Machop é `Karate Chop → Seismic Toss → Cross Chop`.
O golpe sobe principalmente na **evolução** (Charmeleon já chega com Flamethrower)
e, mais raramente, por uma TM no level up. Nos dois casos ele vai para **o próximo
da linha daquele Pokémon** — nunca um golpe aleatório de outro — e **leva junto
todas as melhorias já investidas**. Trocar de golpe nunca é um downgrade.

**Captura.** Inimigos derrotados podem deixar uma Poké Ball. Ao coletar, o jogo
pausa e oferece três Pokémon sorteados pela tabela de chances daquela fase. Cada
fase tem um teto de bolas e alguns momentos garantidos, para a jornada não depender
de sorte.

**Shards.** Vêm dos chefes (10 por Pokémon de líder, 5 por chefe simples, mesmo
numa derrota), da **primeira** vitória de cada fase e das conquistas. Gaste no
**Poké Mart**, na barra do lobby: Novo Sorteio (300) e Reviver (600) vão para a
mochila; a TM (1.500) ensina o próximo golpe na hora; as pedras e o Cabo de Troca
(2.500) são a única forma de evoluir quem evolui por item (Pikachu, Eevee,
Kadabra, Gloom...).

**A jornada continua.** Equipe, níveis e build passam de uma fase para a seguinte.
Perder não tira nada: o que a equipe ganhou na tentativa fica, só a próxima fase
não abre até você vencer.

## Conteúdo atual

- **Kanto inteira, 13 etapas** — os 8 ginásios (Brock, Misty, Lt. Surge, Erika,
  Koga, Sabrina, Blaine e Giovanni), a Elite Four (Lorelei, Bruno, Agatha e Lance)
  e o Campeão, cada líder com o time do FireRed. O time do rival muda conforme o
  seu inicial, como no jogo.
- **Treinador à sua escolha**: Red ou Leaf, com os sprites de andar e correr do FireRed
  e o Prof. Carvalho fazendo a pergunta.
- **A Vila da Jornada** (0.29): o lobby jogável, montado com os mapas do FireRed. São 7
  interiores (a sua casa e o quarto, o laboratório do Carvalho, o Centro Pokémon com
  dois balcões, a loja de Pokédolls, a cabana e a casa do velho sábio), 17 moradores e
  Pokémon com falas que mudam com a jornada, e um quarto que você decora com 10 enfeites.
- **Os 151 Pokémon de Kanto jogáveis**, cada um com linha de 3 golpes e linha
  evolutiva. Alguns chegam como presente, como no FireRed (Farfetch'd, Lickitung e
  o prêmio do Dojo de Saffron: Hitmonlee ou Hitmonchan).
- **52 golpes** com o sprite da animação do FireRed, no máximo 4 por tipo, sobre 7
  comportamentos genéricos (projétil, arco, órbita, aura, zona de chão, onda de
  choque e raio em corrente).
- **Cenário do FireRed**: cada trecho da jornada é montado com as metatiles do lugar
  (a grama e as árvores da Rota 1, a mata da Floresta de Viridian, o Monte Lua) e
  cada ginásio e sala da Liga tem o visual do mapa original. O andar continua livre,
  mas árvores, pedras, paredões e estátuas bloqueiam o caminho (seu e dos selvagens).
- **Ímã**: raríssimo, cai de alguns Pokémon e, ao ser pego, puxa todo o XP do mapa até você.
- **Líderes de verdade**: cada um com muito mais vida, rajadas de projéteis mirando
  você e uma fase de fúria abaixo da metade da vida.
- **Visual de GBA**: as janelas e botões do FireRed, fontes em pixel e o fundo dos
  menus montado com o próprio cenário do jogo.
- **Música do FireRed**: uma por fase, a do líder, a da vitória e o tema do lobby,
  com volume ajustável.
- **Lobby no Town Map de Kanto**: cada fase na cidade do ginásio, o treinador
  andando pelo mapa, a fase escolhida ao lado e o **Estojo de Insígnias** (o Cartão
  de Treinador do FireRed) com as métricas de cada fase.
- **Golpe Desperto**: cada golpe tem uma **chave** de 3 melhorias (o Hydro Pump do
  Gyarados: Velocidade, Perfuração e Potência; o Toxic do Gloom: Amplitude,
  Intensidade e Reflexo). Elas aparecem em dourado na tela de nível, com o aviso
  "maximize para despertar"; com
  as 3 no máximo, o Pokémon desperta na hora um golpe a mais do tipo dele (51 ao
  todo: Flame Wheel, Whirlpool, Draco Meteor...), que usa junto do dele. As outras
  melhorias continuam valendo; com todas no máximo, cada nível de melhoria cura
  20% sozinho, sem abrir tela.
- **Lendários**: Articuno, Zapdos, Moltres, Mewtwo e Mew têm um golpe exclusivo
  (Sheer Cold, Zap Cannon, Sacred Fire, Psystrike e Metronome) e já chegam com
  melhorias e o Golpe Desperto. Raros na Poké Ball: as aves a partir da Fase 7,
  Mewtwo e Mew na Liga, com a chance crescendo até o Campeão; um de cada por
  jornada.
- **Shiny**: raro (1%), na captura e no inicial — o card da Poké Ball brilha, e o
  Pokémon fica com as cores raras no campo, no PC e na Pokédex.
- **Modo Livre**: ao vencer uma fase, dá para seguir nela sem fim, com XP
  reduzido e inimigos cada vez mais fortes, até ficar quase impossível. O botão
  "Voltar para o Centro Pokémon", no canto, sai guardando o que a equipe ganhou.
- **Jornadas**: até 3 ao mesmo tempo, cada uma com o seu treinador, inicial,
  insígnias e equipe. No título, **Jornada** mostra os espaços (Jogar, Apagar ou
  começar outra) e **Nova jornada** abre uma sem apagar as outras. A Pokédex, as
  conquistas e os Shards valem para todas.
- **Derrota sem perda**: o que a equipe ganhou na tentativa (níveis, melhorias,
  evoluções e capturas) fica; só a próxima fase não abre. No Centro Pokémon a
  equipe é curada e você tenta de novo, ou rejoga fases anteriores para upar. O
  lobby mostra o **nível recomendado** de cada fase ao lado do nível da sua equipe.
- **Pokédex na captura**: quem você já registrou aparece com uma Poké Ball ao
  lado do nome.
- **PC do FireRed**: com a equipe cheia, nada se perde — quem sai (ou quem chega)
  vai para o PC. No mapa da jornada, o PC é o do jogo: caixas com papel de parede,
  a mão como cursor, pegar e soltar para montar a equipe da próxima fase.
- **Conquistas em níveis**: 20 conquistas, cada uma com vários degraus — ao coletar,
  ela volta com um objetivo maior e mais Shards.
- Fases curtas: 2:45 até o líder, cerca de 3 minutos com a luta.
- **Pokédex de Kanto** (151) que se preenche conforme você captura e evolui.
- **12 conquistas** com recompensa em Shards.
- A dificuldade e a quantidade de inimigos sobem fase a fase: os selvagens ganham
  nível junto com a sua equipe, e as hordas passam de 80 para mais de 150 na tela.

## Rodando localmente

O jogo usa ES Modules, então precisa ser servido por HTTP (abrir o `index.html`
com duplo clique não funciona por causa do CORS).

```bash
git clone https://github.com/FellipePeres/pokemon-bullet-heaven.git
cd pokemon-bullet-heaven

npm run dev               # http://localhost:5173
# ou: python -m http.server 5173
# ou: extensão Live Server do VS Code
```

Não há dependências para instalar — `npm run dev` só sobe um servidor estático.

### Testes

```bash
npm test                  # roda os três
npm run check             # dados: evoluções, linhas de golpe, inimigos, pools
npm run smoke             # lógica: fases inteiras simuladas, sem navegador
npm run smoke:ui          # interface: DOM simulado a partir do index.html real
```

O `smoke` joga as fases do começo ao fim com um "jogador virtual" que foge da
horda, pega Poké Balls, troca Pokémon machucado e escolhe melhorias — é assim que o
balanceamento é medido.

## Estrutura

```
index.html        página única          css/style.css     interface
src/
  core/           config e utilidades   ⭐ config.js = todo o balanceamento
  data/           CONTEÚDO do jogo      ⭐ só dados, sem lógica
  entities/       treinador, Pokémon, inimigos, projéteis, áreas, itens
  systems/        comportamento genérico (combate, habilidades, spawn, equipe...)
  game/           Run (uma partida), Hub (a vila) e Game (orquestração)
  render/         canvas, sprites e ícones
  ui/             HUD, menus e modais
  save/           arquivo .json e progresso permanente
tools/            testes automatizados e os extratores de assets (assets/)
```

A regra do projeto: **`/data` é conteúdo, `/systems` é comportamento**. Adicionar
um Pokémon, habilidade, inimigo, fase ou conquista é editar `/data` — os upgrades
de cada habilidade nova, por exemplo, são gerados automaticamente.

📄 **[HANDOFF.md](HANDOFF.md)** tem o estado detalhado do desenvolvimento: decisões
de design e o porquê de cada uma, balanceamento medido, armadilhas já resolvidas e
os próximos passos.

## Créditos

Sprites, ícones de item e insígnias vêm do repositório público
[PokeAPI/sprites](https://github.com/PokeAPI/sprites) — estáticos no canvas,
animados (Gen V) na interface e arte oficial nas telas grandes. Sem internet, o
jogo desenha versões procedurais e a interface cai para ícones simples.

Os treinadores (andar, correr e retratos), os golpes, o cenário e a caixa de texto vêm
do FireRed, pelo decomp [pret/pokefirered](https://github.com/pret/pokefirered), e ficam
em `assets/`.
A procedência de cada arquivo está em [assets/PROVENIENCIA.md](assets/PROVENIENCIA.md).

> **Projeto de fã, sem fins lucrativos.** Pokémon e todos os nomes relacionados são
> marcas registradas da Nintendo, Game Freak e The Pokémon Company. Este projeto não
> é afiliado a elas e não é vendido nem monetizado.
