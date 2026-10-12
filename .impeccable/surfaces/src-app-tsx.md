---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

# Surface: application Fouria (menu, jeu, salon, règles)

Primary target: src/App.tsx

## Direction contract

THESIS: Le menu est la façade d'une borne d'arcade néon — logotype FOURIA chromé au-dessus de jetons flottants — et refuse le hero centré + pile de CTA génériques ; l'écran de jeu est un HUD de duel VS où le plateau est le héros et l'état vit dans les panneaux latéraux.

OWN-WORLD: sol bleu-noir quasi noir (#05070F), bleu électrique #2F7BFF et or #FFC857 comme deux pôles joueurs, panneaux verre sombre à liseré néon 1px, logotype chromé Michroma, UI Exo 2, codes/scores JetBrains Mono tabulaire, cadre de plateau à rebord lumineux, jauges et pips d'état.

STORY: on arrive, on lit FOURIA + cinq actions directes (Jouer, Multijoueur en ligne, IA, Personnalisation, Paramètres), on choisit, on joue ; la fin de partie se lit dans le latéral pendant que la ligne gagnante pulse sur le plateau.

FIRST VIEWPORT (menu): plein écran, fond bokeh nocturne + grands jetons bleu/or flottants aux bords, logotype FOURIA chromé centré haut avec « STRATÉGIE · RÉFLEXION · DUEL », pile de 5 boutons pilule à icône (Jouer en primaire glow bleu), pied : LUMA Games à gauche, Version 1.0.0 à droite.

FORM: univers arcade néon épinglé par la maquette de l'utilisateur (roll seed 076ce84a, direction épinglée par le brief — le roll cède au brief). Levées nommées : « Seul le joueur actif à plein éclat » (don Saville) ; « accent d'action uniquement quand on peut agir » (don app consumer) ; « chiffres de score monumentaux contre micro-labels trackés » (don specimen) ; « chaque écran ne montre que la décision suivante » (don signalétique aéroport).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
