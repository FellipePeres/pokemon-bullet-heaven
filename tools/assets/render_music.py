"""
MÚSICAS DO FIRERED — renderiza as músicas do jogo pelo motor de som do GBA.

Cópia do sintetizador do Pokemon All (`extracted/pokefirered/tools/
render_sound.py` de lá, o mesmo m4a do FireRed em Python): o motor é o
mesmo, e só a lista de músicas e os caminhos são deste projeto. O Pokemon All
é só leitura: este script lê o decomp de lá (os instrumentos, os samples e o
`midi.cfg`) e grava aqui.

As partituras das músicas que o Pokemon All não guardou vêm do decomp público
pret/pokefirered, no mesmo commit (c75f352), baixadas para uma pasta
temporária. Precisa de Python 3 com mido, numpy e soundfile.

Uso:
    python tools/assets/render_music.py
    python tools/assets/render_music.py --fonte "D:/fellipe/Dev/Pokemon All"
    python tools/assets/render_music.py mus_route1     # só essa

Saída:
    assets/music/<nome>.ogg      introdução + uma volta do loop
    src/data/musicTracks.js      onde cada loop começa e acaba

O tema do lobby (`lobby-theme.ogg`) não é do FireRed: é o do Pokemon All,
copiado como está.

---- O motor (o texto do Pokemon All) ----

Sintetiza os efeitos sonoros, os gritos e as musicas do FireRed a partir do decomp.

Rodar de dentro de `extracted/`:

    python pokefirered/tools/render_sound.py            # os efeitos e os gritos
    python pokefirered/tools/render_sound.py se_faint   # so os que comecam assim
    python pokefirered/tools/render_sound.py --music    # as musicas de MUSIC (DEC-009)

Os 255 efeitos (`sound/songs/midi/se_*.mid`) sao partituras: o jogo os toca
com os instrumentos do proprio motor de som, o m4a (MusicPlayer2000). Este
script e esse motor, em Python, quadro a quadro (59,7275 Hz), com as contas
do `m4a.c`, do `m4a_1.s` e das tabelas do `m4a_tables.c`:

- **o relogio**: a cada quadro `tempoC += bpm`; a cada 150, um clock (24 por
  batida). As notas duram os clocks exatos da partitura (`-E` no `midi.cfg`).
- **os instrumentos**: os `voicegroups` de `voice_groups.inc` — samples
  (DirectSound), as duas ondas quadradas, a onda programavel e o ruido do
  hardware, e as divisoes por tecla (`keysplit`, as baterias).
- **o sample** toca a `agbp/1024 * 2^((tecla-60)/12)` Hz, sem interpolacao,
  num mixer de 13.379 Hz e 8 bits, com o envelope ADSR do m4a (ataque soma,
  decaimento e soltura multiplicam por /256), ate 5 ao mesmo tempo, e o
  reverb do `midi.cfg`.
- **as ondas do hardware** tem um canal cada; nota nova toma o canal. O
  envelope anda de 1 em 1 a cada N quadros, com o passo extra a cada 15
  quadros do `CgbSound` (o hardware conta a 64 Hz). A frequencia e a do
  registrador (`MidiKeyToCgbFreq`), e o ruido, o da `gNoiseTable`.
- **o volume**: `vol * 2`, o pan dividindo em direita e esquerda
  (`TrkVolPitSet`), a velocidade da nota (`ChnVolSetAsm`); a altura: bend
  vezes o alcance mais a afinacao, em 1/256 de semitom, e o LFO em triangulo.

Os gritos (`direct_sound_samples/cries/*.wav`) passam pelo mesmo mixer de
13.379 Hz, na tecla 60 — sem mudar a altura.

Saida, fora do bundle (servida em `/sprites`, como os outros assets):

| Saida                                   | Origem                          |
|-----------------------------------------|---------------------------------|
| `assets/sound/se/<nome>.ogg`            | `sound/songs/midi/<nome>.mid`   |
| `assets/sound/cries/<numero>.ogg`       | `direct_sound_samples/cries/`, pelo numero nacional |
| `assets/sound/music/<nome>.ogg`         | `sound/songs/midi/<nome>.mid` das musicas de `MUSIC` |
| `src/app/audio/musicTracks.ts`          | os pontos do loop de cada musica |

Estereo a 44,1 kHz; o que o GBA gera a 13.379 Hz segue em degraus (cada
amostra repetida), que e como o hardware toca.

**As musicas** (DEC-009) repetem como no jogo: a partitura marca o loop (`[`
e `]`, que o mid2agb vira no GOTO de cada faixa), e o jogo volta ao comeco
dele sem calar o que ainda soa. O arquivo guarda a introducao e uma volta
do loop desenrolado — a segunda, que ja comeca com o que sobrou da
primeira —, e a tabela diz onde o loop comeca e acaba.
"""
import math
import pathlib
import re
import struct
import sys

import mido
import numpy as np
import soundfile as sf

def _fonte() -> pathlib.Path:
    # o motor lê os instrumentos ao carregar: o caminho do decomp sai já daqui
    if '--fonte' in sys.argv:
        return pathlib.Path(sys.argv[sys.argv.index('--fonte') + 1])
    return pathlib.Path(__file__).resolve().parents[2].parent / 'Pokemon All'


ROOT = _fonte() / 'extracted' / 'pokefirered'   # o decomp do Pokemon All (só leitura)
SOUND = ROOT / 'sound'
OUT = pathlib.Path('assets/music')   # trocado em main(): a pasta deste repositório

FRAME_HZ = 16777216 / 280896
DS_PER_FRAME = 224
#: 22,05 kHz (o Pokemon All usa 44,1): o mixer do GBA toca a 13.379 Hz, então não se
#: perde nada audível, e o arquivo cai pela metade — o jogo é servido pela internet.
OUT_RATE = 22050
MAX_DS_CHANNELS = 5
MASTER_VOLUME = 12
#: Um canal do hardware no volume 15 perto de metade de um sample no maximo (GBATEK: 4 x 15 x 8 = 480 de 1024).
CGB_LEVEL = 120 / 256
#: O que sobra de folga na mistura final.
GAIN = 0.85
#: A passagem na emenda do loop das musicas: 20 ms (DEC-009).
LOOP_BLEND = 882

# --- As tabelas do m4a (`m4a_tables.c`) -----------------------------------------------------------

