# Fouria — Puissance 4

Jeu de **Puissance 4** web, moderne et responsive : partie à deux joueurs sur le même écran ou
contre une IA à trois niveaux, avec animations, sons synthétisés et scores persistants.
Aucun backend, aucune compte, aucune dépendance runtime au-delà de React.

## Fonctionnalités

- Grille classique **7 colonnes × 6 lignes**.
- **Mode 2 joueurs** en local et **mode IA** (facile, moyen, difficile).
- Détection des victoires **horizontales, verticales et diagonales** et des **égalités**.
- **Animation de chute** des jetons et **mise en évidence pulsée** des quatre jetons gagnants.
- Affichage du **joueur actif**, du compteur de coups et de l'état de réflexion de l'IA.
- **Scores et historique** des parties (localStorage), boutons *Rejouer* et *Réinitialiser*.
- **Couleurs des joueurs personnalisables** (v1.1.0) : 8 teintes prédéfinies par joueur,
  aperçu en direct des jetons, combinaisons identiques ou trop proches interdites,
  contraste vérifié, préférence sauvegardée, applicable au mode IA.
- **Effets sonores** synthétisés (Web Audio API, aucun fichier audio) avec bouton de coupure.
- **Menu principal** avec sélection du mode et du niveau, **écran de victoire** avec
  confettis animés.
- Interface **responsive** (mobile d'abord, panneau latéral sur grand écran).

## Stack

| Domaine | Choix |
| --- | --- |
| Front | React 19 + TypeScript + Vite |
| Style | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Tests | Vitest |
| Stockage | `localStorage` |
| IA | Minimax + élague alpha-beta (écrit à la main, zéro dépendance) |

## Lancement

Prérequis : **Node.js ≥ 20** et npm.

```bash
npm install        # installer les dépendances
npm run dev        # serveur de développement (hot reload)
```

Puis ouvrir l'URL affichée par Vite (http://localhost:5173).

### Autres scripts

```bash
npm run build      # vérifie les types puis produit le bundle dans dist/
npm run preview    # sert le bundle de production
npm test           # tests unitaires (moteur de jeu, tours, égalités, IA)
npm run test:watch # tests en mode observateur
npm run typecheck  # vérification TypeScript seule
npm run smoke      # parcours UI automatisé (Playwright) + captures d'écran
```

Déploiement : il suffit d'héberger le contenu de `dist/` sur n'importe quel hébergeur statique.

## Architecture

```
src/
├── engine/            # moteur de jeu, indépendant de l'interface
│   ├── types.ts       # Player, Board, GameState, modes…
│   ├── board.ts       # grille, chute des jetons, détection des lignes
│   ├── game.ts        # tours, enchaînement, fin de partie (fonctions pures)
│   ├── ai.ts          # choix de coup : facile / moyen / difficile
│   ├── fixtures.ts    # partie nulle de référence utilisée par les tests
│   └── *.test.ts      # tests unitaires
├── hooks/
│   ├── useLocalStorage.ts
│   └── useSound.ts    # sons synthétisés (Web Audio API)
├── components/        # présentation uniquement (Board, MainMenu, ScorePanel…)
├── App.tsx            # orchestration : écrans, scores, coup de l'IA
├── colors.ts          # palette joueurs, contraste WCAG, validation de paire (v1.1.0)
├── types.ts           # libellés et types partagés UI
└── index.css          # thème sombre arcade, animations, jetons
scripts/smoke.mjs      # vérification visuelle automatisée (optionnelle)
```

### Séparation moteur / interface

- `src/engine` ne contient **aucune dépendance React** ni accès au DOM : ce sont des fonctions
  pures sur un `GameState` sérialisable (grille, joueur actif, statut, ligne gagnante, dernier
  coup). `playMove` renvoie exactement le même objet lorsque le coup est illégal, ce qui rend
  les tests et les comparaisons triviales.
- L'interface ne fait que refléter l'état et envoyer des **coupes numéros de colonne** au moteur.
- Les **couleurs de jetons** (v1.1.0) sont une couche purement visuelle : le moteur continue de
  jouer `red` / `blue`, seule la teinte affichée change (`src/colors.ts`).
- `chooseMove(board, player, difficulty)` est appelé par l'application via un simple `setTimeout`
  pour laisser l'écran se peindre : aucun couplage négatif, l'IA pourrait être remplacée par un
  serveur sans toucher au moteur.

### Vers le multijoueur en ligne

Le moteur est déjà sérialisable et les coups sont des entiers : il suffira d'ajouter un transport
(websocket) qui diffuse `GameState` + colonne jouée, et de déplacer `chooseMove` côté serveur.

### IA

| Niveau | Stratégie |
| --- | --- |
| Facile | coup aléatoire parmi les colonnes jouables |
| Moyen | gagne si possible → bloque l'adversaire → évite d'offrir une victoire → favorise le centre |
| Difficile | minimax + alpha-beta, profondeur 7, évaluation par fenêtres de 4 et contrôle du centre |

Mesuré : moins de 100 ms par coup en « difficile », et 100 victoires sur 100 contre le niveau
facile en automatisé.

## Persistance (`localStorage`)

| Clé | Contenu |
| --- | --- |
| `luma.connect.scores.v1` | score rouge / bleu / égalités |
| `luma.connect.history.v1` | 12 dernières parties (vainqueur, mode, date) |
| `luma.connect.muted.v1` | préférence son |
| `luma.connect.prefs.v1` | mode et niveau de difficulté retenus |
| `luma.connect.colors.v1` | couleurs des jetons Joueur 1 / Joueur 2 (v1.1.0) |

## Tests

```bash
npm test
```

50 tests couvrant : la grille (chute, colonnes pleines), la détection des quatre alignements
dans les huit directions, les égalités, l'alternance des tours, la fin de partie figée, les
trois niveaux d'IA (victoire immédiate, blocage, coups valides) et la palette de couleurs
joueurs (contraste WCAG, validation de paire, résolution robuste des préférences).

## Commandes de jeu

- **Souris / tactile** : cliquer ou toucher une colonne y dépose un jeton.
- **Clavier** : les colonnes sont des boutons focusables, activation avec `Entrée` / `Espace`.
- `Rejouer` recommence une partie en conservant les scores ; `Réinitialiser` remet les compteurs
  et l'historique à zéro ; le haut de l'écran permet de revenir au menu et de couper le son.
