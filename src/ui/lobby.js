import { el, create, clear, show, hide } from './dom.js';
import { getPokemon } from '../data/pokemon.js';
import { STAGES, isStageUnlocked } from '../data/stages.js';
import { getTrainerLook } from '../data/trainers.js';
import { REGION_MAP, STAGE_CITY, HOME_CITY, cityName, cityPoint } from '../data/regionMap.js';
import { emptyStageStats } from '../systems/stageStats.js';
import { badgeUrl, spriteUrl } from '../render/sprites.js';
import { assetUrl } from '../render/assets.js';
import { iconHTML } from '../render/icons.js';
import { formatTime } from '../core/utils.js';

/** A engrenagem de Opções, a mesma do canto das outras telas. */
const GEAR_SVG = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.4-2.5 1a7.7 7.7 0 0 0-1.7-1L15 3.3h-4l-.4 2.7a7.7 7.7 0 0 0-1.7 1l-2.5-1-2 3.4L6.5 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.4 2.5-1a7.7 7.7 0 0 0 1.7 1l.4 2.7h4l.4-2.7a7.7 7.7 0 0 0 1.7-1l2.5 1 2-3.4zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" transform="translate(-1 0)"/></svg>';

/**
 * O LOBBY — o mapa da jornada como o Town Map do FireRed (0.13, Etapa 9).
 *
 * - Na barra do topo: o treinador, o estojo em miniatura (abre o Estojo de
 *   Insígnias), Shards e Pokédex, e todos os botões (PC, Salvar e Menu em
 *   destaque).
 * - No meio, o mapa de Kanto em pixels inteiros: cada fase na cidade do
 *   ginásio, a Liga e o Campeão no Indigo Plateau. Concluída mostra a insígnia;
 *   a próxima, o cursor do Town Map; bloqueada fica apagada. O ícone do
 *   Red/Leaf fica na cidade da última vitória e anda até a nova ao voltar.
 * - Ao lado, a fase escolhida: líder, trechos, métricas e Jogar.
 * - Embaixo, a equipe com os ícones do PC; clicar abre o PC.
 */
export class Lobby {
  constructor(game) {
    this.game = game;
    this.selected = null;     // a fase escolhida no mapa
    this.playerCity = null;   // onde o ícone do treinador estava da última vez
    this.onResize = () => this._scale();
    if (typeof window !== 'undefined') window.addEventListener('resize', this.onResize);
    this._icons();
  }

  get campaign() { return this.game.campaign; }

  /** As fases da região, na ordem da jornada. */
  get stages() {
    return this.game.region.campaign.filter((entry) => entry.stage).map((entry) => STAGES[entry.stage]);
  }

  /** A próxima fase da jornada (ou a última, se tudo já foi vencido). */
  get nextStage() {
    const cleared = this.campaign.clearedStages;
    return this.stages.find((s) => !cleared.includes(s.id) && isStageUnlocked(s.id, cleared)) ?? this.stages.at(-1);
  }

  render() {
    if (!this.selected || !STAGES[this.selected]) this.selected = this.nextStage.id;
    this._bar();
    this._map();
    this._panel();
    this._team();
    this._scale();
  }

  /* ============================== a barra ============================== */

  _icons() {
    document.querySelectorAll?.('.lobby-bar [data-icon]').forEach((node) => {
      node.innerHTML = node.dataset.icon === 'options' ? GEAR_SVG : iconHTML(node.dataset.icon, 24);
    });
  }

