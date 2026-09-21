import { el, create, clear, show, hide } from './dom.js';
import { formatTime } from '../core/utils.js';
import { getPokemon } from '../data/pokemon.js';
import { pokemonImg, spriteUrl, animatedUrl } from '../render/sprites.js';
import { typeColor, typeName } from '../data/types.js';
import { maxHpFor, xpRatio } from '../systems/stats.js';
import { CONFIG } from '../core/config.js';
import { iconHTML } from '../render/icons.js';

/**
 * HUD da partida: cards dos Pokémon ativos (vida, XP e nível de cada um),
 * reserva, troca e as telas de melhoria/captura/pausa/resultado.
 *
 * A estrutura só é reconstruída quando a equipe muda; a cada frame apenas os
 * valores das barras são atualizados.
 */
export class HUD {
  constructor(game) {
    this.game = game;
    this.signature = '';
    this.nodes = new Map();   // uid -> { card, hpBar, hpFill, xpFill, lv, levelBtn }
    this._bindStaticButtons();
  }

  _bindStaticButtons() {
    el('btn-pause').onclick = () => this.game.togglePause();
    el('btn-resume').onclick = () => this.game.togglePause();
    el('btn-quit').onclick = () => this.game.quitToMenu();
    el('btn-save-run').onclick = () => this.game.saveToFile();
    el('btn-result-save').onclick = () => this.game.saveToFile();
    el('btn-result-menu').onclick = () => this.game.quitToMenu();
    el('capture-skip').onclick = () => this.game.resolveCapture();
  }

  /* ========================= atualização por frame ========================= */

  update(run) {
    el('stage-name').textContent = run.stage.name;
    el('segment-name').textContent = run.segmentName;
    el('timer').textContent = run.boss ? '⚔' : formatTime(run.timeToBoss);
    el('objective').textContent = run.objective;
    el('kill-count').textContent = run.stats.kills;
    el('ball-count').textContent = run.stats.captures;

    const cooldown = run.playerStats.swapCooldown;
    const ratio = cooldown > 0 ? 1 - run.team.swapTimer / cooldown : 1;
    el('swap-fill').style.width = `${Math.min(100, ratio * 100)}%`;
    el('swap-text').textContent = run.team.swapReady ? 'Pronta' : `${run.team.swapTimer.toFixed(1)}s`;

    this._syncTeam(run);
  }

  /** Assinatura do estado estrutural da equipe (o que exige reconstruir o HUD). */
  _signature(run) {
    const team = run.team;
    return [
      team.members.map((m) => `${m.uid}:${m.fainted ? 'f' : 'a'}:${m.pendingLevels > 0 ? 'p' : '-'}`).join(','),
      team.active.map((m) => (m ? m.uid : '-')).join(','),
      team.selectedSlot,
      team.swapReady ? 1 : 0
    ].join('|');
  }

  _syncTeam(run) {
    const signature = this._signature(run);
    if (signature !== this.signature) {
      this.signature = signature;
      this._buildTeam(run);
    }
    this._refreshBars(run);
  }

  _buildTeam(run) {
    const team = run.team;
    const activeRow = clear(el('active-slots'));
    const benchRow = clear(el('reserve-slots'));
    this.nodes.clear();

    team.active.forEach((member, slot) => {
      activeRow.appendChild(this._activeCard(run, member, slot));
    });

    const bench = team.reserve;
    bench.forEach((member) => benchRow.appendChild(this._benchCard(run, member)));
    const empty = CONFIG.team.maxSize - CONFIG.team.activeSlots - bench.length;
    for (let i = 0; i < empty; i++) {
      const node = create('div', 'bench-mon empty', '<div style="height:38px"></div>');
      node.title = 'Espaço livre na equipe';
      benchRow.appendChild(node);
    }
  }

  /** Card grande: sprite animado, nome, nível, vida e XP. */
  _activeCard(run, member, slot) {
    const card = create('div', 'mon-card');
    if (!member) {
      card.classList.add('fainted');
      card.innerHTML = '<div style="width:46px;height:46px"></div><div class="mon-info"><div class="mon-top"><span class="mon-name">—</span></div></div>';
      return card;
    }

    const data = getPokemon(member.pokemonId);
    card.style.borderColor = typeColor(data.types[0]);
    if (slot === run.team.selectedSlot) card.classList.add('selected');
    card.title = `${data.name} — clique para escolher este slot como destino da troca`;
    card.onclick = () => { run.team.selectedSlot = slot; this.signature = ''; };

    const index = run.team.members.indexOf(member);
    card.appendChild(create('span', 'key-hint', String(index + 1)));
    card.appendChild(pokemonImg(data.dex, { alt: data.name }));

    const info = create('div', 'mon-info');
    const top = create('div', 'mon-top');
    top.appendChild(create('span', 'mon-name', data.name));
    const lv = create('span', 'mon-lv', `Nv.${member.level}`);
    top.appendChild(lv);
    info.appendChild(top);

    const hpBar = create('div', 'bar hp');
    const hpFill = create('i');
    hpBar.appendChild(hpFill);
    info.appendChild(hpBar);

    const xpBar = create('div', 'bar xp');
    const xpFill = create('i');
    xpBar.appendChild(xpFill);
    info.appendChild(xpBar);

    card.appendChild(info);

    if (member.pendingLevels > 0) card.appendChild(this._levelButton(member));

    this.nodes.set(member.uid, { card, hpBar, hpFill, xpFill, lv });
    return card;
  }

