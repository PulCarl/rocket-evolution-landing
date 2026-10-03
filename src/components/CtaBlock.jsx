import Reveal from "./Reveal.jsx";
import fennec1 from "../assets/images/fennec1.webp";
import styles from "./CtaBlock.module.css";

export default function CtaBlock() {
  return (
    <section data-bg="dark" className={styles.section}>
      <div className={styles.panel}>
        <div className={styles.circle} aria-hidden="true" />
        <img src={fennec1} alt="" aria-hidden="true" className={styles.decor} />
        <div className={styles.content}>
          <Reveal as="h2" className={styles.title}>
            Le serveur est ouvert
          </Reveal>
          <Reveal as="p" delay={90} className={styles.paragraph}>
            Coaching communautaire gratuit du Bronze au SSL : reviews de replay en public et sessions live. Envie d'un
            suivi perso ? Ouvre un ticket pour un coaching 1 à 1.
          </Reveal>
          <Reveal delay={180} className={styles.buttons}>
            <a href="https://discord.gg/6dbDnF3JCy" className={styles.primaryButton}>
              Rejoindre le Discord
            </a>
            <a href="https://www.youtube.com/@RocketEvoRL" className={styles.secondaryButton}>
              YouTube
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
