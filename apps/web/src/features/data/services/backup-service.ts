import {
  createBackupFile,
  filterBackupByTrips,
  planImport,
  readBackup,
  summarizePlan,
  tripImportStatuses,
  type BackupFile,
  type BackupReadResult,
  type ImportPlan,
  type ImportSummary,
  type TripImportStatus,
} from '@ve-que/domain';
import type { BackupStore } from '@/infrastructure/backup/backup-store';
import { SETTING_KEYS, type SettingsStore } from '@/infrastructure/repositories/settings-store';

export type ImportMode = 'merge' | 'replace';

/** Ce que l'utilisateur voit avant de confirmer un import. */
export interface ImportPreview {
  file: BackupFile;
  plan: ImportPlan;
  summary: ImportSummary;
  trips: Array<{ id: string; name: string; status: TripImportStatus }>;
}

export interface ExportResult {
  file: BackupFile;
  fileName: string;
  json: string;
}

/**
 * Cas d'usage de la sauvegarde et du transfert entre appareils (F-15.1, F-15.2, F-15.4).
 *
 * Parcours type : sur le PC, `exportBackup` produit un fichier ; on se l'envoie (Drive, mail,
 * messagerie) ; sur le téléphone, `previewImport` montre ce qui va changer, puis
 * `importBackup` fusionne. Rien n'est écrit avant la confirmation.
 */
export class BackupService {
  constructor(
    private readonly store: BackupStore,
    private readonly settings: SettingsStore,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  /** Exporte tout, ou seulement certains voyages, et mémorise la date de l'export. */
  async exportBackup(options: { tripIds?: string[]; label: string }): Promise<ExportResult> {
    const all = await this.store.readAll();
    const data = options.tripIds ? filterBackupByTrips(all, options.tripIds) : all;
    const now = this.clock();
    const file = createBackupFile(data, now);
    await this.settings.set(SETTING_KEYS.lastExportAt, now.toISOString());
    return {
      file,
      fileName: backupFileName(options.label, now),
      json: JSON.stringify(file, null, 2),
    };
  }

  /** Lit un fichier ; renvoie l'erreur à afficher s'il n'est pas utilisable. */
  readFile(text: string): BackupReadResult {
    return readBackup(text);
  }

  /** Calcule, sans rien écrire, l'effet d'une fusion avec les données de l'appareil. */
  async previewImport(file: BackupFile): Promise<ImportPreview> {
    const plan = planImport(await this.store.readAll(), file.data);
    return { file, plan, summary: summarizePlan(plan), trips: tripImportStatuses(plan, file.data) };
  }

  async importBackup(preview: ImportPreview, mode: ImportMode): Promise<void> {
    if (mode === 'merge') await this.store.applyPlan(preview.plan);
    else await this.store.replaceAll(preview.file.data);
  }
}

/**
 * Nom de fichier lisible et sans caractères spéciaux :
 * « Vietnam 2027 » le 23/11/2026 → `ve-que-vietnam-2027-2026-11-23.json`.
 * Les accents sont retirés (NFD + suppression des diacritiques, `đ` traité à part) pour que
 * le nom passe partout : Windows, Android, pièces jointes.
 */
export function backupFileName(label: string, date: Date): string {
  const slug = label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `ve-que-${slug || 'sauvegarde'}-${date.toISOString().slice(0, 10)}.json`;
}