  _bar() {
    const game = this.game;
    const trainer = getTrainerLook(game.profile.trainer);
    el('campaign-trainer').src = assetUrl(trainer.portrait);
    el('campaign-trainer').alt = trainer.name;
    el('campaign-title').textContent = game.region.name;

    // o estojo em miniatura: as 8 insígnias, apagadas as que faltam
    const mini = clear(el('lobby-case'));
    for (const stage of this.stages.filter((s) => s.leader?.badgeIndex)) {
      const badge = create('img', this.campaign.badges.includes(stage.leader.badge) ? 'got' : '');
      badge.src = badgeUrl(stage.leader.badgeIndex);
      badge.alt = '';
      mini.appendChild(badge);
    }
    mini.title = `Estojo de Insígnias — ${this.campaign.badges.length} de 8`;

    const dex = game.tracker.dexProgress;
    el('lobby-stats').innerHTML =
      `<span class="lobby-chip">${iconHTML('shards', 20)}<b>${(game.profile.shards ?? 0).toLocaleString('pt-BR')}</b> Shards</span>` +
      `<span class="lobby-chip">${iconHTML('pokedex', 20)}<b>${dex.caught}</b>/${dex.total}</span>`;

    const pc = game.pcBox.length;
    el('btn-pc').querySelector('.bar-text').textContent = pc ? `PC (${pc})` : 'PC';
    const hall = game.profile.hallOfFame.some((h) => h.region === game.profile.region);
    (hall ? show : hide)(el('btn-hall'));
    el('bar-achievements').classList.toggle('alert', game.tracker.claimableAchievements.length > 0);
  }

  /* ============================== o mapa ============================== */

  _map() {
    const map = clear(el('lobby-map'));
    map.style.backgroundImage = `url(${REGION_MAP.src})`;
    const cleared = this.campaign.clearedStages;

    // uma marca por cidade: a Liga e o Campeão dividem o Indigo Plateau
    const byCity = new Map();
    this.stages.forEach((stage, i) => {
      const city = STAGE_CITY[stage.id];
      if (!city) return;
      if (!byCity.has(city)) byCity.set(city, []);
      byCity.get(city).push({ stage, number: i + 1 });
    });

    for (const [city, entries] of byCity) {
      const done = entries.every(({ stage }) => cleared.includes(stage.id));
      const open = entries.find(({ stage }) => isStageUnlocked(stage.id, cleared) && !cleared.includes(stage.id));
      const unlocked = entries.some(({ stage }) => isStageUnlocked(stage.id, cleared));
      const state = done ? 'done' : open ? 'next' : unlocked ? 'open' : 'locked';
      const point = cityPoint(city);
      const league = entries.length > 1;
      const node = create('button', `map-node ${state}${entries.some(({ stage }) => stage.id === this.selected) ? ' selected' : ''}`);
      node.type = 'button';
      node.style.setProperty('--x', point.x);
      node.style.setProperty('--y', point.y);
      node.title = league ? `${cityName(city)} — a Liga` : `${entries[0].stage.name}`;
      const leader = entries[0].stage.leader;
      if (done && !league && leader?.badgeIndex) {
        const badge = create('img', 'map-badge');
        badge.src = badgeUrl(leader.badgeIndex);
        badge.alt = leader.badge;
        node.appendChild(badge);
      }
      if (state === 'next') node.appendChild(create('span', 'map-cursor'));
      node.appendChild(create('span', 'map-number', league ? 'Liga' : String(entries[0].number)));
      // na Liga, a marca leva à próxima sala dela
      const target = (open ?? entries.find(({ stage }) => isStageUnlocked(stage.id, cleared)) ?? entries[0]).stage;
      node.onclick = () => { this.selected = target.id; this.render(); };
      node.ondblclick = () => { if (isStageUnlocked(target.id, cleared)) this.game.startStage(target.id); };
      map.appendChild(node);
    }

    // o treinador fica na cidade da última vitória (Pallet no começo)
    const last = [...this.stages].reverse().find((s) => cleared.includes(s.id));
    const city = last ? STAGE_CITY[last.id] : HOME_CITY;
    const icon = create('span', 'map-player');
    icon.style.backgroundImage = `url(assets/ui/region-map/player-${this.game.profile.trainer === 'leaf' ? 'leaf' : 'red'}.png)`;
    const from = cityPoint(this.playerCity ?? city);
    const to = cityPoint(city);
    icon.style.setProperty('--x', from.x);
    icon.style.setProperty('--y', from.y);
    map.appendChild(icon);
    if (this.playerCity && this.playerCity !== city) {
      // voltou de uma vitória: ele anda até a cidade nova
      requestAnimationFrame(() => requestAnimationFrame(() => {
        icon.classList.add('walking');
        icon.style.setProperty('--x', to.x);
        icon.style.setProperty('--y', to.y);
      }));
    }
    this.playerCity = city;
  }

