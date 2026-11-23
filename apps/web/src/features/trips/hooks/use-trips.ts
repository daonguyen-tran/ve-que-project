import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import type { EntityId, Member, Trip } from '@ve-que/domain';
import { useRepositories } from '@/app/providers/repositories-context';
import { TripService } from '../services/trip-service';

/** Le service des voyages, construit une fois par jeu de repositories. */
export function useTripService(): TripService {
  const repositories = useRepositories();
  return useMemo(() => new TripService(repositories), [repositories]);
}

/**
 * Un voyage, tenu à jour en direct.
 * - `undefined` : chargement en cours ;
 * - `null` : le voyage n'existe pas (ou a été supprimé).
 */
export function useTrip(tripId: EntityId | undefined): Trip | null | undefined {
  const repositories = useRepositories();
  return useLiveQuery(
    async () => (tripId ? ((await repositories.trips.getById(tripId)) ?? null) : null),
    [repositories, tripId],
  );
}

/** Membres d'un voyage : « Moi » d'abord, puis par ordre d'ajout. */
export function useMembers(tripId: EntityId | undefined): Member[] | undefined {
  const repositories = useRepositories();
  return useLiveQuery(async () => {
    if (!tripId) return [];
    const members = await repositories.members.listByTrip(tripId);
    return members.sort((a, b) =>
      a.isMe !== b.isMe ? (a.isMe ? -1 : 1) : a.createdAt.localeCompare(b.createdAt),
    );
  }, [repositories, tripId]);
}
