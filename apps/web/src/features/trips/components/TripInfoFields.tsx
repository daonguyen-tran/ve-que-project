import { useId } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { t } from '@/shared/i18n';
import { DateField, FieldGroupError, SelectField, TextField } from '@/shared/ui/form/fields';
import { CURRENCY_OPTIONS, type TripInfoFormValues } from '../trip-form-schemas';

/**
 * Champs communs à la création et à la modification d'un voyage. Les deux formulaires
 * partagent ce composant pour rester identiques (même ordre, mêmes libellés, mêmes règles).
 */
export function TripInfoFields({
  register,
  errors,
}: {
  // `register` est typé sur les seuls champs communs : les deux formulaires les contiennent.
  register: UseFormRegister<TripInfoFormValues>;
  errors: FieldErrors<TripInfoFormValues>;
}) {
  const datesErrorId = useId();
  return (
    <div className="flex flex-col gap-5">
      <TextField
        label={t.trips.nameLabel}
        placeholder={t.trips.namePlaceholder}
        autoComplete="off"
        error={errors.name?.message}
        {...register('name')}
      />
      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-2 gap-3">
          <DateField
            label={t.trips.startLabel}
            error={errors.startDate?.message}
            externalErrorId={datesErrorId}
            {...register('startDate')}
          />
          <DateField
            label={t.trips.endLabel}
            error={errors.endDate?.message}
            externalErrorId={datesErrorId}
            {...register('endDate')}
          />
        </div>
        {errors.startDate || errors.endDate ? (
          <FieldGroupError
            id={datesErrorId}
            messages={[errors.startDate?.message, errors.endDate?.message]}
          />
        ) : (
          <p className="text-muted m-0 text-[13px]">{t.trips.datesHint}</p>
        )}
      </div>
      <SelectField
        label={t.trips.currencyLabel}
        hint={t.trips.currencyHint}
        options={CURRENCY_OPTIONS}
        error={errors.referenceCurrency?.message}
        {...register('referenceCurrency')}
      />
    </div>
  );
}
