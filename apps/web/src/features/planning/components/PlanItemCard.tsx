import { Check } from 'lucide-react';
import type { PlannedItem } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { formatDuration, formatTime } from '@/shared/lib/format-date';
import { formatCost, KIND_STYLE } from '../plan-style';

/**
 * Carte d'un élément du programme (activité, temps libre, en famille). Toucher la carte ouvre
 * sa fiche, pour la modifier ou la déplacer vers un autre jour ou créneau.
 */
export function PlanItemCard({ item, onOpen }: { item: PlannedItem; onOpen?: () => void }) {
  const style = KIND_STYLE[item.kind];
  const Icon = style.icon;
  const cancelled = item.status === 'cancelled';
  const meta = [
    item.kind !== 'activity' && item.title !== style.label ? style.label : null,
    item.durationMinutes ? formatDuration(item.durationMinutes) : null,
    item.place?.address || null,
    item.estimatedCost ? `~${formatCost(item.estimatedCost)}` : null,
  ].filter(Boolean);

  return (
    <div className={cn('flex min-h-14 items-stretch rounded-xl border', style.card)}>
      <button
        type="button"
        onClick={onOpen}
        className="focus-visible:outline-laque flex min-w-0 flex-1 items-center gap-3 rounded-xl py-2.5 pr-3 pl-3.5 text-left focus-visible:outline-2 focus-visible:-outline-offset-2"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className={cn(
              'flex items-baseline gap-2 text-[15px] leading-snug font-medium',
              cancelled && 'text-muted line-through',
            )}
          >
            {item.time && (
              <span className="tabular shrink-0 font-semibold">{formatTime(item.time)}</span>
            )}
            <span className="min-w-0 [overflow-wrap:anywhere]">{item.title}</span>
          </span>
          {meta.length > 0 && (
            <span className="text-muted tabular truncate text-[13px]">{meta.join(' · ')}</span>
          )}
        </span>
        {item.kind !== 'activity' && (
          <Icon className="text-muted size-[18px] shrink-0" strokeWidth={1.9} aria-hidden="true" />
        )}
        <StatusBadge status={item.status} />
      </button>
    </div>
  );
}

/** « Prévu » est l'état normal : il n'a pas de pastille, pour ne pas charger la liste. */
function StatusBadge({ status }: { status: PlannedItem['status'] }) {
  if (status === 'planned') return null;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        status === 'booked' && 'bg-member-jade-tint text-member-jade',
        status === 'done' && 'text-success',
        (status === 'idea' || status === 'cancelled') && 'border-line text-muted border',
      )}
    >
      {(status === 'booked' || status === 'done') && (
        <Check className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
      )}
      {t.plan.statuses[status]}
    </span>
  );
}
