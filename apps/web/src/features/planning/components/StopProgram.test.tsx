import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { toLocalDate as d } from '@ve-que/domain';
import { RepositoriesProvider } from '@/app/providers/RepositoriesProvider';
import { StopService } from '@/features/itinerary/services/stop-service';
import { TripService } from '@/features/trips/services/trip-service';
import { VeQueDatabase } from '@/infrastructure/db/database';
import { createRepositories } from '@/infrastructure/repositories';
import { PlannedItemService } from '../services/planned-item-service';
import { StopProgram } from './StopProgram';

let db: VeQueDatabase | undefined;
afterEach(async () => {
  await db?.delete();
});

async function setup(kind: 'city' | 'village' = 'city') {
  db = new VeQueDatabase(`test-${crypto.randomUUID()}`);
  const repositories = createRepositories(db);
  const trip = await new TripService(repositories).createTrip({
    name: 'Vietnam 2027',
    startDate: d('2027-07-01'),
    endDate: d('2027-07-21'),
    ownerName: 'Dao',
  });
  const stop = await new StopService(repositories).createStop(trip, {
    name: 'Hoi An',
    kind,
    vietnameseName: '',
    notes: '',
    arrivalDate: d('2027-07-11'),
    departureDate: d('2027-07-14'),
  });
  render(
    <RepositoriesProvider repositories={repositories}>
      <MemoryRouter>
        <StopProgram trip={trip} stop={stop} />
      </MemoryRouter>
    </RepositoriesProvider>,
  );
  return { repositories, trip };
}

const day = (name: string) => screen.getByRole('article', { name });

describe('StopProgram', () => {
  it('montre chaque jour de l’étape, de l’arrivée au départ', async () => {
    const { repositories, trip } = await setup();
    await new PlannedItemService(repositories).create(trip, {
      date: d('2027-07-12'),
      kind: 'activity',
      title: 'Cours de cuisine',
      time: null,
      address: '',
      vietnameseAddress: '',
      durationMinutes: null,
      estimatedCost: null,
      status: 'planned',
      notes: '',
    });

    expect(await screen.findByText('Cours de cuisine')).toBeTruthy();
    expect(screen.getAllByRole('article')).toHaveLength(4);
    expect(within(day('Dimanche 11 juillet')).getByText('Arrivée')).toBeTruthy();
    expect(within(day('Mercredi 14 juillet')).getByText('Départ')).toBeTruthy();
    expect(within(day('Mardi 13 juillet')).getByText('Rien de prévu ce jour-là.')).toBeTruthy();
    // Le titre d'un jour mène à son programme dans « Jour par jour ».
    expect(within(day('Lundi 12 juillet')).getByRole('link').getAttribute('href')).toBe(
      '/planning/jours/2027-07-12',
    );
  });

  it('ajoute une activité sur le jour choisi', async () => {
    const { repositories, trip } = await setup();
    await new PlannedItemService(repositories).create(trip, {
      date: d('2027-07-12'),
      kind: 'activity',
      title: 'Cours de cuisine',
      time: null,
      address: '',
      vietnameseAddress: '',
      durationMinutes: null,
      estimatedCost: null,
      status: 'planned',
      notes: '',
    });

    fireEvent.click(
      await screen.findByRole('button', { name: 'Ajouter une activité le lundi 12 juillet' }),
    );
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Titre'), {
      target: { value: 'Plage An Bàng' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Enregistrer' }));

    await waitFor(async () => {
      const items = await repositories.plannedItems.listByTrip(trip.id);
      expect(items.find((item) => item.title === 'Plage An Bàng')).toMatchObject({
        date: '2027-07-12',
        time: null,
        kind: 'activity',
      });
    });
  });

  it('propose « En famille » au village', async () => {
    const { repositories, trip } = await setup('village');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Ajouter une activité le mardi 13 juillet' }),
    );
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Enregistrer' }));

    await waitFor(async () => {
      const items = await repositories.plannedItems.listByTrip(trip.id);
      expect(items.map((item) => [item.date, item.kind])).toEqual([['2027-07-13', 'family']]);
    });
  });
});
