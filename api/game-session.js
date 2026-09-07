// Issues a short signed token when a run starts, so /api/leaderboard.js can
// later check that the elapsed time a player claims roughly matches real
// wall-clock time — not a bulletproof anti-cheat, but it stops the laziest
// version of "edit the score in devtools and submit" since the timing
// wouldn't add up.
import crypto from "node:crypto";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  const secret = process.env.GIST_TOKEN;
  if (!secret) {
    res.status(500).json({ error: "server not configured" });
    return;
  }

  const ts = Date.now();
  const sig = crypto.createHmac("sha256", secret).update(String(ts)).digest("hex");
  res.status(200).json({ token: `${ts}.${sig}` });
}
