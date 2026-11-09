import { getSheet } from './assets.js';

const TAU = Math.PI * 2;
const PIXEL = '"Pixelify Sans", sans-serif';
const clamp01 = (t) => Math.max(0, Math.min(1, t));
const easeOut = (t) => 1 - Math.pow(1 - clamp01(t), 3);

/** Um número "aleatório" fixo para (seed, i): o desenho não treme de um quadro para o outro. */
const hash = (seed, i) => { const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453; return x - Math.floor(x); };

/**
 * O DESENHO DA LUTA DO KYOGRE (systems/kyogreFight.js). Na 0.37.5, os ataques
 * ficaram cinematográficos (o Fellipe: "precisa ter impacto grande na animação"):
 * - a carga do Origin Pulse (as marcas vermelhas acendendo) e os anéis grossos;
 * - as colunas do Water Spout estourando do chão;
 * - os raios ramificados do Thunder, com o céu escurecendo e a marca queimada;
 * - o redemoinho do mergulho;
 * - o maremoto com a bolha de ar;
 * - a Dive Ball caindo num feixe de luz;
 * - a faixa da captura, como a do Voar, com a bola balançando.
 * Só lê o estado.
 */
export function drawKyogreWorld(ctx, run) {
  const fight = run.fight;
  if (!fight) return;
  const now = run.time;
  const boss = fight.boss;

  // o lago fervendo antes de ele sair
  if (fight.boiling > 0) bubbles(ctx, fight.lake.x, fight.lake.y, 150, 70, fight.boiling, now);
  // o mergulho: o redemoinho no lugar onde ele vai voltar
  if (fight.state === 'dive' && fight.t > 0.4 && fight.spot) whirlpool(ctx, fight.spot.x, fight.spot.y, clamp01((fight.t - 0.4) / 1.2), now);

  // as marcas queimadas dos raios ficam no chão um tempo
  for (const f of fight.fx) if (f.kind === 'scorch') scorch(ctx, f);

  // os avisos no chão
  for (const h of fight.hazards) if (!h.fired) warning(ctx, h);

  // a carga do Origin Pulse: as marcas vermelhas acendem e a água se junta nele
  if (fight.state === 'charge' && boss) charge(ctx, boss, clamp01(fight.t / fight.cfg.pulseCharge), now);

  // os anéis de onda
  for (const ring of fight.rings) if (ring.delay <= 0) waveRing(ctx, ring, now);

  // os efeitos do impacto: colunas, raios, estouros
  for (const f of fight.fx) {
    if (f.kind === 'column') column(ctx, f);
    else if (f.kind === 'bolt') lightning(ctx, f);
    else if (f.kind === 'splash') splash(ctx, f);
    else if (f.kind === 'ballLand') ballLand(ctx, f);
  }

  // o maremoto
  if (fight.tsunami) tsunami(ctx, run, fight.tsunami, now);

  // a Dive Ball no campo: cai do alto num feixe de luz e fica brilhando
  const sheet = getSheet('item/dive-ball');
  const ball = fight.ball;
  if (ball) diveBall(ctx, ball, sheet, now);

  // o arremesso (a faixa da captura é desenhada por cima da tela)
  const th = fight.throwing;
  if (th && sheet && (th.stage === 'fly' || th.stage === 'absorb')) {
    let x, y, rot = 0;
    if (th.stage === 'fly') {
      const u = clamp01(th.t / 0.6);
      x = th.from.x + (th.to.x - th.from.x) * u;
      y = th.from.y + (th.to.y - th.from.y) * u - Math.sin(u * Math.PI) * 200;
      rot = u * 14;
    } else {
      x = th.to.x; y = th.to.y + 60;
      const k = clamp01(th.t / 0.7);
      glowCircle(ctx, th.to.x, th.to.y, 60 + 180 * k, `rgba(255,255,255,${0.7 * (1 - k)})`);
    }
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.drawImage(sheet.img, -20, -20, 40, 40); ctx.restore();
  } else if (th && sheet) {
    // a bola fica no chão, onde o Kyogre estava, enquanto a faixa mostra o balanço
    ctx.drawImage(sheet.img, th.to.x - 16, th.to.y + 44, 32, 32);
  }
}

