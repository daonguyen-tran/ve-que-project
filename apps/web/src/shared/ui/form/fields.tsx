import { CircleAlert } from 'lucide-react';
import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

/*
 * Champs de formulaire du design system.
 *
 * Chaque champ relie son libellé, son aide et son erreur par des identifiants
 * (`htmlFor`, `aria-describedby`, `aria-invalid`) : un lecteur d'écran annonce « Date de
 * départ, champ de date, obligatoire, La date de fin doit suivre la date de départ ».
 *
 * Ils s'utilisent directement avec React Hook Form : `<TextField {...register('name')} />`.
 * En React 19, `ref` est une prop comme une autre : celle que fournit `register` arrive bien
 * jusqu'à l'élément `<input>`.
 */

interface FieldChrome {
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

function controlClass(hasError: boolean, extra?: string) {
  return cn(
    CONTROL,
    hasError
      ? 'border-laque-deep focus-visible:outline-laque-deep'
      : 'border-line hover:border-muted focus-visible:outline-laque',
    extra,
  );
}

function FieldFrame({
  id,
  label,
  hint,
  error,
  externalErrorId,
  labelAside,
  children,
}: FieldChrome & { id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-ink-soft text-sm font-medium">
          {label}
        </label>
        {labelAside && <span className="text-muted text-[13px]">{labelAside}</span>}
      </div>
      {children}
      {externalErrorId ? null : error ? (
        <p
          id={`${id}-error`}
          className="text-laque-deep m-0 flex items-center gap-1.5 text-[13px] font-medium"
        >
          <CircleAlert className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-muted m-0 text-[13px]">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

function describedBy(
  id: string,
  { hint, error, externalErrorId }: Pick<FieldChrome, 'hint' | 'error' | 'externalErrorId'>,
) {
  if (error && externalErrorId) return externalErrorId;
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export function TextField({
  label,
  hint,
  error,
  externalErrorId,
  labelAside,
  className,
  ...inputProps
}: FieldChrome & ComponentProps<'input'>) {
  const id = useId();
  return (
    <FieldFrame
      id={id}
      label={label}
      hint={hint}
      error={error}
      externalErrorId={externalErrorId}
      labelAside={labelAside}
    >
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, { hint, error, externalErrorId })}
        className={controlClass(Boolean(error), className)}
        {...inputProps}
      />
    </FieldFrame>
  );
}

/**
 * Message d'erreur partagé par plusieurs champs (ex. une paire de dates), affiché sur toute la
 * largeur sous le groupe. À relier aux champs avec `externalErrorId`.
 */
export function FieldGroupError({
  id,
  messages,
}: {
  id: string;
  messages: Array<string | undefined>;
}) {
  const unique = [...new Set(messages.filter(Boolean))];
  if (unique.length === 0) return null;
  return (
    <div id={id} className="flex flex-col gap-1">
      {unique.map((message) => (
        <p
          key={message}
          className="text-laque-deep m-0 flex items-start gap-1.5 text-[13px] font-medium"
        >
          <CircleAlert className="mt-px size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          {message}
        </p>
      ))}
    </div>
  );
}

/** Champ date natif : sur Android, il ouvre le calendrier du système, le plus ergonomique. */
export function DateField(props: FieldChrome & Omit<ComponentProps<'input'>, 'type'>) {
  return <TextField type="date" {...props} className={cn('tabular', props.className)} />;
}

export function SelectField({
  label,
  hint,
  error,
  labelAside,
  options,
  className,
  ...selectProps
}: FieldChrome &
  ComponentProps<'select'> & { options: ReadonlyArray<{ value: string; label: string }> }) {
  const id = useId();
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} labelAside={labelAside}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, { hint, error })}
        className={controlClass(Boolean(error), cn('appearance-auto', className))}
        {...selectProps}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldFrame>
  );
}
