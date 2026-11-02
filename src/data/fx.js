/**
 * EFEITOS VISUAIS DOS GOLPES — os sprites de animação do FireRed.
 *
 * Só aparência: dano, alcance e recarga continuam em abilities.js. As folhas
 * são geradas por tools/assets/extract.py, e o sprite de cada golpe é o que a
 * animação dele carrega no FireRed (`loadspritegfx` em battle_anim_scripts.s).
 * Golpes que não existem no FireRed (Fire Ring, Leech Field, Hurricane...) usam
 * o do golpe mais parecido.
 *
 * FX — como cada efeito anima:
 *   sheet    folha do assetManifest (padrão: fx/<id>)
 *   frames   quais quadros usar, em ordem (padrão: todos)
 *   fps      quadros por segundo (0 = parado; o quadro vem de quem desenha)
 *   scale    escala da pixel art (padrão: CONFIG.render.pixelScale)
 *   rotate   gira para a direção do movimento; `angle` é para onde a arte
 *            aponta na folha (0 = direita, -PI/2 = para cima)
 *   spin     gira sozinho (radianos por segundo)
 *   anchorY  apoio vertical (padrão 0.5 = centro; 1 = pela base)
 */
const UP = -Math.PI / 2;

export const FX = {
  // ---- fogo ----
  ember:         { sheet: 'fx/small_ember', frames: [1, 2, 3], fps: 12 },
  flame:         { sheet: 'fx/fire', fps: 12 },
  fire_swirl:    { sheet: 'fx/spinning_fire', fps: 12 },
  explosion:     { fps: 16 },
  // ---- água ----
  water_orb:     { fps: 8 },
  water_impact:  {},
  bubble:        { frames: [0] },
  bubble_pop:    { sheet: 'fx/bubble', frames: [1, 2] },
  blue_ring:     { rotate: true, angle: 0 },
  // ---- planta ----
  leaf:          { fps: 18 },
  razor_leaf:    {},
  whip_hit:      { frames: [0, 1, 2, 3], rotate: true, angle: 0 },
  green_sparkle: { fps: 10 },
  // ---- veneno ----
  poison_drop:   { sheet: 'fx/poison_bubble', frames: [0] },
  poison_splat:  { sheet: 'fx/poison_bubble', frames: [1, 2] },
  toxic_bubble:  { fps: 8 },
  // ---- pedra e terra ----
  rock:          { sheet: 'fx/rocks', frames: [1], spin: 5 },
  boulder:       { sheet: 'fx/rocks', frames: [0], spin: 3 },
  rock_bits:     { sheet: 'fx/rocks', frames: [3, 4, 5] },
  mud_sand:      { spin: 6 },
  flying_dirt:   { fps: 8, rotate: true, angle: 0 },
  // ---- contato ----
  impact:        { scale: 1 },
  cut:           { rotate: true, angle: Math.PI / 4 },
  scratch:       { rotate: true, angle: 0 },
  slam_hit:      { frames: [0, 1, 2, 3], rotate: true, angle: 0 },
  hand:          { sheet: 'fx/hands', frames: [3] },
  cross_impact:  {},
  fang_attack:   {},
  needle:        { rotate: true, angle: UP },
  // ---- vento ----
  gust:          { scale: 1 },
  // ---- psíquico, normal e fada ----
  gold_ring:     { rotate: true, angle: 0 },
  purple_ring:   { rotate: true, angle: 0 },
  pink_orb:      {},
  orb:           { sheet: 'fx/orbs', frames: [2] },
  big_orb:       { sheet: 'fx/orbs', frames: [2], scale: 3 },
  blue_star:     { fps: 14, scale: 1 },
  metal_sound:   { rotate: true, angle: 0, scale: 1 },
  magenta_heart: {},
  // ---- terra, fantasma e dragão ----
  bone:          { spin: 9 },
  tongue:        { fps: 18 },
  shadow_ball:   { spin: 4 },
  purple_flame:  { fps: 10 },
  ghostly_spirit: {},
  // ---- elétrico e gelo ----
  spark:         { fps: 14 },
  shock:         { fps: 12, scale: 1 },
  lightning:     { anchorY: 1 },
  ice_crystal:   { spin: 3 },
  ice_chunk:     { fps: 10 },
  hail:          { spin: 4 },
  // ---- inseto ----
  spider_web:    {},
  // ---- aviso do golpe do líder (o alvo do Rock Tomb) ----
  x_sign:        { scale: 1 }
};

/**
 * O visual de cada golpe, pelo comportamento dele (ver abilities.js):
 *   projectile   body (o projétil) e hit (o acerto)
 *   orbit        body (o orbe)
 *   aura         ring (sprites ao longo da borda)
 *   ground_zone  scatter (espalhados pela área) e center (um no meio)
 *   nova         ring (na frente da onda) e count (quantos)
 *   chain        node (em cada alvo) e strike (cai do céu no primeiro alvo)
 *   melee_arc    slash (no alvo)
 *   shake        tremor de tela, em pixels (Earthquake, golpes de chefe)
 */
