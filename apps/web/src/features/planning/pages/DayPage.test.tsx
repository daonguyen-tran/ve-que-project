import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { toLocalDate as d } from '@ve-que/domain';
import { ActiveTripProvider } from '@/app/providers/ActiveTripProvider';
import { RepositoriesProvider } from '@/app/providers/RepositoriesProvider';
import { StopService } from '@/features/itinerary/services/stop-service';
import { TripService } from '@/features/trips/services/trip-service';
import { VeQueDatabase } from '@/infrastructure/db/database';
import { createRepositories } from '@/infrastructure/repositories';
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
  await new StopService(repositories).createStop(trip, {
    name: 'Village de Bà Nội',
    kind: 'village',
    vietnameseName: '',
    notes: '',
    arrivalDate: d('2027-07-08'),
    departureDate: d('2027-07-12'),
  });
  const router = createMemoryRouter([{ path: '/planning/jours/:date', element: <DayPage /> }], {
    initialEntries: [`/planning/jours/${date}`],
  });
  render(
    <RepositoriesProvider repositories={repositories}>
      <ActiveTripProvider>
        <RouterProvider router={router} />
      </ActiveTripProvider>
    </RepositoriesProvider>,
  );
  return { repositories, trip };
}

describe('DayPage', () => {
  it('propose « En famille » au village et l’ajoute en un geste', async () => {
    const { repositories, trip } = await renderDay('2027-07-09');
    expect(await screen.findByText('Jour 9 sur 21')).toBeTruthy();

    const morning = screen.getByRole('region', { name: 'Matin' });
    fireEvent.click(within(morning).getByRole('button', { name: 'En famille' }));

    await waitFor(async () => {
      const items = await repositories.plannedItems.listByTrip(trip.id);
      expect(items.map((item) => [item.date, item.slot, item.kind])).toEqual([
        ['2027-07-09', 'morning', 'family'],
      ]);
    });
    expect(
      await within(morning).findByRole('button', { name: 'Déplacer « En famille »' }),
    ).toBeTruthy();
  });

  it('signale un jour hors du voyage', async () => {
    await renderDay('2027-08-01');
    expect(await screen.findByText('Ce jour ne fait pas partie du voyage.')).toBeTruthy();
  });
});
