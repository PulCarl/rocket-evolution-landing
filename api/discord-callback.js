// The other half of "Se connecter avec Discord" (see api/discord-login.js).
// Exchanges the auth code for a token, reads the visitor's Discord identity,
// and hands back a tiny HTML page whose only job is to write it into
// localStorage (the same keys the mini-games already read their pseudo
// from) and bounce back to the site — no cookies, no session.
//
// Alongside the display name, this now also writes the Discord user id and
// an HMAC signature of it (see api/player-progress.js) so the per-player
// coins/bonus-levels progression can be synced to that id later without a
// real login session — the signature just proves this browser actually
// completed OAuth for that id, nothing more sensitive than that.
import crypto from "node:crypto";

const NAME_KEYS = ["re-doodle-name", "re-runner-name", "re-circuit-name"];
const ID_KEY = "re-discord-id";
const SIG_KEY = "re-discord-sig";

function sendResult(res, result) {
  const payload = JSON.stringify(result).replace(/</g, "\\u003c");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`<!doctype html>
<meta charset="utf-8" />
<script>
(function () {
  var result = ${payload};
  if (result.ok && result.name) {
    ${JSON.stringify(NAME_KEYS)}.forEach(function (key) {
      try { localStorage.setItem(key, result.name); } catch (e) {}
    });
  }
  if (result.ok && result.id && result.sig) {
    try {
      localStorage.setItem(${JSON.stringify(ID_KEY)}, result.id);
      localStorage.setItem(${JSON.stringify(SIG_KEY)}, result.sig);
    } catch (e) {}
  }
  window.location.replace(result.ok ? "/#jeu" : "/?discord_error=1#jeu");
})();
</script>`);
}

export default async function handler(req, res) {
  const { code, error } = req.query || {};
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  const gistToken = process.env.GIST_TOKEN;

  if (error) {
    sendResult(res, { ok: false });
    return;
  }
  if (!code || !clientId || !clientSecret || !redirectUri) {
    sendResult(res, { ok: false });
    return;
  }

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });
    if (!tokenRes.ok) throw new Error(`token exchange failed: ${tokenRes.status}`);
    const tokenData = await tokenRes.json();

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `${tokenData.token_type} ${tokenData.access_token}` },
    });
    if (!userRes.ok) throw new Error(`user fetch failed: ${userRes.status}`);
    const user = await userRes.json();

    // Discord phased out discriminators for most accounts — global_name is
    // the current display name, username is the pre-migration fallback.
    const displayName = (user.global_name || user.username || "").trim().slice(0, 20);
    if (!displayName || !user.id) {
      sendResult(res, { ok: false });
      return;
    }

    // Progression sync needs a real HMAC secret to sign against — without
    // it (e.g. GIST_TOKEN not configured yet) still let the name pre-fill
    // work, just without an id/sig pair.
    if (!gistToken) {
      sendResult(res, { ok: true, name: displayName });
      return;
    }
    const sig = crypto.createHmac("sha256", gistToken).update(user.id).digest("hex");
    sendResult(res, { ok: true, name: displayName, id: user.id, sig });
  } catch {
    sendResult(res, { ok: false });
  }
}
