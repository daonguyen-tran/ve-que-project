import type { BaseEntity, TripScopedEntity } from './shared/entity';
import type { EntityId } from './shared/ids';

/**
 * **Pattern Repository** : le contrat d'accès aux données, indépendant du stockage.
 *
 * Le domaine et les cas d'usage ne connaissent que ces interfaces. L'implémentation actuelle
 * (Dexie / IndexedDB) vit dans `apps/web/src/infrastructure`. Le jour où le backend arrive, on
 * ajoute une implémentation qui synchronise avec l'API sans toucher au code métier ni à l'UI.
 *
 * Les lectures ne renvoient jamais les entités supprimées logiquement.
 */
export interface Repository<T extends BaseEntity> {
  getById(id: EntityId): Promise<T | undefined>;
  /** Crée ou remplace l'entité (« upsert »). L'appelant gère `updatedAt` via `updateEntity`. */
  save(entity: T): Promise<void>;
  saveMany(entities: readonly T[]): Promise<void>;
  /** Suppression logique (`deletedAt`), voir `markDeleted`. */
  remove(id: EntityId): Promise<void>;
}

export interface TripScopedRepository<T extends TripScopedEntity> extends Repository<T> {
  listByTrip(tripId: EntityId): Promise<T[]>;
}
