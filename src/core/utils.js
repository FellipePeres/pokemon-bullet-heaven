/** Funções auxiliares genéricas (matemática, sorteios, formatação). */

export const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);
export const lerp = (a, b, t) => a + (b - a) * t;

export const rand = (min, max) => min + Math.random() * (max - min);
export const randInt = (min, max) => Math.floor(rand(min, max + 1));
export const chance = (p) => Math.random() < p;

/** Sorteia um item de um array. */
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Sorteia N itens distintos de um array (sem repetir). */
export function pickMany(arr, n) {
  const pool = [...arr];
  const out = [];
  while (pool.length && out.length < n) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}

/** Sorteio ponderado. Espera itens no formato { weight: number, ... }. */
export function weightedPick(entries) {
  const total = entries.reduce((s, e) => s + (e.weight ?? 1), 0);
  let roll = Math.random() * total;
  for (const e of entries) {
    roll -= e.weight ?? 1;
    if (roll <= 0) return e;
  }
  return entries[entries.length - 1];
}

/** Sorteio ponderado de N itens distintos. */
export function weightedPickMany(entries, n) {
  const pool = [...entries];
  const out = [];
  while (pool.length && out.length < n) {
    const chosen = weightedPick(pool);
    out.push(chosen);
    pool.splice(pool.indexOf(chosen), 1);
  }
  return out;
}

export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
export const dist2 = (ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay;
  return dx * dx + dy * dy;
};
export const angle = (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax);

let _idCounter = 0;
export const uid = (prefix = 'e') => `${prefix}${++_idCounter}`;

/** 125 -> "02:05" */
export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Sistema de modificadores usado por upgrades.
 * base:  { damage: 10, cooldown: 1 }
 * mods:  { damage: { add: 2, mult: 0.5 }, cooldown: { mult: -0.2 } }
 * saída: (base + add) * (1 + mult)
 */
export function applyModifiers(base, mods) {
  const out = { ...base };
  for (const [key, mod] of Object.entries(mods || {})) {
    const start = typeof out[key] === 'number' ? out[key] : 0;
    out[key] = (start + (mod.add || 0)) * (1 + (mod.mult || 0));
  }
  return out;
}

/** Soma duas tabelas de modificadores no mesmo formato. */
export function mergeModifiers(target, source, times = 1) {
  for (const [key, mod] of Object.entries(source || {})) {
    if (!target[key]) target[key] = { add: 0, mult: 0 };
    target[key].add += (mod.add || 0) * times;
    target[key].mult += (mod.mult || 0) * times;
  }
  return target;
}

/** Cópia profunda simples (só dados serializáveis — suficiente para o save). */
export const deepClone = (obj) => JSON.parse(JSON.stringify(obj));
