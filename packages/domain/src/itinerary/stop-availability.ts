import { addDays, type LocalDate } from '../shared/local-date';
import type { Trip } from '../trip/trip';
import type { Stop } from './itinerary';

type TripDates = Pick<Trip, 'startDate' | 'endDate'>;
type StopLike = Pick<Stop, 'id' | 'arrivalDate' | 'departureDate'>;

/**
 * Dates qu'on peut choisir pour une étape, compte tenu des autres étapes (calendrier de la
 * fiche d'étape).
 *
 * On raisonne en **nuits**, comme partout dans l'itinéraire (« logique d'hôtel », voir
 * `stop-rules.ts`) : la date d'une nuit est le jour où l'on s'endort. Une étape du 1er au
 * 4 juillet occupe les nuits du 1er, du 2 et du 3. Le 4 reste donc libre : on peut quitter
 * Saigon le matin et arriver ailleurs le soir.
 *
 * - **Arrivée** possible un jour dont la nuit est libre. Le dernier jour du voyage n'a pas de
 *   nuit (on rentre) : on ne peut pas y arriver.
 * - **Départ** possible après l'arrivée, jusqu'au lendemain de la dernière nuit libre
 *   consécutive : on ne peut pas « sauter » par-dessus une autre étape.
 */
export interface StopAvailability<S extends StopLike> {
  /** Étape qui occupe déjà la nuit de cette date, s'il y en a une. */
  takenBy(date: LocalDate): S | undefined;
  canArrive(date: LocalDate): boolean;
  /** Départ le plus tardif possible pour une arrivée donnée (`null` si l'arrivée est impossible). */
  latestDeparture(arrival: LocalDate): LocalDate | null;
  canDepart(arrival: LocalDate, departure: LocalDate): boolean;
}

/**
 * Calcule la disponibilité des nuits du voyage.
 *
 * `excludeId` ignore l'étape en cours de modification : ses propres nuits restent choisissables.
 *
 * Construction : on indexe chaque nuit occupée (Map date → étape), en O(nuits). Chaque question
 * est ensuite une lecture de la table ; `latestDeparture` avance nuit par nuit jusqu'à la
 * première nuit prise ou la fin du voyage, au plus une trentaine de pas pour un voyage réel.
 */
export function stopAvailability<S extends StopLike>(
  trip: TripDates,
  stops: readonly S[],
  excludeId?: string,
): StopAvailability<S> {
  const taken = new Map<LocalDate, S>();
  for (const stop of stops) {
    if (stop.id === excludeId) continue;
    for (let night = stop.arrivalDate; night < stop.departureDate; night = addDays(night, 1)) {
      // En cas de chevauchement (données importées), la première étape rencontrée l'emporte.
      if (!taken.has(night)) taken.set(night, stop);
    }
  }

  const isFreeNight = (date: LocalDate) =>
    date >= trip.startDate && date < trip.endDate && !taken.has(date);

  const latestDeparture = (arrival: LocalDate): LocalDate | null => {
    if (!isFreeNight(arrival)) return null;
    let departure = addDays(arrival, 1);
    while (isFreeNight(departure)) departure = addDays(departure, 1);
    return departure;
  };

  return {
    takenBy: (date) => taken.get(date),
    canArrive: isFreeNight,
    latestDeparture,
    canDepart: (arrival, departure) => {
      const latest = latestDeparture(arrival);
      return latest !== null && departure > arrival && departure <= latest;
    },
  };
}
