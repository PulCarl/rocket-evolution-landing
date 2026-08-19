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

export default function App() {
  return (
    <div>
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
    </div>
  );
}
