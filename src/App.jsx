import SocialRail from "./components/SocialRail.jsx";
import Nav from "./components/Nav.jsx";
import Hero from "./components/Hero.jsx";
import Marquee from "./components/Marquee.jsx";
import Method from "./components/Method.jsx";
import Coaches from "./components/Coaches.jsx";
import Results from "./components/Results.jsx";
import Videos from "./components/Videos.jsx";
import CtaBlock from "./components/CtaBlock.jsx";
import Footer from "./components/Footer.jsx";
import fennecBallBoost from "./assets/images/fennecballboost.webp";
import styles from "./App.module.css";

export default function App() {
  return (
    <div className={styles.page}>
      <SocialRail />
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Method />
        <Coaches />
        <Results />
        <Videos />
        <CtaBlock />
      </main>
      <Footer />
      <img
        src={fennecBallBoost}
        alt="Fennec Rocket Evolution frappant la balle"
        aria-hidden="true"
        className={styles.decorBallBoost}
      />
    </div>
  );
}
