# ADR 0002 — Offline-first : IndexedDB (Dexie) derrière le pattern Repository

- **Statut** : accepté
- **Date** : 23/11/2026

## Contexte

Sur place, le réseau est intermittent (villages, trajets, île). Toute saisie doit fonctionner
sans connexion. Un backend arrivera plus tard, sans qu'on sache encore exactement comment.

## Décision

- **IndexedDB est la source de vérité** de l'interface, via Dexie (`useLiveQuery` rend l'UI
  réactive aux écritures).
- L'accès aux données passe par les interfaces `Repository` / `TripScopedRepository` du
  domaine. L'implémentation Dexie vit dans `apps/web/src/infrastructure`, et elle est injectée
  aux écrans par un contexte React (`useRepositories`).
- Préparation de la synchronisation dès la v1 : identifiants UUID v7 générés sur l'appareil,
  `updatedAt` sur chaque entité, suppression logique (`deletedAt`).

## Conséquences

- La v2 ajoutera une implémentation synchronisée des mêmes contrats, sans modifier les écrans.
- Les migrations de schéma se font par versions Dexie successives ; une version publiée n'est
  jamais modifiée.
- La suppression logique impose de filtrer `deletedAt` à la lecture (fait dans
  `DexieRepository`).
