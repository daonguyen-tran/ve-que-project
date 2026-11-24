import { CalendarDays, ChevronRight } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { dayItems, stopColorOf, type Stop, type Trip, type TripDay } from '@ve-que/domain';
import { useTransfers } from '@/features/itinerary/hooks/use-itinerary';
import { STOP_COLOR_STYLE } from '@/features/itinerary/stop-style';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { formatLongDate } from '@/shared/lib/format-date';
import { DateBlock } from '@/shared/ui/DateBlock';
import { AddRow, Card, Section } from '@/shared/ui/SectionCard';
import { usePlannedItems, useTripCalendar } from '../hooks/use-day-plan';
import type { PlannedItemSheetTarget } from '../planned-item-form';
import { DayContent } from './DayContent';
import { PlannedItemSheet } from './PlannedItemSheet';

/**
 * Programme d'une étape, dans sa fiche : une carte par jour, du jour d'arrivée au jour de
 * départ inclus. C'est ici qu'on organise ses journées (« qu'est-ce qu'on fait à Hoi An ? »).
 *
 * - Chaque jour montre son trajet éventuel et ses éléments dans l'ordre chronologique
 *   (`DayContent`).
 * - « Ajouter » ouvre la fiche d'activité sur ce jour ; son heure, si on en donne une, la
 *   range dans la journée.
 * - Les jours de transition (départ de l'étape précédente, départ vers la suivante) figurent
 *   dans les deux étapes : une activité est rattachée à une date, pas à une étape, donc rien
 *   n'est dupliqué.
 * - L'en-tête de chaque jour mène au programme du jour dans « Jour par jour ».
 */
export function StopProgram({
  trip,
  stop,
  className,
}: {
  trip: Trip;
  stop: Stop;
  className?: string;
}) {
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
  const byDay = useMemo(
    () => new Map(days.map((day) => [day.date, dayItems(items ?? [], day.date)] as const)),
    [days, items],
  );

  if (!calendar || !items || !transfers) return null;

  // Au village, on vient d'abord voir la famille : c'est ce qu'« Ajouter » propose.
  const defaultKind = stop.kind === 'village' ? 'family' : 'activity';

  const color = STOP_COLOR_STYLE[stopColorOf(stop)];

  return (
    <Section
      id="stop-program"
      icon={CalendarDays}
      title={t.plan.programTitle}
      aside={t.common.days(days.length)}
      className={className}
    >
      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {days.map((day) => (
          <li key={day.date}>
            <ProgramDay
              day={day}
              total={calendar.days.length}
              tag={dayTag(day, stop)}
              dateClassName={cn(color.tint, color.ink)}
              onAdd={() =>
                setSheet({
                  mode: 'create',
                  date: day.date,
                  kind: defaultKind,
                })
              }
            >
              <DayContent
                day={day}
                calendar={calendar}
                items={byDay.get(day.date) ?? []}
                transfers={transfers}
                accent={stopColorOf(stop)}
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
    </Section>
  );
}

/**
 * Un jour du programme, en trois bandes séparées par un filet :
 * - l'en-tête, lien vers « Jour par jour » : pavé de date à la couleur de l'étape (le repère
 *   qu'on retrouve en faisant défiler), date en toutes lettres, « Jour 4 sur 21 » ;
 * - le contenu (trajet, éléments par heure) ;
 * - l'action d'ajout, en laque comme toutes les actions.
 */
function ProgramDay({
  day,
  total,
  tag,
  dateClassName,
  onAdd,
  children,
}: {
  day: TripDay;
  total: number;
  tag: string | undefined;
  dateClassName: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  const label = formatLongDate(day.date);
  return (
    <article aria-label={label}>
      <Card>
        <Link
          to={`/planning/jours/${day.date}`}
          className="group hover:bg-ground flex min-h-[76px] items-center gap-3.5 px-3.5 py-3 text-inherit no-underline transition-colors duration-150"
        >
          <DateBlock date={day.date} className={dateClassName} />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-base leading-snug font-semibold">{label}</span>
            <span className="text-muted tabular text-[13px]">
              {t.plan.dayOf(day.dayNumber, total)}
            </span>
          </span>
          {tag && (
            <span className="border-line text-ink-soft shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium">
              {tag}
            </span>
          )}
          <ChevronRight
            className="text-muted group-hover:text-ink size-5 shrink-0"
            aria-hidden="true"
          />
        </Link>
        <div className="px-4 py-3.5">{children}</div>
        <AddRow label={t.plan.add} ariaLabel={t.plan.addOn(label.toLowerCase())} onClick={onAdd} />
      </Card>
    </article>
  );
}

/** « Arrivée » le premier jour, « Départ » le dernier. */
function dayTag(day: TripDay, stop: Stop): string | undefined {
  if (day.date === stop.arrivalDate) return t.plan.arrivalDay;
  if (day.date === stop.departureDate) return t.plan.departureDay;
  return undefined;
}
