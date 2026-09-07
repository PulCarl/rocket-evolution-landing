import { GAME_CONFIG, speedAt } from "../../game/scoring.js";

const {
  width: W,
  height: H,
  groundY: GROUND,
  gravity: GRAVITY,
  jumpVelocity: JUMP_V,
  doubleJumpVelocity: JUMP2_V,
  shieldMinGap: SHIELD_MIN_GAP,
  shieldMaxGap: SHIELD_MAX_GAP,
  coinMinGap: COIN_MIN_GAP,
  coinMaxGap: COIN_MAX_GAP,
  coinMultiplierStep: COIN_MULTIPLIER_STEP,
  maxMultiplier: MAX_MULTIPLIER,
} = GAME_CONFIG;

const OBSTACLE_KINDS = [
  { w: 20, h: 34, kind: "cone" },
  { w: 30, h: 26, kind: "pad" },
  { w: 24, h: 46, kind: "post" },
];

// Pickups float above the ground (unlike obstacles, which sit on it) — you
// have to jump into them on purpose, they're never in the way of a normal
// dodge. Sized/placed to sit comfortably inside a single jump's arc.
const SHIELD_SIZE = 26;
const SHIELD_Y = GROUND - 90;
const COIN_SIZE = 18;
const COIN_Y = GROUND - 70;
const COINS_PER_STEP = 3; // every 3rd coin bumps the multiplier, not each one

export function createGame() {
  return {
    t: 0,
    distance: 0,
    multiplier: 1, // score multiplier, only ever goes up, capped at MAX_MULTIPLIER
    coinCount: 0, // every COINS_PER_STEP-th coin bumps the multiplier
    shielded: false,
    player: { x: 90, y: GROUND, vy: 0, jumps: 0, w: 34, h: 30, spin: 0 },
    obstacles: [],
    pickups: [],
    nextSpawnAt: 0.9,
    nextShieldAt: 4 + Math.random() * 4,
    nextCoinAt: 1.5 + Math.random() * 2,
    particles: [],
    over: false,
  };
}

export function jump(state) {
  if (state.over) return;
  const p = state.player;
  const onGround = p.y >= GROUND - 0.5;
  if (onGround) {
    p.vy = JUMP_V;
    p.jumps = 1;
  } else if (p.jumps < 2) {
    p.vy = JUMP2_V;
    p.jumps = 2;
  }
}

function spawnObstacle(state) {
  const base = OBSTACLE_KINDS[Math.floor(Math.random() * OBSTACLE_KINDS.length)];
  state.obstacles.push({ x: W + 20, w: base.w, h: base.h, kind: base.kind, passed: false });
  const { minSpawnGap, maxSpawnGap } = GAME_CONFIG;
  const difficulty = Math.min(state.t / 60, 1);
  const gap = maxSpawnGap - (maxSpawnGap - minSpawnGap) * difficulty;
  state.nextSpawnAt = state.t + gap * (0.75 + Math.random() * 0.5);
}

function spawnShield(state) {
  state.pickups.push({ x: W + 20, y: SHIELD_Y, w: SHIELD_SIZE, h: SHIELD_SIZE, kind: "shield" });
  state.nextShieldAt = state.t + SHIELD_MIN_GAP + Math.random() * (SHIELD_MAX_GAP - SHIELD_MIN_GAP);
}

function spawnCoin(state) {
  state.pickups.push({ x: W + 20, y: COIN_Y, w: COIN_SIZE, h: COIN_SIZE, kind: "coin" });
  state.nextCoinAt = state.t + COIN_MIN_GAP + Math.random() * (COIN_MAX_GAP - COIN_MIN_GAP);
}

function aabbHit(p, o) {
  const px1 = p.x - p.w / 2;
  const px2 = p.x + p.w / 2;
  const py1 = p.y - p.h;
  const py2 = p.y;
  const ox1 = o.x;
  const ox2 = o.x + o.w;
  const oy1 = GROUND - o.h;
  const oy2 = GROUND;
  return px1 < ox2 && px2 > ox1 && py1 < oy2 && py2 > oy1;
}

function aabbHitPickup(p, pk) {
  const px1 = p.x - p.w / 2;
  const px2 = p.x + p.w / 2;
  const py1 = p.y - p.h;
  const py2 = p.y;
  const ox1 = pk.x;
  const ox2 = pk.x + pk.w;
  const oy1 = pk.y - pk.h / 2;
  const oy2 = pk.y + pk.h / 2;
  return px1 < ox2 && px2 > ox1 && py1 < oy2 && py2 > oy1;
}

