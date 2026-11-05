import { CONFIG } from '../core/config.js';
import { typeColor } from '../data/types.js';
import { getSheet, drawFrame } from './assets.js';

/**
 * SPRITES
 *
 * O jogo tenta carregar o sprite oficial pelo número da Pokédex
 * (repositório público PokeAPI/sprites). Se não conseguir — sem internet,
 * por exemplo — desenha um sprite procedural com a cor do tipo.
 * Assim o jogo nunca fica sem imagem e você pode trocar por arte própria
 * depois: basta colocar "assets/sprites/<dex>.png" e ligar CONFIG.sprites.useLocal.
 */
const cache = new Map();

/**
 * Pokémon animados (folhas geradas dos GIFs da Gen 5): pixel do GIF -> pixel da
 * tela, e a altura mínima e máxima em relação ao tamanho pedido.
 */
const ANIM_SCALE = 0.8;
const ANIM_MIN_HEIGHT = 0.8;
const ANIM_MAX_HEIGHT = 1.6;

function load(dex) {
  const entry = { img: new Image(), ready: false, failed: false };
  entry.img.crossOrigin = 'anonymous';
  entry.img.onload = () => { entry.ready = true; };
  entry.img.onerror = () => {
    // tenta o remoto se o local falhar; senão desiste e usa o procedural
    if (CONFIG.sprites.useLocal && !entry.triedRemote && CONFIG.sprites.useRemote) {
      entry.triedRemote = true;
      entry.img.src = `${CONFIG.sprites.remoteBase}${dex}.png`;
    } else {
      entry.failed = true;
    }
  };
  entry.img.src = CONFIG.sprites.useLocal
    ? `${CONFIG.sprites.localBase}${dex}.png`
    : `${CONFIG.sprites.remoteBase}${dex}.png`;
  cache.set(dex, entry);
  return entry;
}

/** Devolve a imagem pronta ou null. */
export function getSprite(dex) {
  if (!dex) return null;
  if (!CONFIG.sprites.useRemote && !CONFIG.sprites.useLocal) return null;
  const entry = cache.get(dex) ?? load(dex);
  return entry.ready ? entry.img : null;
}

/** URL do sprite estático (usado no canvas e como fallback na interface). */
export function spriteUrl(dex, shiny = false) {
  return CONFIG.sprites.useLocal
    ? `${CONFIG.sprites.localBase}${dex}.png`
    : `${CONFIG.sprites.remoteBase}${shiny ? 'shiny/' : ''}${dex}.png`;
}

/**
 * URL do sprite ANIMADO (GIF da Gen V) para a interface.
 * O canvas não anima GIF, então isso só é usado em <img> do HTML.
 * Existe para os Pokémon até a Gen V; acima disso cai no estático.
 */
export function animatedUrl(dex, shiny = false) {
  if (!CONFIG.sprites.useAnimatedUI || CONFIG.sprites.useLocal || dex > 649) return spriteUrl(dex, shiny);
  return `${CONFIG.sprites.animatedBase}${shiny ? 'shiny/' : ''}${dex}.gif`;
}

/** Arte oficial em alta resolução (telas grandes, como a escolha do inicial). */
export function artworkUrl(dex) {
  if (CONFIG.sprites.useLocal) return spriteUrl(dex);
  return `${CONFIG.sprites.artworkBase}${dex}.png`;
}

/** Insígnia de ginásio de Kanto (1 = Pedra, 2 = Cascata, ...). */
export function badgeUrl(index) {
  return `${CONFIG.sprites.badgeBase}${index}.png`;
}

/** Ícone de item oficial (poke-ball, potion, revive...). */
export function itemUrl(name) {
  return `${CONFIG.sprites.itemBase}${name}.png`;
}

/**
 * <img> pronta para a interface: tenta o animado e cai no estático
 * automaticamente se o arquivo não existir ou o jogador estiver offline.
 */
export function pokemonImg(dex, { animated = true, className = '', alt = '', shiny = false } = {}) {
  const img = document.createElement('img');
  img.alt = alt;
  if (className) img.className = className;
  img.loading = 'lazy';
  img.dataset.fallback = spriteUrl(dex, shiny);
  img.src = animated ? animatedUrl(dex, shiny) : spriteUrl(dex, shiny);
  img.onerror = () => {
    if (img.src !== img.dataset.fallback) img.src = img.dataset.fallback;
    else img.style.visibility = 'hidden';
  };
  return img;
}

/** Pré-carrega uma lista de números da Pokédex. */
export function preload(dexNumbers) {
  for (const dex of dexNumbers) if (dex && !cache.has(dex)) load(dex);
}

