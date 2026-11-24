/** Vues du planning : l'itinéraire, le détail jour par jour et la carte. */
export type PlanningView = 'itinerary' | 'days' | 'map';

/** Vue lue dans l'URL (`?vue=jours`, `?vue=carte`) ; l'itinéraire par défaut. */
export function planningViewFromParam(param: string | null): PlanningView {
  return param === 'jours' ? 'days' : param === 'carte' ? 'map' : 'itinerary';
}
