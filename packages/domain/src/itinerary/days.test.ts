import { describe, expect, it } from 'vitest';
import { toLocalDate as d } from '../shared/local-date';
import { deriveTripDays, findStopOverlaps, findUncoveredDays } from './days';

const trip = { startDate: d('2027-07-01'), endDate: d('2027-07-05') };
const saigon = { id: 'saigon', arrivalDate: d('2027-07-01'), departureDate: d('2027-07-03') };
const hoiAn = { id: 'hoi-an', arrivalDate: d('2027-07-03'), departureDate: d('2027-07-05') };

describe('deriveTripDays', () => {
  it('rattache chaque jour à l’étape où l’on dort', () => {
    const days = deriveTripDays(trip, [hoiAn, saigon]);
    expect(days.map((day) => [day.dayNumber, day.stopId])).toEqual([
      [1, 'saigon'],
      [2, 'saigon'],
      [3, 'hoi-an'],
      [4, 'hoi-an'],
      [5, 'hoi-an'],
    ]);
  });

  it('marque les jours de transition', () => {
    const days = deriveTripDays(trip, [saigon, hoiAn]);
    expect(days.filter((day) => day.isTransition).map((day) => day.date)).toEqual(['2027-07-03']);
  });

  it('signale les jours non couverts', () => {
    const days = deriveTripDays(trip, [saigon]);
    expect(findUncoveredDays(days)).toEqual(['2027-07-04', '2027-07-05']);
  });

  it('traverse correctement un changement de mois', () => {
    const days = deriveTripDays({ startDate: d('2027-07-30'), endDate: d('2027-08-02') }, []);
    expect(days.map((day) => day.date)).toEqual([
      '2027-07-30',
      '2027-07-31',
      '2027-08-01',
      '2027-08-02',
    ]);
  });
});

describe('findStopOverlaps', () => {
  it('n’considère pas le jour de transition comme un chevauchement', () => {
    expect(findStopOverlaps([saigon, hoiAn])).toEqual([]);
  });

  it('détecte un vrai chevauchement', () => {
    const hue = { id: 'hue', arrivalDate: d('2027-07-02'), departureDate: d('2027-07-04') };
    expect(findStopOverlaps([saigon, hoiAn, hue]).map(([a, b]) => [a.id, b.id])).toEqual([
      ['saigon', 'hue'],
      ['hoi-an', 'hue'],
    ]);
  });
});
