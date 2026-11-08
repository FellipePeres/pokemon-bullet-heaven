import { CONFIG } from '../core/config.js';
import { Input } from '../core/input.js';
import { bus, EVENTS } from '../core/events.js';
import { Run } from './Run.js';
import { Renderer } from '../render/Renderer.js';
import { preload } from '../render/sprites.js';
import { HUD } from '../ui/HUD.js';
import { Menus } from '../ui/Menus.js';
import { toast } from '../ui/dom.js';
import { preloadAssets, assetUrl } from '../render/assets.js';
import { SceneryCache } from '../render/scenery.js';
import { stageScenes } from '../data/scenery.js';
import { loadOptions } from '../save/options.js';
import { PadNavigator } from '../ui/pad.js';
import { Hub } from './Hub.js';
import { HubRenderer } from '../render/HubRenderer.js';
import { HubHUD } from '../ui/hubHud.js';

/** X, Y e B põem em campo os da reserva (posições 4, 5 e 6 da equipe). */
const RESERVE_BUTTONS = { x: 3, y: 4, b: 5 };
import { SaveManager } from '../save/SaveManager.js';
import {
  createProfile, normalizeProfile, ProfileTracker,
  regionProgress, createRegionProgress, countBadges, createJourneySlot
} from '../save/profile.js';
import { STAGES, isStageUnlocked } from '../data/stages.js';
import { getRegion, DEFAULT_REGION } from '../data/regions.js';
import { TRAINER_LOOKS, getTrainerLook, trainerName, cleanTrainerName } from '../data/trainers.js';
import { POKEMON, getPokemon } from '../data/pokemon.js';
import { ENEMIES } from '../data/enemies.js';
import { MusicPlayer } from '../audio/music.js';
import { swapWithPC, moveMon, normalizePC, fixDuplicateUids } from '../systems/pc.js';
import { getMartItem, itemEvolutions } from '../data/items.js';
import { getDecor, decorMax } from '../data/decor.js';
import { evolveMember, learnNextMove } from '../systems/moves.js';
import { nextMoveFor } from '../data/tms.js';
import { getAbility } from '../data/abilities.js';
import { isBonusMove } from '../data/bonusMoves.js';
import { maxHpFor } from '../systems/stats.js';

/**
 * GAME — junta tudo: perfil, telas, partida e loop principal.
 * É o único lugar que conhece todos os módulos; cada sistema continua
 * sabendo apenas do seu próprio assunto.
 */
/** O máximo de tempo que um toque do relógio recupera (a aba escondida pode ficar sem toques). */
const MAX_CATCH_UP = 60;

export class Game {
  constructor(canvas) {
    loadOptions();   // preferências do menu Opções, guardadas no navegador

    // ---- perfil (progresso permanente) ----
    const local = SaveManager.loadLocal();
    this.profile = local ? normalizeProfile(local.profile) : createProfile();
    this.pendingRun = local?.run ?? null;
    this._foldPendingRun();   // a partida que ficou no meio entra na jornada (0.24)
    this.tracker = new ProfileTracker(this.profile);

    // ---- infraestrutura ----
    this.renderer = new Renderer(canvas);
    this.input = new Input();
    this.input.onAction = (action) => this.handleAction(action);
    this.hud = new HUD(this);
    this.menus = new Menus(this);
    this.padNav = new PadNavigator();
    this.music = new MusicPlayer();

    // a vila, o lobby jogável (0.29): a regra, o desenho e a interface
    this.hubOpen = false;
    this.hub = new Hub(this);
    const hubCanvas = document.getElementById('hub-canvas');
    this.hubRenderer = new HubRenderer(hubCanvas);
    this.hubHud = new HubHUD(this);
    hubCanvas?.addEventListener?.('pointerdown', (e) => this._hubClick(e));
    if (typeof window !== 'undefined') window.addEventListener('resize', () => { if (this.hubOpen) this._resizeHub(); });
    this.hallOpen = false;
    this.centerOpen = false;   // o Centro Pokémon, depois de uma derrota

    this.run = null;
    this.runEnded = false;
    this.afterTrainer = null;   // o que vem depois da escolha de treinador
    this.levelUpOpen = false;
    this.unlockOpen = false;
    this.captureOpen = false;
    this.evolutionOpen = false;
    this.introOpen = false;
    this.lastTime = 0;
    this.autosaveTimer = 0;

    bus.on(EVENTS.TOAST, ({ text, icon }) => toast(text, icon));

    // pré-carrega os sprites mais usados
    preload([
      ...Object.values(POKEMON).map((p) => p.dex),
      ...Object.values(ENEMIES).map((e) => e.dex)
    ]);
    preloadAssets(Object.values(TRAINER_LOOKS).map((look) => look.sheet));

    this.menus.show('screen-title');
    requestAnimationFrame((ts) => this.loop(ts));
    this._backgroundClock();
  }

  /* ============================ loop principal ============================ */

  loop(ts) {
    this._frame(ts);
    requestAnimationFrame((next) => this.loop(next));
  }