// Advances the simulation by dt seconds. Returns { crashed }.
export function step(state, dt) {
  if (state.over) return { crashed: false };
  state.t += dt;

  // `speed` drives the world's scroll (and difficulty) — unaffected by the
  // multiplier, so collecting coins never makes the game itself harder.
  // The multiplier only scales how many *points* that same distance is worth.
  const speed = speedAt(state.t);
  state.distance += speed * dt * state.multiplier;

  const p = state.player;
  p.vy += GRAVITY * dt;
  p.y += p.vy * dt;
  if (p.y > GROUND) {
    p.y = GROUND;
    p.vy = 0;
    p.jumps = 0;
    p.spin = 0;
  } else {
    p.spin += dt * 6; // little flip while airborne, purely visual
  }

  for (const o of state.obstacles) o.x -= speed * dt;
  state.obstacles = state.obstacles.filter((o) => o.x + o.w > -20);
  if (state.t >= state.nextSpawnAt) spawnObstacle(state);

  for (const pk of state.pickups) pk.x -= speed * dt;
  const keptPickups = [];
  for (const pk of state.pickups) {
    if (pk.x + pk.w < -20) continue; // scrolled off, drop
    if (aabbHitPickup(p, pk)) {
      if (pk.kind === "coin") {
        state.coinCount += 1;
        if (state.coinCount % COINS_PER_STEP === 0) {
          state.multiplier = Math.min(MAX_MULTIPLIER, state.multiplier + COIN_MULTIPLIER_STEP);
        }
      } else {
        state.shielded = true;
      }
      continue; // collected, remove
    }
    keptPickups.push(pk);
  }
  state.pickups = keptPickups;
  if (state.t >= state.nextShieldAt) spawnShield(state);
  if (state.t >= state.nextCoinAt) spawnCoin(state);

  // A shield absorbs exactly one hit (removing that obstacle so it can't
  // immediately re-trigger next frame) before it's used up.
  let crashed = false;
  const keptObstacles = [];
  for (const o of state.obstacles) {
    if (!crashed && aabbHit(p, o)) {
      if (state.shielded) {
        state.shielded = false;
        continue; // absorbed, this obstacle is cleared
      }
      state.over = true;
      crashed = true;
    }
    keptObstacles.push(o);
  }
  state.obstacles = keptObstacles;

  return { crashed };
}

export function draw(ctx, state, logoImg) {
  ctx.clearRect(0, 0, W, H);

  // Ground
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND + 1);
  ctx.lineTo(W, GROUND + 1);
  ctx.stroke();

  // Scrolling floor ticks (arena-floor feel)
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  const tickSpacing = 46;
  const offset = (state.distance * 0.6) % tickSpacing;
  for (let x = -offset; x < W; x += tickSpacing) {
    ctx.fillRect(x, GROUND + 6, 22, 2);
  }

  // Obstacles
  for (const o of state.obstacles) {
    const top = GROUND - o.h;
    if (o.kind === "cone") {
      const grad = ctx.createLinearGradient(o.x, top, o.x, GROUND);
      grad.addColorStop(0, "#fe980c");
      grad.addColorStop(1, "#d8224e");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(o.x + o.w / 2, top);
      ctx.lineTo(o.x + o.w, GROUND);
      ctx.lineTo(o.x, GROUND);
      ctx.closePath();
      ctx.fill();
    } else if (o.kind === "pad") {
      const grad = ctx.createLinearGradient(o.x, top, o.x + o.w, GROUND);
      grad.addColorStop(0, "#fe980c");
      grad.addColorStop(1, "#f4791c");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(o.x, top, o.w, o.h, 5);
      ctx.fill();
    } else {
      ctx.fillStyle = "#d8224e";
      ctx.fillRect(o.x + o.w / 2 - 3, top, 6, o.h);
      ctx.fillStyle = "rgba(216,34,78,.35)";
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2, top, 11, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Pickups: a gold coin (score multiplier) or a shield ring (extra chance).
  const pulse = 0.85 + Math.sin(state.t * 6) * 0.15;
  for (const pk of state.pickups) {
    ctx.save();
    ctx.translate(pk.x + pk.w / 2, pk.y);
    ctx.scale(pulse, pulse);
    if (pk.kind === "coin") {
      const grad = ctx.createRadialGradient(-3, -3, 1, 0, 0, pk.w / 2);
      grad.addColorStop(0, "#fff3c4");
      grad.addColorStop(0.5, "#ffd23f");
      grad.addColorStop(1, "#e0a400");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, pk.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.strokeStyle = "rgba(120,190,255,0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, pk.w / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(120,190,255,0.18)";
      ctx.beginPath();
      ctx.arc(0, 0, pk.w / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Player: the brand logo, flipping while airborne.
  const p = state.player;
  const logoW = p.w + 10;
  const logoH = logoImg?.naturalWidth ? logoW * (logoImg.naturalHeight / logoImg.naturalWidth) : logoW;

  if (state.shielded) {
    ctx.save();
    ctx.strokeStyle = "rgba(120,190,255,0.8)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y - logoH / 2, logoW * 0.75, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
    ctx.save();
    ctx.translate(p.x, p.y - logoH / 2);
    ctx.rotate(p.spin);
    ctx.drawImage(logoImg, -logoW / 2, -logoH / 2, logoW, logoH);
    ctx.restore();
  }
}
