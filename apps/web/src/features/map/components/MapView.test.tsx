import 'fake-indexeddb/auto';
import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toLocalDate as d } from '@ve-que/domain';
import { RepositoriesProvider } from '@/app/providers/RepositoriesProvider';
import { StopService } from '@/features/itinerary/services/stop-service';
import { TripService } from '@/features/trips/services/trip-service';
import { VeQueDatabase } from '@/infrastructure/db/database';
import { createRepositories } from '@/infrastructure/repositories';
import { MapView } from './MapView';

let db: VeQueDatabase | undefined;
beforeEach(() => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
});
afterEach(async () => {
  vi.restoreAllMocks();
  await db?.delete();
});

describe('MapView hors ligne', () => {
  it('remplace la carte par la liste des lieux, avec les liens Google Maps', async () => {
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
      vietnameseName: 'Hội An',
      notes: '',
      arrivalDate: d('2027-07-04'),
      departureDate: d('2027-07-08'),
      location: { lat: 15.88, lng: 108.33 },
    });
    const router = createMemoryRouter([{ path: '/planning', element: <MapView trip={trip} /> }], {
      initialEntries: ['/planning?vue=carte'],
    });
    render(
      <RepositoriesProvider repositories={repositories}>
        <RouterProvider router={router} />
      </RepositoriesProvider>,
    );

    expect((await screen.findByRole('status')).textContent).toContain('Hors connexion');
    const list = screen.getByRole('region', { name: '1 lieu' });
    expect(within(list).getByText('Hội An')).toBeTruthy();
    expect(
      within(list)
        .getByRole('link', { name: /Google Maps/ })
        .getAttribute('href'),
    ).toBe('https://www.google.com/maps/search/?api=1&query=15.88%2C108.33');
  });
});
