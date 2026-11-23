import { z } from 'zod';
import { tripScopedSchema } from '../shared/entity';
import { localTimeSchema, placeSchema } from '../shared/common-schemas';
import { moneySchema } from '../money/money';

export const ideaCategorySchema = z.enum([
  'culture',
  'food',
  'nature',
  'beach',
  'market',
  'shopping',
  'relax',
  'nightlife',
  'other',
]);
export type IdeaCategory = z.infer<typeof ideaCategorySchema>;

/**
 * Plage d'ouverture : `days` suit la convention de `Date.getDay()` (0 = dimanche … 6 = samedi).
 * Si `close` est avant `open` (ex. 18:00 → 02:00), la plage déborde sur le lendemain : cas des
 * marchés de nuit. Ce cas est géré par le filtre « J'ai du temps libre » (phase 3).
 */
export const openingRangeSchema = z.object({
  days: z.array(z.int().min(0).max(6)).min(1),
  open: localTimeSchema,
  close: localTimeSchema,
});
export type OpeningRange = z.infer<typeof openingRangeSchema>;

/** Idée de la banque d'idées d'une ville (F-3.1). */
export const ideaSchema = tripScopedSchema.extend({
  city: z.string().trim().min(1),
  title: z.string().trim().min(1),
  category: ideaCategorySchema,
  durationMinutes: z.int().positive(),
  pricePerPerson: moneySchema.nullable(),
  /** `null` = horaires inconnus (l'idée n'est alors jamais exclue par le filtre d'ouverture). */
  openingHours: z.array(openingRangeSchema).nullable(),
  place: placeSchema,
  indoor: z.boolean(),
  priority: z.enum(['must', 'nice']),
  url: z.url().nullable().default(null),
  notes: z.string().default(''),
});
export type Idea = z.infer<typeof ideaSchema>;
