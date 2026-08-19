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

## Témoignages (sync automatique depuis Discord)

Les avis affichés dans la section Résultats viennent de [`src/data/testimonials.json`](./src/data/testimonials.json), mis à jour automatiquement par [`.github/workflows/sync-testimonials.yml`](./.github/workflows/sync-testimonials.yml) (toutes les 30 min, ou déclenchable manuellement depuis l'onglet Actions de GitHub).

**Flux** : un membre poste son avis dans un salon Discord dédié → un coach réagit avec ✅ sur les messages à publier → le workflow les récupère, les ajoute au JSON, commit → Vercel redéploie automatiquement.

**Format attendu du message Discord** (sinon il est ignoré) :
```
Rang avant -> Rang après : le texte de l'avis
```
Exemple : `Or 3 -> Platine 2 : Le serveur est ce qui m'a fait rester...`

**Mise en place requise** (une seule fois) :
1. Créer une application + bot sur [discord.com/developers/applications](https://discord.com/developers/applications), l'inviter sur le serveur avec la permission *Read Message History* sur le salon des avis.
2. Dans les Settings du repo GitHub → *Secrets and variables → Actions*, ajouter :
   - `DISCORD_BOT_TOKEN` — le token du bot
   - `DISCORD_CHANNEL_ID` — l'id du salon où sont postés les avis
   - `DISCORD_APPROVER_IDS` — les ids Discord des coachs autorisés à approuver (séparés par des virgules)
3. Le workflow tourne automatiquement ensuite (au plus 3 témoignages affichés, les plus récents approuvés).

## Dernières vidéos (sync automatique depuis YouTube)

Les 3 vignettes de la section "Les dernières vidéos" viennent de [`src/data/videos.json`](./src/data/videos.json), mis à jour automatiquement par [`.github/workflows/sync-videos.yml`](./.github/workflows/sync-videos.yml) (toutes les 6h, ou déclenchable manuellement depuis l'onglet Actions de GitHub). Aucune clé API ni secret requis — il interroge simplement le flux RSS public de la chaîne (`youtube.com/feeds/videos.xml?channel_id=UCBiuzf9xGJXJflCjHWUwqZg`), prend les 3 dernières vidéos et commit le résultat s'il a changé.

## À faire avant mise en ligne (voir README du handoff design)

- Tant qu'aucun avis Discord n'a été approuvé, les 3 témoignages affichés restent des exemples fictifs (Nyko, Lisa, Max) — voir ci-dessus pour les remplacer.
- Reconfirmer les chiffres (+1 rang, 50+ replays, 4 500h, 500+ membres, depuis 2026).
- Confirmer le lien `@Francky_coaching` (pointe actuellement vers le TikTok `@homelubby`).
- Vérifier les droits d'utilisation de la photo de Coach Francky (watermark visible — probablement une photo de presse/agence).
- Ajouter mentions légales / politique de confidentialité si la page collecte des données.

## Structure

```
src/
  components/    # un composant + son .module.css par section
  hooks/         # useInView (scroll reveal), useScrolled (nav), useRailTheme (barre sociale)
  data/          # contenu éditorial centralisé
  assets/        # logo + images décoratives (fennec)
```