  /**
   * Um passo do jogo. Com a aba visível, quem chama é o requestAnimationFrame;
   * escondida ou minimizada, o relógio do Worker (`_backgroundClock`), porque o
   * navegador para o requestAnimationFrame e desacelera os timers dessas abas
   * (0.25, pedido do Fellipe: a partida não congela em outra aba). O tempo que
   * passou vira passos de no máximo 50 ms, então a partida anda no tempo certo
   * mesmo com os toques espaçados; escondida, ela não desenha.
   */
  _frame(now) {
    let elapsed = this.lastTime ? Math.min(MAX_CATCH_UP, (now - this.lastTime) / 1000) : 0;
    this.lastTime = now;
    if (elapsed < 0) elapsed = 0;
    const hidden = typeof document !== 'undefined' && !!document.hidden;
    this.input.poll();   // controle (os botões chegam em handleAction)

    if (this.run) {
      do {
        const dt = Math.min(0.05, elapsed);
        elapsed -= dt;
        this.run.update(dt, this.input.getMoveVector());
        this._handleRunState();
        if (this.introOpen) {
          this.introCountdown -= dt;
          if (this.introCountdown <= 0) this.closeLeaderIntro();
          else if (!hidden) this.hud.setLeaderCountdown(this.introCountdown);
        }

        // autosave periódico (só conveniência local)
        this.autosaveTimer += dt;
        if (this.autosaveTimer > 15) {
          this.autosaveTimer = 0;
          if (this.run.endless && this.run.state === 'running') this.campaign.journey = this._journeyFrom(this.run);
          this.autosave();
        }
      } while (elapsed > 0 && this.run);
      if (this.run && !hidden) {
        this.renderer.render(this.run);
        this.hud.update(this.run);
      }
    } else if (this.hubOpen) {
      // a vila: com uma janela aberta (PC, Mart, Pokédex), o jogador fica parado
      const move = this.menus.openModal ? { x: 0, y: 0 } : this.input.getMoveVector();
      const running = this.input.isRunHeld();
      do {
        const dt = Math.min(0.05, elapsed);
        elapsed -= dt;
        this.hub.update(dt, move, running);
      } while (elapsed > 0 && this.hubOpen);
      if (!hidden) {
        this.hubRenderer.render(this.hub);
        this.hubHud.update(this.hub);
      }
    }

    this._updateMusic();
  }

  /**
   * O relógio da aba escondida: um Worker manda um toque a cada 100 ms (os timers
   * de um Worker não são desacelerados como os da página). Com a aba visível, o
   * toque é ignorado — quem anda é o requestAnimationFrame. Sem Worker (os testes
   * em Node), a aba escondida pausa como antes.
   */
  _backgroundClock() {
    if (typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof document === 'undefined') return;
    try {
      const source = 'setInterval(() => postMessage(0), 100);';
      const worker = new Worker(URL.createObjectURL(new Blob([source], { type: 'text/javascript' })));
      worker.onmessage = () => { if (document.hidden) this._frame(performance.now()); };
      this.clockWorker = worker;
    } catch {
      /* sem Worker: a partida pausa com a aba escondida, como até a 0.24 */
    }
  }

  /**
   * A música que deveria tocar agora: o tema do lobby nos menus e na vila (ou a
   * do lugar: o Centro Pokémon tem a dele), a da fase na partida, a do líder
   * quando ele entra, a da vitória no resultado, a do Hall da Fama e a do Centro
   * Pokémon depois de uma derrota. A pausa só abaixa o volume.
   */
  _updateMusic() {
    const run = this.run;
    let track = this.hubOpen ? (this.hub.place?.music ?? 'lobby-theme') : 'lobby-theme';
    if (this.hallOpen) track = 'mus_hall_of_fame';
    else if (this.centerOpen) track = 'mus_poke_center';
    else if (run?.state === 'victory') track = 'mus_victory_gym_leader';
    else if (run && (run.boss || run.pendingIntro)) track = run.stage.leaderMusic ?? 'mus_vs_gym_leader';
    else if (run) track = run.stage.music ?? 'lobby-theme';
    this.music.play(track);
    this.music.duck(run?.state === 'paused');
  }

  _handleRunState() {
    switch (this.run.state) {
      case 'levelup':
        if (!this.levelUpOpen) this.openLevelUp();
        break;
      case 'capture':
        if (!this.captureOpen) this.openCapture();
        break;
      case 'unlock':
        if (!this.unlockOpen) this.openUnlock();
        break;
      case 'evolution':
        if (!this.evolutionOpen) this.openEvolution();
        break;
      case 'intro':
        if (!this.introOpen) this.openLeaderIntro();
        break;
      case 'victory':
        this.endRun(true);
        break;
      case 'defeat':
        // no Modo Livre, cair é só o fim dele: o que a equipe ganhou fica
        if (this.run.endless) this.leaveEndless();
        else this.endRun(false);
        break;
    }
  }

  /* ============================== fluxo de menus ============================== */

  /** Campanha da região atual: fases concluídas, insígnias e a jornada. */
  get campaign() {
    return regionProgress(this.profile);
  }

  get region() {
    return getRegion(this.profile.region);
  }

  /**
   * Recomeça a jornada ATIVA do zero (o "Reiniciar a jornada" das Opções; até a
   * 0.32, o "Recomeçar a jornada" da tela de derrota). Sem
   * jornada ativa, ela nasce aqui. Uma jornada nova, ao lado das outras, é o
   * `newJourney`.
   */
  newGame() {
    // Pokédex e conquistas são progresso permanente e permanecem;
    // apenas a campanha da região e a partida em andamento recomeçam.
    if (!this.activeSlot) {
      const slot = createJourneySlot();
      this.profile.journeys.push(slot);
      this.profile.activeJourney = slot.id;
    }
    this.profile.regions[this.profile.region] = createRegionProgress();
    this.profile.stats.badges = countBadges(this.profile);
    this.pendingRun = null;
    // como no FireRed, a jornada começa dizendo quem é você; depois, o jogador
    // acorda no quarto e o Prof. Carvalho dá o inicial no laboratório (0.29)
    this.askTrainer(() => this.openHub('bedroom'));
  }

  /** Abre a escolha de treinador; `then` segue o fluxo depois da escolha. */
  askTrainer(then) {
    this.afterTrainer = then;
    this.menus.buildTrainerChoice();
    this.menus.show('screen-trainer');
  }

  chooseTrainer(lookId) {
    this.profile.trainer = getTrainerLook(lookId).id;
    this.autosave();
    this.askName();
  }

  /** Depois de menino ou menina, o nome do jogador (0.30, no lugar de Red e Leaf). */
  askName() {
    this.menus.buildNameEntry();
    this.menus.show('screen-name');
  }

  /** O nome escrito (limpo; vazio fica o do modelo) e segue o fluxo de antes da escolha. */
  chooseName(raw) {
    this.profile.trainerName = cleanTrainerName(raw);
    this.autosave();
    const next = this.afterTrainer;
    this.afterTrainer = null;
    next?.();
  }

  /** O nome do jogador da jornada ativa: o que ele escreveu ou o do modelo. */
  get playerName() {
    return trainerName(this.profile.trainer, this.profile.trainerName);
  }

