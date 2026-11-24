import { stopColorOf, type Stop, type TripDay } from '@ve-que/domain';
import { STOP_COLOR_STYLE } from '@/features/itinerary/stop-style';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { formatLongDate } from '@/shared/lib/format-date';

/** En-tête d'une colonne de jour (vue sur plusieurs jours, sur PC). */
export function DayHeading({ day, total, stop }: { day: TripDay; total: number; stop?: Stop }) {
  return (
    <div className="border-line flex flex-col gap-1 border-b pb-3">
      <span className="text-muted tabular text-[13px] font-medium">
        {t.plan.dayOf(day.dayNumber, total)}
      </span>
      <h2 className="m-0 text-lg leading-tight font-semibold tracking-[-0.01em]">
        {formatLongDate(day.date)}
      </h2>
      <StopChip stop={stop} />
    </div>
  );
}

/** Étape du jour : pastille de couleur + nom, ou « Hors étape ». */
export function StopChip({ stop, className }: { stop?: Stop; className?: string }) {
  return (
    <span className={cn('text-ink-soft flex items-center gap-2 text-sm', className)}>
      <span
        className={cn(
          'size-2.5 shrink-0 rounded-full',
          stop ? STOP_COLOR_STYLE[stopColorOf(stop)].fill : 'bg-line',
        )}
        aria-hidden="true"
      />
      <span className="min-w-0 truncate">{stop?.name ?? t.plan.noStop}</span>
    </span>
  );
}