/** Por cima da tela: o céu escuro, o clarão, o maremoto, a seta da Dive Ball, a faixa da captura e a maré final. */
export function drawKyogreScreen(ctx, run, renderer) {
  const W = renderer.width, H = renderer.height;
  const fight = run.fight;
  if (fight?.dim > 0.01) { ctx.fillStyle = `rgba(4,6,24,${fight.dim})`; ctx.fillRect(0, 0, W, H); }
  if (run.stage.weather === 'rain') rain(ctx, renderer, run.time);
  if (!fight) return;
  const ts = fight.tsunami;
  if (ts?.phase === 'sweep') { ctx.fillStyle = 'rgba(40,110,220,.16)'; ctx.fillRect(0, 0, W, H); }
  if (fight.flash > 0) { ctx.fillStyle = `rgba(${fight.flashColor},${fight.flash})`; ctx.fillRect(0, 0, W, H); }

  // o aviso do maremoto: o letreiro e a seta até a bolha de ar
  if (ts?.phase === 'warn') {
    const left = Math.max(0, Math.ceil(fight.cfg.tsunamiWarn - ts.t));
    banner(ctx, W / 2, 150, `MAREMOTO!  Corra para a bolha de ar (${left})`, '#8fe3ff', 26);
    edgeArrow(ctx, renderer, ts.safe.x, ts.safe.y, '#8fe3ff', run.time);
  }

  // a Dive Ball: o letreiro e a seta na borda, se ela estiver fora da tela
  const ball = fight.ball;
  if (ball) {
    edgeArrow(ctx, renderer, ball.x, ball.y, '#8fe3ff', run.time);
    const left = Math.max(0, Math.ceil(fight.cfg.exhaust - fight.t));
    banner(ctx, W / 2, 150, `O Kyogre está exausto! Pegue a Dive Ball (${left})`, '#8fe3ff', 24);
  }

  // a faixa da captura, como a do Voar
  const th = fight.throwing;
  // (o tempo da partida para enquanto a bola balança: a faixa corre no relógio de verdade)
  if (th && th.band > 0) captureBand(ctx, W, H, th, (typeof performance !== 'undefined' ? performance.now() : 0) / 1000);

  // a maré final: o relógio no topo
  if (fight.final && !run.pendingGift) banner(ctx, W / 2, 112, `MARÉ FINAL  ${Math.ceil(fight.final.t)} s`, '#8fe3ff', 30);
}

/** Na barra do chefe: a marca dos 15% (enquanto houver bola) e as Dive Balls que restam. */
export function drawKyogreBossBar(ctx, run, x, y, w) {
  const fight = run.fight;
  if (!fight) return;
  if (fight.balls > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + w * fight.cfg.floor - 1, y - 4, 3, 22);
  }
  const sheet = getSheet('item/dive-ball');
  if (!sheet) return;
  for (let i = 0; i < fight.cfg.balls; i++) {
    ctx.globalAlpha = i < fight.balls ? 1 : 0.25;
    ctx.drawImage(sheet.img, x + w + 10 + i * 24, y - 3, 20, 20);
  }
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ os golpes */

function warning(ctx, h) {
  const k = clamp01(h.t / h.warn);
  const thunder = h.kind === 'thunder';
  const pulse = 0.5 + 0.5 * Math.sin(h.t * 18);
  ctx.fillStyle = thunder ? `rgba(255,230,90,${0.12 + 0.22 * k})` : `rgba(90,170,255,${0.14 + 0.26 * k})`;
  ctx.strokeStyle = thunder ? `rgba(255,236,120,${0.6 + 0.4 * pulse})` : `rgba(180,225,255,${0.6 + 0.4 * pulse})`;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r, h.r * 0.55, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r * k, h.r * 0.55 * k, 0, 0, TAU); ctx.stroke();
  if (!thunder) {
    // a água borbulhando no chão antes de estourar
    for (let i = 0; i < 5; i++) {
      const ph = (h.t * 2.2 + i * 0.2) % 1;
      ctx.fillStyle = `rgba(220,245,255,${0.7 * (1 - ph)})`;
      ctx.beginPath(); ctx.arc(h.x + Math.cos(i * 1.7) * h.r * 0.5, h.y + Math.sin(i * 2.3) * h.r * 0.25 - ph * 20, 3 + 3 * ph, 0, TAU); ctx.fill();
    }
  }
}

