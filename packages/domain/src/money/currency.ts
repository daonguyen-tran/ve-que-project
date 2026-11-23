import { z } from 'zod';

/**
 * Devises gérées par l'application.
 *
 * `exponent` est l'exposant ISO 4217 : le nombre de chiffres après la virgule de l'unité mineure.
 * - EUR : 2 → les montants sont stockés en centimes (45,50 € → 4550) ;
 * - VND : 0 → le đồng n'a pas de subdivision utilisée (50 000 ₫ → 50000).
 *
 * Ajouter une devise (USD…) se fait ici, sans toucher au reste du code.
 */
export const CURRENCIES = {
  EUR: { code: 'EUR', exponent: 2, symbol: '€' },
  VND: { code: 'VND', exponent: 0, symbol: '₫' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

export const currencyCodeSchema = z.enum(CURRENCY_CODES as [CurrencyCode, ...CurrencyCode[]]);

export function currencyExponent(code: CurrencyCode): number {
  return CURRENCIES[code].exponent;
}

/** 10^exposant : combien d'unités mineures dans une unité majeure (100 pour l'euro). */
export function minorUnitsPerMajor(code: CurrencyCode): number {
  return 10 ** currencyExponent(code);
}
