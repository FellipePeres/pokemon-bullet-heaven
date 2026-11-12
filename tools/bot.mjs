/**
 * O "JOGADOR VIRTUAL" dos testes. Joga como alguém que conhece o jogo (0.10,
 * o Fellipe passava fácil onde o bot antigo perdia): escolhe as melhorias que
 * mais aumentam o dano, foge da horda sem parar de circular, desvia do aviso
 * no chão e dos projéteis dos líderes, vai atrás das Poké Balls, troca
 * Pokémon machucado por descansado e captura. Usado pelo smoke-test e pelo
 * balance.
 *
 * `typeAware` (0.32, o balance com --tipos): o jogador que monta o time pensando
 * em tipos. Mantém a equipe como o bot de sempre (a experiência continua indo
 * para os mesmos), mas escolhe na Poké Ball quem tem mais vantagem contra o líder
 * da fase e, quando o líder aparece, põe em campo os que têm mais vantagem
 * contra ele, uma troca por vez (respeitando o tempo de troca).
 * Sem ele, pega sempre a primeira opção da Poké Ball.
 */
import { Run } from '../src/game/Run.js';
import { hpRatio } from '../src/systems/stats.js';
import { leaderTeamTypes, matchupAgainst, matchupScore, moveTypesOf } from '../src/systems/matchup.js';

export const DT = 1 / 60;

/** Quanto cada tipo de melhoria vale para quem quer dano (o sufixo do id). */
const UPGRADE_VALUE = {
  damage: 6, count: 6, cooldown: 5, chains: 5, pierce: 4, area: 4, blast: 4,
  tick: 3, burn: 3, venom: 3, drain: 3, duration: 2, range: 2, speed: 2,
  arc: 2, spin: 2, pulse: 2, push: 1
};

/**
 * Gasta um nível pendente na melhor escolha: TM; senão uma da chave do Golpe
 * Desperto (0.28: quem joga vai atrás dela, o card vem marcado); senão a que
 * mais dá dano.
 */
