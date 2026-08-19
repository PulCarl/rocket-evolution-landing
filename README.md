# Rocket Evolution — Landing page

Landing page marketing pour Rocket Evolution (coaching Rocket League communautaire, Coach Hidari & Coach Francky). React + Vite, prête pour un déploiement statique sur Vercel.

Le design d'origine (référence pixel-perfect) se trouve dans [`design_handoff_rocket_evolution_landing/`](./design_handoff_rocket_evolution_landing) — ce dossier n'est pas utilisé par le build, il sert uniquement de référence.

## Stack

- [Vite](https://vite.dev) + React 19
- CSS Modules (pas de framework CSS) — tokens de design dans [`src/index.css`](./src/index.css)
- Aucune dépendance backend : contenu statique dans [`src/data/content.js`](./src/data/content.js)

## Démarrer en local

```bash
npm install
npm run dev
```

Ouvre http://localhost:5173.

## Build de production

```bash
npm run build
npm run preview   # pour tester le build localement
```

## Déploiement Vercel

1. Pousser ce dépôt sur GitHub (ou GitLab/Bitbucket).
2. Sur [vercel.com](https://vercel.com), "Add New Project" → importer le repo.
3. Vercel détecte automatiquement Vite (`npm run build`, dossier de sortie `dist`) — aucune configuration supplémentaire n'est nécessaire.

Ou via la CLI :

```bash
npm i -g vercel
vercel        # preview
vercel --prod # production
```

## À faire avant mise en ligne (voir README du handoff design)

- Remplacer les 3 témoignages fictifs (Nyko, Lisa, Team Nova) par de vrais retours — [`src/data/content.js`](./src/data/content.js).
- Reconfirmer les chiffres (+1 rang, 50+ replays, 4 500h, 500+ membres, depuis 2026).
- Fournir les photos des coachs (emplacements actuellement en placeholder dans `Coaches.jsx`).
- Brancher l'API YouTube Data v3 (ou un flux RSS côté serveur) sur la chaîne `UCBiuzf9xGJXJflCjHWUwqZg` pour afficher les 3 dernières vidéos dans `Videos.jsx` (actuellement en placeholder).
- Confirmer le lien `@Francky_coaching` (pointe actuellement vers le TikTok `@homelubby`).
- Ajouter mentions légales / politique de confidentialité si la page collecte des données.

## Structure

```
src/
  components/    # un composant + son .module.css par section
  hooks/         # useInView (scroll reveal), useScrolled (nav), useRailTheme (barre sociale)
  data/          # contenu éditorial centralisé
  assets/        # logo + images décoratives (fennec)
```
