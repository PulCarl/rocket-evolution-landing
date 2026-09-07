// Score/difficulty physics for the mini-game — shared so engine.js's speed
// ramp and its score-per-second are always computed from the same source.
//
// Score is mostly time/speed based (distance accumulates as speedAt(t) each
// frame) plus a flat bonus per boost pickup grabbed mid-run. api/leaderboard.js
// duplicates BOOST_BONUS/PICKUP_MIN_GAP to bound how much bonus a claimed
// elapsed time could plausibly include (see that file for why it's a bound,
// not an exact match, now that a bonus exists).

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
  // Pickups: a "boost" gives an instant score bonus and a brief invincible
  // stationary window (like Jetpack Joyride's Lil' Stomper — grounded and
  // immune to crashes, not flying); a "shield" absorbs the next crash
  // instead of ending the run.
  boostBonus: 3000,
  pickupMinGap: 6,
  pickupMaxGap: 14,
  boostDuration: 1.3,
};

export function speedAt(elapsedSeconds) {
  const { baseSpeed, rampRate, maxSpeed } = GAME_CONFIG;
  return Math.min(baseSpeed + rampRate * elapsedSeconds, maxSpeed);
}
