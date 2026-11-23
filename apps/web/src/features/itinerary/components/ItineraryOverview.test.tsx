import 'fake-indexeddb/auto';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { toLocalDate as d, type Trip } from '@ve-que/domain';
import { RepositoriesProvider } from '@/app/providers/RepositoriesProvider';
import { TripService } from '@/features/trips/services/trip-service';
import { VeQueDatabase } from '@/infrastructure/db/database';
import { createRepositories, type Repositories } from '@/infrastructure/repositories';
import { StopService } from '../services/stop-service';
import { ItineraryOverview } from './ItineraryOverview';

let db: VeQueDatabase | undefined;
afterEach(async () => {
  await db?.delete();
});

async function setup(): Promise<{ repositories: Repositories; trip: Trip }> {
  db = new VeQueDatabase(`test-${crypto.randomUUID()}`);
  const repositories = createRepositories(db);
  const trip = await new TripService(repositories).createTrip({
    name: 'Vietnam 2027',
    startDate: d('2027-07-01'),
    endDate: d('2027-07-21'),
    ownerName: 'Dao',
  });
  render(
    <RepositoriesProvider repositories={repositories}>
      <MemoryRouter>
        <ItineraryOverview trip={trip} />
      </MemoryRouter>
    </RepositoriesProvider>,
  );
  return { repositories, trip };
}

describe('ItineraryOverview', () => {
  it('propose d’ajouter la première étape quand il n’y en a aucune', async () => {
    await setup();
    expect(await screen.findByText('Aucune étape pour l’instant')).toBeTruthy();
  });

  it('montre les étapes, les nuits sans étape et le changement d’étape', async () => {
    const { repositories, trip } = await setup();
    const stops = new StopService(repositories);
    const base = { kind: 'city' as const, vietnameseName: '', notes: '' };
    await stops.createStop(trip, {
      ...base,
      name: 'Saigon',
      arrivalDate: d('2027-07-01'),
      departureDate: d('2027-07-04'),
    });
    await stops.createStop(trip, {
      ...base,
      name: 'Hoi An',
      arrivalDate: d('2027-07-04'),
      departureDate: d('2027-07-08'),
    });

    expect(await screen.findByRole('button', { name: 'Modifier l’étape Hoi An' })).toBeTruthy();
    expect(screen.getByText('7 nuits sur 20 ont une étape')).toBeTruthy();
    expect(screen.getByText(/Changement d’étape · 4 juil\./)).toBeTruthy();
    expect(screen.getByText(/13 nuits sans étape/)).toBeTruthy();
  });

  it('pré-remplit le trou et refuse un chevauchement avec un message sous le champ', async () => {
    const { repositories, trip } = await setup();
    await new StopService(repositories).createStop(trip, {
      name: 'Saigon',
      kind: 'city',
      arrivalDate: d('2027-07-01'),
      departureDate: d('2027-07-04'),
      vietnameseName: '',
      notes: '',
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Ajouter une étape ici' }));
    const dialog = screen.getByRole('dialog');
    expect((within(dialog).getByLabelText('Arrivée') as HTMLInputElement).value).toBe('2027-07-04');

    fireEvent.change(within(dialog).getByLabelText('Nom'), { target: { value: 'Hue' } });
    fireEvent.change(within(dialog).getByLabelText('Arrivée'), { target: { value: '2027-07-02' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Enregistrer' }));

    expect(
      await within(dialog).findByText('Ces dates chevauchent l’étape « Saigon »'),
    ).toBeTruthy();
    expect(await repositories.stops.listByTrip(trip.id)).toHaveLength(1);
  });
});
