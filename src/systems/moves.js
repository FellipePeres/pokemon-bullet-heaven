import { ABILITIES, RETIRED_ABILITIES } from '../data/abilities.js';
import { UPGRADES, RENAMED_UPGRADES } from '../data/upgrades.js';
import { getPokemon } from '../data/pokemon.js';
import { isBonusMove } from '../data/bonusMoves.js';
import { LEGENDARY_KITS } from '../data/legendaries.js';
import { nextMoveFor } from '../data/tms.js';

/**
 * Leva as melhorias de um golpe para outro. Cada upgrade do antigo vira o
 * equivalente no novo (dano, recarga, projéteis...); o que não tiver
 * equivalente vira potência, para que trocar de golpe nunca signifique perder
 * poder. Usado pela TM e pela migração de saves antigos.
 */
export function transferUpgrades(upgrades, oldAbility, newAbility) {
  const migrated = {};
  let orphanStacks = 0;
  for (const [upId, stacks] of Object.entries(upgrades)) {
    if (!upId.startsWith(`${oldAbility}_`)) {
      migrated[upId] = stacks;
      continue;
    }
    const suffix = upId.slice(oldAbility.length + 1);
    const target = `${newAbility}_${suffix}`;
    if (UPGRADES[target]) {
      migrated[target] = Math.min(stacks + (migrated[target] ?? 0), UPGRADES[target].maxStacks);
    } else {
      orphanStacks += stacks;
    }
  }

  // o que não existe na habilidade nova é convertido em potência
  const damageId = `${newAbility}_damage`;
  if (orphanStacks && UPGRADES[damageId]) {
    migrated[damageId] = Math.min((migrated[damageId] ?? 0) + orphanStacks, UPGRADES[damageId].maxStacks);
  }
  return migrated;
}

/**
 * Atualiza um Pokémon salvo numa versão antiga: golpes que saíram na 0.6 (ver
 * RETIRED_ABILITIES) viram o da mesma posição na linha nova da espécie, e
 * melhorias que mudaram de nome passam para o nome novo.
 */
export function migrateMember(member) {
  for (const [oldId, newId] of Object.entries(RENAMED_UPGRADES)) {
    if (!member.upgrades[oldId]) continue;
    member.upgrades[newId] = member.upgrades[oldId];
    delete member.upgrades[oldId];
  }

  const line = getPokemon(member.pokemonId)?.moveLine ?? [];
  member.abilities = member.abilities
    .map((id, i) => {
      if (ABILITIES[id] || (isBonusMove(id) && !RETIRED_ABILITIES[id])) return id;   // o 2º golpe fica como está
      const retired = RETIRED_ABILITIES[id];
      const replacement = (i > 0 && retired?.extra) || line[retired?.tier ?? 0] || line[0];
      member.upgrades = transferUpgrades(member.upgrades, id, replacement);
      return replacement;
    })
    .filter((id, i, list) => list.indexOf(id) === i);   // sem golpe repetido
  return applyLegendaryKit(member);
}

/**
 * Evolui um Pokémon guardado (da equipe da jornada ou do PC), fora da partida: o
 * Poké Mart (0.23, pedra ou Cabo de Troca). As mesmas regras da evolução por
 * nível (ProgressionSystem.checkEvolution): o golpe que não existe na linha nova
 * vira o da mesma posição nela, e o golpe do estágio novo entra se estiver à
 * frente; as melhorias vão junto. Devolve { from, to }.
 */
export function evolveMember(member, toId) {
  const from = getPokemon(member.pokemonId);
  const next = getPokemon(toId);
  if (!from || !next) return null;
  member.pokemonId = next.id;
  const current = member.abilities[0];
  const line = next.moveLine ?? [];
  if (line.length && !line.includes(current)) {
    const tier = Math.max(0, from.moveLine?.indexOf(current) ?? 0);
    const replacement = line[Math.min(tier, line.length - 1)];
    member.upgrades = transferUpgrades(member.upgrades, current, replacement);
    member.abilities[0] = replacement;
  }
  const stageMove = next.abilities?.[0];
  if (stageMove && line.indexOf(stageMove) > line.indexOf(member.abilities[0])) {
    member.upgrades = transferUpgrades(member.upgrades, member.abilities[0], stageMove);
    member.abilities[0] = stageMove;
  }
  return { from, to: next };
}

/** A TM do Poké Mart (0.23): o próximo golpe da linha, com as melhorias. Devolve o golpe novo (ou null). */
export function learnNextMove(member) {
  const current = member.abilities[0];
  const next = nextMoveFor(member.pokemonId, current);
  if (!next) return null;
  member.upgrades = transferUpgrades(member.upgrades, current, next);
  member.abilities[0] = next;
  return next;
}

/**
 * O kit do lendário (data/legendaries.js): o golpe exclusivo como golpe
 * principal, pelo menos as melhorias do kit nele e o 2º golpe já aprendido.
 * Pode rodar mais de uma vez (na captura e a cada carregamento) sem somar nada:
 * as pilhas ficam no maior valor, e quem já tem um 2º golpe fica com o dele.
 * Um lendário de save antigo (com Ice Beam, Psybeam...) passa para o exclusivo
 * levando as melhorias, como numa TM.
 */
export function applyLegendaryKit(member) {
  const kit = LEGENDARY_KITS[member.pokemonId];
  if (!kit) return member;

  const current = member.abilities[0];
  if (current !== kit.move) {
    if (current) member.upgrades = transferUpgrades(member.upgrades, current, kit.move);
    member.abilities = [kit.move, ...member.abilities.filter((id) => isBonusMove(id))];
  }
  for (const [suffix, stacks] of Object.entries(kit.upgrades)) {
    const up = UPGRADES[`${kit.move}_${suffix}`];
    if (up) member.upgrades[up.id] = Math.min(up.maxStacks, Math.max(member.upgrades[up.id] ?? 0, stacks));
  }
  if (kit.bonusMove && !member.abilities.some(isBonusMove)) member.abilities.push(kit.bonusMove);
  return member;
}
