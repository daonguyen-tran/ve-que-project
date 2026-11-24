import type { GeocodingResult } from '@/infrastructure/geocoding/geocoder';

/*
 * Niveau de zoom de la carte sur un résultat de recherche (échelle Leaflet / OpenStreetMap :
 * 10 ≈ une grande île, 12 ≈ une ville, 14 ≈ un village, 17 ≈ une rue). Chaque cran double
 * l'échelle : passer de 17 à 12, c'est voir 32 fois plus large.
 */
const ZOOM = {
  island: 11, // Phu Quoc, Cát Bà… : l'île entière ou presque
  city: 12, // le centre-ville et ses quartiers
  village: 14, // le village et ses abords
  address: 17, // la rue, pour repérer un numéro
} as const;

/** Zoom adapté au résultat : une ville se montre en entier, une adresse de près. */
export function searchZoom(result: Pick<GeocodingResult, 'kind'>): number {
  return ZOOM[result.kind ?? 'address'];
}