  chooseStarter(pokemonId) {
    const data = getPokemon(pokemonId);
    this.campaign.starter = pokemonId;
    // o inicial também pode vir shiny (0.13.2): sorteado aqui e guardado na jornada,
    // para não mudar a cada tentativa antes da primeira vitória
    this.campaign.starterShiny = Math.random() < CONFIG.capture.shinyChance;
    this.campaign.journey = null;
    this.tracker.registerCaught(data.dex);
    if (this.campaign.starterShiny) this.tracker.registerShiny(data.dex);
    this.tracker.checkAchievements();
    this.autosave();
    // de volta ao laboratório: o Carvalho fecha a mini-história e as saídas abrem (0.29)
    this.openHub();
    this.hub.afterStarter();
  }

  openCampaign() {
    // o aviso no botão do mapa, na vila, some depois da primeira vez (0.30)
    if (this.campaign.starter) {
      this.campaign.hub ??= { flags: {} };
      (this.campaign.hub.flags ??= {}).mapa_visto = true;
    }
    this.menus.buildCampaign();
    this.menus.show('screen-campaign');
  }

  canContinue() {
    return !!this.pendingRun || !!this.profile.trainer;
  }

  /* ============================ a vila (0.29) ============================ */

  /**
   * Abre a vila. `spawn` põe o jogador num lugar ('bedroom' na jornada nova,
   * 'home' na frente de casa depois de uma partida); sem ele, a vila continua
   * de onde estava (a volta do mapa ou da escolha do inicial).
   */
  openHub(spawn = null) {
    if (spawn || !this.hub.map) this.hub.enter(spawn ?? 'home');
    this.menus.show('screen-hub');
    this._resizeHub();
    this.hubHud.render();
    this.input.clear();
  }

  /** O canvas da vila acompanha a janela; o mapa fica na área abaixo da barra do topo. */
  _resizeHub() {
    const bar = document.getElementById('hub-bar');
    this.hubRenderer.resize(bar?.getBoundingClientRect?.().bottom ?? 0);
  }

  /** A escolha do inicial, aberta pelo Prof. Carvalho. */
  openStarterChoice() {
    this.menus.buildStarters();
    this.menus.show('screen-starter');
  }

  /** O Voltar da escolha do inicial: de volta ao laboratório, sem escolher. */
  cancelStarter() {
    this.openHub();
    this.hub.cancelStarter();
  }

  /** O botão Mapa da jornada (e o Start do controle): só depois do inicial. */
  hubOpenMap() {
    if (!this.campaign.starter) {
      toast('Fale com o Prof. Carvalho primeiro: ele está no laboratório.', '🔒');
      return;
    }
    this.openCampaign();
  }

  /** Clique no mapa da vila: anda até o tile (ou fala com quem está lá). */
  _hubClick(event) {
    if (!this.hubOpen || this.menus.openModal) return;
    const canvas = this.hubRenderer.canvas;
    const rect = canvas.getBoundingClientRect();
    const tile = this.hubRenderer.tileAt(
      (event.clientX - rect.left) * (canvas.width / rect.width),
      (event.clientY - rect.top) * (canvas.height / rect.height)
    );
    this.hub.clickTile(tile.x, tile.y);
  }

  /* ======================= os espaços de jornada (0.19) ======================= */

  /** O espaço da jornada ativa (a que está nos campos de cima do perfil). */
  get activeSlot() {
    return this.profile.journeys.find((slot) => slot.id === this.profile.activeJourney) ?? null;
  }

  /**
   * As jornadas começadas, para a tela de jornadas: a ativa vem do perfil (e a
   * partida em andamento dela, do `pendingRun`); as outras, do espaço delas.
   */
  listJourneys() {
    return this.profile.journeys.map((slot) => {
      const active = slot.id === this.profile.activeJourney;
      const data = active
        ? { trainer: this.profile.trainer, trainerName: this.profile.trainerName, region: this.profile.region, regions: this.profile.regions }
        : slot.data;
      const progress = data?.regions?.[data.region];
      // começada é quem já escolheu o treinador: desde a 0.29 o inicial vem depois, na vila
      if (!progress || !data?.trainer) return null;
      return {
        id: slot.id, active, trainer: data.trainer, trainerName: data.trainerName ?? null, region: data.region, progress,
        pendingRun: active ? this.pendingRun : slot.pendingRun, updatedAt: slot.updatedAt
      };
    }).filter(Boolean);
  }

  /** Guarda a jornada ativa no espaço dela (antes de trocar de jornada). */
  _stashActive() {
    const slot = this.activeSlot;
    if (!slot) return;
    if (!this.profile.trainer) {
      // nem escolheu o treinador: não há o que guardar, o espaço volta a ficar livre
      this.profile.journeys.splice(this.profile.journeys.indexOf(slot), 1);
    } else {
      slot.data = JSON.parse(JSON.stringify({
        trainer: this.profile.trainer, trainerName: this.profile.trainerName ?? null,
        region: this.profile.region, regions: this.profile.regions
      }));
      slot.pendingRun = this.pendingRun ? JSON.parse(JSON.stringify(this.pendingRun)) : null;
      slot.updatedAt = new Date().toISOString();
    }
    this.profile.activeJourney = null;
  }

  /** Põe um espaço nos campos de cima: ele vira a jornada ativa. */
  _activate(slot) {
    const data = slot.data;
    this.profile.activeJourney = slot.id;
    this.profile.trainer = data?.trainer ?? null;
    this.profile.trainerName = data?.trainerName ?? null;
    this.profile.region = data?.region ?? DEFAULT_REGION;
    this.profile.regions = data?.regions ?? { [DEFAULT_REGION]: createRegionProgress() };
    this.pendingRun = slot.pendingRun ?? null;
    slot.data = null;
    slot.pendingRun = null;
    this._foldPendingRun();   // a partida que ficou no meio desta jornada entra nela (0.24)
    this.profile.stats.badges = countBadges(this.profile);
  }

  /** Abre uma jornada, sempre na vila (a partida que ficou no meio entra nela antes, 0.24). */
  openJourney(id) {
    const slot = this.profile.journeys.find((s) => s.id === id);
    if (!slot) return;
    if (slot.id !== this.profile.activeJourney) {
      this._stashActive();
      this._activate(slot);
      this.autosave();
    }
    this.continueGame();
  }

