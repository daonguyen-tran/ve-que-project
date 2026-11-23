import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { RepositoriesProvider } from '@/app/providers/RepositoriesProvider';
import { VeQueDatabase } from '@/infrastructure/db/database';
import { createRepositories } from '@/infrastructure/repositories';
import { NewTripPage } from './NewTripPage';

let db: VeQueDatabase | undefined;

// Le calendrier s'ouvre sur le mois en cours : on fige « aujourd'hui » au 15 juin 2027.
// Seul `Date` est simulé, pas les minuteurs dont IndexedDB a besoin.
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2027-06-15T10:00:00'));
});
afterAll(() => {
  vi.useRealTimers();
});

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
const day = (name: string) => screen.getByRole('button', { name });

/** Passe le calendrier en juillet 2027, puis choisit le départ et le retour. */
function pickJuly(start: string, end: string) {
  fireEvent.click(screen.getByRole('button', { name: 'Mois suivant' }));
  fireEvent.click(day(start));
  fireEvent.click(day(end));
}

describe('NewTripPage', () => {
  it('affiche les erreurs sans rien enregistrer quand le formulaire est vide', async () => {
    const repositories = renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Créer le voyage' }));

    expect(await screen.findAllByText('Ce champ est obligatoire')).toHaveLength(2);
    // Les deux dates partagent un seul message, affiché sous la paire de champs.
    expect(screen.getAllByText('Choisis une date')).toHaveLength(1);
    expect(field('Nom du voyage').getAttribute('aria-invalid')).toBe('true');
    expect(await repositories.trips.listAll()).toEqual([]);
  });

  it('recommence la plage quand on touche un jour avant le départ', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Mois suivant' }));
    fireEvent.click(day('mercredi 21 juillet 2027'));
    fireEvent.click(day('jeudi 1 juillet 2027'));

    // Le 1er devient le nouveau départ ; le retour reste à choisir.
    expect(screen.getByText('jeu. 1 juil. 2027')).toBeTruthy();
    expect(screen.getByText('Touche maintenant le jour : retour.')).toBeTruthy();
  });

  it('crée le voyage avec ses voyageurs puis ouvre le planning', async () => {
    const repositories = renderPage();
    fireEvent.change(field('Nom du voyage'), { target: { value: 'Vietnam 2027' } });
    pickJuly('jeudi 1 juillet 2027', 'mercredi 21 juillet 2027');
    expect(screen.getByText('21 jours')).toBeTruthy();
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
