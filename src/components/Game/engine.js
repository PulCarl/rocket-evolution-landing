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
  coinsPerStep: COINS_PER_STEP,
  coinMultiplierStep: COIN_MULTIPLIER_STEP,
  maxMultiplier: MAX_MULTIPLIER,
  bombMinGap: BOMB_MIN_GAP,
  bombMaxGap: BOMB_MAX_GAP,
  maxBombs: MAX_BOMBS,
  bombDuration: BOMB_DURATION,
  goldBombMinGap: GOLD_BOMB_MIN_GAP,
  goldBombMaxGap: GOLD_BOMB_MAX_GAP,
  maxGoldBombs: MAX_GOLD_BOMBS,
  goldBombDuration: GOLD_BOMB_DURATION,
  word: WORD,
  letterMinGap: LETTER_MIN_GAP,
  letterMaxGap: LETTER_MAX_GAP,
  pointsBonusAmount: POINTS_BONUS_AMOUNT,
  burstDuration: BURST_DURATION,
  burstMultiplier: BURST_MULTIPLIER,
  scoreTierStep: SCORE_TIER_STEP,
  jetpackMinGap: JETPACK_MIN_GAP,
  jetpackMaxGap: JETPACK_MAX_GAP,
  jetpackDuration: JETPACK_DURATION,
  magnetMinGap: MAGNET_MIN_GAP,
  magnetMaxGap: MAGNET_MAX_GAP,
  magnetDuration: MAGNET_DURATION,
} = GAME_CONFIG;

// Obstacle color palette shifts every SCORE_TIER_STEP points — purely
// cosmetic (score/difficulty are unaffected), cycles once every tier's used.
const COLOR_TIERS = [
  { a: "#fe980c", b: "#d8224e" }, // brand orange/pink (default, 0-49 999)
  { a: "#00d4ff", b: "#7b2ff7" }, // cyan/purple
  { a: "#00e09d", b: "#00b894" }, // green/teal
  { a: "#ffd23f", b: "#ff4757" }, // gold/red
  { a: "#ff6b6b", b: "#4834d4" }, // coral/indigo
];

const OBSTACLE_KINDS = [
  { w: 20, h: 34, kind: "cone" },
  { w: 30, h: 26, kind: "pad" },
  { w: 24, h: 46, kind: "post" },
];

// Pickups float above the ground (unlike obstacles, which sit on it) — you
// have to jump into them on purpose, they're never in the way of a normal
// dodge. Sized/placed to sit comfortably inside a single jump's arc, except
// COIN_Y_HIGH which sits above single-jump reach and needs a double jump.
const SHIELD_SIZE = 26;
const SHIELD_Y = GROUND - 90;
const COIN_SIZE = 18;
const COIN_Y_LOW = GROUND - 70;
const COIN_Y_HIGH = GROUND - 150;
const BOMB_SIZE = 24;
const BOMB_Y = GROUND - 90;
const GOLD_BOMB_SIZE = 26;
const GOLD_BOMB_Y = GROUND - 90;
const LETTER_SIZE = 20;
const LETTER_Y = GROUND - 70;
const JETPACK_SIZE = 24;
const JETPACK_Y = GROUND - 90;
const JETPACK_CEILING = 30; // can't fly above this (stays on-screen)
const JETPACK_GRAVITY_SCALE = 0.35; // floaty descent, controlled by tapping to go back up
const MAGNET_SIZE = 24;
const MAGNET_Y = GROUND - 70;
const MAGNETABLE_KINDS = new Set(["coin", "bomb", "goldBomb", "letter"]);
const MAGNET_PULL_SPEED = 900; // px/s a magnetized pickup flies toward the player

