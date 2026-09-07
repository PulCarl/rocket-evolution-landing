// Score/difficulty physics for the mini-game — shared so engine.js's speed
// ramp and its score-per-second are always computed from the same source.
//
// Score is time/speed based (distance accumulates as speedAt(t) each frame)
// times a score multiplier that only ever goes up as you collect coins
// mid-run, capped at maxMultiplier — "plus t'avances, plus tu ramasses,
// plus tu fais un gros score". The multiplier only scales *points*, not the
// world's scroll speed, so collecting coins doesn't also make the game
// harder. api/leaderboard.js duplicates maxMultiplier to bound how high a
// claimed score could legitimately be for a given elapsed time (see that
// file for why it's a bound, not an exact match, now that this exists).

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
  // Shield pickup: absorbs the next crash instead of ending the run.
  shieldMinGap: 6,
  shieldMaxGap: 14,
  // Coin pickup: every coinsPerStep-th coin adds coinMultiplierStep to the
  // score multiplier, capped at maxMultiplier.
  coinMinGap: 2.5,
  coinMaxGap: 4.5,
  coinsPerStep: 3,
  coinMultiplierStep: 0.1,
  maxMultiplier: 3,
};

export function speedAt(elapsedSeconds) {
  const { baseSpeed, rampRate, maxSpeed } = GAME_CONFIG;
  return Math.min(baseSpeed + rampRate * elapsedSeconds, maxSpeed);
}
