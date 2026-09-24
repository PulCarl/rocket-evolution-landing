// Kicks off "Se connecter avec Discord" — a pure convenience login (no
// account, no session, no database): it only exists to grab the visitor's
// Discord display name so they don't have to type it into the mini-game's
// pseudo field by hand. See api/discord-callback.js for the other half.
export default function handler(req, res) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    res.status(500).send("Discord login isn't configured yet (missing env vars).");
    return;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify",
    prompt: "consent",
  });
  res.writeHead(302, { Location: `https://discord.com/api/oauth2/authorize?${params}` });
  res.end();
}
