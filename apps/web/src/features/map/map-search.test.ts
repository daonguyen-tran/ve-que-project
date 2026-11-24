import { describe, expect, it } from 'vitest';
import type { MapPlace } from './map-model';
import { searchPlaces, type SearchEntry } from './map-search';

const entry = (title: string, keywords = '', zoneName = 'Hội An'): SearchEntry => ({
  zone: 'hoi an',
  zoneName,
  place: {
    id: title,
    tone: 'idea',
    point: null,
    title,
    subtitle: '',
    mapsUrl: null,
    keywords,
  } as MapPlace,
});

const titles = (list: SearchEntry[]) => list.map((e) => e.place.title);

describe('searchPlaces', () => {
  const entries = [
    entry('Marché de nuit'),
    entry('Vieille ville et pont japonais'),
    entry('Phở Bà Hoa', '12 Trần Phú'),
    entry('Pont japonais'),
    entry('Plage An Bàng', '', 'Hội An'),
  ];

  it('ignore accents et casse', () => {
    expect(titles(searchPlaces(entries, 'pho'))).toEqual(['Phở Bà Hoa']);
    expect(titles(searchPlaces(entries, 'MARCHE'))).toEqual(['Marché de nuit']);
  });

  it('classe le début du titre, puis les mots, puis le reste', () => {
    expect(titles(searchPlaces(entries, 'pont'))).toEqual([
      'Pont japonais',
      'Vieille ville et pont japonais',
    ]);
    expect(titles(searchPlaces(entries, 'tran phu'))).toEqual(['Phở Bà Hoa']);
  });

  it('cherche aussi par ville, et ne renvoie rien pour un texte vide', () => {
    expect(searchPlaces(entries, 'hoi an')).toHaveLength(5);
    expect(searchPlaces(entries, '   ')).toEqual([]);
  });
});
