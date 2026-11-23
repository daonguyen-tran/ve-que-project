import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { t } from '@/shared/i18n';

/**
 * En-tête simple des écrans secondaires : titre sur le fond, sans bandeau.
 * `backTo` affiche une flèche de retour vers l'écran parent (une URL, pas « page précédente » :
 * le retour reste prévisible même si on arrive par un lien direct).
 */
export function PageHeader({
  title,
  subtitle,
  action,
  backTo,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  backTo?: string;
}) {
  return (
    <header className="pt-safe">
      <div className="mx-auto flex max-w-3xl items-start justify-between gap-3 px-5 pt-6 pb-2">
        <div className="flex min-w-0 items-start gap-1">
          {backTo && (
            <Link
              to={backTo}
              aria-label={t.common.back}
              className="text-ink hover:bg-surface -ml-3 flex size-11 shrink-0 items-center justify-center rounded-xl"
            >
              <ArrowLeft className="size-5" strokeWidth={1.9} aria-hidden="true" />
            </Link>
          )}
          <div className="flex min-w-0 flex-col gap-1 pt-1">
            <h1 className="m-0 text-[28px] leading-tight font-bold tracking-[-0.02em] [overflow-wrap:anywhere]">
              {title}
            </h1>
            {subtitle && <p className="text-muted tabular m-0 text-[15px]">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="shrink-0 pt-1">{action}</div>}
      </div>
    </header>
  );
}
