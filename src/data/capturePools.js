import { POKEMON } from './pokemon.js';

/**
 * POOLS DE CAPTURA — quais Pokémon podem aparecer na Poké Ball, por fase.
 *
 * As porcentagens são as da tabela de design: a chance de cada espécie
 * aparecer entre as opções oferecidas. Os iniciais não estão nas tabelas: os
 * dois que o jogador não escolheu entram raros da Fase 3 em diante
 * (STARTER_CAPTURES, 0.11). Os lendários têm sorteio próprio (0.18,
 * data/legendaries.js).
 *
 * As 151 espécies existem desde a 0.7. `poolEntries` continua ignorando quem
 * não estiver em data/pokemon.js, então uma espécie nova (de outra região, por
 * exemplo) pode entrar na tabela antes de ser implementada.
 *
 * Para conferir o quanto de cada fase já está pronto: `npm run check`.
 */
export const CAPTURE_POOLS = {
  /* ===================== FASE 1 — até Brock ===================== */
  phase1: {
    id: 'phase1',
    name: 'Rotas iniciais',
    species: {
      // 0.11.2, a pedido do Fellipe: mais variedade, quase tudo forma básica.
      // Rotas 1, 2, 22 e 3, a Floresta de Viridian e a pesca do começo do FireRed.
      rattata: 11, pidgey: 11, spearow: 8, caterpie: 8, weedle: 8,
      nidoran_f: 6, nidoran_m: 6, mankey: 5, jigglypuff: 5, ekans: 5,
      sandshrew: 4, magikarp: 4, zubat: 3, pikachu: 2, diglett: 2,
      // Água e Planta tiram 4x do Brock (Pedra/Terra). Até a 0.31 ficavam em 2 por isso;
      // na 0.32 o Fellipe achou injusto: a chance não muda por vantagem de tipo
      poliwag: 4, goldeen: 4, oddish: 4,
      clefairy: 1, abra: 1,
      // evoluídos: raros (4% somados)
      metapod: 1, kakuna: 1, raticate: 0.5, pidgeotto: 0.5,
      butterfree: 0.25, beedrill: 0.25, nidorina: 0.25, nidorino: 0.25
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
      // pesca nas Rotas 5 e 6 no FireRed — padrão até o Fellipe decidir (PLANEJAMENTO, D7)
      goldeen: 3,
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
      // Túnel de Pedra no FireRed — padrão até o Fellipe decidir (PLANEJAMENTO, D7)
      onix: 3,
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
      // Rotas 12–15 e Zona Safári no FireRed — padrão até o Fellipe decidir (PLANEJAMENTO, D7)
      venonat: 3,
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
      // Rotas 16–18 no FireRed — padrão até o Fellipe decidir (PLANEJAMENTO, D7)
      doduo: 3,
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
      // Ilhas Seafoam no FireRed — padrão até o Fellipe decidir (PLANEJAMENTO, D7)
      seel: 3,
      // 0.11: mais variedade ("são poucos a disposição"); Staryu é pesca de Seafoam
      staryu: 3, persian: 0.5, venomoth: 0.5,
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
      // 0.11: mais variedade
      arbok: 1, parasect: 0.5,
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
      snorlax: 1.5, dragonair: 1, dragonite: 1
      // os lendários saíram da tabela (0.18): têm sorteio próprio, da Fase 7 ao
      // Campeão (LEGENDARY_ENCOUNTERS em data/legendaries.js)
    }
  }
};

/** A ordem das tabelas na jornada (para acumular as anteriores). */
const ORDER = ['phase1', 'phase2', 'phase3', 'phase4', 'phase5', 'phase6', 'phase7', 'phase8', 'phase9'];

/**
 * Os iniciais que o jogador não escolheu: raros, a partir da Fase 3 (0.11, mais
 * variedade). Quem filtra o inicial do próprio jogador é o CaptureSystem.
 */
export const STARTER_CAPTURES = { bulbasaur: 0.8, charmander: 0.8, squirtle: 0.8 };

/**
 * Entradas válidas de um pool: só as espécies que já existem no jogo. O peso é
 * a própria porcentagem da tabela — o sorteio normaliza sozinho.
 *
 * Desde a 0.11 a tabela de uma fase acumula as das fases anteriores, com metade
 * do peso (as espécies de antes continuam aparecendo, mais raras), e da Fase 3
 * em diante entram os iniciais (STARTER_CAPTURES).
 */
export function poolEntries(poolId) {
  const pool = CAPTURE_POOLS[poolId];
  if (!pool) return [];
  const weights = { ...pool.species };
  const index = ORDER.indexOf(poolId);
  for (const earlier of ORDER.slice(0, Math.max(0, index))) {
    for (const [id, weight] of Object.entries(CAPTURE_POOLS[earlier].species)) {
      if (!(id in pool.species)) weights[id] = Math.max(weights[id] ?? 0, weight * 0.5);
    }
  }
  if (index >= 2) Object.assign(weights, STARTER_CAPTURES);
  return Object.entries(weights)
    .filter(([id]) => POKEMON[id])
    .map(([id, weight]) => ({ pokemon: POKEMON[id], weight }));
}

export const getCapturePool = (id) => CAPTURE_POOLS[id];
