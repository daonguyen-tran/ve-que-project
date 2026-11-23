import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import type { Accommodation, EntityId, Transfer } from '@ve-que/domain';
import { useRepositories } from '@/app/providers/repositories-context';
import { AccommodationService } from '../services/accommodation-service';
import { TransferService } from '../services/transfer-service';

export function useAccommodationService(): AccommodationService {
  const repositories = useRepositories();
  return useMemo(() => new AccommodationService(repositories), [repositories]);
}

export function useTransferService(): TransferService {
  const repositories = useRepositories();
  return useMemo(() => new TransferService(repositories), [repositories]);
}

/** Hébergements d'un voyage, du plus ancien au plus récent. */
export function useAccommodations(tripId: EntityId | undefined): Accommodation[] | undefined {
  const repositories = useRepositories();
  return useLiveQuery(async () => {
    if (!tripId) return [];
    const list = await repositories.accommodations.listByTrip(tripId);
    return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [repositories, tripId]);
}

/** Trajets d'un voyage, par date de départ. */
export function useTransfers(tripId: EntityId | undefined): Transfer[] | undefined {
  const repositories = useRepositories();
  return useLiveQuery(async () => {
    if (!tripId) return [];
    const list = await repositories.transfers.listByTrip(tripId);
    return list.sort((a, b) =>
      `${a.departDate}${a.departTime ?? ''}`.localeCompare(`${b.departDate}${b.departTime ?? ''}`),
    );
  }, [repositories, tripId]);
}
