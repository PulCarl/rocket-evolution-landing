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

## Témoignages (sync automatique depuis Discord — actuellement en pause)

⚠️ Le déclenchement automatique (toutes les 30 min) est **désactivé** dans [`sync-testimonials.yml`](./.github/workflows/sync-testimonials.yml) tant que les secrets Discord ci-dessous ne sont pas configurés — sinon chaque run échoue et spamme des emails de notification GitHub. Pour l'instant les avis sont ajoutés à la main dans [`testimonials.json`](./src/data/testimonials.json).

Une fois prêt à l'activer : configure les secrets (étape 2 ci-dessous), puis décommente le bloc `schedule` dans le fichier de workflow.

Les avis affichés dans la section Résultats viennent de [`src/data/testimonials.json`](./src/data/testimonials.json). Une fois le schedule réactivé, ce fichier sera mis à jour automatiquement par le workflow (déclenchable manuellement dès maintenant depuis l'onglet Actions de GitHub, même sans schedule).

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

## Membres Discord (sync automatique)

Le premier stat du hero ("Membres Discord") vient de [`src/data/discordStats.json`](./src/data/discordStats.json), mis à jour automatiquement par [`.github/workflows/sync-discord-stats.yml`](./.github/workflows/sync-discord-stats.yml) (toutes les 6h, ou déclenchable manuellement depuis l'onglet Actions de GitHub). Aucune clé API ni secret requis — il interroge l'API publique des invitations Discord (`approximate_member_count` sur l'invite `6dbDnF3JCy`).

**TikTok et YouTube n'ont pas d'équivalent ici** : TikTok n'a pas d'API publique gratuite pour le nombre de followers (scraping fragile/hors ToS sinon), et l'abonnement YouTube en direct nécessiterait une clé API Data v3 (Google Cloud Console) — non mis en place pour l'instant, décision du client.

## À faire avant mise en ligne (voir README du handoff design)

- Reconfirmer les chiffres (+1 rang, 50+ replays, 4 500h, depuis 2026) — "Membres" est maintenant live depuis Discord, plus besoin de le reconfirmer manuellement.
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
