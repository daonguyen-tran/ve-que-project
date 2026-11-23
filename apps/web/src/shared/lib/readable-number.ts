/**
 * `Intl` (fr-FR) sépare les milliers par une espace fine insécable (U+202F). À l'écran, elle
 * disparaît presque : « 2 400 000 » se lit « 2400000 », exactement l'erreur de zéros que l'appli
 * doit éviter. On la remplace par une espace insécable normale (U+00A0), deux fois plus large.
 */
export function withReadableGroups(formatted: string): string {
  return formatted.replace(/\u202f/g, '\u00a0');
}
