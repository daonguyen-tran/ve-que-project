import { describe, expect, it } from 'vitest';
import { toLocalDate as d } from '../shared/local-date';
import {
  compareInDay,
  dayItems,
  defaultItemKind,
  nextPosition,
  planningProgress,
  summarizeDay,
} from './day-plan';
import type { PlannedItem } from './itinerary';
import { dropLegacySlots } from './slot-migration';

const day1 = d('2027-07-04');
const day2 = d('2027-07-05');

type Item = Pick<
  PlannedItem,
  'id' | 'date' | 'position' | 'createdAt' | 'time' | 'kind' | 'status'
>;

function item(id: string, partial: Partial<Item> = {}): Item {
  return {
    id,
    date: day1,
    position: 0,
    createdAt: '2027-01-01T00:00:00.000Z',
    time: null,
    kind: 'activity',
    status: 'planned',
    ...partial,
  };
}

const ids = (list: readonly { id: string }[]) => list.map((entry) => entry.id);

describe('defaultItemKind', () => {
  it('propose « en famille » au village', () => {
    expect(defaultItemKind('village')).toBe('family');
    expect(defaultItemKind('city')).toBe('activity');
    expect(defaultItemKind(null)).toBe('activity');
  });
});

describe('dayItems', () => {
  it('met les heures dans l’ordre, puis les éléments sans heure dans l’ordre d’ajout', () => {
    const items = [
      item('sans-2', { position: 3 }),
      item('soir', { time: '19:30', position: 0 }),
      item('sans-1', { position: 1 }),
      item('matin', { time: '08:30', position: 2 }),
      item('autre-jour', { date: day2 }),
    ];
    expect(ids(dayItems(items, day1))).toEqual(['matin', 'soir', 'sans-1', 'sans-2']);
  });

  it('départage deux éléments au même rang par ancienneté, puis par identifiant', () => {
    const items = [item('b', { createdAt: '2027-01-02T00:00:00.000Z' }), item('c'), item('a')];
    expect(ids(dayItems(items, day1))).toEqual(['a', 'c', 'b']);
    expect(
      compareInDay(item('x', { time: '10:00' }), item('y', { time: '10:00', position: 1 })),
    ).toBeLessThan(0);
  });
});

describe('nextPosition', () => {
  it('place après le plus grand rang du jour, sans compter l’élément déplacé', () => {
    const items = [
      item('a', { position: 0 }),
      item('b', { position: 4 }),
      item('c', { date: day2, position: 9 }),
    ];
    expect(nextPosition(items, day1)).toBe(5);
    expect(nextPosition(items, day1, 'b')).toBe(1);
    expect(nextPosition(items, d('2027-07-06'))).toBe(0);
  });
});

describe('summarizeDay et planningProgress', () => {
  const items = [
    item('a'),
    item('libre', { kind: 'free_time' }),
    item('annulé', { status: 'cancelled' }),
    item('libre-j2', { date: day2, kind: 'free_time' }),
  ];

  it('compte les éléments actifs et repère une journée de temps libre', () => {
    expect(summarizeDay(items, day1)).toEqual({ count: 2, onlyFreeTime: false });
    expect(summarizeDay(items, day2)).toEqual({ count: 1, onlyFreeTime: true });
    expect(summarizeDay(items, d('2027-07-06'))).toEqual({ count: 0, onlyFreeTime: false });
  });

  it('compte les jours où quelque chose est prévu', () => {
    expect(
      planningProgress([{ date: day1 }, { date: day2 }, { date: d('2027-07-06') }], items),
    ).toEqual({
      plannedDays: 2,
      totalDays: 3,
    });
  });
});

describe('dropLegacySlots', () => {
  it('retire le créneau et renumérote chaque journée dans l’ancien ordre', () => {
    const legacy = [
      { id: 'soir', tripId: 't', date: day1, slot: 'evening', position: 0, createdAt: 'x' },
      { id: 'aprem-2', tripId: 't', date: day1, slot: 'afternoon', position: 1, createdAt: 'x' },
      { id: 'matin', tripId: 't', date: day1, slot: 'morning', position: 0, createdAt: 'x' },
      { id: 'aprem-1', tripId: 't', date: day1, slot: 'afternoon', position: 0, createdAt: 'x' },
      { id: 'j2', tripId: 't', date: day2, slot: 'evening', position: 3, createdAt: 'x' },
      { id: 'autre-voyage', tripId: 'u', date: day1, slot: 'evening', position: 5, createdAt: 'x' },
    ];
    const migrated = dropLegacySlots(legacy);
    expect(migrated.every((entry) => !('slot' in entry))).toBe(true);
    expect(Object.fromEntries(migrated.map((entry) => [entry.id, entry.position]))).toEqual({
      matin: 0,
      'aprem-1': 1,
      'aprem-2': 2,
      soir: 3,
      j2: 0,
      'autre-voyage': 0,
    });
  });
});
