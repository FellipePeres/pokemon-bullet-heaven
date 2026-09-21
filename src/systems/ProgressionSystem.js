import { CONFIG } from '../core/config.js';
import { UPGRADES, getUpgrade } from '../data/upgrades.js';
import { nextMoveFor, tmNumber } from '../data/tms.js';
import { getAbility } from '../data/abilities.js';
import { tmIconForType } from '../render/icons.js';
import { getPokemon } from '../data/pokemon.js';
import { getTrainerUpgrade } from '../data/trainerUpgrades.js';
import { applyModifiers, weightedPickMany } from '../core/utils.js';
import { bus, EVENTS } from '../core/events.js';
import { maxHpFor, xpToNextLevel } from './stats.js';

/** Opção usada quando não há mais upgrades disponíveis para aquele Pokémon. */
const HEAL_FALLBACK = {
  id: '__heal',
  name: 'Poção',
  description: 'Restaura 50% da vida deste Pokémon.',
  icon: 'potion',
  scope: 'special'
};

/**
 * EXPERIÊNCIA, NÍVEIS, EVOLUÇÃO E MELHORIAS
 *
 * - Cada Pokémon tem nível e XP próprios. O XP do inimigo é dividido entre a
 *   equipe com pesos (CONFIG.progression.xpWeight): com a equipe cheia dá
 *   exatamente 25% por ativo e 8,33% por reserva.
 * - Subir de nível aumenta vida máxima e dano, mas NÃO cura.
 * - A tela de melhoria aparece a cada `upgradeEveryLevels` níveis.
 * - Ao atingir o nível de evolução, o Pokémon evolui (níveis fiéis aos jogos).
 * - As melhorias de partida são só do Pokémon. Bônus globais vêm das moedas
 *   gastas nas melhorias do treinador (data/trainerUpgrades.js).
 */
export class ProgressionSystem {
  constructor(run) {
    this.run = run;
  }

  xpToNext(level) { return xpToNextLevel(level); }

  /** Distribui o XP de um inimigo entre todos os Pokémon que ainda estão de pé. */
  addXp(amount) {
    const run = this.run;
    const total = amount * run.playerStats.xpGain;
    const members = run.team.members.filter((m) => !m.fainted);
    if (!members.length) return;

    const { active: wActive, benched: wBench } = CONFIG.progression.xpWeight;
    const weights = members.map((m) => (run.team.active.includes(m) ? wActive : wBench));
    const sum = weights.reduce((a, b) => a + b, 0);

    members.forEach((member, i) => {
      this.addXpTo(member, (total * weights[i]) / sum);
    });
  }

  /** XP para um Pokémon específico, acumulando níveis e melhorias pendentes. */
  addXpTo(member, amount) {
    member.xp += amount;
    let need = this.xpToNext(member.level);

    while (member.xp >= need) {
      member.xp -= need;
      member.level++;

      // a melhoria não vem a cada nível: vem a cada N (menos interrupção)
      if (member.level % CONFIG.progression.upgradeEveryLevels === 0) {
        member.pendingLevels++;
      }

      this.checkEvolution(member);
      need = this.xpToNext(member.level);
      bus.emit(EVENTS.POKEMON_LEVELED, { member, level: member.level });
    }
  }

  /**
   * Evolução por nível, fiel aos jogos.
   * A espécie muda (mais vida e mais dano), mas o Pokémon mantém habilidades,
   * melhorias e vida proporcional — nada do que você construiu se perde.
   */
  checkEvolution(member) {
    const data = getPokemon(member.pokemonId);
    const evo = data?.evolution;
    if (!evo || member.level < evo.level) return null;
    const next = getPokemon(evo.to);
    if (!next) return null;

    const beforeMax = maxHpFor(member, this.run.playerStats.pokemonHpBonus);
    const ratio = beforeMax > 0 ? member.hp / beforeMax : 1;

    const from = data;
    member.pokemonId = next.id;
    // mantém a proporção de vida: evoluir não cura, mas também não penaliza
    member.hp = Math.round(maxHpFor(member, this.run.playerStats.pokemonHpBonus) * ratio);

    this.run.queueEvolution({ member, from, to: next });
    bus.emit(EVENTS.POKEMON_EVOLVED, { member, from: from.id, to: next.id, dex: next.dex });
    return next;
  }

  /** Stats da equipe = base do CONFIG + melhorias do treinador (moedas). */
  computePlayerStats() {
    const base = {
      speed: CONFIG.trainer.speed,
      pickupRadius: CONFIG.trainer.pickupRadius,
      pokemonHpBonus: 0,
      pokemonRegen: 0,
      xpGain: 1,
      ballChance: 1,
      swapCooldown: CONFIG.team.swapCooldown,
      damageMult: 1,
      cooldownMult: 1
    };

    const mods = {};
    for (const [upId, level] of Object.entries(this.run.trainerUpgrades ?? {})) {
      const up = getTrainerUpgrade(upId);
      if (!up || !level) continue;
      for (const [key, mod] of Object.entries(up.modifiers)) {
        if (!mods[key]) mods[key] = { add: 0, mult: 0 };
        mods[key].add += (mod.add || 0) * level;
        mods[key].mult += (mod.mult || 0) * level;
      }
    }
    return applyModifiers(base, mods);
  }

