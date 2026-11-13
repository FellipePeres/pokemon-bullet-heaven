import { el, clear, create } from './dom.js';
import { CHAPTERS, QUESTS } from '../data/quests.js';
import { KEY_ITEMS, getMartItem } from '../data/items.js';

const KIND = { story: 'História', legendary: 'Lendário', side: 'Secundária' };

/** Um elemento com texto puro (os textos das quests nunca viram HTML). */
function t(tag, className, text) {
  const node = create(tag, className);
  node.textContent = text;
  return node;
}

/**
 * A recompensa de uma quest em texto (H-12): "300 Shards · Reviver", "400 Shards · 2× Novo Sorteio".
 * Vazio sem recompensa. O rastreador, o toast e a tela de missões usam o mesmo texto.
 */
export function rewardText(reward) {
  if (!reward) return '';
  const parts = [];
  if (reward.shards) parts.push(`${reward.shards} Shards`);
  for (const [id, count] of Object.entries(reward.items ?? {})) {
    const name = getMartItem(id)?.name ?? id;
    parts.push(count > 1 ? `${count}× ${name}` : name);
  }
  return parts.join(' · ');
}

/** "11/11" a partir da data ISO do fim da quest (ou nada, nas que fecharam em silêncio). */
function shortDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Os objetivos de uma quest, com o ✓ e o "1/1", como no rastreador. */
function objectives(view) {
  const list = create('ul', 'ql-objs');
  for (const o of view.objectives) {
    const met = o.have >= o.count;
    const li = create('li', met ? 'met' : '');
    li.appendChild(t('span', '', `${met ? '✓ ' : ''}${o.text}`));
    li.appendChild(t('b', '', `${o.have}/${o.count}`));
    list.appendChild(li);
  }
  return list;
}

/**
 * A TELA DE MISSÕES (H-3, PLANEJAMENTO-HISTORIA.md seção 7.3): o diário da jornada.
 * Em cima, o que fazer agora (as quests ativas, com a descrição e os objetivos); embaixo,
 * o que já aconteceu, por capítulo, na ordem em que aconteceu; no fim, os itens
 * importantes que a história deu. Só aparece o que o jogador já viu: nenhuma quest
 * futura (sem spoiler, regra do Fellipe). A regra está em systems/QuestSystem.js.
 */
export function buildQuestLog(game) {
  const quests = game.quests;
  const state = quests.state;
  const body = clear(el('quests-log'));
  const active = quests.activeViews();
  const done = Object.entries(state?.done ?? {})
    .filter(([id]) => QUESTS[id])
    .map(([id, record]) => ({ view: quests.view(id), at: record.at ?? null }))
    .sort((a, b) => (a.at ?? '').localeCompare(b.at ?? ''));

  // a última quest da história (H-11) fechada: a história de Kanto acabou (a lapidação)
  const ended = !!state?.done?.c8_lagoa;
  el('quests-sub').textContent = active.length
    ? `${active.length === 1 ? 'Uma missão' : `${active.length} missões`} em andamento · ${done.length} concluída${done.length === 1 ? '' : 's'}`
    : ended ? `A história de Kanto chegou ao fim · ${done.length} missões concluídas` : 'Nenhuma missão em andamento agora.';

  // ---- agora
  const now = create('section', 'ql-section');
  now.appendChild(t('h4', 'ql-head', 'Agora'));
  if (!active.length) {
    now.appendChild(t('p', 'ql-empty', ended
      ? 'A história de Kanto chegou ao fim, e continua em Pokémon Bullet Heaven 2. Até lá, dá para completar a Pokédex, capturar os lendários nas Poké Balls e encarar o Modo Livre.'
      : 'Nenhuma missão em andamento. Siga a jornada pelo mapa.'));
  }
  for (const view of active) {
    const card = create('article', `ql-card ql-${view.kind}`);
    const top = create('div', 'ql-card-top');
    top.appendChild(t('span', 'ql-chapter', view.title));
    top.appendChild(t('span', `ql-kind ql-kind-${view.kind}`, KIND[view.kind] ?? view.kind));
    card.appendChild(top);
    if (view.desc) card.appendChild(t('p', 'ql-desc', view.desc));
    card.appendChild(objectives(view));
    const reward = rewardText(view.reward);
    if (reward) card.appendChild(t('p', 'ql-reward', `Recompensa: ${reward}`));
    now.appendChild(card);
  }
  body.appendChild(now);

  // ---- o que já aconteceu, por capítulo (na ordem dos capítulos; dentro, na ordem em que fecharam)
  if (done.length) {
    const past = create('section', 'ql-section');
    past.appendChild(t('h4', 'ql-head', 'O que já aconteceu'));
    const order = Object.keys(CHAPTERS);
    const chapters = [...new Set(done.map((d) => QUESTS[d.view.id].chapter))]
      .sort((a, b) => order.indexOf(a) - order.indexOf(b));
    for (const chapter of chapters) {
      const group = create('details', 'ql-group');
      group.open = true;
      group.appendChild(t('summary', 'ql-group-title', CHAPTERS[chapter] ?? chapter));
      for (const { view, at } of done.filter((d) => QUESTS[d.view.id].chapter === chapter)) {
        const entry = create('article', `ql-entry ql-${view.kind}`);
        const head = create('div', 'ql-entry-head');
        head.appendChild(t('b', '', view.objectives[0]?.text ?? view.title));
        const when = shortDate(at);
        if (when) head.appendChild(t('span', 'ql-date', when));
        entry.appendChild(head);
        if (view.desc) entry.appendChild(t('p', 'ql-desc', view.desc));
        // os outros objetivos (o primeiro já é o título da entrada), sem o placar: está tudo feito
        if (view.objectives.length > 1) {
          const more = create('ul', 'ql-objs ql-more');
          for (const o of view.objectives.slice(1)) more.appendChild(t('li', 'met', `✓ ${o.text}`));
          entry.appendChild(more);
        }
        // a recompensa recebida, no fim da entrada (as quests de antes da H-12 fecharam sem)
        const got = view.paid ? rewardText(view.reward) : '';
        if (got) entry.appendChild(t('p', 'ql-reward got', `✓ Recebido: ${got}`));
        group.appendChild(entry);
      }
      past.appendChild(group);
    }
    body.appendChild(past);
  }

  // ---- os itens importantes (a mochila da história)
  const items = Object.entries(game.campaign?.keyItems ?? {}).filter(([id, n]) => n > 0 && KEY_ITEMS[id]);
  if (items.length) {
    const bag = create('section', 'ql-section');
    bag.appendChild(t('h4', 'ql-head', 'Itens importantes'));
    for (const [id] of items) {
      const item = KEY_ITEMS[id];
      const row = create('div', 'ql-item');
      if (item.icon) {
        const img = create('img', 'ql-item-icon');
        img.src = item.icon;
        img.alt = '';
        row.appendChild(img);
      }
      const text = create('div', 'ql-item-text');
      text.appendChild(t('b', '', item.name));
      text.appendChild(t('span', '', item.description));
      row.appendChild(text);
      bag.appendChild(row);
    }
    body.appendChild(bag);
  }

  // o que o jogador viu aqui deixa de ser novidade (o pontinho do botão some)
  quests.markSeen();
  questDot(game);
}

/** O pontinho no botão Missões das duas barras: uma quest nova que a tela ainda não mostrou. */
export function questDot(game) {
  const unseen = game.quests.hasUnseen();
  for (const id of ['hub-quests', 'bar-quests']) el(id)?.classList.toggle('alert', unseen);
}
