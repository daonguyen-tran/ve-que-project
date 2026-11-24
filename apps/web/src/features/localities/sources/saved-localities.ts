import { matchLocalities, type Locality, type LocalitySuggestion } from '@ve-que/domain';

/*
 * Source n° 2 : « mes lieux », enregistrés par l'utilisateur dans la base locale.
 * Synchrone et hors ligne : la liste est déjà lue (par `useSavedLocalities`) quand on cherche.
 */

function toSuggestion(locality: Locality): LocalitySuggestion {
  return {
    key: `saved:${locality.id}`,
    source: 'saved',
    name: locality.name,
    vietnameseName: locality.vietnameseName,
    kind: locality.kind,
    location: locality.location,
  };
}

/** Suggestions parmi « mes lieux » pour une requête. */
export function suggestSavedLocalities(
  query: string,
  saved: readonly Locality[],
  limit = 4,
): LocalitySuggestion[] {
  return matchLocalities(query, saved, limit).map(toSuggestion);
}
