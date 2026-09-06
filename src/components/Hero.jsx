import { Suspense, lazy } from "react";
import Reveal from "./Reveal.jsx";
import CountUp from "./CountUp.jsx";
import { useMediaQuery } from "../hooks/useMediaQuery.js";
import { heroStats } from "../data/content.js";
import discordStats from "../data/discordStats.json";
import styles from "./Hero.module.css";

const FennecCar3D = lazy(() => import("./FennecCar3D.jsx"));

const allStats = [
  { value: String(discordStats.memberCount), label: "Membres Discord", color: "var(--orange)" },
  ...heroStats,
];

export default function Hero() {
  // Matches the .visual { display: none } breakpoint below — no point fetching
  // the ~1MB model + three.js chunk on a screen that will never show it.
  const showVisual = useMediaQuery("(min-width: 780px)");

  return (
    <section className={styles.hero}>
      <div className={styles.haloPink} aria-hidden="true" />
      <div className={styles.haloOrange} aria-hidden="true" />
      <div className={styles.grid}>
        <div className={styles.textCol}>
          <Reveal className={styles.badge}>
            <span className={styles.badgeDot} />
            Coaching Rocket League · France
          </Reveal>
          <Reveal as="h1" delay={90} className={styles.title}>
            Coaching <span className={styles.gradientText}>Rocket League</span>
            <br />
            communautaire
          </Reveal>
          <Reveal delay={180} className={styles.slogan}>
            Monte en grade. Pas tout seul.
          </Reveal>
          <Reveal as="p" delay={270} className={styles.paragraph}>
            Rocket Evolution, c'est du coaching communautaire : des reviews de replay, des sessions live et une
            communauté de joueurs qui progressent ensemble. Tous les rangs, du Bronze au SSL, on t'aide à débloquer
            ta progression.
          </Reveal>
          <Reveal delay={360} className={styles.buttons}>
            <a href="https://discord.gg/6dbDnF3JCy" className={styles.primaryButton}>
              Rejoindre la communauté →
            </a>
            <a href="https://www.youtube.com/@RocketEvoRL" className={styles.secondaryButton}>
              Voir la chaîne YouTube
            </a>
          </Reveal>
          <Reveal delay={360} className={styles.stats}>
            {allStats.map((stat) => (
              <div key={stat.label}>
                <div className={styles.statValue} style={{ color: stat.color }}>
                  <CountUp value={stat.value} />
                </div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </Reveal>
        </div>
        <div className={styles.visual}>
          {showVisual && (
            <Suspense fallback={null}>
              <FennecCar3D />
            </Suspense>
          )}
        </div>
      </div>
    </section>
  );
}
