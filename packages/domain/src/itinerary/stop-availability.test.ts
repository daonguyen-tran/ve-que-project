import { describe, expect, it } from 'vitest';
import { toLocalDate as d } from '../shared/local-date';
import { stopAvailability } from './stop-availability';

const trip = { startDate: d('2027-07-01'), endDate: d('2027-07-21') };
const saigon = { id: 'saigon', arrivalDate: d('2027-07-01'), departureDate: d('2027-07-04') };
const hoiAn = { id: 'hoi-an', arrivalDate: d('2027-07-10'), departureDate: d('2027-07-14') };

describe('stopAvailability', () => {
  const availability = stopAvailability(trip, [saigon, hoiAn]);

  it('indique quelle étape occupe chaque nuit', () => {
    expect(availability.takenBy(d('2027-07-03'))).toBe(saigon);
    // Jour de départ de Saigon : sa nuit est libre.
    expect(availability.takenBy(d('2027-07-04'))).toBeUndefined();
    expect(availability.takenBy(d('2027-07-13'))).toBe(hoiAn);
  });

  it('autorise l’arrivée le jour de transition, pas pendant une autre étape', () => {
    expect(availability.canArrive(d('2027-07-04'))).toBe(true);
    expect(availability.canArrive(d('2027-07-02'))).toBe(false);
    expect(availability.canArrive(d('2027-07-14'))).toBe(true);
  });

  it('refuse d’arriver le dernier jour (pas de nuit) ou hors du voyage', () => {
    expect(availability.canArrive(d('2027-07-21'))).toBe(false);
    expect(availability.canArrive(d('2027-06-30'))).toBe(false);
  });

  it('arrête le départ au début de l’étape suivante, sans pouvoir la sauter', () => {
    expect(availability.latestDeparture(d('2027-07-04'))).toBe('2027-07-10');
    expect(availability.canDepart(d('2027-07-04'), d('2027-07-10'))).toBe(true);
    expect(availability.canDepart(d('2027-07-04'), d('2027-07-15'))).toBe(false);
    expect(availability.canDepart(d('2027-07-04'), d('2027-07-04'))).toBe(false);
  });

  it('va jusqu’au retour quand plus rien ne suit', () => {
    expect(availability.latestDeparture(d('2027-07-14'))).toBe('2027-07-21');
    expect(availability.latestDeparture(d('2027-07-02'))).toBeNull();
  });

  it('ignore l’étape en cours de modification', () => {
    const editing = stopAvailability(trip, [saigon, hoiAn], 'saigon');
    expect(editing.canArrive(d('2027-07-01'))).toBe(true);
    expect(editing.latestDeparture(d('2027-07-01'))).toBe('2027-07-10');
  });
});