/** A carga: o chão brilha, três círculos se fecham nele e as marcas vermelhas acendem. */
function charge(ctx, boss, k, now) {
  glowCircle(ctx, boss.x, boss.y, 120 + 80 * k, `rgba(90,150,255,${0.25 + 0.35 * k})`);
  for (let i = 0; i < 3; i++) {
    const r = 260 * (1 - ((k * 1.6 + i / 3) % 1)) + 40;
    ctx.strokeStyle = `rgba(160,210,255,${0.25 + 0.5 * k})`;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(boss.x, boss.y, r, 0, TAU); ctx.stroke();
  }
  // as marcas do Kyogre (as linhas vermelhas da transição), girando e acendendo
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const a = now * 2.4 + (i * TAU) / 6;
    ctx.strokeStyle = `rgba(255,${80 + 120 * k},${70 + 60 * k},${0.35 + 0.6 * k})`;
    ctx.lineWidth = 6 + 6 * k;
    ctx.beginPath(); ctx.arc(boss.x, boss.y, 100 + 20 * Math.sin(now * 8), a, a + 0.45); ctx.stroke();
  }
  // gotas sendo puxadas para ele
  for (let i = 0; i < 14; i++) {
    const ph = (now * 1.8 + i / 14) % 1;
    const a = i * 2.39;
    const d = 300 * (1 - ph);
    ctx.fillStyle = `rgba(200,235,255,${0.8 * ph})`;
    ctx.beginPath(); ctx.arc(boss.x + Math.cos(a) * d, boss.y + Math.sin(a) * d * 0.7, 4, 0, TAU); ctx.fill();
  }
}

/** Um anel de onda grosso: o contorno escuro, o corpo azul, a espuma branca e as marcas vermelhas. */
function waveRing(ctx, ring, now) {
  const k = ring.r / ring.max;
  const w = ring.width * (1 - 0.35 * k);
  ctx.save();
  ctx.globalAlpha = 1 - k * 0.55;
  ctx.lineWidth = w + 10;
  ctx.strokeStyle = 'rgba(8,24,70,.75)';
  ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r, 0, TAU); ctx.stroke();
  ctx.lineWidth = w;
  ctx.strokeStyle = ring.kind === 'pulse' ? '#2f7cff' : '#4aa0ff';
  ctx.stroke();
  ctx.lineWidth = w * 0.35;
  ctx.strokeStyle = '#bfe6ff';
  ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r + w * 0.22, 0, TAU); ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r + w * 0.42, 0, TAU); ctx.stroke();
  if (ring.kind === 'pulse') {
    ctx.strokeStyle = 'rgba(255,80,70,.95)';
    ctx.lineWidth = 5;
    for (let i = 0; i < 8; i++) {
      const a = now * 0.8 + (i * TAU) / 8;
      ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r - w * 0.1, a, a + 0.28); ctx.stroke();
    }
  }
  ctx.restore();
}

/** A coluna d'água do Water Spout: estoura do chão, sobe e desaba. */
function column(ctx, f) {
  const k = f.t / f.life;
  const h = 360 * Math.sin(Math.min(1, k * 1.25) * Math.PI);
  const w = f.r * 1.1 * (1 - 0.3 * k);
  const g = ctx.createLinearGradient(f.x, f.y - h, f.x, f.y);
  g.addColorStop(0, 'rgba(235,250,255,.95)');
  g.addColorStop(0.5, 'rgba(110,190,255,.85)');
  g.addColorStop(1, 'rgba(40,110,220,.75)');
  ctx.fillStyle = g;
  ctx.fillRect(f.x - w / 2, f.y - h, w, h);
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.fillRect(f.x - w * 0.15, f.y - h, w * 0.3, h);
  // a espuma no alto e o anel no chão
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.fillStyle = `rgba(240,252,255,${0.9 * (1 - k)})`;
    ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * w * 0.7 * (1 + k), f.y - h + Math.sin(a) * 18, 9 * (1 - k * 0.5), 0, TAU); ctx.fill();
  }
  ctx.strokeStyle = `rgba(200,240,255,${1 - k})`;
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * (1 + 1.6 * k), f.r * 0.55 * (1 + 1.6 * k), 0, 0, TAU); ctx.stroke();
}

