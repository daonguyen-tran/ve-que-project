import { Lightbulb, Map as MapIcon, Plus, SearchX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  cityGroups,
  filterIdeas,
  ideaCategorySchema,
  plannedByIdea,
  sortIdeas,
  type Idea,
  type IdeaCategory,
  type IdeaPlanFilter,
  type IdeaSort,
  type PlannedItem,
} from '@ve-que/domain';
import { useActiveTrip } from '@/app/providers/active-trip-context';
import { usePlannedItems, useTripCalendar } from '@/features/planning/hooks/use-day-plan';
import { useMembers } from '@/features/trips/hooks/use-trips';
import { t } from '@/shared/i18n';
import { Button, ButtonLink } from '@/shared/ui/Button';
import { ChoiceChips } from '@/shared/ui/ChoiceChips';
import { formatTime } from '@/shared/lib/format-date';
import { EmptyState } from '@/shared/ui/EmptyState';
import { PageHeader } from '@/shared/ui/PageHeader';
import { IdeaCard } from '../components/IdeaCard';
import { IdeaSheet } from '../components/IdeaSheet';
import { PlanIdeaSheet } from '../components/PlanIdeaSheet';
import { useIdeas } from '../hooks/use-ideas';
import type { IdeaSheetTarget } from '../idea-form';
import { CATEGORY_OPTIONS } from '../idea-style';

const ALL = 'toutes';
const PLAN_FILTERS: IdeaPlanFilter[] = ['all', 'unplanned', 'planned'];
const SORTS: IdeaSort[] = ['priority', 'duration', 'price'];

/**
 * Banque d'idées (M3). Les filtres vivent dans l'URL (`?ville=hoi an&statut=unplanned`) : on
 * les retrouve en revenant d'un jour du programme, et le bouton retour du téléphone les défait.
 */
