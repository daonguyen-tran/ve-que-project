import { Check, GripVertical } from 'lucide-react';
import type { ComponentProps, Ref } from 'react';
import type { PlannedItem } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { formatDuration, formatTime } from '@/shared/lib/format-date';
import { formatCost, KIND_STYLE } from '../plan-style';

/**
 * Carte d'un élément du programme. Elle sert à trois endroits : dans la liste, en « fantôme »
 * à l'emplacement d'origine pendant un glisser, et sous le doigt (`lifted`).
 *
 * La poignée est un bouton à part, seul déclencheur du glisser : on peut ainsi faire défiler la
 * page en touchant la carte sans la déplacer par mégarde, et toucher la carte ouvre l'édition.
 * Elle n'apparaît qu'en mode édition (quand `handleProps` est fourni) et sous le doigt.
 */
export function PlanItemCard({
  item,
  onOpen,
  handleProps,
  handleRef,
  lifted = false,
  ghost = false,
}: {
  item: PlannedItem;
  onOpen?: () => void;
  handleProps?: ComponentProps<'button'>;
  handleRef?: Ref<HTMLButtonElement>;
  lifted?: boolean;
  ghost?: boolean;
}) {
  const draggable = handleProps !== undefined || lifted;
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
    <div
      className={cn(
        'flex min-h-14 items-stretch rounded-xl border',
        style.card,
        lifted && 'border-line bg-surface shadow-[0_10px_30px_-8px_rgb(28_25_23/0.35)]',
        ghost && 'opacity-40',
      )}
    >
      {draggable && (
        <button
          ref={handleRef}
          type="button"
          aria-label={t.plan.dragHandle(item.title)}
          className={cn(
            'text-muted flex w-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-l-xl',
            'hover:text-ink focus-visible:outline-laque focus-visible:outline-2 focus-visible:-outline-offset-2',
            lifted && 'cursor-grabbing',
          )}
          {...handleProps}
        >
          <GripVertical className="size-[18px]" strokeWidth={1.9} aria-hidden="true" />
        </button>
      )}
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          'focus-visible:outline-laque flex min-w-0 flex-1 items-center gap-3 py-2.5 pr-3 text-left focus-visible:outline-2 focus-visible:-outline-offset-2',
          draggable ? 'rounded-r-xl' : 'rounded-xl pl-3.5',
        )}
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
