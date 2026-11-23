import { ArrowLeft, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router';
import { t } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { PageHeader } from '@/shared/ui/PageHeader';

/** Phase 2 : saisie rapide d'une dépense avec le pavé « 50k » (F-5.1, F-5.2). */
export function QuickExpensePage() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader
        title={t.quickExpense.title}
        action={
          <Button variant="quiet" onClick={() => void navigate(-1)} aria-label={t.preview.back}>
            <ArrowLeft className="size-5" strokeWidth={1.9} aria-hidden="true" />
          </Button>
        }
      />
      <div className="mx-auto max-w-3xl px-4 py-4">
        <EmptyState
          icon={<Banknote className="size-5" strokeWidth={1.9} aria-hidden="true" />}
          title={t.quickExpense.title}
          body={t.quickExpense.comingSoon}
          badge={t.placeholder.phase(2)}
        />
      </div>
    </>
  );
}
