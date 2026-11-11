import { el } from './dom.js';

/** Onde o rastreador completo aparece: a vila e o mapa da jornada. */
const SPOTS = ['hub-quest', 'lobby-quest'];
/** O tempo da comemoração ("Missão concluída!") antes da próxima entrar. */
const FLASH_MS = 1700;
const STORE_KEY = 'pbh-quest-collapsed';

const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function readCollapsed() {
  try { return globalThis.localStorage?.getItem(STORE_KEY) === '1'; } catch { return false; }
}
function writeCollapsed(value) {
  try { globalThis.localStorage?.setItem(STORE_KEY, value ? '1' : '0'); } catch { /* sem armazenamento: só nesta sessão */ }
}

/**
 * O RASTREADOR DE QUESTS (PLANEJAMENTO-HISTORIA.md, seção 7.2): a janela do
 * FireRed no canto superior direito da vila e do mapa da jornada, com a quest
 * de história ("◆ Prólogo · Fale com a mãe 0/1") e até duas outras. Na partida,
 * só uma linha na plaquinha da fase, e só se a quest for daquela fase.
 *
 * Quando uma quest fecha, ela fica um instante na tela com o ✓ e o "Missão
 * concluída!", e a próxima entra deslizando. Um clique recolhe ou abre o
 * rastreador (o navegador lembra a escolha). A regra está em
 * systems/QuestSystem.js; aqui só se mostra.
 */
export class QuestTracker {
  constructor(game) {
    this.game = game;
    this.flash = null;          // as quests que acabaram de fechar (a comemoração)
    this.fresh = new Set();     // as que acabaram de abrir (entram deslizando)
    this.shownIds = [];         // as que estavam na tela (para saber quem é nova)
    this.timer = null;
    this.collapsed = readCollapsed();
    for (const id of SPOTS) {
      const node = el(id);
      if (node) node.onclick = () => this.toggle();
    }
  }

  toggle() {
    this.collapsed = !this.collapsed;
    writeCollapsed(this.collapsed);
    this.render();
  }

  /** Quests que acabaram de fechar: a comemoração e, depois, as seguintes. */
  celebrate(ids) {
    if (!ids.length) return;
    const quests = this.game.quests;
    this.flash = ids.map((id) => quests.view(id));
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.flash = null;
      const now = quests.tracked().map((q) => q.id);
      this.fresh = new Set(now.filter((id) => !this.shownIds.includes(id)));
      this.render();
    }, FLASH_MS);
    this.render();
  }

  /** Redesenha o rastreador da vila e o do mapa da jornada. */
  render() {
    const list = this.flash ?? this.game.quests.tracked();
    if (!this.flash) this.shownIds = list.map((q) => q.id);
    const html = list.map((quest, i) => this._item(quest, i)).join('');
    for (const id of SPOTS) {
      const node = el(id);
      if (!node) continue;
      node.innerHTML = html;
      node.classList.toggle('hidden', !html);
      node.classList.toggle('collapsed', this.collapsed);
      node.title = this.collapsed ? 'Missões: clique para mostrar' : 'Missões: clique para recolher';
    }
    if (!this.flash) this.fresh.clear();
  }

  _item(quest, index) {
    const classes = ['quest-item', `quest-${quest.kind}`];
    if (quest.done) classes.push('done');
    if (this.fresh.has(quest.id)) classes.push('enter');
    if (index > 0) classes.push('more');
    const objectives = quest.objectives.map((o) => {
      const met = o.have >= o.count;
      return `<p class="quest-obj${met ? ' met' : ''}"><span>${met ? '✓ ' : ''}${esc(o.text)}</span><b>${o.have}/${o.count}</b></p>`;
    }).join('');
    const tag = quest.done ? '<p class="quest-done-tag">Missão concluída!</p>' : '';
    return `<div class="${classes.join(' ')}"><p class="quest-title"><i aria-hidden="true">◆</i>${esc(quest.title)}</p>${objectives}${tag}</div>`;
  }

  /** A linha da partida: a quest que pede vencer esta fase, ou nada. */
  renderRun(stage) {
    const node = el('hud-quest');
    if (!node) return;
    const quest = stage ? this.game.quests.forStage(stage.id) : null;
    const objective = quest?.objectives.find((o) => o.on === 'win' && o.target === stage.id);
    node.textContent = objective ? `◆ ${objective.text} ${objective.have}/${objective.count}` : '';
    node.classList.toggle('hidden', !objective);
  }
}
