import { nightsByStop, type Stop, type StopKind, type Trip } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { formatShortDate } from '@/shared/lib/format-date';
import { STOP_KIND_STYLE } from '../stop-style';

/**
 * Frise des nuits du voyage : une case par nuit, colorée selon le type de l'étape (ville,
 * village, île). Les nuits sans étape restent vides, avec un contour en pointillés. On voit
 * d'un coup d'œil la forme du voyage et ce qu'il reste à organiser.
 *
 * Pour un lecteur d'écran, la frise est une image décrite par une phrase qui résume chaque
 * étape et les nuits sans étape. Les étapes se distinguent aussi par leur ordre, et la
 * légende donne l'icône de chaque type : la couleur n'est jamais le seul repère.
 */
export function NightsStrip({ trip, stops }: { trip: Trip; stops: Stop[] }) {
  const nights = nightsByStop(trip, stops);
  const kindOf = new Map(stops.map((stop) => [stop.id, stop.kind] as const));
  const covered = nights.filter((night) => night.stopId !== null).length;
  const kindsPresent = [...new Set(stops.map((stop) => stop.kind))] as StopKind[];

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
          const kind = night.stopId ? kindOf.get(night.stopId) : undefined;
          // Une marge supplémentaire marque le passage d'une étape à la suivante : deux villes
          // consécutives, de même couleur, restent ainsi distinctes.
          const startsNewStop = index > 0 && night.stopId !== nights[index - 1]?.stopId;
          return (
            <span
              key={night.date}
              className={cn(
                'rounded-[3px]',
                startsNewStop && 'ml-1',
                kind ? STOP_KIND_STYLE[kind].fill : 'border-muted/50 border border-dashed',
              )}
            />
          );
        })}
      </div>

      <div className="text-muted tabular flex justify-between text-[13px]">
        <span>{formatShortDate(trip.startDate)}</span>
        <span>{formatShortDate(trip.endDate)}</span>
      </div>

      {(kindsPresent.length > 0 || covered < nights.length) && (
        <ul className="text-ink-soft m-0 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0 text-[13px]">
          {kindsPresent.map((kind) => {
            const { icon: Icon, label, ink } = STOP_KIND_STYLE[kind];
            return (
              <li key={kind} className="flex items-center gap-1.5">
                <Icon className={cn('size-4', ink)} strokeWidth={2} aria-hidden="true" />
                {label}
              </li>
            );
          })}
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
