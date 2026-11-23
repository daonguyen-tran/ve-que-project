import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import type { Idea } from '@ve-que/domain';
import { useRepositories } from '@/app/providers/repositories-context';
import { IdeaService } from '../services/idea-service';

export function useIdeaService(): IdeaService {
  const repositories = useRepositories();
  return useMemo(() => new IdeaService(repositories), [repositories]);
}

/** Idées du voyage, tenues à jour en direct. */
export function useIdeas(tripId: string | undefined): Idea[] | undefined {
  const repositories = useRepositories();
  return useLiveQuery(
    async () => (tripId ? repositories.ideas.listByTrip(tripId) : []),
    [repositories, tripId],
  );
}
