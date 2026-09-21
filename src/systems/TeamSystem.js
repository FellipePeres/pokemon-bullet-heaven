import { CONFIG } from '../core/config.js';
import { getPokemon } from '../data/pokemon.js';
import { bus, EVENTS } from '../core/events.js';
import { uid } from '../core/utils.js';
import { maxHpFor } from './stats.js';

/**
 * Equipe do jogador.
 *
 * `members` guarda até 6 Pokémon com todo o estado de cada um (nível, XP, vida,
 * upgrades, níveis pendentes, desmaio). `active` guarda quem está lutando agora.
 * A quantidade de ativos vem do CONFIG e pode mudar sem reescrever nada.
 */
export class TeamSystem {
  constructor(run) {
    this.run = run;
    this.members = [];
    this.active = new Array(CONFIG.team.activeSlots).fill(null);
    this.swapTimer = 0;
    this.selectedSlot = 0; // slot ativo que receberá a próxima troca
  }

  get maxSize() { return CONFIG.team.maxSize; }
  get isFull() { return this.members.length >= this.maxSize; }
  get reserve() { return this.members.filter((m) => !this.active.includes(m)); }
  get activeMembers() { return this.active.filter(Boolean); }
  get alive() { return this.members.filter((m) => !m.fainted); }
  get allFainted() { return this.members.length > 0 && this.members.every((m) => m.fainted); }

  has(pokemonId) { return this.members.some((m) => m.pokemonId === pokemonId); }

  /** Cria a entrada de equipe de um Pokémon: o estado dele nesta jornada. */
  createMember(pokemonId, level = 1) {
    const data = getPokemon(pokemonId);
    const member = {
      uid: uid('mon'),
      pokemonId,
      level,
      xp: 0,
      hp: 0,
      fainted: false,
      pendingLevels: 0,
      abilities: [...data.abilities],
      upgrades: {}            // upgrades de habilidade são por Pokémon
    };
    member.hp = maxHpFor(member, this.run.playerStats?.pokemonHpBonus ?? 0);
    return member;
  }

  /** Adiciona um Pokémon à equipe. Entra em campo se houver slot ativo livre. */
  add(pokemonId, level = 1) {
    if (this.isFull) return null;
    const member = this.createMember(pokemonId, level);
    this.members.push(member);

    const freeSlot = this.active.indexOf(null);
    if (freeSlot !== -1) {
      this.active[freeSlot] = member;
      this.run.syncCompanions();
    }
    return member;
  }

  /** Substitui um membro da equipe (usado quando a equipe está cheia). */
  replaceMember(oldUid, pokemonId) {
    const index = this.members.findIndex((m) => m.uid === oldUid);
    if (index === -1) return null;
    const newMember = this.createMember(pokemonId);
    const activeIndex = this.active.findIndex((m) => m && m.uid === oldUid);
    this.members[index] = newMember;
    if (activeIndex !== -1) this.active[activeIndex] = newMember;
    this.run.syncCompanions();
    return newMember;
  }

  get swapReady() { return this.swapTimer <= 0; }

  update(dt) {
    if (this.swapTimer > 0) this.swapTimer = Math.max(0, this.swapTimer - dt);

    // Pokémon na reserva se recuperam devagar (desmaiados não).
    const bonus = this.run.playerStats.pokemonHpBonus;
    for (const member of this.reserve) {
      if (member.fainted) continue;
      const max = maxHpFor(member, bonus);
      if (member.hp < max) member.hp = Math.min(max, member.hp + CONFIG.pokemon.benchRegen * dt);
    }
  }

  /** Coloca um membro da reserva em um slot ativo. */
  swapIn(memberUid, slotIndex = this.selectedSlot, { ignoreCooldown = false } = {}) {
    if (!ignoreCooldown && !this.swapReady) return false;
    const member = this.members.find((m) => m.uid === memberUid);
    if (!member || member.fainted) return false;
    if (this.active.includes(member)) return false;

    const slot = Math.max(0, Math.min(this.active.length - 1, slotIndex));
    const leaving = this.active[slot];
    this.active[slot] = member;
    if (!ignoreCooldown) this.swapTimer = this.run.playerStats.swapCooldown;
    this.run.syncCompanions();

    bus.emit(EVENTS.POKEMON_SWAPPED, { entering: member, leaving });
    bus.emit(EVENTS.TOAST, {
      text: `${getPokemon(member.pokemonId).name} entrou em campo!`,
      icon: 'swap'
    });
    return true;
  }

  /** Atalho do teclado 1-6: usa a posição na lista da equipe. */
  swapByIndex(index) {
    const member = this.members[index];
    if (!member) return false;
    if (this.active.includes(member)) {
      // clicar em quem já está ativo apenas seleciona o slot de destino
      this.selectedSlot = this.active.indexOf(member);
      return false;
    }
    return this.swapIn(member.uid);
  }

  /**
   * Um Pokémon caiu: sai de campo e, se houver reserva disponível,
   * outro entra na hora (sem gastar o cooldown de troca).
   */
  handleFaint(member) {
    const slot = this.active.indexOf(member);
    if (slot === -1) return null;
    this.active[slot] = null;

    const replacement = this.members.find((m) => !m.fainted && !this.active.includes(m));
    if (replacement) this.active[slot] = replacement;
    this.run.syncCompanions();

    bus.emit(EVENTS.POKEMON_FAINTED, { member });
    bus.emit(EVENTS.TOAST, {
      text: `${getPokemon(member.pokemonId).name} desmaiou!`,
      icon: 'faint'
    });
    return replacement;
  }

  /** Serialização para o save. */
  serialize() {
    return {
      members: this.members.map((m) => ({
        uid: m.uid, pokemonId: m.pokemonId, level: m.level, xp: Math.round(m.xp),
        hp: Math.round(m.hp), fainted: m.fainted, pendingLevels: m.pendingLevels,
        abilities: [...m.abilities], upgrades: { ...m.upgrades }
      })),
      active: this.active.map((m) => (m ? m.uid : null))
    };
  }

  restore(data, { healAll = false } = {}) {
    if (!data) return;
    this.members = (data.members ?? []).map((m) => {
      const member = {
        uid: m.uid ?? uid('mon'),
        pokemonId: m.pokemonId,
        level: m.level ?? 1,
        xp: m.xp ?? 0,
        hp: m.hp ?? 0,
        fainted: !!m.fainted,
        pendingLevels: m.pendingLevels ?? 0,
        abilities: [...(m.abilities ?? getPokemon(m.pokemonId).abilities)],
        upgrades: { ...(m.upgrades ?? {}) }
      };
      // ao começar uma fase nova a equipe chega descansada
      if (healAll) {
        member.fainted = false;
        member.hp = maxHpFor(member, this.run.playerStats?.pokemonHpBonus ?? 0);
      } else if (!member.hp) {
        member.hp = maxHpFor(member, this.run.playerStats?.pokemonHpBonus ?? 0);
      }
      return member;
    });

    this.active = new Array(CONFIG.team.activeSlots).fill(null);
    (data.active ?? []).forEach((memberUid, i) => {
      if (i >= this.active.length) return;
      const found = this.members.find((m) => m.uid === memberUid);
      if (found && !found.fainted) this.active[i] = found;
    });
    // completa os slots ativos com quem estiver disponível
    for (let i = 0; i < this.active.length; i++) {
      if (this.active[i]) continue;
      const candidate = this.members.find((m) => !m.fainted && !this.active.includes(m));
      if (candidate) this.active[i] = candidate;
    }
  }
}
