import { BedDouble, ChevronRight, CircleAlert, Plus } from 'lucide-react';
import { Link } from 'react-router';
import {
  findStopOverlaps,
  findUncoveredNights,
  primaryAccommodation,
  stopNights,
  stopTransitions,
  type Accommodation,
  type Stop,
  type Transfer,
  type Trip,
  type UncoveredNights,
} from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { dateParts, formatDateRange, formatShortDate } from '@/shared/lib/format-date';
import { Button } from '@/shared/ui/Button';
import { STOP_KIND_STYLE } from '../stop-style';
import { BookingBadge } from './BookingBadge';
import type { StopSheetTarget } from './StopSheet';
import type { TransferSheetTarget } from './TransferSheet';
import { TransferSlot } from './TransferSlot';

type TimelineEntry = { type: 'stop'; stop: Stop } | { type: 'gap'; gap: UncoveredNights };

/**
 * Fusionne étapes et trous en une seule liste chronologique. Les deux sont déjà triés ; on
 * les entrelace par date de début (comme l'étape de fusion d'un tri fusion).
 */
function buildTimeline(stops: Stop[], gaps: UncoveredNights[]): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  let i = 0;
  let j = 0;
  while (i < stops.length || j < gaps.length) {
    const stop = stops[i];
    const gap = gaps[j];
    if (stop && (!gap || stop.arrivalDate <= gap.from)) {
      entries.push({ type: 'stop', stop });
      i++;
    } else if (gap) {
      entries.push({ type: 'gap', gap });
      j++;
    }
  }
  return entries;
}

/**
 * Liste chronologique des étapes. Entre deux étapes : le trajet (ou un bouton pour l'ajouter) ;
 * là où des nuits n'ont pas d'étape : un cadre pour en ajouter une avec les bonnes dates.
 */
export function StopsTimeline({
  trip,
  stops,
  accommodations,
  transfers,
  onCreateStop,
  onOpenTransfer,
}: {
  trip: Trip;
  stops: Stop[];
  accommodations: Accommodation[];
  transfers: Transfer[];
  onCreateStop: (target: StopSheetTarget) => void;
  onOpenTransfer: (target: TransferSheetTarget) => void;
}) {
  const overlaps = findStopOverlaps(stops);
  const timeline = buildTimeline(stops, findUncoveredNights(trip, stops));
  // Le trajet qui mène à chaque étape, indexé par l'étape d'arrivée.
  const incoming = new Map(
    stopTransitions(stops, transfers).map((transition) => [transition.to.id, transition]),
  );

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
        {timeline.map((entry) => {
          if (entry.type === 'gap') {
            return (
              <li key={`gap-${entry.gap.from}`} className="py-1.5">
                <GapRow
                  gap={entry.gap}
                  onFill={() =>
                    onCreateStop({
                      mode: 'create',
                      arrivalDate: entry.gap.from,
                      departureDate: entry.gap.to,
                    })
                  }
                />
              </li>
            );
          }
          const transition = incoming.get(entry.stop.id);
          const stopAccommodations = accommodations.filter((a) => a.stopId === entry.stop.id);
          return (
            <li key={entry.stop.id} className="flex flex-col">
              {transition && (
                <TransferSlot
                  from={transition.from}
                  to={transition.to}
                  transfer={transition.transfer}
                  onOpen={() =>
                    onOpenTransfer({
                      from: transition.from,
                      to: transition.to,
                      transfer: transition.transfer,
                    })
                  }
                />
              )}
              <StopRow stop={entry.stop} accommodation={primaryAccommodation(stopAccommodations)} />
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function StopRow({
  stop,
  accommodation,
}: {
  stop: Stop;
  accommodation: Accommodation | undefined;
}) {
  const { icon: KindIcon, label: kindLabel, tint, ink } = STOP_KIND_STYLE[stop.kind];
  const arrival = dateParts(stop.arrivalDate);
  return (
    <Link
      to={`/planning/etapes/${stop.id}`}
      className="border-line bg-surface hover:border-muted my-1.5 flex min-h-[76px] w-full items-center gap-3.5 rounded-[var(--radius-card)] border px-3.5 py-3 text-inherit no-underline transition-colors"
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
        <span className="text-ink-soft flex min-w-0 items-center gap-1.5 text-[13px]">
          <BedDouble className="text-muted size-4 shrink-0" strokeWidth={1.9} aria-hidden="true" />
          {accommodation ? (
            <>
              <span className="truncate">{accommodation.name}</span>
              <BookingBadge status={accommodation.status} />
            </>
          ) : (
            <span className="text-muted">{t.accommodations.none}</span>
          )}
        </span>
      </span>
      <ChevronRight className="text-muted size-5 shrink-0" aria-hidden="true" />
    </Link>
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
