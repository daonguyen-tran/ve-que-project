import { cn } from '@/shared/lib/cn';

/**
 * Rangée de pastilles à choix unique, pour filtrer une liste (villes, statut…). Les pastilles
 * défilent horizontalement si elles ne tiennent pas, sans barre de défilement visible.
 * Chaque pastille est un bouton `aria-pressed` : un lecteur d'écran annonce « Hội An, 4,
 * bouton bascule, activé ».
 */
export function ChoiceChips<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: ReadonlyArray<{ value: T; label: string; count?: number }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        '-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-150',
              active
                ? 'border-ink bg-ink text-surface'
                : 'border-line bg-surface text-ink-soft hover:border-muted',
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={cn('tabular text-xs', active ? 'text-surface/75' : 'text-muted')}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
