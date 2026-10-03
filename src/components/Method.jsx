import Reveal from "./Reveal.jsx";
import { offers } from "../data/content.js";
import styles from "./Method.module.css";

export default function Method() {
  return (
    <section id="methode" data-bg="light" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.head}>
          <Reveal>
            <div className={styles.eyebrow}>Comment ça marche</div>
            <h2 className={styles.title}>
              Deux façons
              <br />
              de progresser
            </h2>
          </Reveal>
          <Reveal as="p" delay={90} className={styles.intro}>
            Tu rejoins le Discord, puis tu choisis : le coaching communautaire, gratuit et ouvert à tous les rangs,
            ou un suivi personnalisé.
          </Reveal>
        </div>
        <div className={styles.grid}>
          {offers.map((offer, i) => (
            <Reveal key={offer.id} delay={i * 90} className={styles.card} style={{ "--hover-color": offer.hoverColor }}>
              <div className={styles.tag}>{offer.tag}</div>
              <div className={`${styles.number} ${offer.textHeadline ? styles.numberText : ""}`}>{offer.headline}</div>
              <h3 className={styles.cardTitle}>{offer.title}</h3>
              <p className={styles.cardText}>{offer.text}</p>
              {offer.bullets && (
                <ul className={styles.bullets}>
                  {offer.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
              {offer.steps && (
                <ol className={styles.steps}>
                  {offer.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
