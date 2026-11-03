import { el, create, clear, show, hide } from './dom.js';
import { formatTime } from '../core/utils.js';
import { getPokemon } from '../data/pokemon.js';
import { pokemonImg, spriteUrl, animatedUrl } from '../render/sprites.js';
import { typeColor, typeName } from '../data/types.js';
import { maxHpFor, xpRatio } from '../systems/stats.js';
import { CONFIG } from '../core/config.js';
import { iconHTML } from '../render/icons.js';
import { assetUrl } from '../render/assets.js';
import { bus, EVENTS } from '../core/events.js';

/** Espadinha do botão de ataque: lâmina, guarda e cabo. */
const SWORD_SVG = '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">' +
  '<path d="M13.5 2.5 6.5 9.5" stroke="#eef3ff" stroke-width="2.6" stroke-linecap="square"/>' +
  '<path d="M4.5 7.5l4 4" stroke="#e0a83e" stroke-width="2" stroke-linecap="round"/>' +
  '<path d="M5.5 10.5 2.6 13.4" stroke="#8a5a2b" stroke-width="2.4" stroke-linecap="round"/></svg>';

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
    // a engrenagem na partida: pausa e abre as Opções (o volume) por cima
    el('btn-hud-options').onclick = () => {
      if (this.game.run?.state === 'running') this.game.togglePause();
      this.game.menus.showModal('modal-options');
    };
    el('btn-resume').onclick = () => this.game.togglePause();
    el('btn-quit').onclick = () => this.game.quitToMenu();
    el('btn-save-run').onclick = () => this.game.saveToFile();
    el('btn-result-save').onclick = () => this.game.saveToFile();
    el('btn-result-menu').onclick = () => this.game.quitToMenu();
    // derrota: o Centro Pokémon, ou a jornada do zero (que pede confirmação)
    el('btn-result-center').onclick = () => this.game.pokemonCenter();
    el('btn-result-restart').onclick = () => this._confirmRestart(true);
    el('btn-restart-no').onclick = () => this._confirmRestart(false);
    el('btn-restart-yes').onclick = () => this.game.restartJourney();
    el('btn-center-go').onclick = () => this.game.leaveCenter();
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
      team.members.map((m) => `${m.uid}:${m.fainted ? 'f' : 'a'}:${m.pendingLevels > 0 ? 'p' : '-'}:${m.attack === false ? 'x' : 'o'}`).join(','),
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
    // o slot marcado é quem sai na próxima troca (o selo "sai" deixa isso à vista)
    if (slot === run.team.selectedSlot) {
      card.classList.add('selected');
      card.appendChild(create('span', 'swap-tag', '⇄ sai'));
    }
    card.title = `${data.name} — clique para ele ser quem sai na próxima troca`;
    // no apertar, não no soltar: o HUD se refaz quando alguém sobe de nível e
    // um clique que começasse antes e terminasse depois se perderia
    card.onpointerdown = () => { run.team.selectedSlot = slot; this.signature = ''; };

    const index = run.team.members.indexOf(member);
    card.appendChild(create('span', 'key-hint', String(index + 1)));
    card.appendChild(this._attackButton(run, member));
    if (member.attack === false) card.classList.add('passive');
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
      node.onpointerdown = () => bus.emit(EVENTS.TOAST, { text: `Troca em recarga: ${run.team.swapTimer.toFixed(1)}s`, icon: 'swap' });
    } else {
      const leaving = run.team.active[run.team.selectedSlot];
      const out = leaving ? ` no lugar de ${getPokemon(leaving.pokemonId).name}` : '';
      node.title = `${data.name} — clique (ou tecla ${index + 1}) para entrar em campo${out}`;
      node.onpointerdown = () => { if (run.team.swapIn(member.uid)) this.signature = ''; };
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
    btn.onpointerdown = (e) => {
      e.stopPropagation();
      this.game.openLevelUpFor(member);
    };
    return btn;
  }

  /** Espadinha: liga e desliga o ataque. Desligado, o Pokémon só acompanha o treinador. */
  _attackButton(run, member) {
    const on = member.attack !== false;
    const btn = create('button', `attack-btn${on ? '' : ' off'}`, SWORD_SVG);
    btn.title = on ? 'Atacando — clique para ele só acompanhar, sem atacar' : 'Só acompanhando — clique para voltar a atacar';
    btn.onpointerdown = (e) => {
      e.stopPropagation();
      run.team.toggleAttack(member.uid);
      this.signature = '';
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

  /* ======================== APRESENTAÇÃO DO LÍDER ======================== */

  /** O líder chega: retrato, nome e a fala dele antes do time entrar em campo. */
  showLeaderIntro(leader, onFight) {
    const portrait = el('leader-portrait');
    portrait.src = assetUrl(leader.portrait) ?? spriteUrl(leader.dex);
    portrait.alt = leader.name;
    el('leader-name').textContent = leader.name;
    el('leader-title').textContent = leader.title ?? '';
    el('leader-quote').textContent = leader.quote ?? '';
    el('leader-fight').onclick = onFight;
    show(el('leader-overlay'));
  }

  hideLeaderIntro() { hide(el('leader-overlay')); }

  /* ============================ HALL DA FAMA ============================ */

  /** A equipe campeã, um Pokémon por vez (o atraso de cada card é a entrada). */
  showHallOfFame(entry, { trainerName, portrait, regionName }, onClose) {
    el('hall-trainer').src = portrait;
    el('hall-text').textContent =
      `Parabéns, ${trainerName}! Sua equipe entrou para o Hall da Fama de ${regionName}.`;
    const row = clear(el('hall-team'));
    entry.team.forEach((mon, i) => {
      const data = getPokemon(mon.pokemonId);
      const card = create('div', 'hall-mon');
      card.style.animationDelay = `${0.35 + i * 0.45}s`;
      card.appendChild(pokemonImg(data.dex, { alt: data.name }));
      card.append(create('b', '', data.name), create('span', '', `Nv. ${mon.level}`));
      row.appendChild(card);
    });
    el('hall-close').onclick = onClose;
    show(el('hall-overlay'));
  }

  hideHallOfFame() { hide(el('hall-overlay')); }

  /* ============================== CAPTURA ============================== */

  showCapture(choices, onPick, subtitle = 'Escolha um Pokémon para a sua equipe') {
    const row = clear(el('capture-choices'));
    el('capture-subtitle').textContent = subtitle;
    el('capture-skip').textContent = 'Ignorar';

    choices.forEach((pokemon) => {
      row.appendChild(this._pokemonCard(pokemon, () => onPick(pokemon.id)));
    });
    show(el('capture-overlay'));
  }

  /** Segunda etapa: equipe cheia, escolher quem sai. */
  showReplace(pokemon, members, onPick, onSendToPC = null) {
    const row = clear(el('capture-choices'));
    el('capture-subtitle').textContent = `Equipe cheia. Quem vai para o PC para ${pokemon.name} entrar?`;
    el('capture-skip').textContent = 'Cancelar';
    if (onSendToPC) {
      // o novo vai direto para o PC: a equipe fica como está e ele espera no lobby
      const pc = this._pokemonCard(pokemon, onSendToPC, `Mandar ${pokemon.name} para o PC`);
      pc.classList.add('to-pc');
      row.appendChild(pc);
    }

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
    title.textContent = victory ? 'Vitória!' : 'Derrota';
    title.className = victory ? 'victory' : 'defeat';

    el('result-subtitle').textContent = victory
      ? `Você concluiu ${run.stage.name}!`
      : 'Todos os seus Pokémon desmaiaram. E agora?';

    el('result-victory').classList.toggle('hidden', !victory);
    el('result-defeat').classList.toggle('hidden', victory);
    hide(el('result-confirm'));

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

  /** Recomeçar a jornada apaga o progresso da região: mostra o aviso antes. */
  _confirmRestart(open) {
    // o "voltar" do controle (B) também chega aqui, mesmo sem o aviso aberto
    if (!open && el('result-confirm').classList.contains('hidden')) return;
    el('result-defeat').classList.toggle('hidden', open);
    el('result-confirm').classList.toggle('hidden', !open);
  }

  /**
   * O Centro Pokémon: a equipe que volta para a fase, curada (a do começo da
   * fase; as capturas da tentativa perdida ficam para trás).
   */
  showCenter({ members, stage, lost, pcCount, hasJourney }) {
    clear(el('center-team')).append(...this._teamSummary(members));
    const names = lost.length > 1 ? `${lost.slice(0, -1).join(', ')} e ${lost.at(-1)}` : lost[0];
    el('center-note').textContent = lost.length
      ? `${names}, ${lost.length > 1 ? 'capturados na tentativa perdida, não ficaram' : 'capturado na tentativa perdida, não ficou'}: a equipe volta como estava no começo da fase.`
      : '';
    const phase = stage.name.split(' — ')[0];
    el('center-go-label').textContent = phase.startsWith('Fase') ? `Voltar para a ${phase}` : 'Voltar para a luta';
    const pc = el('btn-center-pc');
    pc.classList.toggle('hidden', !hasJourney);
    pc.querySelector('.btn-text').textContent = pcCount ? `PC (${pcCount})` : 'PC';
    show(el('center-overlay'));
  }

  hideCenter() { hide(el('center-overlay')); }

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
    this.hideLeaderIntro();
    this.hideEvolution();
    this.hideLevelUp();
    this.hideCapture();
    this.hidePause();
    this.hideResult();
    this.hideCenter();
  }
}
