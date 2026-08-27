import { useState } from "react";
import Reveal from "./Reveal.jsx";
import latestVideos from "../data/videos.json";
import styles from "./Videos.module.css";

// maxresdefault.jpg 404s for a lot of real, non-deleted videos (shorts, older
// uploads that never got a maxres thumbnail generated) — fall back to
// hqdefault.jpg (always present for a valid video id) before giving up and
// hiding the whole card, so a stale/deleted id never renders as an empty or
// broken-looking box.
const THUMB_SOURCES = (id) => [
  `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
  `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
];

function VideoCard({ video, delay }) {
  const [tier, setTier] = useState(0);
  const sources = THUMB_SOURCES(video.id);

  if (tier >= sources.length) return null;

  return (
    <Reveal
      delay={delay}
      as="a"
      href={`https://www.youtube.com/watch?v=${video.id}`}
      target="_blank"
      rel="noopener"
      className={styles.thumb}
    >
      <img
        src={sources[tier]}
        alt={video.title}
        loading="lazy"
        className={styles.thumbImg}
        onError={() => setTier((t) => t + 1)}
      />
    </Reveal>
  );
}

export default function Videos() {
  return (
    <section data-bg="dark" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.head}>
          <Reveal as="h2" className={styles.title}>
            Les dernières vidéos
          </Reveal>
          <Reveal as="a" href="https://www.youtube.com/@RocketEvoRL" className={styles.link}>
            Tout voir sur YouTube →
          </Reveal>
        </div>
        <div className={styles.grid}>
          {latestVideos.map((video, i) => (
            <VideoCard key={video.id} video={video} delay={i * 90} />
          ))}
        </div>
      </div>
    </section>
  );
}
