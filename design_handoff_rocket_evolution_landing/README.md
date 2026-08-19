# Handoff : Landing page Rocket Evolution

## Overview
Landing page marketing pour **Rocket Evolution**, structure de coaching Rocket League communautaire animée par Coach Hidari et Coach Francky. Objectif principal : faire rejoindre le serveur Discord ; objectif secondaire : envoyer vers la chaîne YouTube. Une seule page, scroll vertical, française, desktop + mobile.

## About the Design Files
Les fichiers de ce bundle sont des **références de design réalisées en HTML** : un prototype qui montre l'apparence et le comportement attendus, **pas du code de production à copier tel quel**. La tâche est de **recréer ces écrans dans l'environnement du projet cible** (Next.js/React, Astro, Vue, WordPress…) en suivant ses patterns et sa librairie de composants. Si aucun environnement n'existe encore, choisir le framework le plus adapté (une page statique : Astro ou Next.js static export conviennent très bien) et y implémenter le design.

Le prototype utilise un runtime interne (`support.js`, balises `<x-dc>`, `<sc-if>`) : **à ne pas reproduire**. Seuls comptent le markup, les styles inline et la logique JS décrite plus bas.

## Fidelity
**High-fidelity.** Couleurs, typographies, espacements et interactions sont définitifs. À reproduire au pixel près, en réutilisant la librairie du codebase cible pour les primitives (boutons, liens).

## Screens / Views

### Page unique — sections dans l'ordre