/**
 * Desenha um Pokémon no canvas.
 * opts: { facing, types, size, flash, alpha, shadow }
 */
export function drawPokemon(ctx, dex, x, y, size, opts = {}) {
  const { facing = 1, types = ['normal'], flash = 0, alpha = 1, shadow = true, time = 0, shiny = false, fieldScale = 1 } = opts;
  const feet = y + size * 0.42;
  // os sprites olham para a esquerda: olhar para a direita é espelhar
  const flipX = facing > 0;

  ctx.save();
  ctx.globalAlpha = alpha;

  if (shadow) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(x, feet, size * 0.35, size * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  let centerY = y;
  // shiny: a tira com as cores raras; enquanto ela carrega, a normal
  const anim = (shiny && getSheet(`pokemon/shiny/${dex}`)) || getSheet(`pokemon/${dex}`);
  if (anim) {
    // o GIF da Gen 5 animado; a altura acompanha o tamanho do Pokémon, presa entre
    // limites para o Onix não cobrir a tela e o Caterpie não sumir na horda
    const { frameHeight, frames, fps = 12 } = anim.def;
    // `fieldScale` (data/pokemon.js): quem tem a animação num quadro enorme (as asas
    // abertas do Articuno e do Moltres) ficava miúdo no teto; ele sobe o teto só dele
    const height = Math.min(size * ANIM_MAX_HEIGHT * fieldScale,
                            Math.max(size * ANIM_MIN_HEIGHT, frameHeight * ANIM_SCALE));
    const frame = Math.floor(time * fps) % frames;
    drawFrame(ctx, anim, frame, x, feet + 2, { scale: height / frameHeight, flipX });
    centerY = feet - height / 2;
  } else {
    const img = getSprite(dex);
    if (img) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(flipX ? -1 : 1, 1);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.restore();
    } else {
      drawProceduralPokemon(ctx, x, y, size, typeColor(types[0]), facing);
    }
  }

  if (shiny) drawShinySparkles(ctx, x, centerY, size, time);

  // flash branco ao levar dano
  if (flash > 0) {
    ctx.globalAlpha = Math.min(0.85, flash * 8) * alpha;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, centerY, size * 0.34, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/** Desenho de emergência: uma criaturinha simples na cor do tipo. */
function drawProceduralPokemon(ctx, x, y, size, color, facing) {
  const r = size * 0.32;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // orelhinhas
  ctx.beginPath();
  ctx.moveTo(x - r * 0.75, y - r * 0.55);
  ctx.lineTo(x - r * 0.25, y - r * 1.45);
  ctx.lineTo(x + r * 0.05, y - r * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + r * 0.75, y - r * 0.55);
  ctx.lineTo(x + r * 0.25, y - r * 1.45);
  ctx.lineTo(x - r * 0.05, y - r * 0.7);
  ctx.closePath();
  ctx.fill();

  // olhos
  ctx.fillStyle = '#10162a';
  const eye = r * 0.16;
  ctx.beginPath();
  ctx.arc(x + facing * r * 0.28, y - r * 0.12, eye, 0, Math.PI * 2);
  ctx.arc(x - facing * r * 0.18, y - r * 0.12, eye, 0, Math.PI * 2);
  ctx.fill();
}

/** Poké Ball desenhada (usada no item do chão e em ícones). */
export function drawPokeball(ctx, x, y, size, angle = 0) {
  const r = size / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#ee3f3f';
  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#f6f6f6';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI);
  ctx.fill();
  ctx.strokeStyle = '#1b1b1b';
  ctx.lineWidth = Math.max(1.5, r * 0.18);
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.lineTo(r, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
  ctx.fillStyle = '#f6f6f6';
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * O brilho do shiny: de tempos em tempos, três estrelinhas piscam em volta do
 * Pokémon, como quando ele aparece no jogo.
 */
function drawShinySparkles(ctx, x, y, size, time) {
  const phase = time % 2.6;
  if (phase > 0.6) return;
  const k = Math.sin((phase / 0.6) * Math.PI);
  ctx.save();
  ctx.globalAlpha = k;
  ctx.fillStyle = '#fff6b0';
  for (const [dx, dy, s] of [[-0.42, -0.38, 1], [0.38, -0.18, 0.8], [0.05, 0.36, 0.7]]) {
    const r = size * 0.12 * s * k;
    const cx = x + dx * size;
    const cy = y + dy * size;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r * 0.25, cy - r * 0.25);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx + r * 0.25, cy + r * 0.25);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r * 0.25, cy + r * 0.25);
    ctx.lineTo(cx - r, cy);
    ctx.lineTo(cx - r * 0.25, cy - r * 0.25);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