export function createGame() {
  return {
    t: 0,
    distance: 0,
    multiplier: 1, // score multiplier, only ever goes up, capped at MAX_MULTIPLIER
    coinCount: 0, // every COINS_PER_STEP-th coin bumps the multiplier
    shielded: false,
    bombs: 0, // common bomb charges, stacks up to MAX_BOMBS
    goldBombs: 0, // rare bomb charges, never stacks past MAX_GOLD_BOMBS (1)
    bombTimer: 0, // >0 while a bomb's "no obstacles" window is active
    bombTimerMax: 0, // duration of the bomb currently active, for UI/fade math
    letterIndex: 0, // progress spelling WORD; wraps to 0 + a random bonus on completion
    burstTimer: 0, // >0: score multiplier is temporarily x BURST_MULTIPLIER
    bonusAnnounce: null, // "goldBomb" | "points" | "burst" — last bonus won, for a UI toast
    bonusAnnounceTimer: 0, // >0 while that toast should be shown
    colorTier: 0, // floor(distance / SCORE_TIER_STEP), cycles through COLOR_TIERS
    tierAnnounceTimer: 0, // >0 right after reaching a new color tier
    jetpackTimer: 0, // >0 while flying (invincible); grants a shield the instant it lands
    magnetTimer: 0, // >0: coins/bombs/gold bombs/letters are auto-collected on screen
    player: { x: 90, y: GROUND, vy: 0, jumps: 0, w: 34, h: 30, spin: 0 },
    obstacles: [],
    pickups: [],
    nextSpawnAt: 0.9,
    nextShieldAt: 4 + Math.random() * 4,
    nextCoinAt: 1.5 + Math.random() * 2,
    nextBombAt: BOMB_MIN_GAP + Math.random() * (BOMB_MAX_GAP - BOMB_MIN_GAP),
    nextGoldBombAt: GOLD_BOMB_MIN_GAP + Math.random() * (GOLD_BOMB_MAX_GAP - GOLD_BOMB_MIN_GAP),
    nextLetterAt: 2 + Math.random() * 2,
    nextJetpackAt: JETPACK_MIN_GAP + Math.random() * (JETPACK_MAX_GAP - JETPACK_MIN_GAP),
    nextMagnetAt: MAGNET_MIN_GAP + Math.random() * (MAGNET_MAX_GAP - MAGNET_MIN_GAP),
    particles: [],
    over: false,
  };
}

export function jump(state) {
  if (state.over) return;
  const p = state.player;
  // While flying, every tap gives a free boost — no double-jump limit, so
  // it actually controls like a jetpack instead of being capped at 2 taps
  // over a 10s flight.
  if (state.jetpackTimer > 0) {
    p.vy = JUMP_V;
    return;
  }
  const onGround = p.y >= GROUND - 0.5;
  if (onGround) {
    p.vy = JUMP_V;
    p.jumps = 1;
  } else if (p.jumps < 2) {
    p.vy = JUMP2_V;
    p.jumps = 2;
  }
}

// Spends one stored bomb charge (if any, and none already active): instantly
// clears every obstacle on screen and suppresses new spawns for that bomb's
// duration. Spends a common charge first (saving the rare gold one for when
// common ones run out) — returns true if a charge was actually spent.
export function useBomb(state) {
  if (state.over || state.bombTimer > 0) return false;
  let duration;
  if (state.bombs > 0) {
    state.bombs -= 1;
    duration = BOMB_DURATION;
  } else if (state.goldBombs > 0) {
    state.goldBombs -= 1;
    duration = GOLD_BOMB_DURATION;
  } else {
    return false;
  }
  state.bombTimer = duration;
  state.bombTimerMax = duration;
  state.obstacles = [];
  // Push the next spawn out past the bomb window (plus a small grace gap)
  // so obstacles don't pile up waiting right at the moment it ends.
  state.nextSpawnAt = state.t + duration + 0.6;
  return true;
}

// Shared 0-60s ramp: gap shrinks from maxGap (easy, early) to minGap (hard,
// from ~60s on), with the same +/-25% jitter used everywhere it's applied.
function rampedGap(t, minGap, maxGap) {
  const difficulty = Math.min(t / 60, 1);
  const gap = maxGap - (maxGap - minGap) * difficulty;
  return gap * (0.75 + Math.random() * 0.5);
}

function spawnObstacle(state) {
  const base = OBSTACLE_KINDS[Math.floor(Math.random() * OBSTACLE_KINDS.length)];
  state.obstacles.push({ x: W + 20, w: base.w, h: base.h, kind: base.kind, passed: false });
  const { minSpawnGap, maxSpawnGap } = GAME_CONFIG;
  state.nextSpawnAt = state.t + rampedGap(state.t, minSpawnGap, maxSpawnGap);
}

function spawnShield(state) {
  state.pickups.push({ x: W + 20, y: SHIELD_Y, w: SHIELD_SIZE, h: SHIELD_SIZE, kind: "shield" });
  // More frequent later in the run — "vraiment dur" is exactly when a spare
  // shield helps most.
  state.nextShieldAt = state.t + rampedGap(state.t, SHIELD_MIN_GAP, SHIELD_MAX_GAP);
}

