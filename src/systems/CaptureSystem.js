import { getPokemon } from '../data/pokemon.js';
import { poolEntries } from '../data/capturePools.js';
import { CONFIG } from '../core/config.js';
import { weightedPick, weightedPickMany } from '../core/utils.js';
import { bus, EVENTS } from '../core/events.js';
import { TeamSystem } from './TeamSystem.js';
import { isLegendary, LEGENDARY_ENCOUNTERS, LEGENDARY_WEIGHT } from '../data/legendaries.js';

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
    const picks = weightedPickMany(pool, count).map((entry) => entry.pokemon);
    const legendary = this.rollLegendary();
    // o lendário toma o lugar da última opção (ou entra, se a tabela deu menos)
    if (legendary && picks.length < count) picks.push(legendary);
    else if (legendary) picks[picks.length - 1] = legendary;
    return picks.map(roll);
  }

  /**
   * O sorteio do lendário (0.18, data/legendaries.js): só nas fases da tabela,
   * com a chance dela; um de cada por jornada (fora quem já está na equipe, no PC
   * da partida ou no do lobby) e no máximo uma vez por tentativa.
   */
  rollLegendary() {
    const encounter = LEGENDARY_ENCOUNTERS[this.run.stage.id];
    if (!encounter || Math.random() >= encounter.chance) return null;
    const owned = (id) => this.run.team.has(id) || this.run.pc.some((m) => m.pokemonId === id)
      || this.run.ownedElsewhere?.has(id) || this.run.legendariesOffered?.has(id);
    const options = encounter.pool.filter((id) => !owned(id))
      .map((id) => ({ id, weight: LEGENDARY_WEIGHT[id] ?? 1 }));
    if (!options.length) return null;
    const id = weightedPick(options).id;
    this.run.legendariesOffered?.add(id);
    return getPokemon(id);
  }

  /**
   * Nível de quem entra (captura ou presente): perto da equipe, um pouco atrás.
   * Antes entrava no 1, e numa equipe de nível 20 o novato não causava dano e
   * desmaiava na hora: parecia que não tinha entrado (o bug da Clefairy, 0.9).
   */
  newMemberLevel(pokemonId = null) {
    const levels = this.run.team.members.filter((m) => !m.fainted).map((m) => m.level);
    if (!levels.length) return 1;
    const average = levels.reduce((sum, level) => sum + level, 0) / levels.length;
    // o lendário chega no nível da equipe (0.16); os outros, um pouco atrás
    const behind = isLegendary(pokemonId) ? 0 : CONFIG.capture.levelsBehindTeam;
    return Math.max(1, Math.round(average) - behind);
  }

  /** Adiciona à equipe (quando ainda há espaço). */
  capture(pokemonId, { shiny = false } = {}) {
    const member = this.run.team.add(pokemonId, this.newMemberLevel(pokemonId), { shiny });
    if (member) this._registerCapture(pokemonId, false, shiny, member);
    return member;
  }

  /** Equipe cheia: o novo entra e quem sai vai para o PC (0.11; antes ele se perdia). */
  captureReplacing(oldUid, pokemonId, { shiny = false } = {}) {
    const leaving = this.run.team.members.find((m) => m.uid === oldUid);
    const member = this.run.team.replaceMember(oldUid, pokemonId, this.newMemberLevel(pokemonId), { shiny });
    if (!member) return null;
    if (leaving) this._deposit(leaving);
    this._registerCapture(pokemonId, false, shiny, member);
    return member;
  }

  /**
   * O novo vai direto para o PC, e a equipe fica como está (equipe cheia, ou o Kyogre,
   * que vai sempre para lá). `note` completa o aviso (0.37.9).
   */
  captureToPC(pokemonId, { shiny = false, note = '' } = {}) {
    const member = this.run.team.createMember(pokemonId, this.newMemberLevel(pokemonId), { shiny });
    this._deposit(member);
    this._registerCapture(pokemonId, true, shiny, member, note);
    return member;
  }

  /** Guarda no PC da partida; vai para o PC da jornada quando a fase é vencida. */
  _deposit(member) {
    this.run.pc.push(TeamSystem.serializeMember({ ...member, fainted: false }));
  }

  _registerCapture(pokemonId, toPC = false, shiny = false, member = null, note = '') {
    const data = getPokemon(pokemonId);
    this.run.stats.captures++;
    bus.emit(EVENTS.POKEMON_CAPTURED, { pokemonId, dex: data.dex, name: data.name, shiny });
    const name = shiny ? `✦ ${data.name} shiny` : data.name;
    // quem chega tarde vem treinado (0.26): o aviso diz com quantas melhorias
    const trained = Object.values(member?.upgrades ?? {}).reduce((sum, n) => sum + n, 0);
    const extra = trained ? ` com ${trained} melhoria${trained > 1 ? 's' : ''}` : '';
    const text = toPC ? `${name} foi para o PC${extra}!` : `${name} entrou para a equipe${extra}!`;
    bus.emit(EVENTS.TOAST, { text: note ? `${text} ${note}` : text, icon: 'ball' });
  }
}
