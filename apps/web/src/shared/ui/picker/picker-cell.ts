import { cn } from '@/shared/lib/cn';

/**
 * Apparence d'une pastille de sélection (un jour du calendrier, une heure, des minutes).
 * Partagée par tous les sélecteurs pour qu'ils se ressemblent exactement : rond de 40 px dans
 * une case de 44 px de haut (cible tactile), rouge laque plein quand c'est choisi.
 */
export function pickerCellClass({
  selected,
  pickable,
  extra,
}: {
  selected: boolean;
  pickable: boolean;
  /** Classes propres à l'écran (ex. teinte d'une nuit déjà prise), ignorées si choisi. */
  extra?: string;
}): string {
  return cn(
    'tabular relative flex size-10 items-center justify-center rounded-full text-[15px] transition-colors duration-150',
    'focus-visible:outline-laque focus-visible:outline-2 focus-visible:outline-offset-1',
    selected && 'bg-laque text-on-laque font-semibold',
    !selected && pickable && 'text-ink hover:bg-ground',
    !selected && !pickable && 'text-muted/60 cursor-not-allowed',
    !selected && extra,
    !selected && extra && 'rounded-lg',
  );
}

/** Cadre du panneau déplié sous un champ (calendrier, heures). */
export const PICKER_PANEL_CLASS = 'border-line bg-surface rounded-xl border p-2';
