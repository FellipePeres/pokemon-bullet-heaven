/**
 * MÉTRICAS DE CADA FASE — o que o Estojo de Insígnias mostra (0.13).
 *
 * Guardadas por região, em `regions.<id>.stageStats[stageId]`, e somadas no fim
 * de cada partida (vencida ou perdida; abandonar no meio não conta). Saves de
 * antes da 0.13 começam vazios: o estojo mostra "—" até a próxima partida.
 */

export function emptyStageStats() {
  return {
    attempts: 0,
    wins: 0,
    bestTime: null,       // o menor tempo até vencer o líder, em segundos
    fewestFaints: null,   // o menor número de desmaios numa vitória
    bestLevel: 0,         // o maior nível que a equipe levou a uma vitória
    captures: 0,          // capturas somadas de todas as tentativas
    damage: 0,            // dano somado de todas as tentativas
    firstWin: null        // { date, team: [{ pokemonId, level }] }
  };
}

/** Soma uma partida às métricas da fase e devolve as métricas novas. */
export function recordStageResult(previous, { victory, time, faints, level, captures, damage, team, date }) {
  const stats = { ...emptyStageStats(), ...previous };
  stats.attempts++;
  stats.captures += captures ?? 0;
  stats.damage += Math.round(damage ?? 0);
  if (!victory) return stats;
  stats.wins++;
  stats.bestTime = stats.bestTime === null ? Math.round(time) : Math.min(stats.bestTime, Math.round(time));
  stats.fewestFaints = stats.fewestFaints === null ? faints ?? 0 : Math.min(stats.fewestFaints, faints ?? 0);
  stats.bestLevel = Math.max(stats.bestLevel, level ?? 0);
  stats.firstWin ??= { date, team: (team ?? []).map(({ pokemonId, level: lv }) => ({ pokemonId, level: lv })) };
  return stats;
}
