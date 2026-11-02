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
    src/data/assetManifest.js           catálogo do que foi gerado

Por que as cores vêm do .pal: os PNG do decomp são indexados com uma paleta
provisória, e a cor de verdade está no .pal (JASC-PAL) que o jogo carrega.
O índice 0 é sempre transparente. Recortar pelo ÍNDICE, nunca pela cor:
paletas com cores repetidas apagariam pixels que existem.
"""
import argparse
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'assets'
MANIFEST = ROOT / 'src' / 'data' / 'assetManifest.js'

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
        lines.append(f"  '{key}': {{ src: '{entry['src']}', frameWidth: {entry['frameWidth']}, "
                     f"frameHeight: {entry['frameHeight']}, frames: {entry['frames']} }},")
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
    extract_ui(decomp, manifest)
    write_manifest(manifest)
    print(f'{len(manifest)} assets gerados; catálogo em {MANIFEST.relative_to(ROOT).as_posix()}')


if __name__ == '__main__':
    main()
