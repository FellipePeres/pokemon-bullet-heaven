/**
 * O LEVEL CAP (PLANEJAMENTO-HISTORIA.md, seção 13.1; o Fellipe, 2026-11-12: "não pode ser um
 * level cap onde fica impossível, mas não pode ser fácil por fase").
 *
 * - Cada fase da história tem um teto de nível. Vale o da PRÓXIMA fase a vencer (a primeira de
 *   STORY_ORDER que a jornada ainda não venceu), em qualquer lugar: na tentativa dela, ao
 *   rejogar uma fase vencida e no Modo Livre. Vencer a fase sobe o teto para o da seguinte.
 * - No teto, o Pokémon não ganha XP, e a parte dele SOME: não vai para ninguém (o Fellipe:
 *   "senão seria muito meta pegar Pokémon no teto no time e upar os outros"). A divisão do XP
 *   continua a de sempre (systems/ProgressionSystem.js).
 * - O teto segura a evolução por nível; a por item é livre (o Poké Mart).
 * - Quem entra na equipe (captura, presente, lendário) chega pela média da equipe, então fica
 *   abaixo do teto sozinho.
 * - Depois do Campeão não há teto: o Kyogre (90) é o desafio de depois da história.
 *
 * Os valores saem do bot (tools/balance.mjs --teto): o teto fica pouco acima do nível com que
 * a equipe vence a fase jogando normal, sem farmar. Assim farmar não passa de alguns níveis
 * (não fica fácil), e quem joga normal quase nunca encosta nele (não fica impossível).
 */

/** A ordem da história: as fases e as missões dos lendários, no lugar delas. */
export const STORY_ORDER = [
  'gym_1_pewter', 'gym_2_cerulean', 'gym_3_vermilion', 'zapdos', 'gym_4_celadon', 'gym_5_fuchsia',
  'gym_6_saffron', 'gym_7_cinnabar', 'articuno', 'gym_8_viridian', 'moltres',
  'e4_lorelei', 'e4_bruno', 'e4_agatha', 'e4_lance', 'champion'
];

/** A missão que a história põe depois de cada fase (para o bot jogar a campanha como o jogador). */
export const STORY_MISSIONS = { gym_3_vermilion: 'zapdos', gym_7_cinnabar: 'articuno', gym_8_viridian: 'moltres' };

/** O teto enquanto a fase é a próxima a vencer. */
export const LEVEL_CAPS = {
  gym_1_pewter: 28,
  gym_2_cerulean: 37,
  gym_3_vermilion: 48,
  zapdos: 49,
  gym_4_celadon: 54,
  gym_5_fuchsia: 57,
  gym_6_saffron: 60,
  gym_7_cinnabar: 63,
  articuno: 64,
  gym_8_viridian: 68,
  moltres: 69,
  e4_lorelei: 73,
  e4_bruno: 76,
  e4_agatha: 80,
  e4_lance: 84,
  champion: 86
};

/** O nível máximo do jogo (sem teto). */
export const MAX_LEVEL = 100;

/** A próxima fase a vencer na história, ou null depois do Campeão. */
export function capStage(clearedStages = []) {
  return STORY_ORDER.find((id) => !clearedStages.includes(id)) ?? null;
}

/** O teto de nível da jornada agora (MAX_LEVEL depois do Campeão). */
export function levelCapFor(clearedStages = []) {
  const stage = capStage(clearedStages);
  return stage ? LEVEL_CAPS[stage] : MAX_LEVEL;
}
