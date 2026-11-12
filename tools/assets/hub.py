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
(paredes, árvores, cercas, portas) e a elevação 1 (água, só com Surf). Nos
mapas com patamares (as Ilhas Seafoam, H-7), sai também a altura de cada tile
(`levels`): o FireRed só deixa passar de uma altura para outra por um tile de
altura 0 (as escadinhas), e a vila faz igual (data/hub.js, `heightOk`). Nos mapas
com degraus de pular (o Monte Brasa, H-8), sai `ledges`: a direção do pulo de cada
degrau (o comportamento MB_JUMP_* do metatile), que só se atravessa naquele sentido.
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
        self.elev = [[0] * w for _ in range(h)]   # a altura de cada tile (os patamares de Seafoam)
        self.behavior = [[0] * w for _ in range(h)]   # o comportamento do metatile (os degraus de pular)

    def _put(self, dx, dy, cell):
        if 0 <= dx < self.w and 0 <= dy < self.h:
            self.base[dy][dx], self.top[dy][dx], self.walk[dy][dx] = cell

    def stamp(self, dx, dy, m, sx, sy, w=1, h=1):
        """Copia um retângulo do mapa `m`, com colisão e tudo."""
        src = self.sources[m]
        for j in range(h):
            for i in range(w):
                self._put(dx + i, dy + j, src.cell(sx + i, sy + j))
                if 0 <= dx + i < self.w and 0 <= dy + j < self.h:
                    self.elev[dy + j][dx + i] = src.cells[sy + j][sx + i] >> 12
                    self.behavior[dy + j][dx + i] = src.layers.attrs[src.cells[sy + j][sx + i] & 0x3FF] & 0x1FF

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


GYM4 = 'CeladonCity_Gym'
GYM7 = 'CinnabarIsland_Gym'
GYM8 = 'ViridianCity_Gym'
EMBER = ['MtEmber_Exterior', 'MtEmber_SummitPath_1F', 'MtEmber_SummitPath_2F', 'MtEmber_SummitPath_3F', 'MtEmber_Summit']
SEAFOAM = ['SeafoamIslands_1F', 'SeafoamIslands_B1F', 'SeafoamIslands_B2F', 'SeafoamIslands_B3F', 'SeafoamIslands_B4F']
MANSION = ['PokemonMansion_1F', 'PokemonMansion_2F', 'PokemonMansion_3F', 'PokemonMansion_B1F']
ROUTE23 = 'Route23'

# Os interruptores da Mansão Pokémon (H-9): as barreiras que a estátua troca, do script do pret
# (data/scripts/pokemon_mansion.inc, copiado em tools/assets/pret/; o decomp do Pokemon All não
# traz os scripts comuns). `setmetatile x, y, METATILE, colisão` de cada andar, no estado apertado.
MANSION_SCRIPT = Path(__file__).resolve().parent / 'pret' / 'pokemon_mansion.inc'


def mansion_switch(decomp):
    import re
    labels = {m.group(1): int(m.group(2), 16) for m in re.finditer(
        r'#define\s+(METATILE_\w+)\s+(0x[0-9A-Fa-f]+)', (decomp / 'include/constants/metatile_labels.h').read_text())}
    text = MANSION_SCRIPT.read_text()
    press = {}
    for blk in re.finditer(r'PokemonMansion_EventScript_PressSwitch_(\w+)::\n(.*?)\treturn', text, re.S):
        press['PokemonMansion_' + blk.group(1)] = [
            (int(x), int(y), labels[mt], int(c)) for x, y, mt, c in
            re.findall(r'setmetatile\s+(\d+),\s*(\d+),\s*(METATILE_\w+),\s*(\d)', blk.group(2))]
    return press


def build_ginasio_celadon(s):
    """O ginásio da Erika, inteiro: o palco da cena do emblema, depois da Fase 4 (H-4)."""
    s.stamp(0, 0, GYM4, 0, 0, 13, 20)


