import type { LocalitySuggestion, StopKind } from '@ve-que/domain';

/**
 * Source n° 3 : recherche de localités en ligne, au fil de la frappe.
 *
 * Interface (port) + adaptateur, comme `Geocoder` : l'appli ne dépend pas de Photon, qu'on
 * pourra remplacer (ou héberger soi-même) sans toucher aux écrans.
 */
export interface OnlineLocalitySearch {
  search(query: string, signal?: AbortSignal): Promise<LocalitySuggestion[]>;
}

/** Rectangle englobant le Vietnam (ouest, sud, est, nord), îles comprises. */
const VIETNAM_BBOX = '102.1,8.3,109.6,23.4';

/** Réponse de Photon (GeoJSON), limitée aux champs utilisés. */
interface PhotonResponse {
  features: Array<{
    geometry: { coordinates: [number, number] };
    properties: {
      osm_type?: string;
      osm_id?: number;
      osm_value?: string;
      name?: string;
      countrycode?: string;
      state?: string;
      county?: string;
    };
  }>;
}

/** Type d'étape déduit de la valeur OpenStreetMap `place=*`. */
function kindOf(osmValue: string | undefined): StopKind {
  if (osmValue === 'island' || osmValue === 'islet' || osmValue === 'archipelago') return 'island';
  if (osmValue === 'village' || osmValue === 'hamlet' || osmValue === 'isolated_dwelling') {
    return 'village';
  }
  return 'city';
}

/**
 * Adaptateur Photon (komoot) : géocodeur libre fondé sur OpenStreetMap, conçu pour la
 * recherche au fil de la frappe (contrairement à Nominatim, dont la politique l'interdit).
 *
 * Son serveur public est gratuit tant que l'usage reste raisonnable. L'appelant
 * (`useLocalitySuggestions`) s'en charge : 3 lettres minimum, attente de 300 ms après la
 * dernière frappe, requête précédente annulée.
 *
 * Filtres : lieux habités ou îles (`osm_tag=place`), au Vietnam (rectangle + code pays).
 * `lang=fr` donne le nom français quand il existe, sinon le nom local, en vietnamien.
 */
export function createPhotonLocalitySearch(
  baseUrl = 'https://photon.komoot.io/api/',
): OnlineLocalitySearch {
  return {
    async search(query, signal) {
      const params = new URLSearchParams({
        q: query,
        limit: '6',
        lang: 'fr',
        bbox: VIETNAM_BBOX,
        osm_tag: 'place',
      });
      const response = await fetch(`${baseUrl}?${params}`, {
        signal,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`Photon : ${response.status}`);
      const body = (await response.json()) as PhotonResponse;

      return body.features
        .filter((feature) => feature.properties.name && feature.properties.countrycode === 'VN')
        .map((feature) => {
          const { properties } = feature;
          const [lng, lat] = feature.geometry.coordinates;
          const name = properties.name!;
          return {
            key: `online:${properties.osm_type ?? ''}${properties.osm_id ?? name}`,
            source: 'online' as const,
            name,
            // Photon ne renvoie qu'une langue : le nom local fait office de nom vietnamien.
            vietnameseName: name,
            kind: kindOf(properties.osm_value),
            location: { lat, lng },
            detail: properties.state ?? properties.county,
          };
        });
    },
  };
}

export const photonLocalitySearch = createPhotonLocalitySearch();
