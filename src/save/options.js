import { CONFIG } from '../core/config.js';

/**
 * OPÇÕES — o que o jogador escolhe no menu Opções, guardado no navegador.
 * Não faz parte do save: são preferências deste navegador, não progresso.
 *
 * Cada opção aponta para o valor que ela muda em CONFIG.
 */
const KEY = 'pbh.options';

// Desde a 0.11 os Pokémon ativos são sempre 3 e os sprites ficam sempre
// ligados (pedido do Fellipe): essas opções saíram, e o que estiver guardado
// delas é ignorado.
const OPTIONS = {
  autosave: [CONFIG.save, 'useLocalStorage'],
  screenShake: [CONFIG.fx, 'screenShake'],
  musicVolume: [CONFIG.audio, 'musicVolume']
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
