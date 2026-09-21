/**
 * Teste de fumaça — roda a lógica da partida sem navegador.
 * Simula fases inteiras em velocidade máxima para pegar erros de runtime e
 * conferir spawn, dano, XP por Pokémon, desmaio, captura, chefe e save/load.
 *
 * Uso: npm run smoke
 */
import { Run } from '../src/game/Run.js';
import { STAGES } from '../src/data/stages.js';
import { UPGRADES } from '../src/data/upgrades.js';
import { ABILITIES } from '../src/data/abilities.js';
import { POKEMON } from '../src/data/pokemon.js';
import { SaveManager } from '../src/save/SaveManager.js';
import { createProfile } from '../src/save/profile.js';
import { CONFIG } from '../src/core/config.js';
import { maxHpFor } from '../src/systems/stats.js';
import { hpRatio } from '../src/systems/stats.js';
import { nextMoveFor, moveLineOf } from '../src/data/tms.js';
import { getPokemon } from '../src/data/pokemon.js';

const DT = 1 / 60;
let failures = 0;

function check(label, condition, extra = '') {
  const ok = !!condition;
  if (!ok) failures++;
  console.log(`${ok ? '  OK  ' : ' FALHA'} | ${label}${extra ? ` — ${extra}` : ''}`);
}

/** Gasta um nível pendente escolhendo uma melhoria ao acaso. */
function spendLevel(run, member) {
  const choices = run.progression.rollChoices(member);
  if (!choices.length) throw new Error('Level up sem opções!');
  // TM é sempre uma escolha forte: o jogador virtual pega quando aparece
  const pick = choices.find((c) => c.scope === 'tm')
    ?? choices[Math.floor(Math.random() * choices.length)];
  run.progression.applyUpgrade(pick.id, member);
  member.pendingLevels = Math.max(0, member.pendingLevels - 1);
}

