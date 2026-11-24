# ADR 0009 — Suggestions de lieux pour le nom d'une étape

- **Statut** : accepté
- **Date** : 24/11/2026

## Contexte

Saisir le nom d'une étape à la main est lent et source d'erreurs (accents vietnamiens,
orthographes multiples : Saïgon, Hô Chi Minh-Ville…). Choisir un lieu dans une liste permet en
plus de remplir le nom vietnamien, le type d'étape et la position GPS, utiles à la carte et à la
future météo par étape. L'appli doit rester utilisable hors ligne.

## Décision

Trois sources de suggestions, séparées dans le code (une responsabilité par fichier) :

| Source         | Fichier                                                                                                                | Hors ligne | Contenu                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------- |
| Liste intégrée | `features/localities/sources/builtin-localities.ts` (données : `packages/domain/src/localities/vietnam-localities.ts`) | oui        | ~60 grandes villes et lieux touristiques |
| Mes lieux      | `features/localities/sources/saved-localities.ts` (table Dexie `localities`)                                           | oui        | lieux enregistrés par l'utilisateur      |
| En ligne       | `infrastructure/geocoding/photon-locality-search.ts`                                                                   | non        | tout OpenStreetMap, via Photon           |

- La recherche locale (sans accents, classée par pertinence) est une règle pure du domaine
  (`matchLocalities`), testée à part. La même clé de recherche (`searchKey`) sert à la banque
  d'idées.
- Le hook `useLocalitySuggestions` assemble les trois sources et retire les doublons
  (`mergeSuggestions`) : mes lieux, puis la liste intégrée, puis le service en ligne.
- Le champ `LocalityNameField` suit le motif ARIA « combobox » ; choisir une suggestion reste
  facultatif.
- **« Mes lieux »** : un lieu trouvé en ligne est retenu d'office à l'enregistrement de
  l'étape (il sera proposé ensuite, même hors ligne) ; un nom saisi à la main ne l'est que si
  l'on coche « Retenir ce lieu ». Les lieux ne sont rattachés à aucun voyage et font partie de
  la sauvegarde (table `localities`, facultative pour lire les anciennes sauvegardes).

## Pourquoi Photon et pas Nominatim

La politique d'usage du serveur public de Nominatim interdit l'autocomplétion (il reste utilisé
pour la recherche explicite de la carte, ADR 0008). Photon, géocodeur libre fondé sur les
mêmes données OpenStreetMap, est conçu pour la recherche au fil de la frappe. Son serveur public
est gratuit pour un usage raisonnable : 3 lettres minimum, 300 ms d'attente après la dernière
frappe, requête précédente annulée, résultats limités au Vietnam. Si le service disparaît ou
devient payant, seul l'adaptateur change (interface `OnlineLocalitySearch`).

## Conséquences

- Base Dexie en version 2 (nouvelle table, sans migration de données).
- Les tests n'appellent jamais le réseau : `fetch` échoue par défaut (`test-setup.ts`) et la
  recherche en ligne est injectée (fausse recherche).
- À venir : un écran « Mes lieux » pour corriger ou supprimer les lieux enregistrés.
