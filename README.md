# Rocket Evolution — Landing page

Landing page marketing pour Rocket Evolution (coaching Rocket League communautaire, Coach Hidari & Coach Francky). React + Vite, prête pour un déploiement statique sur Vercel.

Le design d'origine (référence pixel-perfect) se trouve dans [`design_handoff_rocket_evolution_landing/`](./design_handoff_rocket_evolution_landing) — ce dossier n'est pas utilisé par le build, il sert uniquement de référence.

## Stack

- [Vite](https://vite.dev) + React 19
- CSS Modules (pas de framework CSS) — tokens de design dans [`src/index.css`](./src/index.css)
- Aucune dépendance backend : contenu statique dans [`src/data/content.js`](./src/data/content.js)
- [react-three-fiber](https://r3f.docs.pmnd.rs) + [drei](https://github.com/pmndrs/drei) pour la voiture 3D du hero (voir ci-dessous)

## Voiture 3D dans le hero

Le visuel du hero ([`FennecCar3D.jsx`](./src/components/FennecCar3D.jsx)) charge un modèle Blender (`src/assets/3d/fennec.glb`) et le fait tourner automatiquement.

- **Poids** : le fichier original exporté par Blender faisait 27 Mo (textures 2048×2048 non compressées). Optimisé avec [`@gltf-transform/cli`](https://gltf-transform.dev) (`optimize --texture-size 1024 --texture-compress webp --compress draco`) → 1,14 Mo. Pour ré-optimiser un nouveau fichier :
  ```bash
  npx @gltf-transform/cli optimize source.glb src/assets/3d/fennec.glb --texture-size 1024 --texture-compress webp --compress draco
  ```
- **Chargement** : le composant est lazy-loadé (`React.lazy` + `Suspense`) — three.js/drei (~275 Ko gzippés) et le modèle ne se chargent que si nécessaire.
- **Mobile** : au-dessous de 780px, le composant n'est même pas monté ([`useMediaQuery`](./src/hooks/useMediaQuery.js)) — pas de coût réseau/CPU inutile là où le visuel est de toute façon masqué (`.visual { display: none }` dans `Hero.module.css`).
- **Accessibilité** : la rotation est désactivée si `prefers-reduced-motion: reduce`.

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

## Mini-jeu ("Jeu" dans la nav, `#jeu`)

Petit runner façon jeu du dinosaure de Chrome, à l'esthétique Rocket League (voiture, cônes, buts) — [`src/components/Game/`](./src/components/Game). Espace / clic pour sauter, la vitesse augmente avec le temps. Le score est purement basé sur le temps/vitesse (pas de bonus ad hoc), ce qui permet une vraie validation anti-triche côté serveur (voir plus bas).

**Le joueur est la vraie voiture 3D** ([`GamePlayer3D.jsx`](./src/components/Game/GamePlayer3D.jsx)) : le même modèle Fennec que dans le hero (`src/assets/3d/fennec.glb`, déjà en cache navigateur à ce stade), posée à plat cette fois et rendue via un second `<Canvas>` react-three-fiber, calé en caméra orthographique pour correspondre pixel pour pixel aux coordonnées du canvas 2D (sol, obstacles, collisions) — la physique de saut reste entièrement gérée par `engine.js`, ce composant se contente de lire `gameRef.current.player` à chaque frame pour positionner/incliner la voiture.

⚠️ **Piège de dev rencontré** : après des dizaines d'éditions à chaud successives sur ce fichier, le Canvas 3D du jeu restait bloqué à sa taille par défaut (300×150) — un état HMR corrompu par l'accumulation de hot-reloads, pas un vrai bug (un redémarrage propre du serveur de dev le résout instantanément, et un build de production n'y est jamais exposé puisqu'il ne passe jamais par le HMR). Le composant force quand même explicitement `gl.setSize()` dans `onCreated` par précaution — la mesure automatique du conteneur peut ponctuellement rater son coup si ce Canvas (chargé en lazy) monte pendant une transition de layout.

### Partage de score sur Discord

Le bouton "Partager sur Discord" en fin de partie génère une image de score (carte brandée, `src/components/Game/shareCard.js`) et l'envoie à [`api/share-score.js`](./api/share-score.js), une fonction serverless Vercel — **jamais** directement à Discord depuis le navigateur.

**Pourquoi passer par un serveur plutôt qu'un webhook appelé depuis le client :**
- Un webhook appelé en direct depuis le JS du navigateur expose son URL dans les requêtes réseau — n'importe qui pourrait la récupérer et spammer le salon directement, sans même passer par le jeu.
- Le score envoyé par le client n'est **jamais fait confiance tel quel**. `src/game/scoring.js` définit la formule exacte de vitesse/score du jeu ; `api/share-score.js` recalcule le score maximum théoriquement atteignable pour la durée de partie annoncée (`maxPossibleScore(elapsedSeconds)`, + une tolérance de ~8% pour les variations de framerate) et **rejette** toute soumission qui le dépasse. Un score tapé à la main dans la console (`score = 99999`) est immédiatement détecté comme impossible et n'est jamais transmis à Discord.
- ⚠️ **Limite honnête** : rien ne rend un jeu 100% côté navigateur infalsifiable face à quelqu'un de vraiment déterminé (qui simulerait une partie entière plausible). Cette validation bloque la triche "facile" (modifier une variable), pas une attaque sophistiquée construite spécifiquement contre elle.
- Un anti-spam basique par IP (15s entre deux envois) est aussi en place, mais reste best-effort : les fonctions Vercel sont sans état persistant garanti entre les invocations.

**Mise en place requise** (une seule fois) :
1. Dans Discord : *Paramètres du salon → Intégrations → Webhooks → Nouveau webhook*, choisir le salon dédié aux scores, copier l'URL du webhook.
2. Sur Vercel : *Project Settings → Environment Variables*, ajouter `DISCORD_SCORE_WEBHOOK_URL` avec cette URL (Production + Preview). ⚠️ C'est une variable d'environnement **Vercel**, pas un secret GitHub — les autres intégrations de ce projet (témoignages, vidéos, stats Discord) tournent dans GitHub Actions, celle-ci tourne dans une fonction Vercel, donc l'emplacement diffère.
3. Redéployer (ou attendre le prochain déploiement) pour que la variable soit prise en compte.

Tant que `DISCORD_SCORE_WEBHOOK_URL` n'est pas configurée, le bouton "Partager" échoue proprement (message "Erreur, réessaie") sans casser le jeu.

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
