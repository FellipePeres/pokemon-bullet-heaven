/**
 * UPGRADES DE PARTIDA
 *
 * Tudo aqui melhora APENAS o Pokémon que escolheu (dano, projéteis, área,
 * recarga, efeitos...). Bônus globais do treinador não moram mais aqui:
 * eles são comprados com moedas em data/trainerUpgrades.js.
 *
 * Campos:
 *   id, name, description, icon (chave de render/icons.js)
 *   maxStacks       quantas vezes pode ser escolhido
 *   weight          peso no sorteio das opções
 *   modifiers       { stat: { add, mult } }  (ver utils.applyModifiers)
 *   grantsAbility   concede uma nova habilidade ao Pokémon dono de `abilityId`
 *   requires        { upgrade: 'id', stacks: n } — pré-requisito para aparecer
 *
 * Upgrades genéricos (dano, recarga, área...) são gerados automaticamente para
 * toda habilidade; abaixo ficam apenas os que têm identidade própria.
 */
import { ABILITIES } from './abilities.js';

/* ============================================================
   1. Upgrades genéricos gerados por habilidade
   ============================================================ */
function genericUpgradesFor(ability) {
  const { id, name, behavior, base } = ability;
  const list = [];
  const add = (suffix, data) => list.push({ id: `${id}_${suffix}`, scope: 'ability', abilityId: id, ...data });

  add('damage', {
    name: `${name}: Potência`,
    description: '+28% de dano',
    icon: 'damage', maxStacks: 5, weight: 10,
    modifiers: { damage: { mult: 0.28 } }
  });

  if (base.cooldown) {
    add('cooldown', {
      name: `${name}: Reflexo`,
      description: '-16% de tempo de recarga',
      icon: 'cooldown', maxStacks: 4, weight: 9,
      modifiers: { cooldown: { mult: -0.16 } }
    });
  }

  if (behavior === 'projectile') {
    add('count', {
      name: `${name}: Multiplicar`,
      description: '+1 projétil',
      icon: 'count', maxStacks: 3, weight: 7,
      modifiers: { count: { add: 1 }, spread: { mult: 0.15 } }
    });
    add('pierce', {
      name: `${name}: Perfuração`,
      description: '+1 inimigo atravessado e +15% de alcance',
      icon: 'pierce', maxStacks: 3, weight: 6,
      modifiers: { pierce: { add: 1 }, duration: { mult: 0.15 } }
    });
    add('speed', {
      name: `${name}: Velocidade`,
      description: '+25% de velocidade do projétil',
      icon: 'projSpeed', maxStacks: 3, weight: 6,
      modifiers: { speed: { mult: 0.25 }, size: { mult: 0.08 } }
    });
  }

  if (behavior === 'orbit') {
    add('count', {
      name: `${name}: Mais Orbes`,
      description: '+1 orbe girando',
      icon: 'count', maxStacks: 3, weight: 8,
      modifiers: { count: { add: 1 } }
    });
    add('area', {
      name: `${name}: Órbita Ampla`,
      description: '+20% de raio e +10% de tamanho',
      icon: 'area', maxStacks: 3, weight: 6,
      modifiers: { area: { mult: 0.2 }, size: { mult: 0.1 } }
    });
  }

  if (behavior === 'aura' || behavior === 'nova' || behavior === 'ground_zone') {
    add('area', {
      name: `${name}: Amplitude`,
      description: '+30% de área',
      icon: 'area', maxStacks: 4, weight: 8,
      modifiers: { area: { mult: 0.3 } }
    });
  }

  if (behavior === 'aura' || behavior === 'ground_zone' || behavior === 'orbit') {
    add('tick', {
      name: `${name}: Intensidade`,
      description: '-24% de intervalo entre os danos',
      icon: 'tick', maxStacks: 3, weight: 6,
      modifiers: { tickRate: { mult: -0.24 } }
    });
  }

  if (behavior === 'ground_zone') {
    add('duration', {
      name: `${name}: Persistência`,
      description: '+35% de duração da área',
      icon: 'duration', maxStacks: 3, weight: 6,
      modifiers: { duration: { mult: 0.35 } }
    });
  }

  if (behavior === 'melee_arc') {
    add('arc', {
      name: `${name}: Amplitude`,
      description: '+25% de alcance e arco mais largo',
      icon: 'area', maxStacks: 3, weight: 7,
      modifiers: { range: { mult: 0.25 }, arc: { mult: 0.2 } }
    });
  }

  if (behavior === 'chain') {
    add('chains', {
      name: `${name}: Ricochete`,
      description: '+1 salto do raio',
      icon: 'chains', maxStacks: 4, weight: 8,
      modifiers: { chains: { add: 1 }, area: { mult: 0.08 } }
    });
  }

  return list;
}

