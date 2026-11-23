import { addDays, compareLocalDates, daysBetween, type LocalDate } from '../shared/local-date';
import type { Trip } from '../trip/trip';
import type { Stop } from './itinerary';

/*
 * Règles des étapes (F-2.1).
 *
 * Rappel de la convention (« logique d'hôtel », voir `days.ts`) : une étape couvre les
 * **nuits** de `arrivalDate` incluse à `departureDate` exclue. Du 3 au 6 juillet = 3 nuits
 * (3, 4 et 5). Le 6 est le jour de transition : on quitte cette étape et on arrive à la
 * suivante, qui peut donc commencer le 6 sans chevauchement.
 *
 * Les nuits à couvrir vont du jour du départ à la veille du retour : le soir du retour, on
 * dort chez soi.
 */

type StopDates = Pick<Stop, 'arrivalDate' | 'departureDate'>;
type TripDates = Pick<Trip, 'startDate' | 'endDate'>;

/** Nombre de nuits passées à l'étape. */
export function stopNights(stop: StopDates): number {
  return daysBetween(stop.arrivalDate, stop.departureDate);
}

export function sortStops<T extends StopDates>(stops: readonly T[]): T[] {
  return [...stops].sort((a, b) => compareLocalDates(a.arrivalDate, b.arrivalDate));
}

/** Problème de dates empêchant d'enregistrer une étape. */
export type StopDateIssue =
  | { code: 'no_night' }
  | { code: 'outside_trip' }
  | { code: 'overlap'; withStop: Pick<Stop, 'id' | 'name'> };

/**
 * Vérifie les dates d'une étape avant de l'enregistrer.
 * `candidate.id` permet d'ignorer l'étape elle-même quand on la modifie.
 * Renvoie la liste des problèmes (vide si tout va bien) plutôt que de lever une erreur :
 * le formulaire affiche chaque problème sous le bon champ.
 */
export function validateStopDates(
  candidate: StopDates & { id?: string },
  trip: TripDates,
  otherStops: readonly Pick<Stop, 'id' | 'name' | 'arrivalDate' | 'departureDate'>[],
): StopDateIssue[] {
  const issues: StopDateIssue[] = [];

  if (candidate.departureDate <= candidate.arrivalDate) issues.push({ code: 'no_night' });

  if (candidate.arrivalDate < trip.startDate || candidate.departureDate > trip.endDate) {
    issues.push({ code: 'outside_trip' });
  }

  // Deux intervalles semi-ouverts [arrivée, départ[ se chevauchent si chacun commence avant
  // la fin de l'autre. Le jour de transition (départ de l'un = arrivée de l'autre) passe.
  for (const other of otherStops) {
    if (other.id === candidate.id) continue;
    if (
      candidate.arrivalDate < other.departureDate &&
      other.arrivalDate < candidate.departureDate
    ) {
      issues.push({ code: 'overlap', withStop: { id: other.id, name: other.name } });
    }
  }

  return issues;
}

/** Suite de nuits consécutives qu'aucune étape ne couvre. `to` est exclu (jour où l'on repart). */
export interface UncoveredNights {
  from: LocalDate;
  to: LocalDate;
  nights: number;
}

/**
 * Nuits du voyage sans étape, regroupées en plages continues (avertissement de F-2.1).
 *
 * Algorithme : on parcourt les étapes triées en gardant un « curseur » = première nuit pas
 * encore couverte. Si une étape commence après le curseur, l'intervalle entre les deux est un
 * trou. Le curseur avance ensuite jusqu'au départ de l'étape (s'il est plus loin). À la fin,
 * tout ce qui reste entre le curseur et le jour du retour est aussi un trou. Complexité :
 * O(n log n) pour le tri, puis un seul passage.
 */
export function findUncoveredNights(
  trip: TripDates,
  stops: readonly StopDates[],
): UncoveredNights[] {
  const gaps: UncoveredNights[] = [];
  const pushGap = (from: LocalDate, to: LocalDate) => {
    if (from < to) gaps.push({ from, to, nights: daysBetween(from, to) });
  };

  let cursor = trip.startDate;
  for (const stop of sortStops(stops)) {
    if (stop.departureDate <= trip.startDate || stop.arrivalDate >= trip.endDate) continue;
    pushGap(cursor, stop.arrivalDate < trip.endDate ? stop.arrivalDate : trip.endDate);
    if (stop.departureDate > cursor) cursor = stop.departureDate;
  }
  pushGap(cursor, trip.endDate);

  return gaps;
}

/**
 * Dates proposées pour une nouvelle étape : le premier trou du voyage s'il y en a un, sinon
 * `null` (le voyage est entièrement couvert, l'utilisateur choisira).
 */
export function suggestStopDates(
  trip: TripDates,
  stops: readonly StopDates[],
): { arrivalDate: LocalDate; departureDate: LocalDate } | null {
  const [firstGap] = findUncoveredNights(trip, stops);
  return firstGap ? { arrivalDate: firstGap.from, departureDate: firstGap.to } : null;
}

/** Une nuit du voyage et l'étape où on la passe (`null` si aucune). */
export interface TripNight {
  date: LocalDate;
  stopId: string | null;
}

/**
 * Toutes les nuits du voyage, dans l'ordre, avec leur étape. Sert à dessiner la frise du
 * planning. Si deux étapes se chevauchent (données importées), la première arrivée l'emporte.
 */
export function nightsByStop(
  trip: TripDates,
  stops: readonly (StopDates & { id: string })[],
): TripNight[] {
  const sorted = sortStops(stops);
  const nights: TripNight[] = [];
  for (let date = trip.startDate; date < trip.endDate; date = addDays(date, 1)) {
    const stop = sorted.find((s) => s.arrivalDate <= date && date < s.departureDate);
    nights.push({ date, stopId: stop?.id ?? null });
  }
  return nights;
}

/** Dernière nuit passée à l'étape (veille du départ), utile pour l'affichage « 3 → 5 juil. ». */
export function lastNight(stop: StopDates): LocalDate {
  return addDays(stop.departureDate, -1);
}
