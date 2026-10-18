import { Suspense, lazy } from "react";
import Reveal from "./Reveal.jsx";
import CountUp from "./CountUp.jsx";
import LiveBanner from "./LiveBanner.jsx";
import HeroArcs from "./HeroArcs.jsx";
import { useMediaQuery } from "../hooks/useMediaQuery.js";
import { heroStats } from "../data/content.js";
import discordStats from "../data/discordStats.json";
import logo from "../assets/logo-rocket-evolution.svg";
import styles from "./Hero.module.css";

const FennecCar3D = lazy(() => import("./FennecCar3D.jsx"));

const allStats = [
  { value: String(discordStats.memberCount), label: "Membres Discord" },
  ...heroStats,
];

export default function Hero() {
  // Matches the .visual { display: none } breakpoint below — no point fetching
  // the ~1MB model + three.js chunk on a screen that will never show it.
  const showVisual = useMediaQuery("(min-width: 780px)");

  return (
    <section data-bg="light" className={styles.hero}>
      <HeroArcs />
      <div className={styles.grid}>
        <div className={styles.textCol}>
          <LiveBanner />
          <Reveal className="pill-tag">Coaching Rocket League · France</Reveal>
          <Reveal as="h1" delay={90} className={styles.title}>
            Coaching
            <br />
            <span className={styles.gradientText}>Rocket League</span>
            <br />
            communautaire
          </Reveal>
          {/* Même lockup que les miniatures YouTube : bandeau dégradé en pilule,
              logo dans un rond blanc à gauche. */}
          <Reveal delay={180} className={styles.slogan}>
            <span className={styles.sloganLogo}>
              <img src={logo} alt="" width="22" height="26" />
            </span>
            Monte en grade. Pas tout seul.
          </Reveal>
          <Reveal as="p" delay={270} className={styles.paragraph}>
            Rocket Evolution, c'est du coaching communautaire gratuit (reviews de replay en public, sessions live sur
            le Discord) et du coaching 1 à 1 avec nos coachs quand tu veux aller plus loin. Tous les rangs, du Bronze
            au SSL.
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
                <div className={styles.statValue}>
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