  /** O mapa em pixels inteiros: o maior que cabe no espaço ao lado do painel. */
  _scale() {
    const frame = document.querySelector?.('.lobby-map-frame');
    const map = el('lobby-map');
    if (!frame || !map || typeof frame.getBoundingClientRect !== 'function') return;
    const box = frame.getBoundingClientRect();
    if (!box.width) return;
    const dpr = window.devicePixelRatio || 1;
    const fit = Math.min((box.width - 24) / REGION_MAP.width, (box.height - 24) / REGION_MAP.height);
    const device = Math.max(1, Math.floor(fit * dpr));
    map.style.setProperty('--mpx', `${device / dpr}px`);
  }

  /* ============================== o painel ============================== */

  _panel() {
    const panel = clear(el('lobby-panel'));
    const stage = STAGES[this.selected];
    const cleared = this.campaign.clearedStages;
    const unlocked = isStageUnlocked(stage.id, cleared);
    const done = cleared.includes(stage.id);
    const [chapter, title] = stage.name.split(' — ');
    const leader = stage.leader;

    // na Liga, as cinco salas lado a lado para escolher
    const league = this.stages.filter((s) => STAGE_CITY[s.id] === STAGE_CITY[stage.id]);
    if (league.length > 1) {
      const row = create('div', 'panel-league');
      for (const room of league) {
        const roomLeader = room.leader;
        const chip = create('button', `league-chip${room.id === stage.id ? ' on' : ''}${cleared.includes(room.id) ? ' done' : ''}`);
        chip.type = 'button';
        const img = create('img');
        img.src = assetUrl(roomLeader?.portrait) ?? spriteUrl(roomLeader?.dex);
        img.alt = '';
        if (!isStageUnlocked(room.id, cleared)) img.classList.add('silhouette');
        chip.appendChild(img);
        chip.title = room.name;
        chip.onclick = () => { this.selected = room.id; this.render(); };
        row.appendChild(chip);
      }
      panel.appendChild(row);
    }

    const head = create('div', 'panel-head');
    head.appendChild(create('span', 'panel-chapter', chapter ?? ''));
    head.appendChild(create('h3', '', title ?? stage.name));
    panel.appendChild(head);

    if (leader) {
      const who = create('div', 'panel-leader');
      const portrait = create('img', `leader-portrait${unlocked ? '' : ' silhouette'}`);
      portrait.src = assetUrl(leader.portrait) ?? spriteUrl(leader.dex);
      portrait.alt = leader.name;
      who.appendChild(portrait);
      const info = create('div');
      info.appendChild(create('b', '', unlocked ? leader.name : '???'));
      const team = stage.bossTeam?.length ?? 0;
      info.appendChild(create('span', '', unlocked && team ? `${team} Pokémon` : 'Vença a anterior para liberar'));
      if (leader.badge) info.appendChild(create('span', 'panel-badge-name', leader.badge));
      who.appendChild(info);
      if (leader.badgeIndex) {
        const badge = create('img', `panel-badge${done ? '' : ' missing'}`);
        badge.src = badgeUrl(leader.badgeIndex);
        badge.alt = '';
        who.appendChild(badge);
      }
      panel.appendChild(who);
    }

    const trail = (stage.segments ?? []).map((seg) => seg.name).join(' → ');
    panel.appendChild(create('p', 'panel-trail', `${trail}`));
    panel.appendChild(create('p', 'panel-time', `${formatTime(stage.duration)} de travessia até o líder`));

    // o nível recomendado (0.17): a derrota guarda o progresso e a próxima fase só
    // abre vencendo; aqui o jogador vê se é hora de fortalecer a equipe antes
    if (stage.recommendedLevel) {
      const members = this.campaign.journey?.team?.members ?? [];
      const team = members.length ? Math.round(members.reduce((sum, m) => sum + m.level, 0) / members.length) : 1;
      const gap = stage.recommendedLevel - team;
      const tone = done || gap <= 0 ? 'ok' : gap <= 5 ? 'close' : 'far';
      const line = create('p', `panel-level ${tone}`);
      line.innerHTML = `Nível recomendado <b>${stage.recommendedLevel}</b> · sua equipe <b>${team}</b>`;
      line.title = tone === 'far'
        ? 'Sua equipe está bem abaixo: rejogue as fases anteriores para fortalecer os Pokémon.'
        : 'A média de nível da equipe com que a fase costuma ser vencida.';
      panel.appendChild(line);
    }

    // as métricas da fase, as mesmas do estojo
    const stats = { ...emptyStageStats(), ...this.campaign.stageStats?.[stage.id] };
    const rows = create('dl', 'panel-stats');
    const add = (label, value) => { rows.appendChild(create('dt', '', label)); rows.appendChild(create('dd', '', value)); };
    add('Vitórias', stats.attempts ? `${stats.wins} de ${stats.attempts}` : '—');
    add('Melhor tempo', stats.bestTime !== null ? formatTime(stats.bestTime) : '—');
    add('Menos desmaios', stats.fewestFaints !== null ? String(stats.fewestFaints) : '—');
    panel.appendChild(rows);

    const actions = create('div', 'panel-actions');
    const play = create('button', 'menu-btn primary panel-play');
    play.type = 'button';
    play.innerHTML = `<span class="btn-text">${!unlocked ? 'Bloqueada' : done ? 'Jogar de novo' : 'Jogar'}</span>`;
    play.disabled = !unlocked;
    play.onclick = () => this.game.startStage(stage.id);
    actions.appendChild(play);
    const caseBtn = create('button', 'menu-btn ghost slim');
    caseBtn.type = 'button';
    caseBtn.textContent = 'Ver no estojo';
    caseBtn.onclick = () => this.game.menus.showModal('modal-badges', { stageId: stage.id });
    actions.appendChild(caseBtn);
    panel.appendChild(actions);
  }

