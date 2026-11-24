import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createEntity, toLocalDate as d, type Accommodation, type Trip } from '@ve-que/domain';
import { TripService } from '@/features/trips/services/trip-service';
import { VeQueDatabase } from '@/infrastructure/db/database';
import { createRepositories, type Repositories } from '@/infrastructure/repositories';
import { StopDatesError, StopService, type StopInput } from './stop-service';

describe('StopService', () => {
  let db: VeQueDatabase;
  let repositories: Repositories;
  let service: StopService;
  let trip: Trip;

  const input = (name: string, arrival: string, departure: string): StopInput => ({
    name,
    kind: 'city',
    arrivalDate: d(arrival),
    departureDate: d(departure),
    vietnameseName: '',
    notes: '',
  });

  beforeEach(async () => {
    db = new VeQueDatabase(`test-${crypto.randomUUID()}`);
    repositories = createRepositories(db);
    service = new StopService(repositories);
    trip = await new TripService(repositories).createTrip({
      name: 'Vietnam 2027',
      startDate: d('2027-07-01'),
      endDate: d('2027-07-21'),
      ownerName: 'Dao',
    });
  });

  afterEach(async () => {
    await db.delete();
  });

  it('enregistre une étape avec son nom vietnamien', async () => {
    const stop = await service.createStop(trip, {
      ...input(' Hoi An ', '2027-07-04', '2027-07-08'),
      vietnameseName: 'Hội An',
    });
    expect(stop).toMatchObject({
      name: 'Hoi An',
      place: { vietnamese: 'Hội An' },
      tripId: trip.id,
    });
  });

  it('donne à chaque nouvelle étape une couleur encore libre, sauf choix explicite', async () => {
    const saigon = await service.createStop(trip, input('Saigon', '2027-07-01', '2027-07-04'));
    const hoiAn = await service.createStop(trip, input('Hoi An', '2027-07-04', '2027-07-08'));
    const hue = await service.createStop(trip, {
      ...input('Hue', '2027-07-08', '2027-07-10'),
      color: 'lotus',
    });
    expect([saigon.color, hoiAn.color, hue.color]).toEqual(['indigo', 'jade', 'lotus']);

    // Modifier l'étape sans toucher à la couleur la conserve.
    const renamed = await service.updateStop(
      trip,
      hoiAn,
      input('Hội An', '2027-07-04', '2027-07-08'),
    );
    expect(renamed.color).toBe('jade');
    const recolored = await service.updateStop(trip, renamed, {
      ...input('Hội An', '2027-07-04', '2027-07-08'),
      color: 'ocre',
    });
    expect(recolored.color).toBe('ocre');
  });

  it('refuse un chevauchement, même sans passer par le formulaire', async () => {
    await service.createStop(trip, input('Saigon', '2027-07-01', '2027-07-04'));
    const attempt = service.createStop(trip, input('Hue', '2027-07-03', '2027-07-05'));
    await expect(attempt).rejects.toBeInstanceOf(StopDatesError);
    expect(await repositories.stops.listByTrip(trip.id)).toHaveLength(1);
  });

  it('accepte de prolonger une étape sur ses propres dates', async () => {
    const saigon = await service.createStop(trip, input('Saigon', '2027-07-01', '2027-07-04'));
    const updated = await service.updateStop(
      trip,
      saigon,
      input('Saigon', '2027-07-01', '2027-07-05'),
    );
    expect(updated.departureDate).toBe('2027-07-05');
  });

  it('supprime aussi les hébergements de l’étape', async () => {
    const hoiAn = await service.createStop(trip, input('Hoi An', '2027-07-04', '2027-07-08'));
    await repositories.accommodations.save(
      createEntity<Accommodation>({
        tripId: trip.id,
        stopId: hoiAn.id,
        name: 'Homestay',
        place: { address: '', vietnamese: '', location: null },
        price: null,
        status: 'considered',
        bookingRef: '',
        url: null,
      }),
    );

    await service.deleteStop(hoiAn);

    expect(await repositories.stops.listByTrip(trip.id)).toEqual([]);
    expect(await repositories.accommodations.listByTrip(trip.id)).toEqual([]);
  });
});
