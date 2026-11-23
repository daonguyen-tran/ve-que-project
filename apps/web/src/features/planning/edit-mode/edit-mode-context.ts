import { createContext, useContext } from 'react';

/**
 * Mode du planning : lecture (par défaut) ou édition.
 *
 * En lecture, le planning est un récapitulatif : on n'affiche que ce qui existe (étapes,
 * trajets, activités), sans boutons d'ajout, sans poignées de glisser-déposer et sans
 * signaler les trous. En édition, tous les outils de planification réapparaissent.
 */
export interface PlanningEditModeState {
  editing: boolean;
  setEditing(editing: boolean): void;
}

export const PlanningEditModeContext = createContext<PlanningEditModeState | null>(null);

/** Mode lecture / édition partagé par tous les écrans du planning. */
export function usePlanningEditMode(): PlanningEditModeState {
  const state = useContext(PlanningEditModeContext);
  if (!state) {
    throw new Error('usePlanningEditMode doit être utilisé sous <PlanningEditModeProvider>.');
  }
  return state;
}

/** Les écrans du planning : vue d'ensemble, fiche d'une étape, programme d'un jour. */
export function isPlanningPath(pathname: string): boolean {
  return pathname === '/planning' || pathname.startsWith('/planning/');
}