SCALE_TABLE = [((14 - octave) << 4) | note for octave in range(15) for note in range(12)]
FREQ_TABLE = [2147483648, 2275179671, 2410468894, 2553802834, 2705659852, 2866546760,
              3037000500, 3217589947, 3408917802, 3611622603, 3826380858, 4053909305]
CGB_SCALE_TABLE = [(octave << 4) | note for octave in range(11) for note in range(12)]
CGB_FREQ_TABLE = [-2004, -1891, -1785, -1685, -1591, -1501, -1417, -1337, -1262, -1192, -1125, -1062]
NOISE_TABLE = [0xD7, 0xD6, 0xD5, 0xD4, 0xC7, 0xC6, 0xC5, 0xC4, 0xB7, 0xB6, 0xB5, 0xB4,
               0xA7, 0xA6, 0xA5, 0xA4, 0x97, 0x96, 0x95, 0x94, 0x87, 0x86, 0x85, 0x84,
               0x77, 0x76, 0x75, 0x74, 0x67, 0x66, 0x65, 0x64, 0x57, 0x56, 0x55, 0x54,
               0x47, 0x46, 0x45, 0x44, 0x37, 0x36, 0x35, 0x34, 0x27, 0x26, 0x25, 0x24,
               0x17, 0x16, 0x15, 0x14, 0x07, 0x06, 0x05, 0x04, 0x03, 0x02, 0x01, 0x00]


def lfsr_sequence(width7: bool) -> np.ndarray:
    """A saida do ruido do hardware, um periodo inteiro: o LFSR de 15 bits (ou de 7)."""
    state = 0x7F if width7 else 0x7FFF
    length = 127 if width7 else 32767
    out = np.empty(length)
    for i in range(length):
        bit = (state ^ (state >> 1)) & 1
        state >>= 1
        state |= bit << (6 if width7 else 14)
        out[i] = 0.5 if (state & 1) == 0 else -0.5
    return out


LFSR = {False: lfsr_sequence(False), True: lfsr_sequence(True)}


def midi_key_to_freq(freq: int, key: int, fine: int) -> float:
    """`MidiKeyToFreq`: a velocidade do sample, em amostras por segundo."""
    if key > 178:
        key, fine = 178, 255
    key = max(0, key)
    a = SCALE_TABLE[key]
    b = SCALE_TABLE[key + 1]
    v1 = FREQ_TABLE[a & 0xF] >> (a >> 4)
    v2 = FREQ_TABLE[b & 0xF] >> (b >> 4)
    step = v1 + (((v2 - v1) * (fine << 24)) >> 32)
    return (freq * step) / 2 ** 32


def midi_key_to_cgb(channel: int, key: int, fine: int) -> int:
    """`MidiKeyToCgbFreq`: o registrador de frequencia (ou o NR43 do ruido)."""
    if channel == 4:
        key = 0 if key <= 20 else min(key - 21, 59)
        return NOISE_TABLE[key]
    if key <= 35:
        fine, key = 0, 0
    else:
        key -= 36
        if key > 130:
            key, fine = 130, 255
    a = CGB_SCALE_TABLE[min(key, len(CGB_SCALE_TABLE) - 1)]
    b = CGB_SCALE_TABLE[min(key + 1, len(CGB_SCALE_TABLE) - 1)]
    v1 = CGB_FREQ_TABLE[a & 0xF] >> (a >> 4)
    v2 = CGB_FREQ_TABLE[b & 0xF] >> (b >> 4)
    return v1 + ((fine * (v2 - v1)) >> 8) + 2048


# --- Os dados do decomp ----------------------------------------------------------------------------


class Wave:
    def __init__(self, path: pathlib.Path):
        data = path.read_bytes()
        chunks = {}
        i = 12
        while i + 8 <= len(data):
            cid = data[i:i + 4].decode('latin1')
            size = struct.unpack_from('<I', data, i + 4)[0]
            chunks[cid] = data[i + 8:i + 8 + size]
            i += 8 + size + (size & 1)
        self.rate = struct.unpack_from('<I', chunks['fmt '], 4)[0]
        self.samples = np.frombuffer(chunks['data'], dtype=np.uint8).astype(np.int16) - 128
        self.freq = struct.unpack('<I', chunks['agbp'])[0] if 'agbp' in chunks else self.rate * 1024
        self.loop_start = None
        smpl = chunks.get('smpl')
        if smpl and struct.unpack_from('<I', smpl, 28)[0] > 0:
            self.loop_start = struct.unpack_from('<I', smpl, 44)[0]
        end = struct.unpack('<I', chunks['agbl'])[0] if 'agbl' in chunks else len(self.samples)
        self.size = min(len(self.samples), end + 1 if self.loop_start is not None else end)
        if self.size <= 0:
            self.size = len(self.samples)


def parse_voicegroups() -> dict:
    groups: dict[str, list] = {}
    current = None
    for line in (SOUND / 'voice_groups.inc').read_text().splitlines():
        label = re.match(r'^(voicegroup\w+)::', line)
        if label:
            current = label.group(1)
            groups[current] = []
            continue
        voice = re.match(r'^\s+(voice_\w+)\s+(.*)$', line)
        if voice and current:
            args = [a.strip() for a in voice.group(2).split(',')]
            groups[current].append((voice.group(1), args))
    return groups


def parse_samples() -> dict:
    names = {}
    text = (SOUND / 'direct_sound_data.inc').read_text()
    # O rotulo pode ter comentario depois (o da tuba: "@N.B.: These tuba samples are actually sampled...").
    for label, path in re.findall(r'(DirectSoundWaveData_\w+)::[^\n]*\n\s*\.incbin "([^"]+)"', text):
        names[label] = pathlib.Path(path).with_suffix('.wav').name
    return names


def parse_keysplits() -> dict:
    tables = {}
    current = None
    key = 0
    for line in (SOUND / 'keysplit_tables.inc').read_text().splitlines():
        head = re.match(r'^\.set (KeySplitTable\w+), \. - (\d+)', line)
        if head:
            current = head.group(1)
            tables[current] = {}
            key = int(head.group(2))
            continue
        entry = re.match(r'^\s+\.byte (\d+)', line)
        if entry and current:
            tables[current][key] = int(entry.group(1))
            key += 1
    return tables


def parse_programmable_waves() -> dict:
    waves = {}
    text = (SOUND / 'programmable_wave_data.inc').read_text()
    for label, path in re.findall(r'(ProgrammableWaveData_\w+)::\s*\n\s*\.incbin "([^"]+)"', text):
        raw = (ROOT / path).read_bytes()
        nibbles = []
        for byte in raw:
            nibbles += [byte >> 4, byte & 0xF]
        waves[label] = (np.array(nibbles, dtype=np.float64) - 7.5) / 7.5
    return waves


