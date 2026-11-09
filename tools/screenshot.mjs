/**
 * SCREENSHOTS — abre o jogo no Chrome (ou no Edge) sem janela, executa um
 * roteiro e salva as imagens. Serve para conferir o visual sem depender de
 * alguém abrir o navegador, e lista os erros de JavaScript da página.
 *
 * Uso:
 *   node tools/screenshot.mjs <roteiro> [--out pasta] [--size 1280x720]
 *
 * Roteiros: vitrine, treinador, vila, jornada, opcoes, partida, golpes,
 * estresse, chefe, cenario e outros (ver ROTEIROS abaixo).
 * Sem --out, as imagens vão para a pasta temporária do sistema (pbh-screens).
 * Para usar outro navegador: variável de ambiente CHROME_PATH.
 *
 * Sem dependências: um servidor estático do próprio Node e o protocolo de
 * depuração do Chrome (DevTools Protocol) pelo WebSocket nativo do Node 22.
 * Cada execução usa um perfil novo do navegador, então o jogo começa sem save.
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Começa a jornada até a fase, pulando as telas de escolha. */
const START_RUN = "game.newGame(); game.chooseTrainer('red'); game.chooseStarter('bulbasaur'); game.startStage('gym_1_pewter')";

const ROTEIROS = {
  vitrine: [
    { open: 'vitrine.html' }, { wait: 1500 }, { shot: 'vitrine' }
  ],
  // o banner do README (tools/banner.html): o logo sobre a arte do título.
  // Regerar: npm run screens -- banner --size 1280x480 --out assets
  banner: [
    { open: 'tools/banner.html' }, { run: 'document.fonts.ready.then(() => true)' }, { wait: 800 }, { shot: 'banner' }
  ],
  treinador: [
    { open: 'index.html' }, { wait: 500 },
    { run: 'game.newGame()' }, { wait: 900 }, { shot: 'tela-treinador' }
  ],
  jornada: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('leaf'); game.chooseStarter('charmander'); game.openCampaign()" },
    { wait: 1200 }, { shot: 'jornada' }
  ],
  // a melhoria de UX da 0.31: o card de escolha (o inicial e a Poké Ball) e o painel da fase
  ux: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('red'); game.chooseName('Fellipe'); game.hub.awaitStarter = true; game.openStarterChoice()" },
    { wait: 1500 }, { shot: 'ux-01-inicial' },
    { run: "game.padNav.focus(document.querySelectorAll('#starter-choices .starter-card')[1])" }, { wait: 500 }, { shot: 'ux-02-inicial-apontado' },
    { run: "game.chooseStarter('squirtle'); game.hub.dialog = null; game.startStage('gym_1_pewter')" }, { wait: 1200 },
    { run: "import('./src/data/pokemon.js').then(({ getPokemon }) => { const list = ['pikachu', 'oddish', 'geodude', 'articuno'].map((id, i) => ({ ...getPokemon(id), shiny: i === 0 }));" +
           " game.run.state = 'capture'; game.captureOpen = true; game.hud.showCapture(list, () => {}, undefined, { teamSize: 2, maxSize: 6 }); })" },
    { wait: 1200 }, { shot: 'ux-03-pokebola', raw: true },
    { run: "import('./src/data/pokemon.js').then(({ getPokemon }) => game.hud.showCapture(['kangaskhan', 'charmeleon', 'butterfree', 'electabuzz'].map(getPokemon), () => {}, undefined, { teamSize: 2, maxSize: 6 }))" },
    { wait: 1200 }, { shot: 'ux-03b-nomes-longos', raw: true },
    { run: "['pidgey', 'rattata', 'spearow', 'mankey', 'caterpie'].forEach((id) => game.run.team.add(id, 8));" +
           "import('./src/data/pokemon.js').then(({ getPokemon }) => game.hud.showReplace(getPokemon('meowth'), game.run.team.members, () => {}, () => {}))" },
    { wait: 1200 }, { shot: 'ux-04-equipe-cheia', raw: true },
    { run: "game.hud.hideCapture(); game.captureOpen = false; game.run.state = 'running'; game.quitToMenu();" +
           "['gym_1_pewter', 'gym_2_cerulean', 'gym_3_vermilion'].forEach((s) => game.campaign.clearedStages.push(s));" +
           "game.campaign.badges.push('Insígnia Pedra', 'Insígnia Cascata', 'Insígnia Trovão');" +
           "game.campaign.journey = { team: { members: [28, 30, 31, 33, 32, 32].map((lv, i) => ({ uid: 'u' + i, pokemonId: ['wartortle', 'pikachu', 'geodude', 'oddish', 'pidgeotto', 'meowth'][i], level: lv, xp: 0, hp: 50, abilities: [], upgrades: {} })), active: ['u0', 'u1', 'u2'] }, pc: [] };" +
           "game.openCampaign(); game.menus.lobby.selected = 'gym_4_celadon'; game.menus.lobby.render(); document.getElementById('toast-container').innerHTML = ''" },
    { wait: 1800 }, { shot: 'ux-05-painel-erika' },
    { run: "game.campaign.stageStats.gym_1_pewter = { attempts: 3, wins: 2, bestTime: 212, fewestFaints: 1, bestLevel: 16, captures: 4, damage: 21000, firstWin: null };" +
           "game.menus.lobby.selected = 'gym_1_pewter'; game.menus.lobby.render()" }, { wait: 1200 }, { shot: 'ux-06-painel-brock-vencido' },
    { run: "['gym_4_celadon', 'gym_5_fuchsia', 'gym_6_saffron', 'gym_7_cinnabar', 'gym_8_viridian'].forEach((s) => game.campaign.clearedStages.push(s));" +
           "game.menus.lobby.selected = 'e4_lorelei'; game.menus.lobby.render()" }, { wait: 1200 }, { shot: 'ux-07-painel-liga' }
  ],
  // a vila (0.29, PLANEJAMENTO-LOBBY.md): o quarto, a mãe, a vila, a saída travada,
  // o Carvalho, a escolha do inicial, o Centro remodelado, a loja de Pokédolls e o sábio
  vila: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('leaf')" }, { wait: 900 }, { shot: 'vila-00-nome' },
    { run: "document.getElementById('name-input').value = 'Fellipe'" }, { wait: 300 }, { shot: 'vila-00b-nome-escrito' },
    { run: "game.chooseName(document.getElementById('name-input').value)" }, { wait: 1800 }, { shot: 'vila-01-quarto' },
    { run: "game.hub.enter({ map: 'casa_1f', x: 7, y: 4, dir: 'right' }); game.hub.interact()" }, { wait: 2200 }, { shot: 'vila-02-mae' },
    { run: "game.hub.dialog = null; game.hub.enter('home')" }, { wait: 1200 }, { shot: 'vila-03-vila' },
    { hold: ['KeyD'] }, { wait: 1100 }, { hold: [] }, { wait: 400 }, { shot: 'vila-04-andou' },
    { run: "game.hub.enter({ map: 'vila', x: 17, y: 26, dir: 'down' })" }, { wait: 300 },
    { hold: ['KeyS'] }, { wait: 700 }, { hold: [] }, { wait: 2600 }, { shot: 'vila-05-saida-travada' },
    { run: "game.hub.dialog = null; game.hub.enter({ map: 'lab', x: 6, y: 4, dir: 'up' }); game.hub.interact()" }, { wait: 1800 }, { shot: 'vila-06-carvalho' },
    { run: "game.hub.dialog = null; game.hub.awaitStarter = true; game.openStarterChoice()" }, { wait: 1200 }, { shot: 'vila-07-escolha' },
    { run: "game.chooseStarter('charmander')" }, { wait: 1500 }, { shot: 'vila-08-depois-da-escolha' },
    { run: "game.hub.dialog.index = 2; game.hub.dialog.shown = 0" }, { wait: 1500 }, { shot: 'vila-08b-o-mapa' },
    { run: "game.hub.dialog = null; game.openCampaign()" }, { wait: 1500 }, { shot: 'vila-08c-mapa-da-jornada' },
    { run: "game.openHub()" }, { wait: 600 },
    { run: "game.hub.dialog = null; game.hub.enter({ map: 'centro', x: 12, y: 5, dir: 'up' }); game.hub.interact()" }, { wait: 1500 }, { shot: 'vila-09-centro' },
    { run: "game.hub.dialog = null; game.hub.enter({ map: 'pokedoll', x: 8, y: 7, dir: 'up' })" }, { wait: 1200 }, { shot: 'vila-10-pokedoll' },
    { run: "game.hub.enter({ map: 'casa_sabio', x: 3, y: 6, dir: 'up' }); game.hub.interact()" }, { wait: 2500 }, { shot: 'vila-11-sabio' },
    { run: "game.hub.dialog = null; game.hub.enter({ map: 'vila', x: 28, y: 10, dir: 'up' }); game.hub.interact()" }, { wait: 2500 }, { shot: 'vila-12-lagoa' },
    { run: "game.hub.dialog = null; game.profile.shards = 5000; game.hub.enter({ map: 'pokedoll', x: 3, y: 7, dir: 'down' }); game.menus.showModal('modal-decor')" },
    { wait: 1200 }, { shot: 'vila-13-catalogo' },
    { run: "['pc_mesa', 'estante', 'tapete', 'planta', 'planta', 'planta', 'doll_pikachu', 'doll_clefairy', 'doll_jigglypuff', 'doll_meowth', 'doll_pidgey'].forEach((id) => game.buyDecor(id));" +
           "game.menus.closeModal(); game.hub.enter({ map: 'casa_2f', x: 5, y: 6, dir: 'down' }); document.getElementById('toast-container').innerHTML = ''" },
    { wait: 1500 }, { shot: 'vila-14-quarto-decorado' }
  ],
  // as Opções; com uma jornada ativa aparece o Reiniciar a jornada, que pergunta antes (0.33)
  opcoes: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.menus.showModal('modal-options')" }, { wait: 700 }, { shot: 'opcoes' },
    { run: "game.menus.closeModal(); game.newGame(); game.chooseTrainer('leaf'); game.chooseName('Leaf'); game.menus.showModal('modal-options')" },
    { wait: 900 }, { shot: 'opcoes-2-reiniciar' },
    { run: "game.menus.confirmRestart = true; game.menus.buildOptions()" }, { wait: 500 }, { shot: 'opcoes-3-confirmar' }
  ],
  partida: [
    { open: 'index.html' }, { wait: 500 },
    { run: START_RUN }, { wait: 1200 },
    { hold: ['KeyD'] }, { wait: 800 }, { shot: 'partida-direita' },
    { hold: ['KeyW', 'KeyD'] }, { wait: 600 }, { shot: 'partida-diagonal' },
    { hold: ['KeyS'] }, { wait: 600 }, { shot: 'partida-baixo' },
    { hold: [] }, { wait: 400 }, { shot: 'partida-parado' }
  ],
  // a apresentação do líder (o Lt. Surge, na Fase 3)
  lider: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('red'); game.chooseStarter('pikachu' in {} ? 'pikachu' : 'charmander');" +
           "['gym_1_pewter','gym_2_cerulean'].forEach((s) => game.campaign.clearedStages.push(s)); game.startStage('gym_3_vermilion')" },
    { wait: 300 }, { run: 'game.run.time = game.run.stage.duration + 0.2' }, { wait: 6500 }, { shot: 'lider', raw: true }
  ],
  // o controle nas telas: o 1º direcional mostra o foco, o 2º vai para a Menina; A confirma
  controle: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); ['right', 'right', 'a'].forEach((b) => game.handleAction('pad:' + b))" }, { wait: 300 },
    { log: 'game.profile.trainer' },
    { run: "['a', 'a'].forEach((b) => game.handleAction('pad:' + b))" }, { wait: 400 },
    { log: 'game.campaign.starter' }, { shot: 'controle' }
  ],
  // vencer o Campeão: o Hall da Fama com a equipe campeã
  hall: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('leaf'); game.chooseStarter('bulbasaur');" +
           "game.region.campaign.slice(0, -1).forEach((e) => game.campaign.clearedStages.push(e.stage));" +
           "game.startStage('champion'); game.run.team.members[0].pokemonId = 'venusaur'; game.run.team.members[0].level = 61;" +
           "[['pikachu', 58], ['lapras', 57], ['gengar', 59], ['dragonite', 60], ['snorlax', 58]].forEach(([id, lv]) => game.run.team.add(id, lv));" +
           "game.run.state = 'victory'" },
    { wait: 4500 }, { shot: 'hall', raw: true }
  ],
  // a jornada inteira liberada (página alta: use --size 1366x2600)
  campanha: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('leaf'); game.chooseStarter('squirtle');" +
           "game.region.campaign.slice(0, -1).forEach((e) => game.campaign.clearedStages.push(e.stage)); game.openCampaign()" },
    { wait: 1500 }, { shot: 'campanha' }
  ],
  // uma fase nova (Torre Pokémon) com uma equipe forte, para ver a horda e os golpes
  fase5: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('red'); game.chooseStarter('charmander');" +
           "['gym_1_pewter','gym_2_cerulean','gym_3_vermilion','gym_4_celadon'].forEach((s) => game.campaign.clearedStages.push(s));" +
           "game.startStage('gym_5_fuchsia');" +
           "game.run.team.members[0].level = 36; ['gengar', 'blastoise', 'jolteon'].forEach((id) => game.run.team.add(id, 36));" +
           "game.run.team.members.forEach((m) => { m.hp = 9999; }); game.run.refreshStats()" },
    { wait: 6000 }, { shot: 'fase5' }
  ],
  // os 52 golpes, 6 por foto, numa partida de verdade (vitrine.html?golpes=N)
  golpes: Array.from({ length: 9 }, (_, i) => [
    { open: `vitrine.html?golpes=${i}` }, { wait: 1600 }, { shot: `golpes-${i}` }
  ]).flat(),
  // ~250 inimigos e golpes pesados: imprime FPS e milissegundos por quadro
  estresse: [
    { open: 'vitrine.html?estresse' }, { wait: 5000 },
    { log: 'JSON.stringify(window.vitrineStats)' }, { shot: 'estresse' }
  ],
  // os cenários de metatiles do FireRed, um por foto, na partida de verdade
  cenario: [
    { open: 'index.html' }, { wait: 500 },
    { run: START_RUN }, { wait: 1800 }, { shot: 'cenario-rota' },
    ...['forest', 'cave', 'pewter_gym', 'cerulean_gym', 'celadon_gym', 'saffron_gym', 'lorelei_room', 'champion_room'].flatMap((scene) => [
      { run: `game.run.world.scene = '${scene}'` }, { wait: 1800 }, { shot: `cenario-${scene}` }
    ])
  ],
  // capturar na Fase 2 com a equipe já crescida: quem entra aparece em campo e no HUD
  captura: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('leaf'); game.chooseStarter('charmander');" +
           "game.campaign.clearedStages.push('gym_1_pewter'); game.startStage('gym_2_cerulean');" +
           "game.run.team.members[0].level = 18; game.run.team.add('pidgey', 16); game.run.refreshStats()" },
    { wait: 1500 }, { run: "game.run.state = 'capture'; game.captureOpen = true; game.pickCapture('clefairy')" },
    { wait: 2500 }, { shot: 'captura' },
    { log: "JSON.stringify(game.run.team.members.map((m) => [m.pokemonId, m.level, Math.round(m.hp), m.fainted]))" },
    { wait: 4000 }, { shot: 'captura-depois' },
    { log: "JSON.stringify(game.run.team.members.map((m) => [m.pokemonId, m.level, Math.round(m.hp), m.fainted]))" }
  ],
  // a tela de título: sem save, com o cursor descendo, e com uma jornada salva
  titulo: [
    { open: 'index.html' }, { wait: 1500 }, { shot: 'titulo' },
    { key: 'ArrowDown' }, { key: 'ArrowDown' }, { wait: 300 }, { shot: 'titulo-cursor' },
    { run: "game.newGame(); game.chooseTrainer('red'); game.chooseStarter('squirtle'); game.campaign.clearedStages.push('gym_1_pewter'); game.menus.show('screen-title')" },
    { wait: 900 }, { shot: 'titulo-com-save' }
  ],
  // o PC do lobby (equipe de 6 e 3 guardados) e a tela de equipe cheia na partida
  pc: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('leaf'); game.chooseStarter('bulbasaur'); game.campaign.clearedStages.push('gym_1_pewter', 'gym_2_cerulean');" +
           "import('./src/game/Run.js').then(({ Run }) => { const r = new Run('gym_3_vermilion', { starter: 'bulbasaur' });" +
           "['pidgey', 'pikachu', 'geodude', 'oddish', 'zubat'].forEach((id) => r.team.add(id, 22)); r.team.members[0].level = 24;" +
           "r.captureSystem.captureToPC('meowth'); r.captureSystem.captureToPC('psyduck'); r.captureSystem.captureToPC('growlithe');" +
           "game.campaign.journey = { team: r.team.serialize(), pc: r.pc }; game.openCampaign(); })" },
    { wait: 1200 }, { shot: 'pc-lobby' },
    { run: "game.menus.showModal('modal-pc')" }, { wait: 700 }, { shot: 'pc-modal' },
    { run: "{ const pc = game.menus.pcScreen; pc.aim = { area: 'box', slot: 1 }; pc.render() }" }, { wait: 400 }, { shot: 'pc-apontando' },
    { run: "{ const pc = game.menus.pcScreen; pc.act({ area: 'box', slot: 1 }); pc.aim = { area: 'team', index: 2 }; pc.render() }" }, { wait: 400 }, { shot: 'pc-trocando' },
    { run: "{ const pc = game.menus.pcScreen; pc.aim = { area: 'box', slot: 7 }; pc.render() }" }, { wait: 400 }, { shot: 'pc-soltando' },
    { run: "{ const pc = game.menus.pcScreen; pc.act({ area: 'team', index: 2 }); pc.flip(1) }" }, { wait: 400 }, { shot: 'pc-caixa-2' },
    { run: "game.menus.closeModal(); game.startStage('gym_3_vermilion')" }, { wait: 1500 },
    { run: "game.run.state = 'capture'; game.captureOpen = true; game.pickCapture('meowth')" }, { wait: 800 }, { shot: 'pc-captura', raw: true }
  ],
  // o lobby (0.13): o Town Map de Kanto, a fase escolhida, a equipe e o Estojo de Insígnias
  lobby: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('leaf'); game.chooseStarter('squirtle');" +
           "Promise.all([import('./src/game/Run.js'), import('./src/data/stages.js')]).then(([{ Run }, { STAGES }]) => {" +
           "const r = new Run('gym_4_celadon', { starter: 'squirtle' });" +
           "['pidgeotto', 'pikachu', 'oddish', 'machop'].forEach((id) => r.team.add(id, 30)); r.team.members[0].level = 33;" +
           "['gym_1_pewter', 'gym_2_cerulean', 'gym_3_vermilion'].forEach((id, i) => { for (let k = 0; k < 2 + i; k++) " +
           "game.tracker.applyRunResult({ stage: STAGES[id], victory: k > 0, level: 18 + i * 9, teamSize: 4," +
           " stats: { faints: k > 1 ? 1 : 2, captures: 2, damageDealt: 18000 + i * 9000 }, time: 250 - k * 9," +
           " team: r.team.members, journey: { team: r.team.serialize(), pc: [] } }); });" +
           "game.profile.shards = 1240; game.openCampaign(); })" },
    { wait: 1500 }, { run: "document.getElementById('toast-container').innerHTML = ''" }, { shot: 'lobby-1-mapa' },
    { run: "game.menus.lobby.selected = 'gym_3_vermilion'; game.menus.lobby.render()" }, { wait: 500 }, { shot: 'lobby-2-vencida' },
    { run: "game.menus.lobby.selected = 'e4_lorelei'; game.menus.lobby.render()" }, { wait: 500 }, { shot: 'lobby-3-liga' },
    { run: "game.menus.showModal('modal-badges', { stageId: 'gym_2_cerulean' })" }, { wait: 900 }, { shot: 'lobby-4-estojo' }
  ],
  // o 2º golpe (0.14): Flame Wheel, Bolt Strike e Rock Tomb junto dos golpes de sempre
  golpes2: [
    { open: 'index.html' }, { wait: 500 },
    { run: START_RUN }, { wait: 1200 },
    { run: "const r = game.run; r.spawner.update = () => {};" +
           "r.team.members[0].abilities.push('flame_ring'); r.team.add('pikachu', 20).abilities.push('bolt_strike');" +
           "r.team.add('geodude', 20).abilities.push('rock_tomb'); r.team.members.forEach((m) => { m.level = 25; }); r.rebuildCompanionAbilities();" +
           "for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, d = 150 + (i % 5) * 45; r.spawner.spawnAt('rattata', r.player.x + Math.cos(a) * d, r.player.y + Math.sin(a) * d, 14); }" },
    { wait: 1500 }, { shot: 'golpes2-1', raw: true }, { wait: 700 }, { shot: 'golpes2-2', raw: true }, { wait: 900 }, { shot: 'golpes2-3', raw: true },
    // o nível não tem teto: o selo em cima do Pokémon cresce com o número
    { run: "game.run.team.members.forEach((m, i) => { m.level = [9, 100, 137][i] ?? 50; })" }, { wait: 400 }, { shot: 'golpes2-nivel', raw: true }
  ],
  // shiny (0.13.1): as opções da Poké Ball, o Pokémon no campo (com o brilho) e no PC
  shiny: [
    { open: 'index.html' }, { wait: 500 },
    { run: START_RUN }, { wait: 1200 },
    { run: "game.run.spawner.update = () => {}; game.run.enemies.length = 0; " +
           "import('./src/core/config.js').then(({ CONFIG }) => { CONFIG.capture.shinyChance = 1;" +
           "game.run.pendingBall = true; game.run.state = 'capture'; game.openCapture(); })" },
    { wait: 1200 }, { shot: 'shiny-1-pokebola', raw: true },
    { run: "const c = game.run.captureSystem.rollChoices()[0]; game.pickCapture(c.id, true); game.resolveCapture()" },
    { wait: 1400 }, { shot: 'shiny-2-campo', raw: true }, { wait: 1300 }, { shot: 'shiny-3-campo', raw: true },
    { run: "game.campaign.journey = { team: game.run.team.serialize(), pc: [] }; game.quitToMenu(); game.menus.showModal('modal-pc');" +
           "game.menus.pcScreen.aim = { area: 'team', index: 1 }; game.menus.pcScreen.render()" },
    { wait: 900 }, { shot: 'shiny-4-pc' }
  ],
  // a Poké Ball com a equipe cheia (0.12): o aviso de que nada se perde e o "onde ele fica"
  'captura-cheia': [
    { open: 'index.html' }, { wait: 500 },
    { run: START_RUN }, { wait: 1500 },
    { run: "['pidgey', 'rattata', 'caterpie', 'weedle', 'spearow'].forEach((id) => game.run.team.add(id, 8)); game.run.pendingBall = true; game.run.state = 'capture'; game.openCapture()" },
    { wait: 900 }, { shot: 'captura-cheia-1-opcoes', raw: true },
    { run: "game.pickCapture(game.run.captureSystem.rollChoices()[0].id)" }, { wait: 900 }, { shot: 'captura-cheia-2-onde-fica', raw: true },
    { run: "game.resolveCapture(); game.run.team.members.splice(3); game.run.pendingBall = true; game.run.state = 'capture'; game.openCapture()" },
    { wait: 900 }, { shot: 'captura-cheia-3-com-vaga', raw: true }
  ],
  // a derrota: o Centro Pokémon (reiniciar a jornada fica nas Opções desde a 0.33)
  derrota: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('red'); game.chooseStarter('charmander'); game.campaign.clearedStages.push('gym_1_pewter');" +
           "import('./src/game/Run.js').then(({ Run }) => { const r = new Run('gym_1_pewter', { starter: 'charmander' });" +
           "['pidgey', 'nidoran_m'].forEach((id) => r.team.add(id, 12)); r.team.members[0].level = 15;" +
           "game.campaign.journey = { team: r.team.serialize(), pc: [] }; game.startStage('gym_2_cerulean');" +
           "game.run.captureSystem.capture('clefairy'); game.run.team.members.forEach((m) => { m.fainted = true; m.hp = 0; }); game.run.state = 'defeat'; })" },
    { wait: 1500 }, { shot: 'derrota-1-escolha', raw: true },
    { run: "document.getElementById('btn-result-center').click()" },
    { wait: 1200 }, { shot: 'derrota-2-centro', raw: true },
    { run: "document.getElementById('btn-center-go').click()" }, { wait: 900 }, { shot: 'derrota-3-de-volta', raw: true }
  ],
  // as conquistas em níveis, com algumas prontas para coletar e outras já subidas de degrau
  conquistas: [
    { open: 'index.html' }, { wait: 500 },
    { run: "Object.assign(game.profile.stats, { totalCaptures: 12, totalKills: 640, runsPlayed: 6, stagesCleared: 2, badges: 2, maxRunLevel: 24, evolutions: 3 }); game.profile.achievements.tiers = { catcher: 1, hunter: 1, runs: 1 }; game.menus.showModal('modal-achievements')" },
    { wait: 800 }, { shot: 'conquistas' }
  ],
  // todas as telas, uma por foto: para conferir o visual (use antes e depois de mexer no CSS)
  telas: [
    { open: 'index.html' }, { wait: 1200 }, { shot: 'tela-01-titulo' },
    { run: 'game.newGame()' }, { wait: 900 }, { shot: 'tela-02-treinador' },
    { run: "game.chooseTrainer('leaf')" }, { wait: 900 }, { shot: 'tela-03-nome' },
    { run: "game.chooseName('Leaf')" }, { wait: 1200 }, { shot: 'tela-03b-vila' },
    { run: 'game.openStarterChoice()' }, { wait: 900 }, { shot: 'tela-03c-inicial' },
    { run: "game.chooseStarter('bulbasaur'); ['gym_1_pewter', 'gym_2_cerulean'].forEach((s) => game.campaign.clearedStages.push(s)); game.openCampaign()" },
    { wait: 1200 }, { shot: 'tela-04-jornada' },
    { run: "game.menus.showModal('modal-options')" }, { wait: 500 }, { shot: 'tela-05-opcoes' },
    { run: "game.menus.closeModal(); game.menus.showModal('modal-pokedex')" }, { wait: 800 }, { shot: 'tela-06-pokedex' },
    { run: "game.menus.closeModal(); game.menus.showModal('modal-achievements')" }, { wait: 500 }, { shot: 'tela-07b-conquistas' },
    { run: "game.menus.closeModal(); game.menus.showModal('modal-help')" }, { wait: 500 }, { shot: 'tela-07c-ajuda' },
    { run: "game.menus.closeModal(); game.startStage('gym_3_vermilion')" }, { wait: 1500 }, { shot: 'tela-08-partida', raw: true },
    { run: "const m = game.run.team.members[0]; m.pendingLevels = 1; game.openLevelUpFor(m)" }, { wait: 600 }, { shot: 'tela-09-nivel', raw: true },
    { run: "game.pickUpgrade(game.run.progression.rollChoices(game.run.levelUpMember)[0].id); game.run.state = 'capture'; game.captureOpen = true; game.hud.showCapture(game.run.captureSystem.rollChoices(), (id) => game.pickCapture(id))" },
    { wait: 700 }, { shot: 'tela-10-captura', raw: true },
    { run: 'game.resolveCapture(); game.togglePause()' }, { wait: 500 }, { shot: 'tela-11-pausa', raw: true }
  ],
  // o HUD da equipe: espadinha (atacar ou só acompanhar), selo de quem sai e a troca
  equipe: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('red'); game.chooseStarter('squirtle');" +
           "game.campaign.clearedStages.push('gym_1_pewter'); game.startStage('gym_2_cerulean');" +
           "['pidgey', 'clefairy', 'rattata', 'zubat'].forEach((id) => game.run.captureSystem.capture(id));" +
           "game.run.team.toggleAttack(game.run.team.active[2].uid); game.run.team.selectedSlot = 1; game.hud.signature = ''" },
    { wait: 2500 }, { shot: 'equipe' },
    { run: "game.run.team.swapIn(game.run.team.reserve[0].uid); game.hud.signature = ''" }, { wait: 600 },
    { log: "JSON.stringify(game.run.team.active.map((m) => m && [m.pokemonId, m.level, m.attack]))" },
    { shot: 'equipe-trocou' }
  ],
  // Poké Ball e Ímã no chão; depois o Ímã puxando o XP do mapa
  itens: [
    { open: 'index.html' }, { wait: 500 },
    { run: START_RUN }, { wait: 1200 },
    { run: "import('./src/entities/Pickup.js').then(({ Pickup }) => { const r = game.run, p = r.player;" +
           "r.spawner.update = () => {}; r.enemies.length = 0;" +
           "r.pickups.push(new Pickup('ball', p.x - 260, p.y - 40), new Pickup('magnet', p.x + 160, p.y + 10), new Pickup('heal', p.x - 120, p.y + 110, 28));" +
           "for (let i = 0; i < 40; i++) r.pickups.push(new Pickup('xp', p.x + Math.cos(i) * (200 + i * 12), p.y + Math.sin(i * 1.7) * (150 + i * 8), 2)); })" },
    { wait: 700 }, { shot: 'itens-chao' },
    { run: "game.run.pickups.find((x) => x.kind === 'magnet').x = game.run.player.x" }, { wait: 260 }, { shot: 'itens-ima', raw: true }
  ],
  // o Poké Mart (0.23): a loja, a escolha do Pokémon, o Novo Sorteio e o Reviver
  mart: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('red'); game.chooseStarter('charmander'); game.campaign.clearedStages.push('gym_1_pewter');" +
           "game.campaign.journey = { team: { members: [{ uid: 'a', pokemonId: 'charmeleon', level: 22, xp: 0, hp: 50, abilities: ['ember'], upgrades: {} }, { uid: 'b', pokemonId: 'pikachu', level: 20, xp: 0, hp: 40, abilities: ['thunder_shock'], upgrades: {} }], active: ['a', 'b'] }," +
           " pc: [{ uid: 'c', pokemonId: 'eevee', level: 18, xp: 0, hp: 40, abilities: ['quick_attack'], upgrades: {}, slot: 0 }] };" +
           "game.profile.shards = 5200; game.profile.bag = { reroll: 2, revive: 1 }; game.openCampaign(); document.getElementById('toast-container').style.display = 'none'" },
    { wait: 900 }, { shot: 'mart-1-lobby' },
    { run: "game.menus.showModal('modal-mart')" }, { wait: 700 }, { shot: 'mart-2-loja' },
    { run: "const card = [...document.querySelectorAll('#mart-list .mart-card')][3]; card.querySelector('.buy-btn').click(); card.scrollIntoView()" }, { wait: 500 }, { shot: 'mart-3-pedra' },
    { run: "game.menus.closeModal(); game.startStage('gym_1_pewter')" }, { wait: 1500 },
    { run: "const r = game.run; const m = r.team.members[1]; m.fainted = true; m.hp = 0; r.team.handleFaint(m); game.hud.signature = ''" }, { wait: 600 },
    { shot: 'mart-4-reviver', raw: true },
    { run: "game.run.pendingBall = true" }, { wait: 900 }, { shot: 'mart-5-sorteio', raw: true }
  ],
  // a TM Dive (0.34): aparece na loja com um Pokémon de Água desperto, a escolha mostra o golpe esquecido; o Dive em campo
  dive: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('red'); game.chooseStarter('squirtle');" +
           "game.campaign.journey = { team: { members: [{ uid: 'a', pokemonId: 'wartortle', level: 30, xp: 0, hp: 60, abilities: ['water_gun', 'surf'], upgrades: {} }, { uid: 'b', pokemonId: 'pikachu', level: 20, xp: 0, hp: 40, abilities: ['thunder_shock'], upgrades: {} }], active: ['a', 'b'] }," +
           " pc: [{ uid: 'c', pokemonId: 'kabuto', level: 28, xp: 0, hp: 50, abilities: ['rock_throw', 'rock_tomb'], upgrades: {}, slot: 0 }] };" +
           "game.profile.shards = 5200; game.openCampaign(); document.getElementById('toast-container').style.display = 'none'" },
    { wait: 700 },
    { run: "game.menus.showModal('modal-mart')" }, { wait: 700 },
    { run: "const card = [...document.querySelectorAll('#mart-list .mart-card')].find((c) => c.textContent.includes('TM Dive')); card.querySelector('.buy-btn').click(); card.scrollIntoView()" },
    { wait: 500 }, { shot: 'dive-1-loja' },
    { run: "game.menus.closeModal(); game.startStage('gym_1_pewter')" }, { wait: 1500 },
    { run: "const r = game.run; r.spawner.update = () => {}; r.team.members[0].abilities = ['water_gun', 'dive']; r.team.members.forEach((m) => { m.level = 30; }); r.rebuildCompanionAbilities();" +
           "for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, d = 150 + (i % 5) * 45; r.spawner.spawnAt('rattata', r.player.x + Math.cos(a) * d, r.player.y + Math.sin(a) * d, 14); }" },
    { wait: 900 }, { shot: 'dive-2', raw: true }, { wait: 450 }, { shot: 'dive-3', raw: true }, { wait: 450 }, { shot: 'dive-4', raw: true }
  ],
  // a descida do Dive (0.36): a pergunta da lagoa, o aviso e as hordas, o bolsão de ar, o Nível 6 e o resgate
  descida: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('red'); game.chooseStarter('squirtle');" +
           "game.campaign.journey = { team: { members: [{ uid: 'a', pokemonId: 'blastoise', level: 80, xp: 0, hp: 300, abilities: ['hydro_pump', 'dive'], upgrades: {} }], active: ['a'] }, pc: [] };" +
           "game.openHub({ map: 'vila', x: 28, y: 11, dir: 'up' }); document.getElementById('toast-container').style.display = 'none'; game.hub.say('lagoa'); game.hub.confirm(); game.hub.dialog.shown = 999" },
    { wait: 700 }, { shot: 'descida-1-lagoa' },
    { run: "for (let i = 0; i < 6 && !game.diveOpen; i++) { if (game.hub.dialog) game.hub.dialog.shown = 999; game.hub.confirm(); } game.dive.rng = (() => { let x = 7; return () => (x = (x * 16807) % 2147483647) / 2147483647; })()" },
    { wait: 600 }, { shot: 'descida-2-nivel1', raw: true },
    { wait: 2400 }, { shot: 'descida-3-aviso', raw: true },
    { run: "game.dive.start(1); game.dive.levelDone()" }, { wait: 1600 }, { shot: 'descida-4-passagem', raw: true },
    { run: "for (let i = 0; i < 600 && !game.dive.dialog; i++) game.dive.update(1 / 60)" }, { wait: 500 }, { shot: 'descida-5-bolsao', raw: true },
    { run: "game.dive.start(5)" }, { wait: 3200 }, { shot: 'descida-6-nivel6', raw: true },
    { run: "game.dive.lives = 1; game.dive.p.c = 4; game.dive.p.r = 3; game.dive.inv = 0" }, { wait: 4500 },
    { run: "game.hub.dialog && (game.hub.dialog.shown = 999)" }, { wait: 300 }, { shot: 'descida-7-resgate' }
  ],
  // o lendário secreto no fim da Pokédex (0.35): o "???" e, capturado, o Kyogre
  pokedex: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('red'); game.chooseStarter('squirtle'); [1, 4, 7, 25, 129, 130, 131, 150].forEach((d) => game.tracker.registerCaught(d)); game.menus.showModal('modal-pokedex'); document.querySelector('#pokedex-grid').lastElementChild.scrollIntoView({ block: 'center' })" },
    { wait: 900 }, { shot: 'pokedex-1-misterio' },
    { run: "game.tracker.registerSecret('kyogre'); game.menus.showModal('modal-pokedex'); document.querySelector('#pokedex-grid').lastElementChild.scrollIntoView({ block: 'center' })" },
    { wait: 1500 }, { shot: 'pokedex-2-kyogre' }
  ],
  // o tamanho em campo (fieldScale): as aves lendárias, sem inimigos nem golpes
  aves: [
    { open: 'index.html' }, { wait: 500 },
    { run: START_RUN }, { wait: 800 },
    { run: "document.getElementById('toast-container').style.display = 'none'; const r = game.run; r.spawner.update = () => {};" +
           "['articuno', 'zapdos', 'moltres'].forEach((id) => r.captureSystem.capture(id)); r.enemies.length = 0;" +
           "r.team.active = [r.team.members[1], r.team.members[2], r.team.members[3]]; r.syncCompanions();" +
           "r.team.members.forEach((m) => { m.attack = false; }); game.hud.signature = ''" },
    { wait: 2500 }, { shot: 'aves', raw: true }
  ],
  // diagnóstico do Modo Livre: o HUD da equipe acompanha a vida, o XP e a troca?
  livrediag: [
    { open: 'index.html' }, { wait: 500 },
    { run: START_RUN }, { wait: 800 },
    { run: "['pidgey', 'rattata', 'caterpie'].forEach((id) => game.run.captureSystem.capture(id)); game.hud.signature = ''" }, { wait: 600 },
    { run: "game.run.state = 'victory'" }, { wait: 600 },
    { run: 'game.startEndless()' }, { wait: 2500 },
    { log: "JSON.stringify(game.run.team.active.map((m) => m && [m.pokemonId, Math.round(m.hp), Math.round(m.xp)]))" },
    { log: "JSON.stringify([...document.querySelectorAll('#active-slots .mon-card')].map((c) => [c.querySelector('.mon-name')?.textContent, c.querySelector('.bar.hp i')?.style.width, c.querySelector('.bar.xp i')?.style.width]))" },
    { log: "JSON.stringify([...game.hud.nodes.keys()])" },
    { log: "JSON.stringify(game.run.team.members.map((m) => m.uid))" },
    { run: "game.run.team.members[0].hp = 5; game.run.progression.addXpTo(game.run.team.members[0], 3)" }, { wait: 500 },
    { log: "JSON.stringify([...document.querySelectorAll('#active-slots .mon-card')].map((c) => [c.querySelector('.mon-name')?.textContent, c.querySelector('.bar.hp i')?.style.width, c.querySelector('.bar.xp i')?.style.width]))" },
    { run: "game.run.team.swapTimer = 0; game.handleAction('team:3')" }, { wait: 400 },
    { log: "JSON.stringify(game.run.team.active.map((m) => m && m.pokemonId)) + ' state=' + game.run.state" },
    { shot: 'livrediag', raw: true }
  ],
  // diagnóstico 2: vitória de verdade (líder derrotado em jogo) e o botão da tela
  livrediag2: [
    { open: 'index.html' }, { wait: 500 },
    { run: START_RUN }, { wait: 800 },
    { run: "['pidgey', 'rattata', 'caterpie', 'weedle'].forEach((id) => game.run.captureSystem.capture(id)); game.run.team.members.forEach((m) => { m.level = 25; });" +
           "game.run.time = game.run.stage.duration + 0.2;" +
           "window.__tick = setInterval(() => { if (game.introOpen) game.closeLeaderIntro(); if (game.captureOpen) game.resolveCapture(); if (game.evolutionOpen) game.closeEvolution();" +
           " if (game.levelUpOpen) game.pickUpgrade(game.run.progression.rollChoices(game.run.levelUpMember)[0].id); if (game.unlockOpen) game.confirmUnlock();" +
           " const b = game.run?.spawner.boss; if (b && !b.dead && !game.run.endless) b.hp = Math.min(b.hp, 5); }, 100)" },
    { wait: 16000 },
    { log: "game.run.state + ' runEnded=' + game.runEnded + ' result=' + !document.getElementById('result-overlay').classList.contains('hidden')" },
    { run: "document.getElementById('btn-result-endless').click()" },
    { wait: 5000 },
    { log: "'A ' + game.run.state + ' endless=' + game.run.endless + ' ' + JSON.stringify(game.run.team.members.map((m) => [m.pokemonId, Math.round(m.hp), m.level, Math.round(m.xp), m.fainted]))" },
    { log: "'A hud ' + JSON.stringify([...document.querySelectorAll('#active-slots .mon-card')].map((c) => [c.querySelector('.mon-name')?.textContent, c.querySelector('.bar.hp i')?.style.width, c.querySelector('.bar.xp i')?.style.width]))" },
    { wait: 5000 },
    { log: "'B ' + JSON.stringify(game.run.team.members.map((m) => [m.pokemonId, Math.round(m.hp), m.level, Math.round(m.xp), m.fainted]))" },
    { log: "'B hud ' + JSON.stringify([...document.querySelectorAll('#active-slots .mon-card')].map((c) => [c.querySelector('.mon-name')?.textContent, c.querySelector('.bar.hp i')?.style.width, c.querySelector('.bar.xp i')?.style.width]))" },
    { run: "game.run.team.swapTimer = 0; game.hud.signature = ''" }, { wait: 300 },
    { run: "document.querySelector('#reserve-slots .bench-mon:not(.empty)')?.dispatchEvent(new Event('pointerdown'))" }, { wait: 400 },
    { log: "'troca ' + JSON.stringify(game.run.team.active.map((m) => m && m.pokemonId)) + ' state=' + game.run.state" },
    { log: "'endless=' + game.run.endless" },
    { wait: 12000 },
    { log: "'C ' + game.run?.state + ' center=' + game.centerOpen + ' ' + JSON.stringify(game.run?.team.members.map((m) => [m.pokemonId, Math.round(m.hp), m.fainted]))" },
    { log: "'C ativos ' + JSON.stringify(game.run?.team.active.map((m) => m && [m.pokemonId, m.fainted])) + ' campo ' + JSON.stringify(game.run?.companions.map((c) => [c.member.pokemonId, c.dead]))" },
    { log: "'C hud ' + JSON.stringify([...document.querySelectorAll('#active-slots .mon-card')].map((c) => [c.querySelector('.mon-name')?.textContent, c.querySelector('.bar.hp i')?.style.width, c.className]))" },
    { shot: 'livrediag2', raw: true }
  ],
  // o Modo Livre (0.20): o botão na vitória e a partida sem fim, com o botão do Centro no canto
  livre: [
    { open: 'index.html' }, { wait: 500 },
    { run: START_RUN }, { wait: 1200 },
    { run: "document.getElementById('toast-container').style.display = 'none'; game.run.state = 'victory'" }, { wait: 900 },
    { shot: 'livre-1-vitoria', raw: true },
    { run: 'game.startEndless()' }, { wait: 1500 },
    { run: "game.run.spawner.endless.since -= 240" }, { wait: 2500 }, { shot: 'livre-2-partida', raw: true }
  ],
  // os espaços de jornada (0.19): o título com "Jornada" e a tela dos espaços
  jornadas: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('red'); game.chooseStarter('charmander');" +
           "game.campaign.clearedStages.push('gym_1_pewter', 'gym_2_cerulean', 'gym_3_vermilion');" +
           "game.campaign.badges.push('Insígnia Pedra', 'Insígnia Cascata', 'Insígnia Trovão');" +
           "game.campaign.journey = { team: { members: ['venusaur', 'clefable', 'golbat', 'gengar', 'aerodactyl', 'pidgeot'].map((id, i) => ({ uid: 'm' + i, pokemonId: id, level: 127 + i * 3, xp: 0, hp: 50, abilities: [], upgrades: {} })), active: ['m0', 'm1', 'm2'] }, pc: [] };" +
           "game.newJourney(); game.chooseTrainer('leaf'); game.chooseStarter('squirtle'); game.campaign.clearedStages.push('gym_1_pewter'); game.campaign.badges.push('Insígnia Pedra');" +
           "game.quitToMenu(); game.menus.show('screen-title')" },
    { wait: 900 }, { shot: 'jornadas-1-titulo' },
    { run: 'game.menus.showJourneys()' }, { wait: 900 }, { shot: 'jornadas-2-espacos' },
    { run: "game.menus.journeys.confirming = game.listJourneys()[0].id; game.menus.journeys.render()" }, { wait: 400 }, { shot: 'jornadas-3-apagar' }
  ],
  // os golpes exclusivos dos lendários (0.16), cada um em duas fases; o anúncio do
  // Golpe Desperto e o card de captura do lendário
  lendarios: [
    { open: 'index.html' }, { wait: 500 },
    { run: START_RUN }, { wait: 1200 },
    { run: "import('./src/core/config.js').then(({ CONFIG }) => { CONFIG.debug.godMode = true; });" +
           "const r = game.run; r.spawner.update = () => {}; r.time = 20;" +
           "['articuno', 'zapdos', 'moltres', 'mewtwo', 'mew'].forEach((id) => { r.team.members.length < 6 ? r.captureSystem.capture(id) : r.captureSystem.captureToPC(id); });" +
           "window.leg = (id) => { const p = r.player; r.enemies.forEach((e) => { e.dead = true; }); r.signatures.length = 0; r.zones.length = 0;" +
           "  let m = r.team.members.find((x) => x.pokemonId === id);" +
           "  if (!m) { m = r.team.members[1]; m.pokemonId = id; m.abilities = []; import('./src/systems/moves.js').then(({ applyLegendaryKit }) => applyLegendaryKit(m)); }" +
           "  m.abilities = m.abilities.slice(0, 1); m.level = 40;" +
           "  r.team.active = [m, null, null]; r.syncCompanions(); r.rebuildCompanionAbilities();" +
           "  const id0 = r.stage.waves[0].enemies[0].id;" +
           "  for (let i = 0; i < 34; i++) { const a = i * 2.4, d = 110 + (i % 5) * 45; r.spawner.spawnAt(id0, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d); }" +
           "  r.enemies.forEach((e) => { e.hp = e.maxHp = 99999; });" +
           "  r.companions[0].x = p.x; r.companions[0].y = p.y - 30; r.companions[0].abilities.forEach((inst) => { inst.timer = 0; }); };" +
           "game.hud.signature = ''; document.getElementById('toast-container').style.display = 'none'" },
    { wait: 300 },
    { run: "leg('articuno')" }, { wait: 200 }, { shot: 'lendario-1-sheer-cold-carga', raw: true },
    { wait: 380 }, { shot: 'lendario-1-sheer-cold-anel', raw: true },
    { run: "leg('zapdos')" }, { wait: 700 }, { shot: 'lendario-2-zap-cannon', raw: true },
    { wait: 1950 }, { shot: 'lendario-2-zap-cannon-explosao', raw: true },
    { run: "leg('moltres')" }, { wait: 250 }, { shot: 'lendario-3-sacred-fire-asas', raw: true },
    { wait: 780 }, { shot: 'lendario-3-sacred-fire-colunas', raw: true },
    { run: "leg('mewtwo')" }, { wait: 550 }, { shot: 'lendario-4-psystrike', raw: true },
    { wait: 560 }, { shot: 'lendario-4-psystrike-implosao', raw: true },
    { run: "leg('mew')" }, { wait: 650 }, { shot: 'lendario-5-metronome', raw: true },
    { wait: 700 }, { shot: 'lendario-5-metronome-estouro', raw: true },
    { run: "game.run.unlockQueue.push({ member: game.run.team.members[0], moveId: 'leech_seed' })" }, { wait: 600 },
    { shot: 'lendario-6-golpe-desperto', raw: true },
    { run: "game.confirmUnlock(); import('./src/data/pokemon.js').then(({ getPokemon }) => { game.run.state = 'capture'; game.captureOpen = true;" +
           "game.hud.showCapture(['mewtwo', 'articuno', 'pidgey', 'mew'].map((id) => ({ ...getPokemon(id), shiny: id === 'mew' })), () => {}); })" },
    { wait: 900 }, { shot: 'lendario-7-captura', raw: true }
  ],
  // a chave do Golpe Desperto (0.28): as melhorias dela marcadas na tela de nível e o
  // progresso na janela da equipe (Water Gun: Potência, Perfuração e Reflexo)
  despertar: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('red'); game.chooseStarter('squirtle');" +
           "game.campaign.clearedStages.push('gym_1_pewter'); game.startStage('gym_2_cerulean');" +
           "const m = game.run.team.members[0]; m.level = 30; m.upgrades = { water_gun_damage: 3, water_gun_pierce: 1, water_gun_count: 2 };" +
           // levelUpOpen antes do estado: senão o jogo abre a tela dele, com outras opções, por cima desta
           "import('./src/data/upgrades.js').then(({ UPGRADES }) => { game.run.levelUpMember = m; m.pendingLevels = 1; game.levelUpOpen = true; game.run.state = 'levelup';" +
           "game.hud.showLevelUp(m, [UPGRADES.water_gun_damage, UPGRADES.water_gun_count, UPGRADES.water_gun_pierce], () => {}); })" },
    { wait: 1200 }, { shot: 'despertar-1-nivel', raw: true },
    { run: "game.hud.hideLevelUp(); game.run.state = 'running'; game.campaign.journey = { ...(game.campaign.journey ?? {}), team: game.run.team.serialize() }; game.menus.showModal('modal-team')" },
    { wait: 900 }, { shot: 'despertar-2-equipe' }
  ],
  // o líder entra e, antes de cada golpe, aparece o aviso no chão
  chefe: [
    { open: 'index.html' }, { wait: 500 },
    { run: START_RUN }, { wait: 300 },
    { run: 'game.run.time = game.run.stage.duration + 0.5' }, { wait: 2500 },
    // força o golpe do líder agora: primeiro o aviso, depois a onda
    { run: 'game.run.boss.abilities.forEach((a) => { a.timer = 0; })' }, { wait: 350 }, { shot: 'chefe-aviso' },
    { wait: 650 }, { shot: 'chefe-onda' }
  ],
  // o aviso de efetividade (0.32): o líder perto do Squirtle, cujo Water Gun bate 4x no Geodude
  efetivo: [
    { open: 'index.html' }, { wait: 500 },
    { run: "game.newGame(); game.chooseTrainer('red'); game.chooseStarter('squirtle'); game.startStage('gym_1_pewter')" }, { wait: 300 },
    { run: 'game.run.time = game.run.stage.duration + 0.5' }, { wait: 2500 },
    { run: 'game.run.boss.x = game.run.player.x + 170; game.run.boss.y = game.run.player.y - 30' }, { wait: 300 },
    // um golpe de Água no Geodude (4x): o número grande e o aviso em cima dele
    { run: "import('./src/systems/combat.js').then(({ damageEnemy }) => damageEnemy(game.run, game.run.boss, 6, { type: 'water' }))" },
    { wait: 250 }, { shot: 'efetivo' }
  ]
};

