import { addDays, toLocalDate, type LocalDate } from '@ve-que/domain';

/*
 * Modèle du calendrier maison : fonctions pures, sans React, testées à part.
 *
 * Toutes les dates sont des `LocalDate` (« AAAA-MM-JJ »). Comme ces chaînes ont une largeur
 * fixe, leur ordre alphabétique est l'ordre chronologique : on les compare avec < et >.
 * Les calculs de jour de semaine passent par `Date.UTC`, jamais par le fuseau de l'appareil
 * (voir `format-date.ts` pour le piège évité).
 */

/** Un mois affiché : `month` va de 1 (janvier) à 12. */
export interface MonthRef {
  year: number;
  month: number;
}

/** Sélection d'un calendrier. Pour un jour seul, `start` et `end` sont la même date. */
export interface CalendarSelection {
  start: LocalDate | null;
  end: LocalDate | null;
}

export const EMPTY_SELECTION: CalendarSelection = { start: null, end: null };

const pad = (n: number) => String(n).padStart(2, '0');

export function monthOf(date: LocalDate): MonthRef {
  const [year, month] = date.split('-').map(Number) as [number, number];
  return { year, month };
}

export function firstDayOf({ year, month }: MonthRef): LocalDate {
  return toLocalDate(`${year}-${pad(month)}-01`);
}

export function addMonths({ year, month }: MonthRef, delta: number): MonthRef {
  // On passe par un index de mois absolu (année × 12 + mois) pour gérer les changements d'année.
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function sameMonth(a: MonthRef, b: MonthRef): boolean {
  return a.year === b.year && a.month === b.month;
}

/** Mois de `from` à `to` inclus (pour afficher toute une plage bornée d'un coup). */
export function monthsBetween(from: LocalDate, to: LocalDate): MonthRef[] {
  const months: MonthRef[] = [];
  const last = monthOf(to);
  for (let month = monthOf(from); ; month = addMonths(month, 1)) {
    months.push(month);
    if (sameMonth(month, last) || months.length > 24) break;
  }
  return months;
}

/** Jour de la semaine, lundi = 0 … dimanche = 6 (semaine à la française). */
export function weekdayIndex(date: LocalDate): number {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  // getUTCDay : dimanche = 0. On décale pour commencer la semaine le lundi.
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

/**
 * Grille d'un mois : des semaines de 7 cases, du lundi au dimanche. Les cases hors du mois
 * valent `null` (cases vides en début et en fin de grille).
 */
export function monthGrid(month: MonthRef): Array<Array<LocalDate | null>> {
  const first = firstDayOf(month);
  const weeks: Array<Array<LocalDate | null>> = [];
  let week: Array<LocalDate | null> = Array.from({ length: weekdayIndex(first) }, () => null);
  for (let date = first; sameMonth(monthOf(date), month); date = addDays(date, 1)) {
    week.push(date);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0)
    weeks.push([...week, ...Array.from({ length: 7 - week.length }, () => null)]);
  return weeks;
}

/** Règles de choix fournies par l'écran : le calendrier ne connaît pas le métier. */
export interface RangeRules {
  canStart(date: LocalDate): boolean;
  canEnd(start: LocalDate, date: LocalDate): boolean;
}

/**
 * Choix d'une plage en deux touches : la première fixe le début, la seconde la fin.
 *
 * - Sans début, ou avec une plage complète : la touche démarre une nouvelle plage.
 * - Avec un début seul : une fin valide termine la plage ; sinon, si le jour peut servir de
 *   début (ex. on a touché avant le début), on recommence à partir de lui.
 * - Un jour impossible ne change rien.
 */
export function nextRange(
  current: CalendarSelection,
  date: LocalDate,
  rules: RangeRules,
): CalendarSelection {
  if (current.start && !current.end && rules.canEnd(current.start, date)) {
    return { start: current.start, end: date };
  }
  return rules.canStart(date) ? { start: date, end: null } : current;
}

/** Ce jour peut-il être touché, vu l'état de la plage ? */
export function isPickable(
  current: CalendarSelection,
  date: LocalDate,
  rules: RangeRules,
): boolean {
  if (current.start && !current.end && rules.canEnd(current.start, date)) return true;
  return rules.canStart(date);
}

export type DayRole = 'start' | 'end' | 'single' | 'inside' | null;

/** Place d'un jour dans la sélection, pour son apparence. */
export function dayRole(selection: CalendarSelection, date: LocalDate): DayRole {
  const { start, end } = selection;
  if (!start) return null;
  if (date === start && (!end || end === start)) return 'single';
  if (date === start) return 'start';
  if (end && date === end) return 'end';
  if (end && date > start && date < end) return 'inside';
  return null;
}

/** Déplacement clavier dans la grille (motif « date picker » des ARIA Authoring Practices). */
export function moveByKey(date: LocalDate, key: string): LocalDate | null {
  switch (key) {
    case 'ArrowLeft':
      return addDays(date, -1);
    case 'ArrowRight':
      return addDays(date, 1);
    case 'ArrowUp':
      return addDays(date, -7);
    case 'ArrowDown':
      return addDays(date, 7);
    case 'Home':
      return addDays(date, -weekdayIndex(date));
    case 'End':
      return addDays(date, 6 - weekdayIndex(date));
    case 'PageUp':
    case 'PageDown': {
      // Même jour du mois précédent / suivant, ramené au dernier jour si le mois est plus court.
      const target = addMonths(monthOf(date), key === 'PageUp' ? -1 : 1);
      const day = Number(date.slice(8, 10));
      const lastDay = new Date(Date.UTC(target.year, target.month, 0)).getUTCDate();
      return toLocalDate(`${target.year}-${pad(target.month)}-${pad(Math.min(day, lastDay))}`);
    }
    default:
      return null;
  }
}

/** Ramène une date dans les bornes, si elles existent. */
export function clampDate(date: LocalDate, min?: LocalDate, max?: LocalDate): LocalDate {
  if (min && date < min) return min;
  if (max && date > max) return max;
  return date;
}
