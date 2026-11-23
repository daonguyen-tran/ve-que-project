import { Link } from 'react-router';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';

/**
 * Bascule Itinéraire / Jour par jour. Ce sont des liens (la vue vit dans l'URL), présentés
 * comme un contrôle segmenté ; `aria-current` indique la vue affichée.
 */
export function PlanningViewSwitch({
  view,
  className,
}: {
  view: 'itinerary' | 'days';
  className?: string;
}) {
  const entries = [
    { key: 'itinerary', to: '/planning', label: t.plan.views.itinerary },
    { key: 'days', to: '/planning?vue=jours', label: t.plan.views.days },
  ] as const;
  return (
    <nav
      aria-label={t.plan.views.label}
      className={cn(
        'bg-ground border-line grid grid-cols-2 gap-1 rounded-xl border p-1',
        className,
      )}
    >
      {entries.map((entry) => {
        const active = entry.key === view;
        return (
          <Link
            key={entry.key}
            to={entry.to}
            replace
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-11 items-center justify-center rounded-[10px] text-[15px] font-medium no-underline transition-colors duration-150',
              active
                ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(28_25_23/0.1)]'
                : 'text-muted hover:text-ink',
            )}
          >
            {entry.label}
          </Link>
        );
      })}
    </nav>
  );
}
