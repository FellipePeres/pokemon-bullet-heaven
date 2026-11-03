/**
 * O PC DA JORNADA — Pokémon guardados fora da equipe (0.11).
 *
 * Mora na jornada da região (`journey.pc`, no mesmo formato dos membros da
 * equipe). Entra quem sai da equipe numa captura com ela cheia, ou quem é
 * mandado direto para cá; no lobby, o jogador troca entre a equipe e o PC.
 */

/**
 * Troca um da equipe por um do PC. Sem `teamUid`, só retira do PC (se a equipe
 * tiver vaga); sem `pcUid`, só deposita (a equipe nunca fica vazia). Devolve
 * se deu certo. Quem entra pega o lugar de quem saiu entre os ativos.
 */
export function swapWithPC(journey, teamUid, pcUid, maxSize) {
  if (!journey?.team) return false;
  journey.pc ??= [];
  const team = journey.team;
  const members = team.members;
  const fromTeam = teamUid ? members.find((m) => m.uid === teamUid) : null;
  const fromPC = pcUid ? journey.pc.find((m) => m.uid === pcUid) : null;
  if ((teamUid && !fromTeam) || (pcUid && !fromPC)) return false;
  if (!fromTeam && !fromPC) return false;
  if (!fromPC && members.length <= 1) return false;          // sempre fica alguém
  if (!fromTeam && members.length >= maxSize) return false;  // equipe cheia: só troca

  if (fromTeam) {
    members.splice(members.indexOf(fromTeam), 1);
    journey.pc.push(fromTeam);
  }
  if (fromPC) {
    journey.pc.splice(journey.pc.indexOf(fromPC), 1);
    members.push(fromPC);
  }
  team.active = (team.active ?? []).map((uid) => (uid === teamUid ? (fromPC?.uid ?? null) : uid));
  if (fromPC && !team.active.includes(fromPC.uid)) {
    const free = team.active.findIndex((uid) => !uid);
    if (free !== -1) team.active[free] = fromPC.uid;
  }
  return true;
}
