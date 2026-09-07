// Score/difficulty physics for the mini-game — shared so engine.js's speed
// ramp and its score-per-second are always computed from the same source.
//
// Score is purely time/speed based (not "+10 per obstacle" or similar ad
// hoc bonuses): distance accumulates as speedAt(t) each frame.

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
