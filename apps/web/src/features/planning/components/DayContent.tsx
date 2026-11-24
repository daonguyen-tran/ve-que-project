import {
  stopColorOf,
  type PlannedItem,
  type StopColor,
  type Transfer,
  type TripDay,
} from '@ve-que/domain';
import { STOP_COLOR_STYLE } from '@/features/itinerary/stop-style';
import { t } from '@/shared/i18n';
import type { TripCalendar } from '../hooks/use-day-plan';
import type { PlannedItemSheetTarget } from '../planned-item-form';
import { PlanItemRow } from './PlanItemRow';
import { TransferNote } from './TransferNote';

/**
 * Contenu d'une journée, en lecture, à poser sur une surface blanche : le trajet du jour s'il y
 * en a un, puis la liste chronologique des éléments (`items`, déjà triés par `dayItems` :
 * d'abord les heures, puis les éléments sans heure). Si rien n'est prévu, une phrase le dit.
 * Toucher un élément ouvre sa fiche.
 *
 * Partagé par le programme d'un jour (`DayRecap`) et celui d'une étape (`StopProgram`), pour
 * qu'une journée ait la même allure partout.
 *
 * Pas d'intertitres matin / après-midi / soir : la colonne des heures, à gauche, suffit à lire
 * la journée comme un agenda. `accent` impose la couleur des pastilles (la fiche d'une étape
 * garde sa couleur, même les jours de transition) ; sans lui, c'est la couleur de l'étape du
 * jour.
 */
export function DayContent({
  day,
  calendar,
  items,
  transfers,
  accent,
  onOpenSheet,
}: {
  day: TripDay;
  calendar: TripCalendar;
  items: readonly PlannedItem[];
  transfers: Transfer[];
  accent?: StopColor;
  onOpenSheet: (target: PlannedItemSheetTarget) => void;
}) {
  const hasTransfer = transfers.some(
    (transfer) => transfer.departDate === day.date || transfer.arriveDate === day.date,
  );
  const dayStop = day.stopId ? calendar.stopsById.get(day.stopId) : undefined;
  const color = accent ?? (dayStop ? stopColorOf(dayStop) : undefined);
  const markerClass = color ? STOP_COLOR_STYLE[color].fill : 'bg-muted';
  // La colonne des heures ne s'élargit que si un élément du jour a une heure : sinon elle
  // laisserait un vide à gauche de chaque titre.
  const withTimes = items.some((item) => item.time);

  return (
    <div className="flex flex-col gap-3">
      <TransferNote day={day} transfers={transfers} calendar={calendar} showMissing={false} />
      {items.length > 0 && (
        <ol className="m-0 -mx-2 flex list-none flex-col gap-1 p-0">
          {items.map((item) => (
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
      )}
      {items.length === 0 && !hasTransfer && (
        <p className="text-muted m-0 text-[15px]">{t.plan.emptyDay}</p>
      )}
    </div>
  );
}
