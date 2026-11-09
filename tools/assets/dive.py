"""
OS ASSETS DO MODO AQUÁTICO (a descida do Dive, PLANEJAMENTO-DIVE.md)

Lê o decomp do Emerald (pret/pokeemerald, só leitura) e grava, dentro deste
repositório, o que a descida usa:

    assets/dive/r126.png, r127.png   as Rotas 126 e 127 submersas, recortadas na região usada
    assets/dive/cave.png             a entrada submersa da Caverna Marinha (Underwater_MarineCave)
    assets/dive/red.png, leaf.png    o Red e a Leaf submersos (3 quadros de 32x32: baixo, cima, lado)
    assets/pokemon/gen3/icons/<n>.png  os ícones de Hoenn das hordas (do Pokemon All, de 4x para 1x)
    src/data/diveWorld.js            o catálogo: o recorte de cada mapa, a GRADE DO QUE É NAVEGÁVEL,
                                     os tabuleiros 10x6, a saída e a entrada de cada mapa

  O salão do Kyogre (0.37, PLANEJAMENTO-DIVE seções 8 a 10):
    assets/dive/hall.png             o MarineCave_End (o encontro), com a colisão no catálogo
    assets/dive/kyogre_ow.png        o Kyogre do mapa (4 quadros de 32x32, paleta npc_4)
    assets/dive/fog.png              a névoa horizontal do Emerald (o tempo do salão)
    assets/dive/transition.png       a transição de batalha do Kyogre (B_TRANSITION_KYOGRE), 24 quadros de 240x160
    assets/scenes/marine_cave.png    as metatiles da arena da luta (o tileset cave); a arena fica no catálogo
    assets/dive/maxie.png            o Maxie (9 quadros de 16x32, paleta npc_2), para a cena
    assets/dive/exclam.png, bird.png o balão de "!" e o pássaro do Voar (field_effects)
    assets/dive/band_out.png, band_in.png  as listras do corte de tela do Voar (fora e dentro de casa)
    assets/dive/crobat.png           o Crobat do corte de tela (Gen 3, do Pokemon All)
    assets/pokemon/<dex>.png         os Pokémon animados de Hoenn e o Kyogre (GIFs da Gen 5 do Pokemon All)
    assets/pokemon/gen3/front/382.png, assets/items/dive-ball.png, assets/sound/cries/382.ogg

A regra do Fellipe: "os tiles jogáveis devem ser apenas os navegáveis no Emerald".
No map.bin, cada tile guarda a colisão (bits 10-11) e a elevação (bits 12-15); na
água submersa, onde se nada é colisão 0 e elevação 3. Só esses tiles entram na
grade, e o jogo só anda (e só faz o mergulhador nadar) por eles.

Uso (Python 3 + Pillow):
    python tools/assets/dive.py
    python tools/assets/dive.py --emerald D:/fellipe/Dev/pokeemerald --pokemon-all "D:/fellipe/Dev/Pokemon All"
"""
import argparse
import json
import struct
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
COLS, ROWS = 10, 6

# os tabuleiros (x, y do canto no mapa original): áreas 10x6 inteiramente navegáveis,
# procuradas em todos os mapas submersos (só as Rotas 124 a 127 têm áreas assim)
BOARDS = {'r126': [(49, 16), (44, 26), (36, 66), (46, 66)], 'r127': [(24, 52), (26, 58)]}
EXIT = {'r126': (64, 66), 'r127': (31, 72)}     # por onde ele sai do mapa (para o próximo, ou para a caverna)
ENTRY = {'r127': (28, 43)}                        # por onde ele entra na Rota 127
LAYOUT = {'r126': 'Underwater_Route126', 'r127': 'Underwater_Route127'}
MARGIN = 7                                        # tiles de mapa em volta do que é usado, para a câmera

# as espécies de Hoenn das hordas (as de Kanto já estão em assets/pokemon/gen3/icons) e o Kyogre
HOENN = [318, 319, 320, 321, 340, 341, 342, 350, 365, 366, 367, 368, 369, 382]


