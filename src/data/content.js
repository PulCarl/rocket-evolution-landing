// Contenu éditorial de la landing page.
// ⚠️ Éléments à valider avec le client avant mise en ligne — voir README du handoff :
// - les chiffres (+1 rang, 50+ replays, 4 500h, 500+ membres, depuis 2026) à reconfirmer
// - les témoignages sont dans testimonials.json — 3 vrais avis pris manuellement
//   depuis Discord (sync automatique en pause pour l'instant, voir sync-testimonials.mjs)

export const socialLinks = [
  { id: "discord", label: "Discord", href: "https://discord.gg/6dbDnF3JCy", hoverBg: "#FE980C" },
  { id: "youtube", label: "YouTube", href: "https://www.youtube.com/@RocketEvoRL", hoverBg: "#F4791C" },
  { id: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@homelubby", hoverBg: "#D8224E" },
  { id: "x", label: "X", href: "https://x.com/Coach_Hidari", hoverBg: "#FFFFFF" },
];

export const navLinks = [
  { label: "Méthode", href: "#methode" },
  { label: "Coachs", href: "#coachs" },
  { label: "Résultats", href: "#resultats" },
];

export const heroStats = [
  { value: "500+", label: "Membres", color: "var(--orange)" },
  { value: "2", label: "Coachs dédiés", color: "var(--orange-2)" },
  { value: "2026", label: "Depuis", color: "var(--pink)" },
];

export const marqueeItems = ["Replay review", "Sessions live", "Mécaniques", "Game sense", "Rotations", "Mental"];

export const steps = [
  {
    number: "01",
    title: "Tu rejoins le Discord",
    text: "Accès gratuit au serveur, aux salons par rang et aux annonces de sessions. Tu te présentes, tu dis ton rang, on te place.",
    hoverColor: "var(--orange)",
  },
  {
    number: "02",
    title: "Tu ouvres un ticket",
    text: "Sur le salon dédié, tu ouvres un ticket : ton rang, ton objectif, tes dispos. C'est le point de départ de ton suivi.",
    hoverColor: "var(--orange-2)",
  },
  {
    number: "03",
    title: "Le coach te fixe un rendez-vous",
    text: "Un coach reprend ton ticket et cale une session avec toi. Le jour J, vous bossez ensemble sur ton jeu, et c'est parti.",
    hoverColor: "var(--pink)",
  },
];

export const coaches = [
  {
    id: "hidari",
    name: "Coach Hidari",
    greeting: "Bonjour, je suis Coach Hidari.",
    bio: "J'aime Rocket League et surtout aider les joueurs à se développer. Mon objectif est d'aider chacun à comprendre le jeu, corriger ses erreurs et progresser efficacement grâce à une méthode adaptée à tous.",
    gradient: "linear-gradient(180deg, rgba(254,152,12,.09), rgba(255,255,255,.02))",
    blocks: [
      {
        label: "Palmarès",
        items: ["Une participation au Main Event RLCS", "Plusieurs qualifications en Day 3 RLCS"],
      },
      {
        label: "Expérience",
        items: ["Plus de 2 000 heures d'expérience en tant que coach sur Rocket League, notamment à haut niveau."],
      },
    ],
    link: { label: "@Coach_Hidari →", href: "https://x.com/Coach_Hidari" },
    photoPosition: "center 60%",
  },
  {
    id: "francky",
    name: "Coach Francky",
    greeting: "Bonjour, je suis Coach Francky.",
    bio: "À 31 ans, j'ai transformé ma passion pour Rocket League en expertise.",
    gradient: "linear-gradient(180deg, rgba(216,34,78,.12), rgba(255,255,255,.02))",
    blocks: [
      {
        label: "Spécialités",
        items: ["Coaching 2v2 et 3v3 jusqu'à SSL", "On décortique tout ensemble pour vous faire progresser"],
      },
      {
        label: "Expérience",
        items: ["Plus de 2 500 heures de coaching à son actif."],
      },
    ],
    link: { label: "@Francky_coaching →", href: "https://www.youtube.com/@Francky_coaching" },
  },
];

export const resultsStats = [
  {
    value: "+1",
    text: "rang gagné minimum, souvent un nouveau peak, pour chaque joueur suivi régulièrement",
    background: "var(--grad-card-1)",
    color: "#fff",
  },
  {
    value: "50+",
    text: "replays analysés depuis l'ouverture du serveur",
    background: "var(--grad-card-2)",
    color: "#fff",
  },
  {
    value: "4 500 h",
    text: "de coaching cumulées entre les deux coachs",
    background: "var(--ink)",
    color: "#fff",
  },
  {
    value: "0€",
    text: "pour entrer dans la communauté et assister aux reviews publiques",
    background: "transparent",
    color: "var(--pink)",
    outline: true,
  },
];

// Les dernières vidéos vivent dans videos.json (pas ici) : ce fichier est mis à
// jour automatiquement par .github/workflows/sync-videos.yml, qui interroge le
// flux RSS public de la chaîne toutes les 6h. Voir scripts/sync-videos.mjs.

// Les témoignages vivent dans testimonials.json (pas ici) : ce fichier est mis à
// jour automatiquement par .github/workflows/sync-testimonials.yml, qui récupère
// les avis approuvés (réaction ✅ d'un coach) depuis un salon Discord dédié.
// Voir scripts/sync-testimonials.mjs pour la logique et le format attendu.
