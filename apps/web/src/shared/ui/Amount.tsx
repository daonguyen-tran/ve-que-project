import { CURRENCIES, formatMoney, type Money } from '@ve-que/domain';
import { cn } from '@/shared/lib/cn';
import { withReadableGroups } from '@/shared/lib/readable-number';

type AmountSize = 'display' | 'lg' | 'md';

const NUMBER_SIZE: Record<AmountSize, string> = {
  display: 'text-[40px] leading-none font-bold tracking-[-0.02em]',
  lg: 'text-2xl leading-tight font-bold tracking-[-0.02em]',
  md: 'text-[15px] font-semibold',
};

const SYMBOL_SIZE: Record<AmountSize, string> = {
  display: 'text-xl font-semibold',
  lg: 'text-base font-semibold',
  md: 'text-[15px] font-semibold',
};

/**
 * Montant « valeur faciale » : la signature visuelle de Về Quê.
 *
 * Les chiffres sont serrés et tabulaires (ils ne « dansent » pas quand le montant change),
 * le symbole est plus petit et en rouge laque, comme sur un billet. L'étiquette accessible
 * lit le montant complet avec sa devise, quelle que soit la mise en forme visuelle.
 */
export function Amount({
  money,
  size = 'md',
  className,
}: {
  money: Money;
  size?: AmountSize;
  className?: string;
}) {
  const full = formatMoney(money);
  return (
    <span className={cn('tabular inline-flex items-baseline gap-1.5', className)} aria-label={full}>
      <span aria-hidden="true" className={NUMBER_SIZE[size]}>
        {withReadableGroups(formatMoney(money, { withSymbol: false }))}
      </span>
      <span aria-hidden="true" className={cn('text-laque', SYMBOL_SIZE[size])}>
        {CURRENCIES[money.currency].symbol}
      </span>
    </span>
  );
}
