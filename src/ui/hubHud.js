import { el, create, clear, show, hide } from './dom.js';
import { getTrainerLook } from '../data/trainers.js';
import { STAGES } from '../data/stages.js';
import { assetUrl } from '../render/assets.js';
import { badgeUrl } from '../render/sprites.js';
import { iconHTML } from '../render/icons.js';

/**
 * A INTERFACE DA VILA — a barra do topo (o treinador, o estojo, Shards e
 * Pokédex, as janelas e o Mapa da jornada em destaque), a caixa de texto do
 * FireRed com a plaquinha de quem fala, o SIM/NÃO e a placa com o nome do
 * lugar ao chegar. A regra está em game/Hub.js; aqui só se mostra.
 *
 * `update` roda a cada quadro, então só mexe no DOM quando algo muda.
 */
export class HubHUD {
  constructor(game) {
    this.game = game;
    this.shown = {};
    el('hub-btn-map').onclick = () => game.hubOpenMap();
    el('hub-btn-save').onclick = () => game.saveToFile();
    el('hub-choice-yes').onclick = () => this._pick(0);
    el('hub-choice-no').onclick = () => this._pick(1);
    // clicar na caixa de texto avança, como o A
    el('hub-dialog-box').onclick = () => game.hub.confirm();
    // depois do clique, o botão solta o foco: Enter e Espaço ficam para a vila
    el('hub-bar').addEventListener('click', (e) => e.target?.closest?.('button')?.blur?.());
  }

  _pick(choice) {
    const hub = this.game.hub;
    if (!hub.dialog?.ask) return;
    hub.dialog.ask.choice = choice;
    hub.confirm();
  }

  /** A barra do topo: muda pouco (ao abrir a vila e ao fechar uma janela). */
  render() {
    const game = this.game;
    const campaign = game.campaign;
    const look = getTrainerLook(game.profile.trainer);
    el('hub-trainer').src = assetUrl(look.portrait);
    el('hub-trainer').alt = look.name;
    el('hub-title').textContent = `${look.name} · ${game.region.name}`;

    const mini = clear(el('hub-case'));
    const stages = game.region.campaign.filter((e) => e.stage).map((e) => STAGES[e.stage]);
    for (const stage of stages.filter((s) => s.leader?.badgeIndex)) {
      const badge = create('img', campaign.badges.includes(stage.leader.badge) ? 'got' : '');
      badge.src = badgeUrl(stage.leader.badgeIndex);
      badge.alt = '';
      mini.appendChild(badge);
    }
    mini.title = `Estojo de Insígnias — ${campaign.badges.length} de 8`;

    const dex = game.tracker.dexProgress;
    el('hub-stats').innerHTML =
      `<span class="lobby-chip">${iconHTML('shards', 20)}<b>${(game.profile.shards ?? 0).toLocaleString('pt-BR')}</b> Shards</span>` +
      `<span class="lobby-chip">${iconHTML('pokedex', 20)}<b>${dex.caught}</b>/${dex.total}</span>`;

    // o mapa só abre depois do inicial (seção 4 do planejamento)
    const map = el('hub-btn-map');
    map.classList.toggle('locked', !campaign.starter);
    map.title = campaign.starter ? 'Mapa da jornada: escolha a próxima fase' : 'Fale com o Prof. Carvalho primeiro';
    el('hub-achievements').classList.toggle('alert', game.tracker.claimableAchievements.length > 0);
    this.shown = {};
  }

  /** A caixa de texto e a placa do lugar, a cada quadro. */
  update(hub) {
    const d = hub.dialog;
    const page = d ? d.pages[d.index] : null;
    const text = page ? page.slice(0, Math.floor(d.shown)) : null;
    const asking = !!d && hub._onAsk();
    const done = !!page && d.shown >= page.length;

    if (this._changed('open', !!d)) (d ? show : hide)(el('hub-dialog'));
    if (d) {
      if (this._changed('name', d.name ?? '')) {
        el('hub-dialog-name').textContent = d.name ?? '';
        (d.name ? show : hide)(el('hub-dialog-name'));
      }
      if (this._changed('text', text)) el('hub-dialog-text').textContent = text;
      if (this._changed('next', done && !asking)) el('hub-dialog-next').classList.toggle('on', done && !asking);
      if (this._changed('asking', asking)) (asking ? show : hide)(el('hub-dialog-choices'));
      if (asking && this._changed('choice', d.ask.choice)) {
        el('hub-choice-yes').classList.toggle('pick', d.ask.choice === 0);
        el('hub-choice-no').classList.toggle('pick', d.ask.choice === 1);
      }
    }

    const banner = hub.banner?.text ?? null;
    if (this._changed('banner', banner)) {
      el('hub-place').textContent = banner ?? '';
      (banner ? show : hide)(el('hub-place'));
    }
  }

  _changed(key, value) {
    if (this.shown[key] === value) return false;
    this.shown[key] = value;
    return true;
  }
}