def parse_midi_cfg() -> dict:
    cfg = {}
    for line in (SOUND / 'songs' / 'midi' / 'midi.cfg').read_text().splitlines():
        match = re.match(r'^(\S+)\.mid:\s*(.*)$', line)
        if not match:
            continue
        flags = {}
        for flag in match.group(2).split():
            if len(flag) > 2 and flag[0] == '-':
                flags[flag[1]] = flag[2:]
        cfg[match.group(1)] = flags
    return cfg


VOICEGROUPS = parse_voicegroups()
SAMPLE_FILES = parse_samples()
KEYSPLITS = parse_keysplits()
PROG_WAVES = parse_programmable_waves()
WAVE_CACHE: dict[str, Wave] = {}


def wave(label: str) -> Wave:
    if label not in WAVE_CACHE:
        WAVE_CACHE[label] = Wave(SOUND / 'direct_sound_samples' / SAMPLE_FILES[label])
    return WAVE_CACHE[label]


def resolve(group: str, program: int, key: int):
    """O instrumento da nota: o do programa, ou o da divisao por tecla. Na bateria, a tecla e a do instrumento."""
    voices = VOICEGROUPS[group]
    if program >= len(voices) or voices[program] is None:
        return None, key
    kind, args = voices[program]
    if kind == 'voice_keysplit':
        sub = VOICEGROUPS[args[0]]
        index = KEYSPLITS[args[1]].get(key, 0)
        return (sub[index] if index < len(sub) else None), key
    if kind == 'voice_keysplit_all':
        sub = VOICEGROUPS[args[0]]
        if key >= len(sub) or sub[key] is None:   # (no Emerald, a bateria começa numa tecla)
            return None, key
        drum = sub[key]
        return drum, int(drum[1][0])
    return voices[program], key


# --- O motor ---------------------------------------------------------------------------------------


class Track:
    def __init__(self):
        self.program = 0
        self.vol = 100
        self.pan = 0
        self.bend = 0
        self.bend_range = 2
        self.tune = 0
        self.mod = 0
        self.mod_type = 0
        self.lfo_speed = 22
        self.lfo_delay = 0
        self.lfo_delay_counter = 0
        self.lfo_counter = 0
        self.mod_m = 0
        self.key_m = 0
        self.pit_m = 0
        self.vol_mr = 0
        self.vol_ml = 0
        self.refresh()

    def refresh(self):
        x = (self.vol * 64) >> 5
        if self.mod_type == 1:
            x = (x * (self.mod_m + 128)) >> 7
        y = 2 * self.pan
        if self.mod_type == 2:
            y += self.mod_m
        y = max(-128, min(127, y))
        self.vol_mr = ((y + 128) * x) >> 8
        self.vol_ml = ((127 - y) * x) >> 8
        pitch = (self.tune + self.bend * self.bend_range) * 4
        if self.mod_type == 0:
            pitch += 16 * self.mod_m
        self.key_m = pitch >> 8
        self.pit_m = pitch & 0xFF

    def lfo_tick(self):
        if self.lfo_speed == 0 or self.mod == 0:
            return
        if self.lfo_delay_counter > 0:
            self.lfo_delay_counter -= 1
            return
        self.lfo_counter = (self.lfo_counter + self.lfo_speed) & 0xFF
        c = self.lfo_counter
        r = c if ((c - 64) & 0x80) else 128 - c
        r = r - 256 if r > 127 else r
        self.mod_m = (self.mod * r) >> 6
        self.refresh()


