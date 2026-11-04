"""
EXTRATOR DE ASSETS

Gera os sprites do jogo a partir do Pokemon All (o outro projeto do Fellipe),
que guarda o decomp pret/pokefirered em `extracted/pokefirered`.

O Pokemon All é SÓ LEITURA: este script lê de lá e grava apenas dentro deste
repositório. A procedência do que sai daqui está em assets/PROVENIENCIA.md.

Uso (Python 3 + Pillow):
    python tools/assets/extract.py
    python tools/assets/extract.py --fonte "D:/fellipe/Dev/Pokemon All"

Sem --fonte, procura o Pokemon All ao lado deste repositório.

Saída:
    assets/trainers/<id>.png            andar + correr, 18 quadros de 16x32
    assets/trainers/portraits/<id>.png  retratos 64x64
    assets/ui/text_window.png           moldura da caixa de texto (fatias de 8x8)
    assets/fx/<id>.png                  sprites de golpe (graphics/battle_anims)
    assets/pokemon/<dex>.png            Pokémon animados (GIFs da Gen 5 do Pokemon All)
    assets/scenes/<id>.png              metatiles 16x16 de um mapa do FireRed (cenário)
    src/data/assetManifest.js           catálogo do que foi gerado
    src/data/sceneManifest.js           quais metatiles cada tira tem, e o mapa dos salões

Por que as cores vêm do .pal: os PNG do decomp são indexados com uma paleta
provisória, e a cor de verdade está no .pal (JASC-PAL) que o jogo carrega.
O índice 0 é sempre transparente. Recortar pelo ÍNDICE, nunca pela cor:
paletas com cores repetidas apagariam pixels que existem.
"""
import argparse
import json
import re
import struct
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'assets'
MANIFEST = ROOT / 'src' / 'data' / 'assetManifest.js'
SCENE_MANIFEST = ROOT / 'src' / 'data' / 'sceneManifest.js'

# Os dois modelos de treinador. No decomp a Leaf se chama "green".
# Os dois usam a mesma paleta (gObjectEventPal_Player, em event_object_movement.c).
TRAINERS = {
    'red': 'red',
    'leaf': 'green',
}

# Folha final de cada treinador, na ordem do sAnimTable_RedGreenNormal:
#   0-8   os 9 quadros de *_normal: parado (baixo, cima, esquerda) e os passos
#   9-17  os quadros 3 a 11 de *_surf_run, que são os de correr (3 por direção)
# A direita é sempre a esquerda espelhada.
RUN_FRAMES = range(3, 12)

# id no jogo -> nome do arquivo no decomp (front_pics/<nome>_front_pic.png + palettes/<nome>.pal)
PORTRAITS = {
    'red': 'red',
    'leaf': 'leaf',
    'oak': 'professor_oak',
    'brock': 'leader_brock',
    'misty': 'leader_misty',
    'lt_surge': 'leader_lt_surge',
    'erika': 'leader_erika',
    'koga': 'leader_koga',
    'sabrina': 'leader_sabrina',
    'blaine': 'leader_blaine',
    'giovanni': 'leader_giovanni',
    'lorelei': 'elite_four_lorelei',
    'bruno': 'elite_four_bruno',
    'agatha': 'elite_four_agatha',
    'lance': 'elite_four_lance',
    'rival': 'champion_rival',
}


