import { QUESTS, CHAPTERS, FIRST_QUEST } from '../data/quests.js';

const KIND_ORDER = { story: 0, legendary: 1, side: 2 };
/** Quantas quests o rastreador mostra de uma vez (a de história e mais duas). */
export const TRACKED_MAX = 3;

/** O estado das quests de uma jornada nova: só a primeira, ativa. */
export function createQuestState() {
  return { active: [FIRST_QUEST], progress: {}, done: {} };
}

/**
 * AS QUESTS DA JORNADA (PLANEJAMENTO-HISTORIA.md, seção 7). Aqui fica só a
 * regra: o estado vive na campanha da região (`campaign.quests`, salvo com a
 * jornada) e o jogo conta o que aconteceu por `notify(on, target)`. Os outros
 * sistemas não sabem nada de quest: eles emitem o evento de história
 * (EVENTS.STORY) e o Game repassa para cá.
 *
 * O `doneIf` de cada quest diz quando ela já está cumprida sem o evento. Ele
 * vale em dois momentos, sempre em silêncio (sem a comemoração):
 *   - no `sync()`, quando a jornada abre (carregar, continuar, voltar de uma
 *     fase): é assim que uma jornada de antes das quests chega no capítulo
 *     certo, em vez de começar no "Fale com a mãe";
 *   - para a quest que acabou de abrir, depois que outra fechou.
 * Fora disso, não: o inicial já escolhido não pode fechar o "Fale com o Prof.
 * Carvalho" antes de ele terminar de falar.
 *
 * `context()` devolve o que o `doneIf` olha: { starter, mapSeen, cleared }.
 */
export class QuestSystem {
  constructor({ campaign, context }) {
    this._campaign = campaign;   // () => a campanha da jornada ativa (null sem jornada)
    this._context = context;     // () => o contexto do doneIf
  }

  /** O estado das quests da jornada ativa (criado na primeira vez). */
  get state() {
    const campaign = this._campaign();
    if (!campaign) return null;
    campaign.quests ??= createQuestState();
    const state = campaign.quests;
    state.active ??= [];
    state.progress ??= {};
    state.done ??= {};
    return state;
  }

  isActive(id) { return !!this.state?.active.includes(id); }
  isDone(id) { return !!this.state?.done[id]; }

  /** A jornada abriu: as quests que ela já cumpriu fecham em silêncio. */
  sync() {
    const state = this.state;
    if (state) this._catchUp(state, state.active);
  }

  /**
   * Algo aconteceu na jornada (falou com alguém, entrou num lugar, venceu uma
   * fase...). Avança os objetivos que esperavam por isso e devolve as quests
   * que fecharam agora, na ordem, para a interface comemorar.
   */
  notify(on, target = null) {
    const state = this.state;
    if (!state) return [];
    const completed = [];
    const opened = [];
    for (const id of [...state.active]) {
      const quest = QUESTS[id];
      if (!quest) continue;
      const have = state.progress[id] ??= quest.objectives.map(() => 0);
      let moved = false;
      quest.objectives.forEach((objective, i) => {
        if (objective.on !== on) return;
        if (objective.target != null && objective.target !== target) return;
        const count = objective.count ?? 1;
        if (have[i] < count) { have[i]++; moved = true; }
      });
      if (!moved) continue;
      const next = this._complete(state, id);
      if (next) { completed.push(id); opened.push(...next); }
    }
    this._catchUp(state, opened);
    return completed;
  }

  /**
   * Abre a quest `id` por fora da cadeia (o passo `quest` das cenas, 0.39). Se a
   * jornada já cumpriu, ela fecha em silêncio. Devolve se ficou aberta.
   */
  start(id) {
    const state = this.state;
    if (!state || !QUESTS[id] || state.done[id] || state.active.includes(id)) return false;
    state.active.push(id);
    this._catchUp(state, [id]);
    return state.active.includes(id);
  }

  /** As quests do rastreador: a de história primeiro, no máximo TRACKED_MAX. */
  tracked() {
    const state = this.state;
    if (!state) return [];
    return state.active
      .filter((id) => QUESTS[id])
      .sort((a, b) => (KIND_ORDER[QUESTS[a].kind] ?? 9) - (KIND_ORDER[QUESTS[b].kind] ?? 9))
      .slice(0, TRACKED_MAX)
      .map((id) => this.view(id));
  }

  /** Uma quest pronta para mostrar: o título do capítulo e cada objetivo com o placar. */
  view(id) {
    const quest = QUESTS[id];
    const state = this.state;
    const have = state?.progress[id] ?? [];
    const done = !!state?.done[id];
    return {
      id,
      kind: quest.kind,
      title: CHAPTERS[quest.chapter] ?? quest.chapter,
      desc: quest.desc ?? '',
      done,
      objectives: quest.objectives.map((objective, i) => {
        const count = objective.count ?? 1;
        const n = done ? count : Math.min(count, have[i] ?? 0);
        return { text: objective.text, have: n, count, on: objective.on, target: objective.target ?? null };
      })
    };
  }

  /** A quest ativa que pede vencer esta fase (o rastreador da partida). */
  forStage(stageId) {
    const state = this.state;
    if (!state) return null;
    const id = state.active.find((qid) => QUESTS[qid]?.objectives.some((o) => o.on === 'win' && o.target === stageId));
    return id ? this.view(id) : null;
  }

  /* ============================== por dentro ============================== */

  /**
   * Fecha a quest se todos os objetivos estão cumpridos (ou à força, no
   * silêncio do doneIf) e abre as seguintes. Devolve as que abriram, ou null
   * se ela ainda não fechou.
   */
  _complete(state, id, silent = false) {
    const quest = QUESTS[id];
    const have = state.progress[id] ?? [];
    const finished = quest.objectives.every((objective, i) => (have[i] ?? 0) >= (objective.count ?? 1));
    if (!finished && !silent) return null;
    state.active = state.active.filter((qid) => qid !== id);
    state.done[id] = { at: new Date().toISOString(), ...(silent ? { skipped: true } : {}) };
    delete state.progress[id];
    const opened = [];
    for (const next of quest.next ?? []) {
      if (state.done[next] || state.active.includes(next) || !QUESTS[next]) continue;
      // a que uma cena abre (0.39, `openedBy`) espera a cena; em silêncio (a jornada de
      // antes das cenas, que não vai ver a cena), ela abre direto
      if (QUESTS[next].openedBy && !silent) continue;
      state.active.push(next);
      opened.push(next);
    }
    return opened;
  }

  /** Das quests `ids`, as que já estão cumpridas fecham em silêncio (e as que elas abrem também). */
  _catchUp(state, ids) {
    const ctx = this._context();
    const queue = [...ids];
    for (let guard = 0; queue.length && guard < 200; guard++) {
      const id = queue.shift();
      const cond = QUESTS[id]?.doneIf;
      if (!state.active.includes(id) || !cond || !matchesDoneIf(cond, ctx)) continue;
      queue.push(...this._complete(state, id, true));
    }
  }
}

/** A condição `doneIf` de uma quest (todas as chaves precisam valer). */
export function matchesDoneIf(cond, ctx) {
  for (const [key, value] of Object.entries(cond)) {
    switch (key) {
      case 'starter': case 'mapSeen':
        if (!!ctx[key] !== value) return false;
        break;
      case 'cleared': if (!(ctx.cleared ?? []).includes(value)) return false; break;
      default: return false;
    }
  }
  return true;
}

/** As chaves que o `doneIf` entende (o check-data recusa as outras). */
export const DONE_IF_KEYS = ['starter', 'mapSeen', 'cleared'];
