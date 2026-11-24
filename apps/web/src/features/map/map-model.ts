import {
  cityKey,
  googleMapsUrl,
  isActiveItem,
  plannedByIdea,
  sortStops,
  stopColorOf,
  type Accommodation,
  type GeoPoint,
  type Idea,
  type IdeaCategory,
  type PlannedItem,
  type Stop,
  type StopColor,
  type Transfer,
  type TripDay,
} from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { formatDateRange, formatDuration } from '@/shared/lib/format-date';

/*
 * Modèle de la carte : ce qu'il faut dessiner, calculé à partir des données du voyage, sans
 * rien savoir de Leaflet. Les composants de carte ne font que l'afficher ; la liste des lieux
 * (et son remplaçant hors ligne) utilise exactement le même modèle.
 */

/**
 * Code couleur des repères (F-4.2) :
 * - `stop` : étape, dans sa couleur, numérotée dans l'ordre du voyage ;
 * - `must` / `idea` : idée à planifier (incontournable pleine, « si le temps » en creux) ;
 * - `planned` : déjà au programme ;
 * - `lodging` : hébergement.
 */
export type PlaceTone = 'stop' | 'must' | 'idea' | 'planned' | 'lodging';

export interface MapPlace {
  id: string;
  tone: PlaceTone;
  point: GeoPoint | null;
  title: string;
  subtitle: string;
  /** Numéro d'ordre (étapes). */
  number?: number;
  stopColor?: StopColor;
  category?: IdeaCategory;
  /** Écran de l'appli où l'on modifie ce lieu. */
  detailTo?: string;
  mapsUrl: string | null;
  /** Texte supplémentaire pour la recherche : adresses, ville, catégorie. */
  keywords: string;
}

/** Trajet tracé entre deux étapes : vol en pointillés, trajet terrestre plein, absent en gris. */
export interface MapRoute {
  id: string;
  from: GeoPoint;
  to: GeoPoint;
  style: 'flight' | 'ground' | 'missing';
}

export interface MapModel {
  places: MapPlace[];
  routes: MapRoute[];
}

/** Vue « tout le voyage » (F-4.1) : les étapes dans l'ordre et les trajets qui les relient. */
export function tripMapModel(stops: readonly Stop[], transfers: readonly Transfer[]): MapModel {
  const ordered = sortStops(stops);
  const places = ordered.map((stop, index) => stopPlace(stop, index + 1));

  const routes: MapRoute[] = [];
  for (let index = 1; index < ordered.length; index += 1) {
    const from = ordered[index - 1]!;
    const to = ordered[index]!;
    if (!from.place.location || !to.place.location) continue;
    const transfer = transfers.find(
      (candidate) => candidate.fromStopId === from.id && candidate.toStopId === to.id,
    );
    routes.push({
      id: `${from.id}-${to.id}`,
      from: from.place.location,
      to: to.place.location,
      style: !transfer ? 'missing' : transfer.mode === 'flight' ? 'flight' : 'ground',
    });
  }
  return { places, routes };
}

/**
 * Vue d'une ville (F-4.2) : l'étape, ses hébergements, les idées de la ville et ce qui est
 * planifié ces jours-là. Un élément planifié issu d'une idée n'est pas dessiné deux fois :
 * c'est le repère de l'idée qui passe en « planifié ».
 */
