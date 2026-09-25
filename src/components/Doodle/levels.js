// Per-bonus upgrade levels, bought with coins earned in-game, synced to the
// player's Discord account (see api/player-progress.js). The cost table
// here is duplicated on the server for validation — same "duplicated, not
// imported" reasoning as api/leaderboard.js: serverless functions don't
// bundle src/, so keep the two in sync by hand if this ever changes.
export const MAX_LEVEL = 3;
export const BONUS_TYPES = ["jetpack", "shield", "spring", "coinMultiplier"];
// Cost to buy the level named by the key (i.e. LEVEL_UP_COST[2] = cost to
// go from level 1 to level 2).
export const LEVEL_UP_COST = { 2: 300, 3: 600 };

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

// Turns { jetpack: 2, shield: 1, ... } into the flat upgrades object
// engine.js's createGame() expects (jetpackDuration, shieldCharges, ...).
export function upgradesFromLevels(levels) {
  const lv = levels || defaultLevels();
  const out = {};
  for (const [bonus, cfg] of Object.entries(LEVEL_EFFECTS)) {
    const level = lv[bonus] || 1;
    out[cfg.key] = cfg.values[Math.min(Math.max(level, 1), MAX_LEVEL) - 1];
  }
  return out;
}