/** O raio: um tronco grosso que vem do céu, com galhos, e o brilho em volta. */
function lightning(ctx, f) {
  const a = 1 - f.t / f.life;
  const pts = [];
  let x = f.x, y = f.y - 620;
  pts.push([x, y]);
  for (let i = 1; i <= 9; i++) {
    x = f.x + (hash(f.seed, i) - 0.5) * 70 * (1 - i / 10);
    y = f.y - 620 + (620 * i) / 9;
    pts.push([x, y]);
  }
  pts[pts.length - 1] = [f.x, f.y];
  const path = (list) => { ctx.beginPath(); ctx.moveTo(list[0][0], list[0][1]); for (const [px, py] of list.slice(1)) ctx.lineTo(px, py); ctx.stroke(); };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = `rgba(140,170,255,${0.35 * a})`; ctx.lineWidth = 34; path(pts);
  ctx.strokeStyle = `rgba(255,245,170,${0.9 * a})`; ctx.lineWidth = 12; path(pts);
  ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 5; path(pts);
  // os galhos
  for (let b = 0; b < 4; b++) {
    const from = pts[2 + b * 2];
    const dir = hash(f.seed, 50 + b) < 0.5 ? -1 : 1;
    const branch = [from];
    for (let i = 1; i <= 3; i++) branch.push([from[0] + dir * i * 28 + (hash(f.seed, 60 + b * 5 + i) - 0.5) * 20, from[1] + i * 34]);
    ctx.strokeStyle = `rgba(255,245,170,${0.7 * a})`; ctx.lineWidth = 5; path(branch);
  }
  glowCircle(ctx, f.x, f.y, 110 * (0.6 + 0.4 * a), `rgba(255,250,200,${0.5 * a})`);
}

function scorch(ctx, f) {
  const a = 1 - f.t / f.life;
  ctx.fillStyle = `rgba(20,14,10,${0.45 * a})`;
  ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * 0.9, f.r * 0.45, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = `rgba(255,220,120,${0.4 * a})`;
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * TAU;
    ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x + Math.cos(ang) * f.r, f.y + Math.sin(ang) * f.r * 0.5); ctx.stroke();
  }
}

/** O estouro de água (a saída do lago, a volta do mergulho, o disparo do pulso). */
function splash(ctx, f) {
  const k = f.t / f.life;
  for (let i = 0; i < 3; i++) {
    const kk = clamp01(k * 1.3 - i * 0.15);
    ctx.strokeStyle = `rgba(200,240,255,${0.8 * (1 - kk)})`;
    ctx.lineWidth = 8 - i * 2;
    ctx.beginPath(); ctx.ellipse(f.x, f.y, f.size * easeOut(kk), f.size * 0.5 * easeOut(kk), 0, 0, TAU); ctx.stroke();
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    const d = f.size * 0.7 * easeOut(k);
    const up = Math.sin(k * Math.PI) * (60 + hash(i, 3) * 80);
    ctx.fillStyle = `rgba(230,250,255,${0.9 * (1 - k)})`;
    ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * d, f.y + Math.sin(a) * d * 0.5 - up, 6, 0, TAU); ctx.fill();
  }
}