  /** Começa uma jornada nova num espaço livre, sem mexer nas outras. */
  newJourney() {
    // a ativa ainda nem começou (sem treinador): é ela mesma que recomeça
    if (this.activeSlot && !this.profile.trainer) { this.newGame(); return; }
    if (this.listJourneys().length >= CONFIG.save.maxJourneys) {
      toast(`Os ${CONFIG.save.maxJourneys} espaços de jornada estão ocupados: apague uma para começar outra.`, '🗂️');
      this.menus.showJourneys();
      return;
    }
    this._stashActive();
    const slot = createJourneySlot();
    this.profile.journeys.push(slot);
    this._activate(slot);
    this.newGame();
  }

  /** Apaga uma jornada (a tela confirma antes). O que é do jogador fica. */
  deleteJourney(id) {
    const index = this.profile.journeys.findIndex((s) => s.id === id);
    if (index === -1) return;
    this.profile.journeys.splice(index, 1);
    if (id === this.profile.activeJourney) {
      this.profile.activeJourney = null;
      this.profile.trainer = null;
      this.profile.trainerName = null;
      this.profile.regions = { [DEFAULT_REGION]: createRegionProgress() };
      this.profile.region = DEFAULT_REGION;
      this.pendingRun = null;
      this.profile.stats.badges = countBadges(this.profile);
    }
    this.autosave();
  }

  /**
   * Continuar a jornada nunca volta ao meio da fase (0.24, pedido do Fellipe:
   * "mesmo que tenha saído no meio da fase"): leva à vila, na frente de casa (0.29;
   * até a 0.28, ao mapa). A partida que ficou no meio já entrou na jornada
   * (`_foldPendingRun`), como um abandono: nada do que a equipe ganhou se perde.
   */
  continueGame() {
    // saves de antes da escolha de treinador perguntam uma vez
    if (!this.profile.trainer) { this.askTrainer(() => this.continueGame()); return; }
    this._foldPendingRun();
    this.openHub('home');   // desde a 0.29, a jornada abre na vila, na frente de casa
  }

  /**
   * A partida que ficou no meio (o navegador fechou durante a fase, ou um save
   * feito na pausa) entra na jornada: a equipe dela e o PC que ela juntou, como
   * um abandono — e o jogador volta à vila (na 0.24, ao mapa), não à fase.
   */
  _foldPendingRun() {
    const snapshot = this.pendingRun;
    this.pendingRun = null;
    const members = snapshot?.team?.members;
    if (!members?.length || !this.campaign.starter) return;
    const journey = this.campaign.journey;
    this.campaign.journey = {
      ...(journey ?? {}),
      team: snapshot.team,
      level: Math.max(...members.map((m) => m.level ?? 1)),
      pc: [...(journey?.pc ?? []), ...(snapshot.pc ?? [])]
    };
  }

  /** Inicia uma fase. `snapshot` restaura equipe/upgrades de um save. */
  startStage(stageId, snapshot = null) {
    const stage = STAGES[stageId];
    if (!stage) return;
    if (!isStageUnlocked(stageId, this.campaign.clearedStages)) {
      toast('Essa fase ainda está bloqueada.', '🔒');
      return;
    }

    // Ordem de prioridade para montar a partida:
    // 1) snapshot de um save (continuar exatamente de onde parou)
    // 2) jornada acumulada (equipe e build das fases já vencidas)
    // 3) começo do zero, apenas com o inicial
    const journey = this.campaign.journey;
    this.pendingRun = null;   // a partida salva, se havia, é esta (ou foi deixada para trás)
    let options;
    if (snapshot) {
      options = { team: snapshot.team, pc: snapshot.pc };
    } else if (journey) {
      fixDuplicateUids(journey);   // saves de até a 0.20 (ids repetidos)
      options = { team: journey.team };
    } else {
      options = { starter: this.campaign.starter, starterShiny: this.campaign.starterShiny };
    }
    options.ownedElsewhere = (journey?.pc ?? []).map((m) => m.pokemonId);   // lendário: um de cada
    options.trainer = this.profile.trainer;
    options.campaignStarter = this.campaign.starter;

    this.run = new Run(stageId, options);
    this.preloadStage(stage);
    this.runEnded = false;
    this.levelUpOpen = false;
    this.unlockOpen = false;
    this.captureOpen = false;
    this.evolutionOpen = false;
    this.autosaveTimer = 0;

    // registra na Pokédex quem entra em campo
    for (const member of this.run.team.members) {
      this.tracker.registerCaught(getPokemon(member.pokemonId).dex);
    }

    this.hud.hideAllOverlays();
    this.hud.signature = '';
    this.input.clear();
    this.menus.showGame();
  }

  /** Começa a carregar o que a fase vai mostrar: Pokémon animados (equipe, selvagens, líder) e cenários. */
  preloadStage(stage) {
    const enemyIds = [
      ...stage.waves.flatMap((wave) => wave.enemies.map((e) => e.id)),
      ...(stage.elites ?? []).map((e) => e.id),
      ...(stage.bossTeam ?? []),
      ...Object.values(stage.bossTeamByStarter ?? {}).flat()
    ];
    const dexes = new Set(enemyIds.map((id) => ENEMIES[id]?.dex).filter(Boolean));
    for (const member of this.run.team.members) dexes.add(getPokemon(member.pokemonId).dex);
    const shiny = this.run.team.members.filter((m) => m.shiny).map((m) => `pokemon/shiny/${getPokemon(m.pokemonId).dex}`);
    preloadAssets([...[...dexes].map((dex) => `pokemon/${dex}`), ...shiny]);
    SceneryCache.preload(stageScenes(stage));
  }

  /**
   * O que a tentativa deixa para a jornada (0.17, pedido do Fellipe: "ao morrer
   * você não perde progresso daquela fase, apenas não desbloqueia a seguinte"):
   * níveis, melhorias, evoluções, capturas e o PC.
   */
  _journeyFrom(run) {
    const bestLevel = run.team.members.reduce((max, m) => Math.max(max, m.level), 0);
    // no Modo Livre o PC de antes já recebeu o da vitória: a base é a guardada na entrada
    const basePc = run.endless ? (this.endlessBasePc ?? []) : (this.campaign.journey?.pc ?? []);
    return {
      team: run.team.serialize(), upgrades: { ...run.upgrades }, level: bestLevel,
      pc: [...basePc, ...run.pc]
    };
  }

