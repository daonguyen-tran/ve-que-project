import { z } from 'zod';
import { currencyCodeSchema, Money, parseAmount, type CurrencyCode } from '@ve-que/domain';
import { t } from '@/shared/i18n';

/*
 * Valeur d'un champ de montant dans un formulaire : le **texte saisi** (« 50k », « 1,2M »)
 * et la devise choisie. On garde le texte tel quel pendant la saisie et on ne le convertit en
 * `Money` qu'à la validation, avec le parseur du domaine (`parseAmount`).
 */
export interface MoneyFieldValue {
  text: string;
  currency: CurrencyCode;
}

const PARSE_ERRORS = {
  empty: t.validation.required,
  invalid: t.money.invalid,
  too_precise: t.money.tooPrecise,
  too_large: t.money.tooLarge,
} as const;

/** Schéma d'un montant **facultatif** : vide = pas de prix ; sinon il doit être lisible. */
export const optionalMoneyFieldSchema = z
  .object({ text: z.string(), currency: currencyCodeSchema })
  .superRefine((value, ctx) => {
    if (value.text.trim() === '') return;
    const result = parseAmount(value.text, value.currency);
    if (!result.ok)
      ctx.addIssue({ code: 'custom', path: ['text'], message: PARSE_ERRORS[result.error] });
  });

/** Convertit la valeur validée du champ en `Money` (ou `null` si le champ est vide). */
export function moneyFromField(value: MoneyFieldValue): Money | null {
  if (value.text.trim() === '') return null;
  const result = parseAmount(value.text, value.currency);
  return result.ok ? result.value : null;
}

/** Valeur initiale du champ à partir d'un montant enregistré. */
export function moneyToField(money: Money | null, defaultCurrency: CurrencyCode): MoneyFieldValue {
  if (!money) return { text: '', currency: defaultCurrency };
  // On réaffiche le montant en unités majeures, sans séparateurs : « 1200000 » ou « 45,5 ».
  return { text: String(Money.toMajor(money)).replace('.', ','), currency: money.currency };
}
