import { describe, expect, it } from 'vitest';
import { createEntity, markDeleted } from '../shared/entity';
import { toLocalDate as d } from '../shared/local-date';
import type { Trip } from './trip';
import {
  assertMemberRemovable,
  buildNewTrip,
  CannotRemoveOwnerError,
  currentDayNumber,
  daysUntilStart,
  nextMemberColor,
  pickActiveTrip,
  tripLength,
  tripPhase,
} from './trip-rules';

function trip(name: string, start: string, end: string, extra: Partial<Trip> = {}): Trip {
  return createEntity<Trip>({
    name,
    startDate: d(start),
    endDate: d(end),
    timeZone: 'Asia/Ho_Chi_Minh',
    referenceCurrency: 'EUR',
    dailyAllowance: null,
    splitEnabled: false,
    archivedAt: null,
    ...extra,
  });
}

const vietnam = trip('Vietnam 2027', '2027-07-01', '2027-07-21');
const japon = trip('Japon 2028', '2028-04-01', '2028-04-15');
const vietnam2025 = trip('Vietnam 2025', '2025-08-01', '2025-08-20');

describe('phase et calendrier d’un voyage', () => {
  it('compte les jours bornes incluses', () => {
    expect(tripLength(vietnam)).toBe(21);
  });

  it('calcule « aujourd’hui » dans le fuseau du voyage, pas celui de Paris', () => {
    // 30 juin, 20 h à Paris = 1er juillet, 1 h au Vietnam : le voyage a commencé.
    const now = new Date('2027-06-30T18:00:00Z');
    expect(tripPhase(vietnam, now)).toBe('ongoing');
    expect(currentDayNumber(vietnam, now)).toBe(1);
  });

  it('donne le compte à rebours et le numéro du jour', () => {
    expect(daysUntilStart(vietnam, new Date('2026-11-23T10:00:00Z'))).toBe(220);
    expect(currentDayNumber(vietnam, new Date('2027-07-06T05:00:00Z'))).toBe(6);
    expect(currentDayNumber(vietnam, new Date('2027-08-01T05:00:00Z'))).toBeNull();
  });
});

describe('pickActiveTrip', () => {
  const now = new Date('2027-07-06T05:00:00Z');

  it('respecte le choix explicite de l’utilisateur', () => {
    expect(pickActiveTrip([vietnam, japon], now, japon.id)).toBe(japon);
  });

  it('préfère le voyage en cours', () => {
    expect(pickActiveTrip([japon, vietnam2025, vietnam], now)).toBe(vietnam);
  });

  it('sinon le prochain voyage à venir', () => {
    const before = new Date('2026-11-23T10:00:00Z');
    expect(pickActiveTrip([japon, vietnam2025, vietnam], before)).toBe(vietnam);
  });

  it('sinon le dernier voyage terminé', () => {
    const after = new Date('2029-01-01T10:00:00Z');
    expect(pickActiveTrip([vietnam2025, vietnam, japon], after)).toBe(japon);
  });

  it('ignore les voyages archivés ou supprimés, même choisis', () => {
    const archived = { ...vietnam, archivedAt: '2027-08-01T00:00:00.000Z' };
    expect(pickActiveTrip([archived, japon], now, archived.id)).toBe(japon);
    expect(pickActiveTrip([markDeleted(japon)], now)).toBeUndefined();
  });
});

describe('buildNewTrip', () => {
  it('crée le voyage avec « Moi » et les compagnons, chacun avec sa couleur', () => {
    const { trip: created, members } = buildNewTrip({
      name: '  Vietnam 2027 ',
      startDate: d('2027-07-01'),
      endDate: d('2027-07-21'),
      ownerName: 'Dao',
      companionNames: ['Maman', '', 'Papa'],
    });

    expect(created.name).toBe('Vietnam 2027');
    expect(created.referenceCurrency).toBe('EUR');
    expect(members.map((m) => [m.name, m.isMe, m.color])).toEqual([
      ['Dao', true, 'laque'],
      ['Maman', false, 'jade'],
      ['Papa', false, 'indigo'],
    ]);
    expect(members.every((m) => m.tripId === created.id)).toBe(true);
  });

  it('refuse un voyage qui finit avant de commencer', () => {
    expect(() =>
      buildNewTrip({
        name: 'X',
        startDate: d('2027-07-21'),
        endDate: d('2027-07-01'),
        ownerName: 'Dao',
      }),
    ).toThrow();
  });
});

describe('membres', () => {
  it('attribue la première couleur libre', () => {
    expect(nextMemberColor([{ color: 'laque' }, { color: 'indigo' }])).toBe('jade');
  });

  it('interdit de retirer « Moi »', () => {
    expect(() => assertMemberRemovable({ isMe: true })).toThrow(CannotRemoveOwnerError);
    expect(() => assertMemberRemovable({ isMe: false })).not.toThrow();
  });
});
