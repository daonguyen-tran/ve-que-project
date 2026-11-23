import type { EntityTable, IDType } from 'dexie';
import {
  isAlive,
  markDeleted,
  type BaseEntity,
  type EntityId,
  type Repository,
  type TripScopedEntity,
  type TripScopedRepository,
} from '@ve-que/domain';

/**
 * Implémentation générique du contrat `Repository` du domaine sur une table Dexie.
 *
 * Toutes les lectures écartent les entités supprimées logiquement. Appelées à l'intérieur de
 * `useLiveQuery`, ces méthodes rendent l'UI réactive : Dexie observe les tables lues et
 * relance la requête dès qu'une écriture les touche (pattern **Observer**, géré par Dexie).
 */
export class DexieRepository<T extends BaseEntity> implements Repository<T> {
  constructor(
    protected readonly table: EntityTable<T, 'id'>,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async getById(id: EntityId): Promise<T | undefined> {
    const entity = await this.table.get(this.key(id));
    return entity && isAlive(entity) ? entity : undefined;
  }

  async save(entity: T): Promise<void> {
    await this.table.put(entity);
  }

  async saveMany(entities: readonly T[]): Promise<void> {
    await this.table.bulkPut([...entities]);
  }

  async remove(id: EntityId): Promise<void> {
    const entity = await this.table.get(this.key(id));
    if (entity && isAlive(entity)) {
      await this.table.put(markDeleted(entity, this.clock()));
    }
  }

  /**
   * Dexie type la clé primaire d'une table générique de façon trop abstraite pour accepter
   * une simple chaîne. Toutes nos clés sont des UUID (`EntityId`) : la conversion est sûre.
   */
  private key(id: EntityId): IDType<T, 'id'> {
    return id as IDType<T, 'id'>;
  }

  /** Toutes les entités vivantes de la table. */
  async listAll(): Promise<T[]> {
    return (await this.table.toArray()).filter(isAlive);
  }
}

/** Variante pour les entités rattachées à un voyage : ajoute `listByTrip` via l'index `tripId`. */
export class DexieTripScopedRepository<T extends TripScopedEntity>
  extends DexieRepository<T>
  implements TripScopedRepository<T>
{
  async listByTrip(tripId: EntityId): Promise<T[]> {
    // `where` sur un champ générique : Dexie ne peut pas typer l'index à partir de `T`.
    const rows = await this.table
      .where('tripId' as never)
      .equals(tripId)
      .toArray();
    return rows.filter(isAlive);
  }
}
