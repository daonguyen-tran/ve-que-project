# ADR 0003 — Montants en entiers et taux de change figé

- **Statut** : accepté
- **Date** : 23/11/2026

## Contexte

Les montants en đồng ont 5 à 7 chiffres, ceux en euros des centimes. Les nombres à virgule
flottante produisent des erreurs d'arrondi (`0.1 + 0.2 !== 0.3`) qui faussent les totaux.

## Décision

- Un montant est un `Money = { amountMinor: entier, currency }`, dans l'unité mineure de la
  devise (centimes pour l'euro, đồng pour le VND).
- Les fonctions de calcul (`Money.add`, `allocateEvenly`…) sont pures et refusent de mélanger
  deux devises.
- La conversion est le seul passage par les flottants, avec un arrondi unique.
- Chaque dépense stocke le taux utilisé et son équivalent en euros au moment de la saisie :
  l'historique ne change pas quand le cours évolue.

## Conséquences

- Totaux exacts, répartitions sans perte (`allocateEvenly`).
- L'affichage passe toujours par `formatMoney` / `formatCompact`.
