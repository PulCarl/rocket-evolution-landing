// Per-player progression (coins + bonus levels), synced to the visitor's
// Discord account and stored in the SAME Gist the leaderboard uses (a new
// file within it, player-progress.json) — no separate database needed.
//
// Every write must carry a `sig` proving the caller actually completed the
// Discord OAuth flow for the claimed `discordId` (see api/discord-callback.js,
// which mints it as HMAC-SHA256(GIST_TOKEN, discordId)). Discord IDs aren't
// secret, so this only guards against forging someone else's id — it's the
// same lightweight, session-free trust model as this site's other anti-abuse
// checks (the leaderboard's run-token, game-session's signed token), not a
// real auth system, since nothing here is more sensitive than mini-game
// progress.
import crypto from "node:crypto";

const GIST_ID = process.env.GIST_ID;
const GIST_TOKEN = process.env.GIST_TOKEN;
const FILE_NAME = "player-progress.json";

const BONUS_TYPES = ["jetpack", "shield", "spring", "coinMultiplier"];
const MAX_LEVEL = 3;
// Cost to buy the level named by the key — kept in sync by hand with
// src/components/Doodle/levels.js (see that file's comment).
const LEVEL_UP_COST = { 2: 300, 3: 600 };
// A single run can plausibly net a handful of coins, never thousands —
// a loose sanity cap, not full anti-cheat (nothing here is worth building
// the score/time-based bound the point leaderboard has).
const MAX_COINS_PER_RUN = 5000;

function verifySig(discordId, sig) {
  if (typeof discordId !== "string" || !discordId || typeof sig !== "string" || !sig) return false;
  const expected = crypto.createHmac("sha256", GIST_TOKEN).update(discordId).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function defaultRecord() {
  return { name: "", coins: 0, levels: { jetpack: 1, shield: 1, spring: 1, coinMultiplier: 1 }, best: 0 };
}

async function readAllPlayers() {
  const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: { Authorization: `Bearer ${GIST_TOKEN}`, Accept: "application/vnd.github+json" },
  });
  if (!r.ok) throw new Error(`gist read failed: ${r.status}`);
  const data = await r.json();
  const content = data.files?.[FILE_NAME]?.content;
  if (!content) return {};
  try {
    const parsed = JSON.parse(content);
    return parsed && typeof parsed.players === "object" ? parsed.players : {};
  } catch {
    return {};
  }
}

async function writeAllPlayers(players) {
  const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${GIST_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ files: { [FILE_NAME]: { content: JSON.stringify({ players }, null, 2) } } }),
  });
  if (!r.ok) throw new Error(`gist write failed: ${r.status}`);
}

export default async function handler(req, res) {
  if (!GIST_ID || !GIST_TOKEN) {
    res.status(500).json({ error: "server not configured" });
    return;
  }

  if (req.method === "GET") {
    // ?leaderboard=1 -> top 10 by best score across every synced player,
    // same { leaderboard: [{name, score}] } shape as api/leaderboard.js so
    // the same list UI can render either one.
    if (req.query?.leaderboard === "1") {
      try {
        const players = await readAllPlayers();
        const list = Object.values(players)
          .filter((p) => p.best > 0)
          .sort((a, b) => b.best - a.best)
          .slice(0, 10)
          .map((p) => ({ name: p.name || "Joueur anonyme", score: p.best }));
        res.status(200).json({ leaderboard: list });
      } catch (err) {
        res.status(502).json({ error: String(err) });
      }
      return;
    }

    const discordId = req.query?.discordId;
    if (!discordId) {
      res.status(400).json({ error: "missing discordId" });
      return;
    }
    try {
      const players = await readAllPlayers();
      res.status(200).json(players[discordId] || defaultRecord());
    } catch (err) {
      res.status(502).json({ error: String(err) });
    }
    return;
  }

  if (req.method === "POST") {
    const { discordId, sig, action } = req.body || {};
    if (!verifySig(discordId, sig)) {
      res.status(401).json({ error: "invalid signature" });
      return;
    }

    try {
      const players = await readAllPlayers();
      const record = players[discordId] || defaultRecord();

      if (action === "finishRun") {
        const { name, score, coinsEarned } = req.body;
        if (typeof name === "string" && name.trim()) record.name = name.trim().slice(0, 20);

        const earned = Number(coinsEarned);
        if (Number.isFinite(earned) && earned > 0) {
          record.coins += Math.floor(Math.min(earned, MAX_COINS_PER_RUN));
        }

        const s = Number(score);
        if (Number.isFinite(s) && s > record.best) record.best = Math.floor(s);
      } else if (action === "levelUp") {
        const bonus = req.body.bonus;
        if (!BONUS_TYPES.includes(bonus)) {
          res.status(400).json({ error: "invalid bonus" });
          return;
        }
        const currentLevel = record.levels[bonus] || 1;
        const nextLevel = currentLevel + 1;
        if (nextLevel > MAX_LEVEL) {
          res.status(400).json({ error: "already max level" });
          return;
        }
        const cost = LEVEL_UP_COST[nextLevel];
        if (record.coins < cost) {
          res.status(400).json({ error: "not enough coins" });
          return;
        }
        record.coins -= cost;
        record.levels[bonus] = nextLevel;
      } else {
        res.status(400).json({ error: "invalid action" });
        return;
      }

      players[discordId] = record;
      await writeAllPlayers(players);
      res.status(200).json(record);
    } catch (err) {
      res.status(502).json({ error: String(err) });
    }
    return;
  }

  res.status(405).json({ error: "method not allowed" });
}
