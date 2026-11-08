import { el, create, clear, show, hide, toast } from './dom.js';
import { getPokemon } from '../data/pokemon.js';
import { getAbility } from '../data/abilities.js';
import { ACHIEVEMENTS, TOTAL_ACHIEVEMENT_TIERS } from '../data/achievements.js';
import { roman } from '../save/profile.js';
import { moveLineOf } from '../data/tms.js';
import { getTrainerLook, TRAINER_NAME_MAX } from '../data/trainers.js';
import { spriteUrl, pokemonImg } from '../render/sprites.js';
import { assetUrl } from '../render/assets.js';
import { saveOptions } from '../save/options.js';
import { typeColor, typeName } from '../data/types.js';
import { CONFIG } from '../core/config.js';
import { iconHTML, itemUrl } from '../render/icons.js';
import { maxHpFor } from '../systems/stats.js';
import { TitleMenu } from './titleMenu.js';
import { PCScreen } from './pcScreen.js';
import { isBonusMove, BONUS_MOVE_LABEL } from '../data/bonusMoves.js';
import { awakeningKeyOf, awakeningPartName } from '../data/awakening.js';
import { Lobby } from './lobby.js';
import { BadgeCase } from './badgeCase.js';
import { JourneyScreen } from './journeys.js';
import { MART_ITEMS, evolvedBy } from '../data/items.js';
import { DECOR, decorMax } from '../data/decor.js';
import { choiceCard } from './pokemonCard.js';
import { HUB_SPRITES, HUB_DECOR } from '../data/hubMaps.js';