/** Códigos de tecla do Windows para as teclas que os roteiros apertam. */
const KEY_CODES = { ArrowUp: 38, ArrowDown: 40, Enter: 13, Escape: 27 };

/** Antes de cada foto da partida: fecha telas de melhoria, captura e evolução. */
const SETTLE = `typeof game !== 'undefined' && game.run && (() => {
  if (game.levelUpOpen) game.pickUpgrade(game.run.progression.rollChoices(game.run.levelUpMember)[0].id);
  if (game.captureOpen) game.resolveCapture();
  if (game.evolutionOpen) game.closeEvolution();
  if (game.introOpen) game.closeLeaderIntro();
})()`;

const BROWSERS = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser'
].filter(Boolean);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ogg': 'audio/ogg'
};

const delay = (ms) => new Promise((done) => setTimeout(done, ms));

/** Servidor estático do repositório numa porta livre. */
function serve() {
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://local').pathname);
    if (path === '/favicon.ico') { res.writeHead(204).end(); return; }   // o jogo não tem ícone
    const file = normalize(join(ROOT, path === '/' ? 'index.html' : path));
    try {
      if (!file.startsWith(ROOT + sep) || !statSync(file).isFile()) throw new Error('fora');
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(readFileSync(file));
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((done) => server.listen(0, '127.0.0.1', () => done(server)));
}

/** Cliente mínimo do DevTools Protocol. */
class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.nextId = 0;
    this.pending = new Map();
    this.listeners = [];
    this.ready = new Promise((done, fail) => {
      this.ws.onopen = done;
      this.ws.onerror = () => fail(new Error('não conectou ao navegador'));
    });
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const call = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) call.fail(new Error(`${call.method}: ${msg.error.message}`));
        else call.done(msg.result);
      } else {
        for (const listener of [...this.listeners]) listener(msg);
      }
    };
  }

  send(method, params = {}, sessionId) {
    const id = ++this.nextId;
    this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    return new Promise((done, fail) => this.pending.set(id, { done, fail, method }));
  }

  on(listener) {
    this.listeners.push(listener);
  }

  once(method) {
    return new Promise((done) => {
      const listener = (msg) => {
        if (msg.method !== method) return;
        this.listeners = this.listeners.filter((l) => l !== listener);
        done(msg.params);
      };
      this.listeners.push(listener);
    });
  }
}

