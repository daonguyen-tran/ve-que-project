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
import { IdeaService } from '../services/idea-service';
import { IdeasPage } from './IdeasPage';

let db: VeQueDatabase | undefined;
afterEach(async () => {
  await db?.delete();
});

describe('IdeasPage', () => {
  it('planifie une idée le premier jour passé dans sa ville', async () => {
    db = new VeQueDatabase(`test-${crypto.randomUUID()}`);
    const repositories = createRepositories(db);
    const trip = await new TripService(repositories).createTrip({
      name: 'Vietnam 2027',
      startDate: d('2027-07-01'),
      endDate: d('2027-07-21'),
      ownerName: 'Dao',
    });
    await new StopService(repositories).createStop(trip, {
      name: 'Hội An',
      kind: 'city',
      vietnameseName: '',
      notes: '',
      arrivalDate: d('2027-07-04'),
      departureDate: d('2027-07-08'),
    });
    await new IdeaService(repositories).create(trip, {
      city: 'Hoi An',
      title: 'Atelier lanternes',
      category: 'culture',
      durationMinutes: 90,
      pricePerPerson: null,
      openingHours: null,
      indoor: true,
      priority: 'must',
      url: null,
      address: '',
      vietnameseAddress: '',
      notes: '',
    });

    const router = createMemoryRouter([{ path: '/idees', element: <IdeasPage /> }], {
      initialEntries: ['/idees'],
    });
    render(
      <RepositoriesProvider repositories={repositories}>
        <ActiveTripProvider>
          <RouterProvider router={router} />
        </ActiveTripProvider>
      </RepositoriesProvider>,
    );

    // « Hoi An » sans accents est rangée avec l'étape « Hội An ».
    const cities = await screen.findByRole('group', { name: 'Ville' });
    await within(cities).findByRole('button', { name: /Hội An/ });
    fireEvent.click(await screen.findByRole('button', { name: 'Planifier' }));

    const day = (await screen.findByLabelText('Jour')) as HTMLSelectElement;
    await waitFor(() => expect(day.value).toBe('2027-07-04'));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Planifier' }));

    expect((await screen.findByRole('status')).textContent).toContain('planifiée : J4.');
    const [item] = await repositories.plannedItems.listByTrip(trip.id);
    expect(item).toMatchObject({ title: 'Atelier lanternes', date: '2027-07-04', time: null });
  });
});
