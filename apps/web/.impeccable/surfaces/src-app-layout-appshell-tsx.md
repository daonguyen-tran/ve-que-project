---
version: 1
slug: "src-app-layout-appshell-tsx"
primary_target: "src/app/layout/AppShell.tsx"
related_targets: ["src/features/today/TodayPage.tsx"]
---

## Scope

Shell de l'application (navigation, en-têtes, bouton « + Dépense ») et écran « Aujourd'hui ». Mode : Operate. Plateforme : web (PWA), mobile d'abord (Android, une main, plein soleil), PC pour planifier.

## Audience and task

Utilisateur principal en voyage familial au Vietnam : savoir où en est l'argent, ce qui est prévu aujourd'hui, et saisir une dépense en moins de 5 secondes. Contraintes : hors ligne, montants VND à 5–7 chiffres, données fictives tant que le voyage n'est pas saisi.

## Direction contract

THESIS: Về Quê traite chaque montant comme la valeur faciale d'un billet : l'argent est lisible d'un coup d'œil, au soleil, sans erreur de zéros. Refuse le tableau de bord de cartes uniformes à accent unique des applis de voyage.

OWN-WORLD: Billets en đồng. En-tête plein en rouge laque (#A8322D) portant date, jour n/21 et étape ; fond gris pierre froid (#F5F5F4), surfaces blanches, filets #E7E5E4 ; jaune curcuma (#E0A526) réservé au « maintenant » (créneau en cours) ; catégories de dépenses aux teintes des billets polymères (vert, bleu, rose, ocre, sarcelle), distinctes aussi en luminosité ; Be Vietnam Pro, chiffres tabulaires.

STORY: L'utilisateur ouvre l'appli, voit ce qu'il a en poche et ce qu'il a dépensé aujourd'hui, le créneau en cours, puis touche « + Dépense ».

FIRST VIEWPORT: Mobile 390 px : bandeau rouge (marque, météo, date en 28 px, « Jour 6 sur 21 · Hoi An »), carte « Espèces en poche » qui chevauche le bandeau avec le montant en 40 px et ₫ en laque, barre du jour segmentée par catégories ; puis le programme Matin / Après-midi / Soir en liste à filets ; bouton flottant « + Dépense » au-dessus de la barre d'onglets (Aujourd'hui, Planning, Idées, Dépenses, Plus). PC : rail latéral à gauche, même hiérarchie.

FORM: Direction 3 de la liste ordonnée (billets en đồng), choisie par l'utilisateur sur la toile de comparaison. seed: 60addb71c4ba970a

Signature: le montant « valeur faciale » (chiffres serrés, ₫ en laque, équivalent € en gris) et la barre du jour aux couleurs des billets.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

Mode sombre (reporté). Illustrations des billets (module Aide billets, phase 4).
