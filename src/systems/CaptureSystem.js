import { getPokemon } from '../data/pokemon.js';
import { poolEntries } from '../data/capturePools.js';
import { CONFIG } from '../core/config.js';
import { weightedPickMany } from '../core/utils.js';
import { bus, EVENTS } from '../core/events.js';
import { TeamSystem } from './TeamSystem.js';

/**
 * Captura: independente do combate.
 * Quando uma Poké Ball é coletada, o jogo pausa e este sistema apenas
 * devolve as opções. Quem mostra a tela é a UI; quem guarda é a TeamSystem.
 */
export class CaptureSystem {
  constructor(run) {
    this.run = run;
  }

  /**
   * Sorteia as espécies oferecidas usando a tabela de chances da fase
   * (ver data/capturePools.js). Quem já está na equipe fica de fora.
   */
  rollChoices(count = CONFIG.capture.choices) {
    // presente da fase: as opções são fixas (uma troca, o prêmio do Dojo)
    const gift = this.run.pendingGift;
    // cada opção pode vir shiny (rara): o card mostra, e ela entra assim na equipe
    const roll = (pokemon) => ({ ...pokemon, shiny: Math.random() < CONFIG.capture.shinyChance });
    if (gift) return gift.choices.map(getPokemon).filter((p) => p && !this.run.team.has(p.id)).map(roll);

    // o inicial do próprio jogador não volta como captura (os outros dois sim, raros)
    const own = this.run.campaignStarter;
    const pool = poolEntries(this.run.stage.capturePool)
      .filter((entry) => entry.pokemon.id !== own && !this.run.team.has(entry.pokemon.id));

    if (!pool.length) return [];
    return weightedPickMany(pool, count).map((entry) => roll(entry.pokemon));
  }

  /**
   * Nível de quem entra (captura ou presente): perto da equipe, um pouco atrás.
   * Antes entrava no 1, e numa equipe de nível 20 o novato não causava dano e
   * desmaiava na hora: parecia que não tinha entrado (o bug da Clefairy, 0.9).
   */
  newMemberLevel() {
    const levels = this.run.team.members.filter((m) => !m.fainted).map((m) => m.level);
    if (!levels.length) return 1;
    const average = levels.reduce((sum, level) => sum + level, 0) / levels.length;
    return Math.max(1, Math.round(average) - CONFIG.capture.levelsBehindTeam);
  }

  /** Adiciona à equipe (quando ainda há espaço). */
  capture(pokemonId, { shiny = false } = {}) {
    const member = this.run.team.add(pokemonId, this.newMemberLevel(), { shiny });
    if (member) this._registerCapture(pokemonId, false, shiny);
    return member;
  }

  /** Equipe cheia: o novo entra e quem sai vai para o PC (0.11; antes ele se perdia). */
  captureReplacing(oldUid, pokemonId, { shiny = false } = {}) {
    const leaving = this.run.team.members.find((m) => m.uid === oldUid);
    const member = this.run.team.replaceMember(oldUid, pokemonId, this.newMemberLevel(), { shiny });
    if (!member) return null;
    if (leaving) this._deposit(leaving);
    this._registerCapture(pokemonId, false, shiny);
    return member;
  }

  /** Equipe cheia: o novo vai direto para o PC, e a equipe fica como está. */
  captureToPC(pokemonId, { shiny = false } = {}) {
    const member = this.run.team.createMember(pokemonId, this.newMemberLevel(), { shiny });
    this._deposit(member);
    this._registerCapture(pokemonId, true, shiny);
    return member;
  }

  /** Guarda no PC da partida; vai para o PC da jornada quando a fase é vencida. */
  _deposit(member) {
    this.run.pc.push(TeamSystem.serializeMember({ ...member, fainted: false }));
  }

  _registerCapture(pokemonId, toPC = false, shiny = false) {
    const data = getPokemon(pokemonId);
    this.run.stats.captures++;
    this.run.captured.push(data.name);   // o Centro Pokémon avisa quem se perde numa derrota
    bus.emit(EVENTS.POKEMON_CAPTURED, { pokemonId, dex: data.dex, name: data.name, shiny });
    const name = shiny ? `✦ ${data.name} shiny` : data.name;
    bus.emit(EVENTS.TOAST, { text: toPC ? `${name} foi para o PC!` : `${name} entrou para a equipe!`, icon: 'ball' });
  }
}
