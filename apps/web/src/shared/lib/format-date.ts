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

const fullFormat = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const monthYearFormat = new Intl.DateTimeFormat('fr-FR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const weekdayLongFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', timeZone: 'UTC' });

const mediumFormat = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** « jeu. 4 juil. 2027 » : valeur affichée dans un champ de date. */
export function formatMediumDate(date: LocalDate): string {
  return mediumFormat.format(toUtcDate(date));
}

/** « jeudi 4 juillet 2027 » : libellé complet d'un jour du calendrier, pour les lecteurs d'écran. */
export function formatFullDate(date: LocalDate): string {
  return fullFormat.format(toUtcDate(date));
}

/** « juillet 2027 » (`month` de 1 à 12). */
export function formatMonthYear(year: number, month: number): string {
  return monthYearFormat.format(new Date(Date.UTC(year, month - 1, 1)));
}

/** Jours de la semaine, du lundi au dimanche : « lun. » et « lundi ». */
export function weekdayNames(): Array<{ short: string; long: string }> {
  // Le 4 janvier 2027 est un lundi : on énumère les 7 jours qui suivent.
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.UTC(2027, 0, 4 + index));
    return { short: weekdayShortFormat.format(date), long: weekdayLongFormat.format(date) };
  });
}

const relative = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });
const dateTime = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

/** « aujourd’hui », « hier », « il y a 3 jours » : pour dater une action passée. */
export function formatDaysAgo(instant: string, now: Date = new Date()): string {
  const days = Math.floor((now.getTime() - new Date(instant).getTime()) / 86_400_000);
  return relative.format(-days, 'day');
}

/** « 23 novembre 2026 à 14:02 », dans le fuseau de l'appareil (c'est un instant, pas une date locale). */
export function formatDateTime(instant: string): string {
  return dateTime.format(new Date(instant));
}

/**
 * Heure à la française : « 14 h 30 », « 9 h ». Les espaces sont insécables, pour que l'heure
 * ne soit jamais coupée en fin de ligne.
 */
export function formatTime(time: string): string {
  const [hours = '0', minutes = '00'] = time.split(':');
  const h = String(Number(hours));
  return minutes === '00' ? `${h}\u00a0h` : `${h}\u00a0h\u00a0${minutes}`;
}

/** Durée : « 30 min », « 2 h », « 1 h 30 ». */
export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}\u00a0min`;
  if (minutes === 0) return `${hours}\u00a0h`;
  return `${hours}\u00a0h\u00a0${String(minutes).padStart(2, '0')}`;
}
