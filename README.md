# 2FIVE3 Coffee & Mart

Catalogue de présentation responsive en français, réalisé avec React et Vite. Il présente les **27 boissons et les prix en FDJ fournis**, sans panier, paiement ni commande.

## Télécharger et consulter le catalogue

**[Télécharger le ZIP prêt à ouvrir](https://github.com/suriyaadam/Pin/raw/refs/heads/main/downloads/2five3-preview.zip)** · **[Télécharger uniquement le HTML autonome](https://github.com/suriyaadam/Pin/raw/refs/heads/main/downloads/2five3-preview.html)**

1. Télécharger le ZIP ci-dessus et l’extraire (clic droit → « Extraire tout » sous Windows).
2. Ouvrir **`2five3-preview.html`** dans Chrome, Edge, Firefox ou Safari. Les images, les polices et la vidéo sont intégrées : aucune installation ni adresse `localhost` n’est nécessaire.
3. Pour tester depuis un téléphone sur le même réseau Wi-Fi, suivre `LIRE-MOI.txt` dans le ZIP.

Les deux fichiers sont aussi visibles dans le dossier **[downloads/](downloads/)** du dépôt. Cette copie sert à valider le rendu ; elle ne déploie pas le site.

## Développement

Node.js **20.19+ ou 22.12+** est requis (validé ici avec Node.js 24).

```sh
git clone https://github.com/suriyaadam/Pin.git
cd Pin
npm ci
npm run dev -- --port 5173 --strictPort
```

Ouvrir ensuite **http://localhost:5173** sur cet ordinateur, en laissant le terminal ouvert. Avec une archive téléchargée depuis GitHub, extraire le dossier puis ouvrir un terminal dedans et commencer à `npm ci`. Dans l’environnement cloud, le projet se trouve déjà dans `/workspace/Pin` : ne pas le cloner une seconde fois.

Le serveur écoute sur toutes les interfaces. Les polices et les images sont locales : aucun compte, secret, service tiers ou base de données n’est nécessaire.

```sh
npm test         # Noms, prix, catégories, identifiants et images
npm run build   # Production dans dist/
npm run preview # Vérification locale du build
```

Un contrôle des interactions dans Chromium est également fourni dans `tests/browser-smoke.mjs`. Dans cet environnement, avec le serveur démarré :

```sh
BASE_URL=http://127.0.0.1:5173 PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright/index.mjs node tests/browser-smoke.mjs
BASE_URL=http://127.0.0.1:5173 PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright/index.mjs node tests/hero-video-smoke.mjs
```

Sur une autre machine, installer Playwright séparément et définir `CHROMIUM_PATH` si Chromium n’est pas situé dans `/usr/bin/chromium`. `BASE_URL` permet de viser un autre serveur.

Le contenu de `dist/` peut être hébergé sur un hébergement statique.

## Consulter sans Web Preview ni déploiement

Le serveur de développement écoute à `http://localhost:5173` sur **la machine qui l’exécute**. Cette adresse dans un environnement cloud ne donne pas automatiquement accès depuis un ordinateur personnel.

Une copie autonome peut être préparée pour la validation :

```sh
npm run build
node scripts/build-preview.mjs
```

Le script écrit `downloads/2five3-preview.html` (images, polices et vidéo intégrées) et `downloads/2five3-preview.zip`. Ces deux fichiers sont inclus dans le dépôt pour un téléchargement direct. Après une modification du catalogue, exécuter les deux commandes ci-dessus et enregistrer les aperçus régénérés. Cette copie ne remplace pas les sources React.

Le ZIP fournit aussi le dossier `site/` et `LIRE-MOI.txt`. Pour une consultation depuis un smartphone, extraire le ZIP, ouvrir un terminal dans `site/`, puis lancer `python3 -m http.server 5173 --bind 0.0.0.0` (ou `python` sous Windows). Sur l’ordinateur : `http://localhost:5173`. Sur le téléphone connecté au même réseau Wi-Fi : `http://<adresse-IP-locale-de-l’ordinateur>:5173`.

Ces commandes ne déploient rien. Aucun déploiement Netlify n’est nécessaire pour la validation.

## Hero vidéo au défilement

`src/components/ScrollVideoHero.jsx` gère uniquement le Hero. Une scène CSS `sticky` reste visible pendant environ 1,8 hauteur d’écran de défilement sur ordinateur et 1,45 sur mobile (avec des limites pour les petits écrans). La position de défilement détermine directement le temps de la vidéo, dans les deux sens, sans intercepter la molette ni le toucher. Le bouton « Explorer la carte » permet de quitter immédiatement la séquence.

Les sources se configurent dans `heroVideo`, dans `src/data/brand.js` : version desktop 768 × 960 (~2,7 Mo), version mobile 576 × 720 (~1,5 Mo), poster et image de secours. Les deux MP4 sont sans audio, en H.264, avec démarrage rapide et images clés toutes les 5 images pour faciliter les sauts temporels. La dernière position est limitée à la dernière image décodable.

Le cadrage `contain` conserve tout le format portrait ; texte et boutons occupent des zones séparées de la vidéo. Le poster reste affiché pendant le chargement, puis la première image décodée apparaît en fondu. Les seeks sont regroupés par `requestAnimationFrame` et jamais empilés. Les calculs s’arrêtent hors écran ou quand l’onglet est masqué.

La réduction des animations, l’économiseur de données et une connexion 2G activent l’image statique sans charger de vidéo ni créer une longue zone de défilement. Une erreur vidéo ou des décodages durablement trop lents déclenchent également le repli statique. Le bouton « Version sans animation » offre un choix explicite.

## Modifier la carte

Toutes les données produit sont dans **`src/data/catalog.js`**, séparées de la présentation. Les catégories y sont également définies.

- `name` : nom exact de la boisson.
- `price` : nombre entier, affiché en FDJ.
- `category` : `matcha`, `mojitos`, `coffee` ou `frappuccino`.
- `image` : chemin du fichier depuis `public/`.
- `imageAlt` : texte alternatif de l’image.

Les tests vérifient les noms et prix de la carte initiale. En cas de modification volontaire de la carte, mettre aussi à jour les valeurs attendues dans `tests/catalog.test.js`.

## Remplacer les ressources de marque

Les visuels sont créés pour le catalogue, avec une image distincte pour chaque boisson. Les pots transparents portent le marquage 2FIVE3 Coffee & Mart. Les couleurs et les couches différencient les fruits, le matcha, le café et les boissons frappées. Aucun descriptif de recette n’est déduit des images.

1. Placer les photographies définitives dans `public/images/` (WebP recommandé).
2. Mettre à jour les chemins et textes alternatifs dans `src/data/catalog.js`. Affecter une photographie distincte à chaque produit si disponible.
3. Configurer le logo, la vidéo d’accueil, ses images de couverture et l’image de la section « L’esprit 2FIVE3 » dans **`src/data/brand.js`**. Le logo typographique s’affiche tant que `logo` vaut `null`.

Les couleurs et les règles responsive sont dans `src/styles.css`. Les polices DM Sans et DM Serif Display sont hébergées dans `public/fonts/`, avec leurs licences OFL.

## Fonctionnalités

- Filtres par catégorie avec compteurs.
- Recherche par nom, indépendante des majuscules et des accents.
- Affichage en grille ou en liste.
- Dépliage de la carte complète.
- Fiche produit avec prix, fermeture au clavier ou par clic à l’extérieur.
- Menu mobile, navigation au clavier, gestion du focus et respect de la préférence de mouvement réduit.

## Fichiers principaux

```text
src/data/catalog.js   Données de la carte
src/data/brand.js     Ressources de marque
src/App.jsx          Composants et interactions
src/styles.css       Identité visuelle et responsive
src/components/      Hero vidéo isolé et son CSS
public/images/       Visuels remplaçables
public/video/        Versions optimisées de la vidéo fournie
public/fonts/        Polices locales et licences
tests/               Vérifications de la carte
scripts/             Construction de l’aperçu autonome
downloads/           Aperçus HTML et ZIP prêts à télécharger
```
