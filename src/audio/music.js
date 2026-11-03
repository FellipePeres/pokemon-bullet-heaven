import { CONFIG } from '../core/config.js';
import { MUSIC_TRACKS } from '../data/musicTracks.js';

/**
 * MÚSICA — uma faixa por vez, em loop como no FireRed.
 *
 * As faixas (assets/music, de tools/assets/render_music.py) têm a introdução e
 * uma volta do loop; a Web Audio repete o trecho de `loopStart` a `loopEnd`
 * sem emenda, como o jogo faz. Trocar de faixa esmaece a velha e sobe a nova.
 *
 * O navegador só deixa tocar som depois de um clique ou de uma tecla: até lá a
 * faixa pedida fica guardada e começa no primeiro gesto do jogador. Fora do
 * navegador (testes), nada toca.
 */
const FADE = 0.6;

export class MusicPlayer {
  constructor() {
    this.supported = typeof window !== 'undefined' && typeof (window.AudioContext ?? window.webkitAudioContext) === 'function';
    this.ctx = null;
    this.master = null;
    this.current = null;     // { track, source, gain }
    this.wanted = null;      // a faixa que deveria estar tocando
    this.buffers = new Map();
    this.ducked = false;
    this.holding = false;    // uma vinheta tocando: a faixa pedida espera ela acabar
    if (this.supported) {
      const unlock = () => this._unlock();
      window.addEventListener('pointerdown', unlock);
      window.addEventListener('keydown', unlock);
    }
  }

  /** Volume da música (0 a 1), o do mixer em Opções. */
  get volume() { return CONFIG.audio.musicVolume; }

  setVolume(value) {
    CONFIG.audio.musicVolume = Math.max(0, Math.min(1, value));
    this._applyVolume();
  }

  /** Abaixa a música (pausa) ou volta ao normal. */
  duck(on) {
    if (this.ducked === on) return;
    this.ducked = on;
    this._applyVolume();
  }

  /** Pede uma faixa; a mesma que já toca não recomeça. null cala. */
  play(track) {
    if (track === this.wanted) return;
    this.wanted = track;
    if (this.ctx && !this.holding) this._switch(track);
  }

  /**
   * Toca uma vinheta uma vez (a cura do Centro Pokémon): a música que tocava
   * esmaece, a vinheta toca inteira e depois entra a faixa pedida.
   */
  async jingle(track) {
    if (!this.ctx) return;
    this.holding = true;
    this._switch(null);
    const buffer = await this._buffer(track);
    if (buffer) {
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.master);
      await new Promise((resolve) => { source.onended = resolve; source.start(); });
    }
    this.holding = false;
    if (this.wanted && !this.current) this._switch(this.wanted);
  }

  _unlock() {
    if (!this.ctx) {
      const Context = window.AudioContext ?? window.webkitAudioContext;
      this.ctx = new Context();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this._applyVolume();
      if (this.wanted) this._switch(this.wanted);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  _applyVolume() {
    if (!this.master) return;
    const target = this.volume * (this.ducked ? 0.45 : 1);
    this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
  }

  async _buffer(track) {
    if (!this.buffers.has(track)) {
      this.buffers.set(track, fetch(`assets/music/${track}.ogg`)
        .then((response) => response.arrayBuffer())
        .then((data) => this.ctx.decodeAudioData(data))
        .catch(() => null));
    }
    return this.buffers.get(track);
  }

  async _switch(track) {
    const old = this.current;
    this.current = null;
    if (old) {
      const now = this.ctx.currentTime;
      old.gain.gain.setValueAtTime(old.gain.gain.value, now);
      old.gain.gain.linearRampToValueAtTime(0, now + FADE);
      old.source.stop(now + FADE + 0.05);
    }
    if (!track) return;

    const buffer = await this._buffer(track);
    // enquanto carregava, outra faixa pode ter sido pedida
    if (!buffer || track !== this.wanted || this.current || this.holding) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const loop = MUSIC_TRACKS[track];
    source.loopStart = loop?.loopStart ?? 0;
    source.loopEnd = loop?.loopEnd ?? buffer.duration;

    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + FADE);
    source.connect(gain);
    gain.connect(this.master);
    source.start(now);
    this.current = { track, source, gain };
  }
}
