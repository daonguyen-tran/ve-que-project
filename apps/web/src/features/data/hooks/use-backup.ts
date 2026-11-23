import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { useRepositories } from '@/app/providers/repositories-context';
import { SETTING_KEYS } from '@/infrastructure/repositories/settings-store';
import { BackupService } from '../services/backup-service';

export function useBackupService(): BackupService {
  const { backup, settings } = useRepositories();
  return useMemo(() => new BackupService(backup, settings), [backup, settings]);
}

/** Date du dernier export (ISO), tenue à jour en direct ; `null` si jamais exporté. */
export function useLastExportAt(): string | null | undefined {
  const { settings } = useRepositories();
  return useLiveQuery(
    async () => (await settings.get<string>(SETTING_KEYS.lastExportAt)) ?? null,
    [settings],
  );
}
