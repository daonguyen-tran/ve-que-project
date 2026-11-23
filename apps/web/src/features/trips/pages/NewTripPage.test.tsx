import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { RepositoriesProvider } from '@/app/providers/RepositoriesProvider';
import { VeQueDatabase } from '@/infrastructure/db/database';
import { createRepositories } from '@/infrastructure/repositories';
import { NewTripPage } from './NewTripPage';

let db: VeQueDatabase | undefined;

afterEach(async () => {
  await db?.delete();
});

function renderPage() {
  db = new VeQueDatabase(`test-${crypto.randomUUID()}`);
  const repositories = createRepositories(db);
  const router = createMemoryRouter(
    [
      { path: '/voyages/nouveau', element: <NewTripPage /> },
      { path: '/planning', element: <p>Planning ouvert</p> },
    ],
    { initialEntries: ['/voyages/nouveau'] },
  );
  render(
    <RepositoriesProvider repositories={repositories}>
      <RouterProvider router={router} />
    </RepositoriesProvider>,
  );
  return repositories;
}

const field = (label: string) => screen.getByLabelText(label) as HTMLInputElement;

describe('NewTripPage', () => {
  it('affiche les erreurs sans rien enregistrer quand le formulaire est vide', async () => {
    const repositories = renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Créer le voyage' }));

    expect(await screen.findAllByText('Ce champ est obligatoire')).toHaveLength(2);
    // Les deux dates partagent un seul message, affiché sous la paire de champs.
    expect(screen.getAllByText('Choisis une date')).toHaveLength(1);
    expect(field('Départ').getAttribute('aria-invalid')).toBe('true');
    expect(field('Retour').getAttribute('aria-invalid')).toBe('true');
    expect(field('Nom du voyage').getAttribute('aria-invalid')).toBe('true');
    expect(await repositories.trips.listAll()).toEqual([]);
  });

  it('refuse un retour avant le départ', async () => {
    renderPage();
    fireEvent.change(field('Départ'), { target: { value: '2027-07-21' } });
    fireEvent.change(field('Retour'), { target: { value: '2027-07-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer le voyage' }));

    expect(await screen.findByText('Le retour doit être le jour du départ ou après')).toBeTruthy();
  });

  it('crée le voyage avec ses voyageurs puis ouvre le planning', async () => {
    const repositories = renderPage();
    fireEvent.change(field('Nom du voyage'), { target: { value: 'Vietnam 2027' } });
    fireEvent.change(field('Départ'), { target: { value: '2027-07-01' } });
    fireEvent.change(field('Retour'), { target: { value: '2027-07-21' } });
    fireEvent.change(field('Ton prénom'), { target: { value: 'Dao' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter un voyageur' }));
    fireEvent.change(await screen.findByLabelText('Voyageur 2'), { target: { value: 'Maman' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer le voyage' }));

    expect(await screen.findByText('Planning ouvert')).toBeTruthy();
    const [trip] = await repositories.trips.listAll();
    expect(trip?.name).toBe('Vietnam 2027');
    await waitFor(async () => {
      const names = (await repositories.members.listByTrip(trip!.id)).map((m) => m.name).sort();
      expect(names).toEqual(['Dao', 'Maman']);
    });
  });
});
