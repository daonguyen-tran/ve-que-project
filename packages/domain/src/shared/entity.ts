import { z } from 'zod';
import { newId } from './ids';

/**
 * Champs communs à toutes les entités persistées.
 *
 * Ils préparent la future synchronisation avec le backend (v2) :
 * - `updatedAt` permet de savoir quelle version d'un enregistrement est la plus récente
 *   (stratégie « dernière écriture gagnante ») et de ne demander au serveur que ce qui a changé ;
 * - `deletedAt` implémente la **suppression logique** : on ne retire jamais physiquement une
 *   ligne, sinon le serveur ne pourrait pas apprendre qu'elle a été supprimée sur le téléphone.
 *
 * Les dates sont des instants ISO 8601 en UTC (`2027-07-14T09:30:00.000Z`).
 */
export const baseEntitySchema = z.object({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  deletedAt: z.iso.datetime().nullable(),
});

export type BaseEntity = z.infer<typeof baseEntitySchema>;

/** Toute entité rattachée à un voyage. */
export const tripScopedSchema = baseEntitySchema.extend({
  tripId: z.uuid(),
});

export type TripScopedEntity = z.infer<typeof tripScopedSchema>;

/** Les champs que le code appelant fournit à la création (le reste est géré ici). */
export type NewEntity<T extends BaseEntity> = Omit<T, keyof BaseEntity>;

/** Fabrique : ajoute identifiant et horodatages à des données métier. */
export function createEntity<T extends BaseEntity>(data: NewEntity<T>, now: Date = new Date()): T {
  const timestamp = now.toISOString();
  return {
    ...data,
    id: newId(),
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  } as T;
}

/** Applique des modifications et met à jour `updatedAt`, sans muter l'entité d'origine. */
export function updateEntity<T extends BaseEntity>(
  entity: T,
  changes: Partial<NewEntity<T>>,
  now: Date = new Date(),
): T {
  return { ...entity, ...changes, updatedAt: now.toISOString() };
}

/** Suppression logique. */
export function markDeleted<T extends BaseEntity>(entity: T, now: Date = new Date()): T {
  const timestamp = now.toISOString();
  return { ...entity, deletedAt: timestamp, updatedAt: timestamp };
}

export function isAlive(entity: BaseEntity): boolean {
  return entity.deletedAt === null;
}