  quitToMenu() {
    // abandonar no meio (ou sair do Modo Livre) também guarda o que a equipe
    // ganhou, como uma derrota, mas não conta nas métricas da fase
    const run = this.run;
    if (run && (!this.runEnded || run.endless) && run.team?.members.length) {
      this.campaign.journey = this._journeyFrom(run);
      this.pendingRun = null;
      this.autosave();
    }
    this.run = null;
    this.runEnded = false;
    this.centerOpen = false;
    this.hud.hideAllOverlays();
    // de volta para a vila, na frente de casa (0.29); de lá, o mapa está a um botão
    if (this.profile.trainer) this.openHub('home');
    else this.menus.show('screen-title');
  }

  /* ============================== partida ============================== */

  handleAction(action) {
    if (action.startsWith('pad:')) { this.handlePad(action.slice(4)); return; }
    // o A e o B da vila (Enter/Espaço/Z e X/Backspace)
    if (action === 'confirm' || action === 'cancel') {
      if (this.hubOpen && !this.menus.openModal) {
        if (action === 'confirm') this.hub.confirm();
        else this.hub.cancel();
      }
      return;
    }
    if (action === 'pause') {
      // fora da partida, ESC fecha a janela aberta (e, na vila, a conversa)
      if (this.menus.openModal) { this.menus.closeModal(); return; }
      // na escolha do inicial, ESC é o Voltar: de volta ao laboratório (0.31)
      if (document.getElementById('screen-starter')?.classList.contains('hidden') === false) { this.cancelStarter(); return; }
      if (this.hubOpen && this.hub.dialog) { this.hub.cancel(); return; }
      if (this.run && (this.run.state === 'running' || this.run.state === 'paused')) this.togglePause();
      return;
    }
    if (!this.run) return;
    if (this.run.state !== 'running') return;

    if (action === 'cycleSlot') {
      const team = this.run.team;
      team.selectedSlot = (team.selectedSlot + 1) % team.active.length;
      this.hud.signature = '';
      return;
    }
    if (action.startsWith('team:')) {
      this.run.team.swapByIndex(Number(action.split(':')[1]));
      this.hud.signature = '';
    }
  }

  /**
   * Controle. Na partida: Start pausa, LB/RB escolhem o slot, X/Y/B põem em campo
   * o 1º, 2º e 3º da reserva (como as teclas 4, 5 e 6). Fora dela: o direcional
   * move o foco e o A confirma, em qualquer tela ou janela (ui/pad.js).
   */
  handlePad(button) {
    if (this.run?.state === 'running') {
      if (button === 'start') this.handleAction('pause');
      else if (button === 'lb' || button === 'rb') this.handleAction('cycleSlot');
      else if (button in RESERVE_BUTTONS) this.handleAction(`team:${RESERVE_BUTTONS[button]}`);
      return;
    }
    if (button === 'start' && this.run?.state === 'paused') { this.togglePause(); return; }
    // na vila: o A fala, o B cancela (segurado, corre), o Start abre o mapa; o direcional anda
    if (this.hubOpen && !this.menus.openModal) {
      if (button === 'a') this.hub.confirm();
      else if (button === 'b') this.hub.cancel();
      else if (button === 'start') this.hubOpenMap();
      else if ((button === 'up' || button === 'down') && this.hub.dialog?.ask) this.hub.choose();
      return;
    }
    this.padNav.handle(button);
  }

  togglePause() {
    if (!this.run) return;
    if (this.run.state === 'running') {
      this.run.state = 'paused';
      this.hud.showPause(this.run);
    } else if (this.run.state === 'paused') {
      this.hud.hidePause();
      this.run.state = 'running';
      this.input.clear();
    }
  }

  /** Abre a tela de melhoria do Pokémon que está com níveis pendentes. */
  openLevelUp() {
    const member = this.run.levelUpMember;
    if (!member || member.pendingLevels <= 0) { this.closeLevelUp(); return; }
    this.levelUpOpen = true;
    const choices = this.run.progression.rollChoices(member);
    this.hud.showLevelUp(member, choices, (id) => this.pickUpgrade(id));
  }

  /**
   * Botão ▲ nos cards: gasta os níveis que um Pokémon acumulou.
   * Serve para os da reserva, que sobem de nível sem interromper a partida.
   */
  openLevelUpFor(member) {
    if (!this.run || !member || member.pendingLevels <= 0) return;
    if (this.run.state !== 'running' && this.run.state !== 'paused') return;
    this.hud.hidePause();
    this.run.levelUpMember = member;
    this.run.state = 'levelup';
    this.openLevelUp();
  }

  pickUpgrade(upgradeId) {
    const run = this.run;
    const member = run.levelUpMember;
    if (!member) return;

    run.progression.applyUpgrade(upgradeId, member);
    member.pendingLevels = Math.max(0, member.pendingLevels - 1);
    this.hud.signature = '';

    if (member.pendingLevels > 0) {
      // ainda há níveis guardados deste Pokémon
      this.hud.showLevelUp(member, run.progression.rollChoices(member), (id) => this.pickUpgrade(id));
      return;
    }
    this.closeLevelUp();
  }

  closeLevelUp() {
    this.levelUpOpen = false;
    this.hud.hideLevelUp();
    if (!this.run) return;
    this.run.levelUpMember = null;
    if (this.run.state === 'levelup') this.run.state = 'running';
  }

  /**
   * O anúncio do Golpe Desperto (0.16): uma opção só, que o jogador clica para
   * seguir. Um de cada vez, se vierem dois juntos.
   */
  openUnlock() {
    const next = this.run?.unlockQueue[0];
    if (!next) { this.closeUnlock(); return; }
    this.unlockOpen = true;
    this.hud.showUnlock(next.member, next.moveId, () => this.confirmUnlock());
  }

