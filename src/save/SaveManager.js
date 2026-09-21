import { CONFIG } from '../core/config.js';
import { normalizeProfile } from './profile.js';

const SIGNATURE = 'pokemon-bullet-heaven';
const SCHEMA_VERSION = 1;

/**
 * SAVE EM ARQUIVO
 *
 * Totalmente separado do gameplay: recebe um objeto de estado, devolve JSON.
 * Para salvar algo novo no futuro, basta incluir o campo no objeto — o
 * carregamento faz merge com os padrões, então saves antigos continuam válidos.
 */
export class SaveManager {
  /** Monta o objeto que vira o arquivo .json. */
  static build({ profile, run = null }) {
    return {
      signature: SIGNATURE,
      schemaVersion: SCHEMA_VERSION,
      gameVersion: CONFIG.version,
      savedAt: new Date().toISOString(),
      profile,
      run
    };
  }

  static toJSON(data) {
    return JSON.stringify(data, null, 2);
  }

  /** Dispara o download do arquivo no navegador. */
  static download(data, fileName = CONFIG.save.fileName) {
    const blob = new Blob([SaveManager.toJSON(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /** Lê um arquivo escolhido pelo jogador. Lança erro se não for um save válido. */
  static async readFile(file) {
    const text = await file.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Arquivo inválido: não é um JSON.');
    }
    return SaveManager.parse(data);
  }

  static parse(data) {
    if (!data || data.signature !== SIGNATURE) {
      throw new Error('Este arquivo não é um save do Pokémon Bullet Heaven.');
    }
    return {
      schemaVersion: data.schemaVersion ?? 1,
      gameVersion: data.gameVersion ?? '?',
      savedAt: data.savedAt ?? null,
      profile: normalizeProfile(data.profile),
      run: data.run ?? null
    };
  }

  /* ---------- autosave local (conveniência, não substitui o arquivo) ---------- */

  static saveLocal(data) {
    if (!CONFIG.save.useLocalStorage) return;
    try {
      localStorage.setItem(CONFIG.save.storageKey, SaveManager.toJSON(data));
    } catch {
      /* armazenamento indisponível — ignorar silenciosamente */
    }
  }

  static loadLocal() {
    if (!CONFIG.save.useLocalStorage) return null;
    try {
      const raw = localStorage.getItem(CONFIG.save.storageKey);
      return raw ? SaveManager.parse(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }

  static clearLocal() {
    try { localStorage.removeItem(CONFIG.save.storageKey); } catch { /* ignore */ }
  }
}
