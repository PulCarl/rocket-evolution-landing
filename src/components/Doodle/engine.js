// Pure game-logic module for the Doodle-Jump-style climber — no React, no
// DOM. RocketRunner's engine.js established this split (physics/collision
// here, React only orchestrates state/UI) and it's kept the same way here.
export const GAME_CONFIG = {
  width: 420,
  height: 680,
  gravity: 1500,
  bounceVelocity: -700, // normal platform bounce (rises ~163px — clears maxGap comfortably)
  springVelocity: -1050, // spring bonus bounce (rises ~367px)
  jetpackSpeed: -450, // steady climb speed while the jetpack is active
  jetpackDuration: 2.2,
  moveAccel: 2400,
  moveDrag: 3.2,
  maxMoveSpeed: 300,
  playerW: 38,
  playerH: 38,
  platformW: 72,
  platformH: 16,
  // Player is kept at this fraction down from the top of the screen while
  // climbing — the camera only ever scrolls up, never back down.
  cameraFrac: 0.42,
  minGap: 75,
  maxGap: 145, // stays just under the normal bounce's clear height (163) —
  // gaps alone should never be literally impossible; difficulty comes from
  // platform kinds/enemies instead.
  gapRampHeight: 5000,
  springChance: 0.1,
  jetpackChance: 0.045,
  shieldChance: 0.045,
  coinChance: 0.2,
  coinValue: 30,
  enemyChanceStart: 0.04,
  enemyChanceMax: 0.16,
  enemyRampHeight: 6000,
  movingChanceStart: 0.08,
  movingChanceMax: 0.22,
  movingRampHeight: 5000,
  breakableChanceStart: 0.06,
  breakableChanceMax: 0.2,
  breakableRampHeight: 5000,
};

const {
  width: W,
  height: H,
  gravity: GRAVITY,
  bounceVelocity: BOUNCE_V,
  springVelocity: SPRING_V,
  jetpackSpeed: JETPACK_SPEED,
  jetpackDuration: JETPACK_DURATION,
  moveAccel: MOVE_ACCEL,
  moveDrag: MOVE_DRAG,
  maxMoveSpeed: MAX_MOVE_SPEED,
  playerW: PLAYER_W,
  playerH: PLAYER_H,
  platformW: PLATFORM_W,
  platformH: PLATFORM_H,
  cameraFrac: CAMERA_FRAC,
  minGap: MIN_GAP,
  maxGap: MAX_GAP,
  gapRampHeight: GAP_RAMP_HEIGHT,
  springChance: SPRING_CHANCE,
  jetpackChance: JETPACK_CHANCE,
  shieldChance: SHIELD_CHANCE,
  coinChance: COIN_CHANCE,
  coinValue: COIN_VALUE,
  enemyChanceStart: ENEMY_CHANCE_START,
  enemyChanceMax: ENEMY_CHANCE_MAX,
  enemyRampHeight: ENEMY_RAMP_HEIGHT,
  movingChanceStart: MOVING_CHANCE_START,
  movingChanceMax: MOVING_CHANCE_MAX,
  movingRampHeight: MOVING_RAMP_HEIGHT,
  breakableChanceStart: BREAKABLE_CHANCE_START,
  breakableChanceMax: BREAKABLE_CHANCE_MAX,
  breakableRampHeight: BREAKABLE_RAMP_HEIGHT,
} = GAME_CONFIG;

function ramped(height, from, to, rampDistance) {
  const t = Math.min(Math.max(height / rampDistance, 0), 1);
  return from + (to - from) * t;
}

function aabbOverlap(a, b) {
  return Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2;
}

// Platform coords: x/y is its TOP-CENTER (spans x ± w/2, y..y+h). Landed-on
// check is feet-vs-top-surface only, and only while falling — matches the
// simple single-frame AABB approach the 2D runner already used successfully.
function landedOn(player, plat) {
  if (plat.broken) return false;
  const feetY = player.y + player.h / 2;
  const withinY = feetY >= plat.y - 2 && feetY <= plat.y + plat.h + 12;
  const withinX = player.x + player.w / 2 > plat.x - plat.w / 2 && player.x - player.w / 2 < plat.x + plat.w / 2;
  return withinY && withinX;
}

