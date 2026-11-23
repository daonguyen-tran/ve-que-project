import { CalendarDays } from 'lucide-react';
import { t } from '@/shared/i18n';
import { EmptyState } from '@/shared/ui/EmptyState';
import { PageHeader } from '@/shared/ui/PageHeader';

/** Phase 1 : étapes, hébergements, trajets, jours et créneaux (cahier des charges, M2). */
export function PlanningPage() {
  return (
    <>
      <PageHeader title={t.placeholder.planningTitle} />
      <div className="mx-auto max-w-3xl px-4 py-4">
        <EmptyState
          icon={<CalendarDays className="size-5" strokeWidth={1.9} aria-hidden="true" />}
          title={t.placeholder.planningTitle}
          body={t.placeholder.planningBody}
          badge={t.placeholder.phase(1)}
        />
      </div>
    </>
  );
}
