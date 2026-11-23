import { BedDouble, ChevronRight, CircleAlert } from 'lucide-react';
import { Link } from 'react-router';
import {
  findStopOverlaps,
  primaryAccommodation,
  sortStops,
  stopNights,
  stopTransitions,
  type Accommodation,
  type Stop,
  type Transfer,
} from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { dateParts, formatShortDate } from '@/shared/lib/format-date';
import { STOP_KIND_STYLE } from '../stop-style';
import { BookingBadge } from './BookingBadge';
import type { TransferSheetTarget } from './TransferSheet';
import { RouteLeg } from './RouteLeg';

/**
 * Les étapes du voyage, reliées comme sur une feuille de route : une ligne pointillée descend
 * d'une étape à la suivante, et le trajet est posé dessus (`RouteLeg`). Un trajet manquant
 * reste proposé, mais discrètement, sur la ligne elle-même.
 *
 * Les nuits sans étape ne sont pas répétées ici : la frise au-dessus les montre déjà. Seul un
 * chevauchement (possible avec des données importées) est signalé, car c'est une erreur.
 */
export function StopsTimeline({
  stops,
  accommodations,
  transfers,
  onOpenTransfer,
}: {
  stops: Stop[];
  accommodations: Accommodation[];
  transfers: Transfer[];
  onOpenTransfer: (target: TransferSheetTarget) => void;
}) {
  const overlaps = findStopOverlaps(stops);
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
        {sortStops(stops).map((stop) => {
          const transition = incoming.get(stop.id);
          const stopAccommodations = accommodations.filter((a) => a.stopId === stop.id);
          return (
            <li key={stop.id} className="flex flex-col">
              {transition && (
                <RouteLeg
                  to={transition.to}
                  transfer={transition.transfer}
                  editLabel={t.transfers.edit(transition.from.name, transition.to.name)}
                  onOpen={() =>
                    onOpenTransfer({
                      from: transition.from,
                      to: transition.to,
                      transfer: transition.transfer,
                    })
                  }
                />
              )}
              <StopRow stop={stop} accommodation={primaryAccommodation(stopAccommodations)} />
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/**
 * Carte d'une étape. L'absence d'hébergement est rappelée en gris clair, sans insister : le
 * détail se règle sur la fiche de l'étape.
 */
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
      className="border-line bg-surface hover:border-muted flex min-h-[76px] w-full items-center gap-3.5 rounded-[var(--radius-card)] border px-3.5 py-3 text-inherit no-underline transition-colors"
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
        {accommodation ? (
          <span className="text-ink-soft flex min-w-0 items-center gap-1.5 text-[13px]">
            <BedDouble
              className="text-muted size-4 shrink-0"
              strokeWidth={1.9}
              aria-hidden="true"
            />
            <span className="truncate">{accommodation.name}</span>
            <BookingBadge status={accommodation.status} />
          </span>
        ) : (
          <span className="text-muted/80 flex items-center gap-1.5 text-[13px]">
            <BedDouble className="size-4 shrink-0" strokeWidth={1.7} aria-hidden="true" />
            {t.accommodations.none}
          </span>
        )}
      </span>
      <ChevronRight className="text-muted size-5 shrink-0" aria-hidden="true" />
    </Link>
  );
}
