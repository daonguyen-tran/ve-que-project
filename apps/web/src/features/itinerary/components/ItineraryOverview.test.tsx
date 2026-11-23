import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

  it('relie les étapes comme une feuille de route, la frise montrant les nuits libres', async () => {
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
    // Trajet manquant : proposé discrètement sur la route entre les deux étapes.
    expect(screen.getByRole('button', { name: 'Trajet vers Hoi An' })).toBeTruthy();
    // Les nuits libres ne sont plus répétées dans la liste : la frise suffit.
    expect(screen.queryByText(/13 nuits sans étape/)).toBeNull();
    expect(screen.getAllByText('Aucun hébergement')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Ajouter une étape' })).toBeTruthy();
  });

  it('propose les premières nuits libres et grise celles des autres étapes', async () => {
    const { repositories, trip } = await setup();
    await new StopService(repositories).createStop(trip, {
      name: 'Saigon',
      kind: 'city',
      arrivalDate: d('2027-07-01'),
      departureDate: d('2027-07-04'),
      vietnameseName: '',
      notes: '',
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Ajouter une étape' }));
    const dialog = screen.getByRole('dialog');
    // Dates proposées : du 4 (départ de Saigon) au retour.
    expect(within(dialog).getByText('dim. 4 juil. 2027')).toBeTruthy();
    expect(within(dialog).getByText('17 nuits')).toBeTruthy();

    // Les nuits de Saigon sont grisées ; le 4, jour de transition, reste libre.
    const taken = within(dialog).getByRole('button', {
      name: 'vendredi 2 juillet 2027, nuit déjà prévue à Saigon, indisponible',
    });
    expect(taken.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(taken);
    expect(within(dialog).getByText('dim. 4 juil. 2027')).toBeTruthy();

    fireEvent.click(within(dialog).getByRole('button', { name: 'mercredi 7 juillet 2027' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'samedi 10 juillet 2027' }));
    fireEvent.change(within(dialog).getByLabelText('Nom'), { target: { value: 'Hue' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Enregistrer' }));

    await waitFor(async () => {
      const saved = await repositories.stops.listByTrip(trip.id);
      expect(saved.find((stop) => stop.name === 'Hue')).toMatchObject({
        arrivalDate: '2027-07-07',
        departureDate: '2027-07-10',
      });
    });
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

    fireEvent.click(await screen.findByRole('button', { name: 'Trajet vers Hanoi' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByLabelText('Bus de nuit'));
    // Départ proposé le jour où l'on quitte Hoi An (le 4) ; on choisit l'arrivée au calendrier.
    expect(within(dialog).getByLabelText('Départ le').textContent).toContain('dim. 4 juil. 2027');
    fireEvent.click(within(dialog).getByLabelText('Arrivée le'));
    const before = within(dialog).getByRole('button', { name: /^samedi 3 juillet 2027/ });
    expect(before.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(within(dialog).getByRole('button', { name: 'lundi 5 juillet 2027' }));
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
