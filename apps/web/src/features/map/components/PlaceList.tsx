import { MapPinOff } from 'lucide-react';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import type { MapPlace, PlaceTone } from '../map-model';
import { PlaceLinks } from './PlaceLinks';

const DOT: Record<PlaceTone, string> = {
  stop: '',
  must: 'bg-laque',
  idea: 'border-2 border-laque bg-surface',
  planned: 'bg-success',
  lodging: 'bg-ink rounded-[4px]',
};

/**
 * Lieux de la zone, en liste. Toucher un nom centre la carte sur son repère (s'il en a un) ;
 * hors ligne, la liste remplace la carte et garde les liens Google Maps.
 */
export function PlaceList({
  places,
  focusedId,
  onShow,
}: {
  places: MapPlace[];
  focusedId: string | null;
  /** Absent hors ligne : il n'y a pas de carte où montrer le lieu. */
  onShow?: (id: string) => void;
}) {
  if (places.length === 0) {
    return <p className="text-muted m-0 px-1 text-[15px]">{t.map.noPlaces}</p>;
  }
  return (
    <section aria-labelledby="map-places" className="flex flex-col gap-2">
      <h3 id="map-places" className="text-ink-soft m-0 px-1 text-[15px] font-semibold">
        {t.map.placesCount(places.length)}
      </h3>
      <ul className="border-line bg-surface m-0 list-none overflow-hidden rounded-[var(--radius-card)] border p-0">
        {places.map((place) => {
          const canShow = onShow && place.point;
          return (
            <li
              key={place.id}
              id={`place-${place.id}`}
              className={cn(
                'border-line-soft flex items-start gap-3 border-b px-4 py-3 last:border-b-0',
                place.id === focusedId && 'bg-laque-tint/50',
              )}
            >
              <Swatch place={place} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                {canShow ? (
                  <button
                    type="button"
                    onClick={() => onShow(place.id)}
                    aria-label={t.map.showOnMap(place.title)}
                    className="text-ink self-start text-left text-[15px] font-medium hover:underline"
                  >
                    {place.title}
                  </button>
                ) : (
                  <span className="text-[15px] font-medium">{place.title}</span>
                )}
                <span className="text-muted text-[13px]">
                  {place.subtitle}
                  {!place.point && (
                    <span className="ml-2 inline-flex items-center gap-1">
                      <MapPinOff className="size-3.5" strokeWidth={2} aria-hidden="true" />
                      {t.map.noPosition}
                    </span>
                  )}
                </span>
                <PlaceLinks place={place} className="mt-1" />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Swatch({ place }: { place: MapPlace }) {
  if (place.tone === 'stop') {
    return (
      <span
        aria-hidden="true"
        className="tabular mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
        style={{ background: `var(--color-stop-${place.stopColor ?? 'indigo'})` }}
      >
        {place.number}
      </span>
    );
  }
  return (
    <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center">
      <span className={cn('mt-1 size-3 rounded-full', DOT[place.tone])} />
    </span>
  );
}
