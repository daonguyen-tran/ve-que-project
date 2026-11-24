import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { describe, expect, it } from 'vitest';
import { VeQueDatabase } from './database';

/*
 * Migration de la base locale en version 3 (ADR 0007) : on écrit d'abord des éléments au
 * format de la version 2 (avec créneau), puis on ouvre la base actuelle.
 */
describe('VeQueDatabase v3', () => {
  it('retire le créneau des éléments et garde l’ordre de la journée', async () => {
    const name = `test-${crypto.randomUUID()}`;
    const legacy = new Dexie(name);
    legacy.version(2).stores({
      plannedItems: 'id, tripId, [tripId+date], ideaId, updatedAt',
    });
    const base = { tripId: 't', date: '2027-07-04', createdAt: 'x', time: null };
    await legacy.table('plannedItems').bulkAdd([
      { ...base, id: 'soir', slot: 'evening', position: 0 },
      { ...base, id: 'matin', slot: 'morning', position: 0 },
      { ...base, id: 'aprem', slot: 'afternoon', position: 0 },
    ]);
    legacy.close();

    const db = new VeQueDatabase(name);
    const items = await db.plannedItems.toArray();
    expect(items.every((item) => !('slot' in item))).toBe(true);
    expect(Object.fromEntries(items.map((item) => [item.id, item.position]))).toEqual({
      matin: 0,
      aprem: 1,
      soir: 2,
    });
    await db.delete();
  });
});
