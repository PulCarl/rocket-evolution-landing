import { GAME_CONFIG, speedAt } from "../../game/scoring.js";

const {
  width: W,
  height: H,
  groundY: GROUND,
  gravity: GRAVITY,
  jumpVelocity: JUMP_V,
  doubleJumpVelocity: JUMP2_V,
  boostBonus: BOOST_BONUS,
  pickupMinGap: PICKUP_MIN_GAP,
  pickupMaxGap: PICKUP_MAX_GAP,
  boostDuration: BOOST_DURATION,
} = GAME_CONFIG;

const OBSTACLE_KINDS = [
  { w: 20, h: 34, kind: "cone" },
  { w: 30, h: 26, kind: "pad" },
  { w: 24, h: 46, kind: "post" },
];

// Pickups float above the ground (unlike obstacles, which sit on it) — you
// have to jump into them on purpose, they're never in the way of a normal
// dodge. Sized/placed to sit comfortably inside a single jump's arc.
const PICKUP_SIZE = 26;
const PICKUP_Y = GROUND - 90;

export function createGame() {
  return {
    t: 0,
    distance: 0,
    bonusScore: 0, // flat points from boost pickups, on top of the time-based distance
    shielded: false,
    player: { x: 90, y: GROUND, vy: 0, jumps: 0, w: 34, h: 30, spin: 0, boostTimer: 0 },
    obstacles: [],
    pickups: [],
    nextSpawnAt: 0.9,
    nextPickupAt: 4 + Math.random() * 4,
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

function spawnPickup(state) {
  const kind = Math.random() < 0.5 ? "boost" : "shield";
  state.pickups.push({ x: W + 20, y: PICKUP_Y, w: PICKUP_SIZE, h: PICKUP_SIZE, kind, spin: 0 });
  state.nextPickupAt = state.t + PICKUP_MIN_GAP + Math.random() * (PICKUP_MAX_GAP - PICKUP_MIN_GAP);
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

  const speed = speedAt(state.t);
  state.distance += speed * dt;

  const p = state.player;
  const boosting = p.boostTimer > 0;
  if (boosting) {
    // Stationary and invincible for the duration (Jetpack Joyride's Lil'
    // Stomper, not a jetpack) — frozen in place, no gravity, just a fast
    // spin as a "powered up" visual cue. Physics resume where they left off
    // once the timer runs out.
    p.boostTimer = Math.max(0, p.boostTimer - dt);
    p.spin += dt * 14;
  } else {
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
  }

  for (const o of state.obstacles) o.x -= speed * dt;
  state.obstacles = state.obstacles.filter((o) => o.x + o.w > -20);
  if (state.t >= state.nextSpawnAt) spawnObstacle(state);

  for (const pk of state.pickups) pk.x -= speed * dt;
  const keptPickups = [];
  for (const pk of state.pickups) {
    if (pk.x + pk.w < -20) continue; // scrolled off, drop
    if (aabbHitPickup(p, pk)) {
      if (pk.kind === "boost") {
        state.bonusScore += BOOST_BONUS;
        p.boostTimer = BOOST_DURATION;
        // Stomp back down to the ground immediately (even if grabbed
        // mid-jump) so the invincible window is spent planted in place,
        // not floating wherever the jump happened to be.
        p.y = GROUND;
        p.vy = 0;
      } else {
        state.shielded = true;
      }
      continue; // collected, remove
    }
    keptPickups.push(pk);
  }
  state.pickups = keptPickups;
  if (state.t >= state.nextPickupAt) spawnPickup(state);

  // Boosting (stationary + invincible) clears every obstacle; a shield
  // absorbs exactly one hit (removing that obstacle so it can't immediately
  // re-trigger next frame) before it's used up.
  let crashed = false;
  const keptObstacles = [];
  for (const o of state.obstacles) {
    if (!crashed && !boosting && aabbHit(p, o)) {
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

  // Pickups: a boost chevron (speed/lightning feel) or a shield ring.
  const pulse = 0.85 + Math.sin(state.t * 6) * 0.15;
  for (const pk of state.pickups) {
    const cx = pk.x + pk.w / 2;
    const cy = pk.y;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    if (pk.kind === "boost") {
      const grad = ctx.createLinearGradient(0, -pk.h / 2, 0, pk.h / 2);
      grad.addColorStop(0, "#fe980c");
      grad.addColorStop(1, "#d8224e");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-6, -pk.h / 2);
      ctx.lineTo(4, -3);
      ctx.lineTo(-2, -3);
      ctx.lineTo(6, pk.h / 2);
      ctx.lineTo(-4, 3);
      ctx.lineTo(2, 3);
      ctx.closePath();
      ctx.fill();
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
  if (p.boostTimer > 0) {
    ctx.save();
    const grad = ctx.createRadialGradient(p.x, p.y - logoH / 2, 2, p.x, p.y - logoH / 2, logoW);
    grad.addColorStop(0, "rgba(254,152,12,0.5)");
    grad.addColorStop(1, "rgba(254,152,12,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y - logoH / 2, logoW, 0, Math.PI * 2);
    ctx.fill();
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