export const ABILITY_FX = {
  // ---- projéteis ----
  ember:         { body: 'ember', hit: 'explosion' },
  water_gun:     { body: 'water_orb', hit: 'water_impact' },
  peck:          { body: 'needle', hit: 'impact' },
  rock_throw:    { body: 'rock', hit: 'rock_bits' },
  poison_sting:  { body: 'needle', hit: 'poison_splat' },
  confusion:     { body: 'pink_orb', hit: 'blue_star' },
  flamethrower:  { body: 'ember', hit: 'explosion' },
  ice_beam:      { body: 'ice_crystal', hit: 'ice_crystal' },
  solar_beam:    { body: 'orb', hit: 'green_sparkle' },
  psychic_wave:  { body: 'purple_ring', hit: 'blue_star' },
  hyper_beam:    { body: 'big_orb', hit: 'explosion' },
  razor_leaf:    { body: 'leaf', hit: 'razor_leaf' },
  bubble_beam:   { body: 'bubble', hit: 'bubble_pop' },
  twineedle:     { body: 'needle', hit: 'impact' },
  rock_slide:    { body: 'boulder', hit: 'rock_bits' },
  psybeam:       { body: 'gold_ring', hit: 'blue_star' },
  fire_blast:    { body: 'flame', hit: 'explosion' },
  hydro_pump:    { body: 'water_orb', hit: 'water_impact' },
  sludge_bomb:   { body: 'poison_drop', hit: 'poison_splat' },

  // ---- órbitas ----
  fire_spin:     { body: 'fire_swirl' },

  // ---- auras ----
  mega_drain:    { ring: 'green_sparkle' },

  // ---- zonas no chão ----
  string_shot:   { center: 'spider_web' },
  toxic:         { scatter: 'toxic_bubble' },
  bug_bite:      { scatter: 'fang_attack' },

  // ---- ondas ----
  gust:          { ring: 'gust', count: 6 },
  earthquake:    { ring: 'flying_dirt', count: 12, shake: 5 },
  water_pulse:   { ring: 'blue_ring', count: 12 },
  disarming_voice: { ring: 'magenta_heart', count: 10 },
  hurricane:     { ring: 'gust', count: 10 },
  hyper_voice:   { ring: 'metal_sound', count: 10 },

  // ---- raios ----
  thunder_shock: { node: 'spark' },
  thunderbolt:   { node: 'shock' },
  thunder:       { node: 'spark', strike: 'lightning' },

  // ---- corpo a corpo ----
  vine_whip:     { slash: 'whip_hit' },
  quick_attack:  { slash: 'impact' },
  leech_life:    { slash: 'blue_star' },
  karate_chop:   { slash: 'hand' },
  wing_attack:   { slash: 'cut' },
  hyper_fang:    { slash: 'fang_attack' },
  poison_fang:   { slash: 'fang_attack' },
  seismic_toss:  { slash: 'slam_hit' },
  cross_chop:    { slash: 'cross_impact' },

  // ---- tipos novos (0.6) ----
  mud_slap:      { body: 'mud_sand', hit: 'flying_dirt' },
  bone_club:     { body: 'bone', hit: 'impact' },
  lick:          { slash: 'tongue' },
  night_shade:   { node: 'purple_flame' },
  shadow_ball:   { body: 'shadow_ball', hit: 'ghostly_spirit' },
  twister:       { ring: 'gust', count: 6 },
  dragon_breath: { body: 'ember', hit: 'explosion' },
  outrage:       { slash: 'slam_hit' },
  powder_snow:   { ring: 'hail', count: 12 },
  blizzard:      { ring: 'ice_chunk', count: 16 },

  // ---- golpes dos líderes (chegam com aviso no chão) ----
  leader_rock_barrage: { ring: 'boulder', count: 10, shake: 6 },
  leader_whirlpool:    { ring: 'water_orb', count: 14, shake: 3 },
  boss_shockwave:      { ring: 'flying_dirt', count: 12, shake: 5 }
};

/**
 * O golpe genérico dos líderes (`boss_shockwave`) muda de cara conforme o
 * tipo de quem usa: um golpe só para todos os líderes, mais leve.
 */
export const BOSS_WAVE_FX = {
  normal: { ring: 'flying_dirt', count: 12, shake: 5 },
  fire: { ring: 'flame', count: 10, shake: 5 },
  water: { ring: 'water_orb', count: 14, shake: 4 },
  grass: { ring: 'leaf', count: 14, shake: 4 },
  electric: { ring: 'spark', count: 14, shake: 4 },
  poison: { ring: 'toxic_bubble', count: 14, shake: 4 },
  psychic: { ring: 'purple_ring', count: 12, shake: 4 },
  ground: { ring: 'flying_dirt', count: 14, shake: 6 },
  rock: { ring: 'boulder', count: 10, shake: 6 },
  ice: { ring: 'ice_chunk', count: 14, shake: 4 },
  fighting: { ring: 'impact', count: 10, shake: 6 },
  ghost: { ring: 'ghostly_spirit', count: 8, shake: 4 },
  dragon: { ring: 'flame', count: 12, shake: 6 },
  flying: { ring: 'gust', count: 8, shake: 4 },
  bug: { ring: 'fang_attack', count: 10, shake: 4 },
  fairy: { ring: 'magenta_heart', count: 12, shake: 4 }
};

/**
 * Ícone de status em cima do inimigo. A lentidão fica de fora (vira só um
 * pontinho): quase todo golpe de água, gelo e terra deixa lento, e um sprite em
 * cada inimigo da horda poluía a tela.
 */
export const STATUS_FX = {
  burn: 'ember',
  poison: 'poison_drop'
};

export const abilityFx = (abilityId) => ABILITY_FX[abilityId] ?? null;

/** Visual de uma área ou onda: o golpe genérico do líder segue o tipo dele. */
export const zoneFx = (zone) =>
  (zone.abilityId === 'boss_shockwave' && BOSS_WAVE_FX[zone.visualType]) || abilityFx(zone.abilityId);
