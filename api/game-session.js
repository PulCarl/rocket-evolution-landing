// POST issues a short signed token when a run starts, so /api/leaderboard.js
// can later check that the elapsed time a player claims roughly matches real
// wall-clock time — not a bulletproof anti-cheat, but it stops the laziest
// version of "edit the score in devtools and submit" since the timing
// wouldn't add up.
//
// It also bumps a site-wide "total games played" counter — kept in the same
// Gist as the leaderboard, but its own file (stats.json) so it's untouched
// by the monthly reset. GET just reads the current count (for page load,
// before anyone's played). Best-effort: if the Gist call fails, the game
// still starts/counts fine, it just won't have a fresh total to show.
import crypto from "node:crypto";

const GIST_ID = process.env.GIST_ID;
const GIST_TOKEN = process.env.GIST_TOKEN;
const STATS_FILE = "stats.json";

async function readStats() {
  const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: { Authorization: `Bearer ${GIST_TOKEN}`, Accept: "application/vnd.github+json" },
  });
  if (!r.ok) throw new Error(`gist read failed: ${r.status}`);
  const data = await r.json();
  const content = data.files?.[STATS_FILE]?.content;
  if (!content) return { totalGames: 0 };
  try {
    const parsed = JSON.parse(content);
    const totalGames = Number(parsed.totalGames);
    return { totalGames: Number.isFinite(totalGames) ? totalGames : 0 };
  } catch {
    return { totalGames: 0 };
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
    if (!GIST_ID || !GIST_TOKEN) {
      res.status(200).json({ totalGames: null });
      return;
    }
    try {
      const { totalGames } = await readStats();
      res.status(200).json({ totalGames });
    } catch {
      res.status(200).json({ totalGames: null });
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