/** Fecha a tela de melhoria quando o Pokémon não tem mais níveis guardados. */
function resolveLevelUp(run) {
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
function simulate(stageId, starter, { maxSeconds = 600, journey = null } = {}) {
  const run = new Run(stageId, journey ? { team: journey.team } : { starter });

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

    for (const p of run.pickups) {
      if (p.kind === 'ball' && !seenBalls.has(p)) { seenBalls.add(p); ballsDropped++; }
    }

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

  return { run, levelUps, captures, ballsDropped, steps };
}

const teamLevels = (run) => run.team.members.map((m) => m.level).join('/');

console.log('\n=== POKÉMON BULLET HEAVEN — teste de fumaça ===\n');

// ---------------------------------------------------------------- 1. iniciais
for (const starter of ['charmander', 'bulbasaur', 'squirtle']) {
  const { run, captures, ballsDropped } = simulate('gym_1_pewter', starter, { maxSeconds: 400 });
  console.log(`\n[${POKEMON[starter].name}] estado final: ${run.state} · t=${run.time.toFixed(0)}s`);
  check('inimigos apareceram', run.stats.kills > 0, `${run.stats.kills} abates`);
  check('Pokémon sobem de nível individualmente', run.team.members.some((m) => m.level > 1),
        `níveis ${teamLevels(run)}`);
  check('dano foi aplicado', run.stats.damageDealt > 0, `${Math.round(run.stats.damageDealt)} de dano`);
  check('capturas acontecem', captures > 0, `${captures} capturas de ${ballsDropped} Poké Balls`);
  check('máximo de Pokémon ativos respeitado', run.companions.length <= CONFIG.team.activeSlots,
        `${run.companions.length} em campo (limite ${CONFIG.team.activeSlots})`);
  check('a fase termina (vitória ou derrota)', run.state === 'victory' || run.state === 'defeat',
        `estado=${run.state}`);
}

// ------------------------------------------- 2. jornada encadeada (campanha)
console.log('\n[jornada — equipe e build passam de fase em fase]');
{
  let journey = null;
  for (const stageId of ['gym_1_pewter', 'gym_2_cerulean']) {
    const stage = STAGES[stageId];

    // A fase é desafiadora de propósito (o jogador virtual ganha ~60% das vezes)
    // e perder devolve ao início com a equipe intacta — então o teste também
    // repete, como um jogador faria. Falha só se não passar em 4 tentativas.
    let result = null;
    let attempts = 0;
    do {
      attempts++;
      result = simulate(stageId, 'charmander', { maxSeconds: stage.duration + 240, journey });
    } while (result.run.state !== 'victory' && attempts < 4);

    const { run, captures, ballsDropped } = result;
    check(`${stage.name}: líder derrotado`, run.state === 'victory',
          `estado=${run.state} em ${attempts} tentativa(s), equipe ${run.team.members.length}, níveis ${teamLevels(run)}`);
    console.log(`         ${captures} capturas · ${ballsDropped} Poké Balls · ${run.stats.faints} desmaios · ${run.stats.kills} abates`);
    if (run.state !== 'victory') break;
    journey = { team: run.team.serialize() };
  }
  check('jornada chega ao fim com equipe formada', (journey?.team.members.length ?? 0) >= 4,
        `${journey?.team.members.length ?? 0} Pokémon`);
}

// ------------------------------------------------- 3. divisão de experiência
console.log('\n[experiência]');
{
  const run = new Run('gym_1_pewter', { starter: 'charmander' });
  for (const id of ['pidgey', 'poliwag', 'bellsprout', 'ponyta', 'machop']) run.team.add(id);

  check('3 Pokémon ativos e 3 na reserva',
        run.team.activeMembers.length === 3 && run.team.reserve.length === 3,
        `${run.team.activeMembers.length} ativos / ${run.team.reserve.length} reserva`);

  // total pequeno de propósito: se alguém subir de nível o XP é consumido
  // e a medição da divisão deixa de fazer sentido
  const TOTAL = 30;
  run.progression.addXp(TOTAL);
  const activeShare = run.team.activeMembers[0].xp / TOTAL;
  const benchShare = run.team.reserve[0].xp / TOTAL;

  check('cada Pokémon ativo recebe 25% do XP', Math.abs(activeShare - 0.25) < 0.02,
        `${(activeShare * 100).toFixed(2)}%`);
  check('cada Pokémon da reserva recebe 8,33% do XP', Math.abs(benchShare - 0.0833) < 0.01,
        `${(benchShare * 100).toFixed(2)}%`);

  // com um Pokémon só, nada de XP se perde
  const solo = new Run('gym_1_pewter', { starter: 'squirtle' });
  const need = solo.progression.xpToNext(1);
  solo.progression.addXp(need);
  check('com um Pokémon só, ele recebe todo o XP', solo.team.members[0].level === 2,
        `nível ${solo.team.members[0].level} após ${need} de XP`);
}

// ------------------------------------------------ 4. vida, desmaio e derrota
console.log('\n[vida e desmaio]');
{
  const run = new Run('gym_1_pewter', { starter: 'charmander' });
  for (const id of ['pidgey', 'poliwag', 'machop']) run.team.add(id); // 3 ativos + 1 reserva
  const victim = run.companions[0];
  const activeBefore = run.team.active.filter(Boolean).length;

  check('Pokémon começa com a vida cheia da espécie',
        victim.member.hp === maxHpFor(victim.member), `${victim.member.hp} HP`);

  run.damageCompanion(victim, 9999);
  check('Pokémon desmaia ao zerar a vida', victim.member.fainted === true);
  check('desmaio não deixa o slot vazio quando há reserva',
        run.team.active.filter(Boolean).length === activeBefore,
        `${run.team.active.filter(Boolean).length} em campo`);

  // derrota: parado no meio da horda
  const lose = new Run('gym_1_pewter', { starter: 'charmander' });
  let steps = 0;
  while (lose.state !== 'defeat' && steps < 60 * 600) {
    steps++;
    lose.update(DT, { x: 0, y: 0 });
    if (lose.state === 'evolution') { lose.evolutionQueue.shift(); if (!lose.evolutionQueue.length) lose.state = 'running'; }
    if (lose.state === 'levelup') resolveLevelUp(lose);
    if (lose.state === 'capture') { lose.pendingBall = false; lose.state = 'running'; }
  }
  check('perder a fase exige todos os Pokémon desmaiados',
        lose.state === 'defeat' && lose.team.members.every((m) => m.fainted),
        `após ${(steps * DT).toFixed(0)}s parado com ${lose.team.members.length} Pokémon`);
}

// ------------------------------------------ 5. comportamentos de habilidade
console.log('\n[habilidades — cada comportamento precisa causar dano]');
{
  const step = (run) => {
    run.update(1 / 60, { x: 0, y: 0 });
    if (run.state === 'levelup') { run.levelUpMember.pendingLevels = 0; run.levelUpMember = null; run.state = 'running'; }
    if (run.state === 'evolution') { run.evolutionQueue.length = 0; run.state = 'running'; }
    if (run.state === 'capture') { run.pendingBall = false; run.state = 'running'; }
  };

  const probe = (abilityId, seconds = 3, enemyId = 'rattata') => {
    CONFIG.debug.godMode = true;              // aqui só interessa o dano causado
    const run = new Run('gym_1_pewter', { starter: 'charmander' });
    const companion = run.companions[0];
    companion.member.abilities = [abilityId];
    companion.abilities = [{ abilityId, timer: 0, stats: null, effects: null, runtime: {} }];
    run.abilitySystem.refresh();
    run.spawner.update = () => {};

    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      run.spawner.spawnAt(enemyId, run.player.x + Math.cos(a) * 55, run.player.y + Math.sin(a) * 55);
    }
    for (let i = 0; i < seconds * 60; i++) step(run);
    CONFIG.debug.godMode = false;
    return run;
  };

  for (const abilityId of Object.keys(ABILITIES)) {
    if (ABILITIES[abilityId].hostile) continue;
    const run = probe(abilityId);
    check(`${ABILITIES[abilityId].name} (${ABILITIES[abilityId].behavior}) causa dano`,
          run.stats.damageDealt > 0, `${Math.round(run.stats.damageDealt)} de dano em 3s`);
  }

  CONFIG.debug.godMode = true;
  const orbit = probe('flame_wheel', 1);
  const firstAngle = orbit.orbs[0]?.angle ?? 0;
  for (let i = 0; i < 30; i++) step(orbit);
  CONFIG.debug.godMode = false;
  check('orbes giram ao redor do Pokémon', Math.abs((orbit.orbs[0]?.angle ?? 0) - firstAngle) > 0.5,
        `variação de ${((orbit.orbs[0]?.angle ?? 0) - firstAngle).toFixed(2)} rad`);

  const aura = probe('fire_ring', 1);
  const zone = aura.zones.find((z) => z.kind === 'aura');
  check('aura acompanha o Pokémon', !!zone && Math.hypot(zone.x - zone.owner.x, zone.y - zone.owner.y) < 1);

  const immune = probe('thunder_shock', 3, 'geodude_wild');
  check('tabela de tipos é aplicada (Elétrico x Terrestre = 0)', immune.stats.damageDealt === 0,
        `${Math.round(immune.stats.damageDealt)} de dano`);
}

