import { CONFIG } from '../core/config.js';

/**
 * OS GRITOS (0.37): por enquanto só o do Kyogre (assets/sound/cries/382.ogg, do
 * Pokemon All), no encontro e na luta do salão. Toca por cima da música, no
 * volume dela. Fora do navegador (os testes), não toca nada.
 */
const cache = new Map();

export function playCry(dex) {
  if (typeof Audio === 'undefined') return;
  try {
    let audio = cache.get(dex);
    if (!audio) {
      audio = new Audio(`assets/sound/cries/${dex}.ogg`);
      cache.set(dex, audio);
    }
    audio.volume = Math.min(1, CONFIG.audio.musicVolume * 1.2);
    audio.currentTime = 0;
    audio.play()?.catch?.(() => {});
  } catch {
    /* sem som: segue sem o grito */
  }
}
