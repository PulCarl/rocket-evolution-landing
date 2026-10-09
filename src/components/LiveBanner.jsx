import { useTwitchLive } from "../hooks/useTwitchLive.js";
import styles from "./LiveBanner.module.css";

// Shown at the very top of the home page only while Okami is live on Twitch.
export default function LiveBanner() {
  const stream = useTwitchLive();
  if (!stream) return null;

  const details = [stream.game, stream.viewers > 0 ? `${stream.viewers.toLocaleString("fr-FR")} spectateurs` : ""]
    .filter(Boolean)
    .join(" · ");

  return (
    <a
      href={stream.url}
      target="_blank"
      rel="noopener"
      className={styles.banner}
      aria-label={`Okami est en live sur Twitch${stream.title ? ` : ${stream.title}` : ""}. Ouvrir la chaîne.`}
    >
      <span className={styles.live}>
        <span className={styles.dot} aria-hidden="true" />
        En live
      </span>
      <span className={styles.info}>
        <span className={styles.headline}>Okami est en direct sur Twitch</span>
        {(stream.title || details) && <span className={styles.sub}>{stream.title || details}</span>}
        {stream.title && details && <span className={styles.meta}>{details}</span>}
      </span>
      <span className={styles.cta}>Regarder →</span>
    </a>
  );
}
