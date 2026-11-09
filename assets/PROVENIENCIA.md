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

## Gerados por `tools/assets/hub.py` (a vila, 0.29)

Mesma fonte do extrator (o decomp no Pokemon All, só leitura). A vila e os
interiores são **montados** com pedaços de mapas do FireRed: nada é desenhado à
mão. Cada mapa sai em duas camadas, como no jogo: o chão (os 4 tiles de baixo de
cada metatile, mais os de cima quando o tipo de camada é COVERED) e o que fica por
cima dos personagens (os 4 de cima quando é NORMAL ou SPLIT, bits 29-30 de
`metatile_attributes.bin`). A colisão vem do `map.bin` de origem (o bit de colisão
e a elevação 1, que é a água).

```bash
python tools/assets/hub.py                           # procura ../Pokemon All
```

| Saída | Origem no decomp |
|---|---|
| `hub/vila.png` e `hub/vila-top.png` | recortes de `data/layouts/` PalletTown (casa, laboratório, lagoa, placas), ViridianCity (Centro Pokémon, árvores, a mata, o caminho de terra), FourIsland (cabana), FuchsiaCity (casa de tijolo), CeruleanCity (a loja de teto de vidro, flores) e Route1 (grama alta) |
| `hub/casa_1f.png`, `hub/casa_2f.png` | PalletTown_PlayersHouse_1F e _2F (o quarto sem os móveis) |
| `hub/centro.png` | IndigoPlateau_PokemonCenter_1F, com o balcão repetido para o Poké Mart |
| `hub/pokedoll.png` | CeladonCity_DepartmentStore_4F, com a saída do 1F embaixo |
| `hub/lab.png`, `hub/cabana.png`, `hub/casa_sabio.png` | PalletTown_ProfessorOaksLab, House1, FuchsiaCity_WardensHouse |
| `hub/decor/<id>.png` (e `-top`) | os móveis do quarto: a mesa com PC, a estante e o tapete de PalletTown_PlayersHouse_2F; a planta de SaffronCity_CopycatsHouse_2F |
| `hub/npc/<id>.png` | `graphics/object_events/pics/{people,pokemon,misc}/<nome>.png`, com a paleta do `paletteTag` de cada um (`src/data/object_events/object_event_graphics_info.h`): `npc_white`, `npc_pink`, `npc_green` ou `npc_blue` |

O tamanho, a colisão de cada mapa, o catálogo das folhas e os móveis saem em
`src/data/hubMaps.js`. As portas, as pessoas e as falas ficam em `src/data/hub.js`
e `src/data/dialogue.js` (feitos à mão).

## Gerados por `tools/assets/gym_banners.py` (o painel da fase, 0.31)

Mesma fonte (o decomp no Pokemon All, só leitura). Cada banner é uma faixa de 12x4
metatiles (192x64) do mapa do salão, recortada em volta de onde o líder fica (o
`object_event` dele no `map.json`). O painel da fase mostra em 2x, com o retrato
do líder por cima.

```bash
python tools/assets/gym_banners.py                   # procura ../Pokemon All
```

| Saída | Origem no decomp |
|---|---|
| `ui/gym-banners/{pewter,cerulean,vermilion,celadon,fuchsia,saffron,cinnabar,viridian}_gym.png` | `data/layouts/` dos 8 ginásios (`<Cidade>_Gym`); Pewter com o recorte 1 tile à direita e Vermilion 1 tile abaixo, onde pegava parede demais; o salão de Vermilion tem 11 de largura e repete a borda |
| `ui/gym-banners/{lorelei,bruno,agatha,lance,champion}_room.png` | `PokemonLeague_LoreleisRoom`, `_BrunosRoom`, `_AgathasRoom`, `_LancesRoom` e `_ChampionsRoom` |

## Gerados por `tools/assets/dive.py` (a descida do Dive, 0.36)

Do decomp do **Emerald** (pret/pokeemerald, commit `731ad5b`, clone parcial em
`D:\fellipe\Dev\pokeemerald`, só leitura). Os mapas são montados com os metatiles do
tileset primário `general` e do secundário `underwater`, com as paletas do `.pal`
(0-5 do primário, 6-12 do secundário). A grade do que é navegável vem do `map.bin`:
colisão 0 (bits 10-11) e elevação 3 (bits 12-15).

```bash
python tools/assets/dive.py      # procura ../pokeemerald e ../Pokemon All
```

