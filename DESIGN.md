---
name: Về Quê
description: Préparer et vivre un voyage familial au Vietnam : l'argent lisible comme un billet, la journée en trois créneaux.
colors:
  laque: "#A8322D"
  laque-deep: "#86231F"
  laque-tint: "#FBEAE8"
  on-laque: "#FFFFFF"
  on-laque-muted: "#F8DEDB"
  curcuma: "#E0A526"
  curcuma-tint: "#FDF6E3"
  curcuma-ink: "#7A5A12"
  ground: "#F5F5F4"
  surface: "#FFFFFF"
  line: "#E7E5E4"
  line-soft: "#F0EEEC"
  ink: "#1C1917"
  ink-soft: "#44403C"
  muted: "#57534E"
  success: "#2F6B45"
  cat-food: "#2F6B45"
  cat-transport: "#2B57A0"
  cat-activities: "#B5487E"
  cat-shopping: "#9A6B12"
  cat-accommodation: "#1D6F74"
  cat-other: "#78716C"
  stop-city: "#23467F"
  stop-village: "#4E9A62"
  stop-island: "#8CCFCB"
typography:
  display-amount:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  date-block:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  nav:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.2
rounded:
  focus: "6px"
  control: "12px"
  card: "16px"
  sheet: "20px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.laque}"
    textColor: "{colors.on-laque}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.laque-deep}"
  button-quiet:
    textColor: "{colors.laque}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  fab-expense:
    backgroundColor: "{colors.laque}"
    textColor: "{colors.on-laque}"
    rounded: "{rounded.pill}"
    height: "52px"
    padding: "0 20px 0 16px"
  card-raised:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "18px"
  list-grouped:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
  slot-now:
    backgroundColor: "{colors.curcuma-tint}"
    textColor: "{colors.curcuma-ink}"
  brand-header:
    backgroundColor: "{colors.laque}"
    textColor: "{colors.on-laque}"
    padding: "20px"
---

# Design System: Về Quê

## Overview

**Billets en đồng.** Về Quê est un outil de terrain : on l'ouvre d'une main, en plein soleil, au marché ou dans un Grab. Le monde visuel emprunte aux billets polymères vietnamiens trois choses seulement : la lecture immédiate d'une valeur faciale, un code couleur par coupure, et la fierté tranquille d'un objet du quotidien. Il ne fournit ni la mise en page ni les commandes, qui restent celles d'une appli mobile standard (barre d'onglets en bas, listes, boutons).

L'identité tient en une coque rouge laque (bandeau des écrans principaux, rail sur PC), un fond pierre neutre, des surfaces blanches et un seul geste signature : **le montant « valeur faciale »**, avec ses chiffres serrés, le symbole ₫ plus petit en laque et l'équivalent en euros en gris.

Ce que le système refuse : le tableau de bord de cartes identiques à accent unique, le fond crème et la typographie à empattements, les dégradés, le verre dépoli, les emojis en guise d'icônes.

## Colors

### Primary

