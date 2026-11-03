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

/** X, Y e B põem em campo os da reserva (posições 4, 5 e 6 da equipe). */
const RESERVE_BUTTONS = { x: 3, y: 4, b: 5 };
import { SaveManager } from '../save/SaveManager.js';
import {
  createProfile, normalizeProfile, ProfileTracker,
  regionProgress, createRegionProgress, countBadges
} from '../save/profile.js';
import { STAGES, isStageUnlocked } from '../data/stages.js';
import { getRegion } from '../data/regions.js';
import { TRAINER_LOOKS, getTrainerLook } from '../data/trainers.js';
import { POKEMON, getPokemon } from '../data/pokemon.js';
import { ENEMIES } from '../data/enemies.js';
import { TRAINER_UPGRADES, getTrainerUpgrade, nextCost } from '../data/trainerUpgrades.js';
import { MusicPlayer } from '../audio/music.js';
import { swapWithPC } from '../systems/pc.js';

/**
 * GAME — junta tudo: perfil, telas, partida e loop principal.
 * É o único lugar que conhece todos os módulos; cada sistema continua
 * sabendo apenas do seu próprio assunto.
 */
export class Game {
  constructor(canvas) {
    loadOptions();   // preferências do menu Opções, guardadas no navegador

    // ---- perfil (progresso permanente) ----
    const local = SaveManager.loadLocal();
    this.profile = local ? normalizeProfile(local.profile) : createProfile();
    this.pendingRun = local?.run ?? null;
    this.tracker = new ProfileTracker(this.profile);

    // ---- infraestrutura ----
    this.renderer = new Renderer(canvas);
    this.input = new Input();
    this.input.onAction = (action) => this.handleAction(action);
    this.hud = new HUD(this);
    this.menus = new Menus(this);
    this.padNav = new PadNavigator();
    this.music = new MusicPlayer();
    this.hallOpen = false;
    this.centerOpen = false;   // o Centro Pokémon, depois de uma derrota

    this.run = null;
    this.runEnded = false;
    this.afterTrainer = null;   // o que vem depois da escolha de treinador
    this.levelUpOpen = false;
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
  }

  /* ============================ loop principal ============================ */

  loop(ts) {
    const dt = this.lastTime ? Math.min(0.05, (ts - this.lastTime) / 1000) : 0;
    this.lastTime = ts;
    this.input.poll();   // controle (os botões chegam em handleAction)

    if (this.run) {
      this.run.update(dt, this.input.getMoveVector());
      this._handleRunState();
      this.renderer.render(this.run);
      this.hud.update(this.run);

      // autosave periódico (só conveniência local)
      this.autosaveTimer += dt;
      if (this.autosaveTimer > 15) {
        this.autosaveTimer = 0;
        this.autosave();
      }
    }

    this._updateMusic();
    requestAnimationFrame((next) => this.loop(next));
  }

