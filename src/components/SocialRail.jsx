import { useRailTheme } from "../hooks/useRailTheme.js";
import { socialLinks } from "../data/content.js";
import styles from "./SocialRail.module.css";

const ICONS = {
  discord: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.32 4.57A19.8 19.8 0 0 0 15.4 3.1a13.6 13.6 0 0 0-.63 1.28 18.3 18.3 0 0 0-5.53 0A13 13 0 0 0 8.6 3.1a19.7 19.7 0 0 0-4.93 1.47C.54 9.2-.32 13.7.11 18.15a19.9 19.9 0 0 0 6.03 3.03c.49-.66.92-1.36 1.29-2.09-.71-.26-1.39-.59-2.03-.97.17-.13.34-.26.5-.4a14.2 14.2 0 0 0 12.2 0c.16.14.33.28.5.4-.64.39-1.32.71-2.03.98.37.73.8 1.43 1.29 2.09a19.8 19.8 0 0 0 6.03-3.03c.5-5.16-.86-9.62-3.57-13.58ZM8.02 15.43c-1.18 0-2.16-1.08-2.16-2.41 0-1.33.95-2.42 2.16-2.42 1.22 0 2.19 1.09 2.17 2.42 0 1.33-.96 2.41-2.17 2.41Zm7.96 0c-1.19 0-2.16-1.08-2.16-2.41 0-1.33.95-2.42 2.16-2.42 1.22 0 2.19 1.09 2.17 2.42 0 1.33-.95 2.41-2.17 2.41Z" />
    </svg>
  ),
  youtube: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.12-2.12C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.53A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.12 2.12c1.88.53 9.38.53 9.38.53s7.5 0 9.38-.53a3 3 0 0 0 2.12-2.12A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8ZM9.6 15.57V8.43L15.82 12 9.6 15.57Z" />
    </svg>
  ),
  tiktok: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82A5.34 5.34 0 0 1 15.4 2h-3.3v13.1a3.06 3.06 0 0 1-3.06 3.02 3.05 3.05 0 1 1 .9-5.97V8.8a6.42 6.42 0 0 0-.9-.06A6.35 6.35 0 1 0 15.4 15.1V8.7a8.6 8.6 0 0 0 5.02 1.6V7.03a5.3 5.3 0 0 1-3.82-1.21Z" />
    </svg>
  ),
  x: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.82l4.71 6.23 5.46-6.23Zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64Z" />
    </svg>
  ),
};

export default function SocialRail() {
  const [railRef, onLight] = useRailTheme();

  return (
    <div ref={railRef} className={`${styles.rail} ${onLight ? styles.light : ""}`}>
      {socialLinks.map((link) => (
        <a
          key={link.id}
          href={link.href}
          target="_blank"
          rel="noopener"
          title={link.label}
          className={styles.link}
          style={{ "--hover-bg": link.hoverBg }}
        >
          {ICONS[link.id]}
        </a>
      ))}
    </div>
  );
}
