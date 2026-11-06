/**
 * A CHAVE DO GOLPE DESPERTO (0.28, ideia do Fellipe: "o golpe desperto pode ser
 * desbloqueado se você aprimorar totalmente certas melhorias — o Gyarados seria
 * velocidade, penetração e dano; o Gloom, área, intervalo entre os danos e
 * recarga").
 *
 * Cada golpe tem 3 melhorias que formam a chave dele. Quando as 3 chegam ao
 * máximo, o Pokémon desperta o 2º golpe na hora (data/bonusMoves.js) — sem
 * sorteio. Antes (0.14 a 0.27) era preciso ter TODAS as melhorias e torcer por
 * 2% a cada nível.
 *
 * A chave é do golpe, não da espécie, porque as melhorias são do golpe: o
 * Gyarados usa Hydro Pump e o Gloom usa Toxic. Se o golpe troca (TM ou
 * evolução), a chave passa a ser a do golpe novo; as melhorias são transferidas
 * (systems/moves.js), então o progresso quase sempre vem junto.
 *
 * Os valores são os sufixos das melhorias de data/upgrades.js (`<golpe>_<sufixo>`):
 *   damage Potência · cooldown Reflexo · count Multiplicar / Mais Orbes ·
 *   pierce Perfuração · speed Velocidade · area Amplitude / Órbita Ampla ·
 *   tick Intensidade · duration Persistência · arc Amplitude (corpo a corpo) ·
 *   chains Ricochete
 *
 * Todas somam de 11 a 13 melhorias (33 a 39 níveis, se o jogador só escolher a
 * chave). Golpe sem entrada aqui usa a do comportamento (BY_BEHAVIOR).
 * Padrão até o Fellipe decidir golpe a golpe.
 */
import { getAbility } from './abilities.js';
import { getUpgrade } from './upgrades.js';

export const AWAKENING_KEYS = {
  /* ---------- projéteis: Potência e mais duas que dizem o que o golpe é ---------- */
  ember:         ['damage', 'count', 'cooldown'],   // fagulhas em leque
  water_gun:     ['damage', 'pierce', 'cooldown'],
  peck:          ['damage', 'speed', 'cooldown'],   // bicadas rápidas
  rock_throw:    ['damage', 'count', 'cooldown'],
  poison_sting:  ['damage', 'count', 'pierce'],
  confusion:     ['damage', 'pierce', 'cooldown'],
  mud_slap:      ['damage', 'count', 'speed'],
  bone_club:     ['damage', 'pierce', 'cooldown'],
  flamethrower:  ['damage', 'pierce', 'cooldown'],  // a labareda que atravessa
  ice_beam:      ['damage', 'pierce', 'speed'],
  solar_beam:    ['damage', 'pierce', 'cooldown'],
  psychic_wave:  ['damage', 'count', 'pierce'],
  hyper_beam:    ['damage', 'pierce', 'cooldown'],  // o raio pesado: o que pesa é a recarga longa
  razor_leaf:    ['damage', 'count', 'speed'],      // folhas em rajada
  bubble_beam:   ['damage', 'count', 'cooldown'],
  twineedle:     ['damage', 'count', 'pierce'],
  rock_slide:    ['damage', 'count', 'cooldown'],
  psybeam:       ['damage', 'pierce', 'speed'],
  shadow_ball:   ['damage', 'pierce', 'speed'],
  dragon_breath: ['damage', 'count', 'pierce'],
  fire_blast:    ['damage', 'count', 'speed'],
  hydro_pump:    ['damage', 'pierce', 'speed'],     // o exemplo do Fellipe (Gyarados)
  sludge_bomb:   ['damage', 'count', 'cooldown'],

  /* ---------- áreas no chão ---------- */
  toxic:         ['area', 'tick', 'cooldown'],      // o exemplo do Fellipe (Gloom)
  string_shot:   ['area', 'duration', 'cooldown'],  // a teia que segura a horda
  bug_bite:      ['damage', 'tick', 'area'],

  /* ---------- aura e órbita (não têm Reflexo) ---------- */
  mega_drain:    ['damage', 'area', 'tick'],
  fire_spin:     ['damage', 'count', 'tick']
};

/** A chave de quem não está na lista: ondas, raios e corpo a corpo têm só essas 3. */
export const AWAKENING_BY_BEHAVIOR = {
  projectile:  ['damage', 'pierce', 'cooldown'],
  melee_arc:   ['damage', 'cooldown', 'arc'],
  nova:        ['damage', 'cooldown', 'area'],
  chain:       ['damage', 'cooldown', 'chains'],
  ground_zone: ['area', 'tick', 'cooldown'],
  aura:        ['damage', 'area', 'tick'],
  orbit:       ['damage', 'count', 'tick'],
  signature:   ['damage', 'cooldown', 'area']
};

/** Os sufixos da chave de um golpe (o objeto de abilities.js). */
export const awakeningSuffixes = (ability) =>
  (ability ? AWAKENING_KEYS[ability.id] ?? AWAKENING_BY_BEHAVIOR[ability.behavior] ?? [] : []);

/**
 * A chave de um Pokémon (o da equipe ou do PC): as 3 melhorias do golpe
 * principal, quantas ele tem e o máximo de cada. Serve à partida, à janela da
 * equipe e ao PC.
 */
export function awakeningKeyOf(member) {
  const abilityId = member?.abilities?.[0];
  return awakeningSuffixes(getAbility(abilityId))
    .map((suffix) => getUpgrade(`${abilityId}_${suffix}`))
    .filter(Boolean)
    .map((up) => ({ up, stacks: Math.min(up.maxStacks, member.upgrades?.[up.id] ?? 0), max: up.maxStacks }));
}

/** Quanto da chave já foi feito: { have, need } (11 a 13 melhorias). */
export function awakeningProgress(member) {
  const key = awakeningKeyOf(member);
  return {
    have: key.reduce((sum, part) => sum + part.stacks, 0),
    need: key.reduce((sum, part) => sum + part.max, 0)
  };
}

/** O nome curto de cada parte, sem o nome do golpe ("Ember: Potência" → "Potência"). */
export const awakeningPartName = (up) => up.name.split(': ').pop();
