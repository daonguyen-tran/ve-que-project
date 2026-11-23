import { CalendarX2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useActiveTrip } from '@/app/providers/active-trip-context';
import { useTransfers } from '@/features/itinerary/hooks/use-itinerary';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { formatDateRange, formatLongDate } from '@/shared/lib/format-date';
import { useMediaQuery } from '@/shared/lib/use-media-query';
import { ButtonLink } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { PageHeader } from '@/shared/ui/PageHeader';
import { DayBoard } from '../components/DayBoard';
import { StopChip } from '../components/DayHeading';
import { PlannedItemSheet } from '../components/PlannedItemSheet';
import { usePlannedItems, useTripCalendar } from '../hooks/use-day-plan';
import type { PlannedItemSheetTarget } from '../planned-item-form';

const BACK = '/planning?vue=jours';

/**
 * Programme d'un jour (F-2.10, vue « détail d'un jour »). Sur PC, trois jours côte à côte :
 * on voit la suite du voyage et on peut glisser un élément d'un jour à l'autre (NF-4).
 */
export function DayPage() {
  const { date } = useParams();
  const { activeTrip, isLoading } = useActiveTrip();
  const calendar = useTripCalendar(activeTrip);
  const items = usePlannedItems(activeTrip?.id);
  const transfers = useTransfers(activeTrip?.id);
  const wide = useMediaQuery('(min-width: 1024px)');
  const [sheet, setSheet] = useState<PlannedItemSheetTarget | null>(null);

  if (isLoading || (activeTrip && (!calendar || !items || !transfers))) {
    return <PageHeader title="" backTo={BACK} />;
  }

  const index = calendar?.days.findIndex((day) => day.date === date) ?? -1;
  if (!activeTrip || !calendar || !items || !transfers || index === -1) {
    return (
      <>
        <PageHeader title={t.plan.boardTitle} backTo={BACK} />
        <div className="mx-auto max-w-3xl px-4 py-4">
          <EmptyState
            icon={<CalendarX2 className="size-5" strokeWidth={1.9} aria-hidden="true" />}
            title={t.plan.outsideTrip}
            body=""
            actions={<ButtonLink to={BACK}>{t.plan.backToDays}</ButtonLink>}
          />
        </div>
      </>
    );
  }

  // Fenêtre de jours affichés : 1 sur téléphone, 3 sur PC, sans dépasser la fin du voyage.
  const { days } = calendar;
  const span = Math.min(wide ? 3 : 1, days.length);
  const start = Math.min(index, days.length - span);
  const visible = days.slice(start, start + span);
  const previous = start > 0 ? days[Math.max(0, start - span)] : undefined;
  const next = start + span < days.length ? days[start + span] : undefined;
  const current = visible[0]!;
  const stop = current.stopId ? calendar.stopsById.get(current.stopId) : undefined;

  return (
    <>
      <PageHeader
        wide={span > 1}
        backTo={BACK}
        title={span > 1 ? t.plan.boardTitle : formatLongDate(current.date)}
        subtitle={
          span > 1 ? (
            formatDateRange(visible[0]!.date, visible.at(-1)!.date)
          ) : (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {t.plan.dayOf(current.dayNumber, days.length)}
              <StopChip stop={stop} className="text-[15px]" />
            </span>
          )
        }
        action={
          <nav aria-label={t.plan.boardTitle} className="flex gap-1">
            <DayStep to={previous?.date} label={t.plan.previousDays(span)} icon={ChevronLeft} />
            <DayStep to={next?.date} label={t.plan.nextDays(span)} icon={ChevronRight} />
          </nav>
        }
      />
      <div className={cn('mx-auto px-4 py-4 pb-28', span > 1 ? 'max-w-6xl' : 'max-w-3xl')}>
        <DayBoard
          trip={activeTrip}
          calendar={calendar}
          days={visible}
          items={items}
          transfers={transfers}
          showDayHeadings={span > 1}
          onOpenSheet={setSheet}
        />
      </div>
      <PlannedItemSheet
        trip={activeTrip}
        calendar={calendar}
        target={sheet}
        onClose={() => setSheet(null)}
      />
    </>
  );
}

function DayStep({
  to,
  label,
  icon: Icon,
}: {
  to: string | undefined;
  label: string;
  icon: typeof ChevronLeft;
}) {
  const className =
    'flex size-11 items-center justify-center rounded-xl border border-line bg-surface text-ink';
  if (!to) {
    return (
      <span className={cn(className, 'opacity-40')} aria-hidden="true">
        <Icon className="size-5" strokeWidth={1.9} />
      </span>
    );
  }
  return (
    <Link
      to={`/planning/jours/${to}`}
      aria-label={label}
      className={cn(className, 'hover:border-muted')}
    >
      <Icon className="size-5" strokeWidth={1.9} aria-hidden="true" />
    </Link>
  );
}
