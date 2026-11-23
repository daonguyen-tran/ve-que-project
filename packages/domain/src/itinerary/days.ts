import { compareLocalDates, daysBetween, eachDay, type LocalDate } from '../shared/local-date';
import type { Stop } from './itinerary';

/** Jour du voyage, **dérivé** (jamais stocké) des dates du voyage et des étapes (F-2.4). */
export interface TripDay {
  date: LocalDate;
  /** Numéro du jour, à partir de 1 (« jour 3 / 21 »). */
  dayNumber: number;
  /** Étape où l'on dort ce soir-là ; `null` si aucune étape ne couvre ce jour. */
  stopId: string | null;
  /** Jour où l'on quitte une étape pour une autre : un trajet est à prévoir. */
  isTransition: boolean;
}

type StopDates = Pick<Stop, 'id' | 'arrivalDate' | 'departureDate'>;

/**
 * Calcule les jours du voyage et l'étape de chacun.
 *
 * Convention (« logique d'hôtel ») : une étape couvre les nuits de `arrivalDate` incluse à
 * `departureDate` exclue. Le jour de transition appartient donc à l'étape d'**arrivée**, car
 * c'est là qu'on dormira. Seule exception : le dernier jour du voyage, où l'on ne dort nulle
 * part ; il est rattaché à l'étape que l'on quitte.
 */
export function deriveTripDays(
  trip: { startDate: LocalDate; endDate: LocalDate },
  stops: readonly StopDates[],
): TripDay[] {
  const sorted = [...stops].sort((a, b) => compareLocalDates(a.arrivalDate, b.arrivalDate));

  return eachDay(trip.startDate, trip.endDate).map((date) => {
    const sleepingAt = sorted.find((s) => s.arrivalDate <= date && date < s.departureDate);
    const leaving = sorted.find((s) => s.departureDate === date);
    const stop = sleepingAt ?? leaving ?? null;

    return {
      date,
      dayNumber: daysBetween(trip.startDate, date) + 1,
      stopId: stop?.id ?? null,
      isTransition:
        leaving !== undefined && sleepingAt !== undefined && leaving.id !== sleepingAt.id,
    };
  });
}

/**
 * Paires d'étapes qui se chevauchent (F-2.1). Le jour de transition n'est pas un chevauchement :
 * deux intervalles semi-ouverts [arrivée, départ[ se chevauchent si chacun commence avant la fin
 * de l'autre. Comparaison deux à deux en O(n²) : un voyage compte une dizaine d'étapes au plus.
 */
export function findStopOverlaps<T extends StopDates>(stops: readonly T[]): Array<[T, T]> {
  const overlaps: Array<[T, T]> = [];
  for (let i = 0; i < stops.length; i++) {
    for (let j = i + 1; j < stops.length; j++) {
      const a = stops[i]!;
      const b = stops[j]!;
      if (a.arrivalDate < b.departureDate && b.arrivalDate < a.departureDate) {
        overlaps.push([a, b]);
      }
    }
  }
  return overlaps;
}

/** Jours qu'aucune étape ne couvre : affichés comme avertissement (F-2.1). */
export function findUncoveredDays(days: readonly TripDay[]): LocalDate[] {
  return days.filter((day) => day.stopId === null).map((day) => day.date);
}
