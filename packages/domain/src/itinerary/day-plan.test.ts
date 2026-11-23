import { describe, expect, it } from 'vitest';
import { toLocalDate as d } from '../shared/local-date';
import {
  dayPlan,
  defaultItemKind,
  insertionIndex,
  planMove,
  planningProgress,
  slotForTime,
  summarizeDay,
} from './day-plan';
import type { PlannedItem } from './itinerary';

const day1 = d('2027-07-04');
const day2 = d('2027-07-05');

type Item = Pick<
  PlannedItem,
  'id' | 'date' | 'slot' | 'position' | 'createdAt' | 'time' | 'kind' | 'status'
>;

function item(id: string, partial: Partial<Item> = {}): Item {
  return {
    id,
    date: day1,
    slot: 'morning',
    position: 0,
    createdAt: '2027-01-01T00:00:00.000Z',
    time: null,
    kind: 'activity',
    status: 'planned',
    ...partial,
  };
}

const ids = (list: readonly { id: string }[]) => list.map((entry) => entry.id);

describe('slotForTime', () => {
  it('range une heure dans son créneau', () => {
    expect(slotForTime('08:30')).toBe('morning');
    expect(slotForTime('11:59')).toBe('morning');
    expect(slotForTime('12:00')).toBe('afternoon');
    expect(slotForTime('18:00')).toBe('evening');
    expect(slotForTime('23:30')).toBe('evening');
  });
});

describe('defaultItemKind', () => {
  it('propose « en famille » au village', () => {
    expect(defaultItemKind('village')).toBe('family');
    expect(defaultItemKind('city')).toBe('activity');
    expect(defaultItemKind(null)).toBe('activity');
  });
});

describe('dayPlan', () => {
  it('trie chaque créneau par position, puis par ancienneté en cas d’égalité', () => {
    const items = [
      item('b', { position: 1 }),
      item('c', { position: 0, createdAt: '2027-01-02T00:00:00.000Z' }),
      item('a', { position: 0 }),
      item('soir', { slot: 'evening' }),
      item('autre-jour', { date: day2 }),
    ];
    const plan = dayPlan(items, day1);
    expect(plan.map((slot) => slot.slot)).toEqual(['morning', 'afternoon', 'evening']);
    expect(ids(plan[0]!.items)).toEqual(['a', 'c', 'b']);
    expect(ids(plan[2]!.items)).toEqual(['soir']);
  });
});

describe('insertionIndex', () => {
  const ordered = [item('a', { time: '09:00' }), item('b'), item('c', { time: '11:00' })];
  it('ajoute à la fin sans heure', () => {
    expect(insertionIndex(ordered, null)).toBe(3);
  });
  it('place juste après le dernier élément prévu plus tôt', () => {
    expect(insertionIndex(ordered, '10:00')).toBe(1);
    expect(insertionIndex(ordered, '11:00')).toBe(3);
  });
  it('sinon, avant le premier élément prévu plus tard', () => {
    expect(insertionIndex(ordered, '08:00')).toBe(0);
    expect(insertionIndex([item('libre'), item('x', { time: '15:00' })], '14:00')).toBe(1);
  });
  it('à la fin si rien n’est horodaté', () => {
    expect(insertionIndex([item('libre')], '14:00')).toBe(1);
  });
});

describe('planMove', () => {
  const items = [
    item('m0', { position: 0 }),
    item('m1', { position: 1 }),
    item('m2', { position: 2 }),
    item('a0', { slot: 'afternoon', position: 0 }),
  ];

  it('réordonne dans un créneau en ne renvoyant que ce qui change', () => {
    expect(planMove(items, 'm2', { date: day1, slot: 'morning', index: 0 })).toEqual([
      { id: 'm2', date: day1, slot: 'morning', position: 0 },
      { id: 'm0', date: day1, slot: 'morning', position: 1 },
      { id: 'm1', date: day1, slot: 'morning', position: 2 },
    ]);
    expect(planMove(items, 'm1', { date: day1, slot: 'morning', index: 1 })).toEqual([]);
  });

  it('déplace vers un autre créneau et resserre le créneau quitté', () => {
    expect(planMove(items, 'm0', { date: day1, slot: 'afternoon', index: 1 })).toEqual([
      { id: 'm0', date: day1, slot: 'afternoon', position: 1 },
      { id: 'm1', date: day1, slot: 'morning', position: 0 },
      { id: 'm2', date: day1, slot: 'morning', position: 1 },
    ]);
  });

  it('déplace vers un autre jour, en bornant le rang', () => {
    expect(planMove(items, 'm2', { date: day2, slot: 'evening', index: 99 })).toEqual([
      { id: 'm2', date: day2, slot: 'evening', position: 0 },
    ]);
  });

  it('ne fait rien pour un élément inconnu', () => {
    expect(planMove(items, 'inconnu', { date: day1, slot: 'morning', index: 0 })).toEqual([]);
  });
});

describe('summarizeDay et planningProgress', () => {
  const items = [
    item('a'),
    item('libre', { slot: 'afternoon', kind: 'free_time' }),
    item('annulé', { slot: 'evening', status: 'cancelled' }),
    item('annulé-j2', { date: day2, status: 'cancelled' }),
  ];

  it('compte les éléments actifs de chaque créneau', () => {
    expect(summarizeDay(items, day1)).toEqual({
      morning: { count: 1, hasFreeTime: false },
      afternoon: { count: 1, hasFreeTime: true },
      evening: { count: 0, hasFreeTime: false },
    });
  });

  it('compte les jours où quelque chose est prévu', () => {
    expect(planningProgress([{ date: day1 }, { date: day2 }], items)).toEqual({
      plannedDays: 1,
      totalDays: 2,
    });
  });
});
