import octobreRose from "../assets/octobre-rose.svg";

// Breast Cancer Awareness Month (Octobre Rose) ribbon — shown in the nav
// during October only (see Nav.jsx). Real asset provided by the user.
export default function PinkRibbon({ className }) {
  return <img src={octobreRose} width="13" height="22" alt="Ruban Octobre Rose" className={className} />;
}