**0. Barre sociale fixe (globale)**
- `position: fixed`, droite 18px, centrée verticalement (`top:50%; translateY(-50%)`), `z-index:60`.
- Pilule verticale : `flex-direction:column`, gap 10px, padding 12px 8px, `border-radius:999px`, fond `rgba(255,255,255,.06)`, bordure 1px `rgba(255,255,255,.14)`, `backdrop-filter: blur(12px)`.
- 4 liens icône 38×38px, cercle : Discord → https://discord.gg/6dbDnF3JCy · YouTube → https://www.youtube.com/@RocketEvoRL · TikTok → https://www.tiktok.com/@homelubby · X → https://x.com/Coach_Hidari
- Couleur icône `rgba(255,255,255,.8)`. Hover : fond plein (Discord #FE980C, YouTube #F4791C, TikTok #D8224E, X #FFFFFF) et icône #1D1D1D.
- **Adaptatif au fond** : quand le centre de la barre se trouve devant une section à fond blanc, elle bascule en version claire — fond `rgba(29,29,29,.05)`, bordure `rgba(29,29,29,.14)`, icônes `rgba(29,29,29,.72)` — transition 300ms.
- **< 900px** : la barre passe en horizontal, centrée en bas (`bottom:14px; left:50%`).

**1. Nav flottante (fixed)**
- `position:fixed; top:18px`, centrée, largeur `min(1160px, 100% - 36px)`, `border-radius:999px`, fond `rgba(29,29,29,.62)`, `backdrop-filter: blur(18px) saturate(140%)`, bordure `rgba(255,255,255,.14)`, ombre `0 18px 44px rgba(0,0,0,.38)`, padding `10px 12px 10px 20px`.
- Gauche : logo SVG 28×33 + wordmark « ROCKET EVOLUTION » (Poppins 800, 16px, letter-spacing -.02em).
- Droite : liens Méthode / Coachs / Résultats (Azeret Mono 12px, uppercase, letter-spacing .08em, `rgba(255,255,255,.72)`, hover fond `rgba(255,255,255,.09)`, pilule padding 10px 16px) + CTA « Rejoindre le Discord » (dégradé `linear-gradient(90deg,#FE980C,#D8224E)`, texte blanc Poppins 700).
- **Au scroll > 40px** : largeur `min(980px, 100% - 36px)`, top 12px, fond `rgba(29,29,29,.82)`, ombre `0 14px 40px rgba(0,0,0,.5)` — transition 350ms `cubic-bezier(.2,.7,.3,1)`.
- **< 780px** : les 3 liens d'ancre sont masqués, seul le CTA reste. **< 380px** : le wordmark est masqué.

**2. Hero** — fond #1D1D1D, padding `150px 20px 80px`, deux halos radiaux décoratifs (rose `rgba(216,34,78,.38)` en haut à droite, orange `rgba(254,152,12,.28)` en bas à gauche, 620–640px, `border-radius:50%`).
- Grille `repeat(auto-fit, minmax(300px,1fr))`, gap 48px, max-width 1200px.
- Badge pilule : bordure `rgba(254,152,12,.5)`, texte #FE980C 11px uppercase letter-spacing .16em, « Coaching Rocket League · France », précédé d'un losange 9×9 (rotate 45°) en dégradé avec glow `0 0 14px rgba(254,152,12,.9)`.
- H1 : Poppins 800, `clamp(44px,6vw,84px)`, line-height .94, letter-spacing -.035em, uppercase — « Coaching **Rocket League** communautaire », « Rocket League » en dégradé `linear-gradient(90deg,#FE980C,#F4791C 45%,#D8224E)` clippé sur le texte.
- Slogan : Poppins 700, `clamp(18px,2vw,24px)`, uppercase, `rgba(255,255,255,.9)` — « Monte en grade. Pas tout seul. »
- Paragraphe : Azeret Mono 16px/1.7, `rgba(255,255,255,.66)`, max-width 520px.
- 2 boutons : primaire dégradé « Rejoindre la communauté → » (padding 16px 30px, radius 999px) ; secondaire outline `rgba(255,255,255,.24)` « Voir la chaîne YouTube » (hover bordure + texte #FE980C).
- Stats (3 colonnes, séparateur haut `rgba(255,255,255,.12)`) : **500+** Membres (#FE980C) · **2** Coachs dédiés (#F4791C) · **2026** Depuis (#D8224E). Chiffres Poppins 800 32px ; libellés 11px uppercase `rgba(255,255,255,.5)`.
- Colonne droite : logo Rocket Evolution en SVG, `width:min(360px,80%)`, ombre portée `0 30px 60px rgba(216,34,78,.35)`, animation flottante `reFloat` 6s (translateY 0 → -18px, rotate -4deg). **Masquée < 780px.**

**3. Bandeau défilant** — fond `linear-gradient(90deg,#FE980C,#F4791C 50%,#D8224E)`, padding 14px 0, overflow hidden. Contenu répété 4× (Poppins 800 15px uppercase letter-spacing .14em, blanc, gap 44px) : Replay review · Sessions live · Mécaniques · Game sense · Rotations · Mental. Animation `translateX(0 → -50%)` linéaire 26s en boucle. Le contenu doit être dupliqué assez pour dépasser la largeur d'écran (sinon un trou apparaît).

**4. « Comment ça marche »** — `id="methode"`, fond #FFFFFF, texte #1D1D1D, padding `clamp(56px,8vw,96px) 20px`, `position:relative; z-index:2`, `scroll-margin-top:110px`.
- En-tête flex : eyebrow « COMMENT ÇA MARCHE » (#D8224E, 11px, letter-spacing .18em) + H2 Poppins 800 `clamp(32px,4.2vw,54px)` uppercase « Trois étapes, zéro blabla » ; à droite paragraphe 14px/1.7 `rgba(29,29,29,.62)`, max-width 380px.
- 3 cartes `repeat(auto-fit,minmax(280px,1fr))`, gap 24px, bordure `rgba(29,29,29,.12)`, radius 22px, padding `34px 30px 30px`. Hover : bordure #FE980C / #F4791C / #D8224E.
  - Numéro Poppins 800 46px en dégradé clippé.
  - **01 Tu rejoins le Discord** — « Accès gratuit au serveur, aux salons par rang et aux annonces de sessions. Tu te présentes, tu dis ton rang, on te place. »
  - **02 Tu ouvres un ticket** — « Sur le salon dédié, tu ouvres un ticket : ton rang, ton objectif, tes dispos. C'est le point de départ de ton suivi. »
  - **03 Le coach te fixe un rendez-vous** — « Un coach reprend ton ticket et cale une session avec toi. Le jour J, vous bossez ensemble sur ton jeu, et c'est parti. »
- **Élément décoratif** : render `fennecballboost.png` en `position:absolute`, à cheval sur la frontière entre cette section blanche et la section noire suivante (côté gauche), rotate -10deg, ombre `0 30px 60px rgba(0,0,0,.45)`, `pointer-events:none`, `z-index:3`. **Masqué < 900px.** Taille/position exactes : voir le fichier HTML (ajustées à la main).

**5. « Les coachs »** — `id="coachs"`, fond #1D1D1D, padding `clamp(56px,8vw,96px) 20px`.
- Eyebrow « LES COACHS » (#FE980C), H2 « Hidari & Francky ».
- 2 cartes `repeat(auto-fit,minmax(320px,1fr))`, radius 24px, bordure `rgba(255,255,255,.12)`, fond dégradé vertical : Hidari `rgba(254,152,12,.09) → rgba(255,255,255,.02)`, Francky `rgba(216,34,78,.12) → rgba(255,255,255,.02)`.
- Chaque carte : zone image 260px de haut (placeholder à remplir par le client), puis padding `28px 30px 30px`, titre Poppins 800 26px uppercase.
- **Coach Hidari** : « Bonjour, je suis Coach Hidari. » / « J'aime Rocket League et surtout aider les joueurs à se développer. Mon objectif est d'aider chacun à comprendre le jeu, corriger ses erreurs et progresser efficacement grâce à une méthode adaptée à tous. » — Palmarès : « Une participation au Main Event RLCS », « Plusieurs qualifications en Day 3 RLCS ». Expérience : « Plus de 2 000 heures d'expérience en tant que coach sur Rocket League, notamment à haut niveau. » Lien : @Coach_Hidari → https://x.com/Coach_Hidari
- **Coach Francky** : « Bonjour, je suis Coach Francky. » / « À 31 ans, j'ai transformé ma passion pour Rocket League en expertise. » — Spécialités : « Coaching 2v2 et 3v3 jusqu'à SSL », « On décortique tout ensemble pour vous faire progresser ». Expérience : « Plus de 2 500 heures de coaching à son actif. » Lien : @Francky_coaching → https://www.tiktok.com/@homelubby *(URL à confirmer avec le client)*
- Intitulés de sous-blocs : 11px uppercase letter-spacing .14em, **#FE980C** dans les deux cartes ; séparateur haut `rgba(255,255,255,.12)`.

**6. « Résultats »** — `id="resultats"`, fond #FFFFFF, texte #1D1D1D.
- Eyebrow « RÉSULTATS » (#D8224E), H2 « Ce que ça donne sur le ladder ».
- 4 cartes `repeat(auto-fit,minmax(220px,1fr))`, radius 20px, padding 30px, chiffre Poppins 800 44px :
  1. **+1** — « rang gagné minimum, souvent un nouveau peak, pour chaque joueur suivi régulièrement » — fond `linear-gradient(135deg,#FE980C,#F4791C)`, texte blanc.
  2. **50+** — « replays analysés depuis l'ouverture du serveur » — fond `linear-gradient(135deg,#F4791C,#D8224E)`.
  3. **4 500 h** — « de coaching cumulées entre les deux coachs » — fond #1D1D1D, texte blanc.
  4. **0€** — « pour entrer dans la communauté et assister aux reviews publiques » — carte outline `rgba(29,29,29,.14)`, chiffre #D8224E.
- Témoignages : 3 blocs `repeat(auto-fit,minmax(280px,1fr))`, barre gauche 3px (#FE980C / #F4791C / #D8224E), citation 15px/1.75, attribution 12px uppercase `rgba(29,29,29,.5)`.
  ⚠️ **Les 3 témoignages actuels sont des exemples fictifs** (Nyko, Lisa, Team Nova) : à remplacer par de vrais retours avant mise en ligne.

**7. « Les dernières vidéos »** — fond #1D1D1D. Titre Poppins 800 `clamp(28px,3.4vw,44px)` + lien « Tout voir sur YouTube → ». 3 vignettes `aspect-ratio:16/9`, radius 16px, bordure `rgba(255,255,255,.12)`. Dans le prototype ce sont des emplacements vides — **en production, brancher l'API YouTube Data v3 (ou un flux RSS mis en cache côté serveur) sur la chaîne `UCBiuzf9xGJXJflCjHWUwqZg`** pour afficher les 3 dernières vidéos (miniature `https://i.ytimg.com/vi/<id>/maxresdefault.jpg`, titre optionnel, lien vers la vidéo).

**8. CTA Discord** — bloc pleine largeur (max 1200px), radius 32px, padding `clamp(48px,7vw,88px) clamp(32px,6vw,72px)`, fond `linear-gradient(120deg,#FE980C,#F4791C 45%,#D8224E)`, cercle décoratif `rgba(255,255,255,.12)` en bas à droite.
- H2 « Le serveur est ouvert » Poppins 800 `clamp(34px,5vw,62px)`, paragraphe blanc `rgba(255,255,255,.9)`, boutons « Rejoindre le Discord » (fond #1D1D1D) et « YouTube » (outline blanc, hover fond blanc/texte #1D1D1D).
- Render `fennec1.png` en absolu à droite, rotate -8deg, `pointer-events:none`. **Masqué < 900px.**

**9. Footer** — bordure haute `rgba(255,255,255,.1)`, padding `40px 20px`. Gauche : « ROCKET EVOLUTION » + « Hidari — Francky » (11px uppercase `rgba(255,255,255,.4)`). Droite : Discord / YouTube / TikTok / X.

## Interactions & Behavior
- **Scroll reveal** : chaque bloc de contenu (titres de section, cartes de grille) démarre à `opacity:0; translateY(26px)` et s'anime vers `opacity:1; translateY(0)` en 450ms `cubic-bezier(.2,.7,.3,1)` quand il entre dans le viewport (IntersectionObserver, `rootMargin: 0px 0px -12% 0px`, threshold .08). Décalage en cascade de 90ms par élément d'une même grille, plafonné à 360ms. Les éléments déjà visibles au chargement sont révélés immédiatement ; un filet de sécurité sur scroll/resize révèle tout bloc resté caché.
- **Hover cartes** (radius 20/22/24px) : `translateY(-6px)` + ombre `0 22px 48px rgba(0,0,0,.28)`.
- **Hover boutons pilule** : `translateY(-2px) scale(1.02)`.
- **Nav** : rétrécit au scroll (voir section 1). Ancres avec `scroll-behavior:smooth` et `scroll-margin-top:110px` sur les sections ciblées.
- **Barre sociale** : inversion de thème selon le fond (voir section 0).
- **Accessibilité** : toutes les animations sont désactivées si `prefers-reduced-motion: reduce`.

## State Management
Aucun état applicatif. Uniquement de l'état de vue local :
- `scrolled` (booléen, seuil 40px) → style de la nav.
- `onLightSection` (booléen) → thème de la barre sociale.
- `viewportWidth` (breakpoints 380 / 780 / 900) → masquage nav/logo/voitures, orientation de la barre sociale.
- `revealed` par élément → animation d'entrée.
Le prototype expose 3 flags de contenu (`showStats`, `showTestimonials`, `showVideos`) qui affichent/masquent les sections correspondantes : en production ce sont soit des props, soit du contenu CMS.

## Design Tokens
**Couleurs**
- Encre / fond sombre : `#1D1D1D`
- Fond clair : `#FFFFFF`
- Orange primaire : `#FE980C`
- Orange secondaire : `#F4791C`
- Rose / rouge : `#D8224E`
- Dégradé de marque (horizontal) : `linear-gradient(90deg,#FE980C,#F4791C 45%,#D8224E)`
- Dégradé cartes (diagonal) : `linear-gradient(135deg,#FE980C,#F4791C)` / `linear-gradient(135deg,#F4791C,#D8224E)`
- Texte secondaire sur fond sombre : `rgba(255,255,255,.66)` · sur fond clair : `rgba(29,29,29,.62)`
- Bordures : `rgba(255,255,255,.12)` (sombre) / `rgba(29,29,29,.12)` (clair)

**Typographie**
- Titres : **Poppins** 700/800 (substitut de la police de marque **BBH Hegarty** — si la licence est disponible, la remplacer partout dans les titres). Uppercase, letter-spacing -.01 à -.035em.
- Texte courant, labels, nav : **Azeret Mono** 300/400/500/700.
- Échelle : H1 `clamp(44px,6vw,84px)` · H2 `clamp(32px,4.2vw,54px)` · H3 20–26px · corps 14–16px · labels 11–12px uppercase letter-spacing .08–.18em.

**Espacement** : padding de section `clamp(56px,8vw,96px)` vertical / 20px horizontal ; gouttières de grille 20–24px ; conteneur max-width 1200px.

**Rayons** : 999px (pilules) · 32px (bloc CTA) · 24px (cartes coachs) · 22px (cartes étapes) · 20px (cartes stats) · 16px (vignettes vidéo).

**Ombres** : `0 18px 44px rgba(0,0,0,.38)` (nav) · `0 22px 48px rgba(0,0,0,.28)` (hover carte) · `0 30px 60px rgba(216,34,78,.35)` (logo hero).

## Assets
Fournis dans `assets/` :
- `logo-rocket-evolution.svg` — logo vectoriel (dégradé #FE990B → #CE0160). Utilisé dans la nav (aplats de couleur) et dans le hero (dégradés).
- `fennecballboost.png` — render Fennec + balle, décor à la frontière méthode/coachs.
- `fennec1.png` — render Fennec, décor du bloc CTA.
- Photos des coachs : **manquantes**, à fournir par le client (emplacements 260px de haut dans les cartes).
- Miniatures YouTube : à récupérer dynamiquement (voir section 7).
- Polices : Poppins et Azeret Mono via Google Fonts (`https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,600;0,700;0,800;1,800&family=Azeret+Mono:wght@300;400;500;700&display=swap`).

## Files
- `Rocket Evolution Landing.dc.html` — le prototype complet (markup + styles inline + logique JS dans la classe `Component` en bas de fichier : `setupResponsive`, `setupRailTheme`, `setupMotion`).
- `image-slot.js`, `support.js` — runtime du prototype, **à ignorer** lors du portage.
- `assets/` — logo et renders.

## Notes de contenu à valider avec le client
1. Les 3 témoignages sont fictifs.
2. Les chiffres « +1 rang », « 50+ replays », « 4 500 h », « 500+ membres », « depuis 2026 » ont été validés en conversation mais méritent une relecture avant publication.
3. Le lien @Francky_coaching pointe actuellement vers le TikTok @homelubby.
4. Mentions légales / politique de confidentialité absentes : à ajouter au footer si la page collecte des données.
