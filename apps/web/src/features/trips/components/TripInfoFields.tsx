import {
  useController,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form';
import { daysBetween } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { DateRangeField } from '@/shared/ui/calendar';
import { SelectField, TextField } from '@/shared/ui/form/fields';
import { CURRENCY_OPTIONS, type TripInfoFormValues } from '../trip-form-schemas';

/** Règles du calendrier d'un voyage : n'importe quel jour pour partir, un retour pas avant. */
const TRIP_RANGE_RULES = {
  canStart: () => true,
  canEnd: (start: string, date: string) => date >= start,
};

/**
 * Champs communs à la création et à la modification d'un voyage. Les deux formulaires
 * partagent ce composant pour rester identiques (même ordre, mêmes libellés, mêmes règles).
 *
 * Les dates passent par le calendrier maison : c'est un composant contrôlé, relié au
 * formulaire par `useController` (d'où la prop `control` en plus de `register`).
 */
export function TripInfoFields({
  register,
  control,
  errors,
}: {
  // `register` et `control` sont typés sur les seuls champs communs : les deux formulaires
  // les contiennent.
  register: UseFormRegister<TripInfoFormValues>;
  control: Control<TripInfoFormValues>;
  errors: FieldErrors<TripInfoFormValues>;
}) {
  const startDate = useController({ control, name: 'startDate' });
  const endDate = useController({ control, name: 'endDate' });
  return (
    <div className="flex flex-col gap-5">
      <TextField
        label={t.trips.nameLabel}
        placeholder={t.trips.namePlaceholder}
        autoComplete="off"
        error={errors.name?.message}
        {...register('name')}
      />
      <DateRangeField
        label={t.trips.datesLabel}
        startLabel={t.trips.startLabel}
        endLabel={t.trips.endLabel}
        value={{ start: startDate.field.value, end: endDate.field.value }}
        onChange={({ start, end }) => {
          startDate.field.onChange(start ?? '');
          endDate.field.onChange(end ?? '');
        }}
        rules={TRIP_RANGE_RULES}
        summary={(start, end) => t.common.days(daysBetween(start, end) + 1)}
        hint={t.trips.datesHint}
        errors={[errors.startDate?.message, errors.endDate?.message]}
      />
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
