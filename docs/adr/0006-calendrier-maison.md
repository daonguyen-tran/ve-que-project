# ADR 0006 — Sélecteurs maison pour toutes les dates et les heures

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

## Ajout du 24/11/2026 : les heures

Le champ heure du navigateur (`<input type="time">`) a un rendu très différent d'un appareil
à l'autre. Il est remplacé partout (trajets, activités, planification d'une idée, horaires
d'ouverture) par `TimeField` (`apps/web/src/shared/ui/time`), jumeau de `DateField`.

Après un premier essai en grilles de pastilles, on a retenu des **roues qui défilent**, comme
le sélecteur d'heure des téléphones (`Wheel`) :

- deux colonnes, heures et minutes (à la minute près), une bande de sélection commune ;
- défilement natif et arrêt sur une valeur par CSS `scroll-snap` : pas d'inertie maison.
  On lit la valeur centrée quand le défilement s'arrête (pas d'événement pendant 120 ms ;
  `scrollend` n'existe pas sur tous les navigateurs) ;
- chaque arrêt enregistre l'heure ; un champ vide s'ouvre sur 09:00 sans rien enregistrer,
  « Valider » garde l'heure affichée, « Effacer » vide les champs facultatifs ;
- au clavier, chaque roue est un `spinbutton` (flèches, Page précédente et suivante, Début, Fin).

Deux briques sont partagées avec le calendrier dans `apps/web/src/shared/ui/picker` :

| Brique           | Rôle                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| `picker-cell.ts` | Apparence des pastilles du calendrier et du panneau déplié                                            |
| `usePickerPanel` | Ouverture du panneau ; fermeture au toucher extérieur et avec Échap, sans fermer le formulaire autour |