export function spendLevel(run, member) {
  const choices = run.progression.rollChoices(member);
  if (!choices.length) throw new Error('Level up sem opções!');
  const value = (c) => (c.scope === 'tm' ? 100 : run.progression.isAwakeningPart(c, member) ? 50
    : UPGRADE_VALUE[c.id.split('_').pop()] ?? 1) + Math.random() * 0.5;
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
export function steer(run) {
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

  // a tempestade total do Zapdos (H-6): o tabuleiro de raios. Quem joga lê o tabuleiro e vai
  // para a casa por perto que cai mais tarde (ou que acabou de cair), em vez de fugir de tudo
  const cells = (run.fight?.hazards ?? []).filter((h) => h.shape === 'square' && !h.fired);
  if (cells.length) {
    const soon = (x, y) => {
      let s = Infinity;
      for (const h of cells) if (Math.abs(x - h.x) < h.r && Math.abs(y - h.y) < h.r) s = Math.min(s, h.warn - h.t);
      return s;
    };
    let best = { x: player.x, y: player.y, s: soon(player.x, player.y) };
    for (const h of cells) {
      const d = Math.hypot(h.x - player.x, h.y - player.y);
      if (d > 320) continue;
      const s = soon(h.x, h.y) - d / 300;
      if (s > best.s) best = { x: h.x, y: h.y, s };
    }
    const dx = best.x - player.x, dy = best.y - player.y, d = Math.hypot(dx, dy);
    if (d < 24) return { x: 0, y: 0 };
    return { x: dx / d, y: dy / d };
  }
  // o Frio Absoluto do Articuno (H-7): vai para o olho da nevasca e fica lá dentro
  const cold = run.fight?.cold;
  if (cold?.eye && cold.phase === 'frost') {
    const dx = cold.eye.x - player.x, dy = cold.eye.y - player.y, d = Math.hypot(dx, dy) || 1;
    if (d < cold.eye.r * 0.35) return { x: 0, y: 0 };
    return { x: dx / d, y: dy / d };
  }
  // a Nevasca do Articuno: sai do cone aceso pelo lado mais perto
  const cone = run.fight?.cone;
  if (cone?.phase === 'aim' && run.fight.inCone(player.x, player.y)) {
    const side = Math.sin(Math.atan2(player.y - cone.y, player.x - cone.x) - cone.a) >= 0 ? 1 : -1;
    const nx = -Math.sin(cone.a) * side, ny = Math.cos(cone.a) * side;
    mx += nx * 5; my += ny * 5;
  }
  // a Investida do Zapdos e o Raio de Gelo do Articuno: sai de lado da faixa acesa
  const pk = run.fight?.peck ?? run.fight?.beam;
  if (pk?.phase === 'aim') {
    const lx = pk.x1 - pk.x0, ly = pk.y1 - pk.y0, len = Math.hypot(lx, ly) || 1;
    const nx = -ly / len, ny = lx / len;
    const side = (player.x - pk.x0) * nx + (player.y - pk.y0) * ny;
    if (Math.abs(side) < pk.w / 2 + 60) { const s = side >= 0 ? 1 : -1; mx += nx * s * 4; my += ny * s * 4; }
  }
  // a luta do Kyogre (0.37): foge dos avisos no chão e vai até a Dive Ball
  for (const h of run.fight?.hazards ?? []) if (!h.fired) flee(h.x, h.y, h.r + 60, 3);
  // o maremoto: corre para a bolha de ar e fica lá dentro
  const ts = run.fight?.tsunami;
  if (ts && ts.phase !== 'after') {
    const dx = ts.safe.x - player.x, dy = ts.safe.y - player.y, d = Math.hypot(dx, dy) || 1;
    if (d < ts.safe.r * 0.5) return { x: 0, y: 0 };
    return { x: dx / d, y: dy / d };
  }
  const ball = run.fight?.ball ?? run.pickups.find((p) => p.kind === 'ball' && !p.dead);
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
export function simulate(stageId, starter, { maxSeconds = 600, journey = null, typeAware = false } = {}) {
  const run = new Run(stageId, journey ? { team: journey.team, campaignStarter: starter } : { starter, campaignStarter: starter });
  // a nota de cada Pokémon contra o time do líder desta fase (só o bot que pensa em tipos usa)
  const teamTypes = typeAware ? leaderTeamTypes(run.stage, starter) : [];
  const speciesFit = (pokemonId) => matchupScore(matchupAgainst(pokemonId, moveTypesOf(pokemonId), teamTypes));
  const fit = (member) => matchupScore(matchupAgainst(member.pokemonId, moveTypesOf(member), teamTypes));
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
        // o bot que pensa em tipos escolhe quem tem mais vantagem contra o líder; o de sempre, a primeira opção
        const pick = typeAware ? [...options].sort((a, b) => speciesFit(b.id) - speciesFit(a.id))[0] : options[0];
        if (run.team.isFull) run.captureSystem.captureReplacing(run.team.members[5].uid, pick.id);
        else run.captureSystem.capture(pick.id);
        captures++;
      }
      run.pendingBall = false;
      run.pendingGift = null;
      run.state = 'running';
      continue;
    }

    // com o líder em campo, quem pensa em tipos põe os de mais vantagem contra ele (uma troca por vez)
    if (typeAware && run.boss && run.team.swapReady) swapForType(run, fit);

    // troca Pokémon machucado por um descansado (a reserva se cura sozinha)
    if (run.team.swapReady) {
      const hurt = run.team.activeMembers
        .map((m) => ({ m, r: hpRatio(m, run.playerStats.pokemonHpBonus) }))
        .sort((a, b) => a.r - b.r)[0];
      if (hurt && hurt.r < 0.4) {
        const fresh = run.team.reserve
          .filter((m) => !m.fainted && hpRatio(m, run.playerStats.pokemonHpBonus) > 0.7)
          .sort((a, b) => (typeAware ? fit(b) - fit(a) : hpRatio(b) - hpRatio(a)))[0];
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

/**
 * Uma troca por vantagem de tipo: o da reserva com mais vantagem contra o líder
 * entra no lugar do que tem menos em campo, se a diferença valer (meio passo de
 * 2x) e ele estiver descansado. Devolve true quando trocou.
 */
function swapForType(run, fit) {
  const team = run.team;
  const bench = team.reserve.filter((m) => !m.fainted && hpRatio(m, run.playerStats.pokemonHpBonus) > 0.5)
    .sort((a, b) => fit(b) - fit(a))[0];
  const worst = team.activeMembers.slice().sort((a, b) => fit(a) - fit(b))[0];
  if (!bench || !worst || fit(bench) - fit(worst) < 0.5) return false;
  team.selectedSlot = team.active.indexOf(worst);
  return team.swapIn(bench.uid);
}
