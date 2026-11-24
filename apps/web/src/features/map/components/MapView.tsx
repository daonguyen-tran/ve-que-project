import { CloudOff, LocateOff, Maximize2, Minimize2 } from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { cityGroups, type Trip } from '@ve-que/domain';
import { useIdeas } from '@/features/ideas/hooks/use-ideas';
import { useAccommodations, useTransfers } from '@/features/itinerary/hooks/use-itinerary';
import { usePlannedItems, useTripCalendar } from '@/features/planning/hooks/use-day-plan';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { useOnlineStatus } from '@/shared/lib/use-online-status';
import { ChoiceChips } from '@/shared/ui/ChoiceChips';
import { nominatimGeocoder, type GeocodingResult } from '@/infrastructure/geocoding/geocoder';
import { cityMapModel, tripMapModel, type MapModel, type PlaceTone } from '../map-model';
import type { SearchEntry } from '../map-search';
import { useMapFullscreen } from '../use-map-fullscreen';
import { MapSearch } from './MapSearch';
import { PlaceList } from './PlaceList';

/** Leaflet n'est chargé qu'à l'ouverture de la carte. */
const PlacesMap = lazy(() => import('./PlacesMap'));

const WHOLE_TRIP = 'voyage';

/**
 * Carte du voyage (M4), dans le planning. Une zone à la fois : tout le voyage (étapes et
 * trajets) ou une ville (idées, programme, hébergements). La zone est dans l'URL (`&ville=`).
 * Sous la carte, la liste des mêmes lieux : elle sert à choisir un lieu, d'équivalent
 * accessible, et de remplaçant quand on est hors ligne (F-4.5).
 */
export function MapView({ trip }: { trip: Trip }) {
  const calendar = useTripCalendar(trip);
  const transfers = useTransfers(trip.id);
  const accommodations = useAccommodations(trip.id);
  const ideas = useIdeas(trip.id);
  const items = usePlannedItems(trip.id);
  const online = useOnlineStatus();
  const [params, setParams] = useSearchParams();
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [searchPin, setSearchPin] = useState<GeocodingResult | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const enterButton = useRef<HTMLButtonElement>(null);
  const exitButton = useRef<HTMLButtonElement>(null);
  const fullscreen = useMapFullscreen(frameRef);

  // Le focus suit le mode : sur « Quitter » en entrant, sur « Plein écran » en sortant.
  const wasExpanded = useRef(fullscreen.expanded);
  useEffect(() => {
    if (fullscreen.expanded) exitButton.current?.focus();
    else if (wasExpanded.current) enterButton.current?.focus();
    wasExpanded.current = fullscreen.expanded;
  }, [fullscreen.expanded]);

  const stops = useMemo(() => [...(calendar?.stopsById.values() ?? [])], [calendar]);
  const groups = useMemo(() => cityGroups(ideas ?? [], stops), [ideas, stops]);
  const zoneParam = params.get('ville');
  const zone = groups.some((group) => group.key === zoneParam) ? zoneParam! : WHOLE_TRIP;

  const model: MapModel | undefined = useMemo(() => {
    if (!calendar || !transfers || !accommodations || !ideas || !items) return undefined;
    return zone === WHOLE_TRIP
      ? tripMapModel(stops, transfers)
      : cityMapModel(zone, { stops, accommodations, ideas, items, days: calendar.days });
  }, [zone, calendar, stops, transfers, accommodations, ideas, items]);

  /*
   * Index de recherche : tous les lieux du voyage, avec la zone où les montrer. Les étapes
   * sont rattachées à « tout le voyage » ; le reste, à sa ville.
   */
  const searchEntries: SearchEntry[] = useMemo(() => {
    if (!calendar || !transfers || !accommodations || !ideas || !items) return [];
    const entries: SearchEntry[] = tripMapModel(stops, transfers).places.map((place) => ({
      zone: WHOLE_TRIP,
      zoneName: t.map.wholeTrip,
      place,
    }));
    for (const group of groups) {
      const city = cityMapModel(group.key, {
        stops,
        accommodations,
        ideas,
        items,
        days: calendar.days,
      });
      for (const place of city.places) {
        if (place.tone !== 'stop') entries.push({ zone: group.key, zoneName: group.name, place });
      }
    }
    return entries;
  }, [calendar, stops, transfers, accommodations, ideas, items, groups]);

  if (!model) return null;

  function changeZone(value: string) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value === WHOLE_TRIP) next.delete('ville');
        else next.set('ville', value);
        return next;
      },
      { replace: true },
    );
  }

  /** Un lieu choisi dans la recherche : sa zone s'affiche, la carte se centre dessus. */
  function showSearchedPlace(entry: SearchEntry) {
    setSearchPin(null);
    if (entry.zone !== zone) changeZone(entry.zone);
    setFocusedId(entry.place.id);
    // Sans position (ou hors ligne), on montre le lieu dans la liste sous la carte.
    if (!entry.place.point || !online) {
      requestAnimationFrame(() =>
        document
          .getElementById(`place-${entry.place.id}`)
          ?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
      );
    }
  }

  const search = (
    <MapSearch
      entries={searchEntries}
      online={online}
      geocoder={nominatimGeocoder}
      onSelectPlace={showSearchedPlace}
      onSelectAddress={(result) => {
        setFocusedId(null);
        setSearchPin(result);
      }}
    />
  );

  const tones = [...new Set(model.places.filter((p) => p.point).map((p) => p.tone))];
  const expanded = online && fullscreen.expanded;
  const zoneChips = (
    <ChoiceChips
      label={t.map.zone}
      value={zone}
      onChange={(value) => {
        setFocusedId(null);
        setSearchPin(null);
        changeZone(value);
      }}
      options={[
        { value: WHOLE_TRIP, label: t.map.wholeTrip },
        ...groups.map((group) => ({ value: group.key, label: group.name })),
      ]}
    />
  );
  const legend = (tones.length > 0 || model.routes.length > 0) && (
    <MapLegend tones={tones} routes={[...new Set(model.routes.map((route) => route.style))]} />
  );

  const missing = model.places.filter((place) => place.point === null).length;

  return (
    <section aria-label={t.plan.views.map} className="flex flex-col gap-3">
      {!expanded && search}
      {!expanded && zoneChips}

      {online ? (
        /*
         * Le même cadre sert aux deux modes : seules ses classes changent, la carte n'est pas
         * recréée et garde son cadrage. En plein écran, il porte aussi la zone et la légende.
         */
        <div
          ref={frameRef}
          role={expanded ? 'dialog' : undefined}
          aria-modal={expanded ? true : undefined}
          aria-label={expanded ? t.map.fullscreenLabel : undefined}
          className={
            expanded
              ? 'bg-ground pt-safe pb-safe fixed inset-0 z-40 flex flex-col overflow-hidden'
              : 'border-line relative -mx-4 h-[58dvh] min-h-80 overflow-hidden border-y sm:mx-0 sm:rounded-[var(--radius-card)] sm:border'
          }
        >
          {expanded && (
            <div className="flex flex-col gap-2 px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1 sm:max-w-md">{search}</div>
                <button
                  ref={exitButton}
                  type="button"
                  onClick={fullscreen.exit}
                  aria-label={t.map.exitFullscreen}
                  title={t.map.exitFullscreen}
                  className={`${MAP_BUTTON} ml-auto`}
                >
                  <Minimize2 className="size-5" strokeWidth={1.9} aria-hidden="true" />
                </button>
              </div>
              {zoneChips}
            </div>
          )}
          <div className={expanded ? 'border-line relative min-h-0 flex-1 border-y' : 'h-full'}>
            <Suspense fallback={<div className="bg-line-soft h-full w-full" />}>
              <PlacesMap
                model={model}
                focusedId={focusedId}
                onFocus={setFocusedId}
                searchPin={searchPin}
              />
            </Suspense>
            {!expanded && (
              <button
                ref={enterButton}
                type="button"
                onClick={fullscreen.enter}
                aria-label={t.map.fullscreen}
                title={t.map.fullscreen}
                className={`${MAP_BUTTON} absolute top-2.5 right-2.5 z-[1000]`}
              >
                <Maximize2 className="size-5" strokeWidth={1.9} aria-hidden="true" />
              </button>
            )}
          </div>
          {expanded && legend && <div className="px-4 py-2.5">{legend}</div>}
        </div>
      ) : (
        <div
          role="status"
          className="bg-surface border-line flex gap-3 rounded-[var(--radius-card)] border px-4 py-3.5"
        >
          <CloudOff
            className="text-muted mt-0.5 size-5 shrink-0"
            strokeWidth={1.9}
            aria-hidden="true"
          />
          <p className="m-0 flex flex-col gap-0.5 text-[15px] leading-relaxed">
            <strong className="font-semibold">{t.map.offlineTitle}</strong>
            <span className="text-ink-soft">{t.map.offlineBody}</span>
          </p>
        </div>
      )}

      {online && !expanded && legend}

      {missing > 0 && (
        <p className="text-muted m-0 flex items-start gap-2 px-1 text-[13px]">
          <LocateOff className="mt-px size-4 shrink-0" strokeWidth={1.9} aria-hidden="true" />
          {t.map.missing(missing)}
        </p>
      )}

      <PlaceList
        places={model.places}
        focusedId={focusedId}
        onShow={online ? setFocusedId : undefined}
      />
    </section>
  );
}