function spawnRow(state) {
  const genHeight = -state.highestGeneratedY;
  const gap = ramped(genHeight, MIN_GAP, MAX_GAP, GAP_RAMP_HEIGHT) * (0.85 + Math.random() * 0.3);
  const y = state.highestGeneratedY - gap;
  const w = PLATFORM_W;
  const x = w / 2 + Math.random() * (W - w);

  const movingChance = ramped(genHeight, MOVING_CHANCE_START, MOVING_CHANCE_MAX, MOVING_RAMP_HEIGHT);
  const breakableChance = ramped(genHeight, BREAKABLE_CHANCE_START, BREAKABLE_CHANCE_MAX, BREAKABLE_RAMP_HEIGHT);
  const kindRoll = Math.random();
  let kind = "normal";
  if (kindRoll < breakableChance) kind = "breakable";
  else if (kindRoll < breakableChance + movingChance) kind = "moving";

  const platform = {
    x,
    y,
    w,
    h: PLATFORM_H,
    kind,
    vx: kind === "moving" ? (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 40) : 0,
    broken: false,
    hasSpring: kind !== "breakable" && Math.random() < SPRING_CHANCE,
  };
  state.platforms.push(platform);
  state.highestGeneratedY = y;

  // A floating pickup and a patrolling enemy can both spawn near this row
  // (independent rolls) — small enough odds that overlap is rare, and when
  // it happens it's a nice bit of risk/reward rather than unfair.
  const pickupRoll = Math.random();
  let pickupKind = null;
  if (pickupRoll < COIN_CHANCE) pickupKind = "coin";
  else if (pickupRoll < COIN_CHANCE + JETPACK_CHANCE) pickupKind = "jetpack";
  else if (pickupRoll < COIN_CHANCE + JETPACK_CHANCE + SHIELD_CHANCE) pickupKind = "shield";
  if (pickupKind) {
    state.pickups.push({
      x: w / 2 + Math.random() * (W - w),
      y: y - 36 - Math.random() * 26,
      w: 22,
      h: 22,
      kind: pickupKind,
    });
  }

  const enemyChance = ramped(genHeight, ENEMY_CHANCE_START, ENEMY_CHANCE_MAX, ENEMY_RAMP_HEIGHT);
  if (Math.random() < enemyChance) {
    const originX = 30 + Math.random() * (W - 60);
    state.enemies.push({
      x: originX,
      y: y - 30 - Math.random() * 40,
      w: 30,
      h: 26,
      vx: (Math.random() < 0.5 ? -1 : 1) * (30 + Math.random() * 30),
      originX,
      range: 50 + Math.random() * 40,
      dead: false,
    });
  }
}

export function createGame() {
  const startY = 0;
  const cameraY = startY - H * CAMERA_FRAC;
  const state = {
    startY,
    height: 0, // high-water mark of climb distance — the score
    coinScore: 0,
    score: 0,
    cameraY,
    player: { x: W / 2, y: startY, vx: 0, vy: 0, w: PLAYER_W, h: PLAYER_H, facing: 1 },
    platforms: [],
    pickups: [],
    enemies: [],
    jetpackTimer: 0,
    shielded: false,
    over: false,
    events: [], // consumed once per frame by React for sound effects
    input: { left: false, right: false },
    highestGeneratedY: startY,
  };
  // A platform right under the player so the run starts with a clean first
  // bounce instead of an instant fall.
  state.platforms.push({
    x: W / 2,
    y: startY + PLAYER_H / 2 + 4,
    w: PLATFORM_W,
    h: PLATFORM_H,
    kind: "normal",
    vx: 0,
    broken: false,
    hasSpring: false,
  });
  state.highestGeneratedY = startY + PLAYER_H / 2 + 4;
  while (state.highestGeneratedY > cameraY - 300) spawnRow(state);
  return state;
}

