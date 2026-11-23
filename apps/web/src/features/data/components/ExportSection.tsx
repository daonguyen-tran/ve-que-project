import { Download, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useActiveTrip } from '@/app/providers/active-trip-context';
import { t } from '@/shared/i18n';
import { canShareFiles, downloadTextFile, shareTextFile } from '@/shared/lib/file-transfer';
import { formatDateTime, formatDaysAgo } from '@/shared/lib/format-date';
import { Button } from '@/shared/ui/Button';
import { SegmentedField } from '@/shared/ui/form/SegmentedField';
import { useBackupService, useLastExportAt } from '../hooks/use-backup';
import { DataSection } from './DataSection';

const ALL = 'all';

/**
 * Export (F-15.1). Sur Android, « Partager » envoie directement le fichier vers Drive, Gmail
 * ou une messagerie ; sur PC, on télécharge. Le choix du contenu n'apparaît que s'il y a
 * plusieurs voyages : avec un seul, la question n'a pas de sens.
 */
export function ExportSection() {
  const { trips, activeTrip } = useActiveTrip();
  const service = useBackupService();
  const lastExportAt = useLastExportAt();
  const [canShare] = useState(canShareFiles);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const { register, control } = useForm({ defaultValues: { scope: ALL } });
  const scope = useWatch({ control, name: 'scope' });

  const scopedTrip = scope === ALL ? null : trips.find((trip) => trip.id === scope);

  async function run(action: 'share' | 'download') {
    setBusy(true);
    setMessage(null);
    try {
      const result = await service.exportBackup({
        tripIds: scopedTrip ? [scopedTrip.id] : undefined,
        label: scopedTrip?.name ?? t.data.allTrips,
      });
      if (action === 'share') {
        const shared = await shareTextFile(result.fileName, result.json, t.data.title);
        if (!shared) return;
      } else {
        downloadTextFile(result.fileName, result.json);
      }
      setMessage({ kind: 'ok', text: t.data.exported(result.fileName) });
    } catch {
      setMessage({ kind: 'error', text: t.data.errors.failed });
    } finally {
      setBusy(false);
    }
  }

  return (
    <DataSection id="data-export" title={t.data.exportTitle}>
      {activeTrip && trips.length > 1 && (
        <SegmentedField
          label={t.data.exportScope}
          options={[
            { value: ALL, label: t.data.allTrips },
            { value: activeTrip.id, label: activeTrip.name },
          ]}
          {...register('scope')}
        />
      )}

      {trips.length === 0 && (
        <p className="text-ink-soft m-0 text-[15px] leading-relaxed">{t.data.nothingToExport}</p>
      )}

      <div className={trips.length === 0 ? 'hidden' : 'flex flex-wrap gap-2'}>
        {canShare && (
          <Button onClick={() => void run('share')} disabled={busy}>
            <Share2 className="size-[18px]" strokeWidth={1.9} aria-hidden="true" />
            {t.data.share}
          </Button>
        )}
        <Button
          variant={canShare ? 'secondary' : 'primary'}
          onClick={() => void run('download')}
          disabled={busy}
        >
          <Download className="size-[18px]" strokeWidth={1.9} aria-hidden="true" />
          {t.data.download}
        </Button>
      </div>

      {message && (
        <p
          role={message.kind === 'error' ? 'alert' : 'status'}
          className={
            message.kind === 'error'
              ? 'text-laque-deep m-0 text-[15px]'
              : 'text-success m-0 text-[15px] [overflow-wrap:anywhere]'
          }
        >
          {message.text}
        </p>
      )}

      {lastExportAt !== undefined && (
        <p className="text-muted m-0 text-sm">
          {lastExportAt ? (
            <span title={formatDateTime(lastExportAt)}>
              {t.data.lastExport(formatDaysAgo(lastExportAt))}
            </span>
          ) : (
            t.data.neverExported
          )}
        </p>
      )}
    </DataSection>
  );
}
