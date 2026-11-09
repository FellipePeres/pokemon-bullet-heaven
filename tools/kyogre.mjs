/**
 * A MEDIÇÃO DA LUTA DO KYOGRE (0.37, PLANEJAMENTO-DIVE.md seção 9).
 *
 * Roda a fase `kyogre` com o jogador automático do bot.mjs (foge dos avisos no chão
 * e vai até a Dive Ball) e uma equipe de lendários no máximo: os 5 de Kanto e o
 * Blastoise com Dive, como o save de pós-jogo do Fellipe. Mostra a linha do tempo
 * (a exaustão, as Dive Balls, a maré final), de onde veio o dano que a equipe levou
 * e como a luta terminou.
 *
 * Uso:
 *   node tools/kyogre.mjs                 # equipe nível 90, 3 lutas
 *   node tools/kyogre.mjs 80 5            # nível 80, 5 lutas
 *   node tools/kyogre.mjs 90 1 champion   # a mesma equipe numa fase de comparação
 */
import { Run } from '../src/game/Run.js';
import { DT, resolveLevelUp, steer } from './bot.mjs';
import { UPGRADES } from '../src/data/upgrades.js';
import { isBonusMove } from '../src/data/bonusMoves.js';

const level = Number(process.argv[2] ?? 90);
const fights = Number(process.argv[3] ?? 3);
const stageId = process.argv[4] ?? 'kyogre';

function team() {
  const base = new Run('champion', { starter: 'squirtle' });
  base.team.members = [];
  base.team.active.fill(null);
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
  const t = base.team.serialize();
  t.members.forEach((m) => { m.hp = 0; });
  return t;
}

for (let n = 1; n <= fights; n++) {
  const run = new Run(stageId, { team: team(), campaignStarter: 'squirtle' });
  const taken = {};
  let attacker = null;
  const attack = run._enemyAttack.bind(run);
  run._enemyAttack = (e) => { attacker = e; attack(e); attacker = null; };
  const hurt = run.damageCompanion.bind(run);
  run.damageCompanion = (c, amount, type, opts) => {
    const caller = new Error().stack.split('\n')[2] ?? '';
    const key = caller.includes('_strike') ? `Kyogre (${type})` : caller.includes('_updateZones') ? 'anéis e ondas'
      : attacker ? (attacker.boss ? 'contato do Kyogre' : 'contato da horda') : 'outros';
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
      if (run.pendingGift?.choices.includes('kyogre')) {
        if (run.team.isFull) run.captureSystem.captureToPC('kyogre'); else run.captureSystem.capture('kyogre');
      }
      run.pendingGift = null; run.pendingBall = false; run.state = 'running';
    }
    const f = run.fight;
    if (f) {
      const tag = `${f.state}${f.ball ? ' + bola' : ''}${f.final ? ' + maré final' : ''}, ${f.balls} Dive Balls`;
      if (tag !== last) {
        last = tag;
        const hp = run.boss ? `${Math.round((100 * run.boss.hp) / run.boss.maxHp)}%` : '-';
        log.push(`  ${run.time.toFixed(1).padStart(6)} s  ${tag.padEnd(40)} Kyogre ${hp.padStart(4)}  de pé: ${run.team.members.filter((m) => !m.fainted).length}`);
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
}