/** Bouton posé sur la carte, assorti aux boutons de zoom de Leaflet. */
const MAP_BUTTON =
  'border-line bg-surface text-ink hover:bg-ground focus-visible:outline-laque flex size-11 shrink-0 items-center justify-center rounded-xl border shadow-[0_1px_4px_rgb(28_25_23/0.2)] focus-visible:outline-2 focus-visible:outline-offset-2';

const LEGEND_SWATCH: Record<PlaceTone, string> = {
  stop: 'bg-stop-indigo',
  must: 'bg-laque',
  idea: 'bg-surface border-2 border-laque',
  planned: 'bg-success',
  lodging: 'bg-ink rounded-[4px]',
};

/** Légende : seulement les types de repères et de tracés présents sur la carte. */
function MapLegend({
  tones,
  routes,
}: {
  tones: PlaceTone[];
  routes: Array<'flight' | 'ground' | 'missing'>;
}) {
  return (
    <ul className="text-muted m-0 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0 px-1 text-[13px]">
      {tones.map((tone) => (
        <li key={tone} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={cn('size-3 shrink-0 rounded-full', LEGEND_SWATCH[tone])}
          />
          {t.map.legend[tone]}
        </li>
      ))}
      {routes.map((style) => (
        <li key={style} className="flex items-center gap-1.5">
          <svg aria-hidden="true" width="22" height="6" className="shrink-0">
            <line
              x1="2"
              y1="3"
              x2="20"
              y2="3"
              style={{ stroke: 'var(--color-ink-soft)', strokeWidth: 3, strokeLinecap: 'round' }}
              strokeDasharray={style === 'flight' ? '2 6' : style === 'missing' ? '4 4' : undefined}
              strokeOpacity={style === 'missing' ? 0.45 : 1}
            />
          </svg>
          {t.map.routeLegend[style]}
        </li>
      ))}
    </ul>
  );
}