/** O navegador escreve a porta de depuração neste arquivo do perfil. */
async function devtoolsUrl(profileDir) {
  const file = join(profileDir, 'DevToolsActivePort');
  for (let i = 0; i < 150; i++) {
    if (existsSync(file)) {
      const [port, path] = readFileSync(file, 'utf8').trim().split('\n');
      if (path) return `ws://127.0.0.1:${port}${path.trim()}`;
    }
    await delay(100);
  }
  throw new Error('o navegador não abriu a porta de depuração');
}

function parseArgs(argv) {
  const args = { name: 'vitrine', out: join(tmpdir(), 'pbh-screens'), width: 1280, height: 720 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') args.out = resolve(argv[++i]);
    else if (argv[i] === '--size') [args.width, args.height] = argv[++i].split('x').map(Number);
    else args.name = argv[i];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const steps = ROTEIROS[args.name];
  if (!steps) {
    console.error(`Roteiro desconhecido: ${args.name}. Use: ${Object.keys(ROTEIROS).join(', ')}`);
    process.exit(2);
  }
  const browserPath = BROWSERS.find((path) => existsSync(path));
  if (!browserPath) {
    console.error('Não achei Chrome nem Edge. Informe o caminho em CHROME_PATH.');
    process.exit(2);
  }
  mkdirSync(args.out, { recursive: true });

  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const profileDir = mkdtempSync(join(tmpdir(), 'pbh-chrome-'));
  const browser = spawn(browserPath, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profileDir}`,
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio',
    `--window-size=${args.width},${args.height}`, 'about:blank'
  ], { stdio: 'ignore' });

  const errors = [];
  try {
    const cdp = new Cdp(await devtoolsUrl(profileDir));
    await cdp.ready;
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    const page = (method, params) => cdp.send(method, params, sessionId);

    cdp.on((msg) => {
      if (msg.sessionId !== sessionId) return;
      const p = msg.params;
      if (msg.method === 'Runtime.exceptionThrown') {
        errors.push(p.exceptionDetails.exception?.description ?? p.exceptionDetails.text);
      } else if (msg.method === 'Runtime.consoleAPICalled' && p.type === 'error') {
        errors.push(p.args.map((a) => a.value ?? a.description).join(' '));
      } else if (msg.method === 'Log.entryAdded' && p.entry.level === 'error') {
        errors.push(`${p.entry.text}${p.entry.url ? ` (${p.entry.url})` : ''}`);
      }
    });
    await page('Page.enable');
    await page('Runtime.enable');
    await page('Log.enable');
    await page('Emulation.setDeviceMetricsOverride', {
      width: args.width, height: args.height, deviceScaleFactor: 1, mobile: false
    });

    const evaluate = async (expression) => {
      const result = await page('Runtime.evaluate', { expression, awaitPromise: true });
      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
      }
      return result.result?.value;
    };

    for (const step of steps) {
      if (step.open) {
        const loaded = cdp.once('Page.loadEventFired');
        await page('Page.navigate', { url: base + step.open });
        await loaded;
      } else if (step.wait) {
        await delay(step.wait);
      } else if (step.run) {
        await evaluate(step.run);
      } else if (step.log) {
        console.log(`${step.log} => ${await evaluate(step.log)}`);
      } else if (step.key) {
        // uma tecla de verdade, apertada e solta (menus que ouvem keydown)
        for (const type of ['keyDown', 'keyUp']) {
          await page('Input.dispatchKeyEvent', { type, key: step.key, code: step.key, windowsVirtualKeyCode: KEY_CODES[step.key] ?? 0 });
        }
      } else if (step.hold) {
        await evaluate(`game.input.keys.clear(); ${JSON.stringify(step.hold)}.forEach((k) => game.input.keys.add(k))`);
      } else if (step.shot) {
        if (!step.raw) await evaluate(SETTLE);   // raw: fotografa a tela como está
        const { data } = await page('Page.captureScreenshot', { format: 'png' });
        const file = join(args.out, `${step.shot}.png`);
        writeFileSync(file, Buffer.from(data, 'base64'));
        console.log(file);
      }
    }
    await cdp.send('Browser.close').catch(() => {});
  } finally {
    browser.kill();
    server.close();
    await delay(300);
    rmSync(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }

  if (errors.length) {
    console.log(`\nErros da página (${errors.length}):`);
    for (const error of [...new Set(errors)]) console.log(`  - ${error}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
