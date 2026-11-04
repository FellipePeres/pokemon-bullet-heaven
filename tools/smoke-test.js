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
import { maxHpFor } from '../src/systems/stats.js';
import { hpRatio } from '../src/systems/stats.js';
import { nextMoveFor, moveLineOf } from '../src/data/tms.js';
import { getPokemon } from '../src/data/pokemon.js';
import { Pickup } from '../src/entities/Pickup.js';
import { swapWithPC, normalizePC, monAt, previewMove, moveMon, boxCount } from '../src/systems/pc.js';
import { TILE } from '../src/systems/terrain.js';

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
        result = simulate(stageId, 'squirtle', { maxSeconds: stage.duration + 240, journey });
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
  const orbit = probe('fire_spin', 1);
  const firstAngle = orbit.orbs[0]?.angle ?? 0;
  for (let i = 0; i < 30; i++) step(orbit);
  CONFIG.debug.godMode = false;
  check('orbes giram ao redor do Pokémon', Math.abs((orbit.orbs[0]?.angle ?? 0) - firstAngle) > 0.5,
        `variação de ${((orbit.orbs[0]?.angle ?? 0) - firstAngle).toFixed(2)} rad`);

  const aura = probe('mega_drain', 1);
  const zone = aura.zones.find((z) => z.kind === 'aura');
  check('aura acompanha o Pokémon', !!zone && Math.hypot(zone.x - zone.owner.x, zone.y - zone.owner.y) < 1);

  // no máximo 4 golpes por tipo (0.6), sem contar os golpes dos líderes
  const perType = {};
  for (const a of Object.values(ABILITIES)) if (!a.hostile) perType[a.type] = (perType[a.type] ?? 0) + 1;
  const crowded = Object.entries(perType).filter(([, n]) => n > 4);
  check('no máximo 4 golpes por tipo', !crowded.length,
        crowded.map(([t, n]) => `${t}: ${n}`).join(', ') || `${Object.keys(perType).length} tipos`);

  // save de antes da 0.6: golpes que saíram viram o equivalente, com as melhorias
  const legacyRun = new Run('gym_1_pewter', { team: { members: [
    { uid: 'a', pokemonId: 'charmander', level: 12, abilities: ['ember', 'fire_ring'],
      upgrades: { ember_damage: 2, ember_fire_ring: 1, fire_ring_damage: 2 } },
    { uid: 'b', pokemonId: 'ponyta', level: 20, abilities: ['flame_wheel'], upgrades: { flame_wheel_damage: 3 } }
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

  // a troca põe quem entra no slot escolhido
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
  check('o líder também', Math.abs(tunedBoss.maxHp / boss.maxHp - 1.2) < 1e-9 && tunedBoss.tilt === 1.2 && boss.tilt === 1);
  stage.starterTuning = saved;
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
  check('os 151 de Kanto são jogáveis', Object.keys(POKEMON).length === 151, `${Object.keys(POKEMON).length}`);
  check('as 13 etapas de Kanto existem', Object.keys(STAGES).length === 13, `${Object.keys(STAGES).length}`);
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

console.log(`\n=== ${failures === 0 ? 'TUDO OK' : failures + ' FALHA(S)'} ===\n`);
process.exit(failures ? 1 : 0);
