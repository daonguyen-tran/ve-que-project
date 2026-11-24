import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { dayItems, toLocalDate as d, type Trip } from '@ve-que/domain';
import { TripService } from '@/features/trips/services/trip-service';
import { VeQueDatabase } from '@/infrastructure/db/database';
import { createRepositories, type Repositories } from '@/infrastructure/repositories';
import { PlannedItemService, type PlannedItemInput } from './planned-item-service';

let db: VeQueDatabase | undefined;
afterEach(async () => {
  await db?.delete();
});

let tick = 0;
const clock = () => new Date(Date.UTC(2027, 0, 10, 10, tick++));

const day = d('2027-07-04');

async function setup(): Promise<{
  repositories: Repositories;
  service: PlannedItemService;
  trip: Trip;
}> {
  db = new VeQueDatabase(`test-${crypto.randomUUID()}`);
  const repositories = createRepositories(db, clock);
  const trip = await new TripService(repositories, clock).createTrip({
    name: 'Vietnam 2027',
    startDate: d('2027-07-01'),
    endDate: d('2027-07-21'),
    ownerName: 'Dao',
  });
  return { repositories, service: new PlannedItemService(repositories, clock), trip };
}

function input(title: string, partial: Partial<PlannedItemInput> = {}): PlannedItemInput {
  return {
    date: day,
    time: null,
    kind: 'activity',
    title,
    address: '',
    vietnameseAddress: '',
    durationMinutes: null,
    estimatedCost: null,
    status: 'planned',
    notes: '',
    ...partial,
  };
}

async function titles(repositories: Repositories, trip: Trip, date = day) {
  const items = await repositories.plannedItems.listByTrip(trip.id);
  return dayItems(items, date).map((item) => item.title);
}

describe('PlannedItemService', () => {
  it('met les heures dans l’ordre, puis les éléments sans heure dans l’ordre d’ajout', async () => {
    const { repositories, service, trip } = await setup();
    await service.create(trip, input('Marché', { time: '10:00' }));
    await service.create(trip, input('Café'));
    await service.create(trip, input('Dîner', { time: '19:30' }));
    await service.create(trip, input('Sieste', { kind: 'free_time' }));
    await service.create(trip, input('Pagode', { time: '08:00' }));

    expect(await titles(repositories, trip)).toEqual([
      'Pagode',
      'Marché',
      'Dîner',
      'Café',
      'Sieste',
    ]);
  });

  it('garde le rang d’un élément modifié ; changer l’heure le replace dans la journée', async () => {
    const { repositories, service, trip } = await setup();
    await service.create(trip, input('Pagode', { time: '08:00' }));
    const lunch = await service.create(trip, input('Déjeuner'));
    const market = await service.create(trip, input('Marché', { time: '10:00' }));
    await service.create(trip, input('Café'));
    expect(await titles(repositories, trip)).toEqual(['Pagode', 'Marché', 'Déjeuner', 'Café']);

    await service.update(lunch, input('Déjeuner au bord de l’eau'));
    expect(await titles(repositories, trip)).toEqual([
      'Pagode',
      'Marché',
      'Déjeuner au bord de l’eau',
      'Café',
    ]);

    await service.update(market, input('Marché', { time: '07:00' }));
    expect(await titles(repositories, trip)).toEqual([
      'Marché',
      'Pagode',
      'Déjeuner au bord de l’eau',
      'Café',
    ]);
  });

  it('déplace un élément vers un autre jour, après ceux qui y sont déjà', async () => {
    const { repositories, service, trip } = await setup();
    const market = await service.create(trip, input('Marché'));
    await service.create(trip, input('Café'));
    await service.create(trip, input('Plage', { date: d('2027-07-05') }));

    const moved = await service.update(market, input('Marché', { date: d('2027-07-05') }));
    expect(moved.updatedAt > market.updatedAt).toBe(true);
    expect(await titles(repositories, trip)).toEqual(['Café']);
    expect(await titles(repositories, trip, d('2027-07-05'))).toEqual(['Plage', 'Marché']);
  });

  it('enregistre le lieu seulement s’il est renseigné', async () => {
    const { service, trip } = await setup();
    const without = await service.create(trip, input('Temps libre', { kind: 'free_time' }));
    const withPlace = await service.create(trip, input('Phở', { address: '12 Lê Lợi' }));
    expect(without.place).toBeNull();
    expect(withPlace.place).toEqual({ address: '12 Lê Lợi', vietnamese: '', location: null });
  });
});
