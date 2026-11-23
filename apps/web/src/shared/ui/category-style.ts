import type { DefaultExpenseCategory } from '@ve-que/domain';

/**
 * Couleur de chaque catégorie, empruntée aux billets en đồng (voir DESIGN.md).
 * Les classes sont écrites en entier pour que Tailwind les détecte à la compilation :
 * une classe construite dynamiquement (`bg-cat-${x}`) ne serait pas générée.
 */
const CATEGORY_BG: Partial<Record<DefaultExpenseCategory, string>> = {
  food: 'bg-cat-food',
  transport: 'bg-cat-transport',
  activities: 'bg-cat-activities',
  shopping: 'bg-cat-shopping',
  gifts: 'bg-cat-shopping',
  accommodation: 'bg-cat-accommodation',
};

export function categoryBgClass(categoryId: string): string {
  return CATEGORY_BG[categoryId as DefaultExpenseCategory] ?? 'bg-cat-other';
}
