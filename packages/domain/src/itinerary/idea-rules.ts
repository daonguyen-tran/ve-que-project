import type { LocalTime } from '../shared/common-schemas';
import { addDays, type LocalDate } from '../shared/local-date';
import { Money } from '../money/money';
import { isActiveItem } from './day-plan';
import type { TripDay } from './days';
import type { Idea, IdeaCategory, OpeningRange } from './idea';
import type { PlannedItem, Stop, TimeSlot } from './itinerary';

/*
 * Règles de la banque d'idées (F-3.1 à F-3.3).
 */

// ─── Villes ──────────────────────────────────────────────────────────────────────────────

/**
 * Clé de comparaison d'un nom de ville : sans accents, sans casse, espaces réduits.
 * « Hội An », « Hoi An » et « hoi  an » désignent la même ville. Le `đ` vietnamien n'est pas
 * une lettre accentuée pour Unicode (pas de décomposition NFD) : on le remplace à part.
 */
export function cityKey(city: string): string {
  return city
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export interface CityGroup {
  key: string;
  /** Orthographe affichée : celle de l'étape si elle existe, sinon la première rencontrée. */
  name: string;
  count: number;
}

/**
 * Villes de la banque d'idées, dans l'ordre du voyage (ordre des étapes), puis les autres par
 * ordre alphabétique. Les étapes sans idée sont incluses (compte 0) : c'est là qu'il en manque.
 */
export function cityGroups(
  ideas: ReadonlyArray<Pick<Idea, 'city'>>,
  stops: ReadonlyArray<Pick<Stop, 'name'>>,
): CityGroup[] {
  const groups = new Map<string, CityGroup>();
  for (const stop of stops) {
    const key = cityKey(stop.name);
    if (!groups.has(key)) groups.set(key, { key, name: stop.name, count: 0 });
  }
  const fromStops = groups.size;
  for (const idea of ideas) {
    const key = cityKey(idea.city);
    const group = groups.get(key);
    if (group) group.count += 1;
    else groups.set(key, { key, name: idea.city.trim(), count: 1 });
  }
  const list = [...groups.values()];
  const extra = list.slice(fromStops).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  return [...list.slice(0, fromStops), ...extra];
}

// ─── Planification ───────────────────────────────────────────────────────────────────────

/** Éléments planifiés (non annulés) issus de chaque idée, par date puis créneau. */
export function plannedByIdea(items: ReadonlyArray<PlannedItem>): Map<string, PlannedItem[]> {
  const order: Record<TimeSlot, number> = { morning: 0, afternoon: 1, evening: 2 };
  const map = new Map<string, PlannedItem[]>();
  for (const item of items) {
    if (!item.ideaId || !isActiveItem(item)) continue;
    const list = map.get(item.ideaId) ?? [];
    list.push(item);
    map.set(item.ideaId, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.date.localeCompare(b.date) || order[a.slot] - order[b.slot]);
  }
  return map;
}

/**
 * Jour proposé pour planifier une idée : le premier jour (à partir d'aujourd'hui pendant le
 * voyage) passé dans une étape du même nom que la ville de l'idée ; à défaut, le premier jour.
 */
export function suggestDayForCity(
  days: ReadonlyArray<TripDay>,
  stops: ReadonlyArray<Pick<Stop, 'id' | 'name'>>,
  city: string,
  from?: LocalDate,
): LocalDate | undefined {
  const key = cityKey(city);
  const stopIds = new Set(stops.filter((stop) => cityKey(stop.name) === key).map((s) => s.id));
  const candidates = days.filter((day) => !from || day.date >= from);
  const match = candidates.find((day) => day.stopId !== null && stopIds.has(day.stopId));
  return (match ?? candidates[0] ?? days[0])?.date;
}

/** Coût estimé pour le groupe : prix par personne × nombre de voyageurs. */
export function groupCost(pricePerPerson: Money | null, travellers: number): Money | null {
  if (!pricePerPerson) return null;
  return Money.multiply(pricePerPerson, Math.max(1, travellers));
}

// ─── Filtres et tri (F-3.2) ──────────────────────────────────────────────────────────────

export type IdeaPlanFilter = 'all' | 'unplanned' | 'planned';
export type IdeaSort = 'priority' | 'duration' | 'price';

export interface IdeaFilter {
  cityKey: string | null;
  category: IdeaCategory | null;
  plan: IdeaPlanFilter;
}

export function filterIdeas<T extends Pick<Idea, 'id' | 'city' | 'category'>>(
  ideas: readonly T[],
  filter: IdeaFilter,
  planned: ReadonlyMap<string, unknown>,
): T[] {
  return ideas.filter(
    (idea) =>
      (filter.cityKey === null || cityKey(idea.city) === filter.cityKey) &&
      (filter.category === null || idea.category === filter.category) &&
      (filter.plan === 'all' || (filter.plan === 'planned') === planned.has(idea.id)),
  );
}

/**
 * Tri : « priorité » met les incontournables d'abord ; « durée » et « prix » vont du plus
 * court / moins cher au plus long / plus cher, les prix inconnus en dernier. À égalité, les
 * incontournables passent devant, puis l'ordre alphabétique.
 */
export function sortIdeas<
  T extends Pick<Idea, 'title' | 'priority' | 'durationMinutes' | 'pricePerPerson'>,
>(ideas: readonly T[], sort: IdeaSort): T[] {
  const priority = (idea: T) => (idea.priority === 'must' ? 0 : 1);
  const price = (idea: T) =>
    idea.pricePerPerson ? idea.pricePerPerson.amountMinor : Number.POSITIVE_INFINITY;
  const primary: (idea: T) => number =
    sort === 'duration' ? (idea) => idea.durationMinutes : sort === 'price' ? price : priority;
  return [...ideas].sort(
    (a, b) =>
      primary(a) - primary(b) || priority(a) - priority(b) || a.title.localeCompare(b.title, 'fr'),
  );
}

// ─── Horaires d'ouverture ────────────────────────────────────────────────────────────────

export type OpeningStatus = 'open' | 'closed' | 'unknown';

/**
 * Fenêtre horaire de chaque créneau, en minutes depuis minuit. Le matin commence à 6 h : avant,
 * on dort (ou on prend un bus de nuit).
 */
const SLOT_WINDOW: Record<TimeSlot, [number, number]> = {
  morning: [6 * 60, 12 * 60],
  afternoon: [12 * 60, 18 * 60],
  evening: [18 * 60, 24 * 60],
};

function minutes(time: LocalTime): number {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Jour de la semaine d'une date locale, convention `Date.getDay()` (0 = dimanche). */
function weekday(date: LocalDate): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/**
 * Intervalles d'ouverture d'une journée, en minutes `[début, fin)`.
 *
 * Une plage dont la fermeture précède l'ouverture déborde sur le lendemain (marché de nuit
 * 17:00 → 01:00) : elle ouvre `[17 h, minuit)` le jour même et `[0 h, 1 h)` le lendemain.
 * C'est pourquoi on regarde aussi les plages de la **veille**. Ouverture = fermeture signifie
 * ouvert 24 h sur 24.
 */
export function openIntervals(
  hours: readonly OpeningRange[],
  date: LocalDate,
): Array<[number, number]> {
  const today = weekday(date);
  const yesterday = weekday(addDays(date, -1));
  const intervals: Array<[number, number]> = [];
  for (const range of hours) {
    const open = minutes(range.open);
    const close = minutes(range.close);
    if (range.days.includes(today)) {
      if (open === close) intervals.push([0, 24 * 60]);
      else intervals.push([open, close > open ? close : 24 * 60]);
    }
    if (close < open && range.days.includes(yesterday)) intervals.push([0, close]);
  }
  return intervals;
}

/**
 * L'idée est-elle ouverte ce jour-là, à cette heure ou pendant ce créneau ?
 * Sans heure précise, « ouvert » signifie ouvert à un moment du créneau. Sans horaires
 * connus, la réponse est `unknown` : on ne bloque jamais une idée faute d'information.
 */
export function openingStatus(
  hours: readonly OpeningRange[] | null,
  date: LocalDate,
  when: { slot: TimeSlot; time: LocalTime | null },
): OpeningStatus {
  if (!hours || hours.length === 0) return 'unknown';
  const intervals = openIntervals(hours, date);
  if (when.time) {
    const at = minutes(when.time);
    return intervals.some(([start, end]) => start <= at && at < end) ? 'open' : 'closed';
  }
  const [from, to] = SLOT_WINDOW[when.slot];
  return intervals.some(([start, end]) => start < to && from < end) ? 'open' : 'closed';
}
