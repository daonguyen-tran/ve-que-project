import type { LocalDate } from '../shared/local-date';
import type { PlannedItem, PlannedItemKind, StopKind } from './itinerary';
import type { TripDay } from './days';

/*
 * Programme d'une journée (F-2.5 à F-2.9) : une seule liste, dans l'ordre chronologique.
 *
 * Il n'y a pas de créneaux (matin, après-midi, soir) : l'heure suffit à situer une activité.
 * Règle d'ordre (`compareInDay`) :
 *   1. d'abord les éléments **avec une heure**, de la plus tôt à la plus tardive ;
 *   2. puis ceux **sans heure**, dans l'ordre où ils ont été ajoutés.
 *
 * Ce second ordre est porté par `position`, un entier attribué à l'ajout (`nextPosition`) :
 * le plus grand rang du jour + 1. Les rangs ne sont jamais renumérotés : un trou laissé par
 * une suppression ne gêne pas le tri. Si deux appareils ajoutent au même rang, le tri
 * départage par date de création, puis par identifiant : l'ordre reste stable.
 */

/** Éléments qui occupent du temps : les éléments annulés restent affichés mais ne comptent pas. */
export function isActiveItem(item: Pick<PlannedItem, 'status'>): boolean {
  return item.status !== 'cancelled';
}

/**
 * Type d'élément proposé par défaut : « en famille » les jours passés au village (F-2.11),
 * une activité ailleurs.
 */
export function defaultItemKind(stopKind: StopKind | null): PlannedItemKind {
  return stopKind === 'village' ? 'family' : 'activity';
}

type Placed = Pick<PlannedItem, 'id' | 'date' | 'time' | 'position' | 'createdAt'>;

/** Ordre d'affichage dans une journée : avec heure (chronologique), puis sans heure (ajout). */
export function compareInDay(a: Placed, b: Placed): number {
  if (a.time !== null && b.time !== null) {
    const byTime = a.time.localeCompare(b.time);
    if (byTime !== 0) return byTime;
  } else if (a.time !== null) {
    return -1;
  } else if (b.time !== null) {
    return 1;
  }
  return (
    a.position - b.position || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
  );
}

/** Éléments d'une journée, dans l'ordre d'affichage. */
export function dayItems<T extends Placed>(items: readonly T[], date: LocalDate): T[] {
  return items.filter((item) => item.date === date).sort(compareInDay);
}

/** Rang à donner à un élément ajouté (ou déplacé) ce jour-là : après tous les autres. */
export function nextPosition(
  items: ReadonlyArray<Pick<PlannedItem, 'id' | 'date' | 'position'>>,
  date: LocalDate,
  exceptId?: string,
): number {
  let max = -1;
  for (const item of items) {
    if (item.date === date && item.id !== exceptId) max = Math.max(max, item.position);
  }
  return max + 1;
}

export interface DaySummary {
  /** Éléments non annulés. */
  count: number;
  /** La journée ne contient que du temps libre (au moins un bloc). */
  onlyFreeTime: boolean;
}

/** Résumé d'une journée pour la vue d'ensemble « Jour par jour ». */
export function summarizeDay(
  items: ReadonlyArray<Pick<PlannedItem, 'date' | 'kind' | 'status'>>,
  date: LocalDate,
): DaySummary {
  const active = items.filter((item) => item.date === date && isActiveItem(item));
  return {
    count: active.length,
    onlyFreeTime: active.length > 0 && active.every((item) => item.kind === 'free_time'),
  };
}

/**
 * Avancement de la préparation (objectif O3 : chaque jour planifié avant le départ).
 * Un jour compte comme planifié dès qu'il contient quelque chose, temps libre
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
