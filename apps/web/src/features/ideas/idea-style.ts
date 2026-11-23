import {
  Flower2,
  Landmark,
  Martini,
  Mountain,
  Shapes,
  ShoppingBag,
  Store,
  UtensilsCrossed,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import { ideaCategorySchema, type IdeaCategory } from '@ve-que/domain';
import { t } from '@/shared/i18n';

/** Icône de chaque catégorie d'idée ; le libellé l'accompagne toujours. */
export const CATEGORY_ICON: Record<IdeaCategory, LucideIcon> = {
  culture: Landmark,
  food: UtensilsCrossed,
  nature: Mountain,
  beach: Waves,
  market: Store,
  shopping: ShoppingBag,
  relax: Flower2,
  nightlife: Martini,
  other: Shapes,
};

export const CATEGORY_OPTIONS = ideaCategorySchema.options.map((category) => ({
  value: category,
  label: t.ideas.categories[category],
  icon: CATEGORY_ICON[category],
}));

/** Jours dans l'ordre français (lundi d'abord), avec leur numéro `Date.getDay()`. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
