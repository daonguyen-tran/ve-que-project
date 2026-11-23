import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { toLocalDate as d } from '@ve-que/domain';
import { RepositoriesProvider } from '@/app/providers/RepositoriesProvider';
import { TripService } from '@/features/trips/services/trip-service';
import { VeQueDatabase } from '@/infrastructure/db/database';
import { createRepositories, type Repositories } from '@/infrastructure/repositories';
import { BackupService } from '../services/backup-service';
import { ImportSection } from './ImportSection';

const databases: VeQueDatabase[] = [];
afterEach(async () => {
  await Promise.all(databases.splice(0).map((db) => db.delete()));
});

function newRepositories(): Repositories {
  const db = new VeQueDatabase(`test-${crypto.randomUUID()}`);
  databases.push(db);
  return createRepositories(db);
}

/** Un fichier exporté depuis un autre appareil contenant un voyage. */
async function exportedFromPc(): Promise<string> {
  const pc = newRepositories();
  await new TripService(pc).createTrip({
    name: 'Vietnam 2027',
    startDate: d('2027-07-01'),
    endDate: d('2027-07-21'),
    ownerName: 'Dao',
  });
  const result = await new BackupService(pc.backup, pc.settings).exportBackup({ label: 'Tous' });
  return result.json;
}

function renderSection() {
  const repositories = newRepositories();
  const { container } = render(
    <RepositoriesProvider repositories={repositories}>
      <MemoryRouter>
        <ImportSection />
      </MemoryRouter>
    </RepositoriesProvider>,
  );
  const choose = (text: string) => {
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    fireEvent.change(input, {
      target: { files: [new File([text], 've-que.json', { type: 'application/json' })] },
    });
  };
  return { repositories, choose };
}

describe('ImportSection', () => {
  it('explique pourquoi un fichier est refusé, sans rien importer', async () => {
    const { repositories, choose } = renderSection();
    choose('{"hello": "world"}');

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Ce fichier n’est pas une sauvegarde Về Quê.',
    );
    expect(await repositories.trips.listAll()).toEqual([]);
  });

  it('montre l’aperçu, puis fusionne après confirmation', async () => {
    const { repositories, choose } = renderSection();
    choose(await exportedFromPc());

    expect(await screen.findByText('Vietnam 2027')).toBeTruthy();
    expect(screen.getByText('Nouveau')).toBeTruthy();
    // Rien n'est écrit tant qu'on n'a pas confirmé.
    expect(await repositories.trips.listAll()).toEqual([]);

    fireEvent.click(screen.getByRole('button', { name: 'Importer' }));

    expect((await screen.findByRole('status')).textContent).toBe('Import terminé.');
    await waitFor(async () =>
      expect((await repositories.trips.listAll()).map((trip) => trip.name)).toEqual([
        'Vietnam 2027',
      ]),
    );
  });
});
