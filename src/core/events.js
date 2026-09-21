/**
 * EventBus — canal de comunicação entre sistemas.
 * Serve para manter gameplay, UI, save, Pokédex e conquistas desacoplados:
 * o combate só emite "enemy:killed"; quem quiser reagir, escuta.
 */
export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event, payload) {
    const set = this.listeners.get(event);
    if (set) for (const handler of [...set]) handler(payload);
    const all = this.listeners.get('*');
    if (all) for (const handler of [...all]) handler({ event, payload });
  }

  clear() {
    this.listeners.clear();
  }
}

/** Barramento global do jogo. */
export const bus = new EventBus();

/** Nomes de eventos centralizados para evitar erros de digitação. */
export const EVENTS = {
  ENEMY_KILLED: 'enemy:killed',
  LEVEL_UP: 'run:levelup',
  UPGRADE_TAKEN: 'run:upgrade',
  POKEMON_CAPTURED: 'team:captured',
  POKEMON_FAINTED: 'team:fainted',
  POKEMON_LEVELED: 'team:leveled',
  POKEMON_EVOLVED: 'team:evolved',
  SHARDS_EARNED: 'meta:shards',
  POKEMON_SWAPPED: 'team:swapped',
  BALL_PICKED: 'pickup:ball',
  STAGE_CLEARED: 'stage:cleared',
  STAGE_FAILED: 'stage:failed',
  BOSS_SPAWNED: 'stage:boss',
  TOAST: 'ui:toast'
};
