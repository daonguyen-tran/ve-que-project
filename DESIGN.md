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
typography:
  display-amount:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "40px"
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
  control: "12px"
  card: "16px"
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

Rayons doux mais fermes : 12 px pour les commandes, 16 px pour les cartes et listes groupées, pilule pour les étiquettes et le bouton flottant. Pas de bordure d'un seul côté : un élément mis en avant prend un fond teinté et un contour complet.

## Components

### Buttons

Principal laque plein, discret (texte laque) ; hauteur minimale 44 px ; compression à 97 % au toucher, transition de 150 ms en ease-out exponentielle. Le survol n'existe qu'avec une souris.

### Navigation

Barre d'onglets à cinq entrées (Aujourd'hui, Planning, Idées, Dépenses, Plus), icônes au trait 1,9, onglet actif en laque et en gras. Sur PC, le même menu devient un rail laque, l'entrée active est une pilule blanche à texte laque profonde.

### Cards / Containers

Listes groupées blanches à filets internes (`list-grouped`) pour les créneaux et les menus ; une seule carte surélevée par écran.

### Bouton « + Dépense »

Pilule laque de 52 px, fixée au-dessus de la barre d'onglets côté pouce droit, présente sur tous les écrans sauf la saisie elle-même.

### Montant « valeur faciale » (signature)

`Amount` : chiffres `display-amount`, symbole de devise plus petit en laque, libellé accessible complet (« 1 240 000 ₫ »). Accompagné de la **barre du jour** : segments aux couleurs des billets, proportionnels au budget du jour, la partie grise étant ce qui reste.

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
