// Breast Cancer Awareness Month (Octobre Rose) ribbon — shown in the nav
// during October only (see App.jsx).
export default function PinkRibbon({ className }) {
  return (
    <svg
      viewBox="0 0 100 130"
      width="18"
      height="23"
      className={className}
      role="img"
      aria-label="Ruban Octobre Rose"
    >
      <title>Soutien à Octobre Rose</title>
      <path
        fill="#f4a6c6"
        d="M50 2
           C68 2, 86 9, 84 20
           C82 30, 70 38, 60 48
           C68 62, 84 90, 98 122
           L74 106
           C66 92, 56 78, 50 68
           C44 78, 34 92, 26 106
           L2 122
           C16 90, 32 62, 40 48
           C30 38, 18 30, 16 20
           C14 9, 32 2, 50 2
           Z"
      />
    </svg>
  );
}