  /** Quantas vezes este upgrade já foi escolhido por este Pokémon. */
  stacksOf(up, member) {
    return member?.upgrades?.[up.id] ?? 0;
  }

  /** Um upgrade pode ser oferecido a este Pokémon? */
  isAvailable(up, member) {
    if (this.stacksOf(up, member) >= up.maxStacks) return false;
    if (!member || !member.abilities.includes(up.abilityId)) return false;
    if (up.grantsAbility && member.abilities.includes(up.grantsAbility)) return false;
    if (up.requires) {
      const have = member.upgrades[up.requires.upgrade] ?? 0;
      if (have < (up.requires.stacks ?? 1)) return false;
    }
    return true;
  }

  /**
   * Opções de melhoria de um Pokémon.
   * Raramente, uma das opções é uma TM: troca a habilidade base por uma
   * muito melhor, levando junto tudo que já foi investido.
   */
  rollChoices(member, count = CONFIG.progression.upgradeChoices) {
    const pool = Object.values(UPGRADES)
      .filter((up) => this.isAvailable(up, member))
      .map((up) => ({ ...up, weight: up.weight ?? 5 }));

    const chosen = weightedPickMany(pool, count);

    const tm = this.rollTM(member);
    if (tm) chosen[chosen.length ? chosen.length - 1 : 0] = tm;

    while (chosen.length < count) chosen.push(HEAL_FALLBACK);
    return chosen;
  }

  /**
   * Sorteia (raramente) a TM do próprio Pokémon: o próximo golpe da linha dele.
   * Charmander com Ember recebe Flamethrower; com Flamethrower, Fire Blast.
   * Quem já está no último golpe da linha não recebe mais TM.
   */
  rollTM(member) {
    if (Math.random() > CONFIG.progression.tmChance) return null;

    const current = member.abilities[0];
    const nextId = nextMoveFor(member.pokemonId, current);
    if (!nextId) return null;

    const ability = getAbility(nextId);
    const currentAbility = getAbility(current);

    return {
      id: `tm:${nextId}`,
      scope: 'tm',
      abilityId: nextId,
      rarity: 'tm',
      icon: tmIconForType(ability.type),
      name: `TM${String(tmNumber(nextId)).padStart(2, '0')}: ${ability.name}`,
      description: `${currentAbility?.name ?? 'O golpe atual'} evolui para ${ability.name}. ` +
                   `${ability.description} Todas as melhorias já feitas vêm junto.`,
      maxStacks: 1
    };
  }

  /**
   * Aprende uma TM: troca a habilidade BASE e transfere as melhorias.
   * Cada upgrade da habilidade antiga vira o equivalente na nova
   * (dano, recarga, projéteis...). O que não tiver equivalente vira dano,
   * para que trocar de golpe nunca signifique perder poder.
   */
  learnTM(member, newAbility) {
    const oldAbility = member.abilities[0];
    if (!newAbility || !oldAbility || oldAbility === newAbility) return;

    member.abilities[0] = newAbility;

    const migrated = {};
    let orphanStacks = 0;
    for (const [upId, stacks] of Object.entries(member.upgrades)) {
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
      migrated[damageId] = Math.min(
        (migrated[damageId] ?? 0) + orphanStacks,
        UPGRADES[damageId].maxStacks
      );
    }

    member.upgrades = migrated;
    this.run.rebuildCompanionAbilities(member);

    const ability = getAbility(newAbility);
    bus.emit(EVENTS.TOAST, {
      text: `${getPokemon(member.pokemonId).name} aprendeu ${ability.name}!`,
      icon: '💿'
    });
  }

  /** Aplica a escolha do jogador para um Pokémon. */
  applyUpgrade(upgradeId, member) {
    const run = this.run;

    if (upgradeId === HEAL_FALLBACK.id) {
      const max = maxHpFor(member, run.playerStats.pokemonHpBonus);
      member.hp = Math.min(max, member.hp + max * 0.5);
      return;
    }

    if (upgradeId.startsWith('tm:')) {
      this.learnTM(member, upgradeId.slice(3));
      run.refreshStats();
      return;
    }

    const up = getUpgrade(upgradeId);
    if (!up) return;

    member.upgrades[up.id] = (member.upgrades[up.id] ?? 0) + 1;
    if (up.grantsAbility && !member.abilities.includes(up.grantsAbility)) {
      member.abilities.push(up.grantsAbility);
      run.rebuildCompanionAbilities();
    }

    run.refreshStats();
    bus.emit(EVENTS.UPGRADE_TAKEN, { upgrade: up, member });
  }
}
