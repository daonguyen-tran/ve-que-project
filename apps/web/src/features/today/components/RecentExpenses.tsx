import { formatCompact } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { categoryBgClass } from '@/shared/ui/category-style';
import type { TodayViewModel } from '../today-view-model';

export function RecentExpenses({ items }: { items: TodayViewModel['recentExpenses'] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="today-expenses" className="flex flex-col gap-2">
      <h2 id="today-expenses" className="m-0 px-1 text-lg font-semibold tracking-[-0.01em]">
        {t.today.lastExpenses}
      </h2>
      <ul className="m-0 flex list-none flex-col p-0 px-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2.5 py-2 text-[15px]">
            <span
              aria-hidden="true"
              className={`size-2 shrink-0 rounded-full ${categoryBgClass(item.categoryId)}`}
            />
            <span className="min-w-0 truncate">{item.label}</span>
            <span className="tabular ml-auto font-semibold whitespace-nowrap">
              {formatCompact(item.amount)} ₫
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
