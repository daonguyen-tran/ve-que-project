import { z } from 'zod';
import { expenseSchema, walletMovementSchema, walletSchema } from '../expenses/expense';
import { ideaSchema } from '../itinerary/idea';
import {
  accommodationSchema,
  plannedItemSchema,
  stopSchema,
  transferSchema,
} from '../itinerary/itinerary';
import { localitySchema } from '../localities/locality';
import { memberSchema, tripSchema } from '../trip/trip';

/*
 * Format de sauvegarde de Về Quê (F-15.1, F-15.2).
 *
 * Un fichier de sauvegarde est un JSON autonome qui contient toutes les entités, **y compris
 * celles supprimées logiquement** (`deletedAt` renseigné). Ces « pierres tombales » permettent
 * de propager une suppression : si tu supprimes une étape sur le PC puis importes le fichier
 * sur le téléphone, l'étape disparaît aussi là-bas. C'est exactement le mécanisme qu'utilisera
 * la synchronisation automatique de la v2.
 */

export const BACKUP_FORMAT = 've-que-backup';

/**
 * Version du format. À **incrémenter** dès qu'un changement des entités rend les anciens
 * fichiers incompatibles, en ajoutant la migration correspondante dans `MIGRATIONS`.
 */
export const CURRENT_BACKUP_VERSION = 1;

/** Tables sauvegardées, dans l'ordre où l'on peut les écrire (les parents avant les enfants). */
export const BACKUP_TABLES = [
  'trips',
  'members',
  'stops',
  'accommodations',
  'transfers',
  'ideas',
  'plannedItems',
  'expenses',
  'wallets',
  'walletMovements',
  'localities',
] as const;
export type BackupTable = (typeof BACKUP_TABLES)[number];

/**
 * Tables qui n'appartiennent à aucun voyage (« mes lieux ») : elles suivent l'utilisateur et
 * restent entières quand on n'exporte que certains voyages.
 */
const PERSONAL_TABLES: ReadonlySet<BackupTable> = new Set(['localities']);

const backupDataSchema = z.object({
  trips: z.array(tripSchema).default([]),
  members: z.array(memberSchema).default([]),
  stops: z.array(stopSchema).default([]),
  accommodations: z.array(accommodationSchema).default([]),
  transfers: z.array(transferSchema).default([]),
  ideas: z.array(ideaSchema).default([]),
  plannedItems: z.array(plannedItemSchema).default([]),
  expenses: z.array(expenseSchema).default([]),
  wallets: z.array(walletSchema).default([]),
  walletMovements: z.array(walletMovementSchema).default([]),
  // Absente des sauvegardes faites avant « mes lieux » : la valeur par défaut les garde valides.
  localities: z.array(localitySchema).default([]),
});

/** Contenu d'une sauvegarde : une liste d'entités par table. */
export type BackupData = z.infer<typeof backupDataSchema>;
/** Une entité de n'importe quelle table sauvegardée. */
export type BackupEntity = BackupData[BackupTable][number];

export const backupFileSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  schemaVersion: z.literal(CURRENT_BACKUP_VERSION),
  exportedAt: z.iso.datetime(),
  data: backupDataSchema,
});
export type BackupFile = z.infer<typeof backupFileSchema>;

export function emptyBackupData(): BackupData {
  return Object.fromEntries(BACKUP_TABLES.map((table) => [table, []])) as unknown as BackupData;
}

export function createBackupFile(data: BackupData, now: Date = new Date()): BackupFile {
  return {
    format: BACKUP_FORMAT,
    schemaVersion: CURRENT_BACKUP_VERSION,
    exportedAt: now.toISOString(),
    data,
  };
}

/**
 * Ne garde que les voyages demandés et ce qui leur appartient (chaque entité enfant porte un
 * `tripId`). Sert à exporter un seul voyage.
 */
export function filterBackupByTrips(data: BackupData, tripIds: readonly string[]): BackupData {
  const keep = new Set(tripIds);
  const filtered = emptyBackupData() as Record<BackupTable, BackupEntity[]>;
  for (const table of BACKUP_TABLES) {
    filtered[table] = (data[table] as BackupEntity[]).filter((entity) =>
      PERSONAL_TABLES.has(table)
        ? true
        : table === 'trips'
          ? keep.has(entity.id)
          : keep.has((entity as { tripId: string }).tripId),
    );
  }
  return filtered as unknown as BackupData;
}

/*
 * Migrations : une fonction par version, qui transforme un fichier de la version N en
 * version N + 1. `readBackup` les enchaîne jusqu'à la version courante. Aucune pour l'instant ;
 * exemple futur : `1: (raw) => ({ ...raw, schemaVersion: 2, data: { ...raw.data, places: [] } })`.
 */
type RawBackup = { format?: unknown; schemaVersion?: unknown; [key: string]: unknown };
const MIGRATIONS: Record<number, (raw: RawBackup) => RawBackup> = {};

export type BackupReadError =
  | { code: 'not_json' }
  | { code: 'not_a_backup' }
  | { code: 'too_new'; version: number }
  | { code: 'invalid'; issueCount: number; firstPath: string };

/**
 * Lit le texte d'un fichier et renvoie une sauvegarde **valide** ou la raison du refus.
 * Rien n'est jamais importé sans être passé par les schémas Zod des entités : un fichier
 * modifié à la main ou corrompu ne peut pas introduire de données invalides dans la base.
 */
export type BackupReadResult =
  { ok: true; value: BackupFile } | { ok: false; error: BackupReadError };

