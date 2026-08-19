import Reveal from "./Reveal.jsx";
import { heroStats } from "../data/content.js";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.haloPink} aria-hidden="true" />
      <div className={styles.haloOrange} aria-hidden="true" />
      <div className={styles.grid}>
        <div>
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
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <div className={styles.statValue} style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </Reveal>
        </div>
        <div className={styles.visual}>
          <svg viewBox="0 0 321 373" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.logoSvg}>
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M289.625 305.816C243.229 393.583 29.6433 330.028 65.6719 240.237C97.1608 161.761 190.703 94.0074 192.309 94.7C195.159 95.9295 187.275 114.833 192.208 116.124C202.094 118.712 213.217 113.278 205.746 120.395C172.588 151.985 91.1214 288.91 146.915 313.716C195.594 335.359 293.985 299.933 250.588 247.464C232.545 225.649 201.705 219.209 212.387 218.802C212.45 218.8 251.107 230.239 272.218 248.754C301.185 274.157 291.262 301.333 289.625 305.816Z"
              fill="url(#reg0)"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M227.971 361.204C73.5946 409.473 -68.0653 299.087 35.2934 220.194C48.35 210.228 75.6529 197.391 67.0813 207.397C48.4572 229.139 46.1186 251.577 45.6798 255.787C38.2235 327.328 171.199 379.516 251.006 349.13C251.25 349.038 261.517 347.357 252.777 351.873C248.334 354.168 229.975 360.512 227.971 361.204L227.971 361.204Z"
              fill="url(#reg1)"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M253.506 129.798C253.111 130.27 249.027 136.319 247.244 132.534C237.174 111.164 237.338 104.732 226.525 108.271C215.269 111.954 197.393 112.46 196.568 111.499C195.594 110.364 197.183 110.316 198.691 92.9279C199.787 80.2846 211.773 73.3612 192.551 63.9008C181.435 58.4298 180.788 56.5699 182.881 54.8966C197.53 43.1919 198.029 43.29 216.549 40.9125C218.976 40.6009 228.091 40.8841 229.294 39.752C240.323 29.3716 265.475 -1.77687 316.632 0.0795525C325.58 0.404175 316.966 35.0026 303.151 53.848C284.694 79.0273 271.676 83.6219 270.936 88.5954C270.61 90.7895 267.949 108.675 265.158 115.716C264.547 117.257 264.379 117.072 253.506 129.798Z"
              fill="url(#reg2)"
            />
            <ellipse cx="279.656" cy="37.1113" rx="9.81248" ry="9.43508" fill="white" />
            <ellipse cx="260.685" cy="53.4654" rx="7.19582" ry="6.91906" fill="white" />
            <defs>
              <linearGradient id="reg0" x1="61.6" y1="94.7" x2="371.5" y2="138.9" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FE990B" />
                <stop offset="1" stopColor="#CE0160" />
              </linearGradient>
              <linearGradient id="reg1" x1="0" y1="203.8" x2="332.2" y2="282.4" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FE990B" />
                <stop offset="1" stopColor="#CE0160" />
              </linearGradient>
              <linearGradient id="reg2" x1="181.9" y1="0" x2="633.2" y2="78.3" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FE990B" />
                <stop offset="1" stopColor="#CE0160" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </section>
  );
}
