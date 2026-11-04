"""
A arte do PC e do Cartão de Treinador do FireRed, trazida do Pokemon All (só leitura).

    python tools/assets/copy_pc_art.py [--fonte "../Pokemon All"]

Copia para `assets/pc/` as peças da tela do PC que o Pokemon All já recortou
da folha do The Spriters Resource (fundo, painéis, botão, mão, setas) e os 16
papéis de parede do jogo, como estão (ampliados 4x). Os ícones de caixa e os
sprites frontais do FireRed das 151 espécies de Kanto vêm do decomp, também
pelo Pokemon All, e descem para 1x (o CSS amplia em pixels inteiros): ficam
em `assets/pokemon/gen3/icons/<dex>.png` (32x64, dois quadros empilhados) e
`assets/pokemon/gen3/front/<dex>.png` (64x64).

O Pokemon All não é modificado: o script só lê de lá.
"""
import argparse
import pathlib
import shutil

from PIL import Image

REPO = pathlib.Path(__file__).resolve().parents[2]
PIECES = ['arrow-left', 'arrow-right', 'background-tile', 'button', 'button-on',
          'data-panel', 'data-panel-wave', 'hand', 'team-panel']
KANTO = range(1, 152)


def down4(source: pathlib.Path, target: pathlib.Path) -> None:
    """A arte vem ampliada 4x; volta ao pixel do jogo sem misturar cores."""
    image = Image.open(source)
    w, h = image.size
    target.parent.mkdir(parents=True, exist_ok=True)
    image.resize((w // 4, h // 4), Image.NEAREST).save(target, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser(description='Traz a arte do PC do Pokemon All.')
    parser.add_argument('--fonte', type=pathlib.Path, default=REPO.parent / 'Pokemon All',
                        help='pasta do Pokemon All (padrão: ao lado deste repositório)')
    args = parser.parse_args()
    art = args.fonte / 'src' / 'app' / 'assets' / 'pc'
    sprites = args.fonte / 'assets' / 'pokemon' / 'gen3'
    out = REPO / 'assets' / 'pc'
    (out / 'wallpapers').mkdir(parents=True, exist_ok=True)

    for name in PIECES:
        shutil.copyfile(art / f'{name}.png', out / f'{name}.png')
    walls = sorted((art / 'wallpapers').glob('*.png'))
    for wall in walls:
        shutil.copyfile(wall, out / 'wallpapers' / wall.name)
    print(f'  assets/pc: {len(PIECES)} peças e {len(walls)} arquivos de papel de parede')

    for dex in KANTO:
        down4(sprites / 'icons' / f'{dex}.png', REPO / 'assets' / 'pokemon' / 'gen3' / 'icons' / f'{dex}.png')
        down4(sprites / 'front' / f'{dex}.png', REPO / 'assets' / 'pokemon' / 'gen3' / 'front' / f'{dex}.png')
        # o sprite shiny do FireRed, para os DADOS do PC (0.13; o ícone de caixa não muda no jogo)
        down4(sprites / 'front-shiny' / f'{dex}.png', REPO / 'assets' / 'pokemon' / 'gen3' / 'front-shiny' / f'{dex}.png')
    print(f'  assets/pokemon/gen3: ícones e sprites frontais de {len(KANTO)} espécies')

    # o Cartão de Treinador do FireRed (o azul), que vira o Estojo de Insígnias do lobby
    down4(args.fonte / 'src' / 'app' / 'assets' / 'trainer-card' / 'card-front-0.png',
          REPO / 'assets' / 'ui' / 'trainer-card.png')
    print('  assets/ui/trainer-card.png: o cartão azul, com as 8 casas das insígnias')


if __name__ == '__main__':
    main()
