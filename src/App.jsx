import { Analytics } from "@vercel/analytics/react";
import Preloader from "./components/Preloader.jsx";
import CustomCursor from "./components/CustomCursor.jsx";
import SocialRail from "./components/SocialRail.jsx";
import Nav from "./components/Nav.jsx";
import Hero from "./components/Hero.jsx";
import Marquee from "./components/Marquee.jsx";
import Method from "./components/Method.jsx";
import Coaches from "./components/Coaches.jsx";
import Results from "./components/Results.jsx";
import RocketRunner from "./components/Game/RocketRunner.jsx";
import Videos from "./components/Videos.jsx";
import CtaBlock from "./components/CtaBlock.jsx";
import Footer from "./components/Footer.jsx";
import fennecBallBoost from "./assets/images/fennecballboost.webp";
import styles from "./App.module.css";

export default function App() {
  return (
    <div className={styles.page}>
      <Preloader />
      <CustomCursor />
      <SocialRail />
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Method />
        <Coaches />
        <Results />
        <RocketRunner />
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
      <Analytics />
    </div>
  );
}