  /** Card pequeno da reserva. */
  _benchCard(run, member) {
    const data = getPokemon(member.pokemonId);
    const node = create('div', 'bench-mon');
    const index = run.team.members.indexOf(member);

    node.appendChild(create('span', 'key-hint', String(index + 1)));
    node.appendChild(pokemonImg(data.dex, { alt: data.name }));
    node.appendChild(create('div', 'bench-lv', `Nv.${member.level}`));

    const hpBar = create('div', 'bar hp tiny');
    const hpFill = create('i');
    hpBar.appendChild(hpFill);
    node.appendChild(hpBar);

    if (member.fainted) {
      node.classList.add('fainted');
      node.title = `${data.name} desmaiou e só volta na próxima fase.`;
    } else if (!run.team.swapReady) {
      node.classList.add('disabled');
      node.title = 'Troca em recarga';
    } else {
      node.title = `${data.name} — clique (ou tecla ${index + 1}) para entrar em campo`;
      node.onclick = () => { if (run.team.swapIn(member.uid)) this.signature = ''; };
    }

    if (member.pendingLevels > 0) node.appendChild(this._levelButton(member));

    this.nodes.set(member.uid, { card: node, hpBar, hpFill, xpFill: null, lv: null });
    return node;
  }

  /** Seta ▲: gasta os níveis acumulados daquele Pokémon. */
  _levelButton(member) {
    const btn = create('button', 'level-btn', '▲');
    btn.title = `${member.pendingLevels} melhoria(s) disponível(is)`;
    if (member.pendingLevels > 1) btn.appendChild(create('span', 'count', String(member.pendingLevels)));
    btn.onclick = (e) => {
      e.stopPropagation();
      this.game.openLevelUpFor(member);
    };
    return btn;
  }

  /** Só valores: roda todo frame e não recria elementos. */
  _refreshBars(run) {
    const bonus = run.playerStats.pokemonHpBonus;
    for (const member of run.team.members) {
      const node = this.nodes.get(member.uid);
      if (!node) continue;

      const ratio = member.hp / maxHpFor(member, bonus);
      node.hpFill.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
      node.hpBar.classList.toggle('low', ratio <= 0.5 && ratio > 0.25);
      node.hpBar.classList.toggle('critical', ratio <= 0.25);

      if (node.xpFill) node.xpFill.style.width = `${xpRatio(member) * 100}%`;
      if (node.lv) node.lv.textContent = `Nv.${member.level}`;
    }
  }

  /* ============================== LEVEL UP ============================== */

  showLevelUp(member, choices, onPick) {
    const data = getPokemon(member.pokemonId);
    el('levelup-sprite').src = animatedUrl(data.dex);
    el('levelup-sprite').onerror = (e) => { e.target.src = spriteUrl(data.dex); };
    el('levelup-subtitle').textContent =
      `${data.name} chegou ao nível ${member.level}` +
      (member.pendingLevels > 1 ? ` · ${member.pendingLevels} melhorias pendentes` : '');

    const row = clear(el('upgrade-choices'));
    choices.forEach((up) => {
      const stacks = this.game.run.progression.stacksOf(up, member);
      const variant = up.rarity === 'evolution' ? ' evolution' : up.scope === 'tm' ? ' tm' : '';
      const card = create('div', `card${variant}`);
      card.innerHTML = `
        <div class="card-icon">${iconHTML(up.icon ?? 'levelUp', 44)}</div>
        <h3>${up.name}</h3>
        <p>${up.description}</p>
        ${up.scope === 'tm' ? '' : up.maxStacks ? `<div class="stack-info">${stacks}/${up.maxStacks}</div>` : ''}
        ${up.scope === 'tm' ? '<div class="chip">TROCA O GOLPE BASE · MANTÉM AS MELHORIAS</div>' : ''}
      `;
      card.onclick = () => onPick(up.id);
      row.appendChild(card);
    });

    show(el('levelup-overlay'));
  }

  hideLevelUp() { hide(el('levelup-overlay')); }

  /* ============================== EVOLUÇÃO ============================== */

