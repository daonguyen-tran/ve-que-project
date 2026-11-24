import 'leaflet/dist/leaflet.css';
import '../map.css';
import type L from 'leaflet';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { googleMapsUrl, type GeoPoint } from '@ve-que/domain';
import type { GeocodingResult } from '@/infrastructure/geocoding/geocoder';
import { t } from '@/shared/i18n';
import { boundsOf, locatedPlaces, VIETNAM_BOUNDS, type MapModel } from '../map-model';
import { markerIcon, pickIcon } from './markers';
import { PlaceLinks } from './PlaceLinks';

/*
 * Carte Leaflet + OpenStreetMap (F-4.1, F-4.2). Ce module est chargé à la demande (import
 * différé) : Leaflet et ses styles ne pèsent rien tant qu'on n'ouvre pas la carte.
 */

export const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION =
  '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>';

const toLatLng = (point: GeoPoint): L.LatLngExpression => [point.lat, point.lng];

export default function PlacesMap({
  model,
  focusedId,
  onFocus,
  searchPin,
}: {
  model: MapModel;
  focusedId: string | null;
  onFocus: (id: string | null) => void;
  /** Adresse trouvée par la recherche : repère provisoire, qui n'est pas un lieu du voyage. */
  searchPin: GeocodingResult | null;
}) {
  const located = useMemo(() => locatedPlaces(model), [model]);
  const markers = useRef(new Map<string, L.Marker>());

  return (
    <MapContainer
      className="vq-map h-full w-full"
      bounds={toBounds(boundsOf(located.map((place) => place.point)) ?? VIETNAM_BOUNDS)}
      boundsOptions={{ padding: [40, 40], maxZoom: 15 }}
      zoomSnap={0.5}
    >
      <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} maxZoom={19} />
      <FitToPlaces points={located.map((place) => place.point)} />
      <FollowContainerSize />
      {searchPin && <SearchPinMarker key={searchPin.label} result={searchPin} />}
      {model.routes.map((route) => (
        <Polyline
          key={route.id}
          positions={[toLatLng(route.from), toLatLng(route.to)]}
          // `className` doit être passé à la création : `pathOptions` passe par setStyle(),
          // qui ignore les classes.
          className={`vq-route vq-route--${route.style}`}
          interactive={false}
        />
      ))}
      {located.map((place) => (
        <Marker
          key={place.id}
          position={toLatLng(place.point)}
          icon={markerIcon(place, place.id === focusedId)}
          title={place.title}
          ref={(marker) => {
            if (marker) markers.current.set(place.id, marker);
            else markers.current.delete(place.id);
          }}
          eventHandlers={{
            popupopen: () => onFocus(place.id),
            popupclose: () => onFocus(null),
          }}
        >
          <Popup>
            <div className="flex min-w-44 flex-col gap-1">
              <strong className="text-ink text-[15px] leading-snug">{place.title}</strong>
              <span className="text-muted text-[13px]">{place.subtitle}</span>
              <PlaceLinks place={place} className="mt-1.5" />
            </div>
          </Popup>
        </Marker>
      ))}
      {/*
       * Après les repères : leurs effets (ajout à la carte) passent avant celui-ci, sinon un
       * repère qui vient d'apparaître ne pourrait pas encore ouvrir sa bulle.
       */}
      <FlyToFocused
        focusedId={focusedId}
        markers={markers}
        placesKey={located.map((place) => place.id).join(',')}
      />
    </MapContainer>
  );
}

function toBounds([southWest, northEast]: [GeoPoint, GeoPoint]): L.LatLngBoundsExpression {
  return [toLatLng(southWest), toLatLng(northEast)] as L.LatLngBoundsExpression;
}

/**
 * Recadre quand la zone change (tout le voyage ↔ une ville). La clé ne dépend que des
 * positions : ouvrir une bulle ou rafraîchir les données ne fait pas sauter la vue.
 */
function FitToPlaces({ points }: { points: GeoPoint[] }) {
  const map = useMap();
  const key = points.map((point) => `${point.lat},${point.lng}`).join(';');
  useEffect(() => {
    const bounds = boundsOf(points) ?? VIETNAM_BOUNDS;
    map.fitBounds(toBounds(bounds), { padding: [40, 40], maxZoom: 15 });
    // La carte a pu être créée dans un conteneur qui n'avait pas encore sa taille finale.
    const timer = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` résume `points`.
  }, [map, key]);
  return null;
}

/** Repère de l'adresse cherchée : la carte s'y rend et ouvre sa bulle. */
function SearchPinMarker({ result }: { result: GeocodingResult }) {
  const map = useMap();
  const marker = useRef<L.Marker>(null);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    map.flyTo([result.point.lat, result.point.lng], 17, { animate: !reduced, duration: 0.6 });
    const timer = setTimeout(() => marker.current?.openPopup(), reduced ? 0 : 650);
    return () => clearTimeout(timer);
  }, [map, result]);
  const mapsUrl = googleMapsUrl({ address: '', vietnamese: '', location: result.point });
  return (
    <Marker ref={marker} position={toLatLng(result.point)} icon={pickIcon} title={result.label}>
      <Popup>
        <div className="flex min-w-44 flex-col gap-1.5">
          <span className="text-ink text-sm leading-snug">{result.label}</span>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-laque text-sm font-medium no-underline"
            >
              {t.map.openInGoogleMaps}
            </a>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

/**
 * Leaflet calcule sa taille une fois : quand le cadre change (plein écran, rotation de
 * l'écran), il faut la lui faire remesurer, sinon des tuiles manquent sur les bords.
 */
function FollowContainerSize() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

/** Choisir un lieu dans la liste centre la carte dessus et ouvre sa bulle. */
function FlyToFocused({
  focusedId,
  markers,
  placesKey,
}: {
  focusedId: string | null;
  markers: RefObject<Map<string, L.Marker>>;
  /**
   * Lieux affichés. Un lieu choisi dans la recherche peut être dans une autre zone : son
   * repère n'existe qu'après le changement de zone, d'où ce second déclencheur.
   */
  placesKey: string;
}) {
  const map = useMap();
  useEffect(() => {
    const marker = focusedId ? markers.current.get(focusedId) : undefined;
    if (!marker || marker.isPopupOpen()) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 15), {
      animate: !reduced,
      duration: 0.6,
    });
    marker.openPopup();
  }, [map, markers, focusedId, placesKey]);
  return null;
}