| Saída | Origem |
|---|---|
| `dive/r126.png`, `dive/r127.png` | `data/layouts/Underwater_Route126` e `Underwater_Route127`, recortados na região dos tabuleiros e dos caminhos entre eles |
| `dive/cave.png` | `data/layouts/Underwater_MarineCave` (a entrada submersa da Caverna Marinha) |
| `dive/red.png`, `dive/leaf.png` | o Red e a Leaf do jogo (`trainers/`), pintados com os 4 tons de `graphics/object_events/palettes/player_underwater.pal` e sentados na sombra do Pokémon de `object_events/pics/people/brendan/underwater.png` (o Emerald só tem o Brendan e a May submersos) |
| `pokemon/gen3/icons/<n>.png` de Hoenn (318-321, 340-342, 350, 365-369, 382) | os ícones de caixa do Emerald, via `assets/pokemon/gen3/icons/` do Pokemon All, de 4x para 1x |
| `src/data/diveWorld.js` | o catálogo: o recorte, a grade navegável, os tabuleiros, a saída e a entrada de cada mapa; o salão, a arena e as folhas do modo aquático |
| `dive/hall.png` (0.37) | `data/layouts/MarineCave_End` (o salão do Kyogre), com o tileset `cave`; a colisão vai para o catálogo |
| `dive/kyogre_ow.png` | `graphics/object_events/pics/pokemon/kyogre.png`, com a paleta `npc_4.pal` (a do `OBJ_EVENT_PAL_TAG_NPC_4`) |
| `dive/fog.png` | `graphics/weather/fog_horizontal.png` com `fog.pal` (o tempo `WEATHER_FOG_HORIZONTAL` do salão) |
| `dive/transition.png` | a transição `B_TRANSITION_KYOGRE`: `graphics/battle_transitions/kyogre.png` e `kyogre.bin`, um quadro por paleta de `kyogre_pt1.pal` (10) e `kyogre_pt2.pal` (14) |
| `scenes/marine_cave.png` | as metatiles da arena da luta (o chão, a rocha e o lago do `MarineCave_End`); o layout da arena vai para o catálogo |
| `ui/gym-banners/kyogre_hall.png` | o lago do `MarineCave_End`, o banner do card da fase |
| `dive/maxie.png` | `graphics/object_events/pics/people/team_magma/maxie.png`, com a paleta `npc_2.pal` |
| `dive/exclam.png`, `dive/bird.png` | `graphics/field_effects/pics/emotion_exclamation.png` e `bird.png` |
| `dive/band_out.png`, `dive/band_in.png` | o corte de tela do Voar: `field_move_streaks` e `field_move_streaks_indoors` (tiles e tilemap) |
| `dive/crobat.png` | o Crobat da Gen 3 (`assets/pokemon/gen3/front/169.png` do Pokemon All), reduzido a 64x64 |
| `pokemon/<dex>.png` de Hoenn e o Kyogre (318-321, 340, 342, 350, 365, 367-369, 382; e `pokemon/shiny/382.png`) | os GIFs da Gen 5 do Pokemon All (`assets/pokemon/battle`), no mesmo corte do extract.py |
| `pokemon/gen3/front/382.png`, `items/dive-ball.png`, `sound/cries/382.ogg` | do Pokemon All: o Kyogre da Gen 3, a Dive Ball (PokeAPI) e o grito do Kyogre |

A música da vila e do mapa da jornada, `music/mus_pallet.ogg` (0.37.6), é o tema de Pallet do FireRed; a da
descida do Dive, `music/mus_underwater.ogg`, é a "Underwater" do Emerald, pelo mesmo `render_music.py`
com os instrumentos e a partitura do decomp pret/pokeemerald (`EMERALD_MUSIC`, o clone em `../pokeemerald`).

A música da luta do Kyogre, `music/mus_vs_legend.ogg` (0.37), é a "Vs. Lendário" do FireRed, pelo
`tools/assets/render_music.py` (a partitura do decomp pret/pokefirered).

## Copiados do Pokemon All

| Saída | Origem |
|---|---|
| `pokemon/<dex>.png` | `assets/pokemon/battle/front/<dex>.gif` (GIFs da Gen 5), convertidos em tira de quadros com paleta reduzida |
| `pokemon/shiny/<dex>.png` | o mesmo, de `assets/pokemon/battle/front-shiny/<dex>.gif`: as cores shiny (0.13.1) |
| `items/poke-ball.png`, `items/magnet.png`, `items/potion.png` | `assets/items/default/<nome>.png` (vêm do PokeAPI/sprites), copiados como estão: a Poké Ball, o Ímã e a Poção que caem no chão |

