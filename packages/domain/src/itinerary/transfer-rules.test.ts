import { describe, expect, it } from 'vitest';
import { toLocalDate as d } from '../shared/local-date';
import {
  isOvernight,
  primaryAccommodation,
  stopTransitions,
  validateTransfer,
} from './transfer-rules';

const trip = { startDate: d('2027-07-01'), endDate: d('2027-07-21') };

describe('primaryAccommodation', () => {
  const acc = (id: string, status: 'considered' | 'booked' | 'cancelled', createdAt: string) => ({
    id,
    status,
    createdAt,
  });

  it('préfère l’hébergement réservé', () => {
    const list = [acc('a', 'considered', '1'), acc('b', 'booked', '2')];
    expect(primaryAccommodation(list)?.id).toBe('b');
  });

  it('sinon le premier envisagé, et jamais un annulé', () => {
    const list = [
      acc('a', 'cancelled', '1'),
      acc('b', 'considered', '3'),
      acc('c', 'considered', '2'),
    ];
    expect(primaryAccommodation(list)?.id).toBe('c');
    expect(primaryAccommodation([acc('a', 'cancelled', '1')])).toBeUndefined();
  });
});

describe('stopTransitions', () => {
  const stop = (id: string, a: string, b: string) => ({
    id,
    arrivalDate: d(a),
    departureDate: d(b),
  });
  const saigon = stop('saigon', '2027-07-01', '2027-07-04');
  const hoiAn = stop('hoian', '2027-07-04', '2027-07-08');
  const hue = stop('hue', '2027-07-08', '2027-07-10');

  it('relie chaque étape à la suivante avec son trajet, hors trajets annulés', () => {
    const transfers = [
      { fromStopId: 'saigon', toStopId: 'hoian', status: 'booked' as const },
      { fromStopId: 'hoian', toStopId: 'hue', status: 'cancelled' as const },
    ];
    const transitions = stopTransitions([hue, saigon, hoiAn], transfers);
    expect(transitions.map((tr) => [tr.from.id, tr.to.id, tr.transfer?.status])).toEqual([
      ['saigon', 'hoian', 'booked'],
      ['hoian', 'hue', undefined],
    ]);
  });
});

describe('validateTransfer', () => {
  const base = {
    fromStopId: 'a',
    toStopId: 'b',
    departDate: d('2027-07-04'),
    departTime: '10:30',
    arriveDate: d('2027-07-04'),
    arriveTime: '11:50',
  };

  it('accepte un vol du matin', () => {
    expect(validateTransfer(base, trip)).toEqual([]);
  });

  it('accepte un trajet sans heures le même jour', () => {
    expect(validateTransfer({ ...base, departTime: null, arriveTime: null }, trip)).toEqual([]);
  });

  it('accepte un bus de nuit qui arrive le lendemain', () => {
    const night = {
      ...base,
      departTime: '20:00',
      arriveDate: d('2027-07-05'),
      arriveTime: '07:00',
    };
    expect(validateTransfer(night, trip)).toEqual([]);
    expect(isOvernight(night)).toBe(true);
  });

  it('refuse une arrivée avant le départ', () => {
    const codes = validateTransfer({ ...base, arriveTime: '09:00' }, trip).map((i) => i.code);
    expect(codes).toEqual(['arrives_before_departure']);
  });

  it('refuse un trajet vers la même étape ou hors du voyage', () => {
    const codes = validateTransfer(
      { ...base, toStopId: 'a', departDate: d('2027-06-30') },
      trip,
    ).map((i) => i.code);
    expect(codes).toEqual(['same_stop', 'outside_trip']);
  });
});
