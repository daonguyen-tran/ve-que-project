import {
  BACKUP_TABLES,
  emptyBackupData,
  type BackupData,
  type BackupEntity,
  type BackupTable,
  type ImportPlan,
  type TableImportPlan,
} from '@ve-que/domain';
import type { Table } from 'dexie';
import type { VeQueDatabase } from '../db/database';

/**
 * Accès « brut » à la base pour la sauvegarde.
 *
 * Contrairement aux repositories, qui cachent les entités supprimées, la sauvegarde a besoin de
 * **tout** lire, pierres tombales comprises, et d'écrire des lots entiers d'un coup. Ce besoin
 * est propre à l'infrastructure : on l'expose par une interface dédiée plutôt que d'élargir le
 * contrat `Repository` du domaine.
 */
export interface BackupStore {
  readAll(): Promise<BackupData>;
  /** Applique un plan de fusion (créations et mises à jour) en une seule transaction. */
  applyPlan(plan: ImportPlan): Promise<void>;
  /** Remplace **toutes** les données du voyage par celles fournies (les réglages sont gardés). */
  replaceAll(data: BackupData): Promise<void>;
}

export function createBackupStore(db: VeQueDatabase): BackupStore {
  // Les noms de tables de la sauvegarde sont exactement ceux de la base (voir database.ts).
  const table = (name: BackupTable) => db.table(name) as Table<BackupEntity, string>;
  const dataTables = () => BACKUP_TABLES.map(table);

  return {
    async readAll() {
      const data = emptyBackupData() as Record<BackupTable, BackupEntity[]>;
      await db.transaction('r', dataTables(), async () => {
        for (const name of BACKUP_TABLES) data[name] = await table(name).toArray();
      });
      return data as unknown as BackupData;
    },

    async applyPlan(plan) {
      await db.transaction('rw', dataTables(), async () => {
        for (const name of BACKUP_TABLES) {
          const { create, update } = plan[name] as TableImportPlan<BackupEntity>;
          await table(name).bulkPut([...create, ...update]);
        }
      });
    },

    async replaceAll(data) {
      await db.transaction('rw', dataTables(), async () => {
        for (const name of BACKUP_TABLES) {
          await table(name).clear();
          await table(name).bulkPut(data[name] as BackupEntity[]);
        }
      });
    },
  };
}
