// Récupère les 3 dernières vidéos de la chaîne YouTube via son flux RSS public
// (pas besoin de clé API) et met à jour src/data/videos.json.
//
// Lancé par .github/workflows/sync-videos.yml, qui commit le résultat s'il change.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const CHANNEL_ID = "UCBiuzf9xGJXJflCjHWUwqZg";
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const VIDEOS_PATH = fileURLToPath(new URL("../src/data/videos.json", import.meta.url));
const MAX_VIDEOS = 3;

const XML_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" };

function decodeXmlEntities(text) {
  return text.replace(/&(#\d+|#x[0-9a-f]+|[a-z0-9]+);/gi, (match, entity) => {
    if (entity[0] === "#") {
      const code = entity[1] === "x" || entity[1] === "X" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    return XML_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

function parseEntries(xml) {
  const entries = [];
  for (const entryXml of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const idMatch = entryXml[1].match(/<yt:videoId>(.*?)<\/yt:videoId>/);
    const titleMatch = entryXml[1].match(/<title>(.*?)<\/title>/);
    if (!idMatch || !titleMatch) continue;
    entries.push({ id: idMatch[1], title: decodeXmlEntities(titleMatch[1]) });
  }
  return entries;
}

async function main() {
  const res = await fetch(FEED_URL);
  if (!res.ok) throw new Error(`Failed to fetch ${FEED_URL}: ${res.status}`);
  const xml = await res.text();

  const latest = parseEntries(xml).slice(0, MAX_VIDEOS);
  if (latest.length === 0) throw new Error("No video entries found in feed.");

  const existing = JSON.parse(await readFile(VIDEOS_PATH, "utf8"));
  const unchanged = JSON.stringify(existing) === JSON.stringify(latest);
  if (unchanged) {
    console.log("No new videos.");
    return;
  }

  await writeFile(VIDEOS_PATH, `${JSON.stringify(latest, null, 2)}\n`);
  console.log(`Updated videos.json with ${latest.length} video(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
