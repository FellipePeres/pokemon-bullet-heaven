/**
 * A CENA DO MAXIE (0.37, PLANEJAMENTO-DIVE.md seção 10), aprovada na maquete
 * "Depois do Kyogre": logo depois da captura, uma vez por jornada.
 *
 * - **na frente da lagoa** (voltou à superfície): o Maxie chega correndo, o "!",
 *   a fala indignada, solta o Crobat (o corte de tela do Voar, com as listras),
 *   "A caminho do vulcão!" e o pássaro do Voar o leva pelo céu;
 * - **no Centro Pokémon** (caiu na maré final): a enfermeira conta do resgate e
 *   do Pokémon gigante, a mesma cena, e o Maxie sai correndo pela porta.
 *
 * Roda por cima da vila (game/Hub.js): enquanto ela dura, o jogador não anda; a
 * caixa de texto é a da vila. O desenho está em render/HubRenderer.js.
 */
const MAXIE = [
  'Não acredito que cheguei tarde!',
  'Você capturou o lendário Kyogre!',
  'Não posso deixar que isso aconteça com os próximos...'
];
const MAXIE_END = 'A caminho do vulcão! O próximo lendário será meu!';

/** Onde o jogador fica em cada versão (data/hub.js: a lagoa da vila e o balcão do Centro). */
export const SCENE_SPOTS = {
  lagoa: { map: 'vila', x: 30, y: 11, dir: 'down' },
  centro: { map: 'centro', x: 4, y: 5, dir: 'up' }
};

function script(version, playerName) {
  if (version === 'lagoa') {
    return {
      band: 'dive/band_out',
      maxie: { x: 21, y: 12, dir: 'right' },
      steps: [
        { do: 'wait', t: 0.6 },
        { do: 'say', lines: [`${playerName} voltou à superfície pela lagoa, com o Kyogre!`] },
        { do: 'show' },
        { do: 'walk', path: [[22, 12], [23, 12], [24, 12], [25, 12], [26, 12], [27, 12], [28, 12], [29, 12], [30, 12]], speed: 0.13 },
        { do: 'face', who: 'maxie', dir: 'up' }, { do: 'face', who: 'player', dir: 'down' },
        { do: 'emote' },
        { do: 'say', name: 'Maxie', lines: MAXIE },
        { do: 'throw' },
        { do: 'cutin' },
        { do: 'bird', mode: 'in' },
        { do: 'say', name: 'Maxie', lines: [MAXIE_END] },
        { do: 'bird', mode: 'grab' },
        { do: 'bird', mode: 'away' },
        { do: 'wait', t: 0.6 },
        { do: 'end' }
      ]
    };
  }
  return {
    band: 'dive/band_in',
    maxie: { x: 2, y: 9, dir: 'up' },
    steps: [
      { do: 'wait', t: 0.4 },
      { do: 'say', name: 'Enfermeira', lines: [
        'Ah, você acordou! O pescador da lagoa trouxe você até aqui.',
        'Disse que fisgou você desmaiado lá no fundo... e que foi o maior peixe da vida dele.',
        'E o Pokémon gigante que veio com você também está bem.'
      ] },
      { do: 'show' },
      { do: 'walk', path: [[2, 8], [2, 7], [3, 7], [4, 7], [4, 6]], speed: 0.13 },
      { do: 'face', who: 'maxie', dir: 'up' }, { do: 'face', who: 'player', dir: 'down' },
      { do: 'emote' },
      { do: 'say', name: 'Maxie', lines: MAXIE },
      { do: 'throw' },
      { do: 'cutin' },
      { do: 'bird', mode: 'in' },
      { do: 'say', name: 'Maxie', lines: [MAXIE_END] },
      // dentro de casa não dá para voar: ele sai correndo pela porta com o Crobat
      { do: 'walk', path: [[4, 7], [3, 7], [2, 7], [2, 8], [2, 9]], speed: 0.13, bird: true },
      { do: 'hide' }, { do: 'bird', mode: 'gone' },
      { do: 'wait', t: 0.6 },
      { do: 'end' }
    ]
  };
}

export class MaxieScene {
  constructor(hub, version, { playerName = 'Você', onEnd = null } = {}) {
    this.hub = hub;
    this.version = version;
    this.onEnd = onEnd;
    const s = script(version, playerName);
    this.band = s.band;
    this.steps = s.steps;
    this.step = 0;
    this.t = 0;
    this.maxie = { ...s.maxie, hidden: true, moving: false, steps: 0, prog: 0, walkPath: null };
    this.fx = { emote: null, ball: null, flash: 0, bird: null, cutin: null };
    this.done = false;
  }

