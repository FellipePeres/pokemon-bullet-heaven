import { el, create, clear, show, hide, toast } from './dom.js';
import { getPokemon } from '../data/pokemon.js';
import { getAbility } from '../data/abilities.js';
import { ACHIEVEMENTS, TOTAL_ACHIEVEMENT_TIERS } from '../data/achievements.js';
import { roman } from '../save/profile.js';
import { moveLineOf } from '../data/tms.js';
import { getTrainerLook } from '../data/trainers.js';
import { spriteUrl, artworkUrl, pokemonImg } from '../render/sprites.js';
import { assetUrl } from '../render/assets.js';
import { saveOptions } from '../save/options.js';
import { typeColor, typeName } from '../data/types.js';
import { CONFIG } from '../core/config.js';
import { iconHTML, itemUrl } from '../render/icons.js';
import { maxHpFor } from '../systems/stats.js';
import { TitleMenu } from './titleMenu.js';
import { PCScreen } from './pcScreen.js';
import { Lobby } from './lobby.js';
import { BadgeCase } from './badgeCase.js';

const SCREENS = ['screen-title', 'screen-trainer', 'screen-starter', 'screen-campaign'];
const MODALS = ['modal-pokedex', 'modal-achievements', 'modal-team', 'modal-trainer', 'modal-options', 'modal-help', 'modal-pc', 'modal-badges'];

/**
 * Telas fora da partida.
 * O foco é o menu principal; Pokédex, conquistas, equipe e opções abrem como
 * janelas por cima dele, sem tirar o jogador do lugar.
 */
export class Menus {
  constructor(game) {
    this.game = game;
    this.openModal = null;
    this.pcScreen = new PCScreen(game);
    this.lobby = new Lobby(game);
    this.badgeCase = new BadgeCase(game);
    this._bind();
    this.titleMenu = new TitleMenu(this);
  }

  _bind() {
    el('btn-new-game').onclick = () => this.leaveTitle(() => this.game.newGame());
    el('btn-continue').onclick = () => this.leaveTitle(() => this.game.continueGame());
    el('btn-load-game').onclick = () => el('save-file-input').click();
    el('btn-save-campaign').onclick = () => this.game.saveToFile();
    el('btn-hall').onclick = () => this.game.showHallOfFame(this.game.profile.hallOfFame.at(-1));
    el('version-tag').textContent = `v${CONFIG.version}`;

    // atalhos da barra lateral
    document.querySelectorAll('[data-modal]').forEach((btn) => {
      btn.onclick = () => this.showModal(btn.dataset.modal);
    });
    document.querySelectorAll('[data-close]').forEach((btn) => {
      btn.onclick = () => this.closeModal();
    });
    for (const id of MODALS) {
      // clicar fora do card fecha
      el(id).addEventListener('mousedown', (e) => { if (e.target === el(id)) this.closeModal(); });
    }
    document.querySelectorAll('[data-back]').forEach((btn) => {
      btn.onclick = () => this.show(btn.dataset.back);
    });

    el('save-file-input').onchange = async (e) => {
      const file = e.target.files?.[0];
      if (file) await this.game.loadFromFile(file);
      e.target.value = '';
    };
  }

  /* ============================== navegação ============================== */

  show(screenId) {
    for (const id of SCREENS) hide(el(id));
    hide(el('stage-wrapper'));
    show(el('side-rail'));
    if (screenId) show(el(screenId));
    // o CSS usa a tela atual (no título, a arte de fundo substitui a barra e o cenário)
    el('app').dataset.screen = screenId ?? '';
    if (screenId === 'screen-title') this.refreshTitle();
    if (screenId === 'screen-campaign') {
      // ao entrar no lobby, a próxima fase já vem escolhida; o mapa mede o espaço depois de aparecer
      this.lobby.selected = null;
      this.lobby.render();
    }
  }

  /** Sai do título com o esmaecimento da abertura e só então segue. */
  leaveTitle(next) {
    const title = el('screen-title');
    title.classList.add('leaving');
    setTimeout(() => {
      title.classList.remove('leaving');
      next();
    }, 320);
  }

