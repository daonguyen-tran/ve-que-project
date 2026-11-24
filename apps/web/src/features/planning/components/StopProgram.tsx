import { ChevronRight, Plus } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { TIME_SLOTS, type Stop, type TimeSlot, type Trip, type TripDay } from '@ve-que/domain';
import { useTransfers } from '@/features/itinerary/hooks/use-itinerary';
import { t } from '@/shared/i18n';
import { formatLongDate } from '@/shared/lib/format-date';
import { usePlannedItems, useTripCalendar } from '../hooks/use-day-plan';
import { buildColumns, containerId, idsIn, type Columns } from '../plan-board';
import type { PlannedItemSheetTarget } from '../planned-item-form';
import { DayContent } from './DayContent';
import { PlannedItemSheet } from './PlannedItemSheet';

/**
 * Programme d'une étape, dans sa fiche : une carte par jour, du jour d'arrivée au jour de
 * départ inclus. C'est ici qu'on organise ses journées (« qu'est-ce qu'on fait à Hoi An ? »).
 *
 * - Chaque jour montre son trajet éventuel et ses créneaux remplis (`DayContent`).
 * - « Ajouter » ouvre la fiche d'activité sur ce jour, dans le premier créneau encore libre ;
 *   la fiche permet de changer de créneau, ou de donner une heure qui le règle d'elle-même.
 * - Les jours de transition (départ de l'étape précédente, départ vers la suivante) figurent
 *   dans les deux étapes : une activité est rattachée à une date, pas à une étape, donc rien
 *   n'est dupliqué.
 * - Le titre de chaque jour mène au programme du jour dans « Jour par jour ».
 */
export function StopProgram({ trip, stop }: { trip: Trip; stop: Stop }) {
  const calendar = useTripCalendar(trip);
  const items = usePlannedItems(trip.id);
  const transfers = useTransfers(trip.id);
  const [sheet, setSheet] = useState<PlannedItemSheetTarget | null>(null);

  const days = useMemo(
    () =>
      calendar?.days.filter(
        (day) => day.date >= stop.arrivalDate && day.date <= stop.departureDate,
      ) ?? [],
    [calendar, stop.arrivalDate, stop.departureDate],
  );
  const dates = useMemo(() => days.map((day) => day.date), [days]);
  const columns = useMemo(() => buildColumns(items ?? [], dates), [items, dates]);
  const itemsById = useMemo(
    () => new Map((items ?? []).map((item) => [item.id, item] as const)),
    [items],
  );

  if (!calendar || !items || !transfers) return null;

  // Au village, on vient d'abord voir la famille : c'est ce qu'« Ajouter » propose.
  const defaultKind = stop.kind === 'village' ? 'family' : 'activity';

  return (
    <section aria-labelledby="stop-program" className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-0.5 px-1">
        <h2 id="stop-program" className="m-0 text-lg font-semibold tracking-[-0.01em]">
          {t.plan.programTitle}
        </h2>
        <p className="text-muted m-0 text-[13px]">{t.plan.programHint}</p>
      </div>
      <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
        {days.map((day) => (
          <li key={day.date}>
            <ProgramDay
              day={day}
              total={calendar.days.length}
              tag={dayTag(day, stop)}
              onAdd={() =>
                setSheet({
                  mode: 'create',
                  date: day.date,
                  slot: firstFreeSlot(columns, day),
                  kind: defaultKind,
                })
              }
            >
              <DayContent
                day={day}
                calendar={calendar}
                columns={columns}
                itemsById={itemsById}
                transfers={transfers}
                onOpenSheet={setSheet}
              />
            </ProgramDay>
          </li>
        ))}
      </ol>
      <PlannedItemSheet
        trip={trip}
        calendar={calendar}
        target={sheet}
        onClose={() => setSheet(null)}
      />
    </section>
  );
}

function ProgramDay({
  day,
  total,
  tag,
  onAdd,
  children,
}: {
  day: TripDay;
  total: number;
  tag: string | undefined;
  onAdd: () => void;
  children: ReactNode;
}) {
  const label = formatLongDate(day.date);
  return (
    <article
      aria-label={label}
      className="border-line bg-surface flex flex-col gap-3 rounded-[var(--radius-card)] border px-4 pt-3 pb-1.5"
    >
      <header className="flex items-center justify-between gap-3">
        <Link
          to={`/planning/jours/${day.date}`}
          className="group text-ink flex min-h-11 min-w-0 items-center gap-1 no-underline"
        >
          <span className="flex flex-col">
            <span className="text-[15px] font-semibold">{label}</span>
            <span className="text-muted tabular text-xs">{t.plan.dayOf(day.dayNumber, total)}</span>
          </span>
          <ChevronRight
            className="text-muted group-hover:text-ink size-4 shrink-0"
            strokeWidth={2}
            aria-hidden="true"
          />
        </Link>
        {tag && (
          <span className="bg-ground text-ink-soft shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium">
            {tag}
          </span>
        )}
      </header>
      {children}
      <button
        type="button"
        onClick={onAdd}
        aria-label={t.plan.addOn(label.toLowerCase())}
        className="text-muted hover:text-laque -mx-1 flex min-h-11 items-center gap-1.5 self-start px-1 text-[13px] font-medium transition-colors"
      >
        <Plus className="size-4" strokeWidth={2.2} aria-hidden="true" />
        {t.plan.add}
      </button>
    </article>
  );
}

/** « Arrivée » le premier jour, « Départ » le dernier. */
function dayTag(day: TripDay, stop: Stop): string | undefined {
  if (day.date === stop.arrivalDate) return t.plan.arrivalDay;
  if (day.date === stop.departureDate) return t.plan.departureDay;
  return undefined;
}

/** Premier créneau sans élément ce jour-là (le soir si tout est pris). */
function firstFreeSlot(columns: Columns, day: TripDay): TimeSlot {
  return (
    TIME_SLOTS.find((slot) => idsIn(columns, containerId(day.date, slot)).length === 0) ?? 'evening'
  );
}
