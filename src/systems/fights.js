import { KyogreFight } from './kyogreFight.js';
import { ZapdosFight } from './zapdosFight.js';
import { ArticunoFight } from './articunoFight.js';

/**
 * AS LUTAS DE LENDÁRIO (H-5): o `kind` do `legendaryFight` da fase diz qual classe
 * roda por cima dela. Todas estendem o molde (systems/legendaryFight.js).
 */
const FIGHTS = { kyogre: KyogreFight, zapdos: ZapdosFight, articuno: ArticunoFight };

/** A luta da fase, ou null numa fase comum. */
export function createFight(run) {
  const cfg = run.stage.legendaryFight;
  if (!cfg) return null;
  const Fight = FIGHTS[cfg.kind];
  if (!Fight) throw new Error(`Luta de lendário desconhecida: ${cfg.kind}`);
  return new Fight(run);
}

export const FIGHT_KINDS = Object.keys(FIGHTS);
