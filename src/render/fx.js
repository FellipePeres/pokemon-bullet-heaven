import { CONFIG } from '../core/config.js';
import { FX } from '../data/fx.js';
import { getSheet, drawFrame } from './assets.js';

/** Lista de quadros de cada efeito (os do catálogo, ou todos os da folha). */
const frameLists = new Map();

function framesOf(id, def, sheet) {
  let list = frameLists.get(id);
  if (!list) {
    list = def.frames ?? Array.from({ length: sheet.def.frames }, (_, i) => i);
    frameLists.set(id, list);
  }
  return list;
}

/**
 * Desenha um efeito do catálogo (data/fx.js) centrado em (x, y).
 *   t         segundos desde o começo: anima em loop pelo `fps` do efeito
 *   progress  0..1: toca uma vez (impactos); com um quadro só, some aos poucos
 *   frame     índice fixo na lista de quadros (ex.: uma nota diferente por posição)
 *   angle     direção do movimento, para os efeitos que giram com ele
 *   scale     multiplica a escala do efeito; alpha, transparência
 * Devolve false enquanto a folha não carregou: quem chamou usa o desenho antigo.
 */
export function drawFx(ctx, id, x, y, opts = {}) {
  const def = FX[id];
  const sheet = def && getSheet(def.sheet ?? `fx/${id}`);
  if (!sheet) return false;

  const frames = framesOf(id, def, sheet);
  let index;
  if (opts.frame != null) index = opts.frame % frames.length;
  else if (opts.progress != null) index = Math.min(frames.length - 1, Math.floor(opts.progress * frames.length));
  else index = Math.floor((opts.t ?? 0) * (def.fps ?? 10)) % frames.length;

  let rotation = 0;
  if (def.rotate) rotation = (opts.angle ?? 0) - (def.angle ?? 0);
  if (def.spin) rotation += (opts.t ?? 0) * def.spin;

  let alpha = opts.alpha ?? 1;
  if (opts.progress != null && frames.length === 1) alpha *= 1 - opts.progress;

  drawFrame(ctx, sheet, frames[index], x, y, {
    scale: (def.scale ?? CONFIG.render.pixelScale) * (opts.scale ?? 1),
    anchorX: 0.5,
    anchorY: def.anchorY ?? 0.5,
    rotation,
    alpha
  });
  return true;
}
