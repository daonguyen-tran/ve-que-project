import { isBackupDue } from '@ve-que/domain';
import { useActiveTrip } from '@/app/providers/active-trip-context';
import { t } from '@/shared/i18n';
import { PageHeader } from '@/shared/ui/PageHeader';
import { ExportSection } from '../components/ExportSection';
import { ImportSection } from '../components/ImportSection';
import { ProtectionSection } from '../components/ProtectionSection';
import { useLastExportAt } from '../hooks/use-backup';

/**
 * « Sauvegarde et transfert » (F-15). Tant qu'il n'y a pas de serveur, c'est le seul moyen
 * de passer les données du PC au téléphone et de ne pas les perdre.
 */
export function DataPage() {
  const { trips } = useActiveTrip();
  const lastExportAt = useLastExportAt();
  const showReminder =
    lastExportAt !== undefined && trips.length > 0 && isBackupDue(lastExportAt, new Date());

  return (
    <>
      <PageHeader title={t.data.title} backTo="/plus" />
      <div className="mx-auto flex max-w-3xl flex-col gap-7 px-4 py-4">
        {showReminder && (
          <p className="bg-laque-tint text-laque-deep m-0 rounded-[var(--radius-card)] px-4 py-3 text-[15px] leading-relaxed">
            {t.data.reminder}
          </p>
        )}

        <section aria-labelledby="data-how" className="flex flex-col gap-2.5">
          <h2 id="data-how" className="m-0 px-1 text-lg font-semibold tracking-[-0.01em]">
            {t.data.howTitle}
          </h2>
          <ol className="m-0 flex list-none flex-col gap-2.5 p-0 px-1">
            {t.data.howSteps.map((step, index) => (
              <li key={step} className="flex items-start gap-3 text-[15px] leading-snug">
                <span className="bg-ink text-surface tabular flex size-6 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold">
                  {index + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <ExportSection />
        <ImportSection />
        <ProtectionSection />
      </div>
    </>
  );
}
