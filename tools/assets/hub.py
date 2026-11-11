"""
A VILA DA JORNADA — monta os mapas do lobby jogável (PLANEJAMENTO-LOBBY.md).

Cada mapa é composto com pedaços de mapas do FireRed (metatiles de 16 px),
lidos do decomp que fica no Pokemon All (só leitura, como no extract.py).
Nada é desenhado à mão: casas, árvores, caminhos, balcões e móveis são
metatiles do jogo, recortados e rearranjados.

Saída:
    assets/hub/<mapa>.png          o chão, em 1x (16 px por tile)
    assets/hub/<mapa>-top.png      o que fica POR CIMA dos personagens
    assets/hub/npc/<id>.png        os personagens e objetos (tiras de quadros)
    assets/hub/decor/<id>.png      os móveis do quarto decorável (e o -top de cada um)
    src/data/hubMaps.js            GERADO: tamanho, colisão, as folhas e os móveis

As duas camadas são as do FireRed: cada metatile tem 4 tiles de baixo e 4 de
cima, e o "tipo de camada" (bits 29-30 do metatile_attributes.bin) diz se os
de cima ficam atrás (COVERED) ou na frente dos personagens (NORMAL e SPLIT).
É isso que faz o jogador passar por trás da beirada do telhado e da copa das
árvores.

A colisão também vem dos mapas de origem: o bit de colisão do map.bin
(paredes, árvores, cercas, portas) e a elevação 1 (água, só com Surf).
Portas, saídas, pessoas e falas ficam em src/data/hub.js (feito à mão).

Uso (Python 3 + Pillow):
    python tools/assets/hub.py
    python tools/assets/hub.py --fonte "D:/fellipe/Dev/Pokemon All"
"""
import argparse
import json
import struct
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from extract import Tileset, snake, read_pal, paint, ROOT  # noqa: E402

ASSETS = ROOT / 'assets' / 'hub'
HUB_MAPS_JS = ROOT / 'src' / 'data' / 'hubMaps.js'
T = 16

LAYER_COVERED = 1   # METATILE_LAYER_TYPE_COVERED: os tiles de cima ficam atrás dos personagens


