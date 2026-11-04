"""
O MAPA DE KANTO do FireRed (o Town Map), para o lobby do jogo.

    python tools/assets/extract_region_map.py [--fonte "../Pokemon All"]

Monta o mapa do jeito que o jogo monta: `graphics/region_map/kanto.bin` é a
grade de 30x20 casas de 8x8 (a tela do GBA inteira); cada casa aponta uma peça
de `region_map.png`, com espelhamento e sub-paleta de `region_map.pal`. Recorta
também o cursor do mapa e os ícones do Red e da Leaf, com as paletas deles.

Lê o decomp do Pokemon All (só leitura) e grava em `assets/ui/region-map/`, em
1x: o jogo amplia em escala inteira.

As casas das cidades (onde o lobby põe cada fase) vêm de
`src/data/region_map/region_map_layout_kanto.h` do decomp público
(pret/pokefirered): a grade é de 22x15 células de 8 pixels, e o jogo desenha o
cursor da célula (x, y) em (8x + 36, 8y + 36) — o centro de um sprite de 16.
Ficam em `src/data/regionMap.js`, escritas à mão a partir de lá; o mapa sai
recortado em `CROP` (192x144), e lá a conta já desconta o recorte.
"""
import argparse
import struct
import sys
from pathlib import Path

from PIL import Image

from extract import ROOT, paint, read_pal

OUT = ROOT / 'assets' / 'ui' / 'region-map'
#: O recorte do mapa na tela de 240x160 do jogo; src/data/regionMap.js desconta a
#: origem dele das casas das cidades.
CROP = (24, 16, 216, 160)


def render_tilemap(tilemap: Path, tiles_png: Path, palette: list) -> Image.Image:
    """Uma grade de casas 8x8 (u16: peça, espelhos, sub-paleta) sobre as peças de um PNG indexado."""
    tiles = Image.open(tiles_png)
    data = tiles.tobytes()
    per_row = tiles.width // 8
    entries = struct.unpack(f'<{len(tilemap.read_bytes()) // 2}H', tilemap.read_bytes())
    cols, rows = 30, len(entries) // 30
    out = Image.new('RGBA', (cols * 8, rows * 8))
    pixels = out.load()
    for i, entry in enumerate(entries):
        tile, hflip, vflip, bank = entry & 0x3FF, entry >> 10 & 1, entry >> 11 & 1, entry >> 12
        tx, ty = tile % per_row * 8, tile // per_row * 8
        ox, oy = i % cols * 8, i // cols * 8
        for y in range(8):
            for x in range(8):
                sx = tx + (7 - x if hflip else x)
                sy = ty + (7 - y if vflip else y)
                index = data[sy * tiles.width + sx] % 16
                color = palette[bank * 16 + index] if bank * 16 + index < len(palette) else (0, 0, 0)
                # o índice 0 da sub-paleta é o fundo do BG: aqui, a cor de trás
                pixels[ox + x, oy + y] = palette[0] + (255,) if index == 0 else color + (255,)
    return out


def main() -> None:
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description='Monta o Town Map de Kanto do FireRed.')
    parser.add_argument('--fonte', type=Path, default=ROOT.parent / 'Pokemon All',
                        help='pasta do Pokemon All (padrão: ao lado deste repositório)')
    args = parser.parse_args()
    graphics = args.fonte / 'extracted' / 'pokefirered' / 'graphics' / 'region_map'
    OUT.mkdir(parents=True, exist_ok=True)

    kanto = render_tilemap(graphics / 'kanto.bin', graphics / 'region_map.png', read_pal(graphics / 'region_map.pal'))
    # o botão de trocar de mapa (as Ilhas Sevii) fica no mar, embaixo à direita:
    # o lobby não troca de mapa, então o mar logo acima cobre ele (as ondas são
    # listras de 2 pixels: subir 24 não muda a listra)
    kanto.paste(kanto.crop((192, 104, 216, 128)), (192, 128))
    # só a moldura do mapa: sem a faixa preta do título e as bordas brancas
    kanto = kanto.crop(CROP)
    kanto.save(OUT / 'kanto.png', optimize=True)
    paint(graphics / 'cursor.png', read_pal(graphics / 'cursor.pal')).save(OUT / 'cursor.png', optimize=True)
    for who in ('red', 'leaf'):
        paint(graphics / f'player_icon_{who}.png', read_pal(graphics / f'player_icon_{who}.pal')) \
            .save(OUT / f'player-{who}.png', optimize=True)
    print(f'  assets/ui/region-map: kanto.png {kanto.size}, cursor e ícones do Red e da Leaf')


if __name__ == '__main__':
    main()
