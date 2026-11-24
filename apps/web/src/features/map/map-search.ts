import { cityKey } from '@ve-que/domain';
import type { MapPlace } from './map-model';

/*
 * Recherche dans les lieux du voyage, toutes zones confondues (barre de recherche de la carte).
 */

/** Un lieu et la zone de la carte où il apparaît (`voyage` ou la clé d'une ville). */
export interface SearchEntry {
  zone: string;
  zoneName: string;
  place: MapPlace;
}

/**
 * Comparaison sans accents ni casse : « hoi an » trouve « Hội An », « pho » trouve « Phở ».
 * On réutilise la normalisation des villes du domaine (elle gère aussi le `đ`).
 */
const normalize = cityKey;

/**
 * Lieux qui correspondent à la recherche, du plus pertinent au moins pertinent :
 * 1. titre qui commence par le texte ;
 * 2. un mot du titre qui commence par le texte ;
 * 3. texte présent ailleurs dans le titre ;
 * 4. texte trouvé dans la zone, le sous-titre ou les mots-clés (adresse, catégorie…).
 * À pertinence égale, l'ordre d'origine (ordre du voyage) est conservé.
 */
export function searchPlaces(
  entries: readonly SearchEntry[],
  query: string,
  limit = 8,
): SearchEntry[] {
  const needle = normalize(query);
  if (needle.length === 0) return [];
  const ranked: Array<{ entry: SearchEntry; rank: number; index: number }> = [];
  entries.forEach((entry, index) => {
    const title = normalize(entry.place.title);
    const rest = normalize(`${entry.zoneName} ${entry.place.subtitle} ${entry.place.keywords}`);
    const rank = title.startsWith(needle)
      ? 0
      : title.split(/[\s'’-]+/).some((word) => word.startsWith(needle))
        ? 1
        : title.includes(needle)
          ? 2
          : rest.includes(needle)
            ? 3
            : -1;
    if (rank >= 0) ranked.push({ entry, rank, index });
  });
  return ranked
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .slice(0, limit)
    .map(({ entry }) => entry);
}