def build_ginasio_cinnabar(s):
    """
    A sala do Blaine no ginásio de Cinnabar (H-7, o recorte da maquete aprovada): o palco da cena
    das ondas, depois da Fase 7. O Blaine fica em 5,4, como no FireRed.
    """
    s.stamp(0, 0, GYM7, 0, 0, 15, 10)


def build_ginasio_viridian(s):
    """
    A sala do Giovanni no ginásio de Viridian (H-8, o recorte da maquete): o palco da cena do
    emblema, depois da Fase 8. O Giovanni fica em 2,2, como no FireRed.
    """
    s.stamp(0, 0, GYM8, 0, 0, 15, 10)


def ember(name):
    """
    Um mapa do Monte Brasa, inteiro (H-8): a encosta, o caminho do cume (três andares) e o cume. O
    jogador sobe a pé, só por onde o FireRed deixa; as pedras do Strength do caminho já foram
    empurradas para o lado (os enfeites de data/hub.js), e os degraus de pular só descem.
    """
    def build(s):
        s.stamp(0, 0, name, 0, 0, s.w, s.h)
    return build


def seafoam(floor):
    """
    Um andar das Ilhas Seafoam, inteiro (H-7, como a Usina): o jogador desce a pé, só por onde o
    FireRed deixa, com a regra de altura dos patamares (o `levels` do mapa). Sem Surf e sem
    empurrar pedra, há caminho: dois buracos no chão e duas escadas até a margem do fundo.
    """
    def build(s):
        s.stamp(0, 0, floor, 0, 0, s.w, s.h)
    return build


def mansion(floor):
    """
    Um andar da Mansão Pokémon de Cinnabar, inteiro (H-9, a base do Maxie): o jogador anda a pé,
    só por onde o FireRed deixa. As estátuas viram o interruptor, que troca as barreiras dos quatro
    andares de uma vez; cada andar sai nos dois estados (`walkOn`, `srcOn` e `topOn`).
    """
    def build(s):
        s.stamp(0, 0, floor, 0, 0, s.w, s.h)
    return build


