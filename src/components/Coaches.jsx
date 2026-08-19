import Reveal from "./Reveal.jsx";
import { coaches } from "../data/content.js";
import styles from "./Coaches.module.css";

export default function Coaches() {
  return (
    <section id="coachs" data-bg="dark" className={styles.section}>
      <div className={styles.container}>
        <Reveal>
          <div className={styles.eyebrow}>Les coachs</div>
        </Reveal>
        <Reveal as="h2" delay={90} className={styles.title}>
          Hidari &amp; Francky
        </Reveal>
        <div className={styles.grid}>
          {coaches.map((coach, i) => (
            <Reveal
              key={coach.id}
              delay={i * 90}
              className={styles.card}
              style={{ background: coach.gradient }}
            >
              <div className={styles.photo} aria-hidden="true">
                <span>Photo / avatar {coach.name}</span>
              </div>
              <div className={styles.body}>
                <h3 className={styles.name}>{coach.name}</h3>
                <p className={styles.greeting}>{coach.greeting}</p>
                <p className={styles.bio}>{coach.bio}</p>
                <div className={styles.blocks}>
                  {coach.blocks.map((block) => (
                    <div key={block.label}>
                      <div className={styles.blockLabel}>{block.label}</div>
                      <div className={styles.blockItems}>
                        {block.items.map((item) => (
                          <div key={item}>{item}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <a href={coach.link.href} className={styles.link}>
                  {coach.link.label}
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
