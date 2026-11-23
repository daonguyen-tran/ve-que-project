# ADR 0001 — Monorepo pnpm avec un paquet de domaine partagé

- **Statut** : accepté
- **Date** : 23/11/2026

## Contexte

L'application commence en PWA seule (v1), puis recevra un backend Node + PostgreSQL (v2).
Les deux devront appliquer les mêmes règles : validation des données, calcul des montants,
format d'export.

## Décision

Un monorepo pnpm (workspaces) :

- `apps/web` : la PWA ;
- `packages/domain` : entités, schémas Zod et règles métier pures ;
- plus tard `apps/api` : le backend, qui importera `@ve-que/domain`.

Le paquet de domaine est consommé directement en TypeScript (pas d'étape de build) : Vite et
Vitest le compilent à la volée.

## Conséquences

- Une seule source de vérité pour les types et la validation, côté client comme côté serveur.
- ESLint interdit au domaine d'importer React ou Dexie : il reste testable et portable.
- Légère complexité d'outillage (workspaces), acceptable pour un développeur à l'aise.