// ------------------------------------------- 5.5 TMs e linha de golpes
console.log('\n[TMs — cada Pokémon sobe o próprio golpe]');
{
  const run = new Run('gym_1_pewter', { starter: 'charmander' });
  const charmander = run.team.members[0];

  check('Charmander começa com Ember', charmander.abilities[0] === 'ember');
  check('a TM dele é Flamethrower', nextMoveFor('charmander', 'ember') === 'flamethrower');
  check('depois de Flamethrower vem Fire Blast',
        nextMoveFor('charmander', 'flamethrower') === 'fire_blast');
  check('no fim da linha não há mais TM', nextMoveFor('charmander', 'fire_blast') === null);

  // nenhum Pokémon pode receber um golpe que não seja da linha dele
  const forbidden = Object.values(POKEMON).filter((p) => {
    const next = nextMoveFor(p.id, p.abilities[0]);
    return next && !p.moveLine.includes(next);
  });
  check('a TM nunca oferece golpe de outro Pokémon', forbidden.length === 0,
        forbidden.map((p) => p.id).join(', '));
  check('Pidgey jamais recebe Hyper Beam', !moveLineOf('pidgey').some((a) => a.id === 'hyper_beam'),
        moveLineOf('pidgey').map((a) => a.name).join(' → '));

  // as melhorias investidas seguem para o golpe novo
  charmander.upgrades.ember_damage = 3;
  charmander.upgrades.ember_count = 2;
  run.progression.learnTM(charmander, 'flamethrower');
  check('aprender a TM troca o golpe base', charmander.abilities[0] === 'flamethrower');
  check('as melhorias são transferidas para o golpe novo',
        (charmander.upgrades.flamethrower_damage ?? 0) === 3 &&
        (charmander.upgrades.flamethrower_count ?? 0) === 2 &&
        !charmander.upgrades.ember_damage,
        JSON.stringify(charmander.upgrades));
}

