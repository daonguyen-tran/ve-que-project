import { CircleAlert, Plus, X } from 'lucide-react';
import { useId } from 'react';
import {
  Controller,
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form';
import { t } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';
import { TimeField } from '@/shared/ui/time';
import { WEEK_ORDER } from '../idea-style';
import { DEFAULT_RANGE, type IdeaFormValues } from '../idea-form';

/**
 * Horaires d'ouverture : une ou plusieurs plages (jours + heures). Plusieurs plages couvrent
 * les cas courants au Vietnam : fermeture le midi (deux plages le même jour), horaires du
 * week-end différents, marché de nuit qui passe minuit.
 */
export function OpeningHoursField({
  control,
  register,
  errors,
  onEmpty,
}: {
  control: Control<IdeaFormValues>;
  register: UseFormRegister<IdeaFormValues>;
  errors: FieldErrors<IdeaFormValues>['ranges'];
  /** Appelé quand on retire la dernière plage : les horaires redeviennent « inconnus ». */
  onEmpty: () => void;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: 'ranges' });

  return (
    <div className="flex flex-col gap-3">
      {fields.map((field, index) => (
        <fieldset
          key={field.id}
          className="border-line m-0 flex min-w-0 flex-col gap-3 rounded-xl border p-3"
        >
          <legend className="sr-only">{t.ideas.rangeDays(index + 1)}</legend>
          <WeekdayPicker
            name={`ranges.${index}.days`}
            register={register}
            label={t.ideas.rangeDays(index + 1)}
            error={errors?.[index]?.days?.message}
          />
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-3">
            <Controller
              control={control}
              name={`ranges.${index}.open`}
              render={({ field: timeField }) => (
                <TimeField
                  label={t.ideas.openLabel}
                  error={errors?.[index]?.open?.message}
                  value={timeField.value}
                  onChange={timeField.onChange}
                  panelClassName="col-span-full row-start-2"
                />
              )}
            />
            <Controller
              control={control}
              name={`ranges.${index}.close`}
              render={({ field: timeField }) => (
                <TimeField
                  label={t.ideas.closeLabel}
                  error={errors?.[index]?.close?.message}
                  value={timeField.value}
                  onChange={timeField.onChange}
                  panelClassName="col-span-full row-start-2"
                />
              )}
            />
            <Button
              variant="quiet"
              aria-label={t.ideas.removeRange(index + 1)}
              onClick={() => {
                remove(index);
                if (fields.length === 1) onEmpty();
              }}
              className="min-h-12 w-11 px-0"
            >
              <X className="size-5" strokeWidth={1.9} aria-hidden="true" />
            </Button>
          </div>
        </fieldset>
      ))}
      <p className="text-muted m-0 text-[13px]">{t.ideas.overnightHint}</p>
      <Button variant="secondary" onClick={() => append(DEFAULT_RANGE)} className="self-start">
        <Plus className="size-[18px]" strokeWidth={2} aria-hidden="true" />
        {t.ideas.addRange}
      </Button>
    </div>
  );
}

/** Sept pastilles L M M J V S D ; chacune est une vraie case à cocher, lue en entier. */
function WeekdayPicker({
  name,
  register,
  label,
  error,
}: {
  name: `ranges.${number}.days`;
  register: UseFormRegister<IdeaFormValues>;
  label: string;
  error?: string;
}) {
  const id = useId();
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1.5">
      <div className="grid grid-cols-7 gap-1">
        {WEEK_ORDER.map((day) => (
          <span key={day} className="relative">
            <input
              id={`${id}-${day}`}
              type="checkbox"
              value={String(day)}
              className="peer sr-only"
              aria-invalid={error ? true : undefined}
              {...register(name)}
            />
            <label
              htmlFor={`${id}-${day}`}
              title={t.ideas.weekdays[day]}
              className="border-line text-muted peer-checked:border-laque peer-checked:bg-laque-tint peer-checked:text-laque-deep peer-focus-visible:outline-laque flex h-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold transition-colors select-none peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1"
            >
              <span aria-hidden="true">{t.ideas.weekdaysShort[day]}</span>
              <span className="sr-only">{t.ideas.weekdays[day]}</span>
            </label>
          </span>
        ))}
      </div>
      {error && (
        <p className="text-laque-deep m-0 flex items-center gap-1.5 text-[13px] font-medium">
          <CircleAlert className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
