/**
 * Résultat d'une opération qui peut échouer de façon *attendue* (saisie invalide, etc.).
 * On réserve les exceptions aux bugs ; une erreur de saisie est une valeur que l'UI affiche.
 */
export type Result<T, E extends string> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): { ok: true; value: T } => ({ ok: true, value });
export const err = <E extends string>(error: E): { ok: false; error: E } => ({ ok: false, error });
