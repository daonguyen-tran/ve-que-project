import { Check } from 'lucide-react';
import { formatCompact } from '@ve-que/domain';
import { Link } from 'react-router';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import type { ProgramEntry } from '../today-view-model';

/**
 * Programme du jour, dans l'ordre chronologique, l'heure en tête de ligne. L'élément en cours
 * est le seul en jaune curcuma : c'est le « maintenant » de l'appli, réservé à cet usage
 * (voir DESIGN.md).
 */
export function DayProgram({ entries }: { entries: ProgramEntry[] }) {
  return (
    <section aria-labelledby="today-program" className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between px-1">
        <h2 id="today-program" className="m-0 text-lg font-semibold tracking-[-0.01em]">
          {t.today.program}
        </h2>
        <Link
          to="/idees"
          className="text-laque min-h-11 content-center text-sm font-medium no-underline"
        >
          {t.today.freeTimeLink}
        </Link>
      </div>
      <ol className="border-line bg-surface m-0 list-none overflow-hidden rounded-[var(--radius-card)] border p-0">
        {entries.map((entry) => (
          <ProgramRow key={entry.id} entry={entry} />
        ))}
      </ol>
    </section>
  );
}

function ProgramRow({ entry }: { entry: ProgramEntry }) {
  const isNow = entry.state === 'now';
  const detail = entry.state === 'done' ? t.status.done : isNow ? t.status.now : (entry.hint ?? '');

  return (
    <li
      aria-current={isNow ? 'time' : undefined}
      className={cn(
        'border-line-soft grid grid-cols-[64px_1fr_auto] items-center gap-3 border-b px-4 py-3.5 last:border-b-0',
        isNow && 'bg-curcuma-tint',
      )}
    >
      <span
        className={cn(
          'tabular text-sm font-semibold whitespace-nowrap',
          isNow ? 'text-curcuma-ink' : entry.state === 'done' ? 'text-muted' : 'text-ink',
        )}
      >
        {entry.time}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-[15px] font-medium">{entry.title}</span>
        {detail && (
          <span className={cn('tabular text-[13px]', isNow ? 'text-curcuma-ink' : 'text-muted')}>
            {detail}
          </span>
        )}
      </span>
      {entry.state === 'done' ? (
        <Check
          className="text-success size-5"
          strokeWidth={2.2}
          role="img"
          aria-label={t.status.done}
        />
      ) : isNow ? (
        <span className="border-curcuma text-curcuma-ink rounded-full border px-2.5 py-0.5 text-xs font-semibold">
          {t.today.now}
        </span>
      ) : entry.estimatedCost ? (
        <span className="text-muted tabular text-[13px]">
          ~{formatCompact(entry.estimatedCost)} ₫
        </span>
      ) : (
        <span />
      )}
    </li>
  );
}
