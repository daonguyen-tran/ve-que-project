import { CalendarCog } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import type { PlannedItem, Transfer, TripDay } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import type { TripCalendar } from '../hooks/use-day-plan';
import { buildColumns } from '../plan-board';
import type { PlannedItemSheetTarget } from '../planned-item-form';
import { DayContent } from './DayContent';
import { DayHeading } from './DayHeading';

/**
 * Programme d'un ou plusieurs jours (vue « Jour par jour ») : un fil chronologique en lecture.
 *
 * On n'y ajoute rien : la journée s'organise dans la fiche de son étape, vers laquelle un lien
 * renvoie. Toucher un élément ouvre quand même sa fiche, pour corriger un détail sur place.
 */
export function DayRecap({
  calendar,
  days,
  items,
  transfers,
  showDayHeadings,
  onOpenSheet,
}: {
  calendar: TripCalendar;
  days: TripDay[];
  items: PlannedItem[];
  transfers: Transfer[];
  showDayHeadings: boolean;
  onOpenSheet: (target: PlannedItemSheetTarget) => void;
}) {
  const dates = useMemo(() => days.map((day) => day.date), [days]);
  const columns = useMemo(() => buildColumns(items, dates), [items, dates]);
  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  return (
    <div
      className="grid gap-x-6 gap-y-8"
      style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
    >
      {days.map((day) => {
        const stop = day.stopId ? calendar.stopsById.get(day.stopId) : undefined;
        return (
          <div key={day.date} className="flex min-w-0 flex-col gap-5">
            {showDayHeadings && <DayHeading day={day} total={calendar.days.length} stop={stop} />}
            {/* Même surface que dans la fiche d'une étape : une journée a partout la même allure. */}
            <div className="border-line bg-surface rounded-[var(--radius-card)] border px-4 py-3.5">
              <DayContent
                day={day}
                calendar={calendar}
                columns={columns}
                itemsById={byId}
                transfers={transfers}
                onOpenSheet={onOpenSheet}
              />
            </div>
            {stop && (
              <Link
                to={`/planning/etapes/${stop.id}`}
                className="text-ink-soft hover:text-laque flex min-h-11 items-center gap-1.5 self-start px-1 text-[13px] font-medium"
              >
                <CalendarCog className="size-4" strokeWidth={1.9} aria-hidden="true" />
                {t.plan.planInStop(stop.name)}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
