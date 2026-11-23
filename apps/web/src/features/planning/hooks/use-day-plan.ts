import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import {
  deriveTripDays,
  type PlannedItem,
  type Stop,
  type Trip,
  type TripDay,
} from '@ve-que/domain';
import { useRepositories } from '@/app/providers/repositories-context';
import { useStops } from '@/features/itinerary/hooks/use-stops';
import { PlannedItemService } from '../services/planned-item-service';

export function usePlannedItemService(): PlannedItemService {
  const repositories = useRepositories();
  return useMemo(() => new PlannedItemService(repositories), [repositories]);
}

/** Tous les éléments planifiés du voyage (quelques centaines au plus), en direct. */
export function usePlannedItems(tripId: string | undefined): PlannedItem[] | undefined {
  const repositories = useRepositories();
  return useLiveQuery(
    async () => (tripId ? repositories.plannedItems.listByTrip(tripId) : []),
    [repositories, tripId],
  );
}

export interface TripCalendar {
  days: TripDay[];
  stopsById: Map<string, Stop>;
}

/** Jours du voyage et étape de chacun (dérivés, jamais stockés : F-2.4). */
export function useTripCalendar(trip: Trip | null | undefined): TripCalendar | undefined {
  const stops = useStops(trip?.id);
  return useMemo(() => {
    if (!trip || stops === undefined) return undefined;
    return {
      days: deriveTripDays(trip, stops),
      stopsById: new Map(stops.map((stop) => [stop.id, stop])),
    };
  }, [trip, stops]);
}
