/*
 * Modèle du sélecteur d'heure : fonctions pures, sans React, testées à part.
 *
 * Une heure est une chaîne « HH:MM » sur 24 h (format des champs de formulaire et du domaine),
 * ou `''` tant que rien n'est choisi.
 */

export const HOURS: readonly number[] = Array.from({ length: 24 }, (_, hour) => hour);
/** Toutes les minutes : avec des roues, la minute près reste rapide à atteindre. */
export const MINUTES: readonly number[] = Array.from({ length: 60 }, (_, minute) => minute);

/** Position proposée quand le champ est vide (les roues doivent bien s'arrêter quelque part). */
export const DEFAULT_TIME: TimeParts = { hour: 9, minute: 0 };

export interface TimeParts {
  hour: number;
  minute: number;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** « 09:30 » → { hour: 9, minute: 30 } ; `null` si la chaîne n'est pas une heure valide. */
export function parseTime(value: string | null | undefined): TimeParts | null {
  const match = value ? TIME_PATTERN.exec(value) : null;
  return match ? { hour: Number(match[1]), minute: Number(match[2]) } : null;
}

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatTime({ hour, minute }: TimeParts): string {
  return `${pad2(hour)}:${pad2(minute)}`;
}

/*
 * Roues : chaque valeur occupe une ligne de hauteur fixe, et la valeur choisie est celle qui
 * s'arrête au centre. Les marges haute et basse de la colonne valent exactement la distance
 * entre le haut de la zone visible et la ligne centrale : la valeur n° i est donc centrée
 * quand le défilement vaut i × hauteur de ligne.
 */

/** Index de la ligne centrée pour un défilement donné (borné à la liste). */
export function indexAtScroll(scrollTop: number, rowHeight: number, count: number): number {
  return Math.min(Math.max(Math.round(scrollTop / rowHeight), 0), count - 1);
}

/** Valeur voisine dans la liste (flèches du clavier), sans dépasser les bouts. */
export function stepThrough<V>(values: readonly V[], current: V, delta: number): V {
  const index = values.indexOf(current);
  const next = Math.min(Math.max((index < 0 ? 0 : index) + delta, 0), values.length - 1);
  return values[next] as V;
}