  showGame() {
    el('app').dataset.screen = 'game';
    for (const id of SCREENS) hide(el(id));
    hide(el('side-rail'));
    this.closeModal();
    show(el('stage-wrapper'));
  }

  showModal(id, options = {}) {
    this.closeModal();
    const builders = {
      'modal-pokedex': () => this.buildPokedex(),
      'modal-achievements': () => this.buildAchievements(),
      'modal-team': () => this.buildTeamDetail(),
      'modal-trainer': () => this.buildTrainer(),
      'modal-options': () => this.buildOptions(),
      'modal-pc': () => this.pcScreen.open(),
      'modal-badges': () => this.badgeCase.open(options)
    };
    builders[id]?.();
    show(el(id));
    this.openModal = id;
  }

  closeModal() {
    if (this.openModal === 'modal-pc' || !el('modal-pc').classList.contains('hidden')) this.pcScreen.close();
    for (const id of MODALS) hide(el(id));
    this.openModal = null;
    // o que a janela mudou (Shards, PC, conquistas) aparece na barra do lobby
    if (!el('screen-campaign').classList.contains('hidden')) this.lobby.render();
  }

  /* ============================ menu principal ============================ */

  refreshTitle() {
    const profile = this.game.profile;
    const canContinue = this.game.canContinue();
    el('btn-continue').disabled = !canContinue;
    // o selo diz de onde a jornada continua (ou que não há jogo salvo)
    el('continue-seal').textContent = canContinue ? this.game.continueLabel().split(' — ')[0] : 'Sem jogo salvo';
    this.titleMenu?.reset();

    const strip = clear(el('title-progress'));
    const pills = [
      ['shards', 'Shards', String(profile.shards ?? 0)],
      ['pokedex', 'Pokédex', `${profile.pokedex.caught.length}/${this.game.region.dex.length}`],
      ['badge', 'Insígnias', String(profile.stats.badges)],
      ['stages', 'Fases', String(this.game.campaign.clearedStages.length)],
      ['achievements', 'Conquistas', `${Object.values(profile.achievements.tiers ?? {}).reduce((a, b) => a + b, 0)}/${TOTAL_ACHIEVEMENT_TIERS}`]
    ];
    for (const [icon, label, value] of pills) {
      strip.appendChild(create('span', 'pill', `${iconHTML(icon, 18)} ${label} <b>${value}</b>`));
    }
  }

  /* ====================== escolha do treinador ====================== */

  /**
   * Menino ou menina, como no começo do FireRed. Cada card mostra o retrato
   * e o sprite andando (a animação é CSS: ver .trainer-walker).
   */
  buildTrainerChoice() {
    const row = clear(el('trainer-choices'));
    const current = this.game.profile.trainer;
    el('trainer-oak').src = assetUrl('portrait/oak');

    for (const id of this.game.region.trainers) {
      const look = getTrainerLook(id);
      const card = create('button', `trainer-card${id === current ? ' selected' : ''}`);
      card.type = 'button';

      const portrait = create('img', 'trainer-portrait');
      portrait.src = assetUrl(look.portrait);
      portrait.alt = look.name;

      const walker = create('div', 'trainer-walker');
      walker.style.backgroundImage = `url(${assetUrl(look.sheet)})`;

      card.append(portrait, walker, create('h3', '', look.label), create('span', 'trainer-name', look.name));
      card.onclick = () => this.game.chooseTrainer(id);
      row.appendChild(card);
    }
  }

  /* ======================= escolha do inicial ======================= */

