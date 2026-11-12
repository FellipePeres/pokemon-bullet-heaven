import { ASSET_MANIFEST } from '../data/assetManifest.js';
import { HUB_MAPS, HUB_SPRITES, HUB_DECOR } from '../data/hubMaps.js';
import { DIVE_WORLD } from '../data/diveWorld.js';

/**
 * O catálogo inteiro: o do extract.py e o da vila (tools/assets/hub.py). Cada
 * mapa da vila entra como uma folha de um quadro só: `hub/<mapa>` (o chão) e
 * `hub/<mapa>-top` (o que cobre os personagens).
 */
// e as do modo aquático (tools/assets/dive.py): Hoenn, o Kyogre, o salão, a cena do Maxie
const MANIFEST = { ...ASSET_MANIFEST, ...HUB_SPRITES, ...DIVE_WORLD.sprites };
for (const [id, map] of Object.entries(HUB_MAPS)) {
  const size = { frameWidth: map.width * 16, frameHeight: map.height * 16, frames: 1 };
  MANIFEST[`hub/${id}`] = { src: map.src, ...size };
  MANIFEST[`hub/${id}-top`] = { src: map.top, ...size };
  // o andar com o interruptor apertado (a Mansão, H-9)
  if (map.srcOn) {
    MANIFEST[`hub/${id}-on`] = { src: map.srcOn, ...size };
    MANIFEST[`hub/${id}-on-top`] = { src: map.topOn, ...size };
  }
}
// os móveis do quarto decorável: `hub/decor/<id>` e `hub/decor/<id>-top`
for (const [id, piece] of Object.entries(HUB_DECOR)) {
  const size = { frameWidth: piece.width * 16, frameHeight: piece.height * 16, frames: 1 };
  MANIFEST[`hub/decor/${id}`] = { src: piece.src, ...size };
  MANIFEST[`hub/decor/${id}-top`] = { src: piece.top, ...size };
}

/**
 * ASSETS LOCAIS — as folhas geradas por tools/assets/extract.py.
 *
 * Carregadas sob demanda e desenhadas em escala inteira, sem suavizar.
 * Enquanto uma folha não carrega (ou fora do navegador, nos testes), quem
 * desenha recebe null e usa o desenho procedural de sempre: o jogo nunca fica
 * sem imagem.
 */
const cache = new Map();

function load(key) {
  const def = MANIFEST[key];
  const entry = { def, img: null, ready: false };
  cache.set(key, entry);
  if (!def || typeof Image === 'undefined') return entry;
  entry.img = new Image();
  entry.img.onload = () => { entry.ready = true; };
  entry.img.src = def.src;
  return entry;
}

/** Folha pronta para desenhar, ou null enquanto carrega. */
export function getSheet(key) {
  const entry = cache.get(key) ?? load(key);
  return entry.ready ? entry : null;
}

/** Caminho do arquivo, para <img> e CSS da interface. */
export function assetUrl(key) {
  return MANIFEST[key]?.src ?? null;
}

/** Começa a carregar uma lista de folhas. */
export function preloadAssets(keys) {
  for (const key of keys) if (!cache.has(key)) load(key);
}

/**
 * Desenha um quadro da folha com o ponto de apoio em (x, y).
 * O padrão apoia pelo meio dos pés (anchorX 0.5, anchorY 1).
 * `rotation` (radianos) gira em volta do ponto de apoio.
 */
export function drawFrame(ctx, sheet, frame, x, y, opts = {}) {
  const { scale = 1, flipX = false, anchorX = 0.5, anchorY = 1, alpha = 1, rotation = 0 } = opts;
  const { frameWidth: w, frameHeight: h } = sheet.def;
  const dw = w * scale;
  const dh = h * scale;
  const sx = frame * w;

  ctx.imageSmoothingEnabled = false;
  const previousAlpha = ctx.globalAlpha;
  ctx.globalAlpha = previousAlpha * alpha;

  if (!rotation && !flipX) {
    // o caso comum, sem save/restore: posição inteira, senão a pixel art sai torta
    ctx.drawImage(sheet.img, sx, 0, w, h, Math.round(x - dw * anchorX), Math.round(y - dh * anchorY), dw, dh);
  } else {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (rotation) ctx.rotate(rotation);
    if (flipX) ctx.scale(-1, 1);
    ctx.drawImage(sheet.img, sx, 0, w, h, -dw * anchorX, -dh * anchorY, dw, dh);
    ctx.restore();
  }
  ctx.globalAlpha = previousAlpha;
}
