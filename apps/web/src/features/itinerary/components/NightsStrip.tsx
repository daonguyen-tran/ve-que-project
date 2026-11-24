import { nightsByStop, sortStops, stopColorOf, type Stop, type Trip } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { formatShortDate } from '@/shared/lib/format-date';
import { STOP_COLOR_STYLE } from '../stop-style';

/**
 * Frise des nuits du voyage : une case par nuit, à la couleur de son étape (choisie par
 * l'utilisateur). Les nuits sans étape restent vides, avec un contour en pointillés. On voit
 * d'un coup d'œil la forme du voyage et ce qu'il reste à organiser.
 *
 * Pour un lecteur d'écran, la frise est une image décrite par une phrase qui résume chaque
 * étape et les nuits sans étape. À l'écran, la légende nomme chaque étape à côté de sa
 * couleur, et les étapes se suivent dans l'ordre : la couleur n'est jamais le seul repère.
 */
export function NightsStrip({ trip, stops }: { trip: Trip; stops: Stop[] }) {
  const nights = nightsByStop(trip, stops);
  const colorOf = new Map(stops.map((stop) => [stop.id, stopColorOf(stop)] as const));
  const covered = nights.filter((night) => night.stopId !== null).length;

  const summary = [
    ...stops.map((stop) => {
      const count = nights.filter((night) => night.stopId === stop.id).length;
      return `${stop.name} ${t.stops.nights(count)}`;
    }),
    ...(covered < nights.length
      ? [`${t.stops.nights(nights.length - covered)} ${t.stops.stripUncovered}`]
      : []),
  ].join(', ');

  return (
    <section
      aria-labelledby="nights-strip-title"
      className="border-line bg-surface flex flex-col gap-3 rounded-[var(--radius-card)] border p-4"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="nights-strip-title" className="m-0 text-[15px] font-semibold">
          {covered === nights.length
            ? t.stops.allCovered
            : t.stops.nightsCovered(covered, nights.length)}
        </h2>
      </div>

      <div
        role="img"
        aria-label={t.stops.stripLabel(summary)}
        className="grid h-7 gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${nights.length}, minmax(0, 1fr))` }}
      >
        {nights.map((night, index) => {
          const color = night.stopId ? colorOf.get(night.stopId) : undefined;
          // Une marge supplémentaire marque le passage d'une étape à la suivante : deux étapes
          // consécutives de même couleur restent ainsi distinctes.
          const startsNewStop = index > 0 && night.stopId !== nights[index - 1]?.stopId;
          return (
            <span
              key={night.date}
              className={cn(
                'rounded-[3px]',
                startsNewStop && 'ml-1',
                color ? STOP_COLOR_STYLE[color].fill : 'border-muted/50 border border-dashed',
              )}
            />
          );
        })}
      </div>

      <div className="text-muted tabular flex justify-between text-[13px]">
        <span>{formatShortDate(trip.startDate)}</span>
        <span>{formatShortDate(trip.endDate)}</span>
      </div>

      {(stops.length > 0 || covered < nights.length) && (
        <ul className="text-ink-soft m-0 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0 text-[13px]">
          {sortStops(stops).map((stop) => (
            <li key={stop.id} className="flex min-w-0 items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn(
                  'size-3 shrink-0 rounded-[3px]',
                  STOP_COLOR_STYLE[stopColorOf(stop)].fill,
                )}
              />
              <span className="truncate">{stop.name}</span>
            </li>
          ))}
          {covered < nights.length && (
            <li className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="border-muted/60 size-3 rounded-[3px] border border-dashed"
              />
              {t.stops.stripUncovered}
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
