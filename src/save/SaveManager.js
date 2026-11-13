import { CONFIG } from '../core/config.js';
import { normalizeProfile } from './profile.js';

const SIGNATURE = 'pokemon-bullet-heaven';
/**
 * 2: a história (0.39, lançada como 1.0). O jogo recomeçou do zero com ela (decisão 17 do
 * PLANEJAMENTO-HISTORIA: "o jogo vai ser resetado quando tudo for pro ar"): os saves de antes
 * (o schema 1, até a 0.37) foram perdidos. O autosave antigo é apagado, e os backups de antes
 * (os arquivos .json exportados) não carregam mais (1.0.1: "backups antigos também não devem
 * funcionar mais").
 */
const SCHEMA_VERSION = 2;
export const STORY_SCHEMA = 2;
/** A cópia do autosave antigo que a 1.0.0 guardava neste navegador; desde a 1.0.1, apagada. */
export const LEGACY_BACKUP_KEY = 'pbh.autosave.antes-da-historia';

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
      throw new Error(`Este save é de antes da história (v${data.gameVersion ?? '?'}). Com a versão 1.0, o jogo recomeçou do zero, e os saves e backups de antes não funcionam mais: comece uma Nova jornada.`);
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
   * O autosave deste navegador. O de antes da história (o reset da 1.0) é apagado, sem cópia;
   * volta `{ beforeStory, gameVersion }` para a tela de título avisar. A cópia que a 1.0.0
   * chegou a guardar (LEGACY_BACKUP_KEY) também sai.
   */
  static loadLocal() {
    if (!CONFIG.save.useLocalStorage) return null;
    try { localStorage.removeItem(LEGACY_BACKUP_KEY); } catch { /* ignore */ }
    try {
      const raw = localStorage.getItem(CONFIG.save.storageKey);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data?.signature === SIGNATURE && isBeforeStory(data)) {
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