  confirmUnlock() {
    if (!this.run) return;
    this.run.unlockQueue.shift();
    if (this.run.unlockQueue.length) { this.openUnlock(); return; }
    this.closeUnlock();
  }

  closeUnlock() {
    this.unlockOpen = false;
    this.hud.hideLevelUp();
    if (this.run?.state === 'unlock') this.run.state = 'running';
  }

  /** Abre o Hall da Fama de uma equipe campeã; `then` roda ao fechar. */
  showHallOfFame(entry, then = null) {
    const look = getTrainerLook(entry.trainer);
    this.hallOpen = true;
    this.hud.showHallOfFame(entry, {
      trainerName: trainerName(entry.trainer, entry.trainerName),
      portrait: assetUrl(look.portrait),
      regionName: getRegion(entry.region).name
    }, () => {
      this.hallOpen = false;
      this.hud.hideHallOfFame();
      then?.();
    });
  }

  /** O líder chega: a partida pausa na apresentação dele até o jogador lutar. */
  openLeaderIntro() {
    this.introOpen = true;
    // sem clique em Lutar, a luta começa sozinha (0.25): a contagem anda no `_frame`
    this.introCountdown = CONFIG.leaderIntroSeconds;
    this.hud.showLeaderIntro(this.run.pendingIntro, () => this.closeLeaderIntro());
    this.hud.setLeaderCountdown(this.introCountdown);
  }

  closeLeaderIntro() {
    this.introOpen = false;
    this.hud.hideLeaderIntro();
    if (!this.run) return;
    this.run.pendingIntro = null;
    if (this.run.state === 'intro') this.run.state = 'running';
    this.input.clear();
  }

  /** Mostra a evolução (a partida fica pausada até o jogador confirmar). */
  openEvolution() {
    const evolution = this.run.evolutionQueue[0];
    if (!evolution) { this.closeEvolution(); return; }
    this.evolutionOpen = true;
    this.hud.signature = '';
    this.tracker.registerCaught(evolution.to.dex);
    this.hud.showEvolution(evolution, () => this.closeEvolution());
  }

  closeEvolution() {
    if (!this.run) return;
    this.run.evolutionQueue.shift();
    this.evolutionOpen = false;
    this.hud.hideEvolution();
    if (this.run.evolutionQueue.length) { this.openEvolution(); return; }
    if (this.run.state === 'evolution') this.run.state = 'running';
  }

  openCapture() {
    this.captureOpen = true;
    const choices = this.run.captureSystem.rollChoices();
    if (!choices.length) {
      toast('Nenhum Pokémon novo apareceu desta vez.', '◓');
      this.resolveCapture();
      return;
    }
    this.hud.showCapture(choices, (pokemonId, shiny) => this.pickCapture(pokemonId, shiny), this.run.pendingGift?.title,
      { teamSize: this.run.team.members.length, maxSize: CONFIG.team.maxSize });
  }

  pickCapture(pokemonId, shiny = false) {
    const run = this.run;
    if (run.team.isFull) {
      // equipe cheia: quem sai vai para o PC — ou o novo vai direto para lá
      this.hud.showReplace({ ...getPokemon(pokemonId), shiny }, run.team.members, (memberUid) => {
        run.captureSystem.captureReplacing(memberUid, pokemonId, { shiny });
        this.tracker.registerCaught(getPokemon(pokemonId).dex);
        this.resolveCapture();
      }, () => {
        run.captureSystem.captureToPC(pokemonId, { shiny });
        this.tracker.registerCaught(getPokemon(pokemonId).dex);
        this.resolveCapture();
      });
      return;
    }
    run.captureSystem.capture(pokemonId, { shiny });
    this.tracker.registerCaught(getPokemon(pokemonId).dex);
    this.resolveCapture();
  }

  /** Fecha a tela de captura (com ou sem capturar) e volta ao combate. */
  resolveCapture() {
    this.captureOpen = false;
    this.hud.hideCapture();
    this.hud.signature = '';
    if (!this.run) return;
    this.run.pendingBall = false;
    this.run.pendingGift = null;
    if (this.run.state === 'capture') this.run.state = 'running';
  }

  endRun(victory) {
    if (this.runEnded) return;
    this.runEnded = true;
    const run = this.run;

    const bestLevel = run.team.members.reduce((max, m) => Math.max(max, m.level), 0);
    this.tracker.applyRunResult({
      stage: run.stage,
      victory,
      level: bestLevel,
      teamSize: run.team.members.length,
      stats: run.stats,
      time: run.time,
      team: run.team.members,
      // vencendo ou não, a equipe, a build e o PC ficam (0.17)
      journey: this._journeyFrom(run)
    });

    this.pendingRun = null;
    const champion = victory && run.stage.id === this.region.campaign.filter((e) => e.stage).at(-1)?.stage;
    if (champion) {
      this.profile.hallOfFame.push({
        date: new Date().toISOString(),
        trainer: this.profile.trainer,
        trainerName: this.profile.trainerName ?? null,
        region: this.profile.region,
        team: run.team.members.map((m) => ({ pokemonId: m.pokemonId, level: m.level, shiny: !!m.shiny }))
      });
    }
    this.autosave();
    this.hud.hideLevelUp();
    this.hud.hideCapture();
    if (champion) {
      // depois do Hall da Fama, a tela de vitória de sempre — com o Modo Livre (0.27)
      this.showHallOfFame(this.profile.hallOfFame.at(-1), () => this.hud.showResult({ victory, run }));
      return;
    }
    this.hud.showResult({ victory, run });

    if (victory) {
      const next = this._nextStage();
      if (next) toast(`Próxima etapa liberada: ${next.name}`, '🗺️');
    }
  }

  /* ============================ Modo Livre (0.20) ============================ */

  /**
   * Da tela de vitória: a fase continua sem fim, com XP reduzido e inimigos cada
   * vez mais fortes (CONFIG.endless). A vitória já foi registrada; o PC que veio
   * com ela já está na jornada, então o da partida recomeça vazio.
   */
  startEndless() {
    const run = this.run;
    if (!run || run.state !== 'victory' || run.endless) return;
    this.endlessBasePc = [...(this.campaign.journey?.pc ?? [])];
    run.pc = [];
    run.startEndless();
    this.hud.hideResult();
    this.hud.signature = '';
    toast('Modo Livre: os inimigos ficam mais fortes a cada minuto. O que a equipe ganhar fica.', 'boss');
  }