export function readBackup(text: string): BackupReadResult {
  const fail = (error: BackupReadError): BackupReadResult => ({ ok: false, error });

  let raw: RawBackup;
  try {
    raw = JSON.parse(text) as RawBackup;
  } catch {
    return fail({ code: 'not_json' });
  }
  if (typeof raw !== 'object' || raw === null || raw.format !== BACKUP_FORMAT) {
    return fail({ code: 'not_a_backup' });
  }

  let version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0;
  if (version > CURRENT_BACKUP_VERSION) return fail({ code: 'too_new', version });
  while (version < CURRENT_BACKUP_VERSION) {
    const migrate = MIGRATIONS[version];
    if (!migrate) return fail({ code: 'not_a_backup' });
    raw = migrate(raw);
    version += 1;
  }

  const parsed = backupFileSchema.safeParse(raw);
  if (!parsed.success) {
    const [first] = parsed.error.issues;
    return fail({
      code: 'invalid',
      issueCount: parsed.error.issues.length,
      firstPath: first?.path.join('.') ?? '',
    });
  }
  return { ok: true, value: parsed.data };
}

/** Ce que l'import fera pour une table. */
export interface TableImportPlan<T> {
  /** Entités absentes de cet appareil. */
  create: T[];
  /** Entités présentes, mais dont la version du fichier est plus récente. */
  update: T[];
  /** Entités du fichier identiques ou plus anciennes que celles de l'appareil : ignorées. */
  skipped: number;
}

export type ImportPlan = { [K in BackupTable]: TableImportPlan<BackupData[K][number]> };

export interface ImportSummary {
  created: number;
  updated: number;
  /** Parmi les créations/mises à jour : celles qui suppriment un élément sur cet appareil. */
  deleted: number;
  skipped: number;
}

/**
 * Prépare une **fusion** sans rien écrire : pour chaque entité du fichier, on compare avec
 * celle de l'appareil (même identifiant) et la plus récente gagne (`updatedAt`), stratégie
 * dite « dernière écriture gagnante ». À égalité, on garde celle de l'appareil.
 *
 * Les identifiants étant des UUID générés à la création, la même entité a le même `id` sur
 * le PC et sur le téléphone : c'est ce qui rend la comparaison possible.
 * Complexité : O(n) par table grâce à un index (Map) des entités locales.
 */
export function planImport(local: BackupData, incoming: BackupData): ImportPlan {
  const plan = {} as Record<BackupTable, TableImportPlan<BackupEntity>>;
  for (const table of BACKUP_TABLES) {
    const localById = new Map(
      (local[table] as BackupEntity[]).map((entity) => [entity.id, entity]),
    );
    const tablePlan: TableImportPlan<BackupEntity> = { create: [], update: [], skipped: 0 };
    for (const entity of incoming[table] as BackupEntity[]) {
      const existing = localById.get(entity.id);
      if (!existing) tablePlan.create.push(entity);
      else if (entity.updatedAt > existing.updatedAt) tablePlan.update.push(entity);
      else tablePlan.skipped += 1;
    }
    plan[table] = tablePlan;
  }
  return plan as unknown as ImportPlan;
}

export function summarizePlan(plan: ImportPlan): ImportSummary {
  const summary: ImportSummary = { created: 0, updated: 0, deleted: 0, skipped: 0 };
  for (const table of BACKUP_TABLES) {
    const { create, update, skipped } = plan[table] as TableImportPlan<BackupEntity>;
    summary.created += create.filter((entity) => entity.deletedAt === null).length;
    summary.updated += update.filter((entity) => entity.deletedAt === null).length;
    summary.deleted += update.filter((entity) => entity.deletedAt !== null).length;
    // Une entité supprimée qu'on ne connaissait pas est enregistrée (pour la synchronisation),
    // mais elle ne change rien de visible : elle n'est comptée nulle part.
    summary.skipped += skipped;
  }
  return summary;
}

export type TripImportStatus = 'new' | 'updated' | 'unchanged' | 'deleted';

/** État de chaque voyage du fichier par rapport à cet appareil, pour l'aperçu avant import. */
export function tripImportStatuses(
  plan: ImportPlan,
  incoming: BackupData,
): Array<{ id: string; name: string; status: TripImportStatus }> {
  const created = new Set(plan.trips.create.map((trip) => trip.id));
  const updated = new Set(plan.trips.update.map((trip) => trip.id));
  return incoming.trips
    .filter((trip) => trip.deletedAt === null || updated.has(trip.id))
    .map((trip) => ({
      id: trip.id,
      name: trip.name,
      status:
        trip.deletedAt !== null
          ? 'deleted'
          : created.has(trip.id)
            ? 'new'
            : updated.has(trip.id)
              ? 'updated'
              : 'unchanged',
    }));
}

/** Nombre d'éléments visibles (non supprimés) d'une sauvegarde, toutes tables confondues. */
export function countBackupItems(data: BackupData): number {
  return BACKUP_TABLES.reduce(
    (total, table) =>
      total + (data[table] as BackupEntity[]).filter((entity) => entity.deletedAt === null).length,
    0,
  );
}

/** Délai au-delà duquel l'appli rappelle de faire une sauvegarde (F-15.4). */
export const BACKUP_REMINDER_DAYS = 7;

/** Vrai s'il faudrait sauvegarder : jamais fait, ou dernier export trop ancien. */
export function isBackupDue(
  lastExportAt: string | null,
  now: Date,
  days = BACKUP_REMINDER_DAYS,
): boolean {
  if (!lastExportAt) return true;
  return now.getTime() - new Date(lastExportAt).getTime() > days * 86_400_000;
}
