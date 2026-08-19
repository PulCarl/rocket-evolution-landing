import Reveal from "./Reveal.jsx";
import styles from "./Videos.module.css";

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
          {[1, 2, 3].map((i) => (
            <Reveal key={i} delay={i * 90} className={styles.thumb}>
              <span>Miniature YouTube {i}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
