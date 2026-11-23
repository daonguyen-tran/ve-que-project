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

    expect(await screen.findByRole('link', { name: /Hoi An/ })).toBeTruthy();
    expect(screen.getByText('7 nuits sur 20 ont une étape')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ajouter le trajet vers Hoi An' })).toBeTruthy();
    expect(screen.getByText(/13 nuits sans étape/)).toBeTruthy();
    expect(screen.getAllByText('Aucun hébergement')).toHaveLength(2);
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

describe('trajets', () => {
  it('ajoute un bus de nuit avec un prix saisi « à la vietnamienne »', async () => {
    const { repositories, trip } = await setup();
    const stops = new StopService(repositories);
    const base = { kind: 'city' as const, vietnameseName: '', notes: '' };
    await stops.createStop(trip, {
      ...base,
      name: 'Hoi An',
      arrivalDate: d('2027-07-01'),
      departureDate: d('2027-07-04'),
    });
    await stops.createStop(trip, {
      ...base,
      name: 'Hanoi',
      arrivalDate: d('2027-07-05'),
      departureDate: d('2027-07-08'),
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Ajouter le trajet vers Hanoi' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByLabelText('Bus de nuit'));
    fireEvent.change(within(dialog).getByLabelText('Départ le'), {
      target: { value: '2027-07-04' },
    });
    fireEvent.change(within(dialog).getByLabelText('Arrivée le'), {
      target: { value: '2027-07-05' },
    });
    fireEvent.change(within(dialog).getByLabelText(/Prix total/), { target: { value: '450k' } });
    expect(
      within(dialog).getByText((text) => text.replace(/\u202f|\u00a0/g, ' ') === '= 450 000 ₫'),
    ).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Enregistrer' }));

    expect(
      await screen.findByRole('button', { name: 'Modifier le trajet Hoi An → Hanoi' }),
    ).toBeTruthy();
    const [transfer] = await repositories.transfers.listByTrip(trip.id);
    expect(transfer).toMatchObject({
      mode: 'sleeper_bus',
      price: { amountMinor: 450_000, currency: 'VND' },
    });
  });
});
