import { CalendarCheck } from 'lucide-react';
import { Link } from 'react-router';
import type { Idea, PlannedItem } from '@ve-que/domain';
import { formatCost } from '@/features/planning/plan-style';
import { t } from '@/shared/i18n';
import { formatDuration } from '@/shared/lib/format-date';
import { Button } from '@/shared/ui/Button';
import { CATEGORY_ICON } from '../idea-style';

/**
 * Carte d'une idée. Toucher la carte ouvre la fiche ; « Planifier » est un bouton à part,
 * l'action principale. Une idée déjà planifiée affiche où elle est, avec un lien vers le jour.
 */
export function IdeaCard({
  idea,
  planned,
  dayNumberOf,
  showCity,
  onOpen,
  onPlan,
}: {
  idea: Idea;
  /** Ville affichée seulement quand la liste mélange plusieurs villes. */
  showCity: boolean;
  planned: PlannedItem[] | undefined;
  dayNumberOf: (date: string) => number | undefined;
  onOpen: () => void;
  onPlan: () => void;
}) {
  const Icon = CATEGORY_ICON[idea.category];
  const meta = [
    t.ideas.categories[idea.category],
    formatDuration(idea.durationMinutes),
    idea.pricePerPerson ? t.ideas.perPerson(formatCost(idea.pricePerPerson)) : null,
  ].filter(Boolean);
  const first = planned?.[0];
  const firstDay = first ? dayNumberOf(first.date) : undefined;

  return (
    <li className="border-line bg-surface flex flex-col rounded-[var(--radius-card)] border">
      <button
        type="button"
        onClick={onOpen}
        aria-label={t.ideas.open(idea.title)}
        className="hover:bg-ground/60 focus-visible:outline-laque flex items-start gap-3 rounded-t-[var(--radius-card)] px-4 pt-3.5 pb-2 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2"
      >
        <span className="bg-laque-tint text-laque-deep flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Icon className="size-5" strokeWidth={1.9} aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-start justify-between gap-2">
            <span className="text-[15px] leading-snug font-semibold [overflow-wrap:anywhere]">
              {idea.title}
            </span>
            {idea.priority === 'must' && (
              <span className="bg-laque text-on-laque shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold">
                {t.ideas.priorities.must}
              </span>
            )}
          </span>
          <span className="text-muted tabular truncate text-[13px]">{meta.join(' · ')}</span>
        </span>
      </button>
      <div className="flex min-h-12 items-center justify-between gap-2 py-1 pr-2 pl-[68px]">
        {first ? (
          <Link
            to={`/planning/jours/${first.date}`}
            className="text-success flex min-h-11 items-center gap-1.5 text-sm font-medium no-underline"
          >
            <CalendarCheck className="size-4" strokeWidth={2} aria-hidden="true" />
            {t.ideas.plannedOn(firstDay ?? 0, t.slots[first.slot])}
          </Link>
        ) : (
          <span className="text-muted truncate text-sm">{showCity ? idea.city : ''}</span>
        )}
        {!first && (
          <Button variant="secondary" onClick={onPlan} className="min-h-10 px-3.5 text-sm">
            {t.ideas.plan}
          </Button>
        )}
      </div>
    </li>
  );
}
