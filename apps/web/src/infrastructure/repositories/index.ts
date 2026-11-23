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
import type { VeQueDatabase } from '../db/database';
import { DexieRepository, DexieTripScopedRepository } from './dexie-repository';

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
}

/**
 * **Fabrique** (composition root) : le seul endroit qui sait que les données vivent dans Dexie.
 * Pour brancher le backend en v2, on fournira ici d'autres implémentations du même contrat.
 */
export function createRepositories(db: VeQueDatabase): Repositories {
  return {
    trips: new DexieRepository(db.trips),
    members: new DexieTripScopedRepository(db.members),
    stops: new DexieTripScopedRepository(db.stops),
    accommodations: new DexieTripScopedRepository(db.accommodations),
    transfers: new DexieTripScopedRepository(db.transfers),
    ideas: new DexieTripScopedRepository(db.ideas),
    plannedItems: new DexieTripScopedRepository(db.plannedItems),
    expenses: new DexieTripScopedRepository(db.expenses),
    wallets: new DexieTripScopedRepository(db.wallets),
    walletMovements: new DexieTripScopedRepository(db.walletMovements),
  };
}