def read_pal(path):
    lines = Path(path).read_text().split('\n')[3:]
    return [tuple(int(v) for v in line.split()) for line in lines if line.strip()][:16]


class Tileset:
    """O tileset primário (general) com o secundário (underwater): metatiles 16x16 com as paletas certas."""

    def __init__(self, em):
        p = em / 'data/tilesets/primary/general'
        s = em / 'data/tilesets/secondary/underwater'
        # paletas 0-5 do primário, 6-12 do secundário (o Emerald tem 512 tiles e 512 metatiles no primário)
        self.pals = [read_pal(p / f'palettes/{i:02d}.pal') for i in range(6)] + \
                    [read_pal(s / f'palettes/{i:02d}.pal') for i in range(6, 13)]
        self.pals += [self.pals[0]] * 3
        self.tp, self.ts = Image.open(p / 'tiles.png'), Image.open(s / 'tiles.png')
        self.mp, self.ms = self._metatiles(p / 'metatiles.bin'), self._metatiles(s / 'metatiles.bin')
        self.cache = {}

    @staticmethod
    def _metatiles(path):
        d = Path(path).read_bytes()
        return [struct.unpack_from('<8H', d, i * 16) for i in range(len(d) // 16)]

    def _tile(self, e):
        if e in self.cache:
            return self.cache[e]
        idx, hf, vf, p = e & 0x3ff, e >> 10 & 1, e >> 11 & 1, e >> 12
        src, i = (self.tp, idx) if idx < 512 else (self.ts, idx - 512)
        w = src.size[0] // 8
        x0, y0 = (i % w) * 8, (i // w) * 8
        im = Image.new('RGBA', (8, 8), (0, 0, 0, 0))
        if y0 < src.size[1]:
            px = src.load()
            for y in range(8):
                for x in range(8):
                    c = px[x0 + x, y0 + y] & 15      # pelo ÍNDICE, nunca pela cor
                    if c:
                        im.putpixel((7 - x if hf else x, 7 - y if vf else y), self.pals[p][c] + (255,))
        self.cache[e] = im
        return im

    def metatile(self, m):
        ent = self.mp[m] if m < 512 else self.ms[m - 512]
        im = Image.new('RGBA', (16, 16), self.pals[0][0] + (255,))
        for layer in range(2):
            for k in range(4):
                im.alpha_composite(self._tile(ent[layer * 4 + k]), ((k % 2) * 8, (k // 2) * 8))
        return im


def layout_dims(em):
    layouts = json.loads((em / 'data/layouts/layouts.json').read_text())['layouts']
    return {l['name'].replace('_Layout', ''): (l['width'], l['height']) for l in layouts if 'name' in l}


def load_map(em, dims, name):
    w, h = dims[name]
    d = (em / f'data/layouts/{name}/map.bin').read_bytes()
    grid = [[struct.unpack_from('<H', d, (y * w + x) * 2)[0] for x in range(w)] for y in range(h)]
    nav = [[((v >> 10) & 3) == 0 and ((v >> 12) & 15) == 3 for v in row] for row in grid]
    return w, h, grid, nav


def render(ts, grid, x0, y0, x1, y1):
    img = Image.new('RGBA', ((x1 - x0) * 16, (y1 - y0) * 16))
    for y in range(y0, y1):
        for x in range(x0, x1):
            img.paste(ts.metatile(grid[y][x] & 0x3ff), ((x - x0) * 16, (y - y0) * 16))
    return img


def bfs(nav, w, h, start, target):
    q, prev = deque([start]), {start: None}
    while q:
        p = q.popleft()
        if target(p):
            path = []
            while p:
                path.append(p)
                p = prev[p]
            return path[::-1]
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (p[0] + dx, p[1] + dy)
            if 0 <= n[0] < w and 0 <= n[1] < h and nav[n[1]][n[0]] and n not in prev:
                prev[n] = p
                q.append(n)
    raise SystemExit(f'sem caminho navegável a partir de {start}')


def inside(p, b):
    return b[0] <= p[0] < b[0] + COLS and b[1] <= p[1] < b[1] + ROWS


def underwater_trainer(em, name):
    """O Red ou a Leaf pintados com os 4 tons da paleta submersa do Emerald, sentados na sombra do Pokémon."""
    pal = read_pal(em / 'graphics/object_events/palettes/player_underwater.pal')
    shades = [pal[8], pal[6], pal[5], pal[9]]   # do escuro para o claro
    black = (8, 12, 32)
    bw = Image.open(em / 'graphics/object_events/pics/people/brendan/underwater.png')
    bp = bw.load()
    # a sombra: os pixels pretos (índice 15) do Brendan submerso, da linha 17 para baixo, com o miolo preenchido
    blob = set()
    for y in range(17, 32):
        xs = [x for x in range(32) if (bp[x, y] & 15) == 15]
        if xs:
            blob.update((x, y) for x in range(min(xs), max(xs) + 1))
    body = {(xx, yy) for xx in range(8, 24) for yy in range(17, 20)}
    src = Image.open(ROOT / f'assets/trainers/{name}.png').convert('RGBA')
    sp = src.load()
    out = Image.new('RGBA', (32 * 3, 32), (0, 0, 0, 0))
    for d in range(3):     # baixo, cima, lado (o lado direito é o esquerdo espelhado)
        px = [(x, y, sp[d * 16 + x, y]) for y in range(32) for x in range(16) if sp[d * 16 + x, y][3] > 0]
        lum = lambda c: round(.3 * c[0] + .59 * c[1] + .11 * c[2])
        lums = sorted({lum(c) for _, _, c in px})
        darkest, rest = lums[0], lums[1:]

        def shade(l):
            return black if l == darkest else shades[min(3, int(rest.index(l) * 4 / len(rest)))]

        top = min(y for _, y, _ in px)
        frame = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
        fp = frame.load()
        oy = 6 - top   # o topo da cabeça na linha 6 do quadro, como o Brendan
        for x, y, c in px:
            if 0 <= y + oy < 32:
                fp[8 + x, y + oy] = shade(lum(c)) + (255,)
        for (x, y) in blob:
            if y >= 20 or (x, y) not in body:
                fp[x, y] = black + (255,)
        out.paste(frame, (d * 32, 0))
    return out


class CaveTileset(Tileset):
    """O primário (general) com o secundário cave: o salão do Kyogre."""

    def __init__(self, em):
        p = em / 'data/tilesets/primary/general'
        s = em / 'data/tilesets/secondary/cave'
        self.pals = [read_pal(p / f'palettes/{i:02d}.pal') for i in range(6)] + \
                    [read_pal(s / f'palettes/{i:02d}.pal') for i in range(6, 13)]
        self.pals += [self.pals[0]] * 3
        self.tp, self.ts = Image.open(p / 'tiles.png'), Image.open(s / 'tiles.png')
        self.mp, self.ms = self._metatiles(p / 'metatiles.bin'), self._metatiles(s / 'metatiles.bin')
        self.cache = {}


def indexed_rgba(path, pal=None):
    """Um PNG indexado do decomp com as cores do .pal (o índice 0 é transparente)."""
    im = Image.open(path)
    colors = pal or [tuple(im.getpalette()[i * 3:i * 3 + 3]) for i in range(16)]
    px = im.load()
    out = Image.new('RGBA', im.size, (0, 0, 0, 0))
    for y in range(im.size[1]):
        for x in range(im.size[0]):
            c = px[x, y] & 15
            if c:
                out.putpixel((x, y), colors[c] + (255,))
    return out


def tilemap(tiles_path, bin_path, palettes, w_tiles, h_tiles, map_w=32, l_mode=False):
    """Um fundo do GBA (tiles 8x8 + tilemap), um quadro por paleta. O índice 0 é transparente."""
    tiles = Image.open(tiles_path)
    tp = tiles.load()
    tw = tiles.size[0] // 8
    data = Path(bin_path).read_bytes()
    frames = []
    for pal in palettes:
        im = Image.new('RGBA', (w_tiles * 8, h_tiles * 8), (0, 0, 0, 0))
        px = im.load()
        for ty in range(h_tiles):
            for tx in range(w_tiles):
                e = struct.unpack_from('<H', data, (ty * map_w + tx) * 2)[0]
                idx, hf, vf = e & 0x3ff, e >> 10 & 1, e >> 11 & 1
                sx0, sy0 = (idx % tw) * 8, (idx // tw) * 8
                if sy0 >= tiles.size[1]:
                    continue
                for y in range(8):
                    for x in range(8):
                        v = tp[sx0 + x, sy0 + y]
                        c = (v >> 4) if l_mode else v & 15
                        if c:
                            px[tx * 8 + (7 - x if hf else x), ty * 8 + (7 - y if vf else y)] = pal[c] + (255,)
        frames.append(im)
    return frames


def read_pals(path):
    """Um .pal com várias paletas de 16 cores, uma lista por paleta."""
    lines = Path(path).read_text().splitlines()[3:]
    cols = [tuple(int(v) for v in l.split()) for l in lines if l.strip()]
    return [cols[i:i + 16] for i in range(0, len(cols), 16)]


# os Pokémon animados que a luta mostra em campo (Hoenn) e o Kyogre
FIELD_DEX = [318, 319, 320, 321, 340, 342, 350, 365, 367, 368, 369, 382]
MAX_FRAMES = 36


def animated(pa, dex, shiny=False):
    """A tira de quadros de um GIF da Gen 5 (o mesmo corte do extract.py)."""
    gif = Image.open(pa / 'assets/pokemon/battle' / ('front-shiny' if shiny else 'front') / f'{dex}.gif')
    frames, durations = [], []
    for i in range(getattr(gif, 'n_frames', 1)):
        gif.seek(i)
        frames.append(gif.convert('RGBA'))
        durations.append(gif.info.get('duration', 80) or 80)
    step = -(-len(frames) // MAX_FRAMES)
    frames = frames[::step]
    fps = max(1, round(1000 / (sum(durations) / len(durations)) / step))
    boxes = [f.getbbox() for f in frames if f.getbbox()]
    box = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
    cells = [f.crop(box) for f in frames]
    sheet = Image.new('RGBA', (cells[0].width * len(cells), cells[0].height), (0, 0, 0, 0))
    for i, c in enumerate(cells):
        sheet.paste(c, (i * cells[0].width, 0))
    sheet = sheet.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
    return sheet, {'frameWidth': cells[0].width, 'frameHeight': cells[0].height, 'frames': len(cells), 'fps': fps}


# A ARENA DA LUTA (o cenário aprovado na maquete "A Luta do Kyogre"): o chão de areia do
# salão, a rocha nas bordas, o lago do Kyogre no meio (o do MarineCave_End, com as margens)
# (0.37.5: sem as poças; o mergulho dele é no chão). Em metatiles de 16 px; o jogo mostra em 2x.
ARENA_COLS, ARENA_ROWS = 75, 50
ARENA_POOLS = []   # 0.37.5: sem as poças (o Fellipe: "meio sem sentido"); o mergulho é no chão


def kyogre_hall(em, out_dir, world):
    ts = CaveTileset(em)
    w, h = layout_dims(em)['MarineCave_End']
    raw = (em / 'data/layouts/MarineCave_End/map.bin').read_bytes()
    grid = [[struct.unpack_from('<H', raw, (y * w + x) * 2)[0] for x in range(w)] for y in range(h)]
    hall = render(ts, grid, 0, 0, w, h)
    hall.save(out_dir / 'hall.png', optimize=True)
    # o banner do card da fase (o painel do mapa da jornada, 192x64 como os de gym_banners.py): o lago do Kyogre
    hall.crop((48, 19 * 16, 48 + 192, 19 * 16 + 64)).save(ROOT / 'assets/ui/gym-banners/kyogre_hall.png', optimize=True)
    world['hall'] = {
        'layout': 'MarineCave_End', 'w': w, 'h': h,
        # 0 = dá para pisar (colisão 0); a água do lago é colisão 1
        'coll': ''.join(str(v >> 10 & 3) for row in grid for v in row),
        'warp': [20, 4], 'kyogre': [9, 22], 'spot': [9, 26],
        # a margem do lago: pisar nela começa o encontro
        'shore': [[x, 26] for x in range(5, 15)] + [[x, 27] for x in range(8, 14)]
    }
    # o Kyogre do mapa usa a paleta npc_4 (OBJ_EVENT_PAL_TAG_NPC_4)
    indexed_rgba(em / 'graphics/object_events/pics/pokemon/kyogre.png',
                 read_pal(em / 'graphics/object_events/palettes/npc_4.pal')).save(out_dir / 'kyogre_ow.png', optimize=True)
    indexed_rgba(em / 'graphics/weather/fog_horizontal.png', read_pal(em / 'graphics/weather/fog.pal')).save(out_dir / 'fog.png', optimize=True)
    # a transição: o pt1 pisca (10 paletas) e o pt2 clareia (14)
    bt = em / 'graphics/battle_transitions'
    flash = read_pals(bt / 'kyogre_pt1.pal')
    frames = tilemap(bt / 'kyogre.png', bt / 'kyogre.bin', flash + read_pals(bt / 'kyogre_pt2.pal'), 30, 20, l_mode=True)
    sheet = Image.new('RGBA', (240 * len(frames), 160), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        sheet.paste(f, (i * 240, 0))
    sheet.save(out_dir / 'transition.png', optimize=True)
    world['transition'] = {'frames': len(frames), 'flash': len(flash)}

    # a arena: uma tira com as metatiles usadas e o layout (como os cenários do extract.py)
    floor, rock, water = grid[13][13] & 0x3ff, grid[0][0] & 0x3ff, grid[22][9] & 0x3ff
    cells = [[rock if x < 2 or y < 3 or x >= ARENA_COLS - 2 or y >= ARENA_ROWS - 2 else floor
              for x in range(ARENA_COLS)] for y in range(ARENA_ROWS)]
    lx, ly = ARENA_COLS // 2 - 6, ARENA_ROWS // 2 - 6
    for y in range(17, 27):            # o lago do MarineCave_End, com as margens (sem a parede do fundo)
        for x in range(3, 16):
            cells[ly + y - 17][lx + x - 3] = grid[y][x] & 0x3ff
    for (px, py) in ARENA_POOLS:
        for yy in range(2):
            for xx in range(3):
                cells[py + yy][px + xx] = water
    ids = sorted({m for row in cells for m in row})
    strip = Image.new('RGBA', (16 * len(ids), 16))
    for i, m in enumerate(ids):
        strip.paste(ts.metatile(m), (i * 16, 0))
    strip.save(ROOT / 'assets/scenes/marine_cave.png', optimize=True)
    world['arena'] = {
        'sheet': 'marine_cave', 'ids': ids, 'cols': ARENA_COLS, 'rows': ARENA_ROWS,
        'cells': [m for row in cells for m in row],
        # em px de metatile (o jogo multiplica pela escala): o centro do lago e das poças
        'lake': [(lx + 6.5) * 16, (ly + 5) * 16], 'pools': [[(x + 1.5) * 16, (y + 1) * 16] for x, y in ARENA_POOLS]
    }


def scene_art(em, pa, out_dir):
    """O Maxie, o "!", o pássaro do Voar, as listras do corte de tela e o Crobat (a cena da seção 10)."""
    indexed_rgba(em / 'graphics/object_events/pics/people/team_magma/maxie.png',
                 read_pal(em / 'graphics/object_events/palettes/npc_2.pal')).save(out_dir / 'maxie.png', optimize=True)
    fe = em / 'graphics/field_effects/pics'
    indexed_rgba(fe / 'emotion_exclamation.png').save(out_dir / 'exclam.png', optimize=True)
    indexed_rgba(fe / 'bird.png').save(out_dir / 'bird.png', optimize=True)
    for name, out in (('field_move_streaks', 'band_out'), ('field_move_streaks_indoors', 'band_in')):
        t = Image.open(fe / f'{name}.png')
        pal = [tuple(t.getpalette()[i * 3:i * 3 + 3]) for i in range(16)]
        n = len((fe / f'{name}.bin').read_bytes()) // 2
        tilemap(fe / f'{name}.png', fe / f'{name}.bin', [pal], 32, n // 32)[0].save(out_dir / f'{out}.png', optimize=True)
    Image.open(pa / 'assets/pokemon/gen3/front/169.png').convert('RGBA').resize((64, 64), Image.NEAREST).save(out_dir / 'crobat.png', optimize=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--emerald', default=str(ROOT.parent / 'pokeemerald'))
    ap.add_argument('--pokemon-all', default=str(ROOT.parent / 'Pokemon All'))
    args = ap.parse_args()
    em, pa = Path(args.emerald), Path(args.pokemon_all)
    out_dir = ROOT / 'assets/dive'
    out_dir.mkdir(parents=True, exist_ok=True)
    ts = Tileset(em)
    dims = layout_dims(em)
    world = {'maps': {}}

    for key, layout in LAYOUT.items():
        w, h, grid, nav = load_map(em, dims, layout)
        boards = BOARDS[key]
        for b in boards:
            bad = [(x, y) for y in range(b[1], b[1] + ROWS) for x in range(b[0], b[0] + COLS) if not nav[y][x]]
            if bad:
                raise SystemExit(f'{key}: o tabuleiro {b} tem tiles não navegáveis: {bad[:4]}')
        # o recorte: os tabuleiros e os caminhos entre eles, com a margem da câmera
        pts = [p for b in boards for p in ((b[0], b[1]), (b[0] + COLS - 1, b[1] + ROWS - 1))]
        for i in range(len(boards) - 1):
            pts += bfs(nav, w, h, (boards[i][0] + 4, boards[i][1] + 2), lambda q, b=boards[i + 1]: inside(q, b))
        pts += bfs(nav, w, h, (boards[-1][0] + 4, boards[-1][1] + 2), lambda q: q == EXIT[key])
        if key in ENTRY:
            pts += bfs(nav, w, h, ENTRY[key], lambda q, b=boards[0]: inside(q, b))
        x0 = max(0, min(p[0] for p in pts) - MARGIN)
        y0 = max(0, min(p[1] for p in pts) - MARGIN)
        x1 = min(w, max(p[0] for p in pts) + MARGIN + 1)
        y1 = min(h, max(p[1] for p in pts) + MARGIN + 1)
        render(ts, grid, x0, y0, x1, y1).save(out_dir / f'{key}.png', optimize=True)
        world['maps'][key] = {
            'layout': layout, 'w': x1 - x0, 'h': y1 - y0, 'ox': x0, 'oy': y0,
            'nav': ''.join('1' if nav[y][x] else '0' for y in range(y0, y1) for x in range(x0, x1))
        }
        print(f'{key}: recorte {x0},{y0} a {x1},{y1} ({x1 - x0}x{y1 - y0} tiles)')

    # a entrada submersa da Caverna Marinha: o poço navegável é o 3x3 de colisão 0 em volta do
    # ponto de emergir (o warp do Emerald, em 9,8); a elevação 0 aceita entrar de qualquer altura
    w, h, grid, nav = load_map(em, dims, 'Underwater_MarineCave')
    render(ts, grid, 0, 0, w, h).save(out_dir / 'cave.png', optimize=True)
    pit = lambda x, y: ((grid[y][x] >> 10) & 3) == 0 and 8 <= x <= 10 and 6 <= y <= 8
    world['maps']['cave'] = {
        'layout': 'Underwater_MarineCave', 'w': w, 'h': h, 'ox': 0, 'oy': 0,
        'nav': ''.join('1' if pit(x, y) else '0' for y in range(h) for x in range(w))
    }
    world['boards'] = [[k, x, y] for k in LAYOUT for (x, y) in BOARDS[k]]
    world['exit'] = {k: list(v) for k, v in EXIT.items()}
    world['entry'] = {k: list(v) for k, v in ENTRY.items()}
    world['cave'] = {'arrive': [9, 6], 'emerge': [9, 8]}

    for name in ('red', 'leaf'):
        underwater_trainer(em, name).save(out_dir / f'{name}.png', optimize=True)

    # o salão do Kyogre, a arena da luta e a cena do Maxie (0.37)
    kyogre_hall(em, out_dir, world)
    scene_art(em, pa, out_dir)
    sprites = {}
    for dex in FIELD_DEX:
        sheet, info = animated(pa, dex)
        sheet.save(ROOT / f'assets/pokemon/{dex}.png', optimize=True)
        sprites[f'pokemon/{dex}'] = {'src': f'assets/pokemon/{dex}.png', **info}
    sheet, info = animated(pa, 382, shiny=True)
    sheet.save(ROOT / 'assets/pokemon/shiny/382.png', optimize=True)
    sprites['pokemon/shiny/382'] = {'src': 'assets/pokemon/shiny/382.png', **info}
    for key, src, w, h, frames in (('dive/kyogre_ow', 'kyogre_ow.png', 32, 32, 4), ('dive/maxie', 'maxie.png', 16, 32, 9),
                                   ('dive/exclam', 'exclam.png', 16, 16, 1), ('dive/bird', 'bird.png', 32, 32, 1),
                                   ('dive/crobat', 'crobat.png', 64, 64, 1), ('dive/band_out', 'band_out.png', 256, 80, 1),
                                   ('dive/band_in', 'band_in.png', 256, 80, 1)):
        sprites[key] = {'src': f'assets/dive/{src}', 'frameWidth': w, 'frameHeight': h, 'frames': frames}
    sprites['scene/marine_cave'] = {'src': 'assets/scenes/marine_cave.png', 'frameWidth': 16, 'frameHeight': 16,
                                    'frames': len(world['arena']['ids'])}
    sprites['item/dive-ball'] = {'src': 'assets/items/dive-ball.png', 'frameWidth': 30, 'frameHeight': 30, 'frames': 1}
    Image.open(pa / 'assets/pokemon/gen3/front/382.png').convert('RGBA').save(ROOT / 'assets/pokemon/gen3/front/382.png', optimize=True)
    Image.open(pa / 'assets/items/default/dive-ball.png').convert('RGBA').save(ROOT / 'assets/items/dive-ball.png', optimize=True)
    (ROOT / 'assets/sound/cries').mkdir(parents=True, exist_ok=True)
    (ROOT / 'assets/sound/cries/382.ogg').write_bytes((pa / 'assets/sound/cries/382.ogg').read_bytes())
    world['sprites'] = sprites

    icons = ROOT / 'assets/pokemon/gen3/icons'
    for n in HOENN:
        im = Image.open(pa / f'assets/pokemon/gen3/icons/{n}.png').convert('RGBA')
        im.resize((32, 64), Image.NEAREST).save(icons / f'{n}.png', optimize=True)

    js = ['/**',
          ' * GERADO por tools/assets/dive.py: não editar à mão.',
          ' * O mundo da descida (PLANEJAMENTO-DIVE.md, seção 3): o recorte de cada mapa submerso do',
          ' * Emerald (ox, oy = onde ele começa no mapa original), a grade do que é navegável (`nav`, uma',
          ' * linha de "0" e "1", w por h), os tabuleiros 10x6 (no mapa original), a saída e a entrada.',
          ' */',
          'export const DIVE_WORLD = ' + json.dumps(world, ensure_ascii=False) + ';', '']
    (ROOT / 'src/data/diveWorld.js').write_text('\n'.join(js), encoding='utf-8')
    print('src/data/diveWorld.js e assets/dive/ gerados')


if __name__ == '__main__':
    main()
