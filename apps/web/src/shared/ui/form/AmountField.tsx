import { CircleAlert } from 'lucide-react';
import { useId, type ComponentProps } from 'react';
import { CURRENCIES, formatMoney, parseAmount, type CurrencyCode } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { withReadableGroups } from '@/shared/lib/readable-number';

/**
 * Champ de montant « à la vietnamienne » (F-5.2) : on tape `50k`, `1,2M` ou `350 000`, et
 * l'appli affiche aussitôt le montant complet, formaté, pour qu'aucun zéro ne se perde.
 *
 * Deux champs de formulaire en un : le texte saisi et la devise (₫ ou €), chacun relié par
 * son propre `register`. `text` et `currency` (lus avec `watch`) servent à l'aperçu en direct.
 * Le clavier proposé sur mobile est celui du texte (pas « numérique ») : il faut pouvoir taper
 * la lettre `k` ou `M`.
 */
export function AmountField({
  label,
  labelAside,
  hint,
  error,
  text,
  currency,
  textInput,
  currencyInput,
}: {
  label: string;
  labelAside?: string;
  hint?: string;
  error?: string;
  text: string;
  currency: CurrencyCode;
  textInput: ComponentProps<'input'>;
  currencyInput: Omit<ComponentProps<'input'>, 'type' | 'value'>;
}) {
  const id = useId();
  const parsed = text.trim() === '' ? null : parseAmount(text, currency);
  const preview = parsed?.ok ? withReadableGroups(formatMoney(parsed.value)) : null;
  const messageId = error
    ? `${id}-error`
    : preview
      ? `${id}-preview`
      : hint
        ? `${id}-hint`
        : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-ink-soft text-sm font-medium">
          {label}
        </label>
        {labelAside && <span className="text-muted text-[13px]">{labelAside}</span>}
      </div>
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          placeholder={currency === 'VND' ? t.money.placeholderVnd : t.money.placeholderEur}
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          className={cn(
            'bg-surface text-ink placeholder:text-muted tabular min-h-12 min-w-0 flex-1 rounded-xl border px-3.5 text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-0',
            error
              ? 'border-laque-deep focus-visible:outline-laque-deep'
              : 'border-line hover:border-muted focus-visible:outline-laque',
          )}
          {...textInput}
        />
        <fieldset className="bg-ground border-line m-0 flex gap-1 rounded-xl border p-1">
          <legend className="sr-only">{t.money.currency}</legend>
          {(['VND', 'EUR'] as const).map((code) => (
            <div key={code} className="relative">
              <input
                id={`${id}-${code}`}
                type="radio"
                value={code}
                className="peer sr-only"
                {...currencyInput}
              />
              <label
                htmlFor={`${id}-${code}`}
                aria-label={t.trips.currencies[code]}
                className="text-muted peer-checked:bg-surface peer-checked:text-laque peer-focus-visible:outline-laque flex h-10 w-11 cursor-pointer items-center justify-center rounded-[10px] text-lg font-semibold select-none peer-checked:shadow-[0_1px_2px_rgb(28_25_23/0.1)] peer-focus-visible:outline-2"
              >
                {CURRENCIES[code].symbol}
              </label>
            </div>
          ))}
        </fieldset>
      </div>
      {error ? (
        <p
          id={`${id}-error`}
          className="text-laque-deep m-0 flex items-center gap-1.5 text-[13px] font-medium"
        >
          <CircleAlert className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          {error}
        </p>
      ) : preview ? (
        <p
          id={`${id}-preview`}
          aria-live="polite"
          className="text-ink-soft tabular m-0 text-[13px] font-medium"
        >
          = {preview}
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
