// Per-bonus upgrade levels, bought with coins earned in-game, synced to the
// player's Discord account (see api/player-progress.js). The cost table
// here is duplicated on the server for validation — same "duplicated, not
// imported" reasoning as api/leaderboard.js: serverless functions don't
// bundle src/, so keep the two in sync by hand if this ever changes.
export const MAX_LEVEL = 3;
export const BONUS_TYPES = ["jetpack", "shield", "spring", "coinMultiplier"];
// Base cost to buy the level named by the key (i.e. LEVEL_UP_COST[2] = cost
// to go from level 1 to level 2, at rebirth 0). Each rebirth makes every
// level-up progressively more expensive (see levelUpCost below) — a rebirth
// wipes your levels, so re-buying them back has to stay a real decision.
export const LEVEL_UP_COST = { 2: 300, 3: 600 };

// +100% of the base cost per rebirth done so far.
export function levelUpCost(targetLevel, rebirths = 0) {
  return Math.round(LEVEL_UP_COST[targetLevel] * (1 + Math.max(rebirths || 0, 0)));
}

export const BONUS_ICONS = { jetpack: "🚀", shield: "🛡️", spring: "🌀", coinMultiplier: "🪙" };
export const BONUS_LABELS = { jetpack: "Jetpack", shield: "Bouclier", spring: "Ressort", coinMultiplier: "Pièces" };

// `key` is the field name in the `upgrades` object engine.js reads at
// runtime; `values[level - 1]` is the effect at that level.
export const LEVEL_EFFECTS = {
  jetpack: {
    key: "jetpackDuration",
    values: [2.2, 3.2, 4.2],
    label: (v) => `${v.toFixed(1)}s de vol`,
  },
  shield: {
    key: "shieldCharges",
    values: [1, 2, 3],
    label: (v) => `${v} coup${v > 1 ? "s" : ""} absorbé${v > 1 ? "s" : ""}`,
  },
  spring: {
    key: "springVelocity",
    values: [-1050, -1200, -1350],
    label: () => "rebond plus haut",
  },
  coinMultiplier: {
    key: "coinValue",
    values: [30, 45, 60],
    label: (v) => `+${v} par pièce`,
  },
};

export function defaultLevels() {
  return { jetpack: 1, shield: 1, spring: 1, coinMultiplier: 1 };
}

// Rebirth: an unlimited prestige loop, bought (not height-gated) from the
// menu — before or after a run, never mid-run. Buying one spends coins
// (kept otherwise), resets every bonus level back to 1, and permanently
// raises the multiplier applied to jetpack duration, spring/base bounce
// power and coin value from then on. Kept in sync by hand with
// api/player-progress.js (same reasoning as the cost table above).
export const REBIRTH_BASE_COST = 500;
export const REBIRTH_BONUS_RATE = 0.5; // +50% to boosted stats per rebirth, stacking

export function rebirthCost(rebirths) {
  return Math.round(REBIRTH_BASE_COST * (1 + Math.max(rebirths || 0, 0)));
}

export function rebirthMultiplier(rebirths) {
  return 1 + REBIRTH_BONUS_RATE * Math.max(rebirths || 0, 0);
}

// Base (rebirth 0, level 1) normal-platform bounce — must match
// engine.js's GAME_CONFIG.bounceVelocity.
const BASE_BOUNCE_VELOCITY = -700;

// Turns { jetpack: 2, shield: 1, ... } + a rebirth count into the flat
// upgrades object engine.js's createGame() expects (jetpackDuration,
// shieldCharges, springVelocity, coinValue, bounceVelocity). The rebirth
// multiplier stacks on top of whatever the coin-bought level already gives
// for the continuous stats (flight time, bounce power, coin value); shield
// charges stay level-only since a fractional "hit count" doesn't make sense.
export function upgradesFromLevels(levels, rebirths = 0) {
  const lv = levels || defaultLevels();
  const mult = rebirthMultiplier(rebirths);
  const out = {};
  for (const [bonus, cfg] of Object.entries(LEVEL_EFFECTS)) {
    const level = lv[bonus] || 1;
    let value = cfg.values[Math.min(Math.max(level, 1), MAX_LEVEL) - 1];
    if (bonus === "jetpack" || bonus === "spring") value *= mult;
    if (bonus === "coinMultiplier") value = Math.round(value * mult);
    out[cfg.key] = value;
  }
  out.bounceVelocity = BASE_BOUNCE_VELOCITY * mult;
  return out;
}
