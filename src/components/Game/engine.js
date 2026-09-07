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
    player: { x: 90, y: GROUND, vy: 0, jumps: 0, w: 34, h: 30, spin: 0 },
    obstacles: [],
    pickups: [],
    nextSpawnAt: 0.9,
    nextShieldAt: 4 + Math.random() * 4,
    nextCoinAt: 1.5 + Math.random() * 2,
    nextBombAt: BOMB_MIN_GAP + Math.random() * (BOMB_MAX_GAP - BOMB_MIN_GAP),
    nextGoldBombAt: GOLD_BOMB_MIN_GAP + Math.random() * (GOLD_BOMB_MAX_GAP - GOLD_BOMB_MIN_GAP),
    nextLetterAt: 2 + Math.random() * 2,
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
  // ~40% spawn high, reachable only with a well-timed double jump.
  const y = Math.random() < 0.4 ? COIN_Y_HIGH : COIN_Y_LOW;
  state.pickups.push({ x: W + 20, y, w: COIN_SIZE, h: COIN_SIZE, kind: "coin" });
  // Same ramp as spawnObstacle: coins get more frequent as the run goes on
  // (and gets harder), maxing out around the 60s mark like obstacle density.
  const difficulty = Math.min(state.t / 60, 1);
  const gap = COIN_MAX_GAP - (COIN_MAX_GAP - COIN_MIN_GAP) * difficulty;
  state.nextCoinAt = state.t + gap * (0.75 + Math.random() * 0.5);
}

function spawnBomb(state) {
  state.pickups.push({ x: W + 20, y: BOMB_Y, w: BOMB_SIZE, h: BOMB_SIZE, kind: "bomb" });
  state.nextBombAt = state.t + BOMB_MIN_GAP + Math.random() * (BOMB_MAX_GAP - BOMB_MIN_GAP);
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
  // Suppressed while a bomb is active — useBomb() already pushed nextSpawnAt
  // past the bomb window, this just double-guards against spawning early.
  if (state.bombTimer <= 0 && state.t >= state.nextSpawnAt) spawnObstacle(state);

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
      } else if (pk.kind === "bomb") {
        state.bombs = Math.min(MAX_BOMBS, state.bombs + 1);
      } else if (pk.kind === "goldBomb") {
        state.goldBombs = Math.min(MAX_GOLD_BOMBS, state.goldBombs + 1);
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

  // Obstacles — recolored to the current score-tier palette (cosmetic only).
  const palette = COLOR_TIERS[state.colorTier % COLOR_TIERS.length];
  const { r: pbR, g: pbG, b: pbB } = hexToRgb(palette.b);
  for (const o of state.obstacles) {
    const top = GROUND - o.h;
    if (o.kind === "cone") {
      const grad = ctx.createLinearGradient(o.x, top, o.x, GROUND);
      grad.addColorStop(0, palette.a);
      grad.addColorStop(1, palette.b);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(o.x + o.w / 2, top);
      ctx.lineTo(o.x + o.w, GROUND);
      ctx.lineTo(o.x, GROUND);
      ctx.closePath();
      ctx.fill();
    } else if (o.kind === "pad") {
      const grad = ctx.createLinearGradient(o.x, top, o.x + o.w, GROUND);
      grad.addColorStop(0, palette.a);
      grad.addColorStop(1, palette.b);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(o.x, top, o.w, o.h, 5);
      ctx.fill();
    } else {
      ctx.fillStyle = palette.b;
      ctx.fillRect(o.x + o.w / 2 - 3, top, 6, o.h);
      ctx.fillStyle = `rgba(${pbR},${pbG},${pbB},.35)`;
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2, top, 11, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Pickups: a gold coin (score multiplier), a shield ring (extra chance),
  // or a bomb (stored charge, activated on demand to clear obstacles).
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

  // Bomb-active screen tint, fading out as the window winds down. Gold if
  // the gold bomb is the one currently active, orange for the common one.
  if (state.bombTimer > 0 && state.bombTimerMax > 0) {
    const isGold = state.bombTimerMax === GOLD_BOMB_DURATION;
    const alpha = Math.min(0.16, (state.bombTimer / state.bombTimerMax) * 0.16);
    ctx.fillStyle = isGold ? `rgba(255, 210, 63, ${alpha})` : `rgba(254, 152, 12, ${alpha})`;
    ctx.fillRect(0, 0, W, H);
  }
}
