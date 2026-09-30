// Breast Cancer Awareness Month (Octobre Rose) ribbon — shown in the nav
// during October only (see App.jsx).
export default function PinkRibbon({ className }) {
  return (
    <svg
      viewBox="0 0 32 40"
      width="18"
      height="22"
      className={className}
      role="img"
      aria-label="Ruban Octobre Rose"
    >
      <title>Soutien à Octobre Rose</title>
      <path
        fillRule="evenodd"
        fill="#f4a6c6"
        d="M16 2
           C9 2, 3 7, 5 13
           C6 16, 9 17, 12 18
           L4 38 L9 34 L15 20 L17 20 L23 34 L28 38 L20 18
           C23 17, 26 16, 27 13
           C29 7, 23 2, 16 2
           Z
           M16 6
           C12 6, 9 9, 10 13
           C10.5 15, 13 16.5, 16 17
           C19 16.5, 21.5 15, 22 13
           C23 9, 20 6, 16 6
           Z"
      />
    </svg>
  );
}
