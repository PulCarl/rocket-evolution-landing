import { useScrolled } from "../hooks/useScrolled.js";
import { navLinks } from "../data/content.js";
import logo from "../assets/logo-rocket-evolution.svg";
import styles from "./Nav.module.css";

export default function Nav() {
  const scrolled = useScrolled(40);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.brand}>
        <img src={logo} width="28" height="33" alt="" className={styles.logo} />
        <span className={styles.wordmark}>ROCKET EVOLUTION</span>
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
