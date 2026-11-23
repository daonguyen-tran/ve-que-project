import { describe, expect, it } from 'vitest';
import { toLocalDate as d } from '../shared/local-date';
import {
  findUncoveredNights,
  nightsByStop,
  sortStops,
  stopNights,
  suggestStopDates,
  validateStopDates,
} from './stop-rules';

const trip = { startDate: d('2027-07-01'), endDate: d('2027-07-21') };
const stop = (id: string, arrival: string, departure: string) => ({
  id,
  name: id,
  arrivalDate: d(arrival),
  departureDate: d(departure),
});

const saigon = stop('Saigon', '2027-07-01', '2027-07-04');
const hoiAn = stop('Hoi An', '2027-07-04', '2027-07-08');

describe('stopNights', () => {
  it('compte les nuits (arrivée incluse, départ exclu)', () => {
    expect(stopNights(saigon)).toBe(3);
  });
});

describe('validateStopDates', () => {
  it('accepte une étape qui commence le jour où la précédente se termine', () => {
    expect(validateStopDates(hoiAn, trip, [saigon])).toEqual([]);
  });

  it('exige au moins une nuit', () => {
    const codes = validateStopDates(stop('X', '2027-07-10', '2027-07-10'), trip, []).map(
      (i) => i.code,
    );
    expect(codes).toEqual(['no_night']);
  });

  it('refuse une étape hors des dates du voyage', () => {
    const codes = validateStopDates(stop('X', '2027-06-29', '2027-07-02'), trip, []).map(
      (i) => i.code,
    );
    expect(codes).toEqual(['outside_trip']);
  });

  it('nomme l’étape avec laquelle elle se chevauche', () => {
    const issues = validateStopDates(stop('Hue', '2027-07-03', '2027-07-05'), trip, [
      saigon,
      hoiAn,
    ]);
    expect(issues).toEqual([
      { code: 'overlap', withStop: { id: 'Saigon', name: 'Saigon' } },
      { code: 'overlap', withStop: { id: 'Hoi An', name: 'Hoi An' } },
    ]);
  });

  it('ignore l’étape elle-même lors d’une modification', () => {
    const moved = { ...hoiAn, departureDate: d('2027-07-09') };
    expect(validateStopDates(moved, trip, [saigon, hoiAn])).toEqual([]);
  });
});

describe('findUncoveredNights', () => {
  it('signale tout le voyage quand il n’y a aucune étape', () => {
    expect(findUncoveredNights(trip, [])).toEqual([
      { from: '2027-07-01', to: '2027-07-21', nights: 20 },
    ]);
  });

  it('trouve les trous au début, au milieu et à la fin', () => {
    const late = stop('Saigon', '2027-07-02', '2027-07-04');
    const after = stop('Hue', '2027-07-06', '2027-07-10');
    expect(findUncoveredNights(trip, [after, late])).toEqual([
      { from: '2027-07-01', to: '2027-07-02', nights: 1 },
      { from: '2027-07-04', to: '2027-07-06', nights: 2 },
      { from: '2027-07-10', to: '2027-07-21', nights: 11 },
    ]);
  });

  it('ne compte pas la nuit du retour', () => {
    const all = stop('Partout', '2027-07-01', '2027-07-21');
    expect(findUncoveredNights(trip, [all])).toEqual([]);
  });

  it('résiste aux étapes qui se chevauchent ou débordent du voyage', () => {
    const a = stop('A', '2027-06-28', '2027-07-05');
    const b = stop('B', '2027-07-03', '2027-07-25');
    expect(findUncoveredNights(trip, [a, b])).toEqual([]);
  });
});

describe('suggestStopDates', () => {
  it('propose le premier trou', () => {
    expect(suggestStopDates(trip, [saigon, hoiAn])).toEqual({
      arrivalDate: '2027-07-08',
      departureDate: '2027-07-21',
    });
  });

  it('ne propose rien si tout est couvert', () => {
    expect(suggestStopDates(trip, [stop('A', '2027-07-01', '2027-07-21')])).toBeNull();
  });
});

describe('sortStops', () => {
  it('trie par date d’arrivée', () => {
    expect(sortStops([hoiAn, saigon]).map((s) => s.id)).toEqual(['Saigon', 'Hoi An']);
  });
});

describe('nightsByStop', () => {
  it('associe chaque nuit à son étape, sans la nuit du retour', () => {
    const short = { startDate: d('2027-07-01'), endDate: d('2027-07-05') };
    expect(nightsByStop(short, [stop('A', '2027-07-01', '2027-07-03')])).toEqual([
      { date: '2027-07-01', stopId: 'A' },
      { date: '2027-07-02', stopId: 'A' },
      { date: '2027-07-03', stopId: null },
      { date: '2027-07-04', stopId: null },
    ]);
  });
});
