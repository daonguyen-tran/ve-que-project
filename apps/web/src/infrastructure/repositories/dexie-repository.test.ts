import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createEntity, Money, toLocalDate, type Trip, type Wallet } from '@ve-que/domain';
import { VeQueDatabase } from '../db/database';
import { createRepositories, type Repositories } from '.';

describe('DexieTripScopedRepository', () => {
  let db: VeQueDatabase;
  let repos: Repositories;
  const tripId = '0190a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b';

  const wallet = (name: string, trip = tripId) =>
    createEntity<Wallet>({ tripId: trip, name, kind: 'cash', currency: 'VND' });

  beforeEach(() => {
    db = new VeQueDatabase(`test-${crypto.randomUUID()}`);
    repos = createRepositories(db);
  });

  afterEach(async () => {
    await db.delete();
  });

  it('enregistre puis relit une entité', async () => {
    const cash = wallet('Espèces VND');
    await repos.wallets.save(cash);
    expect(await repos.wallets.getById(cash.id)).toEqual(cash);
  });

  it('liste uniquement les entités du voyage demandé', async () => {
    await repos.wallets.saveMany([
      wallet('Espèces VND'),
      wallet('Carte'),
      wallet('Autre voyage', '0190a1b2-c3d4-7e5f-8a9b-ffffffffffff'),
    ]);
    const names = (await repos.wallets.listByTrip(tripId)).map((w) => w.name).sort();
    expect(names).toEqual(['Carte', 'Espèces VND']);
  });

  it('supprime logiquement : invisible en lecture, conservé en base', async () => {
    const cash = wallet('Espèces VND');
    await repos.wallets.save(cash);
    await repos.wallets.remove(cash.id);

    expect(await repos.wallets.getById(cash.id)).toBeUndefined();
    expect(await repos.wallets.listByTrip(tripId)).toEqual([]);
    expect((await db.wallets.get(cash.id))?.deletedAt).not.toBeNull();
  });

  it('conserve les montants à l’identique', async () => {
    const trip = createEntity<Trip>({
      name: 'Vietnam 2027',
      startDate: toLocalDate('2027-07-01'),
      endDate: toLocalDate('2027-07-21'),
      timeZone: 'Asia/Ho_Chi_Minh',
      referenceCurrency: 'EUR',
      dailyAllowance: Money.fromMajor(25, 'EUR'),
      splitEnabled: false,
      archivedAt: null,
    });
    await repos.trips.save(trip);
    expect((await repos.trips.getById(trip.id))?.dailyAllowance).toEqual(Money.of(2500, 'EUR'));
  });
});
