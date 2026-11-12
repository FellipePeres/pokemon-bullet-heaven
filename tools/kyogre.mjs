/**
 * A MEDIÇÃO DAS LUTAS DE LENDÁRIO: a do Kyogre (0.37, PLANEJAMENTO-DIVE.md seção 9) e as
 * das missões (H-5 em diante; a do Zapdos é a H-6; a do Articuno, a H-7).
 *
 * Roda a fase com o jogador automático do bot.mjs (foge dos avisos no chão, lê o
 * tabuleiro da tempestade e vai até a bola) e uma equipe pronta:
 *   - no Kyogre, a de pós-jogo do Fellipe: os 5 lendários de Kanto e o Blastoise com
 *     Dive, tudo no máximo;
 *   - nas missões, uma equipe comum de meio de jornada, no nível pedido, com as
 *     melhorias de quem subiu até ali (uma a cada 3 níveis, como na captura).
 * Mostra a linha do tempo (a exaustão, as bolas, a leva final), de onde veio o dano que
 * a equipe levou e como a luta terminou.
 *
 * Uso:
 *   node tools/kyogre.mjs                 # Kyogre, equipe nível 90, 3 lutas
 *   node tools/kyogre.mjs 80 5            # nível 80, 5 lutas
 *   node tools/kyogre.mjs 90 1 champion   # a mesma equipe numa fase de comparação
 *   node tools/kyogre.mjs 58 5 zapdos     # a missão do Zapdos com a equipe comum no 58
 *   node tools/kyogre.mjs 57 12 articuno  # a missão do Articuno (H-7) com a equipe comum no 57
 *   node tools/kyogre.mjs 62 12 moltres   # a missão do Moltres (H-8) com a equipe comum no 62
 */
import { Run } from '../src/game/Run.js';
import { DT, resolveLevelUp, steer } from './bot.mjs';
import { UPGRADES } from '../src/data/upgrades.js';
import { isBonusMove } from '../src/data/bonusMoves.js';

const level = Number(process.argv[2] ?? 90);
const fights = Number(process.argv[3] ?? 3);
const stageId = process.argv[4] ?? 'kyogre';
/** A equipe comum das missões: o inicial evoluído e cinco de meio de jornada. */
const JOURNEY_TEAM = ['charizard', 'pidgeot', 'arcanine', 'gyarados', 'alakazam', 'snorlax'];

function team() {
  const base = new Run('champion', { starter: 'squirtle' });
  base.team.members = [];
  base.team.active.fill(null);
  if (stageId !== 'kyogre' && stageId !== 'champion') {
    for (const id of JOURNEY_TEAM) {
      const m = base.team.add(id, level);
      if (!m.abilities.some(isBonusMove)) base.progression.learnBonusMove(m, { announce: false });
    }
  } else {
    for (const id of ['mew', 'mewtwo', 'articuno', 'zapdos', 'moltres', 'blastoise']) {
      const m = base.team.add(id, level);
      if (id === 'blastoise') m.abilities = [m.abilities[0], 'dive'];
      for (let g = 0; g < 50; g++) {
        const open = Object.values(UPGRADES).filter((up) => base.progression.isAvailable(up, m));
        if (!open.length) break;
        for (const up of open) m.upgrades[up.id] = up.maxStacks;
      }
      if (!m.abilities.some(isBonusMove)) base.progression.learnBonusMove(m, { announce: false });
    }
  }
  const t = base.team.serialize();
  t.members.forEach((m) => { m.hp = 0; });
  return t;
}

const results = [];
for (let n = 1; n <= fights; n++) {
  const run = new Run(stageId, { team: team(), campaignStarter: 'charmander' });
  const name = run.fight?.name ?? 'chefe';
  const taken = {};
  let attacker = null;
  const attack = run._enemyAttack.bind(run);
  run._enemyAttack = (e) => { attacker = e; attack(e); attacker = null; };
  const hurt = run.damageCompanion.bind(run);
  run.damageCompanion = (c, amount, type, opts) => {
    const caller = new Error().stack.split('\n')[2] ?? '';
    const key = caller.includes('_strike') ? `${name}: avisos (${type})` : caller.includes('_updateRings') ? 'anéis'
      : caller.includes('_updateTsunami') ? 'maremoto' : caller.includes('_updateOrb') ? 'esfera' : caller.includes('_peck') ? 'Investida'
      : caller.includes('_beam') ? 'Raio de Gelo' : caller.includes('_cone') ? 'Nevasca' : caller.includes('_frost') ? 'Frio Absoluto'
      : caller.includes('_sweep') ? 'Lança-chamas' : caller.includes('_spin') ? 'Redemoinho de Fogo'
      : caller.includes('_burnGround') ? 'chão em brasa' : caller.includes('_sacredFire') ? 'Fogo Sagrado'
      : caller.includes('_updateZones') ? 'ondas'
      : attacker ? (attacker.boss ? `contato do ${name}` : 'contato da horda') : 'outros';
    taken[key] = (taken[key] ?? 0) + amount;
    return hurt(c, amount, type, opts);
  };
  const log = [];
  let last = '';
  for (let steps = 0; run.time < 900 && steps < 900 * 60; steps++) {
    run.update(DT, steer(run));
    if (run.state === 'intro') { run.pendingIntro = null; run.state = 'running'; }
    if (run.state === 'levelup') resolveLevelUp(run);
    if (run.state === 'evolution') { run.evolutionQueue.length = 0; run.state = 'running'; }
    if (run.state === 'unlock') { run.unlockQueue.length = 0; run.state = 'running'; }
    if (run.state === 'capture') {
      const species = run.fight?.cfg.species;
      if (species && run.pendingGift?.choices.includes(species)) {
        if (run.team.isFull) run.captureSystem.captureToPC(species); else run.captureSystem.capture(species);
      }
      run.pendingGift = null; run.pendingBall = false; run.state = 'running';
    }
    const f = run.fight;
    if (f) {
      const tag = `${f.state}${f.ball ? ' + bola' : ''}${f.final ? ' + leva final' : ''}, ${f.balls} bolas`;
      if (tag !== last) {
        last = tag;
        const hp = run.boss ? `${Math.round((100 * run.boss.hp) / run.boss.maxHp)}%` : '-';
        log.push(`  ${run.time.toFixed(1).padStart(6)} s  ${tag.padEnd(40)} ${name} ${hp.padStart(4)}  de pé: ${run.team.members.filter((m) => !m.fainted).length}`);
      }
    }
    if (run.state === 'victory' || run.state === 'defeat') break;
  }
  console.log(`\nLuta ${n} (${stageId}, nível ${level}):`);
  if (log.length) console.log(log.join('\n'));
  const fainted = run.team.members.filter((m) => m.fainted).length;
  console.log(`  fim: ${run.state === 'victory' ? 'vitória' : 'derrota'} em ${run.time.toFixed(0)} s, ${fainted} desmaio(s), ` +
    `capturou: ${run.fight?.captured ? 'sim' : 'não'}`);
  console.log(`  dano levado: ${Object.entries(taken).map(([k, v]) => `${k} ${Math.round(v)}`).join(' · ')}`);
  results.push({ win: run.state === 'victory', fainted, time: run.time });
}
if (fights > 1) {
  const wins = results.filter((r) => r.win).length;
  const avg = (k) => (results.reduce((s, r) => s + r[k], 0) / results.length).toFixed(1);
  console.log(`\nResumo: ${wins} de ${fights} vitórias, ${avg('fainted')} desmaios e ${avg('time')} s em média.`);
}
