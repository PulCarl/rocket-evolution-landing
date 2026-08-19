import Reveal from "./Reveal.jsx";
import { resultsStats, testimonials } from "../data/content.js";
import styles from "./Results.module.css";

export default function Results() {
  return (
    <section id="resultats" data-bg="light" className={styles.section}>
      <div className={styles.container}>
        <Reveal>
          <div className={styles.eyebrow}>Résultats</div>
        </Reveal>
        <Reveal as="h2" delay={90} className={styles.title}>
          Ce que ça donne
          <br />
          sur le ladder
        </Reveal>
        <div className={styles.statsGrid}>
          {resultsStats.map((stat, i) => (
            <Reveal
              key={stat.value}
              delay={i * 90}
              className={`${styles.statCard} ${stat.outline ? styles.statCardOutline : ""}`}
              style={{ background: stat.background, color: stat.color }}
            >
              <div className={styles.statValue} style={stat.outline ? { color: stat.color } : undefined}>
                {stat.value}
              </div>
              <div className={styles.statText}>{stat.text}</div>
            </Reveal>
          ))}
        </div>
        <div className={styles.testimonials}>
          {testimonials.map((testimonial, i) => (
            <Reveal
              key={testimonial.author}
              delay={i * 90}
              className={styles.testimonial}
              style={{ borderLeftColor: testimonial.barColor }}
            >
              <p className={styles.quote}>{testimonial.quote}</p>
              <div className={styles.author}>{testimonial.author}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
