import { el, create, clear, show, hide } from './dom.js';
import { getPokemon } from '../data/pokemon.js';
import { STAGES, isStageUnlocked, storyLocked, storyProgress } from '../data/stages.js';
import { getTrainerLook } from '../data/trainers.js';
import { REGION_MAP, STAGE_CITY, HOME_CITY, STORY_PLACES, cityName, cityPoint, placePoint } from '../data/regionMap.js';
import { emptyStageStats } from '../systems/stageStats.js';
import { badgeUrl, spriteUrl } from '../render/sprites.js';
import { typeColor, typeName } from '../data/types.js';
import { assetUrl } from '../render/assets.js';
import { iconHTML } from '../render/icons.js';
import { formatTime } from '../core/utils.js';
import { leaderTeamTypes, teamWeaknesses } from '../systems/matchup.js';

/** A engrenagem de Opções, a mesma do canto das outras telas. */
const GEAR_SVG = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.4-2.5 1a7.7 7.7 0 0 0-1.7-1L15 3.3h-4l-.4 2.7a7.7 7.7 0 0 0-1.7 1l-2.5-1-2 3.4L6.5 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.4 2.5-1a7.7 7.7 0 0 0 1.7 1l.4 2.7h4l.4-2.7a7.7 7.7 0 0 0 1.7-1l2.5 1 2-3.4zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" transform="translate(-1 0)"/></svg>';

