import { describe, expect, it } from 'vitest';
import { createEntity, markDeleted, updateEntity } from '../shared/entity';
import { toLocalDate as d } from '../shared/local-date';
import type { Stop } from '../itinerary/itinerary';
import type { Locality } from '../localities/locality';
import { buildNewTrip } from '../trip/trip-rules';
import {
  BACKUP_FORMAT,
  countBackupItems,
  createBackupFile,
  emptyBackupData,
  filterBackupByTrips,
  isBackupDue,
  planImport,
  readBackup,
  summarizePlan,
  tripImportStatuses,
  type BackupData,
} from './backup';

const t0 = new Date('2027-01-10T10:00:00Z');
const t1 = new Date('2027-01-11T10:00:00Z');
const t2 = new Date('2027-01-12T10:00:00Z');

function stopFor(tripId: string, name: string, at: Date): Stop {
  return createEntity<Stop>(
    {
      tripId,
      name,
      kind: 'city',
      arrivalDate: d('2027-07-01'),
      departureDate: d('2027-07-04'),
      place: { address: '', vietnamese: '', location: null },
      notes: '',
    },
    at,
  );
}

function sampleData(): BackupData {
  const vietnam = buildNewTrip(
    {
      name: 'Vietnam 2027',
      startDate: d('2027-07-01'),
      endDate: d('2027-07-21'),
      ownerName: 'Dao',
    },
    t0,
  );
  const japon = buildNewTrip(
    { name: 'Japon 2028', startDate: d('2028-04-01'), endDate: d('2028-04-10'), ownerName: 'Dao' },
    t0,
  );
  return {
    ...emptyBackupData(),
    trips: [vietnam.trip, japon.trip],
    members: [...vietnam.members, ...japon.members],
    stops: [stopFor(vietnam.trip.id, 'Saigon', t0), stopFor(japon.trip.id, 'Tokyo', t0)],
  };
}

describe('readBackup', () => {
  it('relit un fichier qu’on vient d’exporter', () => {
    const data = sampleData();
    const result = readBackup(JSON.stringify(createBackupFile(data, t1)));
    expect(result.ok && result.value.data).toEqual(data);
  });

  it('refuse un fichier qui n’est pas du JSON ou pas une sauvegarde', () => {
    expect(readBackup('pas du json')).toEqual({ ok: false, error: { code: 'not_json' } });
    expect(readBackup('{"hello":1}')).toEqual({ ok: false, error: { code: 'not_a_backup' } });
  });

  it('refuse un fichier créé par une version plus récente de l’appli', () => {
    const file = { ...createBackupFile(emptyBackupData()), schemaVersion: 7 };
    expect(readBackup(JSON.stringify(file))).toEqual({
      ok: false,
      error: { code: 'too_new', version: 7 },
    });
  });

  it('refuse des données invalides et dit où est le problème', () => {
    const data = sampleData();
    const broken = { format: BACKUP_FORMAT, schemaVersion: 1, exportedAt: t1.toISOString(), data };
    (broken.data.trips[0] as { endDate: string }).endDate = '2027-06-01';
    const result = readBackup(JSON.stringify(broken));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.code).toBe('invalid');
  });
});

describe('filterBackupByTrips', () => {
  it('ne garde qu’un voyage et ce qui lui appartient', () => {
    const data = sampleData();
    const vietnamId = data.trips[0]!.id;
    const filtered = filterBackupByTrips(data, [vietnamId]);
    expect(filtered.trips.map((trip) => trip.name)).toEqual(['Vietnam 2027']);
    expect(filtered.stops.map((stop) => stop.name)).toEqual(['Saigon']);
    expect(filtered.members.every((member) => member.tripId === vietnamId)).toBe(true);
  });

  it('garde « mes lieux », qui n’appartiennent à aucun voyage', () => {
    const village = createEntity<Locality>({
      name: 'Xóm Đông',
      vietnameseName: 'Xóm Đông',
      kind: 'village',
      location: null,
    });
    const data = { ...sampleData(), localities: [village] };
    const filtered = filterBackupByTrips(data, [data.trips[0]!.id]);
    expect(filtered.localities.map((locality) => locality.name)).toEqual(['Xóm Đông']);
  });
});

describe('planImport — dernière écriture gagnante', () => {
  it('crée tout sur un appareil vide', () => {
    const incoming = sampleData();
    const summary = summarizePlan(planImport(emptyBackupData(), incoming));
    expect(summary).toEqual({
      created: countBackupItems(incoming),
      updated: 0,
      deleted: 0,
      skipped: 0,
    });
  });

  it('ne change rien quand on réimporte le même fichier', () => {
    const data = sampleData();
    expect(summarizePlan(planImport(data, data))).toMatchObject({
      created: 0,
      updated: 0,
      skipped: countBackupItems(data),
    });
  });

  it('applique la version la plus récente, dans un sens comme dans l’autre', () => {
    const local = sampleData();
    const saigon = local.stops[0]!;
    const renamedOnPc = updateEntity(saigon, { name: 'Hô Chi Minh-Ville' }, t2);
    const incoming = { ...local, stops: [renamedOnPc, local.stops[1]!] };

    const plan = planImport(local, incoming);
    expect(plan.stops.update.map((stop) => stop.name)).toEqual(['Hô Chi Minh-Ville']);

    // À l'inverse, un fichier plus ancien n'écrase pas une modification faite sur l'appareil.
    const olderPlan = planImport(incoming, local);
    expect(olderPlan.stops.update).toEqual([]);
  });

  it('propage une suppression faite sur l’autre appareil', () => {
    const local = sampleData();
    const deletedOnPc = markDeleted(local.stops[0]!, t2);
    const plan = planImport(local, { ...local, stops: [deletedOnPc, local.stops[1]!] });
    expect(summarizePlan(plan).deleted).toBe(1);
  });

  it('résume l’état de chaque voyage', () => {
    const incoming = sampleData();
    const local = { ...emptyBackupData(), trips: [incoming.trips[1]!] };
    const renamed = updateEntity(incoming.trips[1]!, { name: 'Japon 2028 (printemps)' }, t2);
    const statuses = tripImportStatuses(
      planImport(local, { ...incoming, trips: [incoming.trips[0]!, renamed] }),
      {
        ...incoming,
        trips: [incoming.trips[0]!, renamed],
      },
    );
    expect(statuses.map((s) => [s.name, s.status])).toEqual([
      ['Vietnam 2027', 'new'],
      ['Japon 2028 (printemps)', 'updated'],
    ]);
  });
});

describe('isBackupDue', () => {
  const now = new Date('2027-01-20T10:00:00Z');
  it('rappelle de sauvegarder si jamais fait ou si c’est trop ancien', () => {
    expect(isBackupDue(null, now)).toBe(true);
    expect(isBackupDue('2027-01-12T09:00:00Z', now)).toBe(true);
    expect(isBackupDue('2027-01-15T10:00:00Z', now)).toBe(false);
  });
});
