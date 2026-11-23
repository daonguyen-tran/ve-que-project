import { describe, expect, it } from 'vitest';
import { Money } from '../money/money';
import { toLocalDate as d } from '../shared/local-date';
import type { TripDay } from './days';
import type { Idea } from './idea';
import {
  cityGroups,
  cityKey,
  filterIdeas,
  groupCost,
  openingStatus,
  sortIdeas,
  suggestDayForCity,
} from './idea-rules';

type SortableIdea = Pick<Idea, 'title' | 'priority' | 'durationMinutes' | 'pricePerPerson'>;
const idea = (title: string, partial: Partial<SortableIdea> = {}): SortableIdea => ({
  title,
  priority: 'nice',
  durationMinutes: 60,
  pricePerPerson: null,
  ...partial,
});

describe('villes', () => {
  it('compare les noms sans accents ni casse, đ compris', () => {
    expect(cityKey(' Hội  An ')).toBe('hoi an');
    expect(cityKey('Đà Nẵng')).toBe(cityKey('da nang'));
  });

  it('liste les étapes dans l’ordre du voyage, puis les autres villes', () => {
    const groups = cityGroups(
      [{ city: 'hoi an' }, { city: 'Hội An' }, { city: 'Bà Nà Hills' }, { city: 'Đà Nẵng' }],
      [{ name: 'Hô Chi Minh-Ville' }, { name: 'Hội An' }],
    );
    expect(groups.map((group) => [group.name, group.count])).toEqual([
      ['Hô Chi Minh-Ville', 0],
      ['Hội An', 2],
      ['Bà Nà Hills', 1],
      ['Đà Nẵng', 1],
    ]);
  });
});

describe('suggestDayForCity', () => {
  const days: TripDay[] = [
    { date: d('2027-07-01'), dayNumber: 1, stopId: 'hcm', isTransition: false },
    { date: d('2027-07-02'), dayNumber: 2, stopId: 'hoi', isTransition: true },
    { date: d('2027-07-03'), dayNumber: 3, stopId: 'hoi', isTransition: false },
  ];
  const stops = [
    { id: 'hcm', name: 'Hô Chi Minh-Ville' },
    { id: 'hoi', name: 'Hội An' },
  ];
  it('propose le premier jour passé dans la ville de l’idée', () => {
    expect(suggestDayForCity(days, stops, 'hoi an')).toBe('2027-07-02');
    expect(suggestDayForCity(days, stops, 'Hội An', d('2027-07-03'))).toBe('2027-07-03');
  });
  it('à défaut, le premier jour', () => {
    expect(suggestDayForCity(days, stops, 'Huế')).toBe('2027-07-01');
  });
});

describe('filtres et tri', () => {
  it('filtre par ville, catégorie et statut de planification', () => {
    const ideas = [
      { id: 'a', city: 'Hội An', category: 'food' as const },
      { id: 'b', city: 'Hoi An', category: 'culture' as const },
      { id: 'c', city: 'Huế', category: 'food' as const },
    ];
    const planned = new Map([['b', []]]);
    const ids = (list: { id: string }[]) => list.map((entry) => entry.id);
    expect(
      ids(filterIdeas(ideas, { cityKey: 'hoi an', category: null, plan: 'all' }, planned)),
    ).toEqual(['a', 'b']);
    expect(
      ids(filterIdeas(ideas, { cityKey: null, category: 'food', plan: 'all' }, planned)),
    ).toEqual(['a', 'c']);
    expect(
      ids(filterIdeas(ideas, { cityKey: null, category: null, plan: 'planned' }, planned)),
    ).toEqual(['b']);
    expect(
      ids(filterIdeas(ideas, { cityKey: null, category: null, plan: 'unplanned' }, planned)),
    ).toEqual(['a', 'c']);
  });

  it('trie par priorité, durée ou prix', () => {
    const ideas = [
      idea('Bánh mì', { durationMinutes: 30, pricePerPerson: Money.fromMajor(30_000, 'VND') }),
      idea('Pont japonais', { priority: 'must', durationMinutes: 90 }),
      idea('Atelier', { durationMinutes: 120, pricePerPerson: Money.fromMajor(250_000, 'VND') }),
    ];
    const titles = (list: SortableIdea[]) => list.map((entry) => entry.title);
    expect(titles(sortIdeas(ideas, 'priority'))).toEqual(['Pont japonais', 'Atelier', 'Bánh mì']);
    expect(titles(sortIdeas(ideas, 'duration'))).toEqual(['Bánh mì', 'Pont japonais', 'Atelier']);
    expect(titles(sortIdeas(ideas, 'price'))).toEqual(['Bánh mì', 'Atelier', 'Pont japonais']);
  });

  it('calcule le coût pour le groupe', () => {
    expect(groupCost(Money.fromMajor(50_000, 'VND'), 3)).toEqual(Money.fromMajor(150_000, 'VND'));
    expect(groupCost(null, 3)).toBeNull();
  });
});

describe('openingStatus', () => {
  // Lundi 5 juillet 2027 ; marché de nuit ouvert du vendredi au dimanche, 17 h → 1 h.
  const monday = d('2027-07-05');
  const museum = [{ days: [2, 3, 4, 5, 6, 0], open: '08:00', close: '17:00' }];
  const nightMarket = [{ days: [5, 6, 0], open: '17:00', close: '01:00' }];

  it('sans horaires, ne se prononce pas', () => {
    expect(openingStatus(null, monday, { slot: 'morning', time: null })).toBe('unknown');
  });

  it('repère un jour de fermeture et les créneaux hors horaires', () => {
    expect(openingStatus(museum, monday, { slot: 'morning', time: null })).toBe('closed');
    expect(openingStatus(museum, d('2027-07-06'), { slot: 'afternoon', time: null })).toBe('open');
    expect(openingStatus(museum, d('2027-07-06'), { slot: 'evening', time: null })).toBe('closed');
    expect(openingStatus(museum, d('2027-07-06'), { slot: 'afternoon', time: '17:00' })).toBe(
      'closed',
    );
  });

  it('gère les plages qui passent minuit', () => {
    const sunday = d('2027-07-04');
    expect(openingStatus(nightMarket, sunday, { slot: 'evening', time: '23:30' })).toBe('open');
    // Lundi 0 h 30 : encore la nuit de dimanche.
    expect(openingStatus(nightMarket, monday, { slot: 'evening', time: '00:30' })).toBe('open');
    expect(openingStatus(nightMarket, monday, { slot: 'evening', time: null })).toBe('closed');
  });
});
