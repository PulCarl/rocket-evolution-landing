import Reveal from "./Reveal.jsx";
import { steps } from "../data/content.js";
import fennecBallBoost from "../assets/images/fennecballboost.webp";
import styles from "./Method.module.css";

export default function Method() {
  return (
    <section id="methode" data-bg="light" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.head}>
          <Reveal>
            <div className={styles.eyebrow}>Comment ça marche</div>
            <h2 className={styles.title}>
              Trois étapes,
              <br />
              zéro blabla
            </h2>
          </Reveal>
          <Reveal as="p" delay={90} className={styles.intro}>
            Pas de programme figé. On regarde tes replays, on cible les deux erreurs qui te coûtent le plus de
            matchs, et on travaille dessus jusqu'à ce que ça rentre.
          </Reveal>
        </div>
        <div className={styles.grid}>
          {steps.map((step, i) => (
            <Reveal key={step.number} delay={i * 90} className={styles.card} style={{ "--hover-color": step.hoverColor }}>
              <div className={styles.number}>{step.number}</div>
              <h3 className={styles.cardTitle}>{step.title}</h3>
              <p className={styles.cardText}>{step.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
      <img src={fennecBallBoost} alt="" aria-hidden="true" className={styles.decor} />
    </section>
  );
}
