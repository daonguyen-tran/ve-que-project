import { useMemo } from 'react';
import { TIME_SLOTS, type PlannedItem, type Transfer, type TripDay } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import type { TripCalendar } from '../hooks/use-day-plan';
import { buildColumns, containerId, idsIn } from '../plan-board';
import type { PlannedItemSheetTarget } from '../planned-item-form';
import { DayHeading } from './DayHeading';
import { PlanItemCard } from './PlanItemCard';
import { SlotTitle } from './SlotTitle';
import { TransferNote } from './TransferNote';

/**
 * Programme d'un ou plusieurs jours en mode lecture : un récapitulatif de ce qui est prévu.
 *
 * Par rapport à `DayBoard` (mode édition) : pas de glisser-déposer, pas d'ajout, et les créneaux
 * vides ne sont pas affichés du tout. Si un jour n'a rien, une phrase le dit, pour ne pas
 * laisser une colonne blanche. Toucher un élément ouvre toujours sa fiche, pour corriger un
 * détail sans passer tout le planning en édition.
 *
 * L'ordre des éléments vient de `buildColumns`, le même calcul que pour `DayBoard` : on voit
 * exactement le même programme dans les deux modes.
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
        const slots = TIME_SLOTS.map((slot) => {
          const key = containerId(day.date, slot);
          const slotItems = idsIn(columns, key)
            .map((id) => byId.get(id))
            .filter((item): item is PlannedItem => item !== undefined);
          return { slot, key, slotItems };
        }).filter(({ slotItems }) => slotItems.length > 0);
        const hasTransfer = transfers.some(
          (transfer) => transfer.departDate === day.date || transfer.arriveDate === day.date,
        );

        return (
          <div key={day.date} className="flex min-w-0 flex-col gap-5">
            {showDayHeadings && <DayHeading day={day} total={calendar.days.length} stop={stop} />}
            <TransferNote day={day} transfers={transfers} calendar={calendar} showMissing={false} />
            {slots.map(({ slot, key, slotItems }) => (
              <section key={key} aria-labelledby={`${key}-title`} className="flex flex-col gap-2">
                <div className="flex min-h-10 items-center pl-1">
                  <SlotTitle id={`${key}-title`} slot={slot} />
                </div>
                <ol className="m-0 flex list-none flex-col gap-2 p-0">
                  {slotItems.map((item) => (
                    <li key={item.id}>
                      <PlanItemCard
                        item={item}
                        onOpen={() => onOpenSheet({ mode: 'edit', item })}
                      />
                    </li>
                  ))}
                </ol>
              </section>
            ))}
            {slots.length === 0 && !hasTransfer && (
              <p className="text-muted m-0 px-1 text-[15px]">{t.plan.emptyDay}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
