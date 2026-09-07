// Score/difficulty physics for the mini-game — shared so engine.js's speed
// ramp and its score-per-second are always computed from the same source.
//
// Score is time/speed based (distance accumulates as speedAt(t) each frame)
// times a score multiplier that only ever goes up as you collect coins
// mid-run, capped at maxMultiplier — "plus t'avances, plus tu ramasses,
// plus tu fais un gros score". The multiplier only scales *points*, not the
// world's scroll speed, so collecting coins doesn't also make the game
// harder. A temporary burst multiplies that further, and completing the
// ROCKET word can also grant a flat instant points bonus — both are the
// only other things that add to score. api/leaderboard.js duplicates
// maxMultiplier, burstMultiplier and pointsBonusAmount to bound how high a
// claimed score could legitimately be for a given elapsed time (see that
// file for why it's a bound, not an exact match, now that these exist).

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
  // score multiplier, capped at maxMultiplier. Some spawn higher up,
  // reachable only with the double jump.
  coinMinGap: 2,
  coinMaxGap: 3.5,
  coinsPerStep: 3,
  coinMultiplierStep: 0.1,
  maxMultiplier: 3,
  // Bomb pickup: stores up a charge (capped at maxBombs); the player
  // activates one on demand to clear+suppress obstacles for bombDuration.
  // Two tiers: the common one is weak but stacks; the gold one is rare,
  // much stronger, and never stacks (picking up a 2nd is wasted while
  // holding one). Activating uses a normal charge first if you have one,
  // saving the gold one for when normal bombs run out.
  bombMinGap: 15,
  bombMaxGap: 25,
  maxBombs: 3,
  bombDuration: 1.2,
  goldBombMinGap: 90,
  goldBombMaxGap: 150,
  maxGoldBombs: 1,
  goldBombDuration: 8,
  // Letter pickups spell out "ROCKET" (one letter in play at a time, in
  // order); completing the word picks one random bonus and resets the word
  // so it can be spelled again:
  //   - a free gold bomb charge
  //   - an instant flat points bonus (pointsBonusAmount)
  //   - a temporary burst: burstMultiplier on top of the coin multiplier
  word: "ROCKET",
  letterMinGap: 4,
  letterMaxGap: 7,
  pointsBonusAmount: 10000,
  burstDuration: 12,
  burstMultiplier: 3,
};

export function speedAt(elapsedSeconds) {
  const { baseSpeed, rampRate, maxSpeed } = GAME_CONFIG;
  return Math.min(baseSpeed + rampRate * elapsedSeconds, maxSpeed);
}
