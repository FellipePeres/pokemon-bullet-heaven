import { ABILITIES, RETIRED_ABILITIES } from '../data/abilities.js';
import { UPGRADES, RENAMED_UPGRADES } from '../data/upgrades.js';
import { getPokemon } from '../data/pokemon.js';
import { isBonusMove } from '../data/bonusMoves.js';

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
  return member;
}
