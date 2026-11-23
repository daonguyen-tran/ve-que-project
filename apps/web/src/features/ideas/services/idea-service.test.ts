import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { Money, plannedByIdea, toLocalDate as d } from '@ve-que/domain';
import { TripService } from '@/features/trips/services/trip-service';
import { VeQueDatabase } from '@/infrastructure/db/database';
import { createRepositories } from '@/infrastructure/repositories';
import { IdeaService, type IdeaInput } from './idea-service';

let db: VeQueDatabase | undefined;
afterEach(async () => {
  await db?.delete();
});

const input: IdeaInput = {
  city: 'Hội An',
  title: 'Atelier lanternes',
  category: 'culture',
  durationMinutes: 90,
  pricePerPerson: Money.fromMajor(150_000, 'VND'),
  openingHours: [],
  indoor: true,
  priority: 'must',
  url: '',
  address: ' 12 Nguyễn Thái Học ',
  vietnameseAddress: '',
  notes: '',
};

describe('IdeaService', () => {
  it('planifie une idée en copiant ses informations, coût pour le groupe compris', async () => {
    db = new VeQueDatabase(`test-${crypto.randomUUID()}`);
    const repositories = createRepositories(db);
    const trip = await new TripService(repositories).createTrip({
      name: 'Vietnam 2027',
      startDate: d('2027-07-01'),
      endDate: d('2027-07-21'),
      ownerName: 'Dao',
      companionNames: ['Maman'],
    });
    const service = new IdeaService(repositories);
    const idea = await service.create(trip, input);
    // Horaires vides = inconnus ; l'URL vide n'est pas enregistrée.
    expect(idea.openingHours).toBeNull();
    expect(idea.url).toBeNull();
    expect(idea.place.address).toBe('12 Nguyễn Thái Học');

    const item = await service.plan(
      trip,
      idea,
      { date: d('2027-07-05'), slot: 'evening', time: null },
      2,
    );
    expect(item).toMatchObject({
      ideaId: idea.id,
      title: 'Atelier lanternes',
      durationMinutes: 90,
      estimatedCost: Money.fromMajor(300_000, 'VND'),
      place: { address: '12 Nguyễn Thái Học' },
    });
    const planned = plannedByIdea(await repositories.plannedItems.listByTrip(trip.id));
    expect(planned.get(idea.id)?.map((entry) => entry.date)).toEqual(['2027-07-05']);
  });
});
