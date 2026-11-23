import type { LocalTime } from '../shared/common-schemas';
import type { LocalDate } from '../shared/local-date';
import {
  TIME_SLOTS,
  type PlannedItem,
  type PlannedItemKind,
  type StopKind,
  type TimeSlot,
} from './itinerary';
import type { TripDay } from './days';

/*
 * Programme d'une journée : trois créneaux (matin, après-midi, soir), chacun contenant une
 * liste ordonnée d'éléments (F-2.5 à F-2.9).
 *
 * L'ordre dans un créneau est porté par `position`, un entier. On garde une numérotation
 * **dense** (0, 1, 2…) : chaque déplacement renumérote les créneaux touchés. C'est plus simple
 * que des positions fractionnaires et largement assez rapide pour quelques éléments par
 * créneau. Si deux appareils ont réordonné le même créneau, la fusion peut laisser deux
 * éléments à la même position ; le tri départage alors par date de création, et le prochain
 * déplacement renumérote proprement. Rien ne casse, l'ordre reste stable.
 */

/** Éléments qui occupent du temps : les éléments annulés restent affichés mais ne comptent pas. */
export function isActiveItem(item: Pick<PlannedItem, 'status'>): boolean {
  return item.status !== 'cancelled';
}

/**
 * Créneau qui correspond à une heure précise. Les bornes (12 h et 18 h) sont celles d'une
 * journée de voyage : on déjeune vers midi, on dîne après 18 h.
 */
export function slotForTime(time: LocalTime): TimeSlot {
  if (time < '12:00') return 'morning';
  if (time < '18:00') return 'afternoon';
  return 'evening';
}

/**
 * Type d'élément proposé par défaut : « en famille » les jours passés au village (F-2.11),
 * une activité ailleurs.
 */
export function defaultItemKind(stopKind: StopKind | null): PlannedItemKind {
  return stopKind === 'village' ? 'family' : 'activity';
}

type Placed = Pick<PlannedItem, 'id' | 'date' | 'slot' | 'position' | 'createdAt'>;

/** Ordre d'affichage dans un créneau : position, puis ancienneté, puis id (ordre total). */
export function compareInSlot(a: Placed, b: Placed): number {
  return (
    a.position - b.position || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
  );
}

/** Éléments d'un créneau, dans l'ordre d'affichage. */
export function slotItems<T extends Placed>(
  items: readonly T[],
  date: LocalDate,
  slot: TimeSlot,
): T[] {
  return items.filter((item) => item.date === date && item.slot === slot).sort(compareInSlot);
}

/** Les trois créneaux d'une journée, dans l'ordre. */
export function dayPlan<T extends Placed>(
  items: readonly T[],
  date: LocalDate,
): Array<{ slot: TimeSlot; items: T[] }> {
  return TIME_SLOTS.map((slot) => ({ slot, items: slotItems(items, date, slot) }));
}

/**
 * Où placer un élément dans un créneau, pour que les horaires restent dans l'ordre sans imposer
 * de tri (l'utilisateur peut toujours réordonner à la main) :
 * - sans heure : à la fin ;
 * - avec une heure : juste après le dernier élément prévu à la même heure ou plus tôt ;
 * - sinon, juste avant le premier élément prévu plus tard ;
 * - sinon (aucun élément horodaté) : à la fin.
 */
export function insertionIndex(
  ordered: ReadonlyArray<Pick<PlannedItem, 'time'>>,
  time: LocalTime | null,
): number {
  if (time === null) return ordered.length;
  const earlier = ordered.findLastIndex((item) => item.time !== null && item.time <= time);
  if (earlier !== -1) return earlier + 1;
  const later = ordered.findIndex((item) => item.time !== null && item.time > time);
  return later === -1 ? ordered.length : later;
}

export interface PlacementTarget {
  date: LocalDate;
  slot: TimeSlot;
  /** Rang voulu dans le créneau d'arrivée (borné à la taille du créneau). */
  index: number;
}

/** Nouvel emplacement d'un élément ; seuls les éléments qui changent sont renvoyés. */
export interface PlacementChange {
  id: string;
  date: LocalDate;
  slot: TimeSlot;
  position: number;
}

/**
 * Déplace un élément (même créneau, autre créneau ou autre jour) et renvoie les changements à
 * enregistrer (F-2.9).
 *
 * Algorithme : on retire l'élément de son créneau, on l'insère au rang voulu dans le créneau
 * d'arrivée, puis on renumérote 0…n-1 les deux créneaux. On ne renvoie que les éléments dont
 * le jour, le créneau ou la position change : un déplacement touche donc peu d'entités, ce qui
 * limite les écritures et les conflits de synchronisation.
 */
export function planMove<T extends Placed>(
  items: readonly T[],
  itemId: string,
  target: PlacementTarget,
): PlacementChange[] {
  const moving = items.find((item) => item.id === itemId);
  if (!moving) return [];

  const source = slotItems(items, moving.date, moving.slot).filter((item) => item.id !== itemId);
  const sameSlot = moving.date === target.date && moving.slot === target.slot;
  const destination = sameSlot
    ? source
    : slotItems(items, target.date, target.slot).filter((item) => item.id !== itemId);

  const index = Math.max(0, Math.min(target.index, destination.length));
  const arranged: Placed[] = [...destination];
  arranged.splice(index, 0, moving);

  const changes: PlacementChange[] = [];
  const renumber = (list: readonly Placed[], date: LocalDate, slot: TimeSlot) => {
    list.forEach((item, position) => {
      if (item.date !== date || item.slot !== slot || item.position !== position) {
        changes.push({ id: item.id, date, slot, position });
      }
    });
  };
  renumber(arranged, target.date, target.slot);
  if (!sameSlot) renumber(source, moving.date, moving.slot);
  return changes;
}

export interface SlotSummary {
  /** Éléments non annulés. */
  count: number;
  /** Le créneau contient un bloc « temps libre ». */
  hasFreeTime: boolean;
}

/** Résumé d'une journée pour la vue d'ensemble : ce qui est prévu dans chaque créneau. */
export function summarizeDay(
  items: ReadonlyArray<Pick<PlannedItem, 'date' | 'slot' | 'kind' | 'status'>>,
  date: LocalDate,
): Record<TimeSlot, SlotSummary> {
  const summary = Object.fromEntries(
    TIME_SLOTS.map((slot) => [slot, { count: 0, hasFreeTime: false }]),
  ) as Record<TimeSlot, SlotSummary>;
  for (const item of items) {
    if (item.date !== date || !isActiveItem(item)) continue;
    summary[item.slot].count += 1;
    if (item.kind === 'free_time') summary[item.slot].hasFreeTime = true;
  }
  return summary;
}

/**
 * Avancement de la préparation (objectif O3 : chaque jour planifié avant le départ).
 * Un jour compte comme planifié dès qu'un de ses créneaux contient quelque chose, temps libre
 * compris : un après-midi libre choisi est un plan, pas un oubli.
 */
export function planningProgress(
  days: ReadonlyArray<Pick<TripDay, 'date'>>,
  items: ReadonlyArray<Pick<PlannedItem, 'date' | 'status'>>,
): { plannedDays: number; totalDays: number } {
  const planned = new Set(items.filter(isActiveItem).map((item) => item.date));
  return {
    plannedDays: days.filter((day) => planned.has(day.date)).length,
    totalDays: days.length,
  };
}