  buildStarters() {
    const row = clear(el('starter-choices'));
    for (const pokemon of this.game.region.starters.map(getPokemon)) {
      const ability = getAbility(pokemon.abilities[0]);
      const types = pokemon.types
        .map((t) => `<span class="type-tag" style="background:${typeColor(t)}">${typeName(t)}</span>`)
        .join('');

      const card = create('div', 'starter-card');
      card.style.borderColor = typeColor(pokemon.types[0]);
      const img = create('img');
      img.src = artworkUrl(pokemon.dex);
      img.alt = pokemon.name;
      img.onerror = () => { img.src = spriteUrl(pokemon.dex); };
      card.appendChild(img);

      const body = create('div');
      body.innerHTML = `
        <h3>${pokemon.name}</h3>
        <div class="role">${pokemon.role}</div>
        <div class="type-row" style="margin:8px 0">${types}</div>
        <p>${pokemon.description}</p>
        <div class="move-box">
          <b>${ability.name}</b>
          <span>${ability.description}</span>
        </div>
        <div class="stack-info" style="margin-top:8px;font-size:11px;color:#6b7cab">
          ${pokemon.hp} de vida inicial
        </div>
      `;
      card.appendChild(body);
      card.onclick = () => this.game.chooseStarter(pokemon.id);
      row.appendChild(card);
    }
  }

  /* ============================ mapa da jornada ============================ */

  /** O mapa da jornada: o lobby, com o Town Map de Kanto (ui/lobby.js). */
  buildCampaign() {
    this.lobby.render();
  }

  /* ============================== Pokédex ============================== */

  buildPokedex() {
    const grid = clear(el('pokedex-grid'));
    const caught = this.game.profile.pokedex.caught;
    const shinyDex = this.game.profile.pokedex.shiny ?? [];   // ✦ nas espécies que você já teve shiny

    const dexNames = this.game.region.dex;
    el('pokedex-progress').textContent =
      `${caught.length} de ${dexNames.length} registrados — capture para revelar`;

    dexNames.forEach((name, i) => {
      const dex = i + 1;
      const isCaught = caught.includes(dex);
      const cell = create('div', `dex-cell ${isCaught ? 'caught' : 'unknown'}${shinyDex.includes(dex) ? ' shiny' : ''}`);
      cell.innerHTML = `
        <div class="dex-num">#${String(dex).padStart(3, '0')}</div>
        <img src="${spriteUrl(dex)}" alt="${isCaught ? name : '???'}" loading="lazy" />
        <div class="dex-name">${isCaught ? name : '???'}</div>
      `;
      cell.title = isCaught ? `${name} — registrado` : 'Ainda não capturado';
      grid.appendChild(cell);
    });
  }

  /* ============================ conquistas ============================ */

  buildAchievements() {
    const list = clear(el('achievements-list'));
    const tracker = this.game.tracker;
    const pending = tracker.claimableAchievements.length;

    el('achievements-sub').innerHTML = pending
      ? `${iconHTML('shards', 15)} <b>${pending} conquista(s) para coletar</b> — cada uma volta com um objetivo maior`
      : 'Cada conquista tem degraus: ao coletar, ela volta com um objetivo maior e mais Shards.';

    // primeiro as que dá para coletar, depois as em andamento, por fim as completas
    const rank = (state) => (state.claimable ? 0 : state.complete ? 2 : 1);
    const rows = ACHIEVEMENTS.map((achievement) => ({ achievement, state: tracker.tierState(achievement) }))
      .sort((a, b) => rank(a.state) - rank(b.state));

    for (const { achievement, state } of rows) {
      const tier = state.complete ? achievement.tiers.length : state.claimed + 1;
      const goal = (state.next ?? achievement.tiers.at(-1)).goal;
      const progress = Math.min(1, state.value / goal);
      const pips = achievement.tiers
        .map((_, k) => `<i class="tier-pip${k < state.claimed ? ' on' : ''}${k === state.claimed && state.claimable ? ' ready' : ''}"></i>`)
        .join('');

      const node = create('div', `node achievement ${state.claimable ? 'claimable' : state.complete ? 'claimed' : ''}`);
      node.innerHTML = `
        <div class="node-icon">${iconHTML(achievement.icon, 30)}</div>
        <div class="node-body">
          <h4>${achievement.name} <span class="tier-badge">${roman(tier)}</span></h4>
          <p>${achievement.description(goal)}</p>
          <div class="bar xp" style="margin-top:6px"><i style="width:${progress * 100}%"></i></div>
          <div class="node-meta"><span class="tier-pips">${pips}</span> ${Math.min(state.value, goal).toLocaleString('pt-BR')} / ${goal.toLocaleString('pt-BR')}</div>
        </div>
      `;

      if (state.claimable) {
        const btn = create('button', 'claim-btn');
        btn.innerHTML = `<span>coletar</span><b>${iconHTML('shards', 14)} ${state.next.shards}</b>`;
        btn.onclick = () => {
          this.game.claimAchievement(achievement.id);
          this.buildAchievements();
          this.refreshTitle();
        };
        node.appendChild(btn);
      } else if (state.complete) {
        node.appendChild(create('div', 'node-state done', '✔ completa'));
      } else {
        node.appendChild(create('div', 'node-state', `${iconHTML('shards', 14)} ${state.next.shards}`));
      }
      list.appendChild(node);
    }
  }