function spawnCoin(state) {
  // ~40% spawn high, reachable only with a well-timed double jump.
  const y = Math.random() < 0.4 ? COIN_Y_HIGH : COIN_Y_LOW;
  state.pickups.push({ x: W + 20, y, w: COIN_SIZE, h: COIN_SIZE, kind: "coin" });
  state.nextCoinAt = state.t + rampedGap(state.t, COIN_MIN_GAP, COIN_MAX_GAP);
}

function spawnBomb(state) {
  state.pickups.push({ x: W + 20, y: BOMB_Y, w: BOMB_SIZE, h: BOMB_SIZE, kind: "bomb" });
  // Same late-run ramp as the shield.
  state.nextBombAt = state.t + rampedGap(state.t, BOMB_MIN_GAP, BOMB_MAX_GAP);
}

function spawnGoldBomb(state) {
  state.pickups.push({ x: W + 20, y: GOLD_BOMB_Y, w: GOLD_BOMB_SIZE, h: GOLD_BOMB_SIZE, kind: "goldBomb" });
  state.nextGoldBombAt =
    state.t + GOLD_BOMB_MIN_GAP + Math.random() * (GOLD_BOMB_MAX_GAP - GOLD_BOMB_MIN_GAP);
}

function spawnLetter(state) {
  state.pickups.push({
    x: W + 20,
    y: LETTER_Y,
    w: LETTER_SIZE,
    h: LETTER_SIZE,
    kind: "letter",
    letter: WORD[state.letterIndex],
  });
  state.nextLetterAt = state.t + LETTER_MIN_GAP + Math.random() * (LETTER_MAX_GAP - LETTER_MIN_GAP);
}

function spawnJetpack(state) {
  state.pickups.push({ x: W + 20, y: JETPACK_Y, w: JETPACK_SIZE, h: JETPACK_SIZE, kind: "jetpack" });
  state.nextJetpackAt =
    state.t + JETPACK_MIN_GAP + Math.random() * (JETPACK_MAX_GAP - JETPACK_MIN_GAP);
}

