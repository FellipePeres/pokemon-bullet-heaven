/**
 * O "JOGADOR VIRTUAL" dos testes: foge da horda em círculos, desvia para pegar
 * Poké Balls, troca Pokémon machucado por descansado, escolhe melhorias
 * (prefere TMs) e captura. Usado pelo smoke-test e pelo balance.
 */
import { Run } from '../src/game/Run.js';
import { hpRatio } from '../src/systems/stats.js';

export const DT = 1 / 60;

/** Gasta um nível pendente escolhendo uma melhoria ao acaso. */
export function spendLevel(run, member) {
  const choices = run.progression.rollChoices(member);
  if (!choices.length) throw new Error('Level up sem opções!');
  // TM é sempre uma escolha forte: o jogador virtual pega quando aparece
  const pick = choices.find((c) => c.scope === 'tm')
    ?? choices[Math.floor(Math.random() * choices.length)];
  run.progression.applyUpgrade(pick.id, member);
  member.pendingLevels = Math.max(0, member.pendingLevels - 1);
}

/** Fecha a tela de melhoria quando o Pokémon não tem mais níveis guardados. */
export function resolveLevelUp(run) {
  spendLevel(run, run.levelUpMember);
  if (run.levelUpMember.pendingLevels <= 0) {
    run.levelUpMember = null;
    run.state = 'running';
  }
}

/**
 * Roda uma partida inteira com um "jogador virtual":
 * foge em círculos, desvia para pegar Poké Balls, resolve melhorias e capturas.
 */
export function simulate(stageId, starter, { maxSeconds = 600, journey = null } = {}) {
  const run = new Run(stageId, journey ? { team: journey.team, campaignStarter: starter } : { starter, campaignStarter: starter });
  let bossAt = null;          // quando o primeiro Pokémon do líder apareceu
  let levelsAtBoss = null;    // níveis da equipe nessa hora
  let peakEnemies = 0;

  let levelUps = 0;
  let captures = 0;
  let ballsDropped = 0;
  let steps = 0;
  const seenBalls = new Set();
  let lastBenchSpend = 0;

  while (run.time < maxSeconds && steps < maxSeconds / DT) {
    steps++;

    const ball = run.pickups.find((p) => p.kind === 'ball' && !p.dead);
    let move;
    if (ball) {
      const dx = ball.x - run.player.x;
      const dy = ball.y - run.player.y;
      const d = Math.hypot(dx, dy) || 1;
      move = { x: dx / d, y: dy / d };
    } else {
      const angle = run.time * 0.9;
      move = { x: Math.cos(angle), y: Math.sin(angle) };
    }
    run.update(DT, move);
    peakEnemies = Math.max(peakEnemies, run.enemies.length);
    if (bossAt === null && run.boss) {
      bossAt = run.time;
      levelsAtBoss = run.team.members.filter((m) => !m.fainted).map((m) => m.level);
    }

    for (const p of run.pickups) {
      if (p.kind === 'ball' && !seenBalls.has(p)) { seenBalls.add(p); ballsDropped++; }
    }

    if (run.state === 'intro') { run.pendingIntro = null; run.state = 'running'; continue; }
    if (run.state === 'evolution') { run.evolutionQueue.shift(); if (!run.evolutionQueue.length) run.state = 'running'; continue; }
    if (run.state === 'levelup') { resolveLevelUp(run); levelUps++; continue; }

    if (run.state === 'capture') {
      const options = run.captureSystem.rollChoices();
      if (options.length) {
        if (run.team.isFull) run.captureSystem.captureReplacing(run.team.members[5].uid, options[0].id);
        else run.captureSystem.capture(options[0].id);
        captures++;
      }
      run.pendingBall = false;
      run.pendingGift = null;
      run.state = 'running';
      continue;
    }

    // troca Pokémon machucado por um descansado (a reserva se cura sozinha)
    if (run.team.swapReady) {
      const hurt = run.team.activeMembers
        .map((m) => ({ m, r: hpRatio(m, run.playerStats.pokemonHpBonus) }))
        .sort((a, b) => a.r - b.r)[0];
      if (hurt && hurt.r < 0.4) {
        const fresh = run.team.reserve
          .filter((m) => !m.fainted && hpRatio(m, run.playerStats.pokemonHpBonus) > 0.7)
          .sort((a, b) => hpRatio(b) - hpRatio(a))[0];
        if (fresh) {
          run.team.selectedSlot = run.team.active.indexOf(hurt.m);
          run.team.swapIn(fresh.uid);
        }
      }
    }

    // de tempos em tempos o jogador clica no ▲ dos Pokémon da reserva
    if (run.time - lastBenchSpend > 12) {
      lastBenchSpend = run.time;
      for (const member of run.team.reserve) {
        while (member.pendingLevels > 0 && !member.fainted) { spendLevel(run, member); levelUps++; }
      }
    }

    if (run.state === 'victory' || run.state === 'defeat') break;
  }

  return { run, levelUps, captures, ballsDropped, steps, bossAt, levelsAtBoss, peakEnemies };
}
