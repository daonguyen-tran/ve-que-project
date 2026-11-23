import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toLocalDate, type Trip } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';
import { Sheet } from '@/shared/ui/Sheet';
import { useTripService } from '../hooks/use-trips';
import { tripInfoFormSchema, type TripInfoFormValues } from '../trip-form-schemas';
import { TripInfoFields } from './TripInfoFields';

function valuesOf(trip: Trip): TripInfoFormValues {
  return {
    name: trip.name,
    startDate: trip.startDate,
    endDate: trip.endDate,
    referenceCurrency: trip.referenceCurrency,
  };
}

/** Modification des informations d'un voyage, dans un panneau. */
export function EditTripSheet({
  trip,
  open,
  onClose,
}: {
  trip: Trip;
  open: boolean;
  onClose: () => void;
}) {
  const tripService = useTripService();
  const formId = useId();
  const [saveError, setSaveError] = useState(false);
  // Fermer efface aussi un éventuel message d'erreur : il ne doit pas réapparaître à la réouverture.
  const close = () => {
    setSaveError(false);
    onClose();
  };
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TripInfoFormValues>({
    resolver: zodResolver(tripInfoFormSchema),
    defaultValues: valuesOf(trip),
  });

  // À chaque ouverture, on repart des valeurs enregistrées (et non d'une saisie abandonnée).
  useEffect(() => {
    if (open) {
      reset(valuesOf(trip));
    }
  }, [open, trip, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setSaveError(false);
    try {
      await tripService.updateTrip(trip, {
        name: values.name,
        startDate: toLocalDate(values.startDate),
        endDate: toLocalDate(values.endDate),
        referenceCurrency: values.referenceCurrency,
      });
      close();
    } catch {
      setSaveError(true);
    }
  });

  return (
    <Sheet
      open={open}
      onClose={close}
      title={t.trips.editTitle}
      footer={
        <>
          <Button variant="quiet" onClick={close}>
            {t.common.cancel}
          </Button>
          {/* Le bouton est hors du <form> (dans le pied du panneau) : l'attribut `form` l'y relie. */}
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {t.common.save}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        onSubmit={(event) => void onSubmit(event)}
        className="flex flex-col gap-4"
      >
        <TripInfoFields register={register} control={control} errors={errors} />
        {saveError && (
          <p role="alert" className="text-laque-deep m-0 text-[15px] font-medium">
            {t.validation.saveFailed}
          </p>
        )}
      </form>
    </Sheet>
  );
}
