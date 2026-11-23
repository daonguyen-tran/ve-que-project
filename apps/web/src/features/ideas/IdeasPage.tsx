import { Lightbulb } from 'lucide-react';
import { t } from '@/shared/i18n';
import { EmptyState } from '@/shared/ui/EmptyState';
import { PageHeader } from '@/shared/ui/PageHeader';

/** Phase 1 : banque d'idées par ville ; phase 3 : « J'ai du temps libre » (M3). */
export function IdeasPage() {
  return (
    <>
      <PageHeader title={t.placeholder.ideasTitle} />
      <div className="mx-auto max-w-3xl px-4 py-4">
        <EmptyState
          icon={<Lightbulb className="size-5" strokeWidth={1.9} aria-hidden="true" />}
          title={t.placeholder.ideasTitle}
          body={t.placeholder.ideasBody}
          badge={t.placeholder.phase(1)}
        />
      </div>
    </>
  );
}