Os PNG do decomp são indexados com uma paleta provisória; as cores de verdade estão
nos `.pal`. O índice 0 é transparente, e o recorte é sempre pelo índice, nunca pela cor.

## Músicas (`tools/assets/render_music.py`)

| Saída | Origem |
|---|---|
| `music/mus_*.ogg` | as músicas do FireRed renderizadas pelo motor de som do jogo (o m4a), com o sintetizador copiado do Pokemon All (`extracted/pokefirered/tools/render_sound.py` de lá). Instrumentos, samples e `midi.cfg` vêm do decomp do Pokemon All (só leitura); as partituras que ele não guardou, do decomp público pret/pokefirered no commit `c75f352` |
| `music/lobby-theme.ogg` | o tema do lobby do Pokemon All (`src/app/assets/lobby-theme.ogg`), copiado como está |

`src/data/musicTracks.js` guarda onde cada loop começa e acaba. As vinhetas
(`music/mus_heal.ogg`, a cura do Centro Pokémon) tocam uma vez e não têm loop.

## Copiados do Pokemon All (interface)

| Saída | Origem |
|---|---|
| `ui/window-frame.png`, `ui/window-frame-button.png` | `src/app/assets/` do Pokemon All: a `graphics/text_window/type2.png` do decomp com a paleta `stdpal_0`, já ampliada (3x e 2x) para o `border-image` sair nítido |
| `fonts/*.woff2` | Press Start 2P e Pixelify Sans, as fontes do Pokemon All, baixadas do Google Fonts (licença SIL Open Font License 1.1, que permite redistribuir) |

## PC do FireRed (`tools/assets/copy_pc_art.py`, do Pokemon All)

| Saída | Origem |
|---|---|
| `pc/*.png` (fundo, painéis, botão, mão, setas) | `src/app/assets/pc/` do Pokemon All: peças da folha da interface do PC do FireRed (The Spriters Resource), recortadas lá por `extract_pc_interface.py`, ampliadas 4x |
| `pc/wallpapers/*.png` | os 16 papéis de parede do jogo e as faixas deles, do mesmo lugar |
| `pokemon/gen3/icons/<dex>.png`, `pokemon/gen3/front/<dex>.png`, `pokemon/gen3/front-shiny/<dex>.png` | ícone de caixa (32x64, dois quadros) e sprite frontal (64x64) do FireRed, do decomp pret/pokefirered via `assets/pokemon/gen3/` do Pokemon All, reduzidos de 4x para 1x |

## Lobby (0.13)

| Saída | Origem |
|---|---|
| `ui/region-map/kanto.png` | o Town Map de Kanto, montado por `tools/assets/extract_region_map.py` do decomp do Pokemon All (`graphics/region_map`: `kanto.bin` sobre `region_map.png` com `region_map.pal`), recortado à moldura do mapa; o botão das Ilhas Sevii coberto com o mar de cima. As casas das cidades vêm de `region_map_layout_kanto.h` do pret/pokefirered (commit `c75f352`) |
| `ui/region-map/cursor.png`, `ui/region-map/player-{red,leaf}.png` | o cursor do Town Map e os ícones do Red e da Leaf, com as paletas deles, do mesmo lugar |
| `ui/trainer-card.png` | o Cartão de Treinador azul do FireRed (`src/app/assets/trainer-card/card-front-0.png` do Pokemon All), reduzido de 4x para 1x por `copy_pc_art.py` |

## Outros

| Arquivo | Origem |
|---|---|
| `ui/title-background.webp` | arte do Fellipe para a tela de título (2026-11-02), convertida para WebP |
| `banner.png` | o banner do README: o logo do jogo sobre a arte do título (a do Fellipe), fotografado de `tools/banner.html` com `npm run screens -- banner --size 1280x480 --out assets` |
| os GIFs animados da interface (HUD da equipe, telas de nível e evolução, Pokédex), os ícones de item e as insígnias | não ficam aqui: vêm do [PokeAPI/sprites](https://github.com/PokeAPI/sprites) pela internet (ver `CONFIG.sprites`). Os Pokémon em campo e nos cards de escolha são os locais, acima |

## Licença

É arte da Nintendo / Game Freak / Creatures, da mesma natureza dos sprites da
PokeAPI. O projeto é de fã e sem fins lucrativos (ver o aviso no README). O decomp
não declara licença; o logotipo do FireRed não é usado.
