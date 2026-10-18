import styles from "./Hero.module.css";

// Grandes courbes orange→rouge de la charte (bannières YouTube/X) : deux
// bandes qui balayent le côté droit, derrière la voiture, pendant que la
// colonne de texte reste sur fond clair et lisible.
export default function HeroArcs() {
  return (
    <svg
      className={styles.arcs}
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMaxYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="arcMain" gradientUnits="userSpaceOnUse" x1="1100" y1="-40" x2="1500" y2="900">
          <stop offset="0" stopColor="#fe980c" />
          <stop offset="0.55" stopColor="#f4791c" />
          <stop offset="1" stopColor="#d8224e" />
        </linearGradient>
        <linearGradient id="arcThin" gradientUnits="userSpaceOnUse" x1="900" y1="0" x2="1300" y2="900">
          <stop offset="0" stopColor="#fe980c" />
          <stop offset="1" stopColor="#d8224e" />
        </linearGradient>
      </defs>
      <circle cx="1800" cy="380" r="860" fill="none" stroke="url(#arcThin)" strokeWidth="34" opacity="0.5" />
      <circle cx="1800" cy="380" r="640" fill="none" stroke="url(#arcMain)" strokeWidth="210" />
    </svg>
  );
}