/** O redemoinho do mergulho: a água escura se abrindo no chão, girando, e as bolhas. */
function whirlpool(ctx, x, y, k, now) {
  ctx.fillStyle = `rgba(10,30,80,${0.55 * k})`;
  ctx.beginPath(); ctx.ellipse(x, y, 110 * k, 55 * k, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = `rgba(150,210,255,${0.8 * k})`;
  ctx.lineWidth = 4;
  for (let i = 0; i < 4; i++) {
    const a = now * 5 + (i * TAU) / 4;
    ctx.beginPath(); ctx.ellipse(x, y, (30 + i * 20) * k, (15 + i * 10) * k, 0, a, a + 2.2); ctx.stroke();
  }
  bubbles(ctx, x, y, 90 * k, 40 * k, k, now * 1.6);
}

/* ------------------------------------------------------------------ o maremoto */

function tsunami(ctx, run, ts, now) {
  const safe = ts.safe;
  // a bolha de ar: o domo claro no chão, as bolhas subindo e o anel pulsando
  const pulse = 0.5 + 0.5 * Math.sin(now * 6);
  glowCircle(ctx, safe.x, safe.y, safe.r * 1.15, 'rgba(160,235,255,.35)');
  ctx.strokeStyle = `rgba(200,250,255,${0.6 + 0.4 * pulse})`;
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(safe.x, safe.y, safe.r, 0, TAU); ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(safe.x, safe.y, safe.r * (0.8 + 0.15 * pulse), 0, TAU); ctx.stroke();
  for (let i = 0; i < 10; i++) {
    const ph = (now * 0.8 + i / 10) % 1;
    ctx.fillStyle = `rgba(230,250,255,${0.8 * (1 - ph)})`;
    ctx.beginPath(); ctx.arc(safe.x + Math.cos(i * 2.1) * safe.r * 0.6, safe.y + safe.r * 0.4 - ph * safe.r * 1.2, 5 + 4 * ph, 0, TAU); ctx.fill();
  }
  if (ts.phase === 'warn') {
    // o perigo: o chão inteiro listrado em vermelho, menos a bolha
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, run.world.width, run.world.height);
    ctx.arc(safe.x, safe.y, safe.r, 0, TAU);
    ctx.clip('evenodd');
    ctx.fillStyle = `rgba(255,70,60,${0.07 + 0.06 * pulse})`;
    ctx.fillRect(0, 0, run.world.width, run.world.height);
    ctx.restore();
    return;
  }
  if (ts.phase !== 'sweep') return;
  // a onda: uma parede de água com a crista de espuma, que se abre em volta da bolha
  const back = ts.front - ts.dir * 520;
  const x0 = Math.min(back, ts.front), x1 = Math.max(back, ts.front);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, run.world.width, run.world.height);
  ctx.arc(safe.x, safe.y, safe.r, 0, TAU);
  ctx.clip('evenodd');
  const g = ctx.createLinearGradient(back, 0, ts.front, 0);
  g.addColorStop(0, 'rgba(20,70,170,0)');
  g.addColorStop(0.6, 'rgba(40,110,230,.75)');
  g.addColorStop(0.92, 'rgba(120,190,255,.92)');
  g.addColorStop(1, 'rgba(235,250,255,.98)');
  ctx.fillStyle = g;
  ctx.fillRect(x0, 0, x1 - x0, run.world.height);
  // a crista: bolhas brancas grandes ao longo da frente
  for (let y = 0; y < run.world.height; y += 46) {
    const wob = Math.sin(y * 0.05 + now * 9) * 16;
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    ctx.beginPath(); ctx.arc(ts.front + wob * ts.dir, y, 22 + 8 * Math.sin(y + now * 7), 0, TAU); ctx.fill();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ a Dive Ball */

function diveBall(ctx, ball, sheet, now) {
  const k = clamp01(ball.t / ball.fall);
  // o feixe de luz do alto: mais forte enquanto ela cai, e some devagar depois
  const beam = ball.landed ? Math.max(0, 1 - (ball.t - ball.fall) / 1.2) : 1;
  if (beam > 0) {
    const g = ctx.createLinearGradient(ball.x, ball.y - 900, ball.x, ball.y);
    g.addColorStop(0, 'rgba(160,235,255,0)');
    g.addColorStop(1, `rgba(200,245,255,${0.55 * beam})`);
    ctx.fillStyle = g;
    ctx.fillRect(ball.x - 46, ball.y - 900, 92, 900);
    ctx.fillStyle = `rgba(255,255,255,${0.5 * beam})`;
    ctx.fillRect(ball.x - 12, ball.y - 900, 24, 900);
  }
  // o brilho no chão: anéis que se abrem e as faíscas girando
  const pulse = (now * 1.6) % 1;
  glowCircle(ctx, ball.x, ball.y, 70, `rgba(143,227,255,${ball.landed ? 0.45 : 0.25 * k})`);
  if (ball.landed) {
    ctx.strokeStyle = `rgba(190,245,255,${1 - pulse})`;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(ball.x, ball.y + 8, 30 + 70 * pulse, 14 + 32 * pulse, 0, 0, TAU); ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = now * 2.5 + (i * TAU) / 6;
      star(ctx, ball.x + Math.cos(a) * 52, ball.y + Math.sin(a) * 26 - 10, 6, '#ffffff');
    }
  }
  if (!sheet) return;
  const y = ball.landed ? ball.y - 20 + Math.sin(now * 5) * 4 : ball.y - 20 - (1 - k) * (1 - k) * 640;
  ctx.drawImage(sheet.img, ball.x - 22, y - 22, 44, 44);
}

