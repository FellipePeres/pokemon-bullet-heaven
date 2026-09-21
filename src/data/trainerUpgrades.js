/**
 * MELHORIAS DO TREINADOR (progresso permanente, compradas com moedas).
 *
 * Diferença importante para os upgrades de partida:
 *   - Level up dentro da fase melhora SÓ o Pokémon (dano, projéteis, área...).
 *   - Aqui ficam os bônus globais do treinador, que valem em todas as fases.
 *
 * Os Shards vêm de concluir fases e de coletar conquistas.
 *
 * Campos:
 *   levels      quantas vezes pode ser comprada
 *   cost        custo da 1ª compra
 *   costGrowth  multiplicador de custo por nível já comprado
 *   modifiers   aplicados às stats da equipe (mesmo formato dos upgrades)
 */
export const TRAINER_UPGRADES = [
  {
    id: 'meta_speed',
    name: 'Tênis de Corrida',
    description: '+6% de velocidade de movimento por nível.',
    icon: 'speed',
    levels: 6, cost: 120, costGrowth: 1.45,
    modifiers: { speed: { mult: 0.06 } }
  },
  {
    id: 'meta_pickup',
    name: 'Ímã de Experiência',
    description: '+18% de raio de coleta dos orbes de XP por nível.',
    icon: 'pickup',
    levels: 6, cost: 110, costGrowth: 1.45,
    modifiers: { pickupRadius: { mult: 0.18 } }
  },
  {
    id: 'meta_xp',
    name: 'Amuleto da Sorte',
    description: '+8% de experiência ganha por nível.',
    icon: 'xp',
    levels: 6, cost: 160, costGrowth: 1.5,
    modifiers: { xpGain: { mult: 0.08 } }
  },
  {
    id: 'meta_ball',
    name: 'Detector de Poké Balls',
    description: '+20% de chance de encontrar Poké Balls por nível.',
    icon: 'ball',
    levels: 5, cost: 180, costGrowth: 1.5,
    modifiers: { ballChance: { mult: 0.2 } }
  },
  {
    id: 'meta_hp',
    name: 'Vitalidade da Equipe',
    description: '+12 de vida máxima para todos os Pokémon, por nível.',
    icon: 'hp',
    levels: 8, cost: 130, costGrowth: 1.4,
    modifiers: { pokemonHpBonus: { add: 12 } }
  },
  {
    id: 'meta_regen',
    name: 'Centro Pokémon Portátil',
    description: '+0,5 de vida por segundo para os Pokémon em campo, por nível.',
    icon: 'regen',
    levels: 5, cost: 200, costGrowth: 1.55,
    modifiers: { pokemonRegen: { add: 0.5 } }
  },
  {
    id: 'meta_swap',
    name: 'Troca Rápida',
    description: '-12% no tempo de recarga da troca, por nível.',
    icon: 'swap',
    levels: 4, cost: 150, costGrowth: 1.5,
    modifiers: { swapCooldown: { mult: -0.12 } }
  },
  {
    id: 'meta_damage',
    name: 'Treinamento de Batalha',
    description: '+4% de dano de toda a equipe, por nível.',
    icon: 'power',
    levels: 8, cost: 220, costGrowth: 1.55,
    modifiers: { damageMult: { mult: 0.04 } }
  },
  {
    id: 'meta_haste',
    name: 'Ritmo de Combate',
    description: '-3% de recarga de todas as habilidades, por nível.',
    icon: 'haste',
    levels: 6, cost: 240, costGrowth: 1.6,
    modifiers: { cooldownMult: { mult: -0.03 } }
  }
];

export const getTrainerUpgrade = (id) => TRAINER_UPGRADES.find((u) => u.id === id);

/** Custo do próximo nível de uma melhoria (null se já estiver no máximo). */
export function nextCost(upgrade, currentLevel = 0) {
  if (currentLevel >= upgrade.levels) return null;
  return Math.round(upgrade.cost * Math.pow(upgrade.costGrowth, currentLevel));
}
