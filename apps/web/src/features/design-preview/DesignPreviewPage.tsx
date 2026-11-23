import { Info } from 'lucide-react';
import { TodayView } from '@/features/today/components/TodayView';
import { t } from '@/shared/i18n';
import { demoToday } from './demo-today';

/** Aperçu de l'écran « Aujourd'hui » complet avec des données fictives clairement signalées. */
export function DesignPreviewPage() {
  return (
    <>
      <TodayView model={demoToday} badge={t.preview.badge} />
      <p className="text-muted mx-auto flex max-w-3xl items-start gap-2 px-5 pb-6 text-[13px]">
        <Info className="mt-0.5 size-4 shrink-0" strokeWidth={1.9} aria-hidden="true" />
        {t.preview.notice}
      </p>
    </>
  );
}
