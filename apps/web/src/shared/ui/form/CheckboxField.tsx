import { Check } from 'lucide-react';
import { useId, type ComponentProps } from 'react';

/**
 * Case à cocher avec libellé, sur toute la largeur (zone tactile ≥ 44 px). S'utilise avec
 * `register` comme les autres champs.
 */
export function CheckboxField({
  label,
  hint,
  ...inputProps
}: { label: string; hint?: string } & Omit<ComponentProps<'input'>, 'type'>) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3 select-none">
        <span className="relative flex size-6 shrink-0">
          <input
            id={id}
            type="checkbox"
            aria-describedby={hint ? `${id}-hint` : undefined}
            className="peer border-line checked:border-laque checked:bg-laque focus-visible:outline-laque bg-surface size-6 cursor-pointer appearance-none rounded-md border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            {...inputProps}
          />
          <Check
            className="text-on-laque pointer-events-none absolute inset-0 m-auto size-4 opacity-0 peer-checked:opacity-100"
            strokeWidth={3}
            aria-hidden="true"
          />
        </span>
        <span className="text-[15px] font-medium">{label}</span>
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-muted m-0 pl-9 text-[13px]">
          {hint}
        </p>
      )}
    </div>
  );
}
