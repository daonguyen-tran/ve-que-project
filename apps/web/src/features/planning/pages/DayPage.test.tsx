import 'fake-indexeddb/auto';
import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { toLocalDate as d } from '@ve-que/domain';
import { ActiveTripProvider } from '@/app/providers/ActiveTripProvider';
import { RepositoriesProvider } from '@/app/providers/RepositoriesProvider';
import { StopService } from '@/features/itinerary/services/stop-service';
import { TripService } from '@/features/trips/services/trip-service';
import { VeQueDatabase } from '@/infrastructure/db/database';
import { createRepositories } from '@/infrastructure/repositories';
import { PlannedItemService } from '../services/planned-item-service';
import { DayPage } from './DayPage';

let db: VeQueDatabase | undefined;
afterEach(async () => {
  await db?.delete();
});

async function renderDay(date: string) {
  db = new VeQueDatabase(`test-${crypto.randomUUID()}`);
  const repositories = createRepositories(db);
  const trip = await new TripService(repositories).createTrip({
    name: 'Vietnam 2027',
    startDate: d('2027-07-01'),
    endDate: d('2027-07-21'),
    ownerName: 'Dao',
  });
  const stop = await new StopService(repositories).createStop(trip, {
    name: 'Village de Bà Nội',
    kind: 'village',
    vietnameseName: '',
    notes: '',
    arrivalDate: d('2027-07-08'),
    departureDate: d('2027-07-12'),
  });
  const router = createMemoryRouter(
    [
      {
        path: '/planning/jours/:date',
        element: <DayPage />,
      },
    ],
    { initialEntries: [`/planning/jours/${date}`] },
  );
  render(
    <RepositoriesProvider repositories={repositories}>
      <ActiveTripProvider>
        <RouterProvider router={router} />
      </ActiveTripProvider>
    </RepositoriesProvider>,
  );
  return { repositories, trip, stop };
}

describe('DayPage', () => {
  it('montre seulement les créneaux remplis, et renvoie à la fiche de l’étape pour organiser', async () => {
    const { repositories, trip, stop } = await renderDay('2027-07-09');
    expect(await screen.findByText('Rien de prévu ce jour-là.')).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Matin' })).toBeNull();
    const link = await screen.findByRole('link', {
      name: 'Organiser la journée dans la fiche de Village de Bà Nội',
    });
    expect(link.getAttribute('href')).toBe(`/planning/etapes/${stop.id}`);

    await new PlannedItemService(repositories).create(trip, {
      date: d('2027-07-09'),
      slot: 'afternoon',
      kind: 'activity',
      title: 'Marché de Hội An',
      time: null,
      address: '',
      vietnameseAddress: '',
      durationMinutes: null,
      estimatedCost: null,
      status: 'planned',
      notes: '',
    });

    const afternoon = await screen.findByRole('region', { name: 'Après-midi' });
    expect(within(afternoon).getByText('Marché de Hội An')).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Matin' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Soir' })).toBeNull();
    expect(screen.queryByText('Rien de prévu ce jour-là.')).toBeNull();
  });

  it('signale un jour hors du voyage', async () => {
    await renderDay('2027-08-01');
    expect(await screen.findByText('Ce jour ne fait pas partie du voyage.')).toBeTruthy();
  });
});
