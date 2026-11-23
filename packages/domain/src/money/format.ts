import { currencyExponent } from './currency';
import { Money } from './money';

const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor(currency: Money['currency'], withSymbol: boolean): Intl.NumberFormat {
  const key = `${currency}:${withSymbol}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    const digits = currencyExponent(currency);
    formatter = new Intl.NumberFormat('fr-FR', {
      style: withSymbol ? 'currency' : 'decimal',
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    formatters.set(key, formatter);
  }
  return formatter;
}

/**
 * Formate un montant à la française : `1 200 000 ₫`, `45,50 €` (NF-9).
 * Les séparateurs de milliers évitent les erreurs de zéros sur les gros montants en đồng.
 * Les formateurs `Intl` sont coûteux à créer : on les met en cache.
 */
export function formatMoney(money: Money, options: { withSymbol?: boolean } = {}): string {
  return formatterFor(money.currency, options.withSymbol ?? true).format(Money.toMajor(money));
}

const compactNumber = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

/**
 * Forme courte « à la vietnamienne », celle des étiquettes de prix : `155k`, `1,2M`.
 * Réservée aux montants en đồng dans les espaces étroits (légendes, listes) ; les montants
 * importants restent affichés en entier avec `formatMoney`. Les autres devises sont
 * formatées normalement.
 */
export function formatCompact(money: Money): string {
  if (money.currency !== 'VND') return formatMoney(money);
  const value = Money.toMajor(money);
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${compactNumber.format(value / 1_000_000)}M`;
  if (abs >= 1_000) return `${compactNumber.format(value / 1_000)}k`;
  return compactNumber.format(value);
}
