import { z } from 'zod';
import { currencyCodeSchema } from '@ve-que/domain';
import { t } from '@/shared/i18n';

/*
 * Schémas des **formulaires** de voyage.
 *
 * Ils diffèrent volontairement des schémas d'entité du domaine (`tripSchema`) : un formulaire
 * manipule des chaînes saisies, avec des messages d'erreur à afficher, alors qu'une entité est
 * déjà valide et typée. Le service revalide de toute façon avec le schéma du domaine.
 */

const name = z.string().trim().min(1, t.validation.required).max(60, t.validation.maxLength(60));

const date = z.iso.date(t.validation.dateRequired);

/** Le retour peut être le jour du départ (voyage d'une journée), jamais avant. */
const endAfterStart = (value: { startDate: string; endDate: string }) =>
  value.endDate >= value.startDate;
const endAfterStartError = { message: t.validation.endBeforeStart, path: ['endDate'] };

const tripInfoFields = {
  name,
  startDate: date,
  endDate: date,
  referenceCurrency: currencyCodeSchema,
};

export const tripInfoFormSchema = z
  .object(tripInfoFields)
  .refine(endAfterStart, endAfterStartError);
export type TripInfoFormValues = z.infer<typeof tripInfoFormSchema>;

export const newTripFormSchema = z
  .object({
    ...tripInfoFields,
    ownerName: z.string().trim().min(1, t.validation.required).max(40, t.validation.maxLength(40)),
    // React Hook Form gère les listes dynamiques (`useFieldArray`) avec des objets, pas des
    // chaînes nues : chaque compagnon est donc `{ name }`.
    companions: z.array(z.object({ name: z.string().trim().max(40, t.validation.maxLength(40)) })),
  })
  .refine(endAfterStart, endAfterStartError);
export type NewTripFormValues = z.infer<typeof newTripFormSchema>;

export const memberFormSchema = z.object({
  name: z.string().trim().min(1, t.validation.required).max(40, t.validation.maxLength(40)),
});
export type MemberFormValues = z.infer<typeof memberFormSchema>;

export const CURRENCY_OPTIONS = [
  { value: 'EUR', label: t.trips.currencies.EUR },
  { value: 'VND', label: t.trips.currencies.VND },
] as const;
