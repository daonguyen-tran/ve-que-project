import type L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../map.css';
import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { GeoPoint } from '@ve-que/domain';
import { VIETNAM_BOUNDS } from '../map-model';
import { pickIcon } from './markers';
import { OSM_ATTRIBUTION, OSM_TILES } from './PlacesMap';

/**
 * Carte du sélecteur de position (F-4.3), chargée à la demande. Toucher la carte place le
 * repère ; on peut ensuite le faire glisser pour ajuster.
 */
export default function PickerMap({
  value,
  center,
  target,
  onChange,
}: {
  value: GeoPoint | null;
  /** Où ouvrir la carte sans position choisie (l'étape, par exemple). */
  center: GeoPoint | null;
  /** Position vers laquelle se déplacer (résultat de recherche). */
  target: GeoPoint | null;
  onChange: (point: GeoPoint) => void;
}) {
  const start = value ?? center;
  return (
    <MapContainer
      className="vq-map h-full w-full"
      {...(start
        ? { center: [start.lat, start.lng] as [number, number], zoom: value ? 16 : 13 }
        : {
            bounds: [
              [VIETNAM_BOUNDS[0].lat, VIETNAM_BOUNDS[0].lng],
              [VIETNAM_BOUNDS[1].lat, VIETNAM_BOUNDS[1].lng],
            ] as [[number, number], [number, number]],
          })}
    >
      <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} maxZoom={19} />
      <PickOnTap onChange={onChange} />
      <FollowTarget target={target} />
      {value && (
        <Marker
          position={[value.lat, value.lng]}
          icon={pickIcon}
          draggable
          eventHandlers={{
            dragend: (event) => {
              const { lat, lng } = (event.target as L.Marker).getLatLng();
              onChange({ lat, lng });
            },
          }}
        />
      )}
    </MapContainer>
  );
}

function PickOnTap({ onChange }: { onChange: (point: GeoPoint) => void }) {
  const map = useMapEvents({
    click: (event) => onChange({ lat: event.latlng.lat, lng: event.latlng.lng }),
  });
  // La feuille s'ouvre avec une animation : Leaflet doit remesurer son conteneur ensuite.
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function FollowTarget({ target }: { target: GeoPoint | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.setView([target.lat, target.lng], 17);
  }, [map, target]);
  return null;
}
