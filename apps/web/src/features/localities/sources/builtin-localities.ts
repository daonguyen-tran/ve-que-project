import {
  matchLocalities,
  VIETNAM_LOCALITIES,
  type BuiltinLocality,
  type LocalitySuggestion,
} from '@ve-que/domain';
import { t } from '@/shared/i18n';

/*
 * Source n° 1 : la liste intégrée (grandes villes, lieux touristiques).
 * Synchrone et hors ligne : les données sont embarquées dans l'appli.
 */

function toSuggestion(locality: BuiltinLocality): LocalitySuggestion {
  return {
    key: `builtin:${locality.id}`,
    source: 'builtin',
    name: locality.name,
    vietnameseName: locality.vietnameseName,
    kind: locality.kind,
    location: locality.location,
    detail: t.localities.regions[locality.region],
  };
}

/** Suggestions de la liste intégrée pour une requête. */
export function suggestBuiltinLocalities(query: string, limit = 5): LocalitySuggestion[] {
  return matchLocalities(query, VIETNAM_LOCALITIES, limit).map(toSuggestion);
}
