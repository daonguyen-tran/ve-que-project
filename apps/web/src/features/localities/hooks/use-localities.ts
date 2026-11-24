import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import type { Locality } from '@ve-que/domain';
import { useRepositories } from '@/app/providers/repositories-context';
import { LocalityService } from '../services/locality-service';

export function useLocalityService(): LocalityService {
  const repositories = useRepositories();
  return useMemo(() => new LocalityService(repositories), [repositories]);
}

/** « Mes lieux », tenus à jour en direct. */
export function useSavedLocalities(): Locality[] | undefined {
  const repositories = useRepositories();
  return useLiveQuery(() => repositories.localities.listAll(), [repositories]);
}
