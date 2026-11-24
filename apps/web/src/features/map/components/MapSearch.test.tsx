import 'fake-indexeddb/auto';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RepositoriesProvider } from '@/app/providers/RepositoriesProvider';
import { VeQueDatabase } from '@/infrastructure/db/database';
import type { Geocoder } from '@/infrastructure/geocoding/geocoder';
import type { OnlineLocalitySearch } from '@/infrastructure/geocoding/photon-locality-search';
import { createRepositories } from '@/infrastructure/repositories';
import type { MapPlace } from '../map-model';
import type { SearchEntry } from '../map-search';
import { MapSearch } from './MapSearch';

const entry = (title: string): SearchEntry => ({
  zone: 'hoi an',
  zoneName: 'Hội An',
  place: {
    id: title,
    tone: 'idea',
    point: null,
    title,
    subtitle: '',
    mapsUrl: null,
    keywords: '',
  } as MapPlace,
});
const entries = [entry('Pont japonais'), entry('Phở Bà Hoa'), entry('Marché de nuit')];

let db: VeQueDatabase | undefined;
afterEach(async () => {
  await db?.delete();
});

/** Recherche de localités en ligne simulée : ne trouve rien (les tests portent sur le reste). */
const noOnlineLocality: OnlineLocalitySearch = { search: vi.fn(async () => []) };

function setup(online = true) {
  db = new VeQueDatabase(`test-${crypto.randomUUID()}`);
  const geocoder: Geocoder = {
    search: vi
      .fn()
      .mockResolvedValue([{ label: '12 Trần Phú, Hội An', point: { lat: 15.87, lng: 108.33 } }]),
  };
  const onSelectPlace = vi.fn();
  const onSelectAddress = vi.fn();
  render(
    <RepositoriesProvider repositories={createRepositories(db)}>
      <MapSearch
        entries={entries}
        online={online}
        geocoder={geocoder}
        localitySearch={noOnlineLocality}
        onSelectPlace={onSelectPlace}
        onSelectAddress={onSelectAddress}
      />
    </RepositoriesProvider>,
  );
  return { geocoder, onSelectPlace, onSelectAddress, input: screen.getByRole('combobox') };
}

describe('MapSearch', () => {
  it('trouve un lieu du voyage sans accents et le choisit au clavier', () => {
    const { input, onSelectPlace } = setup();
    fireEvent.change(input, { target: { value: 'pho' } });
    const options = screen.getAllByRole('option').map((option) => option.textContent);
    // Les lieux du voyage d'abord, puis les localités (Phong Nha…), enfin la recherche d'adresse.
    expect(options[0]).toContain('Phở Bà Hoa');
    expect(options).toContainEqual(expect.stringContaining('Phong Nha'));
    expect(options.at(-1)).toContain('Chercher l’adresse « pho »');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelectPlace).toHaveBeenCalledWith(entries[1]);
  });

  it('cherche une adresse sur demande et propose les résultats', async () => {
    const { input, geocoder, onSelectAddress } = setup();
    fireEvent.change(input, { target: { value: 'tran phu' } });
    fireEvent.click(screen.getByRole('option', { name: /Chercher l’adresse/ }));
    expect(geocoder.search).toHaveBeenCalledWith('tran phu');
    fireEvent.click(await screen.findByRole('option', { name: /12 Trần Phú/ }));
    expect(onSelectAddress).toHaveBeenCalledWith(
      expect.objectContaining({ label: '12 Trần Phú, Hội An' }),
    );
  });

  it('propose les villes connues et centre la carte sur celle choisie', () => {
    const { input, onSelectAddress } = setup();
    fireEvent.change(input, { target: { value: 'nha tr' } });
    fireEvent.click(screen.getByRole('option', { name: /Nha Trang/ }));
    expect(onSelectAddress).toHaveBeenCalledWith({
      label: 'Nha Trang',
      point: { lat: 12.2388, lng: 109.1967 },
      // Une ville : la carte la montrera en entier, pas au niveau de la rue.
      kind: 'city',
    });
  });

  it('ne double pas une étape déjà placée sur la carte', () => {
    const base = entry('Nha Trang');
    const placed = {
      ...base,
      place: { ...base.place, tone: 'stop', point: { lat: 12.24, lng: 109.19 } },
    } as SearchEntry;
    db = new VeQueDatabase(`test-${crypto.randomUUID()}`);
    render(
      <RepositoriesProvider repositories={createRepositories(db)}>
        <MapSearch
          entries={[placed]}
          online
          geocoder={{ search: vi.fn() }}
          localitySearch={noOnlineLocality}
          onSelectPlace={vi.fn()}
          onSelectAddress={vi.fn()}
        />
      </RepositoriesProvider>,
    );
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'nha tr' } });
    expect(screen.getAllByRole('option', { name: /Nha Trang/ })).toHaveLength(1);
  });

  it('hors ligne, ne propose pas de chercher une adresse', () => {
    const { input } = setup(false);
    fireEvent.change(input, { target: { value: 'zzz' } });
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText('Aucun lieu ne correspond.')).toBeTruthy();
  });
});
