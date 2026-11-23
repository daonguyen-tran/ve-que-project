import { createContext, useContext } from 'react';
import type { Trip } from '@ve-que/domain';

export interface ActiveTripState {
  /** `undefined` tant que la base n'a pas répondu (premier rendu). */
  isLoading: boolean;
  /** Tous les voyages non supprimés, archivés compris, du plus récent au plus ancien. */
  trips: Trip[];
  /** Voyage ouvert par défaut ; `null` s'il n'y en a aucun. */
  activeTrip: Trip | null;
  /** Choisit explicitement le voyage actif (mémorisé sur l'appareil). */
  chooseTrip(tripId: string): Promise<void>;
}

export const ActiveTripContext = createContext<ActiveTripState | null>(null);

/** Voyage actif et liste des voyages, partagés par tous les écrans. */
export function useActiveTrip(): ActiveTripState {
  const state = useContext(ActiveTripContext);
  if (!state) throw new Error('useActiveTrip doit être utilisé sous <ActiveTripProvider>.');
  return state;
}
