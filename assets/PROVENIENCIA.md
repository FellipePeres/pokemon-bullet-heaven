# Procedência dos assets

De onde vem cada arquivo desta pasta, e como regerar.

## Gerados por `tools/assets/extract.py`

Fonte: o decomp **[pret/pokefirered](https://github.com/pret/pokefirered)**, commit
`c75f352304d529f6ba92d4f74b9cf8b5c3810788`, lido da pasta `extracted/pokefirered` do
**Pokemon All** (o outro projeto do Fellipe, que guarda o decomp com a procedência
registrada no `extracted/README.md` de lá). O Pokemon All é só leitura: o extrator lê
de lá e grava aqui.

```bash
python tools/assets/extract.py                       # procura ../Pokemon All
python tools/assets/extract.py --fonte "D:/fellipe/Dev/Pokemon All"
```

Regerar sobrescreve os PNG e o catálogo `src/data/assetManifest.js`.

| Saída | Origem no decomp | Paleta |
|---|---|---|
| `trainers/red.png`, `trainers/leaf.png` | `graphics/object_events/pics/people/{red,green}_normal.png` (9 quadros) + os quadros 3 a 11 de `{red,green}_surf_run.png` (correr) | `object_events/palettes/player.pal` (a Leaf usa a mesma: `gObjectEventPal_Player` em `src/event_object_movement.c`) |
| `trainers/portraits/<id>.png` | `graphics/trainers/front_pics/<nome>_front_pic.png` | `graphics/trainers/palettes/<nome>.pal` |
| `ui/text_window.png` | `graphics/text_window/type2.png` | `graphics/text_window/stdpal_0.pal` |
| `fx/<id>.png` | `graphics/battle_anims/sprites/<nome>.png` (ver `FX` no extrator) | o `.pal` do sprite, ou o embutido no PNG |
| `scenes/<id>.png` | as metatiles 16x16 que o mapa usa, montadas de `data/tilesets/primary/<primário>` + `secondary/<secundário>` (`tiles.png`, `metatiles.bin`); o mapa vem de `data/layouts/<Mapa>/map.bin` (ver `SCENES` no extrator: Rota 1, Floresta de Viridian, Monte Lua, os 8 ginásios e as salas da Liga) | `palettes/00-06.pal` do primário e `07-12.pal` do secundário |

O catálogo das metatiles (qual ID do FireRed está em cada quadro, e o mapa dos
salões, e quais metatiles bloqueiam o caminho pela colisão do mapa) sai em
`src/data/sceneManifest.js`.

## Copiados do Pokemon All

| Saída | Origem |
|---|---|
| `pokemon/<dex>.png` | `assets/pokemon/battle/front/<dex>.gif` (GIFs da Gen 5), convertidos em tira de quadros com paleta reduzida |
| `items/poke-ball.png`, `items/magnet.png`, `items/potion.png` | `assets/items/default/<nome>.png` (vêm do PokeAPI/sprites), copiados como estão: a Poké Ball, o Ímã e a Poção que caem no chão |

Os PNG do decomp são indexados com uma paleta provisória; as cores de verdade estão
nos `.pal`. O índice 0 é transparente, e o recorte é sempre pelo índice, nunca pela cor.

## Músicas (`tools/assets/render_music.py`)

| Saída | Origem |
|---|---|
| `music/mus_*.ogg` | as músicas do FireRed renderizadas pelo motor de som do jogo (o m4a), com o sintetizador copiado do Pokemon All (`extracted/pokefirered/tools/render_sound.py` de lá). Instrumentos, samples e `midi.cfg` vêm do decomp do Pokemon All (só leitura); as partituras que ele não guardou, do decomp público pret/pokefirered no commit `c75f352` |
| `music/lobby-theme.ogg` | o tema do lobby do Pokemon All (`src/app/assets/lobby-theme.ogg`), copiado como está |

`src/data/musicTracks.js` guarda onde cada loop começa e acaba.

## Copiados do Pokemon All (interface)

| Saída | Origem |
|---|---|
| `ui/window-frame.png`, `ui/window-frame-button.png` | `src/app/assets/` do Pokemon All: a `graphics/text_window/type2.png` do decomp com a paleta `stdpal_0`, já ampliada (3x e 2x) para o `border-image` sair nítido |
| `fonts/*.woff2` | Press Start 2P e Pixelify Sans, as fontes do Pokemon All, baixadas do Google Fonts (licença SIL Open Font License 1.1, que permite redistribuir) |

## Outros

| Arquivo | Origem |
|---|---|
| `ui/title-background.webp` | arte do Fellipe para a tela de título (2026-11-02), convertida para WebP |
| `banner.svg` | feito para o projeto |
| sprites de Pokémon, itens e insígnias | não ficam aqui: vêm do [PokeAPI/sprites](https://github.com/PokeAPI/sprites) pela internet (ver `CONFIG.sprites`) |

## Licença

É arte da Nintendo / Game Freak / Creatures, da mesma natureza dos sprites da
PokeAPI. O projeto é de fã e sem fins lucrativos (ver o aviso no README). O decomp
não declara licença; o logotipo do FireRed não é usado.