  /* ========================== equipe da jornada ========================== */

  buildTeamDetail() {
    const list = clear(el('team-detail'));
    const journey = this.game.campaign.journey;
    const members = journey?.team?.members ?? [];

    if (!members.length) {
      list.appendChild(create('div', 'node', `
        <div class="node-icon">${iconHTML('team', 30)}</div>
        <div class="node-body">
          <h4>Nenhuma equipe registrada</h4>
          <p>Conclua uma fase para que sua equipe passe a ser levada adiante na jornada.</p>
        </div>
      `));
      return;
    }

    for (const member of members) {
      const data = getPokemon(member.pokemonId);
      const current = member.abilities[0];
      // linha de golpes: o atual em destaque, o próximo é o que a TM concede
      const moves = moveLineOf(member.pokemonId)
        .map((a) => (a.id === current
          ? `<b style="color:var(--yellow)">${a.name}</b>`
          : `<span style="opacity:.55">${a.name}</span>`))
        .join(' <span style="opacity:.4">→</span> ');
      const extras = member.abilities.slice(1).map((id) => getAbility(id)?.name).filter(Boolean);
      const upgrades = Object.entries(member.upgrades ?? {})
        .reduce((total, [, stacks]) => total + stacks, 0);

      const node = create('div', 'node');
      node.appendChild(pokemonImg(data.dex, { className: 'node-sprite', alt: data.name }));

      const body = create('div', 'node-body');
      body.innerHTML = `
        <h4>${data.name} <span style="color:var(--yellow)">Nv.${member.level}</span></h4>
        <p>${data.role} · ${data.types.map(typeName).join(' / ')}</p>
        <div class="node-meta">${moves}</div>
        <div class="node-meta">${upgrades} melhoria(s)${extras.length ? ` · extra: ${extras.join(', ')}` : ''}</div>
      `;
      node.appendChild(body);

      node.appendChild(create('div', 'node-state', `${Math.round(member.hp)}/${maxHpFor(member)} HP`));
      list.appendChild(node);
    }
  }

  /* ==================== melhorias do treinador ==================== */

  buildTrainer() {
    const list = clear(el('trainer-list'));
    const shards = this.game.profile.shards ?? 0;
    el('trainer-coins').innerHTML = `${iconHTML('shards', 18)} <b>${shards}</b> Shards`;

    for (const entry of this.game.trainerShop()) {
      const { upgrade, level, cost, maxed, affordable } = entry;
      const node = create('div', `shop-card${maxed ? ' maxed' : ''}${!maxed && !affordable ? ' locked' : ''}`);

      const pips = Array.from({ length: upgrade.levels }, (_, i) =>
        `<span class="pip${i < level ? ' on' : ''}"></span>`).join('');

      node.innerHTML = `
        <div class="shop-icon">${iconHTML(upgrade.icon, 34)}</div>
        <div class="shop-body">
          <div class="shop-title">
            <h4>${upgrade.name}</h4>
            <span class="shop-level">${level}/${upgrade.levels}</span>
          </div>
          <p>${upgrade.description}</p>
          <div class="pips">${pips}</div>
        </div>
      `;

      const btn = create('button', `buy-btn${maxed ? ' maxed' : ''}`);
      btn.innerHTML = maxed
        ? '<span>MÁXIMO</span>'
        : `<span>comprar</span><b>${iconHTML('shards', 15)} ${cost}</b>`;
      btn.disabled = maxed || !affordable;
      btn.onclick = () => {
        if (this.game.buyTrainerUpgrade(upgrade.id)) {
          this.buildTrainer();
          this.refreshTitle();
        }
      };
      node.appendChild(btn);
      list.appendChild(node);
    }
  }