/* ============================================================
   2. Upgrades especiais / evoluções de habilidade
   ============================================================ */
const SPECIAL_UPGRADES = [
  {
    id: 'ember_burn',
    scope: 'ability', abilityId: 'ember',
    name: 'Ember: Brasa Viva',
    description: 'Queimadura 60% mais forte e mais duradoura.',
    icon: 'status', maxStacks: 3, weight: 6,
    modifiers: { 'effect.burn.dps': { mult: 0.6 }, 'effect.burn.duration': { mult: 0.3 } }
  },
  {
    id: 'ember_fire_ring',
    scope: 'ability', abilityId: 'ember',
    name: 'EVOLUÇÃO: Fire Ring',
    description: 'Um anel de fogo passa a girar em volta do Pokémon, queimando quem chega perto.',
    icon: 'evolution', maxStacks: 1, weight: 4, rarity: 'evolution',
    grantsAbility: 'fire_ring',
    requires: { upgrade: 'ember_damage', stacks: 2 }
  },
  {
    id: 'water_gun_push',
    scope: 'ability', abilityId: 'water_gun',
    name: 'Water Gun: Pressão',
    description: '+60% de empurrão e desaceleração mais forte.',
    icon: 'status', maxStacks: 3, weight: 6,
    modifiers: { knockback: { mult: 0.6 }, 'effect.slow.factor': { mult: -0.15 } }
  },
  {
    id: 'water_gun_whirlpool',
    scope: 'ability', abilityId: 'water_gun',
    name: 'EVOLUÇÃO: Whirlpool',
    description: 'Redemoinhos passam a orbitar o Pokémon, empurrando e segurando a horda.',
    icon: 'evolution', maxStacks: 1, weight: 4, rarity: 'evolution',
    grantsAbility: 'whirlpool',
    requires: { upgrade: 'water_gun_damage', stacks: 2 }
  },
  {
    id: 'vine_whip_leech',
    scope: 'ability', abilityId: 'vine_whip',
    name: 'EVOLUÇÃO: Leech Field',
    description: 'As vinhas passam a ficar no chão, envenenando e segurando os inimigos.',
    icon: 'evolution', maxStacks: 1, weight: 4, rarity: 'evolution',
    grantsAbility: 'leech_field',
    requires: { upgrade: 'vine_whip_damage', stacks: 2 }
  },
  {
    id: 'thunder_shock_range',
    scope: 'ability', abilityId: 'thunder_shock',
    name: 'Thunder Shock: Condutividade',
    description: '+30% de alcance dos saltos.',
    icon: 'chains', maxStacks: 3, weight: 6,
    modifiers: { area: { mult: 0.3 }, range: { mult: 0.2 } }
  },
  {
    id: 'rock_throw_blast',
    scope: 'ability', abilityId: 'rock_throw',
    name: 'Rock Throw: Estilhaços',
    description: '+30% de área da explosão e mais dano em área.',
    icon: 'area', maxStacks: 3, weight: 6,
    modifiers: { area: { mult: 0.3 }, explodeDamage: { add: 0.15 } }
  },
  {
    id: 'poison_sting_venom',
    scope: 'ability', abilityId: 'poison_sting',
    name: 'Poison Sting: Toxina',
    description: 'Veneno 70% mais forte.',
    icon: 'status', maxStacks: 3, weight: 6,
    modifiers: { 'effect.poison.dps': { mult: 0.7 } }
  }
];

/* ============================================================
   Registro final
   ============================================================ */
export const UPGRADES = {};

for (const ability of Object.values(ABILITIES)) {
  if (ability.hostile) continue; // habilidades de inimigos não entram no pool
  for (const up of genericUpgradesFor(ability)) UPGRADES[up.id] = up;
}
for (const up of SPECIAL_UPGRADES) UPGRADES[up.id] = up;

export const getUpgrade = (id) => UPGRADES[id];
