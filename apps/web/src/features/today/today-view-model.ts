import type { Money } from '@ve-que/domain';

/**
 * Données prêtes à afficher pour l'écran « Aujourd'hui ».
 *
 * Les composants de l'écran ne lisent jamais la base : ils reçoivent ce « view model ».
 * En phase 3, un hook `useTodayViewModel()` le construira à partir des repositories
 * (étape du jour, dépenses, portefeuilles) ; l'aperçu du design le remplit avec des données
 * fictives. Les deux sources produisent le même type, donc le même rendu.
 */
export interface TodayViewModel {
  dateLabel: string;
  dayNumber: number;
  totalDays: number;
  stopName: string;
  weatherLabel: string | null;
  cash: { inPocket: Money; inReference: Money };
  day: { spent: Money; budget: Money; byCategory: Array<{ categoryId: string; amount: Money }> };
  program: ProgramEntry[];
  recentExpenses: Array<{ id: string; label: string; categoryId: string; amount: Money }>;
}

export interface ProgramEntry {
  id: string;
  title: string;
  /** Heure affichée (« 19 h 30 ») ; `null` pour un élément sans heure. */
  time: string | null;
  state: 'done' | 'now' | 'upcoming';
  /** Précision affichée sous le titre quand l'élément est à venir (« dans 4 h »). */
  hint: string | null;
  estimatedCost: Money | null;
}
