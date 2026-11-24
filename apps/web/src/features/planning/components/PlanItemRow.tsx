import { Check } from 'lucide-react';
import type { PlannedItem } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { formatDuration, formatTime } from '@/shared/lib/format-date';
import { formatCost, KIND_STYLE } from '../plan-style';

/**
 * Un élément du programme (activité, temps libre, en famille), en ligne dans la carte d'un
 * jour. Toucher la ligne ouvre sa fiche, pour la modifier ou la déplacer.
 *
 * À gauche, une colonne de repère calée à droite, contre le titre : l'heure précise si elle
 * existe, sinon une pastille à la couleur de l'étape. Les lignes d'un jour s'alignent ainsi
 * comme un agenda. `withTimes`
 * élargit cette colonne quand au moins un élément du jour a une heure.
 */
export function PlanItemRow({
  item,
  markerClass,
  withTimes,
  onOpen,
}: {
  item: PlannedItem;
  /** Classe de fond de la pastille (couleur de l'étape). */
  markerClass: string;
  withTimes: boolean;
  onOpen?: () => void;
}) {
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
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'focus-visible:outline-laque flex min-h-12 w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left transition-[background-color,filter] duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2',
        style.row,
      )}
    >
      <span
        className={cn(
          'flex h-[22px] shrink-0 items-center justify-end',
          withTimes ? 'w-14' : 'w-2',
        )}
      >
        {item.time ? (
          <span className="tabular text-ink text-sm font-semibold whitespace-nowrap">
            {formatTime(item.time)}
          </span>
        ) : (
          <span
            className={cn('size-2 rounded-full', cancelled ? 'bg-line' : markerClass)}
            aria-hidden="true"
          />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            'text-ink text-[15px] leading-[22px] font-medium [overflow-wrap:anywhere]',
            cancelled && 'text-muted line-through',
          )}
        >
          {item.title}
        </span>
        {meta.length > 0 && (
          <span className="text-muted tabular text-[13px] leading-snug">{meta.join(' · ')}</span>
        )}
      </span>
      {item.kind !== 'activity' && (
        <Icon
          className="text-ink-soft mt-0.5 size-[18px] shrink-0"
          strokeWidth={1.9}
          aria-hidden="true"
        />
      )}
      <StatusBadge status={item.status} />
    </button>
  );
}

/** « Prévu » est l'état normal : il n'a pas de pastille, pour ne pas charger la liste. */
function StatusBadge({ status }: { status: PlannedItem['status'] }) {
  if (status === 'planned') return null;
  return (
    <span
      className={cn(
        'mt-px inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
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
