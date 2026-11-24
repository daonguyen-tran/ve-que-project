# ADR 0005 — Planning : on organise par étape, on relit jour par jour

- **Statut** : accepté (révisé le 24/11/2026)
- **Date** : 23/11/2026

## Contexte

L'onglet Planning affichait en permanence tous les outils de planification : « Ajouter une
étape », les cadres « nuits sans étape », « Ajouter le trajet vers… », les ajouts rapides dans
chaque créneau vide et les poignées de glisser-déposer. Pour quelqu'un qui veut simplement
revoir les étapes du séjour, l'interface était encombrée.

Deux essais ont précédé cette décision : un bouton global « Modifier » sur tout le planning,
puis ce même bouton limité à « Jour par jour ». Le mode édition rendait l'interface ambiguë
(« où suis-je ? ») ; il a été retiré.

## Décision

### Vue « Itinéraire » : organiser le voyage

- La frise des nuits est le seul endroit qui montre les nuits sans étape.
- Les étapes sont reliées comme une **feuille de route**, avec le trajet posé sur la ligne ;
  un trajet manquant reste proposé en gris clair.
- Un seul bouton **« Ajouter une étape »**, en bas ; le calendrier de sa fiche grise les nuits
  déjà prises (voir ADR 0006).

### Fiche d'une étape : organiser ses journées

On planifie naturellement par lieu (« qu'est-ce qu'on fait à Hoi An ? »). Sous l'hébergement
et les trajets, la fiche affiche le **programme** de l'étape (`StopProgram`) : une carte par
jour, du jour d'arrivée au jour de départ inclus, avec un « + Ajouter » discret par jour.
Les jours de transition figurent dans les deux étapes ; rien n'est dupliqué, car une activité
est rattachée à une date et non à une étape.

### Vue « Jour par jour » : un fil chronologique en lecture

- Liste des jours, puis programme d'un jour (trois côte à côte sur PC), **sans outil d'ajout
  ni glisser-déposer**. Chaque jour renvoie à la fiche de son étape pour être organisé.
- Toucher un élément ouvre quand même sa fiche : on peut corriger ou déplacer un élément
  (changer son jour ou son créneau) depuis n'importe où.
- Les jours hors étape ne sont visibles qu'ici ; on ne peut pas y ajouter d'activité.

## Conséquences

- Le contenu d'une journée a un seul rendu, partagé (`DayContent`) : seuls les créneaux
  remplis, le trajet du jour, « Rien de prévu ce jour-là » sinon.
- Le glisser-déposer et la dépendance `@dnd-kit` sont retirés. Le cas d'usage
  `PlannedItemService.move` reste disponible et testé.