  /**
   * A música que deveria tocar agora: o tema do lobby nos menus, a da fase na
   * partida, a do líder quando ele entra, a da vitória no resultado, a do Hall
   * da Fama e a do Centro Pokémon depois de uma derrota. A pausa só abaixa o volume.
   */
  _updateMusic() {
    const run = this.run;
    let track = 'lobby-theme';
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
        this.endRun(false);
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

  newGame() {
    // Pokédex e conquistas são progresso permanente e permanecem;
    // apenas a campanha da região e a partida em andamento recomeçam.
    this.profile.regions[this.profile.region] = createRegionProgress();
    this.profile.stats.badges = countBadges(this.profile);
    this.pendingRun = null;
    // como no FireRed, a jornada começa dizendo quem é você
    this.askTrainer(() => {
      this.menus.buildStarters();
      this.menus.show('screen-starter');
    });
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
    const next = this.afterTrainer;
    this.afterTrainer = null;
    next?.();
  }

  chooseStarter(pokemonId) {
    this.campaign.starter = pokemonId;
    this.campaign.journey = null;
    this.tracker.registerCaught(getPokemon(pokemonId).dex);
    this.tracker.checkAchievements();
    this.autosave();
    toast(`${getPokemon(pokemonId).name} escolhido! Sua jornada começa agora.`, '🎒');
    this.openCampaign();
  }

  openCampaign() {
    this.menus.buildCampaign();
    this.menus.show('screen-campaign');
  }

  canContinue() {
    return !!this.pendingRun || !!this.campaign.starter;
  }

  continueLabel() {
    if (this.pendingRun) {
      const stage = STAGES[this.pendingRun.stageId];
      const size = this.pendingRun.team?.members?.length ?? 0;
      return `${stage ? stage.name : 'Partida salva'} (${size} Pokémon)`;
    }
    return 'Jornada';
  }

  continueGame() {
    // saves de antes da escolha de treinador perguntam uma vez
    if (!this.profile.trainer) { this.askTrainer(() => this.continueGame()); return; }
    if (this.pendingRun) {
      const snapshot = this.pendingRun;
      toast('Retomando a fase com sua equipe e build salvas.', '💾');
      this.startStage(snapshot.stageId, snapshot);
      return;
    }
    if (this.campaign.starter) this.openCampaign();
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
    let options;
    if (snapshot) {
      options = { team: snapshot.team, pc: snapshot.pc };
    } else if (journey) {
      options = { team: journey.team };
    } else {
      options = { starter: this.campaign.starter };
    }
    // melhorias compradas com moedas valem em todas as fases
    options.trainerUpgrades = { ...this.profile.trainerUpgrades };
    options.trainer = this.profile.trainer;
    options.campaignStarter = this.campaign.starter;

    this.run = new Run(stageId, options);
    this.preloadStage(stage);
    this.runEnded = false;
    this.levelUpOpen = false;
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
    preloadAssets([...dexes].map((dex) => `pokemon/${dex}`));
    SceneryCache.preload(stageScenes(stage));
  }

  quitToMenu() {
    this.run = null;
    this.runEnded = false;
    this.centerOpen = false;
    this.hud.hideAllOverlays();
    if (this.campaign.starter) this.openCampaign();
    else this.menus.show('screen-title');
  }

  /* ============================== partida ============================== */

  handleAction(action) {
    if (action.startsWith('pad:')) { this.handlePad(action.slice(4)); return; }
    if (action === 'pause') {
      // fora da partida, ESC fecha a janela aberta
      if (this.menus.openModal) { this.menus.closeModal(); return; }
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

  /** Abre o Hall da Fama de uma equipe campeã; `then` roda ao fechar. */
  showHallOfFame(entry, then = null) {
    const look = getTrainerLook(entry.trainer);
    this.hallOpen = true;
    this.hud.showHallOfFame(entry, {
      trainerName: look.name,
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
    this.hud.showLeaderIntro(this.run.pendingIntro, () => this.closeLeaderIntro());
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
    this.hud.showCapture(choices, (pokemonId) => this.pickCapture(pokemonId), this.run.pendingGift?.title);
  }

  pickCapture(pokemonId) {
    const run = this.run;
    if (run.team.isFull) {
      // equipe cheia: quem sai vai para o PC — ou o novo vai direto para lá
      this.hud.showReplace(getPokemon(pokemonId), run.team.members, (memberUid) => {
        run.captureSystem.captureReplacing(memberUid, pokemonId);
        this.tracker.registerCaught(getPokemon(pokemonId).dex);
        this.resolveCapture();
      }, () => {
        run.captureSystem.captureToPC(pokemonId);
        this.tracker.registerCaught(getPokemon(pokemonId).dex);
        this.resolveCapture();
      });
      return;
    }
    run.captureSystem.capture(pokemonId);
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
      // vitória leva a equipe, a build e o PC para a próxima fase
      journey: {
        team: run.team.serialize(), upgrades: { ...run.upgrades }, level: bestLevel,
        pc: [...(this.campaign.journey?.pc ?? []), ...run.pc]
      }
    });

    this.pendingRun = null;
    const champion = victory && run.stage.id === this.region.campaign.filter((e) => e.stage).at(-1)?.stage;
    if (champion) {
      this.profile.hallOfFame.push({
        date: new Date().toISOString(),
        trainer: this.profile.trainer,
        region: this.profile.region,
        team: run.team.members.map((m) => ({ pokemonId: m.pokemonId, level: m.level }))
      });
    }
    this.autosave();
    this.hud.hideLevelUp();
    this.hud.hideCapture();
    if (champion) {
      this.showHallOfFame(this.profile.hallOfFame.at(-1), () => this.quitToMenu());
      return;
    }
    this.hud.showResult({ victory, run });

    if (victory) {
      const next = this._nextStage();
      if (next) toast(`Próxima etapa liberada: ${next.name}`, '🗺️');
    }
  }

  /* ======================= derrota: as duas saídas ======================= */

  /**
   * Centro Pokémon: a equipe da jornada (a do começo da fase) é curada e o
   * jogador volta para a mesma fase. O que foi capturado na tentativa perdida
   * fica para trás, como sempre foi numa derrota.
   */
  pokemonCenter() {
    const run = this.run;
    if (!run || run.state !== 'defeat') return;
    this.centerStage = run.stage.id;
    this.centerLost = [...run.captured];
    this.centerOpen = true;
    this.music.jingle('mus_heal');
    this.hud.hideResult();
    this._showCenter();
  }

  _showCenter() {
    const journey = this.campaign.journey;
    const members = journey?.team?.members?.length
      ? journey.team.members.map((m) => ({ ...m, fainted: false }))
      : [{ pokemonId: this.campaign.starter, level: 1, fainted: false }];
    this.hud.showCenter({
      members,
      stage: STAGES[this.centerStage],
      lost: this.centerLost ?? [],
      pcCount: this.pcBox.length,
      hasJourney: !!journey?.team
    });
  }

  /** Do Centro Pokémon de volta para a fase, do começo (ou para o mapa: `quitToMenu`). */
  leaveCenter() {
    if (!this.centerOpen) return;
    this.centerOpen = false;
    this.hud.hideCenter();
    this.startStage(this.centerStage);
  }

  /**
   * Recomeçar a jornada do zero: a campanha da região recomeça (insígnias,
   * equipe e PC), e a Pokédex, as conquistas, os Shards e as melhorias do
   * treinador continuam, como na Nova jornada da tela de título.
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

  /* ====================== melhorias do treinador ====================== */

  /** Lista as melhorias com nível atual e custo do próximo nível. */
  trainerShop() {
    return TRAINER_UPGRADES.map((up) => {
      const level = this.profile.trainerUpgrades[up.id] ?? 0;
      const cost = nextCost(up, level);
      return {
        upgrade: up,
        level,
        cost,
        maxed: cost === null,
        affordable: cost !== null && this.profile.shards >= cost
      };
    });
  }

  /* ================================= PC ================================= */

  /** O PC da jornada (Pokémon guardados fora da equipe). */
  get pcBox() {
    return this.campaign.journey?.pc ?? [];
  }

  /** No lobby: troca um da equipe por um do PC (ver systems/pc.js). */
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

  /** Compra um nível de melhoria do treinador. */
  buyTrainerUpgrade(upgradeId) {
    const up = getTrainerUpgrade(upgradeId);
    if (!up) return false;
    const level = this.profile.trainerUpgrades[up.id] ?? 0;
    const cost = nextCost(up, level);
    if (cost === null) { toast('Essa melhoria já está no máximo.', 'levelUp'); return false; }
    if (this.profile.shards < cost) { toast('Shards insuficientes.', 'shards'); return false; }

    this.profile.shards -= cost;
    this.profile.trainerUpgrades[up.id] = level + 1;
    this.autosave();
    toast(`${up.name} — nível ${level + 1}!`, up.icon);
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
    this.pendingRun = data.run;
    toast('Jogo salvo! Confira sua pasta de downloads.', '💾');
  }

  autosave() {
    SaveManager.saveLocal(this.buildSaveData());
  }

  async loadFromFile(file) {
    try {
      const data = await SaveManager.readFile(file);
      this.profile = data.profile;
      this.tracker.setProfile(this.profile);
      this.pendingRun = data.run;
      this.run = null;
      SaveManager.saveLocal(data);

      toast(`Save carregado (${data.savedAt ? new Date(data.savedAt).toLocaleString('pt-BR') : 'sem data'}).`, '📂');

      const resume = () => {
        if (this.campaign.starter) this.openCampaign();
        else { this.menus.buildStarters(); this.menus.show('screen-starter'); }
      };
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
