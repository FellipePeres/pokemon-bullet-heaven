import { CONFIG } from '../core/config.js';
import { normalizeProfile } from './profile.js';

const SIGNATURE = 'pokemon-bullet-heaven';
/**
 * 2: a história (0.39). O jogo recomeçou do zero com ela (decisão 17 do PLANEJAMENTO-HISTORIA:
 * "o jogo vai ser resetado quando tudo for pro ar"): os saves de antes (o schema 1, até a 0.37)
 * não carregam. O autosave antigo não some: fica guardado em BACKUP_KEY, neste navegador.
 */
const SCHEMA_VERSION = 2;
export const STORY_SCHEMA = 2;
export const BACKUP_KEY = 'pbh.autosave.antes-da-historia';

/** O save é de antes da história (o reset da 0.39)? */
export function isBeforeStory(data) {
  return (data?.schemaVersion ?? 1) < STORY_SCHEMA;
}

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
    if (isBeforeStory(data)) {
      throw new Error(`Este save é de antes da história (v${data.gameVersion ?? '?'}). Com a história, o jogo recomeçou do zero: comece uma Nova jornada.`);
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

  /**
   * O autosave deste navegador. O de antes da história (o reset da 0.39) vai para BACKUP_KEY
   * (uma vez: o primeiro backup fica) e sai do lugar; volta `{ beforeStory, gameVersion }`
   * para a tela de título avisar.
   */
  static loadLocal() {
    if (!CONFIG.save.useLocalStorage) return null;
    try {
      const raw = localStorage.getItem(CONFIG.save.storageKey);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data?.signature === SIGNATURE && isBeforeStory(data)) {
        try {
          if (!localStorage.getItem(BACKUP_KEY)) localStorage.setItem(BACKUP_KEY, raw);
        } catch { /* sem espaço para o backup: o reset segue */ }
        localStorage.removeItem(CONFIG.save.storageKey);
        return { beforeStory: true, gameVersion: data.gameVersion ?? '?' };
      }
      return SaveManager.parse(data);
    } catch {
      return null;
    }
  }

  static clearLocal() {
    try { localStorage.removeItem(CONFIG.save.storageKey); } catch { /* ignore */ }
  }
}
