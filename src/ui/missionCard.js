import { el, create, clear, show, hide } from './dom.js';
import { typeName, typeColor } from '../data/types.js';
import { getMission } from '../data/missions.js';
import { MAX_LEVEL } from '../data/levelCap.js';

/**
 * O CARD DE UMA MISSÃO DE LENDÁRIO (0.39): o mesmo painel do mapa da jornada (as classes
 * panel-* de ui/lobby.js) e do salão do Kyogre (ui/hallCard.js), com a foto do lendário,
 * o tipo, as fraquezas, as bolas da luta, o nível recomendado, LUTAR e Voltar.
 */
export function showMissionCard(game, missionId, { onPlay, onBack }) {
  const mission = getMission(missionId);
  const panel = clear(el('mission-card'));

  const banner = create('div', 'panel-banner');
  banner.style.backgroundImage = `url(${mission.banner})`;
  const art = create('img', 'panel-banner-leader');
  art.src = `assets/pokemon/gen3/front/${mission.dex}.png`;
  art.alt = mission.name;
  banner.appendChild(art);
  const type = create('span', 'type-tag panel-type', typeName(mission.type));
  type.style.background = typeColor(mission.type);
  banner.appendChild(type);
  const plate = create('div', 'panel-weak');
  plate.appendChild(create('span', 'panel-weak-label', 'Fraco'));
  for (const t of mission.weak) {
    const pill = create('span', 'type-tag', typeName(t));
    pill.style.background = typeColor(t);
    plate.appendChild(pill);
  }
  plate.title = `Fraco a: ${mission.weak.map(typeName).join(', ')}`;
  banner.appendChild(plate);
  panel.appendChild(banner);

  const head = create('div', 'panel-head');
  head.appendChild(create('span', 'panel-chapter', mission.place));
  head.appendChild(create('h3', '', mission.title));
  panel.appendChild(head);

  const strip = create('div', 'panel-strip');
  const who = create('div', 'panel-strip-who');
  who.appendChild(create('b', '', mission.name));
  who.appendChild(create('span', 'panel-badge-name', mission.about));
  const balls = create('span', 'panel-balls');
  if (mission.balls) {
    balls.title = `${mission.balls.count} ${mission.balls.name} por luta, ${Math.round(mission.balls.chance * 100)}% de captura em cada`;
    for (let i = 0; i < mission.balls.count; i++) {
      const ball = create('img');
      ball.src = mission.balls.icon;
      ball.alt = '';
      balls.appendChild(ball);
    }
    balls.appendChild(create('span', 'panel-balls-text', `${mission.balls.count} ${mission.balls.name} · ${Math.round(mission.balls.chance * 100)}% cada`));
  } else {
    // a luta sem captura (o Zapdos, H-6): a captura dele fica para outro momento
    balls.appendChild(create('span', 'panel-balls-text', 'Sem captura nesta luta'));
  }
  who.appendChild(balls);
  strip.appendChild(who);
  panel.appendChild(strip);

  panel.appendChild(create('p', 'panel-trail', mission.trail));

  const members = game.campaign.journey?.team?.members ?? [];
  const team = members.length ? Math.round(members.reduce((sum, m) => sum + m.level, 0) / members.length) : 1;
  const gap = mission.recommendedLevel - team;
  const line = create('p', `panel-level ${gap <= 0 ? 'ok' : gap <= 5 ? 'close' : 'far'}`);
  const cap = game.levelCap();   // o Level Cap
  line.innerHTML = `Nível recomendado <b>${mission.recommendedLevel}</b> · sua equipe <b>${team}</b>`
    + (cap < MAX_LEVEL ? `<br>Teto de nível <b>${cap}</b>` : '');
  panel.appendChild(line);

  const actions = create('div', 'panel-actions');
  const play = create('button', 'panel-play');
  play.type = 'button';
  play.id = 'mission-play';
  play.innerHTML = `<img src="${mission.balls?.icon ?? 'assets/items/poke-ball.png'}" alt="" /><span>Lutar</span>`;
  play.onclick = () => onPlay();
  actions.appendChild(play);
  const back = create('button', 'menu-btn hall-back');
  back.type = 'button';
  back.id = 'mission-back';
  back.innerHTML = '<span class="btn-text">Voltar</span>';
  back.onclick = () => onBack();
  actions.appendChild(back);
  actions.appendChild(create('p', 'hall-note', mission.note));
  panel.appendChild(actions);
  show(panel);
}

export function hideMissionCard() { hide(el('mission-card')); }
