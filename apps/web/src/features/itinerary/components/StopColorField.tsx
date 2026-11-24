import { Check } from 'lucide-react';
import { useId } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { cn } from '@/shared/lib/cn';
import { STOP_COLOR_OPTIONS } from '../stop-style';

/**
 * Choix de la couleur d'une étape : une rangée de pastilles rondes.
 *
 * Chaque pastille est un vrai bouton radio (masqué visuellement) avec son étiquette : clavier
 * (flèches dans le groupe), lecteurs d'écran (« Jade ») et formulaire (`register`) marchent
 * sans code en plus. La pastille choisie porte une coche blanche et un anneau, pour que la
 * sélection ne dépende pas de la couleur seule.
 */
export function StopColorField({
  label,
  hint,
  registration,
}: {
  label: string;
  hint?: string;
  registration: UseFormRegisterReturn<'color'>;
}) {
  const id = useId();
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
      <legend className="text-ink-soft mb-2 p-0 text-sm font-medium">{label}</legend>
      <div className="grid grid-cols-4 gap-y-1 sm:grid-cols-8">
        {STOP_COLOR_OPTIONS.map((option) => (
          <span key={option.value} className="relative flex justify-center">
            <input
              id={`${id}-${option.value}`}
              type="radio"
              value={option.value}
              className="peer sr-only"
              aria-describedby={hint ? `${id}-hint` : undefined}
              {...registration}
            />
            <label
              htmlFor={`${id}-${option.value}`}
              title={option.label}
              className={cn(
                'relative flex size-11 cursor-pointer items-center justify-center rounded-full transition-shadow duration-150',
                // Anneau encre autour de la pastille choisie, séparé d'elle par un liseré.
                'peer-checked:ring-ink peer-checked:ring-2',
                'peer-focus-visible:outline-laque peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4',
                '[&>svg]:hidden peer-checked:[&>svg]:block',
              )}
            >
              <span
                className={cn('absolute size-9 rounded-full', option.fill)}
                aria-hidden="true"
              />
              <Check className="relative size-5 text-white" strokeWidth={3} aria-hidden="true" />
              <span className="sr-only">{option.label}</span>
            </label>
          </span>
        ))}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-muted m-0 text-[13px]">
          {hint}
        </p>
      )}
    </fieldset>
  );
}
