# ADR 0006 — Calendrier maison pour toutes les dates

- **Statut** : accepté
- **Date** : 23/11/2026

## Contexte

Les dates étaient saisies avec le champ du navigateur (`<input type="date">`). Il sait
limiter une plage (minimum, maximum), mais pas griser des jours précis, montrer une plage
arrivée → départ, ni colorer les jours déjà pris. Or l'utilisateur voulait voir, en créant
une étape, les nuits déjà occupées par les autres.

## Décision

Un calendrier maison, dans `apps/web/src/shared/ui/calendar`, utilisé pour **toutes** les
dates de l'application :

| Brique              | Rôle                                                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `calendar-model.ts` | Fonctions pures et testées : grille du mois (lundi en premier), choix d'une plage en deux touches, déplacements au clavier |
| `Calendar.tsx`      | Affichage seul : un ou plusieurs mois, jours décorés, focus clavier. Il ne connaît aucune règle métier                     |
| `DateField`         | Un jour : bouton qui déplie le calendrier dans la page                                                                     |
| `DateRangeField`    | Une plage : deux cases de résumé et le calendrier toujours visible                                                         |

Les **règles** viennent de l'écran appelant (motif _Strategy_) : `isPickable` pour un jour,
`RangeRules` (`canStart`, `canEnd`) pour une plage. Pour les étapes, elles sont calculées par
`stopAvailability` dans le domaine, qui raisonne en nuits : le jour de départ d'une étape
reste choisissable comme arrivée de la suivante.

Le calendrier s'ouvre dans la page et non dans une fenêtre par-dessus : il est utilisé dans
des panneaux déjà modaux, où une seconde couche compliquerait le focus et le bouton retour
d'Android.

## Conséquences

- Accessibilité à notre charge : grille `role="grid"`, un seul jour atteignable avec Tab,
  flèches / Début / Fin / Page précédente et suivante, jours impossibles en `aria-disabled`
  avec leur raison lue (« nuit déjà prévue à Saigon »).
- Les champs de date sont des composants **contrôlés** : dans les formulaires, ils se branchent
  avec `useController` de React Hook Form, et non `register`.
- Plage bornée courte (un voyage) : tous les mois sont affichés l'un sous l'autre. Sinon
  (dates d'un voyage à créer) : un mois à la fois, avec des flèches.
