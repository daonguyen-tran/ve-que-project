import { TriangleAlert } from 'lucide-react';
import { formatCompact, formatMoney, Money } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { Amount } from '@/shared/ui/Amount';
import { categoryBgClass } from '@/shared/ui/category-style';
import type { TodayViewModel } from '../today-view-model';

/**
 * Carte « Espèces en poche » + barre de la journée.
 *
 * La barre est segmentée par catégorie, chaque segment ayant la couleur de billet de sa
 * catégorie. La largeur de chaque segment est sa part du **budget du jour** (pas du total
 * dépensé) : la partie grise restante montre donc d'un coup d'œil ce qu'on peut encore
 * dépenser. Au-delà du budget, la barre est pleine et le texte signale le dépassement.
 */
export function CashCard({ cash, day }: Pick<TodayViewModel, 'cash' | 'day'>) {
  const budget = day.budget.amountMinor;
  const overBudget = Money.compare(day.spent, day.budget) > 0;
  const segments = day.byCategory.map((entry) => ({
    ...entry,
    widthPercent: budget > 0 ? Math.min(100, (entry.amount.amountMinor / budget) * 100) : 0,
  }));
  const label = `${formatMoney(day.spent)} dépensés sur un budget de ${formatMoney(day.budget)}`;

  return (
    <section
      aria-label={t.today.cashInPocket}
      className="bg-surface flex flex-col gap-3.5 rounded-[var(--radius-card)] p-[18px] pb-4 shadow-[var(--shadow-raised)]"
    >
      <div className="flex items-baseline justify-between">
        <span className="text-muted text-sm">{t.today.cashInPocket}</span>
        <button type="button" className="text-laque -my-3 min-h-11 px-1 text-sm font-medium">
          {t.today.recount}
        </button>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Amount money={cash.inPocket} size="display" />
        <span className="text-muted tabular ml-auto text-[15px]">
          ≈ {formatMoney(cash.inReference)}
        </span>
      </div>

      <div className="border-line flex flex-col gap-2 border-t pt-3.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted">{t.today.spentToday}</span>
          <span className="tabular">
            <strong className={overBudget ? 'text-laque-deep font-semibold' : 'font-semibold'}>
              {formatCompact(day.spent)}
            </strong>{' '}
            <span className="text-muted">/ {formatCompact(day.budget)} ₫</span>
          </span>
        </div>
        <div
          role="img"
          aria-label={label}
          className="bg-line flex h-3 gap-0.5 overflow-hidden rounded-md"
        >
          {segments.map((segment) => (
            <span
              key={segment.categoryId}
              className={categoryBgClass(segment.categoryId)}
              style={{ width: `${segment.widthPercent}%` }}
            />
          ))}
        </div>
        {overBudget && (
          <p className="text-laque-deep m-0 flex items-center gap-1.5 text-[13px] font-medium">
            <TriangleAlert className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
            {t.today.overBudget(formatMoney(Money.subtract(day.spent, day.budget)))}
          </p>
        )}
        <ul className="text-ink-soft m-0 flex list-none flex-wrap gap-x-3.5 gap-y-1 p-0 text-[13px]">
          {segments.map((segment) => (
            <li key={segment.categoryId} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={`size-2 rounded-full ${categoryBgClass(segment.categoryId)}`}
              />
              {t.categories[segment.categoryId as keyof typeof t.categories] ?? segment.categoryId}{' '}
              <span className="tabular">{formatCompact(segment.amount)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
