"""
OS BANNERS DOS GINÁSIOS (0.31) — o cabeçalho do painel da fase no mapa da jornada.

Para cada salão de líder (os 8 ginásios, as 4 salas da Elite Four e a do
Campeão) sai uma faixa de 12x4 metatiles do próprio mapa do FireRed, recortada
em volta de onde o líder fica (o object_event dele no map.json), em 1x. O painel
mostra em 2x, com o retrato do líder por cima (ui/lobby.js).

Saída: assets/ui/gym-banners/<cenário>.png (o mesmo id do cenário em data/scenery.js)

Uso (Python 3 + Pillow):
    python tools/assets/gym_banners.py
    python tools/assets/gym_banners.py --fonte "D:/fellipe/Dev/Pokemon All"
"""
import argparse
import json
import struct
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from extract import Tileset, snake, ROOT  # noqa: E402

OUT = ROOT / 'assets' / 'ui' / 'gym-banners'
W, H, T = 12, 4, 16

# cenário: (mapa no decomp, o líder no map.json, ajuste da faixa em tiles: dx, dy)
# O ajuste só existe onde o recorte em volta do líder pegava parede demais.
HALLS = {
    'pewter_gym':    ('PewterCity_Gym', 'BROCK', 1, 0),
    'cerulean_gym':  ('CeruleanCity_Gym', 'MISTY', 0, 0),
    'vermilion_gym': ('VermilionCity_Gym', 'LT_SURGE', 0, 1),
    'celadon_gym':   ('CeladonCity_Gym', 'ERIKA', 0, 0),
    'fuchsia_gym':   ('FuchsiaCity_Gym', 'KOGA', 0, 0),
    'saffron_gym':   ('SaffronCity_Gym', 'SABRINA', 0, 0),
    'cinnabar_gym':  ('CinnabarIsland_Gym', 'BLAINE', 0, 0),
    'viridian_gym':  ('ViridianCity_Gym', 'GIOVANNI', 0, 0),
    'lorelei_room':  ('PokemonLeague_LoreleisRoom', 'LORELEI', 0, 0),
    'bruno_room':    ('PokemonLeague_BrunosRoom', 'BRUNO', 0, 0),
    'agatha_room':   ('PokemonLeague_AgathasRoom', 'AGATHA', 0, 0),
    'lance_room':    ('PokemonLeague_LancesRoom', 'LANCE', 0, 0),
    'champion_room': ('PokemonLeague_ChampionsRoom', 'BLUE', 0, 0),
    # o card da missão do Zapdos (0.39): a sala do gerador da Usina, onde ele fica no FireRed
    'usina': ('PowerPlant', 'ZAPDOS', 0, 0),
}


def banner(decomp, layouts, map_name, leader, dx, dy):
    layout = layouts[f'{map_name}_Layout']
    tileset = Tileset(decomp, snake(layout['primary_tileset']), snake(layout['secondary_tileset']))
    w, h = layout['width'], layout['height']
    raw = (decomp / layout['blockdata_filepath']).read_bytes()
    cells = [struct.unpack_from('<H', raw, i * 2)[0] & 0x3FF for i in range(w * h)]
    events = json.loads((decomp / 'data' / 'maps' / map_name / 'map.json').read_text())['object_events']
    spot = next(o for o in events if o['graphics_id'] == f'OBJ_EVENT_GFX_{leader}')
    # a faixa em volta do líder: ele no meio, um pouco acima do centro (o chão na frente dele aparece)
    x0 = min(max(0, w - W), max(0, spot['x'] - W // 2 + dx)) if w >= W else (w - W) // 2
    y0 = max(0, min(h - H, spot['y'] - 2 + dy))
    image = Image.new('RGBA', (W * T, H * T))
    cache = {}
    for j in range(H):
        for i in range(W):
            # salão mais estreito que a faixa (o de Vermilion tem 11): repete a borda
            x = max(0, min(w - 1, x0 + i))
            y = max(0, min(h - 1, y0 + j))
            mid = cells[y * w + x]
            if mid not in cache:
                cache[mid] = tileset.metatile(mid)
            image.paste(cache[mid], (i * T, j * T))
    return image


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description='Gera os banners dos salões dos líderes.')
    parser.add_argument('--fonte', type=Path, default=ROOT.parent / 'Pokemon All')
    args = parser.parse_args()
    decomp = args.fonte / 'extracted' / 'pokefirered'
    if not decomp.is_dir():
        sys.exit(f'Não achei o decomp em {decomp}. Passe o caminho do Pokemon All com --fonte.')
    layouts = {l['name']: l for l in json.loads((decomp / 'data/layouts/layouts.json').read_text())['layouts'] if l}
    OUT.mkdir(parents=True, exist_ok=True)
    for scene, (map_name, leader, dx, dy) in HALLS.items():
        banner(decomp, layouts, map_name, leader, dx, dy).save(OUT / f'{scene}.png', optimize=True)
    print(f'{len(HALLS)} banners em {OUT.relative_to(ROOT).as_posix()}')


if __name__ == '__main__':
    main()
