import { el, create, clear } from './dom.js';
import { getPokemon } from '../data/pokemon.js';
import { STAGES, isStageUnlocked } from '../data/stages.js';
import { getRegion } from '../data/regions.js';
import { getTrainerLook, trainerName } from '../data/trainers.js';
import { badgeUrl } from '../render/sprites.js';
import { assetUrl } from '../render/assets.js';
import { CONFIG } from '../core/config.js';

/**
 * A TELA DE JORNADAS (0.19, pedido do Fellipe: "no lugar de continuar, estar
 * escrito Jornada; quando clica, aparecem os espaços das jornadas que você fez,
 * podendo fazer mais de uma com novos Pokémon, e voltar para a outra").
 *
 * Um card por jornada começada (treinador, inicial, insígnias, equipe, a
 * próxima fase e quando foi jogada), com Jogar (sempre para a vila, 0.29) e Apagar
 * (que confirma no próprio card); os espaços livres têm Nova jornada. As regras
 * ficam no Game (`listJourneys`, `openJourney`, `newJourney`, `deleteJourney`).
 */
export class JourneyScreen {
  constructor(game) {
    this.game = game;
    this.confirming = null;   // o id da jornada com o "apagar?" aberto
  }

  render() {
    const grid = clear(el('journey-slots'));
    const journeys = this.game.listJourneys();
    journeys.forEach((journey, i) => grid.appendChild(this._card(journey, i)));
    for (let i = journeys.length; i < CONFIG.save.maxJourneys; i++) grid.appendChild(this._empty(i));
  }

  _card(journey, index) {
    const { progress } = journey;
    const region = getRegion(journey.region);
    const look = getTrainerLook(journey.trainer);
    const card = create('div', `journey-card${journey.active ? ' active' : ''}`);

    // o treinador e o número da jornada
    const head = create('div', 'journey-head');
    const portrait = create('img', 'journey-portrait');
    portrait.src = assetUrl(look.portrait);
    const name = trainerName(journey.trainer, journey.trainerName);
    portrait.alt = name;
    const who = create('div', 'journey-who');
    who.append(create('b', '', `Jornada ${index + 1}`), create('span', '', `${name} · ${region.name}`));
    head.append(portrait, who);
    if (journey.active) head.appendChild(create('span', 'journey-tag', 'Atual'));
    card.appendChild(head);

    // o estojo: as 8 insígnias, apagadas as que faltam
    const stages = region.campaign.filter((entry) => entry.stage).map((entry) => STAGES[entry.stage]);
    const badges = create('div', 'journey-badges');
    for (const stage of stages.filter((s) => s.leader?.badgeIndex)) {
      const badge = create('img', progress.badges.includes(stage.leader.badge) ? 'got' : '');
      badge.src = badgeUrl(stage.leader.badgeIndex);
      badge.alt = '';
      badges.appendChild(badge);
    }
    badges.title = `${progress.badges.length} de 8 insígnias`;
    card.appendChild(badges);

    // a equipe (ou só o inicial, antes da primeira vitória)
    const members = progress.journey?.team?.members?.length
      ? progress.journey.team.members
      : [{ pokemonId: progress.starter, level: 1, shiny: !!progress.starterShiny }];
    const team = create('div', 'journey-team');
    // desde a 0.29 o inicial vem do Prof. Carvalho, na vila: a jornada pode existir sem ele
    if (!progress.starter) team.appendChild(create('span', 'journey-date', 'Ainda sem Pokémon: o Prof. Carvalho espera no laboratório.'));
    for (const member of members.slice(0, 6)) {
      const data = getPokemon(member.pokemonId);
      if (!data) continue;
      const mon = create('span', 'journey-mon');
      const icon = create('span', 'team-icon');
      icon.style.backgroundImage = `url(assets/pokemon/gen3/icons/${data.dex}.png)`;
      mon.append(icon, create('span', 'team-lv', `Nv.${member.level}`));
      mon.title = `${member.shiny ? '✦ ' : ''}${data.name}, Nv. ${member.level}`;
      team.appendChild(mon);
    }
    card.appendChild(team);

    // onde ela está
    const cleared = progress.clearedStages;
    const next = stages.find((s) => !cleared.includes(s.id) && isStageUnlocked(s.id, cleared));
    const champion = cleared.includes(stages.at(-1)?.id);
    card.appendChild(create('p', 'journey-next', champion && !next ? `Campeã de ${region.name}!`
      : `Próxima: ${next ? next.name : stages[0].name}`));
    if (journey.updatedAt) {
      card.appendChild(create('p', 'journey-date', `Jogada em ${new Date(journey.updatedAt).toLocaleDateString('pt-BR')}`));
    }

    // Jogar e Apagar (que pergunta antes, no próprio card)
    const actions = create('div', 'journey-actions');
    if (this.confirming === journey.id) {
      actions.appendChild(create('p', 'journey-confirm',
        'Apagar esta jornada? As insígnias, a equipe e o PC dela se perdem. A Pokédex, as conquistas e os Shards ficam.'));
      const yes = create('button', 'menu-btn danger slim', 'Sim, apagar');
      yes.type = 'button';
      yes.onclick = () => { this.confirming = null; this.game.deleteJourney(journey.id); this.render(); };
      const no = create('button', 'menu-btn slim', 'Não');
      no.type = 'button';
      no.onclick = () => { this.confirming = null; this.render(); };
      actions.append(yes, no);
    } else {
      // sempre para a vila (0.29; na 0.24, o mapa): a partida que ficou no meio já entrou nela
      const play = create('button', 'menu-btn primary', 'Jogar');
      play.type = 'button';
      play.onclick = () => this.game.openJourney(journey.id);
      const remove = create('button', 'menu-btn ghost slim journey-delete', 'Apagar');
      remove.type = 'button';
      remove.onclick = () => { this.confirming = journey.id; this.render(); };
      actions.append(play, remove);
    }
    card.appendChild(actions);
    return card;
  }

  _empty(index) {
    const card = create('div', 'journey-card empty');
    card.appendChild(create('b', 'journey-free', `Espaço ${index + 1}`));
    card.appendChild(create('p', 'journey-date', 'Livre: outro treinador, outro inicial, outra jornada.'));
    const start = create('button', 'menu-btn primary', 'Nova jornada');
    start.type = 'button';
    start.onclick = () => this.game.newJourney();
    card.appendChild(start);
    return card;
  }
}
