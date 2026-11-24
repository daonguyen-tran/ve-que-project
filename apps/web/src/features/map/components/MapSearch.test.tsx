import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Geocoder } from '@/infrastructure/geocoding/geocoder';
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

function setup(online = true) {
  const geocoder: Geocoder = {
    search: vi
      .fn()
      .mockResolvedValue([{ label: '12 Trần Phú, Hội An', point: { lat: 15.87, lng: 108.33 } }]),
  };
  const onSelectPlace = vi.fn();
  const onSelectAddress = vi.fn();
  render(
    <MapSearch
      entries={entries}
      online={online}
      geocoder={geocoder}
      onSelectPlace={onSelectPlace}
      onSelectAddress={onSelectAddress}
    />,
  );
  return { geocoder, onSelectPlace, onSelectAddress, input: screen.getByRole('combobox') };
}

describe('MapSearch', () => {
  it('trouve un lieu du voyage sans accents et le choisit au clavier', () => {
    const { input, onSelectPlace } = setup();
    fireEvent.change(input, { target: { value: 'pho' } });
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      expect.stringContaining('Phở Bà Hoa'),
      expect.stringContaining('Chercher l’adresse « pho »'),
    ]);
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

  it('hors ligne, ne propose que les lieux du voyage', () => {
    const { input } = setup(false);
    fireEvent.change(input, { target: { value: 'zzz' } });
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText('Aucun lieu de ton voyage ne correspond.')).toBeTruthy();
  });
});
