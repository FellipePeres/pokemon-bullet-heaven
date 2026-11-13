import { CONFIG } from '../core/config.js';

/**
 * OS EFEITOS SONOROS (a lapidação da história): por enquanto, os da caixa de texto.
 *
 * - **A caixa** (`textBox`): o `se_select` do FireRed (o "pi" do A), renderizado do decomp por
 *   tools/assets/render_music.py em assets/sound/se. Toca quando uma fala abre e quando o
 *   jogador avança ou fecha a caixa (no máximo uma vez a cada 120 ms: numa cena, uma fala fecha
 *   e a seguinte abre no mesmo quadro).
 * - **As letras** (`textTick`): o FireRed não tem som de digitação; este é um tique curtinho de
 *   onda quadrada, no timbre do GBA, gerado na hora, no máximo um a cada 55 ms.
 *
 * Usa o contexto de áudio da música (destravado no primeiro clique ou tecla) e o volume dela,
 * o do mixer das Opções. Sem áudio (os testes), não toca nada.
 */
export class SoundEffects {
  constructor(music) {
    this.music = music;
    this.buffers = new Map();
    this.lastBox = -1;
    this.lastTick = -1;
  }

  get ctx() {
    const ctx = this.music?.ctx ?? null;
    return ctx && ctx.state === 'running' ? ctx : null;
  }

  /** Toca o efeito `name` (assets/sound/se/<name>.ogg) uma vez. */
  play(name, gain = 1) {
    const ctx = this.ctx;
    if (!ctx) return;
    let buffer = this.buffers.get(name);
    if (!buffer) {
      buffer = fetch(`assets/sound/se/${name}.ogg`)
        .then((res) => res.arrayBuffer())
        .then((data) => ctx.decodeAudioData(data))
        .catch(() => null);
      this.buffers.set(name, buffer);
    }
    buffer.then((decoded) => {
      if (!decoded) return;
      const source = ctx.createBufferSource();
      source.buffer = decoded;
      const volume = ctx.createGain();
      volume.gain.value = CONFIG.audio.musicVolume * gain;
      source.connect(volume).connect(ctx.destination);
      source.start();
    });
  }

  /** A caixa de texto abriu, avançou ou fechou: o "pi" do FireRed. */
  textBox() {
    const ctx = this.ctx;
    if (!ctx || ctx.currentTime - this.lastBox < 0.12) return;
    this.lastBox = ctx.currentTime;
    this.play('se_select', 1.6);
  }

  /** Uma letra apareceu na caixa: o tique curtinho. */
  textTick() {
    const ctx = this.ctx;
    if (!ctx || ctx.currentTime - this.lastTick < 0.055) return;
    const now = ctx.currentTime;
    this.lastTick = now;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 1150 + Math.random() * 70;
    const volume = ctx.createGain();
    volume.gain.setValueAtTime(CONFIG.audio.musicVolume * 0.035, now);
    volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    osc.connect(volume).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.035);
  }
}

/**
 * Anda as letras de uma caixa de texto (`{ pages, index, shown }`) e toca o tique quando aparece
 * uma letra que não é espaço. A vila e o salão do Kyogre usam a mesma conta.
 */
export function typeDialog(dialog, dt, speed, sfx) {
  const page = dialog.pages[dialog.index] ?? '';
  if (dialog.shown >= page.length) return;
  const before = Math.floor(dialog.shown);
  dialog.shown = Math.min(page.length, dialog.shown + dt * speed);
  const after = Math.floor(dialog.shown);
  if (after > before && /\S/.test(page.slice(before, after))) sfx?.textTick();
}
