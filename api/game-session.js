// POST issues a short signed token when a run starts, so /api/leaderboard.js
// can later check that the elapsed time a player claims roughly matches real
// wall-clock time — not a bulletproof anti-cheat, but it stops the laziest
// version of "edit the score in devtools and submit" since the timing
// wouldn't add up.
//
// It also bumps two counters, kept in the same Gist as the leaderboard but
// their own file (stats.json) so they're untouched by the monthly reset:
// a site-wide "total games played" total, and a per-player breakdown
// (players[normalizedName] = { name, count }). GET reads both without
// incrementing (used on page load, and to check per-player counts — e.g.
// by fetching this endpoint directly). Best-effort throughout: if the Gist
// call fails, the game still starts fine, it just won't have fresh numbers.
import crypto from "node:crypto";

const GIST_ID = process.env.GIST_ID;
const GIST_TOKEN = process.env.GIST_TOKEN;
const STATS_FILE = "stats.json";

function normalizeName(name) {
  const clean = String(name || "").trim().slice(0, 20);
  return clean || "Joueur anonyme";
}

async function readStats() {
  const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: { Authorization: `Bearer ${GIST_TOKEN}`, Accept: "application/vnd.github+json" },
  });
  if (!r.ok) throw new Error(`gist read failed: ${r.status}`);
  const data = await r.json();
  const content = data.files?.[STATS_FILE]?.content;
  if (!content) return { totalGames: 0, players: {} };
  try {
    const parsed = JSON.parse(content);
    const totalGames = Number(parsed.totalGames);
    const players = parsed.players && typeof parsed.players === "object" ? parsed.players : {};
    return { totalGames: Number.isFinite(totalGames) ? totalGames : 0, players };
  } catch {
    return { totalGames: 0, players: {} };
  }
}

async function writeStats(stats) {
  const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${GIST_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ files: { [STATS_FILE]: { content: JSON.stringify(stats, null, 2) } } }),
  });
  if (!r.ok) throw new Error(`gist write failed: ${r.status}`);
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    // ?name=Poms -> just that player's count, e.g.
    // /api/game-session?name=Poms -> { player: { name: "Poms", count: 12 } }
    const queryName = req.query?.name;

    if (!GIST_ID || !GIST_TOKEN) {
      res.status(200).json(
        queryName ? { player: null } : { totalGames: null, players: {} },
      );
      return;
    }
    try {
      const { totalGames, players } = await readStats();
      if (queryName) {
        const key = normalizeName(queryName).toLowerCase();
        res.status(200).json({ player: players[key] || null });
        return;
      }
      res.status(200).json({ totalGames, players });
    } catch {
      res.status(200).json(queryName ? { player: null } : { totalGames: null, players: {} });
    }
    return;
  }

  if (req.method === "POST") {
    const secret = process.env.GIST_TOKEN;
    if (!secret) {
      res.status(500).json({ error: "server not configured" });
      return;
    }

    const ts = Date.now();
    const sig = crypto.createHmac("sha256", secret).update(String(ts)).digest("hex");

    let totalGames = null;
    if (GIST_ID && GIST_TOKEN) {
      try {
        const stats = await readStats();
        stats.totalGames += 1;

        const displayName = normalizeName(req.body?.name);
        const key = displayName.toLowerCase();
        const existing = stats.players[key];
        stats.players[key] = { name: displayName, count: (existing?.count || 0) + 1 };

        await writeStats(stats);
        totalGames = stats.totalGames;
      } catch {
        // Best-effort — a Gist hiccup shouldn't stop the game from starting.
      }
    }

    res.status(200).json({ token: `${ts}.${sig}`, totalGames });
    return;
  }

  res.status(405).json({ error: "method not allowed" });
}
