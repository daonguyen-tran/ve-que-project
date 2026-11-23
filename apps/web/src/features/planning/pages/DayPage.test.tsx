import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { toLocalDate as d } from '@ve-que/domain';
import { ActiveTripProvider } from '@/app/providers/ActiveTripProvider';
import { RepositoriesProvider } from '@/app/providers/RepositoriesProvider';
import { StopService } from '@/features/itinerary/services/stop-service';
import { TripService } from '@/features/trips/services/trip-service';
import { PlanningEditModeProvider } from '../edit-mode';
import { VeQueDatabase } from '@/infrastructure/db/database';
import { createRepositories } from '@/infrastructure/repositories';
import { PlannedItemService } from '../services/planned-item-service';
import { DayPage } from './DayPage';

let db: VeQueDatabase | undefined;
afterEach(async () => {
  await db?.delete();
});

/** Par défaut en édition, comme au lot 6 ; `editing: false` pour la vue de lecture. */
async function renderDay(date: string, { editing = true } = {}) {
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
  const router = createMemoryRouter(
    [
      {
        path: '/planning/jours/:date',
        element: (
          <PlanningEditModeProvider initialEditing={editing}>
            <DayPage />
          </PlanningEditModeProvider>
        ),
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
  return { repositories, trip };
}

describe('DayPage', () => {
  it('propose « En famille » au village et l’ajoute en un geste', async () => {
    const { repositories, trip } = await renderDay('2027-07-09');
    expect(await screen.findByText('Jour 9 sur 21')).toBeTruthy();
    // Les étapes arrivent un instant après le voyage : on attend que le jour soit rattaché.
    expect(await screen.findByText('Village de Bà Nội')).toBeTruthy();

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

  it('en lecture, n’affiche que les créneaux remplis, sans poignée ni ajout', async () => {
    const { repositories, trip } = await renderDay('2027-07-09', { editing: false });
    expect(await screen.findByText('Rien de prévu ce jour-là.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'En famille' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Matin' })).toBeNull();

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
    expect(screen.queryByRole('button', { name: 'Déplacer « Marché de Hội An »' })).toBeNull();
    expect(screen.queryByText('Rien de prévu ce jour-là.')).toBeNull();
  });

  it('« Modifier » fait apparaître les outils, « Terminé » les retire', async () => {
    await renderDay('2027-07-09', { editing: false });
    fireEvent.click(await screen.findByRole('button', { name: 'Modifier' }));
    const morning = await screen.findByRole('region', { name: 'Matin' });
    expect(within(morning).getByRole('button', { name: 'En famille' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Terminé' }));
    expect(await screen.findByText('Rien de prévu ce jour-là.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'En famille' })).toBeNull();
  });

  it('signale un jour hors du voyage', async () => {
    await renderDay('2027-08-01');
    expect(await screen.findByText('Ce jour ne fait pas partie du voyage.')).toBeTruthy();
  });
});