const SCREENS = ['screen-title', 'screen-journeys', 'screen-trainer', 'screen-name', 'screen-starter', 'screen-campaign', 'screen-hub'];
const MODALS = ['modal-pokedex', 'modal-achievements', 'modal-team', 'modal-mart', 'modal-decor', 'modal-options', 'modal-help', 'modal-pc', 'modal-badges'];

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
    this.journeys = new JourneyScreen(game);
    this._bind();
    this.titleMenu = new TitleMenu(this);
  }

  _bind() {
    // "Nova jornada" abre um espaço novo, sem apagar as outras; "Jornada" mostra os espaços (0.19)
    el('btn-new-game').onclick = () => this.leaveTitle(() => this.game.newJourney());
    el('btn-continue').onclick = () => this.leaveTitle(() => this.showJourneys());
    el('btn-load-game').onclick = () => el('save-file-input').click();
    el('btn-save-campaign').onclick = () => this.game.saveToFile();
    el('btn-hall').onclick = () => this.game.showHallOfFame(this.game.profile.hallOfFame.at(-1));
    el('btn-village').onclick = () => this.game.openHub();   // do mapa da jornada de volta para a vila (0.29)
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
      // o Voltar da escolha do inicial devolve o jogador ao laboratório (0.29)
      btn.onclick = () => (btn.dataset.back === 'screen-hub' ? this.game.cancelStarter() : this.show(btn.dataset.back));
    });

    // o nome do jogador (0.30): Enter no campo ou Confirmar
    el('name-form').onsubmit = (e) => {
      e?.preventDefault?.();
      this.game.chooseName(el('name-input').value);
    };

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
    // a vila só anda e desenha enquanto está na tela (Game._frame)
    this.game.hubOpen = screenId === 'screen-hub';
    if (screenId === 'screen-title') this.refreshTitle();
    if (screenId === 'screen-campaign') {
      // ao entrar no lobby, a próxima fase já vem escolhida; o mapa mede o espaço depois de aparecer
      this.lobby.selected = null;
      this.lobby.render();
    }
  }

  /** A tela de jornadas: os espaços, com Jogar, Apagar e Nova jornada. */
  showJourneys() {
    this.journeys.confirming = null;
    this.journeys.render();
    this.show('screen-journeys');
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
    this.game.hubOpen = false;
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
      'modal-mart': () => this.buildMart(),
      'modal-decor': () => this.buildDecor(),
      'modal-options': () => { this.confirmRestart = false; this.buildOptions(); },
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
    // o que a janela mudou (Shards, PC, conquistas) aparece na barra do lobby e na da vila
    if (!el('screen-campaign').classList.contains('hidden')) this.lobby.render();
    if (!el('screen-hub').classList.contains('hidden')) this.game.hubHud?.render();
  }

  /* ============================ menu principal ============================ */

  refreshTitle() {
    const profile = this.game.profile;
    // o selo diz quantos espaços de jornada estão em uso (0.19)
    const journeys = this.game.listJourneys().length;
    el('continue-seal').textContent = journeys ? `${journeys} de ${CONFIG.save.maxJourneys}` : 'Nenhuma ainda';
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

      // só Menino e Menina: o nome é o jogador quem escreve depois (0.30)
      card.append(portrait, walker, create('h3', '', look.label));
      card.onclick = () => this.game.chooseTrainer(id);
      row.appendChild(card);
    }
  }

  /* ======================= o nome do jogador (0.30) ======================= */

  /** A tela do nome: o retrato de quem foi escolhido e o campo, já com o nome de antes. */
  buildNameEntry() {
    const game = this.game;
    const look = getTrainerLook(game.profile.trainer);
    el('name-oak').src = assetUrl('portrait/oak');
    el('name-portrait').src = assetUrl(look.portrait);
    el('name-portrait').alt = look.label;
    const input = el('name-input');
    input.value = game.profile.trainerName ?? '';
    input.placeholder = look.name;
    input.maxLength = TRAINER_NAME_MAX;
    el('name-hint').textContent = `Até ${TRAINER_NAME_MAX} letras. Em branco, fica ${look.name}.`;
    // o campo já vem pronto para escrever
    setTimeout(() => input.focus?.(), 60);
  }

  /* ======================= escolha do inicial ======================= */

  buildStarters() {
    const row = clear(el('starter-choices'));
    // o card de escolha (0.31, ui/pokemonCard.js): o sprite do FireRed na base de
    // batalha, as barras de vida, dano e alcance, e o golpe no pé
    for (const pokemon of this.game.region.starters.map(getPokemon)) {
      const card = choiceCard(pokemon, { className: 'starter-card' });
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
      const extras = member.abilities.slice(1).filter((id) => !isBonusMove(id)).map((id) => getAbility(id)?.name).filter(Boolean);
      // a chave do Golpe Desperto (0.28): cada parte; completa, a chance a cada nível (0.33)
      const key = awakeningKeyOf(member);
      const keyText = key.every((p) => p.stacks >= p.max)
        ? `chave completa · ${Math.round(CONFIG.bonusMove.chancePerLevel * 100)}% de despertar a cada nível`
        : key.map((p) => `${awakeningPartName(p.up)} ${p.stacks}/${p.max}`).join(' · ');
      const second = member.abilities.find(isBonusMove);   // o 2º golpe (0.14)
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
        ${second ? `<div class="node-meta bonus-move" title="${getAbility(second).description}">✦ ${BONUS_MOVE_LABEL}: ${getAbility(second).name}</div>`
          : key.length ? `<div class="node-meta awaken-key">✦ ${BONUS_MOVE_LABEL}: ${keyText}</div>` : ''}
      `;
      node.appendChild(body);

      node.appendChild(create('div', 'node-state', `${Math.round(member.hp)}/${maxHpFor(member)} HP`));
      list.appendChild(node);
    }
  }

  /* ============================== Poké Mart (0.23) ============================== */

  /**
   * A loja: cada item com o preço; os da mochila mostram quantos você tem. A TM
   * e os de evolução abrem, no próprio card, a lista de quem pode receber
   * (equipe e PC) — escolher compra e usa na hora.
   */
  buildMart() {
    const game = this.game;
    const list = clear(el('mart-list'));
    const shards = game.profile.shards ?? 0;
    el('mart-shards').innerHTML = `${iconHTML('shards', 18)} <b>${shards.toLocaleString('pt-BR')}</b> Shards`;

    for (const item of MART_ITEMS) {
      const card = create('div', 'shop-card mart-card');
      const evolves = item.kind === 'evolution'
        ? `Evolui agora: ${evolvedBy(item.id).map((p) => p.name).join(', ')}.` : item.description;
      const owned = item.kind === 'bag' ? ` · na mochila: <b>${game.profile.bag?.[item.id] ?? 0}</b>` : '';
      card.innerHTML = `
        <div class="shop-icon">${iconHTML(item.icon, 34)}</div>
        <div class="shop-body">
          <div class="shop-title"><h4>${item.name}</h4><span class="shop-level">${iconHTML('shards', 14)} ${item.price.toLocaleString('pt-BR')}</span></div>
          <p>${evolves}${owned}</p>
        </div>
      `;
      const targets = item.kind === 'bag' ? null : game.martTargets(item.id);
      const btn = create('button', 'buy-btn');
      const affordable = shards >= item.price;
      btn.innerHTML = `<span>${item.kind === 'bag' ? 'comprar' : 'escolher'}</span>`;
      btn.disabled = !affordable || (targets && !targets.length);
      btn.title = !affordable ? 'Shards insuficientes'
        : targets && !targets.length ? 'Nenhum Pokémon da jornada pode receber este item' : '';
      btn.onclick = () => {
        if (item.kind === 'bag') { if (game.buyMartItem(item.id)) this.buildMart(); return; }
        this._martPicker(card, item, targets);
      };
      card.appendChild(btn);
      list.appendChild(card);
    }
  }

  /* ========================= a loja de Pokédolls (0.29) ========================= */

  /** Os enfeites do quarto: o móvel ou o boneco, o preço e quantos já estão lá. */
  buildDecor() {
    const game = this.game;
    const list = clear(el('decor-list'));
    const shards = game.profile.shards ?? 0;
    el('decor-shards').innerHTML = `${iconHTML('shards', 18)} <b>${shards.toLocaleString('pt-BR')}</b> Shards`;
    const champion = game.profile.hallOfFame.length > 0;

    for (const item of DECOR) {
      const owned = game.profile.decor?.[item.id] ?? 0;
      const max = decorMax(item);
      const card = create('div', 'shop-card mart-card decor-card');
      card.innerHTML = `
        <div class="shop-icon">${this._decorIcon(item)}</div>
        <div class="shop-body">
          <div class="shop-title"><h4>${item.name}</h4><span class="shop-level">${iconHTML('shards', 14)} ${item.price.toLocaleString('pt-BR')}</span></div>
          <p>${item.about ?? 'Um boneco de pelúcia para o quarto.'}${max > 1 ? ` · no quarto: <b>${owned}/${max}</b>` : ''}</p>
        </div>
      `;
      const full = owned >= max;
      const locked = item.needs === 'champion' && !champion;
      const btn = create('button', 'buy-btn');
      btn.innerHTML = `<span>${full ? 'no quarto' : locked ? 'Campeão' : 'comprar'}</span>`;
      btn.disabled = full || locked || shards < item.price;
      btn.title = full ? 'Já está no seu quarto' : locked ? 'Só depois de vencer a Liga Pokémon'
        : shards < item.price ? 'Shards insuficientes' : '';
      btn.onclick = () => { if (game.buyDecor(item.id)) this.buildDecor(); };
      card.appendChild(btn);
      list.appendChild(card);
    }
  }

  /**
   * O desenho do enfeite em zoom inteiro (até 64 px): a peça montada do FireRed,
   * com a camada de cima por cima (as folhas da planta), ou o primeiro quadro do boneco.
   */
  _decorIcon(item) {
    if (item.piece) {
      const piece = HUB_DECOR[item.piece];
      const zoom = Math.max(1, Math.floor(64 / (Math.max(piece.width, piece.height) * 16)));
      const size = `width:${piece.width * 16 * zoom}px;height:${piece.height * 16 * zoom}px`;
      return `<span class="decor-stack" style="${size}"><img src="${piece.src}" alt="" style="${size}" />` +
        `<img src="${piece.top}" alt="" style="${size}" /></span>`;
    }
    const sheet = HUB_SPRITES[`npc/${item.sprite}`];
    const zoom = Math.max(1, Math.floor(64 / sheet.frameHeight));
    return `<span class="decor-doll" style="background-image:url(${sheet.src});` +
      `background-size:${sheet.frames * sheet.frameWidth * zoom}px ${sheet.frameHeight * zoom}px;` +
      `width:${sheet.frameWidth * zoom}px;height:${sheet.frameHeight * zoom}px"></span>`;
  }

  /** A lista de quem pode receber a TM ou o item de evolução, dentro do card. */
  _martPicker(card, item, targets) {
    card.querySelector('.mart-picker')?.remove();
    const picker = create('div', 'mart-picker');
    for (const target of targets) {
      const data = getPokemon(target.member.pokemonId);
      const row = create('button', 'mart-target');
      row.type = 'button';
      row.innerHTML = `<span class="team-icon" style="background-image:url(assets/pokemon/gen3/icons/${data.dex}.png)"></span>` +
        `<b>${data.name}</b> <span>Nv.${target.member.level} · ${target.where} · ${target.label}</span>`;
      row.onclick = () => {
        if (this.game.buyMartItem(item.id, target.member.uid)) { this.buildMart(); this.lobby.render(); }
      };
      picker.appendChild(row);
    }
    const cancel = create('button', 'menu-btn ghost slim', 'Cancelar');
    cancel.type = 'button';
    cancel.onclick = () => picker.remove();
    picker.appendChild(cancel);
    card.appendChild(picker);
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
      return node;
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
      'A tela treme nos golpes dos líderes.',
      CONFIG.fx.screenShake ? 'Ligado' : 'Desligado',
      () => { CONFIG.fx.screenShake = !CONFIG.fx.screenShake; });

    option(icon('pokemon-box-link'), 'Autosave no navegador',
      'Guarda o progresso no navegador, para o botão Jornada. O arquivo .json continua sendo o save oficial.',
      CONFIG.save.useLocalStorage ? 'Ligado' : 'Desligado',
      () => { CONFIG.save.useLocalStorage = !CONFIG.save.useLocalStorage; });

    // reiniciar a jornada ativa do zero (0.33, pedido do Fellipe: saiu da tela de
    // derrota e veio para cá, e pergunta antes de apagar tudo)
    if (this.game.profile.trainer) {
      if (this.confirmRestart) {
        const node = create('div', 'node confirm-node');
        node.dataset.option = 'restart-confirm';
        node.innerHTML = `
          <div class="node-icon">${icon('poke-ball')}</div>
          <div class="node-body"><h4>Reiniciar a jornada</h4><p>Tem certeza que deseja reiniciar a jornada? Seu progresso começa do zero.</p></div>
        `;
        const actions = create('div', 'node-actions');
        const yes = create('button', 'icon-btn danger', 'Sim, reiniciar');
        yes.dataset.action = 'restart-yes';
        yes.onclick = () => { this.confirmRestart = false; this.closeModal(); this.game.restartJourney(); };
        const no = create('button', 'icon-btn', 'Cancelar');
        no.dataset.action = 'restart-no';
        no.onclick = () => { this.confirmRestart = false; this.buildOptions(); };
        actions.append(yes, no);
        node.appendChild(actions);
        list.appendChild(node);
      } else {
        const restart = option(icon('poke-ball'), 'Reiniciar a jornada',
          `Recomeça do zero a jornada de ${this.game.playerName}: insígnias, equipe e PC. A Pokédex, as conquistas e os Shards continuam.`,
          'Reiniciar',
          () => { this.confirmRestart = true; });
        restart.dataset.option = 'restart';
      }
    }

    option(icon('escape-rope'), 'Apagar progresso local',
      'Remove o autosave do navegador. Não afeta os arquivos .json já salvos.',
      'Apagar',
      () => this.game.clearLocalProgress());
  }
}
