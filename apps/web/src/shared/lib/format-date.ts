import type { LocalDate } from '@ve-que/domain';

/*
 * Formatage des dates locales (`LocalDate`, « AAAA-MM-JJ ») en français.
 *
 * Piège classique : `new Date('2027-07-01')` est minuit **UTC**. Formaté dans le fuseau du
 * navigateur (Paris en hiver, UTC+1), ça reste le 1er ; mais à New York ce serait le 30 juin.
 * On construit donc la date en UTC et on la formate **en UTC** : le jour affiché est
 * toujours celui écrit dans la chaîne, quel que soit le fuseau de l'appareil.
 */

function toUtcDate(date: LocalDate): Date {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day));
}

const longFormat = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});
const dayMonthYear = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** « lundi 12 juillet » → avec une majuscule : « Lundi 12 juillet ». */
export function formatLongDate(date: LocalDate): string {
  const text = longFormat.format(toUtcDate(date));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** « 1 – 21 juil. 2027 », ou « 28 juin – 19 juil. 2027 » sur deux mois. */
export function formatDateRange(start: LocalDate, end: LocalDate): string {
  // `formatRange` regroupe intelligemment ce qui est commun (mois, année).
  return dayMonthYear.formatRange(toUtcDate(start), toUtcDate(end));
}

const shortFormat = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});
const monthShortFormat = new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: 'UTC' });
const weekdayShortFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', timeZone: 'UTC' });

/** « 4 juil. » */
export function formatShortDate(date: LocalDate): string {
  return shortFormat.format(toUtcDate(date));
}

/** Morceaux d'une date pour un bloc calendrier : jour du mois, mois et jour de semaine abrégés. */
export function dateParts(date: LocalDate): { day: number; month: string; weekday: string } {
  const utc = toUtcDate(date);
  return {
    day: utc.getUTCDate(),
    month: monthShortFormat.format(utc),
    weekday: weekdayShortFormat.format(utc),
  };
}
