// Top-10 leaderboard, stored in a GitHub Gist (one JSON file) so the rest of
// the site can stay a static deploy — this is the only bit that needs a
// server. GET returns the current top 10; POST submits a run.
//
// Monthly, not all-time: entries from a past month don't count once a new
// one starts (see currentPeriod()) — "1 month to get the best score".
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
// Boost pickups add a flat bonus on top of the time-based distance — a
// player can grab at most one every PICKUP_MIN_GAP seconds (the real client
// randomizes gaps up to PICKUP_MAX_GAP, but only the minimum matters here:
// it's the most any run could physically have collected by a given time).
const BOOST_BONUS = 3000;
const PICKUP_MIN_GAP = 6;

// The leaderboard is monthly, not all-time — "1 month to get the best
// score". UTC-based, which is plenty precise for a community leaderboard
// (worst case the reset lands an hour or two off midnight in France).
function currentPeriod() {
  return new Date().toISOString().slice(0, 7); // "YYYY-MM"
}

// The time-based part of the score (distance = integral of speed over
// time) — closed-form of that integral.
function maxDistance(t) {
  const rampTime = (MAX_SPEED - BASE_SPEED) / RAMP_RATE;
  if (t <= rampTime) return BASE_SPEED * t + 0.5 * RAMP_RATE * t * t;
  const atRamp = BASE_SPEED * rampTime + 0.5 * RAMP_RATE * rampTime * rampTime;
  return atRamp + MAX_SPEED * (t - rampTime);
}

// Upper bound on total score for a claimed elapsed time: the distance is
// deterministic (checked as a tight bound below), but the boost bonus isn't
// — the server can't replay which random pickups a run actually crossed, so
// it can only cap how many it could possibly have collected by then. This
// is intentionally looser than a pure distance check (an exact match was
// possible before pickups existed); it still catches wildly tampered scores
// while allowing legitimate boosted ones through.
function maxPossibleScore(t) {
  const maxPickups = Math.floor(t / PICKUP_MIN_GAP);
  return maxDistance(t) + maxPickups * BOOST_BONUS;
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

// Returns { period, entries, previous } as stored in the gist. `period` may
// be a past month (nobody's submitted since it rolled over yet) — callers
// use derive() below to decide what that means, readLeaderboard doesn't
// reset or archive anything itself (keeps GETs read-only, no gist write on
// every page view). `previous` is `{ period, top3 }` for the last month that
// had a submission, or null if there isn't one yet.
async function readLeaderboard() {
  const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: { Authorization: `Bearer ${GIST_TOKEN}`, Accept: "application/vnd.github+json" },
  });
  if (!r.ok) throw new Error(`gist read failed: ${r.status}`);
  const data = await r.json();
  const content = data.files?.[FILE_NAME]?.content;
  if (!content) return { period: currentPeriod(), entries: [], previous: null };
  try {
    const parsed = JSON.parse(content);
    // Legacy shape (before the monthly reset existed) was a bare array —
    // grandfather it in as belonging to the current period rather than
    // silently wiping it the moment this ships.
    if (Array.isArray(parsed)) return { period: currentPeriod(), entries: parsed, previous: null };
    if (parsed && Array.isArray(parsed.entries)) {
      return {
        period: parsed.period || currentPeriod(),
        entries: parsed.entries,
        previous: parsed.previous || null,
      };
    }
    return { period: currentPeriod(), entries: [], previous: null };
  } catch {
    return { period: currentPeriod(), entries: [], previous: null };
  }
}

async function writeLeaderboard(period, entries, previous) {
  const content = JSON.stringify({ period, entries, previous }, null, 2);
  const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${GIST_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ files: { [FILE_NAME]: { content } } }),
  });
  if (!r.ok) throw new Error(`gist write failed: ${r.status}`);
}

// Given what's actually stored, work out what "this period" and "last
// period's top 3" mean right now. If the stored period is stale (a new
// month started since the last write), its entries become the archived
// "previous" and the current entries start empty — computed the same way
// whether or not anyone has submitted yet this month, so GET can show the
// right thing even before the first write of the new period happens.
function derive(stored) {
  const cp = currentPeriod();
  if (stored.period === cp) {
    return { period: cp, entries: stored.entries, previous: stored.previous };
  }
  return {
    period: cp,
    entries: [],
    previous: { period: stored.period, top3: stored.entries.slice(0, 3) },
  };
}

export default async function handler(req, res) {
  if (!GIST_ID || !GIST_TOKEN) {
    res.status(500).json({ error: "server not configured" });
    return;
  }

  if (req.method === "GET") {
    try {
      const { period, entries, previous } = derive(await readLeaderboard());
      res.status(200).json({ leaderboard: entries, period, previous });
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

    // The score can't exceed what's achievable in the claimed time — pure
    // survival distance, plus at most one boost bonus per PICKUP_MIN_GAP
    // seconds. It also can't be far *below* pure survival distance (that'd
    // mean less time passed than claimed, which the timing check below
    // would likely also catch, but this is a cheap extra sanity bound).
    const upperBound = maxPossibleScore(claimedT);
    const lowerBound = maxDistance(claimedT) * 0.98 - 3;
    if (score > upperBound + 3 || score < lowerBound) {
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
    // "Joueur anonyme" is a shared fallback, not a real identity — never
    // dedupe on it, or unrelated anonymous players would overwrite each other.
    const normalize = (n) => String(n || "").trim().toLowerCase();
    const isRealName = normalize(cleanName) !== "joueur anonyme";

    try {
      const { entries, previous } = derive(await readLeaderboard());
      let list = entries;

      if (isRealName) {
        // Same pseudo already on the board (possibly more than once, from
        // before this dedup existed) — only keep it if this run beats their
        // best, and collapse every one of their older entries into this one.
        const own = list.filter((e) => normalize(e.name) === normalize(cleanName));
        if (own.length > 0) {
          const bestOwn = Math.max(...own.map((e) => e.score));
          if (score <= bestOwn) {
            res.status(200).json({ leaderboard: list, qualified: false, previous });
            return;
          }
          list = list.filter((e) => normalize(e.name) !== normalize(cleanName));
        }
      }

      const qualifies = list.length < MAX_ENTRIES || score > list[list.length - 1]?.score;
      if (!qualifies) {
        res.status(200).json({ leaderboard: list, qualified: false, previous });
        return;
      }
      list.push({ name: cleanName, score: Math.floor(score), date: new Date().toISOString() });
      list.sort((a, b) => b.score - a.score);
      const top = list.slice(0, MAX_ENTRIES);
      await writeLeaderboard(currentPeriod(), top, previous);
      res.status(200).json({ leaderboard: top, qualified: true, period: currentPeriod(), previous });
    } catch (err) {
      res.status(502).json({ error: String(err) });
    }
    return;
  }

  res.status(405).json({ error: "method not allowed" });
}