  showEvolution({ member, from, to }, onContinue) {
    const fromImg = el('evo-from');
    const toImg = el('evo-to');
    fromImg.src = animatedUrl(from.dex);
    fromImg.onerror = () => { fromImg.src = spriteUrl(from.dex); };
    toImg.src = animatedUrl(to.dex);
    toImg.onerror = () => { toImg.src = spriteUrl(to.dex); };

    el('evolution-text').textContent =
      `${from.name} evoluiu para ${to.name}! (nível ${member.level}) ` +
      'Todas as melhorias e golpes continuam com ele.';
    el('evolution-continue').onclick = onContinue;
    show(el('evolution-overlay'));
  }

  hideEvolution() { hide(el('evolution-overlay')); }

  /* ============================== CAPTURA ============================== */

  showCapture(choices, onPick) {
    const row = clear(el('capture-choices'));
    el('capture-subtitle').textContent = 'Escolha um Pokémon para a sua equipe';
    el('capture-skip').textContent = 'Ignorar';

    choices.forEach((pokemon) => {
      row.appendChild(this._pokemonCard(pokemon, () => onPick(pokemon.id)));
    });
    show(el('capture-overlay'));
  }

  /** Segunda etapa: equipe cheia, escolher quem sai. */
  showReplace(pokemon, members, onPick) {
    const row = clear(el('capture-choices'));
    el('capture-subtitle').textContent = `Equipe cheia. Quem sai para ${pokemon.name} entrar?`;
    el('capture-skip').textContent = 'Cancelar';

    members.forEach((member) => {
      const data = getPokemon(member.pokemonId);
      row.appendChild(this._pokemonCard(data, () => onPick(member.uid),
        `Nv.${member.level}${member.fainted ? ' · desmaiado' : ''}`));
    });
    show(el('capture-overlay'));
  }

  hideCapture() { hide(el('capture-overlay')); }

  _pokemonCard(pokemon, onClick, footer = '') {
    const card = create('div', 'card');
    const types = pokemon.types.map(
      (t) => `<span class="type-tag" style="background:${typeColor(t)}">${typeName(t)}</span>`
    ).join('');

    const img = pokemonImg(pokemon.dex, { className: 'card-sprite', alt: pokemon.name });
    card.appendChild(img);
    const body = create('div');
    body.innerHTML = `
      <h3>${pokemon.name}</h3>
      <div class="type-row" style="margin:6px 0">${types}</div>
      <p>${pokemon.description ?? ''}</p>
      <div class="stack-info">${footer || pokemon.role || ''}</div>
    `;
    card.appendChild(body);
    card.onclick = onClick;
    return card;
  }

  /* ============================== PAUSA / FIM ============================== */

  showPause(run) {
    clear(el('pause-team-summary')).append(...this._teamSummary(run.team.members));
    show(el('pause-overlay'));
  }

  hidePause() { hide(el('pause-overlay')); }

  showResult({ victory, run }) {
    const title = el('result-title');
    title.textContent = victory ? 'VITÓRIA!' : 'DERROTA';
    title.className = victory ? 'victory' : 'defeat';

    el('result-subtitle').textContent = victory
      ? `Você concluiu ${run.stage.name}!`
      : 'Todos os seus Pokémon desmaiaram.';

    el('btn-result-menu').querySelector('.btn-text').textContent =
      victory ? 'Continuar Jornada' : 'Voltar ao Mapa';

    clear(el('result-team')).append(...this._teamSummary(run.team.members));

    const stats = clear(el('result-stats'));
    const best = [...run.team.members].sort((a, b) => b.level - a.level)[0];
    const rows = [
      ['Tempo', formatTime(run.time)],
      ['Inimigos derrotados', String(run.stats.kills)],
      ['Capturas', String(run.stats.captures)],
      ['Desmaios', String(run.stats.faints)],
      ['Dano total', String(Math.round(run.stats.damageDealt))],
      ['Maior nível', best ? `${getPokemon(best.pokemonId).name} Nv.${best.level}` : '—']
    ];
    for (const [label, value] of rows) {
      stats.appendChild(create('div', '', `<span>${label}</span><b>${value}</b>`));
    }
    show(el('result-overlay'));
  }

  hideResult() { hide(el('result-overlay')); }

  _teamSummary(members) {
    return members.map((member) => {
      const data = getPokemon(member.pokemonId);
      const node = create('div', `sum-mon${member.fainted ? ' fainted' : ''}`);
      node.appendChild(pokemonImg(data.dex, { alt: data.name }));
      node.appendChild(create('b', '', `Nv.${member.level}`));
      node.appendChild(create('span', '', data.name));
      node.title = member.fainted ? `${data.name} — desmaiado` : data.name;
      return node;
    });
  }

  hideAllOverlays() {
    this.hideEvolution();
    this.hideLevelUp();
    this.hideCapture();
    this.hidePause();
    this.hideResult();
  }
}
