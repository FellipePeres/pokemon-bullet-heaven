import { el, create, clear } from './dom.js';
import { getPokemon } from '../data/pokemon.js';
import { STAGES, isStageUnlocked, storyProgress } from '../data/stages.js';
import { getTrainerLook } from '../data/trainers.js';
import { emptyStageStats } from '../systems/stageStats.js';
import { badgeUrl, spriteUrl } from '../render/sprites.js';
import { assetUrl } from '../render/assets.js';
import { formatTime } from '../core/utils.js';

/**
 * O ESTOJO DE INSÍGNIAS (0.13) — o Cartão de Treinador azul do FireRed (a arte
 * do Pokemon All), com as 8 insígnias nas casas dele, a Liga embaixo e, ao
 * lado, as métricas da fase escolhida (systems/stageStats.js).
 *
 * O cartão é composto em pixels do GBA (240x160) e ampliado em escala inteira
 * por `--cpx`; as casas das insígnias ficam onde a arte as desenha.
 */

/** A casa da insígnia N (0 a 7) no cartão, em pixels de 1x. */
const slotRect = (i) => ({ x: 32 + 24 * i, y: 128, w: 16, h: 16 });

function place(node, rect) {
  node.style.setProperty('--x', rect.x);
  node.style.setProperty('--y', rect.y);
  node.style.setProperty('--w', rect.w);
  node.style.setProperty('--h', rect.h);
  return node;
}

const playTime = (seconds) => {
  const minutes = Math.floor((seconds ?? 0) / 60);
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
};

export class BadgeCase {
  constructor(game) {
    this.game = game;
    this.selected = null;
  }

  get campaign() { return this.game.campaign; }

  get stages() {
    return this.game.region.campaign.filter((entry) => entry.stage).map((entry) => STAGES[entry.stage]);
  }

  open({ stageId } = {}) {
    const cleared = storyProgress(this.campaign);
    this.selected = stageId ?? [...this.stages].reverse().find((s) => cleared.includes(s.id))?.id ?? this.stages[0].id;
    this.render();
  }

  render() {
    const gyms = this.stages.filter((s) => s.leader?.badgeIndex);
    const league = this.stages.filter((s) => !s.leader?.badgeIndex);
    const cleared = storyProgress(this.campaign);
    el('badges-sub').textContent =
      `${gyms.filter((s) => cleared.includes(s.id)).length} de ${gyms.length} insígnias · Liga: ${league.filter((s) => cleared.includes(s.id)).length} de ${league.length}`;
    this._card(gyms);
    this._league(league);
    this._stats();
  }

  /** O cartão: o treinador, os números dele e as 8 casas. */
  _card(gyms) {
    const game = this.game;
    const card = clear(el('trainer-card'));
    const trainer = getTrainerLook(game.profile.trainer);
    card.appendChild(place(create('span', 'card-title', 'Cartão de Treinador'), { x: 136, y: 16, w: 88, h: 16 }));
    const lines = [
      [game.playerName, ''],
      ['Pokédex', String(game.tracker.dexProgress.caught)],
      ['Shards', (game.profile.shards ?? 0).toLocaleString('pt-BR')],
      ['Tempo', playTime(game.profile.stats.playTime)]
    ];
    [36, 64, 80, 96].forEach((y, i) => {
      const line = place(create('span', `card-line${i === 0 ? ' name' : ''}`), { x: 28, y, w: 110, h: 16 });
      line.appendChild(create('span', '', lines[i][0]));
      if (lines[i][1]) line.appendChild(create('b', '', lines[i][1]));
      card.appendChild(line);
    });
    const portrait = place(create('img', 'card-trainer'), { x: 164, y: 52, w: 64, h: 64 });
    portrait.src = assetUrl(trainer.portrait);
    portrait.alt = '';
    card.appendChild(portrait);

    const cleared = storyProgress(this.campaign);
    gyms.forEach((stage, i) => {
      const slot = place(create('button', `card-slot${stage.id === this.selected ? ' on' : ''}`), slotRect(i));
      slot.type = 'button';
      slot.title = stage.leader.badge;
      if (cleared.includes(stage.id)) {
        const badge = create('img');
        badge.src = badgeUrl(stage.leader.badgeIndex);
        badge.alt = stage.leader.badge;
        slot.appendChild(badge);
      }
      slot.onclick = () => { this.selected = stage.id; this.render(); };
      card.appendChild(slot);
    });
  }

