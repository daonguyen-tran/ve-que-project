import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useFieldArray, useForm, type UseFormRegister } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toLocalDate } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/form/fields';
import { PageHeader } from '@/shared/ui/PageHeader';
import { TripInfoFields } from '../components/TripInfoFields';
import { useTripService } from '../hooks/use-trips';
import {
  newTripFormSchema,
  type NewTripFormValues,
  type TripInfoFormValues,
} from '../trip-form-schemas';

/**
 * Création d'un voyage (F-1.1, F-1.3) : informations, puis « Qui part ? ».
 *
 * C'est le modèle de référence des formulaires de l'appli :
 * 1. un schéma Zod de formulaire (`trip-form-schemas.ts`) branché par `zodResolver` ;
 * 2. des champs du design system reliés par `register` ;
 * 3. à la validation, un appel au **service** (jamais directement à la base) ;
 * 4. en cas d'échec, un message clair, sans perdre la saisie.
 */
export function NewTripPage() {
  const navigate = useNavigate();
  const tripService = useTripService();
  const [saveError, setSaveError] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewTripFormValues>({
    resolver: zodResolver(newTripFormSchema),
    defaultValues: {
      name: '',
      startDate: '',
      endDate: '',
      referenceCurrency: 'EUR',
      ownerName: '',
      companions: [],
    },
  });
  const companions = useFieldArray({ control, name: 'companions' });

  const onSubmit = handleSubmit(async (values) => {
    setSaveError(false);
    try {
      await tripService.createTrip({
        name: values.name,
        startDate: toLocalDate(values.startDate),
        endDate: toLocalDate(values.endDate),
        referenceCurrency: values.referenceCurrency,
        ownerName: values.ownerName,
        companionNames: values.companions.map((companion) => companion.name),
      });
      await navigate('/planning');
    } catch {
      setSaveError(true);
    }
  });

  return (
    <>
      <PageHeader title={t.trips.newTrip} backTo="/voyages" />
      <form
        noValidate
        onSubmit={(event) => void onSubmit(event)}
        className="mx-auto flex max-w-xl flex-col gap-8 px-5 pt-4 pb-8"
      >
        <TripInfoFields
          // Les champs communs sont un sous-ensemble de ce formulaire : le typage plus large
          // de `register` ne peut pas être prouvé par TypeScript, d'où cette conversion.
          register={register as unknown as UseFormRegister<TripInfoFormValues>}
          errors={errors}
        />

        <fieldset className="m-0 flex flex-col gap-4 border-0 p-0">
          <legend className="mb-4 p-0 text-lg font-semibold tracking-[-0.01em]">
            {t.trips.whoTitle}
          </legend>
          <TextField
            label={t.trips.ownerLabel}
            autoComplete="given-name"
            error={errors.ownerName?.message}
            {...register('ownerName')}
          />
          {companions.fields.map((field, index) => (
            <div key={field.id} className="flex items-end gap-2">
              <div className="flex-1">
                <TextField
                  label={t.trips.companionLabel(index + 2)}
                  placeholder={t.trips.companionPlaceholder}
                  autoComplete="off"
                  error={errors.companions?.[index]?.name?.message}
                  {...register(`companions.${index}.name`)}
                />
              </div>
              <button
                type="button"
                onClick={() => companions.remove(index)}
                aria-label={t.trips.removeCompanion(field.name)}
                className="text-muted hover:bg-surface hover:text-ink mb-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl"
              >
                <X className="size-5" strokeWidth={1.9} aria-hidden="true" />
              </button>
            </div>
          ))}
          <Button
            variant="secondary"
            onClick={() => companions.append({ name: '' })}
            className="self-start"
          >
            <Plus className="size-5" strokeWidth={2} aria-hidden="true" />
            {t.trips.addCompanion}
          </Button>
        </fieldset>

        {saveError && (
          <p role="alert" className="text-laque-deep m-0 text-[15px] font-medium">
            {t.validation.saveFailed}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting} className="w-full lg:w-auto lg:self-end">
          {t.trips.create}
        </Button>
      </form>
    </>
  );
}
