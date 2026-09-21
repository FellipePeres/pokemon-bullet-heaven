import { el, create, clear, show, hide } from './dom.js';
import { getStarters, getPokemon } from '../data/pokemon.js';
import { getAbility } from '../data/abilities.js';
import { STAGES, KANTO_CAMPAIGN, isStageUnlocked } from '../data/stages.js';
import { KANTO_DEX } from '../data/kanto.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { moveLineOf } from '../data/tms.js';
import { spriteUrl, artworkUrl, pokemonImg, badgeUrl } from '../render/sprites.js';
import { typeColor, typeName } from '../data/types.js';
import { CONFIG } from '../core/config.js';
import { iconHTML } from '../render/icons.js';
import { formatTime } from '../core/utils.js';
import { maxHpFor } from '../systems/stats.js';

const SCREENS = ['screen-title', 'screen-starter', 'screen-campaign'];
const MODALS = ['modal-pokedex', 'modal-achievements', 'modal-team', 'modal-trainer', 'modal-options', 'modal-help'];

/**
 * Telas fora da partida.
 * O foco é o menu principal; Pokédex, conquistas, equipe e opções abrem como
 * janelas por cima dele, sem tirar o jogador do lugar.
 */
export class Menus {
  constructor(game) {
    this.game = game;
    this.openModal = null;
    this._bind();
  }

  _bind() {
    el('btn-new-game').onclick = () => this.game.newGame();
    el('btn-continue').onclick = () => this.game.continueGame();
    el('btn-load-game').onclick = () => el('save-file-input').click();
    el('btn-save-campaign').onclick = () => this.game.saveToFile();
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
    if (screenId === 'screen-title') this.refreshTitle();
  }

  showGame() {
    for (const id of SCREENS) hide(el(id));
    hide(el('side-rail'));
    this.closeModal();
    show(el('stage-wrapper'));
  }

  showModal(id) {
    this.closeModal();
    const builders = {
      'modal-pokedex': () => this.buildPokedex(),
      'modal-achievements': () => this.buildAchievements(),
      'modal-team': () => this.buildTeamDetail(),
      'modal-trainer': () => this.buildTrainer(),
      'modal-options': () => this.buildOptions()
    };
    builders[id]?.();
    show(el(id));
    this.openModal = id;
  }

  closeModal() {
    for (const id of MODALS) hide(el(id));
    this.openModal = null;
  }

  /* ============================ menu principal ============================ */

  refreshTitle() {
    const profile = this.game.profile;
    const canContinue = this.game.canContinue();
    const btn = el('btn-continue');
    btn.disabled = !canContinue;
    btn.querySelector('.btn-text').textContent = canContinue
      ? `Continuar — ${this.game.continueLabel()}`
      : 'Continuar';

    const strip = clear(el('title-progress'));
    const pills = [
      ['shards', 'Shards', String(profile.shards ?? 0)],
      ['pokedex', 'Pokédex', `${profile.pokedex.caught.length}/${KANTO_DEX.length}`],
      ['badge', 'Insígnias', String(profile.campaign.badges.length)],
      ['stages', 'Fases', String(profile.campaign.clearedStages.length)],
      ['achievements', 'Conquistas', `${profile.achievements.unlocked.length}/${ACHIEVEMENTS.length}`]
    ];
    for (const [icon, label, value] of pills) {
      strip.appendChild(create('span', 'pill', `${iconHTML(icon, 18)} ${label} <b>${value}</b>`));
    }
  }

  /* ======================= escolha do inicial ======================= */