// Advances the simulation by dt seconds. Returns { crashed }.
export function step(state, dt) {
  if (state.over) return { crashed: false };
  const p = state.player;

  let ax = 0;
  if (state.input.left) ax -= MOVE_ACCEL;
  if (state.input.right) ax += MOVE_ACCEL;
  if (ax !== 0) p.facing = ax > 0 ? 1 : -1;
  p.vx += ax * dt;
  p.vx *= Math.max(0, 1 - MOVE_DRAG * dt);
  p.vx = Math.max(-MAX_MOVE_SPEED, Math.min(MAX_MOVE_SPEED, p.vx));
  p.x += p.vx * dt;
  const half = p.w / 2;
  if (p.x < -half) p.x = W + half;
  else if (p.x > W + half) p.x = -half;

  if (state.jetpackTimer > 0) {
    state.jetpackTimer = Math.max(0, state.jetpackTimer - dt);
    p.vy = JETPACK_SPEED;
    p.y += p.vy * dt;
  } else {
    p.vy += GRAVITY * dt;
    p.y += p.vy * dt;
  }

  const climbed = state.startY - p.y;
  if (climbed > state.height) state.height = climbed;

  const desiredCameraY = p.y - H * CAMERA_FRAC;
  state.cameraY = Math.min(state.cameraY, desiredCameraY);

  if (p.vy > 0 && state.jetpackTimer <= 0) {
    for (const plat of state.platforms) {
      if (landedOn(p, plat)) {
        const spring = plat.hasSpring;
        p.vy = spring ? SPRING_V : BOUNCE_V;
        state.events.push({ type: spring ? "spring" : "bounce" });
        if (spring) plat.hasSpring = false;
        if (plat.kind === "breakable") plat.broken = true;
        break;
      }
    }
  }

  for (const plat of state.platforms) {
    if (plat.kind === "moving" && !plat.broken) {
      plat.x += plat.vx * dt;
      if (plat.x - plat.w / 2 < 0 || plat.x + plat.w / 2 > W) plat.vx *= -1;
    }
  }

  for (const en of state.enemies) {
    if (en.dead) continue;
    en.x += en.vx * dt;
    if (en.x < en.originX - en.range || en.x > en.originX + en.range) en.vx *= -1;
  }

  const keptPickups = [];
  for (const pk of state.pickups) {
    if (aabbOverlap(p, pk)) {
      if (pk.kind === "coin") {
        state.coinScore += COIN_VALUE;
        state.events.push({ type: "coin" });
      } else if (pk.kind === "jetpack") {
        state.jetpackTimer = JETPACK_DURATION;
        state.events.push({ type: "jetpack" });
      } else if (pk.kind === "shield") {
        state.shielded = true;
        state.events.push({ type: "shield" });
      }
      continue;
    }
    keptPickups.push(pk);
  }
  state.pickups = keptPickups;

  for (const en of state.enemies) {
    if (en.dead) continue;
    if (aabbOverlap(p, en)) {
      if (state.shielded) {
        state.shielded = false;
        en.dead = true;
        state.events.push({ type: "shieldBreak" });
      } else {
        state.over = true;
        state.events.push({ type: "crash" });
        state.score = Math.floor(state.height) + state.coinScore;
        return { crashed: true };
      }
    }
  }

  // Fallen below the visible bottom of the screen — the one fail state
  // besides an unshielded enemy hit.
  if (p.y - state.cameraY > H + p.h) {
    state.over = true;
    state.events.push({ type: "crash" });
    state.score = Math.floor(state.height) + state.coinScore;
    return { crashed: true };
  }

  const cleanupY = state.cameraY + H + 200;
  state.platforms = state.platforms.filter((pl) => pl.y < cleanupY);
  state.pickups = state.pickups.filter((pk) => pk.y < cleanupY);
  state.enemies = state.enemies.filter((en) => en.y < cleanupY && !en.dead);

  while (state.highestGeneratedY > state.cameraY - 300) spawnRow(state);

  state.score = Math.floor(state.height) + state.coinScore;
  return { crashed: false };
}

const ORANGE = "#fe980c";
const PINK = "#d8224e";

