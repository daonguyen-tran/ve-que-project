import {
  TIME_SLOTS,
  toLocalDate,
  type LocalDate,
  type PlannedItem,
  type TimeSlot,
} from '@ve-que/domain';
import { slotItems } from '@ve-que/domain';

/*
 * État du tableau de glisser-déposer : pour chaque créneau visible, la liste ordonnée des ids.
 *
 * Pendant un glisser, l'élément change de créneau **dans cet état local** à chaque survol
 * (c'est ce qui fait de la place sous le doigt) ; la base n'est écrite qu'au dépôt.
 */

/** Identifiant d'un créneau pour le glisser-déposer : `2027-07-04|morning`. */
export type ContainerId = `${string}|${TimeSlot}`;
export type Columns = Record<ContainerId, string[]>;

/** Ids d'un créneau (liste vide si le créneau n'est pas affiché). */
export function idsIn(columns: Columns, key: ContainerId): string[] {
  return columns[key] ?? [];
}

export function containerId(date: LocalDate, slot: TimeSlot): ContainerId {
  return `${date}|${slot}`;
}

export function parseContainerId(id: ContainerId): { date: LocalDate; slot: TimeSlot } {
  const [date, slot] = id.split('|') as [string, TimeSlot];
  return { date: toLocalDate(date), slot };
}

export function isContainerId(id: string): id is ContainerId {
  return /^\d{4}-\d{2}-\d{2}\|(morning|afternoon|evening)$/.test(id);
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

/** Créneau qui contient un id d'élément, ou l'id lui-même s'il désigne déjà un créneau. */
export function findContainer(columns: Columns, id: string): ContainerId | undefined {
  if (isContainerId(id) && id in columns) return id;
  return (Object.keys(columns) as ContainerId[]).find((key) => idsIn(columns, key).includes(id));
}

/**
 * Fait passer `activeId` dans le créneau survolé. `overId` est soit un élément (on se place à
 * son rang, ou juste après si on arrive par le bas), soit un créneau (on se place à la fin).
 */
export function moveAcross(
  columns: Columns,
  activeId: string,
  overId: string,
  below: boolean,
): Columns {
  const from = findContainer(columns, activeId);
  const to = findContainer(columns, overId);
  if (!from || !to || from === to) return columns;

  const target = idsIn(columns, to);
  const overIndex = target.indexOf(overId);
  const index = overIndex === -1 ? target.length : overIndex + (below ? 1 : 0);
  return {
    ...columns,
    [from]: idsIn(columns, from).filter((id) => id !== activeId),
    [to]: [...target.slice(0, index), activeId, ...target.slice(index)],
  };
}

/** Réordonne dans un même créneau (équivalent de `arrayMove`). */
export function moveWithin(columns: Columns, activeId: string, overId: string): Columns {
  const key = findContainer(columns, activeId);
  if (!key || findContainer(columns, overId) !== key) return columns;
  const list = [...idsIn(columns, key)];
  const from = list.indexOf(activeId);
  const to = list.indexOf(overId);
  if (from === -1 || to === -1 || from === to) return columns;
  list.splice(to, 0, ...list.splice(from, 1));
  return { ...columns, [key]: list };
}