def build_rota23(s):
    """
    A porta da Victory Road (H-9): o recorte da Rota 23 com o último guarda das insígnias (6,8 no
    recorte, 6,35 no mapa) e a entrada da caverna (5,1). O palco da cena da Elite dos Quatro.
    """
    s.stamp(0, 0, ROUTE23, 0, 27, 15, 10)


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
    'ginasio_celadon': (13, 20, build_ginasio_celadon),
    'vermilion': (26, 18, build_vermilion),
    'usina': (49, 40, build_usina),
    'usina_fundo': (15, 11, build_usina_fundo),
    # a mesma sala com a luz de volta, depois da missão do Zapdos (H-6)
    'usina_luz': (15, 11, build_usina_fundo),
    # o Capítulo 4, as ondas (H-7): a sala do Blaine e os cinco andares das Ilhas Seafoam
    'ginasio_cinnabar': (15, 10, build_ginasio_cinnabar),
    'seafoam_1f': (38, 24, seafoam(SEAFOAM[0])),
    'seafoam_b1f': (38, 23, seafoam(SEAFOAM[1])),
    'seafoam_b2f': (38, 24, seafoam(SEAFOAM[2])),
    'seafoam_b3f': (38, 24, seafoam(SEAFOAM[3])),
    'seafoam_b4f': (38, 24, seafoam(SEAFOAM[4])),
    # o Capítulo 5 (H-8): a sala do Giovanni e o Monte Brasa
    'ginasio_viridian': (15, 10, build_ginasio_viridian),
    'brasa_encosta': (57, 54, ember(EMBER[0])),
    'brasa_caminho_1f': (15, 18, ember(EMBER[1])),
    'brasa_caminho_2f': (48, 46, ember(EMBER[2])),
    'brasa_caminho_3f': (15, 11, ember(EMBER[3])),
    'brasa_cume': (19, 22, ember(EMBER[4])),
    # o Capítulo 6 (H-9): a porta da Victory Road e a Mansão Pokémon, a base do Maxie
    'rota23_portao': (15, 10, build_rota23),
    'mansao_1f': (38, 35, mansion(MANSION[0])),
    'mansao_2f': (38, 38, mansion(MANSION[1])),
    'mansao_3f': (38, 35, mansion(MANSION[2])),
    'mansao_b1f': (38, 35, mansion(MANSION[3])),
}
BRASA = {'brasa_encosta', 'brasa_caminho_1f', 'brasa_caminho_2f', 'brasa_caminho_3f', 'brasa_cume'}
# os mapas que levam a altura de cada tile (a regra dos patamares, H-7) e os degraus de pular (H-8)
HEIGHT_MAPS = {'seafoam_1f', 'seafoam_b1f', 'seafoam_b2f', 'seafoam_b3f', 'seafoam_b4f'} | BRASA
LEDGE_MAPS = BRASA
# os andares com o interruptor das estátuas: o mapa do lobby e o do FireRed
SWITCH_MAPS = {'mansao_1f': MANSION[0], 'mansao_2f': MANSION[1], 'mansao_3f': MANSION[2], 'mansao_b1f': MANSION[3]}
# o comportamento do metatile (MB_JUMP_*) e a letra de cada sentido
JUMP_BEHAVIOR = {0x38: '>', 0x39: '<', 0x3A: '^', 0x3B: 'v'}
SOURCES = [P, V, R, F, CE, FU, IP, DS4, DS1, PH1, PH2, LAB, HOUSE1, WARDEN, COPYCAT, GYM1, GYM2, GYM3, VE, PP, GYM4, GYM7, *SEAFOAM,
           GYM8, *EMBER, *MANSION, ROUTE23]


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
    'erika':       ('people/erika', 'npc_blue', 16, 32),
    # a casa assaltada de Cerulean (0.39)
    'policeman':   ('people/policeman', 'npc_blue', 16, 32),
    'old_man_2':   ('people/old_man_2', 'npc_white', 16, 32),
    # Vermilion e a Usina (0.39)
    'lt_surge':    ('people/lt_surge', 'npc_green', 16, 32),
    'sailor':      ('people/sailor', 'npc_pink', 16, 32),
    'voltorb':     ('pokemon/voltorb', 'npc_white', 16, 16),
    # o Zapdos do FireRed (o da Power Plant), na cena de depois da missão (H-6)
    'zapdos':      ('pokemon/zapdos', 'npc_blue', 32, 32),
    # o Capítulo 4 (H-7): o Blaine, o Articuno do FireRed (o de Seafoam) e as pedras do Strength
    'blaine':      ('people/blaine', 'npc_pink', 16, 32),
    'articuno':    ('pokemon/articuno', 'npc_pink', 32, 32),
    'pedra':       ('misc/strength_boulder', 'npc_white', 16, 16),
    # o Capítulo 5 (H-8): o Giovanni, o Moltres do FireRed, o Hiker, os recrutas da Rocket e as
    # pedras de quebrar (Rock Smash) do Monte Brasa
    'giovanni':    ('people/giovanni', 'npc_white', 16, 32),
    'moltres':     ('pokemon/moltres', 'npc_blue', 32, 32),
    'hiker':       ('people/hiker', 'npc_white', 16, 32),
    'rocket':      ('people/rocket_m', 'npc_white', 16, 32),
    'rocha':       ('misc/rock_smash_rock', 'npc_white', 16, 16),
    # o Capítulo 6 (H-9): a Elite dos Quatro e o Blaine na porta da Mansão
    'lorelei':     ('people/lorelei', 'npc_white', 16, 32),
    'bruno':       ('people/bruno', 'npc_white', 16, 32),
    'agatha':      ('people/agatha', 'npc_pink', 16, 32),
    'lance':       ('people/lance', 'npc_white', 16, 32),
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
    # o pedaço de metal com o emblema que a Erika achou no jardim (H-4): uma placa retorcida
    'pedaco_metal': (24, 20, {
        'K': (34, 34, 46, 255), 'G': (70, 72, 88, 255), 'M': (112, 116, 136, 255), 'L': (168, 174, 192, 255),
        'R': (206, 34, 34, 255), 'D': (112, 10, 14, 255), 'B': (16, 16, 22, 255),
    }, lambda: _metal_rows()),
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