export function IdeasPage() {
  const { activeTrip, isLoading } = useActiveTrip();
  const ideas = useIdeas(activeTrip?.id);
  const items = usePlannedItems(activeTrip?.id);
  const calendar = useTripCalendar(activeTrip);
  const members = useMembers(activeTrip?.id);
  const [params, setParams] = useSearchParams();
  const [sheet, setSheet] = useState<IdeaSheetTarget | null>(null);
  const [planning, setPlanning] = useState<Idea | null>(null);
  const [notice, setNotice] = useState<PlannedItem | null>(null);

  const stops = useMemo(() => [...(calendar?.stopsById.values() ?? [])], [calendar]);
  const groups = useMemo(() => cityGroups(ideas ?? [], stops), [ideas, stops]);
  const planned = useMemo(() => plannedByIdea(items ?? []), [items]);

  if (isLoading || (activeTrip && (!ideas || !items || !calendar || !members))) {
    return <PageHeader title={t.ideas.title} />;
  }

  if (!activeTrip || !ideas || !calendar) {
    return (
      <>
        <PageHeader title={t.ideas.title} />
        <div className="mx-auto max-w-3xl px-4 py-4">
          <EmptyState
            icon={<Lightbulb className="size-5" strokeWidth={1.9} aria-hidden="true" />}
            title={t.trips.noTripsTitle}
            body={t.planning.noTripBody}
            actions={<ButtonLink to="/voyages/nouveau">{t.trips.newTrip}</ButtonLink>}
          />
        </div>
      </>
    );
  }

  // Lecture des filtres depuis l'URL, avec des valeurs sûres si l'URL a été modifiée à la main.
  const cityParam = params.get('ville') ?? ALL;
  const city = groups.some((group) => group.key === cityParam) ? cityParam : ALL;
  const categoryParam = params.get('categorie');
  const category: IdeaCategory | null = ideaCategorySchema.safeParse(categoryParam).success
    ? (categoryParam as IdeaCategory)
    : null;
  const planFilter = (PLAN_FILTERS as string[]).includes(params.get('statut') ?? '')
    ? (params.get('statut') as IdeaPlanFilter)
    : 'all';
  const sort = (SORTS as string[]).includes(params.get('tri') ?? '')
    ? (params.get('tri') as IdeaSort)
    : 'priority';

  const setParam = (key: string, value: string | null) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value === null) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );
  };

  const visible = sortIdeas(
    filterIdeas(
      ideas,
      { cityKey: city === ALL ? null : city, category, plan: planFilter },
      planned,
    ),
    sort,
  );
  const cityName = groups.find((group) => group.key === city)?.name ?? '';
  const dayNumberOf = (date: string) => calendar.days.find((day) => day.date === date)?.dayNumber;
  const cities = groups.map((group) => group.name);
  const noticeDay = notice ? dayNumberOf(notice.date) : undefined;

  return (
    <>
      <PageHeader
        title={t.ideas.title}
        subtitle={ideas.length > 0 ? t.ideas.count(ideas.length) : undefined}
        action={
          ideas.length > 0 && (
            <span className="flex items-center gap-1">
              {/* Les idées de la ville choisie (ou tout le voyage) sur la carte du planning. */}
              <ButtonLink
                variant="quiet"
                to={`/planning?vue=carte${city === ALL ? '' : `&ville=${encodeURIComponent(city)}`}`}
                aria-label={t.ideas.showMap}
                className="w-11 px-0"
              >
                <MapIcon className="size-5" strokeWidth={1.9} aria-hidden="true" />
              </ButtonLink>
              <Button variant="quiet" onClick={() => setSheet({ mode: 'create', city: cityName })}>
                <Plus className="size-5" strokeWidth={2} aria-hidden="true" />
                {t.ideas.add}
              </Button>
            </span>
          )
        }
      />
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-3 pb-28">
        {notice && (
          <div
            role="status"
            className="bg-member-jade-tint text-member-jade flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl py-2 pr-2 pl-4 text-[15px]"
          >
            <span>
              {t.ideas.plannedNotice(
                notice.title,
                noticeDay ?? 0,
                notice.time && formatTime(notice.time),
              )}
            </span>
            <ButtonLink
              to={`/planning/jours/${notice.date}`}
              variant="quiet"
              className="text-member-jade min-h-10 px-3 text-sm"
            >
              {t.ideas.seeDay}
            </ButtonLink>
          </div>
        )}

        {ideas.length === 0 ? (
          <EmptyState
            icon={<Lightbulb className="size-5" strokeWidth={1.9} aria-hidden="true" />}
            title={t.ideas.emptyTitle}
            body={t.ideas.emptyBody}
            actions={
              <Button onClick={() => setSheet({ mode: 'create', city: stops[0]?.name ?? '' })}>
                <Plus className="size-5" strokeWidth={2} aria-hidden="true" />
                {t.ideas.addTitle}
              </Button>
            }
          />
        ) : (
          <>
            <ChoiceChips
              label={t.ideas.cityFilter}
              value={city}
              onChange={(value) => setParam('ville', value === ALL ? null : value)}
              options={[
                { value: ALL, label: t.ideas.allCities, count: ideas.length },
                ...groups.map((group) => ({
                  value: group.key,
                  label: group.name,
                  count: group.count,
                })),
              ]}
            />
            <ChoiceChips
              label={t.ideas.planFilter}
              value={planFilter}
              onChange={(value) => setParam('statut', value === 'all' ? null : value)}
              options={PLAN_FILTERS.map((value) => ({
                value,
                label: t.ideas.planFilters[value],
              }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <CompactSelect
                label={t.ideas.categoryFilter}
                value={category ?? ''}
                onChange={(value) => setParam('categorie', value || null)}
                options={[
                  { value: '', label: t.ideas.allCategories },
                  ...CATEGORY_OPTIONS.map(({ value, label }) => ({ value, label })),
                ]}
              />
              <CompactSelect
                label={t.ideas.sortLabel}
                value={sort}
                onChange={(value) => setParam('tri', value === 'priority' ? null : value)}
                options={SORTS.map((value) => ({ value, label: t.ideas.sorts[value] }))}
              />
            </div>

            {visible.length === 0 ? (
              <EmptyState
                icon={<SearchX className="size-5" strokeWidth={1.9} aria-hidden="true" />}
                title={t.ideas.noMatch}
                body=""
                actions={
                  <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>
                    {t.ideas.resetFilters}
                  </Button>
                }
              />
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {visible.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    planned={planned.get(idea.id)}
                    dayNumberOf={dayNumberOf}
                    showCity={city === ALL}
                    onOpen={() => setSheet({ mode: 'edit', idea })}
                    onPlan={() => setPlanning(idea)}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <IdeaSheet trip={activeTrip} cities={cities} target={sheet} onClose={() => setSheet(null)} />
      <PlanIdeaSheet
        trip={activeTrip}
        calendar={calendar}
        idea={planning}
        travellers={members?.length ?? 1}
        onClose={() => setPlanning(null)}
        onPlanned={setNotice}
      />
    </>
  );
}

/** Liste déroulante compacte pour la barre de filtres (libellé lu, non affiché). */
function CompactSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="border-line bg-surface text-ink hover:border-muted focus-visible:outline-laque min-h-11 w-full min-w-0 rounded-xl border px-3 text-sm font-medium focus-visible:outline-2"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
