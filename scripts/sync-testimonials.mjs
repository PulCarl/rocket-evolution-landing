// Récupère les avis approuvés (réaction ✅ d'un coach) depuis un salon Discord
// dédié et met à jour src/data/testimonials.json.
//
// Format attendu pour un message éligible :
//   Rang avant -> Rang après : le texte de l'avis
// Exemples valides : "Or 3 -> Platine 2 : ..." ou "Or 3 → Platine 2 : ..."
// Les messages qui ne suivent pas ce format sont ignorés (avec un avertissement).
//
// Variables d'environnement requises :
//   DISCORD_BOT_TOKEN     token du bot (permission "Read Message History" sur le salon)
//   DISCORD_CHANNEL_ID    id du salon où sont postés les avis
//   DISCORD_APPROVER_IDS  ids Discord (séparés par des virgules) autorisés à approuver
//
// Lancé par .github/workflows/sync-testimonials.yml, qui commit le résultat s'il change.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const TESTIMONIALS_PATH = fileURLToPath(new URL("../src/data/testimonials.json", import.meta.url));
const MAX_TESTIMONIALS = 3;
const APPROVE_EMOJI = encodeURIComponent("✅");
const BAR_COLORS = ["var(--orange)", "var(--orange-2)", "var(--pink)"];

const TEMPLATE_RE = /^(.+?)\s*(?:->|→)\s*(.+?)\s*:\s*(.+)$/su;

const BOT_TOKEN = requireEnv("DISCORD_BOT_TOKEN");
const CHANNEL_ID = requireEnv("DISCORD_CHANNEL_ID");
const APPROVER_IDS = new Set(
  requireEnv("DISCORD_APPROVER_IDS")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
);

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function discordFetch(path) {
  const res = await fetch(`https://discord.com/api/v10${path}`, {
    headers: { Authorization: `Bot ${BOT_TOKEN}` },
  });
  if (!res.ok) {
    throw new Error(`Discord API ${path} → ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function wasApprovedByCoach(message) {
  const reaction = (message.reactions ?? []).find((r) => r.emoji.name === "✅");
  if (!reaction) return false;

  const reactors = await discordFetch(`/channels/${CHANNEL_ID}/messages/${message.id}/reactions/${APPROVE_EMOJI}?limit=100`);
  return reactors.some((user) => APPROVER_IDS.has(user.id));
}

function parseMessage(message) {
  const match = message.content.trim().match(TEMPLATE_RE);
  if (!match) {
    console.warn(`Skipping message ${message.id}: does not match "Rang avant -> Rang après : avis" format.`);
    return null;
  }
  const [, rankBefore, rankAfter, quote] = match;
  const author = message.member?.nick || message.author.global_name || message.author.username;
  return {
    quote: `« ${quote.trim()} »`,
    author: `${author} — ${rankBefore.trim()} → ${rankAfter.trim()}`,
    discordMessageId: message.id,
  };
}

async function main() {
  const messages = await discordFetch(`/channels/${CHANNEL_ID}/messages?limit=50`);
  const existing = JSON.parse(await readFile(TESTIMONIALS_PATH, "utf8"));
  const knownIds = new Set(existing.map((t) => t.discordMessageId).filter(Boolean));

  const newlyApproved = [];
  for (const message of messages) {
    if (knownIds.has(message.id)) continue;
    if (!(await wasApprovedByCoach(message))) continue;
    const parsed = parseMessage(message);
    if (parsed) newlyApproved.push(parsed);
  }

  if (newlyApproved.length === 0) {
    console.log("No new approved testimonials.");
    return;
  }

  // Newest approved first, keep only the most recent MAX_TESTIMONIALS overall.
  const merged = [...newlyApproved, ...existing].slice(0, MAX_TESTIMONIALS).map((t, i) => ({
    quote: t.quote,
    author: t.author,
    barColor: BAR_COLORS[i % BAR_COLORS.length],
    discordMessageId: t.discordMessageId ?? null,
  }));

  await writeFile(TESTIMONIALS_PATH, `${JSON.stringify(merged, null, 2)}\n`);
  console.log(`Added ${newlyApproved.length} new testimonial(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
