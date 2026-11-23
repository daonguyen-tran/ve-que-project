import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useMemo, type ReactNode } from 'react';
import { pickActiveTrip } from '@ve-que/domain';
import { SETTING_KEYS } from '@/infrastructure/repositories/settings-store';
import { ActiveTripContext, type ActiveTripState } from './active-trip-context';
import { useRepositories } from './repositories-context';

/**
 * Calcule une fois, pour toute l'appli, la liste des voyages et le voyage actif.
 *
 * La requête lit deux tables (voyages et réglages) dans le même `useLiveQuery` : créer un
 * voyage ou en choisir un autre met donc à jour tous les écrans d'un coup. La règle du choix
 * vit dans le domaine (`pickActiveTrip`) ; ce composant ne fait que la brancher sur la base.
 */
export function ActiveTripProvider({ children }: { children: ReactNode }) {
  const repositories = useRepositories();

  const data = useLiveQuery(async () => {
    const [trips, preferredId] = await Promise.all([
      repositories.trips.listAll(),
      repositories.settings.get<string>(SETTING_KEYS.activeTripId),
    ]);
    return { trips, preferredId };
  }, [repositories]);

  const chooseTrip = useCallback(
    (tripId: string) => repositories.settings.set(SETTING_KEYS.activeTripId, tripId),
    [repositories],
  );

  const value = useMemo<ActiveTripState>(() => {
    if (!data) return { isLoading: true, trips: [], activeTrip: null, chooseTrip };
    const trips = [...data.trips].sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
    return {
      isLoading: false,
      trips,
      activeTrip: pickActiveTrip(trips, new Date(), data.preferredId) ?? null,
      chooseTrip,
    };
  }, [data, chooseTrip]);

  return <ActiveTripContext value={value}>{children}</ActiveTripContext>;
}