  update(dt) {
    if (this.done) return;
    const hub = this.hub;
    if (this.maxie.walkPath) this._walk(dt);
    if (this.fx.bird) this.fx.bird.t += dt;
    const a = this.steps[this.step];
    if (!a) return;
    this.t += dt;
    let done = false;
    const m = this.maxie, p = hub.player;
    switch (a.do) {
      case 'wait': done = this.t >= a.t; break;
      case 'say':
        if (!a.open) {
          a.open = true;
          hub.dialog = { name: a.name ?? null, pages: a.lines, index: 0, shown: 0, ask: null, then: null, after: () => { a.closed = true; } };
        }
        done = !!a.closed;
        break;
      case 'show': m.hidden = false; done = true; break;
      case 'hide': m.hidden = true; done = true; break;
      case 'face': if (a.who === 'player') p.dir = a.dir; else m.dir = a.dir; done = true; break;
      case 'walk':
        if (!a.started) {
          a.started = true;
          m.walkPath = a.path.map(([x, y]) => ({ x, y }));
          m.speed = a.speed; m.prog = 0;
          if (a.bird) this.fx.bird = { ...(this.fx.bird ?? {}), follow: true };
        }
        done = !m.walkPath;
        break;
      case 'emote': this.fx.emote = { t: this.t }; done = this.t >= 1.0; if (done) this.fx.emote = null; break;
      case 'throw': {
        // a Poké Ball do Maxie sobe e abre num clarão
        const k = Math.min(1, this.t / 0.55);
        this.fx.ball = this.t <= 0.55 ? { x0: m.x + 0.25, y0: m.y - 0.9, x1: m.x + 1.4, y1: m.y - 0.25, k } : null;
        if (this.t > 0.55) this.fx.flash = Math.max(0, 1 - (this.t - 0.55) / 0.3);
        done = this.t >= 0.85;
        if (done) this.fx.flash = 0;
        break;
      }
      case 'cutin': this.fx.cutin = this.t; done = this.t >= 2.1; if (done) this.fx.cutin = null; break;
      case 'bird': {
        const b = this.fx.bird;
        if (a.mode === 'in') {
          if (!a.started) { a.started = true; this.fx.bird = { mode: 'in', t: 0, sx: m.x - 5.5, sy: m.y - 7, tx: m.x + 2.1, ty: m.y - 0.9 }; }
          done = this.t >= 0.9;
        } else if (a.mode === 'grab') {
          if (!a.started) { a.started = true; Object.assign(b, { mode: 'grab', t: 0, sx: b.x, sy: b.y, tx: m.x + 0.5, ty: m.y - 1.4 }); }
          if (this.t >= 0.45) { m.hidden = true; done = true; }
        } else if (a.mode === 'away') {
          if (!a.started) { a.started = true; Object.assign(b, { mode: 'away', t: 0, sx: b.x, sy: b.y, carry: true }); }
          done = this.t >= 1.3;
        } else if (a.mode === 'gone') { this.fx.bird = null; done = true; }
        break;
      }
      case 'end': this.done = true; done = true; this.onEnd?.(); break;
    }
    this._moveBird();
    if (done) { this.step++; this.t = 0; }
  }

  _walk(dt) {
    const m = this.maxie;
    const next = m.walkPath[0];
    m.moving = true;
    if (m.from == null) { m.from = { x: m.x, y: m.y }; m.dir = next.x > m.x ? 'right' : next.x < m.x ? 'left' : next.y > m.y ? 'down' : 'up'; }
    m.prog += dt / m.speed;
    const k = Math.min(1, m.prog);
    m.x = m.from.x + (next.x - m.from.x) * k;
    m.y = m.from.y + (next.y - m.from.y) * k;
    if (m.prog >= 1) {
      m.x = next.x; m.y = next.y; m.walkPath.shift(); m.from = null; m.prog = 0; m.steps++;
      if (!m.walkPath.length) { m.walkPath = null; m.moving = false; }
    }
  }

  /** O pássaro do Voar, em tiles: desce até o Maxie, pega e sai pelo céu (ou acompanha ele até a porta). */
  _moveBird() {
    const b = this.fx.bird;
    if (!b) return;
    const m = this.maxie;
    if (b.follow) { b.x = m.x - 0.9; b.y = m.y - 0.75; return; }
    if (b.mode === 'in') { const k = Math.min(1, b.t / 0.8), e = 1 - Math.pow(1 - k, 3); b.x = b.sx + (b.tx - b.sx) * e; b.y = b.sy + (b.ty - b.sy) * e; b.flip = false; }
    else if (b.mode === 'grab') { const k = Math.min(1, b.t / 0.45); b.x = b.sx + (b.tx - b.sx) * k; b.y = b.sy + (b.ty - b.sy) * k; }
    else if (b.mode === 'away') { const k = Math.min(1, b.t / 1.2); b.x = b.sx + 16 * k * k; b.y = b.sy - 10.5 * k; b.flip = true; }
  }
}
