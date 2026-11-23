import type { BackupReadError, TripImportStatus } from '@ve-que/domain';
import { FileUp } from 'lucide-react';
import { useId, useRef, useState, type ChangeEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { formatDateTime } from '@/shared/lib/format-date';
import { Button, ButtonLink } from '@/shared/ui/Button';
import { ConfirmSheet } from '@/shared/ui/ConfirmSheet';
import { SegmentedField } from '@/shared/ui/form/SegmentedField';
import { useBackupService } from '../hooks/use-backup';
import type { ImportMode, ImportPreview } from '../services/backup-service';
import { DataSection } from './DataSection';

/**
 * Étapes de l'import. Rien n'est écrit avant `confirm` : choisir un fichier ne fait que
 * calculer l'aperçu, qu'on peut abandonner en choisissant un autre fichier.
 */
type ImportState =
  | { step: 'idle' }
  | { step: 'error'; code: BackupReadError['code'] | 'failed' }
  | { step: 'preview'; preview: ImportPreview }
  | { step: 'done' };

const STATUS_STYLE: Record<TripImportStatus, string> = {
  new: 'bg-laque-tint text-laque-deep',
  updated: 'bg-laque-tint text-laque-deep',
  unchanged: 'bg-ground text-muted',
  deleted: 'bg-ground text-muted line-through',
};

export function ImportSection() {
  const service = useBackupService();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportState>({ step: 'idle' });
  const [busy, setBusy] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const { register, control } = useForm<{ mode: ImportMode }>({ defaultValues: { mode: 'merge' } });
  const mode = useWatch({ control, name: 'mode' });

  async function onFileChosen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // On vide le champ : rechoisir le même fichier (corrigé entre-temps) relancera la lecture.
    event.target.value = '';
    if (!file) return;
    try {
      const read = service.readFile(await file.text());
      if (!read.ok) return setState({ step: 'error', code: read.error.code });
      setState({ step: 'preview', preview: await service.previewImport(read.value) });
    } catch {
      setState({ step: 'error', code: 'failed' });
    }
  }

  async function runImport(preview: ImportPreview) {
    setBusy(true);
    try {
      await service.importBackup(preview, mode);
      setState({ step: 'done' });
    } catch {
      setState({ step: 'error', code: 'failed' });
    } finally {
      setBusy(false);
    }
  }

  const preview = state.step === 'preview' ? state.preview : null;
  const nothingToDo =
    preview !== null &&
    preview.summary.created + preview.summary.updated + preview.summary.deleted === 0;

  return (
    <DataSection id="data-import" title={t.data.importTitle}>
      <p className="text-ink-soft m-0 text-[15px] leading-relaxed">{t.data.importBody}</p>

      <div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          onChange={(event) => void onFileChosen(event)}
        />
        <Button
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          aria-controls={inputId}
        >
          <FileUp className="size-[18px]" strokeWidth={1.9} aria-hidden="true" />
          {t.data.chooseFile}
        </Button>
      </div>

      {state.step === 'error' && (
        <p role="alert" className="text-laque-deep m-0 text-[15px] leading-relaxed">
          {t.data.errors[state.code]}
        </p>
      )}
      {state.step === 'done' && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p role="status" className="text-success m-0 text-[15px] font-medium">
            {t.data.imported}
          </p>
          <ButtonLink to="/voyages" variant="quiet" className="-ml-4 sm:ml-0">
            {t.data.seeTrips}
          </ButtonLink>
        </div>
      )}

      {preview && (
        <div className="border-line-soft flex flex-col gap-4 border-t pt-4">
          <p className="text-muted m-0 text-sm">
            {t.data.fileFrom(formatDateTime(preview.file.exportedAt))}
          </p>

          {preview.trips.length > 0 && (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {preview.trips.map((trip) => (
                <li key={trip.id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 text-[15px] font-medium [overflow-wrap:anywhere]">
                    {trip.name}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-0.5 text-[13px] font-medium',
                      STATUS_STYLE[trip.status],
                    )}
                  >
                    {t.data.tripStatus[trip.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <SummaryLines preview={preview} />

          <SegmentedField
            label={t.data.modeLabel}
            options={[
              { value: 'merge', label: t.data.modes.merge },
              { value: 'replace', label: t.data.modes.replace },
            ]}
            {...register('mode')}
          />
          <p className="text-muted -mt-2 mb-0 text-sm leading-relaxed">{t.data.modeHint[mode]}</p>

          <Button
            className="self-start"
            variant={mode === 'replace' ? 'danger' : 'primary'}
            disabled={busy || (mode === 'merge' && nothingToDo)}
            onClick={() => (mode === 'replace' ? setConfirmReplace(true) : void runImport(preview))}
          >
            {mode === 'replace' ? t.data.replaceConfirm : t.data.confirmImport}
          </Button>

          <ConfirmSheet
            open={confirmReplace}
            onClose={() => setConfirmReplace(false)}
            title={t.data.replaceTitle}
            message={t.data.replaceMessage}
            confirmLabel={t.data.replaceConfirm}
            onConfirm={() => runImport(preview)}
          />
        </div>
      )}
    </DataSection>
  );
}

/** Ce que la fusion va changer, en phrases (« 3 éléments ajoutés »). */
function SummaryLines({ preview }: { preview: ImportPreview }) {
  const { created, updated, deleted, skipped } = preview.summary;
  const lines = [
    created > 0 && t.data.summary.created(created),
    updated > 0 && t.data.summary.updated(updated),
    deleted > 0 && t.data.summary.deleted(deleted),
    skipped > 0 && t.data.summary.skipped(skipped),
  ].filter(Boolean);
  if (created + updated + deleted === 0) {
    return <p className="text-ink-soft m-0 text-[15px]">{t.data.summary.nothing}</p>;
  }
  return (
    <ul className="text-ink-soft m-0 flex list-disc flex-col gap-1 pl-5 text-[15px]">
      {lines.map((line) => (
        <li key={String(line)}>{line}</li>
      ))}
    </ul>
  );
}
