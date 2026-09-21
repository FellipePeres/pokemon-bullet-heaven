import { POKEMON } from './pokemon.js';

/**
 * POOLS DE CAPTURA — quais Pokémon podem aparecer na Poké Ball, por fase.
 *
 * As porcentagens são as da tabela de design: a chance de cada espécie
 * aparecer entre as opções oferecidas. Os três iniciais ficam de fora de
 * propósito (são escolhidos no começo e não competem com as capturas).
 *
 * As fases 3 a 9 já estão registradas aqui como especificação. Espécies que
 * ainda não existem em data/pokemon.js são ignoradas automaticamente
 * (`poolEntries` filtra), e passam a aparecer sozinhas assim que forem
 * implementadas — não é preciso mexer em código nenhum.
 *
 * Para conferir o quanto de cada fase já está pronto: `npm run check`.
 */
export const CAPTURE_POOLS = {
  /* ===================== FASE 1 — até Brock ===================== */
  phase1: {
    id: 'phase1',
    name: 'Rotas iniciais',
    species: {
      rattata: 22, pidgey: 20, caterpie: 13, weedle: 13, spearow: 8,
      nidoran_f: 5, nidoran_m: 5, metapod: 3, kakuna: 3,
      raticate: 2, pidgeotto: 2, pikachu: 1, butterfree: 1, beedrill: 1,
      nidorina: 0.5, nidorino: 0.5
    }
  },

  /* ===================== FASE 2 — até Misty ===================== */
  phase2: {
    id: 'phase2',
    name: 'Monte Lua e Cerulean',
    species: {
      rattata: 12, pidgey: 10, zubat: 8, magikarp: 7, nidoran_f: 5, nidoran_m: 5,
      spearow: 5, oddish: 5, bellsprout: 5, poliwag: 5, geodude: 5,
      ekans: 4, sandshrew: 4, paras: 3, clefairy: 3, jigglypuff: 3, pikachu: 3,
      pidgeotto: 2, raticate: 2, golbat: 1, abra: 1, butterfree: 1, beedrill: 1
    }
  },

  /* ================== FASE 3 — até Lt. Surge ================== */
  phase3: {
    id: 'phase3',
    name: 'Rotas 5 e 6',
    species: {
      rattata: 7, pidgey: 6, zubat: 6, magikarp: 6, geodude: 6, poliwag: 5,
      oddish: 5, bellsprout: 5, pikachu: 5, meowth: 4, psyduck: 4, mankey: 4,
      diglett: 4, sandshrew: 3, ekans: 3, growlithe: 3, vulpix: 3, ponyta: 2,
      slowpoke: 2, magnemite: 2, voltorb: 2, abra: 1,
      kadabra: 0.5, raichu: 0.5, dugtrio: 0.5, fearow: 0.5, primeape: 0.5
    }
  },

  /* ===================== FASE 4 — até Erika ===================== */
  phase4: {
    id: 'phase4',
    name: 'Rota 7 e Celadon',
    species: {
      zubat: 5, geodude: 5, psyduck: 5, poliwag: 5, oddish: 5, bellsprout: 5,
      meowth: 4, growlithe: 4, vulpix: 4, ponyta: 4, gastly: 4, drowzee: 4, machop: 4,
      diglett: 3, magnemite: 3, voltorb: 3, krabby: 3, horsea: 3, tentacool: 3,
      rhyhorn: 2, cubone: 2, exeggcute: 2, eevee: 2,
      kadabra: 1.5, haunter: 1.5, graveler: 1, weepinbell: 1, gloom: 1,
      raichu: 0.5, arcanine: 0.5, ninetales: 0.5
    }
  },

  /* ===================== FASE 5 — até Koga ===================== */
  phase5: {
    id: 'phase5',
    name: 'Ciclovia e Rotas 16-19',
    species: {
      zubat: 4, golbat: 3, geodude: 3, graveler: 3, psyduck: 3, golduck: 2,
      poliwag: 3, poliwhirl: 2, tentacool: 4, tentacruel: 2, krabby: 3, kingler: 1,
      horsea: 3, seadra: 1, shellder: 3, cloyster: 1, gastly: 3, haunter: 2,
      drowzee: 3, hypno: 1, machop: 3, machoke: 1, koffing: 3, grimer: 3, muk: 1,
      rhyhorn: 2, rhydon: 0.5, exeggcute: 2, exeggutor: 0.5, cubone: 2, marowak: 1,
      tangela: 1, scyther: 0.5, pinsir: 0.5, chansey: 0.5, kangaskhan: 0.5,
      tauros: 0.5, dratini: 0.5, lapras: 0.5, ditto: 1, eevee: 1,
      vaporeon: 0.5, jolteon: 0.5, flareon: 0.5
    }
  },

  /* ==================== FASE 6 — até Sabrina ==================== */
  phase6: {
    id: 'phase6',
    name: 'Saffron',
    species: {
      golbat: 3, kadabra: 3, haunter: 3, machoke: 3, graveler: 3,
      gloom: 2, weepinbell: 2, ivysaur: 2, charmeleon: 2, wartortle: 2,
      raichu: 2, arcanine: 2, ninetales: 2, rapidash: 2, magneton: 2, dugtrio: 2,
      hypno: 2, weezing: 2, muk: 2, marowak: 2, rhyhorn: 2,
      rhydon: 1, exeggutor: 1, victreebel: 1, vileplume: 1, gengar: 1, alakazam: 1,
      machamp: 1, poliwrath: 1, slowbro: 1, cloyster: 1, starmie: 1, scyther: 1,
      pinsir: 1, tauros: 1, kangaskhan: 1, chansey: 1, lapras: 1, snorlax: 1,
      gyarados: 1, dragonair: 0.5, porygon: 0.4, dragonite: 0.1
    }
  },

  /* ===================== FASE 7 — até Blaine ===================== */
  phase7: {
    id: 'phase7',
    name: 'Cinnabar',
    species: {
      golbat: 2.5, graveler: 2.5, kadabra: 2.5, haunter: 2.5, machoke: 2.5,
      ivysaur: 2, charmeleon: 2, wartortle: 2, arcanine: 2, ninetales: 2,
      rapidash: 2, magneton: 2, weezing: 2, muk: 2, rhydon: 2,
      victreebel: 1.5, vileplume: 1.5, gengar: 1.5, alakazam: 1.5, machamp: 1.5,
      poliwrath: 1.5, slowbro: 1.5, starmie: 1.5, cloyster: 1.5, gyarados: 1.5,
      exeggutor: 1.5, dragonair: 1, lapras: 1, snorlax: 1, tauros: 1,
      kangaskhan: 1, chansey: 1, scyther: 1, pinsir: 1, porygon: 1,
      dragonite: 0.5, omanyte: 0.5, kabuto: 0.5, aerodactyl: 0.5,
      kabutops: 0.5, omastar: 0.5
    }
  },

  /* ==================== FASE 8 — até Giovanni ==================== */
  phase8: {
    id: 'phase8',
    name: 'Viridian',
    species: {
      pidgeot: 1, fearow: 1, raichu: 1, sandslash: 1, nidoqueen: 1, nidoking: 1,
      clefable: 1, wigglytuff: 1, vileplume: 1.5, victreebel: 1.5,
      arcanine: 2, ninetales: 2, golduck: 1.5, poliwrath: 1.5, alakazam: 2,
      machamp: 2, golem: 1.5, rapidash: 1.5, slowbro: 1.5, magneton: 1.5,
      dodrio: 1.5, dewgong: 1, cloyster: 1.5, gengar: 2, hypno: 1.5, kingler: 1,
      electrode: 1, exeggutor: 1.5, marowak: 1, weezing: 1.5, rhydon: 2,
      tangela: 1, seadra: 1, seaking: 1, starmie: 2, mr_mime: 1, scyther: 1,
      jynx: 1, electabuzz: 1, magmar: 1, pinsir: 1, tauros: 1.5, gyarados: 2,
      lapras: 1.5, ditto: 1, vaporeon: 1, jolteon: 1, flareon: 1, porygon: 1,
      snorlax: 1.5, dragonair: 1, omastar: 0.5, kabutops: 0.5, aerodactyl: 0.5,
      dragonite: 0.5
    }
  },

  /* ========== FASE 9 — Victory Road, Elite Four e Campeão ========== */
  phase9: {
    id: 'phase9',
    name: 'Victory Road e Liga',
    species: {
      pidgeot: 1, fearow: 1, raichu: 1, sandslash: 1, nidoqueen: 1, nidoking: 1,
      clefable: 1, wigglytuff: 1, vileplume: 1, victreebel: 1,
      arcanine: 1.5, ninetales: 1.5, golduck: 1, poliwrath: 1, alakazam: 1.5,
      machamp: 1.5, golem: 1, rapidash: 1, slowbro: 1, magneton: 1, dodrio: 1,
      dewgong: 1, cloyster: 1, gengar: 1.5, hypno: 1, kingler: 1, electrode: 1,
      exeggutor: 1, marowak: 1, weezing: 1, rhydon: 1.5, tangela: 1, seadra: 1,
      seaking: 1, starmie: 1.5, mr_mime: 1, scyther: 1, jynx: 1, electabuzz: 1,
      magmar: 1, pinsir: 1, tauros: 1.5, gyarados: 1.5, lapras: 1.5, ditto: 1,
      vaporeon: 1, jolteon: 1, flareon: 1, porygon: 1,
      omastar: 0.75, kabutops: 0.75, aerodactyl: 0.75,
      snorlax: 1.5, dragonair: 1, dragonite: 1,
      articuno: 0.5, zapdos: 0.5, moltres: 0.5, mewtwo: 0.15, mew: 0.05
    }
  }
};

/**
 * Entradas válidas de um pool: só as espécies que já existem no jogo.
 * O peso é a própria porcentagem da tabela — o sorteio normaliza sozinho.
 */
export function poolEntries(poolId) {
  const pool = CAPTURE_POOLS[poolId];
  if (!pool) return [];
  return Object.entries(pool.species)
    .filter(([id]) => POKEMON[id])
    .map(([id, weight]) => ({ pokemon: POKEMON[id], weight }));
}

export const getCapturePool = (id) => CAPTURE_POOLS[id];