  /**
   * Sai do Modo Livre (o botão do canto ou a equipe toda caída): guarda o que a
   * equipe ganhou e vai para a vila, na frente de casa (0.29; na 0.20.1, a pedido
   * do Fellipe, ia direto ao mapa da jornada; antes abria a janela do Centro). A
   * equipe chega curada na próxima fase.
   */
  leaveEndless() {
    const run = this.run;
    if (!run?.endless) return;
    run.state = 'ended';
    this.music.jingle('mus_heal');
    this.quitToMenu();   // guarda a jornada (Modo Livre) e volta para a vila
    toast('Sua equipe descansou no Centro Pokémon. O que ela ganhou no Modo Livre ficou.', 'potion');
  }

  /* ======================= derrota: as duas saídas ======================= */

  /**
   * Centro Pokémon: a equipe da jornada é curada e o jogador volta para a mesma
   * fase. Desde a 0.17 ela é a equipe do fim da tentativa: nada se perde.
   */
  pokemonCenter() {
    const run = this.run;
    if (!run || run.state !== 'defeat') return;
    this.centerStage = run.stage.id;
    this.centerOpen = true;
    this.music.jingle('mus_heal');
    this.hud.hideResult();
    this._showCenter();
  }

  _showCenter() {
    const journey = this.campaign.journey;
    const members = journey?.team?.members?.length
      ? journey.team.members.map((m) => ({ ...m, fainted: false }))
      : [{ pokemonId: this.campaign.starter, level: 1, fainted: false, shiny: !!this.campaign.starterShiny }];
    this.hud.showCenter({
      members,
      stage: STAGES[this.centerStage],
      pcCount: this.pcBox.length,
      hasJourney: !!journey?.team
    });
  }

  /** Do Centro Pokémon de volta para a fase, do começo (ou para a vila: `quitToMenu`). */
  leaveCenter() {
    if (!this.centerOpen) return;
    this.centerOpen = false;
    this.hud.hideCenter();
    this.startStage(this.centerStage);
  }

  /**
   * Reiniciar a jornada do zero (as Opções, depois da confirmação; 0.33): a
   * campanha da região recomeça (insígnias, equipe e PC), e a Pokédex, as
   * conquistas, os Shards, a mochila, o quarto e o Hall da Fama continuam, como na
   * Nova jornada da tela de título. No meio de uma fase, a partida acaba sem guardar.
   */
  restartJourney() {
    this.run = null;
    this.runEnded = false;
    this.centerOpen = false;
    this.hud.hideAllOverlays();
    this.newGame();
  }

  _nextStage() {
    const cleared = this.campaign.clearedStages;
    for (const entry of this.region.campaign) {
      if (entry.comingSoon) continue;
      const stage = STAGES[entry.stage];
      if (!cleared.includes(stage.id) && isStageUnlocked(stage.id, cleared)) return stage;
    }
    return null;
  }

  /* ================================= PC ================================= */

  /** O PC da jornada (Pokémon guardados fora da equipe), cada um na sua casa. */
  get pcBox() {
    return normalizePC(this.campaign.journey);
  }

  /** Na tela do PC: solta o Pokémon de um lugar em outro (ver systems/pc.js). */
  pcMove(from, to) {
    const ok = moveMon(this.campaign.journey, from, to, CONFIG.team.maxSize);
    if (!ok) return false;
    if (this.centerOpen) this._showCenter();   // o PC do Centro Pokémon muda quem volta para a fase
    this.menus.buildCampaign();
    this.autosave();
    return true;
  }

  /** Fora da partida (o PC da vila, do mapa ou do Centro): troca um da equipe por um do PC (ver systems/pc.js). */
  pcSwap(teamUid, pcUid) {
    const ok = swapWithPC(this.campaign.journey, teamUid, pcUid, CONFIG.team.maxSize);
    if (ok && this.centerOpen) this._showCenter();   // o PC do Centro Pokémon muda quem volta para a fase
    if (ok) this.autosave();
    return ok;
  }

  /** Coleta os Shards de uma conquista concluída. */
  claimAchievement(id) {
    const amount = this.tracker.claimAchievement(id);
    if (amount) {
      this.autosave();
      toast(`+${amount} Shards coletados!`, 'shards');
    }
    return amount;
  }

  /* ============================== Poké Mart (0.23) ============================== */

  /** Os Pokémon da jornada (equipe e PC) que podem receber um item da loja. */
  martTargets(itemId) {
    const item = getMartItem(itemId);
    const journey = this.campaign.journey;
    if (!item || !journey) return [];
    const mons = [
      ...(journey.team?.members ?? []).map((member) => ({ member, where: 'Equipe' })),
      ...(journey.pc ?? []).map((member) => ({ member, where: 'PC' }))
    ];
    if (item.kind === 'tm') {
      return mons.map((m) => ({ ...m, result: nextMoveFor(m.member.pokemonId, m.member.abilities?.[0]) }))
        .filter((m) => m.result)
        .map((m) => ({ ...m, label: `${getAbility(m.member.abilities[0])?.name} → ${getAbility(m.result)?.name}` }));
    }
    if (item.kind === 'tm_dive') {
      // de Água (principal ou secundário), com um Golpe Desperto que ainda não é o Dive
      return mons.filter((m) => getPokemon(m.member.pokemonId)?.types.includes('water'))
        .map((m) => ({ ...m, result: m.member.abilities?.find(isBonusMove) }))
        .filter((m) => m.result && m.result !== 'dive')
        .map((m) => ({ ...m, label: `esquece ${getAbility(m.result)?.name} → Dive` }));
    }
    if (item.kind === 'evolution') {
      return mons.map((m) => ({ ...m, result: itemEvolutions(m.member.pokemonId)[itemId] }))
        .filter((m) => m.result)
        .map((m) => ({ ...m, label: `evolui para ${getPokemon(m.result).name}` }));
    }
    return [];
  }

