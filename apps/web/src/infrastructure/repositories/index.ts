import type {
  Accommodation,
  Expense,
  Idea,
  Member,
  PlannedItem,
  Stop,
  Transfer,
  Trip,
  TripScopedRepository,
  Wallet,
  WalletMovement,
} from '@ve-que/domain';
import { createBackupStore, type BackupStore } from '../backup/backup-store';
import type { VeQueDatabase } from '../db/database';
import { DexieRepository, DexieTripScopedRepository } from './dexie-repository';
import { createSettingsStore, type SettingsStore } from './settings-store';

/** Ensemble des repositories de l'application, typés par leur contrat du domaine. */
export interface Repositories {
  trips: DexieRepository<Trip>;
  members: TripScopedRepository<Member>;
  stops: TripScopedRepository<Stop>;
  accommodations: TripScopedRepository<Accommodation>;
  transfers: TripScopedRepository<Transfer>;
  ideas: TripScopedRepository<Idea>;
  plannedItems: TripScopedRepository<PlannedItem>;
  expenses: TripScopedRepository<Expense>;
  wallets: TripScopedRepository<Wallet>;
  walletMovements: TripScopedRepository<WalletMovement>;
  settings: SettingsStore;
  /** Lecture et écriture en bloc de toutes les données, pour l'export/import (F-15). */
  backup: BackupStore;
  /**
   * Exécute plusieurs écritures **tout ou rien** (pattern *Unit of Work*).
   * Exemple : créer un voyage et ses membres. Si une écriture échoue, aucune n'est conservée ;
   * sans transaction, une erreur au milieu laisserait un voyage sans membre « Moi ».
   */
  transaction<T>(work: () => Promise<T>): Promise<T>;
}

/**
 * **Fabrique** (composition root) : le seul endroit qui sait que les données vivent dans Dexie.
 * Pour brancher le backend en v2, on fournira ici d'autres implémentations du même contrat.
 */
export function createRepositories(
  db: VeQueDatabase,
  /**
   * Horloge des suppressions logiques. Elle doit être **la même** que celle des services :
   * la fusion des sauvegardes compare les dates, et une suppression datée par une autre
   * horloge pourrait sembler antérieure à la création qu'elle annule.
   */
  clock: () => Date = () => new Date(),
): Repositories {
  return {
    trips: new DexieRepository(db.trips, clock),
    members: new DexieTripScopedRepository(db.members, clock),
    stops: new DexieTripScopedRepository(db.stops, clock),
    accommodations: new DexieTripScopedRepository(db.accommodations, clock),
    transfers: new DexieTripScopedRepository(db.transfers, clock),
    ideas: new DexieTripScopedRepository(db.ideas, clock),
    plannedItems: new DexieTripScopedRepository(db.plannedItems, clock),
    expenses: new DexieTripScopedRepository(db.expenses, clock),
    wallets: new DexieTripScopedRepository(db.wallets, clock),
    walletMovements: new DexieTripScopedRepository(db.walletMovements, clock),
    settings: createSettingsStore(db),
    backup: createBackupStore(db),
    // Dexie rattache automatiquement à la transaction toutes les opérations lancées depuis
    // `work`, même à travers nos repositories : il suffit d'y lister les tables concernées.
    transaction: (work) => db.transaction('rw', db.tables, work),
  };
}
