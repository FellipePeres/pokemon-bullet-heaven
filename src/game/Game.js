import { CONFIG } from '../core/config.js';
import { Input } from '../core/input.js';
import { bus, EVENTS } from '../core/events.js';
import { Run } from './Run.js';
import { Renderer } from '../render/Renderer.js';
import { preload } from '../render/sprites.js';
import { HUD } from '../ui/HUD.js';
import { Menus } from '../ui/Menus.js';
import { toast } from '../ui/dom.js';
import { SaveManager } from '../save/SaveManager.js';
import { createProfile, normalizeProfile, ProfileTracker } from '../save/profile.js';
import { STAGES, isStageUnlocked, KANTO_CAMPAIGN } from '../data/stages.js';
import { POKEMON, getPokemon } from '../data/pokemon.js';
import { ENEMIES } from '../data/enemies.js';
import { TRAINER_UPGRADES, getTrainerUpgrade, nextCost } from '../data/trainerUpgrades.js';

/**
 * GAME — junta tudo: perfil, telas, partida e loop principal.
 * É o único lugar que conhece todos os módulos; cada sistema continua
 * sabendo apenas do seu próprio assunto.
 */
export class Game {
  constructor(canvas) {
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

    this.run = null;
    this.runEnded = false;
    this.levelUpOpen = false;
    this.captureOpen = false;
    this.evolutionOpen = false;
    this.lastTime = 0;
    this.autosaveTimer = 0;

    bus.on(EVENTS.TOAST, ({ text, icon }) => toast(text, icon));

    // pré-carrega os sprites mais usados
    preload([
      ...Object.values(POKEMON).map((p) => p.dex),
      ...Object.values(ENEMIES).map((e) => e.dex)
    ]);

    this.menus.show('screen-title');
    requestAnimationFrame((ts) => this.loop(ts));
  }

  /* ============================ loop principal ============================ */

  loop(ts) {
    const dt = this.lastTime ? Math.min(0.05, (ts - this.lastTime) / 1000) : 0;
    this.lastTime = ts;

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

    requestAnimationFrame((next) => this.loop(next));
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
      case 'victory':
        this.endRun(true);
        break;
      case 'defeat':
        this.endRun(false);
        break;
    }
  }

  /* ============================== fluxo de menus ============================== */

  newGame() {
    // Pokédex e conquistas são progresso permanente e permanecem;
    // apenas a campanha e a partida em andamento recomeçam.
    this.profile.campaign.starter = null;
    this.profile.campaign.clearedStages = [];
    this.profile.campaign.badges = [];
    this.profile.campaign.journey = null;
    this.profile.stats.badges = 0;
    this.pendingRun = null;
    this.menus.buildStarters();
    this.menus.show('screen-starter');
  }

  chooseStarter(pokemonId) {
    this.profile.campaign.starter = pokemonId;
    this.profile.campaign.journey = null;
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
    return !!this.pendingRun || !!this.profile.campaign.starter;
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
    if (this.pendingRun) {
      const snapshot = this.pendingRun;
      toast('Retomando a fase com sua equipe e build salvas.', '💾');
      this.startStage(snapshot.stageId, snapshot);
      return;
    }
    if (this.profile.campaign.starter) this.openCampaign();
  }

  /** Inicia uma fase. `snapshot` restaura equipe/upgrades de um save. */
  startStage(stageId, snapshot = null) {
    const stage = STAGES[stageId];
    if (!stage) return;
    if (!isStageUnlocked(stageId, this.profile.campaign.clearedStages)) {
      toast('Essa fase ainda está bloqueada.', '🔒');
      return;
    }

    // Ordem de prioridade para montar a partida:
    // 1) snapshot de um save (continuar exatamente de onde parou)
    // 2) jornada acumulada (equipe e build das fases já vencidas)
    // 3) começo do zero, apenas com o inicial
    const journey = this.profile.campaign.journey;
    let options;
    if (snapshot) {
      options = { team: snapshot.team };
    } else if (journey) {
      options = { team: journey.team };
    } else {
      options = { starter: this.profile.campaign.starter };
    }
    // melhorias compradas com moedas valem em todas as fases
    options.trainerUpgrades = { ...this.profile.trainerUpgrades };

    this.run = new Run(stageId, options);
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

  quitToMenu() {
    this.run = null;
    this.runEnded = false;
    this.hud.hideAllOverlays();
    if (this.profile.campaign.starter) this.openCampaign();
    else this.menus.show('screen-title');
  }

  /* ============================== partida ============================== */

  handleAction(action) {
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
    this.hud.showCapture(choices, (pokemonId) => this.pickCapture(pokemonId));
  }

  pickCapture(pokemonId) {
    const run = this.run;
    if (run.team.isFull) {
      // equipe cheia: escolher quem sai
      this.hud.showReplace(getPokemon(pokemonId), run.team.members, (memberUid) => {
        run.captureSystem.captureReplacing(memberUid, pokemonId);
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
      // vitória leva a equipe e a build para a próxima fase
      journey: { team: run.team.serialize(), upgrades: { ...run.upgrades }, level: bestLevel }
    });

    this.pendingRun = null;
    this.autosave();
    this.hud.hideLevelUp();
    this.hud.hideCapture();
    this.hud.showResult({ victory, run });

    if (victory) {
      const next = this._nextStage();
      if (next) toast(`Próxima etapa liberada: ${next.name}`, '🗺️');
    }
  }

  _nextStage() {
    for (const entry of KANTO_CAMPAIGN) {
      if (entry.comingSoon) continue;
      const stage = STAGES[entry.stage];
      if (!this.profile.campaign.clearedStages.includes(stage.id) &&
          isStageUnlocked(stage.id, this.profile.campaign.clearedStages)) {
        return stage;
      }
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

      if (this.profile.campaign.starter) this.openCampaign();
      else { this.menus.buildStarters(); this.menus.show('screen-starter'); }
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
