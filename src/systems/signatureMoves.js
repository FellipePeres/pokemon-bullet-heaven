import { nearestEnemy, enemiesInRadius, damageEnemy } from './combat.js';
import { burst } from '../entities/effects.js';

/**
 * OS GOLPES EXCLUSIVOS DOS LENDÁRIOS (data/legendaries.js), comportamento
 * `signature`. Cada um é um objeto em `run.signatures` com fases próprias
 * (carga, disparo, impacto): a lógica fica aqui e o desenho em
 * render/signature.js, que lê os mesmos campos. Sem tremor de tela (só os
 * golpes dos líderes tremem): o impacto vem do visual.
 *
 * Campos comuns: kind, x, y, age, owner (o Pokémon), damage, effects, type,
 * color, seed, dead. O resto é de cada golpe.
 */

const TAU = Math.PI * 2;

/** Dispara o golpe exclusivo. Devolve false sem alvo (o AbilitySystem tenta logo de novo). */
export function castSignature(run, companion, inst) {
  const cast = CASTS[inst.ability.signature];
  if (!cast) return false;
  const sig = cast(run, companion, inst.stats, inst);
  if (!sig) return false;
  run.signatures.push({
    kind: inst.ability.signature, age: 0, owner: companion, damage: inst.stats.damage,
    effects: inst.effects, type: inst.ability.type, color: inst.color, seed: Math.random() * TAU,
    dead: false, ...sig
  });
  return true;
}

export function updateSignatures(run, dt) {
  for (const sig of run.signatures) {
    if (sig.dead) continue;
    sig.age += dt;
    UPDATES[sig.kind]?.(run, sig, dt);
  }
}

/* ------------------------------------------------------------------ apoio */

function hit(run, sig, enemy, damage, opts = {}) {
  damageEnemy(run, enemy, damage, {
    type: opts.type ?? sig.type, effects: opts.effects ?? sig.effects,
    knockback: opts.knockback ?? 0, from: opts.from ?? { x: sig.x, y: sig.y },
    owner: sig.owner, silent: opts.silent
  });
}

/** Acerta uma vez cada inimigo que encostar num círculo (guarda quem já levou em `hits`). */
function touch(run, x, y, radius, hits, onHit) {
  for (const enemy of run.grid.query(x, y, radius + 30)) {
    if (enemy.dead || hits.has(enemy)) continue;
    const r = radius + enemy.radius;
    const dx = enemy.x - x, dy = enemy.y - y;
    if (dx * dx + dy * dy > r * r) continue;
    hits.add(enemy);
    onHit(enemy);
  }
}

function turnToward(angle, target, maxStep) {
  let diff = target - angle;
  while (diff > Math.PI) diff -= TAU;
  while (diff < -Math.PI) diff += TAU;
  return angle + Math.max(-maxStep, Math.min(maxStep, diff));
}

/* ------------------------------------------------------------------ disparo */

