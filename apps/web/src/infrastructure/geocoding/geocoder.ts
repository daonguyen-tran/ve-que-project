import type { GeoPoint } from '@ve-que/domain';

/** Résultat d'une recherche d'adresse. */
export interface GeocodingResult {
  label: string;
  point: GeoPoint;
}

/**
 * Recherche d'adresse (F-4.3). Interface (port) + adaptateur : l'appli ne dépend pas de
 * Nominatim, qu'on pourra remplacer par un autre service sans toucher aux écrans.
 */
export interface Geocoder {
  search(query: string, signal?: AbortSignal): Promise<GeocodingResult[]>;
}

/**
 * Adaptateur Nominatim (le géocodeur d'OpenStreetMap, gratuit et sans clé).
 *
 * Sa politique d'usage interdit l'autocomplétion et limite à une requête par seconde : on ne
 * cherche donc que sur une action explicite (bouton « Chercher »), jamais à la frappe. Les
 * résultats sont limités au Vietnam, ce qui évite les homonymes (Hue, Texas…).
 */
export const nominatimGeocoder: Geocoder = {
  async search(query, signal) {
    const params = new URLSearchParams({
      format: 'jsonv2',
      q: query,
      countrycodes: 'vn',
      limit: '5',
      'accept-language': 'fr,vi',
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Nominatim : ${response.status}`);
    const body = (await response.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
    }>;
    return body.map((entry) => ({
      label: entry.display_name,
      point: { lat: Number(entry.lat), lng: Number(entry.lon) },
    }));
  },
};
