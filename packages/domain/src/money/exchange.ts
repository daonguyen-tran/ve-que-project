import { z } from 'zod';
import { currencyCodeSchema, minorUnitsPerMajor, type CurrencyCode } from './currency';
import { Money, roundHalfAwayFromZero } from './money';

/**
 * Taux de change : **1 `base` = `rate` `quote`**, en unités majeures.
 * Exemple : `{ base: 'EUR', quote: 'VND', rate: 27000 }` signifie 1 € = 27 000 ₫.
 *
 * Le taux est **figé** sur chaque dépense au moment de la saisie (F-5.4) : l'historique ne doit
 * pas changer quand le cours évolue. Il est donc stocké avec la dépense, pas recalculé.
 */
export const exchangeRateSchema = z.object({
  base: currencyCodeSchema,
  quote: currencyCodeSchema,
  rate: z.number().positive(),
  source: z.enum(['api', 'manual']),
  observedAt: z.iso.datetime(),
});

export type ExchangeRate = z.infer<typeof exchangeRateSchema>;

export class MissingRateError extends Error {
  constructor(from: CurrencyCode, to: CurrencyCode) {
    super(`Aucun taux connu pour convertir ${from} en ${to}.`);
    this.name = 'MissingRateError';
  }
}

/**
 * Convertit un montant avec un taux, dans un sens ou dans l'autre.
 * C'est le seul endroit où l'on repasse par des nombres à virgule : on convertit en unités
 * majeures, on applique le taux, puis on arrondit une seule fois à l'unité mineure cible.
 */
export function convert(money: Money, target: CurrencyCode, rate: ExchangeRate): Money {
  if (money.currency === target) return money;

  let factor: number;
  if (rate.base === money.currency && rate.quote === target) factor = rate.rate;
  else if (rate.quote === money.currency && rate.base === target) factor = 1 / rate.rate;
  else throw new MissingRateError(money.currency, target);

  const targetMajor = Money.toMajor(money) * factor;
  return Money.of(roundHalfAwayFromZero(targetMajor * minorUnitsPerMajor(target)), target);
}

/**
 * Stratégie d'obtention d'un taux (**pattern Strategy**, cf. cahier des charges §6.6).
 * Implémentations prévues dans l'infrastructure : API en ligne, dernier taux en cache, taux manuel.
 * Elles se combinent : « API si réseau, sinon cache, sinon manuel ».
 */
export interface ExchangeRateProvider {
  getRate(base: CurrencyCode, quote: CurrencyCode): Promise<ExchangeRate | null>;
}
