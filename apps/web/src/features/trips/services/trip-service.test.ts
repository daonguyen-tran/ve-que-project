import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CannotRemoveOwnerError, createEntity, toLocalDate, type Stop } from '@ve-que/domain';
import { VeQueDatabase } from '@/infrastructure/db/database';
import { createRepositories, type Repositories } from '@/infrastructure/repositories';
import { SETTING_KEYS } from '@/infrastructure/repositories/settings-store';
import { TripService } from './trip-service';

describe('TripService', () => {
  let db: VeQueDatabase;
  let repositories: Repositories;
  let service: TripService;
  const now = new Date('2026-11-23T10:00:00Z');

  const input = {
    name: 'Vietnam 2027',
    startDate: toLocalDate('2027-07-01'),
    endDate: toLocalDate('2027-07-21'),
    ownerName: 'Dao',
    companionNames: ['Maman', 'Papa', 'Linh'],
  };

  beforeEach(() => {
    db = new VeQueDatabase(`test-${crypto.randomUUID()}`);
    repositories = createRepositories(db);
    service = new TripService(repositories, () => now);
  });

  afterEach(async () => {
    await db.delete();
  });

  it('crée le voyage, ses quatre membres, et l’affiche par défaut', async () => {
    const trip = await service.createTrip(input);

    expect(await repositories.trips.getById(trip.id)).toEqual(trip);
    const members = await repositories.members.listByTrip(trip.id);
    expect(members.map((m) => m.name).sort()).toEqual(['Dao', 'Linh', 'Maman', 'Papa']);
    expect(members.filter((m) => m.isMe).map((m) => m.name)).toEqual(['Dao']);
    expect(await repositories.settings.get(SETTING_KEYS.activeTripId)).toBe(trip.id);
  });

  it('n’enregistre rien si la création échoue (transaction)', async () => {
    await expect(
      service.createTrip({ ...input, endDate: toLocalDate('2027-06-01') }),
    ).rejects.toThrow();
    expect(await repositories.trips.listAll()).toEqual([]);
  });

  it('refuse une modification qui rendrait le voyage invalide', async () => {
    const trip = await service.createTrip(input);
    await expect(
      service.updateTrip(trip, { endDate: toLocalDate('2027-06-01') }),
    ).rejects.toThrow();
    expect((await repositories.trips.getById(trip.id))?.endDate).toBe('2027-07-21');
  });

  it('ajoute un voyageur avec une couleur libre, et protège « Moi »', async () => {
    const trip = await service.createTrip({ ...input, companionNames: [] });
    const added = await service.addMember(trip.id, '  Bà Ngoại ');
    expect(added).toMatchObject({ name: 'Bà Ngoại', color: 'jade', isMe: false });

    const [me] = (await repositories.members.listByTrip(trip.id)).filter((m) => m.isMe);
    await expect(service.removeMember(me!)).rejects.toThrow(CannotRemoveOwnerError);
  });

  it('supprime le voyage et tout son contenu en cascade', async () => {
    const trip = await service.createTrip(input);
    await repositories.stops.save(
      createEntity<Stop>({
        tripId: trip.id,
        name: 'Hoi An',
        kind: 'city',
        arrivalDate: toLocalDate('2027-07-03'),
        departureDate: toLocalDate('2027-07-06'),
        place: { address: '', vietnamese: 'Hội An', location: null },
        notes: '',
      }),
    );

    await service.deleteTrip(trip.id);

    expect(await repositories.trips.getById(trip.id)).toBeUndefined();
    expect(await repositories.members.listByTrip(trip.id)).toEqual([]);
    expect(await repositories.stops.listByTrip(trip.id)).toEqual([]);
    expect(await repositories.settings.get(SETTING_KEYS.activeTripId)).toBeUndefined();
  });
});
