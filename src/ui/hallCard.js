import { el, create, clear, show, hide } from './dom.js';
import { STAGES } from '../data/stages.js';
import { typeName, typeColor } from '../data/types.js';

/**
 * O CARD DA FASE NO SALÃO DO KYOGRE (0.37, aprovado na maquete "O Salão do
 * Kyogre"): o mesmo painel do mapa da jornada (ui/lobby.js, as classes panel-*),
 * por cima do salão escurecido, com JOGAR e Voltar para a Vila. Depois da
 * captura, o card é o do Endless aquático.
 */
export function showHallCard(game, stageId, { onPlay, onBack }) {
  const stage = STAGES[stageId];
  const endless = !!stage.endlessOnly;
  const panel = clear(el('hall-card'));

  const banner = create('div', 'panel-banner');
  banner.style.backgroundImage = 'url(assets/ui/gym-banners/kyogre_hall.png)';
  if (!endless) {
    const kyogre = create('img', 'panel-banner-leader');
    kyogre.src = 'assets/pokemon/gen3/front/382.png';
    kyogre.alt = 'Kyogre';
    banner.appendChild(kyogre);
  }
  const type = create('span', 'type-tag panel-type', typeName('water'));
  type.style.background = typeColor('water');
  banner.appendChild(type);
  if (!endless) {
    const plate = create('div', 'panel-weak');
    plate.appendChild(create('span', 'panel-weak-label', 'Fraco'));
    for (const t of ['electric', 'grass']) {
      const pill = create('span', 'type-tag', typeName(t));
      pill.style.background = typeColor(t);
      plate.appendChild(pill);
    }
    plate.title = 'Fraco a: Elétrico, Planta';
    banner.appendChild(plate);
  }
  panel.appendChild(banner);

  const head = create('div', 'panel-head');
  head.appendChild(create('span', 'panel-chapter', 'Fase secreta'));
  head.appendChild(create('h3', '', endless ? 'A maré sem fim' : 'Caverna Marinha'));
  panel.appendChild(head);

  const strip = create('div', 'panel-strip');
  const who = create('div', 'panel-strip-who');
  if (endless) {
    who.appendChild(create('b', '', 'O SALÃO VAZIO'));
    who.appendChild(create('span', 'panel-badge-name', 'Hordas de Hoenn sem fim, na chuva'));
  } else {
    const fight = stage.legendaryFight;
    who.appendChild(create('b', '', 'KYOGRE'));
    who.appendChild(create('span', 'panel-badge-name', 'Pokémon lendário de Hoenn'));
    const balls = create('span', 'panel-balls');
    balls.title = `${fight.balls} Dive Balls por luta, ${Math.round(fight.chance * 100)}% de captura em cada`;
    for (let i = 0; i < fight.balls; i++) {
      const ball = create('img');
      ball.src = 'assets/items/dive-ball.png';
      ball.alt = '';
      balls.appendChild(ball);
    }
    balls.appendChild(create('span', 'panel-balls-text', `${fight.balls} Dive Balls · ${Math.round(fight.chance * 100)}% cada`));
    who.appendChild(balls);
  }
  strip.appendChild(who);
  panel.appendChild(strip);

  panel.appendChild(create('p', 'panel-trail', endless
    ? 'Sem ganho de XP · cada elite derrotado rende Shards · saia quando quiser'
    : `Salão do Kyogre · chuva o tempo todo · depois da captura, a maré final de 0:${stage.legendaryFight.finalTide}`));

  if (stage.recommendedLevel) {
    const members = game.campaign.journey?.team?.members ?? [];
    const team = members.length ? Math.round(members.reduce((sum, m) => sum + m.level, 0) / members.length) : 1;
    const gap = stage.recommendedLevel - team;
    const line = create('p', `panel-level ${gap <= 0 ? 'ok' : gap <= 5 ? 'close' : 'far'}`);
    line.innerHTML = `Nível recomendado <b>${stage.recommendedLevel}</b> · sua equipe <b>${team}</b>`;
    panel.appendChild(line);
  }

  const actions = create('div', 'panel-actions');
  const play = create('button', 'panel-play');
  play.type = 'button';
  play.id = 'hall-play';
  play.innerHTML = '<img src="assets/items/dive-ball.png" alt="" /><span>Jogar</span>';
  play.onclick = () => onPlay();
  actions.appendChild(play);
  const back = create('button', 'menu-btn hall-back');
  back.type = 'button';
  back.id = 'hall-back';
  back.innerHTML = '<span class="btn-text">Voltar para a Vila</span>';
  back.onclick = () => onBack();
  actions.appendChild(back);
  if (!endless) actions.appendChild(create('p', 'hall-note', 'Voltando agora, a próxima chance exige descer os 6 níveis de novo.'));
  panel.appendChild(actions);
  show(panel);
}

export function hideHallCard() { hide(el('hall-card')); }