  /* ============================== a equipe ============================== */

  _team() {
    const strip = clear(el('campaign-team'));
    const journey = this.campaign.journey;
    const members = journey?.team?.members?.length
      ? journey.team.members
      : this.campaign.starter ? [{ pokemonId: this.campaign.starter, level: 1, shiny: !!this.campaign.starterShiny }] : [];
    strip.appendChild(create('span', 'team-label', 'Equipe'));
    for (let i = 0; i < 6; i++) {
      const member = members[i];
      const slot = create('button', `team-slot${member ? '' : ' empty'}`);
      slot.type = 'button';
      if (member) {
        const data = getPokemon(member.pokemonId);
        const icon = create('span', 'team-icon');
        icon.style.backgroundImage = `url(assets/pokemon/gen3/icons/${data.dex}.png)`;
        slot.appendChild(icon);
        slot.appendChild(create('span', 'team-lv', `Nv.${member.level}`));
        if (journey?.team?.active?.includes(member.uid)) slot.classList.add('field');
        if (member.shiny) slot.appendChild(create('span', 'team-shiny', '✦'));
        slot.title = `${member.shiny ? '✦ ' : ''}${data.name}, Nv. ${member.level}`;
      }
      slot.onclick = () => this.game.menus.showModal('modal-pc');
      strip.appendChild(slot);
    }
    if (!journey?.team) strip.appendChild(create('span', 'team-hint', 'Vença a primeira fase: a equipe com que você vencer segue na jornada.'));
  }
}
