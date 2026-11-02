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

Os PNG do decomp são indexados com uma paleta provisória; as cores de verdade estão
nos `.pal`. O índice 0 é transparente, e o recorte é sempre pelo índice, nunca pela cor.

## Outros

| Arquivo | Origem |
|---|---|
| `banner.svg` | feito para o projeto |
| sprites de Pokémon, itens e insígnias | não ficam aqui: vêm do [PokeAPI/sprites](https://github.com/PokeAPI/sprites) pela internet (ver `CONFIG.sprites`) |

## Licença

É arte da Nintendo / Game Freak / Creatures, da mesma natureza dos sprites da
PokeAPI. O projeto é de fã e sem fins lucrativos (ver o aviso no README). O decomp
não declara licença; o logotipo do FireRed não é usado.
