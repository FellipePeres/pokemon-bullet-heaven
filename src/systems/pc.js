/**
 * O PC DA JORNADA — Pokémon guardados fora da equipe (0.11; caixas na 0.12).
 *
 * Mora na jornada da região (`journey.pc`, no mesmo formato dos membros da
 * equipe). Entra quem sai da equipe numa captura com ela cheia, ou quem é
 * mandado direto para cá; no lobby, o jogador arruma tudo na tela do PC
 * (ui/pcScreen.js), a do FireRed trazida do Pokemon All.
 *
 * Cada Pokémon do PC tem uma casa (`slot`): a caixa é `slot / 30`, a casa
 * dentro dela é `slot % 30`. Quem chega sem casa (uma captura) vai para a
 * primeira vazia. A equipe fica fora das caixas, como no jogo.
 *
 * Lugares (`spot`): `{ area: 'box', slot }` ou `{ area: 'team', index }`.
 * Pegar e soltar segue as regras do PC do Pokemon All (DEC-004 de lá):
 * soltar em lugar vazio leva para lá; em lugar ocupado, os dois trocam; vaga
 * vazia da equipe é o fim da fila; a equipe nunca fica vazia.
 */

export const BOX_SIZE = 30;
export const MIN_BOXES = 8;

/** Dá casa a quem não tem (ou tem uma repetida) e devolve a lista do PC. */
export function normalizePC(journey) {
  if (!journey) return [];
  journey.pc ??= [];
  const taken = new Set();
  const homeless = [];
  for (const mon of journey.pc) {
    if (Number.isInteger(mon.slot) && mon.slot >= 0 && !taken.has(mon.slot)) taken.add(mon.slot);
    else homeless.push(mon);
  }
  let next = 0;
  for (const mon of homeless) {
    while (taken.has(next)) next++;
    mon.slot = next;
    taken.add(next);
  }
  return journey.pc;
}

/** Quantas caixas o PC mostra: no mínimo 8, e sempre uma com folga depois da última ocupada. */
export function boxCount(journey) {
  const last = Math.max(-1, ...normalizePC(journey).map((m) => m.slot));
  return Math.max(MIN_BOXES, Math.floor(last / BOX_SIZE) + 2);
}

/** O Pokémon de um lugar (ou null). */
export function monAt(journey, spot) {
  if (!journey || !spot) return null;
  if (spot.area === 'team') return journey.team?.members?.[spot.index] ?? null;
  if (spot.area === 'box') return normalizePC(journey).find((m) => m.slot === spot.slot) ?? null;
  return null;
}

/**
 * O que acontece se o Pokémon de `from` for solto em `to`, sem mexer em nada:
 * 'drop' (vai para lá), 'swap' (os dois trocam), 'blocked' (não pode) ou
 * null (é o mesmo lugar).
 */
export function previewMove(journey, from, to, maxSize) {
  const mon = monAt(journey, from);
  if (!mon || !to) return 'blocked';
  if (from.area === to.area && (from.slot ?? from.index) === (to.slot ?? to.index)) return null;
  const members = journey.team?.members ?? [];
  const there = monAt(journey, to);

  if (to.area === 'team') {
    if (there) return 'swap';
    // vaga vazia: fim da fila; de fora da equipe, só se couber
    if (from.area === 'team') return from.index === members.length - 1 ? null : 'drop';
    return members.length < maxSize ? 'drop' : 'blocked';
  }
  if (there) return 'swap';
  // da equipe para uma casa vazia: sempre fica alguém
  if (from.area === 'team' && members.length <= 1) return 'blocked';
  return 'drop';
}

/** Solta o Pokémon de `from` em `to`. Devolve se algo mudou. */
export function moveMon(journey, from, to, maxSize) {
  const kind = previewMove(journey, from, to, maxSize);
  if (!kind || kind === 'blocked') return false;
  const team = journey.team;
  team.active ??= [];
  const members = team.members;
  const pc = normalizePC(journey);
  const mon = monAt(journey, from);
  const there = monAt(journey, to);

  if (from.area === 'box' && to.area === 'box') {
    if (there) there.slot = mon.slot;
    mon.slot = to.slot;
    return true;
  }

  if (from.area === 'team' && to.area === 'team') {
    if (there) {
      members[to.index] = mon;
      members[from.index] = there;
    } else {
      members.splice(from.index, 1);
      members.push(mon);
    }
    return true;
  }

  if (from.area === 'box' && to.area === 'team') {
    pc.splice(pc.indexOf(mon), 1);
    const slot = mon.slot;
    delete mon.slot;
    if (there) {
      // troca: quem estava na equipe vai para a casa de onde o outro saiu
      members[to.index] = mon;
      there.slot = slot;
      pc.push(there);
      replaceActive(team, there.uid, mon.uid);
    } else {
      members.push(mon);
      replaceActive(team, null, mon.uid);
    }
    return true;
  }

  // da equipe para o PC
  members.splice(from.index, 1);
  if (there) {
    pc.splice(pc.indexOf(there), 1);
    delete there.slot;
    members.splice(from.index, 0, there);
    mon.slot = to.slot;
    pc.push(mon);
    replaceActive(team, mon.uid, there.uid);
  } else {
    mon.slot = to.slot;
    pc.push(mon);
    replaceActive(team, mon.uid, null);
  }
  return true;
}

/**
 * Quem entra na equipe pega o lugar de quem saiu entre os ativos (ou a
 * primeira vaga); vaga de ativo que sobra é completada com quem está fora dela.
 */
function replaceActive(team, outUid, inUid) {
  const active = team.active;
  const at = outUid ? active.indexOf(outUid) : -1;
  if (at !== -1) active[at] = inUid ?? null;
  else if (inUid && !active.includes(inUid)) {
    const free = active.findIndex((uid) => !uid);
    if (free !== -1) active[free] = inUid;
  }
  for (let i = 0; i < active.length; i++) {
    if (active[i] && team.members.some((m) => m.uid === active[i])) continue;
    active[i] = team.members.find((m) => !active.includes(m.uid))?.uid ?? null;
  }
}

/**
 * Troca um da equipe por um do PC (a API da 0.11, usada pelos testes). Sem
 * `teamUid`, só retira do PC (se a equipe tiver vaga); sem `pcUid`, só
 * deposita na primeira casa vazia (a equipe nunca fica vazia).
 */
export function swapWithPC(journey, teamUid, pcUid, maxSize) {
  if (!journey?.team) return false;
  const members = journey.team.members;
  const pc = normalizePC(journey);
  const index = teamUid ? members.findIndex((m) => m.uid === teamUid) : -1;
  const stored = pcUid ? pc.find((m) => m.uid === pcUid) : null;
  if ((teamUid && index === -1) || (pcUid && !stored)) return false;
  if (index === -1 && !stored) return false;
  if (stored) {
    const to = index !== -1 ? { area: 'team', index } : { area: 'team', index: members.length };
    return moveMon(journey, { area: 'box', slot: stored.slot }, to, maxSize);
  }
  return moveMon(journey, { area: 'team', index }, { area: 'box', slot: firstFreeSlot(journey) }, maxSize);
}

/** A primeira casa vazia do PC. */
export function firstFreeSlot(journey) {
  const taken = new Set(normalizePC(journey).map((m) => m.slot));
  let slot = 0;
  while (taken.has(slot)) slot++;
  return slot;
}
