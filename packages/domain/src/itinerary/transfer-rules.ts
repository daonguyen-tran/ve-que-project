import type { Trip } from '../trip/trip';
import type { Accommodation, Stop, Transfer } from './itinerary';
import { sortStops } from './stop-rules';

/*
 * Règles des hébergements (F-2.2) et des trajets (F-2.3).
 */

/**
 * Hébergement principal d'une étape : celui qui est **réservé**, sinon le premier
 * **envisagé** (par ordre de création). Les hébergements annulés ne comptent jamais.
 */
export function primaryAccommodation<T extends Pick<Accommodation, 'status' | 'createdAt'>>(
  accommodations: readonly T[],
): T | undefined {
  const byAge = [...accommodations].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return byAge.find((a) => a.status === 'booked') ?? byAge.find((a) => a.status === 'considered');
}

/** Passage d'une étape à la suivante, avec le trajet prévu s'il existe. */
export interface StopTransition<S, T> {
  from: S;
  to: S;
  transfer: T | undefined;
}

/**
 * Transitions entre étapes consécutives (dans l'ordre chronologique), chacune avec son
 * trajet. Un trajet annulé est ignoré : la transition apparaît alors « à prévoir ».
 */
export function stopTransitions<
  S extends Pick<Stop, 'id' | 'arrivalDate' | 'departureDate'>,
  T extends Pick<Transfer, 'fromStopId' | 'toStopId' | 'status'>,
>(stops: readonly S[], transfers: readonly T[]): StopTransition<S, T>[] {
  const sorted = sortStops(stops);
  return sorted.slice(1).map((to, index) => {
    const from = sorted[index]!;
    const transfer = transfers.find(
      (t) => t.fromStopId === from.id && t.toStopId === to.id && t.status !== 'cancelled',
    );
    return { from, to, transfer };
  });
}

type TransferTiming = Pick<
  Transfer,
  'fromStopId' | 'toStopId' | 'departDate' | 'departTime' | 'arriveDate' | 'arriveTime'
>;

export type TransferIssue =
  { code: 'same_stop' } | { code: 'arrives_before_departure' } | { code: 'outside_trip' };

/**
 * Compare deux moments « date + heure locale ». Les chaînes `AAAA-MM-JJTHH:mm` se trient
 * comme du texte ; une heure inconnue compte comme « n'importe quand ce jour-là ».
 */
function moment(date: string, time: string | null, fallback: '00:00' | '23:59'): string {
  return `${date}T${time ?? fallback}`;
}

/** Vérifie un trajet avant de l'enregistrer (même principe que `validateStopDates`). */
export function validateTransfer(
  transfer: TransferTiming,
  trip: Pick<Trip, 'startDate' | 'endDate'>,
): TransferIssue[] {
  const issues: TransferIssue[] = [];
  if (transfer.fromStopId === transfer.toStopId) issues.push({ code: 'same_stop' });

  // Sans heures, un trajet du 4 au 4 est valide ; avec heures, l'arrivée doit suivre le départ.
  const departs = moment(transfer.departDate, transfer.departTime, '00:00');
  const arrives = moment(transfer.arriveDate, transfer.arriveTime, '23:59');
  const sameKnownDay =
    transfer.departDate === transfer.arriveDate &&
    transfer.departTime !== null &&
    transfer.arriveTime !== null;
  if (arrives < departs || (sameKnownDay && transfer.arriveTime! <= transfer.departTime!)) {
    issues.push({ code: 'arrives_before_departure' });
  }

  if (transfer.departDate < trip.startDate || transfer.arriveDate > trip.endDate) {
    issues.push({ code: 'outside_trip' });
  }
  return issues;
}

/** Trajet de nuit (bus-couchette, train de nuit) : on arrive un autre jour que celui du départ. */
export function isOvernight(transfer: Pick<Transfer, 'departDate' | 'arriveDate'>): boolean {
  return transfer.arriveDate > transfer.departDate;
}