function spawnMagnet(state) {
  state.pickups.push({ x: W + 20, y: MAGNET_Y, w: MAGNET_SIZE, h: MAGNET_SIZE, kind: "magnet" });
  state.nextMagnetAt = state.t + MAGNET_MIN_GAP + Math.random() * (MAGNET_MAX_GAP - MAGNET_MIN_GAP);
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
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

// Applies a pickup's effect once it's actually reached (normal collision,
// or a magnetized pickup arriving at the player) — shared so both paths
// stay in sync instead of duplicating this logic.
function collectPickup(state, pk) {
  if (pk.kind === "coin") {
    state.coinCount += 1;
    if (state.coinCount % COINS_PER_STEP === 0) {
      state.multiplier = Math.min(MAX_MULTIPLIER, state.multiplier + COIN_MULTIPLIER_STEP);
    }
  } else if (pk.kind === "bomb") {
    state.bombs = Math.min(MAX_BOMBS, state.bombs + 1);
  } else if (pk.kind === "goldBomb") {
    state.goldBombs = Math.min(MAX_GOLD_BOMBS, state.goldBombs + 1);
  } else if (pk.kind === "jetpack") {
    state.jetpackTimer = JETPACK_DURATION;
  } else if (pk.kind === "magnet") {
    state.magnetTimer = MAGNET_DURATION;
  } else if (pk.kind === "letter") {
    state.letterIndex += 1;
    if (state.letterIndex >= WORD.length) {
      state.letterIndex = 0;
      const roll = Math.floor(Math.random() * 3);
      if (roll === 0) {
        state.goldBombs = Math.min(MAX_GOLD_BOMBS, state.goldBombs + 1);
        state.bonusAnnounce = "goldBomb";
      } else if (roll === 1) {
        state.distance += POINTS_BONUS_AMOUNT;
        state.bonusAnnounce = "points";
      } else {
        state.burstTimer = BURST_DURATION;
        state.bonusAnnounce = "burst";
      }
      state.bonusAnnounceTimer = 2;
    }
  } else {
    state.shielded = true;
  }
}

// Advances the simulation by dt seconds. Returns { crashed }.
export function step(state, dt) {
  if (state.over) return { crashed: false };
  state.t += dt;

  // `speed` drives both the world's scroll and scoring — the coin multiplier
  // and burst only scale how many *points* that distance is worth, never
  // the scroll itself, so neither makes the game easier or harder.
  const speed = speedAt(state.t);
  const scoreMultiplier = state.multiplier * (state.burstTimer > 0 ? BURST_MULTIPLIER : 1);
  state.distance += speed * dt * scoreMultiplier;

  // Purely cosmetic palette milestone — every SCORE_TIER_STEP points.
  const newTier = Math.floor(state.distance / SCORE_TIER_STEP);
  if (newTier > state.colorTier) {
    state.colorTier = newTier;
    state.tierAnnounceTimer = 2;
  }

  if (state.bombTimer > 0) state.bombTimer = Math.max(0, state.bombTimer - dt);
  if (state.burstTimer > 0) state.burstTimer = Math.max(0, state.burstTimer - dt);
  if (state.bonusAnnounceTimer > 0) state.bonusAnnounceTimer = Math.max(0, state.bonusAnnounceTimer - dt);
  if (state.tierAnnounceTimer > 0) state.tierAnnounceTimer = Math.max(0, state.tierAnnounceTimer - dt);
  if (state.magnetTimer > 0) state.magnetTimer = Math.max(0, state.magnetTimer - dt);

  const p = state.player;
  if (state.jetpackTimer > 0) {
    state.jetpackTimer = Math.max(0, state.jetpackTimer - dt);
    // Controllable flight (Jetpack Joyride style): light gravity so you
    // drift down, jump() (every tap, no double-jump limit) kicks you back
    // up — instead of being frozen at a fixed height the whole time.
    p.vy += GRAVITY * JETPACK_GRAVITY_SCALE * dt;
    p.y += p.vy * dt;
    if (p.y > GROUND) {
      p.y = GROUND;
      p.vy = 0;
    } else if (p.y < JETPACK_CEILING) {
      p.y = JETPACK_CEILING;
      p.vy = 0;
    }
    p.spin += dt * 10; // fast spin while flying, purely visual
    if (state.jetpackTimer <= 0) {
      // "Quand on retombe on a un shield" — landing back into danger with
      // one hit already covered.
      p.y = GROUND;
      p.vy = 0;
      p.jumps = 0;
      state.shielded = true;
    }
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
  // Suppressed while a bomb is active — useBomb() already pushed nextSpawnAt
  // past the bomb window, this just double-guards against spawning early.
  if (state.bombTimer <= 0 && state.t >= state.nextSpawnAt) spawnObstacle(state);

  const keptPickups = [];
  for (const pk of state.pickups) {
    // A magnetized pickup flies straight toward the player instead of
    // scrolling with the world — collected for real once it actually
    // reaches them, so it visibly travels there rather than teleporting.
    if (pk.magnetized) {
      const targetX = p.x;
      const targetY = p.y - p.h / 2;
      const dx = targetX - pk.x;
      const dy = targetY - pk.y;
      const dist = Math.hypot(dx, dy) || 1;
      const pull = Math.min(dist, MAGNET_PULL_SPEED * dt);
      pk.x += (dx / dist) * pull;
      pk.y += (dy / dist) * pull;
      if (dist < 10) {
        collectPickup(state, pk);
        continue; // reached the player, collected
      }
      keptPickups.push(pk);
      continue;
    }

    pk.x -= speed * dt;
    if (pk.x + pk.w < -20) continue; // scrolled off, drop

    if (state.magnetTimer > 0 && MAGNETABLE_KINDS.has(pk.kind)) {
      pk.magnetized = true; // starts flying to the player from next frame
      keptPickups.push(pk);
      continue;
    }

    if (aabbHitPickup(p, pk)) {
      collectPickup(state, pk);
      continue; // collected, remove
    }
    keptPickups.push(pk);
  }
  state.pickups = keptPickups;
  if (state.t >= state.nextShieldAt) spawnShield(state);
  if (state.t >= state.nextCoinAt) spawnCoin(state);
  if (state.t >= state.nextBombAt) spawnBomb(state);
  if (state.t >= state.nextGoldBombAt) spawnGoldBomb(state);
  if (state.t >= state.nextLetterAt) spawnLetter(state);
  if (state.t >= state.nextJetpackAt) spawnJetpack(state);
  if (state.t >= state.nextMagnetAt) spawnMagnet(state);

  // A shield absorbs exactly one hit (removing that obstacle so it can't
  // immediately re-trigger next frame) before it's used up. Flying (jetpack)
  // skips collision entirely — obstacles keep spawning normally underneath,
  // the player just isn't there to hit them.
  let crashed = false;
  const keptObstacles = [];
  for (const o of state.obstacles) {
    if (!crashed && state.jetpackTimer <= 0 && aabbHit(p, o)) {
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

  // Big "3, 2, 1" countdown in the jetpack's last 3 seconds — drawn here,
  // behind obstacles/pickups/the player, so it's still very visible without
  // covering up anything the player actually needs to see. Pops bigger at
  // the start of each second, settles down toward the next tick.
  if (state.jetpackTimer > 0 && state.jetpackTimer <= 3) {
    const secondsLeft = Math.ceil(state.jetpackTimer - 1e-6);
    const frac = Math.max(0, Math.min(1, state.jetpackTimer - (secondsLeft - 1)));
    const scale = 1 + 0.4 * frac;
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.2 * frac;
    ctx.font = `800 ${90 * scale}px Poppins, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffd23f";
    ctx.fillText(String(secondsLeft), W / 2, H / 2 - 10);
    ctx.restore();
  }

  // Obstacles — recolored to the current score-tier palette (cosmetic only).
  // Cone = traffic cone (stripe band), pad = glowing energy pylon, post = a
  // small goal frame with netting — each reads as its own object at a
  // glance instead of a plain triangle/block/bar.
  const palette = COLOR_TIERS[state.colorTier % COLOR_TIERS.length];
  const { r: pbR, g: pbG, b: pbB } = hexToRgb(palette.b);
  for (const o of state.obstacles) {
    const top = GROUND - o.h;
    const cx = o.x + o.w / 2;

    // Shared ground-contact shadow, grounds every shape the same way.
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(cx, GROUND + 2, o.w * 0.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (o.kind === "cone") {
      const grad = ctx.createLinearGradient(o.x, top, o.x, GROUND);
      grad.addColorStop(0, palette.a);
      grad.addColorStop(1, palette.b);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(cx, top);
      ctx.lineTo(o.x + o.w, GROUND);
      ctx.lineTo(o.x, GROUND);
      ctx.closePath();
      ctx.fill();
      // Reflective stripe band, like a real traffic cone.
      const bandT0 = 0.5;
      const bandT1 = 0.68;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.moveTo(cx + (o.x - cx) * bandT0, top + o.h * bandT0);
      ctx.lineTo(cx + (o.x + o.w - cx) * bandT0, top + o.h * bandT0);
      ctx.lineTo(cx + (o.x + o.w - cx) * bandT1, top + o.h * bandT1);
      ctx.lineTo(cx + (o.x - cx) * bandT1, top + o.h * bandT1);
      ctx.closePath();
      ctx.fill();
    } else if (o.kind === "pad") {
      // Glowing pylon: a rounded capsule with a bright core and energy bands.
      const grad = ctx.createLinearGradient(o.x, top, o.x, GROUND);
      grad.addColorStop(0, palette.a);
      grad.addColorStop(1, palette.b);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(o.x, top, o.w, o.h, o.w / 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.beginPath();
      ctx.roundRect(o.x + o.w * 0.35, top + 3, o.w * 0.3, o.h - 6, o.w * 0.15);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 1.5;
      for (const f of [0.35, 0.65]) {
        ctx.beginPath();
        ctx.moveTo(o.x + 2, top + o.h * f);
        ctx.lineTo(o.x + o.w - 2, top + o.h * f);
        ctx.stroke();
      }
    } else {
      // Small goal frame: two posts, a crossbar, and faint netting.
      const bar = 3;
      ctx.fillStyle = `rgba(${pbR},${pbG},${pbB},0.14)`;
      ctx.fillRect(o.x + bar, top + bar, o.w - bar * 2, o.h - bar);
      ctx.strokeStyle = `rgba(${pbR},${pbG},${pbB},0.35)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(o.x + bar, top + bar);
      ctx.lineTo(o.x + o.w - bar, GROUND);
      ctx.moveTo(o.x + o.w - bar, top + bar);
      ctx.lineTo(o.x + bar, GROUND);
      ctx.stroke();
      ctx.fillStyle = palette.b;
      ctx.fillRect(o.x, top, bar, o.h);
      ctx.fillRect(o.x + o.w - bar, top, bar, o.h);
      ctx.fillRect(o.x, top, o.w, bar);
    }
  }

  // Pickups: a gold coin (score multiplier), a shield ring (extra chance),
  // or a bomb (stored charge, activated on demand to clear obstacles).
  const pulse = 0.85 + Math.sin(state.t * 6) * 0.15;
  for (const pk of state.pickups) {
    if (pk.magnetized) {
      // Trailing streak back toward where it came from, so the pull reads
      // as motion rather than a pickup instantly popping to the player.
      const player = state.player;
      ctx.save();
      ctx.globalAlpha = 0.5;
      const grad = ctx.createLinearGradient(
        pk.x + pk.w / 2, pk.y,
        player.x, player.y - player.h / 2,
      );
      grad.addColorStop(0, "rgba(216,34,78,0.7)");
      grad.addColorStop(1, "rgba(216,34,78,0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pk.x + pk.w / 2, pk.y);
      ctx.lineTo(player.x, player.y - player.h / 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.translate(pk.x + pk.w / 2, pk.y);
    ctx.scale(pk.magnetized ? 1 : pulse, pk.magnetized ? 1 : pulse);
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
    } else if (pk.kind === "bomb" || pk.kind === "goldBomb") {
      const gold = pk.kind === "goldBomb";
      ctx.fillStyle = gold ? "#7a5b00" : "#2b2b2b";
      ctx.beginPath();
      ctx.arc(0, 1, pk.w / 2, 0, Math.PI * 2);
      ctx.fill();
      if (gold) {
        const grad = ctx.createRadialGradient(-4, -4, 1, 0, 0, pk.w / 2);
        grad.addColorStop(0, "#fff3c4");
        grad.addColorStop(1, "rgba(255,210,63,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 1, pk.w / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = gold ? "rgba(255,210,63,0.7)" : "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.strokeStyle = gold ? "#ffd23f" : "#fe980c";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(3, -pk.h / 2 + 2);
      ctx.lineTo(7, -pk.h / 2 - 4);
      ctx.stroke();
      ctx.fillStyle = gold ? "#ffd23f" : "#fe980c";
      ctx.beginPath();
      ctx.arc(7, -pk.h / 2 - 4, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (pk.kind === "letter") {
      ctx.fillStyle = "rgba(29,29,29,0.9)";
      ctx.beginPath();
      ctx.roundRect(-pk.w / 2, -pk.h / 2, pk.w, pk.h, 5);
      ctx.fill();
      ctx.strokeStyle = "#fe980c";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "800 14px Poppins, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(pk.letter, 0, 1);
    } else if (pk.kind === "jetpack") {
      ctx.fillStyle = "#3a3a3a";
      ctx.beginPath();
      ctx.roundRect(-pk.w / 2 + 4, -pk.h / 2, pk.w - 8, pk.h - 6, 4);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
      const flame = ctx.createLinearGradient(0, pk.h / 2 - 6, 0, pk.h / 2 + 6);
      flame.addColorStop(0, "#ffd23f");
      flame.addColorStop(1, "#fe980c");
      ctx.fillStyle = flame;
      ctx.beginPath();
      ctx.ellipse(-4, pk.h / 2 - 4, 3, 6, 0, 0, Math.PI * 2);
      ctx.ellipse(4, pk.h / 2 - 4, 3, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (pk.kind === "magnet") {
      ctx.strokeStyle = "#d8224e";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 2, pk.w / 2 - 3, Math.PI, Math.PI * 2, false);
      ctx.stroke();
      ctx.fillStyle = "#d8d8d8";
      ctx.fillRect(-pk.w / 2, 2, 5, 8);
      ctx.fillRect(pk.w / 2 - 5, 2, 5, 8);
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

  if (state.jetpackTimer > 0) {
    ctx.save();
    const flicker = 0.7 + Math.sin(state.t * 30) * 0.3;
    const grad = ctx.createLinearGradient(p.x, p.y - logoH / 2, p.x, p.y + 18);
    grad.addColorStop(0, `rgba(255,210,63,${0.7 * flicker})`);
    grad.addColorStop(1, "rgba(254,152,12,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - logoH / 4 + 12, 8, 16, 0, 0, Math.PI * 2);
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

  // Bomb-active screen tint, fading out as the window winds down. Gold if
  // the gold bomb is the one currently active, orange for the common one.
  if (state.bombTimer > 0 && state.bombTimerMax > 0) {
    const isGold = state.bombTimerMax === GOLD_BOMB_DURATION;
    const alpha = Math.min(0.16, (state.bombTimer / state.bombTimerMax) * 0.16);
    ctx.fillStyle = isGold ? `rgba(255, 210, 63, ${alpha})` : `rgba(254, 152, 12, ${alpha})`;
    ctx.fillRect(0, 0, W, H);
  }
}
