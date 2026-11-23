import { Compass } from 'lucide-react';
import { t } from '@/shared/i18n';
import { ButtonLink } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { PageHeader } from '@/shared/ui/PageHeader';

export function NotFoundPage() {
  return (
    <>
      <PageHeader title={t.notFound.title} />
      <div className="mx-auto max-w-3xl px-4 py-4">
        <EmptyState
          icon={<Compass className="size-5" strokeWidth={1.9} aria-hidden="true" />}
          title={t.notFound.title}
          body=""
          actions={<ButtonLink to="/">{t.notFound.back}</ButtonLink>}
        />
      </div>
    </>
  );
}
