/**
 * Teste de fumaça — roda a lógica da partida sem navegador.
 * Simula fases inteiras em velocidade máxima para pegar erros de runtime e
 * conferir spawn, dano, XP por Pokémon, desmaio, captura, chefe e save/load.
 *
 * Uso: npm run smoke
 */
import { Run } from '../src/game/Run.js';
import { simulate, spendLevel, resolveLevelUp, DT } from './bot.mjs';
import { STAGES } from '../src/data/stages.js';
import { UPGRADES } from '../src/data/upgrades.js';
import { ABILITIES } from '../src/data/abilities.js';
import { POKEMON } from '../src/data/pokemon.js';
import { SaveManager } from '../src/save/SaveManager.js';
import { createProfile, normalizeProfile, regionProgress } from '../src/save/profile.js';
import { Player, facingDir, FEET_BOX } from '../src/entities/Player.js';
import { CONFIG } from '../src/core/config.js';
import { Dive, isNav, laneEnd } from '../src/game/Dive.js';
import { DIVE } from '../src/data/dive.js';
import { DIVE_WORLD } from '../src/data/diveWorld.js';
import { maxHpFor } from '../src/systems/stats.js';
import { hpRatio } from '../src/systems/stats.js';
import { nextMoveFor, moveLineOf } from '../src/data/tms.js';
import { getPokemon } from '../src/data/pokemon.js';
import { Pickup } from '../src/entities/Pickup.js';
import { swapWithPC, normalizePC, monAt, previewMove, moveMon, boxCount, fixDuplicateUids } from '../src/systems/pc.js';
import { TILE } from '../src/systems/terrain.js';
import { recordStageResult } from '../src/systems/stageStats.js';
import { BONUS_MOVES, BONUS_BY_TYPE, isBonusMove } from '../src/data/bonusMoves.js';
import { RETIRED_ABILITIES } from '../src/data/abilities.js';
import { abilityFx } from '../src/data/fx.js';
import { damageEnemy, bonusHeal } from '../src/systems/combat.js';
import { LEGENDARY_KITS, LEGENDARY_MOVES, LEGENDARY_ENCOUNTERS } from '../src/data/legendaries.js';
import { typeMultiplier } from '../src/data/types.js';
import { leaderTeamTypes, matchupAgainst, moveTypesOf, teamWeaknesses } from '../src/systems/matchup.js';

let failures = 0;

function check(label, condition, extra = '') {
  const ok = !!condition;
  if (!ok) failures++;
  console.log(`${ok ? '  OK  ' : ' FALHA'} | ${label}${extra ? ` — ${extra}` : ''}`);
}

const teamLevels = (run) => run.team.members.map((m) => m.level).join('/');

console.log('\n=== POKÉMON BULLET HEAVEN — teste de fumaça ===\n');