const CASTS = {
  /** Articuno: carrega em volta dele e estilhaça num anel. */
  sheer_cold(run, c, s) {
    if (!nearestEnemy(run, c.x, c.y, s.area)) return null;
    return { x: c.x, y: c.y, charge: s.charge, radius: 0, maxRadius: s.area, speed: s.speed,
             knockback: s.knockback, hits: new Set(), fade: 0.45, endAge: null, burstAt: null };
  },

  /** Zapdos: a esfera sai na direção do mais perto. */
  zap_cannon(run, c, s) {
    const target = nearestEnemy(run, c.x, c.y, s.range);
    if (!target) return null;
    const angle = Math.atan2(target.y - c.y, target.x - c.x);
    return { x: c.x, y: c.y, angle, speed: s.speed, size: s.size, life: s.duration, area: s.area,
             chains: s.chains, tickRate: s.tickRate, tick: s.tickRate * 0.5, knockback: s.knockback,
             hits: new Set(), arcs: [], trail: [], explodeAt: null };
  },

  /** Moltres: as penas saem em espiral, cada disparo girado em relação ao anterior. */
  sacred_fire(run, c, s, inst) {
    if (!nearestEnemy(run, c.x, c.y, s.range)) return null;
    inst.runtime.spin = (inst.runtime.spin ?? 0) + 0.45;
    const feathers = Array.from({ length: s.count }, (_, i) => ({
      x: c.x, y: c.y, angle: inst.runtime.spin + (TAU * i) / s.count,
      hits: new Set(), trail: [], done: false
    }));
    return { x: c.x, y: c.y, feathers, pillars: [], speed: s.speed, size: s.size, life: s.duration,
             area: s.area, knockback: s.knockback, swirl: 1.7 };
  },

  /** Mewtwo: a singularidade nasce onde a horda está mais junta. */
  psystrike(run, c, s) {
    const near = enemiesInRadius(run, c.x, c.y, s.range);
    if (!near.length) return null;
    // amostra de até 20 candidatos: o centro é quem tem mais vizinhos
    const sample = near.length <= 20 ? near
      : Array.from({ length: 20 }, () => near[Math.floor(Math.random() * near.length)]);
    let best = sample[0], bestCount = -1;
    for (const e of sample) {
      const count = enemiesInRadius(run, e.x, e.y, s.area * 0.6).length + (e.boss ? 6 : e.elite ? 2 : 0);
      if (count > bestCount) { bestCount = count; best = e; }
    }
    return { x: best.x, y: best.y, fromX: c.x, fromY: c.y, duration: s.duration, area: s.area,
             pull: s.pull, tickRate: s.tickRate, tick: 0, knockback: s.knockback, implodeAt: null };
  },

  /** Mew: as bolhas saem em leque e, depois de flutuar um pouco, perseguem. */
  metronome(run, c, s, inst) {
    if (!nearestEnemy(run, c.x, c.y, s.range)) return null;
    const elements = inst.ability.elements;
    const offset = Math.random() * TAU;
    const bubbles = Array.from({ length: s.count }, (_, i) => {
      const element = elements[Math.floor(Math.random() * elements.length)];
      return { x: c.x, y: c.y, angle: offset + (TAU * i) / s.count, element, hue: element.hue,
               target: null, retarget: 0, popped: false, wobble: Math.random() * TAU };
    });
    return { x: c.x, y: c.y, bubbles, pops: [], speed: s.speed, size: s.size, life: s.duration,
             area: s.area, range: s.range, knockback: s.knockback };
  },

  /** Kyogre (0.37): três anéis de onda saem dele, um atrás do outro. */
  origin_pulse(run, c, s) {
    if (!nearestEnemy(run, c.x, c.y, s.area)) return null;
    const rings = Array.from({ length: s.count }, (_, i) => ({ start: i * s.gap, radius: 0, hits: new Set(), done: false }));
    return { x: c.x, y: c.y, rings, maxRadius: s.area, speed: s.speed, knockback: s.knockback };
  }
};

/* ------------------------------------------------------------------ a cada quadro */

