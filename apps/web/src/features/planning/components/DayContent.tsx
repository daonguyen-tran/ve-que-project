import { TIME_SLOTS, type PlannedItem, type Transfer, type TripDay } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import type { TripCalendar } from '../hooks/use-day-plan';
import { containerId, idsIn, type Columns } from '../plan-board';
import type { PlannedItemSheetTarget } from '../planned-item-form';
import { PlanItemCard } from './PlanItemCard';
import { SlotTitle } from './SlotTitle';
import { TransferNote } from './TransferNote';

/**
 * Contenu d'une journée, en lecture : le trajet du jour s'il y en a un, puis seulement les
 * créneaux remplis (un créneau vide n'est pas affiché). Si rien n'est prévu, une phrase le dit.
 * Toucher un élément ouvre sa fiche.
 *
 * Partagé par le programme d'un jour (`DayRecap`) et celui d'une étape (`StopProgram`), pour
 * qu'une journée ait la même allure partout.
 *
 * `columns` vient de `buildColumns` (ordre des éléments dans chaque créneau) ; `itemsById`
 * permet de retrouver chaque élément à partir de son identifiant.
 */
export function DayContent({
  day,
  calendar,
  columns,
  itemsById,
  transfers,
  onOpenSheet,
}: {
  day: TripDay;
  calendar: TripCalendar;
  columns: Columns;
  itemsById: Map<string, PlannedItem>;
  transfers: Transfer[];
  onOpenSheet: (target: PlannedItemSheetTarget) => void;
}) {
  const slots = TIME_SLOTS.map((slot) => {
    const key = containerId(day.date, slot);
    const slotItems = idsIn(columns, key)
      .map((id) => itemsById.get(id))
      .filter((item): item is PlannedItem => item !== undefined);
    return { slot, key, slotItems };
  }).filter(({ slotItems }) => slotItems.length > 0);
  const hasTransfer = transfers.some(
    (transfer) => transfer.departDate === day.date || transfer.arriveDate === day.date,
  );

  return (
    <>
      <TransferNote day={day} transfers={transfers} calendar={calendar} showMissing={false} />
      {slots.map(({ slot, key, slotItems }) => (
        <section key={key} aria-labelledby={`${key}-title`} className="flex flex-col gap-2">
          <div className="flex min-h-9 items-center pl-1">
            <SlotTitle id={`${key}-title`} slot={slot} />
          </div>
          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {slotItems.map((item) => (
              <li key={item.id}>
                <PlanItemCard item={item} onOpen={() => onOpenSheet({ mode: 'edit', item })} />
              </li>
            ))}
          </ol>
        </section>
      ))}
      {slots.length === 0 && !hasTransfer && (
        <p className="text-muted m-0 px-1 text-[15px]">{t.plan.emptyDay}</p>
      )}
    </>
  );
}
