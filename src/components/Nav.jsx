import { useScrolled } from "../hooks/useScrolled.js";
import { navLinks } from "../data/content.js";
import logo from "../assets/logo-rocket-evolution.svg";
import PinkRibbon from "./PinkRibbon.jsx";
import styles from "./Nav.module.css";

// Octobre Rose (Breast Cancer Awareness Month) runs the whole month of
// October — the ribbon shows itself during it and disappears on its own
// after, no manual cleanup needed come November.
const isPinkOctober = new Date().getMonth() === 9;

export default function Nav() {
  const scrolled = useScrolled(40);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.brand}>
        <img src={logo} width="28" height="33" alt="" className={styles.logo} />
        <span className={styles.wordmark}>ROCKET EVOLUTION</span>
        {isPinkOctober && <PinkRibbon className={styles.ribbon} />}
      </div>
      <nav className={styles.nav}>
        {navLinks.map((link) => (
          <a key={link.href} href={link.href} className={styles.navLink}>
            {link.label}
          </a>
        ))}
        <a href="https://discord.gg/6dbDnF3JCy" className={styles.cta}>
          Rejoindre le Discord
        </a>
      </nav>
    </header>
  );
}
