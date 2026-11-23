import type { LucideIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useId } from 'react';
import { cn } from '@/shared/lib/cn';

/**
 * Choix exclusif entre quelques options visibles d'un coup (2 à 4), par exemple
 * Ville / Village / Île. Plus rapide qu'une liste déroulante sur téléphone : un seul geste.
 *
 * Ce sont de vrais boutons radio (accessibles au clavier avec les flèches, annoncés comme
 * « 1 sur 3 ») ; seul leur aspect est personnalisé. S'utilise avec `register` de React Hook
 * Form comme un champ classique : les props reçues sont posées sur chaque `<input>`.
 */
export function SegmentedField({
  label,
  options,
  columns,
  ...inputProps
}: {
  label: string;
  options: ReadonlyArray<{ value: string; label: string; icon?: LucideIcon }>;
  /** Nombre de colonnes quand les options sont nombreuses (sinon : toutes sur une ligne). */
  columns?: number;
} & Omit<ComponentProps<'input'>, 'type' | 'value'>) {
  const groupId = useId();
  return (
    <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
      <legend className="text-ink-soft mb-1.5 p-0 text-sm font-medium">{label}</legend>
      <div
        className={cn(
          'bg-ground border-line grid gap-1 rounded-xl border p-1',
          !columns && 'auto-cols-fr grid-flow-col',
        )}
        style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
      >
        {options.map(({ value, label: optionLabel, icon: Icon }) => {
          const id = `${groupId}-${value}`;
          return (
            <div key={value} className="relative">
              <input id={id} type="radio" value={value} className="peer sr-only" {...inputProps} />
              <label
                htmlFor={id}
                className={cn(
                  'text-muted flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[10px] px-2 text-[15px] font-medium transition-colors duration-150 select-none',
                  // En grille, l'icône passe au-dessus du libellé pour tenir dans une case étroite.
                  Boolean(columns) &&
                    'min-h-16 flex-col gap-1 text-center text-[13px] leading-tight',
                  'peer-checked:bg-surface peer-checked:text-ink peer-checked:shadow-[0_1px_2px_rgb(28_25_23/0.1)]',
                  'peer-focus-visible:outline-laque peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1',
                )}
              >
                {Icon && <Icon className="size-[18px]" strokeWidth={1.9} aria-hidden="true" />}
                {optionLabel}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
