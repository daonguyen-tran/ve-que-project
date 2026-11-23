import { z } from 'zod';
import { tripScopedSchema } from '../shared/entity';
import { localDateSchema } from '../shared/local-date';
import { localTimeSchema } from '../shared/common-schemas';
import { currencyCodeSchema } from '../money/currency';
import { moneySchema } from '../money/money';
import { exchangeRateSchema } from '../money/exchange';

/**
 * Catégories par défaut (F-5.5). Les identifiants sont stables et ne sont jamais affichés :
 * les libellés vivent dans les textes de l'interface (i18n).
 */
export const DEFAULT_EXPENSE_CATEGORIES = [
  'accommodation',
  'transport',
  'food',
  'activities',
  'shopping',
  'gifts',
  'health',
  'communication',
  'pre_departure',
  'bank_fees',
  'misc',
] as const;
export type DefaultExpenseCategory = (typeof DEFAULT_EXPENSE_CATEGORIES)[number];

/**
 * Partage d'une dépense entre membres (F-5.8).
 * Union discriminée sur `mode` : ajouter les parts personnalisées (`custom`) plus tard se fera
 * en ajoutant une variante et sa stratégie de calcul, sans casser les données existantes.
 */
export const expenseSharingSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('none') }),
  z.object({ mode: z.literal('equal'), participantIds: z.array(z.uuid()).min(1) }),
]);
export type ExpenseSharing = z.infer<typeof expenseSharingSchema>;

/** Dépense (F-5.3). */
export const expenseSchema = tripScopedSchema.extend({
  amount: moneySchema,
  /** Équivalent dans la devise de référence du voyage, figé à la saisie (F-5.4). */
  amountInReference: moneySchema,
  /** Taux utilisé pour `amountInReference` ; `null` si la dépense est déjà dans cette devise. */
  rate: exchangeRateSchema.nullable(),
  categoryId: z.string().min(1),
  payerId: z.uuid(),
  walletId: z.uuid(),
  date: localDateSchema,
  time: localTimeSchema.nullable(),
  stopId: z.uuid().nullable(),
  plannedItemId: z.uuid().nullable(),
  label: z.string().default(''),
  sharing: expenseSharingSchema,
});
export type Expense = z.infer<typeof expenseSchema>;

/** Portefeuille : source d'argent (F-6.1). */
export const walletSchema = tripScopedSchema.extend({
  name: z.string().trim().min(1),
  kind: z.enum(['cash', 'card']),
  currency: currencyCodeSchema,
});
export type Wallet = z.infer<typeof walletSchema>;

/**
 * Mouvement entre portefeuilles qui n'est pas une dépense (F-6.2, F-6.3, F-6.5) :
 * - `withdrawal` : retrait au distributeur (carte → espèces), avec frais éventuels ;
 * - `exchange` : change d'espèces (EUR → VND) au taux réellement obtenu ;
 * - `adjustment` : écart constaté au recomptage (sortie si négatif).
 */
export const walletMovementSchema = tripScopedSchema.extend({
  kind: z.enum(['withdrawal', 'exchange', 'adjustment']),
  fromWalletId: z.uuid().nullable(),
  toWalletId: z.uuid().nullable(),
  amountOut: moneySchema.nullable(),
  amountIn: moneySchema.nullable(),
  fee: moneySchema.nullable(),
  date: localDateSchema,
  note: z.string().default(''),
});
export type WalletMovement = z.infer<typeof walletMovementSchema>;
