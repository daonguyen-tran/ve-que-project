import { Wallet } from 'lucide-react';
import { t } from '@/shared/i18n';
import { EmptyState } from '@/shared/ui/EmptyState';
import { PageHeader } from '@/shared/ui/PageHeader';

/** Phase 2 : dépenses, portefeuilles et budget (M5, M6, M7). */
export function ExpensesPage() {
  return (
    <>
      <PageHeader title={t.placeholder.expensesTitle} />
      <div className="mx-auto max-w-3xl px-4 py-4">
        <EmptyState
          icon={<Wallet className="size-5" strokeWidth={1.9} aria-hidden="true" />}
          title={t.placeholder.expensesTitle}
          body={t.placeholder.expensesBody}
          badge={t.placeholder.phase(2)}
        />
      </div>
    </>
  );
}
