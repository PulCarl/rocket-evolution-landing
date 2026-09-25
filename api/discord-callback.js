// The other half of "Se connecter avec Discord" (see api/discord-login.js).
// Exchanges the auth code for a token, reads the visitor's Discord display
// name, and hands back a tiny HTML page whose only job is to write that
// name into localStorage (the same keys the mini-games already read their
// pseudo from) and bounce back to the site — no cookies, no session, no
// database, since nothing here is more sensitive than a display name the
// field already let anyone type in freely.
const NAME_KEYS = ["re-doodle-name", "re-runner-name", "re-circuit-name"];
// Set alongside the name so the game UI can show a clear "connected" state
// instead of silently pre-filling a field with no confirmation.
const CONNECTED_KEY = "re-discord-connected";

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
    try { localStorage.setItem(${JSON.stringify(CONNECTED_KEY)}, "1"); } catch (e) {}
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
    sendResult(res, displayName ? { ok: true, name: displayName } : { ok: false });
  } catch {
    sendResult(res, { ok: false });
  }
}
