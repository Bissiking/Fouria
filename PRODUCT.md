# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Des amis qui jouent ensemble : deux joueurs sur le même écran en soirée, et deux amis à distance connectés par code de salle (multijoueur en ligne via WebSocket). Public casual/arcade, français.

## Product Purpose

Puissance 4 (alignement de 4 jetons) moderne et arcade, jouable immédiatement sans compte. Succès : partie lancée en quelques secondes, partie en ligne partagée par un simple code, fin de partie lisible.

## Positioning

Le même jeu sur le même écran ou à distance : mode local et mode en ligne par code de salle sans création de compte, avec une identité arcade néon soignée.

## Operating Context

- Session informelle en soirée : une partie dure peu de temps, rejeu immédiat.
- Le multijoueur à distance passe par un code de salle de 6 caractères copiable, sans compte ni invitation par email.
- Jeu en français.

## Capabilities and Constraints

- Modes : 2 joueurs local, contre l'IA (facile/moyen/difficile), en ligne (code de salle, WebSocket).
- Scores et historique persistés en localStorage, personnalisation des couleurs des jetons, sons (mutables).
- Stack : React 19 + TypeScript + Vite + Tailwind 4, serveur WebSocket `ws` (port 3001).
- Interface exclusivement en français.
- Contrainte : la ligne gagnante doit rester visible en fin de partie (pas de popup opaque qui la masque).

## Brand Commitments

- Nom du jeu : FOURIA.
- Studio éditeur : LUMA Games (mention affichée dans le menu principal).
- Version du jeu affichée : Version 1.0.0.

## Evidence on Hand

- Maquette de référence fournie par l'utilisateur (image de la DA souhaitée).
- Code existant avec moteur de jeu testé (50 tests).

## Product Principles

1. Immédiateté : aucune friction avant de jouer (pas de compte, pas d'attente).
2. Lisibilité de la fin de partie : l'alignement gagnant se voit toujours.
3. Le local et le distant partagent exactement les mêmes règles et le même plaisir.
4. L'identité arcade assume un univers néon sombre sans sacrifier la clarté.

## Accessibility & Inclusion

Aucun besoin spécifique confirmé ; ne pas dégrader le contraste des jetons et des textes sur fond sombre.
