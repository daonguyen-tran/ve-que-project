import { ChevronRight, Route } from 'lucide-react';
import { Link } from 'react-router';
import type { Transfer, TripDay } from '@ve-que/domain';
import { BookingBadge } from '@/features/itinerary/components/BookingBadge';
import { TRANSFER_MODE_ICON } from '@/features/itinerary/transfer-style';
import { t } from '@/shared/i18n';
import { formatTime } from '@/shared/lib/format-date';
import type { TripCalendar } from '../hooks/use-day-plan';

// Sur la surface blanche d'un jour : une ligne sur fond pierre, distincte des activités.
const ROW =
  'bg-ground hover:bg-line-soft flex min-h-14 items-center gap-3 rounded-xl px-3 py-2.5 text-inherit no-underline transition-colors duration-150';
const ICON_PILL =
  'bg-surface border-line flex size-8 shrink-0 items-center justify-center rounded-full border';

/**
 * Trajets qui partent ou arrivent ce jour-là, rappelés en tête du programme : ils dictent
 * l'heure à laquelle la journée commence ou s'arrête. En édition (`showMissing`), un jour de
 * changement d'étape sans trajet saisi le signale, avec un lien vers la fiche de l'étape.
 */
export function TransferNote({
  day,
  transfers,
  calendar,
  showMissing,
}: {
  day: TripDay;
  transfers: Transfer[];
  calendar: TripCalendar;
  showMissing: boolean;
}) {
  const todays = transfers.filter(
    (transfer) => transfer.departDate === day.date || transfer.arriveDate === day.date,
  );
  const stopName = (id: string) => calendar.stopsById.get(id)?.name ?? '';

  if (todays.length === 0) {
    if (!showMissing || !day.isTransition || !day.stopId) return null;
    return (
      <Link to={`/planning/etapes/${day.stopId}`} className={ROW}>
        <Route className="text-muted size-5 shrink-0" strokeWidth={1.9} aria-hidden="true" />
        <span className="text-ink-soft flex-1 text-sm">{t.plan.transferNone}</span>
        <ChevronRight className="text-muted size-5 shrink-0" aria-hidden="true" />
      </Link>
    );
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {todays.map((transfer) => {
        const Icon = TRANSFER_MODE_ICON[transfer.mode];
        const times = [
          transfer.departDate === day.date && transfer.departTime
            ? `${t.transfers.modes[transfer.mode]} · ${formatTime(transfer.departTime)}`
            : t.transfers.modes[transfer.mode],
          transfer.arriveDate === day.date && transfer.arriveTime
            ? `→ ${formatTime(transfer.arriveTime)}`
            : null,
        ].filter(Boolean);
        return (
          <li key={transfer.id}>
            <Link to={`/planning/etapes/${transfer.toStopId}`} className={ROW}>
              <span className={ICON_PILL}>
                <Icon className="text-ink-soft size-4" strokeWidth={1.9} aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-medium [overflow-wrap:anywhere]">
                  {t.transfers.route(stopName(transfer.fromStopId), stopName(transfer.toStopId))}
                </span>
                <span className="text-muted tabular text-[13px]">{times.join(' ')}</span>
              </span>
              <BookingBadge status={transfer.status} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
