/**
 * Áreas de dano.
 *   kind 'zone'  — fica parada no chão por alguns segundos
 *   kind 'aura'  — acompanha o dono (Pokémon) enquanto ele estiver em campo
 *   kind 'nova'  — onda que se expande e acerta cada inimigo uma única vez
 */
export class Zone {
  constructor(opts) {
    Object.assign(this, {
      kind: 'zone',
      x: 0, y: 0,
      radius: 80,
      maxRadius: 80,
      growSpeed: 0,
      damage: 5,
      tickRate: 0.5,
      life: 4,
      type: 'normal',
      color: '#fff',
      knockback: 0,
      effects: null,
      owner: null,
      abilityId: null,
      hostile: false,
      delay: 0,            // aviso no chão antes de a onda sair (golpes de líder)
      visualType: null,    // tipo de quem usou (o golpe genérico do líder muda de cara)
      lifesteal: 0,        // 2º golpe: parte do dano volta como vida para o dono
      healTeam: 0,         // 2º golpe: cura a equipe dentro da área (fração da vida máxima)
      pull: 0,             // 2º golpe: puxa os inimigos para o centro (Whirlpool)
      dead: false
    }, opts);
    this.tick = 0;
    this.age = 0;
    this.seed = Math.random() * 1000;   // onde ficam os sprites espalhados pela área
    this.hits = new Set(); // usado pela nova (um acerto por inimigo)
  }

  update(dt) {
    this.age += dt;
    if (this.delay > 0) {
      this.delay -= dt;
      return;
    }
    if (this.kind === 'aura') {
      if (!this.owner || this.owner.dead) { this.dead = true; return; }
      this.x = this.owner.x;
      this.y = this.owner.y;
    }
    if (this.kind === 'nova') {
      this.radius = Math.min(this.maxRadius, this.radius + this.growSpeed * dt);
      if (this.radius >= this.maxRadius) this.dead = true;
      return;
    }
    if (this.life !== Infinity) {
      this.life -= dt;
      if (this.life <= 0) this.dead = true;
    }
  }

  /** Retorna true quando está na hora de causar dano (áreas contínuas). */
  readyToTick(dt) {
    this.tick -= dt;
    if (this.tick <= 0) {
      this.tick = this.tickRate;
      return true;
    }
    return false;
  }
}
