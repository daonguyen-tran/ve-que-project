import Dexie, { type EntityTable } from 'dexie';
import type {
  Accommodation,
  Expense,
  Idea,
  Locality,
  Member,
  PlannedItem,
  Stop,
  Transfer,
  Trip,
  Wallet,
  WalletMovement,
} from '@ve-que/domain';

/** Paire clé/valeur pour les réglages et les caches techniques (taux, météo, dernier export). */
export interface KeyValueRecord {
  key: string;
  value: unknown;
  updatedAt: string;
}

/**
 * Base IndexedDB de l'application, via Dexie.
 *
 * Lecture du schéma Dexie (`stores`) : pour chaque table, une chaîne d'index séparés par des
 * virgules. Le **premier** est la clé primaire, les suivants sont des index secondaires ;
 * `[tripId+date]` est un **index composé**, qui sert aux requêtes « toutes les dépenses de ce
 * voyage pour ce jour » sans parcourir toute la table. On n'indexe que ce qu'on interroge ;
 * les autres champs sont stockés quand même.
 *
 * Évolution du schéma : ne **jamais** modifier une version publiée. On ajoute
 * `this.version(2).stores({...}).upgrade(tx => ...)` : Dexie rejoue les migrations dans l'ordre
 * sur les appareils qui ont une ancienne base (NF-6).
 *
 * Remarque : IndexedDB n'indexe pas les valeurs `null`, d'où le filtrage de `deletedAt` en
 * JavaScript dans les repositories plutôt que par index.
 */
export class VeQueDatabase extends Dexie {
  trips!: EntityTable<Trip, 'id'>;
  members!: EntityTable<Member, 'id'>;
  stops!: EntityTable<Stop, 'id'>;
  accommodations!: EntityTable<Accommodation, 'id'>;
  transfers!: EntityTable<Transfer, 'id'>;
  ideas!: EntityTable<Idea, 'id'>;
  plannedItems!: EntityTable<PlannedItem, 'id'>;
  expenses!: EntityTable<Expense, 'id'>;
  wallets!: EntityTable<Wallet, 'id'>;
  walletMovements!: EntityTable<WalletMovement, 'id'>;
  /** « Mes lieux » : localités enregistrées par l'utilisateur, communes à tous les voyages. */
  localities!: EntityTable<Locality, 'id'>;
  keyValues!: EntityTable<KeyValueRecord, 'key'>;

  constructor(name = 've-que') {
    super(name);

    this.version(1).stores({
      trips: 'id, startDate, updatedAt',
      members: 'id, tripId, updatedAt',
      stops: 'id, tripId, [tripId+arrivalDate], updatedAt',
      accommodations: 'id, tripId, stopId, updatedAt',
      transfers: 'id, tripId, [tripId+departDate], updatedAt',
      ideas: 'id, tripId, [tripId+city], updatedAt',
      plannedItems: 'id, tripId, [tripId+date], ideaId, updatedAt',
      expenses: 'id, tripId, [tripId+date], walletId, payerId, updatedAt',
      wallets: 'id, tripId, updatedAt',
      walletMovements: 'id, tripId, [tripId+date], updatedAt',
      keyValues: 'key',
    });

    // v2 : ajout de « mes lieux » (suggestions de noms d'étape). Une nouvelle table vide ne
    // demande aucune migration des données existantes : pas de `upgrade`.
    this.version(2).stores({
      localities: 'id, updatedAt',
    });
  }
}
