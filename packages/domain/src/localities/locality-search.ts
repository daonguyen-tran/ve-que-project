import { searchKey } from '../shared/search-key';
import type { LocalitySuggestion } from './locality';

/** Ce qu'on compare lors d'une recherche : le nom, le nom vietnamien et d'éventuels alias. */
export interface SearchableLocality {
  name: string;
  vietnameseName: string;
  aliases?: readonly string[];
}

/*
 * Pertinence d'un nom pour une requête, du meilleur (0) au moins bon (3) ; `null` si aucun
 * rapport. On compare des clés sans accents (`searchKey`) : « hoi » trouve « Hội An ».
 *   0 : nom identique          (« hue » → « Hué »)
 *   1 : le nom commence par    (« da » → « Da Nang », « Dalat »)
 *   2 : un mot du nom commence par (« minh » → « Hô Chi Minh-Ville »)
 *   3 : le nom contient        (« ang » → « Da Nang »)
 */
function rankName(name: string, query: string): number | null {
  const key = searchKey(name);
  if (!key) return null;
  if (key === query) return 0;
  if (key.startsWith(query)) return 1;
  if (key.split(' ').some((word) => word.startsWith(query))) return 2;
  if (key.includes(query)) return 3;
  return null;
}

/** Meilleur rang parmi tous les noms d'une localité. */
function rankLocality(locality: SearchableLocality, query: string): number | null {
  const ranks = [locality.name, locality.vietnameseName, ...(locality.aliases ?? [])]
    .map((name) => rankName(name, query))
    .filter((rank): rank is number => rank !== null);
  return ranks.length > 0 ? Math.min(...ranks) : null;
}

/**
 * Localités correspondant à une requête, triées par pertinence puis par nom.
 * Requête vide : aucune suggestion (on n'affiche pas toute la liste d'un coup).
 */
export function matchLocalities<T extends SearchableLocality>(
  query: string,
  localities: readonly T[],
  limit = 6,
): T[] {
  const key = searchKey(query);
  if (!key) return [];
  return localities
    .map((locality) => ({ locality, rank: rankLocality(locality, key) }))
    .filter((entry): entry is { locality: T; rank: number } => entry.rank !== null)
    .sort((a, b) => a.rank - b.rank || a.locality.name.localeCompare(b.locality.name, 'fr'))
    .slice(0, limit)
    .map((entry) => entry.locality);
}

/**
 * Retire d'une liste les suggestions déjà présentes plus haut (même nom, à accents près),
 * pour ne pas proposer deux fois « Hội An » : une fois depuis la liste intégrée, une fois
 * depuis le service en ligne. Les premières listes passées sont prioritaires.
 */
export function mergeSuggestions(...groups: LocalitySuggestion[][]): LocalitySuggestion[][] {
  const seen = new Set<string>();
  return groups.map((group) =>
    group.filter((suggestion) => {
      const keys = [suggestion.name, suggestion.vietnameseName].map(searchKey).filter(Boolean);
      if (keys.some((key) => seen.has(key))) return false;
      keys.forEach((key) => seen.add(key));
      return true;
    }),
  );
}