export function draw(ctx, state, logoImg) {
  ctx.clearRect(0, 0, W, H);
  const toScreenY = (worldY) => worldY - state.cameraY;

  // Background: dark vertical gradient plus a faint parallax star field
  // (drifts slower than the world, at 1/3 speed — cheap depth cue).
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#141220");
  bg.addColorStop(1, "#1d1d1d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  const starSpacing = 64;
  const starOffset = (state.cameraY * 0.3) % starSpacing;
  for (let row = -1; row < H / starSpacing + 1; row++) {
    const y = row * starSpacing - starOffset;
    for (let col = 0; col < W / starSpacing; col++) {
      const x = col * starSpacing + ((row % 2) * starSpacing) / 2;
      ctx.beginPath();
      ctx.arc(x + 10, y + 10, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Platforms
  for (const plat of state.platforms) {
    if (plat.broken) continue;
    const sy = toScreenY(plat.y);
    if (sy < -40 || sy > H + 40) continue;
    const grad = ctx.createLinearGradient(0, sy, 0, sy + plat.h);
    if (plat.kind === "breakable") {
      grad.addColorStop(0, "#8a8a8a");
      grad.addColorStop(1, "#5a5a5a");
    } else if (plat.kind === "moving") {
      grad.addColorStop(0, "#00d4ff");
      grad.addColorStop(1, "#7b2ff7");
    } else {
      grad.addColorStop(0, ORANGE);
      grad.addColorStop(1, PINK);
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(plat.x - plat.w / 2, sy, plat.w, plat.h, plat.h / 2);
    ctx.fill();
    if (plat.kind === "breakable") {
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(plat.x - plat.w / 4, sy + 2);
      ctx.lineTo(plat.x, sy + plat.h - 2);
      ctx.lineTo(plat.x + plat.w / 4, sy + 2);
      ctx.stroke();
    }
    if (plat.hasSpring) {
      const sx = plat.x;
      const springTop = sy - 16;
      ctx.strokeStyle = "#ffd23f";
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 3; i++) {
        const yy = sy - (i * 16) / 3;
        ctx.lineTo(sx + (i % 2 === 0 ? -6 : 6), yy);
      }
      ctx.stroke();
      ctx.fillStyle = "#ffd23f";
      ctx.beginPath();
      ctx.roundRect(sx - 10, springTop - 4, 20, 5, 2);
      ctx.fill();
    }
  }

  // Pickups
  const pulse = 0.85 + Math.sin(state.height * 0.02) * 0.15;
  for (const pk of state.pickups) {
    const sy = toScreenY(pk.y);
    if (sy < -30 || sy > H + 30) continue;
    ctx.save();
    ctx.translate(pk.x, sy);
    ctx.scale(pulse, pulse);
    if (pk.kind === "coin") {
      const grad = ctx.createRadialGradient(-2, -2, 1, 0, 0, pk.w / 2);
      grad.addColorStop(0, "#fff3c4");
      grad.addColorStop(0.5, "#ffd23f");
      grad.addColorStop(1, "#e0a400");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, pk.w / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (pk.kind === "jetpack") {
      ctx.fillStyle = "#3a3a3a";
      ctx.beginPath();
      ctx.roundRect(-pk.w / 2 + 3, -pk.h / 2, pk.w - 6, pk.h - 4, 4);
      ctx.fill();
      const flame = ctx.createLinearGradient(0, pk.h / 2 - 6, 0, pk.h / 2 + 6);
      flame.addColorStop(0, "#ffd23f");
      flame.addColorStop(1, ORANGE);
      ctx.fillStyle = flame;
      ctx.beginPath();
      ctx.ellipse(0, pk.h / 2 - 2, 4, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (pk.kind === "shield") {
      ctx.strokeStyle = "rgba(120,190,255,0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, pk.w / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(120,190,255,0.2)";
      ctx.beginPath();
      ctx.arc(0, 0, pk.w / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Enemies
  for (const en of state.enemies) {
    if (en.dead) continue;
    const sy = toScreenY(en.y);
    if (sy < -30 || sy > H + 30) continue;
    ctx.save();
    ctx.translate(en.x, sy);
    ctx.fillStyle = PINK;
    ctx.beginPath();
    const spikes = 8;
    for (let i = 0; i < spikes; i++) {
      const a = (i / spikes) * Math.PI * 2;
      const r = i % 2 === 0 ? en.w / 2 : en.w / 3.2;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r * (en.h / en.w);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-4, -2, 2.4, 0, Math.PI * 2);
    ctx.arc(4, -2, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Player: brand logo, flipped to face movement direction, with a little
  // squash on the way down and stretch on the way up for bounce "juice".
  const p = state.player;
  const psy = toScreenY(p.y);
  const stretch = Math.max(-0.3, Math.min(0.3, -p.vy / 1400));

  if (state.jetpackTimer > 0) {
    const flicker = 0.7 + Math.sin(state.height * 0.3) * 0.3;
    const grad = ctx.createLinearGradient(p.x, psy + p.h / 2, p.x, psy + p.h / 2 + 22);
    grad.addColorStop(0, `rgba(255,210,63,${0.75 * flicker})`);
    grad.addColorStop(1, "rgba(254,152,12,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(p.x, psy + p.h / 2 + 10, 8, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (state.shielded) {
    ctx.save();
    ctx.strokeStyle = "rgba(120,190,255,0.85)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(p.x, psy, p.w * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
    ctx.save();
    ctx.translate(p.x, psy);
    ctx.scale(p.facing * (1 - stretch * 0.4), 1 + stretch * 0.4);
    ctx.drawImage(logoImg, -p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  }
}
