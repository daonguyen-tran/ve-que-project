import { z } from 'zod';
import { formatLocation, parseLocation, type GeoPoint } from '@ve-que/domain';
import { t } from '@/shared/i18n';

/**
 * Champ « Position » des formulaires : du texte (coordonnées ou lien collé), validé par
 * `parseLocation` du domaine. Vide = pas de position.
 */
export const locationFieldSchema = z.string().superRefine((value, ctx) => {
  const result = parseLocation(value);
  if (result.ok || result.reason === 'empty') return;
  ctx.addIssue({
    code: 'custom',
    message: result.reason === 'short_link' ? t.map.location.shortLink : t.map.location.invalid,
  });
});

export function locationToField(point: GeoPoint | null | undefined): string {
  return point ? formatLocation(point) : '';
}

export function locationFromField(text: string): GeoPoint | null {
  const result = parseLocation(text);
  return result.ok ? result.value : null;
}