  /**
   * Compra um item. Os da mochila (Reviver, Novo Sorteio) vão para `profile.bag`;
   * a TM e os de evolução são usados na hora, no Pokémon escolhido (`targetUid`).
   */
  buyMartItem(itemId, targetUid = null) {
    const item = getMartItem(itemId);
    if (!item) return false;
    if ((this.profile.shards ?? 0) < item.price) { toast('Shards insuficientes.', 'shards'); return false; }

    if (item.kind === 'bag') {
      this.profile.bag[item.id] = (this.profile.bag[item.id] ?? 0) + 1;
      toast(`${item.name} foi para a mochila (${this.profile.bag[item.id]}).`, item.icon);
    } else {
      const target = this.martTargets(itemId).find((t) => t.member.uid === targetUid);
      if (!target) return false;
      const name = getPokemon(target.member.pokemonId).name;
      if (item.kind === 'tm') {
        const learned = learnNextMove(target.member);
        if (!learned) return false;
        toast(`${name} aprendeu ${getAbility(learned).name}!`, 'tm');
      } else if (item.kind === 'tm_dive') {
        // para sempre, como o Golpe Desperto: o golpe de antes sai do lugar dele
        const slot = target.member.abilities.indexOf(target.result);
        if (slot < 0) return false;
        target.member.abilities[slot] = 'dive';
        toast(`${name} esqueceu ${getAbility(target.result).name} e aprendeu Dive!`, 'tm');
      } else {
        const result = evolveMember(target.member, target.result);
        if (!result) return false;
        this.tracker.registerCaught(result.to.dex);
        bus.emit(EVENTS.POKEMON_EVOLVED, { member: target.member, from: result.from.id, to: result.to.id, dex: result.to.dex });
        toast(`${name} evoluiu para ${result.to.name}!`, 'evolution');
      }
    }
    this.profile.shards -= item.price;
    this.tracker.checkAchievements();
    this.autosave();
    return true;
  }

  /**
   * Compra um enfeite na loja de Pokédolls (0.29): ele já aparece no quarto
   * (data/decor.js). O quarto é do jogador, para todas as jornadas.
   */
  buyDecor(id) {
    const item = getDecor(id);
    if (!item) return false;
    this.profile.decor ??= {};
    const owned = this.profile.decor[id] ?? 0;
    if (owned >= decorMax(item)) return false;
    if (item.needs === 'champion' && !this.profile.hallOfFame.length) {
      toast('Esse é só para quem já venceu a Liga Pokémon.', '🔒');
      return false;
    }
    if ((this.profile.shards ?? 0) < item.price) { toast('Shards insuficientes.', 'shards'); return false; }
    this.profile.shards -= item.price;
    this.profile.decor[id] = owned + 1;
    this.autosave();
    toast(`${item.name} já está no seu quarto!`, 'mart');
    return true;
  }

  /** O Reviver, na fase: o Pokémon desmaiado volta com metade da vida (e entra em campo se houver vaga). */
  useRevive(memberUid) {
    const run = this.run;
    if (!run || run.state !== 'running' || (this.profile.bag.revive ?? 0) <= 0) return false;
    const member = run.team.members.find((m) => m.uid === memberUid && m.fainted);
    if (!member) return false;
    member.fainted = false;
    member.hp = Math.round(maxHpFor(member, run.playerStats.pokemonHpBonus) * 0.5);
    const free = run.team.active.indexOf(null);
    if (free !== -1) run.team.active[free] = member;
    run.syncCompanions();
    this.profile.bag.revive--;
    this.hud.signature = '';
    toast(`${getPokemon(member.pokemonId).name} voltou com o Reviver! (${this.profile.bag.revive} na mochila)`, 'revive');
    this.autosave();
    return true;
  }

  /** O Novo Sorteio, na tela da Poké Ball: as 4 opções são sorteadas de novo. */
  rerollCapture() {
    const run = this.run;
    if (!run || !this.captureOpen || run.pendingGift || (this.profile.bag.reroll ?? 0) <= 0) return false;
    const choices = run.captureSystem.rollChoices();
    if (!choices.length) return false;
    this.profile.bag.reroll--;
    this.hud.showCapture(choices, (pokemonId, shiny) => this.pickCapture(pokemonId, shiny), undefined,
      { teamSize: run.team.members.length, maxSize: CONFIG.team.maxSize });
    this.autosave();
    return true;
  }

  /* ============================== save ============================== */

  /** Estado atual pronto para virar arquivo. */
  buildSaveData() {
    const runSnapshot = this.run && !this.runEnded ? this.run.serialize() : this.pendingRun;
    return SaveManager.build({ profile: this.profile, run: runSnapshot });
  }

  saveToFile() {
    const data = this.buildSaveData();
    SaveManager.download(data);
    SaveManager.saveLocal(data);
    // (até a 0.23 a foto da partida ficava em `pendingRun` e podia voltar por cima
    // do progresso; a partida viva continua sendo a fonte)
    toast('Jogo salvo! Confira sua pasta de downloads.', '💾');
  }

  autosave() {
    const slot = this.activeSlot;
    if (slot) slot.updatedAt = new Date().toISOString();
    SaveManager.saveLocal(this.buildSaveData());
  }

  async loadFromFile(file) {
    try {
      const data = await SaveManager.readFile(file);
      this.profile = data.profile;
      this.tracker.setProfile(this.profile);
      this.pendingRun = data.run;
      this.run = null;
      this._foldPendingRun();   // a partida do save entra na jornada; o jogador vai à vila (0.29)
      this.autosave();

      toast(`Save carregado (${data.savedAt ? new Date(data.savedAt).toLocaleString('pt-BR') : 'sem data'}).`, '📂');

      const resume = () => this.openHub('home');
      // saves de antes da escolha de treinador perguntam uma vez
      if (this.profile.trainer) resume();
      else this.askTrainer(resume);
    } catch (err) {
      toast(err.message ?? 'Não foi possível carregar o save.', '⚠️');
    }
  }

  clearLocalProgress() {
    SaveManager.clearLocal();
    this.pendingRun = null;
    toast('Progresso local apagado.', '🗑️');
  }
}

export { CONFIG };