  /* ============================== opções ============================== */

  buildOptions() {
    const list = clear(el('options-list'));
    const icon = (item) => `<span class="ui-icon"><img src="${itemUrl(item)}" alt="" /></span>`;

    const option = (iconHTML, title, description, value, onClick) => {
      const node = create('div', 'node');
      node.innerHTML = `
        <div class="node-icon">${iconHTML}</div>
        <div class="node-body"><h4>${title}</h4><p>${description}</p></div>
      `;
      const btn = create('button', 'icon-btn', value);
      btn.onclick = () => { onClick(); saveOptions(); this.buildOptions(); };
      node.appendChild(btn);
      list.appendChild(node);
    };

    // o mixer: a música do lobby e das fases (a barra em degraus, a Poké Ball de manopla)
    const music = create('div', 'node volume-node');
    const percent = Math.round(CONFIG.audio.musicVolume * 100);
    music.innerHTML = `
      <div class="node-icon">${icon('poke-flute')}</div>
      <div class="node-body">
        <h4>Música</h4>
        <p>O tema do lobby e a música de cada fase, do FireRed.</p>
        <div class="volume-row">
          <input type="range" class="volume-slider" min="0" max="100" step="5" value="${percent}" aria-label="Volume da música" />
          <span class="volume-value">${percent === 0 ? 'Mudo' : `${percent}%`}</span>
        </div>
      </div>
    `;
    const slider = music.querySelector('.volume-slider');
    const label = music.querySelector('.volume-value');
    if (slider) {
      // o quanto da barra fica preenchido (variável do CSS)
      const fill = (v) => { if (typeof slider.style.setProperty === 'function') slider.style.setProperty('--fill', `${v}%`); };
      fill(percent);
      slider.oninput = () => {
        const value = Number(slider.value);
        this.game.music.setVolume(value / 100);
        label.textContent = value === 0 ? 'Mudo' : `${value}%`;
        fill(value);
      };
      slider.onchange = () => saveOptions();
    }
    list.appendChild(music);

    const looks = this.game.region.trainers;
    const trainer = getTrainerLook(this.game.profile.trainer);
    option(`<span class="option-trainer" style="background-image:url(${assetUrl(trainer.sheet)})"></span>`, 'Treinador',
      'Quem guia a sua equipe pelo mapa. Vale a partir da próxima partida.',
      trainer.label,
      () => {
        this.game.profile.trainer = looks[(looks.indexOf(trainer.id) + 1) % looks.length];
        this.game.autosave();
      });

    option(icon('hard-stone'), 'Tremor de tela',
      'A tela treme em explosões, no Earthquake e nos golpes dos líderes.',
      CONFIG.fx.screenShake ? 'Ligado' : 'Desligado',
      () => { CONFIG.fx.screenShake = !CONFIG.fx.screenShake; });

    option(icon('pokemon-box-link'), 'Autosave no navegador',
      'Guarda o progresso local para o botão Continuar. O arquivo .json continua sendo o save oficial.',
      CONFIG.save.useLocalStorage ? 'Ligado' : 'Desligado',
      () => { CONFIG.save.useLocalStorage = !CONFIG.save.useLocalStorage; });

    option(icon('escape-rope'), 'Apagar progresso local',
      'Remove o autosave do navegador. Não afeta os arquivos .json já salvos.',
      'Apagar',
      () => this.game.clearLocalProgress());
  }
}
