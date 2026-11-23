import { currentDayNumber, daysUntilStart, tripLength, tripPhase, type Trip } from '@ve-que/domain';
import { t } from '@/shared/i18n';

/** Libellé d'état d'un voyage : « Départ dans 220 jours », « En cours · jour 6 sur 21 »… */
export function tripStatusLabel(trip: Trip, now: Date): string {
  if (trip.archivedAt) return t.trips.phase.archived;
  switch (tripPhase(trip, now)) {
    case 'upcoming':
      return t.trips.phase.upcoming(daysUntilStart(trip, now));
    case 'ongoing':
      return t.trips.phase.ongoing(currentDayNumber(trip, now) ?? 1, tripLength(trip));
    case 'past':
      return t.trips.phase.past;
  }
}