class Channel:
    """Um canal tocando uma nota: sample ou onda do hardware."""

    def __init__(self, track: Track, voice, key: int, velocity: int, gate: int, rhythm_pan: int, order: int):
        self.track = track
        self.kind, self.args = voice
        self.key = key
        self.velocity = velocity
        self.gate = gate
        self.rhythm_pan = rhythm_pan
        self.order = order
        self.stopping = False
        self.done = False
        self.started = True
        a = self.args
        if self.kind.startswith('voice_directsound'):
            self.cgb = 0
            self.wave = wave(a[2])
            self.fixed = self.kind == 'voice_directsound_no_resample'
            self.reverse = self.kind == 'voice_directsound_alt'
            self.attack, self.decay, self.sustain, self.release = (int(v) for v in a[3:7])
            self.env = 0
            self.phase = 'attack'
            self.pos = float(self.wave.size - 1) if self.reverse else 0.0
        else:
            self.cgb = {'square_1': 1, 'square_2': 2, 'programmable_wave': 3, 'noise': 4}[
                self.kind.replace('voice_', '').replace('_alt', '')]
            if self.cgb == 1:
                self.sweep, self.duty = int(a[2]), int(a[3]) & 3
                env = a[4:8]
            elif self.cgb == 2:
                self.sweep, self.duty = 0, int(a[2]) & 3
                env = a[3:7]
            elif self.cgb == 3:
                self.wave_table = PROG_WAVES[a[2]]
                env = a[3:7]
            else:
                self.width7 = int(a[2]) & 1
                env = a[3:7]
            self.attack, self.decay, self.sustain, self.release = (int(v) for v in env)
            self.env = 0
            self.phase = 'start'
            self.counter = 0
            self.phase_acc = 0.0
            self.freq_reg = None
            self.sweep_timer = 0.0
            self.lfsr_pos = 0.0

    def volumes(self):
        """`ChnVolSetAsm`: direita e esquerda, 0-255."""
        right = min(255, (self.velocity * (128 + self.rhythm_pan) * self.track.vol_mr) >> 14)
        left = min(255, (self.velocity * (127 - self.rhythm_pan) * self.track.vol_ml) >> 14)
        return right, left

    # --- O envelope do sample (`SoundMainRAM`) --------------------------------------------

    def ds_envelope(self):
        if self.started:
            self.started = False
            # START com STOP no mesmo quadro desliga o canal (`SoundMainRAM`), como no hardware.
            if self.stopping:
                self.phase = 'off'
                self.done = True
                return
            self.env = 0
            self.phase = 'attack'
        elif self.stopping and self.phase not in ('release', 'off'):
            self.phase = 'release'
        if self.phase == 'attack':
            self.env += self.attack
            if self.env >= 255:
                self.env = 255
                self.phase = 'decay'
        elif self.phase == 'decay':
            self.env = (self.env * self.decay) >> 8
            if self.env <= self.sustain:
                self.env = self.sustain
                self.phase = 'sustain' if self.sustain else 'off'
        elif self.phase == 'release':
            self.env = (self.env * self.release) >> 8
            if self.env <= 0:
                self.phase = 'off'
        if self.phase == 'off':
            self.done = True

    # --- O envelope do hardware (`CgbSound`) ---------------------------------------------

    def cgb_goal(self):
        right, left = self.volumes()
        goal = min(15, (right + left) // 16)
        # `CgbPan`: um lado com o dobro do outro vira so aquele lado.
        if left >= right * 2 and left > 0:
            self.pan_mask = (1.0, 0.0)
        elif right >= left * 2 and right > 0:
            self.pan_mask = (0.0, 1.0)
        else:
            self.pan_mask = (1.0, 1.0)
        return goal, (goal * self.sustain + 15) >> 4

    def cgb_envelope(self, extra_step: bool):
        goal, sustain_goal = self.cgb_goal()
        if self.phase == 'start':
            # START com STOP no mesmo quadro desliga o oscilador (`CgbSound`).
            if self.stopping:
                self.phase = 'off'
                self.done = True
                return
            self.counter = self.attack
            if self.attack:
                self.env = 0
                self.phase = 'attack'
            else:
                self._decay_start(goal, sustain_goal)
            self.counter -= 1
            return
        if self.stopping and self.phase not in ('release', 'off'):
            self.phase = 'release'
            self.counter = self.release
            if not self.release:
                self.phase = 'off'
                self.done = True
                return
            self.counter -= 1
            return
        for _ in range(2 if extra_step else 1):
            if self.counter <= 0:
                if self.phase == 'release':
                    self.env -= 1
                    if self.env <= 0:
                        self.phase = 'off'
                        self.done = True
                        return
                    self.counter = self.release
                elif self.phase == 'sustain':
                    self.env = sustain_goal
                    self.counter = 7
                elif self.phase == 'decay':
                    self.env -= 1
                    if self.env <= sustain_goal:
                        self._sustain_start(sustain_goal)
                        if self.done:
                            return
                    else:
                        self.counter = self.decay
                else:
                    self.env += 1
                    if self.env >= goal:
                        self._decay_start(goal, sustain_goal)
                        if self.done:
                            return
                    else:
                        self.counter = self.attack
            self.counter -= 1

    def _decay_start(self, goal, sustain_goal):
        self.phase = 'decay'
        self.counter = self.decay
        if self.decay:
            self.env = goal
        else:
            self._sustain_start(sustain_goal)

    def _sustain_start(self, sustain_goal):
        if self.sustain == 0:
            self.phase = 'off'
            self.done = True
        else:
            self.phase = 'sustain'
            self.env = sustain_goal
            self.counter = 7

    # --- O som de um quadro --------------------------------------------------------------

    def render_ds(self, count: int):
        """`count` amostras a 13.379 Hz, em -128..127 vezes o volume, direita e esquerda."""
        key = self.key + self.track.key_m
        rate = 13379.0 if self.fixed else midi_key_to_freq(self.wave.freq, key, self.track.pit_m)
        step = rate / 13379.0
        size = self.wave.size
        offsets = np.arange(count) * step
        if self.reverse:
            positions = self.pos - offsets
            alive = positions >= 0
            index = np.clip(positions, 0, size - 1).astype(np.int64)
            self.pos -= count * step
            if self.pos < 0:
                self.done = True
        else:
            positions = self.pos + offsets
            if self.wave.loop_start is not None and size > self.wave.loop_start:
                loop = size - self.wave.loop_start
                over = positions >= size
                positions = np.where(over, self.wave.loop_start + np.mod(positions - size, loop), positions)
                alive = np.ones(count, dtype=bool)
                self.pos += count * step
                if self.pos >= size:
                    self.pos = self.wave.loop_start + math.fmod(self.pos - size, loop)
            else:
                alive = positions < size
                self.pos += count * step
                if self.pos >= size:
                    self.done = True
            index = np.clip(positions, 0, size - 1).astype(np.int64)
        samples = self.wave.samples[index] * alive
        right, left = self.volumes()
        env_right = (self.env * right) >> 8
        env_left = (self.env * left) >> 8
        return (samples * env_right) >> 8, (samples * env_left) >> 8

    def render_cgb(self, count: int):
        """`count` amostras a 44,1 kHz, em -1..1 vezes o nivel, direita e esquerda."""
        key = self.key + self.track.key_m
        reg = midi_key_to_cgb(self.cgb, key, self.track.pit_m)
        level = (self.env / 15.0) * CGB_LEVEL
        if self.cgb in (1, 2):
            if self.freq_reg is None or self.sweep == 0:
                self.freq_reg = reg
            out = np.empty(count)
            duty = (0.125, 0.25, 0.5, 0.75)[self.duty]
            for start in range(0, count, 64):
                n = min(64, count - start)
                if self.cgb == 1 and self.sweep:
                    self._sweep(n)
                if self.freq_reg >= 2048:
                    out[start:start + n] = 0
                    continue
                freq = 131072.0 / (2048 - self.freq_reg)
                phases = (self.phase_acc + np.arange(1, n + 1) * freq / OUT_RATE) % 1.0
                self.phase_acc = phases[-1]
                out[start:start + n] = np.where(phases < duty, 1.0 - duty, -duty)
        elif self.cgb == 3:
            freq = 65536.0 / max(1, 2048 - reg)
            phases = (self.phase_acc + np.arange(1, count + 1) * freq / OUT_RATE) % 1.0
            self.phase_acc = phases[-1]
            out = self.wave_table[(phases * 32).astype(np.int64) % 32]
        else:
            shift, ratio = reg >> 4, reg & 7
            clock = 524288.0 / (0.5 if ratio == 0 else ratio) / (2 ** (shift + 1))
            sequence = LFSR[bool(self.width7)]
            positions = self.lfsr_pos + np.arange(1, count + 1) * clock / OUT_RATE
            self.lfsr_pos = positions[-1] % len(sequence)
            out = sequence[positions.astype(np.int64) % len(sequence)]
        return out * level * self.pan_mask[1], out * level * self.pan_mask[0]

    def _sweep(self, count: int) -> None:
        """O sweep da quadrada 1 (NR10): a cada `tempo/128` s, a frequencia soma (ou tira) `freq >> shift`."""
        period = (self.sweep >> 4) & 7
        shift = self.sweep & 7
        if not period or not shift:
            return
        self.sweep_timer += count / OUT_RATE
        while self.sweep_timer >= period / 128.0:
            self.sweep_timer -= period / 128.0
            delta = self.freq_reg >> shift
            self.freq_reg = self.freq_reg - delta if self.sweep & 8 else self.freq_reg + delta


class Song:
    def __init__(self, path: pathlib.Path, flags: dict):
        self.group = f"voicegroup{int(flags.get('G', '0')):03d}"
        if self.group not in VOICEGROUPS:
            self.group = f"voicegroup{int(flags.get('G', '0'))}"
        self.master = int(flags.get('V', '127'))
        self.reverb = int(flags.get('R', '0'))
        midi = mido.MidiFile(str(path))
        tpb = midi.ticks_per_beat
        self.tempo = 120
        events: dict[int, list] = {}
        tempo_events = []
        #: As marcas do loop da musica (`[` e `]`, que o mid2agb vira no GOTO de cada faixa).
        marks: dict[str, int] = {}
        for track in midi.tracks:
            tick = 0
            for msg in track:
                tick += msg.time
                clock = round(tick * 24 / tpb)
                if msg.type == 'set_tempo':
                    tempo_events.append((clock, round(mido.tempo2bpm(msg.tempo))))
                elif msg.type == 'marker' and msg.text in ('[', ']'):
                    marks.setdefault(msg.text, clock)
                elif hasattr(msg, 'channel'):
                    events.setdefault(msg.channel, []).append((clock, msg))
        self.tempo_events = sorted(tempo_events)
        self.loop = (marks['['], marks[']']) if '[' in marks and ']' in marks else None
        self.tracks = {}
        for channel, items in events.items():
            items.sort(key=lambda item: (item[0], 0 if item[1].type != 'note_on' else 1))
            self.tracks[channel] = self._with_gates(items)

    @staticmethod
    def _with_gates(items):
        """As notas com a duracao em clocks (a nota que desliga, com `-E`, e exata)."""
        out = []
        open_notes = {}
        for index, (clock, msg) in enumerate(items):
            if msg.type == 'note_on' and msg.velocity > 0:
                entry = [clock, 'note', msg.note, msg.velocity, None]
                open_notes.setdefault(msg.note, []).append(entry)
                out.append(entry)
            elif msg.type in ('note_off', 'note_on'):
                stack = open_notes.get(msg.note)
                if stack:
                    entry = stack.pop(0)
                    entry[4] = max(1, clock - entry[0])
            else:
                out.append([clock, 'msg', msg])
        for entry in out:
            if entry[1] == 'note' and entry[4] is None:
                entry[4] = 1
        return out

    def render(self) -> np.ndarray:
        """O efeito inteiro, ate calar, sem o silencio do fim."""
        mix, _ = self._run()
        return trim(mix * GAIN)

    def render_loop(self) -> tuple[np.ndarray, int, int]:
        """
        A musica com o loop do jogo (DEC-009): a introducao, e uma volta do
        loop como ela soa repetida. Devolve o audio e o comeco e o fim do
        loop, em amostras.

        O jogo, no fim do loop (`]`), volta ao comeco dele (`[`) no mesmo
        clock, com as notas que ainda soam e o reverb seguindo. Para a volta
        que se repete soar igual, o loop e desenrolado e a segunda volta e a
        que fica: ela ja comeca com o que sobrou da anterior.

        As voltas sao a mesma musica, mas nao a mesma amostra: o mixer de
        13.379 Hz cai em fase diferente nos 44,1 kHz a cada volta, e o loop
        nem sempre tem um numero inteiro de quadros (o de batalha alterna
        3251 e 3252). Recortar uma volta deixaria um degrau na emenda. Por
        isso os primeiros 20 ms do loop partem da continuacao de verdade do
        fim dele (o comeco da terceira volta) e passam para a propria volta;
        e os ultimos 20 ms da introducao passam para o fim do loop, que e o
        que o comeco do loop continua.
        """
        if not self.loop:
            raise ValueError('a musica nao tem as marcas do loop')
        start, end = self.loop
        length = end - start

        def unrolled(items):
            again = [[entry[0] + k * length, *entry[1:]] for k in (1, 2) for entry in items if start <= entry[0] < end]
            return [entry for entry in items if entry[0] < end] + again

        self.tracks = {channel: unrolled(items) for channel, items in self.tracks.items()}
        self.tempo_events = sorted(
            [event for event in self.tempo_events if event[0] < end]
            + [(clock + k * length, bpm) for k in (1, 2) for clock, bpm in self.tempo_events if start <= clock < end]
        )
        # Duas voltas inteiras e uma batida da terceira: o bastante para a emenda.
        mix, at = self._run(until=start + 2 * length + 24, marks=(start, start + length, start + 2 * length))
        intro = mix[:at[start]].copy()
        steady = mix[at[start + length]:at[start + 2 * length]].copy()
        blend = min(LOOP_BLEND, len(steady) // 2)
        rise = np.linspace(0.0, 1.0, blend)[:, None]
        after = mix[at[start + 2 * length]:at[start + 2 * length] + blend]
        steady[:blend] = after * (1 - rise) + steady[:blend] * rise
        if len(intro) >= blend:
            intro[-blend:] = intro[-blend:] * (1 - rise) + steady[-blend:] * rise
        audio = np.clip(np.concatenate([intro, steady]) * GAIN, -1, 1)
        return audio, len(intro), len(intro) + len(steady)

    def _run(self, until: int | None = None, marks: tuple[int, ...] = ()) -> tuple[np.ndarray, dict[int, int]]:
        """
        O motor quadro a quadro. Sem `until`, toca ate a partitura acabar e o
        som calar (no maximo 30 s); com `until`, para no quadro em que o clock
        chega nele. Devolve o audio e, para cada clock de `marks` (e o
        `until`), a amostra em que o quadro dele comeca.
        """
        at: dict[int, int] = {}
        produced = 0
        tracks = {channel: Track() for channel in self.tracks}
        cursors = {channel: 0 for channel in self.tracks}
        ds: list[Channel] = []
        cgb: dict[int, Channel] = {}
        order = 0
        tempo = self.tempo
        tempo_cursor = 0
        tempo_c = 0
        clock = 0
        c15 = 0
        prev_ds = np.zeros((DS_PER_FRAME, 2))
        ds_out = []
        cgb_out = []
        cgb_carry = 0.0
        last_clock = max((entry[0] + (entry[4] if entry[1] == 'note' else 0)
                          for items in self.tracks.values() for entry in items), default=0)
        frame = 0
        while True:
            tempo_c += tempo
            while tempo_c >= 150:
                tempo_c -= 150
                while tempo_cursor < len(self.tempo_events) and self.tempo_events[tempo_cursor][0] <= clock:
                    tempo = self.tempo_events[tempo_cursor][1]
                    tempo_cursor += 1
                # `MPlayMain`: primeiro a duracao das notas que ja tocam, depois as notas novas do clock.
                for chan in ds + list(cgb.values()):
                    if chan.gate > 0:
                        chan.gate -= 1
                        if chan.gate == 0:
                            chan.stopping = True
                if (clock in marks or clock == until) and clock not in at:
                    at[clock] = produced
                for channel, items in self.tracks.items():
                    track = tracks[channel]
                    while cursors[channel] < len(items) and items[cursors[channel]][0] <= clock:
                        entry = items[cursors[channel]]
                        cursors[channel] += 1
                        if entry[1] == 'note':
                            order += 1
                            self._note_on(track, entry, ds, cgb, order)
                        else:
                            self._message(track, entry[2])
                    track.lfo_tick()
                clock += 1
            # A musica desenrolada acaba no quadro em que o clock chega ao fim: o som dele ja e da volta seguinte.
            if until is not None and until in at:
                break
            # O quadro: envelopes e o som.
            c15 = 14 if c15 == 0 else c15 - 1
            for chan in ds:
                chan.ds_envelope()
            ds[:] = [chan for chan in ds if not chan.done]
            buffer = np.zeros((DS_PER_FRAME, 2))
            if self.reverb:
                mono = (prev_ds[:, 0] + prev_ds[:, 1]) * self.reverb / 512
                buffer += mono[:, None]
            for chan in ds:
                right, left = chan.render_ds(DS_PER_FRAME)
                buffer[:, 0] += left
                buffer[:, 1] += right
            ds[:] = [chan for chan in ds if not chan.done]
            buffer = np.clip(buffer * (MASTER_VOLUME + 1) / 16, -128, 127)
            prev_ds = buffer
            ds_out.append(buffer)
            cgb_carry += OUT_RATE / FRAME_HZ
            count = int(cgb_carry)
            cgb_carry -= count
            produced += count
            psg = np.zeros((count, 2))
            for number in list(cgb):
                chan = cgb[number]
                chan.cgb_envelope(c15 == 0)
                if chan.done:
                    del cgb[number]
                    continue
                right, left = chan.render_cgb(count)
                psg[:, 0] += left
                psg[:, 1] += right
            cgb_out.append(psg)
            frame += 1
            if until is not None:
                continue
            finished = all(cursors[c] >= len(items) for c, items in self.tracks.items())
            silent = not ds and not cgb and not np.any(np.abs(buffer) > 0.5)
            if (finished and clock > last_clock and silent) or frame > 60 * 30:
                break
        # O sample em degraus a 44,1 kHz (cada amostra de 13.379 Hz repetida), mais o hardware.
        ds_all = np.concatenate(ds_out) / 128.0
        index = np.minimum((np.arange(sum(len(p) for p in cgb_out)) * 13379.0 / OUT_RATE).astype(np.int64), len(ds_all) - 1)
        mix = ds_all[index] + np.concatenate(cgb_out)
        return mix, at

    def _note_on(self, track: Track, entry, ds: list, cgb: dict, order: int):
        _, _, key, velocity, gate = entry
        voice, played = resolve(self.group, track.program, key)
        if voice is None or not voice[0].startswith('voice_') or voice[0].startswith('voice_keysplit'):
            return
        # Na bateria, o pan do instrumento soma ao da faixa: `(pan_sweep - 0xC0) * 2`, com `pan_sweep = 0x80 | pan`.
        rhythm_pan = 0
        base = VOICEGROUPS[self.group][track.program][0] if track.program < len(VOICEGROUPS[self.group]) else ''
        pan = int(voice[1][1])
        if base == 'voice_keysplit_all' and pan:
            rhythm_pan = (pan - 64) * 2
        chan = Channel(track, voice, played, velocity, gate, max(-128, min(127, rhythm_pan)), order)
        if chan.cgb:
            cgb[chan.cgb] = chan
            return
        if len(ds) >= MAX_DS_CHANNELS:
            ds.remove(min(ds, key=lambda c: (not c.stopping, c.order)))
        ds.append(chan)

    def _message(self, track: Track, msg):
        if msg.type == 'program_change':
            track.program = msg.program
        elif msg.type == 'pitchwheel':
            track.bend = max(-64, min(63, (msg.pitch + 8192) // 128 - 64))
            track.refresh()
        elif msg.type == 'control_change':
            value = msg.value
            if msg.control == 7:
                track.vol = (value * self.master) // 127
            elif msg.control == 10:
                track.pan = value - 64
            elif msg.control == 1:
                track.mod = value
                if value == 0:
                    track.mod_m = 0
            elif msg.control == 20:
                track.bend_range = value
            elif msg.control == 21:
                track.lfo_speed = value
            elif msg.control == 22:
                track.mod_type = value
            elif msg.control == 24:
                track.tune = value - 64
            elif msg.control == 26:
                track.lfo_delay = value
                track.lfo_delay_counter = value
            track.refresh()


def trim(mix: np.ndarray) -> np.ndarray:
    """Tira o silencio do fim (e nada do comeco: o som toca na hora)."""
    loud = np.nonzero(np.max(np.abs(mix), axis=1) > 1e-3)[0]
    if len(loud) == 0:
        return mix[:1]
    end = min(len(mix), loud[-1] + int(OUT_RATE * 0.02))
    return np.clip(mix[:end], -1, 1)


def render_cry(path: pathlib.Path) -> np.ndarray:
    """O grito na tecla 60, pelo mixer de 13.379 Hz, sem envelope (`CRY_MODE_NORMAL`)."""
    source = Wave(path)
    step = (source.freq / 1024) / 13379.0
    count = int(source.size / step)
    positions = np.minimum((np.arange(count) * step).astype(np.int64), source.size - 1)
    ds = source.samples[positions].astype(np.float64) / 128.0
    index = np.minimum((np.arange(int(count * OUT_RATE / 13379.0)) * 13379.0 / OUT_RATE).astype(np.int64), count - 1)
    return np.clip(ds[index] * GAIN, -1, 1)


def write_ogg(path: pathlib.Path, audio: np.ndarray) -> None:
    """Grava em blocos: o Vorbis do libsndfile cai com um bloco grande de uma vez."""
    channels = 1 if audio.ndim == 1 else audio.shape[1]
    # compressão 0,6 do Vorbis: qualidade de sobra para o som de 8 bits do GBA
    with sf.SoundFile(str(path), 'w', OUT_RATE, channels, format='OGG', subtype='VORBIS', compression_level=0.6) as out:
        for start in range(0, len(audio), 32768):
            out.write(audio[start:start + 32768])




#: As músicas do jogo: a partitura do FireRed e onde ela toca aqui.
MUSIC = {
    'mus_route1': 'Fase 1, rumo a Pewter: a Rota 1',
    'mus_mt_moon': 'Fase 2, rumo a Cerulean: o Monte Lua',
    'mus_vermillion': 'Fase 3, rumo a Vermilion: a cidade',
    'mus_celadon': 'Fase 4, rumo a Celadon: a cidade',
    'mus_fuchsia': 'Fase 5, rumo a Fuchsia: a cidade',
    'mus_silph': 'Fase 6, rumo a Saffron: a Silph Co.',
    'mus_cinnabar': 'Fase 7, rumo a Cinnabar: a ilha',
    'mus_rocket_hideout': 'Fase 8, rumo a Viridian: o Esconderijo Rocket',
    'mus_victory_road': 'a Lorelei: a Victory Road',
    'mus_trainer_tower': 'o Bruno: a Trainer Tower',
    'mus_poke_tower': 'a Agatha: a Torre Pokémon',
    'mus_sevii_dungeon': 'o Lance: as cavernas das Sevii',
    'mus_encounter_rival': 'o Campeão: o tema do rival',
    'mus_vs_gym_leader': 'a luta contra o líder e a Elite Four',
    'mus_vs_champion': 'a luta contra o Campeão',
    'mus_victory_gym_leader': 'a vitória sobre o líder',
    'mus_hall_of_fame': 'o Hall da Fama',
    'mus_poke_center': 'o Centro Pokémon, depois de uma derrota',
    'mus_vs_legend': 'a luta contra o Kyogre, no salão da Caverna Marinha (0.37)',
    'mus_sevii_123': 'a vila e o mapa da jornada (0.37.7): o tema das Ilhas 1, 2 e 3, calmo',
    'mus_poke_mansion': 'a missão do Zapdos, no fundo da Usina (H-6): a música da Usina no FireRed',
    # a trilha das cenas (a lapidação da história): cada cena com a música do clima dela
    'mus_oak_lab': 'as cenas do laboratório do Carvalho: o tema do laboratório',
    'mus_gym': 'as cenas de depois dos líderes e da Elite dos Quatro, nos ginásios e nas salas',
    'mus_encounter_rocket': 'os vilões: o Giovanni e o Maxie (a Mansão e a lagoa)',
    'mus_rival_exit': 'o rival indo embora: o fim do laboratório e o Campeão vencido',
    'mus_lavender': 'os pássaros presos nas máquinas: a Usina, Seafoam e o Monte Brasa',
    'mus_encounter_deoxys': 'o Mew no laboratório: o encontro com o mítico',
    'mus_slow_pallet': 'os pássaros libertados, caídos e fugindo assustados',
    'mus_pallet': 'o fim da história de Kanto: o card de fim, depois do Maxie (o tema de casa; os créditos do FireRed não têm loop)',
}
#: As músicas do Emerald (0.37.6): a partitura e os instrumentos do decomp pret/pokeemerald
#: (o clone parcial em ../pokeemerald, com a pasta sound). O motor é o mesmo m4a.
EMERALD_MUSIC = {
    'mus_underwater': 'a descida do Dive, Níveis 1 a 3 (0.37.6): a música do mergulho do Emerald',
    'mus_abnormal_weather': 'a descida do Dive, Níveis 4 e 5 (0.37.7): a de quando o Kyogre desperta',
}
#: As vinhetas: tocam uma vez, sem loop (não entram em musicTracks.js).
JINGLES = {
    'mus_heal': 'a cura do Centro Pokémon',
    'mus_obtain_item': 'uma Poké Ball do chão ou um item recebido numa cena',
    'mus_obtain_key_item': 'um item importante da história (o Pedaço de Metal)',
    'mus_level_up': 'uma missão concluída',
}
#: Os efeitos sonoros do FireRed (a lapidação da história), em assets/sound/se: tocam uma vez
SOUND_EFFECTS = {
    'se_select': 'a caixa de texto: ao abrir e ao avançar (o "pi" do A no FireRed)',
    'se_door': 'entrar por uma porta da vila',
    'se_exit': 'sair pelo tapete, ou subir e descer uma escada',
}
DECOMP_COMMIT = 'c75f352304d529f6ba92d4f74b9cf8b5c3810788'
REPO = pathlib.Path(__file__).resolve().parents[2]


def midi_for(name: str, cache: pathlib.Path) -> pathlib.Path:
    """A partitura: a do Pokemon All, se ele tiver; senão a do decomp público, baixada uma vez."""
    local = SOUND / 'songs' / 'midi' / f'{name}.mid'
    if local.exists():
        return local
    target = cache / f'{name}.mid'
    if not target.exists():
        import urllib.request
        url = f'https://raw.githubusercontent.com/pret/pokefirered/{DECOMP_COMMIT}/sound/songs/midi/{name}.mid'
        cache.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(url, target)
    return target


def use_emerald(root: pathlib.Path) -> dict:
    """
    Troca o motor para os instrumentos do Emerald. Os arquivos são os mesmos do FireRed, com
    duas diferenças de formato: os grupos vêm em `voicegroups/*.inc` (incluídos pelo
    voice_groups.inc) com a macro `voice_group NOME[, deslocamento]`, e as divisões por
    tecla são `keysplit NOME, início` seguidas de `split índice, fim`. Devolve o midi.cfg.
    """
    global ROOT, SOUND, VOICEGROUPS, SAMPLE_FILES, KEYSPLITS, PROG_WAVES
    ROOT, SOUND = root, root / 'sound'
    groups, state = {}, {'current': None}

    def read(path: pathlib.Path) -> None:
        for line in path.read_text().splitlines():
            inc = re.match(r'^\s*\.include "([^"]+)"', line)
            if inc:
                read(root / inc.group(1))
                continue
            head = re.match(r'^\s*voice_group (\w+)(?:,\s*(\d+))?', line)
            if head:
                state['current'] = 'voicegroup_' + head.group(1)
                # o deslocamento: o grupo começa nessa tecla (as baterias)
                groups[state['current']] = [None] * int(head.group(2) or 0)
                continue
            voice = re.match(r'^\s+(voice_\w+)\s+(.*)$', line)
            if voice and state['current']:
                groups[state['current']].append((voice.group(1), [a.strip() for a in voice.group(2).split(',')]))

    read(SOUND / 'voice_groups.inc')
    tables, name, key = {}, None, 0
    for line in (SOUND / 'keysplit_tables.inc').read_text().splitlines():
        head = re.match(r'^keysplit (\w+), (\d+)', line)
        if head:
            name, key = 'keysplit_' + head.group(1), int(head.group(2))
            tables[name] = {}
            continue
        split = re.match(r'^\s+split (\d+), (\d+)', line)
        if split and name:
            for k in range(key, int(split.group(2)) + 1):
                tables[name][k] = int(split.group(1))
            key = int(split.group(2)) + 1
    VOICEGROUPS, KEYSPLITS = groups, tables
    SAMPLE_FILES = parse_samples()
    PROG_WAVES = parse_programmable_waves()
    WAVE_CACHE.clear()
    return parse_midi_cfg()


def render_emerald(name: str, cfg: dict) -> tuple:
    """Uma música do Emerald: o grupo vem pelo nome (`-G_underwater` é o voicegroup_underwater)."""
    flags = dict(cfg[name])
    group = 'voicegroup' + flags.pop('G')
    VOICEGROUPS.setdefault('voicegroup000', [])
    song = Song(SOUND / 'songs' / 'midi' / f'{name}.mid', {**flags, 'G': '0'})
    song.group = group
    return song.render_loop()


def main() -> None:
    global OUT
    import argparse
    import shutil
    import tempfile
    parser = argparse.ArgumentParser(description='Renderiza as músicas do FireRed para o jogo.')
    parser.add_argument('only', nargs='?', default='', help='só as músicas que começam assim')
    parser.add_argument('--fonte', type=pathlib.Path, default=REPO.parent / 'Pokemon All',
                        help='pasta do Pokemon All (padrão: ao lado deste repositório)')
    parser.add_argument('--emerald', type=pathlib.Path, default=REPO.parent / 'pokeemerald',
                        help='o decomp do Emerald, com a pasta sound (padrão: ao lado deste repositório)')
    args = parser.parse_args()
    OUT = REPO / 'assets' / 'music'
    OUT.mkdir(parents=True, exist_ok=True)
    cache = pathlib.Path(tempfile.gettempdir()) / 'pbh-fr-midi'

    lobby = args.fonte / 'src' / 'app' / 'assets' / 'lobby-theme.ogg'
    shutil.copyfile(lobby, OUT / 'lobby-theme.ogg')

    cfg = parse_midi_cfg()
    table = REPO / 'src' / 'data' / 'musicTracks.js'
    previous = {}
    if table.exists():
        for m in re.finditer(r"(mus_\w+): \{ loopStart: ([\d.]+), loopEnd: ([\d.]+) \}", table.read_text(encoding='utf-8')):
            previous[m.group(1)] = (float(m.group(2)), float(m.group(3)))
    rows = {}
    for name, where in MUSIC.items():
        if args.only and not name.startswith(args.only):
            if name in previous:
                rows[name] = (where, *previous[name])
            continue
        song = Song(midi_for(name, cache), cfg.get(name, {}))
        audio, loop_start, loop_end = song.render_loop()
        write_ogg(OUT / f'{name}.ogg', audio)
        rows[name] = (where, loop_start / OUT_RATE, loop_end / OUT_RATE)
        print(f'  music/{name}.ogg  {len(audio) / OUT_RATE:6.2f} s, loop de {loop_start / OUT_RATE:.3f} a {loop_end / OUT_RATE:.3f} s')
    for name in JINGLES:
        if args.only and not name.startswith(args.only):
            continue
        audio = Song(midi_for(name, cache), cfg.get(name, {})).render()
        write_ogg(OUT / f'{name}.ogg', audio)
        print(f'  music/{name}.ogg  {len(audio) / OUT_RATE:6.2f} s, vinheta')
    se_out = REPO / 'assets' / 'sound' / 'se'
    for name in SOUND_EFFECTS:
        if args.only and not name.startswith(args.only):
            continue
        se_out.mkdir(parents=True, exist_ok=True)
        audio = Song(midi_for(name, cache), cfg.get(name, {})).render()
        write_ogg(se_out / f'{name}.ogg', audio)
        print(f'  sound/se/{name}.ogg  {len(audio) / OUT_RATE:6.2f} s, efeito')

    # as do Emerald por último: o motor troca de instrumentos
    wanted = [n for n in EMERALD_MUSIC if not args.only or n.startswith(args.only)]
    for name in EMERALD_MUSIC:
        if name not in wanted and name in previous:
            rows[name] = (EMERALD_MUSIC[name], *previous[name])
    if wanted:
        em_cfg = use_emerald(args.emerald)
        for name in wanted:
            audio, loop_start, loop_end = render_emerald(name, em_cfg)
            write_ogg(OUT / f'{name}.ogg', audio)
            rows[name] = (EMERALD_MUSIC[name], loop_start / OUT_RATE, loop_end / OUT_RATE)
            print(f'  music/{name}.ogg  {len(audio) / OUT_RATE:6.2f} s, loop de {loop_start / OUT_RATE:.3f} a {loop_end / OUT_RATE:.3f} s (Emerald)')

    lines = [
        '/**',
        ' * MÚSICAS — gerado por tools/assets/render_music.py. Não edite à mão.',
        ' *',
        ' * As músicas do FireRed (e as do Emerald, 0.37.6) pelo motor de som deles: cada arquivo tem a introdução',
        ' * e uma volta do loop; o loop é o trecho de `loopStart` a `loopEnd`, em segundos.',
        ' */',
        'export const MUSIC_TRACKS = {',
    ]
    for name in {**MUSIC, **EMERALD_MUSIC}:
        if name not in rows:
            continue
        where, start, end = rows[name]
        lines.append(f'  /** {where[0].upper()}{where[1:]}. */')
        lines.append(f'  {name}: {{ loopStart: {start:.6f}, loopEnd: {end:.6f} }},')
    lines[-1] = lines[-1].rstrip(',')
    lines += ['};', '']
    table.write_text('\n'.join(lines), encoding='utf-8')
    print(f'  {table.relative_to(REPO).as_posix()}')


if __name__ == '__main__':
    main()