function ballLand(ctx, f) {
  const k = f.t / f.life;
  ctx.strokeStyle = `rgba(220,250,255,${1 - k})`;
  ctx.lineWidth = 8 * (1 - k) + 2;
  ctx.beginPath(); ctx.ellipse(f.x, f.y + 8, 40 + 220 * easeOut(k), 18 + 100 * easeOut(k), 0, 0, TAU); ctx.stroke();
}

/**
 * A faixa da captura (como a do Voar): sobe pela tela com as listras correndo e a
 * Dive Ball grande no meio, balançando. No fim, as estrelas do "Gotcha!" ou a bola se
 * abrindo num clarão.
 */
function captureBand(ctx, W, H, th, now) {
  const band = getSheet('dive/band_out');
  const sheet = getSheet('item/dive-ball');
  const full = Math.round(H * 0.34);
  const h = Math.round(full * easeOut(th.band));
  const y0 = Math.round(H / 2 - h / 2);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, y0, W, h); ctx.clip();
  ctx.fillStyle = '#05070f';
  ctx.fillRect(0, y0, W, h);
  if (band) {
    const s = full / band.def.frameHeight;
    const bw = band.def.frameWidth * s;
    const off = (now * 700) % bw;
    for (let x = -off; x < W; x += bw) ctx.drawImage(band.img, Math.round(x), H / 2 - full / 2, bw, full);
  }
  // a Dive Ball grande no meio
  const size = Math.round(full * 0.62);
  const cx = W / 2, cy = H / 2;
  let rot = 0, hop = 0, show = true;
  if (th.stage === 'shake') {
    const t = th.t;
    if (t < 0.55) { rot = Math.sin((t / 0.55) * TAU) * 0.55; hop = -Math.abs(Math.sin((t / 0.55) * Math.PI)) * size * 0.08; }
  }
  if (th.stage === 'burst') {
    const k = clamp01(th.t / 0.6);
    glowCircle(ctx, cx, cy, size * (0.6 + 2.2 * k), `rgba(255,255,255,${0.9 * (1 - k)})`);
    // as metades da bola voando para os lados
    if (sheet) {
      ctx.save(); ctx.globalAlpha = 1 - k;
      ctx.drawImage(sheet.img, 0, 0, 30, 15, cx - size / 2 - k * size, cy - size / 2 - k * size * 0.6, size, size / 2);
      ctx.drawImage(sheet.img, 0, 15, 30, 15, cx - size / 2 + k * size, cy + k * size * 0.4, size, size / 2);
      ctx.restore();
    }
    show = false;
    text(ctx, cx, cy + full * 0.36, 'Ah, não! O Kyogre escapou!', '#ffb4ad', Math.round(full * 0.13));
  }
  if (show && sheet) {
    ctx.save();
    ctx.translate(cx, cy + hop);
    ctx.rotate(rot);
    ctx.drawImage(sheet.img, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
  if (th.stage === 'shake' || th.stage === 'open') {
    // os balanços já dados, como pontinhos embaixo
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < th.shakes ? '#8fe3ff' : 'rgba(255,255,255,.25)';
      ctx.beginPath(); ctx.arc(cx - 30 + i * 30, cy + size * 0.68, 7, 0, TAU); ctx.fill();
    }
  }
  if (th.stage === 'click') {
    const k = clamp01(th.t / 0.6);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + th.t;
      star(ctx, cx + Math.cos(a) * size * (0.6 + 0.5 * k), cy + Math.sin(a) * size * (0.4 + 0.3 * k), size * 0.1, '#fff3a0');
    }
    text(ctx, cx, cy + full * 0.36, 'Gotcha! O Kyogre foi capturado!', '#fff3a0', Math.round(full * 0.13));
  }
  ctx.restore();
  // a borda da faixa
  ctx.fillStyle = 'rgba(143,227,255,.8)';
  ctx.fillRect(0, y0, W, 3);
  ctx.fillRect(0, y0 + h - 3, W, 3);
}

