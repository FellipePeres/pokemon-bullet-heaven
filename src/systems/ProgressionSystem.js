import { CONFIG } from '../core/config.js';
import { UPGRADES, getUpgrade } from '../data/upgrades.js';
import { nextMoveFor, tmNumber } from '../data/tms.js';
import { getAbility } from '../data/abilities.js';
import { tmIconForType } from '../render/icons.js';
import { getPokemon } from '../data/pokemon.js';
import { weightedPickMany } from '../core/utils.js';
import { bus, EVENTS } from '../core/events.js';
import { maxHpFor, xpToNextLevel } from './stats.js';
import { transferUpgrades } from './moves.js';
import { BONUS_BY_TYPE, isBonusMove } from '../data/bonusMoves.js';
import { FloatingText } from '../entities/effects.js';

/** Opção usada quando não há mais upgrades disponíveis para aquele Pokémon. */
const HEAL_FALLBACK = {
  id: '__heal',
  name: 'Poção',
  description: `Restaura ${Math.round(CONFIG.progression.maxedHeal * 100)}% da vida deste Pokémon.`,
  icon: 'potion',
  scope: 'special'
};

/**
 * EXPERIÊNCIA, NÍVEIS, EVOLUÇÃO E MELHORIAS
 *
 * - Cada Pokémon tem nível e XP próprios. O XP do inimigo é dividido entre a
 *   equipe com pesos (CONFIG.progression.xpWeight): com a equipe cheia dá
 *   exatamente 25% por ativo e 8,33% por reserva.
 * - Com todas as melhorias, subir de nível pode ensinar o 2º golpe (raro).
 * - Subir de nível aumenta vida máxima e dano e, do nível 11 em diante, cura
 *   1/10 da vida (CONFIG.progression.levelUpHeal); evoluir cura tudo.
 * - A tela de melhoria aparece a cada `upgradeEveryLevels` níveis.
 * - Ao atingir o nível de evolução, o Pokémon evolui (níveis fiéis aos jogos).
 * - As melhorias de partida são só do Pokémon (não há bônus globais desde a
 *   0.21, quando a loja do treinador saiu).
 */
export class ProgressionSystem {
  constructor(run) {
    this.run = run;
  }

  xpToNext(level) { return xpToNextLevel(level); }

