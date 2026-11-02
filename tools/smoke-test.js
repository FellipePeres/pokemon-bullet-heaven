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
import { Player, facingDir } from '../src/entities/Player.js';
import { CONFIG } from '../src/core/config.js';
import { maxHpFor } from '../src/systems/stats.js';
import { hpRatio } from '../src/systems/stats.js';
import { nextMoveFor, moveLineOf } from '../src/data/tms.js';
import { getPokemon } from '../src/data/pokemon.js';

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
  // A fase é desafiadora de propósito: o bot vence ~60% das tentativas
  // (tools/balance.mjs) e perder devolve ao início com a mesma equipe, então o
  // teste também repete. Mas uma equipe ruim montada na Fase 1 perde a Fase 2
  // todas as vezes (~1 jornada em 15): aí começa uma jornada nova, até 3.
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
        result = simulate(stageId, 'charmander', { maxSeconds: stage.duration + 240, journey });
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

// ----------------------------------------------------------- 6c. conteúdo novo
console.log('\n[conteúdo]');
{
  // presentes da Fase 6, um de cada vez: a troca do Lickitung e o Dojo de Saffron
  const dojo = new Run('gym_6_saffron', { starter: 'charmander' });
  dojo.time = 241;
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