const UPDATES = {
  sheer_cold(run, sig, dt) {
    if (sig.age < sig.charge) {
      // carregando: o floco acompanha o Articuno
      if (sig.owner && !sig.owner.dead) { sig.x = sig.owner.x; sig.y = sig.owner.y; }
      return;
    }
    if (sig.burstAt == null) {
      sig.burstAt = sig.age;
      sig.radius = 24;
      burst(run.particles, sig.x, sig.y, '#dff8ff', 22, 380, 4, 0.7);
    }
    if (sig.endAge == null) {
      sig.radius = Math.min(sig.maxRadius, sig.radius + sig.speed * dt);
      touch(run, sig.x, sig.y, sig.radius, sig.hits, (enemy) => {
        hit(run, sig, enemy, sig.damage, { knockback: sig.knockback });
      });
      if (sig.radius >= sig.maxRadius) sig.endAge = sig.age;
    } else if (sig.age - sig.endAge > sig.fade) {
      sig.dead = true;
    }
  },

  zap_cannon(run, sig, dt) {
    for (const arc of sig.arcs) arc.life -= dt;
    sig.arcs = sig.arcs.filter((arc) => arc.life > 0);

    if (sig.explodeAt != null) {
      if (sig.age - sig.explodeAt > 0.5) sig.dead = true;
      return;
    }

    // persegue de leve quem estiver à frente
    const ahead = nearestEnemy(run, sig.x, sig.y, 260);
    if (ahead) sig.angle = turnToward(sig.angle, Math.atan2(ahead.y - sig.y, ahead.x - sig.x), 1.6 * dt);
    sig.x += Math.cos(sig.angle) * sig.speed * dt;
    sig.y += Math.sin(sig.angle) * sig.speed * dt;
    sig.trail.push({ x: sig.x, y: sig.y });
    if (sig.trail.length > 12) sig.trail.shift();

    // atravessa a horda: quem encosta leva o golpe inteiro
    touch(run, sig.x, sig.y, sig.size, sig.hits, (enemy) => {
      hit(run, sig, enemy, sig.damage, { knockback: sig.knockback, from: { x: sig.x, y: sig.y } });
    });

    // descarga: raios nos mais perto, de tempos em tempos
    sig.tick -= dt;
    if (sig.tick <= 0) {
      sig.tick = sig.tickRate;
      const around = enemiesInRadius(run, sig.x, sig.y, sig.area)
        .map((e) => ({ e, d: Math.hypot(e.x - sig.x, e.y - sig.y) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, sig.chains);
      for (const { e } of around) {
        hit(run, sig, e, sig.damage * 0.35, { silent: Math.random() > 0.4 });
        sig.arcs.push({ x1: sig.x, y1: sig.y, x2: e.x, y2: e.y, life: 0.14, maxLife: 0.14 });
      }
    }

    if (sig.age >= sig.life) {
      sig.explodeAt = sig.age;
      for (const e of enemiesInRadius(run, sig.x, sig.y, sig.area * 0.8)) {
        hit(run, sig, e, sig.damage, { knockback: 220, from: { x: sig.x, y: sig.y } });
      }
      burst(run.particles, sig.x, sig.y, '#fff3a0', 24, 340, 4, 0.6);
    }
  },

  sacred_fire(run, sig, dt) {
    let flying = 0;
    for (const f of sig.feathers) {
      if (f.done) continue;
      flying++;
      f.angle += sig.swirl * dt;
      f.x += Math.cos(f.angle) * sig.speed * dt;
      f.y += Math.sin(f.angle) * sig.speed * dt;
      f.trail.push({ x: f.x, y: f.y });
      if (f.trail.length > 10) f.trail.shift();
      touch(run, f.x, f.y, sig.size, f.hits, (enemy) => {
        hit(run, sig, enemy, sig.damage, { knockback: sig.knockback, from: { x: f.x, y: f.y } });
      });
      if (sig.age >= sig.life) {
        // a pena para e vira uma coluna de fogo
        f.done = true;
        sig.pillars.push({ x: f.x, y: f.y, born: sig.age, life: 0.65 });
        for (const e of enemiesInRadius(run, f.x, f.y, sig.area)) {
          hit(run, sig, e, sig.damage * 0.8, { knockback: 90, from: { x: f.x, y: f.y }, silent: Math.random() > 0.5 });
        }
      }
    }
    if (!flying && sig.pillars.every((p) => sig.age - p.born > p.life)) sig.dead = true;
  },

  psystrike(run, sig, dt) {
    if (sig.age < sig.duration) {
      // puxa a horda para o centro e machuca aos poucos
      for (const e of enemiesInRadius(run, sig.x, sig.y, sig.area)) {
        if (e.boss) continue;
        const dx = sig.x - e.x, dy = sig.y - e.y;
        const d = Math.hypot(dx, dy);
        if (d > 8) e.knockback(dx / d, dy / d, sig.pull * dt * 8);
      }
      sig.tick -= dt;
      if (sig.tick <= 0) {
        sig.tick = sig.tickRate;
        for (const e of enemiesInRadius(run, sig.x, sig.y, sig.area)) {
          hit(run, sig, e, sig.damage * 0.08, { effects: null, silent: Math.random() > 0.2 });
        }
      }
      return;
    }
    if (sig.implodeAt == null) {
      // a implosão: o golpe inteiro em todo mundo, e a horda voa para fora
      sig.implodeAt = sig.age;
      for (const e of enemiesInRadius(run, sig.x, sig.y, sig.area * 1.05)) {
        hit(run, sig, e, sig.damage, { knockback: sig.knockback });
      }
      burst(run.particles, sig.x, sig.y, '#f0a0ff', 30, 420, 4, 0.7);
    }
    if (sig.age - sig.implodeAt > 0.6) sig.dead = true;
  },

  metronome(run, sig, dt) {
    for (const pop of sig.pops) pop.age += dt;
    sig.pops = sig.pops.filter((pop) => pop.age < 0.55);

    let alive = 0;
    for (const b of sig.bubbles) {
      if (b.popped) continue;
      alive++;
      // flutua para fora no começo; depois persegue
      const drifting = sig.age < 0.35;
      if (!drifting) {
        b.retarget -= dt;
        if (b.retarget <= 0 || !b.target || b.target.dead) {
          b.retarget = 0.25;
          b.target = nearestEnemy(run, b.x, b.y, sig.range);
        }
        if (b.target) b.angle = turnToward(b.angle, Math.atan2(b.target.y - b.y, b.target.x - b.x), 4.5 * dt);
      }
      const speed = drifting ? sig.speed * 0.55 : sig.speed;
      b.x += Math.cos(b.angle) * speed * dt;
      b.y += Math.sin(b.angle) * speed * dt + Math.sin(sig.age * 6 + b.wobble) * 18 * dt;

      let touched = false;
      if (!drifting) touch(run, b.x, b.y, sig.size, new Set(), () => { touched = true; });
      if (touched || sig.age >= sig.life) {
        b.popped = true;
        sig.pops.push({ x: b.x, y: b.y, hue: b.hue, age: 0 });
        for (const e of enemiesInRadius(run, b.x, b.y, sig.area)) {
          hit(run, sig, e, sig.damage, {
            type: b.element.type, effects: b.element.effects, knockback: sig.knockback, from: { x: b.x, y: b.y }
          });
        }
      }
    }
    if (!alive && !sig.pops.length) sig.dead = true;
  },

  origin_pulse(run, sig, dt) {
    // os anéis saem do Kyogre: o centro acompanha ele até o primeiro sair
    if (sig.age < (sig.rings[0]?.start ?? 0) + 0.05 && sig.owner && !sig.owner.dead) { sig.x = sig.owner.x; sig.y = sig.owner.y; }
    let alive = false;
    for (const ring of sig.rings) {
      if (ring.done) continue;
      alive = true;
      if (sig.age < ring.start) continue;
      ring.radius = Math.min(sig.maxRadius, ring.radius + sig.speed * dt);
      touch(run, sig.x, sig.y, ring.radius, ring.hits, (enemy) => {
        if (enemy.boss || Math.hypot(enemy.x - sig.x, enemy.y - sig.y) > ring.radius - 46) {
          hit(run, sig, enemy, sig.damage, { knockback: sig.knockback });
        } else ring.hits.delete(enemy);   // só a borda do anel acerta
      });
      if (ring.radius >= sig.maxRadius) ring.done = true;
    }
    if (!alive) sig.dead = true;
  }
};
