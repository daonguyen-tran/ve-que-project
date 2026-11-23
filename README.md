# Về Quê

> _Về quê_ : « rentrer au pays natal ».

Application web progressive (PWA) pour préparer puis vivre un voyage en famille au Vietnam :
itinéraire par étapes et par créneaux, banque d'idées, et un suivi des dépenses qui dit à tout
moment où est passé l'argent. Elle fonctionne **entièrement hors ligne**.

- Cahier des charges : [`docs/cahier-des-charges.md`](docs/cahier-des-charges.md)
- Produit (pour les outils de design) : [`PRODUCT.md`](PRODUCT.md)
- Design system « Billets en đồng » : [`DESIGN.md`](DESIGN.md)
- Décisions d'architecture : [`docs/adr/`](docs/adr)

## Démarrer (Windows, macOS ou Linux)

Prérequis : **Node.js 22 ou plus** et **pnpm 10**.

```powershell
# Une seule fois : activer pnpm (PowerShell en administrateur)
corepack enable
# ou, sans droits administrateur :
npm install -g pnpm@10

# Dans le dossier du projet
pnpm install
pnpm dev
```

L'appli s'ouvre sur <http://localhost:5173>. Pour la tester sur ton téléphone Android
(même Wi-Fi) : `pnpm dev --host`, puis ouvre l'adresse « Network » affichée.

> L'installation sur l'écran d'accueil et le mode hors ligne nécessitent **HTTPS** : teste-les
> sur la version déployée (Vercel), ou en local avec `pnpm build && pnpm preview`.

Pour voir l'écran « Aujourd'hui » terminé avec des données d'exemple : `/apercu`.

## Commandes

| Commande         | Rôle                                                              |
| ---------------- | ----------------------------------------------------------------- |
| `pnpm dev`       | Serveur de développement                                          |
| `pnpm build`     | Vérification des types puis build de production (`apps/web/dist`) |
| `pnpm preview`   | Sert le build, service worker compris                             |
| `pnpm test`      | Tous les tests (domaine + web)                                    |
| `pnpm typecheck` | Vérification TypeScript de tous les paquets                       |
| `pnpm lint`      | ESLint                                                            |
| `pnpm format`    | Prettier                                                          |
| `pnpm check`     | Types + lint + tests : à lancer avant chaque commit               |

## Structure

```
ve-que/
├─ apps/web/                 PWA React (Vite, Tailwind, Dexie)
│  └─ src/
│     ├─ app/                démarrage, routes, ossature (navigation), injection des dépendances
│     ├─ features/<module>/  un dossier par fonctionnalité (today, planning, ideas, expenses…)
│     ├─ infrastructure/     base IndexedDB, repositories, PWA, stockage persistant
│     ├─ shared/             composants d'interface, utilitaires, textes (i18n)
│     └─ styles/             jetons du design system (Tailwind @theme)
├─ packages/domain/          règles métier pures, partagées avec le futur backend
├─ docs/                     cahier des charges, ADR
└─ .claude/skills/           skills de design pour Claude (impeccable, emil-design-eng…)
```

### Les règles de l'architecture

1. **Le domaine est pur.** `packages/domain` ne dépend ni de React, ni de Dexie, ni du
   navigateur (ESLint le vérifie). Toute règle métier (calcul, validation) y vit, avec ses tests.
2. **Les écrans ne lisent pas la base directement.** Ils passent par `useRepositories()`,
   qui fournit les implémentations du contrat `Repository` du domaine.
3. **Les montants sont des entiers** dans l'unité mineure de leur devise (`Money`).
4. **Aucun texte en dur** dans les composants : tout passe par `shared/i18n/fr.ts`.
5. **Aucune couleur en dur** : uniquement les jetons de `styles/index.css` (`bg-laque`, `text-muted`…).

### Ajouter une fonctionnalité : suivre le modèle « voyages »

`apps/web/src/features/trips/` est **l'exemple de référence**. Une nouvelle fonctionnalité
(étapes, idées, dépenses…) reprend la même structure :

| Fichier                   | Rôle                                                             | Exemple                                                 |
| ------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------- |
| `packages/domain/src/…`   | Schéma de l'entité et **règles pures**, testées                  | `trip/trip-rules.ts` (`buildNewTrip`, `pickActiveTrip`) |
| `services/<x>-service.ts` | **Cas d'usage** : orchestre domaine + repositories, transactions | `TripService.createTrip`                                |
| `hooks/use-<x>.ts`        | Lecture **en direct** (`useLiveQuery`) et accès au service       | `useTrip`, `useMembers`, `useTripService`               |
| `<x>-form-schemas.ts`     | Schémas Zod **de formulaire** et messages d'erreur               | `newTripFormSchema`                                     |
| `components/`             | Morceaux d'écran réutilisables, panneaux (`Sheet`)               | `MembersSection`, `EditTripSheet`                       |
| `pages/`                  | Écrans branchés sur une route                                    | `NewTripPage`, `TripDetailPage`                         |
| `*.test.ts(x)`            | Tests du service (base en mémoire) et du formulaire              | `trip-service.test.ts`                                  |

Puis : textes dans `shared/i18n/fr.ts`, route dans `app/router.tsx`, et `pnpm check`.

Composants partagés disponibles : `TextField`, `DateField`, `SelectField`
(`shared/ui/form/fields.tsx`), `Sheet` (panneau modal), `ConfirmSheet`, `Button` /
`ButtonLink`, `PageHeader`, `BrandHeader`, `EmptyState`, `Amount`. Le voyage affiché se lit
avec `useActiveTrip()`, et ce que sait faire l'appareil avec `useCapabilities()`.

## Déployer sur Vercel

1. Pousse le dépôt sur GitHub.
2. Sur Vercel : _Add New Project_, importe le dépôt, puis règle **Root Directory = `apps/web`**.
   Le reste (pnpm, commande de build, réécritures pour les routes) est lu dans
   `apps/web/vercel.json`.
3. Chaque push sur `main` redéploie. Sur le téléphone, ouvre l'URL dans Chrome, puis
   _Ajouter à l'écran d'accueil_.

## Données

Tout est stocké sur l'appareil, dans IndexedDB. L'appli demande au navigateur un stockage
persistant pour qu'Android ne l'efface pas. Le transfert PC ↔ téléphone (export/import JSON)
arrive en phase 1, la synchronisation automatique avec un backend en v2.