class Layers:
    """Tileset de um mapa com as duas camadas separadas e o tipo de cada metatile."""

    def __init__(self, decomp, primary, secondary):
        self.ts = Tileset(decomp, primary, secondary)
        folders = [decomp / 'data' / 'tilesets' / kind / name
                   for kind, name in (('primary', primary), ('secondary', secondary))]
        attrs = [self._attrs(folder) for folder in folders]
        self.attrs = attrs[0] + [0] * (640 - len(attrs[0])) + attrs[1]
        self.cache = {}

    @staticmethod
    def _attrs(folder):
        raw = (folder / 'metatile_attributes.bin').read_bytes()
        return [struct.unpack_from('<I', raw, i)[0] for i in range(0, len(raw), 4)]

    def render(self, mid):
        """(chão, por cima) de um metatile, cada um 16x16 RGBA."""
        if mid in self.cache:
            return self.cache[mid]
        ts = self.ts
        bottom, top = Image.new('RGBA', (T, T)), Image.new('RGBA', (T, T))
        for layer, image in ((0, bottom), (1, top)):
            pixels = image.load()
            for k in range(4):
                entry = ts.metatiles[mid][layer * 4 + k]
                tile = ts.tiles[entry & 0x3FF]
                hflip, vflip, pal = entry & 0x400, entry & 0x800, ts.pals[(entry >> 12) & 15]
                ox, oy = (k % 2) * 8, (k // 2) * 8
                for y in range(8):
                    for x in range(8):
                        c = tile[(7 - y if vflip else y) * 8 + (7 - x if hflip else x)]
                        if c or not layer:
                            pixels[ox + x, oy + y] = pal[c] + (255,)
        if (self.attrs[mid] >> 29) & 3 == LAYER_COVERED:
            bottom.alpha_composite(top)
            top = Image.new('RGBA', (T, T))
        self.cache[mid] = (bottom, top)
        return self.cache[mid]


class Source:
    """Um mapa do FireRed: as células (metatile, colisão, elevação) e o tileset."""
    _layers = {}

    def __init__(self, decomp, layouts, name):
        layout = layouts[f'{name}_Layout']
        key = (layout['primary_tileset'], layout['secondary_tileset'])
        if key not in Source._layers:
            Source._layers[key] = Layers(decomp, snake(key[0]), snake(key[1]))
        self.layers = Source._layers[key]
        self.w, self.h = layout['width'], layout['height']
        raw = (decomp / layout['blockdata_filepath']).read_bytes()
        self.cells = [[struct.unpack_from('<H', raw, (y * self.w + x) * 2)[0] for x in range(self.w)]
                      for y in range(self.h)]

    def cell(self, x, y):
        """(chão, por cima, anda?) de uma célula."""
        value = self.cells[y][x]
        base, top = self.layers.render(value & 0x3FF)
        walk = not (value & 0xC00) and (value >> 12) != 1   # sem colisão e fora da água
        return base, top, walk


class Scene:
    """Um mapa do lobby em montagem: chão, camada de cima e colisão, célula a célula."""

    def __init__(self, sources, w, h):
        self.sources = sources
        self.w, self.h = w, h
        self.base = [[None] * w for _ in range(h)]
        self.top = [[None] * w for _ in range(h)]
        self.walk = [[False] * w for _ in range(h)]

    def _put(self, dx, dy, cell):
        if 0 <= dx < self.w and 0 <= dy < self.h:
            self.base[dy][dx], self.top[dy][dx], self.walk[dy][dx] = cell

    def stamp(self, dx, dy, m, sx, sy, w=1, h=1):
        """Copia um retângulo do mapa `m`, com colisão e tudo."""
        src = self.sources[m]
        for j in range(h):
            for i in range(w):
                self._put(dx + i, dy + j, src.cell(sx + i, sy + j))

    def stamp_keyed(self, dx, dy, m, sx, sy, w, h, kx, ky):
        """
        Copia sem o chão de origem: no chão, só os pixels que diferem do tile de
        fundo (kx, ky) da fonte; a camada de cima vem inteira. Serve para colar
        uma casa sem o gramado claro em volta, ou a beirada de um telhado sem a
        calçada de onde ela veio.
        """
        src = self.sources[m]
        key = src.cell(kx, ky)[0].load()
        for j in range(h):
            for i in range(w):
                x, y = dx + i, dy + j
                if not (0 <= x < self.w and 0 <= y < self.h):
                    continue
                base, top, walk = src.cell(sx + i, sy + j)
                part = base.copy()
                pp = part.load()
                for py in range(T):
                    for px in range(T):
                        if pp[px, py][:3] == key[px, py][:3]:
                            pp[px, py] = (0, 0, 0, 0)
                merged = self.base[y][x].copy() if self.base[y][x] else Image.new('RGBA', (T, T))
                merged.alpha_composite(part)
                covered = part.getbbox() is not None
                self.base[y][x] = merged
                self.top[y][x] = top
                # o que sobrou do chão de origem decide a colisão; só o fundo apagado, fica a do destino
                if covered:
                    self.walk[y][x] = walk

    def fill(self, x0, y0, w, h, m, sx, sy, pw=1, ph=1):
        """Preenche o retângulo repetindo um bloco pw x ph do mapa `m`."""
        for y in range(y0, y0 + h):
            for x in range(x0, x0 + w):
                self.stamp(x, y, m, sx + (x - x0) % pw, sy + (y - y0) % ph)

    def sand_path(self, cells, m='ViridianCity'):
        """Caminho de terra com as bordas certas a partir de um conjunto de células (autotile)."""
        src = self.sources[m]
        has = lambda x, y: (x, y) in cells
        for (x, y) in cells:
            n, s, e, w = has(x, y - 1), has(x, y + 1), has(x + 1, y), has(x - 1, y)
            flip = False
            if not n and not w: t = (14, 32)
            elif not n and not e: t = (39, 32)
            elif not s and not w: t = (14, 34)
            elif not s and not e: t = (39, 34)
            elif not n:
                if has(x + 1, y - 1): t, flip = (21, 34), True
                elif has(x - 1, y - 1): t, flip = (26, 34), True
                else: t = (20, 32)
            elif not s:
                if has(x + 1, y + 1): t = (21, 34)
                elif has(x - 1, y + 1): t = (26, 34)
                else: t = (20, 34)
            elif not w:
                if has(x - 1, y - 1): t = (22, 35)
                elif has(x - 1, y + 1): t, flip = (22, 35), True
                else: t = (14, 33)
            elif not e:
                if has(x + 1, y - 1): t = (25, 35)
                elif has(x + 1, y + 1): t, flip = (25, 35), True
                else: t = (39, 33)
            else: t = (20, 33)
            base, top, walk = src.cell(*t)
            if flip:
                base, top = base.transpose(Image.FLIP_TOP_BOTTOM), top.transpose(Image.FLIP_TOP_BOTTOM)
            self._put(x, y, (base, top, walk))

    def block(self, x, y, w=1, h=1, walk=False):
        """Ajuste de colisão à mão (quando o recorte deixa uma célula enganosa)."""
        for j in range(h):
            for i in range(w):
                self.walk[y + j][x + i] = walk

    def images(self, background=(0, 0, 0, 255)):
        base = Image.new('RGBA', (self.w * T, self.h * T), background)
        top = Image.new('RGBA', (self.w * T, self.h * T))
        for y in range(self.h):
            for x in range(self.w):
                if self.base[y][x]:
                    base.alpha_composite(self.base[y][x], (x * T, y * T))
                if self.top[y][x]:
                    top.alpha_composite(self.top[y][x], (x * T, y * T))
        return base, top


def rects(*rs):
    out = set()
    for x, y, w, h in rs:
        out |= {(i, j) for i in range(x, x + w) for j in range(y, y + h)}
    return out


# ================================ os mapas ================================

P, V, R, F, CE, FU = ('PalletTown', 'ViridianCity', 'Route1', 'FourIsland', 'CeruleanCity', 'FuchsiaCity')
IP, DS4, DS1 = 'IndigoPlateau_PokemonCenter_1F', 'CeladonCity_DepartmentStore_4F', 'CeladonCity_DepartmentStore_1F'
PH1, PH2 = 'PalletTown_PlayersHouse_1F', 'PalletTown_PlayersHouse_2F'
LAB, HOUSE1, WARDEN = 'PalletTown_ProfessorOaksLab', 'House1', 'FuchsiaCity_WardensHouse'
COPYCAT = 'SaffronCity_CopycatsHouse_2F'
GYM1 = 'PewterCity_Gym'
GYM2 = 'CeruleanCity_Gym'
GYM3, VE, PP = 'VermilionCity_Gym', 'VermilionCity', 'PowerPlant'


def build_vila(s):
    """A vila (36x28): o desenho aprovado na maquete, com o laboratório e o mato alto a oeste."""
    W, H = s.w, s.h
    s.fill(0, 0, W, H, V, 11, 21)                       # grama
    # mata em volta, com a saída sul aberta e a trilha do mato alto a oeste
    s.fill(0, 0, W, 2, V, 44, 8, 2, 2)
    s.fill(0, 2, 2, H - 2, V, 44, 8, 2, 2)
    s.fill(W - 2, 2, 2, H - 2, V, 44, 8, 2, 2)
    s.fill(0, H - 2, 16, 2, V, 44, 8, 2, 2)
    s.fill(20, H - 2, W - 20, 2, V, 44, 8, 2, 2)

    # caminhos: uma estrada sinuosa do sul até a praça do Centro, com ramais
    s.sand_path(rects(
        (16, 22, 4, 6),     # entrada sul
        (14, 19, 6, 3),     # curva
        (12, 15, 5, 5),     # sobe pela esquerda
        (13, 10, 10, 5),    # praça do Centro
        (17, 9, 3, 1),      # porta do Centro
        (5, 17, 8, 2),      # ramal da nossa casa
        (5, 9, 9, 2),       # ramal da cabana
        (22, 12, 7, 2),     # ramal leste
        (27, 14, 2, 6),     #   desce para a casa do sábio
        (27, 18, 5, 2),
        (25, 7, 2, 5),      # laboratório
        (5, 8, 2, 1),       # porta da cabana
        (20, 21, 6, 2),     # ramal da loja de Pokédolls
    ))

    # prédios
    s.stamp_keyed(15, 4, V, 24, 22, 5, 1, 24, 21)       # Centro Pokémon (a beirada sem a calçada)
    s.stamp(15, 5, V, 24, 23, 5, 4)
    s.stamp_keyed(4, 12, P, 4, 3, 6, 5, 11, 3)          # nossa casa, sem o gramado claro
    s.stamp(4, 4, F, 11, 10, 4, 4)                      # cabana de uma moradora
    s.stamp_keyed(23, 2, P, 13, 9, 7, 1, 12, 9)         # laboratório do Carvalho
    s.stamp(23, 3, P, 13, 10, 7, 4)
    s.stamp(29, 14, FU, 32, 28, 5, 4)                   # casa do velho sábio
    s.stamp(21, 15, CE, 12, 23, 4, 6)                   # loja de Pokédolls (teto de vidro)
    # mato alto e a trilha lateral para o modo Endless
    s.fill(0, 20, 2, 4, V, 11, 21)
    for x, y, w, h in [(0, 20, 9, 4), (2, 24, 7, 2), (9, 21, 2, 3), (3, 19, 4, 1)]:
        s.fill(x, y, w, h, R, 12, 7)
    s.stamp(9, 19, P, 5, 14)                            # placa da trilha
    # lagoa com flores
    s.stamp(29, 8, P, 7, 17, 4, 3)
    for x, y in [(28, 7), (30, 7), (33, 9), (12, 22), (13, 24), (10, 13), (23, 7), (24, 9)]:
        s.stamp(x, y, CE, 13, 21)
    # árvores soltas
    for x, y in [(2, 8), (10, 3), (21, 2), (23, 23), (31, 21), (12, 24)]:
        s.stamp(x, y, V, 7, 22, 2, 3)
    # placas
    s.stamp(15, 24, P, 5, 14)                           # Rota 1
    s.stamp(20, 19, CE, 11, 28)                         # loja


def build_casa_1f(s):
    """Térreo da nossa casa: a sala da mãe, como no FireRed."""
    s.stamp(0, 0, PH1, 0, 0, 13, 10)


def build_casa_2f(s):
    """O quarto: começa vazio (paredes, janela, escada e a cama), para ser decorado."""
    s.stamp(0, 0, PH2, 0, 0, 12, 9)
    s.fill(1, 0, 7, 1, PH2, 7, 0)
    s.fill(1, 1, 7, 1, PH2, 7, 1)
    s.fill(1, 2, 7, 7, PH2, 9, 6)
    s.fill(8, 4, 4, 5, PH2, 9, 6)
    s.fill(11, 2, 1, 2, PH2, 9, 6)
    s.stamp(1, 5, PH2, 1, 5, 3, 2)                      # a cama
    s.block(1, 5, 2, 2)                                 # inteira sólida (no FireRed, só o pé dela)


def build_centro(s):
    """O Centro de Indigo Plateau, com um segundo balcão: o do Poké Mart."""
    s.stamp(0, 0, IP, 9, 7, 16, 11)
    s.fill(9, 5, 6, 4, IP, 19, 12)                      # sem as mesas da direita
    s.fill(9, 9, 5, 1, IP, 19, 16)
    s.stamp(9, 3, IP, 10, 10, 1, 2)                     # o balcão do Mart
    s.fill(10, 3, 4, 2, IP, 14, 10)
    s.stamp(14, 3, IP, 16, 10, 1, 2)
    s.fill(10, 4, 4, 1, IP, 15, 11)
    s.stamp(14, 4, IP, 16, 11)
    s.stamp(1, 7, IP, 8, 3, 1, 2)                       # plantas
    s.stamp(14, 7, IP, 8, 3, 1, 2)
    # o recorte corta o salão grande de Indigo: as duas pontas viram parede
    s.block(0, 2, 1, 8)
    s.block(15, 2, 1, 8)


def build_pokedoll(s):
    """
    A loja de Pokédolls: o 4º andar da loja de Celadon. Os dois vasos da entrada
    saem (0.30, pedido do Fellipe: bloqueavam quem entrava) e no lugar deles fica o
    tapete da saída, que é do térreo da mesma loja (mesmo tileset, mesmo piso).
    Embaixo, a parede do fim do térreo fecha a loja e o balcão da vendedora.
    """
    s.stamp(0, 0, DS4, 0, 4, 13, 11)
    s.fill(0, 11, 13, 1, DS1, 6, 15)     # a parede de baixo, lisa (sem os pedaços dos tapetes do térreo)
    s.fill(9, 9, 2, 1, DS4, 11, 13)      # chão no lugar das folhas dos vasos
    s.stamp(9, 10, DS4, 11, 14)          # chão no lugar de um vaso
    s.stamp(10, 10, DS1, 2, 14, 1, 2)    # e o tapete da saída (ele desce até a parede) no lugar do outro
    s.block(0, 0, 13, 1)        # o corredor do elevador, que ficou de fora
    s.block(0, 1, 3, 1)
    s.block(0, 11, 13, 1)       # a parede de baixo


def build_lab(s):
    s.stamp(0, 0, LAB, 0, 0, 13, 14)
    s.block(0, 2, 1, 11)        # as paredes dos lados
    s.block(12, 2, 1, 11)


def build_cabana(s):
    s.stamp(0, 0, HOUSE1, 0, 0, 11, 9)


def build_casa_sabio(s):
    s.stamp(0, 0, WARDEN, 0, 0, 13, 11)


def build_ginasio_pewter(s):
    """O ginásio do Brock, inteiro, como no FireRed: o palco das cenas de depois da Fase 1 (0.39)."""
    s.stamp(0, 0, GYM1, 0, 0, 13, 16)


def build_ginasio_cerulean(s):
    """O ginásio da Misty, inteiro, com a piscina: o palco da cena de depois da Fase 2 (0.39)."""
    s.stamp(0, 0, GYM2, 0, 0, 17, 20)


def build_ginasio_vermilion(s):
    """O ginásio do Lt. Surge, inteiro: o palco da cena de depois da Fase 3 (0.39)."""
    s.stamp(0, 0, GYM3, 0, 0, 11, 21)


def build_vermilion(s):
    """Um recorte de Vermilion (0.39): o ginásio, o cais de madeira e o caminho até o navio."""
    s.stamp(0, 0, VE, 14, 18, 26, 18)


def build_usina(s):
    """
    A Usina inteira (0.39, pedido do Fellipe): o jogador anda pelo labirinto do FireRed,
    só onde o original deixa, acha as Poké Balls e a escotilha para o fundo.
    """
    s.stamp(0, 0, PP, 0, 0, 49, 40)


def build_usina_fundo(s):
    """
    O fundo da Usina (0.39): uma sala no escuro, com o chão da Usina. Só o círculo de luz em
    volta do jogador aparece; lá na frente, os olhos do Zapdos.
    """
    s.fill(0, 0, 15, 11, PP, 1, 5)
    s.block(0, 0, 15, 2)
    s.block(0, 0, 1, 11)
    s.block(14, 0, 1, 11)
    s.block(0, 10, 15, 1)


def build_cerulean(s):
    """
    Um recorte de Cerulean (0.39): a casa assaltada do FireRed (a porta da frente em
    30,11, o policial em 31,12), a rua na frente dela e o caminho para a esquerda.
    """
    s.stamp(0, 0, CE, 20, 4, 22, 15)


MAPS = {
    # id: (largura, altura, montagem)
    'vila':       (36, 28, build_vila),
    'casa_1f':    (13, 10, build_casa_1f),
    'casa_2f':    (12, 9, build_casa_2f),
    'centro':     (16, 11, build_centro),
    'pokedoll':   (13, 12, build_pokedoll),
    'lab':        (13, 14, build_lab),
    'cabana':     (11, 9, build_cabana),
    'casa_sabio': (13, 11, build_casa_sabio),
    # os palcos das cenas (0.39): lugares fora da vila, só para as cenas de antes e depois das fases
    'ginasio_pewter': (13, 16, build_ginasio_pewter),
    'ginasio_cerulean': (17, 20, build_ginasio_cerulean),
    'cerulean': (22, 15, build_cerulean),
    'ginasio_vermilion': (11, 21, build_ginasio_vermilion),
    'vermilion': (26, 18, build_vermilion),
    'usina': (49, 40, build_usina),
    'usina_fundo': (15, 11, build_usina_fundo),
    # a mesma sala com a luz de volta, depois da missão do Zapdos (H-6)
    'usina_luz': (15, 11, build_usina_fundo),
}
SOURCES = [P, V, R, F, CE, FU, IP, DS4, DS1, PH1, PH2, LAB, HOUSE1, WARDEN, COPYCAT, GYM1, GYM2, GYM3, VE, PP]


# ============================ os móveis do quarto ============================

# Peças soltas para o quarto decorável (data/decor.js diz onde cada uma fica e o
# preço). Cada uma sai sem o piso de origem (recortado pelo tile de fundo), para
# assentar no chão do quarto; a colisão vem do mapa de origem.
#   id: (mapa, x, y, largura, altura, tile de fundo a recortar)
DECOR_PIECES = {
    'pc_mesa': (PH2, 1, 1, 2, 2, (9, 6)),        # a mesa com o PC
    'estante': (PH2, 4, 1, 2, 2, (9, 6)),        # a estante verde
    'tapete':  (PH2, 4, 4, 5, 4, (9, 6)),        # o tapete com a TV e o videogame
    'planta':  (COPYCAT, 11, 5, 1, 2, (9, 6)),   # o vaso da casa do Copycat
}


def export_decor(sources):
    pieces = {}
    for key, (m, sx, sy, w, h, ground) in DECOR_PIECES.items():
        scene = Scene(sources, w, h)
        scene.stamp_keyed(0, 0, m, sx, sy, w, h, *ground)
        base, top = scene.images(background=(0, 0, 0, 0))
        folder = ASSETS / 'decor'
        folder.mkdir(parents=True, exist_ok=True)
        base.save(folder / f'{key}.png', optimize=True)
        top.save(folder / f'{key}-top.png', optimize=True)
        src = sources[m]
        solid = [[i, j] for j in range(h) for i in range(w) if not src.cell(sx + i, sy + j)[2]]
        pieces[key] = {'src': f'assets/hub/decor/{key}.png', 'top': f'assets/hub/decor/{key}-top.png',
                       'width': w, 'height': h, 'solid': solid}
    return pieces


# ============================== os personagens ==============================

# id: (arquivo em graphics/object_events/pics, paleta, largura e altura do quadro)
# A paleta é o paletteTag de src/data/object_events/object_event_graphics_info.h.
SPRITES = {
    'prof_oak':    ('people/prof_oak', 'npc_white', 16, 32),
    'mom':         ('people/mom', 'npc_blue', 16, 32),
    'nurse':       ('people/nurse', 'npc_pink', 16, 32),
    'clerk':       ('people/clerk', 'npc_white', 16, 32),
    'beauty':      ('people/beauty', 'npc_blue', 16, 32),
    'old_man_1':   ('people/old_man_1', 'npc_pink', 16, 32),
    'woman_1':     ('people/woman_1', 'npc_green', 16, 32),
    'fisher':      ('people/fisher', 'npc_white', 16, 32),
    'youngster':   ('people/youngster', 'npc_blue', 16, 32),
    'gentleman':   ('people/gentleman', 'npc_white', 16, 32),
    'little_girl': ('people/little_girl', 'npc_pink', 16, 16),
    'lass':        ('people/lass', 'npc_blue', 16, 32),
    'scientist':   ('people/scientist', 'npc_white', 16, 32),
    'worker_f':    ('people/worker_f', 'npc_green', 16, 32),
    # o rival (0.39, PLANEJAMENTO-HISTORIA.md seção 9.3): o Blue do FireRed
    'rival':       ('people/blue', 'npc_green', 16, 32),
    # os líderes, para as cenas de depois das fases (0.39)
    'brock':       ('people/brock', 'npc_green', 16, 32),
    'misty':       ('people/misty', 'npc_blue', 16, 32),
    # a casa assaltada de Cerulean (0.39)
    'policeman':   ('people/policeman', 'npc_blue', 16, 32),
    'old_man_2':   ('people/old_man_2', 'npc_white', 16, 32),
    # Vermilion e a Usina (0.39)
    'lt_surge':    ('people/lt_surge', 'npc_green', 16, 32),
    'sailor':      ('people/sailor', 'npc_pink', 16, 32),
    'voltorb':     ('pokemon/voltorb', 'npc_white', 16, 16),
    # o Zapdos do FireRed (o da Power Plant), na cena de depois da missão (H-6)
    'zapdos':      ('pokemon/zapdos', 'npc_blue', 32, 32),
    'meowth':      ('pokemon/meowth', 'npc_blue', 16, 16),
    'clefairy':    ('pokemon/clefairy', 'npc_pink', 16, 16),
    'pidgey':      ('pokemon/pidgey', 'npc_blue', 16, 16),
    'pikachu':     ('pokemon/pikachu', 'npc_blue', 16, 16),
    'jigglypuff':  ('pokemon/jigglypuff', 'npc_pink', 16, 16),
    'item_ball':   ('misc/item_ball', 'npc_white', 16, 16),
    'lapras_doll': ('misc/lapras_doll', 'npc_pink', 32, 32),
}


# os desenhos em pixel que o FireRed não tem (0.39): cada letra é uma cor da paleta
DRAWN = {
    # os olhos do Zapdos no escuro: dois olhos bravos, inclinados para dentro
    'olhos_zapdos': (40, 16, {
        'D': (110, 0, 0, 255), 'R': (220, 24, 24, 255), 'B': (255, 96, 64, 255), 'C': (255, 236, 170, 255),
    }, None),
    # a escotilha de metal com a escada de mão, nas cores da Usina
    'escotilha': (16, 16, {
        'K': (70, 70, 86, 255), 'L': (190, 190, 204, 255), 'Y': (232, 192, 64, 255),
        'X': (16, 16, 24, 255), 'R': (150, 150, 168, 255),
    }, [
        '................',
        '.KKKKKKKKKKKKKK.',
        '.KYYLLLLLLLLYYK.',
        '.KYXXXXXXXXXXYK.',
        '.KLXRXXXXXXRXLK.',
        '.KLXRRRRRRRRXLK.',
        '.KLXRXXXXXXRXLK.',
        '.KLXRXXXXXXRXLK.',
        '.KLXRRRRRRRRXLK.',
        '.KLXRXXXXXXRXLK.',
        '.KLXRXXXXXXRXLK.',
        '.KLXRRRRRRRRXLK.',
        '.KYXXXXXXXXXXYK.',
        '.KYYLLLLLLLLYYK.',
        '.KKKKKKKKKKKKKK.',
        '................',
    ]),
    # a máquina do emblema vermelho que prende o Zapdos (H-6): duas bobinas, o console com o
    # emblema e a base com a faixa de aviso; e a mesma máquina destruída, depois da luta
    'maquina_zapdos': (64, 48, {
        'K': (34, 34, 46, 255), 'G': (70, 72, 88, 255), 'M': (112, 116, 136, 255), 'L': (168, 174, 192, 255),
        'W': (226, 230, 240, 255), 'R': (206, 34, 34, 255), 'D': (112, 10, 14, 255), 'Y': (232, 192, 64, 255),
        'B': (16, 16, 22, 255), 'E': (255, 232, 96, 255), 'O': (255, 132, 40, 255),
    }, lambda: _machine_rows(False)),
    'maquina_zapdos_quebrada': (64, 48, {
        'K': (34, 34, 46, 255), 'G': (70, 72, 88, 255), 'M': (112, 116, 136, 255), 'L': (168, 174, 192, 255),
        'W': (226, 230, 240, 255), 'R': (206, 34, 34, 255), 'D': (112, 10, 14, 255), 'Y': (232, 192, 64, 255),
        'B': (16, 16, 22, 255), 'E': (255, 232, 96, 255), 'O': (255, 132, 40, 255),
    }, lambda: _machine_rows(True)),
}

# o emblema vermelho (um escudo com um pico escuro): ninguém reconhece; é o do uniforme do Maxie
EMBLEM = [
    '...RRRRR...',
    '.RRRRRRRRR.',
    'RRRRRDRRRRR',
    'RRRRDDDRRRR',
    'RRRDDDDDRRR',
    'RRDDDRDDDRR',
    'RDDDRRRDDDR',
    '.RRRRRRRRR.',
    '..RRRRRRR..',
    '....RRR....',
]


def _machine_rows(broken):
    """A máquina de 64x48 em pixel: as bobinas dos lados, o console no meio e a base."""
    g = [['.'] * 64 for _ in range(48)]

    def rect(x0, y0, x1, y1, ch):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                g[y][x] = ch

    def box(x0, y0, x1, y1, fill):
        rect(x0, y0, x1, y1, 'K')
        rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1, fill)

    # a base, com a faixa de aviso amarela e preta
    box(0, 37, 63, 47, 'G')
    rect(1, 38, 62, 38, 'L')
    for x in range(2, 62):
        rect(x, 42, x, 44, 'Y' if (x // 3) % 2 == 0 else 'B')
    # as bobinas (os anéis acendem; na quebrada, a da direita partiu no meio)
    for x0 in (3, 50):
        top = 4 if not (broken and x0 == 50) else 20
        box(x0, top, x0 + 10, 38, 'M')
        rect(x0 + 1, top + 1, x0 + 2, 37, 'L')
        for y in range(top + 4, 36, 4):
            rect(x0 + 1, y, x0 + 9, y + 1, 'G' if broken else 'E')
            rect(x0 + 1, y, x0 + 1, y + 1, 'K')
        # o anel de cima, onde a corrente se prende
        if not (broken and x0 == 50):
            box(x0 + 2, 0, x0 + 8, 5, 'K')
            rect(x0 + 4, 2, x0 + 6, 3, 'B' if broken else 'W')
        else:
            for i, x in enumerate(range(x0, x0 + 11)):
                g[top - (i % 3)][x] = 'K'
    # o console, com o emblema no meio e as luzes dos lados
    box(17, 17, 46, 38, 'M')
    rect(18, 18, 45, 18, 'W')
    rect(18, 19, 45, 19, 'L')
    box(21, 21, 42, 36, 'G')
    for j, line in enumerate(EMBLEM):
        for i, ch in enumerate(line):
            if ch != '.':
                g[24 + j][26 + i] = ch
    for y in (23, 27, 31):
        g[y][19] = 'G' if broken else 'R'
        g[y][44] = 'G' if broken else 'E'
    # os cabos das bobinas até o console
    for x in range(14, 17):
        rect(x, 28, x, 30, 'B')
    for x in range(47, 50):
        rect(x, 28, x, 30, 'B')
    if broken:
        # a rachadura atravessando o emblema e as marcas de queimado
        for i in range(14):
            x, y = 24 + i, 22 + i
            g[y][x] = 'B'
            if i % 3 == 0:
                g[y][x + 1] = 'B'
        for x, y in ((6, 12), (7, 13), (20, 33), (40, 23), (41, 24), (12, 40), (30, 45)):
            g[y][x] = 'B'
        rect(52, 21, 58, 22, 'O')
    return [''.join(r) for r in g]

EYE = [
    'DDD..........',
    'DRRRDD.......',
    '.DRRRRRDD....',
    '..DRBBBRRRD..',
    '...DRBCCBRRRD',
    '.....DDDDDDDD',
]


def _eyes_rows():
    """Os dois olhos na folha de 40x16: o esquerdo e o direito espelhado, com 2 pixels entre eles."""
    rows = [['.'] * 40 for _ in range(16)]
    for j, line in enumerate(EYE):
        for i, ch in enumerate(line):
            rows[6 + j][6 + i] = ch
            rows[6 + j][33 - i] = ch
    return [''.join(r) for r in rows]


def export_drawn(catalog):
    for key, (w, h, pal, rows) in DRAWN.items():
        rows = rows() if callable(rows) else rows or _eyes_rows()
        image = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        for y, line in enumerate(rows):
            for x, ch in enumerate(line):
                if ch in pal:
                    image.putpixel((x, y), pal[ch])
        path = ASSETS / 'npc' / f'{key}.png'
        image.save(path, optimize=True)
        catalog[f'npc/{key}'] = {'src': path.relative_to(ROOT).as_posix(), 'frameWidth': w, 'frameHeight': h, 'frames': 1}


def export_sprites(decomp, catalog):
    pics = decomp / 'graphics' / 'object_events' / 'pics'
    palettes = decomp / 'graphics' / 'object_events' / 'palettes'
    for key, (pic, pal, fw, fh) in SPRITES.items():
        sheet = paint(pics / f'{pic}.png', read_pal(palettes / f'{pal}.pal'))
        path = ASSETS / 'npc' / f'{key}.png'
        path.parent.mkdir(parents=True, exist_ok=True)
        sheet.save(path, optimize=True)
        catalog[f'npc/{key}'] = {'src': path.relative_to(ROOT).as_posix(), 'frameWidth': fw,
                                 'frameHeight': fh, 'frames': sheet.width // fw}


# ================================== saída ==================================

def write_js(maps, sprites, decor):
    lines = [
        '/**',
        ' * MAPAS DA VILA — gerado por tools/assets/hub.py. Não edite à mão: rode o',
        ' * gerador de novo. Portas, pessoas e falas ficam em src/data/hub.js.',
        ' *',
        ' * Cada mapa tem o chão (`src`), o que fica por cima dos personagens (`top`)',
        ' * e a colisão, uma linha por fileira de tiles: "." anda, "#" bloqueia.',
        ' */',
        'export const HUB_MAPS = {',
    ]
    for key, m in maps.items():
        lines.append(f"  {key}: {{")
        lines.append(f"    src: '{m['src']}', top: '{m['top']}', width: {m['width']}, height: {m['height']},")
        lines.append('    walk: [')
        lines += [f"      '{row}'," for row in m['walk']]
        lines[-1] = lines[-1].rstrip(',')
        lines.append('    ]')
        lines.append('  },')
    lines[-1] = '  }'
    lines += ['};', '', '/** As folhas dos personagens e objetos da vila (tiras de quadros, em 1x). */',
              'export const HUB_SPRITES = {']
    for key in sorted(sprites):
        e = sprites[key]
        lines.append(f"  '{key}': {{ src: '{e['src']}', frameWidth: {e['frameWidth']}, "
                     f"frameHeight: {e['frameHeight']}, frames: {e['frames']} }},")
    lines[-1] = lines[-1].rstrip(',')
    lines += ['};', '', '/** Os móveis do quarto (data/decor.js): o chão, a camada de cima e as células que bloqueiam. */',
              'export const HUB_DECOR = {']
    for key, piece in decor.items():
        solid = ', '.join(f'[{x}, {y}]' for x, y in piece['solid'])
        lines.append(f"  {key}: {{ src: '{piece['src']}', top: '{piece['top']}', width: {piece['width']}, "
                     f"height: {piece['height']}, solid: [{solid}] }},")
    lines[-1] = lines[-1].rstrip(',')
    lines.append('};')
    HUB_MAPS_JS.write_text('\n'.join(lines) + '\n', encoding='utf-8')


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description='Monta os mapas da vila a partir do Pokemon All.')
    parser.add_argument('--fonte', type=Path, default=ROOT.parent / 'Pokemon All',
                        help='pasta do Pokemon All (padrão: ao lado deste repositório)')
    args = parser.parse_args()
    decomp = args.fonte / 'extracted' / 'pokefirered'
    if not decomp.is_dir():
        sys.exit(f'Não achei o decomp em {decomp}. Passe o caminho do Pokemon All com --fonte.')

    layouts = {l['name']: l for l in json.loads((decomp / 'data/layouts/layouts.json').read_text())['layouts'] if l}
    sources = {name: Source(decomp, layouts, name) for name in SOURCES}
    ASSETS.mkdir(parents=True, exist_ok=True)

    maps = {}
    for key, (w, h, build) in MAPS.items():
        scene = Scene(sources, w, h)
        build(scene)
        base, top = scene.images()
        base.save(ASSETS / f'{key}.png', optimize=True)
        top.save(ASSETS / f'{key}-top.png', optimize=True)
        maps[key] = {
            'src': f'assets/hub/{key}.png', 'top': f'assets/hub/{key}-top.png', 'width': w, 'height': h,
            'walk': [''.join('.' if scene.walk[y][x] else '#' for x in range(w)) for y in range(h)],
        }
        print(f'  {key}: {w}x{h}')

    sprites = {}
    export_sprites(decomp, sprites)
    export_drawn(sprites)
    # a Ultra Ball do card das missões de lendário (0.39), dos itens do Pokemon All; na luta do
    # Zapdos (H-6) ela cai no campo e balança na faixa da captura
    ball = args.fonte / 'assets' / 'items' / 'default' / 'ultra-ball.png'
    if ball.exists():
        Image.open(ball).convert('RGBA').save(ROOT / 'assets' / 'items' / 'ultra-ball.png', optimize=True)
    with Image.open(ROOT / 'assets' / 'items' / 'ultra-ball.png') as im:
        sprites['item/ultra-ball'] = {'src': 'assets/items/ultra-ball.png', 'frameWidth': im.width, 'frameHeight': im.height, 'frames': 1}
    # o grito do Zapdos (H-6), do Pokemon All, como o do Kyogre
    cry = args.fonte / 'assets' / 'sound' / 'cries' / '145.ogg'
    if cry.exists():
        (ROOT / 'assets' / 'sound' / 'cries').mkdir(parents=True, exist_ok=True)
        (ROOT / 'assets' / 'sound' / 'cries' / '145.ogg').write_bytes(cry.read_bytes())
    decor = export_decor(sources)
    write_js(maps, sprites, decor)
    print(f'{len(maps)} mapas, {len(sprites)} folhas e {len(decor)} móveis; catálogo em {HUB_MAPS_JS.relative_to(ROOT).as_posix()}')


if __name__ == '__main__':
    main()
