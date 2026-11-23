import { err, ok, type Result } from '../shared/result';
import { currencyExponent, type CurrencyCode } from './currency';
import { Money } from './money';

export type AmountParseError = 'empty' | 'invalid' | 'too_precise' | 'too_large';

const MULTIPLIERS = { '': 1n, k: 1_000n, m: 1_000_000n } as const;

/**
 * Interprète une saisie de montant « à la vietnamienne » (F-5.2).
 *
 * Exemples acceptés (en VND) :
 *   `50k` → 50 000   `1,2M` / `1.2m` → 1 200 000   `350000` / `350 000` / `350.000` → 350 000
 * Exemples en EUR : `12,50` / `12.5` → 1 250 centimes ; `1 250` → 125 000 centimes.
 *
 * Règles de lecture des séparateurs (`,` `.` espace) :
 * 1. Avec un suffixe `k` ou `M`, le seul séparateur autorisé est la **virgule décimale** :
 *    `1,2M`. Un groupement de milliers n'a pas de sens devant un multiplicateur.
 * 2. Sans suffixe, des groupes de **exactement 3 chiffres** après chaque séparateur sont des
 *    séparateurs de milliers : `1.200.000`, `350 000`. C'est l'usage vietnamien (point) et
 *    français (espace). Le cas `1.250` est donc lu « mille deux cent cinquante ».
 * 3. Sans suffixe, **un seul** séparateur suivi de 1 ou 2 chiffres est une virgule décimale :
 *    `12,5` ou `12.50`.
 * Tout le reste (`1,2,3`, `12.5000`, `k50`) est refusé plutôt que deviné : une erreur visible
 * vaut mieux qu'un montant faux de trois zéros.
 *
 * Le calcul se fait en `BigInt` pour rester exact, puis on vérifie que le résultat tient en
 * unités mineures entières (`12,5 ₫` est refusé : `too_precise`).
 */
export function parseAmount(
  input: string,
  currency: CurrencyCode,
): Result<Money, AmountParseError> {
  // On retire tous les espaces, y compris l'espace fine insécable (U+202F) que produit
  // `Intl.NumberFormat('fr-FR')` : un montant copié depuis l'appli doit pouvoir être recollé.
  const compact = input.toLowerCase().replace(/[\s\u00a0\u202f]/g, '');
  if (compact === '') return err('empty');

  const match = /^(\d[\d.,]*)([km]?)$/.exec(compact);
  if (!match) return err('invalid');
  const [, numberPart = '', suffix = ''] = match;

  const decimal = splitDecimal(numberPart, suffix !== '');
  if (!decimal) return err('invalid');

  const fractionDigits = BigInt(decimal.fraction.length);
  const scaled =
    BigInt(decimal.integer + decimal.fraction) * MULTIPLIERS[suffix as keyof typeof MULTIPLIERS];
  const minorPerMajor = 10n ** BigInt(currencyExponent(currency));
  const divisor = 10n ** fractionDigits;
  const numerator = scaled * minorPerMajor;

  if (numerator % divisor !== 0n) return err('too_precise');
  const amountMinor = numerator / divisor;
  if (amountMinor > BigInt(Number.MAX_SAFE_INTEGER)) return err('too_large');

  return ok(Money.of(Number(amountMinor), currency));
}

/** Sépare partie entière et décimale selon les règles décrites ci-dessus. */
function splitDecimal(
  numberPart: string,
  hasSuffix: boolean,
): { integer: string; fraction: string } | null {
  const groups = numberPart.split(/[.,]/);
  const [head = '', ...rest] = groups;
  if (head === '') return null;
  if (rest.length === 0) return { integer: head, fraction: '' };

  if (hasSuffix) {
    if (rest.length !== 1 || rest[0] === '') return null;
    return { integer: head, fraction: rest[0] ?? '' };
  }

  const thousandsGrouping = head.length <= 3 && rest.every((group) => group.length === 3);
  if (thousandsGrouping) return { integer: head + rest.join(''), fraction: '' };

  const [fraction = ''] = rest;
  if (rest.length === 1 && fraction.length >= 1 && fraction.length <= 2) {
    return { integer: head, fraction };
  }
  return null;
}
