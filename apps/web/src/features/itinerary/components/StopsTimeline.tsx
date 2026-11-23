import { ArrowDown, ChevronRight, CircleAlert, Plus } from 'lucide-react';
import {
  findStopOverlaps,
  findUncoveredNights,
  stopNights,
  type Stop,
  type Trip,
  type UncoveredNights,
} from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { dateParts, formatDateRange, formatShortDate } from '@/shared/lib/format-date';
import { Button } from '@/shared/ui/Button';
import { STOP_KIND_STYLE } from '../stop-style';
import type { StopSheetTarget } from './StopSheet';

type TimelineEntry =
  | { type: 'stop'; stop: Stop; transitionFromPrevious: boolean }
  | { type: 'gap'; gap: UncoveredNights };

/**
 * Fusionne étapes et trous en une seule liste chronologique. Les deux sont déjà triés ; on
 * les entrelace par date de début (comme l'étape de fusion d'un tri fusion).
 */
function buildTimeline(stops: Stop[], gaps: UncoveredNights[]): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  let i = 0;
  let j = 0;
  let previous: Stop | undefined;
  while (i < stops.length || j < gaps.length) {
    const stop = stops[i];
    const gap = gaps[j];
    if (stop && (!gap || stop.arrivalDate <= gap.from)) {
      entries.push({
        type: 'stop',
        stop,
        transitionFromPrevious: previous?.departureDate === stop.arrivalDate,
      });
      previous = stop;
      i++;
    } else if (gap) {
      entries.push({ type: 'gap', gap });
      previous = undefined;
      j++;
    }
  }
  return entries;
}

/** Liste chronologique des étapes, avec les nuits sans étape et les changements d'étape. */
export function StopsTimeline({
  trip,
  stops,
  onOpen,
}: {
  trip: Trip;
  stops: Stop[];
  onOpen: (target: StopSheetTarget) => void;
}) {
  const overlaps = findStopOverlaps(stops);
  const timeline = buildTimeline(stops, findUncoveredNights(trip, stops));

  return (
    <section aria-labelledby="stops-title" className="flex flex-col gap-2.5">
      <h2 id="stops-title" className="m-0 px-1 text-lg font-semibold tracking-[-0.01em]">
        {t.stops.title}
      </h2>

      {overlaps.map(([a, b]) => (
        <p
          key={`${a.id}-${b.id}`}
          role="alert"
          className="border-laque-deep/30 bg-laque-tint text-laque-deep m-0 flex items-start gap-2 rounded-xl border p-3 text-sm font-medium"
        >
          <CircleAlert className="mt-px size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          {t.stops.overlapWarning(a.name, b.name)}
        </p>
      ))}

      <ol className="m-0 flex list-none flex-col p-0">
        {timeline.map((entry) =>
          entry.type === 'stop' ? (
            <li key={entry.stop.id} className="flex flex-col">
              {entry.transitionFromPrevious && <Transition date={entry.stop.arrivalDate} />}
              <StopRow
                stop={entry.stop}
                onOpen={() => onOpen({ mode: 'edit', stop: entry.stop })}
              />
            </li>
          ) : (
            <li key={`gap-${entry.gap.from}`} className="py-1.5">
              <GapRow
                gap={entry.gap}
                onFill={() =>
                  onOpen({
                    mode: 'create',
                    arrivalDate: entry.gap.from,
                    departureDate: entry.gap.to,
                  })
                }
              />
            </li>
          ),
        )}
      </ol>
    </section>
  );
}

function StopRow({ stop, onOpen }: { stop: Stop; onOpen: () => void }) {
  const { icon: KindIcon, label: kindLabel, tint, ink } = STOP_KIND_STYLE[stop.kind];
  const arrival = dateParts(stop.arrivalDate);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t.stops.edit(stop.name)}
      className="border-line bg-surface hover:border-muted my-1.5 flex min-h-[76px] w-full items-center gap-3.5 rounded-[var(--radius-card)] border px-3.5 py-3 text-left transition-colors"
    >
      <span
        className="border-line-soft flex w-12 shrink-0 flex-col items-center border-r pr-3.5"
        aria-hidden="true"
      >
        <span className="text-muted text-xs">{arrival.weekday}</span>
        <span className="tabular text-[22px] leading-none font-bold tracking-[-0.02em]">
          {arrival.day}
        </span>
        <span className="text-muted text-xs">{arrival.month}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="line-clamp-2 text-base leading-snug font-semibold">{stop.name}</span>
        {stop.place.vietnamese && (
          <span lang="vi" className="text-muted truncate text-sm">
            {stop.place.vietnamese}
          </span>
        )}
        <span className="text-muted tabular flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
          <span
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              tint,
              ink,
            )}
          >
            <KindIcon className="size-3.5" strokeWidth={2} aria-hidden="true" />
            {kindLabel}
          </span>
          {t.stops.nights(stopNights(stop))} · {t.stops.until(formatShortDate(stop.departureDate))}
        </span>
      </span>
      <ChevronRight className="text-muted size-5 shrink-0" aria-hidden="true" />
    </button>
  );
}

/** Repère entre deux étapes qui se suivent ; les trajets (lot 4) viendront s'y placer. */
function Transition({ date }: { date: Stop['arrivalDate'] }) {
  return (
    <span className="text-muted flex items-center gap-2 px-4 text-[13px]">
      <ArrowDown className="size-4" strokeWidth={1.9} aria-hidden="true" />
      {t.stops.transition(formatShortDate(date))}
    </span>
  );
}

function GapRow({ gap, onFill }: { gap: UncoveredNights; onFill: () => void }) {
  return (
    <div className="border-muted/50 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-[var(--radius-card)] border border-dashed px-4 py-2.5">
      <span className="text-ink-soft tabular text-sm">
        {t.stops.gap(t.stops.nights(gap.nights), formatDateRange(gap.from, gap.to))}
      </span>
      <Button variant="quiet" onClick={onFill} className="-mr-2 px-2">
        <Plus className="size-[18px]" strokeWidth={2} aria-hidden="true" />
        {t.stops.fillGap}
      </Button>
    </div>
  );
}
