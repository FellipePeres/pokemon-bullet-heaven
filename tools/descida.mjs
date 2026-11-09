/**
 * A MEDIÇÃO DA DESCIDA DO DIVE (PLANEJAMENTO-DIVE.md seção 5): jogadores automáticos
 * descem os níveis da descida, sempre do Nível 1, com as 3 bolhas e o bolsão de ar, como no
 * jogo. Cada perfil tem um tempo de reação (só enxerga a horda R segundos depois do
 * aviso) e uma chance de errar o passo. O "típico" sorteia a reação a cada horda.
 *
 * Uso: node tools/descida.mjs [descidas por perfil, padrão 60]
 */
import { Dive, freeDuring, laneEnd } from '../src/game/Dive.js';
import { DIVE } from '../src/data/dive.js';

const N = Number(process.argv[2] ?? 60);
const WALK = DIVE.walk;
const STEPS = [[1, 0, 'r'], [-1, 0, 'l'], [0, 1, 'd'], [0, -1, 'u']];

/** O passo de um jogador com reação `R` (R < 0: sorteada por horda, de 0,25 a 0,45 s) e erro `err`. */
function decide(d, R, err) {
  if (d.mode !== 'play' || d.p.mv < 1) return null;
  const now = d.clock;
  const lanes = d.lanes.filter((l) => now >= l.t0 + (R < 0 ? (l.hr ??= 0.25 + Math.random() * 0.2) : R));
  const end = lanes.length ? Math.max(...lanes.map(laneEnd)) : now;
  if (freeDuring(lanes, d.p.c, d.p.r, now, end)) return null;
  let frontier = [{ c: d.p.c, r: d.p.r, first: null }];
  const seen = new Set([d.p.c + ',' + d.p.r]);
  for (let k = 0; k < 12 && frontier.length; k++) {
    const next = [];
    for (const n of frontier) for (const [dc, dr, dir] of STEPS) {
      const c = n.c + dc, r = n.r + dr, key = c + ',' + r;
      if (c < 0 || r < 0 || c >= DIVE.cols || r >= DIVE.rows || seen.has(key)) continue;
      if (!freeDuring(lanes, c, r, now + k * WALK, now + (k + 1) * WALK + WALK * 0.5)) continue;
      const node = { c, r, first: n.first ?? dir };
      if (freeDuring(lanes, c, r, now + (k + 1) * WALK, end)) {
        return Math.random() < err ? ['u', 'd', 'l', 'r'].filter((x) => x !== node.first)[Math.floor(Math.random() * 3)] : node.first;
      }
      seen.add(key);
      next.push(node);
    }
    frontier = next;
  }
  return null;
}

const PROFILES = [['típico (0,25 a 0,45 s, erra 3%)', -1, 0.03], ['reação de 0,35 s', 0.35, 0], ['reação de 0,5 s', 0.5, 0]];
for (const [name, R, err] of PROFILES) {
  const reached = Array(DIVE.levels.length).fill(0), cleared = Array(DIVE.levels.length).fill(0);
  let wins = 0;
  for (let run = 0; run < N; run++) {
    let ended = null;
    const d = new Dive({ onEnd: (r) => { ended = r; } });
    d.start(0);
    let lv = 0;
    reached[0]++;
    for (let g = 0; g < 60 * 900 && !ended; g++) {
      if (d.dialog) { d.dialog.shown = 999; d.confirm(); }
      d.update(1 / 60, decide(d, R, err));
      if (d.level !== lv) { cleared[lv]++; lv = d.level; reached[lv]++; }
    }
    if (ended === 'cave') { cleared[DIVE.levels.length - 1]++; wins++; }
  }
  const per = reached.map((n, i) => `N${i + 1} ${n ? Math.round((100 * cleared[i]) / n) : 0}%`).join(' ');
  console.log(`${name.padEnd(32)} desce tudo ${String(Math.round((100 * wins) / N)).padStart(3)}% (~${wins ? (N / wins).toFixed(1) : '+' + N} tentativas) · passam: ${per}`);
}
