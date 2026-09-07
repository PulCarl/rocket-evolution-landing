// Top-10 leaderboard, stored in a GitHub Gist (one JSON file) so the rest of
// the site can stay a static deploy — this is the only bit that needs a
// server. GET returns the current top 10; POST submits a run.
//
// Requires two env vars in the Vercel project settings:
//   GIST_ID    — id of the gist holding leaderboard.json
//   GIST_TOKEN — a GitHub personal access token, "gist" scope only
import crypto from "node:crypto";

const GIST_ID = process.env.GIST_ID;
const GIST_TOKEN = process.env.GIST_TOKEN;
const FILE_NAME = "leaderboard.json";
const MAX_ENTRIES = 10;

// Same speed ramp as src/game/scoring.js, duplicated (not imported) so this
// function has no dependency on the app's src/ bundle. Keep the two in sync
// if the game's difficulty curve ever changes.
const BASE_SPEED = 220;
const RAMP_RATE = 4.2;
const MAX_SPEED = 620;

// Score is purely time-based (distance = integral of speed over time, no
// per-obstacle bonuses), so for a given elapsed time there's exactly one
// legitimate score — this is the closed-form of that integral.
function maxPossibleScore(t) {
  const rampTime = (MAX_SPEED - BASE_SPEED) / RAMP_RATE;
  if (t <= rampTime) return BASE_SPEED * t + 0.5 * RAMP_RATE * t * t;
  const atRamp = BASE_SPEED * rampTime + 0.5 * RAMP_RATE * rampTime * rampTime;
  return atRamp + MAX_SPEED * (t - rampTime);
}

function verifySessionToken(token) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [tsStr, sig] = token.split(".");
  const ts = Number(tsStr);
  if (!Number.isFinite(ts)) return null;
  const expected = crypto.createHmac("sha256", GIST_TOKEN).update(tsStr).digest("hex");
  // Constant-time compare to avoid leaking the signature byte-by-byte via timing.
  const a = Buffer.from(sig || "");
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return ts;
}

async function readLeaderboard() {
  const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: { Authorization: `Bearer ${GIST_TOKEN}`, Accept: "application/vnd.github+json" },
  });
  if (!r.ok) throw new Error(`gist read failed: ${r.status}`);
  const data = await r.json();
  const content = data.files?.[FILE_NAME]?.content;
  if (!content) return [];
  try {
    const list = JSON.parse(content);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function writeLeaderboard(list) {
  const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${GIST_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ files: { [FILE_NAME]: { content: JSON.stringify(list, null, 2) } } }),
  });
  if (!r.ok) throw new Error(`gist write failed: ${r.status}`);
}

export default async function handler(req, res) {
  if (!GIST_ID || !GIST_TOKEN) {
    res.status(500).json({ error: "server not configured" });
    return;
  }

  if (req.method === "GET") {
    try {
      res.status(200).json({ leaderboard: await readLeaderboard() });
    } catch (err) {
      res.status(502).json({ error: String(err) });
    }
    return;
  }

  if (req.method === "POST") {
    const { name, score, elapsedSeconds, token } = req.body || {};

    if (typeof score !== "number" || !Number.isFinite(score) || score <= 0) {
      res.status(400).json({ error: "invalid score" });
      return;
    }
    const claimedT = Number(elapsedSeconds);
    if (!Number.isFinite(claimedT) || claimedT <= 0) {
      res.status(400).json({ error: "invalid elapsed time" });
      return;
    }
    const issuedAt = verifySessionToken(token);
    if (issuedAt === null) {
      res.status(400).json({ error: "invalid session" });
      return;
    }

    // The score must match the deterministic time->distance formula...
    const expectedScore = maxPossibleScore(claimedT);
    if (Math.abs(score - expectedScore) > Math.max(3, expectedScore * 0.01)) {
      res.status(400).json({ error: "implausible score" });
      return;
    }
    // ...and the claimed elapsed time must roughly match real wall-clock
    // time since the session started (slack for network/tab lag).
    const realElapsed = (Date.now() - issuedAt) / 1000;
    if (Math.abs(realElapsed - claimedT) > Math.max(5, claimedT * 0.05)) {
      res.status(400).json({ error: "timing mismatch" });
      return;
    }

    const cleanName = String(name || "").trim().slice(0, 20) || "Joueur anonyme";

    try {
      const list = await readLeaderboard();
      const qualifies = list.length < MAX_ENTRIES || score > list[list.length - 1]?.score;
      if (!qualifies) {
        res.status(200).json({ leaderboard: list, qualified: false });
        return;
      }
      list.push({ name: cleanName, score: Math.floor(score), date: new Date().toISOString() });
      list.sort((a, b) => b.score - a.score);
      const top = list.slice(0, MAX_ENTRIES);
      await writeLeaderboard(top);
      res.status(200).json({ leaderboard: top, qualified: true });
    } catch (err) {
      res.status(502).json({ error: String(err) });
    }
    return;
  }

  res.status(405).json({ error: "method not allowed" });
}
