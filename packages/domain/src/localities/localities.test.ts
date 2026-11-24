import { describe, expect, it } from 'vitest';
import { searchKey } from '../shared/search-key';
import type { LocalitySuggestion } from './locality';
import { matchLocalities, mergeSuggestions } from './locality-search';
import { VIETNAM_LOCALITIES } from './vietnam-localities';

const names = (query: string) => matchLocalities(query, VIETNAM_LOCALITIES).map((l) => l.name);

describe('searchKey', () => {
  it('ignore accents, casse, tirets et le đ vietnamien', () => {
    expect(searchKey('Hội An')).toBe('hoi an');
    expect(searchKey('Đà Lạt')).toBe('da lat');
    expect(searchKey('Hô Chi Minh-Ville')).toBe('ho chi minh ville');
    expect(searchKey('  Baie   d’Along ')).toBe('baie d along');
  });
});

describe('matchLocalities', () => {
  it('trouve sans accents, par le nom vietnamien ou un alias', () => {
    // Hoi An d'abord (le nom commence par « hoi »), puis Đồng Hới (un mot commence par « hoi »).
    expect(names('hoi')).toEqual(['Hoi An', 'Đồng Hới']);
    expect(names('đà lạt')[0]).toBe('Dalat');
    expect(names('saigon')).toEqual(['Hô Chi Minh-Ville']);
    expect(names('halong')).toEqual(['Hạ Long']);
  });

  it('classe le nom exact, puis le début du nom, puis un mot, puis le reste', () => {
    // « hue » : Hué en premier (nom exact), avant ce qui contient seulement « hue ».
    expect(names('hue')[0]).toBe('Hué');
    // « da » : les noms qui commencent par « da » avant ceux où un mot commence par « da ».
    const da = names('da');
    expect(da.slice(0, 2)).toEqual(['Da Nang', 'Dalat']);
    // « minh » : un mot du nom.
    expect(names('minh')).toContain('Hô Chi Minh-Ville');
  });

  it('ne propose rien pour une requête vide et respecte la limite', () => {
    expect(names('  ')).toEqual([]);
    expect(matchLocalities('a', VIETNAM_LOCALITIES, 3)).toHaveLength(3);
  });

  it('a des identifiants uniques et des coordonnées au Vietnam', () => {
    const ids = VIETNAM_LOCALITIES.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const { location } of VIETNAM_LOCALITIES) {
      expect(location.lat).toBeGreaterThan(8);
      expect(location.lat).toBeLessThan(23.5);
      expect(location.lng).toBeGreaterThan(102);
      expect(location.lng).toBeLessThan(110);
    }
  });
});

describe('mergeSuggestions', () => {
  const suggestion = (key: string, name: string, vietnameseName: string): LocalitySuggestion => ({
    key,
    source: 'online',
    name,
    vietnameseName,
    kind: 'city',
    location: null,
  });

  it('retire des groupes suivants ce qui est déjà proposé plus haut', () => {
    const [local, online] = mergeSuggestions(
      [suggestion('a', 'Hoi An', 'Hội An')],
      [suggestion('b', 'Hội An', 'Hội An'), suggestion('c', 'Cẩm Thanh', 'Cẩm Thanh')],
    );
    expect(local!.map((s) => s.key)).toEqual(['a']);
    expect(online!.map((s) => s.key)).toEqual(['c']);
  });
});