  /** A Liga e o Campeão, embaixo do cartão. */
  _league(league) {
    const row = clear(el('league-row'));
    const cleared = storyProgress(this.campaign);
    row.appendChild(create('span', 'league-label', 'Liga'));
    for (const stage of league) {
      const chip = create('button', `league-chip${stage.id === this.selected ? ' on' : ''}${cleared.includes(stage.id) ? ' done' : ''}`);
      chip.type = 'button';
      const img = create('img');
      img.src = assetUrl(stage.leader?.portrait) ?? spriteUrl(stage.leader?.dex);
      img.alt = '';
      if (!isStageUnlocked(stage.id, cleared)) img.classList.add('silhouette');
      chip.appendChild(img);
      chip.title = stage.name;
      chip.onclick = () => { this.selected = stage.id; this.render(); };
      row.appendChild(chip);
    }
  }

  /** As métricas da fase escolhida. */
  _stats() {
    const box = clear(el('badge-stats'));
    const stage = STAGES[this.selected];
    const cleared = storyProgress(this.campaign);
    const won = cleared.includes(stage.id);
    const stats = { ...emptyStageStats(), ...this.campaign.stageStats?.[stage.id] };
    const leader = stage.leader;

    const head = create('div', 'stats-head');
    const portrait = create('img', `leader-portrait${isStageUnlocked(stage.id, cleared) ? '' : ' silhouette'}`);
    portrait.src = assetUrl(leader?.portrait) ?? spriteUrl(leader?.dex);
    portrait.alt = '';
    head.appendChild(portrait);
    const title = create('div');
    title.appendChild(create('h4', '', stage.name));
    title.appendChild(create('p', 'stats-state', won
      ? `${leader?.badge ? `${leader.badge} conquistada` : 'Vencida'}${stats.firstWin ? ` em ${new Date(stats.firstWin.date).toLocaleDateString('pt-BR')}` : ''}`
      : isStageUnlocked(stage.id, cleared) ? 'Ainda não vencida' : 'Bloqueada'));
    head.appendChild(title);
    box.appendChild(head);

    const list = create('dl', 'stats-list');
    const add = (label, value) => { list.appendChild(create('dt', '', label)); list.appendChild(create('dd', '', value)); };
    add('Vitórias', stats.attempts ? `${stats.wins} de ${stats.attempts}` : '—');
    add('Melhor tempo', stats.bestTime !== null ? formatTime(stats.bestTime) : '—');
    add('Menos desmaios numa vitória', stats.fewestFaints !== null ? String(stats.fewestFaints) : '—');
    add('Maior nível', stats.bestLevel ? `Nv. ${stats.bestLevel}` : '—');
    add('Capturas na fase', stats.attempts ? String(stats.captures) : '—');
    add('Dano total', stats.attempts ? stats.damage.toLocaleString('pt-BR') : '—');
    box.appendChild(list);

    if (stats.firstWin?.team?.length) {
      box.appendChild(create('p', 'stats-team-label', 'A equipe da primeira vitória'));
      const team = create('div', 'stats-team');
      for (const member of stats.firstWin.team) {
        const data = getPokemon(member.pokemonId);
        const mon = create('span', 'stats-mon');
        const icon = create('span', 'team-icon');
        icon.style.backgroundImage = `url(assets/pokemon/gen3/icons/${data.dex}.png)`;
        mon.appendChild(icon);
        mon.appendChild(create('span', '', `Nv.${member.level}`));
        mon.title = data.name;
        team.appendChild(mon);
      }
      box.appendChild(team);
    } else if (!stats.attempts) {
      box.appendChild(create('p', 'stats-empty', 'As métricas começam a contar na próxima vez que você jogar esta fase.'));
    }
  }
}
