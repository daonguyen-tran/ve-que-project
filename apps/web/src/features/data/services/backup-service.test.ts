import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { toLocalDate as d } from '@ve-que/domain';
import { StopService } from '@/features/itinerary/services/stop-service';
import { TripService } from '@/features/trips/services/trip-service';
import { VeQueDatabase } from '@/infrastructure/db/database';
import { createRepositories, type Repositories } from '@/infrastructure/repositories';
import { SETTING_KEYS } from '@/infrastructure/repositories/settings-store';
import { backupFileName, BackupService } from './backup-service';

/*
 * Ces tests simulent deux appareils (deux bases distinctes) : le PC où l'on planifie et le
 * téléphone où l'on voyage.
 */
const databases: VeQueDatabase[] = [];
afterEach(async () => {
  await Promise.all(databases.splice(0).map((db) => db.delete()));
});

let tick = 0;
/** Horloge qui avance d'une minute à chaque appel : les modifications ont un ordre clair. */
const clock = () => new Date(Date.UTC(2027, 0, 10, 10, tick++));

function device() {
  const db = new VeQueDatabase(`test-${crypto.randomUUID()}`);
  databases.push(db);
  const repositories: Repositories = createRepositories(db, clock);
  return {
    repositories,
    trips: new TripService(repositories, clock),
    stops: new StopService(repositories, clock),
    backup: new BackupService(repositories.backup, repositories.settings, clock),
  };
}

const base = { kind: 'city' as const, vietnameseName: '', notes: '' };

async function transfer(from: ReturnType<typeof device>, to: ReturnType<typeof device>) {
  const exported = await from.backup.exportBackup({ label: 'Tous les voyages' });
  const read = to.backup.readFile(exported.json);
  if (!read.ok) throw new Error(read.error.code);
  const preview = await to.backup.previewImport(read.value);
  await to.backup.importBackup(preview, 'merge');
  return preview;
}

describe('BackupService — du PC au téléphone', () => {
  it('copie un voyage complet sur un téléphone vide', async () => {
    const pc = device();
    const phone = device();
    const trip = await pc.trips.createTrip({
      name: 'Vietnam 2027',
      startDate: d('2027-07-01'),
      endDate: d('2027-07-21'),
      ownerName: 'Dao',
      companionNames: ['Maman'],
    });
    await pc.stops.createStop(trip, {
      ...base,
      name: 'Hoi An',
      arrivalDate: d('2027-07-04'),
      departureDate: d('2027-07-08'),
    });

    const preview = await transfer(pc, phone);

    expect(preview.trips).toEqual([{ id: trip.id, name: 'Vietnam 2027', status: 'new' }]);
    expect(preview.summary).toMatchObject({ created: 4, updated: 0 });
    expect((await phone.repositories.stops.listByTrip(trip.id)).map((s) => s.name)).toEqual([
      'Hoi An',
    ]);
  });

  it('propage modifications et suppressions, sans écraser ce qui est plus récent', async () => {
    const pc = device();
    const phone = device();
    const trip = await pc.trips.createTrip({
      name: 'Vietnam 2027',
      startDate: d('2027-07-01'),
      endDate: d('2027-07-21'),
      ownerName: 'Dao',
    });
    const hoiAn = await pc.stops.createStop(trip, {
      ...base,
      name: 'Hoi An',
      arrivalDate: d('2027-07-04'),
      departureDate: d('2027-07-08'),
    });
    const hue = await pc.stops.createStop(trip, {
      ...base,
      name: 'Hue',
      arrivalDate: d('2027-07-08'),
      departureDate: d('2027-07-10'),
    });
    await transfer(pc, phone);

    // Sur le PC : on renomme Hoi An et on supprime Hue. Sur le téléphone, plus tard : on
    // renomme le voyage. Puis on réimporte le fichier du PC sur le téléphone.
    await pc.stops.updateStop(trip, hoiAn, {
      ...base,
      name: 'Hội An',
      arrivalDate: hoiAn.arrivalDate,
      departureDate: hoiAn.departureDate,
    });
    await pc.stops.deleteStop(hue);
    const pcExport = await pc.backup.exportBackup({ label: 'Vietnam 2027' });
    const phoneTrip = (await phone.repositories.trips.getById(trip.id))!;
    await phone.trips.updateTrip(phoneTrip, { name: 'Vietnam été 2027' });

    const read = phone.backup.readFile(pcExport.json);
    if (!read.ok) throw new Error(read.error.code);
    const preview = await phone.backup.previewImport(read.value);
    await phone.backup.importBackup(preview, 'merge');

    expect(preview.summary).toMatchObject({ updated: 1, deleted: 1 });
    expect((await phone.repositories.stops.listByTrip(trip.id)).map((s) => s.name)).toEqual([
      'Hội An',
    ]);
    // Le nom du voyage modifié sur le téléphone, plus récent, est conservé.
    expect((await phone.repositories.trips.getById(trip.id))?.name).toBe('Vietnam été 2027');
  });

  it('peut remplacer toutes les données du téléphone', async () => {
    const pc = device();
    const phone = device();
    await phone.trips.createTrip({
      name: 'Brouillon',
      startDate: d('2027-01-01'),
      endDate: d('2027-01-02'),
      ownerName: 'Dao',
    });
    await pc.trips.createTrip({
      name: 'Vietnam 2027',
      startDate: d('2027-07-01'),
      endDate: d('2027-07-21'),
      ownerName: 'Dao',
    });

    const exported = await pc.backup.exportBackup({ label: 'Tous les voyages' });
    const read = phone.backup.readFile(exported.json);
    if (!read.ok) throw new Error(read.error.code);
    await phone.backup.importBackup(await phone.backup.previewImport(read.value), 'replace');

    expect((await phone.repositories.trips.listAll()).map((trip) => trip.name)).toEqual([
      'Vietnam 2027',
    ]);
  });

  it('mémorise la date du dernier export', async () => {
    const pc = device();
    await pc.backup.exportBackup({ label: 'Tous les voyages' });
    expect(await pc.repositories.settings.get(SETTING_KEYS.lastExportAt)).toMatch(/^2027-01-10T/);
  });
});

describe('backupFileName', () => {
  it('produit un nom de fichier sans accents ni espaces', () => {
    expect(backupFileName('Đà Nẵng & Hội An', new Date('2026-11-23T10:00:00Z'))).toBe(
      've-que-da-nang-hoi-an-2026-11-23.json',
    );
  });
});