def _metal_rows():
    """O pedaço de metal de 24x20: a placa retorcida (o contorno escuro, o brilho, os amassados) e o emblema."""
    from PIL import ImageDraw
    mask = Image.new('L', (24, 20))
    ImageDraw.Draw(mask).polygon([(3, 2), (20, 1), (22, 6), (21, 17), (12, 18), (2, 16), (1, 8)], fill=255)
    g = [['M' if mask.getpixel((x, y)) else '.' for x in range(24)] for y in range(20)]
    for y in range(20):
        for x in range(24):
            if g[y][x] == 'M' and any(not (0 <= x + dx < 24 and 0 <= y + dy < 20) or g[y + dy][x + dx] == '.'
                                      for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                g[y][x] = 'K'
    for x in range(5, 19):
        if g[3][x] == 'M':
            g[3][x] = 'L'
    for x, y in ((4, 6), (5, 6), (19, 13), (18, 14), (7, 15)):
        if g[y][x] == 'M':
            g[y][x] = 'G'
    for x, y in ((3, 4), (20, 9), (16, 16)):
        if g[y][x] == 'M':
            g[y][x] = 'B'
    for j, line in enumerate(EMBLEM):
        for i, ch in enumerate(line):
            if ch != '.':
                g[5 + j][6 + i] = ch
    return [''.join(r) for r in g]


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


# a máquina do emblema vermelho coberta de gelo (H-7, a de Seafoam): a mesma da Usina, com geada no
# alto de cada peça e pingentes embaixo (o desenho da maquete aprovada). A da vila leva as correntes
# que prendem o Articuno (ele fica por cima, em data/hub.js); a quebrada, só os pedaços
FROST = [(236, 246, 255, 255), (196, 226, 250, 255), (150, 200, 240, 255)]
CHAIN = (60, 65, 82, 255)


def _frosted(src, chains):
    import random
    rng = random.Random(7)
    im = Image.open(src).convert('RGBA')
    w, h = im.size
    px = im.load()

    def solid(x, y):
        return 0 <= x < w and 0 <= y < h and px[x, y][3] > 0
    ice = im.copy()
    ip = ice.load()
    for y in range(h):
        for x in range(w):
            if not solid(x, y):
                continue
            # a borda de cima de cada peça vira geada
            if not solid(x, y - 1) or (not solid(x, y - 2) and rng.random() < 0.55):
                ip[x, y] = FROST[0] if rng.random() < 0.6 else FROST[1]
            elif rng.random() < 0.06:
                ip[x, y] = FROST[1]
    # os pingentes: embaixo das beiradas, de 1 a 4 px
    for x in range(w):
        for y in range(h - 1):
            if solid(x, y) and not solid(x, y + 1) and rng.random() < 0.28:
                for k in range(1, rng.randint(2, 5)):
                    if y + k < h and not solid(x, y + k):
                        ip[x, y + k] = FROST[2] if k > 1 else FROST[1]
    if chains:
        # as quatro correntes, das bobinas e do console até o Articuno (no meio de cima da máquina)
        from PIL import ImageDraw
        d = ImageDraw.Draw(ice)
        for sx, sy in ((10, 6), (54, 6), (26, 30), (38, 30)):
            d.line([(sx, sy), (32, 14)], fill=CHAIN, width=1)
    return ice


def export_frosted(catalog):
    # a inteira sem as correntes vai para a luta (render/articunoFight.js desenha as correntes até ele)
    for key, (base, chains) in {'maquina_articuno': ('maquina_zapdos', False),
                                'maquina_articuno_correntes': ('maquina_zapdos', True),
                                'maquina_articuno_quebrada': ('maquina_zapdos_quebrada', False)}.items():
        path = ASSETS / 'npc' / f'{key}.png'
        _frosted(ASSETS / 'npc' / f'{base}.png', chains).save(path, optimize=True)
        catalog[f'npc/{key}'] = {'src': path.relative_to(ROOT).as_posix(), 'frameWidth': 64, 'frameHeight': 48, 'frames': 1}


# a máquina do emblema vermelho em brasa (H-8, a do Monte Brasa): a mesma da Usina, com o metal
# esquentado (os claros puxam para o laranja), as fendas que brilham e a fuligem embaixo; a da vila
# leva as correntes até o Moltres, a da luta não (render/moltresFight.js desenha as correntes)
def _heated(src, broken, chains):
    import random
    from PIL import ImageDraw
    rng = random.Random(11)
    im = Image.open(src).convert('RGBA')
    w, h = im.size
    px = im.load()
    hot = im.copy()
    hp = hot.load()
    k = 0.35 if broken else 0.55
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if not a:
                continue
            lum = (r + g + b) / 3
            hp[x, y] = (min(255, int(r + (255 - r) * k * lum / 255 + 30 * k)), int(g * (1 - 0.25 * k)), int(b * (1 - 0.6 * k)), a)
            if y > h - 10 and rng.random() < 0.25:
                hp[x, y] = (40, 30, 28, a)
    d = ImageDraw.Draw(hot)
    for _ in range(5 if broken else 14):
        x, y = rng.randrange(4, w - 4), rng.randrange(6, h - 8)
        if not px[x, y][3]:
            continue
        pts = [(x, y)]
        for _ in range(rng.randint(2, 4)):
            x += rng.choice((-1, 0, 1))
            y += 1
            pts.append((x, y))
        d.line(pts, fill=(200, 90, 40, 255) if broken else (255, 196, 60, 255), width=1)
    if chains:
        for sx, sy in ((10, 6), (54, 6), (26, 30), (38, 30)):
            d.line([(sx, sy), (32, 14)], fill=CHAIN, width=1)
    return hot


def export_heated(catalog):
    for key, (base, broken, chains) in {'maquina_moltres': ('maquina_zapdos', False, False),
                                        'maquina_moltres_correntes': ('maquina_zapdos', False, True),
                                        'maquina_moltres_quebrada': ('maquina_zapdos_quebrada', True, False)}.items():
        path = ASSETS / 'npc' / f'{key}.png'
        _heated(ASSETS / 'npc' / f'{base}.png', broken, chains).save(path, optimize=True)
        catalog[f'npc/{key}'] = {'src': path.relative_to(ROOT).as_posix(), 'frameWidth': 64, 'frameHeight': 48, 'frames': 1}


def _psychic(src):
    """A máquina do Mewtwo: a do Moltres, com o laranja da brasa virando a luz roxa."""
    im = Image.open(src).convert('RGBA')
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a and r > g + 30 and r > b + 30:
                px[x, y] = (int(r * 0.62), int(g * 0.45), min(255, int(r * 0.95)), a)
    return im


def _cage(open_):
    from PIL import ImageDraw
    im = Image.new('RGBA', (20, 34), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 19, 2], fill=(58, 60, 72, 255))
    d.rectangle([0, 31, 19, 33], fill=(58, 60, 72, 255))
    for x in ((1, 17) if open_ else (1, 5, 9, 13, 17)):
        d.rectangle([x, 2, x + 1, 31], fill=(70, 74, 88, 255))
        d.point((x, 3), fill=(168, 176, 196, 255))
    return im