- **Rouge laque** `laque` (#A8322D) : la coque. Bandeau des écrans principaux, rail latéral sur PC, bouton principal, bouton « + Dépense », onglet actif, liens. Contraste 6,6:1 avec le blanc.
- **Laque profonde** `laque-deep` (#86231F) : état pressé et survol, texte d'alerte sur fond clair.
- **Teinte laque** `laque-tint` (#FBEAE8) : fond de sélection, pastille d'icône des états vides.

### Secondary

- **Jaune curcuma** `curcuma` (#E0A526), avec `curcuma-tint` en fond et `curcuma-ink` pour le texte posé dessus : réservé au **maintenant** (créneau en cours). Jamais décoratif.

### Neutral

- `ground` (#F5F5F4) pour le fond de l'appli, `surface` (#FFFFFF) pour les cartes et listes, `line` / `line-soft` pour les filets, `ink` / `ink-soft` / `muted` pour le texte (muted ≥ 7:1 sur blanc).

### Types d'étape

Frise des nuits : ville indigo foncé (`stop-city`), village jade moyen (`stop-village`, la famille), île sarcelle claire (`stop-island`). Trois luminosités nettement différentes, plus une icône par type dans la légende et dans chaque ligne.

### Data (catégories de dépenses)

Teintes des billets : nourriture vert (100 000), transport bleu (20 000), activités rose (50 000), shopping et cadeaux ocre (10 000), hébergement sarcelle (500 000), autre gris. Elles diffèrent aussi en luminosité et sont toujours accompagnées d'un libellé.

### Named Rules

- **La règle du maintenant** : le curcuma ne marque qu'une chose, ce qui se passe en ce moment.
- **Jamais la couleur seule** : le rouge étant la couleur de marque, un dépassement de budget s'annonce par une icône et une phrase (« Budget du jour dépassé de 100 000 ₫ »), pas par du rouge.

## Typography

**Be Vietnam Pro**, auto-hébergée (hors ligne), avec le sous-ensemble vietnamien pour les diacritiques empilés (ệ, ộ, ữ). Une seule famille : le caractère vient des graisses et des tailles.

### Hierarchy

- `display-amount` 40 px / 700 : le montant en poche, seul élément de cette taille à l'écran.
- `title` 28 px / 700 : la date ou le titre d'écran.
- `date-block` 22 px / 700 : le numéro du jour dans le bloc calendrier des étapes.
- `heading` 18 px / 600 : titres de section.
- `body` 15 px / 400–500 : contenu des listes.
- `label` 13 px : créneaux, métadonnées, légendes.
- `nav` 12 px : libellés de la barre d'onglets.

### Named Rules

- **Chiffres tabulaires** sur tout montant, heure ou compteur (`.tabular`).
- **Milliers lisibles** : en grand corps, l'espace fine insécable d'`Intl` est remplacée par une espace insécable normale ; « 1 240 000 » ne doit jamais se lire « 1240000 ».
- Forme courte `155k` / `1,2M` réservée aux espaces étroits ; le montant important s'affiche en entier.

## Layout

- **Mobile d'abord (390 px)** : bandeau laque, puis une carte qui le chevauche de 36 px, puis des sections empilées avec 20 px d'écart et 16 px de marge latérale. La barre d'onglets (68 px + zone gestuelle) et le bouton « + Dépense » sont fixes ; le contenu réserve 148 px en bas.
- **PC (≥ 1024 px)** : rail laque de 240 px à gauche ; contenu centré (max 768 px), en deux colonnes sur l'écran « Aujourd'hui ». La colonne de droite commence sous le bandeau.
- Marges de sécurité `env(safe-area-inset-*)` pour l'appli installée.

## Elevation & Depth

Une seule élévation, réservée à ce qui flotte réellement : la carte qui chevauche le bandeau et le bouton flottant. Le reste est à plat, séparé par des filets.

### Shadow Vocabulary

- `raised` : `0 1px 2px rgb(28 25 23 / 0.06), 0 8px 24px rgb(28 25 23 / 0.08)` pour la carte « Espèces en poche » et le bandeau de mise à jour.
- `fab` : `0 2px 4px rgb(134 35 31 / 0.25), 0 10px 24px rgb(134 35 31 / 0.25)` pour le bouton « + Dépense », teintée de laque.

## Shapes

Rayons doux mais fermes : 6 px pour l'anneau de focus, 12 px pour les commandes et champs, 16 px pour les cartes et listes groupées, 20 px pour les panneaux modaux (`Sheet`, arrondis en haut seulement sur mobile), pilule pour les étiquettes et le bouton flottant. Pas de bordure d'un seul côté : un élément mis en avant prend un fond teinté et un contour complet.

## Components

### Buttons

Principal laque plein, discret (texte laque) ; hauteur minimale 44 px ; compression à 97 % au toucher, transition de 150 ms en ease-out exponentielle. Le survol n'existe qu'avec une souris.

### Navigation

Barre d'onglets à cinq entrées (Aujourd'hui, Planning, Idées, Dépenses, Plus), icônes au trait 1,9, onglet actif en laque et en gras. Sur PC, le même menu devient un rail laque, l'entrée active est une pilule blanche à texte laque profonde.

### Inputs / Fields

Champs de 48 px de haut, texte à 16 px (pas de zoom à la saisie sur mobile), libellé au-dessus, aide ou erreur en dessous. Erreur : contour laque profonde, icône et phrase qui dit quoi corriger ; jamais la couleur seule. Dates : champ natif (calendrier du système sur Android).

### Champ montant (AmountField)

Saisie « à la vietnamienne » (`50k`, `1,2M`, `350 000`) avec bascule ₫ / € à droite, et l'aperçu du montant complet juste en dessous (« = 2 400 000 ₫ »), mis à jour à chaque frappe. Clavier texte sur mobile (il faut pouvoir taper `k`). C'est le composant de saisie de toutes les dépenses à venir.

### Statut de réservation (BookingBadge)

« Réservé » : fond jade clair, coche, texte jade foncé. « Envisagé » : contour neutre. « Annulé » : contour neutre, texte barré. Le mot porte toujours l'information.

### Panneau modal (Sheet)

`<dialog>` natif : feuille qui monte du bas sur mobile, fenêtre centrée sur PC, fond assombri, en-tête titre + fermer, actions principales dans le pied. Les actions destructrices passent par `ConfirmSheet`, dont le bouton nomme l'action.

### Cards / Containers

Listes groupées blanches à filets internes (`list-grouped`) pour les créneaux et les menus ; une seule carte surélevée par écran.

### Bouton « + Dépense »

Pilule laque de 52 px, fixée au-dessus de la barre d'onglets côté pouce droit, présente sur tous les écrans sauf la saisie elle-même.

### Montant « valeur faciale » (signature)

`Amount` : chiffres `display-amount`, symbole de devise plus petit en laque, libellé accessible complet (« 1 240 000 ₫ »). Accompagné de la **barre du jour** : segments aux couleurs des billets, proportionnels au budget du jour, la partie grise étant ce qui reste.

### Frise des nuits (signature du planning)

Une case par nuit du voyage, colorée selon le type d'étape ; une marge plus large marque le passage d'une étape à l'autre ; les nuits sans étape sont des cases vides à contour pointillé. Même grammaire que la barre du jour : des segments lus d'un coup d'œil.

### Ligne d'étape

Bloc calendrier à gauche (jour abrégé, numéro en `date-block`, mois), nom sur deux lignes au plus, nom vietnamien en gris, puis étiquette de type et « 4 nuits · jusqu'au 14 juil. ». Les nuits sans étape apparaissent entre les lignes dans un cadre pointillé avec « Ajouter une étape ici ».

### Emplacement de trajet

Entre deux étapes de la liste : pastille ronde avec l'icône du moyen de transport, « Avion · 4 juil. · 10:30 → 11:50 », lune et « arrivée le 8 juil. » pour un trajet de nuit, puis le statut. Sans trajet : un lien discret « + Ajouter le trajet vers Hoi An ».

### Écran de réglage en sections (Sauvegarde et transfert)

Titre de section sur le fond, puis une carte blanche qui regroupe l'action (`DataSection`). Un seul bouton principal par carte ; l'action destructive (« Effacer et remplacer ») prend la variante danger et passe par une confirmation qui nomme ce qui sera perdu. Les statuts (« Nouveau », « Déjà à jour », « À faire ») sont des pastilles arrondies : laque claire quand il y a quelque chose à faire, gris quand il n'y a rien. Les messages de résultat sont en texte coloré sous les boutons (succès en vert, erreur en laque profonde), jamais en toast qui disparaît.

### Créneau en cours

Ligne de liste sur fond `curcuma-tint`, libellé et détail en `curcuma-ink`, pastille « En cours » à contour curcuma.

## Do's and Don'ts

- **Do** afficher chaque montant avec sa devise et ses séparateurs de milliers.
- **Do** garder une seule élévation par écran.
- **Do** écrire des états vides qui disent quoi faire ensuite.
- **Don't** utiliser le curcuma pour décorer.
- **Don't** signaler un problème par la seule couleur rouge.
- **Don't** ajouter de surtitre au-dessus d'un titre, de dégradé, de verre dépoli ou d'emoji.
- **Don't** imiter un billet (guillochis, filigrane) : le monde prête sa lecture et ses couleurs, pas son décor.
