import { z } from 'zod';

/**
 * Date « calendaire » sans heure ni fuseau, au format `YYYY-MM-DD`.
 *
 * Pourquoi ne pas utiliser `Date` ?
 * Un objet `Date` représente un **instant**. Le même instant n'est pas le même jour partout :
 * une dépense faite à Hoi An le 14 juillet à 23 h 30 (UTC+7) correspond au 14 juillet 18 h 30
 * à Paris, mais un dîner à 6 h du matin heure de Paris serait déjà le lendemain au Vietnam.
 * Les jours du voyage, les créneaux et les dates d'étape sont donc des dates locales du lieu,
 * manipulées comme des chaînes. Les calculs passent par UTC, qui n'a pas de changement d'heure,
 * pour que « ajouter un jour » ajoute toujours exactement 24 h.
 */
export type LocalDate = string & { readonly __brand: 'LocalDate' };

export const localDateSchema = z.iso.date().transform((value) => value as LocalDate);

const MS_PER_DAY = 86_400_000;

export function isLocalDate(value: string): value is LocalDate {
  return localDateSchema.safeParse(value).success;
}

export function toLocalDate(value: string): LocalDate {
  if (!isLocalDate(value)) {
    throw new RangeError(`Date invalide : « ${value} » (format attendu : AAAA-MM-JJ)`);
  }
  return value;
}

/** Date locale d'un instant dans un fuseau IANA donné (ex. `Asia/Ho_Chi_Minh`). */
export function localDateOf(instant: Date, timeZone: string): LocalDate {
  // L'option `en-CA` produit directement le format AAAA-MM-JJ.
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
  return toLocalDate(formatted);
}

function toUtcMs(date: LocalDate): number {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return Date.UTC(year, month - 1, day);
}

function fromUtcMs(ms: number): LocalDate {
  return new Date(ms).toISOString().slice(0, 10) as LocalDate;
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return fromUtcMs(toUtcMs(date) + days * MS_PER_DAY);
}

/** Nombre de jours de `from` à `to` (positif si `to` est après `from`). */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY);
}

/** Comparaison utilisable dans `Array.prototype.sort`. Le format ISO se trie comme du texte. */
export function compareLocalDates(a: LocalDate, b: LocalDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Tous les jours de `start` à `end`, bornes incluses. */
export function eachDay(start: LocalDate, end: LocalDate): LocalDate[] {
  const count = daysBetween(start, end);
  if (count < 0) return [];
  return Array.from({ length: count + 1 }, (_, i) => addDays(start, i));
}
