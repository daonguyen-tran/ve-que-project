# ADR 0010 — Des journées sans créneaux : l'heure suffit

- **Statut** : accepté
- **Date** : 24/11/2026

## Contexte

Chaque journée était découpée en trois créneaux (matin, après-midi, soir) : chaque élément du
programme portait un `slot`, les écrans affichaient un intercalaire par créneau, et les
formulaires demandaient de choisir un créneau en plus de l'heure. À l'usage, ces intercalaires
alourdissaient la fiche d'une étape et faisaient double emploi avec l'heure : une activité à
19 h 30 est, par définition, le soir.

## Décision

- **Le modèle n'a plus de créneau.** `PlannedItem` perd `slot` ; `time` (facultative) situe
  l'élément dans la journée. `position` devient le **rang d'ajout dans la journée**.
- **Ordre d'une journée** (`compareInDay`, domaine) : d'abord les éléments avec une heure, par
  heure croissante ; puis ceux sans heure, par rang d'ajout ; à égalité, ancienneté puis
  identifiant (ordre total, stable entre appareils).
- **Ajouter ou changer de jour** place l'élément après les autres de ce jour (`nextPosition`).
  Aucun autre élément n'est réécrit : plus de renumérotation, donc moins d'écritures et de
  conflits de synchronisation. Le cas d'usage « déplacer » (`move`) et `planMove` disparaissent :
  on déplace un élément en changeant son jour ou son heure dans sa fiche.
- **Horaires d'ouverture** : sans heure, une idée est « ouverte » si elle l'est à un moment de
  la journée (de 6 h à minuit).
- **Écrans** : la fiche d'une étape et « Jour par jour » listent les éléments sans intercalaires,
  l'heure en tête de ligne ; la vue d'ensemble des jours dit « 3 prévus » / « Temps libre » /
  « À prévoir » au lieu de la jauge à trois segments ; « Aujourd'hui » met l'heure en tête de
  ligne et garde le curcuma pour l'activité en cours ; idées et carte disent « Prévu J5 · 19 h 30 ».

## Migration

Un ancien programme garde son ordre : chaque journée est renumérotée dans l'ancien ordre
d'affichage (matin, après-midi, soir, puis rang), et `slot` est retiré (`dropLegacySlots`).

- Base locale : version 3 de Dexie, `upgrade` au premier lancement (aucun index ne change).
- Sauvegardes JSON : format 2 ; un fichier au format 1 est migré à l'import.

## Conséquences

- Un élément sans heure prévu « le soir » apparaît désormais après les éléments horodatés de
  la journée. Donner une heure, même approximative, suffit à le placer.
- Le futur « J'ai du temps libre » (F-3.4) s'appuiera sur l'heure et la durée des éléments,
  et non plus sur les créneaux.
