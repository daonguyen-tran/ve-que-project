import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { sortStops, type EntityId, type Stop } from '@ve-que/domain';
import { useRepositories } from '@/app/providers/repositories-context';
import { StopService } from '../services/stop-service';

export function useStopService(): StopService {
  const repositories = useRepositories();
  return useMemo(() => new StopService(repositories), [repositories]);
}

/** Étapes d'un voyage dans l'ordre chronologique, tenues à jour en direct. */
export function useStops(tripId: EntityId | undefined): Stop[] | undefined {
  const repositories = useRepositories();
  return useLiveQuery(
    async () => (tripId ? sortStops(await repositories.stops.listByTrip(tripId)) : []),
    [repositories, tripId],
  );
}
