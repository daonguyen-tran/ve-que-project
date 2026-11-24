import { describe, expect, it } from 'vitest';
import { createEntity, toLocalDate as d, type PlannedItem } from '@ve-que/domain';
import { buildColumns, containerId, idsIn } from './plan-board';

const item = (id: string, date: string, slot: PlannedItem['slot'], order: number) =>
  ({
    ...createEntity<PlannedItem>({ tripId: 't' } as PlannedItem, new Date('2027-01-01')),
    id,
    date: d(date),
    slot,
    order,
    time: null,
  }) as PlannedItem;

describe('plan-board', () => {
  it('range les éléments par créneau, dans l’ordre, pour les jours demandés', () => {
    const items = [
      item('b', '2027-07-04', 'morning', 2),
      item('a', '2027-07-04', 'morning', 1),
      item('c', '2027-07-04', 'evening', 1),
      item('hors', '2027-07-09', 'morning', 1),
    ];
    const columns = buildColumns(items, [d('2027-07-04')]);
    expect(idsIn(columns, containerId(d('2027-07-04'), 'morning'))).toEqual(['a', 'b']);
    expect(idsIn(columns, containerId(d('2027-07-04'), 'afternoon'))).toEqual([]);
    expect(idsIn(columns, containerId(d('2027-07-04'), 'evening'))).toEqual(['c']);
    // Un jour non demandé n'a pas de colonne.
    expect(idsIn(columns, containerId(d('2027-07-09'), 'morning'))).toEqual([]);
  });
});
