# DESIGN.md — Fouria

Direction : **arcade néon** (contrat épinglé : `.impeccable/surfaces/src-app-tsx.md`, seed 076ce84a cédant au brief utilisateur).

## Thèse

Le menu est la façade d'une borne d'arcade néon — logotype FOURIA chromé au-dessus de jetons flottants — et refuse le hero centré + pile de CTA génériques. L'écran de jeu est un HUD de duel VS : le plateau est le héros, l'état vit dans les panneaux latéraux.

## Palette

| Jeton | Valeur | Rôle |
| --- | --- | --- |
| `--void` | `#05070F` | fond quasi noir bleuté |
| `--blue` / `--blue-hi` | `#2F7BFF` / accent éclat | pôle joueur 1, action primaire |
| `--gold` | `#FFC857` | pôle joueur 2, action secondaire (btn-gold) |
| panneaux | verre sombre + liseré néon 1px | `.panel`, `.sub-panel` |
| erreurs | `rose-400` | messages d'alerte uniquement |

Deux pôles joueurs : bleu électrique vs or. Les couleurs par défaut des jetons sont `electrique` (rouge) et `ambre` (bleu) pour s'aligner sur ces pôles (`DEFAULT_PLAYER_COLORS`, `src/colors.ts`).

## Typographie (auto-hébergée, `src/main.tsx`)

- **Michroma** — logotype FOURIA (`.logo-chrome`, dégradé chromé + glow).
- **Exo 2** — toute l'UI : titres extrabold trackés, labels `.micro-label` (uppercase, `0.28em`).
- **JetBrains Mono** — codes de salle, scores, chiffres tabulaires (`.room-code`, `.score-num`).

Contraste d'échelle assumé : chiffres de score monumentaux contre micro-labels trackés.

## Composants récurrents (`src/index.css`)

- `.panel` / `.sub-panel` — panneaux verre, liseré néon, coins 16-24px.
- `.btn` + `.btn-primary` (glow bleu, action principale) / `.btn-gold` / `.btn-ghost`.
- `.board-frame`, `.hole`, `.disc` — plateau à rebord lumineux, jetons avec ombre interne.
- `.room-code` — mono, tracking large (placeholder « ABCDEF » car le tracking tronque les longues chaînes).
- `.chip`, `.menu-btn`, `.anim-title`.

## Motion

Entrées `anim-rise` / `anim-pop` / `anim-drop` en ease-out lisse (`cubic-bezier(0.22,1,0.36,1)` — pas de rebond élastique, vérifié par `impeccable detect`). Pulse de victoire `win-pulse` (scale + glow) : **la ligne gagnante reste visible en fin de partie**, le résultat s'affiche dans le latéral (`GameSidebar`), jamais en surimpression. `prefers-reduced-motion` respecté.

## Lifts nommés

1. **Seul le joueur actif à plein éclat** — panneau VS : joueur actif en pleine intensité, inactif en retrait (don Saville).
2. **Accent d'action uniquement quand on peut agir** — bouton primaire/bleu réservé à l'action disponible du moment (don app consumer).
3. **Scores monumentaux vs micro-labels trackés** (don specimen).
4. **Chaque écran ne montre que la décision suivante** — un écran, un CTA (don signalétique aéroport) : choix niveau → « Lancer la partie », salon → « Créer une salle ».

## Arbitres

- **Grille hairline en fond** (`codex-grid-background`, advisory) : conservée — faisant partie du monde arcade (borne d'arcade / CRT), en très faible opacité. Décision consciente, pas de l'oubli.
- **Pas d'image générée** : direction 100 % code-led (pas de gen sur la machine).
- **Multijoueur** : WebSocket maison (`server.ts`, `ws://…/ws` sur le même serveur HTTP que le frontend, port `3000`), salon 6 caractères, pas de compte.

## Provenance

Screenshots de review dans `.impeccable/review/` (rounds 1 et 2, playwright chromium, 1440×900 et 390×844, `reducedMotion: 'reduce'`). Le logo et les textes en dur ont été corrigés après le round 1 (échappements `\u2019` littéraux en JSX remplacés par de vrais `’`, placeholder raccourci, logo agrandi) et revérifiés au round 2.
