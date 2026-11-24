import type { GeoPoint, Place } from '../shared/common-schemas';

/*
 * Positions GPS des lieux (M4). Le plus simple pour l'utilisateur est souvent de copier une
 * position depuis Google Maps : on accepte donc des coordonnées comme des liens.
 */

export type LocationParseResult =
  { ok: true; value: GeoPoint } | { ok: false; reason: 'empty' | 'short_link' | 'invalid' };

/** Nombre décimal signé, avec un point (« 15.8801 », « -0.5 »). */
const NUMBER = String.raw`-?\d{1,3}(?:\.\d+)?`;

/**
 * Formes reconnues, de la plus spécifique à la plus générale. Dans les liens Google Maps,
 * `!3d…!4d…` est la position du lieu choisi, alors que `@…,…` est le centre de l'écran : on
 * préfère donc la première quand les deux sont présentes.
 */
const PATTERNS: RegExp[] = [
  new RegExp(String.raw`!3d(${NUMBER})!4d(${NUMBER})`),
  new RegExp(String.raw`[?&](?:q|query|ll|center|destination)=(${NUMBER}),\s*(${NUMBER})`),
  new RegExp(String.raw`@(${NUMBER}),(${NUMBER})`),
  // Coordonnées seules : « 15.8801, 108.338 », « 15.8801 108.338 », « 15,8801 ; 108,338 » est
  // traité plus bas (virgule décimale française).
  new RegExp(String.raw`^\s*(${NUMBER})\s*[,;\s]\s*(${NUMBER})\s*$`),
];

/**
 * Lit une position saisie ou collée : coordonnées décimales, ou lien Google Maps / OpenStreetMap
 * qui en contient. Les liens courts (`maps.app.goo.gl`) ne contiennent pas la position — il
 * faudrait les ouvrir en ligne pour la connaître — et sont signalés comme tels.
 */
export function parseLocation(input: string): LocationParseResult {
  const text = decodeURIComponent(input.trim().replace(/%(?![0-9a-f]{2})/gi, '%25'));
  if (text === '') return { ok: false, reason: 'empty' };
  if (/goo\.gl\/|maps\.app\.goo\.gl/i.test(text)) return { ok: false, reason: 'short_link' };

  // Virgule décimale à la française (« 15,8801 ; 108,338 » ou « 15,8801 108,338 ») : on la
  // convertit seulement si le séparateur entre les deux nombres est sans ambiguïté.
  const french = /^\s*(-?\d{1,3}),(\d+)\s*[;\s]\s*(-?\d{1,3}),(\d+)\s*$/.exec(text);
  if (french)
    return checked(Number(`${french[1]}.${french[2]}`), Number(`${french[3]}.${french[4]}`));

  for (const pattern of PATTERNS) {
    const match = pattern.exec(text);
    if (match) return checked(Number(match[1]), Number(match[2]));
  }
  return { ok: false, reason: 'invalid' };
}

function checked(lat: number, lng: number): LocationParseResult {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return { ok: false, reason: 'invalid' };
  }
  return { ok: true, value: { lat, lng } };
}

/** « 15.88010, 108.33800 » : cinq décimales, soit environ un mètre. */
export function formatLocation(point: GeoPoint): string {
  return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
}

/**
 * Lien « Ouvrir dans Google Maps » (F-4.4), au format universel documenté par Google : il
 * ouvre l'appli Google Maps sur Android, le site sur PC. La position exacte prime ; à défaut,
 * on cherche l'adresse (en vietnamien d'abord, c'est celle que Google connaît le mieux), et en
 * dernier recours le nom du lieu.
 */
export function googleMapsUrl(
  place: Pick<Place, 'address' | 'vietnamese' | 'location'> | null,
  name?: string,
): string | null {
  const query = place?.location
    ? `${place.location.lat},${place.location.lng}`
    : place?.vietnamese.trim() || place?.address.trim() || name?.trim();
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