# Sprites de golpe (graphics/battle_anims/sprites). Quais sprites cada golpe do
# FireRed usa está no `loadspritegfx` de data/battle_anim_scripts.s; a etiqueta
# vira arquivo por src/data/battle_anim.h + src/graphics.c.
#   id: (png, paleta, largura do quadro, altura do quadro)
# A paleta é o nome de um .pal da pasta; quando não existe .pal com esse nome,
# o jogo usa a paleta gravada no próprio PNG (regra do build). None = mesmo
# nome do PNG. As folhas do decomp são tiras verticais; saem horizontais.
FX = {
    'small_ember':   ('small_ember', None, 32, 32),        # Ember, Flamethrower, Fire Blast
    'fire':          ('fire', None, 32, 32),               # chama grande
    'spinning_fire': ('spinning_fire', 'fire', 32, 32),    # Fire Spin, Flame Wheel
    'explosion':     ('explosion', None, 32, 32),
    'water_orb':     ('water_orb', 'water_impact', 16, 16),  # Whirlpool, Hydro Pump
    'water_impact':  ('water_impact', None, 32, 32),
    'bubble':        ('bubble', 'rain_drops', 16, 16),     # Bubble, Bubble Beam
    'poison_bubble': ('poison_bubble', None, 16, 16),      # Sludge Bomb, Acid, Poison Sting
    'toxic_bubble':  ('toxic_bubble', 'poison_bubble', 16, 16),  # Toxic
    'leaf':          ('leaf', None, 16, 16),               # Razor Leaf (a folha girando)
    'razor_leaf':    ('razor_leaf', None, 32, 16),
    'whip_hit':      ('slam_hit', 'whip_hit', 32, 32),     # Vine Whip
    'slam_hit':      ('slam_hit', None, 32, 32),
    'green_sparkle': ('green_sparkle', None, 16, 16),
    'rocks':         ('rocks', None, 32, 32),              # Rock Throw, Rock Slide
    'mud_sand':      ('mud_sand_1', 'mud_sand', 16, 16),
    'flying_dirt':   ('flying_dirt', None, 32, 16),
    'impact':        ('impact', None, 32, 32),             # o acerto genérico
    'cut':           ('cut', 'impact', 32, 32),
    'scratch':       ('scratch', 'impact', 32, 32),
    'hands':         ('hands_and_feet', None, 32, 32),     # Karate Chop, Cross Chop
    'cross_impact':  ('cross_impact', None, 32, 32),
    'fang_attack':   ('fang_attack', None, 32, 32),        # Hyper Fang, Poison Fang
    'needle':        ('needle', None, 16, 16),             # Poison Sting, Twineedle
    'gust':          ('gust', None, 32, 64),               # Gust, Wing Attack
    'gold_ring':     ('gold_ring', None, 16, 32),           # Psybeam
    'blue_ring':     ('gold_ring', 'blue_ring_2', 16, 32), # Water Pulse
    'orbs':          ('orbs', None, 16, 16),               # Solar Beam, Hyper Beam
    'ice_crystal':   ('ice_crystals_0', 'ice_crystals', 16, 16),  # Ice Beam
    'metal_sound':   ('metal_sound_waves', None, 32, 64),
    'magenta_heart': ('magenta_heart', None, 16, 16),
    'pink_orb':      ('pink_orb', None, 16, 16),
    'purple_ring':   ('gold_ring', 'purple_ring', 16, 32),  # Psychic: o anel com a paleta roxa
    'blue_star':     ('blue_star', None, 32, 32),          # Mega Drain, Leech Life
    'spark':         ('spark_2', None, 16, 16),            # Thunder Shock, Thunderbolt
    'shock':         ('shock_3', None, 32, 32),            # Thunderbolt
    'lightning':     ('lightning', 'lightning_2', 32, 160),  # Thunder: o raio inteiro
    'spider_web':    ('spider_web', None, 64, 64),
    'x_sign':        ('x_sign', 'hollow_orb', 64, 64),     # o alvo do Rock Tomb
    'bone':          ('bone', None, 32, 32),               # Bone Club
    'tongue':        ('tongue', None, 16, 16),             # Lick
    'shadow_ball':   ('shadow_ball', None, 32, 32),        # Shadow Ball
    'purple_flame':  ('purple_flame', None, 16, 32),       # Night Shade
    'ghostly_spirit': ('ghostly_spirit', None, 32, 32),
    'ice_chunk':     ('ice_chunk', None, 32, 32),          # Blizzard
    'hail':          ('hail', None, 16, 16),               # Powder Snow
}


def read_pal(path):
    """Paleta JASC-PAL: cabeçalho de 3 linhas e uma cor RGB por linha."""
    lines = Path(path).read_text().split('\n')
    if lines[0].strip() != 'JASC-PAL':
        raise ValueError(f'{path} não é um JASC-PAL')
    count = int(lines[2])
    return [tuple(int(v) for v in line.split()) for line in lines[3:3 + count]]