/* ------------------------------------------------------------------ apoio */

function glowCircle(ctx, x, y, r, color) {
  if (r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}

function star(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU - Math.PI / 2, rr = i % 2 ? r * 0.4 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fill();
}

function text(ctx, x, y, str, color, size) {
  ctx.font = `700 ${size}px ${PIXEL}`;
  ctx.textAlign = 'center';
  ctx.lineWidth = Math.max(4, size / 5);
  ctx.strokeStyle = '#0a1222';
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function banner(ctx, x, y, str, color, size) { text(ctx, x, y, str, color, size); }

/** A seta na borda da tela apontando para algo fora dela (a Dive Ball, a bolha de ar). */
function edgeArrow(ctx, renderer, wx, wy, color, now) {
  const W = renderer.width, H = renderer.height;
  const sx = wx - renderer.camera.x, sy = wy - renderer.camera.y;
  if (sx >= 0 && sy >= 0 && sx <= W && sy <= H) return;
  const a = Math.atan2(sy - H / 2, sx - W / 2);
  const ex = Math.max(40, Math.min(W - 40, sx)), ey = Math.max(130, Math.min(H - 40, sy));
  const s = 1 + 0.15 * Math.sin(now * 8);
  ctx.save();
  ctx.translate(ex, ey);
  ctx.rotate(a);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.strokeStyle = '#0a1222';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(-14, -19); ctx.lineTo(-14, 19); ctx.closePath();
  ctx.stroke(); ctx.fill();
  ctx.restore();
}

function bubbles(ctx, x, y, rx, ry, strength, t) {
  ctx.strokeStyle = `rgba(200,240,255,${0.55 * strength})`;
  ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    const ph = (t * 1.7 + i * 0.37) % 1;
    const bx = x + Math.sin(i * 12.9) * rx, by = y + Math.cos(i * 7.3) * ry;
    ctx.beginPath(); ctx.ellipse(bx, by, 4 + ph * 14, 2 + ph * 7, 0, 0, TAU); ctx.stroke();
  }
}

/** A chuva do Kyogre: traços inclinados caindo por cima de tudo, a tela um pouco mais escura. */
function rain(ctx, renderer, t) {
  const W = renderer.width, H = renderer.height;
  ctx.fillStyle = 'rgba(8,12,40,.22)';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(190,215,255,.42)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 140; i++) {
    const speed = 640 + (i % 7) * 40;
    const x = ((i * 97.13 + 40) % (W + 200)) - ((t * speed * 0.18) % (W + 200)) + 100;
    const y = ((i * 53.71) + t * speed) % (H + 40) - 20;
    const xx = ((x % (W + 200)) + W + 200) % (W + 200) - 100;
    ctx.moveTo(xx, y);
    ctx.lineTo(xx - 6, y + 24);
  }
  ctx.stroke();
}
