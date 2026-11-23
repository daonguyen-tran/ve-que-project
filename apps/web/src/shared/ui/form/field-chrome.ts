import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

/*
 * Briques communes à tous les champs : options d'habillage, style du contrôle et liens ARIA.
 * Séparées des composants pour que les champs maison (calendrier…) les réutilisent.
 */

export interface FieldChrome {
  label: string;
  hint?: string;
  error?: string;
  /**
   * Identifiant d'un message d'erreur affiché **ailleurs** (ex. sous deux dates côte à côte,
   * sur toute la largeur). Le champ garde son style d'erreur et reste relié au message, mais ne
   * l'affiche pas lui-même.
   */
  externalErrorId?: string;
  /** Contenu affiché à droite du libellé (ex. « facultatif »). */
  labelAside?: ReactNode;
}

const CONTROL =
  'bg-surface text-ink placeholder:text-muted min-h-12 w-full rounded-xl border px-3.5 text-base transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-0';

export function controlClass(hasError: boolean, extra?: string) {
  return cn(
    CONTROL,
    hasError
      ? 'border-laque-deep focus-visible:outline-laque-deep'
      : 'border-line hover:border-muted focus-visible:outline-laque',
    extra,
  );
}

export function describedBy(
  id: string,
  { hint, error, externalErrorId }: Pick<FieldChrome, 'hint' | 'error' | 'externalErrorId'>,
) {
  if (error && externalErrorId) return externalErrorId;
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}
