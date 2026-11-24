import { STOP_COLORS, type Stop, type StopColor, type StopKind } from './itinerary';

/**
 * Couleur d'une étape sans couleur enregistrée : celle de son type, comme avant l'arrivée du
 * choix de couleur (ville en indigo, village en jade, île en sarcelle). Les anciennes données
 * gardent ainsi leur apparence, sans migration de la base.
 */
const KIND_COLOR: Record<StopKind, StopColor> = {
  city: 'indigo',
  village: 'jade',
  island: 'sarcelle',
};

/** Couleur affichée d'une étape. */
export function stopColorOf(stop: Pick<Stop, 'kind' | 'color'>): StopColor {
  return stop.color ?? KIND_COLOR[stop.kind];
}

/**
 * Couleur proposée pour une nouvelle étape : la première de la palette qu'aucune autre étape
 * n'utilise encore. Au-delà de huit étapes, on reprend la palette en évitant au moins la
 * couleur de la dernière étape, pour que deux étapes voisines ne se confondent pas.
 */
export function suggestStopColor(
  stops: readonly Pick<Stop, 'kind' | 'color' | 'arrivalDate'>[],
): StopColor {
  const used = new Set(stops.map(stopColorOf));
  const free = STOP_COLORS.find((color) => !used.has(color));
  if (free) return free;
  const last = [...stops].sort((a, b) => a.arrivalDate.localeCompare(b.arrivalDate)).at(-1);
  const lastColor = last ? stopColorOf(last) : undefined;
  return STOP_COLORS[stops.length % STOP_COLORS.length] === lastColor
    ? STOP_COLORS[(stops.length + 1) % STOP_COLORS.length]!
    : STOP_COLORS[stops.length % STOP_COLORS.length]!;
}
