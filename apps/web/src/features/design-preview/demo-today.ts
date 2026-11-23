import { Money } from '@ve-que/domain';
import type { TodayViewModel } from '@/features/today/today-view-model';

/**
 * DONNÉES FICTIVES pour l'aperçu du design (route `/apercu`).
 * Elles ne sont jamais enregistrées et ne décrivent pas le vrai voyage.
 */
export const demoToday: TodayViewModel = {
  dateLabel: 'Lundi 12 juillet',
  dayNumber: 6,
  totalDays: 21,
  stopName: 'Hoi An',
  weatherLabel: '34° · Ensoleillé',
  cash: {
    inPocket: Money.of(1_240_000, 'VND'),
    inReference: Money.of(4_593, 'EUR'),
  },
  day: {
    spent: Money.of(380_000, 'VND'),
    budget: Money.of(600_000, 'VND'),
    byCategory: [
      { categoryId: 'food', amount: Money.of(155_000, 'VND') },
      { categoryId: 'transport', amount: Money.of(65_000, 'VND') },
      { categoryId: 'activities', amount: Money.of(160_000, 'VND') },
    ],
  },
  program: [
    {
      id: 'demo-1',
      slot: 'morning',
      title: 'Vieille ville',
      time: '9:00',
      state: 'done',
      hint: null,
      estimatedCost: null,
    },
    {
      id: 'demo-2',
      slot: 'afternoon',
      title: 'Temps libre',
      time: null,
      state: 'now',
      hint: null,
      estimatedCost: null,
    },
    {
      id: 'demo-3',
      slot: 'evening',
      title: 'Marché de nuit',
      time: '19:00',
      state: 'upcoming',
      hint: 'dans 4 h',
      estimatedCost: Money.of(80_000, 'VND'),
    },
  ],
  recentExpenses: [
    { id: 'demo-e1', label: 'Cao lầu', categoryId: 'food', amount: Money.of(50_000, 'VND') },
    {
      id: 'demo-e2',
      label: 'Grab · hôtel → vieille ville',
      categoryId: 'transport',
      amount: Money.of(65_000, 'VND'),
    },
  ],
};
