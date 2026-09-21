import { CONFIG } from '../core/config.js';
import { typeColor } from '../data/types.js';

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
export function spriteUrl(dex) {
  return CONFIG.sprites.useLocal
    ? `${CONFIG.sprites.localBase}${dex}.png`
    : `${CONFIG.sprites.remoteBase}${dex}.png`;
}

/**
 * URL do sprite ANIMADO (GIF da Gen V) para a interface.
 * O canvas não anima GIF, então isso só é usado em <img> do HTML.
 * Existe para os Pokémon até a Gen V; acima disso cai no estático.
 */
export function animatedUrl(dex) {
  if (!CONFIG.sprites.useAnimatedUI || CONFIG.sprites.useLocal || dex > 649) return spriteUrl(dex);
  return `${CONFIG.sprites.animatedBase}${dex}.gif`;
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
export function pokemonImg(dex, { animated = true, className = '', alt = '' } = {}) {
  const img = document.createElement('img');
  img.alt = alt;
  if (className) img.className = className;
  img.loading = 'lazy';
  img.dataset.fallback = spriteUrl(dex);
  img.src = animated ? animatedUrl(dex) : spriteUrl(dex);
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
  const { facing = 1, types = ['normal'], flash = 0, alpha = 1, shadow = true } = opts;
  const img = getSprite(dex);

  ctx.save();
  ctx.globalAlpha = alpha;

  if (shadow) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.42, size * 0.35, size * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (img) {
    ctx.translate(x, y);
    ctx.scale(facing >= 0 ? 1 : -1, 1);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
  } else {
    drawProceduralPokemon(ctx, x, y, size, typeColor(types[0]), facing);
  }

  // flash branco ao levar dano
  if (flash > 0) {
    ctx.globalAlpha = Math.min(0.85, flash * 8) * alpha;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(img ? 0 : x, img ? 0 : y, size * 0.34, 0, Math.PI * 2);
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
