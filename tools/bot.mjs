/**
 * O "JOGADOR VIRTUAL" dos testes. Joga como alguém que conhece o jogo (0.10,
 * o Fellipe passava fácil onde o bot antigo perdia): escolhe as melhorias que
 * mais aumentam o dano, foge da horda sem parar de circular, desvia do aviso
 * no chão e dos projéteis dos líderes, vai atrás das Poké Balls, troca
 * Pokémon machucado por descansado e captura. Usado pelo smoke-test e pelo
 * balance.
 */
import { Run } from '../src/game/Run.js';
import { hpRatio } from '../src/systems/stats.js';

export const DT = 1 / 60;

/** Quanto cada tipo de melhoria vale para quem quer dano (o sufixo do id). */
const UPGRADE_VALUE = {
  damage: 6, count: 6, cooldown: 5, chains: 5, pierce: 4, area: 4, blast: 4,
  tick: 3, burn: 3, venom: 3, drain: 3, duration: 2, range: 2, speed: 2,
  arc: 2, spin: 2, pulse: 2, push: 1
};

/** Gasta um nível pendente na melhor escolha: TM, senão a que mais dá dano. */
export function spendLevel(run, member) {
  const choices = run.progression.rollChoices(member);
  if (!choices.length) throw new Error('Level up sem opções!');
  const value = (c) => (c.scope === 'tm' ? 100 : UPGRADE_VALUE[c.id.split('_').pop()] ?? 1) + Math.random() * 0.5;
  const pick = choices.reduce((best, c) => (value(c) > value(best) ? c : best));
  run.progression.applyUpgrade(pick.id, member);
  member.pendingLevels = Math.max(0, member.pendingLevels - 1);
}

/**
 * Para onde andar: circula pela arena (os golpes acertam o que vem chegando),
 * desvia só do que está colado, dos avisos de golpe no chão e dos projéteis
 * dos líderes, e vai atrás da Poké Ball quando ela aparece. Fugir de tudo
 * deixava a equipe sem alcançar ninguém.
 */
function steer(run) {
  const { player } = run;
  const angle = run.time * 0.9;
  let mx = Math.cos(angle), my = Math.sin(angle);
  const flee = (x, y, radius, weight) => {
    const dx = player.x - x, dy = player.y - y;
    const d = Math.hypot(dx, dy);
    if (d > radius || d < 0.01) return;
    const push = weight * (1 - d / radius);
    mx += (dx / d) * push;
    my += (dy / d) * push;
  };
  for (const e of run.enemies) if (!e.dead) flee(e.x, e.y, e.boss ? 200 : 80, e.boss ? 2.5 : 0.6);
  for (const z of run.zones) if (z.hostile && !z.dead) flee(z.x, z.y, (z.maxRadius ?? 200) + 50, 3);
  for (const p of run.projectiles) if (p.hostile && !p.dead) flee(p.x, p.y, 90, 2.5);

  const ball = run.pickups.find((p) => p.kind === 'ball' && !p.dead);
  if (ball) {
    const dx = ball.x - player.x, dy = ball.y - player.y;
    const d = Math.hypot(dx, dy) || 1;
    mx += (dx / d) * 2;
    my += (dy / d) * 2;
  }
  const m = Math.hypot(mx, my) || 1;
  return { x: mx / m, y: my / m };
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

    run.update(DT, steer(run));
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
    if (run.state === 'unlock') { run.unlockQueue.length = 0; run.state = 'running'; continue; }

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
