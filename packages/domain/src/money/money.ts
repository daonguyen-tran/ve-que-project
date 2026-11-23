import { z } from 'zod';
import { currencyCodeSchema, minorUnitsPerMajor, type CurrencyCode } from './currency';

/**
 * Montant d'argent : **Value Object**.
 *
 * Règle d'or (NF-7 du cahier des charges) : un montant est un **entier** exprimé dans l'unité
 * mineure de sa devise. Les nombres à virgule flottante ne savent pas représenter exactement
 * 0,1 ou 0,2 (`0.1 + 0.2 === 0.30000000000000004`), ce qui finit par fausser des totaux.
 *
 * Choix de conception : `Money` est un objet de données simple (et non une classe) parce qu'il
 * est stocké tel quel dans IndexedDB et exporté en JSON ; une instance de classe perdrait ses
 * méthodes en route. Le comportement est donc regroupé dans l'objet compagnon `Money` ci-dessous
 * (même nom que le type, ce que TypeScript autorise), dont toutes les fonctions sont pures.
 */
export interface Money {
  readonly amountMinor: number;
  readonly currency: CurrencyCode;
}

export const moneySchema = z.object({
  amountMinor: z.int(),
  currency: currencyCodeSchema,
});

export class CurrencyMismatchError extends Error {
  constructor(a: CurrencyCode, b: CurrencyCode) {
    super(`Opération impossible entre ${a} et ${b} : convertissez d'abord l'un des montants.`);
    this.name = 'CurrencyMismatchError';
  }
}

/**
 * Arrondi « au plus proche, demi s'éloignant de zéro » (2,5 → 3 ; -2,5 → -3).
 * `Math.round(-2.5)` donnerait -2, ce qui rendrait un remboursement asymétrique d'une dépense.
 * Le `toPrecision(15)` gomme les erreurs de flottant du type 1.005 * 100 = 100.49999999999999.
 */
export function roundHalfAwayFromZero(value: number): number {
  const cleaned = Number(value.toPrecision(15));
  return Math.sign(cleaned) * Math.round(Math.abs(cleaned));
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) throw new CurrencyMismatchError(a.currency, b.currency);
}

export const Money = {
  of(amountMinor: number, currency: CurrencyCode): Money {
    if (!Number.isSafeInteger(amountMinor)) {
      throw new RangeError(`Montant invalide : ${amountMinor} (entier attendu)`);
    }
    return { amountMinor, currency };
  },

  zero(currency: CurrencyCode): Money {
    return { amountMinor: 0, currency };
  },

  /** Depuis l'unité majeure : `Money.fromMajor(45.5, 'EUR')` → 4550 centimes. */
  fromMajor(amountMajor: number, currency: CurrencyCode): Money {
    return Money.of(roundHalfAwayFromZero(amountMajor * minorUnitsPerMajor(currency)), currency);
  },

  /** Vers l'unité majeure, pour l'affichage ou les calculs de taux uniquement. */
  toMajor(money: Money): number {
    return money.amountMinor / minorUnitsPerMajor(money.currency);
  },

  add(a: Money, b: Money): Money {
    assertSameCurrency(a, b);
    return Money.of(a.amountMinor + b.amountMinor, a.currency);
  },

  subtract(a: Money, b: Money): Money {
    assertSameCurrency(a, b);
    return Money.of(a.amountMinor - b.amountMinor, a.currency);
  },

  negate(money: Money): Money {
    return Money.of(-money.amountMinor, money.currency);
  },

  /** Multiplie par un facteur (ex. forfait quotidien × nombre de jours), avec arrondi. */
  multiply(money: Money, factor: number): Money {
    return Money.of(roundHalfAwayFromZero(money.amountMinor * factor), money.currency);
  },

  sum(amounts: readonly Money[], currency: CurrencyCode): Money {
    return amounts.reduce((total, m) => Money.add(total, m), Money.zero(currency));
  },

  equals(a: Money, b: Money): boolean {
    return a.currency === b.currency && a.amountMinor === b.amountMinor;
  },

  compare(a: Money, b: Money): number {
    assertSameCurrency(a, b);
    return Math.sign(a.amountMinor - b.amountMinor);
  },

  isZero(money: Money): boolean {
    return money.amountMinor === 0;
  },

  isNegative(money: Money): boolean {
    return money.amountMinor < 0;
  },

  /**
   * Répartit un montant en `parts` parts égales **sans perdre ni créer d'argent**.
   *
   * Diviser 100 000 ₫ en 3 donne 33 333,33… ₫ : impossible en entiers. On calcule la part de
   * base par division entière (33 333), puis on distribue le reste (1 ₫) une unité à la fois
   * aux premières parts. Résultat : [33 334, 33 333, 33 333], dont la somme vaut exactement
   * le montant initial. C'est la base de la répartition « à parts égales » (F-5.8).
   */
  allocateEvenly(money: Money, parts: number): Money[] {
    if (!Number.isInteger(parts) || parts <= 0) {
      throw new RangeError(`Nombre de parts invalide : ${parts}`);
    }
    const sign = Math.sign(money.amountMinor) || 1;
    const absolute = Math.abs(money.amountMinor);
    const base = Math.floor(absolute / parts);
    const remainder = absolute - base * parts;
    return Array.from({ length: parts }, (_, i) =>
      Money.of(sign * (base + (i < remainder ? 1 : 0)), money.currency),
    );
  },
} as const;
