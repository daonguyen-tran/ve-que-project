import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Money, toLocalDate as d, type Stop, type Trip } from '@ve-que/domain';
import { TripService } from '@/features/trips/services/trip-service';
import { VeQueDatabase } from '@/infrastructure/db/database';
import { createRepositories, type Repositories } from '@/infrastructure/repositories';
import { AccommodationService } from './accommodation-service';
import { StopService } from './stop-service';
import { TransferError, TransferService, type TransferInput } from './transfer-service';

describe('hébergements et trajets', () => {
  let db: VeQueDatabase;
  let repositories: Repositories;
  let trip: Trip;
  let hoiAn: Stop;
  let hue: Stop;

  beforeEach(async () => {
    db = new VeQueDatabase(`test-${crypto.randomUUID()}`);
    repositories = createRepositories(db);
    trip = await new TripService(repositories).createTrip({
      name: 'Vietnam 2027',
      startDate: d('2027-07-01'),
      endDate: d('2027-07-21'),
      ownerName: 'Dao',
    });
    const stops = new StopService(repositories);
    const base = { kind: 'city' as const, vietnameseName: '', notes: '' };
    hoiAn = await stops.createStop(trip, {
      ...base,
      name: 'Hoi An',
      arrivalDate: d('2027-07-04'),
      departureDate: d('2027-07-08'),
    });
    hue = await stops.createStop(trip, {
      ...base,
      name: 'Hue',
      arrivalDate: d('2027-07-08'),
      departureDate: d('2027-07-10'),
    });
  });

  afterEach(async () => {
    await db.delete();
  });

  it('enregistre un hébergement avec son prix en đồng et sans lien vide', async () => {
    const accommodation = await new AccommodationService(repositories).create(hoiAn, {
      name: 'Hội An Garden Homestay',
      status: 'booked',
      price: Money.of(2_400_000, 'VND'),
      bookingRef: ' HB-48213 ',
      url: '',
      address: '',
      vietnameseAddress: '',
    });
    expect(accommodation).toMatchObject({ stopId: hoiAn.id, bookingRef: 'HB-48213', url: null });
  });

  const transfer = (overrides: Partial<TransferInput> = {}): TransferInput => ({
    fromStopId: hoiAn.id,
    toStopId: hue.id,
    mode: 'car',
    departDate: d('2027-07-08'),
    departTime: '09:00',
    arriveDate: d('2027-07-08'),
    arriveTime: '12:30',
    price: null,
    status: 'considered',
    bookingRef: '',
    notes: '',
    ...overrides,
  });

  it('enregistre un trajet valide', async () => {
    const created = await new TransferService(repositories).create(trip, transfer());
    expect(await repositories.transfers.getById(created.id)).toMatchObject({
      mode: 'car',
      arriveTime: '12:30',
    });
  });

  it('refuse un trajet qui arrive avant de partir', async () => {
    await expect(
      new TransferService(repositories).create(trip, transfer({ arriveTime: '08:00' })),
    ).rejects.toBeInstanceOf(TransferError);
    expect(await repositories.transfers.listByTrip(trip.id)).toEqual([]);
  });
});