export function cityMapModel(
  key: string,
  data: {
    stops: readonly Stop[];
    accommodations: readonly Accommodation[];
    ideas: readonly Idea[];
    items: readonly PlannedItem[];
    days: readonly TripDay[];
  },
): MapModel {
  const ordered = sortStops(data.stops);
  const cityStops = ordered.filter((stop) => cityKey(stop.name) === key);
  const stopIds = new Set(cityStops.map((stop) => stop.id));
  const dayNumber = new Map(data.days.map((day) => [day.date as string, day]));
  const planned = plannedByIdea(data.items);

  const places: MapPlace[] = cityStops.map((stop) => stopPlace(stop, ordered.indexOf(stop) + 1));

  for (const accommodation of data.accommodations) {
    if (!stopIds.has(accommodation.stopId)) continue;
    places.push({
      id: accommodation.id,
      tone: 'lodging',
      point: accommodation.place.location,
      title: accommodation.name,
      subtitle: t.booking[accommodation.status],
      keywords: keywordsOf(accommodation.place),
      detailTo: `/planning/etapes/${accommodation.stopId}`,
      mapsUrl: googleMapsUrl(accommodation.place, accommodation.name),
    });
  }

  for (const idea of data.ideas) {
    if (cityKey(idea.city) !== key) continue;
    const first = planned.get(idea.id)?.[0];
    const day = first ? dayNumber.get(first.date) : undefined;
    places.push({
      id: idea.id,
      tone: first ? 'planned' : idea.priority === 'must' ? 'must' : 'idea',
      point: idea.place.location,
      title: idea.title,
      subtitle:
        first && day
          ? t.map.plannedOn(day.dayNumber, t.slots[first.slot])
          : `${t.ideas.categories[idea.category]} · ${formatDuration(idea.durationMinutes)}`,
      category: idea.category,
      keywords: `${idea.city} ${t.ideas.categories[idea.category]} ${keywordsOf(idea.place)}`,
      detailTo: first ? `/planning/jours/${first.date}` : `/idees?ville=${encodeURIComponent(key)}`,
      mapsUrl: googleMapsUrl(idea.place, idea.title),
    });
  }

  for (const item of data.items) {
    const day = dayNumber.get(item.date);
    if (item.ideaId || !isActiveItem(item) || item.kind === 'free_time') continue;
    if (!day?.stopId || !stopIds.has(day.stopId)) continue;
    places.push({
      id: item.id,
      tone: 'planned',
      point: item.place?.location ?? null,
      title: item.title,
      subtitle: t.map.dayAndSlot(day.dayNumber, t.slots[item.slot]),
      keywords: keywordsOf(item.place),
      detailTo: `/planning/jours/${item.date}`,
      mapsUrl: googleMapsUrl(item.place, item.title),
    });
  }

  return { places, routes: [] };
}

function stopPlace(stop: Stop, number: number): MapPlace {
  return {
    id: stop.id,
    tone: 'stop',
    point: stop.place.location,
    title: stop.name,
    subtitle: formatDateRange(stop.arrivalDate, stop.departureDate),
    number,
    stopColor: stopColorOf(stop),
    keywords: stop.place.vietnamese,
    detailTo: `/planning/etapes/${stop.id}`,
    mapsUrl: googleMapsUrl(stop.place, stop.place.vietnamese || stop.name),
  };
}

function keywordsOf(place: { address: string; vietnamese: string } | null): string {
  return place ? `${place.address} ${place.vietnamese}` : '';
}

/** Lieux qui ont une position, donc un repère sur la carte. */
export function locatedPlaces(model: MapModel): Array<MapPlace & { point: GeoPoint }> {
  return model.places.filter(
    (place): place is MapPlace & { point: GeoPoint } => place.point !== null,
  );
}

/** Cadre du Vietnam, quand aucun lieu n'a encore de position. */
export const VIETNAM_BOUNDS: [GeoPoint, GeoPoint] = [
  { lat: 8.4, lng: 102.1 },
  { lat: 23.4, lng: 109.5 },
];

/** Rectangle qui englobe des points (sud-ouest, nord-est) ; `null` s'il n'y en a aucun. */
export function boundsOf(points: readonly GeoPoint[]): [GeoPoint, GeoPoint] | null {
  if (points.length === 0) return null;
  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  return [
    { lat: Math.min(...lats), lng: Math.min(...lngs) },
    { lat: Math.max(...lats), lng: Math.max(...lngs) },
  ];
}
