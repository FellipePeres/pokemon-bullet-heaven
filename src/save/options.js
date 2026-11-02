import { CONFIG } from '../core/config.js';

/**
 * OPÇÕES — o que o jogador escolhe no menu Opções, guardado no navegador.
 * Não faz parte do save: são preferências deste navegador, não progresso.
 *
 * Cada opção aponta para o valor que ela muda em CONFIG.
 */
const KEY = 'pbh.options';

const OPTIONS = {
  activeSlots: [CONFIG.team, 'activeSlots'],
  animatedUI: [CONFIG.sprites, 'useAnimatedUI'],
  remoteSprites: [CONFIG.sprites, 'useRemote'],
  autosave: [CONFIG.save, 'useLocalStorage'],
  screenShake: [CONFIG.fx, 'screenShake']
};

/** Aplica em CONFIG as opções guardadas (as que existirem e tiverem o tipo certo). */
export function loadOptions() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    for (const [name, [target, field]] of Object.entries(OPTIONS)) {
      if (typeof saved[name] === typeof target[field]) target[field] = saved[name];
    }
  } catch {
    // navegador sem localStorage (ou dado corrompido): fica com o padrão
  }
}

/** Guarda as opções atuais. */
export function saveOptions() {
  try {
    const values = Object.fromEntries(
      Object.entries(OPTIONS).map(([name, [target, field]]) => [name, target[field]])
    );
    localStorage.setItem(KEY, JSON.stringify(values));
  } catch {
    // sem localStorage, as opções valem só até recarregar a página
  }
}
