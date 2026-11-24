import 'fake-indexeddb/auto';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEntity, type Locality, type LocalitySuggestion } from '@ve-que/domain';
import { RepositoriesProvider } from '@/app/providers/RepositoriesProvider';
import { VeQueDatabase } from '@/infrastructure/db/database';
import type { OnlineLocalitySearch } from '@/infrastructure/geocoding/photon-locality-search';
import { createRepositories } from '@/infrastructure/repositories';
import { LocalityNameField } from './LocalityNameField';

let db: VeQueDatabase | undefined;
afterEach(async () => {
  vi.useRealTimers();
  setOnline(true);
  await db?.delete();
});

function setOnline(online: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online });
  window.dispatchEvent(new Event(online ? 'online' : 'offline'));
}

/** Fausse recherche en ligne : renvoie toujours le même village (et Hội An, en double). */
const fakeOnline: OnlineLocalitySearch = {
  search: vi.fn(async () => [
    {
      key: 'online:N1',
      source: 'online' as const,
      name: 'Cẩm Thanh',
      vietnameseName: 'Cẩm Thanh',
      kind: 'village' as const,
      location: { lat: 15.87, lng: 108.36 },
      detail: 'Quảng Nam',
    },
    {
      key: 'online:N2',
      source: 'online' as const,
      name: 'Hội An',
      vietnameseName: 'Hội An',
      kind: 'city' as const,
      location: { lat: 15.88, lng: 108.33 },
    },
  ]),
};

async function setup(saved: Locality[] = []) {
  db = new VeQueDatabase(`test-${crypto.randomUUID()}`);
  const repositories = createRepositories(db);
  await repositories.localities.saveMany(saved);
  const onPick = vi.fn<(suggestion: LocalitySuggestion) => void>();
  function Harness() {
    const [value, setValue] = useState('');
    return (
      <LocalityNameField
        label="Nom"
        value={value}
        onChange={setValue}
        onPick={(suggestion) => {
          setValue(suggestion.name);
          onPick(suggestion);
        }}
        online={fakeOnline}
      />
    );
  }
  render(
    <RepositoriesProvider repositories={repositories}>
      <Harness />
    </RepositoriesProvider>,
  );
  return { onPick, input: screen.getByRole('combobox', { name: 'Nom' }) };
}

const listbox = () => screen.getByRole('listbox', { hidden: true });

describe('LocalityNameField', () => {
  it('propose les lieux connus dès les premières lettres, sans accents', async () => {
    const { input } = await setup();
    fireEvent.change(input, { target: { value: 'ho' } });
    expect(await within(listbox()).findByRole('option', { name: /Hoi An/ })).toBeTruthy();
    expect(within(listbox()).getByRole('group', { name: 'Villes et lieux connus' })).toBeTruthy();
    expect(input.getAttribute('aria-expanded')).toBe('true');
  });

  it('se choisit au clavier : flèche bas puis Entrée', async () => {
    const { input, onPick } = await setup();
    fireEvent.change(input, { target: { value: 'saig' } });
    await within(listbox()).findByRole('option', { name: /Hô Chi Minh-Ville/ });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.getAttribute('aria-activedescendant')).toContain('builtin:ho-chi-minh-ville');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onPick).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Hô Chi Minh-Ville',
        vietnameseName: 'Thành phố Hồ Chí Minh',
      }),
    );
    expect((input as HTMLInputElement).value).toBe('Hô Chi Minh-Ville');
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('montre « mes lieux » en premier', async () => {
    const village = createEntity<Locality>({
      name: 'Xóm Đông',
      vietnameseName: 'Xóm Đông',
      kind: 'village',
      location: null,
    });
    const { input } = await setup([village]);
    fireEvent.change(input, { target: { value: 'xom' } });
    const group = await within(listbox()).findByRole('group', { name: 'Mes lieux' });
    expect(within(group).getByRole('option', { name: /Xóm Đông/ })).toBeTruthy();
  });

  it('ajoute les lieux en ligne après une pause, sans doublon', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { input } = await setup();
    fireEvent.change(input, { target: { value: 'hội' } });
    expect(screen.getByText('Recherche en ligne…')).toBeTruthy();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    const online = within(listbox()).getByRole('group', { name: 'Autres lieux (en ligne)' });
    expect(within(online).getByRole('option', { name: /Cẩm Thanh/ })).toBeTruthy();
    // Hội An est déjà proposé par la liste intégrée : pas une seconde fois en ligne.
    expect(within(online).queryByRole('option', { name: /Hội An/ })).toBeNull();
  });

  it('hors ligne, le dit et ne propose que les lieux connus', async () => {
    setOnline(false);
    const { input } = await setup();
    fireEvent.change(input, { target: { value: 'nha trang' } });
    expect(await within(listbox()).findByRole('option', { name: /Nha Trang/ })).toBeTruthy();
    expect(
      screen.getByText('Hors ligne : seuls les lieux connus et les tiens sont proposés.'),
    ).toBeTruthy();
  });
});