// ---------------------------------------------------------------- 1. iniciais
for (const starter of ['charmander', 'bulbasaur', 'squirtle']) {
  const { run, captures, ballsDropped } = simulate('gym_1_pewter', starter, { maxSeconds: 600 });   // folga para a luta contra o líder
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
  // A fase é desafiadora de propósito (tools/balance.mjs) e perder devolve ao
  // início com a mesma equipe, então o teste também repete. Mas uma equipe ruim
  // montada na Fase 1 perde a Fase 2 todas as vezes: aí começa uma jornada nova,
  // até 3. Vai de Squirtle: desde a 0.10 o Charmander contra o Brock é o caminho
  // difícil (fogo contra pedra, como no FireRed), e o teste é da jornada, não dele.
  let journey = null;
  let results = [];
  for (let journeyTry = 0; journeyTry < 3; journeyTry++) {
    journey = null;
    results = [];
    for (const stageId of ['gym_1_pewter', 'gym_2_cerulean']) {
      const stage = STAGES[stageId];
      let result = null;
      let attempts = 0;
      do {
        attempts++;
        // o Bulbasaur não tem desvantagem de tipo no Brock nem na Misty (desde a 0.32 o tipo pesa, e o
        // Squirtle contra a Misty virou o confronto mais duro do começo); aqui só interessa a jornada
        result = simulate(stageId, 'bulbasaur', { maxSeconds: stage.duration + 240, journey });
      } while (result.run.state !== 'victory' && attempts < 6);
      results.push({ stage, result, attempts });
      if (result.run.state !== 'victory') break;
      journey = { team: result.run.team.serialize() };
    }
    if (results.length === 2 && results[1].result.run.state === 'victory') break;
  }
  for (const { stage, result, attempts } of results) {
    const { run, captures, ballsDropped } = result;
    check(`${stage.name}: líder derrotado`, run.state === 'victory',
          `estado=${run.state} em ${attempts} tentativa(s), equipe ${run.team.members.length}, níveis ${teamLevels(run)}`);
    console.log(`         ${captures} capturas · ${ballsDropped} Poké Balls · ${run.stats.faints} desmaios · ${run.stats.kills} abates`);
  }
  // com as Poké Balls raras da 0.10, duas fases rendem uma equipe de 3 ou mais
  check('jornada chega ao fim com equipe formada', (journey?.team.members.length ?? 0) >= 3,
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

  // o alvo do teste: o Rattata, menos para quem não o atinge (Fantasma não pega em Normal, desde a 0.32)
  const targetFor = (abilityId) => (typeMultiplier(ABILITIES[abilityId].type, ['normal']) > 0 ? 'rattata' : 'geodude_wild');
  const probe = (abilityId, seconds = 3, enemyId = targetFor(abilityId)) => {
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
  const orbit = probe('fire_spin', 1);
  const firstAngle = orbit.orbs[0]?.angle ?? 0;
  for (let i = 0; i < 30; i++) step(orbit);
  CONFIG.debug.godMode = false;
  check('orbes giram ao redor do Pokémon', Math.abs((orbit.orbs[0]?.angle ?? 0) - firstAngle) > 0.5,
        `variação de ${((orbit.orbs[0]?.angle ?? 0) - firstAngle).toFixed(2)} rad`);

  const aura = probe('mega_drain', 1);
  const zone = aura.zones.find((z) => z.kind === 'aura');
  check('aura acompanha o Pokémon', !!zone && Math.hypot(zone.x - zone.owner.x, zone.y - zone.owner.y) < 1);

  // no máximo 4 golpes por tipo (0.6), sem contar os golpes dos líderes nem os exclusivos dos lendários
  const perType = {};
  for (const a of Object.values(ABILITIES)) if (!a.hostile && !a.exclusive) perType[a.type] = (perType[a.type] ?? 0) + 1;
  const crowded = Object.entries(perType).filter(([, n]) => n > 4);
  check('no máximo 4 golpes por tipo', !crowded.length,
        crowded.map(([t, n]) => `${t}: ${n}`).join(', ') || `${Object.keys(perType).length} tipos`);

  // save de antes da 0.6: golpes que saíram viram o equivalente, com as melhorias
  const legacyRun = new Run('gym_1_pewter', { team: { members: [
    { uid: 'a', pokemonId: 'charmander', level: 12, abilities: ['ember', 'fire_ring'],
      upgrades: { ember_damage: 2, ember_fire_ring: 1, fire_ring_damage: 2 } },
    { uid: 'b', pokemonId: 'ponyta', level: 9, abilities: ['flame_wheel'], upgrades: { flame_wheel_damage: 3 } }
  ], active: ['a', 'b'] } });
  const [oldChar, oldPony] = legacyRun.team.members;
  check('save antigo: o golpe extra do inicial vira o novo, com as melhorias',
        oldChar.abilities.join() === 'ember,fire_spin' && oldChar.upgrades.ember_fire_spin === 1 &&
        oldChar.upgrades.fire_spin_damage === 2 && !oldChar.upgrades.fire_ring_damage,
        `${oldChar.abilities.join(' + ')}`);
  check('save antigo: golpe que saiu vira o da mesma posição na linha nova',
        oldPony.abilities[0] === 'ember' && oldPony.upgrades.ember_damage === 3, oldPony.abilities.join());

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
  const bonus = run.playerStats.pokemonHpBonus;

  // subir de nível cura parte da vida de quem subiu (levelUpHeal), do nível 11 em diante
  member.level = 5;
  member.hp = 10;
  run.progression.addXpTo(member, run.progression.xpToNext(5) + 1);
  check('antes do nível 11, subir de nível não cura', member.level === 6 && member.hp === 10,
        `${Math.round(member.hp)} HP no nível ${member.level}`);
  member.level = 10;
  member.hp = 10;
  run.progression.addXpTo(member, run.progression.xpToNext(10) + 1);
  check('subir de nível cura 1/10 da vida',
        CONFIG.progression.levelUpHeal === 0.1 &&
        member.level === 11 && Math.abs(member.hp - (10 + maxHpFor(member, bonus) * 0.1)) < 0.01,
        `${Math.round(member.hp)}/${maxHpFor(member, bonus)} HP`);
  const fainted = run.team.createMember('pidgey', 10);
  fainted.fainted = true;
  fainted.hp = 0;
  run.progression.addXpTo(fainted, run.progression.xpToNext(10) + 1);
  check('subir de nível não reanima quem desmaiou', fainted.fainted && fainted.hp === 0);
  // a Poção de quem já tem todas as melhorias cura 20% (0.12.1; era 50%)
  member.hp = 10;
  run.progression.applyUpgrade('__heal', member);
  check('a Poção do Pokémon com todas as melhorias cura 20% da vida',
        Math.abs(member.hp - (10 + maxHpFor(member, bonus) * 0.2)) < 0.01,
        `${Math.round(member.hp)}/${maxHpFor(member, bonus)} HP`);

  member.level = 15;
  member.hp = 5;
  member.upgrades.ember_damage = 2;
  run.progression.addXpTo(member, run.progression.xpToNext(15) + 1);

  check('Charmander evolui no nível 16', member.pokemonId === 'charmeleon',
        `virou ${getPokemon(member.pokemonId).name} no nível ${member.level}`);
  check('a evolução entra na fila para a tela aparecer', run.evolutionQueue.length === 1);
  check('evoluir cura toda a vida', member.hp === maxHpFor(member, bonus),
        `${member.hp}/${maxHpFor(member, bonus)} HP`);
  // evoluir melhora o golpe (0.8): Charmeleon chega com Flamethrower, levando as melhorias
  check('evoluir melhora o golpe e leva as melhorias',
        member.abilities[0] === 'flamethrower' && member.upgrades.flamethrower_damage === 2 && !member.upgrades.ember_damage,
        `${member.abilities[0]} ${JSON.stringify(member.upgrades)}`);
}

// ---------------------------------------------- 5.7 Ímã
console.log('\n[Ímã]');
{
  const run = new Run('gym_1_pewter', { starter: 'charmander' });
  run.spawner.update = () => {};   // sem inimigos: só o XP e o Ímã no mapa
  const { x, y } = run.player;
  const far = [[x + 1200, y + 800], [x - 1300, y - 700], [x + 900, y - 850]]
    .map(([px, py]) => new Pickup('xp', px, py, 5));
  run.pickups.push(...far, new Pickup('magnet', x + 30, y));
  let gained = 0;
  const addXp = run.progression.addXp.bind(run.progression);
  run.progression.addXp = (amount) => { gained += amount; addXp(amount); };
  for (let t = 0; t < 4; t += DT) {
    if (run.state === 'levelup') resolveLevelUp(run);
    run.update(DT, { x: 0, y: 0 });   // o treinador fica parado
  }
  check('o Ímã puxa todo o XP do mapa', far.every((orb) => orb.dead),
        `${far.filter((orb) => orb.dead).length}/${far.length} coletados`);
  check('o XP puxado conta para a equipe', gained >= 15, `${gained} de XP`);
}

// ---------------------------------------------- 5.8 obstáculos do cenário
console.log('\n[obstáculos]');
{
  const run = new Run('gym_1_pewter', { starter: 'charmander' });
  const terrain = run.terrain;
  check('o treinador começa fora de obstáculo', !terrain.overlaps(run.player, FEET_BOX));
  // anda reto para cada lado: para nas árvores e na mata da borda, sem atravessar nada
  let crossed = false;
  for (const move of [{ x: -1, y: 0 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }]) {
    for (let i = 0; i < 60 * 12; i++) {
      run.update(1 / 60, move);
      if (run.state !== 'running') { run.state = 'running'; run.levelUpMember = null; run.pendingBall = false; }
      if (terrain.overlaps(run.player, FEET_BOX)) crossed = true;
    }
  }
  check('árvores e a mata da borda bloqueiam o treinador', !crossed);
  const inside = run.enemies.filter((e) => !e.dead && terrain.overlaps(e, e.box)).length;
  check('nenhum inimigo dentro de obstáculo', inside === 0, `${run.enemies.length} inimigos, ${inside} dentro`);

  // inimigo preso (0.11.5): quem cai dentro de um obstáculo é tirado de lá
  {
    const probe = new Run('gym_1_pewter', { starter: 'charmander' });
    probe.spawner.update = () => {};
    const t = probe.terrain;
    const enemy = probe.spawner.spawnAt('rattata', probe.player.x + 400, probe.player.y);
    let solid = null;
    for (let ty = 2; ty < 60 && !solid; ty++) {
      for (let tx = 2; tx < 80 && !solid; tx++) {
        const cx = (tx + 0.5) * TILE, cy = (ty + 0.5) * TILE - enemy.box.oy;
        if (t.blocked(cx, cy + enemy.box.oy, enemy.box.hw, enemy.box.hh) && Math.hypot(cx - probe.player.x, cy - probe.player.y) > 300) solid = { x: cx, y: cy };
      }
    }
    Object.assign(enemy, solid);
    for (let i = 0; i < 60; i++) probe.update(1 / 60, { x: 0, y: 0 });
    check('inimigo dentro de um obstáculo sai em até 1 s', !!solid && !enemy.dead && !t.overlaps(enemy, enemy.box));

    // encurralado: longe do treinador e sem sair do lugar → teleporte para um ponto livre
    const stuck = probe.spawner.spawnAt('rattata', probe.player.x - 500, probe.player.y);
    stuck.update = () => 0;
    const before = { x: stuck.x, y: stuck.y };
    for (let i = 0; i < 60 * 4; i++) probe.update(1 / 60, { x: 0, y: 0 });
    check('inimigo parado longe do treinador é teleportado',
          Math.hypot(stuck.x - before.x, stuck.y - before.y) > 50 && !t.overlaps(stuck, stuck.box),
          `andou ${Math.round(Math.hypot(stuck.x - before.x, stuck.y - before.y))} px`);
  }

  // trocar de trecho tira quem ficou dentro do obstáculo novo
  run.world.scene = 'pewter_gym';
  run._settleTerrain();
  check('mudar de trecho não prende ninguém', !terrain.overlaps(run.player, FEET_BOX)
        && run.enemies.every((e) => e.dead || !terrain.overlaps(e, e.box)));
}

// ---------------------------------------------- 5.9 captura, espadinha e troca
console.log('\n[captura, espadinha e troca]');
{
  const run = new Run('gym_2_cerulean', { starter: 'charmander' });
  run.team.members[0].level = 20;
  const caught = run.captureSystem.capture('clefairy');
  check('quem entra chega perto do nível da equipe', caught.level === 20 - CONFIG.capture.levelsBehindTeam,
        `Clefairy no nível ${caught.level}`);
  check('e vai para o campo se há vaga', run.team.active.includes(caught) && run.companions.some((c) => c.member === caught));

  // espadinha desligada em todos: em campo, mas ninguém causa dano
  for (const member of run.team.members) run.team.toggleAttack(member.uid);
  const before = run.stats.damageDealt;
  for (let i = 0; i < 60 * 20; i++) {
    run.update(1 / 60, { x: Math.sin(i / 60), y: Math.cos(i / 50) });
    if (run.state !== 'running') { run.state = 'running'; run.levelUpMember = null; run.pendingBall = false; }
  }
  check('com a espadinha desligada ninguém ataca', run.stats.damageDealt === before,
        `${Math.round(run.stats.damageDealt - before)} de dano`);
  check('a espadinha vai junto no save', run.team.serialize().members.every((m) => m.attack === false));

  // a troca põe quem entra no slot escolhido (antes, todos de pé: 20 s sem atacar
  // no meio da horda às vezes desmaiavam a reserva inteira e o teste não tinha quem trocar)
  for (const member of run.team.members) { member.fainted = false; member.hp = maxHpFor(member); }
  run.team.add('pidgey', 18);
  run.team.add('rattata', 18);
  run.team.selectedSlot = 1;
  const leaving = run.team.active[1];
  const entering = run.team.reserve.find((m) => !m.fainted);
  run.team.swapTimer = 0;
  run.team.swapIn(entering.uid);
  check('a troca põe quem entra no lugar do slot escolhido', run.team.active[1] === entering && !run.team.active.includes(leaving));
}

// ---------------------------------------------- 5.10 PC e capturas
console.log('\n[PC e capturas]');
{
  const run = new Run('gym_3_vermilion', { starter: 'charmander', campaignStarter: 'charmander' });
  run.team.members[0].level = 30;
  const offered = run.captureSystem.rollChoices();
  check('cada Poké Ball oferece 4 opções', offered.length === CONFIG.capture.choices && CONFIG.capture.choices === 4,
        offered.map((p) => p.name).join(', '));
  // o inicial do próprio jogador nunca volta como captura; os outros dois podem
  const species = new Set();
  for (let i = 0; i < 300; i++) run.captureSystem.rollChoices().forEach((p) => species.add(p.id));
  check('o próprio inicial não aparece na Poké Ball', !species.has('charmander'));
  check('as fases acumulam as espécies das anteriores', species.has('caterpie') && species.has('zubat'),
        `${species.size} espécies vistas`);

  while (!run.team.isFull) run.team.add('pidgey', 20) ?? run.team.add('rattata', 20);
  const leaving = run.team.members[1];
  run.captureSystem.captureReplacing(leaving.uid, 'meowth');
  check('equipe cheia: quem sai vai para o PC', run.pc.some((m) => m.uid === leaving.uid) && run.team.has('meowth'));
  const sizeBefore = run.team.members.length;
  run.captureSystem.captureToPC('psyduck');
  check('ou o novo vai direto para o PC, sem mexer na equipe',
        run.pc.some((m) => m.pokemonId === 'psyduck') && run.team.members.length === sizeBefore && !run.team.has('psyduck'));
  check('o PC da partida vai no autosave', run.serialize().pc.length === 2);

  // no lobby: trocar, retirar e depositar
  const journey = { team: run.team.serialize(), pc: run.pc.map((m) => ({ ...m })) };
  const out = journey.team.members[0].uid;
  const into = journey.pc[0].uid;
  check('trocar um da equipe por um do PC', swapWithPC(journey, out, into, 6)
        && journey.team.members.some((m) => m.uid === into) && journey.pc.some((m) => m.uid === out)
        && journey.team.active.includes(into));
  check('com a equipe cheia, só retirar não dá', !swapWithPC(journey, null, journey.pc[0].uid, 6));
  check('depositar abre vaga, e aí retirar dá', swapWithPC(journey, journey.team.members[0].uid, null, 6)
        && swapWithPC(journey, null, journey.pc[0].uid, 6));
  const solo = { team: { members: [journey.team.members[0]], active: [journey.team.members[0].uid] }, pc: [] };
  check('a equipe nunca fica vazia', !swapWithPC(solo, solo.team.members[0].uid, null, 6));

  // as caixas (0.12): cada um tem casa; pegar e soltar move, troca ou deposita
  const box = (slot) => ({ area: 'box', slot });
  const team = (index) => ({ area: 'team', index });
  const j = { team: run.team.serialize(), pc: run.pc.map((m) => ({ ...m, slot: undefined })) };
  normalizePC(j);
  check('quem chega ao PC ganha a primeira casa vazia, sem repetir',
        new Set(j.pc.map((m) => m.slot)).size === j.pc.length && j.pc.every((m) => m.slot < j.pc.length));
  const first = monAt(j, box(0));
  check('soltar numa casa vazia leva para lá', previewMove(j, box(0), box(40), 6) === 'drop'
        && moveMon(j, box(0), box(40), 6) && monAt(j, box(40)) === first && !monAt(j, box(0)));
  const second = monAt(j, box(1));
  check('soltar em cima de outro troca os dois', previewMove(j, box(40), box(1), 6) === 'swap'
        && moveMon(j, box(40), box(1), 6) && monAt(j, box(1)) === first && monAt(j, box(40)) === second);
  check('com a equipe cheia, a vaga vazia dela não aceita ninguém do PC',
        j.team.members.length === 6 && previewMove(j, box(1), team(6), 6) === 'blocked');
  const outgoing = j.team.members[0];
  const wasActive = j.team.active.indexOf(outgoing.uid);
  check('do PC para cima de alguém da equipe: trocam, e o novo assume o lugar dele em campo',
        moveMon(j, box(1), team(0), 6) && j.team.members[0] === first && monAt(j, box(1)) === outgoing
        && (wasActive === -1 || j.team.active[wasActive] === first.uid) && first.slot === undefined);
  const a = j.team.members[1], b = j.team.members[4];
  check('dentro da equipe, soltar em cima troca a ordem', moveMon(j, team(1), team(4), 6)
        && j.team.members[1] === b && j.team.members[4] === a);
  const out2 = j.team.members[2];
  check('da equipe para uma casa vazia: deposita, e a vaga em campo é completada',
        moveMon(j, team(2), box(70), 6) && monAt(j, box(70)) === out2 && j.team.members.length === 5
        && !j.team.active.includes(out2.uid) && j.team.active.every((uid) => j.team.members.some((m) => m.uid === uid)));
  check('o PC abre caixas conforme enche (8 no mínimo)', boxCount(j) === 8 && boxCount({ pc: [{ slot: 245 }] }) === 10);
}

// ---------------------------------------------- 5.11 ajuste por inicial
console.log('\n[ajuste por inicial]');
{
  const stage = STAGES.gym_1_pewter;
  const saved = stage.starterTuning;
  stage.starterTuning = { squirtle: 1.2 };
  const foe = (starter, id) => new Run('gym_1_pewter', { starter }).spawner.spawnAt(id, 0, 0, 5);
  const base = foe('charmander', 'rattata'), tuned = foe('squirtle', 'rattata');
  check('com o inicial ajustado, os selvagens têm mais vida e dano',
        Math.abs(tuned.maxHp / base.maxHp - 1.2) < 1e-9 && Math.abs(tuned.damage / base.damage - 1.2) < 1e-9);
  const boss = foe('charmander', 'brock_onix'), tunedBoss = foe('squirtle', 'brock_onix');
  check('o líder também', Math.abs(tunedBoss.maxHp / boss.maxHp - 1.2) < 1e-9 && tunedBoss.attackMult === 1.2 && boss.attackMult === 1);
  stage.starterTuning = saved;

  // o líder das últimas fases (0.12.2): vida e dano do time dele multiplicados pela fase
  const late = STAGES.gym_6_saffron;
  const keep = late.bossTuning;
  const ace = () => new Run('gym_6_saffron', { starter: 'charmander' }).spawner.spawnAt('sabrina_alakazam', 0, 0);
  const strong = ace();
  late.bossTuning = undefined;
  const plain = ace();
  late.bossTuning = keep;
  // o líder não acompanha mais a equipe (0.17): upar tem de valer
  const liftRun = new Run('gym_6_saffron', { starter: 'charmander' });
  const at = (level) => {
    liftRun.team.members.forEach((m) => { m.level = level; });
    return liftRun.spawner.spawnAt('sabrina_alakazam', 0, 0);
  };
  const low = at(30), high = at(120);
  check('o líder tem a mesma força com a equipe no nível 30 ou no 120 (upar vale)',
        Math.abs(low.maxHp - high.maxHp) < 1e-6 && low.attackMult === high.attackMult,
        `${Math.round(low.maxHp)} de vida nos dois`);
  // (o attackMult também leva a força da fase, stage.difficulty)
  const force = late.difficulty ?? 1;
  check('nas últimas fases o líder tem mais vida e golpes mais fortes',
        Math.abs(strong.maxHp / plain.maxHp - keep.hp) < 1e-9 && Math.abs(strong.attackMult - keep.damage * force) < 1e-9 &&
        Math.abs(plain.attackMult - force) < 1e-9,
        `vida ×${keep.hp}, dano ×${keep.damage}`);
}

// ---------------------------------------------- 5.12 shiny (só na captura e do jogador)
console.log('\n[shiny]');
{
  const run = new Run('gym_1_pewter', { starter: 'charmander' });
  const chance = CONFIG.capture.shinyChance;
  check('a chance de shiny é rara (1% por opção, padrão)', chance > 0 && chance <= 0.02);
  CONFIG.capture.shinyChance = 1;
  const all = run.captureSystem.rollChoices();
  CONFIG.capture.shinyChance = 0;
  const none = run.captureSystem.rollChoices();
  CONFIG.capture.shinyChance = chance;
  check('cada opção da Poké Ball sorteia o shiny', all.every((p) => p.shiny) && none.every((p) => !p.shiny));
  check('os selvagens nunca são shiny; o inicial só se a jornada sorteou',
        !run.team.members[0].shiny && !run.spawner.spawnAt('rattata', 0, 0, 5).shiny
        && new Run('gym_1_pewter', { starter: 'charmander', starterShiny: true }).team.members[0].shiny === true);
  // (0.23: o Pikachu evolui por pedra; o exemplo é o Rattata, que evolui por nível)
  const member = run.captureSystem.capture('rattata', { shiny: true });
  check('quem é capturado shiny entra shiny e o save guarda', member.shiny && run.team.serialize().members.at(-1).shiny === true);
  const restored = new Run('gym_1_pewter', { team: run.team.serialize() });
  check('carregar o save mantém o shiny', restored.team.members.find((m) => m.pokemonId === 'rattata')?.shiny === true);
  member.level = 19;
  run.progression.addXpTo(member, run.progression.xpToNext(19) + 1);
  check('evoluir mantém o shiny', member.pokemonId === 'raticate' && member.shiny,
        `${member.pokemonId}, shiny: ${member.shiny}`);
  run.captureSystem.captureToPC('pidgey', { shiny: true });
  check('mandado direto para o PC, continua shiny', run.pc.at(-1).shiny === true);
}

// ---------------------------------------------- 5.13 o 2º golpe (data/bonusMoves.js)
console.log('\n[2º golpe]');
{
  const types151 = new Set(Object.values(POKEMON).flatMap((p) => p.types));
  check('3 golpes por tipo, para todos os tipos das 151', [...types151].every((t) => BONUS_BY_TYPE[t]?.length === 3)
        && Object.values(BONUS_MOVES).filter((m) => !m.tmOnly).length === 3 * Object.keys(BONUS_BY_TYPE).length,
        `${Object.keys(BONUS_MOVES).length} golpes em ${Object.keys(BONUS_BY_TYPE).length} tipos`);
  check('o Dive fica fora do sorteio (só vem da TM Dive)', BONUS_MOVES.dive?.tmOnly && !BONUS_BY_TYPE.water.includes('dive'));
  const clash = Object.keys(BONUS_MOVES).filter((id) => ABILITIES[id] || RETIRED_ABILITIES[id] || !abilityFx(id));
  check('cada um com visual e sem repetir o id de um golpe (atual ou que saiu)', clash.length === 0, clash.join(', '));

  // aprender (0.33): a chave do golpe (data/awakening.js) completa libera 4% a cada nível; um só
  const run = new Run('gym_1_pewter', { starter: 'charmander' });
  run.spawner.update = () => {};
  const member = run.team.members[0];
  member.pokemonId = 'charizard';
  member.level = 50;
  const saved = { ...CONFIG.bonusMove };
  check('a chance do Golpe Desperto é de 4% por nível (o pedido do Fellipe)', saved.chancePerLevel === 0.04, String(saved.chancePerLevel));
  CONFIG.bonusMove.secondaryShare = 0;
  CONFIG.bonusMove.chancePerLevel = 1;   // a chance sempre bate: aqui se testa a regra, não a sorte
  const key = run.progression.awakeningKey(member);
  check('a chave do golpe tem 3 melhorias', key.length === 3, key.map((p) => p.up.id).join(', '));
  const keyIds = new Set(key.map((p) => p.up.id));
  // tudo no máximo, menos a última parte da chave (que fica a 1 do fim)
  for (const up of Object.values(UPGRADES)) if (up.abilityId === member.abilities[0] && !up.grantsAbility) member.upgrades[up.id] = up.maxStacks;
  const last = key.at(-1).up;
  member.upgrades[last.id] = last.maxStacks - 1;
  run.progression.addXpTo(member, run.progression.xpToNext(member.level) + 1);
  check('sem a chave completa, o Golpe Desperto não vem (mesmo com as outras no máximo e a chance em 100%)', !member.abilities.some(isBonusMove));
  const other = Object.values(UPGRADES).find((up) => up.abilityId === member.abilities[0] && !keyIds.has(up.id));
  check('as da chave aparecem marcadas na tela de melhoria; as outras não',
        run.progression.isAwakeningPart(last, member) && !run.progression.isAwakeningPart(other, member));
  run.progression.applyUpgrade(last.id, member);
  check('a melhoria que fecha a chave não ensina na hora: só libera a chance',
        run.progression.keyComplete(member) && !member.abilities.some(isBonusMove) && run.unlockQueue.length === 0,
        member.abilities.join(', '));
  CONFIG.bonusMove.chancePerLevel = 0;
  run.progression.addXpTo(member, run.progression.xpToNext(member.level) + 1);
  check('com a chave completa e a chance falhando, subir de nível não ensina', !member.abilities.some(isBonusMove));
  CONFIG.bonusMove.chancePerLevel = 1;
  run.progression.addXpTo(member, run.progression.xpToNext(member.level) + 1);
  const learned = member.abilities.find(isBonusMove);
  check('com a chave completa, a chance bate ao subir de nível (do tipo principal)', BONUS_MOVES[learned]?.type === 'fire', learned);
  check('...e o anúncio entra na fila', run.unlockQueue.length === 1 && run.unlockQueue[0].moveId === learned);
  run.unlockQueue.length = 0;
  run.progression.addXpTo(member, run.progression.xpToNext(member.level) + 1);
  check('um só por Pokémon', member.abilities.filter(isBonusMove).length === 1);
  check('com o golpe desperto, nada mais aparece marcado', !run.progression.isAwakeningPart(last, member));
  member.abilities = member.abilities.filter((id) => !isBonusMove(id));
  CONFIG.bonusMove.secondaryShare = 1;
  run.progression.learnBonusMove(member);
  check('o tipo secundário também ensina (secondaryShare)',
        BONUS_MOVES[member.abilities.find(isBonusMove)]?.type === 'flying', member.abilities.join(', '));
  Object.assign(CONFIG.bonusMove, saved);
  run.unlockQueue.length = 0;

  // quem chega tarde vem treinado pela chave primeiro: no nível 45 (15 melhorias) a chance já vem
  // liberada, mas o golpe só vem subindo de nível (0.33; até a 0.32 já chegava desperto)
  const late = run.team.createMember('gyarados', 45);
  check('capturado no nível alto, chega com a chave feita (a chance liberada), mas sem o golpe',
        run.progression.keyComplete(late) && !late.abilities.some(isBonusMove),
        `${late.abilities.join(' + ')} ${JSON.stringify(late.upgrades)}`);
  check('...sem abrir o anúncio fora de hora', run.unlockQueue.length === 0);
  // o exemplo do Fellipe: Gyarados (Hydro Pump) = Velocidade, Perfuração e Potência; Gloom (Toxic) = Amplitude, Intensidade e Reflexo
  const suffixes = (mon) => run.progression.awakeningKey({ abilities: getPokemon(mon).abilities, upgrades: {} }).map((p) => p.up.id.split('_').pop()).sort().join(',');
  check('as chaves dos exemplos: Gyarados e Gloom', suffixes('gyarados') === 'damage,pierce,speed' && suffixes('gloom') === 'area,cooldown,tick',
        `${suffixes('gyarados')} / ${suffixes('gloom')}`);

  // o dano por acerto: 60% do golpe principal (vezes o ajuste da frequência)
  const companion = run.companions.find((c) => c.member === member);
  run.abilitySystem.refresh();
  const [mainInst, bonusInst] = [companion.abilities[0], companion.abilities.find((i) => isBonusMove(i.abilityId))];
  check('o 2º golpe bate 60% do principal', Math.abs(bonusInst.stats.damage
        - mainInst.stats.damage * 0.6 * (BONUS_MOVES[bonusInst.abilityId].base.hitScale ?? 1)) < 1e-6);

  // cada um dos 51 dispara de verdade numa partida curta
  const silent = [];
  for (const id of Object.keys(BONUS_MOVES)) {
    const r = new Run('gym_1_pewter', { starter: 'charmander' });
    r.spawner.update = () => {};
    const m = r.team.members[0];
    m.level = 30;
    m.abilities.push(id);
    r.rebuildCompanionAbilities();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2, d = 90 + (i % 4) * 70;
      r.spawner.spawnAt('rattata', r.player.x + Math.cos(a) * d, r.player.y + Math.sin(a) * d, 12);
    }
    let seen = false;
    for (let f = 0; f < 60 * 7 && !seen; f++) {
      r.update(1 / 60, { x: Math.cos(f / 40), y: Math.sin(f / 40) });
      if (r.state !== 'running') { r.state = 'running'; r.levelUpMember = null; r.pendingBall = false; r.pendingGift = null; }
      const c = r.companions[0];
      seen = [...r.projectiles, ...r.zones, ...r.orbs, ...r.effects].some((o) => o.abilityId === id && !o.dead)
        || r.buffs.reflect > 0 || c?.dance?.t > 0;
    }
    if (!seen) silent.push(id);
  }
  check(`os ${Object.keys(BONUS_MOVES).length} golpes disparam numa partida curta`, silent.length === 0, silent.join(', '));

  // Dive (0.34, a TM Dive): o Pokémon some (intocável) e o impacto sai na horda mais perto
  {
    const r = new Run('gym_1_pewter', { starter: 'squirtle' });
    r.spawner.update = () => {};
    const c = r.companions[0];
    c.member.abilities.push('dive');
    r.rebuildCompanionAbilities();
    const near = r.spawner.spawnAt('rattata', c.x + 120, c.y, 5);
    r.spawner.spawnAt('rattata', c.x - 420, c.y, 5);
    r.update(1 / 60, { x: 0, y: 0 });
    c.invulnTimer = 0;
    r.abilitySystem.fire(c, c.abilities.find((i) => i.abilityId === 'dive'));
    const hit = r.zones.filter((z) => z.abilityId === 'dive').at(-1);
    check('Dive: o impacto sai embaixo da horda mais perto, e o Pokémon fica intocável no mergulho',
          !!hit && Math.hypot(hit.x - near.x, hit.y - near.y) < 40 && c.invulnTimer >= BONUS_MOVES.dive.base.delay);
  }

  // Whirlpool longe do próprio Pokémon; cura dentro do teto; Hex; Acid Spray; Reflect
  {
    const r = new Run('gym_1_pewter', { starter: 'squirtle' });
    r.spawner.update = () => {};
    const c = r.companions[0];
    c.member.abilities.push('whirlpool_zone');
    r.rebuildCompanionAbilities();
    r.spawner.spawnAt('rattata', c.x + 60, c.y, 5);
    const far = r.spawner.spawnAt('rattata', c.x + 300, c.y + 40, 5);
    r.update(1 / 60, { x: 0, y: 0 });   // a grade dos inimigos é refeita a cada quadro
    r.abilitySystem.fire(c, c.abilities.find((i) => i.abilityId === 'whirlpool_zone'));
    const pool = r.zones.filter((z) => z.abilityId === 'whirlpool_zone').at(-1);
    check('o Whirlpool nasce longe do próprio Pokémon (na horda de longe)',
          !!pool && Math.hypot(pool.x - c.x, pool.y - c.y) >= 200 && Math.hypot(pool.x - far.x, pool.y - far.y) < 40);

    c.member.hp = 10;
    const cap = CONFIG.bonusMove.healPerSecond * c.maxHp(r.playerStats.pokemonHpBonus);
    c.healBudget = 0;
    for (let f = 0; f < 60; f++) { r.abilitySystem._tickCompanion(c, 1 / 60); bonusHeal(r, c, 999); }
    check('a cura do 2º golpe para no teto por segundo', c.member.hp - 10 <= cap * 1.05, `${(c.member.hp - 10).toFixed(1)} de ${cap.toFixed(1)}`);

    const a = r.spawner.spawnAt('rattata', 900, 900, 5), b = r.spawner.spawnAt('rattata', 930, 900, 5);
    r.update(1 / 60, { x: 0, y: 0 });
    const before = b.hp;
    damageEnemy(r, a, 1, { effects: { curse: { area: 90, ratio: 50, duration: 5 } } });
    damageEnemy(r, a, 9999, {});
    check('Hex: o amaldiçoado explode nos vizinhos ao morrer', b.hp < before);
    const w = r.spawner.spawnAt('rattata', 600, 600, 5);
    const hp0 = w.hp;
    damageEnemy(r, w, 10, { effects: { weak: { amount: 0.25, duration: 4 } } });
    const hp1 = w.hp;
    damageEnemy(r, w, 10, {});
    check('Acid Spray: o enfraquecido leva 25% a mais', Math.abs((hp1 - w.hp) - 1.25 * (hp0 - hp1)) < 1e-6);
    r.buffs.reflect = 2;
    c.member.hp = 100;
    c.invulnTimer = 0;
    r.damageCompanion(c, 20);
    check('Reflect: a equipe leva 40% menos dano', Math.abs(c.member.hp - 88) < 1e-6, `${c.member.hp}`);
  }

  // a vantagem de tipo (0.32): a tabela completa, o status com tipo e a defesa
  {
    check('a tabela tem as resistências do próprio tipo e os tipos que faltavam',
          typeMultiplier('fire', ['fire']) === 0.5 && typeMultiplier('water', ['water']) === 0.5
          && typeMultiplier('ice', ['dragon']) === 2 && typeMultiplier('dragon', ['dragon']) === 2
          && typeMultiplier('ghost', ['normal']) === 0 && typeMultiplier('grass', ['rock', 'ground']) === 4);
    const r = new Run('gym_1_pewter', { starter: 'charmander' });
    r.spawner.update = () => {};
    const ember = { type: 'fire', effects: { burn: { dps: 4, duration: 2.5 } } };
    const geodude = r.spawner.spawnAt('geodude_wild', 700, 700, 5);
    const paras = r.spawner.spawnAt('paras', 760, 700, 5);
    const growlithe = r.spawner.spawnAt('blaine_growlithe', 820, 700, 5);
    damageEnemy(r, geodude, 1, ember);
    damageEnemy(r, paras, 1, ember);
    damageEnemy(r, growlithe, 1, ember);
    check('a queimadura respeita o tipo: metade no Geodude, 4x no Paras e nada no Fogo',
          geodude.status.burn?.dps === 2 && paras.status.burn?.dps === 16 && !growlithe.status.burn,
          `${geodude.status.burn?.dps} / ${paras.status.burn?.dps} / ${growlithe.status.burn?.dps}`);
    const c = r.companions[0];   // o Charmander
    const hit = (type) => { c.member.hp = 100; c.invulnTimer = 0; r.damageCompanion(c, 20, type); return 100 - c.member.hp; };
    const rock = hit('rock'), fire = hit('fire'), plain = hit(null);
    check('a defesa por tipo: Pedra pega 1,5x no Charmander, Fogo 0,67x, sem tipo 1x',
          Math.abs(rock - 30) < 1e-6 && Math.abs(fire - 13.4) < 1e-6 && Math.abs(plain - 20) < 1e-6, `${rock} / ${fire} / ${plain}`);
    // a imunidade vale 1x no dano recebido, mas o golpe continua do tipo dele
    c.member.pokemonId = 'pidgey';
    const flyingHit = hit('ground');
    c.member.pokemonId = 'pikachu';
    const electricHit = hit('ground');
    c.member.pokemonId = 'charmander';
    check('o Voador toma o golpe de Terra como um golpe comum (1x), e o Elétrico continua tomando o super efetivo (1,5x)',
          Math.abs(flyingHit - 20) < 1e-6 && Math.abs(electricHit - 30) < 1e-6, `${flyingHit} / ${electricHit}`);
    const brockTeam = leaderTeamTypes(STAGES.gym_1_pewter);
    const weak = teamWeaknesses(brockTeam).weak.map((w) => w.type);
    const vsBrock = (id) => matchupAgainst(id, moveTypesOf(id), brockTeam);
    check('o time do Brock é fraco a Água e Planta (4x); o Squirtle bate 4x nele e o Charmander bate pela metade e apanha mais',
          ['water', 'grass'].includes(weak[0]) && weak.includes('fighting')
          && vsBrock('squirtle').offense === 2 && vsBrock('charmander').offense === -1 && vsBrock('charmander').defense === 1);
  }

  // o tremor de tela só existe nos golpes dos líderes (0.14)
  {
    const r = new Run('gym_1_pewter', { starter: 'charmander' });
    r.spawner.update = () => {};
    let shakes = 0;
    r.shake = () => { shakes++; };
    const c = r.companions[0];
    c.member.abilities = ['earthquake'];
    r.rebuildCompanionAbilities();
    r.spawner.spawnAt('rattata', c.x + 40, c.y, 5);
    for (let f = 0; f < 120; f++) r.update(1 / 60, { x: 0, y: 0 });
    const mine = shakes;
    const boss = r.spawner.spawnAt('brock_onix', c.x + 200, c.y, 12);
    r.abilitySystem.fireHostile(boss, 'boss_shockwave');
    for (let f = 0; f < 120; f++) r.update(1 / 60, { x: 0, y: 0 });
    check('tremor de tela só nos golpes dos líderes', mine === 0 && shakes > 0, `${mine} do jogador, ${shakes - mine} do líder`);
  }
}

// ---------------------------------------------- 5.13b lendários e o nível de quem tem tudo (0.16)
console.log('\n[lendários e Golpe Desperto]');
{
  const run = new Run('gym_1_pewter', { starter: 'charmander' });
  run.spawner.update = () => {};
  run.team.members[0].pokemonId = 'charizard';   // não evolui: a evolução curaria tudo e abriria a tela dela
  run.team.members[0].level = 40;

  // o lendário chega com o exclusivo, as melhorias do kit e o 2º golpe, no nível da equipe
  const mew = run.captureSystem.capture('mew');
  const kit = LEGENDARY_KITS.mew;
  check('o lendário chega com o golpe exclusivo', mew.abilities[0] === 'metronome' && LEGENDARY_MOVES.metronome.exclusive === 'mew');
  check('...com as melhorias do kit (no mínimo)', Object.entries(kit.upgrades).every(([suffix, n]) => mew.upgrades[`metronome_${suffix}`] >= n),
        JSON.stringify(mew.upgrades));
  check('...com o 2º golpe já aprendido', mew.abilities.includes(kit.bonusMove), mew.abilities.join(', '));
  check('...e no nível da equipe (os outros entram 3 abaixo)', mew.level === 40, `nível ${mew.level}`);
  const strongest = Object.values(POKEMON).filter((p) => p.rarity !== 'legendary').reduce((a, b) => (b.power > a.power ? b : a));
  check('todo lendário tem mais poder que qualquer outro Pokémon',
        Object.keys(LEGENDARY_KITS).every((id) => POKEMON[id].power > strongest.power), `o mais forte comum: ${strongest.name} ${strongest.power}`);
  check('o golpe exclusivo é o fim da linha (sem TM acima)', nextMoveFor('mew', 'metronome') === null);

  // save antigo: o lendário com Psybeam passa para o exclusivo levando as melhorias, sem somar o kit de novo
  const old = new Run('gym_1_pewter', { team: { members: [
    { uid: 'm2', pokemonId: 'mewtwo', level: 60, abilities: ['psybeam'], upgrades: { psybeam_damage: 4, psybeam_count: 2 } }
  ], active: ['m2'] } });
  const m2 = old.team.members[0];
  check('save antigo: lendário passa para o golpe exclusivo, com as melhorias e o 2º golpe',
        m2.abilities[0] === 'psystrike' && m2.upgrades.psystrike_damage === 5 && m2.abilities.includes('future_sight') &&
        !m2.upgrades.psybeam_damage, `${m2.abilities.join(' + ')} ${JSON.stringify(m2.upgrades)}`);
  const again = new Run('gym_1_pewter', { team: old.team.serialize() }).team.members[0];
  check('carregar de novo não soma o kit outra vez', JSON.stringify(again.upgrades) === JSON.stringify(m2.upgrades));

  // com todas as melhorias, o nível de melhoria cura 20% sozinho e não abre tela
  const member = run.team.members[0];
  member.abilities = member.abilities.filter((id) => !isBonusMove(id));
  for (let pass = 0; pass < 6; pass++) {
    for (const up of Object.values(UPGRADES)) if (up.abilityId === member.abilities[0] || member.abilities.includes(up.abilityId)) member.upgrades[up.id] = up.maxStacks;
  }
  const saved = { tm: CONFIG.progression.tmChance };
  CONFIG.progression.tmChance = 0;
  // com tudo no máximo a chave também está: um Golpe Desperto já aprendido deixa a cura sozinha à prova
  member.abilities.push(BONUS_BY_TYPE[getPokemon(member.pokemonId).types[0]][0]);
  const bonus = run.playerStats.pokemonHpBonus;
  member.level = 41;   // o próximo (42) é nível de melhoria
  member.hp = 10;
  member.pendingLevels = 0;
  run.progression.addXpTo(member, run.progression.xpToNext(41) + 1);
  check('com todas as melhorias, o nível de melhoria cura sozinho (sem tela)',
        member.pendingLevels === 0 && member.hp > 10 + maxHpFor(member, bonus) * 0.2 - 0.5 && member.hp < maxHpFor(member, bonus),
        `${Math.round(member.hp)}/${maxHpFor(member, bonus)} HP, ${member.pendingLevels} pendentes`);
  run.state = 'running';
  run._checkState();
  check('...e a partida segue', run.state === 'running', run.state);
  member.pendingLevels = 2;
  member.hp = 10;
  run._checkState();
  check('níveis guardados de quem já tem tudo viram cura', member.pendingLevels === 0 && member.hp > 10 && run.state === 'running');

  // o Golpe Desperto abre o anúncio (uma tela só); a chance de 4% bate sempre aqui
  const chance = CONFIG.bonusMove.chancePerLevel;
  CONFIG.bonusMove.chancePerLevel = 1;
  member.abilities = member.abilities.filter((id) => !isBonusMove(id));
  run.progression.addXpTo(member, run.progression.xpToNext(member.level) + 1);
  run._checkState();
  check('aprender o Golpe Desperto abre o anúncio', run.state === 'unlock' && run.unlockQueue.length === 1 &&
        member.abilities.includes(run.unlockQueue[0].moveId), run.state);
  CONFIG.bonusMove.chancePerLevel = chance;
  CONFIG.progression.tmChance = saved.tm;
}

// ---------------------------------------------- 5.13c onde os lendários aparecem (0.18)
console.log('\n[encontros de lendário]');
{
  const LEG = Object.keys(LEGENDARY_KITS);
  const legendaryIn = (choices) => choices.filter((p) => LEG.includes(p.id)).map((p) => p.id);
  const keep = JSON.parse(JSON.stringify(LEGENDARY_ENCOUNTERS));

  // antes da Fase 7, nunca
  const early = new Run('gym_6_saffron', { starter: 'charmander' });
  let seen = 0;
  for (let i = 0; i < 2000; i++) seen += legendaryIn(early.captureSystem.rollChoices()).length;
  check('antes da Fase 7 nenhum lendário aparece', seen === 0, `${seen} em 2000 Poké Balls`);

  // a chance da fase: ~2% na Fase 7, e só aves
  const rate = new Run('gym_7_cinnabar', { starter: 'charmander' });
  let hits = 0;
  for (let i = 0; i < 4000; i++) {
    rate.legendariesOffered.clear();
    const found = legendaryIn(rate.captureSystem.rollChoices());
    hits += found.length;
    if (found.some((id) => id === 'mewtwo' || id === 'mew')) hits = -1e9;
  }
  const pct = hits / 4000;
  const want = LEGENDARY_ENCOUNTERS.gym_7_cinnabar.chance;
  check(`na Fase 7 a chance é baixa (~${want * 100}%) e só aparecem as aves`, Math.abs(pct - want) < 0.01, `${(pct * 100).toFixed(2)}%`);

  // um de cada: na mesma tentativa não repete, mesmo recusado; quem está no PC não volta
  for (const enc of Object.values(LEGENDARY_ENCOUNTERS)) enc.chance = 1;
  const run = new Run('gym_8_viridian', { starter: 'charmander', ownedElsewhere: ['zapdos'] });
  const offered = [];
  for (let i = 0; i < 6; i++) {
    const choices = run.captureSystem.rollChoices();
    offered.push(...legendaryIn(choices));
    check(`Poké Ball ${i + 1}: continua com 4 opções`, choices.length === 4);
  }
  check('na mesma tentativa cada lendário aparece uma vez só', new Set(offered).size === offered.length, offered.join(', '));
  check('um lendário que já está no PC da jornada não volta', !offered.includes('zapdos') && offered.length === 2,
        offered.join(', '));
  const liga = new Run('champion', { starter: 'charmander' });
  liga.captureSystem.capture('mewtwo');
  const ligaOffers = [];
  for (let i = 0; i < 8; i++) ligaOffers.push(...legendaryIn(liga.captureSystem.rollChoices()));
  check('quem está na equipe não volta; na Liga também vêm Mewtwo e Mew',
        !ligaOffers.includes('mewtwo') && ligaOffers.includes('mew'), ligaOffers.join(', '));
  check('o Campeão tem uma Poké Ball (para o lendário)', liga.stage.maxBalls === 1);
  for (const [id, enc] of Object.entries(keep)) Object.assign(LEGENDARY_ENCOUNTERS[id], enc);
}

// ---------------------------------------------- 5.13g quem chega tarde vem treinado (0.26)
console.log('\n[quem chega tarde vem treinado]');
{
  const run = new Run('gym_1_pewter', { starter: 'charmander' });
  run.team.members[0].level = 60;
  const total = (m) => Object.values(m.upgrades).reduce((a, b) => a + b, 0);
  const gengar = run.captureSystem.capture('gengar');
  check('capturado no nível alto chega com as melhorias do nível (1 a cada 3), até completar',
        gengar.level === 57 && total(gengar) === 18 && run.progression.isMaxed(gengar), `nível ${gengar.level}, ${total(gengar)} melhorias`);
  const low = run.team.createMember('pidgey', 9);
  check('...e o dano vem primeiro', low.upgrades[`${low.abilities[0]}_damage`] === 3 && total(low) === 3, JSON.stringify(low.upgrades));
  // quem já estava na jornada sem melhorias é completado ao carregar a equipe; o ▲ guardado conta
  const saved = { members: [
    { uid: 'g', pokemonId: 'gengar', level: 139, xp: 0, hp: 0, abilities: ['shadow_ball'], upgrades: {} },
    { uid: 'p', pokemonId: 'pidgey', level: 12, xp: 0, hp: 0, abilities: ['gust'], upgrades: { gust_damage: 1 }, pendingLevels: 2 }
  ], active: ['g', 'p'] };
  const [oldGengar, pidgey] = new Run('gym_1_pewter', { team: saved }).team.members;
  check('quem já estava na jornada sem melhorias é completado ao carregar', total(oldGengar) === 18, `${total(oldGengar)}`);
  check('...e os níveis guardados no ▲ não são dados de novo', total(pidgey) === 2, JSON.stringify(pidgey.upgrades));
}

// ---------------------------------------------- 5.13f evolução por item (0.23)
console.log('\n[evolução por item]');
{
  const { evolveMember, learnNextMove } = await import('../src/systems/moves.js');
  const run = new Run('gym_1_pewter', { starter: 'charmander' });
  run.spawner.update = () => {};
  const pikachu = run.team.add('pikachu', 40);
  const pidgey = run.team.add('pidgey', 17);
  run.progression.addXpTo(pikachu, run.progression.xpToNext(40) + 1);
  run.progression.addXpTo(pidgey, run.progression.xpToNext(17) + 1);
  check('quem evolui por pedra não evolui mais por nível', pikachu.pokemonId === 'pikachu', `${pikachu.pokemonId} no nível ${pikachu.level}`);
  check('quem evolui por nível continua evoluindo', pidgey.pokemonId === 'pidgeotto');
  // a pedra do Poké Mart: a Eevee escolhe pela pedra, e o golpe acompanha
  const eevee = { pokemonId: 'eevee', level: 30, abilities: ['quick_attack'], upgrades: { quick_attack_damage: 2 } };
  const result = evolveMember(eevee, 'jolteon');
  check('a pedra evolui na hora (Eevee + Pedra do Trovão = Jolteon), levando as melhorias',
        result?.to.id === 'jolteon' && eevee.pokemonId === 'jolteon' && POKEMON.jolteon.moveLine.includes(eevee.abilities[0])
        && Object.values(eevee.upgrades).reduce((a, b) => a + b, 0) >= 2, `${eevee.abilities[0]} ${JSON.stringify(eevee.upgrades)}`);
  const kadabra = { pokemonId: 'kadabra', level: 36, abilities: ['psybeam'], upgrades: {} };
  evolveMember(kadabra, 'alakazam');
  check('o Cabo de Troca evolui quem evolui por troca', kadabra.pokemonId === 'alakazam');
  const charm = { pokemonId: 'charmander', level: 10, abilities: ['ember'], upgrades: { ember_damage: 3 } };
  check('a TM ensina o próximo golpe da linha, com as melhorias',
        learnNextMove(charm) === 'flamethrower' && charm.upgrades.flamethrower_damage === 3);
  const top = { pokemonId: 'charizard', level: 50, abilities: ['fire_blast'], upgrades: {} };
  check('no fim da linha a TM não ensina nada', learnNextMove(top) === null);
}

// ---------------------------------------------- 5.13e ids dos Pokémon (0.20.1)
console.log('\n[ids dos Pokémon]');
{
  // o bug: o id recomeçava a cada sessão; um capturado hoje repetia o de um salvo ontem
  const mk = (uid, pokemonId, level) => ({ uid, pokemonId, level, xp: 0, hp: 0, abilities: [], upgrades: {} });
  const saved = { members: [mk('mon1', 'bulbasaur', 30), mk('mon2', 'pidgey', 30), mk('mon1', 'clefable', 30), mk('mon2', 'poliwrath', 30)],
                  active: ['mon1', 'mon2', null] };
  const run = new Run('gym_1_pewter', { team: saved });
  const ids = run.team.members.map((m) => m.uid);
  check('um save com ids repetidos é consertado ao carregar', new Set(ids).size === ids.length, ids.join(', '));
  check('...e quem estava em campo continua em campo', run.team.active[0].pokemonId === 'bulbasaur' && run.team.active[1].pokemonId === 'pidgey');
  const bonus = run.playerStats.pokemonHpBonus;
  check('...com a vida de cada um certa (a barra do HUD não fica vazia)',
        run.team.members.every((m) => m.hp === maxHpFor(m, bonus)));

  // capturar trocando um que está em campo: ele sai do mapa, e o novo entra
  const fresh = new Run('gym_1_pewter', { starter: 'charmander' });
  ['pidgey', 'rattata', 'spearow', 'caterpie', 'weedle'].forEach((id) => fresh.team.add(id, 10));
  const leaving = fresh.team.active[1];
  fresh.captureSystem.captureReplacing(leaving.uid, 'oddish');
  check('capturar no lugar de um ativo tira ele do campo e põe o novo',
        !fresh.companions.some((c) => c.member === leaving) && fresh.companions.some((c) => c.member.pokemonId === 'oddish')
        && fresh.companions.length === 3, fresh.companions.map((c) => c.member.pokemonId).join(', '));
  const all = [...fresh.team.members.map((m) => m.uid), ...fresh.pc.map((m) => m.uid)];
  check('os ids novos não se repetem', new Set(all).size === all.length);

  // a jornada (equipe + PC) também é consertada
  const journey = { team: { members: [mk('mon3', 'abra', 20), mk('mon4', 'gastly', 20)], active: ['mon3'] },
                    pc: [mk('mon3', 'zubat', 10), mk('mon4', 'onix', 10), mk('mon4', 'jynx', 10)] };
  fixDuplicateUids(journey);
  const jids = [...journey.team.members, ...journey.pc].map((m) => m.uid);
  check('a jornada com ids repetidos entre a equipe e o PC é consertada', new Set(jids).size === jids.length
        && journey.team.members[0].uid === 'mon3', jids.join(', '));
}

// ---------------------------------------------- 5.13d Modo Livre (0.20)
console.log('\n[Modo Livre]');
{
  const run = new Run('gym_1_pewter', { starter: 'charmander' });
  run.team.add('pidgey', 20);
  const [lead] = run.team.members;
  lead.level = 30;
  // depois do líder: vitória
  run.time = run.stage.duration + 1;
  Object.assign(run.spawner, { bossSpawned: true, bossQueue: [], boss: { dead: true } });
  run.state = 'victory';
  lead.fainted = true;
  lead.hp = 0;
  run.team.active[0] = null;
  run.startEndless();
  const bonus = run.playerStats.pokemonHpBonus;
  check('o Modo Livre começa com a equipe curada e de volta ao campo',
        run.state === 'running' && run.endless && run.team.members.every((m) => !m.fainted && m.hp === maxHpFor(m, bonus))
        && run.team.active.includes(lead));
  // XP pela metade
  const before = run.team.members.map((m) => m.xp);
  run.progression.addXp(10);
  const gained = run.team.members.reduce((sum, m, i) => sum + (m.xp - before[i]), 0);
  check('o XP no Modo Livre é reduzido', Math.abs(gained - 10 * run.playerStats.xpGain * CONFIG.endless.xpMult) < 1e-6,
        `${gained.toFixed(1)} de 10`);
  // 3 minutos: a fase não termina, os inimigos vêm e ficam mais fortes
  const wild = run.stage.waves[0].enemies[0].id;
  const hpAt = () => run.spawner.spawnAt(wild, 0, 0).maxHp;
  const hpStart = hpAt();
  run.stats.ballsDropped = run.stage.maxBalls;   // o teto da fase já esgotado
  const ballsBefore = run.stats.ballsDropped;
  CONFIG.debug.godMode = true;
  let victories = 0;
  for (let i = 0; i < 181 * 60; i++) {
    run.update(1 / 60, { x: Math.sin(i / 90), y: Math.cos(i / 70) });
    if (run.state === 'victory') victories++;
    if (run.state !== 'running') { run.state = 'running'; run.levelUpMember = null; run.pendingBall = false; run.evolutionQueue.length = 0; run.unlockQueue.length = 0; }
  }
  CONFIG.debug.godMode = false;
  const factor = run.spawner.endlessFactor;
  check('no Modo Livre a fase não termina e os inimigos continuam vindo', victories === 0 && run.stats.kills > 20,
        `${run.stats.kills} abates em 3 min`);
  check('...e ficam mais fortes a cada minuto',
        Math.abs(factor - Math.pow(CONFIG.endless.growthPerMinute, run.spawner.endlessMinutes)) < 0.01 &&
        Math.abs(hpAt() / hpStart - factor) < 0.01, `×${factor.toFixed(2)} em 3 min`);
  check('no Modo Livre cai uma Poké Ball a cada 3 minutos, fora do teto da fase',
        run.stats.ballsDropped - ballsBefore === 1,
        `${run.stats.ballsDropped - ballsBefore} em 3 min, com o teto da fase (${run.stage.maxBalls}) já esgotado`);
}

// ---------------------------------------------- 5.14 métricas da fase (o Estojo de Insígnias)
console.log('\n[métricas da fase]');
{
  let s = recordStageResult(undefined, { victory: false, time: 200, faints: 6, level: 15, captures: 2, damage: 1000.6, team: [], date: 'a' });
  check('derrota conta a tentativa, as capturas e o dano, mas não vitória',
        s.attempts === 1 && s.wins === 0 && s.captures === 2 && s.damage === 1001 && s.bestTime === null);
  s = recordStageResult(s, { victory: true, time: 250.4, faints: 3, level: 18, captures: 1, damage: 500,
    team: [{ uid: 'x', pokemonId: 'charmander', level: 18 }], date: 'b' });
  s = recordStageResult(s, { victory: true, time: 240, faints: 1, level: 20, captures: 0, damage: 0, team: [], date: 'c' });
  check('vitórias guardam o melhor tempo, os menos desmaios e o maior nível',
        s.attempts === 3 && s.wins === 2 && s.bestTime === 240 && s.fewestFaints === 1 && s.bestLevel === 20);
  check('a primeira vitória fica com a data e a equipe dela (só espécie e nível)',
        s.firstWin.date === 'b' && s.firstWin.team.length === 1 && !('uid' in s.firstWin.team[0]));
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

// ----------------------------------------------------------- 6c. conteúdo novo
console.log('\n[conteúdo]');
{
  // presentes da Fase 6, um de cada vez: a troca do Lickitung e o Dojo de Saffron
  const dojo = new Run('gym_6_saffron', { starter: 'charmander' });
  dojo.time = STAGES.gym_6_saffron.gifts[1].at + 1;   // depois dos dois presentes, antes do líder
  dojo.update(DT, { x: 0, y: 0 });
  const first = dojo.captureSystem.rollChoices().map((p) => p.id).join(',');
  dojo.pendingGift = null;
  dojo.state = 'running';
  dojo.update(DT, { x: 0, y: 0 });
  const offered = dojo.captureSystem.rollChoices().map((p) => p.id).sort().join(',');
  check('presentes chegam um de cada vez: primeiro a troca do Lickitung', first === 'lickitung', first);
  check('o Dojo de Saffron oferece Hitmonlee ou Hitmonchan', dojo.state === 'capture' && offered === 'hitmonchan,hitmonlee', offered);

  // o rival monta o time pelo inicial do jogador, como no FireRed
  const aceOf = (starter) => new Run('champion', { starter, campaignStarter: starter }).spawner.bossQueue.at(-1);
  check('o ace do rival depende do seu inicial',
        aceOf('charmander') === 'rival_blastoise' && aceOf('bulbasaur') === 'rival_charizard' && aceOf('squirtle') === 'rival_venusaur',
        `${aceOf('charmander')} / ${aceOf('bulbasaur')} / ${aceOf('squirtle')}`);

  // selvagem com nível: mais vida e mais XP que o mesmo selvagem sem nível
  const lvRun = new Run('gym_5_fuchsia', { starter: 'charmander' });
  const plain = lvRun.spawner.spawnAt('gastly', 10, 10);
  const leveled = lvRun.spawner.spawnAt('gastly', 10, 10, 30);
  check('selvagem de nível alto tem mais vida e dá mais XP',
        leveled.maxHp > plain.maxHp * 3 && leveled.xp > plain.xp && leveled.level === 30,
        `${Math.round(plain.maxHp)} → ${Math.round(leveled.maxHp)} de vida`);

  // Kanto inteira: 151 espécies e as 13 etapas jogáveis
  // (o Kyogre, 0.37, é o lendário secreto: fora das 151, como as 2 fases do salão estão fora da campanha)
  const kanto = Object.values(POKEMON).filter((p) => !p.secret);
  check('os 151 de Kanto são jogáveis', kanto.length === 151, `${kanto.length}`);
  const campaign = Object.values(STAGES).filter((st) => !st.secret);
  check('as 13 etapas de Kanto existem', campaign.length === 13, `${campaign.length}`);
}

// ----------------------------------------------------------- 6b. treinador
console.log('\n[treinador]');
{
  // O movimento é livre; o sprite do FireRed só tem 4 poses (ver facingDir).
  const world = { width: 2000, height: 2000 };
  const stats = { speed: CONFIG.trainer.speed };
  const player = new Player(1000, 1000);
  const walk = (x, y, frames = 20) => { for (let i = 0; i < frames; i++) player.update(DT, { x, y }, stats, world); };
  const d = Math.SQRT1_2;

  walk(0, -1);
  walk(d, -d);
  check('na diagonal, segue com a pose que já fazia parte do movimento', player.dir === 'up');
  walk(-1, 0);
  walk(d, -d);
  check('numa diagonal nova, o treinador fica de lado', player.dir === 'right');
  check('analógico quase reto usa o eixo mais forte', facingDir({ x: 0.2, y: 0.98 }, 'left') === 'down');

  const x0 = player.x;
  const y0 = player.y;
  walk(d, d, 60);
  check('o movimento na diagonal continua livre e com a mesma velocidade',
        Math.abs((player.x - x0) - (player.y - y0)) < 1e-6 &&
        Math.abs(Math.hypot(player.x - x0, player.y - y0) - CONFIG.trainer.speed) < 1,
        `${Math.hypot(player.x - x0, player.y - y0).toFixed(1)} px em 1s`);

  const stride = player.stride;
  walk(0, 0);
  check('parado, o passo não avança', !player.moving && player.stride === stride);
}

// ----------------------------------------------------------- 7. save/load
console.log('\n[save]');
{
  const { run } = simulate('gym_1_pewter', 'squirtle', { maxSeconds: 60 });
  const profile = createProfile();
  regionProgress(profile).starter = 'squirtle';
  profile.trainer = 'leaf';
  profile.pokedex.caught.push(7, 60);

  const data = SaveManager.build({ profile, run: run.serialize() });
  const json = SaveManager.toJSON(data);
  const parsed = SaveManager.parse(JSON.parse(json));

  check('save vira JSON válido', json.length > 100 && parsed.profile.regions.kanto.starter === 'squirtle');
  check('save guarda o treinador escolhido', parsed.profile.trainer === 'leaf');

  // save de antes das regiões: a campanha ficava em `campaign`, sem insígnias registradas
  const legacy = normalizeProfile({
    shards: 50,
    campaign: { region: 'Kanto', starter: 'charmander', clearedStages: ['gym_1_pewter'], badges: [], journey: null }
  });
  check('save antigo migra a campanha para a região Kanto',
        legacy.regions.kanto.starter === 'charmander' && legacy.campaign === undefined &&
        legacy.region === 'kanto' && legacy.regions.kanto.region === undefined);
  check('save antigo recebe a insígnia das fases de ginásio já vencidas',
        legacy.regions.kanto.badges.includes('Insígnia Pedra') && legacy.stats.badges === 1);
  check('save antigo pede a escolha de treinador', legacy.trainer === null);
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

// ------------------------------------------- a descida do Dive (0.36, PLANEJAMENTO-DIVE.md)
console.log('\n[a descida do Dive — nunca é impossível, só água navegável]');
{
  // a prova: um jogador perfeito que só enxerga a horda depois do aviso mais 0,25 s de reação,
  // andando, com bolhas infinitas, não pode ser pego nunca (hordas sobre hordas, e sempre uma saída)
  const hits = [], events = [], active = [];
  for (let lv = 0; lv < DIVE.levels.length; lv++) {
    let h = 0, e = 0, a = 0, f = 0;
    for (let run = 0; run < 12; run++) {
      const d = new Dive();
      d.start(lv);
      d.lives = 999;
      for (let g = 0; d.mode === 'play' && d.level === lv && g < 60 * 400; g++) {
        d.update(1 / 60, d.botDir(DIVE.react));
        a += d.lanes.filter((l) => d.clock >= l.t0 && d.clock < laneEnd(l)).length;
        f++;
      }
      h += 999 - d.lives;
      e += d.spawned;
    }
    hits.push(h); events.push(e); active.push(a / f);
  }
  const total = events.reduce((s, n) => s + n, 0);
  check('com 0,25 s de reação, o jogador perfeito nunca é pego (toda horda tem saída)',
        hits.every((h) => h === 0), `${hits.reduce((s, n) => s + n, 0)} acertos em ${total} hordas`);
  check('cada nível solta todas as hordas dele', events.every((e, i) => e === DIVE.levels[i].count * 12), events.join(', '));
  check('hordas sobre hordas: mais de 4 ao mesmo tempo no Nível 5, o último', active[4] > 4,
        active.map((n) => n.toFixed(1)).join(', '));

  // e o contrário: parado no meio do tabuleiro, as hordas pegam (o modo tem desafio)
  let ended = null;
  const still = new Dive({ onEnd: (r) => { ended = r; } });
  still.start(2);
  still.p.c = 4; still.p.r = 3;
  for (let i = 0; i < 60 * 60 && still.mode !== 'over'; i++) still.update(1 / 60, null);
  check('parado, ele perde as 3 bolhas e vai para o resgate', ended === 'rescued' && still.lives === 0);
  // o checkpoint (0.37.4): perder depois do bolsão de ar oferece continuar do Nível 4
  let late = null;
  const after = new Dive({ onEnd: (r) => { late = r; } });
  after.start(DIVE.airPocketLevel);
  after.p.c = 4; after.p.r = 3;
  for (let i = 0; i < 60 * 60 && after.mode !== 'over'; i++) after.update(1 / 60, null);
  check('depois do bolsão de ar, perder as bolhas é o checkpoint (continuar do Nível 4)', late === 'checkpoint' && after.checkpoint);

  // os tabuleiros: 10x6 tiles, todos navegáveis no Emerald (colisão 0, elevação 3)
  const boardsOk = DIVE_WORLD.boards.every(([map, x, y]) => {
    const m = DIVE_WORLD.maps[map];
    for (let r = 0; r < 6; r++) for (let c = 0; c < 10; c++) if (!isNav(map, x - m.ox + c, y - m.oy + r)) return false;
    return true;
  });
  check('os tabuleiros (um por nível) são inteiramente de água navegável', DIVE_WORLD.boards.length >= DIVE.levels.length && boardsOk);

  // as animações entre os níveis: o mergulhador nunca passa por cima da rocha
  let bad = 0, frames = 0, pocket = null, last = null;
  for (let lv = 0; lv < DIVE.levels.length; lv++) {
    const d = new Dive({ onEnd: (r) => { last = r; } });
    d.start(lv);
    d.lives = 1;
    d.levelDone();
    for (let g = 0; d.mode === 'transition' && g < 60 * 30; g++) {
      if (d.dialog) { d.dialog.shown = 999; d.confirm(); }
      d.update(1 / 60);
      if (d.p.wx != null) {
        frames++;
        if (!isNav(d.map, Math.round(d.p.wx / 32), Math.round(d.p.wy / 32))) bad++;
      }
    }
    if (lv === 2) pocket = { level: d.level, lives: d.lives, mode: d.mode };
  }
  check('as animações entre os níveis só passam por água navegável', frames > 1000 && bad === 0, `${frames} quadros, ${bad} fora`);
  check('ao passar o Nível 3, na chegada ao 4, o bolsão de ar enche as 3 bolhas',
        pocket?.level === 3 && pocket.lives === DIVE.lives && pocket.mode === 'play', JSON.stringify(pocket));
  check('depois do último nível (o 5), ele chega à entrada da Caverna Marinha', DIVE.levels.length === 5 && last === 'cave');

  // o passo é o do FireRed andando: 16 quadros por tile, sem correr
  const walk = new Dive();
  walk.start(0);
  walk.nextAt = 999;
  for (let i = 0; i < 60; i++) walk.update(1 / 60, 'r');
  check('segurando, ele anda 3,75 tiles por segundo (o passo da vila andando)', walk.p.c === 4 || walk.p.c === 5, `tile ${walk.p.c}`);
  for (let i = 0; i < 30; i++) walk.update(1 / 60, null);
  const at = walk.p.c;
  walk.update(1 / 60, 'r');
  check('o passo sai no primeiro toque (sem o "só virar" da vila)', walk.p.c === at + 1);
}

// ------------------------------------------- o salão do Kyogre (0.37, PLANEJAMENTO-DIVE seções 8 a 10)
console.log('\n[o salão do Kyogre — a luta, a captura e o Kyogre na equipe]');
{
  const { weatherMultiplier } = await import('../src/systems/combat.js');
  const fight = new Run('kyogre', { starter: 'squirtle' });
  check('a arena é o salão aprovado (o layout pronto do tileset cave), com a chuva',
        fight.world.scene === 'kyogre_hall' && fight.stage.weather === 'rain' && !!fight.fight && fight.terrain.grid('kyogre_hall').cells.length === 75 * 50);
  check('a chuva (Drizzle): Água x1,5 e Fogo x0,5, só nesta fase',
        weatherMultiplier(fight, 'water') === 1.5 && weatherMultiplier(fight, 'fire') === 0.5 && weatherMultiplier(fight, 'grass') === 1
        && weatherMultiplier(new Run('champion', { starter: 'squirtle' }), 'water') === 1);
  check('3 Dive Balls de 10%, o piso de 15% e a volta a 25% (decisão do Fellipe)',
        fight.fight.balls === 3 && fight.stage.legendaryFight.chance === 0.1 && fight.stage.legendaryFight.floor === 0.15 && fight.stage.legendaryFight.recover === 0.25);
  // o Kyogre sai do lago aos 0:45
  fight.time = fight.stage.duration;
  fight.damageCompanion = () => {};   // só a chegada dele importa aqui
  for (let i = 0; i < 60 * 3; i++) { fight.update(DT, { x: 0, y: 0 }); if (fight.state === 'intro') { fight.pendingIntro = null; fight.state = 'running'; } }
  const lake = fight.fight.lake;
  check('aos 0:45, o Kyogre sai do lago, no meio do salão', fight.boss?.data.id === 'kyogre_boss' && ['rise', 'fight'].includes(fight.fight.state)
        && Math.hypot(fight.boss.x - lake.x, fight.boss.y - lake.y) < 200 && lake.x > 1000 && lake.x < 1400);
  check('o Kyogre não traz a rajada dos líderes: os ataques dele são outros', !fight.boss.abilities.some((a) => a.abilityId === 'leader_barrage'));

  // o Kyogre na equipe: fora das 151, com o golpe exclusivo e o Water Spout
  const team = new Run('gym_1_pewter', { starter: 'squirtle' });
  const kyogre = team.team.add('kyogre', 60);
  check('o Kyogre entra com o Origin Pulse (exclusivo) e o Water Spout (o 2º golpe)',
        kyogre.abilities[0] === 'origin_pulse' && kyogre.abilities.includes('water_spout') && (kyogre.upgrades.origin_pulse_damage ?? 0) >= 2);
  let pulses = 0;
  for (let i = 0; i < 60 * 8; i++) {
    team.update(DT, { x: 0, y: 0 });
    if (team.enemies.length < 6) team.spawner.spawn('rattata', 160, 5);
    pulses += team.signatures.filter((sig) => sig.kind === 'origin_pulse' && sig.age === 0).length;
    if (team.state === 'levelup') resolveLevelUp(team);
    if (team.state !== 'running') team.state = 'running';
  }
  check('o Origin Pulse sai e acerta a horda', team.stats.damageDealt > 0 && team.stats.kills > 0);
  const { ProfileTracker } = await import('../src/save/profile.js');
  const tracker = new ProfileTracker(createProfile());
  tracker.registerCaught(382);
  check('capturar o Kyogre revela o "???" da Pokédex e não conta nas 151',
        tracker.profile.pokedex.secret.includes('kyogre') && !tracker.profile.pokedex.caught.includes(382));
}

console.log(`\n=== ${failures === 0 ? 'TUDO OK' : failures + ' FALHA(S)'} ===\n`);
process.exit(failures ? 1 : 0);
