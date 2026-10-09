// Is Okami live on Twitch right now? Asked by the landing page (LiveBanner) to
// decide whether to show a "en live" banner at the top of the home page.
//
// Uses Twitch's official Helix API with an app access token (client-credentials
// flow, no viewer login involved), so it needs two Vercel env vars from a free
// app created at https://dev.twitch.tv/console/apps :
//   TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET
// Without them this just answers { live: false } and the banner never shows.
//
// The visitor's browser only ever talks to this endpoint, never to Twitch, so
// no visitor data is sent to Twitch just for loading the page.
const CHANNEL = "okamylive";

// Survives between invocations while the serverless instance stays warm, so
// most requests skip the token round-trip. App tokens last ~60 days.
let cachedToken = null; // { value, expiresAt }

async function getToken(clientId, clientSecret) {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;
  const r = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });
  if (!r.ok) throw new Error(`twitch token failed: ${r.status}`);
  const data = await r.json();
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.value;
}

async function fetchStream(clientId, clientSecret) {
  const request = async () => {
    const token = await getToken(clientId, clientSecret);
    return fetch(`https://api.twitch.tv/helix/streams?user_login=${CHANNEL}`, {
      headers: { "Client-Id": clientId, Authorization: `Bearer ${token}` },
    });
  };
  let r = await request();
  if (r.status === 401) {
    // Token revoked/expired early — drop it and retry once with a fresh one.
    cachedToken = null;
    r = await request();
  }
  if (!r.ok) throw new Error(`twitch streams failed: ${r.status}`);
  const data = await r.json();
  return data.data?.[0] ?? null;
}

export default async function handler(req, res) {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.setHeader("Cache-Control", "public, s-maxage=300");
    res.status(200).json({ live: false, configured: false });
    return;
  }

  try {
    const stream = await fetchStream(clientId, clientSecret);
    // Cached at Vercel's edge, so a burst of visitors costs one Twitch call a minute.
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    if (!stream || stream.type !== "live") {
      res.status(200).json({ live: false });
      return;
    }
    res.status(200).json({
      live: true,
      name: stream.user_name,
      title: String(stream.title || "").slice(0, 140),
      game: stream.game_name || "",
      viewers: stream.viewer_count ?? 0,
      url: `https://www.twitch.tv/${CHANNEL}`,
    });
  } catch {
    // Fail closed: if Twitch is unreachable, show nothing rather than a stale "live".
    res.setHeader("Cache-Control", "public, s-maxage=30");
    res.status(200).json({ live: false });
  }
}