  /** Distribui o XP de um inimigo entre todos os Pokémon que ainda estão de pé. */
  addXp(amount) {
    const run = this.run;
    // no Modo Livre o XP é reduzido (0.20, CONFIG.endless.xpMult)
    const total = amount * run.playerStats.xpGain * (run.endless ? CONFIG.endless.xpMult : 1);
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
      // subir de nível cura 1/10 da vida de quem subiu, do nível 11 em diante
      // (a evolução, logo abaixo, cura tudo)
      if (!member.fainted && member.level >= CONFIG.progression.levelUpHealFrom) {
        const max = maxHpFor(member, this.run.playerStats.pokemonHpBonus);
        member.hp = Math.min(max, member.hp + max * CONFIG.progression.levelUpHeal);
      }

      // a melhoria não vem a cada nível: vem a cada N (menos interrupção). Quem
      // já tem todas não abre tela: cura sozinho (0.16)
      if (member.level % CONFIG.progression.upgradeEveryLevels === 0) {
        if (this.isMaxed(member)) this.maxedLevel(member);
        else member.pendingLevels++;
      }

      this.checkEvolution(member);
      this.maybeLearnBonusMove(member);
      need = this.xpToNext(member.level);
      bus.emit(EVENTS.POKEMON_LEVELED, { member, level: member.level });
    }
  }

  /**
   * Evolução por nível, fiel aos jogos.
   * A espécie muda (mais vida e mais dano), mas o Pokémon mantém habilidades e
   * melhorias — nada do que você construiu se perde. E sai com a vida cheia.
   */
  checkEvolution(member) {
    const data = getPokemon(member.pokemonId);
    const evo = data?.evolution;
    if (!evo || member.level < evo.level) return null;
    // Eevee: sem pedras como item, a evolução é sorteada entre as opções
    const options = [evo.to, ...(evo.alternatives ?? [])];
    const next = getPokemon(options[Math.floor(Math.random() * options.length)]);
    if (!next) return null;

    const from = data;
    member.pokemonId = next.id;

    // golpe que não existe na linha da espécie nova (Eevee → Vaporeon) vira o
    // da mesma posição nela, com as melhorias transferidas
    const current = member.abilities[0];
    if (next.moveLine?.length && !next.moveLine.includes(current)) {
      const tier = Math.max(0, from.moveLine?.indexOf(current) ?? 0);
      const replacement = next.moveLine[Math.min(tier, next.moveLine.length - 1)];
      member.upgrades = transferUpgrades(member.upgrades, current, replacement);
      member.abilities[0] = replacement;
      this.run.rebuildCompanionAbilities();
    }
    // Evoluir melhora o golpe (0.8): o Pokémon passa para o golpe do estágio novo,
    // o que a espécie já traz, se ainda estiver atrás dele na linha. Quem já
    // pegou esse golpe por TM segue com o que tem.
    const line = next.moveLine ?? [];
    const stageMove = next.abilities?.[0];
    if (stageMove && line.indexOf(stageMove) > line.indexOf(member.abilities[0])) {
      this.learnTM(member, stageMove);
    }
    // evoluir cura toda a vida (0.11.3; antes mantinha a proporção)
    member.hp = maxHpFor(member, this.run.playerStats.pokemonHpBonus);

    this.run.queueEvolution({ member, from, to: next });
    bus.emit(EVENTS.POKEMON_EVOLVED, { member, from: from.id, to: next.id, dex: next.dex });
    return next;
  }

  /**
   * O 2º golpe (0.14, data/bonusMoves.js): com todas as melhorias, cada nível tem
   * uma chance baixa de ensinar um golpe a mais — 2% de um dos 3 do tipo
   * principal; se não sair, 1% de um dos 3 do secundário. Um por Pokémon, para
   * sempre; ele mantém o golpe de antes e usa os dois.
   */
  maybeLearnBonusMove(member) {
    if (member.abilities.some(isBonusMove)) return null;
    if (!this.isMaxed(member)) return null;
    const [primary, secondary] = getPokemon(member.pokemonId).types;
    const { chancePrimary, chanceSecondary } = CONFIG.bonusMove;
    const type = Math.random() < chancePrimary ? primary
      : secondary && Math.random() < chanceSecondary ? secondary : null;
    const options = BONUS_BY_TYPE[type];
    if (!options?.length) return null;
    const moveId = options[Math.floor(Math.random() * options.length)];
    member.abilities.push(moveId);
    this.run.rebuildCompanionAbilities();
    // a única tela que o Pokémon com todas as melhorias ainda abre (0.16): o anúncio
    this.run.unlockQueue.push({ member, moveId });
    return moveId;
  }

  /** Já tem todas as melhorias do golpe (só resta a Poção)? */
  isMaxed(member) {
    return !Object.values(UPGRADES).some((up) => this.isAvailable(up, member));
  }

  /**
   * O nível de melhoria de quem já tem todas (0.16, pedido do Fellipe): sem
   * tela, cura sozinho a Poção (20%). A TM que a tela poderia trazer vem também
   * sozinha, com a mesma chance: trocar pela TM nunca é perder.
   */
  maxedLevel(member) {
    if (!member.fainted) {
      const max = maxHpFor(member, this.run.playerStats.pokemonHpBonus);
      const healed = Math.min(max - member.hp, max * CONFIG.progression.maxedHeal);
      member.hp += healed;
      const companion = this.run.companions?.find((c) => c.member === member);
      if (companion && healed >= 1 && this.run.effects) {
        this.run.effects.push(new FloatingText(companion.x, companion.y - 30, `+${Math.round(healed)}`, '#57d18a', 14));
      }
    }
    if (Math.random() < CONFIG.progression.tmChance) {
      const next = nextMoveFor(member.pokemonId, member.abilities[0]);
      if (next) {
        this.learnTM(member, next);
        this.run.refreshStats?.();
      }
    }
  }

  /** Níveis guardados de quem ficou com todas as melhorias (ex.: um save antigo) viram cura. */
  resolveMaxedLevels(member) {
    if (member.pendingLevels <= 0 || !this.isMaxed(member)) return false;
    while (member.pendingLevels > 0) {
      member.pendingLevels--;
      this.maxedLevel(member);
    }
    return true;
  }

  /** Stats da equipe: as do CONFIG (as melhorias do treinador saíram na 0.21). */
  computePlayerStats() {
    return {
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
    member.upgrades = transferUpgrades(member.upgrades, oldAbility, newAbility);
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
      member.hp = Math.min(max, member.hp + max * CONFIG.progression.maxedHeal);
      return;
    }

    if (upgradeId.startsWith('tm:')) {
      this.learnTM(member, upgradeId.slice(3));
      run.refreshStats();
      bus.emit(EVENTS.UPGRADE_TAKEN, { upgrade: { id: upgradeId, scope: 'tm' }, member });
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
