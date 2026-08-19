import { socialLinks } from "../data/content.js";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer data-bg="dark" className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <span className={styles.wordmark}>ROCKET EVOLUTION</span>
          <span className={styles.credit}>Hidari — Francky</span>
        </div>
        <div className={styles.links}>
          {socialLinks.map((link) => (
            <a key={link.id} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
