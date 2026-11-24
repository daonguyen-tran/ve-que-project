import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { summarizeDay, tripToday, type Trip } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { dateParts } from '@/shared/lib/format-date';
import { usePlannedItems, useTripCalendar } from '../hooks/use-day-plan';
import { StopChip } from './DayHeading';
import { SlotMeter, SlotMeterLegend } from './SlotMeter';

/**
 * Vue « jour par jour » du planning : chaque jour avec son étape et ce qui est prévu dans ses
 * trois créneaux : un fil chronologique en lecture. Les journées s'organisent dans la fiche
 * de chaque étape.
 */
export function DaysOverview({ trip }: { trip: Trip }) {
  const calendar = useTripCalendar(trip);
  const items = usePlannedItems(trip.id);
  if (!calendar || !items) return null;

  const totalDays = calendar.days.length;
  const today = tripToday(trip, new Date());
  // Étape quittée chaque jour de changement d'étape (« depuis Hô Chi Minh-Ville »).
  const leaving = new Map(
    [...calendar.stopsById.values()].map((stop) => [stop.departureDate as string, stop.name]),
  );

  return (
    <section aria-labelledby="days-title" className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 px-1">
        <h2 id="days-title" className="m-0 text-lg font-semibold tracking-[-0.01em]">
          {t.plan.daysTitle(totalDays)}
        </h2>
        <SlotMeterLegend />
      </div>

      <ol className="border-line bg-surface m-0 list-none overflow-hidden rounded-[var(--radius-card)] border p-0">
        {calendar.days.map((day) => {
          const stop = day.stopId ? calendar.stopsById.get(day.stopId) : undefined;
          const parts = dateParts(day.date);
          const isToday = day.date === today;
          return (
            <li key={day.date} className="border-line-soft border-b last:border-b-0">
              <Link
                to={`/planning/jours/${day.date}`}
                aria-current={isToday ? 'date' : undefined}
                className={cn(
                  'hover:bg-ground flex min-h-14 items-center gap-3 px-4 py-2.5 text-inherit no-underline transition-colors',
                  isToday && 'bg-curcuma-tint hover:bg-curcuma-tint',
                )}
              >
                <span className="tabular flex w-16 shrink-0 flex-col leading-tight whitespace-nowrap">
                  <span className="text-muted text-xs font-medium">
                    {t.plan.dayShort(day.dayNumber)}
                  </span>
                  <span className="text-[15px] font-semibold">
                    {parts.weekday} {parts.day}
                  </span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <StopChip stop={stop} />
                  {day.isTransition && leaving.get(day.date) && (
                    <span className="text-muted truncate pl-[18px] text-xs">
                      {t.plan.arrivingFrom(leaving.get(day.date)!)}
                    </span>
                  )}
                  {isToday && (
                    <span className="text-curcuma-ink text-xs font-semibold">{t.plan.today}</span>
                  )}
                </span>
                <SlotMeter summary={summarizeDay(items, day.date)} />
                <ChevronRight className="text-muted size-5 shrink-0" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