def _ice():
    from PIL import ImageDraw
    im = Image.new('RGBA', (20, 30), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 19, 29], fill=(190, 235, 255, 150), outline=(240, 252, 255, 230))
    d.line([(4, 4), (8, 10)], fill=(255, 255, 255, 230))
    d.line([(13, 18), (16, 23)], fill=(255, 255, 255, 200))
    return im


def _fire_row():
    from PIL import ImageDraw
    im = Image.new('RGBA', (48, 18), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for i, x in enumerate(range(0, 46, 7)):
        h = 11 + (i * 5) % 7
        d.polygon([(x, 17), (x + 3, 17 - h), (x + 7, 17)], fill=(255, 120, 40, 235))
        d.polygon([(x + 2, 17), (x + 3, 17 - h * 0.55), (x + 5, 17)], fill=(255, 230, 120, 255))
    return im


def _bolt():
    from PIL import ImageDraw
    im = Image.new('RGBA', (16, 112), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    pts, y, x, k = [(8, 0)], 0, 8, 0
    while y < 111:
        y += 14
        x = 4 if k % 2 else 12
        pts.append((x, min(y, 111)))
        k += 1
    d.line(pts, fill=(255, 240, 120, 255), width=4)
    d.line(pts, fill=(255, 255, 255, 255), width=1)
    return im


def _note():
    """O bilhete do Lance: uma folha com linhas e o L vermelho no canto."""
    from PIL import ImageDraw
    im = Image.new('RGBA', (36, 30), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 35, 29], fill=(246, 238, 214, 255), outline=(150, 130, 100, 255))
    for i in range(5):
        d.line([(4, 5 + i * 5), (31 - (i == 4) * 14, 5 + i * 5)], fill=(120, 110, 150, 255))
    d.line([(26, 22), (26, 26), (30, 26)], fill=(190, 40, 40, 255), width=1)
    return im


def export_base(catalog, emerald):
    """As peças da cena do subsolo da Mansão (H-9)."""
    out = {
        'maquina_mewtwo': _psychic(ASSETS / 'npc' / 'maquina_moltres.png'),
        'maquina_mewtwo_quebrada': _psychic(ASSETS / 'npc' / 'maquina_moltres_quebrada.png'),
        'jaula': _cage(False), 'jaula_aberta': _cage(True),
        'gelo': _ice(), 'fogo': _fire_row(), 'raio': _bolt(), 'bilhete': _note(),
    }
    icon = ROOT / 'assets' / 'pokemon' / 'gen3' / 'icons' / '150.png'
    out['mewtwo'] = Image.open(icon).convert('RGBA').crop((0, 0, 32, 32))   # o ícone do Gen 3: 32x32, como os pássaros
    magma = emerald / 'graphics' / 'object_events' / 'pics' / 'people' / 'team_magma' / 'magma_member_f.png'
    if magma.exists():
        # a capanga de capuz vermelho, do Emerald, com a paleta do próprio PNG (o índice 0 é o fundo)
        src = Image.open(magma)
        im = src.convert('RGBA')
        px, ix = im.load(), src.load()
        for y in range(src.height):
            for x in range(src.width):
                if ix[x, y] == 0:
                    px[x, y] = (0, 0, 0, 0)
        out['capanga'] = im
    for key, im in out.items():
        path = ASSETS / 'npc' / f'{key}.png'
        im.save(path, optimize=True)
        fw = {'maquina_mewtwo': 64, 'maquina_mewtwo_quebrada': 64, 'capanga': 16}.get(key, im.width)
        fh = {'maquina_mewtwo': 48, 'maquina_mewtwo_quebrada': 48, 'capanga': 32}.get(key, im.height)
        catalog[f'npc/{key}'] = {'src': path.relative_to(ROOT).as_posix(), 'frameWidth': fw, 'frameHeight': fh, 'frames': im.width // fw}


def export_emblem(catalog):
    """O emblema vermelho sozinho (H-8): a pista do vulcão, ampliado num quadro da cena de depois do Moltres."""
    pal = {'R': (206, 34, 34, 255), 'D': (112, 10, 14, 255)}
    im = Image.new('RGBA', (len(EMBLEM[0]), len(EMBLEM)), (0, 0, 0, 0))
    for y, row in enumerate(EMBLEM):
        for x, ch in enumerate(row):
            if ch in pal:
                im.putpixel((x, y), pal[ch])
    path = ASSETS / 'npc' / 'emblema.png'
    im.save(path, optimize=True)
    catalog['npc/emblema'] = {'src': path.relative_to(ROOT).as_posix(), 'frameWidth': im.width, 'frameHeight': im.height, 'frames': 1}


def export_readout(catalog):
    """
    A leitura dos instrumentos do Blaine (H-7, a cena das ondas): o monitor escuro com a grade e a
    linha verde com os pulsos que se repetem (o quadro da maquete aprovada), para o passo `item`.
    """
    from PIL import ImageDraw
    w, h = 48, 40
    im = Image.new('RGBA', (w, h), (13, 27, 38, 255))
    d = ImageDraw.Draw(im)
    for x in range(3, w - 2, 6):
        d.line([(x, 2), (x, h - 3)], fill=(34, 64, 58, 255))
    for y in range(4, h - 2, 6):
        d.line([(2, y), (w - 3, y)], fill=(34, 64, 58, 255))
    d.rectangle([0, 0, w - 1, h - 1], outline=(6, 12, 18, 255))
    base = 25
    pts = []
    for x in range(2, w - 2):
        phase = (x + 6) % 16
        spike = -round(14 * (1 - abs(phase - 7) / 3)) if 4 <= phase <= 10 else (1 if x % 3 == 0 else 0)
        pts.append((x, base + spike))
    d.line(pts, fill=(126, 240, 180, 255), width=1)
    path = ASSETS / 'npc' / 'leitura.png'
    im.save(path, optimize=True)
    catalog['npc/leitura'] = {'src': path.relative_to(ROOT).as_posix(), 'frameWidth': w, 'frameHeight': h, 'frames': 1}


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
        ' * e a colisão, uma linha por fileira de tiles: "." anda, "#" bloqueia. Nos mapas',
        ' * com patamares (Seafoam), `levels` é a altura de cada tile, em hexadecimal; nos',
        ' * com degraus de pular (o Monte Brasa), `ledges` é o sentido do pulo de cada degrau; nos',
        ' * com o interruptor das estátuas (a Mansão), `walkOn`, `srcOn` e `topOn` são o andar apertado.',
        ' */',
        'export const HUB_MAPS = {',
    ]
    for key, m in maps.items():
        lines.append(f"  {key}: {{")
        lines.append(f"    src: '{m['src']}', top: '{m['top']}', width: {m['width']}, height: {m['height']},")
        if 'srcOn' in m:
            lines.append(f"    srcOn: '{m['srcOn']}', topOn: '{m['topOn']}',")
        lines.append('    walk: [')
        lines += [f"      '{row}'," for row in m['walk']]
        lines[-1] = lines[-1].rstrip(',')
        if 'walkOn' in m:
            # o interruptor apertado (a Mansão, H-9): a mesma colisão com as barreiras trocadas
            lines.append('    ],')
            lines.append('    walkOn: [')
            lines += [f"      '{row}'," for row in m['walkOn']]
            lines[-1] = lines[-1].rstrip(',')
        if 'ledges' in m:
            # os degraus de pular, um caractere por tile: v ^ < > (o sentido do pulo); '.' nenhum
            lines.append('    ],')
            lines.append('    ledges: [')
            lines += [f"      '{row}'," for row in m['ledges']]
            lines[-1] = lines[-1].rstrip(',')
        if 'levels' in m:
            # a altura de cada tile, em hexadecimal (os patamares de Seafoam: 3 e 4; as escadinhas, 0)
            lines.append('    ],')
            lines.append('    levels: [')
            lines += [f"      '{row}'," for row in m['levels']]
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
    parser.add_argument('--emerald', type=Path, default=ROOT.parent / 'pokeemerald',
                        help='o clone do pokeemerald (a capanga de capuz vermelho da H-9)')
    args = parser.parse_args()
    decomp = args.fonte / 'extracted' / 'pokefirered'
    if not decomp.is_dir():
        sys.exit(f'Não achei o decomp em {decomp}. Passe o caminho do Pokemon All com --fonte.')

    layouts = {l['name']: l for l in json.loads((decomp / 'data/layouts/layouts.json').read_text())['layouts'] if l}
    sources = {name: Source(decomp, layouts, name) for name in SOURCES}
    press = mansion_switch(decomp)
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
        if key in LEDGE_MAPS:
            maps[key]['ledges'] = [''.join(JUMP_BEHAVIOR.get(scene.behavior[y][x], '.') for x in range(w)) for y in range(h)]
        if key in HEIGHT_MAPS:
            maps[key]['levels'] = [''.join('%x' % scene.elev[y][x] for x in range(w)) for y in range(h)]
        if key in SWITCH_MAPS:
            # o mesmo andar com o interruptor apertado (as barreiras trocadas, a colisão junto)
            src = sources[SWITCH_MAPS[key]]
            keep = [row[:] for row in src.cells]
            for x, y, mt, coll in press[SWITCH_MAPS[key]]:
                src.cells[y][x] = (src.cells[y][x] & 0xF000) | (0xC00 if coll else 0) | mt
            on = Scene(sources, w, h)
            build(on)
            src.cells = keep
            base_on, top_on = on.images()
            base_on.save(ASSETS / f'{key}-on.png', optimize=True)
            top_on.save(ASSETS / f'{key}-on-top.png', optimize=True)
            maps[key]['srcOn'] = f'assets/hub/{key}-on.png'
            maps[key]['topOn'] = f'assets/hub/{key}-on-top.png'
            maps[key]['walkOn'] = [''.join('.' if on.walk[y][x] else '#' for x in range(w)) for y in range(h)]
        print(f'  {key}: {w}x{h}')

    sprites = {}
    export_sprites(decomp, sprites)
    export_drawn(sprites)
    export_frosted(sprites)
    export_readout(sprites)
    export_heated(sprites)
    export_emblem(sprites)
    export_base(sprites, args.emerald)
    # a Ultra Ball do card das missões de lendário (0.39), dos itens do Pokemon All; na luta do
    # Zapdos (H-6) ela cai no campo e balança na faixa da captura
    ball = args.fonte / 'assets' / 'items' / 'default' / 'ultra-ball.png'
    if ball.exists():
        Image.open(ball).convert('RGBA').save(ROOT / 'assets' / 'items' / 'ultra-ball.png', optimize=True)
    with Image.open(ROOT / 'assets' / 'items' / 'ultra-ball.png') as im:
        sprites['item/ultra-ball'] = {'src': 'assets/items/ultra-ball.png', 'frameWidth': im.width, 'frameHeight': im.height, 'frames': 1}
    # os gritos do Zapdos (H-6), do Articuno (H-7) e do Moltres (H-8), do Pokemon All, como o do Kyogre
    for dex in (145, 144, 146):
        cry = args.fonte / 'assets' / 'sound' / 'cries' / f'{dex}.ogg'
        if cry.exists():
            (ROOT / 'assets' / 'sound' / 'cries').mkdir(parents=True, exist_ok=True)
            (ROOT / 'assets' / 'sound' / 'cries' / f'{dex}.ogg').write_bytes(cry.read_bytes())
    decor = export_decor(sources)
    write_js(maps, sprites, decor)
    print(f'{len(maps)} mapas, {len(sprites)} folhas e {len(decor)} móveis; catálogo em {HUB_MAPS_JS.relative_to(ROOT).as_posix()}')


if __name__ == '__main__':
    main()
