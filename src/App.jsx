import { Suspense, lazy } from "react";
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
import Videos from "./components/Videos.jsx";
import CtaBlock from "./components/CtaBlock.jsx";
import Footer from "./components/Footer.jsx";
import fennecBallBoost from "./assets/images/fennecballboost.webp";
import styles from "./App.module.css";

// three.js/@react-three/fiber/drei are heavy — code-split so every visitor
// isn't paying for them just to view the landing page, same as the hero's
// FennecCar3D.
const CircuitGame = lazy(() => import("./components/Circuit/CircuitGame.jsx"));

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
        <Suspense fallback={null}>
          <CircuitGame />
        </Suspense>
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
