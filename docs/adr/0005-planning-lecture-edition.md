# ADR 0005 — Planning : un récapitulatif avant tout

- **Statut** : accepté (révisé le 23/11/2026)
- **Date** : 23/11/2026

## Contexte

L'onglet Planning affichait en permanence tous les outils de planification : « Ajouter une
étape », les cadres « nuits sans étape », « Ajouter le trajet vers… », les ajouts rapides dans
chaque créneau vide et les poignées de glisser-déposer. Pour quelqu'un qui veut simplement
revoir les étapes du séjour, l'interface était encombrée.

Une première version ajoutait un bouton global « Modifier » aux deux vues. À l'usage,
l'utilisateur a préféré une solution plus directe pour l'itinéraire.

## Décision

### Vue « Itinéraire » : pas de mode édition

- La frise des nuits est le seul endroit qui montre les nuits sans étape ; la liste ne les
  répète plus.
- Les étapes sont reliées comme une **feuille de route** : une ligne pointillée sous les
  dates, avec le trajet posé dessus. Un trajet manquant reste proposé en gris clair
  (« + Trajet vers Hoi An »), sans attirer l'œil.
- Un seul bouton **« Ajouter une étape »**, en bas de la liste. Sa fiche propose les premières
  nuits libres, et son calendrier grise les nuits déjà prises (voir ADR 0006) : les
  chevauchements deviennent impossibles à saisir au lieu d'être refusés après coup.
- « Aucun hébergement » reste affiché sur la carte d'une étape, en gris clair ; le détail se
  règle sur la fiche de l'étape.

### Vue « Jour par jour » : mode lecture / édition (provisoire)

- Le programme s'ouvre en lecture : seuls les créneaux remplis, sans poignée ni ajout.
- Le bouton « Modifier » (devenu « Terminé ») fait apparaître les outils. Il n'est affiché
  que dans cette vue.
- Cette vue sera retravaillée ensuite ; le mode édition pourra y être remplacé.

## Mise en œuvre

- Le mode est un contexte React (`features/planning/edit-mode`) fourni par `AppShell`,
  au-dessus des routes : il survit aux passages entre les écrans du planning et revient en
  lecture dès qu'on quitte le planning. Un paramètre d'URL a été écarté : il se serait perdu
  au retour de la fiche d'une étape.
- Programme d'un jour : `DayRecap` en lecture, `DayBoard` en édition, mêmes données.
