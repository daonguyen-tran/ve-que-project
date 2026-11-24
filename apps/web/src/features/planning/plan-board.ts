import {
  slotItems,
  TIME_SLOTS,
  type LocalDate,
  type PlannedItem,
  type TimeSlot,
} from '@ve-que/domain';

/*
 * Programme rangé par créneau : pour chaque créneau visible, la liste ordonnée des ids de ses
 * éléments. Construit une fois pour plusieurs jours, il sert à l'affichage de chaque journée.
 */

/** Identifiant d'un créneau : `2027-07-04|morning`. */
export type ContainerId = `${string}|${TimeSlot}`;
export type Columns = Record<ContainerId, string[]>;

/** Ids d'un créneau (liste vide si le créneau n'est pas affiché). */
export function idsIn(columns: Columns, key: ContainerId): string[] {
  return columns[key] ?? [];
}

export function containerId(date: LocalDate, slot: TimeSlot): ContainerId {
  return `${date}|${slot}`;
}

/** Colonnes des jours affichés, dans l'ordre d'affichage du domaine. */
export function buildColumns(items: readonly PlannedItem[], dates: readonly LocalDate[]): Columns {
  const columns = {} as Columns;
  for (const date of dates) {
    for (const slot of TIME_SLOTS) {
      columns[containerId(date, slot)] = slotItems(items, date, slot).map((item) => item.id);
    }
  }
  return columns;
}
