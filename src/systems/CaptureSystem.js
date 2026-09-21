import { getPokemon } from '../data/pokemon.js';
import { poolEntries } from '../data/capturePools.js';
import { CONFIG } from '../core/config.js';
import { weightedPickMany } from '../core/utils.js';
import { bus, EVENTS } from '../core/events.js';

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
    const pool = poolEntries(this.run.stage.capturePool)
      .filter((entry) => !entry.pokemon.starter && !this.run.team.has(entry.pokemon.id));

    if (!pool.length) return [];
    return weightedPickMany(pool, count).map((entry) => entry.pokemon);
  }

  /** Adiciona à equipe (quando ainda há espaço). */
  capture(pokemonId) {
    const member = this.run.team.add(pokemonId);
    if (member) this._registerCapture(pokemonId);
    return member;
  }

  /** Substitui um membro existente (equipe cheia). */
  captureReplacing(oldUid, pokemonId) {
    const member = this.run.team.replaceMember(oldUid, pokemonId);
    if (member) this._registerCapture(pokemonId);
    return member;
  }

  _registerCapture(pokemonId) {
    const data = getPokemon(pokemonId);
    this.run.stats.captures++;
    bus.emit(EVENTS.POKEMON_CAPTURED, { pokemonId, dex: data.dex, name: data.name });
    bus.emit(EVENTS.TOAST, { text: `${data.name} entrou para a equipe!`, icon: 'ball' });
  }
}