  buildStarters() {
    const row = clear(el('starter-choices'));
    for (const pokemon of getStarters()) {
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

  buildCampaign() {
    const profile = this.game.profile;
    const cleared = profile.campaign.clearedStages;
    const journey = profile.campaign.journey;

    el('campaign-subtitle').textContent = journey
      ? 'Sua equipe e sua build continuam de uma fase para a outra. Uma derrota devolve você ao início da fase.'
      : 'Comece pela Rota 1. A partir dela sua equipe cresce e segue com você.';

    // faixa com a equipe atual
    const teamStrip = clear(el('campaign-team'));
    if (journey?.team?.members?.length) {
      for (const member of journey.team.members) {
        const data = getPokemon(member.pokemonId);
        const chip = create('div', 'jt-mon');
        chip.appendChild(pokemonImg(data.dex, { alt: data.name }));
        chip.appendChild(create('span', '', data.name));
        chip.appendChild(create('span', 'jt-lv', `Nv.${member.level}`));
        teamStrip.appendChild(chip);
      }
    } else {
      teamStrip.appendChild(create('span', 'empty',
        profile.campaign.starter
          ? `Equipe: ${getPokemon(profile.campaign.starter).name} — capture mais Pokémon durante a fase!`
          : 'Nenhuma equipe ainda.'));
    }

    // fases
    const list = clear(el('campaign-list'));
    for (const entry of KANTO_CAMPAIGN) {
      if (entry.comingSoon) {
        const node = create('div', 'stage-card locked');
        node.innerHTML = `
          <div class="stage-icon">${iconHTML(entry.icon, 34)}</div>
          <div class="stage-body"><h4>${entry.name}</h4><p>${entry.description}</p></div>
          <div class="stage-state">Em breve</div>
        `;
        list.appendChild(node);
        continue;
      }

      const stage = STAGES[entry.stage];
      const unlocked = isStageUnlocked(stage.id, cleared);
      const done = cleared.includes(stage.id);
      const leader = stage.leader;

      const node = create('div', `stage-card ${unlocked ? 'clickable' : 'locked'}${done ? ' done' : ''}`);
      node.style.borderLeftColor = done ? '' : unlocked ? 'var(--yellow)' : '';

      node.appendChild(create('div', 'stage-icon', iconHTML(stage.icon, 34)));

      const body = create('div', 'stage-body');
      const trail = (stage.segments ?? []).map((seg) => seg.name).join(' → ');
      body.innerHTML = `
        <h4>${stage.name}</h4>
        <p>${stage.description}</p>
        <div class="stage-meta">
          ⏱ ${formatTime(stage.duration)} de travessia · ${trail}
          ${leader ? ` · 🥇 ${leader.badge}` : ''}
        </div>
      `;
      node.appendChild(body);

      if (leader) {
        const box = create('div', 'stage-boss');
        if (leader.badgeIndex) {
          const badge = create('img', 'badge-img');
          badge.src = badgeUrl(leader.badgeIndex);
          badge.alt = leader.badge;
          badge.title = leader.badge;
          if (!done) badge.style.filter = 'grayscale(1) brightness(.5)';
          box.appendChild(badge);
        }
        const img = create('img');
        img.src = spriteUrl(leader.dex);
        img.alt = leader.name;
        if (!unlocked) img.style.filter = 'brightness(0) invert(.2)';
        box.appendChild(img);
        box.appendChild(create('span', '', unlocked ? leader.name : '???'));
        const team = (stage.bossTeam ?? []).length;
        if (unlocked && team) box.appendChild(create('span', '', `${team} Pokémon`));
        node.appendChild(box);
      }

      node.appendChild(create('div', `stage-state ${done ? 'done' : unlocked ? 'play' : ''}`,
        done ? '✔ Concluída' : unlocked ? '▶ Jogar' : '🔒 Bloqueada'));

      if (unlocked) node.onclick = () => this.game.startStage(stage.id);
      list.appendChild(node);
    }
  }

  /* ============================== Pokédex ============================== */

  buildPokedex() {
    const grid = clear(el('pokedex-grid'));
    const caught = this.game.profile.pokedex.caught;

    el('pokedex-progress').textContent =
      `${caught.length} de ${KANTO_DEX.length} registrados — capture para revelar`;

    KANTO_DEX.forEach((name, i) => {
      const dex = i + 1;
      const isCaught = caught.includes(dex);
      const cell = create('div', `dex-cell ${isCaught ? 'caught' : 'unknown'}`);
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
    const { unlocked, claimed } = this.game.profile.achievements;
    const stats = this.game.profile.stats;
    const pending = this.game.tracker.claimableAchievements.length;

    el('achievements-sub').innerHTML = pending
      ? `${iconHTML('shards', 15)} <b style="color:var(--yellow)">${pending} conquista(s) para coletar</b>`
      : 'Conclua objetivos para ganhar Shards.';

    for (const achievement of ACHIEVEMENTS) {
      const value = stats[achievement.stat] ?? 0;
      const done = unlocked.includes(achievement.id);
      const taken = claimed.includes(achievement.id);
      const progress = Math.min(1, value / achievement.goal);
      const reward = achievement.reward?.shards ?? 0;

      const node = create('div', `node achievement ${done ? (taken ? 'claimed' : 'claimable') : 'locked'}`);
      node.innerHTML = `
        <div class="node-icon">${iconHTML(achievement.icon, 30)}</div>
        <div class="node-body">
          <h4>${achievement.name}</h4>
          <p>${achievement.description}</p>
          <div class="bar xp" style="margin-top:6px"><i style="width:${progress * 100}%"></i></div>
          <div class="node-meta">${Math.min(value, achievement.goal)} / ${achievement.goal}</div>
        </div>
      `;

      if (done && !taken) {
        const btn = create('button', 'claim-btn');
        btn.innerHTML = `<span>coletar</span><b>${iconHTML('shards', 14)} ${reward}</b>`;
        btn.onclick = () => {
          this.game.claimAchievement(achievement.id);
          this.buildAchievements();
          this.refreshTitle();
        };
        node.appendChild(btn);
      } else {
        node.appendChild(create('div', `node-state ${taken ? 'done' : ''}`,
          taken ? '\u2714 coletado' : `${iconHTML('shards', 14)} ${reward}`));
      }

      list.appendChild(node);
    }
  }

  /* ========================== equipe da jornada ========================== */

  buildTeamDetail() {
    const list = clear(el('team-detail'));
    const journey = this.game.profile.campaign.journey;
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

    const option = (icon, title, description, value, onClick) => {
      const node = create('div', 'node');
      node.innerHTML = `
        <div class="node-icon">${icon}</div>
        <div class="node-body"><h4>${title}</h4><p>${description}</p></div>
      `;
      const btn = create('button', 'icon-btn', value);
      btn.onclick = () => { onClick(); this.buildOptions(); };
      node.appendChild(btn);
      list.appendChild(node);
    };

    option('👥', 'Pokémon ativos ao mesmo tempo',
      'Vale para a próxima partida. A divisão de XP se ajusta sozinha.',
      String(CONFIG.team.activeSlots),
      () => { CONFIG.team.activeSlots = CONFIG.team.activeSlots >= 4 ? 1 : CONFIG.team.activeSlots + 1; });

    option('🎞️', 'Sprites animados na interface',
      'GIFs da Gen V nos menus e no HUD. Desligue se preferir imagens estáticas.',
      CONFIG.sprites.useAnimatedUI ? 'Ligado' : 'Desligado',
      () => { CONFIG.sprites.useAnimatedUI = !CONFIG.sprites.useAnimatedUI; });

    option('🖼️', 'Sprites oficiais (online)',
      'Baixa os sprites da PokeAPI. Desligado, o jogo desenha versões simplificadas.',
      CONFIG.sprites.useRemote ? 'Ligado' : 'Desligado',
      () => { CONFIG.sprites.useRemote = !CONFIG.sprites.useRemote; });

    option('💾', 'Autosave no navegador',
      'Guarda o progresso local para o botão Continuar. O arquivo .json continua sendo o save oficial.',
      CONFIG.save.useLocalStorage ? 'Ligado' : 'Desligado',
      () => { CONFIG.save.useLocalStorage = !CONFIG.save.useLocalStorage; });

    option('🗑️', 'Apagar progresso local',
      'Remove o autosave do navegador. Não afeta os arquivos .json já salvos.',
      'Apagar',
      () => this.game.clearLocalProgress());
  }
}
