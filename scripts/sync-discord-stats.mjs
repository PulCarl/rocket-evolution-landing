// Récupère le nombre de membres du serveur Discord via l'API publique des
// invitations (pas de bot ni de clé nécessaire) et met à jour
// src/data/discordStats.json, affiché dans le hero du site.
//
// Lancé par .github/workflows/sync-discord-stats.yml, qui commit le résultat
// s'il change.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const INVITE_CODE = "6dbDnF3JCy";
const STATS_PATH = fileURLToPath(new URL("../src/data/discordStats.json", import.meta.url));

async function main() {
  const res = await fetch(`https://discord.com/api/v10/invites/${INVITE_CODE}?with_counts=true`);
  if (!res.ok) throw new Error(`Discord invite API → ${res.status} ${await res.text()}`);
  const data = await res.json();

  const memberCount = data.approximate_member_count;
  if (typeof memberCount !== "number") throw new Error("approximate_member_count missing from response.");

  const existing = JSON.parse(await readFile(STATS_PATH, "utf8"));
  if (existing.memberCount === memberCount) {
    console.log("No change.");
    return;
  }

  await writeFile(STATS_PATH, `${JSON.stringify({ memberCount }, null, 2)}\n`);
  console.log(`Updated member count: ${existing.memberCount} -> ${memberCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