// ---------------------------------------------- 5.6 evolução por nível
console.log('\n[evolução]');
{
  const run = new Run('gym_1_pewter', { starter: 'charmander' });
  const member = run.team.members[0];
  member.level = 15;
  run.progression.addXpTo(member, run.progression.xpToNext(15) + 1);

  check('Charmander evolui no nível 16', member.pokemonId === 'charmeleon',
        `virou ${getPokemon(member.pokemonId).name} no nível ${member.level}`);
  check('a evolução entra na fila para a tela aparecer', run.evolutionQueue.length === 1);
  check('evoluir não cura de graça',
        member.hp <= maxHpFor(member, run.playerStats.pokemonHpBonus));
  check('o golpe e as melhorias continuam com ele', member.abilities[0] === 'ember');
}

// ------------------------------------------------------- 6. upgrades/dados
console.log('\n[dados]');
{
  const ids = Object.keys(UPGRADES);
  check('pool de upgrades gerado', ids.length > 30, `${ids.length} upgrades`);
  const broken = ids.filter((id) => {
    const up = UPGRADES[id];
    return !up.name || !up.description || !up.maxStacks;
  });
  check('todos os upgrades têm nome/descrição/limite', broken.length === 0, broken.join(', '));
  check('upgrades de evolução existem', ids.filter((id) => UPGRADES[id].grantsAbility).length >= 3);

  const noHp = Object.values(POKEMON).filter((p) => !p.hp);
  check('todo Pokémon jogável tem vida definida', noHp.length === 0, noHp.map((p) => p.id).join(', '));

  // upgrades de habilidade pertencem ao Pokémon, não à equipe
  const run = new Run('gym_1_pewter', { starter: 'charmander' });
  run.team.add('pikachu');
  const [charmander, pikachu] = run.team.members;
  run.progression.applyUpgrade('ember_damage', charmander);
  check('upgrade de habilidade fica só com o Pokémon que escolheu',
        (charmander.upgrades.ember_damage ?? 0) === 1 && !pikachu.upgrades.ember_damage);
}

// ----------------------------------------------------------- 7. save/load
console.log('\n[save]');
{
  const { run } = simulate('gym_1_pewter', 'squirtle', { maxSeconds: 60 });
  const profile = createProfile();
  profile.campaign.starter = 'squirtle';
  profile.pokedex.caught.push(7, 60);

  const data = SaveManager.build({ profile, run: run.serialize() });
  const json = SaveManager.toJSON(data);
  const parsed = SaveManager.parse(JSON.parse(json));

  check('save vira JSON válido', json.length > 100 && parsed.profile.campaign.starter === 'squirtle');
  check('Pokédex do save guarda só os capturados',
        Array.isArray(parsed.profile.pokedex.caught) && parsed.profile.pokedex.seen === undefined);
  check('snapshot preserva equipe, níveis e upgrades por Pokémon',
        parsed.run.team.members.length === run.team.members.length &&
        parsed.run.team.members[0].level === run.team.members[0].level &&
        typeof parsed.run.team.members[0].upgrades === 'object');

  const restored = new Run(parsed.run.stageId, { team: parsed.run.team });
  restored.update(DT, { x: 1, y: 0 });
  check('partida restaurada volta a rodar com a equipe curada',
        restored.team.members.length === run.team.members.length &&
        restored.team.members.every((m) => !m.fainted),
        `${restored.team.members.length} Pokémon, níveis ${teamLevels(restored)}`);

  let bad = null;
  try { SaveManager.parse({ foo: 'bar' }); } catch (e) { bad = e.message; }
  check('save inválido é rejeitado', !!bad, bad ?? '');
}

console.log(`\n=== ${failures === 0 ? 'TUDO OK' : failures + ' FALHA(S)'} ===\n`);
process.exit(failures ? 1 : 0);
