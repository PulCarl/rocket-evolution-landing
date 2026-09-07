// Vercel serverless function: validates a game score server-side (so
// "set score in devtools" doesn't work) and, only if plausible, forwards
// the share-card image to a Discord webhook. The webhook URL lives only
// in this function's environment — it is never sent to the browser, so
// nobody can find it in network requests and post to the channel directly.
import { isScorePlausible } from "../src/game/scoring.js";

const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // Discord's default per-file cap is 8MB — stay under it.

// Best-effort per-IP throttle. Resets whenever this function instance is
// recycled (cold start) — it deters rapid-fire spam from one warm instance,
// it is not a hard guarantee across Vercel's serverless fleet.
const recentByIp = new Map();
const MIN_INTERVAL_MS = 15_000;

function tooSoon(ip) {
  const last = recentByIp.get(ip);
  const now = Date.now();
  if (last && now - last < MIN_INTERVAL_MS) return true;
  recentByIp.set(ip, now);
  if (recentByIp.size > 500) {
    const cutoff = now - MIN_INTERVAL_MS * 4;
    for (const [key, ts] of recentByIp) if (ts < cutoff) recentByIp.delete(key);
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const webhookUrl = process.env.DISCORD_SCORE_WEBHOOK_URL;
  if (!webhookUrl) {
    res.status(500).json({ error: "webhook_not_configured" });
    return;
  }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  if (tooSoon(ip)) {
    res.status(429).json({ error: "rate_limited" });
    return;
  }

  const { score, elapsedSeconds, image } = req.body ?? {};

  if (!Number.isInteger(score) || typeof elapsedSeconds !== "number") {
    res.status(400).json({ error: "invalid_payload" });
    return;
  }

  if (!isScorePlausible(score, elapsedSeconds)) {
    res.status(422).json({ error: "implausible_score" });
    return;
  }

  if (typeof image !== "string" || !image.startsWith("data:image/png;base64,")) {
    res.status(400).json({ error: "invalid_image" });
    return;
  }

  const base64 = image.slice("data:image/png;base64,".length);
  const buffer = Buffer.from(base64, "base64");
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) {
    res.status(400).json({ error: "invalid_image" });
    return;
  }

  const form = new FormData();
  form.append(
    "payload_json",
    JSON.stringify({
      content: `🏁 Nouveau score au mini-jeu : **${score}** points !`,
    }),
  );
  form.append("files[0]", new Blob([buffer], { type: "image/png" }), "score.png");

  const discordRes = await fetch(webhookUrl, { method: "POST", body: form });
  if (!discordRes.ok) {
    res.status(502).json({ error: "discord_error" });
    return;
  }

  res.status(200).json({ ok: true });
}
