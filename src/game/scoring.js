// Score physics shared between the game (src/components/Game) and the
// server-side validator (api/share-score.js). Keeping this in one file
// means the anti-cheat check can never silently drift from the game's
// actual difficulty curve.
//
// Score is purely time/speed based (not "+10 per obstacle" or similar ad
// hoc bonuses), so given an elapsed duration there is a hard mathematical
// ceiling on what a legitimate run could have scored — anything above that
// ceiling (minus a small tolerance for frame-timing jitter) is rejected
// server-side before it ever reaches Discord.

export const GAME_CONFIG = {
  width: 800,
  height: 280,
  groundY: 226,
  gravity: 2200,
  jumpVelocity: -720,
  doubleJumpVelocity: -620,
  baseSpeed: 220,
  rampRate: 4.2,
  maxSpeed: 620,
  minSpawnGap: 0.5,
  maxSpawnGap: 1.35,
};

export function speedAt(elapsedSeconds) {
  const { baseSpeed, rampRate, maxSpeed } = GAME_CONFIG;
  return Math.min(baseSpeed + rampRate * elapsedSeconds, maxSpeed);
}

// Closed-form integral of speedAt(t) from 0 to elapsedSeconds — the exact
// distance a run at max difficulty (never slowed by anything) would cover.
export function maxPossibleScore(elapsedSeconds) {
  const { baseSpeed, rampRate, maxSpeed } = GAME_CONFIG;
  const t = Math.max(0, elapsedSeconds);
  const tCap = (maxSpeed - baseSpeed) / rampRate;
  if (t <= tCap) {
    return baseSpeed * t + 0.5 * rampRate * t * t;
  }
  const capScore = baseSpeed * tCap + 0.5 * rampRate * tCap * tCap;
  return capScore + maxSpeed * (t - tCap);
}

// Server-side tolerance: +8% or +40 points, whichever is larger, to absorb
// client frame-rate variance without opening the door to real cheating.
export function isScorePlausible(score, elapsedSeconds) {
  if (!Number.isFinite(score) || !Number.isFinite(elapsedSeconds)) return false;
  if (score < 0 || elapsedSeconds < 2) return false;
  const ceiling = maxPossibleScore(elapsedSeconds);
  const tolerance = Math.max(ceiling * 0.08, 40);
  return score <= ceiling + tolerance;
}
