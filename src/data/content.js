// Contenu éditorial de la landing page.
// ⚠️ Éléments à valider avec le client avant mise en ligne — voir README du handoff :
// - les chiffres (+1 rang, 50+ replays, 4 500h, 500+ membres, depuis 2026) à reconfirmer
// - les témoignages sont dans testimonials.json — 3 vrais avis pris manuellement
//   depuis Discord (sync automatique en pause pour l'instant, voir sync-testimonials.mjs)

export const socialLinks = [
  { id: "discord", label: "Discord", href: "https://discord.gg/6dbDnF3JCy", hoverBg: "#FE980C" },
  { id: "youtube", label: "YouTube", href: "https://www.youtube.com/@RocketEvoRL", hoverBg: "#F4791C" },
  { id: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@rocketevolutionrl", hoverBg: "#D8224E" },
  { id: "twitch", label: "Twitch", href: "https://www.twitch.tv/okamylive", hoverBg: "#9146FF" },
  { id: "x", label: "X", href: "https://x.com/Coach_Hidari", hoverBg: "#FFFFFF" },
];

export const navLinks = [
  { label: "Méthode", href: "#methode" },
  { label: "Coachs", href: "#coachs" },
  { label: "Résultats", href: "#resultats" },
];

// Le premier stat (Membres) n'est plus ici : il vient de discordStats.json,
// mis à jour automatiquement par .github/workflows/sync-discord-stats.yml
// (API publique des invitations Discord, toutes les 6h). Voir Hero.jsx.
export const heroStats = [
  { value: "3", label: "Coachs dédiés", color: "var(--orange-2)" },
  { value: "2026", label: "Depuis", color: "var(--pink)" },
];

export const marqueeItems = ["Replay review", "Sessions live", "Mécaniques", "Game sense", "Rotations", "Mental"];

// Les deux façons de profiter du serveur Discord (d'après la vidéo de
// présentation) : le coaching communautaire gratuit, et le coaching 1 à 1
// payant avec un coach. `bullets` = liste simple, `steps` = parcours numéroté.
export const offers = [
  {
    id: "communautaire",
    tag: "Coaching communautaire",
    headline: "0€",
    title: "Gratuit, du Bronze au SSL",
    text: "Coach Francky anime le coaching communautaire directement sur le Discord. Tu rejoins, tu regardes, tu participes.",
    bullets: ["Reviews de replay en public", "Sessions live sur le Discord"],
    hoverColor: "var(--orange)",
  },
  {
    id: "un-a-un",
    tag: "Coaching payant",
    headline: "Suivi personnalisé",
    textHeadline: true,
    title: "Avec Hidari ou Okami",
    text: "Un coach rien que pour toi, de l'ouverture du ticket à la séance.",
    steps: ["Tu ouvres un ticket", "Ton coach fixe le rendez-vous", "Séance en vocal privé"],
    hoverColor: "var(--pink)",
  },
];

export const coaches = [
  {
    id: "hidari",
    name: "Coach Hidari",
    role: "Coaching 1 à 1",
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
    // Pas encore de photo ni de bio détaillée : la carte affiche une initiale
    // à la place de la photo et reste volontairement sobre (seule info connue :
    // coaching privé en 1 à 1, + sa chaîne Twitch). À compléter quand il y aura
    // une photo + une bio.
    id: "okami",
    name: "Coach Okami",
    role: "Coaching 1 à 1",
    initial: "O",
    bio: "Coaching privé en 1 à 1 sur le Discord : tu ouvres un ticket, ton coach fixe le rendez-vous et vous travaillez ton jeu en vocal privé.",
    gradient: "linear-gradient(180deg, rgba(244,121,28,.1), rgba(255,255,255,.02))",
    blocks: [
      {
        label: "Format",
        items: ["Coaching privé", "Séance en vocal privé"],
      },
    ],
    link: { label: "@okamylive →", href: "https://www.twitch.tv/okamylive" },
  },
  {
    id: "francky",
    name: "Coach Francky",
    role: "Coaching communautaire · gratuit",
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
    text: "de coaching cumulées par Hidari et Francky",
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