/**
 * O LOBBY — o mapa da jornada como o Town Map do FireRed (0.13, Etapa 9).
 *
 * - Na barra do topo: o treinador, o estojo em miniatura (abre o Estojo de
 *   Insígnias), Shards e Pokédex, e todos os botões (PC, Poké Mart, Hall,
 *   Salvar e Menu em destaque).
 * - No meio, o mapa de Kanto em pixels inteiros: cada fase na cidade do
 *   ginásio, a Liga e o Campeão no Indigo Plateau. Concluída mostra a insígnia;
 *   a próxima, o cursor do Town Map; bloqueada fica apagada. O rosto do
 *   treinador fica na fase escolhida e anda até a outra quando ela muda (0.30).
 *   Embaixo, o Voltar para a Vila.
 * - Ao lado, a fase escolhida (0.31): o salão do líder com ele por cima e o tipo
 *   do ginásio, o nome da fase, a faixa do líder (insígnia e uma Poké Ball por
 *   Pokémon), o caminho com a duração, o nível recomendado e o JOGAR. No
 *   banner, o "Fraco" (0.32): os tipos que mais batem no time do líder.
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
    const cleared = storyProgress(this.campaign);
    // a fase presa pela trava da história (H-4) também é a próxima: o painel diz o que falta
    return this.stages.find((s) => !cleared.includes(s.id) && (isStageUnlocked(s.id, cleared) || storyLocked(s.id, cleared)))
      ?? this.stages.at(-1);
  }

  /** Os lugares da história que estão no mapa agora (0.39): os de uma quest ativa. */
  get places() {
    return Object.entries(STORY_PLACES).filter(([, place]) => place.quests.some((id) => this.game.quests.isActive(id)));
  }

  render() {
    const place = this.selected?.startsWith('place:') && this.places.some(([id]) => `place:${id}` === this.selected);
    if (!place && (!this.selected || !STAGES[this.selected])) this.selected = this.nextStage.id;
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
    el('campaign-trainer').alt = game.playerName;
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
    const cleared = storyProgress(this.campaign);

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

    // os lugares da história (0.39): a marca azul, com o "!", enquanto a quest dele está ativa
    for (const [id, place] of this.places) {
      const point = placePoint(id);
      const key = `place:${id}`;
      const node = create('button', `map-node place${this.selected === key ? ' selected' : ''}`);
      node.type = 'button';
      node.style.setProperty('--x', point.x);
      node.style.setProperty('--y', point.y);
      node.title = `${place.name} (${place.area})`;
      node.appendChild(create('span', 'map-place-mark', '!'));
      node.appendChild(create('span', 'map-number', place.name.replace(/^A /, '')));
      node.onclick = () => { this.selected = key; this.render(); };
      node.ondblclick = () => this.game.visitPlace(id);
      map.appendChild(node);
    }

    // o rosto do treinador acompanha a fase atual do mapa (0.30, pedido do Fellipe):
    // ao entrar é a próxima da jornada; escolher outra no mapa faz ele andar até lá
    // (num lugar da história, ele fica onde estava)
    const city = STAGE_CITY[this.selected] ?? (this.selected?.startsWith('place:') ? this.playerCity : null) ?? HOME_CITY;
    const icon = create('span', 'map-player');
    icon.style.backgroundImage = `url(assets/ui/region-map/player-${this.game.profile.trainer === 'leaf' ? 'leaf' : 'red'}.png)`;
    const from = cityPoint(this.playerCity ?? city);
    const to = cityPoint(city);
    icon.style.setProperty('--x', from.x);
    icon.style.setProperty('--y', from.y);
    map.appendChild(icon);
    if (this.playerCity && this.playerCity !== city) {
      // outra fase (escolhida no mapa, ou a nova depois de uma vitória): ele anda até lá
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
    // o Voltar para a Vila fica embaixo do mapa (0.30): o mapa usa o resto da altura
    const foot = frame.querySelector?.('.lobby-map-foot')?.getBoundingClientRect?.().height ?? 0;
    const dpr = window.devicePixelRatio || 1;
    const fit = Math.min((box.width - 24) / REGION_MAP.width, (box.height - 24 - (foot ? foot + 26 : 0)) / REGION_MAP.height);
    const device = Math.max(1, Math.floor(fit * dpr));
    map.style.setProperty('--mpx', `${device / dpr}px`);
  }

  /* ============================== o painel ============================== */

  _panel() {
    if (this.selected?.startsWith('place:')) { this._placePanel(this.selected.slice(6)); return; }
    const panel = clear(el('lobby-panel'));
    const stage = STAGES[this.selected];
    const cleared = storyProgress(this.campaign);
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

    // o cabeçalho (0.31): o salão do líder (tools/assets/gym_banners.py), o líder em
    // 2x por cima, no canto de baixo, e a pílula do tipo do ginásio no canto de cima
    const banner = create('div', 'panel-banner');
    const hall = [...(stage.segments ?? [])].reverse().find((segment) => segment.scene)?.scene;
    if (hall) banner.style.backgroundImage = `url(assets/ui/gym-banners/${hall}.png)`;
    if (leader) {
      const portrait = create('img', `panel-banner-leader${unlocked ? '' : ' silhouette'}`);
      portrait.src = assetUrl(leader.portrait) ?? spriteUrl(leader.dex);
      portrait.alt = leader.name;
      banner.appendChild(portrait);
      if (leader.type) {
        const type = create('span', 'type-tag panel-type', typeName(leader.type));
        type.style.background = typeColor(leader.type);
        banner.appendChild(type);
      }
    }
    // as fraquezas do time do líder (0.32), embaixo da pílula do tipo: os 3 tipos
    // que mais batem nele; a lista inteira e as resistências ficam na dica
    const { weak, resist } = teamWeaknesses(leaderTeamTypes(stage, this.campaign.starter));
    if (weak.length) {
      const plate = create('div', 'panel-weak');
      plate.appendChild(create('span', 'panel-weak-label', 'Fraco'));
      for (const { type } of weak.slice(0, 3)) {
        const pill = create('span', 'type-tag', typeName(type));
        pill.style.background = typeColor(type);
        plate.appendChild(pill);
      }
      const names = (list) => list.map(({ type, avg }) => `${typeName(type)}${avg >= 3 ? ' (4x)' : avg === 0 ? ' (imune)' : ''}`).join(', ');
      plate.title = `Fraco a: ${names(weak)}${resist.length ? `\nResiste a: ${names(resist)}` : ''}`;
      banner.appendChild(plate);
    }
    panel.appendChild(banner);

    const head = create('div', 'panel-head');
    head.appendChild(create('span', 'panel-chapter', chapter ?? ''));
    head.appendChild(create('h3', '', title ?? stage.name));
    panel.appendChild(head);

    // a faixa do líder: o nome, a insígnia, uma Poké Ball por Pokémon e a insígnia apagada até vencer
    if (leader) {
      const strip = create('div', 'panel-strip');
      const who = create('div', 'panel-strip-who');
      // na Liga o título da fase já é o nome do líder (Lorelei): a faixa fica só com as Poké Balls
      if (leader.name.toLowerCase() !== (title ?? '').toLowerCase()) who.appendChild(create('b', '', unlocked ? leader.name : '???'));
      if (leader.badge) who.appendChild(create('span', 'panel-badge-name', leader.badge));
      const team = (stage.bossTeamByStarter?.[this.campaign.starter] ?? stage.bossTeam ?? []).length;
      if (team) {
        const balls = create('span', 'panel-balls');
        balls.title = `${team} Pokémon`;
        for (let i = 0; i < team; i++) {
          const ball = create('img');
          ball.src = 'assets/items/poke-ball.png';
          ball.alt = '';
          balls.appendChild(ball);
        }
        who.appendChild(balls);
      }
      strip.appendChild(who);
      if (leader.badgeIndex) {
        const badge = create('img', `panel-badge${done ? '' : ' missing'}`);
        badge.src = badgeUrl(leader.badgeIndex);
        badge.alt = done ? leader.badge : '';
        badge.title = done ? leader.badge : 'Ainda não conquistada';
        strip.appendChild(badge);
      }
      panel.appendChild(strip);
    }

    // o caminho e a duração, numa linha só
    const trail = (stage.segments ?? []).map((seg) => seg.name).join(' → ');
    panel.appendChild(create('p', 'panel-trail', `${trail} · ${formatTime(stage.duration)}`));

    // a trava da história (H-4): o que fecha o caminho e para onde ir (sem spoiler: a Usina)
    const held = storyLocked(stage.id, cleared);
    if (held) {
      const lock = create('div', 'panel-lock');
      lock.appendChild(create('p', '', held.text));
      const place = held.place && this.places.some(([id]) => id === held.place);
      const go = create('button', 'panel-lock-go', held.go);
      go.type = 'button';
      go.id = 'panel-lock-go';
      go.disabled = !place;
      go.onclick = () => { this.selected = `place:${held.place}`; this.render(); };
      lock.appendChild(go);
      panel.appendChild(lock);
    }

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

    // as métricas da fase, as mesmas do estojo: só depois da primeira tentativa (antes eram só "—")
    const stats = { ...emptyStageStats(), ...this.campaign.stageStats?.[stage.id] };
    if (stats.attempts) {
      // numa linha só, para o JOGAR e o estojo caberem sem rolar
      const line = create('p', 'panel-metrics');
      const add = (label, value) => line.appendChild(create('span', '', `${label} <b>${value}</b>`));
      add('Vitórias', `${stats.wins}/${stats.attempts}`);
      add('Melhor', stats.bestTime !== null ? formatTime(stats.bestTime) : '—');
      add('Desmaios', stats.fewestFaints !== null ? String(stats.fewestFaints) : '—');
      panel.appendChild(line);
    }

    // JOGAR, grande e vermelho, com a Poké Ball; o estojo vira um link embaixo
    const actions = create('div', 'panel-actions');
    const play = create('button', 'panel-play');
    play.type = 'button';
    play.innerHTML = `<img src="assets/items/poke-ball.png" alt="" /><span>${!unlocked ? 'Bloqueada' : done ? 'Jogar de novo' : 'Jogar'}</span>`;
    play.disabled = !unlocked;
    play.onclick = () => this.game.startStage(stage.id);
    actions.appendChild(play);
    const caseBtn = create('button', 'panel-link');
    caseBtn.type = 'button';
    caseBtn.textContent = 'Ver no estojo';
    caseBtn.onclick = () => this.game.menus.showModal('modal-badges', { stageId: stage.id });
    actions.appendChild(caseBtn);
    panel.appendChild(actions);
  }

  /** O painel de um lugar da história (0.39): o que se sabe dele e o botão da visita. */
  _placePanel(id) {
    const panel = clear(el('lobby-panel'));
    const place = STORY_PLACES[id];
    const seen = this.campaign.scenes?.[place.scene] === 'seen';
    const head = create('div', 'panel-head');
    head.appendChild(create('span', 'panel-chapter', place.area));
    head.appendChild(create('h3', '', place.name));
    panel.appendChild(head);
    panel.appendChild(create('p', 'panel-place-text', seen ? place.seenText : place.text));
    const actions = create('div', 'panel-actions');
    const go = create('button', 'panel-play');
    go.type = 'button';
    go.innerHTML = `<span>${seen ? place.goSeen : place.go}</span>`;
    go.onclick = () => this.game.visitPlace(id);
    actions.appendChild(go);
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