def paint(png, palette):
    """PNG indexado do decomp -> RGBA com as cores do .pal e o índice 0 transparente."""
    image = Image.open(png)
    if image.mode != 'P':
        raise ValueError(f'{png} não é indexado (modo {image.mode})')
    data = image.tobytes()
    lut = {}
    for index in set(data):
        # Folhas de 8 bits guardam várias sub-paletas de 16, e o GBA só lê os
        # 4 bits de baixo do índice dentro do slot carregado.
        folded = index % 16 if len(palette) == 16 else index
        lut[index] = (0, 0, 0, 0) if folded == 0 else palette[folded] + (255,)
    rgba = Image.new('RGBA', image.size)
    rgba.putdata([lut[i] for i in data])
    return rgba


def frames(image, width, height):
    """Recorta uma tira horizontal em quadros."""
    return [image.crop((x, 0, x + width, height)) for x in range(0, image.width, width)]


def strip(images):
    """Junta quadros do mesmo tamanho numa tira horizontal."""
    width, height = images[0].size
    sheet = Image.new('RGBA', (width * len(images), height))
    for i, frame in enumerate(images):
        sheet.paste(frame, (i * width, 0))
    return sheet


def save(image, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, optimize=True)
    return path.relative_to(ROOT).as_posix()


def extract_trainers(decomp, manifest):
    people = decomp / 'graphics' / 'object_events' / 'pics' / 'people'
    palette = read_pal(decomp / 'graphics' / 'object_events' / 'palettes' / 'player.pal')
    for game_id, decomp_id in TRAINERS.items():
        walk = frames(paint(people / f'{decomp_id}_normal.png', palette), 16, 32)
        run = frames(paint(people / f'{decomp_id}_surf_run.png', palette), 16, 32)
        sheet = strip(walk + [run[i] for i in RUN_FRAMES])
        manifest[f'trainer/{game_id}'] = {
            'src': save(sheet, ASSETS / 'trainers' / f'{game_id}.png'),
            'frameWidth': 16, 'frameHeight': 32, 'frames': len(walk) + len(RUN_FRAMES),
        }


def extract_portraits(decomp, manifest):
    trainers = decomp / 'graphics' / 'trainers'
    for game_id, decomp_id in PORTRAITS.items():
        image = paint(trainers / 'front_pics' / f'{decomp_id}_front_pic.png',
                      read_pal(trainers / 'palettes' / f'{decomp_id}.pal'))
        manifest[f'portrait/{game_id}'] = {
            'src': save(image, ASSETS / 'trainers' / 'portraits' / f'{game_id}.png'),
            'frameWidth': image.width, 'frameHeight': image.height, 'frames': 1,
        }


def png_palette(png):
    """A paleta gravada no próprio PNG (as 16 primeiras cores)."""
    raw = Image.open(png).getpalette()[:48]
    return [tuple(raw[i:i + 3]) for i in range(0, 48, 3)]


def extract_fx(decomp, manifest):
    sprites = decomp / 'graphics' / 'battle_anims' / 'sprites'
    for game_id, (png, palette, width, height) in FX.items():
        palette = palette or png
        pal_file = sprites / f'{palette}.pal'
        colors = read_pal(pal_file) if pal_file.exists() else png_palette(sprites / f'{palette}.png')
        image = paint(sprites / f'{png}.png', colors)
        # tira vertical do decomp -> quadros (linha a linha, da esquerda para a direita)
        cells = [image.crop((x, y, x + width, y + height))
                 for y in range(0, image.height, height)
                 for x in range(0, image.width, width)]
        cells = [cell for cell in cells if cell.getbbox()]   # quadro vazio não entra
        manifest[f'fx/{game_id}'] = {
            'src': save(strip(cells), ASSETS / 'fx' / f'{game_id}.png'),
            'frameWidth': width, 'frameHeight': height, 'frames': len(cells),
        }


# Pokémon animados: os GIFs da Gen 5 que o Pokemon All guarda (a mesma arte que a
# interface já mostra), virados folha de quadros para o canvas, que não anima GIF.
POKEDEX_RANGE = range(1, 152)   # Kanto; regiões novas estendem a faixa
MAX_FRAMES = 36                 # animações mais longas são amostradas (mais leve)


