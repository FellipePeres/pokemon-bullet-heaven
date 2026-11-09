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
