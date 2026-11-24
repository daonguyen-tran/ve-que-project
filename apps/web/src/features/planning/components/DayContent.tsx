import {
  stopColorOf,
  TIME_SLOTS,
  type PlannedItem,
  type StopColor,
  type Transfer,
  type TripDay,
} from '@ve-que/domain';
import { STOP_COLOR_STYLE } from '@/features/itinerary/stop-style';
import { t } from '@/shared/i18n';
import type { TripCalendar } from '../hooks/use-day-plan';
import { containerId, idsIn, type Columns } from '../plan-board';
import type { PlannedItemSheetTarget } from '../planned-item-form';
import { PlanItemRow } from './PlanItemRow';
import { SlotTitle } from './SlotTitle';
import { TransferNote } from './TransferNote';

/**
 * Contenu d'une journée, en lecture, à poser sur une surface blanche : le trajet du jour s'il y
 * en a un, puis seulement les créneaux remplis (un créneau vide n'est pas affiché). Si rien
 * n'est prévu, une phrase le dit. Toucher un élément ouvre sa fiche.
 *
 * Partagé par le programme d'un jour (`DayRecap`) et celui d'une étape (`StopProgram`), pour
 * qu'une journée ait la même allure partout.
 *
 * Hiérarchie : le créneau est une petite étiquette en capitales grises prolongée d'un filet ;
 * les éléments sont des lignes en encre, plus grandes. On distingue ainsi « Matin » d'une
 * activité sans avoir à lire.
 *
 * `columns` vient de `buildColumns` (ordre des éléments dans chaque créneau) ; `itemsById`
 * permet de retrouver chaque élément à partir de son identifiant. `accent` impose la couleur
 * des repères (la fiche d'une étape garde sa couleur, même les jours de transition) ; sans
 * lui, c'est la couleur de l'étape du jour.
 */
export function DayContent({
  day,
  calendar,
  columns,
  itemsById,
  transfers,
  accent,
  onOpenSheet,
}: {
  day: TripDay;
  calendar: TripCalendar;
  columns: Columns;
  itemsById: Map<string, PlannedItem>;
  transfers: Transfer[];
  accent?: StopColor;
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

  const dayStop = day.stopId ? calendar.stopsById.get(day.stopId) : undefined;
  const color = accent ?? (dayStop ? stopColorOf(dayStop) : undefined);
  const markerClass = color ? STOP_COLOR_STYLE[color].fill : 'bg-muted';
  // Une colonne d'heures n'apparaît que si au moins un élément du jour a une heure : sinon
  // elle laisserait un vide à gauche de chaque titre.
  const withTimes = slots.some(({ slotItems }) => slotItems.some((item) => item.time));

  return (
    <div className="flex flex-col gap-4">
      <TransferNote day={day} transfers={transfers} calendar={calendar} showMissing={false} />
      {slots.map(({ slot, key, slotItems }) => (
        <section key={key} aria-labelledby={`${key}-title`} className="flex flex-col gap-1">
          <SlotTitle id={`${key}-title`} slot={slot} />
          <ol className="m-0 -mx-2 flex list-none flex-col gap-1 p-0">
            {slotItems.map((item) => (
              <li key={item.id}>
                <PlanItemRow
                  item={item}
                  markerClass={markerClass}
                  withTimes={withTimes}
                  onOpen={() => onOpenSheet({ mode: 'edit', item })}
                />
              </li>
            ))}
          </ol>
        </section>
      ))}
      {slots.length === 0 && !hasTransfer && (
        <p className="text-muted m-0 text-[15px]">{t.plan.emptyDay}</p>
      )}
    </div>
  );
}