def extract_pokemon(source, manifest, shiny=False):
    # as cores shiny (0.13) são outros GIFs da mesma coleção, com o mesmo corte
    gifs = source / 'assets' / 'pokemon' / 'battle' / ('front-shiny' if shiny else 'front')
    key, folder = ('pokemon/shiny', ASSETS / 'pokemon' / 'shiny') if shiny else ('pokemon', ASSETS / 'pokemon')
    for dex in POKEDEX_RANGE:
        gif = Image.open(gifs / f'{dex}.gif')
        frames, durations = [], []
        for i in range(getattr(gif, 'n_frames', 1)):
            gif.seek(i)
            frames.append(gif.convert('RGBA'))
            durations.append(gif.info.get('duration', 80) or 80)
        step = -(-len(frames) // MAX_FRAMES)   # divisão para cima
        frames = frames[::step]
        fps = max(1, round(1000 / (sum(durations) / len(durations)) / step))
        # todos os quadros recortados na mesma caixa: a união do que aparece em cada um
        boxes = [f.getbbox() for f in frames if f.getbbox()]
        box = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
        cells = [f.crop(box) for f in frames]
        # com paleta (8 bits) a folha fica com menos da metade do tamanho; cada GIF
        # já usa no máximo 256 cores, então quase sempre não se perde nada
        sheet = strip(cells).quantize(colors=256, method=Image.Quantize.FASTOCTREE)
        manifest[f'{key}/{dex}'] = {
            'src': save(sheet, folder / f'{dex}.png'),
            'frameWidth': cells[0].width, 'frameHeight': cells[0].height, 'frames': len(cells), 'fps': fps,
        }


# Ícones de item que o jogo desenha no chão (Poké Ball, Ímã, Poção): os do Pokemon All
# (assets/items/default, do PokeAPI/sprites), copiados como estão.
ITEMS = ['poke-ball', 'magnet', 'potion']


def extract_items(source, manifest):
    for name in ITEMS:
        image = Image.open(source / 'assets' / 'items' / 'default' / f'{name}.png').convert('RGBA')
        manifest[f'item/{name}'] = {
            'src': save(image, ASSETS / 'items' / f'{name}.png'),
            'frameWidth': image.width, 'frameHeight': image.height, 'frames': 1,
        }


# Cenário: cada entrada é um mapa do FireRed. Sai uma tira com as metatiles
# 16x16 que o mapa usa (na ordem do ID) e, nos salões, o próprio mapa: o
# gerador do jogo (render/scenery.js) monta a arena com esses pedaços.
#   id da tira: (layout no decomp, guardar o mapa?)
SCENES = {
    'route1':          ('Route1', False),
    'viridian_forest': ('ViridianForest', False),
    'mt_moon':         ('MtMoon_1F', False),
    'pewter_gym':      ('PewterCity_Gym', True),
    'cerulean_gym':    ('CeruleanCity_Gym', True),
    'vermilion_gym':   ('VermilionCity_Gym', True),
    'celadon_gym':     ('CeladonCity_Gym', True),
    'fuchsia_gym':     ('FuchsiaCity_Gym', True),
    'saffron_gym':     ('SaffronCity_Gym', True),
    'cinnabar_gym':    ('CinnabarIsland_Gym', True),
    'viridian_gym':    ('ViridianCity_Gym', True),
    'lorelei_room':    ('PokemonLeague_LoreleisRoom', True),
    'bruno_room':      ('PokemonLeague_BrunosRoom', True),
    'agatha_room':     ('PokemonLeague_AgathasRoom', True),
    'lance_room':      ('PokemonLeague_LancesRoom', True),
    'champion_room':   ('PokemonLeague_ChampionsRoom', True),
}
PRIMARY_TILES = 640       # tiles do tileset primário; os do secundário vêm depois
PRIMARY_METATILES = 640   # idem para as metatiles
PRIMARY_PALS = 7          # paletas 0-6 do primário, 7-12 do secundário


class Tileset:
    """Tileset primário + secundário de um mapa: tiles 8x8, paletas e metatiles."""

    def __init__(self, decomp, primary, secondary):
        folders = [decomp / 'data' / 'tilesets' / kind / name
                   for kind, name in (('primary', primary), ('secondary', secondary))]
        pals = [self._palettes(folder) for folder in folders]
        self.pals = pals[0][:PRIMARY_PALS] + pals[1][PRIMARY_PALS:]
        self.tiles = self._tiles(folders[0])
        self.tiles += [bytes(64)] * (PRIMARY_TILES - len(self.tiles))
        self.tiles += self._tiles(folders[1])
        self.metatiles = self._metatiles(folders[0])
        self.metatiles += [(0,) * 8] * (PRIMARY_METATILES - len(self.metatiles))
        self.metatiles += self._metatiles(folders[1])

    @staticmethod
    def _palettes(folder):
        return [read_pal(folder / 'palettes' / f'{i:02d}.pal') for i in range(16)]

    @staticmethod
    def _tiles(folder):
        image = Image.open(folder / 'tiles.png')
        if image.mode != 'P':
            raise ValueError(f'{folder}/tiles.png não é indexado')
        data, width = image.tobytes(), image.width
        return [bytes(data[(ty * 8 + y) * width + tx * 8 + x] & 15 for y in range(8) for x in range(8))
                for ty in range(image.height // 8) for tx in range(width // 8)]

    @staticmethod
    def _metatiles(folder):
        raw = (folder / 'metatiles.bin').read_bytes()
        return [struct.unpack_from('<8H', raw, i) for i in range(0, len(raw), 16)]

    def metatile(self, mid):
        """Metatile 16x16: 4 tiles da camada de baixo e 4 da de cima (índice 0 da de cima é vazado)."""
        image = Image.new('RGBA', (16, 16))
        pixels = image.load()
        for layer in range(2):
            for k in range(4):
                entry = self.metatiles[mid][layer * 4 + k]
                tile = self.tiles[entry & 0x3FF]
                hflip, vflip, pal = entry & 0x400, entry & 0x800, self.pals[(entry >> 12) & 15]
                ox, oy = (k % 2) * 8, (k // 2) * 8
                for y in range(8):
                    for x in range(8):
                        c = tile[(7 - y if vflip else y) * 8 + (7 - x if hflip else x)]
                        if c or not layer:
                            pixels[ox + x, oy + y] = pal[c] + (255,)
        return image


def snake(name):
    """gTileset_PalletTown -> pallet_town (o nome da pasta no decomp)."""
    return re.sub(r'(?<!^)(?=[A-Z])', '_', name.replace('gTileset_', '')).lower()


def extract_scenes(decomp, manifest):
    layouts = {l['name']: l for l in json.loads((decomp / 'data/layouts/layouts.json').read_text())['layouts'] if l}
    scenes = {}
    for key, (name, keep_grid) in SCENES.items():
        layout = layouts[f'{name}_Layout']
        tileset = Tileset(decomp, snake(layout['primary_tileset']), snake(layout['secondary_tileset']))
        raw = (decomp / layout['blockdata_filepath']).read_bytes()
        cells = [struct.unpack_from('<H', raw, i * 2)[0] for i in range(layout['width'] * layout['height'])]
        grid = [cell & 0x3FF for cell in cells]
        ids = sorted(set(grid))
        # bloqueia quem tem colisão (bits 10-11 do map.bin) na maioria das casas do mapa
        blocked = {mid: [0, 0] for mid in ids}
        for cell in cells:
            blocked[cell & 0x3FF][0] += 1 if cell & 0xC00 else 0
            blocked[cell & 0x3FF][1] += 1
        solid = [mid for mid in ids if blocked[mid][0] * 2 > blocked[mid][1]]
        manifest[f'scene/{key}'] = {
            'src': save(strip([tileset.metatile(mid) for mid in ids]), ASSETS / 'scenes' / f'{key}.png'),
            'frameWidth': 16, 'frameHeight': 16, 'frames': len(ids),
        }
        scenes[key] = {'ids': ids, 'solid': solid}
        if keep_grid:
            scenes[key].update(width=layout['width'], height=layout['height'], grid=grid)
    write_scene_manifest(scenes)


def write_scene_manifest(scenes):
    lines = [
        '/**',
        ' * METATILES DO CENÁRIO — gerado por tools/assets/extract.py. Não edite à mão.',
        ' *',
        ' * Por tira (asset scene/<id>): `ids` diz qual metatile do FireRed está em',
        ' * cada quadro; `solid`, quais bloqueiam o caminho (a colisão do mapa); nos',
        ' * salões, `grid` é o mapa original (IDs, linha a linha).',
        ' */',
        'export const SCENE_TILES = {',
    ]
    for key, scene in scenes.items():
        lines.append(f"  {key}: {{")
        lines.append(f"    ids: [{', '.join(f'0x{i:X}' for i in scene['ids'])}],")
        lines.append(f"    solid: [{', '.join(f'0x{i:X}' for i in scene['solid'])}],")
        if 'grid' in scene:
            w = scene['width']
            rows = [', '.join(f'0x{i:X}' for i in scene['grid'][y * w:(y + 1) * w]) for y in range(scene['height'])]
            lines.append(f"    width: {w}, height: {scene['height']},")
            lines.append('    grid: [')
            lines += [f'      {row},' for row in rows]
            lines.append('    ]')
        else:
            lines[-1] = lines[-1].rstrip(',')
        lines.append('  },')
    lines[-1] = '  }'
    lines.append('};')
    SCENE_MANIFEST.write_text('\n'.join(lines) + '\n', encoding='utf-8')


def extract_ui(decomp, manifest):
    # A caixa de texto clássica do FireRed: moldura `type2` com a paleta `stdpal_0`.
    windows = decomp / 'graphics' / 'text_window'
    image = paint(windows / 'type2.png', read_pal(windows / 'stdpal_0.pal'))
    manifest['ui/text-window'] = {
        'src': save(image, ASSETS / 'ui' / 'text_window.png'),
        'frameWidth': image.width, 'frameHeight': image.height, 'frames': 1,
    }


def write_manifest(manifest):
    lines = [
        '/**',
        ' * CATÁLOGO DE ASSETS — gerado por tools/assets/extract.py. Não edite à mão:',
        ' * rode o extrator de novo. Procedência em assets/PROVENIENCIA.md.',
        ' *',
        ' * Cada entrada é uma tira horizontal de quadros do mesmo tamanho, em 1x',
        ' * (o jogo amplia em escala inteira, sem suavizar).',
        ' */',
        'export const ASSET_MANIFEST = {',
    ]
    for key in sorted(manifest):
        entry = manifest[key]
        fps = f", fps: {entry['fps']}" if 'fps' in entry else ''
        lines.append(f"  '{key}': {{ src: '{entry['src']}', frameWidth: {entry['frameWidth']}, "
                     f"frameHeight: {entry['frameHeight']}, frames: {entry['frames']}{fps} }},")
    lines[-1] = lines[-1].rstrip(',')
    lines.append('};')
    MANIFEST.write_text('\n'.join(lines) + '\n', encoding='utf-8')


def main():
    sys.stdout.reconfigure(encoding='utf-8')  # o console do Windows não é UTF-8 por padrão
    parser = argparse.ArgumentParser(description='Gera os sprites do jogo a partir do Pokemon All.')
    parser.add_argument('--fonte', type=Path, default=ROOT.parent / 'Pokemon All',
                        help='pasta do Pokemon All (padrão: ao lado deste repositório)')
    args = parser.parse_args()

    decomp = args.fonte / 'extracted' / 'pokefirered'
    if not decomp.is_dir():
        sys.exit(f'Não achei o decomp em {decomp}. Passe o caminho do Pokemon All com --fonte.')

    manifest = {}
    extract_trainers(decomp, manifest)
    extract_portraits(decomp, manifest)
    extract_fx(decomp, manifest)
    extract_pokemon(args.fonte, manifest)
    extract_pokemon(args.fonte, manifest, shiny=True)
    extract_items(args.fonte, manifest)
    extract_ui(decomp, manifest)
    extract_scenes(decomp, manifest)
    write_manifest(manifest)
    print(f'{len(manifest)} assets gerados; catálogo em {MANIFEST.relative_to(ROOT).as_posix()}')


if __name__ == '__main__':
    main()
